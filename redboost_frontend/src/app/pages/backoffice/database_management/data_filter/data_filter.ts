// data-filter.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TemplateService } from '../template.service';
import { TemplateResponse, TemplateDataRow  } from '../../../../models/template.models';

interface FilterCriteria {
    field: string;
    operator: string;
    value: string;
    isFieldOpen?: boolean;
    isOperatorOpen?: boolean;
}

interface Operator {
    value: string;
    label: string;
}

@Component({
    selector: 'app-data-filter',
    templateUrl: './data_filter.html',
    styleUrls: ['./data_filter.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
})
export class DataFilterComponent implements OnInit {
    templates: TemplateResponse[] = [];
    selectedTemplate: TemplateResponse | null = null;
    isTemplateDropdownOpen: boolean = false;

    globalSearch: string = '';
    filters: FilterCriteria[] = [];

    operators: Operator[] = [
        { value: 'equals', label: 'Égal à' },
        { value: 'contains', label: 'Contient' },
        { value: 'startsWith', label: 'Commence par' },
        { value: 'endsWith', label: 'Se termine par' },
        { value: 'greaterThan', label: 'Supérieur à' },
        { value: 'lessThan', label: 'Inférieur à' },
    ];

    // Template icons mapping
    private templateIcons: string[] = [
        'business_center',
        'star',
        'groups',
        'event',
        'people',
        'school',
    ];

    // All data for the selected template
    allData: TemplateDataRow[] = [];
    filteredData: TemplateDataRow[] = [];

    constructor(
        private templateService: TemplateService,
        private snackBar: MatSnackBar,
    ) {}

    ngOnInit(): void {
        this.loadTemplates();
    }

    // Close dropdowns when clicking outside
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.select-wrapper')) {
            this.closeAllDropdowns();
        }
    }

    // ==================== TEMPLATE SELECTION ====================

    loadTemplates(): void {
        this.templateService.getAllTemplates().subscribe({
            next: (templates) => {
                this.templates = templates;
            },
            error: (error) => {
                console.error('Error loading templates:', error);
                this.showError('Erreur lors du chargement des templates');
            },
        });
    }

    toggleTemplateDropdown(): void {
        this.isTemplateDropdownOpen = !this.isTemplateDropdownOpen;
    }

    selectTemplate(template: TemplateResponse): void {
        this.selectedTemplate = template;
        this.isTemplateDropdownOpen = false;
        this.resetFilters();
        this.loadTemplateData(template.id);
    }

    loadTemplateData(templateId: number): void {
        this.templateService.getAllData(templateId).subscribe({
            next: (data) => {
                this.allData = data;
                this.filteredData = data;
                this.showSuccess(`${data.length} enregistrements chargés`);
            },
            error: (error) => {
                console.error('Error loading template data:', error);
                this.showError('Erreur lors du chargement des données');
            },
        });
    }

    getTemplateIcon(template: TemplateResponse): string {
        return this.templateIcons[
            (template.id - 1) % this.templateIcons.length
        ];
    }

    getTemplateColumns(): string[] {
        if (!this.selectedTemplate) return [];
        return this.selectedTemplate.columns
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((col) => col.columnName);
    }

    // ==================== GLOBAL SEARCH ====================

    onGlobalSearchChange(): void {
        this.applyFilters();
    }

    // ==================== FILTER MANAGEMENT ====================

    addFilter(): void {
        const newFilter: FilterCriteria = {
            field: '',
            operator: 'equals',
            value: '',
            isFieldOpen: false,
            isOperatorOpen: false,
        };
        this.filters.push(newFilter);
    }

    removeFilter(index: number): void {
        this.filters.splice(index, 1);
        this.applyFilters();
    }

    toggleFieldDropdown(index: number): void {
        this.closeAllDropdowns();
        this.filters[index].isFieldOpen = !this.filters[index].isFieldOpen;
    }

    toggleOperatorDropdown(index: number): void {
        this.closeAllDropdowns();
        this.filters[index].isOperatorOpen =
            !this.filters[index].isOperatorOpen;
    }

    selectField(index: number, field: string): void {
        this.filters[index].field = field;
        this.filters[index].isFieldOpen = false;
    }

    selectOperator(index: number, operator: string): void {
        this.filters[index].operator = operator;
        this.filters[index].isOperatorOpen = false;
    }

    getOperatorLabel(value: string): string {
        const operator = this.operators.find((op) => op.value === value);
        return operator ? operator.label : 'Sélectionner...';
    }

    closeAllDropdowns(): void {
        this.isTemplateDropdownOpen = false;
        this.filters.forEach((filter) => {
            filter.isFieldOpen = false;
            filter.isOperatorOpen = false;
        });
    }

    onFilterChange(): void {
        // Real-time filtering can be enabled here
        // For now, we wait for the user to click "Apply"
    }

    // ==================== APPLY FILTERS ====================

    applyFilters(): void {
        if (!this.selectedTemplate) return;

        let result = [...this.allData];

        // Apply global search
        if (this.globalSearch.trim()) {
            const search = this.globalSearch.toLowerCase();
            result = result.filter((row) => {
                return Object.values(row.data).some((value) =>
                    value?.toString().toLowerCase().includes(search),
                );
            });
        }

        // Apply advanced filters
        this.filters.forEach((filter) => {
            if (filter.field && filter.value) {
                result = result.filter((row) => {
                    const cellValue =
                        row.data[filter.field]?.toString().toLowerCase() || '';
                    const filterValue = filter.value.toLowerCase();

                    switch (filter.operator) {
                        case 'equals':
                            return cellValue === filterValue;
                        case 'contains':
                            return cellValue.includes(filterValue);
                        case 'startsWith':
                            return cellValue.startsWith(filterValue);
                        case 'endsWith':
                            return cellValue.endsWith(filterValue);
                        case 'greaterThan':
                            return (
                                parseFloat(cellValue) > parseFloat(filterValue)
                            );
                        case 'lessThan':
                            return (
                                parseFloat(cellValue) < parseFloat(filterValue)
                            );
                        default:
                            return true;
                    }
                });
            }
        });

        this.filteredData = result;
        this.showSuccess(`${result.length} enregistrements trouvés`);

        // You can emit this filtered data to parent component or navigate with it
        console.log('Filtered data:', this.filteredData);
    }

    resetFilters(): void {
        this.globalSearch = '';
        this.filters = [];
        this.filteredData = this.allData;
        this.showSuccess('Filtres réinitialisés');
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

    // Add this method to your DataFilterComponent class

    exportResults(): void {
        if (!this.selectedTemplate || this.filteredData.length === 0) {
            this.showError('Aucune donnée à exporter');
            return;
        }

        try {
            // Get column names
            const columns = this.getTemplateColumns();

            // Create CSV header
            const csvHeader = columns.join(',');

            // Create CSV rows
            const csvRows = this.filteredData.map((row) => {
                return columns
                    .map((column) => {
                        const value = row.data[column] || '';
                        // Escape commas and quotes in values
                        const escaped = String(value).replace(/"/g, '""');
                        return `"${escaped}"`;
                    })
                    .join(',');
            });

            // Combine header and rows
            const csvContent = [csvHeader, ...csvRows].join('\n');

            // Create blob and download
            const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;',
            });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute(
                'download',
                `${this.selectedTemplate.name}_filtered_${new Date().getTime()}.csv`,
            );
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showSuccess('Export réussi');
        } catch (error) {
            console.error('Export error:', error);
            this.showError("Erreur lors de l'export");
        }
    }
}
