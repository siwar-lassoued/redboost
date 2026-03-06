// src/main/java/team/project/redboost/controllers/FileController.java

package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Value("${file.upload.sprint-documents-dir:uploads/sprint-documents}")
    private String sprintDocumentsDir;

    @Value("${file.upload.activity-documents-dir:uploads/activity-documents}")
    private String activityDocumentsDir;

    @Value("${file.upload.tache-documents-dir:uploads/tache-documents}")
    private String tacheDocumentsDir;

    @GetMapping("/sprint-documents/{filename:.+}")
    public ResponseEntity<Resource> downloadSprintDocument(@PathVariable String filename) {
        return serveFile(sprintDocumentsDir, filename);
    }

    @GetMapping("/activity-documents/{filename:.+}")
    public ResponseEntity<Resource> downloadActivityDocument(@PathVariable String filename) {
        return serveFile(activityDocumentsDir, filename);
    }

    @GetMapping("/tache-documents/{filename:.+}")
    public ResponseEntity<Resource> downloadTacheDocument(@PathVariable String filename) {
        return serveFile(tacheDocumentsDir, filename);
    }

    private ResponseEntity<Resource> serveFile(String directory, String filename) {
        try {
            Path filePath = Paths.get(directory).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("Fichier non trouvé: " + filename);
            }

            // Determine content type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            throw new RuntimeException("Erreur lors de la lecture du fichier: " + filename, e);
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la détermination du type de fichier", e);
        }
    }
}