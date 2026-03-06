// src/main/java/team/project/redboost/services/SprintDocumentService.java
package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.dto.DocumentDTO;
import team.project.redboost.entities.Sprint;
import team.project.redboost.entities.SprintDocument;
import team.project.redboost.repositories.SprintDocumentRepository;
import team.project.redboost.repositories.SprintRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SprintDocumentService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private final SprintDocumentRepository documentRepository;
    private final SprintRepository sprintRepository;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "gif"
    );

    public List<DocumentDTO> uploadDocuments(Long sprintId, List<MultipartFile> files, Long uploadedById) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint non trouvé"));

        Path uploadPath = Paths.get(uploadDir, "sprint-documents");
        if (!Files.exists(uploadPath)) {
            try {
                Files.createDirectories(uploadPath);
            } catch (IOException e) {
                throw new RuntimeException("Impossible de créer le dossier d'upload");
            }
        }

        return files.stream().map(file -> {
            validateFile(file);
            
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String extension = StringUtils.getFilenameExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + "." + extension;
            Path filePath = uploadPath.resolve(uniqueFilename);

            try {
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new RuntimeException("Échec de l'upload du fichier: " + originalFilename);
            }

            SprintDocument document = SprintDocument.builder()
                    .nom(originalFilename)
                    .cheminFichier("/api/files/sprint-documents/" + uniqueFilename)
                    .typeFichier(file.getContentType())
                    .tailleFichier(file.getSize())
                    .uploadedById(uploadedById)
                    .sprint(sprint)
                    .build();

            SprintDocument saved = documentRepository.save(document);
            return mapToDTO(saved);
        }).toList();
    }

    public List<DocumentDTO> getDocumentsBySprint(Long sprintId) {
        return documentRepository.findBySprintId(sprintId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    // src/main/java/team/project/redboost/services/SprintDocumentService.java

    public void deleteDocument(Long documentId) {
        SprintDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document non trouvé"));

        // Delete physical file
        try {
            // Extract filename from path: /api/files/sprint-documents/filename.ext
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

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Le fichier est vide");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("Le fichier est trop volumineux (max 10 MB): " + file.getOriginalFilename());
        }

        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        if (extension == null || !ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new RuntimeException("Type de fichier non autorisé: " + extension);
        }
    }

    private DocumentDTO mapToDTO(SprintDocument document) {
        return DocumentDTO.builder()
                .id(document.getId())
                .nom(document.getNom())
                .cheminFichier(document.getCheminFichier())
                .typeFichier(document.getTypeFichier())
                .tailleFichier(document.getTailleFichier())
                .dateUpload(document.getDateUpload())
                .uploadedById(document.getUploadedById())
                .build();
    }
}