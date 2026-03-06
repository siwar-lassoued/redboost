// src/app/pages/backoffice/programmes/Gestion_sprint/kpi-management/kpi-management.component.ts

import { Component, computed, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { ProgrammeService, KpiWithStatus } from '../../programme.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmKpiChangeDialogComponent } from './confirm_kpi_change';
import { KpiHistoryDialogComponent } from '../dialogs/kpi_history';

interface KpiGroup {
    title: string;
    isGlobal: boolean;
    attachedCount: number;
    totalCount: number;
    kpis: KpiWithStatus[];
}


export interface ActiviteKpiValue {
    activiteId: number;
    activiteNom: string;
    sprintNom: string;
    kpis: KpiValue[];
    saveStatus?: 'idle' | 'saving' | 'success' | 'error';
}

export interface TacheKpiValue {
    tacheId: number;
    tacheTitre: string;
    activiteNom: string;
    sprintNom: string;
    kpis: KpiValue[];
    saveStatus?: 'idle' | 'saving' | 'success' | 'error';
}

export interface KpiValue {
    kpiId: number;
    kpiNom: string;
    kpiUnite: string;
    categoryNom: string;
    categoryCouleur: string;
    valeur: string;
    valeurCible?: string;
    originalValeur?: string;
    originalValeurCible?: string;
}

@Component({
    selector: 'app-kpi-management',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTableModule,
        FormsModule,
        DatePipe,
        MatDialogModule,
        MatButtonModule,
        ConfirmKpiChangeDialogComponent,
        KpiHistoryDialogComponent,
    ],
    templateUrl: './kpi-management.component.html',
    styleUrls: ['./kpi-management.component.scss'],
})
export class KpiManagementComponent implements OnInit {
    @Input() programmeId!: number;
    private dialog = inject(MatDialog);
    protected service = inject(ProgrammeService);

    // Core signals
    activeKpiSubTab = signal<'selection' | 'saisie'>('selection');
    kpiGroups = signal<KpiGroup[]>([]);
    loading = signal(true);

    // ==================== FILTER SIGNALS ====================
    filterTypesuivi: string = '';
    filterEntrepreneurId: string = '';

    filteredProgrammeKpiValues = signal<any[]>([]);

    // FIX: Deep-clone every KPI + its entrepreneurValues array so that
    // *ngFor always receives NEW object references after each save.
    // This forces Angular to re-evaluate [readonly]/[disabled] bindings
    // on the valeurPrecedente input without requiring a page reload.
    private applyFilters(): void {
        const all = this.programmeKpiValues();
        let result = all;

        if (this.filterTypesuivi) {
            result = result.filter(kpi => kpi.typesuivi === this.filterTypesuivi);
        }

        if (this.filterTypesuivi === 'ENTREPRENEUR' && this.filterEntrepreneurId) {
            result = result.filter(kpi =>
                kpi.typesuivi === 'ENTREPRENEUR' &&
                (kpi.entrepreneurValues || []).some(
                    (ev: any) => String(ev.userId) === String(this.filterEntrepreneurId)
                )
            );
        }

        result = [...result].sort((a, b) => {
            if (a.kpitype === 'GLOBAL' && b.kpitype !== 'GLOBAL') return -1;
            if (a.kpitype !== 'GLOBAL' && b.kpitype === 'GLOBAL') return 1;
            return 0;
        });

        // Deep-clone so *ngFor always sees genuinely new references,
        // which triggers re-evaluation of all property bindings.
        const cloned = result.map((kpi: any) => ({
            ...kpi,
            entrepreneurValues: (kpi.entrepreneurValues || []).map((ev: any) => ({ ...ev })),
        }));

        this.filteredProgrammeKpiValues.set(cloned);
    }

    onFilterTypeSuiviChange(): void {
        if (this.filterTypesuivi !== 'ENTREPRENEUR') {
            this.filterEntrepreneurId = '';
        }
        this.applyFilters();
    }

    onFilterEntrepreneurChange(): void {
        this.applyFilters();
    }
    // ==================== END FILTER SIGNALS ====================

    activiteKpiValues = signal<ActiviteKpiValue[]>([]);
    tacheKpiValues = signal<TacheKpiValue[]>([]);
    activiteKpisLoading = signal(false);
    tacheKpisLoading = signal(false);
    expandedActiviteCards = signal<number[]>([]);
    expandedTacheCards = signal<number[]>([]);

    // KPI Values
    programmeKpiValues = signal<any[]>([]);
    kpiValuesLoading = signal(false);
    kpiValuesError = signal<string | null>(null);
    expandedKpiCards = signal<number[]>([]);
    @Output() kpiSelectionChanged = new EventEmitter<void>();

    // Entrepreneurs
    entrepreneurs = signal<any[]>([]);

    // ==================== trackBy helpers ====================
    trackByKpiId(_index: number, kpi: any): number {
        return kpi.kpiId;
    }

    trackByUserId(_index: number, entrepreneur: any): number {
        return entrepreneur.userId;
    }
    // =========================================================

    ngOnInit(): void {
        this.loadKpis();
        this.loadEntrepreneurs();
        if (this.activeKpiSubTab() === 'saisie') {
            this.loadProgrammeKpiValues();
        }
    }

    loadEntrepreneurs(): void {
        this.service.getAllEntrepreneurs().subscribe({
            next: (entrepreneurs) => this.entrepreneurs.set(entrepreneurs),
            error: (err) => console.error('Error loading entrepreneurs', err),
        });
    }

    // ==================== KPI VALUES MANAGEMENT ====================

    loadProgrammeKpiValues() {
        this.kpiValuesLoading.set(true);
        this.kpiValuesError.set(null);

        this.service.getProgrammeKpiValues(this.programmeId).subscribe({
            next: (data) => {
                console.log('📊 Raw KPI data from backend:', data);

                const processedData = data.map((item) => {
                    if (item.typesuivi === 'ENTREPRENEUR') {
                        item.entrepreneurValues = (
                            item.entrepreneurValues || []
                        ).map((ev: any) => {
                            if (item.typedesaisie === 'progression') {
                                return {
                                    ...ev,
                                    valeurPrecedente: ev.valeurPrecedente || '',
                                    valeurActuelle: ev.valeurActuelle || '',
                                    valeurCible: ev.valeurCible || '',
                                    originalValeurPrecedente: ev.valeurPrecedente,
                                    originalValeurActuelle: ev.valeurActuelle,
                                    originalValeurCible: ev.valeurCible,
                                    saveStatus: 'idle',
                                };
                            } else {
                                return {
                                    ...ev,
                                    valeur: ev.valeur || '',
                                    valeurCible: ev.valeurCible || '',
                                    originalValeur: ev.valeur,
                                    originalValeurCible: ev.valeurCible,
                                    saveStatus: 'idle',
                                };
                            }
                        });
                    }

                    if (item.typesuivi === 'OPERATIONNEL') {
                        if (item.typedesaisie === 'progression') {
                            item.valeurPrecedente = item.valeurPrecedente || '';
                            item.valeurActuelle = item.valeurActuelle || '';
                            item.valeurCible = item.valeurCible || '';
                        } else {
                            item.valeurActuelle = item.valeurActuelle || '';
                            item.valeurCible = item.valeurCible || '';
                            item.valeurPrecedente = null;
                        }
                    } else {
                        if (item.typedesaisie === 'progression') {
                            item.valeurPrecedente = item.valeurPrecedente || '';
                            item.valeurActuelle = item.valeurActuelle || '';
                            item.valeurCible = item.valeurCible || '';
                        } else {
                            item.valeurActuelle = item.valeurActuelle || '';
                            item.valeurCible = item.valeurCible || '';
                            item.valeurPrecedente = item.valeurPrecedente || '';
                        }
                    }

                    return {
                        ...item,
                        original: { ...item },
                        saveStatus: 'idle' as 'idle' | 'saving' | 'success' | 'error',
                    };
                });

                console.log('✅ Final processed data:', processedData);
                this.programmeKpiValues.set(processedData);
                this.applyFilters();
                this.kpiValuesLoading.set(false);
            },
            error: (err) => {
                console.error('❌ Error loading KPI values:', err);
                this.kpiValuesError.set(
                    err.error?.message || 'Impossible de charger les valeurs des KPI',
                );
                this.kpiValuesLoading.set(false);
            },
        });
    }

    toggleKpiCard(kpiId: number) {
        const expanded = this.expandedKpiCards();
        if (expanded.includes(kpiId)) {
            this.expandedKpiCards.set(expanded.filter((id) => id !== kpiId));
        } else {
            this.expandedKpiCards.set([...expanded, kpiId]);
        }
    }

    getProgress(kpi: any): number | null {
        if (kpi.valeurCible && kpi.valeurActuelle) {
            const progress = (parseFloat(kpi.valeurActuelle) / parseFloat(kpi.valeurCible)) * 100;
            return Math.min(Math.round(progress), 100);
        }
        if (kpi.typedesaisie === 'progression' && kpi.valeurCible && kpi.valeurPrecedente && !kpi.valeurActuelle) {
            const progress = (parseFloat(kpi.valeurPrecedente) / parseFloat(kpi.valeurCible)) * 100;
            return Math.min(Math.round(progress), 100);
        }
        return null;
    }

    // ==================== ENTREPRENEUR KPI MANAGEMENT ====================

    getAvailableEntrepreneurs(kpi: any): any[] {
        // Read from SOURCE to always have the up-to-date assigned list
        const sourceKpi = this.programmeKpiValues().find((k: any) => k.kpiId === kpi.kpiId);
        const assignedIds = ((sourceKpi || kpi).entrepreneurValues || []).map(
            (ev: any) => ev.userId,
        );
        return this.entrepreneurs().filter((e) => !assignedIds.includes(e.id));
    }

    onEntrepreneurSelected(kpi: any, event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        const entrepreneurId = parseInt(selectElement.value);

        if (!entrepreneurId) return;

        const entrepreneur = this.entrepreneurs().find(
            (e) => e.id === entrepreneurId,
        );
        if (!entrepreneur) return;

        // Always push to the SOURCE kpi in programmeKpiValues, not the clone
        const sourceKpi = this.programmeKpiValues().find((k: any) => k.kpiId === kpi.kpiId);
        if (!sourceKpi) return;

        if (!sourceKpi.entrepreneurValues) {
            sourceKpi.entrepreneurValues = [];
        }

        if (kpi.typedesaisie === 'progression') {
            sourceKpi.entrepreneurValues.push({
                userId: entrepreneur.id,
                userName: entrepreneur.fullName,
                valeurPrecedente: '',
                valeurActuelle: '',
                valeurCible: '',
                originalValeurPrecedente: '',
                originalValeurActuelle: '',
                originalValeurCible: '',
                saveStatus: 'idle',
            });
        } else {
            sourceKpi.entrepreneurValues.push({
                userId: entrepreneur.id,
                userName: entrepreneur.fullName,
                valeur: '',
                valeurCible: '',
                originalValeur: '',
                originalValeurCible: '',
                saveStatus: 'idle',
            });
        }

        this.programmeKpiValues.set([...this.programmeKpiValues()]);
        this.applyFilters();
        selectElement.value = '';
    }

    removeEntrepreneurFromKpi(kpi: any, index: number) {
        if (!confirm('Êtes-vous sûr de vouloir retirer cet entrepreneur de ce KPI ?')) {
            return;
        }

        // We must find the SOURCE kpi in programmeKpiValues, not the clone from filteredProgrammeKpiValues
        const sourceKpi = this.programmeKpiValues().find((k: any) => k.kpiId === kpi.kpiId);
        if (!sourceKpi) return;

        const entrepreneur = sourceKpi.entrepreneurValues[index];

        const hasValue = kpi.typedesaisie === 'progression'
            ? (entrepreneur.valeurPrecedente || entrepreneur.valeurActuelle || entrepreneur.valeurCible)
            : (entrepreneur.valeur || entrepreneur.valeurCible);

        if (hasValue) {
            this.service
                .deleteEntrepreneurKpiValue(this.programmeId, kpi.kpiId, entrepreneur.userId)
                .subscribe({
                    next: () => {
                        sourceKpi.entrepreneurValues.splice(index, 1);
                        this.programmeKpiValues.set([...this.programmeKpiValues()]);
                        this.applyFilters();
                    },
                    error: (err) => {
                        console.error('Error deleting entrepreneur value:', err);
                        alert('Erreur lors de la suppression');
                    },
                });
        } else {
            sourceKpi.entrepreneurValues.splice(index, 1);
            this.programmeKpiValues.set([...this.programmeKpiValues()]);
            this.applyFilters();
        }
    }

    saveEntrepreneurRecord(kpi: any, entrepreneur: any): void {
        // Always operate on the SOURCE object in programmeKpiValues
        // (kpi and entrepreneur here come from filteredProgrammeKpiValues which are clones)
        const sourceKpi = this.programmeKpiValues().find((k: any) => k.kpiId === kpi.kpiId);
        if (!sourceKpi) return;

        const sourceEntrepreneur = sourceKpi.entrepreneurValues.find(
            (ev: any) => ev.userId === entrepreneur.userId
        );
        if (!sourceEntrepreneur) return;

        // Sync current input values from the clone back to the source before saving
        if (kpi.typedesaisie === 'progression') {
            sourceEntrepreneur.valeurPrecedente = entrepreneur.valeurPrecedente;
            sourceEntrepreneur.valeurActuelle   = entrepreneur.valeurActuelle;
            sourceEntrepreneur.valeurCible      = entrepreneur.valeurCible;
        } else {
            sourceEntrepreneur.valeur      = entrepreneur.valeur;
            sourceEntrepreneur.valeurCible = entrepreneur.valeurCible;
        }

        let hasChanges = false;
        let entPayload: any = { userId: sourceEntrepreneur.userId };

        const isFirstSave = kpi.typedesaisie === 'progression'
            ? (!sourceEntrepreneur.originalValeurPrecedente && !sourceEntrepreneur.originalValeurActuelle)
            : !sourceEntrepreneur.originalValeur;

        if (kpi.typedesaisie === 'progression') {
            if (isFirstSave) {
                hasChanges =
                    sourceEntrepreneur.valeurPrecedente !== sourceEntrepreneur.originalValeurPrecedente ||
                    sourceEntrepreneur.valeurActuelle   !== sourceEntrepreneur.originalValeurActuelle   ||
                    sourceEntrepreneur.valeurCible      !== sourceEntrepreneur.originalValeurCible;

                entPayload.valeurPrecedente = sourceEntrepreneur.valeurPrecedente || null;
                entPayload.valeurActuelle   = sourceEntrepreneur.valeurActuelle   || null;
                entPayload.valeurCible      = sourceEntrepreneur.valeurCible      || null;
            } else {
                hasChanges =
                    sourceEntrepreneur.valeurActuelle !== sourceEntrepreneur.originalValeurActuelle ||
                    sourceEntrepreneur.valeurCible    !== sourceEntrepreneur.originalValeurCible;

                entPayload.valeurActuelle = sourceEntrepreneur.valeurActuelle || null;
                entPayload.valeurCible    = sourceEntrepreneur.valeurCible    || null;
            }
        } else {
            hasChanges =
                sourceEntrepreneur.valeur      !== sourceEntrepreneur.originalValeur      ||
                sourceEntrepreneur.valeurCible !== sourceEntrepreneur.originalValeurCible;

            entPayload.valeurActuelle = sourceEntrepreneur.valeur      || null;
            entPayload.valeurCible    = sourceEntrepreneur.valeurCible || null;
        }

        if (!hasChanges) {
            sourceEntrepreneur.saveStatus = 'success';
            this.programmeKpiValues.set([...this.programmeKpiValues()]);
            this.applyFilters();
            setTimeout(() => {
                sourceEntrepreneur.saveStatus = 'idle';
                this.programmeKpiValues.set([...this.programmeKpiValues()]);
                this.applyFilters();
            }, 1500);
            return;
        }

        sourceEntrepreneur.saveStatus = 'saving';
        this.programmeKpiValues.set([...this.programmeKpiValues()]);
        this.applyFilters();

        console.log(`💾 Saving entrepreneur ${sourceEntrepreneur.userName}:`, entPayload);

        this.service
            .updateKpiValuesForEntrepreneur(
                this.programmeId, kpi.kpiId, sourceEntrepreneur.userId, entPayload,
            )
            .subscribe({
                next: (response: any) => {
                    console.log(`✅ Saved entrepreneur ${sourceEntrepreneur.userName}`, response);

                    if (kpi.typedesaisie === 'progression') {
                        // Backend returns null — compute cumulated total locally:
                        // new total = existing cumulated total + newly entered progress
                        const existingTotal = parseFloat(sourceEntrepreneur.valeurPrecedente) || 0;
                        const newProgress   = parseFloat(sourceEntrepreneur.valeurActuelle)   || 0;
                        const computedTotal = existingTotal + newProgress;

                        // Prefer backend value if returned, otherwise use local computation
                        const newPrecedente = (response?.valeurPrecedente != null)
                            ? String(response.valeurPrecedente)
                            : String(computedTotal);

                        const newCible = (response?.valeurCible != null)
                            ? String(response.valeurCible)
                            : sourceEntrepreneur.valeurCible;

                        console.log(`📊 Cumul: ${existingTotal} + ${newProgress} = ${computedTotal} → valeurPrecedente: ${newPrecedente}`);

                        // Update the SOURCE object with the new cumulated total
                        sourceEntrepreneur.valeurPrecedente         = newPrecedente;
                        sourceEntrepreneur.valeurActuelle           = '';   // clear "nouveau progrès"
                        sourceEntrepreneur.valeurCible              = newCible;
                        sourceEntrepreneur.originalValeurPrecedente = newPrecedente;
                        sourceEntrepreneur.originalValeurActuelle   = null;
                        sourceEntrepreneur.originalValeurCible      = newCible;
                    } else {
                        sourceEntrepreneur.originalValeur      = sourceEntrepreneur.valeur;
                        sourceEntrepreneur.originalValeurCible = sourceEntrepreneur.valeurCible;
                    }

                    sourceEntrepreneur.saveStatus = 'success';

                    // Emit new signal + deep-clone via applyFilters → re-renders [readonly]/[disabled]
                    this.programmeKpiValues.set([...this.programmeKpiValues()]);
                    this.applyFilters();

                    setTimeout(() => {
                        sourceEntrepreneur.saveStatus = 'idle';
                        this.programmeKpiValues.set([...this.programmeKpiValues()]);
                        this.applyFilters();
                    }, 2000);
                },
                error: (err: any) => {
                    console.error(`❌ Error saving entrepreneur ${sourceEntrepreneur.userName}:`, err);
                    sourceEntrepreneur.saveStatus = 'error';
                    this.programmeKpiValues.set([...this.programmeKpiValues()]);
                    this.applyFilters();
                    setTimeout(() => {
                        sourceEntrepreneur.saveStatus = 'idle';
                        this.programmeKpiValues.set([...this.programmeKpiValues()]);
                        this.applyFilters();
                    }, 3000);
                },
            });
    }

    // ==================== KPI LOADING ====================

    loadKpis() {
        this.loading.set(true);
        this.service.getKpisDetail(this.programmeId).subscribe({
            next: (data) => {
                const groups: KpiGroup[] = [];
                Object.keys(data).forEach((categoryName) => {
                    const kpisInCategory = data[categoryName];
                    if (kpisInCategory.length > 0) {
                        const isGlobal = kpisInCategory[0].isGlobal;
                        groups.push({
                            title: categoryName,
                            isGlobal,
                            attachedCount: kpisInCategory.filter((k) => k.isAttached).length,
                            totalCount: kpisInCategory.length,
                            kpis: kpisInCategory,
                        });
                    }
                });
                this.kpiGroups.set(groups);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading KPIs', err);
                this.loading.set(false);
            },
        });
    }

    toggleKpi(kpi: KpiWithStatus) {
        if (kpi.isGlobal) {
            return this.toggleGlobalKpi(kpi);
        }

        const newStatus = !kpi.isAttached;

        if (newStatus) {
            this.service.addKpi(this.programmeId, kpi.id).subscribe({
                next: () => {
                    kpi.isAttached = true;
                    this.updateGroupCounts();
                    this.kpiSelectionChanged.emit();
                },
                error: (err) => console.error('Error adding KPI', err),
            });
        } else {
            this.service.removeKpi(this.programmeId, kpi.id).subscribe({
                next: () => {
                    kpi.isAttached = false;
                    this.updateGroupCounts();
                    this.kpiSelectionChanged.emit();
                },
                error: (err) => console.error('Error removing KPI', err),
            });
        }
    }

    toggleGlobalKpi(kpi: KpiWithStatus) {
        if (!kpi.isGlobal) return;

        const newStatus = !kpi.isAttached;

        if (newStatus) {
            this.service.addKpi(this.programmeId, kpi.id).subscribe({
                next: () => {
                    kpi.isAttached = true;
                    this.updateGroupCounts();
                    console.log(`✅ KPI Global "${kpi.nom}" attaché avec succès`);
                },
                error: (err) => {
                    console.error('Error adding global KPI', err);
                    alert('Erreur lors de l\'attachement du KPI Global');
                },
            });
        } else {
            const confirmMsg = `Êtes-vous sûr de vouloir détacher le KPI Global "${kpi.nom}" de ce programme ?\n\nNote: Ce KPI est de type Global mais peut être détaché manuellement si nécessaire.`;

            if (!confirm(confirmMsg)) return;

            this.service.removeKpi(this.programmeId, kpi.id).subscribe({
                next: () => {
                    kpi.isAttached = false;
                    this.updateGroupCounts();
                    console.log(`✅ KPI Global "${kpi.nom}" détaché`);
                },
                error: (err) => {
                    console.error('Error removing global KPI', err);
                    alert('Erreur lors du détachement du KPI Global');
                },
            });
        }
    }

    updateGroupCounts() {
        this.kpiGroups.update((groups) =>
            groups.map((g) => ({
                ...g,
                attachedCount: g.kpis.filter((k) => k.isAttached).length,
            })),
        );
    }

    saveKpiCard(kpi: any) {
        console.log('💾 Saving KPI Card:', kpi);

        let globalChanged = false;
        let payload: any = {
            programmeId: this.programmeId,
            kpiId: kpi.kpiId,
        };

        if (kpi.typesuivi !== 'ENTREPRENEUR') {
            const isFirstSave = (
                (!kpi.original.valeurPrecedente || kpi.original.valeurPrecedente === '' || kpi.original.valeurPrecedente === null) &&
                (!kpi.original.valeurActuelle || kpi.original.valeurActuelle === '' || kpi.original.valeurActuelle === null)
            );

            if (kpi.typedesaisie === 'progression') {
                if (isFirstSave) {
                    globalChanged =
                        kpi.valeurPrecedente !== kpi.original.valeurPrecedente ||
                        kpi.valeurActuelle   !== kpi.original.valeurActuelle   ||
                        kpi.valeurCible      !== kpi.original.valeurCible;

                    if (globalChanged) {
                        payload.valeurPrecedente = kpi.valeurPrecedente || null;
                        payload.valeurActuelle   = kpi.valeurActuelle   || null;
                        payload.valeurCible      = kpi.valeurCible      || null;
                    }
                } else {
                    globalChanged =
                        kpi.valeurActuelle !== kpi.original.valeurActuelle ||
                        kpi.valeurCible    !== kpi.original.valeurCible;

                    if (globalChanged) {
                        payload.valeurActuelle = kpi.valeurActuelle || null;
                        payload.valeurCible    = kpi.valeurCible    || null;
                    }
                }
            } else {
                globalChanged =
                    kpi.valeurActuelle !== kpi.original.valeurActuelle ||
                    kpi.valeurCible    !== kpi.original.valeurCible;

                if (globalChanged) {
                    payload.valeurActuelle = kpi.valeurActuelle || null;
                    payload.valeurCible    = kpi.valeurCible    || null;
                }
            }

            if (globalChanged) {
                kpi.saveStatus = 'saving';
                console.log('📤 Saving global values:', payload);

                this.service.updateProgrammeKpiValue(payload).subscribe({
                    next: (updated) => {
                        console.log('✅ Saved - Backend response:', updated);

                        if (kpi.typedesaisie === 'progression') {
                            kpi.valeurPrecedente          = updated.valeurPrecedente;
                            kpi.valeurActuelle            = '';
                            kpi.valeurCible               = updated.valeurCible;
                            kpi.original.valeurPrecedente = updated.valeurPrecedente;
                            kpi.original.valeurActuelle   = null;
                            kpi.original.valeurCible      = updated.valeurCible;
                        } else {
                            kpi.valeurActuelle          = updated.valeurActuelle;
                            kpi.valeurCible             = updated.valeurCible;
                            kpi.original.valeurActuelle = updated.valeurActuelle;
                            kpi.original.valeurCible    = updated.valeurCible;
                        }

                        kpi.saveStatus = 'success';
                        setTimeout(() => (kpi.saveStatus = 'idle'), 2000);
                    },
                    error: (err) => {
                        console.error('❌ Error saving:', err);
                        kpi.saveStatus = 'error';
                        setTimeout(() => (kpi.saveStatus = 'idle'), 3000);
                    },
                });
            }
        }
    }

    private previousTempPrecedente: any = {};
    private previousTempCible: any = {};

    private isValueEmpty(value: any): boolean {
        return value === null || value === undefined || value === '';
    }

    onFocusPrecedente(kpi: any, event: any) {
        this.previousTempPrecedente[kpi.id] = event.target.value;
    }

    onBlurPrecedente(kpi: any, event: any) {
        const newValue = event.target.value;
        const oldValue = this.previousTempPrecedente[kpi.id];
        const original = kpi.original.valeurPrecedente;

        if (newValue !== original && newValue !== oldValue) {
            if (!this.isValueEmpty(original)) {
                this.confirmChange(kpi, 'valeurPrecedente', newValue, original).then((confirmed) => {
                    if (!confirmed) kpi.valeurPrecedente = original;
                });
            }
        }
        delete this.previousTempPrecedente[kpi.id];
    }

    onFocusCible(kpi: any, event: any) {
        this.previousTempCible[kpi.id] = event.target.value;
    }

    onBlurCible(kpi: any, event: any) {
        const newValue = event.target.value;
        const oldValue = this.previousTempCible[kpi.id];
        const original = kpi.original.valeurCible;

        if (newValue !== original && newValue !== oldValue) {
            if (!this.isValueEmpty(original)) {
                this.confirmChange(kpi, 'valeurCible', newValue, original).then((confirmed) => {
                    if (!confirmed) kpi.valeurCible = original;
                });
            }
        }
        delete this.previousTempCible[kpi.id];
    }

    private confirmChange(
        kpi: any,
        field: 'valeurPrecedente' | 'valeurCible',
        newValue: any,
        oldValue: any,
    ): Promise<boolean> {
        const dialogRef = this.dialog.open(ConfirmKpiChangeDialogComponent, {
            data: {
                field: field === 'valeurPrecedente' ? 'Valeur initiale' : 'Valeur cible',
                oldValue,
                newValue,
                kpiName: kpi.kpiNom,
            },
            width: '400px',
            autoFocus: false,
        });

        return dialogRef.afterClosed().toPromise().then((result) => !!result);
    }

    // ==================== KPI HISTORY DIALOG ====================

    openKpiHistoryDialog(kpi: any): void {
        this.dialog.open(KpiHistoryDialogComponent, {
            data: {
                programmeId: this.programmeId,
                kpiId: kpi.kpiId,
                kpiName: kpi.kpiNom,
                typedesaisie: kpi.typedesaisie,
                typesuivi: kpi.typesuivi,
                entrepreneurValues: kpi.typesuivi === 'ENTREPRENEUR' ? kpi.entrepreneurValues : null,
            },
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '85vh',
            autoFocus: false,
        });
    }

    // ==================== ACTIVITÉ KPI VALUES ====================

    loadActiviteKpiValues() {
        this.activiteKpisLoading.set(true);

        this.service.getActivitiesKpiValues(this.programmeId).subscribe({
            next: (data) => {
                console.log('📊 Activité KPI data:', data);

                const processedData = data.map(activite => ({
                    ...activite,
                    kpis: activite.kpis.map((kpi: any) => ({
                        ...kpi,
                        valeur: kpi.valeur || '',
                        valeurCible: kpi.valeurCible || '',
                        originalValeur: kpi.valeur,
                        originalValeurCible: kpi.valeurCible,
                    })),
                    saveStatus: 'idle' as 'idle' | 'saving' | 'success' | 'error',
                }));

                this.activiteKpiValues.set(processedData);
                this.activiteKpisLoading.set(false);
            },
            error: (err) => {
                console.error('❌ Error loading activity KPI values:', err);
                this.activiteKpisLoading.set(false);
            },
        });
    }

    // ==================== TÂCHE KPI VALUES ====================

    loadTacheKpiValues() {
        this.tacheKpisLoading.set(true);

        this.service.getTachesKpiValues(this.programmeId).subscribe({
            next: (data) => {
                console.log('📊 Tâche KPI data:', data);

                const processedData = data.map(tache => ({
                    ...tache,
                    kpis: tache.kpis.map((kpi: any) => ({
                        ...kpi,
                        valeur: kpi.valeur || '',
                        valeurCible: kpi.valeurCible || '',
                        originalValeur: kpi.valeur,
                        originalValeurCible: kpi.valeurCible,
                    })),
                    saveStatus: 'idle' as 'idle' | 'saving' | 'success' | 'error',
                }));

                this.tacheKpiValues.set(processedData);
                this.tacheKpisLoading.set(false);
            },
            error: (err) => {
                console.error('❌ Error loading task KPI values:', err);
                this.tacheKpisLoading.set(false);
            },
        });
    }

    toggleActiviteCard(activiteId: number) {
        const expanded = this.expandedActiviteCards();
        if (expanded.includes(activiteId)) {
            this.expandedActiviteCards.set(expanded.filter(id => id !== activiteId));
        } else {
            this.expandedActiviteCards.set([...expanded, activiteId]);
        }
    }

    toggleTacheCard(tacheId: number) {
        const expanded = this.expandedTacheCards();
        if (expanded.includes(tacheId)) {
            this.expandedTacheCards.set(expanded.filter(id => id !== tacheId));
        } else {
            this.expandedTacheCards.set([...expanded, tacheId]);
        }
    }

    saveActiviteKpiCard(activite: ActiviteKpiValue) {
        activite.saveStatus = 'saving';

        const updates = activite.kpis
            .filter(kpi => kpi.valeur !== kpi.originalValeur || kpi.valeurCible !== kpi.originalValeurCible)
            .map(kpi =>
                this.service.updateActiviteKpiValeur(
                    activite.activiteId,
                    kpi.kpiId,
                    { valeur: kpi.valeur || null, valeurCible: kpi.valeurCible || null } as any,
                )
            );

        if (updates.length === 0) {
            activite.saveStatus = 'idle';
            return;
        }

        Promise.all(updates.map(obs => obs.toPromise()))
            .then(() => {
                activite.kpis.forEach(kpi => {
                    kpi.originalValeur = kpi.valeur;
                    kpi.originalValeurCible = kpi.valeurCible;
                });
                activite.saveStatus = 'success';
                setTimeout(() => activite.saveStatus = 'idle', 2000);
            })
            .catch(err => {
                console.error('Error saving activity KPIs:', err);
                activite.saveStatus = 'error';
                setTimeout(() => activite.saveStatus = 'idle', 3000);
            });
    }

    saveTacheKpiCard(tache: TacheKpiValue) {
        tache.saveStatus = 'saving';

        const updates = tache.kpis
            .filter(kpi => kpi.valeur !== kpi.originalValeur || kpi.valeurCible !== kpi.originalValeurCible)
            .map(kpi =>
                this.service.updateTacheKpiValeur(
                    tache.tacheId,
                    kpi.kpiId,
                    { valeur: kpi.valeur || null, valeurCible: kpi.valeurCible || null } as any,
                )
            );

        if (updates.length === 0) {
            tache.saveStatus = 'idle';
            return;
        }

        Promise.all(updates.map(obs => obs.toPromise()))
            .then(() => {
                tache.kpis.forEach(kpi => {
                    kpi.originalValeur = kpi.valeur;
                    kpi.originalValeurCible = kpi.valeurCible;
                });
                tache.saveStatus = 'success';
                setTimeout(() => tache.saveStatus = 'idle', 2000);
            })
            .catch(err => {
                console.error('Error saving task KPIs:', err);
                tache.saveStatus = 'error';
                setTimeout(() => tache.saveStatus = 'idle', 3000);
            });
    }

    loadProgrammeKpiValuesOnTabChange = () => {
        if (this.activeKpiSubTab() === 'saisie') {
            this.loadProgrammeKpiValues();
            this.loadActiviteKpiValues();
            this.loadTacheKpiValues();
        }
    };

    get globalKpis(): KpiWithStatus[] {
        return this.kpiGroups().filter(g => g.isGlobal).flatMap(g => g.kpis);
    }

    get globalAttachedCount(): number {
        return this.kpiGroups().filter(g => g.isGlobal).reduce((sum, g) => sum + g.attachedCount, 0);
    }

    get globalTotalCount(): number {
        return this.kpiGroups().filter(g => g.isGlobal).reduce((sum, g) => sum + g.totalCount, 0);
    }


    // ============================================================
// Add these helper methods to kpi-management.component.ts
// ============================================================

/**
 * Returns the display objectif for a KPI:
 * - For ENTREPRENEUR type: uses the first entrepreneur's valeurCible (they share the same target),
 *   falls back to kpi.valeurCible if none is set on entrepreneurs.
 * - For OPERATIONNEL: returns kpi.valeurCible directly.
 */
getKpiObjectif(kpi: any): number | null {
  if (kpi.typesuivi === 'ENTREPRENEUR' && kpi.entrepreneurValues?.length) {
    const firstWithCible = kpi.entrepreneurValues.find((e: any) => e.valeurCible != null);
    return firstWithCible?.valeurCible ?? kpi.valeurCible ?? null;
  }
  return kpi.valeurCible ?? null;
}

/**
 * Count of entrepreneurs that have enough data to compute a progression %.
 * - PROGRESSION type: needs valeurPrecedente (cumul) and valeurCible.
 * - NORMAL type: needs valeur and valeurCible.
 */
getEntrepreneurProgressionCount(kpi: any): number {
  if (!kpi.entrepreneurValues?.length) return 0;

  return kpi.entrepreneurValues.filter((e: any) => {
    if (kpi.typedesaisie === 'progression') {
      return e.valeurPrecedente != null && e.valeurCible != null && e.valeurCible > 0;
    }
    return e.valeur != null && e.valeurCible != null && e.valeurCible > 0;
  }).length;
}

/**
 * Average progression % across all entrepreneurs that have valid data.
 * - PROGRESSION: each pct = (valeurPrecedente / valeurCible) * 100, capped at 100.
 * - NORMAL:      each pct = (valeur / valeurCible) * 100, capped at 100.
 * Returns null if no entrepreneur has valid data.
 */
getAverageEntrepreneurProgress(kpi: any): number | null {
  if (!kpi.entrepreneurValues?.length) return null;

  const pcts: number[] = kpi.entrepreneurValues
    .map((e: any) => {
      if (kpi.typedesaisie === 'progression') {
        if (e.valeurPrecedente == null || !e.valeurCible) return null;
        return Math.min(100, Math.round((e.valeurPrecedente / e.valeurCible) * 100));
      } else {
        if (e.valeur == null || !e.valeurCible) return null;
        return Math.min(100, Math.round((e.valeur / e.valeurCible) * 100));
      }
    })
    .filter((p: number | null) => p !== null) as number[];

  if (!pcts.length) return null;
  return Math.round(pcts.reduce((sum, p) => sum + p, 0) / pcts.length);
}

/**
 * Average of all entrepreneurs' cumulated values (valeurPrecedente).
 * Used in the PROGRESSION variant progress section.
 * Returns null if no data.
 */
getAverageEntrepreneurCumul(kpi: any): number | null {
  if (!kpi.entrepreneurValues?.length) return null;

  const vals: number[] = kpi.entrepreneurValues
    .map((e: any) => e.valeurPrecedente)
    .filter((v: any) => v != null) as number[];

  if (!vals.length) return null;
  const avg = vals.reduce((sum, v) => sum + v, 0) / vals.length;
  return Math.round(avg * 100) / 100; // round to 2 decimal places
}

/**
 * Average of all entrepreneurs' current values (valeur).
 * Used in the NORMAL variant progress section.
 * Returns null if no data.
 */
getAverageEntrepreneurValeur(kpi: any): number | null {
  if (!kpi.entrepreneurValues?.length) return null;

  const vals: number[] = kpi.entrepreneurValues
    .map((e: any) => e.valeur)
    .filter((v: any) => v != null) as number[];

  if (!vals.length) return null;
  const avg = vals.reduce((sum, v) => sum + v, 0) / vals.length;
  return Math.round(avg * 100) / 100;
}

/**
 * Per-entrepreneur mini progress % shown inline in the PROGRESSION type row.
 * Uses valeurPrecedente (cumul) vs valeurCible, capped at 100.
 * Returns null if data is missing.
 */
getEntrepreneurProgressPct(entrepreneur: any): number | null {
  if (entrepreneur.valeurPrecedente == null || !entrepreneur.valeurCible) return null;
  return Math.min(100, Math.round((entrepreneur.valeurPrecedente / entrepreneur.valeurCible) * 100));
}
}