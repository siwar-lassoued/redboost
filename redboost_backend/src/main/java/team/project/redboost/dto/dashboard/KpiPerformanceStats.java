package team.project.redboost.dto.dashboard;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class KpiPerformanceStats {
    private String kpiName;
    private String categoryName;
    private String categoryColor;
    private String unit;
    private String valeurPrecedente;
    private String valeurActuelle;
    private String valeurCible;
    private Double achievementRate; // Percentage (null if not calculable)
}