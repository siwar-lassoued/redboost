package team.project.redboost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachEntrepreneurDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String entreprise;
    private String secteur;
    private String profilePictureUrl;
    private int completionRate;
    private int delayedTasksCount;
}
