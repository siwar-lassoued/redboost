package team.project.redboost.dto.dashboardglobal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformMetricsDTO {
    private int totalUtilisateurs;
    private int utilisateursActifs;
    private int utilisateursInactifs;
    private int totalLivrables;
    private int livrablesValides;
    private int livrablesEnCours;
    private int totalCoachs;
    private int coachsCertifies;
    private int coachsStagiaires;
    private int candidaturesCoach;
    private int candidaturesSemaine;
    private int candidaturesRevision;
}
