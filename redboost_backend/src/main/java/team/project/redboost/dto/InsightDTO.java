package team.project.redboost.dto;

public record InsightDTO(
    String type, // "warning" or "success"
    String title,
    String message,
    String badgeText
) {}