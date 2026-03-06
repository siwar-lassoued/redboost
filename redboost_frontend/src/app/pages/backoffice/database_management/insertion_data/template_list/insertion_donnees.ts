// insertdata.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TemplateService } from '../../template.service';
import { TemplateResponse, TemplateStats } from '../../../../../models/template.models';
import { CreateTemplateDialogComponent } from '../../dialogs/create_template/create_template_dialog';

@Component({
    selector: 'app-insertdata',
    templateUrl: './insertion_donnees.html',
    styleUrls: ['./insertion_donnees.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
    ],
})
export class InsertDataComponent implements OnInit {
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

    // Template colors matching your design
    private templateColors: string[] = [
        'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Pink
        'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', // Cyan
        'linear-gradient(135deg, #7e22ce 0%, #9333ea 100%)', // Purple
        'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', // Cyan
    ];

    // Template icons
    private templateIcons: string[] = [
        'business_center',
        'star',
        'groups',
        'event',
    ];

    constructor(
        private templateService: TemplateService,
        private router: Router,
        private dialog: MatDialog,
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
                this.loading = false;
            },
        });
    }

    loadTemplateDataCount(templateId: number): void {
        this.templateService.getAllData(templateId).subscribe({
            next: (data) => {
                this.templateDataCounts.set(templateId, data.length);
                this.updateTotalEnregistrements();
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

    updateTotalEnregistrements(): void {
        let total = 0;
        this.templateDataCounts.forEach((count) => (total += count));
        this.stats.totalEnregistrements = total;
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
                template.description?.toLowerCase().includes(search),
        );
    }

    navigateToTemplateData(template: TemplateResponse): void {
        // Navigate to template data management component
        this.router.navigate(['/template-data-management', template.id]);
    }

    createNewTemplate(): void {
        const dialogRef = this.dialog.open(CreateTemplateDialogComponent, {
            width: '900px',
            maxHeight: '90vh',
            disableClose: true,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadTemplates();
                this.loadStats();
            }
        });
    }

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
}
