package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;

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

    @Autowired private SessionRepository sessionRepository;
    @Autowired private SessionCoachRepository sessionCoachRepository;
    @Autowired private MatchingRepository matchingRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TacheRepository tacheRepository;
    @Autowired private TacheDocumentRepository tacheDocumentRepository;
    @Autowired private DisponibiliteRepository disponibiliteRepository;
    @Autowired private ProgrammeRepository programmeRepository;
    @Autowired private ThematiqueRepository thematiqueRepository;
    @Autowired private LivrableRepository livrableRepository;
    @Autowired private CandidatureRedstarterRepository candidatureRepository;



    @PersistenceContext
    private EntityManager entityManager;
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
        // Only get coaches that have at least one valid matching
        List<Matching> allValidMatchings = matchingRepository.findAll().stream()
                .filter(m -> m.getStatut() == Matching.StatutMatching.VALIDE)
                .collect(Collectors.toList());

        Set<Long> uniqueCoachIds = allValidMatchings.stream().map(Matching::getCoachId).collect(Collectors.toSet());
        List<User> coaches = userRepository.findAllById(uniqueCoachIds);

        List<Map<String, Object>> result = coaches.stream().map(coach -> {
            Map<String, Object> coachData = new HashMap<>();
            coachData.put("id", coach.getId().toString());
            coachData.put("coachId", coach.getId());
            coachData.put("firstName", coach.getFirstName() != null ? coach.getFirstName() : "Coach");
            coachData.put("lastName", coach.getLastName() != null ? coach.getLastName() : coach.getId().toString());
            coachData.put("coachName", formatName(coach));
            coachData.put("email", coach.getEmail());
            coachData.put("specialty", "Coach");

            // List of unique programmes for this coach via matchings
            List<String> coachProgrammes = allValidMatchings.stream()
                    .filter(m -> m.getCoachId().equals(coach.getId()))
                    .map(m -> {
                        Programme p = programmeRepository.findById(m.getProgrammeId()).orElse(null);
                        return p != null ? p.getNom() : null;
                    })
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            coachData.put("programmes", coachProgrammes);

            List<Session> sessions = sessionRepository.findByCoachId(coach.getId());
            coachData.put("sessions", sessions.stream().map(this::mapSession).collect(Collectors.toList()));
            return coachData;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/entrepreneurs")
    public ResponseEntity<List<Map<String, Object>>> getAllEntrepreneursPlanning() {
        // Only get entrepreneurs that have at least one valid matching
        List<Matching> allValidMatchings = matchingRepository.findAll().stream()
                .filter(m -> m.getStatut() == Matching.StatutMatching.VALIDE)
                .collect(Collectors.toList());

        Set<Long> uniqueEntIds = allValidMatchings.stream().map(Matching::getEntrepreneurId).collect(Collectors.toSet());
        List<User> entrepreneurs = userRepository.findAllById(uniqueEntIds);

        List<Map<String, Object>> result = entrepreneurs.stream().map(ent -> {
            Map<String, Object> entData = new HashMap<>();
            entData.put("id", ent.getId().toString());
            entData.put("entrepreneurId", ent.getId());
            entData.put("firstName", ent.getFirstName() != null ? ent.getFirstName() : "Entrepreneur");
            entData.put("lastName", ent.getLastName() != null ? ent.getLastName() : ent.getId().toString());
            entData.put("entrepreneurName", formatName(ent));
            entData.put("email", ent.getEmail());

            List<Matching> entMatchings = allValidMatchings.stream()
                    .filter(m -> m.getEntrepreneurId().equals(ent.getId()))
                    .collect(Collectors.toList());

            if (!entMatchings.isEmpty()) {
                Matching m = entMatchings.get(0);
                entData.put("coachId", m.getCoachId());
                userRepository.findById(m.getCoachId()).ifPresent(c -> entData.put("coachName", formatName(c)));
                programmeRepository.findById(m.getProgrammeId()).ifPresent(p -> entData.put("programme", p.getNom()));
                
                List<String> entProgrammes = entMatchings.stream()
                        .map(match -> {
                            Programme p = programmeRepository.findById(match.getProgrammeId()).orElse(null);
                            return p != null ? p.getNom() : null;
                        })
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList());
                entData.put("programmes", entProgrammes);
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
        m.put("titre", s.getTitre() != null ? s.getTitre() : "Session");
        m.put("date", s.getDate());
        m.put("dureeMinutes", s.getDureeMinutes());
        m.put("statut", s.getStatut() != null ? s.getStatut().name() : "PLANIFIE");
        m.put("meetLink", s.getMeetLink());

        // Get Programme Name
        if (s.getProgramme() != null) {
            m.put("programmeNom", s.getProgramme().getNom());
        } else if (s.getEntrepreneur() != null) {
            matchingRepository.findByEntrepreneurIdAndStatut(s.getEntrepreneur().getId(), Matching.StatutMatching.VALIDE)
                    .stream().findFirst().ifPresent(match -> {
                        programmeRepository.findById(match.getProgrammeId()).ifPresent(p -> m.put("programmeNom", p.getNom()));
                    });
        }

        // Resolve Thematique Name
        String tName = s.getThematiqueName();
        if (tName != null && !tName.isEmpty()) {
            m.put("thematiqueNom", tName);
        } else if (s.getDisponibiliteId() != null && !s.getDisponibiliteId().isEmpty()) {
            try {
                String dId = s.getDisponibiliteId();
                if (dId.matches("\\d+")) {
                    Long slotId = Long.parseLong(dId);
                    sessionCoachRepository.findById(slotId).ifPresent(slot -> {
                        if (slot.getDisponibilite() != null && slot.getDisponibilite().getThematique() != null) {
                            m.put("thematiqueNom", slot.getDisponibilite().getThematique().getNom());
                        }
                    });
                }
            } catch (Exception ignored) {}
        }

        // Fallback for thematiqueNom
        if (m.get("thematiqueNom") == null) {
            User coach = s.getCoach();
            User ent = s.getEntrepreneur();
            if (coach != null && ent != null) {
                matchingRepository.findByCoachIdAndStatut(coach.getId(), Matching.StatutMatching.VALIDE)
                    .stream()
                    .filter(match -> match.getEntrepreneurId().equals(ent.getId()))
                    .findFirst()
                    .ifPresent(match -> {
                        thematiqueRepository.findById(match.getThematiqueId()).ifPresent(t -> m.put("thematiqueNom", t.getNom()));
                    });
            }
        }

        if (s.getCoach() != null) {
            m.put("coachId", s.getCoach().getId());
            m.put("coachName", formatName(s.getCoach()));
        }
        if (s.getEntrepreneur() != null) {
            m.put("entrepreneurId", s.getEntrepreneur().getId());
            m.put("entrepreneurName", formatName(s.getEntrepreneur()));
        }
        return m;
    }

    private String formatName(User u) {
        if (u == null) return "Utilisateur inconnu";
        String f = u.getFirstName();
        String l = u.getLastName();
        
        // Clean and combine
        String full = ((f != null ? f.trim() : "") + " " + (l != null ? l.trim() : "")).trim();
        
        if (!full.isEmpty()) return full;
        
        // Fallback to email (before @) or ID
        if (u.getEmail() != null && !u.getEmail().isEmpty()) {
            return u.getEmail().split("@")[0];
        }
        return "Utilisateur #" + u.getId();
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
                    programmeRepository.findById(match.getProgrammeId()).ifPresent(p -> dm.put("programmeNom", p.getNom()));
                    thematiqueRepository.findById(match.getThematiqueId()).ifPresent(th -> dm.put("thematiqueNom", th.getNom()));
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

    @GetMapping("/coach/{coachId}/todos")
    public ResponseEntity<List<Map<String, Object>>> getCoachTodos(@PathVariable Long coachId) {
        List<Matching> matchings = matchingRepository.findByCoachIdAndStatut(coachId, Matching.StatutMatching.VALIDE);
        List<Long> entrepreneurIds = matchings.stream().map(Matching::getEntrepreneurId).collect(Collectors.toList());

        List<Tache> tasks = entrepreneurIds.stream()
                .flatMap(id -> tacheRepository.findByResponsableId(id).stream())
                .collect(Collectors.toList());

        return ResponseEntity.ok(tasks.stream().map(this::mapTache).collect(Collectors.toList()));
    }

    @GetMapping("/coach/{coachId}/livrables")
    public ResponseEntity<List<Map<String, Object>>> getCoachLivrables(@PathVariable Long coachId) {
        List<Matching> matchings = matchingRepository.findByCoachIdAndStatut(coachId, Matching.StatutMatching.VALIDE);
        List<Long> entrepreneurIds = matchings.stream().map(Matching::getEntrepreneurId).collect(Collectors.toList());

        // 1. Documents from tasks
        List<Map<String, Object>> taskDocs = entrepreneurIds.stream()
                .flatMap(id -> tacheRepository.findByResponsableId(id).stream())
                .flatMap(t -> tacheDocumentRepository.findByTacheId(t.getId()).stream())
                .map(this::mapLivrable)
                .collect(Collectors.toList());

        // 2. Direct Livrables
        List<Livrable> coachLivrables = livrableRepository.findAll().stream()
                .filter(l -> {
                    if (l.getEntrepreneur() != null && entrepreneurIds.contains(l.getEntrepreneur().getId())) return true;
                    User coach = userRepository.findById(coachId).orElse(null);
                    return coach != null && coach.getEmail().equals(l.getCoachEmail());
                })
                .collect(Collectors.toList());
        
        List<Map<String, Object>> mappedLivrables = coachLivrables.stream().map(this::mapLivrableEntity).collect(Collectors.toList());

        List<Map<String, Object>> result = new ArrayList<>(taskDocs);
        result.addAll(mappedLivrables);
        
        result.sort((a, b) -> {
            String d1 = a.get("dateUpload") != null ? a.get("dateUpload").toString() : "";
            String d2 = b.get("dateUpload") != null ? b.get("dateUpload").toString() : "";
            return d2.compareTo(d1);
        });

        return ResponseEntity.ok(result);
    }

    @GetMapping("/entrepreneur/{entrepreneurId}")
    public ResponseEntity<?> getEntrepreneurPlanning(@PathVariable Long entrepreneurId) {
        User entrepreneur = resolveEntrepreneur(entrepreneurId);
        if (entrepreneur == null) return ResponseEntity.notFound().build();

        List<Session> sessions = sessionRepository.findByEntrepreneurId(entrepreneur.getId());
        List<Map<String, Object>> sessionList = sessions.stream().map(this::mapSession).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("entrepreneurId", entrepreneur.getId());
        result.put("entrepreneurName", entrepreneur.getFirstName() + " " + entrepreneur.getLastName());
        result.put("sessions", sessionList);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/entrepreneur/{entrepreneurId}/todos")
    public ResponseEntity<List<Map<String, Object>>> getEntrepreneurTodos(@PathVariable Long entrepreneurId) {
        User entrepreneur = resolveEntrepreneur(entrepreneurId);
        if (entrepreneur == null) return ResponseEntity.ok(new ArrayList<>());

        List<Tache> tasks = tacheRepository.findByResponsableId(entrepreneur.getId());
        return ResponseEntity.ok(tasks.stream().map(this::mapTache).collect(Collectors.toList()));
    }

    @GetMapping("/entrepreneur/{entrepreneurId}/livrables")
    public ResponseEntity<List<Map<String, Object>>> getEntrepreneurLivrables(@PathVariable Long entrepreneurId) {
        User entrepreneur = resolveEntrepreneur(entrepreneurId);
        if (entrepreneur == null) return ResponseEntity.ok(new ArrayList<>());

        // 1. Documents from tasks
        List<Map<String, Object>> taskDocs = tacheRepository.findByResponsableId(entrepreneur.getId()).stream()
                .flatMap(t -> tacheDocumentRepository.findByTacheId(t.getId()).stream())
                .map(this::mapLivrable)
                .collect(Collectors.toList());

        // 2. Direct Livrables
        List<Map<String, Object>> mappedLivrables = livrableRepository.findByEntrepreneurId(entrepreneurId).stream()
                .map(this::mapLivrableEntity)
                .collect(Collectors.toList());

        List<Map<String, Object>> result = new ArrayList<>(taskDocs);
        result.addAll(mappedLivrables);
        
        result.sort((a, b) -> {
            String d1 = a.get("dateUpload") != null ? a.get("dateUpload").toString() : "";
            String d2 = b.get("dateUpload") != null ? b.get("dateUpload").toString() : "";
            return d2.compareTo(d1);
        });

        return ResponseEntity.ok(result);
    }

    private User resolveEntrepreneur(Long entrepreneurId) {
        // Try direct User lookup
        User u = userRepository.findById(entrepreneurId).orElse(null);
        if (u != null) return u;

        // Try lookup via Candidature email
        return candidatureRepository.findById(entrepreneurId)
                .map(c -> userRepository.findByEmail(c.getEmail()))
                .orElse(null);
    }

    private Map<String, Object> mapLivrableEntity(Livrable l) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", "L" + l.getId());
        m.put("nom", l.getTitre());
        m.put("url", l.getFichierUrl());
        m.put("dateUpload", l.getDateSoumission());
        m.put("statut", l.getStatut());
        m.put("type", l.getType());
        m.put("tacheTitre", l.getTache() != null ? l.getTache().getTitre() : (l.getSessionName() != null ? "Session: " + l.getSessionName() : null));
        
        if (l.getEntrepreneur() != null) {
            m.put("entrepreneurId", l.getEntrepreneur().getId());
            m.put("entrepreneurName", formatName(l.getEntrepreneur()));
        }
        
        m.put("coachName", l.getCoachName());
        m.put("programmeNom", l.getProgrammeName() != null ? l.getProgrammeName() : (l.getProgramme() != null ? l.getProgramme().getNom() : null));
        m.put("thematiqueNom", l.getThematiqueName());
        
        return m;
    }

    /**
     * Charge les sessions d'un entrepreneur.
     */
    private List<Map<String, Object>> getSessionsForEntrepreneur(Long entrepreneurId) {
        List<Map<String, Object>> sessions = new ArrayList<>();

        try {
            String sql = "SELECT s.id, s.titre, s.date, s.duree_minutes, s.statut, s.google_meet_link, s.type_session, s.adresse, s.notes_coach, " +
                    "s.entrepreneur_id, s.programme_id, s.disponibilite_id, " +
                    "uc.first_name, uc.last_name, uc.email, s.coach_id, " +
                    "p.nom as prog_nom, th.nom as th_nom " +
                    "FROM sessions s " +
                    "LEFT JOIN user uc ON uc.id = s.coach_id " +
                    "LEFT JOIN programmes p ON p.id = s.programme_id " +
                    "LEFT JOIN session_coach sc ON sc.id = s.disponibilite_id " +
                    "LEFT JOIN disponibilites d ON d.id = sc.disponibilite_id " +
                    "LEFT JOIN thematiques_coaching th ON th.id = d.thematique_id " +
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
                
                s.put("programmeNom", safeStr(row.length > 16 ? row[16] : null));
                s.put("thematiqueNom", safeStr(row.length > 17 ? row[17] : null));

                // Coach info
                s.put("coachId", safeStr(row.length > 15 ? row[15] : null));
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