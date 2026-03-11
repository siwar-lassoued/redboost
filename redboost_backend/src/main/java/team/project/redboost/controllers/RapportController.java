package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.*;
import team.project.redboost.services.GoogleDriveService;
import team.project.redboost.services.RapportService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rapports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RapportController {

    private final RapportService rapportService;

    // Rapport endpoints
    @PostMapping
    public ResponseEntity<RapportDTO> createRapport(@RequestBody RapportDTO rapportDTO) {
        RapportDTO created = rapportService.saveRapportComplete(rapportDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RapportDTO> updateRapport(
            @PathVariable Long id,
            @RequestBody RapportDTO rapportDTO) {
        rapportDTO.setId(id);
        RapportDTO updated = rapportService.saveRapportComplete(rapportDTO);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RapportDTO> getRapportById(@PathVariable Long id) {
        RapportDTO rapport = rapportService.getRapportById(id);
        return ResponseEntity.ok(rapport);
    }

    @GetMapping("/programme/{programmeId}")
    public ResponseEntity<RapportDTO> getRapportByProgrammeId(@PathVariable Long programmeId) {
        RapportDTO rapport = rapportService.getRapportByProgrammeId(programmeId);
        return ResponseEntity.ok(rapport);
    }



    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRapport(@PathVariable Long id) {
        rapportService.deleteRapport(id);
        return ResponseEntity.noContent().build();
    }

    // ObjectifGlobal endpoints
    @PostMapping("/{rapportId}/objectifs-globaux")
    public ResponseEntity<ObjectifGlobalDTO> addObjectifGlobal(
            @PathVariable Long rapportId,
            @RequestBody ObjectifGlobalDTO dto) {
        ObjectifGlobalDTO created = rapportService.addObjectifGlobal(rapportId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/objectifs-globaux/{id}")
    public ResponseEntity<ObjectifGlobalDTO> updateObjectifGlobal(
            @PathVariable Long id,
            @RequestBody ObjectifGlobalDTO dto) {
        ObjectifGlobalDTO updated = rapportService.updateObjectifGlobal(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/objectifs-globaux/{id}")
    public ResponseEntity<Void> deleteObjectifGlobal(@PathVariable Long id) {
        rapportService.deleteObjectifGlobal(id);
        return ResponseEntity.noContent().build();
    }

    // ObjectifSpecifique endpoints
    @PostMapping("/objectifs-globaux/{objectifGlobalId}/objectifs-specifiques")
    public ResponseEntity<ObjectifSpecifiqueDTO> addObjectifSpecifique(
            @PathVariable Long objectifGlobalId,
            @RequestBody ObjectifSpecifiqueDTO dto) {
        ObjectifSpecifiqueDTO created = rapportService.addObjectifSpecifique(objectifGlobalId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/objectifs-specifiques/{id}")
    public ResponseEntity<ObjectifSpecifiqueDTO> updateObjectifSpecifique(
            @PathVariable Long id,
            @RequestBody ObjectifSpecifiqueDTO dto) {
        ObjectifSpecifiqueDTO updated = rapportService.updateObjectifSpecifique(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/objectifs-specifiques/{id}")
    public ResponseEntity<Void> deleteObjectifSpecifique(@PathVariable Long id) {
        rapportService.deleteObjectifSpecifique(id);
        return ResponseEntity.noContent().build();
    }

    // Resultat endpoints
    @PostMapping("/objectifs-specifiques/{objectifSpecifiqueId}/resultats")
    public ResponseEntity<ResultatDTO> addResultat(
            @PathVariable Long objectifSpecifiqueId,
            @RequestBody ResultatDTO dto) {
        ResultatDTO created = rapportService.addResultat(objectifSpecifiqueId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/resultats/{id}")
    public ResponseEntity<ResultatDTO> updateResultat(
            @PathVariable Long id,
            @RequestBody ResultatDTO dto) {
        ResultatDTO updated = rapportService.updateResultat(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/resultats/{id}")
    public ResponseEntity<Void> deleteResultat(@PathVariable Long id) {
        rapportService.deleteResultat(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/programme/{programmeId}/kpis")
    public ResponseEntity<List<KpiLightDTO>> getKpisForProgramme(@PathVariable Long programmeId) {
        List<KpiLightDTO> kpis = rapportService.getKpisForProgramme(programmeId);
        return ResponseEntity.ok(kpis);
    }

    @GetMapping("/{id}/export/pdf")
    public ResponseEntity<byte[]> exportRapportPdf(
            @PathVariable Long id,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        byte[] pdfBytes = rapportService.generateRapportPdf(id, startDate, endDate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        String filename = (startDate != null && endDate != null) ? "Rapport_Periodique_" + id + ".pdf" : "Rapport_Narratif_" + id + ".pdf";
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/{id}/export/expertise-france/pdf")
    public ResponseEntity<byte[]> exportRapportExpertiseFrancePdf(
            @PathVariable Long id,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        byte[] pdfBytes = rapportService.generateRapportExpertiseFrancePdf(id, startDate, endDate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        String filename = (startDate != null && endDate != null) ? "Rapport_Expertise_France_Periodique_" + id + ".pdf" : "Rapport_Expertise_France_" + id + ".pdf";
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/{id}/export/docx")
    public ResponseEntity<byte[]> exportRapportDocx(
            @PathVariable Long id,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        byte[] docxBytes = rapportService.generateRapportDocx(id, startDate, endDate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.valueOf("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
        String filename = (startDate != null && endDate != null) ? "Rapport_Periodique_" + id + ".docx" : "Rapport_Narratif_" + id + ".docx";
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(docxBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/{id}/export/expertise-france/docx")
    public ResponseEntity<byte[]> exportRapportExpertiseFranceDocx(
            @PathVariable Long id,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        byte[] docxBytes = rapportService.generateRapportExpertiseFranceDocx(id, startDate, endDate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.valueOf("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
        String filename = (startDate != null && endDate != null) ? "Rapport_Expertise_France_Periodique_" + id + ".docx" : "Rapport_Expertise_France_" + id + ".docx";
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(docxBytes, headers, HttpStatus.OK);
    }

    @PostMapping("/{id}/share/drive")
    public ResponseEntity<GoogleDriveService.DriveUploadResult> shareRapportOnDrive(
            @PathVariable Long id,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "template", defaultValue = "STANDARD") String template) {
        
        GoogleDriveService.DriveUploadResult result = rapportService.generateAndUploadRapportDocx(id, startDate, endDate, template);
        return ResponseEntity.ok(result);
    }
}