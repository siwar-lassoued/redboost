package team.project.redboost.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MatchingIaService {

    private final MatchingRepository matchingRepo;
    private final MatchingSessionRepository sessionRepo;
    private final UserRepository userRepo;
    private final ProgrammeRepository programmeRepo;
    private final ThematiqueRepository thematiqueRepo;
    private final CandidatureRedstarterRepository candidatureRepo;
    private final CoachRatingRepository coachRatingRepo;
    private final FormTemplateRepository formTemplateRepo;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.base-url}")
    private String aiServiceUrl;

    @Value("${gemini.api.key:unconfigured}")
    private String geminiApiKey;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    // ─── Run Matching IA ──────────────────────────────────────────

    @Transactional
    public MatchingSession runMatchingIA(Long programmeId, Long thematiqueId) {

        // ── 1. Validation obligatoire de la thématique ──────────────
        if (thematiqueId == null) {
            throw new RuntimeException("Une thématique de coaching est obligatoire pour lancer le matching. Veuillez sélectionner une thématique active.");
        }

        Programme programme = programmeRepo.findById(programmeId)
                .orElseThrow(() -> new RuntimeException("Programme introuvable : " + programmeId));

        ThematiqueCoaching thematique = thematiqueRepo.findById(thematiqueId)
                .orElseThrow(() -> new RuntimeException("Thématique introuvable : " + thematiqueId));

        if (thematique.getStatut() != ThematiqueCoaching.StatutThematique.ACTIVE) {
            throw new RuntimeException("La thématique '" + thematique.getNom() + "' n'est pas active. Seules les thématiques ACTIVE peuvent être utilisées pour le matching.");
        }

        log.info("=== DÉMARRAGE MATCHING IA === Programme: {} | Thématique: {}", programme.getNom(), thematique.getNom());

        // ── 2. Récupérer les coachs actifs ───────────────────────────
        List<User> coaches = userRepo.findAll().stream()
                .filter(u -> u.getRole() == Role.COACH && u.isActive())
                .filter(u -> u.getProgrammes().stream().anyMatch(p -> p.getId().equals(programmeId)))
                .collect(Collectors.toList());

        log.info("Coaches actifs pour le programme trouvé: {}", coaches.size());
        coaches.forEach(c -> log.info("  Coach: {} {} (id={})", c.getFirstName(), c.getLastName(), c.getId()));

        if (coaches.isEmpty()) {
            throw new RuntimeException("Aucun coach actif trouvé pour ce programme. Vérifiez que des coachs sont affectés à ce programme.");
        }


        Set<Long> coachCandidatureIds = candidatureRepo
                .findAcceptedCoaches(CandidatureRedstarter.StatutCandidature.ACCEPTE)
                .stream().map(CandidatureRedstarter::getId).collect(Collectors.toSet());

        log.info("Candidatures coach à exclure: {}", coachCandidatureIds.size());

        // ── 3. Récupérer les entrepreneurs à matcher ────────────────
        List<User> entrepreneursDuProgramme = userRepo.findAll().stream()
                .filter(u -> u.getRole() == Role.ENTREPRENEUR)
                .filter(u -> u.getProgrammes().stream().anyMatch(p -> p.getId().equals(programmeId)))
                .collect(Collectors.toList());

        log.info("Entrepreneurs trouvés dans le programme '{}': {}", programme.getNom(), entrepreneursDuProgramme.size());

        // On veut matcher ceux qui n'ont pas encore de matching VALIDE pour cette thématique
        List<User> entrepreneursAMatcher = entrepreneursDuProgramme.stream()
                .filter(u -> !matchingRepo.isEntrepreneurActivelyMatchedForThematique(u.getId(), thematiqueId))
                .collect(Collectors.toList());

        log.info("Entrepreneurs à matcher (sans matching actif pour cette thématique): {}", entrepreneursAMatcher.size());

        if (entrepreneursAMatcher.isEmpty()) {
            throw new RuntimeException("Aucun entrepreneur sans coaching actif pour cette thématique. Tous ont déjà un match VALIDE.");
        }

        List<Map<String, Object>> coachesData = coaches.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("nom", ((c.getFirstName() != null ? c.getFirstName() : "") + " " + (c.getLastName() != null ? c.getLastName() : "")).trim());
            m.put("expertise", c.getExpertise());
            m.put("skills", c.getSkills());
            m.put("secteur", c.getSecteur());
            m.put("region", c.getRegion());
            m.put("years_of_experience", c.getYearsOfExperience());
            m.put("bio", c.getBio());
            m.put("entreprise", c.getEntreprise());
            m.put("industry", c.getIndustry());
            m.put("formation_academique", c.getFormationAcademNom());
            m.put("formation_academique_realisations", c.getFormationAcademRealisations());
            m.put("competences_pro", c.getCompetencesProNom());
            m.put("competences_pro_certificat", c.getCompetencesProCertificat());
            m.put("nb_entrepreneurs_coaches_historique", c.getNbEntreCoaches());
            m.put("succes_client", c.getSuccesClient());
            m.put("engagement_communautaire", c.getEngagementCommunautaire());

            long activeCount = matchingRepo.findByCoachIdAndStatut(c.getId(), Matching.StatutMatching.VALIDE).size();
            double ratingMoyen = coachRatingRepo.findAverageRatingByCoachId(c.getId()).orElse(3.0);
            // Formule: (1 - nb_actifs/5) * 70 + (rating/5) * 30
            double scoreChargePrecalcule = Math.max(0, (1.0 - (double) activeCount / 5.0)) * 70.0 + (ratingMoyen / 5.0) * 30.0;

            m.put("nb_entrepreneurs_actifs", activeCount);
            m.put("note_moyenne_coaching_rating", Math.round(ratingMoyen * 10.0) / 10.0);
            return m;
        }).collect(Collectors.toList());

        // ── 5. Construire le profil enrichi de chaque entrepreneur ───
        List<Map<String, Object>> entrepreneursData = entrepreneursAMatcher.stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("nom", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
            m.put("email", u.getEmail());
            m.put("entreprise", u.getEntreprise() != null ? u.getEntreprise() : u.getStartupName());
            m.put("secteur", u.getSecteur() != null ? u.getSecteur() : u.getIndustry());
            m.put("region", u.getRegion());
            m.put("phase_maturite", u.getStadeProjet());
            m.put("description", u.getDescriptionProjet());
            m.put("besoins_accompagnement", u.getBesoinsCoaching());

            // Tenter d'enrichir avec la candidature si elle existe (par email)
            Optional<CandidatureRedstarter> candOpt = Optional.empty();
            if (u.getEmail() != null) {
                candOpt = candidatureRepo.findAll().stream()
                        .filter(c -> c.getEmail() != null && c.getEmail().equalsIgnoreCase(u.getEmail()))
                        .findFirst();
            }

            if (candOpt.isPresent()) {
                CandidatureRedstarter c = candOpt.get();
                if (m.get("entreprise") == null) m.put("entreprise", c.getNomEntreprise());
                if (m.get("secteur") == null) m.put("secteur", c.getEntrepriseEst());
                if (m.get("description") == null) m.put("description", c.getBreveDescription());
                m.put("besoins_formation", c.getBesoinsFormation());
                m.put("innovation", c.getComposanteInnovation());
                m.put("impact_environnemental", c.getImpactEnvironnemental());
                m.put("impact_social", c.getImpactSocial());
                m.put("experience_equipe", c.getExperienceEquipeFondatrice());
                
                // Réponses dynamiques
                if (c.getDynamicAnswers() != null && !c.getDynamicAnswers().isEmpty()) {
                    try {
                        Map<String, Object> dynRoot = objectMapper.readValue(c.getDynamicAnswers(), Map.class);
                        Object answers = dynRoot.get("answers");
                        m.put("reponses_formulaire", (answers instanceof Map) ? answers : dynRoot);
                    } catch (Exception ex) {
                        log.warn("Impossible de parser dynamicAnswers pour candidature {}: {}", c.getId(), ex.getMessage());
                    }
                }

                // Documents
                if (c.getDocuments() != null && !c.getDocuments().isEmpty()) {
                    List<String> extraits = new ArrayList<>();
                    for (String docName : c.getDocuments()) {
                        String extracted = extractTextFromDocument(docName);
                        if (extracted != null && !extracted.isEmpty()) {
                            String nomLower = docName.toLowerCase();
                            int maxChars = (nomLower.contains("cv") || nomLower.contains("resume")) ? 2000 : 1000;
                            if (extracted.length() > maxChars) extracted = extracted.substring(0, maxChars) + "...";
                            extraits.add("Document '" + docName + "':\n" + extracted);
                        }
                    }
                    if (!extraits.isEmpty()) m.put("documents_extrait", extraits);
                }
            }

            m.values().removeIf(Objects::isNull);
            return m;
        }).collect(Collectors.toList());
        // ── 6. Envoyer les données enrichies au service IA FastAPI ─────

        Map<String, Object> aiPayload = new LinkedHashMap<>();
        aiPayload.put("coaches", coachesData);
        aiPayload.put("entrepreneurs", entrepreneursData);

        Map<String, Object> progMap = new LinkedHashMap<>();
        progMap.put("nom", programme.getNom());
        progMap.put("description", programme.getDescription());
        progMap.put("dateDebut", programme.getDateDebut());
        progMap.put("dateFin", programme.getDateFin());
        aiPayload.put("programme", progMap);

        if (thematique != null) {
            Map<String, Object> thMap = new LinkedHashMap<>();
            thMap.put("nom", thematique.getNom());
            thMap.put("description", thematique.getDescription());
            thMap.put("dateDebut", thematique.getDateDebut());
            thMap.put("dateFin", thematique.getDateFin());
            aiPayload.put("thematique", thMap);
        }

        log.info("Envoi au service IA: {} coachs | {} entrepreneurs", coachesData.size(), entrepreneursData.size());

        // ── 7. Appel HTTP au service IA FastAPI ───────────────────────
        String aiResponse = callAiServiceMatching(aiPayload);

        // ── 8. Parser la réponse et sauvegarder les matchings ────────
        return parseAndSaveTop3(aiResponse, programme, thematique, programmeId, thematiqueId);
    }

    // ─── AI Service Call ──────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String callAiServiceMatching(Map<String, Object> payload) {
        String aiServiceUrl = System.getenv("AI_SERVICE_BASE_URL");
        if (aiServiceUrl == null || aiServiceUrl.isEmpty()) {
            aiServiceUrl = "http://localhost:8000";
        }
        String endpoint = aiServiceUrl + "/api/matching/run-enriched";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            log.info("Appel à FastAPI: {}", endpoint);
            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            throw new RuntimeException("Erreur HTTP " + response.getStatusCode());
        } catch (Exception e) {
            log.error("Erreur appel service IA FastAPI: {}", e.getMessage());
            throw new RuntimeException("Erreur communication avec ai-service : " + e.getMessage());
        }
    }


    // ─── Parse Top-3 Response & Save ─────────────────────────────

    @SuppressWarnings("unchecked")
    private MatchingSession parseAndSaveTop3(String aiResponse, Programme programme, ThematiqueCoaching thematique,
                                              Long programmeId, Long thematiqueId) {
        try {
            Map<String, Object> responseMap = objectMapper.readValue(aiResponse, Map.class);
            List<Map<String, Object>> matchingsData = (List<Map<String, Object>>) responseMap.get("matchings");
            List<Map<String, Object>> alertesData = (List<Map<String, Object>>) responseMap.get("alertes");

            int totalPropositions = matchingsData != null
                    ? matchingsData.stream().mapToInt(md -> {
                        List<?> props = (List<?>) md.get("propositions");
                        return props != null ? props.size() : 0;
                      }).sum()
                    : 0;

            log.info("Réponse IA: {} entrepreneurs matchés, {} propositions totales", 
                     matchingsData != null ? matchingsData.size() : 0, totalPropositions);

            MatchingSession session = MatchingSession.builder()
                    .programmeId(programmeId)
                    .thematiqueId(thematiqueId)
                    .statut(MatchingSession.StatutSession.EN_ATTENTE)
                    .nbMatchings(totalPropositions)
                    .dateMatching(LocalDateTime.now())
                    .alertesJson(alertesData != null ? objectMapper.writeValueAsString(alertesData) : "[]")
                    .build();
            session = sessionRepo.save(session);

            List<Matching> createdMatchings = new ArrayList<>();

            if (matchingsData != null) {
                for (Map<String, Object> md : matchingsData) {
                    Long entrepreneurId = toLong(md.get("entrepreneur_id"));
                    List<Map<String, Object>> propositions = (List<Map<String, Object>>) md.get("propositions");

                    if (propositions == null || propositions.isEmpty()) {
                        log.warn("Aucune proposition pour entrepreneur_id={}", entrepreneurId);
                        continue;
                    }

                    for (Map<String, Object> prop : propositions) {
                        Integer rank = prop.get("rank") instanceof Number ? ((Number) prop.get("rank")).intValue() : 1;
                        Map<String, Object> decisionSupport = (Map<String, Object>) prop.get("decision_support");

                        Matching matching = Matching.builder()
                                .matchingSession(session)
                                .coachId(toLong(prop.get("coach_id")))
                                .entrepreneurId(entrepreneurId)
                                .programmeId(programmeId)
                                .thematiqueId(thematiqueId)
                                .scoreIa(toDouble(prop.get("score_final")))
                                .scoresDetail(objectMapper.writeValueAsString(prop.get("scores_detail")))
                                .justification((String) prop.get("justification"))
                                .pointsForts(objectMapper.writeValueAsString(prop.get("points_forts")))
                                .pointsAttention(objectMapper.writeValueAsString(prop.get("points_attention")))
                                .recommandationSession1((String) prop.get("recommandation_session_1"))
                                .decisionSupport(decisionSupport != null ? objectMapper.writeValueAsString(decisionSupport) : null)
                                .rankTop(rank)
                                .statut(Matching.StatutMatching.PROPOSE)
                                .build();

                        createdMatchings.add(matchingRepo.save(matching));
                        log.info("  → Matching sauvé: entrepreneur={} coach={} rank={} score={}",
                                entrepreneurId, prop.get("coach_id"), rank, prop.get("score_final"));
                    }
                }
            }

            session.setMatchings(createdMatchings);
            return session;

        } catch (Exception e) {
            log.error("Erreur traitement réponse IA: {}", e.getMessage());
            log.error("Réponse brute reçue:\n{}", aiResponse.substring(0, Math.min(1000, aiResponse.length())));
            throw new RuntimeException("Erreur lors du traitement de la réponse IA : " + e.getMessage());
        }
    }

    // ─── Validate Session ─────────────────────────────────────────

    @Transactional
    public void validateSession(Long sessionId, Long adminId) {
        MatchingSession session = sessionRepo.findById(sessionId).orElseThrow();
        session.setStatut(MatchingSession.StatutSession.VALIDE);
        session.setDateValidation(LocalDateTime.now());
        session.setValideParId(adminId);
        sessionRepo.save(session);

        matchingRepo.archiveOtherPendingSessions(session.getProgrammeId(), sessionId);

        // Valide uniquement les rangs 1 (recommandés) — libère les rangs 2 et 3
        List<Matching> matchings = matchingRepo.findByMatchingSessionId(sessionId);
        for (Matching m : matchings) {
            if (m.getRankTop() != null && m.getRankTop() == 1) {
                m.setStatut(Matching.StatutMatching.VALIDE);
                m.setDateValidation(LocalDateTime.now());
                matchingRepo.save(m);
                // Libère les autres rangs pour cet entrepreneur + thématique
                if (m.getThematiqueId() != null) {
                    matchingRepo.liberateNonSelectedRanks(m.getEntrepreneurId(), m.getThematiqueId(), 1);
                }
                // ── Notifications ──
                sendMatchingNotifications(m);
            } else if (m.getStatut() == Matching.StatutMatching.PROPOSE) {
                m.setStatut(Matching.StatutMatching.LIBERE);
                matchingRepo.save(m);
            }
        }
    }

    @Transactional
    public void validateSingleMatching(Long matchingId, Long adminId) {
        Matching m = matchingRepo.findById(matchingId)
                .orElseThrow(() -> new RuntimeException("Matching introuvable : " + matchingId));

        m.setStatut(Matching.StatutMatching.VALIDE);
        m.setDateValidation(LocalDateTime.now());
        matchingRepo.save(m);

        // Libère automatiquement les autres rangs pour cet entrepreneur + thématique
        if (m.getThematiqueId() != null && m.getRankTop() != null) {
            matchingRepo.liberateNonSelectedRanks(m.getEntrepreneurId(), m.getThematiqueId(), m.getRankTop());
            log.info("Rangs non sélectionnés libérés pour entrepreneur={} thematique={}", m.getEntrepreneurId(), m.getThematiqueId());
        }

        MatchingSession session = m.getMatchingSession();
        if (session != null && session.getStatut() == MatchingSession.StatutSession.EN_ATTENTE) {
            session.setStatut(MatchingSession.StatutSession.VALIDE);
            session.setDateValidation(LocalDateTime.now());
            session.setValideParId(adminId);
            sessionRepo.save(session);
        }

        // ── Notifications ──
        sendMatchingNotifications(m);
    }

    // ─── History & Stats ──────────────────────────────────────────

    public List<Map<String, Object>> getGlobalHistory() {
        List<Matching> matchings = matchingRepo.findAll().stream()
                .filter(m -> m.getStatut() == Matching.StatutMatching.VALIDE)
                .collect(Collectors.toList());
        return matchings.stream().map(this::mapMatchingToView).collect(Collectors.toList());
    }

    private Map<String, Object> mapMatchingToView(Matching m) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", m.getId());
        view.put("matchingId", m.getId());
        view.put("scoreIa", m.getScoreIa());
        view.put("isManual", m.getScoreIa() == null || m.getScoreIa() == 0.0);
        view.put("statut", m.getStatut());
        view.put("dateValidation", m.getDateValidation());
        view.put("justification", m.getJustification());
        view.put("rankTop", m.getRankTop());
        view.put("thematiqueId", m.getThematiqueId());
        view.put("programmeId", m.getProgrammeId());

        // 1. Coach Enrichment
        userRepo.findById(m.getCoachId()).ifPresent(c -> {
            Map<String, Object> coach = new LinkedHashMap<>();
            coach.put("id", c.getId());
            coach.put("nom", c.getLastName());
            coach.put("prenom", c.getFirstName());
            coach.put("email", c.getEmail());
            coach.put("expertise", c.getExpertise());
            coach.put("skills", c.getSkills());
            coach.put("secteur", c.getSecteur());
            coach.put("bio", c.getBio());
            coach.put("yearsOfExperience", c.getYearsOfExperience());
            coach.put("phoneNumber", c.getPhoneNumber());
            
            long activeCount = matchingRepo.findByCoachIdAndStatut(c.getId(), Matching.StatutMatching.VALIDE).size();
            coach.put("nbEntrepreneursActifs", activeCount);
            
            double ratingMoyen = coachRatingRepo.findAverageRatingByCoachId(c.getId()).orElse(0.0);
            coach.put("noteMoyenneRating", Math.round(ratingMoyen * 10.0) / 10.0);
            
            view.put("coach", coach);
            view.put("coachName", (c.getFirstName() != null ? c.getFirstName() : "") + " " + (c.getLastName() != null ? c.getLastName() : ""));
        });

        // 2. Entrepreneur Enrichment (Consistently resolve via User ID then Candidature Email)
        userRepo.findById(m.getEntrepreneurId()).ifPresentOrElse(u -> {
            Map<String, Object> ent = new LinkedHashMap<>();
            ent.put("id", u.getId());
            ent.put("nom", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
            ent.put("email", u.getEmail());
            ent.put("telephone", u.getPhoneNumber());
            ent.put("entreprise", u.getEntreprise() != null ? u.getEntreprise() : u.getStartupName());
            ent.put("phaseMaturite", u.getStadeProjet());
            ent.put("description", u.getDescriptionProjet());
            ent.put("region", u.getRegion());
            ent.put("isUser", true);

            // Enrich with latest accepted candidature by email if available
            if (u.getEmail() != null) {
                candidatureRepo.findByEmail(u.getEmail()).stream()
                    .filter(c -> c.getStatut() == CandidatureRedstarter.StatutCandidature.ACCEPTE)
                    .findFirst()
                    .ifPresent(c -> {
                        if (ent.get("entreprise") == null || "Non spécifié".equals(ent.get("entreprise"))) ent.put("entreprise", c.getNomEntreprise());
                        ent.put("secteur", c.getEntrepriseEst());
                        ent.put("phaseMaturite", c.getPhaseMaturite());
                        ent.put("description", c.getBreveDescription());
                        ent.put("region", c.getRegionBasee());
                        ent.put("telephone", c.getNumeroTelephone());
                    });
            }
            
            view.put("entrepreneur", ent);
            view.put("entrepreneurName", ent.get("nom"));
        }, () -> {
            // Fallback to direct candidature search if User record is missing (legacy support)
            candidatureRepo.findById(m.getEntrepreneurId()).ifPresent(c -> {
                Map<String, Object> ent = new LinkedHashMap<>();
                ent.put("id", c.getId());
                ent.put("nom", c.getNomPrenom());
                ent.put("email", c.getEmail());
                ent.put("entreprise", c.getNomEntreprise());
                ent.put("isUser", false);
                view.put("entrepreneur", ent);
                view.put("entrepreneurName", c.getNomPrenom());
            });
        });

        programmeRepo.findById(m.getProgrammeId()).ifPresent(p -> {
            view.put("programmeName", p.getNom());
        });

        return view;
    }

    public List<Map<String, Object>> getHistory(Long programmeId) {
        List<Matching> matchings = matchingRepo.findHistoryByProgramme(programmeId);
        List<Map<String, Object>> history = matchings.stream().map(this::mapMatchingToView).collect(Collectors.toList());
        
        // Include accepted entrepreneurs who are not yet matched
        includeUnmatchedAcceptedEntrepreneurs(programmeId, history);
        
        return history;
    }

    public List<Map<String, Object>> getHistoryByThematique(Long programmeId, Long thematiqueId) {
        List<Matching> matchings = matchingRepo.findByProgrammeAndThematique(programmeId, thematiqueId);
        List<Map<String, Object>> history = matchings.stream().map(this::mapMatchingToView).collect(Collectors.toList());
        
        // For a specific thématique, we usually only see matchings. 
        // But if we want consistency, we could potentially show unmatched ones if they requested this thématique.
        // For now, let's keep it simple.
        
        return history;
    }

    private void includeUnmatchedAcceptedEntrepreneurs(Long programmeId, List<Map<String, Object>> history) {
        programmeRepo.findById(programmeId).ifPresent(p -> {
            String progNom = p.getNom();
            if (progNom == null) return;

            // 1. Find templates for this program
            List<Long> templateIds = formTemplateRepo.findAll().stream()
                    .filter(t -> progNom.equalsIgnoreCase(t.getProgram()))
                    .map(team.project.redboost.entities.FormTemplateEntity::getId)
                    .collect(Collectors.toList());

            if (templateIds.isEmpty()) return;

            // 2. Find all accepted candidatures for these templates
            List<CandidatureRedstarter> accepted = candidatureRepo.findAll().stream()
                    .filter(c -> c.getStatut() == CandidatureRedstarter.StatutCandidature.ACCEPTE)
                    .filter(c -> c.getFormTemplateId() != null && templateIds.contains(c.getFormTemplateId()))
                    .collect(Collectors.toList());

            // 3. Collect emails of already-matched entrepreneurs for reliable deduplication
            //    (using emails avoids the User ID vs Candidature ID mismatch)
            Set<String> matchedEmails = history.stream()
                    .filter(m -> m.get("entrepreneur") != null)
                    .map(m -> {
                        Object ent = m.get("entrepreneur");
                        if (ent instanceof Map) return (String) ((Map) ent).get("email");
                        return null;
                    })
                    .filter(Objects::nonNull)
                    .map(String::toLowerCase)
                    .collect(Collectors.toSet());

            for (CandidatureRedstarter c : accepted) {
                // Skip if no email or already present in history
                if (c.getEmail() == null || matchedEmails.contains(c.getEmail().toLowerCase())) continue;

                // Resolve the real User account
                User user = userRepo.findByEmail(c.getEmail());
                // Only include if user exists and actually belongs to this programme
                if (user == null || user.getProgrammes().stream().noneMatch(pg -> pg.getId().equals(programmeId))) continue;

                matchedEmails.add(c.getEmail().toLowerCase());

                Map<String, Object> virtual = new LinkedHashMap<>();
                virtual.put("id", -user.getId());
                virtual.put("entrepreneurId", user.getId());
                virtual.put("programmeId", programmeId);
                virtual.put("programmeName", progNom);
                virtual.put("statut", "NON_MATCHÉ");
                
                Map<String, Object> ent = new LinkedHashMap<>();
                ent.put("id", user.getId());
                ent.put("isUser", true);
                ent.put("nom", c.getNomPrenom());
                ent.put("email", c.getEmail());
                ent.put("entreprise", c.getNomEntreprise());
                
                virtual.put("entrepreneur", ent);
                virtual.put("entrepreneurName", ent.get("nom"));
                
                history.add(virtual);
            }
        });
    }

    public Map<String, Integer> getMatchingStats(Long programmeId) {
        List<Matching> active = matchingRepo.findActiveByProgramme(programmeId);

        Set<Long> coachCandidatureIds = candidatureRepo
                .findAcceptedCoaches(CandidatureRedstarter.StatutCandidature.ACCEPTE)
                .stream().map(CandidatureRedstarter::getId).collect(Collectors.toSet());

        List<CandidatureRedstarter> acceptedCandidatures = candidatureRepo
                .findAllByStatut(CandidatureRedstarter.StatutCandidature.ACCEPTE);

        long unmatchedCount = acceptedCandidatures.stream()
                .filter(c -> !coachCandidatureIds.contains(c.getId()))
                .filter(c -> !matchingRepo.isEntrepreneurActivelyMatched(c.getId(), programmeId))
                .count();

        return Map.of(
                "activeCount", active.stream()
                    .filter(m -> m.getRankTop() == null || m.getRankTop() == 1)
                    .mapToInt(m -> 1).sum(),
                "unmatchedCount", (int) unmatchedCount
        );
    }

    // ─── Enriched Session Details ─────────────────────────────────

    public List<Map<String, Object>> getSessionMatchingsEnriched(Long sessionId) {
        List<Matching> matchings = matchingRepo.findByMatchingSessionId(sessionId);
        return matchings.stream().map(m -> {
            Map<String, Object> view = new LinkedHashMap<>();
            view.put("matchingId", m.getId());
            view.put("scoreIa", m.getScoreIa());
            view.put("statut", m.getStatut());
            view.put("justification", m.getJustification());
            view.put("pointsForts", m.getPointsForts());
            view.put("pointsAttention", m.getPointsAttention());
            view.put("recommandationSession1", m.getRecommandationSession1());
            view.put("scoresDetail", m.getScoresDetail());
            view.put("rankTop", m.getRankTop());
            view.put("decisionSupport", m.getDecisionSupport());

            // Coach full profile
            userRepo.findById(m.getCoachId()).ifPresent(c -> {
                Map<String, Object> coach = new LinkedHashMap<>();
                coach.put("id", c.getId());
                coach.put("nom", c.getLastName());
                coach.put("prenom", c.getFirstName());
                coach.put("email", c.getEmail());
                coach.put("expertise", c.getExpertise());
                coach.put("skills", c.getSkills());
                coach.put("secteur", c.getSecteur());
                coach.put("bio", c.getBio());
                coach.put("yearsOfExperience", c.getYearsOfExperience());
                coach.put("phoneNumber", c.getPhoneNumber());
                long activeCount = matchingRepo.findByCoachIdAndStatut(c.getId(), Matching.StatutMatching.VALIDE).size();
                coach.put("nbEntrepreneursActifs", activeCount);
                double ratingMoyen = coachRatingRepo.findAverageRatingByCoachId(c.getId()).orElse(0.0);
                coach.put("noteMoyenneRating", Math.round(ratingMoyen * 10.0) / 10.0);
                view.put("coach", coach);
            });

            // Entrepreneur full profile (Consistently resolve via User ID then Candidature Email)
            userRepo.findById(m.getEntrepreneurId()).ifPresentOrElse(u -> {
                Map<String, Object> ent = new LinkedHashMap<>();
                ent.put("id", u.getId());
                ent.put("isUser", true);
                ent.put("nom", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
                ent.put("email", u.getEmail());
                ent.put("telephone", u.getPhoneNumber());
                ent.put("entreprise", u.getEntreprise() != null ? u.getEntreprise() : u.getStartupName());
                ent.put("secteur", u.getSecteur());
                ent.put("phaseMaturite", u.getStadeProjet());
                ent.put("description", u.getDescriptionProjet());
                ent.put("region", u.getRegion());
                ent.put("besoinsAccompagnement", u.getBesoinsCoaching());

                // Enrich with latest accepted candidature by email for full metadata
                if (u.getEmail() != null) {
                    candidatureRepo.findByEmail(u.getEmail()).stream()
                        .filter(c -> c.getStatut() == CandidatureRedstarter.StatutCandidature.ACCEPTE)
                        .findFirst()
                        .ifPresent(c -> {
                            if (ent.get("entreprise") == null || "Non spécifié".equals(ent.get("entreprise"))) ent.put("entreprise", c.getNomEntreprise());
                            ent.put("secteur", c.getEntrepriseEst());
                            ent.put("phaseMaturite", c.getPhaseMaturite());
                            ent.put("description", c.getBreveDescription());
                            ent.put("region", c.getRegionBasee());
                            ent.put("innovation", c.getComposanteInnovation());
                            ent.put("besoinsAccompagnement", c.getBesoinsAccompagnement());
                            ent.put("besoinsFormation", c.getBesoinsFormation());
                            ent.put("roleEntreprise", c.getRoleEntreprise());
                            ent.put("viabiliteCommerciale", c.getViabiliteCommerciale());
                            ent.put("impactEnvironnemental", c.getImpactEnvironnemental());
                            ent.put("impactSocial", c.getImpactSocial());
                            ent.put("experienceEquipe", c.getExperienceEquipeFondatrice());
                            ent.put("marchePersonnasCibles", c.getMarchePersonnasCibles());
                            
                            // Dynamic form answers
                            if (c.getDynamicAnswers() != null && !c.getDynamicAnswers().isEmpty()) {
                                try {
                                    Map<String, Object> dynRoot = objectMapper.readValue(c.getDynamicAnswers(), Map.class);
                                    Object answers = dynRoot.get("answers");
                                    ent.put("reponsesFormulaire", (answers instanceof Map) ? answers : dynRoot);
                                } catch (Exception e) {
                                    log.warn("Could not parse dynamicAnswers for candidature {}", c.getId());
                                }
                            }
                            // Documents list
                            if (c.getDocuments() != null && !c.getDocuments().isEmpty()) {
                                ent.put("documents", c.getDocuments());
                            }
                        });
                }
                view.put("entrepreneur", ent);
            }, () -> {
                // Fallback to direct candidature search
                candidatureRepo.findById(m.getEntrepreneurId()).ifPresent(c -> {
                    Map<String, Object> ent = new LinkedHashMap<>();
                    ent.put("id", c.getId());
                    ent.put("isUser", false);
                    ent.put("nom", c.getNomPrenom());
                    ent.put("email", c.getEmail());
                    ent.put("entreprise", c.getNomEntreprise());
                    ent.put("description", c.getBreveDescription());
                    view.put("entrepreneur", ent);
                });
            });

            return view;
        }).collect(Collectors.toList());
    }

    // ─── Manual Matching ──────────────────────────────────────────

    /**
     * Returns entrepreneurs (not yet matched for this programme+thematique)
     * and coaches (active in this programme).
     * thematiqueId is REQUIRED — reflects business rule.
     */
    public Map<String, Object> getManualMatchingCandidates(Long programmeId, Long thematiqueId) {
        Programme programme = programmeRepo.findById(programmeId)
                .orElseThrow(() -> new RuntimeException("Programme introuvable : " + programmeId));

        ThematiqueCoaching thematique = thematiqueRepo.findById(thematiqueId)
                .orElseThrow(() -> new RuntimeException("Thématique introuvable : " + thematiqueId));

        if (!thematique.getProgrammeId().equals(programmeId)) {
            throw new RuntimeException("La thématique n'appartient pas à ce programme.");
        }

        // ── Entrepreneurs du programme ──
        // On récupère les utilisateurs avec le rôle ENTREPRENEUR
        List<User> entrepreneursUtilisateurs = userRepo.findAll().stream()
                .filter(u -> u.getRole() == Role.ENTREPRENEUR)
                .filter(u -> {
                    // 1. Déjà lié explicitement au programme
                    boolean isLinked = u.getProgrammes().stream().anyMatch(p -> p.getId().equals(programmeId));
                    if (isLinked) return true;

                    // 2. Fallback: A une candidature acceptée pour ce programme
                    if (u.getEmail() != null) {
                        return candidatureRepo.findByEmail(u.getEmail()).stream()
                                .filter(c -> c.getStatut() == CandidatureRedstarter.StatutCandidature.ACCEPTE)
                                .anyMatch(c -> {
                                    if (c.getFormTemplateId() == null) return false;
                                    return formTemplateRepo.findById(c.getFormTemplateId())
                                            .map(t -> programme.getNom().equalsIgnoreCase(t.getProgram()))
                                            .orElse(false);
                                });
                    }
                    return false;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> entrepreneursList = entrepreneursUtilisateurs.stream()
                .filter(u -> !matchingRepo.isEntrepreneurActivelyMatchedForThematique(u.getId(), thematiqueId))
                .map(u -> {
                    Map<String, Object> e = new LinkedHashMap<>();
                    e.put("id", u.getId());
                    e.put("nom", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
                    e.put("email", u.getEmail());
                    e.put("telephone", u.getPhoneNumber());
                    e.put("entreprise", u.getEntreprise() != null ? u.getEntreprise() : u.getStartupName());
                    e.put("secteur", u.getSecteur());
                    e.put("region", u.getRegion());

                    // Try to enrich with Candidature data if available
                    if (u.getEmail() != null) {
                        candidatureRepo.findByEmail(u.getEmail()).stream()
                                .filter(c -> c.getStatut() == CandidatureRedstarter.StatutCandidature.ACCEPTE)
                                .findFirst()
                                .ifPresent(cand -> {
                                    e.put("phaseMaturite", cand.getPhaseMaturite());
                                    e.put("description", cand.getBreveDescription());
                                    e.put("besoinsAccompagnement", cand.getBesoinsAccompagnement());
                                    if (e.get("entreprise") == null || "Non spécifié".equals(e.get("entreprise"))) {
                                        e.put("entreprise", cand.getNomEntreprise());
                                    }
                                });
                    }
                    
                    if (e.get("phaseMaturite") == null) e.put("phaseMaturite", u.getStadeProjet());
                    if (e.get("description") == null) e.put("description", u.getDescriptionProjet());
                    if (e.get("besoinsAccompagnement") == null) e.put("besoinsAccompagnement", u.getBesoinsCoaching());
                    
                    return e;
                }).collect(Collectors.toList());

        // ── Coachs actifs du programme ──
        List<User> coaches = userRepo.findAll().stream()
                .filter(u -> u.getRole() == Role.COACH && u.isActive())
                .filter(u -> u.getProgrammes().stream().anyMatch(p -> p.getId().equals(programmeId)))
                .collect(Collectors.toList());

        List<Map<String, Object>> coachesList = coaches.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("nom", c.getLastName());
            m.put("prenom", c.getFirstName());
            m.put("email", c.getEmail());
            m.put("expertise", c.getExpertise());
            m.put("skills", c.getSkills());
            m.put("secteur", c.getSecteur());
            m.put("bio", c.getBio());
            m.put("yearsOfExperience", c.getYearsOfExperience());
            m.put("phoneNumber", c.getPhoneNumber());
            long activeCount = matchingRepo.findByCoachIdAndStatut(c.getId(), Matching.StatutMatching.VALIDE).size();
            m.put("nbEntrepreneursActifs", activeCount);
            double rating = coachRatingRepo.findAverageRatingByCoachId(c.getId()).orElse(0.0);
            m.put("noteMoyenneRating", Math.round(rating * 10.0) / 10.0);
            m.put("disponible", activeCount < 5);
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("programme", programme.getNom());
        result.put("thematique", thematique.getNom());
        result.put("entrepreneurs", entrepreneursList);
        result.put("coaches", coachesList);
        return result;
    }

    /**
     * Creates a manual validated matching between an entrepreneur and a coach,
     * bypassing the AI engine entirely.
     */
    @Transactional
    public Map<String, Object> createManualMatching(Long entrepreneurId, Long coachId,
                                                     Long programmeId, Long thematiqueId,
                                                     String note) {
        // Vérifie que la thématique est fournie (règle métier)
        if (thematiqueId == null) {
            throw new RuntimeException("La thématique est obligatoire pour créer un matching.");
        }
        // Vérifie que l'entrepreneur n'a pas déjà un matching actif pour ce programme+thématique
        if (matchingRepo.existsByEntrepreneurIdAndProgrammeIdAndThematiqueIdAndStatut(
                entrepreneurId, programmeId, thematiqueId, Matching.StatutMatching.VALIDE)) {
            throw new RuntimeException("Cet entrepreneur a déjà un coaching actif pour cette thématique.");
        }

        // Crée une session manuelle dédiée
        MatchingSession session = MatchingSession.builder()
                .programmeId(programmeId)
                .thematiqueId(thematiqueId)
                .statut(MatchingSession.StatutSession.VALIDE)
                .nbMatchings(1)
                .dateMatching(LocalDateTime.now())
                .dateValidation(LocalDateTime.now())
                .alertesJson("[]")
                .build();
        session = sessionRepo.save(session);

        // Crée le matching directement en statut VALIDE
        Matching matching = Matching.builder()
                .matchingSession(session)
                .coachId(coachId)
                .entrepreneurId(entrepreneurId)
                .programmeId(programmeId)
                .thematiqueId(thematiqueId)
                .scoreIa(0.0)   // pas de score IA pour un matching manuel
                .justification(note != null && !note.isBlank() ? note : "Matching effectué manuellement par l'administrateur.")
                .rankTop(1)
                .statut(Matching.StatutMatching.VALIDE)
                .dateValidation(LocalDateTime.now())
                .build();
        matchingRepo.save(matching);

        log.info("Matching manuel créé : entrepreneur={} ↔ coach={} programme={}", entrepreneurId, coachId, programmeId);

        // ── Notifications ──
        sendMatchingNotifications(matching);

        // Résumé retourné au frontend (Consistently resolve via User ID)
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("matchingId", matching.getId());
        result.put("sessionId", session.getId());
        result.put("entrepreneurId", entrepreneurId);
        result.put("coachId", coachId);
        result.put("statut", "VALIDE");

        userRepo.findById(entrepreneurId).ifPresentOrElse(u -> {
            result.put("entrepreneurNom", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
        }, () -> {
            // Fallback for legacy data
            candidatureRepo.findById(entrepreneurId).ifPresent(c -> result.put("entrepreneurNom", c.getNomPrenom()));
        });
        userRepo.findById(coachId).ifPresent(c -> result.put("coachNom", c.getFirstName() + " " + c.getLastName()));
        return result;
    }

    @Transactional
    public Map<String, Object> updateManualMatching(Long matchingId, Long newCoachId, Long newEntrepreneurId, String note) {
        Matching matching = matchingRepo.findById(matchingId)
                .orElseThrow(() -> new RuntimeException("Matching introuvable : " + matchingId));

        if (matching.getStatut() != Matching.StatutMatching.VALIDE && matching.getStatut() != Matching.StatutMatching.PROPOSE) {
            throw new RuntimeException("Impossible de modifier ce matching car son statut est : " + matching.getStatut());
        }

        if (newEntrepreneurId != null && !newEntrepreneurId.equals(matching.getEntrepreneurId())) {
            if (matchingRepo.existsByEntrepreneurIdAndProgrammeIdAndThematiqueIdAndStatut(
                    newEntrepreneurId, matching.getProgrammeId(), matching.getThematiqueId(), Matching.StatutMatching.VALIDE)) {
                throw new RuntimeException("Cet entrepreneur a déjà un coaching actif pour cette thématique.");
            }
            matching.setEntrepreneurId(newEntrepreneurId);
        }

        if (newCoachId != null) {
            matching.setCoachId(newCoachId);
        }

        String prefix = "Modifié manuellement par l'administrateur le " + LocalDateTime.now().toLocalDate();
        if (note != null && !note.trim().isEmpty()) {
            matching.setJustification(prefix + ". Note: " + note);
        } else {
            matching.setJustification(prefix + ".");
        }

        matchingRepo.save(matching);

        log.info("Matching {} modifié : entrepreneur={} ↔ coach={}", matchingId, matching.getEntrepreneurId(), matching.getCoachId());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Matching modifié avec succès.");
        result.put("matchingId", matching.getId());
        result.put("entrepreneurId", matching.getEntrepreneurId());
        result.put("coachId", matching.getCoachId());
        
        candidatureRepo.findById(matching.getEntrepreneurId()).ifPresentOrElse(
            c -> result.put("entrepreneurNom", c.getNomPrenom()),
            () -> userRepo.findById(matching.getEntrepreneurId()).ifPresent(u -> 
                result.put("entrepreneurNom", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""))
            )
        );
        userRepo.findById(matching.getCoachId()).ifPresent(c -> result.put("coachNom", c.getFirstName() + " " + c.getLastName()));

        return result;
    }

    // ─── Notification Helper ─────────────────────────────────────

    private void sendMatchingNotifications(Matching m) {
        try {
            // Resolve coach name
            User coach = userRepo.findById(m.getCoachId()).orElse(null);
            String coachName = coach != null ? (coach.getFirstName() + " " + coach.getLastName()) : "Coach";

            // Resolve entrepreneur name and User ID
            String entrepreneurName = "Entrepreneur";
            Long entrepreneurUserId = null;
            CandidatureRedstarter cand = candidatureRepo.findById(m.getEntrepreneurId()).orElse(null);
            
            if (cand != null) {
                entrepreneurName = cand.getNomPrenom() != null ? cand.getNomPrenom() : "Entrepreneur";
                if (cand.getEmail() != null) {
                    User entUser = userRepo.findByEmail(cand.getEmail());
                    if (entUser != null) entrepreneurUserId = entUser.getId();
                }
            } else {
                // Fallback to User ID if no candidature is found (for manual matchings)
                User entUser = userRepo.findById(m.getEntrepreneurId()).orElse(null);
                if (entUser != null) {
                    entrepreneurName = (entUser.getFirstName() != null ? entUser.getFirstName() : "") + " " + 
                                       (entUser.getLastName() != null ? entUser.getLastName() : "");
                    entrepreneurUserId = entUser.getId();
                }
            }

            // Resolve programme name
            String programmeName = "";
            Programme prog = programmeRepo.findById(m.getProgrammeId()).orElse(null);
            if (prog != null) programmeName = prog.getNom();

            // Notify coach
            if (coach != null) {
                notificationService.createAndSendNotification(
                    coach.getId(),
                    "Vous avez été assigné à " + entrepreneurName + (cand != null && cand.getNomEntreprise() != null ? " (" + cand.getNomEntreprise() + ")" : ""),
                    "MATCHING_ASSIGN",
                    m.getId()
                );
            }

            // Notify entrepreneur
            if (entrepreneurUserId != null) {
                notificationService.createAndSendNotification(
                    entrepreneurUserId,
                    "Votre coach est " + coachName + " — Programme " + programmeName,
                    "MATCHING_ASSIGN",
                    m.getId()
                );
            }

            log.info("Notifications matching envoyées : coach={} entrepreneur={}", m.getCoachId(), entrepreneurUserId);
        } catch (Exception e) {
            log.error("Erreur envoi notifications matching : {}", e.getMessage());
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private Long toLong(Object val) {
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).longValue();
        return Long.parseLong(val.toString());
    }

    private Double toDouble(Object val) {
        if (val == null) return 0.0;
        if (val instanceof Number) return ((Number) val).doubleValue();
        return Double.parseDouble(val.toString());
    }

    private String extractTextFromDocument(String filename) {
        if (filename == null || filename.isEmpty()) return null;
        try {
            Path filePath = Paths.get(uploadDir, "candidatures", filename).toAbsolutePath().normalize();
            File file = filePath.toFile();
            if (!file.exists() || !file.isFile()) return null;
            if (!filename.toLowerCase().endsWith(".pdf")) return null;

            String aiServiceUrl = System.getenv("AI_SERVICE_BASE_URL");
            if (aiServiceUrl == null || aiServiceUrl.isEmpty()) {
                aiServiceUrl = "http://localhost:8000";
            }
            String endpoint = aiServiceUrl + "/api/ocr/extract";

            org.springframework.util.LinkedMultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
            body.add("file", new org.springframework.core.io.FileSystemResource(file));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<org.springframework.util.MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String text = (String) response.getBody().get("text");
                return (text != null && !text.trim().isEmpty()) ? text.trim() : null;
            }
        } catch (Exception e) {
            log.warn("Impossible d'extraire le texte via l'IA pour {}: {}", filename, e.getMessage());
        }
        return null;
    }

   
    public List<Map<String, Object>> getCoachesForEntrepreneur(Long entrepreneurUserId) {
        User entrepreneur = userRepo.findById(entrepreneurUserId)
                .orElseThrow(() -> new RuntimeException("Entrepreneur non trouvé : " + entrepreneurUserId));

        String email = entrepreneur.getEmail();
        if (email == null) return Collections.emptyList();

        // Find candidature(s) by email (case-insensitive) to get the candidature ID used in matchings
        List<CandidatureRedstarter> candidatures = candidatureRepo.findAll().stream()
                .filter(c -> c.getEmail() != null && c.getEmail().equalsIgnoreCase(email))
                .collect(Collectors.toList());

        List<Map<String, Object>> result = new ArrayList<>();
        Set<String> seenKey = new HashSet<>(); // coachId + "_" + thematiqueId to allow same coach in different thematiques

        List<Matching.StatutMatching> statuses = List.of(
            Matching.StatutMatching.VALIDE, 
            Matching.StatutMatching.TERMINE,
            Matching.StatutMatching.LIBERE
        );
        
        // 1. Search matchings via candidature IDs
        for (CandidatureRedstarter cand : candidatures) {
            List<Matching> matchings = matchingRepo.findByEntrepreneurIdAndStatutIn(cand.getId(), statuses);

            for (Matching m : matchings) {
                String key = m.getCoachId() + "_" + (m.getThematiqueId() != null ? m.getThematiqueId() : "global");
                if (!seenKey.add(key)) continue;
                buildCoachView(m, result);
            }
        }

        // 2. Fallback: Search matchings via direct User ID
        List<Matching> directMatchings = matchingRepo.findByEntrepreneurIdAndStatutIn(entrepreneurUserId, statuses);
        for (Matching m : directMatchings) {
            String key = m.getCoachId() + "_" + (m.getThematiqueId() != null ? m.getThematiqueId() : "global");
            if (!seenKey.add(key)) continue;
            buildCoachView(m, result);
        }

        return result;
    }

    private void buildCoachView(Matching m, List<Map<String, Object>> result) {
        userRepo.findById(m.getCoachId()).ifPresent(coach -> {
            Map<String, Object> view = new LinkedHashMap<>();
            view.put("id", String.valueOf(coach.getId()));
            view.put("nom", ((coach.getFirstName() != null ? coach.getFirstName() : "") + " " +
                    (coach.getLastName() != null ? coach.getLastName() : "")).trim());
            view.put("email", coach.getEmail());
            view.put("specialite", coach.getExpertise());
            view.put("sector", coach.getSecteur());
            view.put("programmeId", String.valueOf(m.getProgrammeId()));

            programmeRepo.findById(m.getProgrammeId()).ifPresent(p ->
                    view.put("programmeName", p.getNom()));

            // ── Thématique ──────────────────────────────────────────────
            if (m.getThematiqueId() != null) {
                view.put("thematiqueId", String.valueOf(m.getThematiqueId()));
                thematiqueRepo.findById(m.getThematiqueId()).ifPresent(t ->
                        view.put("thematiqueName", t.getNom()));
            }

            view.put("scoreMatching", m.getScoreIa() != null ? m.getScoreIa() : 0);
            view.put("justificationMatching", m.getJustification());
            view.put("pointsForts", m.getPointsForts());
            view.put("recommandationSession1", m.getRecommandationSession1());

            result.add(view);
        });
    }

    @Transactional
    public void deleteMatching(Long matchingId) {
    Matching matching = matchingRepo.findById(matchingId)
            .orElseThrow(() -> new RuntimeException("Matching introuvable : " + matchingId));
    matchingRepo.delete(matching);
    log.info("Matching {} supprimé", matchingId);
}
}