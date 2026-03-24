package team.project.redboost.dto.dashboardglobal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptionnelIndicatorDTO {
    private String title;
    private String value;
    private String trend;
    private String period;
    private String icon;
    private String color;
    private String bg;
    private String category;
    private String info;
}
