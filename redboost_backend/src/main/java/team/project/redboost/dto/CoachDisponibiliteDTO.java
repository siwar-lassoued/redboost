package team.project.redboost.dto;

import lombok.*;
import team.project.redboost.entities.CoachDisponibilite.JourSemaine;
import team.project.redboost.entities.CoachDisponibilite.TypeDisponibilite;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachDisponibiliteDTO {

    private Long id;
    private Long coachId;
    private JourSemaine jour;
    private LocalTime heureDebut;
    private LocalTime heureFin;
    private TypeDisponibilite type;
    private LocalDate dateSpecifique;
    private Boolean recurrent;
    private String note;
    private Boolean actif;
}