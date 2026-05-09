package team.project.redboost.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class SeanceExceptionnelleDTO {
    private Long id;
    private Long coachId;
    private Long entrepreneurId;
    private Long thematiqueId;
    private String entrepreneurName;
    private String titre;
    private LocalDate dateSeance;
    private LocalTime heureDebut;
    private LocalTime heureFin;
}
