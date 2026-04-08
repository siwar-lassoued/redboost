package team.project.redboost.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class SessionCoachDTO {
    private Long id;
    private Long disponibiliteId;
    private String titre;
    private LocalDate dateSession;
    private LocalTime heureDebut;
    private LocalTime heureFin;
}
