// entrepreneur-table/entrepreneur-table.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntrepreneurDetail, KpiDetail } from '../../../../../models/entrepreneur.models';

@Component({
    selector: 'app-entrepreneur-table',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './entrepreneur-table.html'
})
export class EntrepreneurTableComponent implements OnChanges {
    @Input() entrepreneurs: EntrepreneurDetail[] = [];
    @Input() searchTerm = '';

    @Output() onEditEntrepreneur = new EventEmitter<EntrepreneurDetail>();
    @Output() onSearchChange = new EventEmitter<string>();
    @Output() onDeleteEntrepreneur = new EventEmitter<number>();
    @Output() onOpenKpiHistory = new EventEmitter<{ kpi: KpiDetail; entrepreneurName: string }>();

    filteredEntrepreneurs: EntrepreneurDetail[] = [];

    ngOnChanges(changes: SimpleChanges) {
        if (changes['entrepreneurs']) {
            this.filteredEntrepreneurs = changes['entrepreneurs'].currentValue ?? [];
        }
    }

    onSearch() {
        this.onSearchChange.emit(this.searchTerm);
    }

    toggleEntrepreneurDetails(entrepreneur: EntrepreneurDetail) {
        entrepreneur.expanded = !entrepreneur.expanded;
    }

    getInitials(firstName: string, lastName: string): string {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    }

    getTotalKpis(entrepreneur: EntrepreneurDetail): number {
        if (!entrepreneur.programs) return 0;
        return entrepreneur.programs.reduce((total, program) => {
            return total + (program.kpis?.length || 0);
        }, 0);
    }

    /**
     * Returns the effective "current value" for display and progress calculation.
     * Both types use valeurActuelle as the current value and valeurCible as the target.
     */
    getKpiCurrentValue(kpi: KpiDetail): string {
        return kpi.valeurActuelle ?? '0';
    }

    getKpiTargetValue(kpi: KpiDetail): string {
        return kpi.valeurCible ?? '0';
    }

    /**
     * Progress = (valeurActuelle / valeurCible) * 100 — same formula for both types.
     */
    getKpiProgress(kpi: KpiDetail): number {
        const current = parseFloat(kpi.valeurActuelle ?? '0');
        const target = parseFloat(kpi.valeurCible ?? '0');
        if (!kpi.valeurActuelle || !kpi.valeurCible || target === 0) return 0;
        return Math.min(Math.round((current / target) * 100), 100);
    }

    openKpiHistory(kpi: KpiDetail, entrepreneurName: string, event: Event) {
        event.stopPropagation();
        this.onOpenKpiHistory.emit({ kpi, entrepreneurName });
    }

    editEntrepreneur(entrepreneur: EntrepreneurDetail, event: Event) {
        event.stopPropagation();
        this.onEditEntrepreneur.emit(entrepreneur);
    }

    deleteEntrepreneur(id: number, event: Event) {
        event.stopPropagation();
        this.onDeleteEntrepreneur.emit(id);
    }
}