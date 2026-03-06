// src/main/java/team/project/redboost/controllers/ProgrammeDashboardController.java
package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.dashboard.*;
import team.project.redboost.services.ProgrammeDashboardService;

import java.util.List;

@RestController
@RequestMapping("/api/backoffice/programmes/{programmeId}/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ProgrammeDashboardController {

    private final ProgrammeDashboardService dashboardService;

    /**
     * GET /api/backoffice/programmes/{programmeId}/dashboard/task-realization-by-category
     * Réalisation des tâches par catégorie de KPI
     */
    @GetMapping("/task-realization-by-category")
    public ResponseEntity<TaskRealizationByCategoryDTO> getTaskRealizationByCategory(
            @PathVariable Long programmeId) {

        TaskRealizationByCategoryDTO result = dashboardService.getTaskRealizationByCategory(programmeId);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/backoffice/programmes/{programmeId}/dashboard/global-kpi-performance
     * Performance des KPI Globaux (Taux d'atteinte par indicateur)
     */
    @GetMapping("/global-kpi-performance")
    public ResponseEntity<GlobalKpiPerformanceDTO> getGlobalKpiPerformance(
            @PathVariable Long programmeId) {

        GlobalKpiPerformanceDTO result = dashboardService.getGlobalKpiPerformance(programmeId);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/backoffice/programmes/{programmeId}/dashboard/kpi-distribution-by-category
     * Distribution des KPI par catégorie
     */
    @GetMapping("/kpi-distribution-by-category")
    public ResponseEntity<KpiDistributionByCategoryDTO> getKpiDistributionByCategory(
            @PathVariable Long programmeId) {

        KpiDistributionByCategoryDTO result = dashboardService.getKpiDistributionByCategory(programmeId);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/backoffice/programmes/{programmeId}/dashboard/kpi-evolution-by-category
     * Evolution des KPI par catégorie
     */
    @GetMapping("/kpi-evolution-by-category")
    public ResponseEntity<List<KpiEvolutionByCategoryDTO>> getKpiEvolutionByCategory(
            @PathVariable Long programmeId) {
        
        List<KpiEvolutionByCategoryDTO> result = dashboardService.getKpiEvolutionByCategory(programmeId);
        return ResponseEntity.ok(result);
    }
}
