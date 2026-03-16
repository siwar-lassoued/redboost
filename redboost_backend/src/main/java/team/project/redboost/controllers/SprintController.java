package team.project.redboost.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.services.SprintService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sprints")
public class SprintController {

    private final SprintService sprintService;

    public SprintController(SprintService sprintService) {
        this.sprintService = sprintService;
    }

    @PutMapping("/reorder")
    public ResponseEntity<Void> reorderSprints(@RequestBody List<Long> sprintIds) {
        sprintService.reorderSprints(sprintIds);
        return ResponseEntity.ok().build();
    }
}