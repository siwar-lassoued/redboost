package team.project.redboost.dto;

import java.util.List;

public record KpiEvolutionDTO(
    String categoryName,
    String color,
    List<Double> values // e.g., last 6 months
) {}