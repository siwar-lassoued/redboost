// src/app/pages/backoffice/programmes/Gestion_sprint/dialogs/kpi_history/kpi-history-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProgrammeService } from '../../programme.service';

interface KpiHistoryEntry {
    id: number;
    programmeKpiId?: number;
    programmeKpiValeurId?: number;
    valeurPrecedente: string | null;
    valeurActuelle: string | null;
    valeurCible: string | null;
    valeur: string | null;
    changedAt: string;
    changedBy?: number;
    typedesaisie?: 'progression' | 'normal' | null;
}

interface EntrepreneurHistoryGroup {
    userId: number;
    userName: string;
    history: KpiHistoryEntry[];
}

@Component({
    selector: 'app-kpi-history-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    template: `
<div class="kpi-history-dialog">
    <!-- Header -->
    <div class="dialog-header">
        <div class="header-content">
            <mat-icon class="header-icon">history</mat-icon>
            <div>
                <h2 class="dialog-title">
                    Historique des valeurs - {{ data.kpiName }}
                </h2>
                <p class="dialog-subtitle" *ngIf="!isEntrepreneurType">
                    Consultez l'évolution des valeurs de ce KPI au fil du temps
                </p>
                <p class="dialog-subtitle" *ngIf="isEntrepreneurType">
                    Historique des valeurs par entrepreneur
                </p>
            </div>
        </div>
        <button class="close-button" (click)="onClose()">
            <mat-icon>close</mat-icon>
        </button>
    </div>

    <!-- Content -->
    <div class="dialog-content">
        <!-- Loading State -->
        <div *ngIf="loading" class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
            <p class="loading-text">Chargement de l'historique...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="error-state">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <p class="error-text">{{ error }}</p>
            <button mat-raised-button color="primary" (click)="loadHistory()">
                Réessayer
            </button>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && !error && !isEntrepreneurType && history.length === 0" class="empty-state">
            <mat-icon class="empty-icon">info_outline</mat-icon>
            <p class="empty-text">Aucune donnée historique disponible pour ce KPI</p>
            <p class="empty-subtext">
                L'historique sera disponible après la première modification des valeurs
            </p>
        </div>

        <!-- Empty State for Entrepreneur -->
        <div *ngIf="!loading && !error && isEntrepreneurType && entrepreneurHistoryGroups.length === 0" class="empty-state">
            <mat-icon class="empty-icon">info_outline</mat-icon>
            <p class="empty-text">Aucune donnée historique disponible</p>
            <p class="empty-subtext">
                L'historique sera disponible après l'ajout d'entrepreneurs et la saisie de valeurs
            </p>
        </div>

        <!-- Standard KPI History List -->
        <div *ngIf="!loading && !error && !isEntrepreneurType && history.length > 0" class="history-list">
            <div *ngFor="let entry of history; let i = index" class="history-entry">
                <div class="entry-timeline">
                    <div class="timeline-dot"></div>
                    <div *ngIf="i !== history.length - 1" class="timeline-line"></div>
                </div>
                
                <div class="entry-content">
                    <div class="entry-header">
                        <span class="entry-date">{{ formatDate(entry.changedAt) }}</span>
                        <span class="entry-time">{{ formatTime(entry.changedAt) }}</span>
                    </div>
                    
                    <!-- Normal Type (2 values) -->
                    <div *ngIf="data.typedesaisie !== 'progression'" class="entry-values">
                        <div class="value-item highlight">
                            <span class="value-label">Valeur actuelle:</span>
                            <span class="value-text">{{ entry.valeurActuelle || '—' }}</span>
                        </div>
                        <div class="value-item">
                            <span class="value-label">Objectif:</span>
                            <span class="value-text">{{ entry.valeurCible || '—' }}</span>
                        </div>
                    </div>

                    <!-- Progression Type (3 values) -->
                    <div *ngIf="data.typedesaisie === 'progression'" class="entry-values">
                        <div class="value-item">
                            <span class="value-label">Valeur initiale:</span>
                            <span class="value-text">{{ entry.valeurPrecedente || '—' }}</span>
                        </div>
                        <div class="value-item highlight">
                            <span class="value-label">Valeur actuelle:</span>
                            <span class="value-text">{{ entry.valeurActuelle || '—' }}</span>
                        </div>
                        <div class="value-item">
                            <span class="value-label">Objectif:</span>
                            <span class="value-text">{{ entry.valeurCible || '—' }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Entrepreneur KPI History (Grouped by Entrepreneur) -->
        <div *ngIf="!loading && !error && isEntrepreneurType && entrepreneurHistoryGroups.length > 0" class="entrepreneur-history-container">
            <div *ngFor="let group of entrepreneurHistoryGroups; let groupIndex = index" class="entrepreneur-group">
                <!-- Entrepreneur Header -->
                <div class="entrepreneur-header">
                    <mat-icon class="entrepreneur-icon">person</mat-icon>
                    <span class="entrepreneur-name">{{ group.userName }}</span>
                    <span class="entry-count">{{ group.history.length }} entrée(s)</span>
                </div>

                <!-- Entrepreneur's History -->
                <div class="history-list entrepreneur-history-list">
                    <div *ngFor="let entry of group.history; let i = index" class="history-entry">
                        <div class="entry-timeline">
                            <div class="timeline-dot entrepreneur-dot"></div>
                            <div *ngIf="i !== group.history.length - 1" class="timeline-line"></div>
                        </div>
                        
                        <div class="entry-content">
                            <div class="entry-header">
                                <span class="entry-date">{{ formatDate(entry.changedAt) }}</span>
                                <span class="entry-time">{{ formatTime(entry.changedAt) }}</span>
                            </div>
                            
                            <!-- Normal Type (2 values) -->
                            <div *ngIf="data.typedesaisie !== 'progression'" class="entry-values">
                                <div class="value-item highlight">
                                    <span class="value-label">Valeur actuelle:</span>
                                    <span class="value-text">{{ entry.valeurActuelle || '—' }}</span>
                                </div>
                                <div class="value-item">
                                    <span class="value-label">Objectif:</span>
                                    <span class="value-text">{{ entry.valeurCible || '—' }}</span>
                                </div>
                            </div>

                            <!-- Progression Type (3 values) -->
                            <div *ngIf="data.typedesaisie === 'progression'" class="entry-values">
                                <div class="value-item">
                                    <span class="value-label">Valeur initiale:</span>
                                    <span class="value-text">{{ entry.valeurPrecedente || '—' }}</span>
                                </div>
                                <div class="value-item highlight">
                                    <span class="value-label">Valeur actuelle:</span>
                                    <span class="value-text">{{ entry.valeurActuelle || '—' }}</span>
                                </div>
                                <div class="value-item">
                                    <span class="value-label">Objectif:</span>
                                    <span class="value-text">{{ entry.valeurCible || '—' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="dialog-footer">
        <button mat-button (click)="onClose()">Fermer</button>
    </div>
</div>
    `,
    styles: [`
.kpi-history-dialog {
    display: flex;
    flex-direction: column;
    max-height: 80vh;
    width: 100%;
    max-width: 600px;
}

.dialog-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
}

.header-content {
    display: flex;
    gap: 16px;
    flex: 1;
}

.header-icon {
    width: 32px;
    height: 32px;
    font-size: 32px !important;
    color: #E91E63;
    flex-shrink: 0;
}

.dialog-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.4;
}

.dialog-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
}

.close-button {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
        background-color: #f1f5f9;
        color: #0f172a;
    }

    mat-icon {
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
    }
}

.dialog-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
}

.loading-state,
.error-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
}

.loading-text {
    margin-top: 16px;
    color: #64748b;
    font-size: 14px;
}

.error-icon,
.empty-icon {
    font-size: 56px !important;
    width: 56px !important;
    height: 56px !important;
    color: #cbd5e1;
    margin-bottom: 16px;
}

.error-text,
.empty-text {
    color: #64748b;
    font-size: 14px;
    margin-bottom: 8px;
}

.empty-subtext {
    color: #94a3b8;
    font-size: 12px;
    margin-top: 4px;
}

.history-list {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.history-entry {
    display: flex;
    gap: 16px;
    position: relative;
}

.entry-timeline {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    width: 20px;
}

.timeline-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #E91E63;
    border: 3px solid #fce7f3;
    flex-shrink: 0;
    margin-top: 8px;
    z-index: 1;
}

.timeline-dot.entrepreneur-dot {
    background-color: #8b5cf6;
    border-color: #ede9fe;
}

.timeline-line {
    width: 2px;
    flex: 1;
    background-color: #e2e8f0;
    margin-top: 4px;
    margin-bottom: 4px;
}

.entry-content {
    flex: 1;
    padding-bottom: 24px;
}

.entry-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.entry-date {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
}

.entry-time {
    font-size: 13px;
    color: #64748b;
}

.entry-values {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.value-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: white;
    border-radius: 6px;
    border: 1px solid #e2e8f0;

    &.highlight {
        background-color: #fef3c7;
        border-color: #fbbf24;
    }
}

.value-label {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
}

.value-text {
    font-size: 14px;
    color: #0f172a;
    font-weight: 600;
}

.dialog-footer {
    padding: 16px 24px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
}

/* Entrepreneur-specific styles */
.entrepreneur-history-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.entrepreneur-group {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    background: white;
}

.entrepreneur-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
}

.entrepreneur-icon {
    font-size: 24px !important;
    width: 24px !important;
    height: 24px !important;
    color: white;
}

.entrepreneur-name {
    font-size: 15px;
    font-weight: 600;
    flex: 1;
}

.entry-count {
    font-size: 12px;
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 12px;
    font-weight: 500;
}

.entrepreneur-history-list {
    padding: 16px;
    background: #fafafa;
}
    `],
})
export class KpiHistoryDialogComponent implements OnInit {
    history: KpiHistoryEntry[] = [];
    entrepreneurHistoryGroups: EntrepreneurHistoryGroup[] = [];
    loading = true;
    error: string | null = null;
    isEntrepreneurType = false;

    constructor(
        public dialogRef: MatDialogRef<KpiHistoryDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { 
            programmeId: number; 
            kpiId: number; 
            kpiName: string;
            typedesaisie?: 'progression' | 'normal';
            typesuivi?: string;
            entrepreneurValues?: Array<{userId: number; userName: string}>;
        },
        private service: ProgrammeService
    ) {
        this.isEntrepreneurType = this.data.typesuivi === 'ENTREPRENEUR';
    }

    ngOnInit(): void {
        this.loadHistory();
    }

    loadHistory(): void {
        this.loading = true;
        this.error = null;

        if (this.isEntrepreneurType) {
            this.loadEntrepreneurHistory();
        } else {
            this.loadStandardHistory();
        }
    }

    loadStandardHistory(): void {
        this.service.getKpiHistory(this.data.programmeId, this.data.kpiId).subscribe({
            next: (history) => {
                console.log('📜 Standard KPI History loaded:', history);
                this.history = history;
                this.loading = false;
            },
            error: (err) => {
                console.error('❌ Error loading KPI history:', err);
                this.error = 'Impossible de charger l\'historique. Veuillez réessayer.';
                this.loading = false;
            },
        });
    }

    loadEntrepreneurHistory(): void {
        if (!this.data.entrepreneurValues || this.data.entrepreneurValues.length === 0) {
            this.loading = false;
            return;
        }

        const historyRequests = this.data.entrepreneurValues.map(entrepreneur =>
            this.service.getEntrepreneurValueHistory(
                this.data.programmeId,
                this.data.kpiId,
                entrepreneur.userId
            ).toPromise().then(history => ({
                userId: entrepreneur.userId,
                userName: entrepreneur.userName,
                history: history || []
            })).catch(err => {
                console.error(`Error loading history for entrepreneur ${entrepreneur.userId}:`, err);
                return {
                    userId: entrepreneur.userId,
                    userName: entrepreneur.userName,
                    history: []
                };
            })
        );

        Promise.all(historyRequests).then(groups => {
            console.log('📜 Entrepreneur History loaded:', groups);
            // Filter out entrepreneurs with no history
            this.entrepreneurHistoryGroups = groups.filter(g => g.history.length > 0);
            this.loading = false;
        }).catch(err => {
            console.error('❌ Error loading entrepreneur history:', err);
            this.error = 'Impossible de charger l\'historique. Veuillez réessayer.';
            this.loading = false;
        });
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    }

    formatTime(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    onClose(): void {
        this.dialogRef.close();
    }
}