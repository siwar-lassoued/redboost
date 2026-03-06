// template-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TemplateService } from '../template.service';
import {
    TemplateResponse,
    TemplateStats,
} from '../../../../models/template.models';
import { CreateTemplateDialogComponent } from '../dialogs/create_template/create_template_dialog';
import { ImportDialogComponent } from '../dialogs/import_dialog/import_dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DataViewDialogComponent } from '../dialogs/data_view/dataview_dialog';

@Component({
    selector: 'app-template-list',
    templateUrl: './suivitemplate.html',
    styleUrls: ['./suivitemplate.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonModule,
        MatMenuModule,
        MatProgressSpinnerModule,
    ],
})
export class TemplateListComponent implements OnInit {
    templates: TemplateResponse[] = [];
    filteredTemplates: TemplateResponse[] = [];
    templateDataCounts: Map<number, number> = new Map();
    searchText: string = '';
    selectedFilter: string = 'all';
    loading: boolean = false;

    stats: TemplateStats = {
        totalBases: 0,
        totalEnregistrements: 0,
        basesPrincipales: 0,
    };

    // Template color mapping by index
    private templateColors: string[] = [
        'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Pink
        'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', // Cyan
        'linear-gradient(135deg, #7e22ce 0%, #9333ea 100%)', // Purple
        'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', // Cyan
        'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', // Violet
        'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', // Indigo
    ];

    // Template icon mapping by index
    private templateIcons: string[] = [
        'business_center',
        'star',
        'groups',
        'event',
        'people',
        'school',
    ];

    constructor(
        private templateService: TemplateService,
        private dialog: MatDialog,
        private router: Router,
        private snackBar: MatSnackBar,
    ) {}

    ngOnInit(): void {
        this.loadTemplates();
        this.loadStats();
    }

    loadTemplates(): void {
        this.loading = true;
        this.templateService.getAllTemplates().subscribe({
            next: (templates) => {
                this.templates = templates;
                this.filteredTemplates = templates;
                this.loading = false;

                // Load data counts for each template
                templates.forEach((template) => {
                    this.loadTemplateDataCount(template.id);
                });
            },
            error: (error) => {
                console.error('Error loading templates:', error);
                this.showError('Erreur lors du chargement des templates');
                this.loading = false;
            },
        });
    }

    loadTemplateDataCount(templateId: number): void {
        this.templateService.getAllData(templateId).subscribe({
            next: (data) => {
                this.templateDataCounts.set(templateId, data.length);
            },
            error: (error) => {
                console.error(
                    `Error loading data count for template ${templateId}:`,
                    error,
                );
                this.templateDataCounts.set(templateId, 0);
            },
        });
    }

    loadStats(): void {
        this.templateService.getTemplateStats().subscribe({
            next: (stats) => {
                this.stats = stats;
            },
            error: (error) => {
                console.error('Error loading stats:', error);
            },
        });
    }

    onSearch(): void {
        if (!this.searchText.trim()) {
            this.filteredTemplates = this.templates;
            return;
        }

        const search = this.searchText.toLowerCase();
        this.filteredTemplates = this.templates.filter(
            (template) =>
                template.name.toLowerCase().includes(search) ||
                template.description?.toLowerCase().includes(search) ||
                template.type?.toLowerCase().includes(search),
        );
    }

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(CreateTemplateDialogComponent, {
            width: '800px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            disableClose: true,
            panelClass: 'custom-dialog-container',
            autoFocus: false,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadTemplates();
                this.loadStats();
                this.showSuccess('Template créé avec succès');
            }
        });
    }

    openEditDialog(template: TemplateResponse, event: Event): void {
        event.stopPropagation();

        const dialogRef = this.dialog.open(CreateTemplateDialogComponent, {
            width: '800px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            disableClose: true,
            panelClass: 'custom-dialog-container',
            autoFocus: false,
            data: { template },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadTemplates();
                this.showSuccess('Template mis à jour avec succès');
            }
        });
    }

    viewTemplate(template: TemplateResponse): void {
        // Open data view dialog
        const dialogRef = this.dialog.open(DataViewDialogComponent, {
            width: '90vw',
            maxWidth: '1200px',
            height: '90vh',
            data: { template },
        });

        dialogRef.afterClosed().subscribe(() => {
            // Reload data count in case rows were deleted
            this.loadTemplateDataCount(template.id);
        });
    }

    deleteTemplate(template: TemplateResponse, event: Event): void {
        event.stopPropagation();

        if (
            confirm(
                `Êtes-vous sûr de vouloir supprimer la base "${template.name}" ?`,
            )
        ) {
            this.templateService.deleteTemplate(template.id).subscribe({
                next: () => {
                    this.loadTemplates();
                    this.loadStats();
                    this.showSuccess('Template supprimé avec succès');
                },
                error: (error) => {
                    console.error('Error deleting template:', error);
                    this.showError('Erreur lors de la suppression du template');
                },
            });
        }
    }

    // ==================== IMPORT/EXPORT ====================

    openImportDialog(template: TemplateResponse, event: Event): void {
        event.stopPropagation();

        const dialogRef = this.dialog.open(ImportDialogComponent, {
            width: '600px',
            data: { template },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.showSuccess('Données importées avec succès');
                // Reload data count for this template
                this.loadTemplateDataCount(template.id);
            }
        });
    }

    exportTemplate(
        template: TemplateResponse,
        format: 'excel' | 'csv',
        event?: Event,
    ): void {
        if (event) {
            event.stopPropagation();
        }

        const exportMethod =
            format === 'excel'
                ? this.templateService.exportExcel(template.id)
                : this.templateService.exportCSV(template.id);

        exportMethod.subscribe({
            next: (blob) => {
                const filename = `${template.name}_export_${new Date().getTime()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
                this.templateService.downloadFile(blob, filename);
                this.showSuccess(
                    `Fichier ${format.toUpperCase()} exporté avec succès`,
                );
            },
            error: (error) => {
                console.error(`Error exporting ${format}:`, error);
                this.showError(
                    `Erreur lors de l'export ${format.toUpperCase()}`,
                );
            },
        });
    }

    openFilterDialog(template: TemplateResponse, event: Event): void {
        event.stopPropagation();
        // TODO: Implement filter dialog
        console.log('Open filter dialog for:', template);
        this.showSuccess('Fonctionnalité de filtrage à venir');
    }

    downloadEmptyTemplate(template: TemplateResponse, event: Event): void {
        event.stopPropagation();

        // Export with headers only (assuming backend will handle empty data)
        this.templateService.exportExcel(template.id, [], true).subscribe({
            next: (blob) => {
                const filename = `${template.name}_template.xlsx`;
                this.templateService.downloadFile(blob, filename);
                this.showSuccess('Template vide téléchargé avec succès');
            },
            error: (error) => {
                console.error('Error downloading template:', error);
                this.showError('Erreur lors du téléchargement du template');
            },
        });
    }

    // ==================== HELPER METHODS ====================

    getTemplateIcon(template: TemplateResponse): string {
        return this.templateIcons[
            (template.id - 1) % this.templateIcons.length
        ];
    }

    getTemplateColor(template: TemplateResponse): string {
        return this.templateColors[
            (template.id - 1) % this.templateColors.length
        ];
    }

    getTemplateEntries(template: TemplateResponse): number {
        return this.templateDataCounts.get(template.id) || 0;
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset time part for comparison
        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) {
            return "Aujourd'hui";
        } else if (date.getTime() === yesterday.getTime()) {
            return 'Hier';
        } else {
            return new Intl.DateTimeFormat('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }).format(new Date(dateString));
        }
    }

    getCurrentDate(): string {
        return new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }

    // ==================== NOTIFICATIONS ====================

    private showSuccess(message: string): void {
        this.snackBar.open(message, 'Fermer', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
        });
    }

    private showError(message: string): void {
        this.snackBar.open(message, 'Fermer', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
        });
    }
}
