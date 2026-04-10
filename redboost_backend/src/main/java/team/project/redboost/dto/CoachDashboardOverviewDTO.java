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
public class CoachDashboardOverviewDTO {
    private DashboardStatsDTO stats;
    private List<CoachEntrepreneurDTO> entrepreneurs;
    private List<UpcomingSessionDTO> sessions;
}