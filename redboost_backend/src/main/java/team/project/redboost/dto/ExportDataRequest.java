package team.project.redboost.dto;

import lombok.Data;
import java.util.List;

@Data
public class ExportDataRequest {
    private Long templateId;
    private List<Long> columnIds;
    private String exportFormat; // "EXCEL" or "CSV"
    private Boolean includeHeaders;
    private Boolean exportFiltered; // Flag to indicate filtered export
    private List<String> rowIds; // NEW: List of specific row IDs to export
}