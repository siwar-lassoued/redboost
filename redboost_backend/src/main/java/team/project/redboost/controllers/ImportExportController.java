package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.dto.ExportDataRequest;
import team.project.redboost.services.ExportService;
import team.project.redboost.services.ImportService;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/templates/{templateId}")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ImportExportController {

    private final ImportService importService;
    private final ExportService exportService;

    @PostMapping("/import/excel")
    public ResponseEntity<Map<String, Object>> importExcel(
            @PathVariable Long templateId,
            @RequestParam("file") MultipartFile file) {

        log.info("Importing Excel file for template {}: {}", templateId, file.getOriginalFilename());

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("File is empty"));
        }

        // Validate file type
        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
            return ResponseEntity.badRequest().body(createErrorResponse("File must be an Excel file (.xlsx or .xls)"));
        }

        try {
            Map<String, Object> result = importService.importFromExcel(templateId, file);
            log.info("Import completed: {} successful, {} failed",
                    result.get("successfulRows"), result.get("failedRows"));
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.error("Validation error during import: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error importing Excel file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to import file: " + e.getMessage()));
        }
    }

    @PostMapping("/import/csv")
    public ResponseEntity<Map<String, Object>> importCSV(
            @PathVariable Long templateId,
            @RequestParam("file") MultipartFile file) {

        log.info("Importing CSV file for template {}: {}", templateId, file.getOriginalFilename());

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("File is empty"));
        }

        // Validate file type
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.endsWith(".csv")) {
            return ResponseEntity.badRequest().body(createErrorResponse("File must be a CSV file (.csv)"));
        }

        try {
            Map<String, Object> result = importService.importFromCSV(templateId, file);
            log.info("Import completed: {} successful, {} failed",
                    result.get("successfulRows"), result.get("failedRows"));
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.error("Validation error during import: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error importing CSV file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to import file: " + e.getMessage()));
        }
    }

    @PostMapping("/export")
    public ResponseEntity<?> export(
            @PathVariable Long templateId,
            @RequestBody ExportDataRequest request) {

        log.info("Exporting template {} as {}", templateId, request.getExportFormat());

        try {
            request.setTemplateId(templateId);

            byte[] data;
            String filename;
            String contentType;

            if ("CSV".equalsIgnoreCase(request.getExportFormat())) {
                data = exportService.exportToCSV(request);
                filename = "export_" + templateId + ".csv";
                contentType = "text/csv";
            } else {
                data = exportService.exportToExcel(request);
                filename = "export_" + templateId + ".xlsx";
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(data.length);

            log.info("Export completed successfully: {} bytes", data.length);
            return new ResponseEntity<>(data, headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            log.error("Validation error during export: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error exporting template", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to export: " + e.getMessage()));
        }
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", message);
        error.put("totalRows", 0);
        error.put("processedRows", 0);
        error.put("successfulRows", 0);
        error.put("failedRows", 0);
        error.put("errors", new String[]{message});
        return error;
    }
}