import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, ImproveResponse } from '../../../ai.service';

@Component({
    selector: 'app-rapport-section1',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="section-content">
            <div class="section-card">
                <h2 class="section-title">Résumé Exécutif</h2>
                <p class="section-description">
                    Remplissez les champs ci-dessous. Vous pouvez utiliser l'IA pour vous assister.
                </p>

                <!-- Objectifs du programme -->
                <div class="form-group">
                    <div class="form-header">
                        <label>Context</label>
                        <button
                            class="btn-ai"
                            (click)="generateWithAI('programObjectives', localProgramObjectives, 'objectives')"
                            [disabled]="isAIProcessing">
                            <i class="icon-ai"></i>
                            {{ isAIProcessing && currentAIField === 'programObjectives' ? 'Génération...' : 'Générer avec IA' }}
                        </button>
                    </div>
                    <textarea
                        [(ngModel)]="localProgramObjectives"
                        (ngModelChange)="emitChanges()"
                        placeholder="Saisissez objectifs du programme..."
                        rows="4">
                    </textarea>
                </div>

                <!-- Résultats clés -->
                <div class="form-group">
                    <div class="form-header">
                        <label>Mission</label>
                        <button
                            class="btn-ai"
                            (click)="generateWithAI('keyResults', localKeyResults, 'results')"
                            [disabled]="isAIProcessing">
                            <i class="icon-ai"></i>
                            {{ isAIProcessing && currentAIField === 'keyResults' ? 'Génération...' : 'Générer avec IA' }}
                        </button>
                    </div>
                    <textarea
                        [(ngModel)]="localKeyResults"
                        (ngModelChange)="emitChanges()"
                        placeholder="Saisissez résultats clés..."
                        rows="4">
                    </textarea>
                </div>

                <!-- Impact global -->
                <div class="form-group">
                    <div class="form-header">
                        <label>Impact global</label>
                        <button
                            class="btn-ai"
                            (click)="generateWithAI('globalImpact', localGlobalImpact, 'impact')"
                            [disabled]="isAIProcessing">
                            <i class="icon-ai"></i>
                            {{ isAIProcessing && currentAIField === 'globalImpact' ? 'Génération...' : 'Générer avec IA' }}
                        </button>
                    </div>
                    <textarea
                        [(ngModel)]="localGlobalImpact"
                        (ngModelChange)="emitChanges()"
                        placeholder="Saisissez impact global..."
                        rows="4">
                    </textarea>
                </div>
            </div>
        </div>

        <!-- AI Dialog Modal -->
        <div class="ai-modal-overlay" *ngIf="showAIModal" (click)="closeAIModal()">
            <div class="ai-modal" (click)="$event.stopPropagation()">

                <div class="ai-modal-header">
                    <div class="ai-modal-title">
                        <i class="icon-ai"></i>
                        <span>Suggestion de l'IA</span>
                    </div>
                    <button class="btn-close" (click)="closeAIModal()">✕</button>
                </div>

                <div class="ai-modal-body" *ngIf="aiResponse">

                    <!-- Score badge -->
                    <div class="ai-score-row">
                        <span class="ai-score-label">Score qualité</span>
                        <span class="ai-score-badge" [class.high]="aiResponse.score >= 70" [class.mid]="aiResponse.score >= 40 && aiResponse.score < 70" [class.low]="aiResponse.score < 40">
                            {{ aiResponse.score }} / 100
                        </span>
                    </div>

                    <!-- Side-by-side comparison -->
                    <div class="ai-comparison">
                        <div class="ai-version original">
                            <h4>Version originale</h4>
                            <p>{{ aiResponse.original_text }}</p>
                        </div>
                        <div class="ai-version improved">
                            <h4>Version IA ✨</h4>
                            <p>{{ aiResponse.improved_text }}</p>
                        </div>
                    </div>

                    <!-- Feedback list -->
                    <div class="ai-feedback" *ngIf="aiResponse.feedback && aiResponse.feedback.length">
                        <h4>Suggestions d'amélioration</h4>
                        <ul>
                            <li *ngFor="let tip of aiResponse.feedback">{{ tip }}</li>
                        </ul>
                    </div>
                </div>

                <div class="ai-modal-footer">
                    <button class="btn-secondary" (click)="closeAIModal()">Annuler</button>
                    <button class="btn-primary" (click)="applyAIVersion()">
                        ✅ Appliquer la version de l'IA
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        /* ── Modal overlay ── */
        .ai-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn .15s ease;
        }

        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        .ai-modal {
            background: #fff;
            border-radius: 12px;
            width: min(700px, 95vw);
            max-height: 85vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0,0,0,.2);
            overflow: hidden;
        }

        /* ── Header ── */
        .ai-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #fff;
        }

        .ai-modal-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 600;
        }

        .btn-close {
            background: none;
            border: none;
            color: #fff;
            font-size: 18px;
            cursor: pointer;
            opacity: .8;
            transition: opacity .2s;
        }
        .btn-close:hover { opacity: 1; }

        /* ── Body ── */
        .ai-modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        /* Score */
        .ai-score-row {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .ai-score-label { font-size: 13px; color: #6b7280; }
        .ai-score-badge {
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 700;
        }
        .ai-score-badge.high  { background: #d1fae5; color: #065f46; }
        .ai-score-badge.mid   { background: #fef3c7; color: #92400e; }
        .ai-score-badge.low   { background: #fee2e2; color: #991b1b; }

        /* Comparison */
        .ai-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        @media (max-width: 540px) {
            .ai-comparison { grid-template-columns: 1fr; }
        }

        .ai-version {
            border-radius: 8px;
            padding: 12px 14px;
            font-size: 13px;
            line-height: 1.6;
        }
        .ai-version h4 {
            margin: 0 0 8px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: .5px;
        }
        .ai-version p { margin: 0; white-space: pre-wrap; }

        .ai-version.original  { background: #f9fafb; border: 1px solid #e5e7eb; }
        .ai-version.original h4 { color: #6b7280; }

        .ai-version.improved  { background: #f5f3ff; border: 1px solid #c4b5fd; }
        .ai-version.improved h4 { color: #6d28d9; }

        /* Feedback */
        .ai-feedback h4 {
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            margin: 0 0 8px;
        }
        .ai-feedback ul {
            margin: 0;
            padding-left: 18px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .ai-feedback li { font-size: 13px; color: #4b5563; }

        /* ── Footer ── */
        .ai-modal-footer {
            padding: 14px 20px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }

        .btn-secondary {
            padding: 8px 18px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: #fff;
            color: #374151;
            font-size: 14px;
            cursor: pointer;
            transition: background .2s;
        }
        .btn-secondary:hover { background: #f9fafb; }

        .btn-primary {
            padding: 8px 18px;
            border: none;
            border-radius: 6px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity .2s;
        }
        .btn-primary:hover { opacity: .9; }
    `],
    styleUrls: ['../rapport.component.scss'],
})
export class RapportSection1Component implements OnInit, OnChanges {
    @Input() programObjectives: string = '';
    @Input() keyResults: string = '';
    @Input() globalImpact: string = '';
    @Input() programmeName?: string;

    @Output() dataChange = new EventEmitter<{
        programObjectives: string;
        keyResults: string;
        globalImpact: string;
    }>();

    localProgramObjectives: string = '';
    localKeyResults: string = '';
    localGlobalImpact: string = '';

    // AI dialog state
    showAIModal: boolean = false;
    aiResponse: ImproveResponse | null = null;
    currentAIField: string = '';
    isAIProcessing: boolean = false;

    constructor(private aiService: AiService) {}

    ngOnInit(): void {
        this.syncLocals();
    }

    ngOnChanges(): void {
        this.syncLocals();
    }

    private syncLocals(): void {
        this.localProgramObjectives = this.programObjectives;
        this.localKeyResults = this.keyResults;
        this.localGlobalImpact = this.globalImpact;
    }

    emitChanges(): void {
        this.dataChange.emit({
            programObjectives: this.localProgramObjectives,
            keyResults: this.localKeyResults,
            globalImpact: this.localGlobalImpact,
        });
    }

    // ── AI generation ──────────────────────────────────────────────────────────

    generateWithAI(fieldName: string, text: string, type: string): void {
        if (!text?.trim()) {
            alert('Veuillez saisir du texte avant de générer avec l\'IA.');
            return;
        }

        this.currentAIField = fieldName;
        this.isAIProcessing = true;

        this.aiService.improve({
            text: text.trim(),
            type,
            context: this.programmeName ?? '',
            model: 'mistral',
        }).subscribe({
            next: (response) => {
                this.aiResponse = response;
                this.showAIModal = true;
                this.isAIProcessing = false;
            },
            error: (err) => {
                console.error('AI service error:', err);
                alert('Une erreur est survenue lors de la génération. Veuillez réessayer.');
                this.isAIProcessing = false;
            },
        });
    }

    applyAIVersion(): void {
        if (!this.aiResponse) return;

        const improved = this.aiResponse.improved_text;

        switch (this.currentAIField) {
            case 'programObjectives':
                this.localProgramObjectives = improved;
                break;
            case 'keyResults':
                this.localKeyResults = improved;
                break;
            case 'globalImpact':
                this.localGlobalImpact = improved;
                break;
        }

        this.emitChanges();
        this.closeAIModal();
    }

    closeAIModal(): void {
        this.showAIModal = false;
        this.aiResponse = null;
        this.currentAIField = '';
    }
}