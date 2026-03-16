package team.project.redboost.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ObjectifSpecifiqueDTO {
    private Long id;
    private Long objectifGlobalId;
    private String nom;
    private String description;

    @Builder.Default
    private List<ResultatDTO> resultats = new ArrayList<>();

    @Builder.Default
    private List<Long> kpiIds = new ArrayList<>();
}