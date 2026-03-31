package team.project.redboost.controllers;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/selection-rounds")
@Slf4j
@CrossOrigin(origins = "*")
public class SelectionRoundController {

    @PostMapping("/advance")
    public ResponseEntity<?> advanceRound(@RequestBody Map<String, Object> request) {
        log.info("Received request to advance round: {}", request);
        // Stub implementation to prevent 404
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Le round a été clôturé avec succès (Mode Simulation)"
        ));
    }
}
