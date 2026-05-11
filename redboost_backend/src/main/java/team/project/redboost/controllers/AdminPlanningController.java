package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/planning")
@CrossOrigin("*")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class AdminPlanningController {

    @Autowired private SessionRepository sessionRepository;
    @Autowired private SessionCoachRepository sessionCoachRepository;
    @Autowired private MatchingRepository matchingRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TacheRepository tacheRepository;
    @Autowired private TacheDocumentRepository tacheDocumentRepository;
    @Autowired private DisponibiliteRepository disponibiliteRepository;
    @Autowired private ProgrammeRepository programmeRepository;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getPlanningOverview() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCoaches", userRepository.countByRole(Role.COACH));
        stats.put("totalEntrepreneurs", userRepository.countByRole(Role.ENTREPRENEUR));
        stats.put("totalSessions", sessionRepository.count());
        stats.put("sessionsThisWeek", 0);
        stats.put("pendingTodos", tacheRepository.countByStatus(Tache.StatusTache.EN_COURS));
        stats.put("pendingLivrables", tacheDocumentRepository.count());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/coaches")
    public ResponseEntity<List<Map<String, Object>>> getAllCoachesPlanning() {
        List<User> coaches = userRepository.findByRole(Role.COACH);
        List<Map<String, Object>> result = coaches.stream().map(coach -> {
            Map<String, Object> coachData = new HashMap<>();
            coachData.put("id", coach.getId().toString());
            coachData.put("coachId", coach.getId());
            coachData.put("coachName", coach.getFirstName() + " " + coach.getLastName());
            coachData.put("email", coach.getEmail());
            coachData.put("specialty", "Coach");

            List<Session> sessions = sessionRepository.findByCoachId(coach.getId());
            coachData.put("sessions", sessions.stream().map(this::mapSession).collect(Collectors.toList()));
            return coachData;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/entrepreneurs")
    public ResponseEntity<List<Map<String, Object>>> getAllEntrepreneursPlanning() {
        List<User> entrepreneurs = userRepository.findByRole(Role.ENTREPRENEUR);
        List<Map<String, Object>> result = entrepreneurs.stream().map(ent -> {
            Map<String, Object> entData = new HashMap<>();
            entData.put("id", ent.getId().toString());
            entData.put("entrepreneurId", ent.getId());
            entData.put("entrepreneurName", ent.getFirstName() + " " + ent.getLastName());
            entData.put("email", ent.getEmail());

            List<Matching> matchings = matchingRepository.findByEntrepreneurIdAndStatut(ent.getId(), Matching.StatutMatching.VALIDE);
            if (!matchings.isEmpty()) {
                Matching m = matchings.get(0);
                entData.put("coachId", m.getCoachId());
                userRepository.findById(m.getCoachId()).ifPresent(c -> entData.put("coachName", c.getFirstName() + " " + c.getLastName()));
                programmeRepository.findById(m.getProgrammeId()).ifPresent(p -> entData.put("programme", p.getNom()));
            }

            List<Session> sessions = sessionRepository.findByEntrepreneurId(ent.getId());
            entData.put("sessions", sessions.stream().map(this::mapSession).collect(Collectors.toList()));
            return entData;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/todos")
    public ResponseEntity<List<Map<String, Object>>> getAllTodos() {
        List<Tache> tasks = tacheRepository.findAll();
        return ResponseEntity.ok(tasks.stream().map(this::mapTache).collect(Collectors.toList()));
    }

    @GetMapping("/livrables")
    public ResponseEntity<List<Map<String, Object>>> getAllLivrables() {
        List<TacheDocument> docs = tacheDocumentRepository.findAll();
        return ResponseEntity.ok(docs.stream().map(this::mapLivrable).collect(Collectors.toList()));
    }

    @GetMapping("/stats/sessions")
    public ResponseEntity<Map<String, Long>> getSessionStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", sessionRepository.count());
        stats.put("confirmees", sessionRepository.countByStatut(Session.Statut.CONFIRME));
        stats.put("realisees", sessionRepository.countByStatut(Session.Statut.TERMINE));
        stats.put("annulees", sessionRepository.countByStatut(Session.Statut.ANNULE));
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/todos")
    public ResponseEntity<Map<String, Long>> getTodoStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", tacheRepository.count());
        stats.put("enCours", tacheRepository.countByStatus(Tache.StatusTache.EN_COURS));
        stats.put("bloquees", tacheRepository.countByStatus(Tache.StatusTache.BLOQUE));
        stats.put("enRetard", tacheRepository.countByStatus(Tache.StatusTache.EN_RETARD));
        stats.put("terminees", tacheRepository.countByStatus(Tache.StatusTache.TERMINEE));
        return ResponseEntity.ok(stats);
    }

    private Map<String, Object> mapSession(Session s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("titre", s.getTitre());
        m.put("date", s.getDate());
        m.put("dureeMinutes", s.getDureeMinutes());
        m.put("statut", s.getStatut().name());
        m.put("meetLink", s.getMeetLink());
        if (s.getCoach() != null) {
            m.put("coachId", s.getCoach().getId());
            m.put("coachName", s.getCoach().getFirstName() + " " + s.getCoach().getLastName());
        }
        if (s.getEntrepreneur() != null) {
            m.put("entrepreneurId", s.getEntrepreneur().getId());
            m.put("entrepreneurName", s.getEntrepreneur().getFirstName() + " " + s.getEntrepreneur().getLastName());
        }
        return m;
    }

    private Map<String, Object> mapTache(Tache t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId().toString());
        m.put("titre", t.getTitre());
        m.put("description", t.getDescription());
        m.put("status", t.getStatus().name());
        m.put("priorite", t.getPriorite() != null ? t.getPriorite() : "MOYENNE");
        m.put("dateLimite", t.getDateLimite());

        User ent = userRepository.findById(t.getResponsableId()).orElse(null);
        if (ent != null) {
            m.put("entrepreneurId", ent.getId());
            m.put("entrepreneurName", ent.getFirstName() + " " + ent.getLastName());
            
            matchingRepository.findByEntrepreneurIdAndStatut(ent.getId(), Matching.StatutMatching.VALIDE).stream().findFirst().ifPresent(match -> {
                m.put("coachId", match.getCoachId());
                userRepository.findById(match.getCoachId()).ifPresent(c -> m.put("coachName", c.getFirstName() + " " + c.getLastName()));
                programmeRepository.findById(match.getProgrammeId()).ifPresent(p -> m.put("programmeName", p.getNom()));
            });
        }

        List<TacheDocument> docs = tacheDocumentRepository.findByTacheId(t.getId());
        m.put("documents", docs.stream().map(d -> {
            Map<String, Object> dm = new HashMap<>();
            dm.put("id", d.getId());
            dm.put("nom", d.getNom());
            dm.put("url", d.getCheminFichier());
            return dm;
        }).collect(Collectors.toList()));

        return m;
    }

    private Map<String, Object> mapLivrable(TacheDocument d) {
        Map<String, Object> dm = new LinkedHashMap<>();
        dm.put("id", d.getId().toString());
        dm.put("nom", d.getNom());
        dm.put("url", d.getCheminFichier());
        dm.put("dateUpload", d.getDateUpload());
        dm.put("fileSize", d.getTailleFichier());

        tacheRepository.findById(d.getTache().getId()).ifPresent(t -> {
            dm.put("tacheId", t.getId());
            dm.put("tacheTitre", t.getTitre());
            User ent = userRepository.findById(t.getResponsableId()).orElse(null);
            if (ent != null) {
                dm.put("entrepreneurId", ent.getId());
                dm.put("entrepreneurName", ent.getFirstName() + " " + ent.getLastName());
                matchingRepository.findByEntrepreneurIdAndStatut(ent.getId(), Matching.StatutMatching.VALIDE).stream().findFirst().ifPresent(match -> {
                    dm.put("coachId", match.getCoachId());
                    userRepository.findById(match.getCoachId()).ifPresent(c -> dm.put("coachName", c.getFirstName() + " " + c.getLastName()));
                });
            }
        });
        return dm;
    }

    @GetMapping("/coach/{coachId}")
    public ResponseEntity<?> getCoachPlanning(@PathVariable Long coachId) {
        User coach = userRepository.findById(coachId).orElse(null);
        if (coach == null) return ResponseEntity.notFound().build();

        List<Session> sessions = sessionRepository.findByCoachId(coachId);
        List<Map<String, Object>> sessionList = sessions.stream().map(this::mapSession).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("coachId", coachId);
        result.put("coachName", coach.getFirstName() + " " + coach.getLastName());
        result.put("sessions", sessionList);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/entrepreneur/{entrepreneurId}")
    public ResponseEntity<?> getEntrepreneurPlanning(@PathVariable Long entrepreneurId) {
        User entrepreneur = userRepository.findById(entrepreneurId).orElse(null);
        if (entrepreneur == null) return ResponseEntity.notFound().build();

        List<Session> sessions = sessionRepository.findByEntrepreneurId(entrepreneurId);
        List<Map<String, Object>> sessionList = sessions.stream().map(this::mapSession).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("entrepreneurId", entrepreneurId);
        result.put("entrepreneurName", entrepreneur.getFirstName() + " " + entrepreneur.getLastName());
        result.put("sessions", sessionList);
        return ResponseEntity.ok(result);
    }
}
