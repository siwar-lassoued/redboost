package team.project.redboost.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class SprintKpiStatisticsDTO {
    private Long sprintId;
    private String sprintNom;
    private List<KpiStatisticDTO> kpiStatistics;

    @Data
    @Builder
    public static class KpiStatisticDTO {
        private Long kpiId;
        private String kpiNom;
        private String uniteMesure;
        private Double totalValeur;
    }
}
