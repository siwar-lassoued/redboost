package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import team.project.redboost.dto.ExportDataRequest;
import team.project.redboost.dto.TemplateDataRow;
import team.project.redboost.entities.TemplateColumn;
import team.project.redboost.repositories.TemplateColumnRepository;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final TemplateDataService dataService;
    private final TemplateColumnRepository columnRepository;

    public byte[] exportToExcel(ExportDataRequest request) {
        try {
            // Get columns
            List<TemplateColumn> allColumns = columnRepository.findByTemplateIdOrderByDisplayOrder(request.getTemplateId());
            List<TemplateColumn> selectedColumns = filterSelectedColumns(allColumns, request.getColumnIds());

            // Get data - FILTERED OR ALL
            List<TemplateDataRow> rows = getFilteredData(request);

            // Create workbook
            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Data");

            // Create header style
            CellStyle headerStyle = createHeaderStyle(workbook);

            int rowNum = 0;

            // Create header row if requested
            if (request.getIncludeHeaders()) {
                Row headerRow = sheet.createRow(rowNum++);
                int colNum = 0;

                for (TemplateColumn column : selectedColumns) {
                    Cell cell = headerRow.createCell(colNum++);
                    cell.setCellValue(column.getColumnName());
                    cell.setCellStyle(headerStyle);
                }
            }

            // Create data rows
            for (TemplateDataRow dataRow : rows) {
                Row excelRow = sheet.createRow(rowNum++);
                int colNum = 0;

                for (TemplateColumn column : selectedColumns) {
                    Cell cell = excelRow.createCell(colNum++);
                    Object value = dataRow.getData().get(column.getColumnName());

                    if (value != null) {
                        setCellValue(cell, value, column);
                    }
                }
            }

            // Auto-size columns
            for (int i = 0; i < selectedColumns.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            // Write to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            workbook.close();

            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to export to Excel: " + e.getMessage(), e);
        }
    }

    public byte[] exportToCSV(ExportDataRequest request) {
        try {
            // Get columns
            List<TemplateColumn> allColumns = columnRepository.findByTemplateIdOrderByDisplayOrder(request.getTemplateId());
            List<TemplateColumn> selectedColumns = filterSelectedColumns(allColumns, request.getColumnIds());

            // Get data - FILTERED OR ALL
            List<TemplateDataRow> rows = getFilteredData(request);

            StringBuilder csv = new StringBuilder();

            // Add header row if requested
            if (request.getIncludeHeaders()) {
                String header = selectedColumns.stream()
                        .map(col -> escapeCSV(col.getColumnName()))
                        .collect(Collectors.joining(","));
                csv.append(header).append("\n");
            }

            // Add data rows
            for (TemplateDataRow dataRow : rows) {
                String row = selectedColumns.stream()
                        .map(col -> {
                            Object value = dataRow.getData().get(col.getColumnName());
                            return value != null ? escapeCSV(value.toString()) : "";
                        })
                        .collect(Collectors.joining(","));
                csv.append(row).append("\n");
            }

            return csv.toString().getBytes();

        } catch (Exception e) {
            throw new RuntimeException("Failed to export to CSV: " + e.getMessage(), e);
        }
    }

    /**
     * NEW METHOD: Get filtered data based on request
     */
    private List<TemplateDataRow> getFilteredData(ExportDataRequest request) {
        // Get all data first
        List<TemplateDataRow> allData = dataService.getAllData(request.getTemplateId());

        // If exportFiltered is true and rowIds are provided, filter the data
        if (Boolean.TRUE.equals(request.getExportFiltered()) &&
                request.getRowIds() != null &&
                !request.getRowIds().isEmpty()) {

            // Filter data to only include specified row IDs
            return allData.stream()
                    .filter(row -> request.getRowIds().contains(row.getRowId()))
                    .collect(Collectors.toList());
        }

        // Otherwise return all data
        return allData;
    }

    private List<TemplateColumn> filterSelectedColumns(List<TemplateColumn> allColumns, List<Long> selectedColumnIds) {
        if (selectedColumnIds == null || selectedColumnIds.isEmpty()) {
            return allColumns;
        }

        return allColumns.stream()
                .filter(col -> selectedColumnIds.contains(col.getId()))
                .collect(Collectors.toList());
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private void setCellValue(Cell cell, Object value, TemplateColumn column) {
        switch (column.getColumnType()) {
            case NUMBER:
                if (value instanceof Number) {
                    cell.setCellValue(((Number) value).doubleValue());
                } else {
                    try {
                        cell.setCellValue(Double.parseDouble(value.toString()));
                    } catch (NumberFormatException e) {
                        cell.setCellValue(value.toString());
                    }
                }
                break;

            case BOOLEAN:
                if (value instanceof Boolean) {
                    cell.setCellValue((Boolean) value);
                } else {
                    cell.setCellValue(Boolean.parseBoolean(value.toString()));
                }
                break;

            default:
                cell.setCellValue(value.toString());
                break;
        }
    }

    private String escapeCSV(String value) {
        if (value == null) return "";

        // If value contains comma, quote, or newline, wrap in quotes
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            // Escape quotes by doubling them
            value = value.replace("\"", "\"\"");
            return "\"" + value + "\"";
        }

        return value;
    }
}