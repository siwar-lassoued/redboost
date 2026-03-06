package team.project.redboost.dto;

public record GlobalKpiPerformanceDTO(
    String name,
    double objective,
    double achieved,
    double percentage,
    String status // "up" or "down"
) {}