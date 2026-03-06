// src/main/java/team/project/redboost/dto/TacheDetailDTO.java
package team.project.redboost.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class TacheDetailDTO {
    private Long id;
    private String titre;
    private String description;
    private String priorite;
    private String status;
    private Long responsableId;
    private String responsableNom;
    private String difficulte;
    private LocalDate dateDebut;
    private List<KpiWithCategoryDTO> kpis;
    private LocalDate dateLimite;
    private List<DocumentDTO> documents;
    private String activiteNom;
    private Long activiteId;
    private String sprintNom;
    private Long sprintId;
    private String programmeNom;
    private Long programmeId;
}
