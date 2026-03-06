package team.project.redboost.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.DatabaseTemplate;
import team.project.redboost.entities.TemplateColumn;
import team.project.redboost.repositories.DatabaseTemplateRepository;
import team.project.redboost.repositories.TemplateColumnRepository;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImportService {

    private final DatabaseTemplateRepository templateRepository;
    private final TemplateColumnRepository columnRepository;
    private final TemplateDataService templateDataService;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // Custom exception for detailed error reporting
    public static class ImportValidationException extends Exception {
        private final int rowNumber;
        private final String columnName;
        private final String expectedType;
        private final String actualValue;

        public ImportValidationException(int rowNumber, String columnName, String expectedType, String actualValue, String message) {
            super(message);
            this.rowNumber = rowNumber;
            this.columnName = columnName;
            this.expectedType = expectedType;
            this.actualValue = actualValue;
        }

        public Map<String, Object> toDetailedError() {
            Map<String, Object> error = new HashMap<>();
            error.put("rowNumber", rowNumber);
            error.put("columnName", columnName);
            error.put("expectedType", expectedType);
            error.put("actualValue", actualValue);
            error.put("message", getMessage());
            return error;
        }
    }

    @Transactional
    public Map<String, Object> importFromExcel(Long templateId, MultipartFile file) {
        try {
            DatabaseTemplate template = templateRepository.findById(templateId)
                    .orElseThrow(() -> new IllegalArgumentException("Modèle introuvable"));

            List<TemplateColumn> columns = columnRepository.findByTemplateIdOrderByDisplayOrder(templateId);

            InputStream inputStream = file.getInputStream();
            Workbook workbook = new XSSFWorkbook(inputStream);
            Sheet sheet = workbook.getSheetAt(0);

            // Read header row
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new IllegalArgumentException("Le fichier Excel est vide");
            }

            // Map Excel columns to template columns
            Map<Integer, TemplateColumn> columnMapping = mapExcelColumns(headerRow, columns);

            if (columnMapping.isEmpty()) {
                throw new IllegalArgumentException("Aucune colonne correspondante trouvée dans le fichier Excel. Veuillez vérifier les noms des colonnes.");
            }

            // Validate that all required columns are present
            List<String> missingColumns = validateColumnsPresent(columns, columnMapping);
            if (!missingColumns.isEmpty()) {
                throw new IllegalArgumentException("Colonnes requises manquantes dans le fichier Excel : " + String.join(", ", missingColumns));
            }

            List<Map<String, Object>> detailedErrors = new ArrayList<>();
            List<String> successfulRows = new ArrayList<>();
            int totalRows = 0;
            int processedRows = 0;
            int lastRowNum = sheet.getLastRowNum();

            // Process data rows
            for (int i = 1; i <= lastRowNum; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) {
                    continue;
                }

                totalRows++;
                int currentRowNumber = i + 1; // Excel row number (1-based, accounting for header)

                try {
                    Map<String, Object> rowData = extractRowData(row, columnMapping, currentRowNumber);

                    // Validate required fields
                    validateRequiredFields(rowData, columns, currentRowNumber);

                    // Process row in separate transaction to avoid marking parent transaction for rollback
                    String rowId = processDataRow(templateId, rowData);
                    successfulRows.add(rowId);
                    processedRows++;
                } catch (ImportValidationException e) {
                    detailedErrors.add(e.toDetailedError());
                    log.warn("Erreur de validation à la ligne {}: {}", currentRowNumber, e.getMessage());
                } catch (Exception e) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("rowNumber", currentRowNumber);
                    error.put("message", e.getMessage());
                    detailedErrors.add(error);
                    log.warn("Échec de l'importation de la ligne {}: {}", currentRowNumber, e.getMessage());
                }
            }

            workbook.close();
            inputStream.close();

            Map<String, Object> result = new HashMap<>();
            result.put("totalRows", totalRows);
            result.put("processedRows", processedRows);
            result.put("successfulRows", successfulRows.size());
            result.put("failedRows", detailedErrors.size());
            result.put("errors", detailedErrors);
            result.put("successfulRowIds", successfulRows);

            return result;

        } catch (Exception e) {
            log.error("Erreur lors de l'importation du fichier Excel", e);
            throw new RuntimeException("Échec de l'importation du fichier Excel : " + e.getMessage(), e);
        }
    }

    // Separate method with its own transaction to prevent rollback propagation
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String processDataRow(Long templateId, Map<String, Object> rowData) {
        return templateDataService.addDataRow(templateId, rowData);
    }

    @Transactional
    public Map<String, Object> importFromCSV(Long templateId, MultipartFile file) {
        try {
            DatabaseTemplate template = templateRepository.findById(templateId)
                    .orElseThrow(() -> new IllegalArgumentException("Modèle introuvable"));

            List<TemplateColumn> columns = columnRepository.findByTemplateIdOrderByDisplayOrder(templateId);

            InputStream inputStream = file.getInputStream();
            Scanner scanner = new Scanner(inputStream);

            // Read header
            if (!scanner.hasNextLine()) {
                throw new IllegalArgumentException("Le fichier CSV est vide");
            }

            String headerLine = scanner.nextLine();
            String[] headers = parseCSVLine(headerLine);
            Map<Integer, TemplateColumn> columnMapping = mapCSVColumns(headers, columns);

            if (columnMapping.isEmpty()) {
                throw new IllegalArgumentException("Aucune colonne correspondante trouvée dans le fichier CSV. Veuillez vérifier les noms des colonnes.");
            }

            // Validate that all required columns are present
            List<String> missingColumns = validateColumnsPresent(columns, columnMapping);
            if (!missingColumns.isEmpty()) {
                throw new IllegalArgumentException("Colonnes requises manquantes dans le fichier CSV : " + String.join(", ", missingColumns));
            }

            List<Map<String, Object>> detailedErrors = new ArrayList<>();
            List<String> successfulRows = new ArrayList<>();
            int totalRows = 0;
            int processedRows = 0;
            int lineNumber = 1;

            // Process data rows
            while (scanner.hasNextLine()) {
                lineNumber++;
                String line = scanner.nextLine().trim();

                if (line.isEmpty()) {
                    continue;
                }

                totalRows++;

                try {
                    String[] values = parseCSVLine(line);
                    Map<String, Object> rowData = extractCSVRowData(values, columnMapping, lineNumber);

                    // Validate required fields
                    validateRequiredFields(rowData, columns, lineNumber);

                    String rowId = processDataRow(templateId, rowData);
                    successfulRows.add(rowId);
                    processedRows++;
                } catch (ImportValidationException e) {
                    detailedErrors.add(e.toDetailedError());
                    log.warn("Erreur de validation à la ligne {}: {}", lineNumber, e.getMessage());
                } catch (Exception e) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("rowNumber", lineNumber);
                    error.put("message", e.getMessage());
                    detailedErrors.add(error);
                    log.warn("Échec de l'importation de la ligne {}: {}", lineNumber, e.getMessage());
                }
            }

            scanner.close();
            inputStream.close();

            Map<String, Object> result = new HashMap<>();
            result.put("totalRows", totalRows);
            result.put("processedRows", processedRows);
            result.put("successfulRows", successfulRows.size());
            result.put("failedRows", detailedErrors.size());
            result.put("errors", detailedErrors);
            result.put("successfulRowIds", successfulRows);

            return result;

        } catch (Exception e) {
            log.error("Erreur lors de l'importation du fichier CSV", e);
            throw new RuntimeException("Échec de l'importation du fichier CSV : " + e.getMessage(), e);
        }
    }

    // Helper methods

    private List<String> validateColumnsPresent(List<TemplateColumn> columns, Map<Integer, TemplateColumn> columnMapping) {
        List<String> missingColumns = new ArrayList<>();
        Set<String> mappedColumnNames = new HashSet<>();

        for (TemplateColumn col : columnMapping.values()) {
            mappedColumnNames.add(col.getColumnName());
        }

        for (TemplateColumn column : columns) {
            if (column.getIsRequired() && !mappedColumnNames.contains(column.getColumnName())) {
                missingColumns.add(column.getColumnName());
            }
        }

        return missingColumns;
    }

    private Map<Integer, TemplateColumn> mapExcelColumns(Row headerRow, List<TemplateColumn> columns) {
        Map<Integer, TemplateColumn> mapping = new HashMap<>();

        // Create a map of normalized column names to template columns
        Map<String, TemplateColumn> columnMap = new HashMap<>();
        for (TemplateColumn column : columns) {
            String normalizedName = normalizeColumnName(column.getColumnName());
            columnMap.put(normalizedName, column);
            log.debug("Template column: '{}' normalized to '{}'", column.getColumnName(), normalizedName);
        }

        // Map Excel header cells to template columns
        for (Cell cell : headerRow) {
            if (cell.getCellType() == CellType.STRING) {
                String headerValue = normalizeColumnName(cell.getStringCellValue());
                TemplateColumn column = columnMap.get(headerValue);
                if (column != null) {
                    mapping.put(cell.getColumnIndex(), column);
                    log.debug("Mapped Excel column {} '{}' to template column '{}'",
                            cell.getColumnIndex(), cell.getStringCellValue(), column.getColumnName());
                } else {
                    log.warn("Excel column '{}' (normalized: '{}') not found in template",
                            cell.getStringCellValue(), headerValue);
                }
            }
        }

        log.info("Mapped {} Excel columns to template columns", mapping.size());
        return mapping;
    }

    private Map<Integer, TemplateColumn> mapCSVColumns(String[] headers, List<TemplateColumn> columns) {
        Map<Integer, TemplateColumn> mapping = new HashMap<>();

        // Create a map of normalized column names to template columns
        Map<String, TemplateColumn> columnMap = new HashMap<>();
        for (TemplateColumn column : columns) {
            String normalizedName = normalizeColumnName(column.getColumnName());
            columnMap.put(normalizedName, column);
        }

        for (int i = 0; i < headers.length; i++) {
            String headerValue = normalizeColumnName(headers[i]);
            TemplateColumn column = columnMap.get(headerValue);
            if (column != null) {
                mapping.put(i, column);
                log.debug("Mapped CSV column {} '{}' to template column '{}'",
                        i, headers[i], column.getColumnName());
            }
        }

        return mapping;
    }

    private String normalizeColumnName(String name) {
        if (name == null) return "";
        // Remove spaces, convert to lowercase, remove special characters
        return name.trim().toLowerCase()
                .replaceAll("\\s+", "")
                .replaceAll("[^a-z0-9]", "");
    }

    private Map<String, Object> extractRowData(Row row, Map<Integer, TemplateColumn> columnMapping, int rowNumber) throws ImportValidationException {
        Map<String, Object> rowData = new HashMap<>();

        for (Map.Entry<Integer, TemplateColumn> entry : columnMapping.entrySet()) {
            Cell cell = row.getCell(entry.getKey());
            TemplateColumn column = entry.getValue();

            if (cell != null && cell.getCellType() != CellType.BLANK) {
                try {
                    Object value = getCellValue(cell, column, rowNumber);
                    if (value != null) {
                        rowData.put(column.getColumnName(), value);
                    }
                } catch (ImportValidationException e) {
                    throw e; // Re-throw validation exceptions
                } catch (Exception e) {
                    throw new ImportValidationException(
                            rowNumber,
                            column.getColumnName(),
                            column.getColumnType().toString(),
                            cell.toString(),
                            "Erreur lors du traitement de la cellule : " + e.getMessage()
                    );
                }
            }
        }

        return rowData;
    }

    private Map<String, Object> extractCSVRowData(String[] values, Map<Integer, TemplateColumn> columnMapping, int rowNumber) throws ImportValidationException {
        Map<String, Object> rowData = new HashMap<>();

        for (Map.Entry<Integer, TemplateColumn> entry : columnMapping.entrySet()) {
            int index = entry.getKey();
            TemplateColumn column = entry.getValue();

            if (index < values.length) {
                String value = values[index].trim();
                if (!value.isEmpty()) {
                    try {
                        Object parsedValue = parseValue(value, column, rowNumber);
                        rowData.put(column.getColumnName(), parsedValue);
                    } catch (ImportValidationException e) {
                        throw e;
                    }
                }
            }
        }

        return rowData;
    }

    private void validateRequiredFields(Map<String, Object> rowData, List<TemplateColumn> columns, int rowNumber) throws ImportValidationException {
        for (TemplateColumn column : columns) {
            if (column.getIsRequired()) {
                Object value = rowData.get(column.getColumnName());
                if (value == null || value.toString().trim().isEmpty()) {
                    throw new ImportValidationException(
                            rowNumber,
                            column.getColumnName(),
                            column.getColumnType().toString(),
                            "empty/null",
                            "Le champ obligatoire '" + column.getColumnName() + "' est manquant ou vide"
                    );
                }
            }
        }
    }

    private Object getCellValue(Cell cell, TemplateColumn column, int rowNumber) throws ImportValidationException {
        if (cell == null) return null;

        try {
            String cellValueAsString = getCellValueAsString(cell);

            switch (column.getColumnType()) {
                case NUMBER:
                    return parseNumberValue(cell, cellValueAsString, column, rowNumber);
                case DATE:
                    return parseDateValue(cell, cellValueAsString, column, rowNumber);
                case BOOLEAN:
                    return parseBooleanValue(cellValueAsString, column, rowNumber);
                case TEXT:
                default:
                    return cellValueAsString;
            }
        } catch (ImportValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new ImportValidationException(
                    rowNumber,
                    column.getColumnName(),
                    column.getColumnType().toString(),
                    cell.toString(),
                    "Erreur inattendue : " + e.getMessage()
            );
        }
    }

    private String getCellValueAsString(Cell cell) {
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toLocalDate().format(DATE_FORMATTER);
                }
                return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return String.valueOf(cell.getNumericCellValue());
                } catch (Exception e) {
                    return cell.getStringCellValue();
                }
            case BLANK:
                return "";
            default:
                return cell.toString();
        }
    }

    private Object parseNumberValue(Cell cell, String cellValueAsString, TemplateColumn column, int rowNumber) throws ImportValidationException {
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return cell.getNumericCellValue();
            } else if (cell.getCellType() == CellType.STRING) {
                String value = cellValueAsString.trim();
                // Check if string contains non-numeric characters (except decimal point and minus sign)
                if (!value.matches("-?\\d+(\\.\\d+)?")) {
                    throw new ImportValidationException(
                            rowNumber,
                            column.getColumnName(),
                            "NUMBER",
                            cellValueAsString,
                            String.format("Format numérique invalide : '%s' contient des caractères non numériques. Une valeur numérique est attendue.", cellValueAsString)
                    );
                }
                return Double.parseDouble(value);
            } else {
                throw new ImportValidationException(
                        rowNumber,
                        column.getColumnName(),
                        "NUMBER",
                        cellValueAsString,
                        String.format("Type de cellule invalide pour un champ numérique. Trouvé : %s", cell.getCellType())
                );
            }
        } catch (NumberFormatException e) {
            throw new ImportValidationException(
                    rowNumber,
                    column.getColumnName(),
                    "NUMBER",
                    cellValueAsString,
                    String.format("Impossible de convertir '%s' en nombre. Veuillez vous assurer que la valeur est numérique.", cellValueAsString)
            );
        }
    }

    private Object parseDateValue(Cell cell, String cellValueAsString, TemplateColumn column, int rowNumber) throws ImportValidationException {
        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toLocalDate().format(DATE_FORMATTER);
            } else {
                return LocalDate.parse(cellValueAsString, DATE_FORMATTER).format(DATE_FORMATTER);
            }
        } catch (DateTimeParseException e) {
            throw new ImportValidationException(
                    rowNumber,
                    column.getColumnName(),
                    "DATE",
                    cellValueAsString,
                    String.format("Format de date invalide : '%s'. Format attendu : yyyy-MM-dd (ex: 2024-12-30)", cellValueAsString)
            );
        }
    }

    private Object parseBooleanValue(String cellValueAsString, TemplateColumn column, int rowNumber) throws ImportValidationException {
        String value = cellValueAsString.toLowerCase().trim();
        if (value.equals("true") || value.equals("false") || value.equals("1") || value.equals("0") ||
                value.equals("yes") || value.equals("no")) {
            return value.equals("true") || value.equals("1") || value.equals("yes");
        } else {
            throw new ImportValidationException(
                    rowNumber,
                    column.getColumnName(),
                    "BOOLEAN",
                    cellValueAsString,
                    String.format("Valeur booléenne invalide : '%s'. Attendu : true/false, yes/no, ou 1/0", cellValueAsString)
            );
        }
    }

    private Object parseValue(String value, TemplateColumn column, int rowNumber) throws ImportValidationException {
        if (value == null || value.trim().isEmpty()) return null;

        String trimmedValue = value.trim();

        try {
            switch (column.getColumnType()) {
                case NUMBER:
                    if (!trimmedValue.matches("-?\\d+(\\.\\d+)?")) {
                        throw new ImportValidationException(
                                rowNumber,
                                column.getColumnName(),
                                "NUMBER",
                                value,
                                String.format("Format numérique invalide : '%s' contient des caractères non numériques. Une valeur numérique est attendue.", value)
                        );
                    }
                    return Double.parseDouble(trimmedValue);

                case DATE:
                    try {
                        return LocalDate.parse(trimmedValue, DATE_FORMATTER).format(DATE_FORMATTER);
                    } catch (DateTimeParseException e) {
                        throw new ImportValidationException(
                                rowNumber,
                                column.getColumnName(),
                                "DATE",
                                value,
                                String.format("Format de date invalide : '%s'. Format attendu : yyyy-MM-dd (ex: 2024-12-30)", value)
                        );
                    }

                case BOOLEAN:
                    String boolValue = trimmedValue.toLowerCase();
                    if (boolValue.equals("true") || boolValue.equals("false") || boolValue.equals("1") ||
                            boolValue.equals("0") || boolValue.equals("yes") || boolValue.equals("no")) {
                        return boolValue.equals("true") || boolValue.equals("1") || boolValue.equals("yes");
                    } else {
                        throw new ImportValidationException(
                                rowNumber,
                                column.getColumnName(),
                                "BOOLEAN",
                                value,
                                String.format("Valeur booléenne invalide : '%s'. Attendu : true/false, yes/no, ou 1/0", value)
                        );
                    }

                default:
                    return trimmedValue;
            }
        } catch (ImportValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new ImportValidationException(
                    rowNumber,
                    column.getColumnName(),
                    column.getColumnType().toString(),
                    value,
                    "Erreur lors de l'analyse de la valeur : " + e.getMessage()
            );
        }
    }

    private String[] parseCSVLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);

            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                values.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }

        values.add(current.toString());
        return values.toArray(new String[0]);
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;

        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String cellValue = cell.toString().trim();
                if (!cellValue.isEmpty()) {
                    return false;
                }
            }
        }
        return true;
    }
}