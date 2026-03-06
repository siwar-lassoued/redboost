// src/main/java/team/project/redboost/dto/BackofficeKpiResponse.java
package team.project.redboost.dto;

public record BackofficeKpiResponse(
        Long id,
        String nom,
        String description,
        String uniteMesure,

        String type,
        String typesuivi,
        String typedesaisie
) {}