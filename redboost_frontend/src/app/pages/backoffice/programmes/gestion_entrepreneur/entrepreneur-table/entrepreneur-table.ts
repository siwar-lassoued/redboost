// entrepreneur-table/entrepreneur-table.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntrepreneurDetail, KpiDetail } from '../../../../../models/entrepreneur.models';

export interface KpiRow {
    nom: string;
    entries: { programNom: string; kpi: KpiDetail }[];
}

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
    @Output() onOpenKpiHistory = new EventEmitter<{ kpi: KpiDetail; entrepreneurName: string; programNom: string }>();
    /** Emitted when user wants to assign selected entrepreneurs to a program */
    @Output() onAssignSelected = new EventEmitter<{ entrepreneurIds: number[] }>();

    filteredEntrepreneurs: EntrepreneurDetail[] = [];
    selectedIds = new Set<number>();

    ngOnChanges(changes: SimpleChanges) {
        if (changes['entrepreneurs']) {
            this.filteredEntrepreneurs = changes['entrepreneurs'].currentValue ?? [];
            // Clear selection when data changes
            this.selectedIds.clear();
        }
    }

    // ─── Selection ────────────────────────────────────────────────────────────

    get isAllSelected(): boolean {
        return this.filteredEntrepreneurs.length > 0 &&
            this.filteredEntrepreneurs.every(e => this.selectedIds.has(e.id));
    }

    get isPartiallySelected(): boolean {
        return !this.isAllSelected &&
            this.filteredEntrepreneurs.some(e => this.selectedIds.has(e.id));
    }

    get selectedCount(): number {
        return this.selectedIds.size;
    }

    toggleSelectAll() {
        if (this.isAllSelected) {
            this.filteredEntrepreneurs.forEach(e => this.selectedIds.delete(e.id));
        } else {
            this.filteredEntrepreneurs.forEach(e => this.selectedIds.add(e.id));
        }
    }

    toggleSelection(id: number) {
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
    }

    isSelected(id: number): boolean {
        return this.selectedIds.has(id);
    }

    assignSelected() {
        this.onAssignSelected.emit({ entrepreneurIds: Array.from(this.selectedIds) });
    }

    clearSelection() {
        this.selectedIds.clear();
    }

    // ─── Search ────────────────────────────────────────────────────────────────

    onSearch() {
        this.onSearchChange.emit(this.searchTerm);
    }

    // ─── KPI helpers ──────────────────────────────────────────────────────────

    getInitials(firstName: string, lastName: string): string {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    }

    getUniqueKpiRows(entrepreneur: EntrepreneurDetail): KpiRow[] {
        if (!entrepreneur.programs) return [];
        const map = new Map<string, KpiRow>();
        for (const program of entrepreneur.programs) {
            for (const kpi of program.kpis ?? []) {
                const key = kpi.nom.trim().toLowerCase();
                if (!map.has(key)) map.set(key, { nom: kpi.nom, entries: [] });
                map.get(key)!.entries.push({ programNom: program.nom, kpi });
            }
        }
        return Array.from(map.values());
    }

    getTotalUniqueKpis(entrepreneur: EntrepreneurDetail): number {
        return this.getUniqueKpiRows(entrepreneur).length;
    }

    getKpiProgress(kpi: KpiDetail): number {
        const current = parseFloat(kpi.valeurActuelle ?? '0');
        const target = parseFloat(kpi.valeurCible ?? '0');
        if (!kpi.valeurActuelle || !kpi.valeurCible || target === 0) return 0;
        return Math.min(Math.round((current / target) * 100), 100);
    }

    openKpiHistory(kpi: KpiDetail, entrepreneurName: string, programNom: string, event: Event) {
        event.stopPropagation();
        this.onOpenKpiHistory.emit({ kpi, entrepreneurName, programNom });
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