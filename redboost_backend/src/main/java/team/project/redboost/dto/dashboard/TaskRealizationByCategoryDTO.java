package team.project.redboost.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskRealizationByCategoryDTO {
    private List<CategoryTaskStats> categories;
    private int totalTasks;
    private int totalCompletedTasks;
}