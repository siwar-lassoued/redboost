// src/main/java/team/project/redboost/dto/KpiWithCategoryDTO.java
package team.project.redboost.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class KpiWithCategoryDTO {
    private Long id;
    private String nom;
    private String description;
    private String uniteMesure;
    private String objectif;
    private String type;

    // Category info
    private Long categoryId;
    private String categoryNom;
    private String categoryCouleur;

    // Programme KPI Value
    private String valeurActuelle;

    // Activite/Tache KPI Value
    private String valeur;
    private String valeurCible;
}