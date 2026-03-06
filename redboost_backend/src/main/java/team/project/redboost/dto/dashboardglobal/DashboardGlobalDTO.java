package team.project.redboost.dto.dashboardglobal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardGlobalDTO {
    private ProgramStatsDTO programStats;
    private Map<String, List<GlobalIndicatorDTO>> globalIndicators;
    private Map<String, List<OptionnelIndicatorDTO>> optionnelIndicators;
    private PlatformMetricsDTO platformMetrics;
    private SmallStatsDTO smallStats;
}
