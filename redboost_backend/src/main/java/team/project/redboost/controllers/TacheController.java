package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.Tache;
import team.project.redboost.services.TacheService;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/taches")
@RequiredArgsConstructor
public class TacheController {

    private final TacheService tacheService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(required = false) Long programmeId) {
        Map<String, Object> res = new HashMap<>();
        if (programmeId != null)
            res.put("data", tacheService.getByProgramme(programmeId));
        else
            res.put("data", tacheService.getAll());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/assignee/{assigneeId}")
    public ResponseEntity<Map<String, Object>> getByAssignee(@PathVariable Long assigneeId) {
        Map<String, Object> res = new HashMap<>();
        res.put("data", tacheService.getByAssignee(assigneeId));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/entrepreneur/{entrepreneurId}")
    public ResponseEntity<Map<String, Object>> getByEntrepreneur(
            @PathVariable Long entrepreneurId) {
        Map<String, Object> res = new HashMap<>();
        res.put("data", tacheService.getByAssignee(entrepreneurId));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/coach/{coachId}")
    public ResponseEntity<Map<String, Object>> getByCoach(@PathVariable Long coachId) {
        Map<String, Object> res = new HashMap<>();
        res.put("data", tacheService.getByCoach(coachId));
        return ResponseEntity.ok(res);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Tache t) {
        Map<String, Object> res = new HashMap<>();
        res.put("data", tacheService.create(t));
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Long id, @RequestBody Tache t) {
        Map<String, Object> res = new HashMap<>();
        res.put("data", tacheService.update(id, t));
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Tache t = tacheService.getById(id);
        t.setStatus(Tache.StatusTache.valueOf(body.get("status")));
        Map<String, Object> res = new HashMap<>();
        res.put("data", tacheService.update(id, t));
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tacheService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
