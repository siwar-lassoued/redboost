package team.project.redboost.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateTemplateRequest {
    private String name;
    private String description;
    private String type; // New field
    private List<ColumnDefinition> columns;
}