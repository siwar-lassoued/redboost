// models/template.model.ts
export enum ColumnType {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    DATE = 'DATE',
    EMAIL = 'EMAIL',
    PHONE = 'PHONE',
    SELECT = 'SELECT',
    BOOLEAN = 'BOOLEAN',
}

export interface ColumnDefinition {
    id?: number;
    columnName: string;
    columnType: ColumnType;
    isRequired: boolean;
    isUnique: boolean;
    displayOrder: number;
    options?: string[];
}
export interface CreateTemplateRequest {
    name: string;
    description: string;
    type: string;
    columns: ColumnDefinition[];
}

export interface TemplateResponse {
    id: number;
    name: string;
    description: string;
    type: string;
    columns: ColumnDefinition[];
    createdAt: string;
    updatedAt: string;
}
export interface TemplateStats {
    totalBases: number;
    totalEnregistrements: number;
    basesPrincipales: number;
}

export interface TemplateDataRow {
    rowId: string;
    data: { [key: string]: any };
}

export interface ExportDataRequest {
    templateId?: number;
    columnIds?: number[];
    exportFormat: 'EXCEL' | 'CSV';
    includeHeaders: boolean;
    exportFiltered?: boolean;
    rowIds?: string[]; // NEW: Array of specific row IDs to export
}
export interface ImportResult {
    totalRows: number;
    processedRows: number;
    successfulRows: number;
    failedRows: number;
    errors: string[];
}
