package team.project.redboost.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateEventRequest {
    private String title;
    private String description;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private String type; // PITCH_DECK, NETWORKING, FORMATION, etc.
    private String mode; // EN_PERSONNE, VIRTUEL, HYBRID
    private String location;
    private String program;
    private List<String> participantEmails;
}
