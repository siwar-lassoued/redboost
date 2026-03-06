// import-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    MatDialogRef,
    MAT_DIALOG_DATA,
    MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TemplateService } from '../../template.service';
import { TemplateResponse } from '../../../../../models/template.models';

interface DetailedError {
    rowNumber: number;
    columnName?: string;
    expectedType?: string;
    actualValue?: string;
    message: string;
}

interface ImportResult {
    totalRows: number;
    processedRows: number;
    successfulRows: number;
    failedRows: number;
    errors: DetailedError[];
    successfulRowIds?: string[];
}

@Component({
    selector: 'app-import-dialog',
    templateUrl: './import_dialog.html',
    styleUrls: ['./import_dialog.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        MatExpansionModule,
        MatTooltipModule,
    ],
})
export class ImportDialogComponent {
    selectedFile: File | null = null;
    fileType: 'excel' | 'csv' | null = null;
    uploading = false;
    uploadComplete = false;
    importResult: ImportResult | null = null;
    errorsPanelOpen = false;

    constructor(
        public dialogRef: MatDialogRef<ImportDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { template: TemplateResponse },
        private templateService: TemplateService,
    ) {}

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.processFile(files[0]);
        }
    }

    private processFile(file: File): void {
        const fileName = file.name.toLowerCase();

        if (
            fileName.endsWith('.xlsx') ||
            fileName.endsWith('.xls') ||
            fileName.endsWith('.csv')
        ) {
            this.selectedFile = file;
            this.fileType = fileName.endsWith('.csv') ? 'csv' : 'excel';
        } else {
            alert(
                'Format de fichier non supporté. Veuillez sélectionner un fichier Excel (.xlsx, .xls) ou CSV (.csv).',
            );
        }
    }

    uploadFile(): void {
        if (!this.selectedFile || !this.fileType) {
            return;
        }

        this.uploading = true;

        const uploadMethod =
            this.fileType === 'excel'
                ? this.templateService.importExcel(
                      this.data.template.id,
                      this.selectedFile,
                  )
                : this.templateService.importCSV(
                      this.data.template.id,
                      this.selectedFile,
                  );

        uploadMethod.subscribe({
            next: (result: ImportResult) => {
                this.uploading = false;
                this.uploadComplete = true;
                this.importResult = result;
                
                // Auto-expand errors if there are any
                if (result.errors && result.errors.length > 0) {
                    this.errorsPanelOpen = true;
                }
            },
            error: (error) => {
                console.error('Import error:', error);
                this.uploading = false;
                
                // Handle server-side validation errors
                const errorMessage = error.error?.error || error.error?.message || error.message || 'Une erreur inconnue est survenue';
                
                this.uploadComplete = true;
                this.importResult = {
                    totalRows: 0,
                    processedRows: 0,
                    successfulRows: 0,
                    failedRows: 0,
                    errors: [{
                        rowNumber: 0,
                        message: errorMessage
                    }]
                };
                this.errorsPanelOpen = true;
            },
        });
    }

    removeFile(): void {
        this.selectedFile = null;
        this.fileType = null;
        this.uploadComplete = false;
        this.importResult = null;
        this.errorsPanelOpen = false;
    }

    close(): void {
        this.dialogRef.close(this.uploadComplete && (this.importResult?.successfulRows ?? 0) > 0);
    }

    getFileIcon(): string {
        if (!this.fileType) return 'insert_drive_file';
        return this.fileType === 'excel' ? 'table_chart' : 'description';
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
        );
    }

    getErrorTypeIcon(error: DetailedError): string {
        if (error.columnName && error.expectedType) {
            return 'error';
        }
        return 'warning';
    }

    getErrorTypeClass(error: DetailedError): string {
        if (error.columnName && error.expectedType) {
            return 'validation-error';
        }
        return 'general-error';
    }

    hasDetailedErrors(): boolean {
        return this.importResult?.errors?.some(e => e.columnName != null) || false;
    }

    downloadErrorReport(): void {
        if (!this.importResult?.errors) return;

        const csvContent = this.generateErrorCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `import_errors_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    private generateErrorCSV(): string {
        if (!this.importResult?.errors) return '';

        const headers = ['Ligne', 'Colonne', 'Type attendu', 'Valeur fournie', 'Message d\'erreur'];
        const rows = this.importResult.errors.map(error => [
            error.rowNumber || 'N/A',
            error.columnName || 'N/A',
            error.expectedType || 'N/A',
            error.actualValue || 'N/A',
            error.message
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
    }
}