// src/main/java/team/project/redboost/dto/BackofficeKpiRequest.java
package team.project.redboost.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BackofficeKpiRequest(
        @NotBlank String nom,
        String description,
        @NotBlank String uniteMesure,

        String type,
        String typesuivi,
        String typedesaisie
) {}