// src/main/java/team/project/redboost/dto/programmeKpi/ProgrammeKpiRequest.java
package team.project.redboost.dto;

import jakarta.validation.constraints.NotNull;

public record ProgrammeKpiRequest(
    @NotNull Long programmeId,
    @NotNull Long kpiId,
    String valeurPrecedente,
    String valeurActuelle,
    String valeurCible
) {}