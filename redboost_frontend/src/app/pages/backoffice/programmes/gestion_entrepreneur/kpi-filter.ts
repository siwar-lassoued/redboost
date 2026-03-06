// components/kpi-filter-section/kpi-filter-section.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryResponse, Programme, EntrepreneurDetail } from '../../../../models/entrepreneur.models';

@Component({
    selector: 'app-kpi-filter-section',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './kpi-filter.html'
})
export class KpiFilterSectionComponent {
    isCollapsed = true; // ADD THIS
    @Input() categories: CategoryResponse[] = [];
    @Input() programmes: Programme[] = [];
    @Input() regions: string[] = [];
    @Input() secteurs: string[] = [];
    @Input() selectedKpiFilter: number | null = null;
    @Input() selectedProgrammeFilter: number | null = null;
    @Input() selectedRegionFilter: string | null = null;
    @Input() selectedSecteurFilter: string | null = null;
    @Input() showEntrepreneurTracking = true;
    @Input() entrepreneursDetails: EntrepreneurDetail[] = [];

    @Output() onKpiFilterChange = new EventEmitter<number>();
    @Output() onProgrammeFilterChange = new EventEmitter<number | null>();
    @Output() onRegionFilterChange = new EventEmitter<string | null>();
    @Output() onSecteurFilterChange = new EventEmitter<string | null>();
    @Output() onResetFilters = new EventEmitter<void>();
    @Output() onToggleTracking = new EventEmitter<boolean>();

    hasActiveFilters(): boolean {
        return !!(this.selectedKpiFilter || this.selectedProgrammeFilter || 
                  this.selectedRegionFilter || this.selectedSecteurFilter);
    }

    getEntrepreneursTrackingKpi(kpiId: number): EntrepreneurDetail[] {
        return this.entrepreneursDetails.filter((e) =>
            e.programs?.some((p) => p.kpis?.some((k) => k.kpiId === kpiId))
        );
    }
    // ADD this computed getter
    get displayedCategories(): CategoryResponse[] {
        if (!this.showEntrepreneurTracking) {
            return this.categories;
        }
        return this.categories
            .map(category => ({
                ...category,
                kpis: category.kpis.filter(kpi => kpi.typesuivi === 'ENTREPRENEUR')
            }))
            .filter(category => category.kpis.length > 0);
    }

    getKpiEntrepreneurName(kpiId: number): string {
        const entrepreneurs = this.getEntrepreneursTrackingKpi(kpiId);
        if (entrepreneurs.length === 0) return 'Global';
        if (entrepreneurs.length === 1) {
            return `${entrepreneurs[0].firstName} ${entrepreneurs[0].lastName}`;
        }
        return `${entrepreneurs.length} entrepreneurs`;
    }

    onProgrammeChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.onProgrammeFilterChange.emit(value ? Number(value) : null);
    }

    onRegionChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.onRegionFilterChange.emit(value || null);
    }

    onSecteurChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.onSecteurFilterChange.emit(value || null);
    }

    onTrackingToggle(event: Event) {
        const checked = (event.target as HTMLInputElement).checked;
        this.onToggleTracking.emit(checked);
    }
}