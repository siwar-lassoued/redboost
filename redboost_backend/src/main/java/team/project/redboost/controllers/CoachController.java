package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.*;
import team.project.redboost.services.CoachService;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/coach")
@CrossOrigin("*")
public class CoachController {

    @Autowired
    private CoachService coachService;

    // --- DISPONIBILITE ---

    @GetMapping("/{coachId}/disponibilites")
    public ResponseEntity<List<DisponibiliteDTO>> getDisponibilites(@PathVariable Long coachId) {
        return ResponseEntity.ok(coachService.getDisponibilitesByCoach(coachId));
    }

    @PostMapping("/{coachId}/disponibilites/{thematiqueId}")
    public ResponseEntity<DisponibiliteDTO> addDisponibilite(
            @PathVariable Long coachId, 
            @PathVariable Long thematiqueId,
            @RequestParam(required = false) String couleur) {
        return ResponseEntity.status(HttpStatus.CREATED).body(coachService.addDisponibilite(coachId, thematiqueId, couleur));
    }

    @DeleteMapping("/disponibilites/{id}")
    public ResponseEntity<Void> deleteDisponibilite(@PathVariable Long id) {
        coachService.deleteDisponibilite(id);
        return ResponseEntity.noContent().build();
    }
    @PutMapping("/disponibilites/{id}/thematique/{thematiqueId}")
    public ResponseEntity<DisponibiliteDTO> updateDisponibilite(
            @PathVariable Long id,
            @PathVariable Long thematiqueId) {
        return ResponseEntity.ok(coachService.updateDisponibilite(id, thematiqueId));
    }

    // --- SESSION COACH ---

    @GetMapping("/disponibilites/{dispoId}/sessions")
    public ResponseEntity<List<SessionCoachDTO>> getSessionsByDisponibilite(@PathVariable Long dispoId) {
        return ResponseEntity.ok(coachService.getSessionsByDisponibilite(dispoId));
    }

    @GetMapping("/{coachId}/sessions")
    public ResponseEntity<List<SessionCoachDTO>> getAllSessionsByCoach(@PathVariable Long coachId) {
        return ResponseEntity.ok(coachService.getSessionsByCoach(coachId));
    }

    @PostMapping("/disponibilites/{dispoId}/sessions")
    public ResponseEntity<SessionCoachDTO> addSession(
            @PathVariable Long dispoId, 
            @RequestBody SessionCoachDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(coachService.addSession(dispoId, dto));
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        coachService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }
    @PutMapping("/sessions/{id}")
    public ResponseEntity<SessionCoachDTO> updateSession(
            @PathVariable Long id,
            @RequestBody SessionCoachDTO dto) {
        return ResponseEntity.ok(coachService.updateSession(id, dto));
    }


    // --- SEANCE EXCEPTIONNELLE ---

    @GetMapping("/{coachId}/seances-exceptionnelles")
    public ResponseEntity<List<SeanceExceptionnelleDTO>> getSeancesExceptionnelles(@PathVariable Long coachId) {
        return ResponseEntity.ok(coachService.getSeancesExceptionnellesByCoach(coachId));
    }

    @PostMapping("/{coachId}/seances-exceptionnelles/{entrepreneurId}")
    public ResponseEntity<SeanceExceptionnelleDTO> addSeanceExceptionnelle(
            @PathVariable Long coachId, 
            @PathVariable Long entrepreneurId, 
            @RequestBody SeanceExceptionnelleDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(coachService.addSeanceExceptionnelle(coachId, entrepreneurId, dto));
    }

    // --- RECLAMATION ---

    @GetMapping("/{coachId}/reclamations")
    public ResponseEntity<List<ReclamationDTO>> getReclamations(@PathVariable Long coachId) {
        return ResponseEntity.ok(coachService.getReclamationsByCoach(coachId));
    }

    @PostMapping(value = "/{coachId}/reclamations/{entrepreneurId}", consumes = {"multipart/form-data"})
    public ResponseEntity<ReclamationDTO> addReclamation(
            @PathVariable Long coachId, 
            @PathVariable Long entrepreneurId, 
            @RequestPart("reclamation") ReclamationDTO dto,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(coachService.addReclamation(coachId, entrepreneurId, dto, file));
    }

    // --- DASHBOARD OVERVIEW ---

    @GetMapping("/{coachId}/dashboard-stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(@PathVariable Long coachId) {
        return ResponseEntity.ok(coachService.getDashboardStats(coachId));
    }

    @GetMapping("/{coachId}/entrepreneurs")
    public ResponseEntity<List<CoachEntrepreneurDTO>> getCoachEntrepreneurs(@PathVariable Long coachId) {
        return ResponseEntity.ok(coachService.getCoachEntrepreneurs(coachId));
    }

    @GetMapping("/{coachId}/matched-entrepreneurs")
    public ResponseEntity<List<java.util.Map<String, Object>>> getMatchedEntrepreneursGrouped(@PathVariable Long coachId) {
        return ResponseEntity.ok(coachService.getMatchedEntrepreneursGroupedByThematique(coachId));
    }

    @GetMapping("/{coachId}/calendar-events")
    public ResponseEntity<List<CoachCalendarEventDTO>> getCalendarEvents(@PathVariable Long coachId) {
        return ResponseEntity.ok(coachService.getCalendarEvents(coachId));
    }


    @GetMapping("/{coachId}/upcoming-sessions")
    public ResponseEntity<List<UpcomingSessionDTO>> getUpcomingSessions(@PathVariable Long coachId) {
        return ResponseEntity.ok(coachService.getUpcomingSessions(coachId));
    }
    @GetMapping("/{coachId}/dashboard-overview")
    public ResponseEntity<CoachDashboardOverviewDTO> getDashboardOverview(@PathVariable Long coachId) {
        return ResponseEntity.ok(coachService.getDashboardOverview(coachId));
    }
    @GetMapping("/{coachId}/entrepreneurs/{entrepreneurId}/details")
    public ResponseEntity<CoachEntrepreneurDetailDTO> getEntrepreneurDetail(
            @PathVariable Long coachId, 
            @PathVariable Long entrepreneurId) {
        return ResponseEntity.ok(coachService.getEntrepreneurDetail(coachId, entrepreneurId));
    }

    @GetMapping("/{coachId}/programmes")
    public ResponseEntity<List<ProgrammeDTO>> getCoachProgrammes(@PathVariable Long coachId) {
        return ResponseEntity.ok(coachService.getCoachProgrammes(coachId));
    }

    // --- BOOKING (Entrepreneur) ---

    @DeleteMapping("/sessions/{sessionCoachId}/book")
    public ResponseEntity<Void> cancelBooking(
            @PathVariable Long sessionCoachId,
            @RequestParam Long entrepreneurId) {
        coachService.cancelBooking(sessionCoachId, entrepreneurId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sessions/{sessionCoachId}/book")
    public ResponseEntity<?> bookSession(
            @PathVariable Long sessionCoachId,
            @RequestParam Long entrepreneurId,
            @RequestParam(required = false) String notes) {
        try {
            return ResponseEntity.ok(coachService.bookSession(sessionCoachId, entrepreneurId, notes));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/sessions/{sessionId}/reschedule")
    public ResponseEntity<?> rescheduleSession(
            @PathVariable String sessionId,
            @RequestParam String newDate,
            @RequestParam Long entrepreneurId) {
        try {
            java.time.LocalDateTime dt = java.time.LocalDateTime.parse(newDate);
            return ResponseEntity.ok(coachService.rescheduleSession(sessionId, dt, entrepreneurId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/sessions/{sessionCoachId}/bookings")
    public ResponseEntity<?> getSessionBookings(@PathVariable Long sessionCoachId) {
        return ResponseEntity.ok(coachService.getSessionBookings(sessionCoachId));
    }

    @GetMapping("/{coachId}/available-sessions")
    public ResponseEntity<List<SessionCoachDTO>> getAvailableSessionsForEntrepreneur(
            @PathVariable Long coachId,
            @RequestParam Long entrepreneurId,
            @RequestParam(required = false) Long thematiqueId) {
        return ResponseEntity.ok(coachService.getAvailableSessionsForEntrepreneur(coachId, entrepreneurId, thematiqueId));
    }

   
    @GetMapping("/{coachId}/available-sessions-grouped")
    public ResponseEntity<List<java.util.Map<String, Object>>> getAvailableSessionsGrouped(
            @PathVariable Long coachId,
            @RequestParam Long entrepreneurId,
            @RequestParam(required = false) Long thematiqueId) {
        return ResponseEntity.ok(coachService.getAvailableSessionsGrouped(coachId, entrepreneurId, thematiqueId));
    }

    // --- PLANNING DÉTAILLÉ ---

    @GetMapping("/{coachId}/planning")
    public ResponseEntity<CoachPlanningDTO> getCoachPlanning(@PathVariable Long coachId) {
        return ResponseEntity.ok(coachService.getCoachPlanning(coachId));
    }

}
