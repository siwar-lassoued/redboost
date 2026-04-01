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

        // 4. Call Python AI Service
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("coaches", coachesData);
        requestBody.put("entrepreneurs", entrepreneursData);
        requestBody.put("programme", programmeData);
        requestBody.put("thematique", thematiqueData);

        String aiResponse;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/matching/run", entity, Map.class);
            aiResponse = objectMapper.writeValueAsString(response.getBody());
        } catch (Exception e) {
            log.error("AI Service call failed: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de l'appel au service IA : " + e.getMessage());
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
