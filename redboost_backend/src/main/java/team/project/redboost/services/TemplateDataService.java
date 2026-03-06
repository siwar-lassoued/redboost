// TemplateDataService.java
package team.project.redboost.services;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import team.project.redboost.dto.TemplateDataRow;
import team.project.redboost.entities.ColumnType;
import team.project.redboost.entities.TemplateColumn;
import team.project.redboost.entities.TemplateData;
import team.project.redboost.repositories.TemplateColumnRepository;
import team.project.redboost.repositories.TemplateDataRepository;

@Service
@RequiredArgsConstructor
public class TemplateDataService {
    
    private final TemplateDataRepository dataRepository;
    private final TemplateColumnRepository columnRepository;
    
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );
    
    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "^[+]?[(]?[0-9]{1,4}[)]?[-\\s\\.]?[(]?[0-9]{1,4}[)]?[-\\s\\.]?[0-9]{1,9}$"
    );
    
    @Transactional
    public String addDataRow(Long templateId, Map<String, Object> rowData) {
        List<TemplateColumn> columns = columnRepository.findByTemplateIdOrderByDisplayOrder(templateId);
        
        // Validate data
        validateRowData(templateId, rowData, columns, null);
        
        // Generate UUID for this row
        String rowId = UUID.randomUUID().toString();
        
        // Create data entries
        List<TemplateData> dataEntries = new ArrayList<>();
        for (TemplateColumn column : columns) {
            Object value = rowData.get(column.getColumnName());
            
            if (value != null) {
                TemplateData data = new TemplateData();
                data.setTemplateId(templateId);
                data.setRowId(rowId);
                data.setColumnId(column.getId());
                data.setValue(convertValueToString(value, column.getColumnType()));
                dataEntries.add(data);
            } else if (column.getIsRequired()) {
                throw new IllegalArgumentException("Required field missing: " + column.getColumnName());
            }
        }
        
        dataRepository.saveAll(dataEntries);
        return rowId;
    }
    
    @Transactional
    public void updateDataRow(Long templateId, String rowId, Map<String, Object> rowData) {
        List<TemplateColumn> columns = columnRepository.findByTemplateIdOrderByDisplayOrder(templateId);
        
        // Validate data
        validateRowData(templateId, rowData, columns, rowId);
        
        // Delete existing data for this row
        dataRepository.deleteByTemplateIdAndRowId(templateId, rowId);
        
        // Create new data entries
        List<TemplateData> dataEntries = new ArrayList<>();
        for (TemplateColumn column : columns) {
            Object value = rowData.get(column.getColumnName());
            
            if (value != null) {
                TemplateData data = new TemplateData();
                data.setTemplateId(templateId);
                data.setRowId(rowId);
                data.setColumnId(column.getId());
                data.setValue(convertValueToString(value, column.getColumnType()));
                dataEntries.add(data);
            } else if (column.getIsRequired()) {
                throw new IllegalArgumentException("Required field missing: " + column.getColumnName());
            }
        }
        
        dataRepository.saveAll(dataEntries);
    }
    
    @Transactional
    public void deleteDataRow(Long templateId, String rowId) {
        dataRepository.deleteByTemplateIdAndRowId(templateId, rowId);
    }
    
    @Transactional(readOnly = true)
    public List<TemplateDataRow> getAllData(Long templateId) {
        List<String> rowIds = dataRepository.findDistinctRowIdsByTemplateId(templateId);
        List<TemplateColumn> columns = columnRepository.findByTemplateIdOrderByDisplayOrder(templateId);
        
        List<TemplateDataRow> rows = new ArrayList<>();
        for (String rowId : rowIds) {
            List<TemplateData> rowData = dataRepository.findByTemplateIdAndRowId(templateId, rowId);
            
            Map<String, Object> dataMap = new HashMap<>();
            for (TemplateData data : rowData) {
                TemplateColumn column = columns.stream()
                    .filter(col -> col.getId().equals(data.getColumnId()))
                    .findFirst()
                    .orElse(null);
                
                if (column != null) {
                    dataMap.put(column.getColumnName(), convertStringToValue(data.getValue(), column.getColumnType()));
                }
            }
            
            TemplateDataRow row = new TemplateDataRow();
            row.setRowId(rowId);
            row.setData(dataMap);
            rows.add(row);
        }
        
        return rows;
    }
    
    @Transactional(readOnly = true)
    public TemplateDataRow getDataRow(Long templateId, String rowId) {
        List<TemplateData> rowData = dataRepository.findByTemplateIdAndRowId(templateId, rowId);
        List<TemplateColumn> columns = columnRepository.findByTemplateIdOrderByDisplayOrder(templateId);
        
        Map<String, Object> dataMap = new HashMap<>();
        for (TemplateData data : rowData) {
            TemplateColumn column = columns.stream()
                .filter(col -> col.getId().equals(data.getColumnId()))
                .findFirst()
                .orElse(null);
            
            if (column != null) {
                dataMap.put(column.getColumnName(), convertStringToValue(data.getValue(), column.getColumnType()));
            }
        }
        
        TemplateDataRow row = new TemplateDataRow();
        row.setRowId(rowId);
        row.setData(dataMap);
        return row;
    }
    
    private void validateRowData(Long templateId, Map<String, Object> rowData, 
                                  List<TemplateColumn> columns, String excludeRowId) {
        for (TemplateColumn column : columns) {
            String columnName = column.getColumnName();
            Object value = rowData.get(columnName);
            
            // Check required fields
            if (column.getIsRequired() && (value == null || value.toString().trim().isEmpty())) {
                throw new IllegalArgumentException("Required field missing or empty: " + columnName);
            }
            
            if (value != null && !value.toString().trim().isEmpty()) {
                // Validate data type
                validateDataType(value, column);
                
                // Check unique constraint
                if (column.getIsUnique()) {
                    String stringValue = convertValueToString(value, column.getColumnType());
                    List<TemplateData> existing = dataRepository.findByColumnIdAndValue(column.getId(), stringValue);
                    
                    // Filter out current row if updating
                    if (excludeRowId != null) {
                        existing = existing.stream()
                            .filter(data -> !data.getRowId().equals(excludeRowId))
                            .collect(Collectors.toList());
                    }
                    
                    if (!existing.isEmpty()) {
                        throw new IllegalArgumentException("Duplicate value for unique field: " + columnName);
                    }
                }
            }
        }
    }
    
    private void validateDataType(Object value, TemplateColumn column) {
        String stringValue = value.toString().trim();
        
        switch (column.getColumnType()) {
            case EMAIL:
                if (!EMAIL_PATTERN.matcher(stringValue).matches()) {
                    throw new IllegalArgumentException("Invalid email format for field: " + column.getColumnName());
                }
                break;
            case PHONE:
                if (!PHONE_PATTERN.matcher(stringValue).matches()) {
                    throw new IllegalArgumentException("Invalid phone format for field: " + column.getColumnName());
                }
                break;
            case NUMBER:
                try {
                    Double.parseDouble(stringValue);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Invalid number format for field: " + column.getColumnName());
                }
                break;
            case DATE:
                try {
                    LocalDate.parse(stringValue);
                } catch (Exception e) {
                    throw new IllegalArgumentException("Invalid date format for field: " + column.getColumnName());
                }
                break;
            case BOOLEAN:
                if (!stringValue.equalsIgnoreCase("true") && !stringValue.equalsIgnoreCase("false")) {
                    throw new IllegalArgumentException("Invalid boolean value for field: " + column.getColumnName());
                }
                break;
        }
    }
    
    private String convertValueToString(Object value, ColumnType type) {
        if (value == null) return null;
        return value.toString();
    }
    
    private Object convertStringToValue(String value, ColumnType type) {
        if (value == null || value.trim().isEmpty()) return null;
        
        switch (type) {
            case NUMBER:
                return Double.parseDouble(value);
            case DATE:
                return LocalDate.parse(value);
            case BOOLEAN:
                return Boolean.parseBoolean(value);
            default:
                return value;
        }
    }
}