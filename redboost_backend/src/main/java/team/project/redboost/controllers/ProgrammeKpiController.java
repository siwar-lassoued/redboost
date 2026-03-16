// src/main/java/team/project/redboost/controllers/ProgrammeKpiController.java
package team.project.redboost.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.ProgrammeKpiHistoryResponse;
import team.project.redboost.dto.ProgrammeKpiRequest;
import team.project.redboost.dto.ProgrammeKpiResponse;
import team.project.redboost.entities.ProgrammeKpiHistory;
import team.project.redboost.entities.ProgrammeKpiValeurHistory;
import team.project.redboost.services.ProgrammeKpiService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/programmeskpi")
@RequiredArgsConstructor
public class ProgrammeKpiController {

    private final ProgrammeKpiService programmeKpiService;

    // Mettre à jour ou créer les valeurs globales d'un KPI pour un programme
    @PostMapping("/{programmeId}/kpis")
    public ResponseEntity<ProgrammeKpiResponse> updateKpiValues(
            @PathVariable Long programmeId,
            @Valid @RequestBody ProgrammeKpiRequest request) {

        ProgrammeKpiRequest safeRequest = new ProgrammeKpiRequest(
                programmeId,
                request.kpiId(),
                request.valeurPrecedente(),
                request.valeurActuelle(),
                request.valeurCible()
        );

        ProgrammeKpiResponse response = programmeKpiService.saveOrUpdate(safeRequest);
        return ResponseEntity.ok(response);
    }

    // Mettre à jour la valeur d'un entrepreneur pour un KPI spécifique
    @PutMapping("/{programmeId}/kpis/{kpiId}/entrepreneur-values")
    public ResponseEntity<Void> updateEntrepreneurValue(
            @PathVariable Long programmeId,
            @PathVariable Long kpiId,
            @RequestBody Map<String, Object> request) {

        Long userId = Long.valueOf(request.get("userId").toString());

        // Convert Object to String, handling both Integer and String inputs
        String valeurPrecedente = convertToString(request.get("valeurPrecedente"));
        String valeurActuelle = convertToString(request.get("valeurActuelle"));
        String valeurCible = convertToString(request.get("valeurCible"));

        programmeKpiService.updateEntrepreneurValue(
                programmeId,
                kpiId,
                userId,
                valeurPrecedente,
                valeurActuelle,
                valeurCible
        );

        return ResponseEntity.ok().build();
    }

    /**
     * Helper method to convert Object to String, handling null and numeric types
     */
    private String convertToString(Object value) {
        if (value == null) {
            return null;
        }
        // This handles both String and numeric types (Integer, Double, etc.)
        return value.toString();
    }
    // Récupérer tous les KPIs (valeurs actuelles) d'un programme
    @GetMapping("/{programmeId}/kpis")
    public ResponseEntity<List<ProgrammeKpiResponse>> getProgrammeKpis(@PathVariable Long programmeId) {
        List<ProgrammeKpiResponse> kpis = programmeKpiService.getKpisByProgramme(programmeId);
        return ResponseEntity.ok(kpis);
    }

    // Supprimer la valeur d'un entrepreneur pour un KPI
    @DeleteMapping("/{programmeId}/kpis/{kpiId}/entrepreneur-values/{userId}")
    public ResponseEntity<Void> deleteEntrepreneurValue(
            @PathVariable Long programmeId,
            @PathVariable Long kpiId,
            @PathVariable Long userId) {

        programmeKpiService.deleteEntrepreneurValue(programmeId, kpiId, userId);
        return ResponseEntity.noContent().build();
    }

    // === NOUVEAUX ENDPOINTS POUR L'HISTORIQUE ===

    // Récupérer l'historique des modifications des valeurs globales (précédente, actuelle, cible)
    @GetMapping("/{programmeId}/kpis/{kpiId}/history")
    public ResponseEntity<List<ProgrammeKpiHistoryResponse>> getGlobalKpiHistory(
            @PathVariable Long programmeId,
            @PathVariable Long kpiId) {

        List<ProgrammeKpiHistoryResponse> history = programmeKpiService.getKpiHistory(programmeId, kpiId);
        return ResponseEntity.ok(history);
    }

    // Récupérer l'historique des modifications de la valeur d'un entrepreneur spécifique
    @GetMapping("/{programmeId}/kpis/{kpiId}/entrepreneurs/{userId}/history")
    public ResponseEntity<List<ProgrammeKpiValeurHistory>> getEntrepreneurValueHistory(
            @PathVariable Long programmeId,
            @PathVariable Long kpiId,
            @PathVariable Long userId) {

        List<ProgrammeKpiValeurHistory> history = programmeKpiService
                .getEntrepreneurValueHistory(programmeId, kpiId, userId);
        return ResponseEntity.ok(history);
    }
}