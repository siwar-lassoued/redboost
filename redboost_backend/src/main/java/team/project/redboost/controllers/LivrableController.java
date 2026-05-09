package team.project.redboost.controllers;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.config.JwtUtil;
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
    private final JwtUtil jwtUtil;

    /**
     * Get livrables with optional filters.
     * - entrepreneurId: filter by entrepreneur ID
     * - coachId:        filter by coach user ID (looks up the coach's email, then filters)
     */
    @GetMapping
    public ResponseEntity<List<Livrable>> getAllLivrables(
            @RequestParam(required = false) Long entrepreneurId,
            @RequestParam(required = false) Long coachId) {

        List<Livrable> livrables = livrableService.getAllLivrables();

        if (entrepreneurId != null) {
            livrables = livrables.stream()
                    .filter(l -> l.getEntrepreneur() != null
                            && l.getEntrepreneur().getId().equals(entrepreneurId))
                    .collect(Collectors.toList());
        }

        if (coachId != null) {
            User coach = userRepository.findById(coachId).orElse(null);
            if (coach != null && coach.getEmail() != null) {
                final String coachEmail = coach.getEmail();
                livrables = livrables.stream()
                        .filter(l -> coachEmail.equals(l.getCoachEmail()))
                        .collect(Collectors.toList());
            }
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

    /**
     * Upload a file and create one Livrable record per entrepreneur.
     * The uploading coach's identity is extracted from the JWT and stored on each record.
     */
    @PostMapping("/upload")
    public ResponseEntity<List<Livrable>> uploadLivrable(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "programmeId", required = false) Long programmeId,
            @RequestParam("entrepreneurIds") List<Long> entrepreneurIds,
            @RequestParam("titre") String titre,
            @RequestParam("type") String type,
            @RequestParam(value = "coachId", required = false) Long coachId,
            HttpServletRequest request) {

        try {
            // 1. Store file on disk
            LocalFileStorageService.FileUploadResult uploadResult =
                    localFileStorageService.uploadFileWithMimeType(file);
            String fileUrl = "/uploads/" + uploadResult.getFileName();

            // 2. Resolve programme (optional)
            team.project.redboost.entities.Programme programme = null;
            if (programmeId != null) {
                programme = programmeRepository.findById(programmeId).orElse(null);
            }

            // 3. Resolve the uploading coach
            User coach = null;
            if (coachId != null) {
                coach = userRepository.findById(coachId).orElse(null);
            }
            // Fallback: read from the JWT Authorization header
            if (coach == null) {
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    try {
                        String token = authHeader.substring(7);
                        String email = jwtUtil.extractEmail(token);
                        if (email != null) {
                            coach = userRepository.findByEmail(email);
                        }
                    } catch (Exception ignored) {}
                }
            }

            // 4. Format file size string
            long size = file.getSize();
            String sizeStr = size < 1024 ? size + " B"
                    : size < 1_048_576 ? (size / 1024) + " KB"
                    : (size / 1_048_576) + " MB";

            final User finalCoach = coach;
            final team.project.redboost.entities.Programme finalProgramme = programme;

            // 5. Create one Livrable per entrepreneur
            List<Livrable> created = entrepreneurIds.stream().map(entId -> {
                User entrepreneur = userRepository.findById(entId).orElse(null);
                if (entrepreneur == null) return null;

                Livrable livrable = new Livrable();
                livrable.setTitre(titre);
                livrable.setType(type);
                livrable.setFichierUrl(fileUrl);
                livrable.setFileSize(sizeStr);
                livrable.setEntrepreneur(entrepreneur);
                livrable.setProgramme(finalProgramme);
                livrable.setStatut(Livrable.Statut.SUBMITTED);
                livrable.setDateSoumission(LocalDateTime.now());

                // Persist coach identity so we can filter later
                if (finalCoach != null) {
                    livrable.setCoachEmail(finalCoach.getEmail());
                    livrable.setCoachName(
                            (finalCoach.getFirstName() != null ? finalCoach.getFirstName() : "") +
                            " " +
                            (finalCoach.getLastName() != null ? finalCoach.getLastName() : ""));
                }

                return livrableService.createLivrable(livrable);
            }).filter(java.util.Objects::nonNull).collect(Collectors.toList());

            return ResponseEntity.ok(created);

        } catch (Exception e) {
            System.err.println("CRITICAL ERROR: Failed to upload livrable: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<Livrable> updateStatus(
            @PathVariable Long id, @RequestBody Map<String, String> payload) {
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
