package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.Livrable;
import team.project.redboost.services.LivrableService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/livrables")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LivrableController {

    private final LivrableService livrableService;

    @GetMapping
    public ResponseEntity<List<Livrable>> getAllLivrables() {
        return ResponseEntity.ok(livrableService.getAllLivrables());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Livrable> getLivrableById(@PathVariable Long id) {
        Livrable livrable = livrableService.getLivrableById(id);
        return livrable != null ? ResponseEntity.ok(livrable) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Livrable> createLivrable(@RequestBody Livrable livrable) {
        return ResponseEntity.ok(livrableService.createLivrable(livrable));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<Livrable> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Livrable.Statut statut = Livrable.Statut.valueOf(payload.get("statut"));
        String coachComment = payload.get("coachComment");
        Livrable updated = livrableService.updateStatus(id, statut, coachComment);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLivrable(@PathVariable Long id) {
        livrableService.deleteLivrable(id);
        return ResponseEntity.noContent().build();
    }
}
