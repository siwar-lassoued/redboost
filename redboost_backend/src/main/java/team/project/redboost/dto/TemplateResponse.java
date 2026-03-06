package team.project.redboost.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TemplateResponse {
    private Long id;
    private String name;
    private String description;
    private String type; // New field
    private List<ColumnDefinition> columns;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}