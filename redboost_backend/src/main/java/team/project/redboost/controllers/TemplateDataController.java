// TemplateDataController.java
package team.project.redboost.controllers;


import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.TemplateDataRow;
import team.project.redboost.services.TemplateDataService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/templates/{templateId}/data")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TemplateDataController {
    
    private final TemplateDataService dataService;
    
    @PostMapping
    public ResponseEntity<Map<String, String>> addDataRow(
            @PathVariable Long templateId,
            @RequestBody Map<String, Object> rowData) {
        String rowId = dataService.addDataRow(templateId, rowData);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("rowId", rowId, "message", "Data added successfully"));
    }
    
    @GetMapping
    public ResponseEntity<List<TemplateDataRow>> getAllData(@PathVariable Long templateId) {
        List<TemplateDataRow> data = dataService.getAllData(templateId);
        return ResponseEntity.ok(data);
    }
    
    @GetMapping("/{rowId}")
    public ResponseEntity<TemplateDataRow> getDataRow(
            @PathVariable Long templateId,
            @PathVariable String rowId) {
        TemplateDataRow data = dataService.getDataRow(templateId, rowId);
        return ResponseEntity.ok(data);
    }
    
    @PutMapping("/{rowId}")
    public ResponseEntity<Map<String, String>> updateDataRow(
            @PathVariable Long templateId,
            @PathVariable String rowId,
            @RequestBody Map<String, Object> rowData) {
        dataService.updateDataRow(templateId, rowId, rowData);
        return ResponseEntity.ok(Map.of("message", "Data updated successfully"));
    }
    
    @DeleteMapping("/{rowId}")
    public ResponseEntity<Void> deleteDataRow(
            @PathVariable Long templateId,
            @PathVariable String rowId) {
        dataService.deleteDataRow(templateId, rowId);
        return ResponseEntity.noContent().build();
    }
}
