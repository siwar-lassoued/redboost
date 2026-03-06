// ColumnDefinition.java
package team.project.redboost.dto;

import lombok.Data;
import team.project.redboost.entities.ColumnType;

import java.util.List;

@Data
public class ColumnDefinition {
    private Long id; // Add this field to track existing columns
    private String columnName;
    private ColumnType columnType;
    private Boolean isRequired;
    private Boolean isUnique;
    private Integer displayOrder;
    private List<String> options; // For SELECT type columns
}