// src/main/java/team/project/redboost/dto/KpiDTO.java
package team.project.redboost.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class KpiDTO {
    private Long id;
    private String nom;
    private String description;
    private String uniteMesure;
    private String type;
    private String objectif;
}