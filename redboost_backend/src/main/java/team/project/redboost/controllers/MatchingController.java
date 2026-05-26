package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.MatchingSession;
import team.project.redboost.services.MatchingIaService;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingIaService matchingService;

    @PostMapping("/run/{programmeId}")
    public ResponseEntity<MatchingSession> runMatchingIA(
            @PathVariable Long programmeId,
            @RequestParam(required = false) Long thematiqueId) {
        return ResponseEntity.ok(matchingService.runMatchingIA(programmeId, thematiqueId));
    }

    @PostMapping("/session/{sessionId}/validate")
    public ResponseEntity<Void> validateSession(
            @PathVariable Long sessionId,
            @RequestParam Long adminId) {
        matchingService.validateSession(sessionId, adminId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/validate/single/{matchingId}")
    public ResponseEntity<Void> validateSingleMatching(
            @PathVariable Long matchingId,
            @RequestParam Long adminId) {
        matchingService.validateSingleMatching(matchingId, adminId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getGlobalHistory() {
        return ResponseEntity.ok(matchingService.getGlobalHistory());
    }

    @GetMapping("/history/{programmeId}")
    public ResponseEntity<List<Map<String, Object>>> getHistory(@PathVariable Long programmeId) {
        return ResponseEntity.ok(matchingService.getHistory(programmeId));
    }

    @GetMapping("/history/{programmeId}/thematique/{thematiqueId}")
    public ResponseEntity<List<Map<String, Object>>> getHistoryByThematique(
            @PathVariable Long programmeId,
            @PathVariable Long thematiqueId) {
        return ResponseEntity.ok(matchingService.getHistoryByThematique(programmeId, thematiqueId));
    }

    @GetMapping("/session/{sessionId}/details")
    public ResponseEntity<List<Map<String, Object>>> getSessionDetails(@PathVariable Long sessionId) {
        return ResponseEntity.ok(matchingService.getSessionMatchingsEnriched(sessionId));
    }

    @GetMapping("/stats/{programmeId}")
    public ResponseEntity<Map<String, Integer>> getMatchingStats(@PathVariable Long programmeId) {
        return ResponseEntity.ok(matchingService.getMatchingStats(programmeId));
    }

    @GetMapping("/manual/candidates/{programmeId}")
    public ResponseEntity<Map<String, Object>> getManualCandidates(
            @PathVariable Long programmeId,
            @RequestParam Long thematiqueId) {
        return ResponseEntity.ok(matchingService.getManualMatchingCandidates(programmeId, thematiqueId));
    }

    @PostMapping("/manual")
    public ResponseEntity<Map<String, Object>> createManualMatching(
            @RequestParam Long entrepreneurId,
            @RequestParam Long coachId,
            @RequestParam Long programmeId,
            @RequestParam Long thematiqueId,
            @RequestParam(required = false) String note) {
        return ResponseEntity.ok(matchingService.createManualMatching(entrepreneurId, coachId, programmeId, thematiqueId, note));
    }

    @PutMapping("/manual/{matchingId}")
    public ResponseEntity<Map<String, Object>> updateManualMatching(
            @PathVariable Long matchingId,
            @RequestParam(required = false) Long coachId,
            @RequestParam(required = false) Long entrepreneurId,
            @RequestParam(required = false) String note) {
        return ResponseEntity.ok(matchingService.updateManualMatching(matchingId, coachId, entrepreneurId, note));
    }

    @GetMapping("/entrepreneur/{entrepreneurId}/coaches")
    public ResponseEntity<List<Map<String, Object>>> getCoachesForEntrepreneur(
            @PathVariable Long entrepreneurId) {
        return ResponseEntity.ok(matchingService.getCoachesForEntrepreneur(entrepreneurId));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.badRequest().body(Collections.singletonMap("message", ex.getMessage()));
    }

    @DeleteMapping("/{matchingId}")
    public ResponseEntity<Void> deleteMatching(@PathVariable Long matchingId) {
    matchingService.deleteMatching(matchingId);
    return ResponseEntity.noContent().build();
}
}
