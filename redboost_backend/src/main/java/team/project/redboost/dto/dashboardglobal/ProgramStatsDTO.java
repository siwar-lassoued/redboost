package team.project.redboost.dto.dashboardglobal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgramStatsDTO {
    private int totalProgrammes;
    private int totalBeneficiaires;
    private int programmesEnCours;
    private int programmesEnRetard;
}
