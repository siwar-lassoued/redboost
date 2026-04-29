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
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingIaService {

    private final MatchingRepository matchingRepo;
    private final MatchingSessionRepository sessionRepo;
    private final UserRepository userRepo;
    private final ProgrammeRepository programmeRepo;
    private final ThematiqueRepository thematiqueRepo;
    private final CandidatureRedstarterRepository candidatureRepo;
    private final CoachRatingRepository coachRatingRepo;
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

        // Récupérer les entrepreneurs affectés à ce programme
        List<User> entrepreneursDuProgramme = userRepo.findAll().stream()
                .filter(u -> u.getRole() == Role.ENTREPRENEUR)
                .filter(u -> u.getProgrammes().stream().anyMatch(p -> p.getId().equals(programmeId)))
                .collect(Collectors.toList());

        Set<String> emailsEntrepreneursProgramme = entrepreneursDuProgramme.stream()
                .map(User::getEmail)
                .filter(Objects::nonNull)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        List<CandidatureRedstarter> acceptedCandidaturesProgramme = candidatureRepo
                .findAllByStatut(CandidatureRedstarter.StatutCandidature.ACCEPTE)
                .stream()
                .filter(c -> c.getEmail() != null && emailsEntrepreneursProgramme.contains(c.getEmail().toLowerCase()))
                .collect(Collectors.toList());

        List<CandidatureRedstarter> spontaneesAcceptees = candidatureRepo
                .findSpontaneesByStatut(CandidatureRedstarter.StatutCandidature.ACCEPTE);

        Set<CandidatureRedstarter> candidaturesCombine = new HashSet<>(acceptedCandidaturesProgramme);
        candidaturesCombine.addAll(spontaneesAcceptees);

        List<CandidatureRedstarter> unmatchedCandidatures = candidaturesCombine.stream()
                .filter(c -> !coachCandidatureIds.contains(c.getId()))
                .filter(c -> !matchingRepo.isEntrepreneurActivelyMatchedForThematique(c.getId(), thematiqueId))
                .collect(Collectors.toList());

        log.info("Entrepreneurs à matcher: {} / {} acceptés", unmatchedCandidatures.size(), candidaturesCombine.size());

        if (unmatchedCandidatures.isEmpty()) {
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
            m.put("score_charge_precalcule", (int) Math.round(scoreChargePrecalcule));

            m.values().removeIf(Objects::isNull);
            return m;
        }).collect(Collectors.toList());

        // ── 5. Construire le profil enrichi de chaque entrepreneur ───
        List<Map<String, Object>> entrepreneursData = unmatchedCandidatures.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("nom", c.getNomPrenom());
            m.put("email", c.getEmail());
            m.put("entreprise", c.getNomEntreprise());
            m.put("secteur", c.getEntrepriseEst());
            m.put("region", c.getRegionBasee());
            m.put("phase_maturite", c.getPhaseMaturite());
            m.put("description", c.getBreveDescription());
            m.put("besoins_accompagnement", c.getBesoinsAccompagnement());
            m.put("besoins_formation", c.getBesoinsFormation());
            m.put("innovation", c.getComposanteInnovation());
            m.put("impact_environnemental", c.getImpactEnvironnemental());
            m.put("impact_social", c.getImpactSocial());
            m.put("viabilite_commerciale", c.getViabiliteCommerciale());
            m.put("valeur_ajoutee", c.getValeurAjoutee());
            m.put("marche_cible", c.getMarchePersonnasCibles());
            m.put("role_entreprise", c.getRoleEntreprise());
            m.put("experience_equipe", c.getExperienceEquipeFondatrice());
            m.put("nb_cofondateurs", c.getNombreCoFondateurs());
            m.put("a_beneficie_accompagnement", c.getBeneficieAccompagnement());
            m.put("details_accompagnement", c.getDetailsAccompagnement());

            // Réponses dynamiques du formulaire (source la plus riche)
            if (c.getDynamicAnswers() != null && !c.getDynamicAnswers().isEmpty()) {
                try {
                    Map<String, Object> dynRoot = objectMapper.readValue(c.getDynamicAnswers(), Map.class);
                    Object answers = dynRoot.get("answers");
                    m.put("reponses_formulaire", (answers instanceof Map) ? answers : dynRoot);
                } catch (Exception e) {
                    log.warn("Impossible de parser dynamicAnswers pour candidature {}: {}", c.getId(), e.getMessage());
                }
            }

            // Extraits de documents PDF (CV, Pitch, etc.) avec troncature ciblée
            if (c.getDocuments() != null && !c.getDocuments().isEmpty()) {
                List<String> extraits = new ArrayList<>();
                for (String docName : c.getDocuments()) {
                    String extracted = extractTextFromDocument(docName);
                    if (extracted != null && !extracted.isEmpty()) {
                        // CV = 2000 chars, lettre/pitch = 1000 chars
                        String nomLower = docName.toLowerCase();
                        int maxChars = (nomLower.contains("cv") || nomLower.contains("resume") || nomLower.contains("curriculum")) ? 2000 : 1000;
                        if (extracted.length() > maxChars) {
                            extracted = extracted.substring(0, maxChars) + "\n... [extrait tronqué]";
                        }
                        extraits.add("Document '" + docName + "':\n" + extracted);
                    }
                }
                if (!extraits.isEmpty()) m.put("documents_extrait", extraits);
            }

            m.values().removeIf(Objects::isNull);
            return m;
        }).collect(Collectors.toList());

        // ── 6. Construire & envoyer le prompt Gemini ─────────────────

        String systemPrompt = buildSystemPrompt(thematique, programme);

        String coachesStr, entrepreneursStr;
        try {
            coachesStr = objectMapper.writeValueAsString(coachesData.subList(0, Math.min(20, coachesData.size())));
            entrepreneursStr = objectMapper.writeValueAsString(entrepreneursData.subList(0, Math.min(20, entrepreneursData.size())));
        } catch (Exception e) {
            throw new RuntimeException("Erreur de sérialisation JSON des profils", e);
        }

        String userPrompt = buildUserPrompt(programme.getNom(), coachesStr, entrepreneursStr);
        String finalPrompt = systemPrompt + "\n\n" + userPrompt;

        log.info("Prompt envoyé à Gemini: {} chars | {} coachs | {} entrepreneurs",
                finalPrompt.length(), coachesData.size(), entrepreneursData.size());

        // ── 7. Appel API Gemini ───────────────────────────────────────
        String aiResponse = callGeminiApi(finalPrompt);

        // ── 8. Parser la réponse et sauvegarder les matchings ────────
        return parseAndSaveTop3(aiResponse, programme, thematique, programmeId, thematiqueId);
    }

    // ─── Prompt Builder ───────────────────────────────────────────

    private String buildSystemPrompt(ThematiqueCoaching thematique, Programme programme) {
        return "Tu es un expert RH senior spécialisé dans l'accompagnement de startups en Tunisie (contexte MENA).\n" +
               "Tu effectues le matching coach/entrepreneur pour le programme RedBoost.\n\n" +
               "━━━ CONTEXTE LOCAL TUNISIE ━━━\n" +
               "Favorise les coachs ayant :\n" +
               "- Expérience avec startups tunisiennes / écosystème MENA\n" +
               "- Connaissance : Startup Act, BFPME, SICAR, mécanismes de financement locaux\n" +
               "- Réseau actif (incubateurs tunisiens, investisseurs, corporate)\n\n" +
               "━━━ THÉMATIQUE ACTIVE (OBLIGATOIRE) ━━━\n" +
               "Nom : " + thematique.getNom() + "\n" +
               "Description : " + (thematique.getDescription() != null ? thematique.getDescription() : "N/A") + "\n" +
               "Période : " + thematique.getDateDebut() + " → " + thematique.getDateFin() + "\n\n" +
               "PRIORITÉ ABSOLUE : L'expertise du coach DOIT correspondre à cette thématique.\n" +
               "   Si non couverte → score alignement_global plafonné à 60/100 maximum.\n" +
               "   Si secteur incompatible → score alignement_global plafonné à 50/100 maximum.\n\n" +
               "━━━ SCORING — 5 CRITÈRES PONDÉRÉS (total 100 points) ━━━\n\n" +
               "1. alignement_global (30%)\n" +
               "   Combine thématique (prioritaire) + secteur/industrie.\n\n" +
               "2. competences_complementaires (25%)\n" +
               "   Skills coach ↔ besoins_accompagnement + besoins_formation de l'entrepreneur.\n" +
               "   Analyse : formulaire, documents, bio, certifications.\n\n" +
               "3. stade_maturite (20%)\n" +
               "   Phase startup ↔ expérience coach (stades déjà accompagnés, années, succès clients).\n\n" +
               "4. compatibilite_humaine (15%)\n" +
               "   Style coaching déduit (directif/participatif) ↔ personnalité entrepreneur (déduite des réponses).\n" +
               "   Capacité d'accompagnement réel avec la charge actuelle.\n\n" +
               "5. charge_coach (10%)\n" +
               "   = score_charge_precalcule déjà calculé et fourni dans les données du coach.\n" +
               "   Formule appliquée : (1 - nb_actifs/5) * 70 + (rating_moyen/5) * 30\n\n" +
               "━━━ RÈGLES D'ANALYSE ━━━\n" +
               "- Analyse TOUS les champs fournis (bio, reponses_formulaire, documents_extrait)\n" +
               "- Données manquantes → utiliser score neutre 50 (JAMAIS 0 sauf incompatibilité évidente)\n" +
               "- Déduire la maturité réelle et la personnalité entrepreneur des réponses formulaire\n" +
               "- score_final = somme pondérée : (alignement*0.30) + (competences*0.25) + (maturite*0.20) + (humaine*0.15) + (charge*0.10)\n" +
               "- Tous les scores entre 0 et 100. Éviter les scores > 95 sans justification forte.\n\n" +
               "━━━ DÉTECTION DES RISQUES (OBLIGATOIRE) ━━━\n" +
               "Ajouter une alerte dans 'alertes' si :\n" +
               "- score_final < 40 → type: \"SCORE_FAIBLE\"\n" +
               "- nb_entrepreneurs_actifs >= 5 → type: \"COACH_SURCHARGE\"\n" +
               "- secteurs clairement incompatibles → type: \"MISMATCH_SECTORIEL\"\n" +
               "- compétences insuffisantes par rapport aux besoins → type: \"MISMATCH_COMPETENCES\"\n" +
               "- aucune expérience coach identifiable → type: \"EXPERIENCE_INSUFFISANTE\"\n" +
               "- coach sans bio ou expertise renseignée → type: \"PROFIL_INCOMPLET_COACH\"\n" +
               "- entrepreneur sans description ou besoins → type: \"PROFIL_INCOMPLET_ENTREPRENEUR\"\n" +
               "Format alerte : { \"type\": \"...\", \"coach_id\": X, \"entrepreneur_id\": Y, \"message\": \"...\" }\n\n" +
               "━━━ SORTIE OBLIGATOIRE — TOP 3 PAR ENTREPRENEUR ━━━\n" +
               "Pour CHAQUE entrepreneur, évaluer TOUS les coachs et retourner les 3 meilleurs.\n" +
               "Trier par score_final décroissant. Rank 1 = meilleur recommandé.\n" +
               "Si moins de 3 coachs disponibles, retourner ceux disponibles.\n\n" +
               "RÈGLE ABSOLUE : Retourne UNIQUEMENT du JSON valide, zéro texte avant ou après.";
    }

    private String buildUserPrompt(String programmeName, String coachesStr, String entrepreneursStr) {
        String schema = "{\n" +
            "  \"matchings\": [\n" +
            "    {\n" +
            "      \"entrepreneur_id\": 0,\n" +
            "      \"propositions\": [\n" +
            "        {\n" +
            "          \"rank\": 1,\n" +
            "          \"coach_id\": 0,\n" +
            "          \"score_final\": 0,\n" +
            "          \"scores_detail\": {\n" +
            "            \"alignement_global\": 0,\n" +
            "            \"competences_complementaires\": 0,\n" +
            "            \"stade_maturite\": 0,\n" +
            "            \"compatibilite_humaine\": 0,\n" +
            "            \"charge_coach\": 0\n" +
            "          },\n" +
            "          \"justification\": \"Explication synthétique du matching\",\n" +
            "          \"points_forts\": [\"...\"],\n" +
            "          \"points_attention\": [\"...\"],\n" +
            "          \"recommandation_session_1\": \"Suggestion concrète pour la première séance\",\n" +
            "          \"decision_support\": {\n" +
            "            \"pourquoi_ce_coach\": \"Raison principale de recommandation\",\n" +
            "            \"pourquoi_pas_ideal\": \"Limites ou risques à considérer\",\n" +
            "            \"cas_ou_choisir_ce_coach\": \"Dans quel cas choisir ce coach malgré son rang\"\n" +
            "          }\n" +
            "        }\n" +
            "      ]\n" +
            "    }\n" +
            "  ],\n" +
            "  \"alertes\": []\n" +
            "}";

        return "Programme : " + programmeName + "\n\n" +
               "COACHES DISPONIBLES :\n" + coachesStr + "\n\n" +
               "ENTREPRENEURS :\n" + entrepreneursStr + "\n\n" +
               "Schéma JSON attendu (respecter EXACTEMENT cette structure) :\n" + schema;
    }

    // ─── Gemini API Call ──────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String callGeminiApi(String finalPrompt) {
        if ("unconfigured".equals(geminiApiKey) || geminiApiKey.isEmpty()) {
            throw new RuntimeException("La clé API Gemini (gemini.api.key) n'est pas configurée dans application.properties.");
        }

        Map<String, Object> geminiRequest = new LinkedHashMap<>();
        Map<String, Object> part = new LinkedHashMap<>();
        part.put("text", finalPrompt);
        Map<String, Object> content = new LinkedHashMap<>();
        content.put("parts", List.of(part));
        geminiRequest.put("contents", List.of(content));

        // Ask Gemini to return JSON directly
        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("responseMimeType", "application/json");
        geminiRequest.put("generationConfig", generationConfig);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(geminiRequest, headers);

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                if (!candidates.isEmpty()) {
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) ((Map<String, Object>) candidates.get(0).get("content")).get("parts");
                    if (!parts.isEmpty()) {
                        String aiResponse = (String) parts.get(0).get("text");
                        if (aiResponse != null) {
                            return aiResponse.replace("```json", "").replace("```", "").trim();
                        }
                    }
                }
            }
            throw new RuntimeException("Réponse vide de Gemini");
        } catch (Exception e) {
            log.error("Erreur appel API Gemini: {}", e.getMessage());
            throw new RuntimeException("Erreur de l'API Gemini : " + e.getMessage());
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

    public List<Map<String, Object>> getHistory(Long programmeId) {
        List<Matching> matchings = matchingRepo.findHistoryByProgramme(programmeId);
        return matchings.stream().map(m -> {
            Map<String, Object> view = new HashMap<>();
            view.put("id", m.getId());
            view.put("scoreIa", m.getScoreIa());
            view.put("statut", m.getStatut());
            view.put("dateValidation", m.getDateValidation());
            view.put("justification", m.getJustification());
            view.put("rankTop", m.getRankTop());

            userRepo.findById(m.getCoachId()).ifPresent(c -> {
                Map<String, String> coach = new HashMap<>();
                coach.put("nom", c.getLastName());
                coach.put("prenom", c.getFirstName());
                view.put("coach", coach);
            });

            view.put("entrepreneurId", m.getEntrepreneurId());
            candidatureRepo.findById(m.getEntrepreneurId()).ifPresent(c -> {
                Map<String, String> ent = new HashMap<>();
                ent.put("nom", c.getNomPrenom());
                view.put("entrepreneur", ent);
            });

            return view;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getHistoryByThematique(Long programmeId, Long thematiqueId) {
        List<Matching> matchings = matchingRepo.findByProgrammeAndThematique(programmeId, thematiqueId);
        return matchings.stream().map(m -> {
            Map<String, Object> view = new LinkedHashMap<>();
            view.put("id", m.getId());
            view.put("matchingId", m.getId());
            view.put("scoreIa", m.getScoreIa());
            view.put("statut", m.getStatut());
            view.put("dateValidation", m.getDateValidation());
            view.put("justification", m.getJustification());
            view.put("rankTop", m.getRankTop());
            view.put("thematiqueId", m.getThematiqueId());

            userRepo.findById(m.getCoachId()).ifPresent(c -> {
                Map<String, Object> coach = new LinkedHashMap<>();
                coach.put("id", c.getId());
                coach.put("nom", c.getLastName());
                coach.put("prenom", c.getFirstName());
                coach.put("email", c.getEmail());
                coach.put("expertise", c.getExpertise());
                view.put("coach", coach);
            });

            view.put("entrepreneurId", m.getEntrepreneurId());
            candidatureRepo.findById(m.getEntrepreneurId()).ifPresent(c -> {
                Map<String, Object> ent = new LinkedHashMap<>();
                ent.put("id", c.getId());
                ent.put("nom", c.getNomPrenom());
                ent.put("email", c.getEmail());
                ent.put("entreprise", c.getNomEntreprise());
                view.put("entrepreneur", ent);
            });

            return view;
        }).collect(Collectors.toList());
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

            // Entrepreneur full profile (from candidature)
            candidatureRepo.findById(m.getEntrepreneurId()).ifPresent(c -> {
                Map<String, Object> ent = new LinkedHashMap<>();
                ent.put("id", c.getId());
                ent.put("nom", c.getNomPrenom());
                ent.put("email", c.getEmail());
                ent.put("telephone", c.getNumeroTelephone());
                ent.put("entreprise", c.getNomEntreprise());
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
                // Documents list (filenames only — frontend will build download links)
                if (c.getDocuments() != null && !c.getDocuments().isEmpty()) {
                    ent.put("documents", c.getDocuments());
                }
                view.put("entrepreneur", ent);
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

        // ── Entrepreneurs du programme sans matching VALIDE pour ce programme ──
        List<User> entrepreneursUtilisateurs = userRepo.findAll().stream()
                .filter(u -> u.getRole() == Role.ENTREPRENEUR)
                .filter(u -> u.getProgrammes().stream().anyMatch(p -> p.getId().equals(programmeId)))
                .collect(Collectors.toList());

        Set<String> emailsEntrepreneurs = entrepreneursUtilisateurs.stream()
                .map(User::getEmail).filter(Objects::nonNull).map(String::toLowerCase)
                .collect(Collectors.toSet());

        List<CandidatureRedstarter> candidaturesAccepteesProgramme = candidatureRepo
                .findAllByStatut(CandidatureRedstarter.StatutCandidature.ACCEPTE).stream()
                .filter(c -> c.getEmail() != null && emailsEntrepreneurs.contains(c.getEmail().toLowerCase()))
                .collect(Collectors.toList());

        List<CandidatureRedstarter> spontaneesAcceptees = candidatureRepo
                .findSpontaneesByStatut(CandidatureRedstarter.StatutCandidature.ACCEPTE);

        Set<CandidatureRedstarter> candidaturesCombine = new HashSet<>(candidaturesAccepteesProgramme);
        candidaturesCombine.addAll(spontaneesAcceptees);

        Set<Long> coachCandidatureIds = candidatureRepo
                .findAcceptedCoaches(CandidatureRedstarter.StatutCandidature.ACCEPTE)
                .stream().map(CandidatureRedstarter::getId).collect(Collectors.toSet());

        List<Map<String, Object>> entrepreneursList = candidaturesCombine.stream()
                .filter(c -> !coachCandidatureIds.contains(c.getId()))
                // Exclure ceux qui ont un coaching ACTIF (VALIDE) pour CETTE thématique spécifique.
                // Un entrepreneur peut être matché dans plusieurs thématiques différentes.
                .filter(c -> !matchingRepo.isEntrepreneurActivelyMatchedForThematique(c.getId(), thematiqueId))
                .map(c -> {
                    Map<String, Object> e = new LinkedHashMap<>();
                    e.put("id", c.getId());
                    e.put("nom", c.getNomPrenom());
                    e.put("email", c.getEmail());
                    e.put("telephone", c.getNumeroTelephone());
                    e.put("entreprise", c.getNomEntreprise());
                    e.put("secteur", c.getEntrepriseEst());
                    e.put("phaseMaturite", c.getPhaseMaturite());
                    e.put("description", c.getBreveDescription());
                    e.put("region", c.getRegionBasee());
                    e.put("besoinsAccompagnement", c.getBesoinsAccompagnement());
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

        // Résumé retourné au frontend
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("matchingId", matching.getId());
        result.put("sessionId", session.getId());
        result.put("entrepreneurId", entrepreneurId);
        result.put("coachId", coachId);
        result.put("statut", "VALIDE");
        candidatureRepo.findById(entrepreneurId).ifPresent(c -> result.put("entrepreneurNom", c.getNomPrenom()));
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
        
        candidatureRepo.findById(matching.getEntrepreneurId()).ifPresent(c -> result.put("entrepreneurNom", c.getNomPrenom()));
        userRepo.findById(matching.getCoachId()).ifPresent(c -> result.put("coachNom", c.getFirstName() + " " + c.getLastName()));

        return result;
    }

    // ─── Notification Helper ─────────────────────────────────────

    private void sendMatchingNotifications(Matching m) {
        try {
            // Resolve coach name
            User coach = userRepo.findById(m.getCoachId()).orElse(null);
            String coachName = coach != null ? (coach.getFirstName() + " " + coach.getLastName()) : "Coach";

            // Resolve entrepreneur name and User ID via candidature email
            String entrepreneurName = "Entrepreneur";
            Long entrepreneurUserId = null;
            CandidatureRedstarter cand = candidatureRepo.findById(m.getEntrepreneurId()).orElse(null);
            if (cand != null) {
                entrepreneurName = cand.getNomPrenom() != null ? cand.getNomPrenom() : "Entrepreneur";
                if (cand.getEmail() != null) {
                    User entUser = userRepo.findByEmail(cand.getEmail());
                    if (entUser != null) entrepreneurUserId = entUser.getId();
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

            try (PDDocument document = PDDocument.load(file)) {
                PDFTextStripper stripper = new PDFTextStripper();
                String text = stripper.getText(document);
                return (text != null && !text.trim().isEmpty()) ? text.trim() : null;
            }
        } catch (Exception e) {
            log.warn("Impossible de lire le document PDF {}: {}", filename, e.getMessage());
        }
        return null;
    }

   
    public List<Map<String, Object>> getCoachesForEntrepreneur(Long entrepreneurUserId) {
        User entrepreneur = userRepo.findById(entrepreneurUserId)
                .orElseThrow(() -> new RuntimeException("Entrepreneur non trouvé : " + entrepreneurUserId));

        String email = entrepreneur.getEmail();
        if (email == null) return Collections.emptyList();

        // Find candidature(s) by email to get the candidature ID used in matchings
        List<CandidatureRedstarter> candidatures = candidatureRepo.findByEmail(email);

        List<Map<String, Object>> result = new ArrayList<>();
        Set<Long> seenCoachIds = new HashSet<>();

        // Search matchings via candidature IDs
        for (CandidatureRedstarter cand : candidatures) {
            List<Matching> matchings = matchingRepo.findByEntrepreneurIdAndStatut(
                    cand.getId(), Matching.StatutMatching.VALIDE);

            for (Matching m : matchings) {
                if (!seenCoachIds.add(m.getCoachId())) continue;
                buildCoachView(m, result);
            }
        }

        // Remove the fallback that uses entrepreneurUserId against matching.entrepreneurId.
        // matching.entrepreneurId always stores the Candidature ID. Matching against User ID
        // can return another user's coach if their Candidature ID happens to equal this User ID.
        /*
        List<Matching> directMatchings = matchingRepo.findByEntrepreneurIdAndStatut(
                entrepreneurUserId, Matching.StatutMatching.VALIDE);
        for (Matching m : directMatchings) {
            if (!seenCoachIds.add(m.getCoachId())) continue;
            buildCoachView(m, result);
        }
        */

        return result;
    }

    private void buildCoachView(Matching m, List<Map<String, Object>> result) {
        userRepo.findById(m.getCoachId()).ifPresent(coach -> {
            Map<String, Object> view = new LinkedHashMap<>();
            view.put("id", String.valueOf(coach.getId()));
            view.put("nom", ((coach.getFirstName() != null ? coach.getFirstName() : "") + " " +
                    (coach.getLastName() != null ? coach.getLastName() : "")).trim());
            view.put("specialite", coach.getExpertise());
            view.put("sector", coach.getSecteur());
            view.put("programmeId", String.valueOf(m.getProgrammeId()));

            programmeRepo.findById(m.getProgrammeId()).ifPresent(p ->
                    view.put("programmeName", p.getNom()));

            view.put("scoreMatching", m.getScoreIa() != null ? m.getScoreIa() : 0);
            view.put("justificationMatching", m.getJustification());
            view.put("pointsForts", m.getPointsForts());
            view.put("recommandationSession1", m.getRecommandationSession1());

            result.add(view);
        });
    }
}
