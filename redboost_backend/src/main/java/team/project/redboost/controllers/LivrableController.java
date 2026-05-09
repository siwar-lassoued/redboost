package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.Livrable;
import team.project.redboost.entities.User;
import team.project.redboost.services.LivrableService;
import team.project.redboost.services.LocalFileStorageService;
import team.project.redboost.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/livrables")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LivrableController {

    private final LivrableService livrableService;
    private final LocalFileStorageService localFileStorageService;
    private final UserRepository userRepository;
    private final team.project.redboost.repositories.ProgrammeRepository programmeRepository;

    @GetMapping
    public ResponseEntity<List<Livrable>> getAllLivrables(
            @RequestParam(required = false) Long entrepreneurId,
            @RequestParam(required = false) Long coachId) {
        List<Livrable> livrables = livrableService.getAllLivrables();
        if (entrepreneurId != null) {
            livrables = livrables.stream()
                    .filter(l -> l.getEntrepreneur() != null && l.getEntrepreneur().getId().equals(entrepreneurId))
                    .collect(Collectors.toList());
        }
        if (coachId != null) {
            // Coach filtering can be done here if needed (e.g. by email or coach name)
        }
        return ResponseEntity.ok(livrables);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Livrable> getLivrableById(@PathVariable Long id) {
        Livrable livrable = livrableService.getLivrableById(id);
        return livrable != null ? ResponseEntity.ok(livrable) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Livrable> createLivrable(@RequestBody Livrable livrable) {
        return ResponseEntity.ok(livrableService.createLivrable(livrable));
    }

    @PostMapping("/upload")
    public ResponseEntity<List<Livrable>> uploadLivrable(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "programmeId", required = false) Long programmeId,
            @RequestParam("entrepreneurIds") List<Long> entrepreneurIds,
            @RequestParam("titre") String titre,
            @RequestParam("type") String type) {
        
        try {
            LocalFileStorageService.FileUploadResult uploadResult = localFileStorageService.uploadFileWithMimeType(file);
            String fileUrl = "/uploads/" + uploadResult.getFileName();
            
            team.project.redboost.entities.Programme programme = null;
            if (programmeId != null) {
                programme = programmeRepository.findById(programmeId).orElse(null);
            }

            team.project.redboost.entities.Programme finalProgramme = programme;
            List<Livrable> created = entrepreneurIds.stream().map(entId -> {
                User entrepreneur = userRepository.findById(entId).orElse(null);
                if (entrepreneur == null) return null;
                
                Livrable livrable = new Livrable();
                livrable.setTitre(titre);
                livrable.setType(type);
                livrable.setFichierUrl(fileUrl);
                
                // Format file size
                long size = file.getSize();
                String sizeStr = size < 1024 ? size + " B" : (size < 1024 * 1024 ? (size / 1024) + " KB" : (size / (1024 * 1024)) + " MB");
                livrable.setFileSize(sizeStr);
                
                livrable.setEntrepreneur(entrepreneur);
                livrable.setProgramme(finalProgramme);
                livrable.setStatut(Livrable.Statut.SUBMITTED);
                livrable.setDateSoumission(LocalDateTime.now());
                
                return livrableService.createLivrable(livrable);
            }).filter(java.util.Objects::nonNull).collect(Collectors.toList());
            
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<Livrable> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Livrable.Statut statut = Livrable.Statut.valueOf(payload.get("statut"));
        String coachComment = payload.get("coachComment");
        Livrable updated = livrableService.updateStatus(id, statut, coachComment);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLivrable(@PathVariable Long id) {
        livrableService.deleteLivrable(id);
        return ResponseEntity.noContent().build();
    }
}
