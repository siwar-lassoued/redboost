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

        // 3. Build data for AI
        List<Map<String, Object>> coachesData = coaches.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("nom", (c.getFirstName() != null ? c.getFirstName() : "") + " " + (c.getLastName() != null ? c.getLastName() : ""));
            m.put("expertise", c.getExpertise());
            m.put("skills", c.getSkills());
            m.put("secteur", c.getSecteur());
            m.put("years_of_experience", c.getYearsOfExperience());
            m.put("bio", c.getBio());
            // Count current active matchings for this coach
            long activeCount = matchingRepo.findByCoachIdAndStatut(c.getId(), Matching.StatutMatching.VALIDE).size();
            m.put("nb_entrepreneurs_actifs", activeCount);
            return m;
        }).collect(Collectors.toList());

        List<Map<String, Object>> entrepreneursData = unmatchedCandidatures.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("nom", c.getNomPrenom());
            m.put("email", c.getEmail());
            m.put("entreprise", c.getNomEntreprise());
            m.put("secteur", c.getEntrepriseEst());
            m.put("phase_maturite", c.getPhaseMaturite());
            m.put("description", c.getBreveDescription());
            m.put("besoins_accompagnement", c.getBesoinsAccompagnement());
            m.put("innovation", c.getComposanteInnovation());
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

        String systemPrompt = "Tu es un expert RH et coach de startups. Tu effectues le matching entre des coachs et des entrepreneurs.\n" +
                thematiqueContext + "\n" +
                "Tu calcules un score de compatibilité 0-100 selon 5 critères pondérés :\n" +
                "1. Alignement thématique (30%)\n" +
                "2. Alignement sectoriel (25%)\n" +
                "3. Compétences complémentaires (20%)\n" +
                "4. Stade de maturité (15%)\n" +
                "5. Charge coach (10%) : Score = (1 - nb_entrepreneurs_actifs/5) * 100\n" +
                "Propose LE MEILLEUR coach pour chaque entrepreneur.\n" +
                "Si score < 40 → alerte SCORE_FAIBLE.\n" +
                "Si charge >= 5 → alerte COACH_SURCHARGE.\n" +
                "RÈGLE ABSOLUE : JSON valide UNIQUEMENT. Zéro texte avant ou après le JSON.";

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

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" + geminiApiKey;
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

        // 5. Parse AI response and create session + matchings
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
}
