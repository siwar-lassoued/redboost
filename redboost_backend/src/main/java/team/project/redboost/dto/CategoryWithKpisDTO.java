// src/main/java/team/project/redboost/dto/CategoryWithKpisDTO.java
package team.project.redboost.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class CategoryWithKpisDTO {
    private Long categoryId;
    private String categoryNom;
    private String categoryCouleur;
    private List<KpiDTO> kpis;
}