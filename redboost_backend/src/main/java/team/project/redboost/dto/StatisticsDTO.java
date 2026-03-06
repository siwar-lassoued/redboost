package team.project.redboost.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class StatisticsDTO {
    private DeadlineComplianceDTO deadlineCompliance;
    private double kpiCompletionRate;
    private double respectDelaisRate;
    private double objectifsDepassesRate; // New field

    @Data
    @Builder
    public static class DeadlineComplianceDTO {
        private Map<String, Long> sprints;
        private Map<String, Long> activites;
        private Map<String, Long> taches;
    }
}