package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/planning")
@CrossOrigin("*")
public class AdminPlanningController {

    @Autowired private SessionRepository sessionRepository;
    @Autowired private SessionCoachRepository sessionCoachRepository;
    @Autowired private MatchingRepository matchingRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TacheRepository tacheRepository;
    @Autowired private TacheDocumentRepository tacheDocumentRepository;
    @Autowired private DisponibiliteRepository disponibiliteRepository;

    /**
     * Vue planning d'un coach spécifique : toutes ses sessions + entrepreneurs liés
     */
    @GetMapping("/coach/{coachId}")
    public ResponseEntity<?> getCoachPlanning(@PathVariable Long coachId) {
        User coach = userRepository.findById(coachId).orElse(null);
        if (coach == null) return ResponseEntity.notFound().build();

        // Sessions from Session entity
        List<Session> sessions = sessionRepository.findByCoachId(coachId);
        List<Map<String, Object>> sessionList = sessions.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("sessionId", s.getId());
            m.put("titre", s.getTitre());
            m.put("date", s.getDate());
            m.put("dureeMinutes", s.getDureeMinutes());
            m.put("statut", s.getStatut().name());
            m.put("meetLink", s.getMeetLink());
            m.put("bookingStatut", s.getBookingStatut() != null ? s.getBookingStatut().name() : null);
            if (s.getEntrepreneur() != null) {
                m.put("entrepreneurId", s.getEntrepreneur().getId());
                m.put("entrepreneurName", s.getEntrepreneur().getFirstName() + " " + s.getEntrepreneur().getLastName());
            }
            return m;
        }).collect(Collectors.toList());

        // SessionCoach slots
        List<SessionCoach> slots = sessionCoachRepository.findByDisponibiliteCoachId(coachId);
        List<Map<String, Object>> slotList = slots.stream().map(sc -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", sc.getId());
            m.put("titre", sc.getTitre());
            m.put("dateSession", sc.getDateSession());
            m.put("heureDebut", sc.getHeureDebut());
            m.put("heureFin", sc.getHeureFin());
            m.put("typeSession", sc.getTypeSession() != null ? sc.getTypeSession().name() : "EN_LIGNE");
            if (sc.getDisponibilite() != null && sc.getDisponibilite().getThematique() != null) {
                m.put("thematique", sc.getDisponibilite().getThematique().getNom());
            }
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("coachId", coachId);
        result.put("coachName", coach.getFirstName() + " " + coach.getLastName());
        result.put("sessions", sessionList);
        result.put("slots", slotList);
        return ResponseEntity.ok(result);
    }

    /**
     * Vue planning d'un entrepreneur : toutes ses sessions + coachs liés
     */
    @GetMapping("/entrepreneur/{entrepreneurId}")
    public ResponseEntity<?> getEntrepreneurPlanning(@PathVariable Long entrepreneurId) {
        User entrepreneur = userRepository.findById(entrepreneurId).orElse(null);
        if (entrepreneur == null) return ResponseEntity.notFound().build();

        List<Session> sessions = sessionRepository.findByEntrepreneurId(entrepreneurId);
        List<Map<String, Object>> sessionList = sessions.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("sessionId", s.getId());
            m.put("titre", s.getTitre());
            m.put("date", s.getDate());
            m.put("statut", s.getStatut().name());
            m.put("meetLink", s.getMeetLink());
            if (s.getCoach() != null) {
                m.put("coachId", s.getCoach().getId());
                m.put("coachName", s.getCoach().getFirstName() + " " + s.getCoach().getLastName());
            }
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("entrepreneurId", entrepreneurId);
        result.put("entrepreneurName", entrepreneur.getFirstName() + " " + entrepreneur.getLastName());
        result.put("sessions", sessionList);
        return ResponseEntity.ok(result);
    }

    /**
     * Vue globale : tous les matchings VALIDE + sessions cette semaine
     */
    @GetMapping("/overview")
    public ResponseEntity<?> getPlanningOverview() {
        List<Matching> activeMatchings = matchingRepository.findAllValide();

        List<Map<String, Object>> overview = activeMatchings.stream().map(m -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("matchingId", m.getId());
            entry.put("coachId", m.getCoachId());
            entry.put("entrepreneurId", m.getEntrepreneurId());
            entry.put("programmeId", m.getProgrammeId());
            entry.put("statut", m.getStatut().name());

            userRepository.findById(m.getCoachId()).ifPresent(c ->
                    entry.put("coachName", c.getFirstName() + " " + c.getLastName()));
            userRepository.findById(m.getEntrepreneurId()).ifPresent(e ->
                    entry.put("entrepreneurName", e.getFirstName() + " " + e.getLastName()));

            return entry;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(overview);
    }

    /**
     * To-Do d'un coach : tâches de ses entrepreneurs
     */
    @GetMapping("/coach/{coachId}/todos")
    public ResponseEntity<?> getCoachTodos(@PathVariable Long coachId) {
        List<Matching> matchings = matchingRepository.findByCoachIdAndStatut(coachId, Matching.StatutMatching.VALIDE);
        List<Map<String, Object>> todos = new ArrayList<>();

        for (Matching m : matchings) {
            User ent = userRepository.findById(m.getEntrepreneurId()).orElse(null);
            String entName = ent != null ? (ent.getFirstName() + " " + ent.getLastName()) : "N/A";
            List<Tache> tasks = tacheRepository.findByResponsableId(m.getEntrepreneurId());

            for (Tache t : tasks) {
                Map<String, Object> todo = new LinkedHashMap<>();
                todo.put("tacheId", t.getId());
                todo.put("titre", t.getTitre());
                todo.put("status", t.getStatus().name());
                todo.put("dateLimite", t.getDateLimite());
                todo.put("entrepreneurId", m.getEntrepreneurId());
                todo.put("entrepreneurName", entName);

                // Livrables attachés
                List<TacheDocument> docs = tacheDocumentRepository.findByTacheId(t.getId());
                List<Map<String, Object>> docList = docs.stream().map(d -> {
                    Map<String, Object> dm = new LinkedHashMap<>();
                    dm.put("id", d.getId());
                    dm.put("nom", d.getNom());
                    dm.put("url", d.getCheminFichier());
                    dm.put("dateUpload", d.getDateUpload());
                    return dm;
                }).collect(Collectors.toList());
                todo.put("documents", docList);

                todos.add(todo);
            }
        }

        return ResponseEntity.ok(todos);
    }

    /**
     * Livrables d'un coach : documents déposés par ses entrepreneurs
     */
    @GetMapping("/coach/{coachId}/livrables")
    public ResponseEntity<?> getCoachLivrables(@PathVariable Long coachId) {
        List<Matching> matchings = matchingRepository.findByCoachIdAndStatut(coachId, Matching.StatutMatching.VALIDE);
        List<Map<String, Object>> livrables = new ArrayList<>();

        for (Matching m : matchings) {
            User ent = userRepository.findById(m.getEntrepreneurId()).orElse(null);
            String entName = ent != null ? (ent.getFirstName() + " " + ent.getLastName()) : "N/A";
            List<Tache> tasks = tacheRepository.findByResponsableId(m.getEntrepreneurId());

            for (Tache t : tasks) {
                List<TacheDocument> docs = tacheDocumentRepository.findByTacheId(t.getId());
                for (TacheDocument d : docs) {
                    Map<String, Object> dm = new LinkedHashMap<>();
                    dm.put("id", d.getId());
                    dm.put("nom", d.getNom());
                    dm.put("url", d.getCheminFichier());
                    dm.put("dateUpload", d.getDateUpload());
                    dm.put("typeFichier", d.getTypeFichier());
                    dm.put("tailleFichier", d.getTailleFichier());
                    dm.put("tacheTitre", t.getTitre());
                    dm.put("entrepreneurId", m.getEntrepreneurId());
                    dm.put("entrepreneurName", entName);
                    livrables.add(dm);
                }
            }
        }

        return ResponseEntity.ok(livrables);
    }
}
