package team.project.redboost.controllers;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Serves uploaded candidature documents via the API.
 * This bypasses nginx static file serving issues by routing through Spring Boot.
 * URL pattern: GET /api/documents/candidatures/{filename}
 */
@RestController
@RequestMapping("/api/documents")
@Slf4j
public class DocumentController {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @GetMapping("/candidatures/{filename:.+}")
    public ResponseEntity<Resource> serveCandidatureDocument(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir, "candidatures", filename).toAbsolutePath().normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                log.warn("Document not found or not readable: {}", filePath);
                return ResponseEntity.notFound().build();
            }

            // Determine content type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .body(resource);

        } catch (MalformedURLException e) {
            log.error("Malformed URL for document: {}", filename, e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error serving document: {}", filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
