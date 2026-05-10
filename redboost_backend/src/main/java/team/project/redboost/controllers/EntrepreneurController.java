package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.dto.EntrepreneurCoachDTO;
import team.project.redboost.dto.ReclamationDTO;
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
        
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        ReclamationDTO dto = mapper.readValue(reclamationJson, ReclamationDTO.class);
        dto.setRoleEmetteur("ENTREPRENEUR");
        return ResponseEntity.ok(entrepreneurService.addReclamation(entrepreneurId, coachId, dto, file));
    }
}
