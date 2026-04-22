package team.project.redboost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingSessionDTO {
    private String id;
    private String entrepreneurName;
    private LocalDate dateSession;
    private LocalTime heureDebut;
    private String statut;
    private String meetingLink;
}
