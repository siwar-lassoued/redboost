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
        Programme programme = programmeRepo.findById(programmeId)
                .orElseThrow(() -> new RuntimeException("Programme introuvable"));

        ThematiqueCoaching thematique = null;
        if (thematiqueId != null) {
            thematique = thematiqueRepo.findById(thematiqueId).orElse(null);
        }

        // 1. Get coaches (all active coaches)
        List<User> coaches = userRepo.findAll().stream()
                .filter(u -> u.getRole() == Role.COACH && u.isActive())
                .collect(Collectors.toList());

        if (coaches.isEmpty()) {
            throw new RuntimeException("Aucun coach actif disponible");
        }

        // 2. Get accepted entrepreneurs for this programme who are NOT already matched
        List<CandidatureRedstarter> acceptedCandidatures = candidatureRepo
                .findByFormTemplateIdNotNullAndStatut(CandidatureRedstarter.StatutCandidature.ACCEPTE);

        // Filter to entrepreneurs not already matched for this programme
        List<CandidatureRedstarter> unmatchedCandidatures = acceptedCandidatures.stream()
                .filter(c -> !matchingRepo.isEntrepreneurActivelyMatched(c.getId(), programmeId))
                .collect(Collectors.toList());

        if (unmatchedCandidatures.isEmpty()) {
            throw new RuntimeException("Aucun entrepreneur non-matché à traiter pour ce programme.");
        }

        // 3. Build ENRICHED data for AI — include ALL available profile fields
        List<Map<String, Object>> coachesData = coaches.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("nom", (c.getFirstName() != null ? c.getFirstName() : "") + " " + (c.getLastName() != null ? c.getLastName() : ""));
            m.put("expertise", c.getExpertise());
            m.put("skills", c.getSkills());
            m.put("secteur", c.getSecteur());
            m.put("region", c.getRegion());
            m.put("years_of_experience", c.getYearsOfExperience());
            m.put("bio", c.getBio());
            m.put("entreprise", c.getEntreprise());
            m.put("industry", c.getIndustry());
            m.put("linkedin", c.getLinkedinUrl());
            // Academic & professional qualifications
            m.put("formation_academique", c.getFormationAcademNom());
            m.put("formation_academique_realisations", c.getFormationAcademRealisations());
            m.put("competences_pro", c.getCompetencesProNom());
            m.put("competences_pro_certificat", c.getCompetencesProCertificat());
            // Coaching track record
            m.put("nb_entrepreneurs_coaches", c.getNbEntreCoaches());
            m.put("succes_client", c.getSuccesClient());
            m.put("engagement_communautaire", c.getEngagementCommunautaire());
            // Count current active matchings for this coach
            long activeCount = matchingRepo.findByCoachIdAndStatut(c.getId(), Matching.StatutMatching.VALIDE).size();
            m.put("nb_entrepreneurs_actifs", activeCount);
            // Remove null values to keep prompt clean
            m.values().removeIf(Objects::isNull);
            return m;
        }).collect(Collectors.toList());

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
            m.put("nb_emplois_crees", c.getNombreEmploisCrees());
            m.put("a_beneficie_accompagnement", c.getBeneficieAccompagnement());
            m.put("details_accompagnement", c.getDetailsAccompagnement());
            // Include dynamicAnswers data — this is the richest source of information
            if (c.getDynamicAnswers() != null && !c.getDynamicAnswers().isEmpty()) {
                try {
                    Map<String, Object> dynRoot = objectMapper.readValue(c.getDynamicAnswers(), Map.class);
                    Object answers = dynRoot.get("answers");
                    if (answers instanceof Map) {
                        m.put("reponses_formulaire", answers);
                    } else {
                        m.put("reponses_formulaire", dynRoot);
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse dynamicAnswers for candidature {}: {}", c.getId(), e.getMessage());
                }
            }
            
            // Extract text from uploaded documents (CVs, Pitch Decks, etc.)
            if (c.getDocuments() != null && !c.getDocuments().isEmpty()) {
                List<String> extraits = new ArrayList<>();
                for (String docName : c.getDocuments()) {
                    String extracted = extractTextFromDocument(docName);
                    if (extracted != null && !extracted.isEmpty()) {
                        extraits.add("Document '" + docName + "' :\n" + extracted);
                    }
                }
                if (!extraits.isEmpty()) {
                    m.put("documents_extrait", extraits);
                }
            }

            // Remove null values to keep prompt clean
            m.values().removeIf(Objects::isNull);
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> programmeData = new LinkedHashMap<>();
        programmeData.put("id", programme.getId());
        programmeData.put("nom", programme.getNom());
        programmeData.put("description", programme.getDescription());
        programmeData.put("type", programme.getTypeProgramme());
        programmeData.put("dateDebut", programme.getDateDebut() != null ? programme.getDateDebut().toString() : null);
        programmeData.put("dateFin", programme.getDateFin() != null ? programme.getDateFin().toString() : null);

        Map<String, Object> thematiqueData = null;
        if (thematique != null) {
            thematiqueData = new LinkedHashMap<>();
            thematiqueData.put("nom", thematique.getNom());
            thematiqueData.put("description", thematique.getDescription());
            thematiqueData.put("dateDebut", thematique.getDateDebut().toString());
            thematiqueData.put("dateFin", thematique.getDateFin().toString());
        }

        // 4. Construct Prompt and Call Gemini Direct
        String thematiqueContext = "";
        if (thematique != null) {
            thematiqueContext = "THÉMATIQUE DE COACHING : " + thematique.getNom() + "\n" +
                    "Description : " + thematique.getDescription() + "\n" +
                    "Le matching doit PRIORISER les coaches dont l'expertise correspond directement à cette thématique. Le critère 'Alignement thématique' vaut 30% du score.";
        }

        String systemPrompt = "Tu es un expert RH spécialisé dans le coaching de startups en Tunisie. Tu effectues le matching entre des coachs et des entrepreneurs pour le programme RedBoost.\n" +
                thematiqueContext + "\n\n" +
                "INSTRUCTIONS IMPORTANTES :\n" +
                "- Analyse TOUS les champs fournis pour chaque profil, y compris 'reponses_formulaire' qui contient les réponses détaillées du formulaire de candidature.\n" +
                "- Si certains champs sont absents ou vides pour un coach, évalue sur la base des données DISPONIBLES et pénalise uniquement les critères où l'information est réellement manquante.\n" +
                "- Ne donne PAS un score de 0% pour un critère juste parce qu'une donnée est manquante. Utilise 50% comme valeur neutre si tu ne peux pas évaluer un critère.\n" +
                "- Exploite les descriptions, bio, compétences, succès clients, formations et certifications pour enrichir ton analyse.\n\n" +
                "Tu calcules un score de compatibilité 0-100 selon 5 critères pondérés :\n" +
                "1. Alignement thématique (30%) : Le coach a-t-il l'expertise/formation/certifications en lien avec le thème ou le secteur de l'entrepreneur ?\n" +
                "2. Alignement sectoriel (25%) : Le secteur, l'industrie ou l'expérience du coach correspondent-ils au domaine de la startup ?\n" +
                "3. Compétences complémentaires (20%) : Les compétences du coach (skills, expertise, formations) répondent-elles aux besoins d'accompagnement et de formation de l'entrepreneur ?\n" +
                "4. Stade de maturité (15%) : L'expérience du coach (nombre d'entrepreneurs coachés, années d'expérience, succès clients) est-elle adaptée à la phase de maturité de la startup ?\n" +
                "5. Charge coach (10%) : Score = max(0, (1 - nb_entrepreneurs_actifs/5)) * 100. Un coach sans charge a 100%.\n\n" +
                "Propose LE MEILLEUR coach pour chaque entrepreneur.\n" +
                "Si score < 40 → ajoute une alerte SCORE_FAIBLE avec explication.\n" +
                "Si charge >= 5 → ajoute une alerte COACH_SURCHARGE.\n" +
                "RÈGLE ABSOLUE : Retourne UNIQUEMENT du JSON valide. Zéro texte avant ou après le bloc JSON.";

        String coachesStr, entrepreneursStr;
        try {
            coachesStr = objectMapper.writeValueAsString(coachesData.subList(0, Math.min(20, coachesData.size())));
            entrepreneursStr = objectMapper.writeValueAsString(entrepreneursData.subList(0, Math.min(20, entrepreneursData.size())));
        } catch (Exception e) {
            throw new RuntimeException("Erreur de formatage JSON", e);
        }

        String userPrompt = "Programme : " + programme.getNom() + "\n" +
                "COACHES DISPONIBLES :\n" + coachesStr + "\n\n" +
                "ENTREPRENEURS :\n" + entrepreneursStr + "\n\n" +
                "Schéma attendu JSON :\n" +
                "{ \"matchings\": [ { \"entrepreneur_id\": 0, \"coach_id\": 0, \"score_final\": 0, \"scores_detail\": { \"alignement_thematique\": 0, \"alignement_sectoriel\": 0, \"competences_complementaires\": 0, \"stade_maturite\": 0, \"charge_coach\": 0 }, \"justification\": \"...\", \"points_forts\": [\"...\"], \"points_attention\": [\"...\"], \"recommandation_session_1\": \"...\" } ], \"alertes\": [] }";

        String finalPrompt = systemPrompt + "\n\n" + userPrompt;

        Map<String, Object> geminiRequest = new LinkedHashMap<>();
        Map<String, Object> part = new LinkedHashMap<>();
        part.put("text", finalPrompt);
        Map<String, Object> content = new LinkedHashMap<>();
        content.put("parts", List.of(part));
        geminiRequest.put("contents", List.of(content));

        String aiResponse = null;
        try {
            if ("unconfigured".equals(geminiApiKey) || geminiApiKey.isEmpty()) {
                throw new RuntimeException("La clé API Gemini (gemini.api.key) n'est pas configurée dans le backend.");
            }

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
                    if (!parts.isEmpty()) aiResponse = (String) parts.get(0).get("text");
                }
            }
            if (aiResponse == null) throw new RuntimeException("Réponse vide de Gemini");

            aiResponse = aiResponse.replace("```json", "").replace("```", "").trim();
        } catch (Exception e) {
            log.error("AI Service call failed: {}", e.getMessage());
            throw new RuntimeException("Erreur de l'API Gemini : " + e.getMessage());
        }

       
        try {
            Map<String, Object> responseMap = objectMapper.readValue(aiResponse, Map.class);
            List<Map<String, Object>> matchingsData = (List<Map<String, Object>>) responseMap.get("matchings");
            List<Map<String, Object>> alertesData = (List<Map<String, Object>>) responseMap.get("alertes");

            MatchingSession session = MatchingSession.builder()
                    .programmeId(programmeId)
                    .thematiqueId(thematiqueId)
                    .statut(MatchingSession.StatutSession.EN_ATTENTE)
                    .nbMatchings(matchingsData != null ? matchingsData.size() : 0)
                    .dateMatching(LocalDateTime.now())
                    .alertesJson(alertesData != null ? objectMapper.writeValueAsString(alertesData) : "[]")
                    .build();
            session = sessionRepo.save(session);

            List<Matching> createdMatchings = new ArrayList<>();
            if (matchingsData != null) {
                for (Map<String, Object> md : matchingsData) {
                    Matching matching = Matching.builder()
                            .matchingSession(session)
                            .coachId(toLong(md.get("coach_id")))
                            .entrepreneurId(toLong(md.get("entrepreneur_id")))
                            .programmeId(programmeId)
                            .thematiqueId(thematiqueId)
                            .scoreIa(toDouble(md.get("score_final")))
                            .scoresDetail(objectMapper.writeValueAsString(md.get("scores_detail")))
                            .justification((String) md.get("justification"))
                            .pointsForts(objectMapper.writeValueAsString(md.get("points_forts")))
                            .pointsAttention(objectMapper.writeValueAsString(md.get("points_attention")))
                            .recommandationSession1((String) md.get("recommandation_session_1"))
                            .statut(Matching.StatutMatching.PROPOSE)
                            .build();
                    createdMatchings.add(matchingRepo.save(matching));
                }
            }
            session.setMatchings(createdMatchings);
            return session;

        } catch (Exception e) {
            log.error("Failed to process AI Matching response: {}", e.getMessage());
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

        List<Matching> matchings = matchingRepo.findByMatchingSessionId(sessionId);
        for (Matching m : matchings) {
            m.setStatut(Matching.StatutMatching.VALIDE);
            m.setDateValidation(LocalDateTime.now());
            matchingRepo.save(m);
        }
    }

    @Transactional
    public void validateSingleMatching(Long matchingId, Long adminId) {
        Matching m = matchingRepo.findById(matchingId)
                .orElseThrow(() -> new RuntimeException("Matching introuvable"));
        m.setStatut(Matching.StatutMatching.VALIDE);
        m.setDateValidation(LocalDateTime.now());
        matchingRepo.save(m);

        MatchingSession session = m.getMatchingSession();
        if (session != null && session.getStatut() == MatchingSession.StatutSession.EN_ATTENTE) {
            session.setStatut(MatchingSession.StatutSession.VALIDE);
            session.setDateValidation(LocalDateTime.now());
            session.setValideParId(adminId);
            sessionRepo.save(session);
        }
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

            userRepo.findById(m.getCoachId()).ifPresent(c -> {
                Map<String, String> coach = new HashMap<>();
                coach.put("nom", c.getLastName());
                coach.put("prenom", c.getFirstName());
                view.put("coach", coach);
            });

            // Entrepreneur is a candidature ID
            view.put("entrepreneurId", m.getEntrepreneurId());
            candidatureRepo.findById(m.getEntrepreneurId()).ifPresent(c -> {
                Map<String, String> ent = new HashMap<>();
                ent.put("nom", c.getNomPrenom());
                view.put("entrepreneur", ent);
            });

            return view;
        }).collect(Collectors.toList());
    }

    public Map<String, Integer> getMatchingStats(Long programmeId) {
        List<Matching> active = matchingRepo.findActiveByProgramme(programmeId);

        List<CandidatureRedstarter> acceptedCandidatures = candidatureRepo
                .findByFormTemplateIdNotNullAndStatut(CandidatureRedstarter.StatutCandidature.ACCEPTE);
        long unmatchedCount = acceptedCandidatures.stream()
                .filter(c -> !matchingRepo.isEntrepreneurActivelyMatched(c.getId(), programmeId))
                .count();

        return Map.of(
                "activeCount", active.size(),
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
                ent.put("roleEntreprise", c.getRoleEntreprise());
                view.put("entrepreneur", ent);
            });

            return view;
        }).collect(Collectors.toList());
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

            // Process only PDFs to avoid binary garbage and unsupported formats crashing the stripper
            if (!filename.toLowerCase().endsWith(".pdf")) return null;

            try (PDDocument document = PDDocument.load(file)) {
                PDFTextStripper stripper = new PDFTextStripper();
                String text = stripper.getText(document);
                if (text != null && !text.trim().isEmpty()) {
                    text = text.trim();
                    // Limit characters to avoid overwhelming the LLM API token limits
                    if (text.length() > 3000) {
                        text = text.substring(0, 3000) + "\n... [Fin de l'extrait, texte tronqué]";
                    }
                    return text;
                }
            }
        } catch (Exception e) {
            log.warn("Impossible de lire le document PDF {}: {}", filename, e.getMessage());
        }
        return null;
    }
}
