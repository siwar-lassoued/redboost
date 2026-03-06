// dialogs/kpi-history/kpi-history.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiDetail, KpiHistory } from '../../../../../../models/entrepreneur.models';

@Component({
    selector: 'app-kpi-history-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './kpi-history.html'
})
export class KpiHistoryModalComponent {
    @Input() showKpiModal = false;
    @Input() selectedKpi: (KpiDetail & { entrepreneurName?: string }) | null = null;

    @Output() onClose = new EventEmitter<void>();

    close() {
        this.onClose.emit();
    }

    /** Progress for a single history record */
    getRecordProgress(record: KpiHistory): number {
        const current = parseFloat(record.valeurActuelle ?? '0');
        const target = parseFloat(record.valeurCible ?? '0');
        if (!record.valeurActuelle || !record.valeurCible || target === 0) return 0;
        return Math.min(Math.round((current / target) * 100), 100);
    }

    formatDate(dateStr: string): string {
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
}