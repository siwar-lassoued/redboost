package team.project.redboost.dto;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class EventResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private String type;
    private String mode;
    private String location;
    private String meetLink;
    private String program;
    private List<String> participantEmails;
    private String googleCalendarEventId;
    private String status;
    private LocalDateTime createdAt;
}
