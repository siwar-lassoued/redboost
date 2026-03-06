// dialogs/data-view-dialog/data-view-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    MatDialogRef,
    MAT_DIALOG_DATA,
    MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TemplateService } from '../../template.service';
import { TemplateResponse, TemplateDataRow } from '../../../../../models/template.models';

@Component({
    selector: 'app-data-view-dialog',
    templateUrl: './dataview_dialog.html',
    styleUrls: ['./dataview_dialog.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatProgressSpinnerModule,
    ],
})
export class DataViewDialogComponent implements OnInit {
    dataRows: TemplateDataRow[] = [];
    displayedColumns: string[] = [];
    columnNames: string[] = [];
    loading = true;

    constructor(
        public dialogRef: MatDialogRef<DataViewDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { template: TemplateResponse },
        private templateService: TemplateService,
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;

        // Get column names from template
        this.columnNames = this.data.template.columns
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((col) => col.columnName);

        this.displayedColumns = [...this.columnNames, 'actions'];

        // Load data
        this.templateService.getAllData(this.data.template.id).subscribe({
            next: (rows) => {
                this.dataRows = rows;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading data:', error);
                this.loading = false;
            },
        });
    }

    deleteRow(rowId: string): void {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) {
            this.templateService
                .deleteDataRow(this.data.template.id, rowId)
                .subscribe({
                    next: () => {
                        this.dataRows = this.dataRows.filter(
                            (row) => row.rowId !== rowId,
                        );
                    },
                    error: (error) => {
                        console.error('Error deleting row:', error);
                        alert('Erreur lors de la suppression');
                    },
                });
        }
    }

    exportExcel(): void {
        this.templateService.exportExcel(this.data.template.id).subscribe({
            next: (blob) => {
                const filename = `${this.data.template.name}_${new Date().getTime()}.xlsx`;
                this.templateService.downloadFile(blob, filename);
            },
            error: (error) => {
                console.error('Error exporting:', error);
                alert("Erreur lors de l'export");
            },
        });
    }

    close(): void {
        this.dialogRef.close();
    }

    getCellValue(row: TemplateDataRow, columnName: string): any {
        return row.data[columnName] || '-';
    }

    getColumnType(columnName: string): string {
        const column = this.data.template.columns.find(
            (col) => col.columnName === columnName,
        );
        return column?.columnType || 'TEXT';
    }
}
