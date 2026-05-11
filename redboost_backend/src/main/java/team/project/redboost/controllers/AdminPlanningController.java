package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import team.project.redboost.entities.Role;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.UserRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AdminPlanningController
 *
 * Lit les données réelles de sessions (table "sessions") réservées par les entrepreneurs
 * et les regroupe par coach pour la vue Planning de l'admin.
 *
 * Endpoints:
 *   GET /api/admin/planning/overview          → stats globales
 *   GET /api/admin/planning/coaches           → liste des coachs avec leurs sessions
 *   GET /api/admin/planning/coaches/{id}/sessions → sessions d'un coach
 *   GET /api/admin/planning/entrepreneurs     → liste des entrepreneurs avec leurs sessions
 *   GET /api/admin/planning/sessions          → toutes les sessions (brut)
 */
@RestController
@RequestMapping("/api/admin/planning")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AdminPlanningController {

    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    // ─── 1. OVERVIEW ──────────────────────────────────────────────────────────

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        Map<String, Object> overview = new HashMap<>();

        try {
            // Count coaches
            long totalCoaches = userRepository.countByRole(Role.COACH);
            long totalEntrepreneurs = userRepository.countByRole(Role.ENTREPRENEUR);

            // Count sessions via native query (table name may vary)
            long totalSessions = countSessions();
            long sessionsThisWeek = countSessionsThisWeek();

            overview.put("totalCoaches", totalCoaches);
            overview.put("totalEntrepreneurs", totalEntrepreneurs);
            overview.put("totalSessions", totalSessions);
            overview.put("sessionsThisWeek", sessionsThisWeek);
            overview.put("pendingTodos", 0);
            overview.put("pendingLivrables", 0);

        } catch (Exception e) {
            log.warn("Error computing overview stats: {}", e.getMessage());
            overview.put("totalCoaches", userRepository.countByRole(Role.COACH));
            overview.put("totalEntrepreneurs", userRepository.countByRole(Role.ENTREPRENEUR));
            overview.put("totalSessions", 0);
            overview.put("sessionsThisWeek", 0);
            overview.put("pendingTodos", 0);
            overview.put("pendingLivrables", 0);
        }

        return ResponseEntity.ok(overview);
    }

    // ─── 2. COACHES WITH SESSIONS ────────────────────────────────────────────

    @GetMapping("/coaches")
    public ResponseEntity<List<Map<String, Object>>> getCoachPlannings(
            @RequestParam(required = false) String search) {

        List<User> coaches = userRepository.findByRole(Role.COACH);

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            coaches = coaches.stream()
                    .filter(c -> (c.getFirstName() + " " + c.getLastName()).toLowerCase().contains(q)
                            || c.getEmail().toLowerCase().contains(q))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> result = coaches.stream().map(coach -> {
            List<Map<String, Object>> sessions = getSessionsForCoach(coach.getId());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", String.valueOf(coach.getId()));
            item.put("coachId", String.valueOf(coach.getId()));
            item.put("coachName", coach.getFirstName() + " " + coach.getLastName());
            item.put("email", coach.getEmail());
            item.put("specialty", coach.getExpertise());
            item.put("sessions", sessions);
            item.put("totalSessions", sessions.size());
            item.put("upcomingSessions", sessions.stream()
                    .filter(s -> isUpcoming(s)).count());
            item.put("completedSessions", sessions.stream()
                    .filter(s -> "REALISEE".equals(s.get("statut")) || "TERMINE".equals(s.get("statut"))).count());
            item.put("expanded", false);
            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ─── 3. SESSIONS FOR A SPECIFIC COACH ────────────────────────────────────

    @GetMapping("/coaches/{coachId}/sessions")
    public ResponseEntity<List<Map<String, Object>>> getCoachSessions(@PathVariable String coachId) {
        try {
            Long id = Long.parseLong(coachId);
            return ResponseEntity.ok(getSessionsForCoach(id));
        } catch (Exception e) {
            log.warn("Error loading sessions for coach {}: {}", coachId, e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    // ─── 4. ENTREPRENEURS WITH SESSIONS ──────────────────────────────────────

    @GetMapping("/entrepreneurs")
    public ResponseEntity<List<Map<String, Object>>> getEntrepreneurPlannings(
            @RequestParam(required = false) String search) {

        List<User> entrepreneurs = userRepository.findByRole(Role.ENTREPRENEUR);

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            entrepreneurs = entrepreneurs.stream()
                    .filter(e -> (e.getFirstName() + " " + e.getLastName()).toLowerCase().contains(q)
                            || e.getEmail().toLowerCase().contains(q))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> result = entrepreneurs.stream().map(ent -> {
                    List<Map<String, Object>> sessions = getSessionsForEntrepreneur(ent.getId());
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", String.valueOf(ent.getId()));
                    item.put("entrepreneurId", String.valueOf(ent.getId()));
                    item.put("entrepreneurName", ent.getFirstName() + " " + ent.getLastName());
                    item.put("email", ent.getEmail());
                    item.put("sessions", sessions);
                    item.put("totalSessions", sessions.size());
                    item.put("upcomingSessions", sessions.stream().filter(s -> isUpcoming(s)).count());
                    item.put("expanded", false);

                    // Find the coach from the first session
                    if (!sessions.isEmpty() && sessions.get(0).get("coachId") != null) {
                        item.put("coachId", sessions.get(0).get("coachId"));
                        item.put("coachName", sessions.get(0).get("coachName"));
                    }
                    return item;
                }).filter(item -> (Long) item.get("totalSessions") > 0)
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ─── 5. SESSIONS FOR A SPECIFIC ENTREPRENEUR ─────────────────────────────

    @GetMapping("/entrepreneurs/{entrepreneurId}/sessions")
    public ResponseEntity<List<Map<String, Object>>> getEntrepreneurSessions(
            @PathVariable String entrepreneurId) {
        try {
            Long id = Long.parseLong(entrepreneurId);
            return ResponseEntity.ok(getSessionsForEntrepreneur(id));
        } catch (Exception e) {
            log.warn("Error loading sessions for entrepreneur {}: {}", entrepreneurId, e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    // ─── 6. ALL SESSIONS ─────────────────────────────────────────────────────

    @GetMapping("/sessions")
    public ResponseEntity<List<Map<String, Object>>> getAllSessions() {
        return ResponseEntity.ok(loadAllSessions());
    }

    // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────

    /**
     * Charge les sessions d'un coach depuis la base.
     * Essaie d'abord la table "sessions" (entité Session), puis "session_coach" (créneaux).
     */
    private List<Map<String, Object>> getSessionsForCoach(Long coachId) {
        List<Map<String, Object>> sessions = new ArrayList<>();

        // --- Approach 1: table "sessions" (réservations entrepreneur) ---
        try {
            String sql = "SELECT s.id, s.titre, s.date, s.duree_minutes, s.statut, s.google_meet_link, s.type_session, s.adresse, s.notes_coach, " +
                    "s.entrepreneur_id, s.programme_id, NULL as thematique_id, " +
                    "u.first_name, u.last_name, u.email " +
                    "FROM sessions s " +
                    "LEFT JOIN user u ON u.id = s.entrepreneur_id " +
                    "WHERE s.coach_id = :coachId " +
                    "ORDER BY s.date DESC";

            Query q = entityManager.createNativeQuery(sql);
            q.setParameter("coachId", coachId);

            @SuppressWarnings("unchecked")
            List<Object[]> rows = q.getResultList();

            for (Object[] row : rows) {
                sessions.add(mapSessionRow(row, coachId));
            }
        } catch (Exception e) {
            log.debug("Table 'sessions' query failed for coachId {}: {}", coachId, e.getMessage());
        }

        // --- Approach 2: table "session_coach" (disponibilités réservées) ---
        if (sessions.isEmpty()) {
            try {
                String sql2 = "SELECT sc.id, sc.titre, sc.date_session, sc.heure_debut, sc.heure_fin, " +
                        "sc.type_session, NULL as statut, NULL as meet_link, NULL as adresse, NULL as notes_coach, " +
                        "b.entrepreneur_id, NULL as programme_id, NULL as thematique_id, " +
                        "u.first_name, u.last_name, u.email " +
                        "FROM session_coach sc " +
                        "LEFT JOIN session_booking b ON b.session_coach_id = sc.id " +
                        "LEFT JOIN user u ON u.id = b.entrepreneur_id " +
                        "WHERE sc.coach_id = :coachId " +
                        "ORDER BY sc.date_session DESC";

                Query q2 = entityManager.createNativeQuery(sql2);
                q2.setParameter("coachId", coachId);

                @SuppressWarnings("unchecked")
                List<Object[]> rows2 = q2.getResultList();

                for (Object[] row : rows2) {
                    sessions.add(mapSessionRow(row, coachId));
                }
            } catch (Exception e2) {
                log.debug("Table 'session_coach' query also failed for coachId {}: {}", coachId, e2.getMessage());
            }
        }

        // If still empty, build from bookings joined to disponibilites
        if (sessions.isEmpty()) {
            sessions = loadSessionsViaBookings(coachId, null);
        }

        return sessions;
    }

    /**
     * Charge les sessions d'un entrepreneur.
     */
    private List<Map<String, Object>> getSessionsForEntrepreneur(Long entrepreneurId) {
        List<Map<String, Object>> sessions = new ArrayList<>();

        try {
            String sql = "SELECT s.id, s.titre, s.date, s.duree_minutes, s.statut, s.google_meet_link, s.type_session, s.adresse, s.notes_coach, " +
                    "s.entrepreneur_id, s.programme_id, NULL as thematique_id, " +
                    "uc.first_name, uc.last_name, uc.email, s.coach_id " +
                    "FROM sessions s " +
                    "LEFT JOIN user uc ON uc.id = s.coach_id " +
                    "WHERE s.entrepreneur_id = :entrepreneurId " +
                    "ORDER BY s.date DESC";

            Query q = entityManager.createNativeQuery(sql);
            q.setParameter("entrepreneurId", entrepreneurId);

            @SuppressWarnings("unchecked")
            List<Object[]> rows = q.getResultList();

            for (Object[] row : rows) {
                Map<String, Object> s = new LinkedHashMap<>();
                s.put("id", safeStr(row[0]));
                s.put("titre", safeStr(row[1]));
                s.put("date", toDateString(row[2], null));
                s.put("statut", safeStr(row[4]));
                s.put("meetLink", safeStr(row[5]));
                s.put("typeSession", safeStr(row[6]));
                s.put("lieu", safeStr(row[7]));
                s.put("notesCoach", safeStr(row[8]));
                s.put("entrepreneurId", safeStr(entrepreneurId));

                // Coach info
                String coachId = safeStr(row.length > 15 ? row[15] : null);
                s.put("coachId", coachId);
                s.put("coachName", trim(safeStr(row[12])) + " " + trim(safeStr(row[13])));
                s.put("coachEmail", safeStr(row[14]));

                sessions.add(s);
            }
        } catch (Exception e) {
            log.debug("sessions table query failed for entrepreneur {}: {}", entrepreneurId, e.getMessage());
        }

        // Fallback via bookings
        if (sessions.isEmpty()) {
            sessions = loadSessionsViaBookings(null, entrepreneurId);
        }

        return sessions;
    }

    /**
     * Fallback: charge les sessions via la table de réservations (session_booking / reservations).
     */
    private List<Map<String, Object>> loadSessionsViaBookings(Long coachId, Long entrepreneurId) {
        List<Map<String, Object>> sessions = new ArrayList<>();

        String[] bookingTables = {"session_booking", "reservations", "bookings"};
        String[] sessionTables = {"session_coach", "disponibilite_coach", "disponibilites"};

        for (String bookTable : bookingTables) {
            for (String sessTable : sessionTables) {
                try {
                    String whereClause = coachId != null
                            ? "WHERE sc.coach_id = " + coachId
                            : "WHERE b.entrepreneur_id = " + entrepreneurId;

                    String sql = "SELECT sc.id, sc.titre, sc.date_session, sc.heure_debut, sc.heure_fin, " +
                            "b.statut, sc.meet_link, sc.type_session, NULL, NULL, " +
                            "b.entrepreneur_id, NULL, NULL, " +
                            "ue.first_name, ue.last_name, ue.email, sc.coach_id " +
                            "FROM " + sessTable + " sc " +
                            "INNER JOIN " + bookTable + " b ON b.session_id = sc.id " +
                            "LEFT JOIN user ue ON ue.id = b.entrepreneur_id " +
                            whereClause + " ORDER BY sc.date_session DESC";

                    Query q = entityManager.createNativeQuery(sql);
                    @SuppressWarnings("unchecked")
                    List<Object[]> rows = q.getResultList();

                    for (Object[] row : rows) {
                        Map<String, Object> s = new LinkedHashMap<>();
                        s.put("id", safeStr(row[0]));
                        s.put("titre", safeStr(row[1]) != null ? safeStr(row[1]) : "Session de coaching");
                        s.put("date", toDateString(row[2], row[3]));
                        s.put("statut", safeStr(row[5]) != null ? safeStr(row[5]) : "PLANIFIEE");
                        s.put("meetLink", safeStr(row[6]));
                        s.put("typeSession", safeStr(row[7]) != null ? safeStr(row[7]) : "EN_LIGNE");
                        s.put("entrepreneurId", safeStr(row[10]));
                        s.put("entrepreneurName", trim(safeStr(row[13])) + " " + trim(safeStr(row[14])));
                        s.put("coachId", safeStr(row.length > 16 ? row[16] : coachId));
                        sessions.add(s);
                    }

                    if (!sessions.isEmpty()) return sessions;

                } catch (Exception ignored) {}
            }
        }

        return sessions;
    }

    /**
     * Charge TOUTES les sessions.
     */
    private List<Map<String, Object>> loadAllSessions() {
        List<Map<String, Object>> all = new ArrayList<>();
        try {
            String sql = "SELECT s.id, s.titre, s.date, s.duree_minutes, s.statut, s.google_meet_link, s.type_session, s.adresse, s.notes_coach, " +
                    "s.entrepreneur_id, s.coach_id, " +
                    "ue.first_name, ue.last_name, " +
                    "uc.first_name, uc.last_name " +
                    "FROM sessions s " +
                    "LEFT JOIN user ue ON ue.id = s.entrepreneur_id " +
                    "LEFT JOIN user uc ON uc.id = s.coach_id " +
                    "ORDER BY s.date DESC";

            Query q = entityManager.createNativeQuery(sql);
            @SuppressWarnings("unchecked")
            List<Object[]> rows = q.getResultList();

            for (Object[] row : rows) {
                Map<String, Object> s = new LinkedHashMap<>();
                s.put("id", safeStr(row[0]));
                s.put("titre", safeStr(row[1]));
                s.put("date", toDateString(row[2], null));
                s.put("statut", safeStr(row[4]));
                s.put("meetLink", safeStr(row[5]));
                s.put("entrepreneurId", safeStr(row[9]));
                s.put("coachId", safeStr(row[10]));
                s.put("entrepreneurName", trim(safeStr(row[11])) + " " + trim(safeStr(row[12])));
                s.put("coachName", trim(safeStr(row[13])) + " " + trim(safeStr(row[14])));
                all.add(s);
            }
        } catch (Exception e) {
            log.warn("loadAllSessions failed: {}", e.getMessage());
        }
        return all;
    }

    /**
     * Mappe une ligne SQL en Map de session (vue coach).
     */
    private Map<String, Object> mapSessionRow(Object[] row, Long coachId) {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("id", safeStr(row[0]));
        s.put("titre", safeStr(row[1]) != null ? safeStr(row[1]) : "Session de coaching");

        Object maybeTime = row[3] instanceof Number ? null : row[3];
        s.put("date", toDateString(row[2], maybeTime));

        if (row[3] instanceof Number) {
            s.put("heureDebut", toTimeString(row[2]));
            s.put("heureFin", toFinTimeString(row[2], row[3]));
        } else {
            s.put("heureDebut", safeStr(row[3]));
            s.put("heureFin", safeStr(row[4]));
        }

        s.put("statut", safeStr(row[4]) != null ? safeStr(row[4]) : "PLANIFIEE");
        s.put("meetLink", safeStr(row[5]));
        s.put("typeSession", safeStr(row[6]) != null ? safeStr(row[6]) : "EN_LIGNE");
        s.put("lieu", safeStr(row[7]));
        s.put("notesCoach", safeStr(row[8]));
        s.put("entrepreneurId", safeStr(row[9]));
        s.put("coachId", String.valueOf(coachId));

        String firstName = trim(safeStr(row[12]));
        String lastName = trim(safeStr(row[13]));
        s.put("entrepreneurName", (firstName + " " + lastName).trim());
        s.put("entrepreneurEmail", safeStr(row.length > 14 ? row[14] : null));

        userRepository.findById(coachId).ifPresent(coach -> {
            s.put("coachName", coach.getFirstName() + " " + coach.getLastName());
        });

        return s;
    }

    // ─── UTILITY ─────────────────────────────────────────────────────────────

    private long countSessions() {
        try {
            Query q = entityManager.createNativeQuery("SELECT COUNT(*) FROM sessions");
            Number n = (Number) q.getSingleResult();
            return n.longValue();
        } catch (Exception e) {
            return 0L;
        }
    }

    private long countSessionsThisWeek() {
        try {
            Query q = entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM sessions WHERE date >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
            Number n = (Number) q.getSingleResult();
            return n.longValue();
        } catch (Exception e) {
            return 0L;
        }
    }

    private boolean isUpcoming(Map<String, Object> session) {
        Object dateObj = session.get("date");
        if (dateObj == null) return false;
        try {
            LocalDateTime dt = LocalDateTime.parse(dateObj.toString().replace(" ", "T").substring(0, 19));
            return dt.isAfter(LocalDateTime.now());
        } catch (Exception e) {
            return false;
        }
    }

    private String safeStr(Object o) {
        return o != null ? o.toString() : null;
    }

    private String trim(String s) {
        return s != null ? s.trim() : "";
    }

    private String toTimeString(Object dateObj) {
        if (dateObj == null) return null;
        String d = dateObj.toString();
        if (d.contains("T") && d.length() >= 16) {
            return d.substring(11, 16);
        }
        if (d.contains(" ") && d.length() >= 16) {
            return d.substring(11, 16);
        }
        return null;
    }

    private String toFinTimeString(Object dateObj, Object durationObj) {
        if (dateObj == null || durationObj == null) return null;
        try {
            LocalDateTime start = LocalDateTime.parse(dateObj.toString().replace(" ", "T"));
            int minutes = Integer.parseInt(durationObj.toString());
            LocalDateTime end = start.plusMinutes(minutes);
            return end.toString().substring(11, 16);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Combine date + heure en ISO string "2025-05-10T14:30:00"
     */
    private String toDateString(Object dateObj, Object timeObj) {
        if (dateObj == null) return null;
        String d = dateObj.toString();

        if (d.contains("T")) {
            return d.length() >= 19 ? d.substring(0, 19) : d;
        }

        if (d.contains(" ")) {
            String datePart = d.length() >= 10 ? d.substring(0, 10) : d;
            String timePart = "00:00";
            String[] parts = d.split(" ");
            if (parts.length > 1) {
                timePart = parts[1].length() >= 5 ? parts[1].substring(0, 5) : parts[1];
            }
            return datePart + "T" + timePart + ":00";
        }

        String t = "00:00";
        if (timeObj != null) {
            String timeStr = timeObj.toString();
            t = timeStr.length() > 5 ? timeStr.substring(0, 5) : timeStr;
        }
        return d + "T" + t + ":00";
    }
}