package team.project.redboost.dto.dashboard;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryDistributionStats {
    private String categoryName;
    private String categoryColor;
    private int count;
    private double percentage;
    private int globalKpiCount;
    private int optionnelKpiCount;
}