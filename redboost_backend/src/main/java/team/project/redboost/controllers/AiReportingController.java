package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.AiReporting;
import team.project.redboost.services.AiReportingService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reporting-ia")
@RequiredArgsConstructor
@CrossOrigin(origins = "https://redboost.tn")
public class AiReportingController {

    private final AiReportingService aiReportingService;

    @GetMapping
    public ResponseEntity<List<AiReporting>> getHistory(@RequestParam(required = false) Long programmeId) {
        if (programmeId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(aiReportingService.getHistory(programmeId));
    }

    @PostMapping("/generate")
    public ResponseEntity<AiReporting> generateReport(@RequestBody GenerateReportRequest request) {
        AiReporting report = aiReportingService.generate(request.programmeId(), request.dateDebut(), request.dateFin(), request.periodType());
        return ResponseEntity.ok(report);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        aiReportingService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record GenerateReportRequest(Long programmeId, LocalDate dateDebut, LocalDate dateFin, String periodType) {}
}
