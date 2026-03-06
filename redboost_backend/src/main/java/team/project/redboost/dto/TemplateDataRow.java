package team.project.redboost.dto;

import lombok.Data;
import java.util.Map;

@Data
public class TemplateDataRow {
    private String rowId;
    private Map<String, Object> data; // columnName -> value
}