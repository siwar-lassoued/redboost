import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    MAT_DIALOG_DATA,
    MatDialogRef,
    MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TemplateResponse,ColumnDefinition} from '../../../../../models/template.models';

export interface ExportDialogData {
    template: TemplateResponse;
    totalRecords: number;
    filteredRecords: number;
    hasActiveFilters: boolean;
}

export interface ExportConfig {
    scope: 'filtered' | 'all';
    format: 'xlsx' | 'csv';
    columns: string[];
    includeHeaders: boolean;
}

@Component({
    selector: 'app-export-dialog',
    templateUrl: './export_dialog.html',
    styleUrls: ['./export_dialog.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatRadioModule,
        MatCheckboxModule,
    ],
})
export class ExportDialogComponent implements OnInit {
    exportScope: 'filtered' | 'all' = 'filtered';
    exportFormat: 'xlsx' | 'csv' = 'xlsx';
    selectedColumns: Set<string> = new Set();
    includeHeaders: boolean = true;

    allColumns: ColumnDefinition[] = [];

    constructor(
        public dialogRef: MatDialogRef<ExportDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ExportDialogData,
    ) {}

    ngOnInit(): void {
        // Sort columns by display order
        this.allColumns = [...this.data.template.columns].sort(
            (a, b) => a.displayOrder - b.displayOrder,
        );

        // Select all columns by default
        this.selectAllColumns();
    }

    get selectedCount(): number {
        return this.selectedColumns.size;
    }

    get totalColumns(): number {
        return this.allColumns.length + 1; // +1 for ID_UNIQUE
    }

    get recordCount(): number {
        return this.exportScope === 'filtered'
            ? this.data.filteredRecords
            : this.data.totalRecords;
    }

    isColumnSelected(columnName: string): boolean {
        return this.selectedColumns.has(columnName);
    }

    toggleColumn(columnName: string): void {
        if (this.selectedColumns.has(columnName)) {
            this.selectedColumns.delete(columnName);
        } else {
            this.selectedColumns.add(columnName);
        }
    }

    selectAllColumns(): void {
        this.selectedColumns.clear();
        this.selectedColumns.add('ID_UNIQUE');
        this.allColumns.forEach((col) =>
            this.selectedColumns.add(col.columnName),
        );
    }

    deselectAllColumns(): void {
        this.selectedColumns.clear();
    }

    toggleAllColumns(): void {
        if (this.selectedCount === this.totalColumns) {
            this.deselectAllColumns();
        } else {
            this.selectAllColumns();
        }
    }

    isRequiredColumn(columnName: string): boolean {
        if (columnName === 'ID_UNIQUE') return true;
        const col = this.allColumns.find((c) => c.columnName === columnName);
        return col?.isRequired || false;
    }

    isUniqueColumn(columnName: string): boolean {
        if (columnName === 'ID_UNIQUE') return true;
        const col = this.allColumns.find((c) => c.columnName === columnName);
        return col?.isUnique || false;
    }

    getColumnType(columnName: string): string {
        if (columnName === 'ID_UNIQUE') return 'text';
        const col = this.allColumns.find((c) => c.columnName === columnName);
        return col?.columnType.toLowerCase() || 'text';
    }

    getColumnTypeLabel(type: string): string {
        const typeMap: { [key: string]: string } = {
            text: 'text',
            number: 'number',
            date: 'date',
            email: 'email',
            phone: 'phone',
            select: 'select',
            textarea: 'text',
        };
        return typeMap[type.toLowerCase()] || 'text';
    }

    onCancel(): void {
        this.dialogRef.close(null);
    }

    onExport(): void {
        const config: ExportConfig = {
            scope: this.exportScope,
            format: this.exportFormat,
            columns: Array.from(this.selectedColumns),
            includeHeaders: this.includeHeaders,
        };
        this.dialogRef.close(config);
    }
}
