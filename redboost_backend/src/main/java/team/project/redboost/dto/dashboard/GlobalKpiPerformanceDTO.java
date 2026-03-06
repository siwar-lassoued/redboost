package team.project.redboost.dto.dashboard;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class GlobalKpiPerformanceDTO {
    private List<KpiPerformanceStats> kpis;
    private double averageAchievementRate;
}