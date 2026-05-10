package team.project.redboost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntrepreneurCoachDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String expertise;
    private String thematiqueName;
}
