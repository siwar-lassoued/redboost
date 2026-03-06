package team.project.redboost.controllers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.BackofficeCategoryRequest;
import team.project.redboost.dto.BackofficeCategoryResponse;
import team.project.redboost.dto.BackofficeKpiRequest;
import team.project.redboost.dto.BackofficeKpiResponse;
import team.project.redboost.services.BackofficeCategoryService;

import java.util.List;

@RestController
@RequestMapping("/api/backoffice/categories")
public class BackofficeCategoryController {

    @Autowired private BackofficeCategoryService service;

    @GetMapping
    public List<BackofficeCategoryResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public BackofficeCategoryResponse getOne(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    public ResponseEntity<BackofficeCategoryResponse> create(@RequestBody BackofficeCategoryRequest req) {
        return new ResponseEntity<>(service.create(req), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public BackofficeCategoryResponse update(@PathVariable Long id,
                                             @RequestBody BackofficeCategoryRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{categoryId}/kpis")
    public ResponseEntity<BackofficeKpiResponse> addKpi(
            @PathVariable Long categoryId,
            @RequestBody BackofficeKpiRequest req) {
        return new ResponseEntity<>(service.addKpi(categoryId, req), HttpStatus.CREATED);
    }

    @DeleteMapping("/kpis/{kpiId}")
    public ResponseEntity<Void> deleteKpi(@PathVariable Long kpiId) {
        service.deleteKpi(kpiId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/kpis/{kpiId}")
    public ResponseEntity<BackofficeKpiResponse> updateKpi(
            @PathVariable Long kpiId,
            @RequestBody BackofficeKpiRequest req) {

        BackofficeKpiResponse updated = service.updateKpi(kpiId, req);
        return ResponseEntity.ok(updated);
    }


    @GetMapping("/kpis/{kpiId}")
    public ResponseEntity<BackofficeKpiResponse> getKpi(@PathVariable Long kpiId) {
        BackofficeKpiResponse kpi = service.getKpiById(kpiId);
        return ResponseEntity.ok(kpi);
    }
}