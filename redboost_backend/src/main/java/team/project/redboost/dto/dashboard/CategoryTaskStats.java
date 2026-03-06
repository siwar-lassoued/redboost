package team.project.redboost.dto.dashboard;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryTaskStats {
    private String categoryName;
    private String categoryColor;
    private int totalTasks;
    private int completedTasks;
    private double completionRate;
}