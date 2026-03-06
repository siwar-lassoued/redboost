package team.project.redboost.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ObjectifGlobalDTO {
    private Long id;
    private Long rapportId;
    private String nom;
    private String description;

    @Builder.Default
    private List<ObjectifSpecifiqueDTO> objectifsSpecifiques = new ArrayList<>();
}