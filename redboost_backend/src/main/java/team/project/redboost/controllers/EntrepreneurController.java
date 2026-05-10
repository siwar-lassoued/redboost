package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.dto.EntrepreneurCoachDTO;
import team.project.redboost.dto.ReclamationDTO;
import team.project.redboost.dto.ProgrammeDTO;
import team.project.redboost.dto.SessionCoachDTO;
import team.project.redboost.services.EntrepreneurService;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/entrepreneur")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EntrepreneurController {

    private final EntrepreneurService entrepreneurService;

    @GetMapping("/{entrepreneurId}/coaches")
    public ResponseEntity<List<EntrepreneurCoachDTO>> getMatchedCoaches(@PathVariable Long entrepreneurId) {
        return ResponseEntity.ok(entrepreneurService.getMatchedCoaches(entrepreneurId));
    }

    @GetMapping("/{entrepreneurId}/reclamations")
    public ResponseEntity<List<ReclamationDTO>> getReclamations(@PathVariable Long entrepreneurId) {
        return ResponseEntity.ok(entrepreneurService.getEntrepreneurReclamations(entrepreneurId));
    }

    @PostMapping("/{entrepreneurId}/reclamations/{coachId}")
    public ResponseEntity<ReclamationDTO> addReclamation(
            @PathVariable Long entrepreneurId,
            @PathVariable Long coachId,
            @RequestPart("reclamation") String reclamationJson,
            @RequestPart(value = "file", required = false) MultipartFile file) throws IOException {
        
        com.fasterxml.jackson.databind.ObjectMapper reclamationMapper = new com.fasterxml.jackson.databind.ObjectMapper();
        ReclamationDTO dto = reclamationMapper.readValue(reclamationJson, ReclamationDTO.class);
        dto.setRoleEmetteur("ENTREPRENEUR");
        return ResponseEntity.ok(entrepreneurService.addReclamation(entrepreneurId, coachId, dto, file));
    }

    @GetMapping("/{entrepreneurId}/programmes")
    public ResponseEntity<List<ProgrammeDTO>> getProgrammes(@PathVariable Long entrepreneurId) {
        return ResponseEntity.ok(entrepreneurService.getEntrepreneurProgrammes(entrepreneurId));
    }

    @GetMapping("/{entrepreneurId}/thematiques")
    public ResponseEntity<List<java.util.Map<String, Object>>> getThematiques(@PathVariable Long entrepreneurId) {
        return ResponseEntity.ok(entrepreneurService.getEntrepreneurThematiques(entrepreneurId));
    }

    @GetMapping("/{entrepreneurId}/sessions")
    public ResponseEntity<List<SessionCoachDTO>> getSessions(@PathVariable Long entrepreneurId) {
        return ResponseEntity.ok(entrepreneurService.getEntrepreneurSessions(entrepreneurId));
    }
}
