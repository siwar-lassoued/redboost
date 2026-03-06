// BackofficeCategoryResponse.java
package team.project.redboost.dto;

import java.util.List;

public record BackofficeCategoryResponse(
    Long id,
    String nom,
    String description,
    String couleur,
    List<BackofficeKpiResponse> kpis
) {}