package team.project.redboost.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import team.project.redboost.entities.Sprint;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SprintDTO {
    private Long id;
    private String nom;
    private String description;
    private String status;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateDebut;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateLimite;
    
    private Long programmeId;
    private String programmeNom;

    // Conversion method
    public static SprintDTO fromEntity(Sprint sprint) {
        return SprintDTO.builder()
            .id(sprint.getId())
            .nom(sprint.getNom())
            .description(sprint.getDescription())
            .status(sprint.getStatus() != null ? sprint.getStatus().name() : null)
            .dateDebut(sprint.getDateDebut())
            .dateLimite(sprint.getDateLimite())
            .programmeId(sprint.getProgramme() != null ? sprint.getProgramme().getId() : null)
            .programmeNom(sprint.getProgramme() != null ? sprint.getProgramme().getNom() : null)
            .build();
    }
}