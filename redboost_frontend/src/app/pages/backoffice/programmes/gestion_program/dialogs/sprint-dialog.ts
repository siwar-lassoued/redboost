// src/app/pages/backoffice/programmes/dialogs/sprint-dialog.component.ts

import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Sprint } from '../../../../../models/programme';

@Component({
    selector: 'app-sprint-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule, DatePipe],
    template: `
        <div class="modal-overlay" *ngIf="isOpen()" (click)="onClose()">
            <div class="modal-box" (click)="$event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">
                        {{ isEditing ? 'Modifier' : 'Créer' }} un nouveau sprint
                    </h2>
                    <p class="modal-subtitle">
                        Entrez les détails du sprint que vous souhaitez créer.
                    </p>
                </div>

                <!-- ✅ ERROR ALERT -->
                <div class="error-alert" *ngIf="validationError()">
                    <mat-icon class="error-icon">error</mat-icon>
                    <div class="error-content">
                        <p class="error-title">Erreur de validation</p>
                        <p class="error-message">{{ validationError() }}</p>
                    </div>
                    <button
                        class="error-close"
                        (click)="validationError.set(null)"
                    >
                        <mat-icon>close</mat-icon>
                    </button>
                </div>

                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Nom du sprint *</label>
                        <input
                            class="form-input"
                            [(ngModel)]="sprintData.nom"
                            placeholder="Ex: Sprint Q1-2025"
                        />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea
                            class="form-textarea"
                            [(ngModel)]="sprintData.description"
                            placeholder="Décrivez les objectifs du sprint..."
                        ></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">Date de début *</label>
                            <input
                                class="form-input"
                                type="date"
                                [ngModel]="
                                    sprintData.dateDebut | date: 'yyyy-MM-dd'
                                "
                                (ngModelChange)="sprintData.dateDebut = $event"
                            />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date limite *</label>
                            <input
                                class="form-input"
                                type="date"
                                [ngModel]="
                                    sprintData.dateLimite | date: 'yyyy-MM-dd'
                                "
                                (ngModelChange)="sprintData.dateLimite = $event"
                            />
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" (click)="onClose()">
                        Annuler
                    </button>
                    <button class="btn-submit sprint" (click)="onSave()">
                        {{ isEditing ? 'Enregistrer' : 'Créer le sprint' }}
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .modal-overlay {
                @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4;
            }

            .modal-box {
                @apply bg-white rounded-xl w-full max-w-[500px] overflow-hidden shadow-xl animate-[fadeIn_0.2s_ease-out];
            }

            .modal-header {
                @apply p-6 pb-4 border-b border-slate-100;
            }

            .modal-title {
                @apply text-xl font-bold text-slate-900;
            }

            .modal-subtitle {
                @apply text-slate-500 text-sm mt-1;
            }

            /* ✅ ERROR ALERT STYLES */
            .error-alert {
                @apply mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3;
                animation: slideDown 0.3s ease-out;
            }

            .error-icon {
                @apply text-red-600 text-xl flex-shrink-0;
            }

            .error-content {
                @apply flex-1;
            }

            .error-title {
                @apply text-sm font-semibold text-red-900 mb-1;
            }

            .error-message {
                @apply text-sm text-red-700;
            }

            .error-close {
                @apply w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors flex-shrink-0;
            }

            .error-close mat-icon {
                @apply text-lg;
            }

            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .modal-body {
                @apply p-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto;
            }

            .modal-footer {
                @apply p-6 pt-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3;
            }

            .form-group {
                @apply space-y-1.5;
            }

            .form-label {
                @apply text-sm font-semibold text-slate-700 block;
            }

            .form-input {
                @apply w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 transition-all;
            }

            .form-input:focus {
                @apply outline-none ring-2 ring-pink-200 border-pink-400 bg-white;
            }

            .form-textarea {
                @apply w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 resize-none transition-all min-h-[80px];
            }

            .form-textarea:focus {
                @apply outline-none ring-2 ring-pink-200 border-pink-400 bg-white;
            }

            .btn-cancel {
                @apply px-4 py-2 bg-white border border-slate-200 rounded-md text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors;
            }

            .btn-submit {
                @apply px-4 py-2 rounded-md font-medium text-sm shadow-sm text-white transition-all active:translate-y-[1px];
            }

            .btn-submit.sprint {
                @apply bg-[#E91E63] hover:bg-[#D81B60] border-b-2 border-[#AD1457] active:border-b-0;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `,
    ],
})
export class SprintModalComponent {
    @Input() set show(value: boolean) {
        this.isOpen.set(value);
    }

    @Input() set sprint(value: Partial<Sprint> | null) {
        if (value && value.id) {
            this.isEditing = true;
            this.sprintData = { ...value };
        } else {
            this.isEditing = false;
            const today = new Date().toISOString().split('T')[0];
            this.sprintData = {
                nom: '',
                description: '',
                dateDebut: today,
                dateLimite: today,
            };
        }
        // Clear error when opening modal
        this.validationError.set(null);
    }

    @Input() set error(value: any) {
        if (value) {
            let msg = "Erreur lors de l'opération sur le sprint";
            if (typeof value === 'string') {
                msg = value;
            } else if (value?.message) {
                msg = value.message;
            } else if (value?.error) {
                msg = value.error;
            }
            this.validationError.set(msg);
        } else {
            this.validationError.set(null);
        }
    }

    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<Partial<Sprint>>();

    isOpen = signal(false);
    isEditing = false;
    sprintData: Partial<Sprint> = {};
    validationError = signal<string | null>(null);

    onClose() {
        this.validationError.set(null);
        this.close.emit();
    }

    onSave() {
        if (!this.sprintData.nom) return;
        this.validationError.set(null); // Clear any previous errors
        this.save.emit(this.sprintData);
    }
}
