// src/main/java/team/project/redboost/dto/DocumentConsolideDTO.java

package team.project.redboost.dto;

import java.time.LocalDateTime;

public record DocumentConsolideDTO(
        String sprintNom,
        String activiteNom,
        String tacheTitre,
        String nomFichier,
        String uploadedByName,
        LocalDateTime date,
        String typeFichier,
        String cheminFichier,
        Long documentId,
        String niveau
) {}