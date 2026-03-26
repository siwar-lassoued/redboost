package team.project.redboost.controllers;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.dto.CandidatureRedstarterDTO;
import team.project.redboost.entities.CandidatureLog;
import team.project.redboost.entities.CandidatureRedstarter;
import team.project.redboost.services.CandidatureRedstarterService;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidatures")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class CandidatureRedstarterController {
    
    private final CandidatureRedstarterService candidatureService;
    
    /**
     * Submit a new candidature
     * POST /api/candidatures/submit
     */
    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitCandidature(
            @Valid @ModelAttribute CandidatureRedstarterDTO candidatureDTO,
            @RequestParam(value = "documents", required = false) List<MultipartFile> documents) {
        try {
            log.info("Receiving candidature submission from: {}", candidatureDTO.getEmail());
            
            candidatureDTO.setDocuments(documents);
            CandidatureRedstarter savedCandidature = candidatureService.submitCandidature(candidatureDTO);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Candidature soumise avec succès");
            response.put("candidatureId", savedCandidature.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (IOException e) {
            log.error("Error processing file upload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Erreur lors du téléchargement des documents"));
        } catch (Exception e) {
            log.error("Error submitting candidature", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("success", false, "message", "Erreur lors de la soumission: " + e.getMessage()));
        }
    }
    
    /**
     * Get all candidatures (Admin)
     * GET /api/candidatures/admin/all
     */
    @GetMapping("/admin/all")
    public ResponseEntity<Page<CandidatureRedstarter>> getAllCandidatures(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "dateCreationCandidature") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            
            Page<CandidatureRedstarter> candidatures = candidatureService.getAllCandidatures(pageable);
            
            return ResponseEntity.ok(candidatures);
            
        } catch (Exception e) {
            log.error("Error fetching candidatures", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get candidature by ID (Admin)
     * GET /api/candidatures/admin/{id}
     */
    @GetMapping("/admin/{id}")
    public ResponseEntity<?> getCandidatureById(@PathVariable Long id) {
        try {
            CandidatureRedstarter candidature = candidatureService.getCandidatureById(id);
            return ResponseEntity.ok(candidature);
        } catch (RuntimeException e) {
            log.error("Candidature not found: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "message", "Candidature non trouvée"));
        }
    }
    
    /**
     * Get candidatures by status (Admin)
     * GET /api/candidatures/admin/status/{statut}
     */
    @GetMapping("/admin/status/{statut}")
    public ResponseEntity<Page<CandidatureRedstarter>> getCandidaturesByStatut(
            @PathVariable String statut,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            CandidatureRedstarter.StatutCandidature statutEnum = CandidatureRedstarter.StatutCandidature.valueOf(statut.toUpperCase());
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateCreationCandidature"));
            
            Page<CandidatureRedstarter> candidatures = candidatureService.getCandidaturesByStatut(statutEnum, pageable);
            
            return ResponseEntity.ok(candidatures);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid status: {}", statut);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Update candidature status (Admin)
     * PUT /api/candidatures/admin/{id}/status
     */
    @PutMapping("/admin/{id}/status")
    public ResponseEntity<?> updateCandidatureStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        
        try {
            String statutStr = request.get("statut");
            String commentaires = request.get("commentaires");
            
            CandidatureRedstarter.StatutCandidature newStatut = CandidatureRedstarter.StatutCandidature.valueOf(statutStr.toUpperCase());
            
            CandidatureRedstarter updatedCandidature = candidatureService.updateStatut(id, newStatut, commentaires);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Statut mis à jour avec succès");
            response.put("candidature", updatedCandidature);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid status value");
            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", "Statut invalide"));
        } catch (RuntimeException e) {
            log.error("Error updating candidature status", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "message", "Candidature non trouvée"));
        }
    }
    
    /**
     * Search candidatures (Admin)
     * GET /api/candidatures/admin/search
     */
    @GetMapping("/admin/search")
    public ResponseEntity<Page<CandidatureRedstarter>> searchCandidatures(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<CandidatureRedstarter> candidatures = candidatureService.searchCandidatures(query, pageable);
            
            return ResponseEntity.ok(candidatures);
            
        } catch (Exception e) {
            log.error("Error searching candidatures", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get statistics (Admin)
     * GET /api/candidatures/admin/statistics
     */
    @GetMapping("/admin/statistics")
    public ResponseEntity<Map<String, Long>> getStatistics() {
        try {
            Map<String, Long> stats = new HashMap<>();
            stats.put("total", candidatureService.getAllCandidatures(Pageable.unpaged()).getTotalElements());
            stats.put("en_attente", candidatureService.countByStatut(CandidatureRedstarter.StatutCandidature.EN_ATTENTE));
            stats.put("en_cours_evaluation", candidatureService.countByStatut(CandidatureRedstarter.StatutCandidature.EN_COURS_EVALUATION));
            stats.put("accepte", candidatureService.countByStatut(CandidatureRedstarter.StatutCandidature.ACCEPTE));
            stats.put("refuse", candidatureService.countByStatut(CandidatureRedstarter.StatutCandidature.REFUSE));
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            log.error("Error fetching statistics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Delete candidature (Admin)
     * DELETE /api/candidatures/admin/{id}
     */
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> deleteCandidature(@PathVariable Long id) {
        try {
            candidatureService.deleteCandidature(id);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Candidature supprimée avec succès"));
            
        } catch (RuntimeException e) {
            log.error("Error deleting candidature", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "message", "Candidature non trouvée"));
        }
    }
    
    /**
     * Get candidature historique logs (Admin)
     * GET /api/candidatures/{id}/historique
     */
    @GetMapping("/{id}/historique")
    public ResponseEntity<List<CandidatureLog>> getHistorique(@PathVariable Long id) {
        try {
            List<CandidatureLog> logs = candidatureService.getHistorique(id);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            log.error("Error fetching historique", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}