package team.project.redboost.dto.dashboard;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class KpiDistributionByCategoryDTO {
    private List<CategoryDistributionStats> categories;
    private int totalKpis;
}