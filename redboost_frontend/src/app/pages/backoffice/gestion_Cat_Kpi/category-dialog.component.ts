import { Component, Inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
    MatDialogRef,
    MAT_DIALOG_DATA,
    MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

import { categorieKpiService } from './categorieKpi.service';
import {
    BackofficeCategory,
    BackofficeCategoryRequest,
} from '../../../models/BackofficeCategory';

const PRESET_COLORS = [
    { name: 'Rouge Corail', value: '#ea5073' },
    { name: 'Teal', value: '#2a7b8c' },
    { name: 'Bordeaux', value: '#6d3345' },
    { name: 'Bleu', value: '#3490dc' },
    { name: 'Vert', value: '#10b981' },
    { name: 'Orange', value: '#f97316' },
] as const;

@Component({
    selector: 'app-category-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
    ],
    styles: [
        `
            .dialog-container {
                @apply p-6 max-h-[90vh] overflow-y-auto;
            }
            .dialog-title {
                @apply text-2xl font-bold text-slate-900;
            }
            .dialog-subtitle {
                @apply text-sm text-slate-500 mb-6;
            }
            .label {
                @apply block text-sm font-bold text-slate-900 mb-2;
            }
            .input-field {
                @apply w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm;
            }
            .color-grid {
                @apply grid grid-cols-3 gap-5 mt-2;
            }
            .color-item {
                @apply cursor-pointer transition-all;
            }
            .color-swatch {
                @apply w-full h-16 rounded-xl shadow-sm border-2 transition-all;
            }
            .color-label {
                @apply mt-2 text-xs font-medium text-slate-700 text-center;
            }
            .selected {
                @apply border-slate-900 shadow-md !important;
            }
            .footer-btn {
                @apply px-5 py-2.5 rounded-xl font-medium transition;
            }
        `,
    ],
    template: `
        <div class="dialog-container">
            <div class="flex justify-between items-center mb-2">
                <h2 class="dialog-title">
                    {{
                        isEdit()
                            ? 'Modifier la catégorie'
                            : 'Créer une catégorie'
                    }}
                </h2>
                <button
                    mat-dialog-close
                    class="text-slate-400 hover:text-slate-700 transition-colors"
                >
                    <mat-icon>close</mat-icon>
                </button>
            </div>

            <p class="dialog-subtitle">
                {{
                    isEdit()
                        ? 'Modifiez les détails de la catégorie.'
                        : 'Créez une nouvelle catégorie.'
                }}
            </p>

            <form [formGroup]="form" class="space-y-6">
                <div>
                    <label class="label">Nom de la catégorie *</label>
                    <input
                        formControlName="nom"
                        type="text"
                        class="input-field"
                        placeholder="Ex: Impact Économique"
                    />
                </div>

                <div>
                    <label class="label">Description</label>
                    <textarea
                        formControlName="description"
                        class="input-field min-h-[110px] resize-none"
                        placeholder="Décrivez la catégorie..."
                    ></textarea>
                </div>

                <div>
                    <label class="label">Couleur *</label>
                    <div class="color-grid">
                        @for (c of colors; track c.value) {
                            <div
                                class="color-item"
                                (click)="form.patchValue({ couleur: c.value })"
                            >
                                <div
                                    class="color-swatch"
                                    [style.background-color]="c.value"
                                    [class.selected]="
                                        form.value.couleur === c.value
                                    "
                                ></div>
                                <p class="color-label">{{ c.name }}</p>
                            </div>
                        }
                    </div>
                </div>

                <div
                    class="flex justify-end gap-3 pt-6 border-t border-slate-100"
                >
                    <button
                        type="button"
                        mat-dialog-close
                        class="footer-btn border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        (click)="save()"
                        [disabled]="form.invalid"
                        class="footer-btn text-white bg-[#ea5073] hover:bg-[#d4476a] disabled:bg-slate-300 shadow-sm"
                    >
                        {{ isEdit() ? 'Enregistrer' : 'Créer' }}
                    </button>
                </div>
            </form>
        </div>
    `,
})
export class CategoryDialogComponent {
    readonly colors = PRESET_COLORS;
    readonly isEdit = signal(false);
    readonly form: any;

    constructor(
        private fb: FormBuilder,
        private service: categorieKpiService,
        public dialogRef: MatDialogRef<CategoryDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: BackofficeCategory | null,
    ) {
        this.form = this.fb.group({
            nom: [data?.nom ?? '', Validators.required],
            description: [data?.description ?? ''],
            couleur: [data?.couleur ?? null, Validators.required],
        });

        this.isEdit.set(!!data);
    }

    save() {
        if (this.form.invalid) return;

        const payload = this.form.getRawValue() as BackofficeCategoryRequest;
        const request$ = this.data?.id
            ? this.service.update(this.data.id, payload)
            : this.service.create(payload);

        request$.subscribe({
            next: () => this.dialogRef.close(true),
            error: (err) => console.error('Erreur:', err),
        });
    }
}
