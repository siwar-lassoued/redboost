// src/main/java/team/project/redboost/services/ActiviteDocumentService.java
package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.dto.ActiviteDetailDTO;
import team.project.redboost.dto.DocumentDTO;
import team.project.redboost.entities.Activite;
import team.project.redboost.entities.ActiviteDocument;
import team.project.redboost.repositories.ActiviteDocumentRepository;
import team.project.redboost.repositories.ActiviteRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActiviteDocumentService {

    private final ActiviteDocumentRepository documentRepository;
    private final ActiviteRepository activiteRepository;

    @Value("${file.upload.activity-documents-dir:uploads/activity-documents}")
    private String uploadDir;

    public List<DocumentDTO> uploadDocuments(Long activiteId, List<MultipartFile> files, Long uploadedById) {
        Activite activite = activiteRepository.findById(activiteId)
                .orElseThrow(() -> new RuntimeException("Activité non trouvée"));

        List<DocumentDTO> uploadedDocs = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            try {
                // Create upload directory if it doesn't exist
                Path uploadPath = Paths.get(uploadDir);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                // Generate unique filename
                String originalFilename = file.getOriginalFilename();
                String extension = originalFilename != null && originalFilename.contains(".")
                        ? originalFilename.substring(originalFilename.lastIndexOf("."))
                        : "";
                String uniqueFilename = UUID.randomUUID().toString() + extension;

                // Save file
                Path filePath = uploadPath.resolve(uniqueFilename);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                // Create document entity
                ActiviteDocument document = ActiviteDocument.builder()
                        .nom(originalFilename)
                        .cheminFichier("/api/files/activity-documents/" + uniqueFilename)
                        .typeFichier(file.getContentType())
                        .tailleFichier(file.getSize())
                        .dateUpload(LocalDateTime.now())
                        .uploadedById(uploadedById)
                        .activite(activite)
                        .build();

                ActiviteDocument saved = documentRepository.save(document);

                uploadedDocs.add(DocumentDTO.builder()
                        .id(saved.getId())
                        .nom(saved.getNom())
                        .cheminFichier(saved.getCheminFichier())
                        .typeFichier(saved.getTypeFichier())
                        .tailleFichier(saved.getTailleFichier())
                        .dateUpload(saved.getDateUpload())
                        .uploadedById(saved.getUploadedById())
                        .build());

            } catch (IOException e) {
                throw new RuntimeException("Erreur lors de l'upload du fichier: " + file.getOriginalFilename(), e);
            }
        }

        return uploadedDocs;
    }

    public List<DocumentDTO> getDocumentsByActivite(Long activiteId) {
        return documentRepository.findByActiviteId(activiteId).stream()
                .map(doc -> DocumentDTO.builder()
                        .id(doc.getId())
                        .nom(doc.getNom())
                        .cheminFichier(doc.getCheminFichier())
                        .typeFichier(doc.getTypeFichier())
                        .tailleFichier(doc.getTailleFichier())
                        .dateUpload(doc.getDateUpload())
                        .uploadedById(doc.getUploadedById())
                        .build())
                .toList();
    }

// src/main/java/team/project/redboost/services/ActiviteDocumentService.java

    public void deleteDocument(Long documentId) {
        ActiviteDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document non trouvé"));

        // Delete physical file
        try {
            // Extract filename from path: /api/files/activity-documents/filename.ext
            String cheminComplet = document.getCheminFichier();
            String filename = cheminComplet.substring(cheminComplet.lastIndexOf('/') + 1);

            Path filePath = Paths.get(uploadDir, filename);
            boolean deleted = Files.deleteIfExists(filePath);

            if (deleted) {
                System.out.println("✅ Fichier physique supprimé: " + filePath);
            } else {
                System.out.println("⚠️ Fichier physique introuvable: " + filePath);
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la suppression du fichier: " + document.getCheminFichier());
            e.printStackTrace();
            // Continue to delete DB record even if file deletion fails
        }

        // Delete database record
        documentRepository.delete(document);
        System.out.println("✅ Document supprimé de la base de données: " + document.getNom());
    }
}