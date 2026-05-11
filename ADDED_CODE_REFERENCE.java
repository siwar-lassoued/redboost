// ============================================================================
// REFERENCE CODE - Endpoints ajoutés à AdminPlanningController.java
// ============================================================================
// Location: redboost_backend/src/main/java/.../AdminPlanningController.java
// Insert before: getCoachPlanning(@PathVariable Long coachId) method
// ============================================================================

/**
 * Vue planning de TOUS les coachs avec leurs sessions
 * 
 * GET /api/admin/planning/coaches?search=Jean
 * 
 * @param search Optional filter by coach name/email/specialty (case-insensitive)
 * @return ResponseEntity containing list of all coaches with their sessions
 */
@GetMapping("/coaches")
public ResponseEntity<?> getAllCoachesPlannings(@RequestParam(required = false) String search) {
    // Récupérer tous les coachs ayant des sessions
    List<User> coaches = userRepository.findByRole(Role.COACH);
    
    List<Map<String, Object>> coachPlannings = coaches.stream()
        .filter(coach -> search == null || 
               coach.getFirstName().toLowerCase().contains(search.toLowerCase()) ||
               coach.getLastName().toLowerCase().contains(search.toLowerCase()) ||
               (coach.getEmail() != null && coach.getEmail().toLowerCase().contains(search.toLowerCase())))
        .map(coach -> {
            Map<String, Object> coachMap = new LinkedHashMap<>();
            coachMap.put("coachId", coach.getId());
            coachMap.put("id", coach.getId());
            coachMap.put("coachName", coach.getFirstName() + " " + coach.getLastName());
            coachMap.put("email", coach.getEmail());
            
            // Sessions du coach
            List<Session> sessions = sessionRepository.findByCoachId(coach.getId());
            List<Map<String, Object>> sessionList = sessions.stream().map(s -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", s.getId());
                m.put("titre", s.getTitre());
                m.put("date", s.getDate());
                m.put("dureeMinutes", s.getDureeMinutes());
                m.put("statut", s.getStatut().name());
                m.put("meetLink", s.getMeetLink());
                m.put("description", s.getDescription());
                if (s.getEntrepreneur() != null) {
                    m.put("entrepreneurId", s.getEntrepreneur().getId());
                    m.put("entrepreneurName", s.getEntrepreneur().getFirstName() + " " + s.getEntrepreneur().getLastName());
                }
                if (s.getProgramme() != null) {
                    m.put("programmeId", s.getProgramme().getId());
                    m.put("programmeName", s.getProgramme().getNom());
                }
                return m;
            }).collect(Collectors.toList());
            
            coachMap.put("sessions", sessionList);
            coachMap.put("totalSessions", sessionList.size());
            coachMap.put("upcomingSessions", (int) sessionList.stream()
                .filter(s -> {
                    try {
                        return new Date().before((Date) s.get("date"));
                    } catch (Exception e) {
                        return false;
                    }
                }).count());
            coachMap.put("completedSessions", (int) sessionList.stream()
                .filter(s -> "REALISEE".equals(s.get("statut"))).count());
            
            return coachMap;
        })
        .collect(Collectors.toList());

    return ResponseEntity.ok(coachPlannings);
}

// ============================================================================
// SECOND ENDPOINT - Entrepreneurs
// ============================================================================

/**
 * Vue planning de TOUS les entrepreneurs avec leurs sessions
 * 
 * GET /api/admin/planning/entrepreneurs?search=Alice
 * 
 * @param search Optional filter by entrepreneur name/email (case-insensitive)
 * @return ResponseEntity containing list of all entrepreneurs with their sessions
 */
@GetMapping("/entrepreneurs")
public ResponseEntity<?> getAllEntrepreneursPlannings(@RequestParam(required = false) String search) {
    // Récupérer tous les entrepreneurs ayant des sessions
    List<User> entrepreneurs = userRepository.findByRole(Role.ENTREPRENEUR);
    
    List<Map<String, Object>> entrepreneurPlannings = entrepreneurs.stream()
        .filter(ent -> search == null || 
               ent.getFirstName().toLowerCase().contains(search.toLowerCase()) ||
               ent.getLastName().toLowerCase().contains(search.toLowerCase()) ||
               (ent.getEmail() != null && ent.getEmail().toLowerCase().contains(search.toLowerCase())))
        .map(entrepreneur -> {
            Map<String, Object> entMap = new LinkedHashMap<>();
            entMap.put("entrepreneurId", entrepreneur.getId());
            entMap.put("id", entrepreneur.getId());
            entMap.put("entrepreneurName", entrepreneur.getFirstName() + " " + entrepreneur.getLastName());
            entMap.put("email", entrepreneur.getEmail());
            
            // Sessions de l'entrepreneur
            List<Session> sessions = sessionRepository.findByEntrepreneurId(entrepreneur.getId());
            List<Map<String, Object>> sessionList = sessions.stream().map(s -> {
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
                if (s.getProgramme() != null) {
                    m.put("programmeId", s.getProgramme().getId());
                    m.put("programmeName", s.getProgramme().getNom());
                }
                return m;
            }).collect(Collectors.toList());
            
            // Récupérer le coach et programme via Matching
            List<Matching> matchings = matchingRepository.findByEntrepreneurIdAndStatut(entrepreneur.getId(), Matching.StatutMatching.VALIDE);
            if (!matchings.isEmpty()) {
                Matching matching = matchings.get(0);
                User coach = userRepository.findById(matching.getCoachId()).orElse(null);
                if (coach != null) {
                    entMap.put("coachId", coach.getId());
                    entMap.put("coachName", coach.getFirstName() + " " + coach.getLastName());
                }
            }
            
            entMap.put("sessions", sessionList);
            entMap.put("totalSessions", sessionList.size());
            entMap.put("upcomingSessions", (int) sessionList.stream()
                .filter(s -> {
                    try {
                        return new Date().before((Date) s.get("date"));
                    } catch (Exception e) {
                        return false;
                    }
                }).count());
            
            return entMap;
        })
        .collect(Collectors.toList());

    return ResponseEntity.ok(entrepreneurPlannings);
}

// ============================================================================
// END OF ADDED CODE
// ============================================================================

// NOTES:
// ------
// 1. Both methods are already annotated with @PreAuthorize at class level
// 2. Requires imports (already present in file):
//    - import team.project.redboost.entities.*;
//    - import team.project.redboost.repositories.*;
//    - import java.util.*;
//    - import java.util.stream.Collectors;
//
// 3. Response Format:
//    Coaches: {coachId, id, coachName, email, sessions[], totalSessions, upcomingSessions, completedSessions}
//    Entrepreneurs: {entrepreneurId, id, entrepreneurName, email, sessions[], totalSessions, upcomingSessions, coachId, coachName}
//
// 4. Sessions in response contain: id, titre, date, dureeMinutes, statut, meetLink, [coachName|entrepreneurName], programmeName
//
// 5. Search filter is case-insensitive and searches firstName, lastName, and email
