package team.project.redboost.dto.dashboardglobal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmallStatsDTO {
    private int moyenneBeneficiaires;
    private int tauxCompletion;
    private int programmesPlanifies;
}
