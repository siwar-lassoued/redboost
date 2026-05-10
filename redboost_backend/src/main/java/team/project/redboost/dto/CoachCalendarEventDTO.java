package team.project.redboost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachCalendarEventDTO {
    private String id;
    private String type;
    private String title;
    private String date;
    private String startTime;
    private String endTime;
    private String source;
    private String thematiqueNom;
    private String programmeNom;
    private String color;
    private boolean booked;
}
