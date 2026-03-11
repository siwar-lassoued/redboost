// src/main/java/team/project/redboost/dto/ActiviteDetailDTO.java
package team.project.redboost.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class ActiviteDetailDTO {
    private Long id;
    private String nom;
    private String description;

    private String objectif;
    private String methodologie;
    private String resultatAttendu;
    private String type;

    private List<KpiWithCategoryDTO> kpis;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Long responsableId;
    private String responsableNom;
    private String status;
    private Integer retardJours;
    private Integer progression;
    private Integer nombreTaches;
    private List<TacheDetailDTO> taches;
    private List<DocumentDTO> documents;
    private String sprintNom;
    private String programmeNom;
    private Long sprintId;
    private Long programmeId;

}