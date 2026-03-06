// src/app/pages/backoffice/gestion_Cat_Kpi/kpi-dialog.component.ts

import { Component, Inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
    MatDialogRef,
    MAT_DIALOG_DATA,
    MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

import { categorieKpiService } from './categorieKpi.service';
import {
    BackofficeKpi,
    BackofficeKpiRequest,
} from '../../../models/BackofficeCategory';

interface KpiDialogData {
    categoryId: number;
    kpi?: BackofficeKpi;
}

@Component({
    selector: 'app-kpi-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatSelectModule,
        MatOptionModule,
        MatIconModule,
    ],
    styles: `
        .dialog-container {
            @apply w-full flex flex-col;
            min-height: 500px;
            max-height: 85vh;
        }

        .dialog-header {
            @apply flex justify-between items-start px-8 pt-8 pb-6 flex-shrink-0 border-b border-slate-100;
        }

        .dialog-content {
            @apply flex-1 overflow-y-auto px-8 py-6;
        }

        .dialog-footer {
            @apply flex-shrink-0 px-8 py-6 border-t border-slate-100 bg-slate-50;
        }

        .dialog-title {
            @apply text-2xl font-bold text-slate-900 mb-1;
        }

        .dialog-subtitle {
            @apply text-sm text-slate-500;
        }

        .form-section {
            @apply mb-6;
        }

        .label {
            @apply block text-sm font-semibold text-slate-700 mb-2.5;
        }

        .input-field {
            @apply w-full px-4 py-3 rounded-xl border border-slate-300 bg-white 
             focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent
             text-sm transition-all duration-200 placeholder-slate-400;
        }

        .input-field:hover {
            @apply border-slate-400;
        }

        textarea.input-field {
            @apply resize-none;
        }

        .grid-2 {
            @apply grid grid-cols-1 md:grid-cols-2 gap-6;
        }

        /* Custom select styling */
        ::ng-deep .mat-mdc-select {
            @apply w-full;
        }

        ::ng-deep .mat-mdc-select-trigger {
            @apply px-4 py-3 rounded-xl border border-slate-300 bg-white min-h-[48px];
        }

        ::ng-deep .mat-mdc-select:hover .mat-mdc-select-trigger {
            @apply border-slate-400;
        }

        ::ng-deep .mat-mdc-select.mat-focused .mat-mdc-select-trigger {
            @apply ring-2 ring-rose-400 border-transparent;
        }

        ::ng-deep .mat-mdc-select-value {
            @apply flex items-center gap-2;
        }

        ::ng-deep .mat-mdc-select-arrow {
            @apply text-slate-400;
        }

        ::ng-deep .mat-mdc-select-placeholder {
            @apply text-slate-400;
        }

        /* Type badge dots */
        .type-dot {
            @apply inline-block w-2.5 h-2.5 rounded-full flex-shrink-0;
        }

        .type-dot.global {
            @apply bg-rose-500;
        }

        .type-dot.optionnel {
            @apply bg-cyan-500;
        }

        .type-option {
            @apply flex items-start gap-3 py-2;
        }

        .type-label {
            @apply font-medium text-slate-900 text-sm;
        }

        .type-description {
            @apply text-xs text-slate-500 mt-1 leading-relaxed;
        }

        /* Type de suivi icon styling */
        ::ng-deep .mat-mdc-option {
            @apply py-3 px-4 min-h-[60px];
        }

        .suivi-icon {
            @apply inline-flex items-center justify-center w-6 h-6 flex-shrink-0;
        }

        .suivi-icon mat-icon {
            @apply text-lg;
        }

        .suivi-icon.entrepreneur {
            @apply text-rose-500;
        }

        .suivi-icon.operationnel {
            @apply text-cyan-500;
        }

        .suivi-label {
            @apply font-medium text-slate-900 text-sm;
        }

        .suivi-description {
            @apply text-xs text-slate-500 mt-1 leading-relaxed;
        }

        /* Info box styling */
        .info-box {
            @apply mt-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200;
        }

        .info-content {
            @apply flex items-start gap-3 text-xs text-slate-600 leading-relaxed;
        }

        .info-icon {
            @apply flex-shrink-0 text-slate-400;
        }

        .footer-buttons {
            @apply flex justify-end gap-4;
        }

        .btn-cancel {
            @apply px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 
             hover:bg-slate-50 hover:border-slate-400 font-medium transition-all duration-200;
        }

        .btn-save {
            @apply px-8 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 
             text-white font-medium shadow-sm transition-all duration-200
             disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none;
        }

        .close-btn {
            @apply text-slate-400 hover:text-slate-700 transition-colors duration-200 -mr-2 -mt-2;
        }
    `,
    template: `
        <div class="dialog-container">
            <div class="dialog-header">
                <div class="flex-1">
                    <h2 class="dialog-title">
                        {{ data.kpi ? 'Modifier le KPI' : 'Créer un KPI' }}
                    </h2>
                    <p class="dialog-subtitle">
                        {{
                            data.kpi
                                ? 'Modifiez les détails de cet indicateur.'
                                : 'Créez un nouveau KPI pour suivre vos performances.'
                        }}
                    </p>
                </div>
                <button
                    mat-icon-button
                    (click)="dialogRef.close()"
                    class="close-btn"
                >
                    <mat-icon>close</mat-icon>
                </button>
            </div>

            <div class="dialog-content">
                <form [formGroup]="form" class="space-y-6">
                    <!-- Nom du KPI -->
                    <div class="form-section">
                        <label class="label">Nom du KPI *</label>
                        <input
                            formControlName="nom"
                            type="text"
                            class="input-field"
                            placeholder="Ex: Chiffre d'Affaires"
                        />
                    </div>

                    <!-- Type du KPI with colored dots -->
                    <div class="form-section">
                        <label class="label">Type de KPI *</label>
                        <mat-select
                            formControlName="type"
                            placeholder="Choisir le type"
                        >
                            <mat-select-trigger>
                                @if (form.get('type')?.value === 'OPTIONNEL') {
                                    <span class="type-dot optionnel"></span>
                                    <span class="type-label">Optionnel</span>
                                } @else if (form.get('type')?.value === 'GLOBAL') {
                                    <span class="type-dot global"></span>
                                    <span class="type-label">Global</span>
                                }
                            </mat-select-trigger>
                            <mat-option value="OPTIONNEL">
                                <div class="type-option">
                                    <span class="type-dot optionnel"></span>
                                    <div class="flex-1">
                                        <div class="type-label">Optionnel</div>
                                    </div>
                                </div>
                            </mat-option>
                            <mat-option value="GLOBAL">
                                <div class="type-option">
                                    <span class="type-dot global"></span>
                                    <div class="flex-1">
                                        <div class="type-label">Global</div>
                                    </div>
                                </div>
                            </mat-option>
                        </mat-select>

                        <!-- Info box showing selected type -->
                        @if (form.get('type')?.value) {
                            <div class="info-box">
                                <div class="info-content">
                                    <mat-icon class="info-icon text-base">info</mat-icon>
                                    <div class="flex-1">
                                        @if (form.get('type')?.value === 'GLOBAL') {
                                            <span class="font-semibold text-rose-600">KPI Global :</span>
                                            Ce KPI sera automatiquement attaché à tous les nouveaux programmes créés.
                                        } @else {
                                            <span class="font-semibold text-cyan-600">KPI Optionnel :</span>
                                            Ce KPI pourra être sélectionné manuellement dans les programmes et activités.
                                        }
                                    </div>
                                </div>
                            </div>
                        }
                    </div>

                    <!-- Type de suivi -->
                    <div class="form-section">
                        <label class="label">Type de suivi *</label>
                        <mat-select
                            formControlName="typesuivi"
                            placeholder="Choisir le type de suivi"
                        >
                            <mat-select-trigger>
                                @if (form.get('typesuivi')?.value === 'ENTREPRENEUR') {
                                    <span class="suivi-icon entrepreneur">
                                        <mat-icon>person</mat-icon>
                                    </span>
                                    <span class="suivi-label">Entrepreneur</span>
                                } @else if (form.get('typesuivi')?.value === 'OPERATIONNEL') {
                                    <span class="suivi-icon operationnel">
                                        <mat-icon>groups</mat-icon>
                                    </span>
                                    <span class="suivi-label">Opérationnel</span>
                                }
                            </mat-select-trigger>
                            <mat-option value="ENTREPRENEUR">
                                <div class="flex items-start gap-3">
                                    <span class="suivi-icon entrepreneur">
                                        <mat-icon>person</mat-icon>
                                    </span>
                                    <div class="flex-1">
                                        <div class="suivi-label">Entrepreneur</div>
                                        <div class="suivi-description">
                                            KPI suivi par entrepreneur (CA, employés, statut légal, etc.)
                                        </div>
                                    </div>
                                </div>
                            </mat-option>
                            <mat-option value="OPERATIONNEL">
                                <div class="flex items-start gap-3">
                                    <span class="suivi-icon operationnel">
                                        <mat-icon>groups</mat-icon>
                                    </span>
                                    <div class="flex-1">
                                        <div class="suivi-label">Opérationnel</div>
                                        <div class="suivi-description">
                                            KPI suivi au niveau programme (événements, participants, partenariats, etc.)
                                        </div>
                                    </div>
                                </div>
                            </mat-option>
                        </mat-select>
                    </div>

                    <!-- Type de saisie - CONDITIONAL: only if typesuivi === 'ENTREPRENEUR' -->
                    <div class="form-section" >
                        <label class="label">Type de saisie *</label>
                        <mat-select
                            formControlName="typedesaisie"
                            placeholder="Choisir le mode de saisie"
                        >
                            <mat-select-trigger>
                                @if (form.get('typedesaisie')?.value === 'progression') {
                                    <span class="type-dot" style="background-color: #f59e0b;"></span>
                                    <span class="type-label">Progression</span>
                                } @else {
                                    <span class="type-dot" style="background-color: #10b981;"></span>
                                    <span class="type-label">Normal</span>
                                }
                            </mat-select-trigger>

                            <mat-option value="normal">
                                <div class="type-option">
                                    <span class="type-dot" style="background-color: #10b981;"></span>
                                    <div class="flex-1">
                                        <div class="type-label">Normal</div>
                                        <div class="type-description">
                                            Saisie d'une valeur unique (ex: CA total, nombre d'employés)
                                        </div>
                                    </div>
                                </div>
                            </mat-option>

                            <mat-option value="progression">
                                <div class="type-option">
                                    <span class="type-dot" style="background-color: #f59e0b;"></span>
                                    <div class="flex-1">
                                        <div class="type-label">Progression</div>
                                        <div class="type-description">
                                            Saisie de 3 valeurs: initiale, actuelle et cible (ex: évolution mensuelle)
                                        </div>
                                    </div>
                                </div>
                            </mat-option>
                        </mat-select>

                        <!-- Info box -->
                        @if (form.get('typedesaisie')?.value) {
                            <div class="info-box">
                                <div class="info-content">
                                    <mat-icon class="info-icon text-base">info</mat-icon>
                                    <div class="flex-1">
                                        @if (form.get('typedesaisie')?.value === 'progression') {
                                            <span class="font-semibold text-amber-600">Progression :</span>
                                            Ce KPI permet de saisir 3 valeurs (initiale, actuelle, cible) pour suivre l'évolution dans le temps.
                                        } @else {
                                            <span class="font-semibold text-emerald-600">Normal :</span>
                                            Saisie standard d'une valeur unique à un instant T. Convient à la plupart des indicateurs.
                                        }
                                    </div>
                                </div>
                            </div>
                        }
                    </div>

                    <!-- Description -->
                    <div class="form-section">
                        <label class="label">Description (optionnelle)</label>
                        <textarea
                            formControlName="description"
                            rows="3"
                            class="input-field"
                            placeholder="Décrivez l'objectif et l'utilité de ce KPI..."
                        ></textarea>
                    </div>

                    <!-- Unité & Objectif -->
                    <div class="grid-2">
                        <div class="form-section">
                            <label class="label">Unité de mesure *</label>
                            <input
                                formControlName="uniteMesure"
                                type="text"
                                class="input-field"
                                placeholder="Ex: TND, %, heures"
                            />
                        </div>
                       
                    </div>
                </form>
            </div>

            <div class="dialog-footer">
                <div class="footer-buttons">
                    <button
                        type="button"
                        (click)="dialogRef.close()"
                        class="btn-cancel"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        [disabled]="form.invalid || saving()"
                        (click)="save()"
                        class="btn-save"
                    >
                        @if (saving()) {
                            <span class="flex items-center gap-2">
                                <mat-icon class="animate-spin text-base">refresh</mat-icon>
                                Enregistrement...
                            </span>
                        } @else {
                            {{ data.kpi ? 'Enregistrer les modifications' : 'Créer le KPI' }}
                        }
                    </button>
                </div>
            </div>
        </div>
    `,
})
export class KpiDialogComponent {
    readonly saving = signal(false);
    readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: categorieKpiService,
    public readonly dialogRef: MatDialogRef<KpiDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: KpiDialogData,
) {
    this.form = this.fb.group({
        nom: ['', Validators.required],
        type: ['OPTIONNEL', Validators.required],
        typesuivi: ['ENTREPRENEUR', Validators.required],
        typedesaisie: ['normal'],
        description: [''],
        uniteMesure: ['', Validators.required],
    });

    // Load data BEFORE setting up the subscription
    if (data.kpi) {
        this.form.patchValue({
            nom: data.kpi.nom,
            type: data.kpi.type === 'GLOBAL' ? 'GLOBAL' : 'OPTIONNEL',
            typesuivi: (data.kpi as any).typesuivi || 'ENTREPRENEUR',
            typedesaisie: data.kpi.typedesaisie || 'normal',
            description: data.kpi.description || '',
            uniteMesure: data.kpi.uniteMesure,
        });
    }

    // Set up the subscription AFTER patching values
    this.form.get('typesuivi')?.valueChanges.subscribe(value => {
        const typedesaisieControl = this.form.get('typedesaisie');

        if (value === 'ENTREPRENEUR') {
            typedesaisieControl?.setValidators(Validators.required);
        } else {
            typedesaisieControl?.clearValidators();
            // Only reset to 'normal' if the current value is empty or undefined
            // This prevents overwriting existing values when editing
            if (!typedesaisieControl?.value) {
                typedesaisieControl?.setValue('normal');
            }
        }
        typedesaisieControl?.updateValueAndValidity();
    });

    // Trigger validation update after everything is set up
    if (data.kpi) {
        this.form.get('typesuivi')?.updateValueAndValidity();
    }
}
    save() {
        if (this.form.invalid) return;
        this.saving.set(true);

        const value = this.form.getRawValue();

        const payload: BackofficeKpiRequest & {
            typesuivi: 'ENTREPRENEUR' | 'OPERATIONNEL';
        } = {
            nom: value.nom!,
            type: value.type! as 'GLOBAL' | 'OPTIONNEL',
            typesuivi: value.typesuivi! as 'ENTREPRENEUR' | 'OPERATIONNEL',
            typedesaisie: value.typedesaisie! as 'progression' | 'normal',
            description: value.description || null,
            uniteMesure: value.uniteMesure!,
        };

        const request$ = this.data.kpi
            ? this.service.updateKpi(this.data.kpi.id, payload)
            : this.service.addKpi(this.data.categoryId, payload);

        request$.subscribe({
            next: () => this.dialogRef.close(true),
            error: (err) => {
                console.error('Erreur sauvegarde KPI:', err);
                this.saving.set(false);
            },
            complete: () => this.saving.set(false),
        });
    }
}