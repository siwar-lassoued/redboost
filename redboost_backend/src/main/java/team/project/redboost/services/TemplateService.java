// TemplateService.java
package team.project.redboost.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.dto.ColumnDefinition;
import team.project.redboost.dto.CreateTemplateRequest;
import team.project.redboost.dto.TemplateResponse;
import team.project.redboost.entities.ColumnType;
import team.project.redboost.entities.DatabaseTemplate;
import team.project.redboost.entities.TemplateColumn;
import team.project.redboost.repositories.DatabaseTemplateRepository;
import team.project.redboost.repositories.TemplateColumnRepository;
import team.project.redboost.repositories.TemplateDataRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TemplateService {

    private final DatabaseTemplateRepository templateRepository;
    private final TemplateColumnRepository columnRepository;
    private final TemplateDataRepository dataRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public TemplateResponse createTemplate(CreateTemplateRequest request, Long userId) {
        // Check if template name already exists for this user
        if (templateRepository.findByNameAndCreatedBy(request.getName(), userId).isPresent()) {
            throw new IllegalArgumentException("Template with this name already exists");
        }

        // Create template
        DatabaseTemplate template = new DatabaseTemplate();
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setType(request.getType());
        template.setCreatedBy(userId);
        template = templateRepository.save(template);

        // Create columns
        List<TemplateColumn> columns = new ArrayList<>();
        for (int i = 0; i < request.getColumns().size(); i++) {
            ColumnDefinition colDef = request.getColumns().get(i);

            TemplateColumn column = new TemplateColumn();
            column.setTemplate(template);
            column.setColumnName(colDef.getColumnName());
            column.setColumnType(colDef.getColumnType());
            column.setIsRequired(colDef.getIsRequired() != null ? colDef.getIsRequired() : false);
            column.setIsUnique(colDef.getIsUnique() != null ? colDef.getIsUnique() : false);
            column.setDisplayOrder(colDef.getDisplayOrder() != null ? colDef.getDisplayOrder() : i);

            // Serialize options for SELECT type
            if (colDef.getColumnType() == ColumnType.SELECT && colDef.getOptions() != null) {
                try {
                    column.setOptions(objectMapper.writeValueAsString(colDef.getOptions()));
                } catch (Exception e) {
                    throw new RuntimeException("Failed to serialize options", e);
                }
            }

            columns.add(column);
        }

        columnRepository.saveAll(columns);
        template.setColumns(columns);

        return convertToResponse(template);
    }

    @Transactional(readOnly = true)
    public TemplateResponse getTemplate(Long templateId) {
        DatabaseTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));
        return convertToResponse(template);
    }

    @Transactional(readOnly = true)
    public List<TemplateResponse> getAllTemplates(Long userId) {
        return templateRepository.findByCreatedBy(userId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteTemplate(Long templateId) {
        templateRepository.deleteById(templateId);
    }

    @Transactional
    public TemplateResponse updateTemplate(Long templateId, CreateTemplateRequest request) {
        DatabaseTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));

        // Update basic template fields
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setType(request.getType());

        // Get existing columns
        List<TemplateColumn> existingColumns = template.getColumns();

        // Create a map of existing columns by ID for quick lookup
        Map<Long, TemplateColumn> existingColumnsMap = existingColumns.stream()
                .filter(col -> col.getId() != null)
                .collect(Collectors.toMap(TemplateColumn::getId, col -> col));

        // Track which existing columns are still in use
        Set<Long> usedColumnIds = new HashSet<>();

        // Process new columns from request
        List<TemplateColumn> updatedColumns = new ArrayList<>();
        for (int i = 0; i < request.getColumns().size(); i++) {
            ColumnDefinition colDef = request.getColumns().get(i);
            TemplateColumn column;

            // Check if this is an existing column (has ID) or a new one
            if (colDef.getId() != null && existingColumnsMap.containsKey(colDef.getId())) {
                // Update existing column
                column = existingColumnsMap.get(colDef.getId());
                usedColumnIds.add(colDef.getId());
            } else {
                // Create new column
                column = new TemplateColumn();
                column.setTemplate(template);
            }

            // Update column properties
            column.setColumnName(colDef.getColumnName());
            column.setColumnType(colDef.getColumnType());
            column.setIsRequired(colDef.getIsRequired() != null ? colDef.getIsRequired() : false);
            column.setIsUnique(colDef.getIsUnique() != null ? colDef.getIsUnique() : false);
            column.setDisplayOrder(colDef.getDisplayOrder() != null ? colDef.getDisplayOrder() : i);

            // Handle SELECT type options
            if (colDef.getColumnType() == ColumnType.SELECT && colDef.getOptions() != null) {
                try {
                    column.setOptions(objectMapper.writeValueAsString(colDef.getOptions()));
                } catch (Exception e) {
                    throw new RuntimeException("Failed to serialize options", e);
                }
            } else {
                column.setOptions(null);
            }

            updatedColumns.add(column);
        }

        // Find columns to remove (existing columns not in the new list)
        List<TemplateColumn> columnsToRemove = existingColumns.stream()
                .filter(col -> col.getId() != null && !usedColumnIds.contains(col.getId()))
                .collect(Collectors.toList());

        // Remove columns that are no longer needed
        // Important: Remove from the collection first, then delete from repository
        existingColumns.removeAll(columnsToRemove);
        if (!columnsToRemove.isEmpty()) {
            columnRepository.deleteAll(columnsToRemove);
        }

        // Add new columns to the collection
        for (TemplateColumn column : updatedColumns) {
            if (column.getId() == null) {
                existingColumns.add(column);
            }
        }

        // Save the template (cascade will handle column saves)
        template = templateRepository.save(template);

        return convertToResponse(template);
    }

    private TemplateResponse convertToResponse(DatabaseTemplate template) {
        TemplateResponse response = new TemplateResponse();
        response.setId(template.getId());
        response.setName(template.getName());
        response.setDescription(template.getDescription());
        response.setType(template.getType());
        response.setCreatedAt(template.getCreatedAt());
        response.setUpdatedAt(template.getUpdatedAt());

        List<ColumnDefinition> columnDefs = template.getColumns().stream()
                .sorted(Comparator.comparing(TemplateColumn::getDisplayOrder))
                .map(col -> {
                    ColumnDefinition def = new ColumnDefinition();
                    def.setId(col.getId()); // Include ID in response
                    def.setColumnName(col.getColumnName());
                    def.setColumnType(col.getColumnType());
                    def.setIsRequired(col.getIsRequired());
                    def.setIsUnique(col.getIsUnique());
                    def.setDisplayOrder(col.getDisplayOrder());

                    if (col.getOptions() != null) {
                        try {
                            List<String> options = objectMapper.readValue(
                                    col.getOptions(),
                                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
                            );
                            def.setOptions(options);
                        } catch (Exception e) {
                            // Handle error
                        }
                    }

                    return def;
                })
                .collect(Collectors.toList());

        response.setColumns(columnDefs);
        return response;
    }
}