package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.Reclamation;
import team.project.redboost.repositories.ReclamationRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reclamations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class ReclamationController {

    private final ReclamationRepository reclamationRepository;

    @GetMapping
    public ResponseEntity<List<Reclamation>> getAllReclamations() {
        return ResponseEntity.ok(reclamationRepository.findAll());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Reclamation> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Reclamation reclamation = reclamationRepository.findById(id).orElse(null);
        if (reclamation == null) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            Reclamation.StatutReclamation newStatus = Reclamation.StatutReclamation.valueOf(payload.get("status"));
            reclamation.setStatut(newStatus);
            return ResponseEntity.ok(reclamationRepository.save(reclamation));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
