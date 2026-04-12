package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.dto.DocumentDTO;
import team.project.redboost.services.TacheDocumentService;

import java.util.List;

@RestController
@RequestMapping("/api/taches/documents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TacheDocumentController {

    private final TacheDocumentService documentService;

    @PostMapping("/upload/{tacheId}")
    public ResponseEntity<List<DocumentDTO>> uploadDocuments(
            @PathVariable Long tacheId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("uploadedById") Long uploadedById) {
        
        List<DocumentDTO> uploadedDocs = documentService.uploadDocuments(tacheId, files, uploadedById);
        return ResponseEntity.ok(uploadedDocs);
    }

    @GetMapping("/{tacheId}")
    public ResponseEntity<List<DocumentDTO>> getDocumentsByTache(@PathVariable Long tacheId) {
        return ResponseEntity.ok(documentService.getDocumentsByTache(tacheId));
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long documentId) {
        documentService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }
}
