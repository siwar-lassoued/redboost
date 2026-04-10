package team.project.redboost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private int nbRendezVous;
    private int nbTaches;
    private int nbPhases;
    private int nbProjet;
    private double completionRate;
    private List<ActivityDTO> activity;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityDTO {
        private String time;
        private String text;
    }
}
