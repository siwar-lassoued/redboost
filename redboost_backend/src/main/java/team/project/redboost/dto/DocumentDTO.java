// src/main/java/team/project/redboost/dto/DocumentDTO.java
package team.project.redboost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDTO {
    private Long id;
    private String nom;
    private String cheminFichier;
    private String typeFichier;
    private Long tailleFichier;
    private LocalDateTime dateUpload;
    private Long uploadedById;
    private String uploadedByName;
}