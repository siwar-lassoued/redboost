package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.Session;
import team.project.redboost.services.SessionService;
import team.project.redboost.services.SessionService.MyCalendarEvent;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll() {
        Map<String, Object> res = new HashMap<>();
        res.put("data", sessionService.getAll());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/coach/{coachId}")
    public ResponseEntity<Map<String, Object>> getByCoach(@PathVariable Long coachId) {
        Map<String, Object> res = new HashMap<>();
        res.put("data", sessionService.getByCoach(coachId));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/entrepreneur/{entrepreneurId}")
    public ResponseEntity<Map<String, Object>> getByEntrepreneur(
            @PathVariable Long entrepreneurId) {
        Map<String, Object> res = new HashMap<>();
        res.put("data", sessionService.getByEntrepreneur(entrepreneurId));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/should-rate")
    public ResponseEntity<Boolean> shouldPromptRating(
            @RequestParam Long entrepreneurId,
            @RequestParam String sessionId) {
        return ResponseEntity.ok(sessionService.shouldPromptRating(entrepreneurId, sessionId));
    }

    /**
     * Unified calendar feed for the current user.
     * GET /api/sessions/my-calendar?userId={id}&role={COACH|ENTREPRENEUR}
     */
    @GetMapping("/my-calendar")
    public ResponseEntity<List<MyCalendarEvent>> getMyCalendar(
            @RequestParam Long userId,
            @RequestParam String role) {
        return ResponseEntity.ok(sessionService.getMyCalendarSessions(userId, role));
    }

    @PostMapping
    public ResponseEntity<Session> create(@RequestBody Session s) {
        return ResponseEntity.ok(sessionService.create(s));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Session> update(@PathVariable String id, @RequestBody Session s) {
        return ResponseEntity.ok(sessionService.update(id, s));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        sessionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reschedule")
    public ResponseEntity<Void> requestReschedule(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String note = payload.get("note");
        String newDateStr = payload.get("newDate"); // Expected ISO format like '2026-05-10T10:00:00'
        
        Session s = sessionService.getById(id);
        if (note != null) {
            s.setNotesEntrepreneur(note);
        }
        if (newDateStr != null && !newDateStr.isEmpty()) {
            s.setDate(java.time.LocalDateTime.parse(newDateStr));
        }
        
        s.setStatut(Session.Statut.DEMANDE);
        sessionService.update(id, s);
        return ResponseEntity.ok().build();
    }
}
