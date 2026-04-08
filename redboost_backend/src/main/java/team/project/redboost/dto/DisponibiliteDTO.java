package team.project.redboost.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class DisponibiliteDTO {
    private Long id;
    private Long coachId;
    private Long thematiqueId;
    private String thematiqueNom;
    private LocalDate dateDebut;
    private LocalDate dateFin;
}
