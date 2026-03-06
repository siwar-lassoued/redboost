// src/main/java/team/project/redboost/dto/SprintDetailDTO.java
package team.project.redboost.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class SprintDetailDTO {
    private Long id;
    private String nom;
    private String description;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String status;
    private Integer retardJours;
    private Integer progression;
    private Integer nombreActivites;
    private Long programmeId; // ← ADD THIS LINE
    private String programmeNom;
    private List<ActiviteDetailDTO> activites;
    private List<DocumentDTO> documents; // NEW
}