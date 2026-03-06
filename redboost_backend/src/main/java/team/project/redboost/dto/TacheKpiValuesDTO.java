// src/main/java/team/project/redboost/dto/TacheKpiValuesDTO.java
package team.project.redboost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TacheKpiValuesDTO {
    private Long tacheId;
    private String tacheTitre;
    private String activiteNom;
    private String sprintNom;
    private List<KpiValueDTO> kpis;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiValueDTO {
        private Long kpiId;
        private String kpiNom;
        private String kpiUnite;
        private String categoryNom;
        private String categoryCouleur;
        private String valeur;
        private String valeurCible;
    }
}