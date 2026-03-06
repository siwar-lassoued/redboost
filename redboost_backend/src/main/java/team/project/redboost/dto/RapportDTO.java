package team.project.redboost.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RapportDTO {
    private Long id;
    private Long programmeId;
    private String programmeName;
    private String objectifsProgramme;
    private String resultatsCles;
    private String impactGlobal;

    @Builder.Default
    private List<ObjectifGlobalDTO> objectifsGlobaux = new ArrayList<>();

    @Builder.Default
    private List<Long> sprintIds = new ArrayList<>();

    private String conclusionRecommandations;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
}