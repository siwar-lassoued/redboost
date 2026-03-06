// src/app/pages/backoffice/programmes/programme-dialog.component.ts

import { Component, Inject, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { ProgrammeService } from './programme.service';
import { Programme, Secteur } from '../../../models/programme';

type StatutProgramme = 'NON_DEMARREE' | 'EN_COURS' | 'EN_RETARD' | 'COMPLETE';

@Component({
    selector: 'app-programme-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatChipsModule,
    ],
    styles: `
        :host {
            font-family: 'Poppins', sans-serif;
            display: block;
            max-height: 90vh;
        }
        .dialog-content {
            max-height: 75vh;
            overflow-y: auto;
            padding-right: 12px;
            margin-right: -12px;
        }
        .dialog-content::-webkit-scrollbar {
            width: 8px;
        }
        .dialog-content::-webkit-scrollbar-track {
            background: transparent;
        }
        .dialog-content::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        .dialog-content::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        label {
            @apply block text-sm font-semibold text-slate-700 mb-2;
        }
        input,
        select,
        textarea {
            @apply w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none transition-all text-sm;
        }
        .upload-zone {
            @apply border-4 border-dashed border-slate-300 rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 hover:border-rose-400 hover:bg-rose-50/30;
        }
        .secteur-chip {
            @apply bg-rose-100 text-rose-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border border-rose-300;
        }
        .secteur-input-wrapper {
            @apply flex items-center gap-3 mt-3 border-2 rounded-lg px-4 py-2 transition-all;
        }
        .secteur-input-wrapper.focused {
            @apply border-rose-500 ring-4 ring-rose-100;
        }
        .create-btn {
            @apply bg-rose-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-rose-700 transition whitespace-nowrap;
        }

        /* Gradient Color Buttons */
        .color-btn {
            @apply p-3 border-2 rounded-lg transition-all cursor-pointer;
        }
        .color-btn.selected {
            @apply border-gray-900 shadow-md;
        }
        .color-btn:not(.selected) {
            @apply border-gray-200 hover:border-gray-400;
        }
        .color-preview {
            @apply h-8 rounded mb-2;
        }
    `,
    template: `
        <div class="p-6">
            <h2 class="text-2xl font-bold text-slate-900 mb-2">
                {{
                    data
                        ? 'Modifier le programme'
                        : 'Créer un nouveau programme'
                }}
            </h2>
            <p class="text-sm text-gray-500 mb-6">
                Remplissez les informations pour {{ data ? 'modifier' : 'créer' }} un programme RedBoost.
            </p>

            <div class="dialog-content">
                <form [formGroup]="form" class="space-y-6">
                    <!-- Nom + Année -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label>Nom du programme *</label>
                            <input
                                formControlName="nom"
                                placeholder="Ex: IPDAYS, Labelisation Reds"
                            />
                        </div>
                        <div>
                            <label>Année *</label>
                            <input
                                type="number"
                                formControlName="annee"
                                placeholder="2025"
                                [min]="2000"
                                [max]="2100"
                            />
                        </div>
                    </div>

                    <!-- Type + Bénéficiaires -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label>Type de programme *</label>
                            <input
                                formControlName="typeProgramme"
                                placeholder="Ex: IPDAYS, Labelisation, Incubation"
                            />
                        </div>
                        <div>
                            <label>Nombre de bénéficiaires *</label>
                            <input
                                type="number"
                                formControlName="nombreBeneficiaires"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>

                    <!-- Dates -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label>Date de début *</label>
                            <input type="date" formControlName="dateDebut" />
                        </div>
                        <div>
                            <label>Date de fin *</label>
                            <input type="date" formControlName="dateFin" />
                        </div>
                    </div>

                    <!-- Responsable + Statut -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label>Responsable du programme *</label>
                            <select formControlName="responsableId">
                                <option [ngValue]="null" disabled>
                                    Sélectionnez un responsable
                                </option>
                                @for (
                                    user of service.responsables();
                                    track user.id
                                ) {
                                    <option [ngValue]="user.id">
                                        {{ user.fullName }} — {{ user.role }}
                                    </option>
                                }
                            </select>
                            @if (
                                form.get('responsableId')?.touched &&
                                form.get('responsableId')?.invalid
                            ) {
                                <p class="text-rose-600 text-xs mt-1">
                                    Le responsable est obligatoire
                                </p>
                            }
                        </div>

                        <div>
                            <label>Statut *</label>
                            <select formControlName="statut">
                                <option value="NON_DEMARREE">Planifié</option>
                                <option value="EN_COURS">En cours</option>
                                <option value="EN_RETARD">En retard</option>
                                <option value="COMPLETE">Terminé</option>
                            </select>
                        </div>
                    </div>

                    <!-- === SECTEURS SELECTOR === -->
                    <div>
                        <label>Secteurs d'activité</label>
                        <p class="text-xs text-gray-500 mb-3">
                            Sélectionnez un ou plusieurs secteurs ou créez-en de nouveaux
                        </p>

                        <!-- Selected Sectors -->
                        @if (selectedSecteurs().length > 0) {
                            <div class="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border mb-3">
                                @for (
                                    s of selectedSecteurs();
                                    track s.id ?? s.nom
                                ) {
                                    <div class="bg-[#2a7b8c] hover:bg-[#1a6778] text-white pl-3 pr-1 py-1.5 rounded text-xs font-medium flex items-center gap-2">
                                        {{ s.nom }}
                                        <button
                                            type="button"
                                            (click)="removeSecteur(s)"
                                            class="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                            title="Retirer"
                                        >
                                            <mat-icon class="!text-xs !w-3 !h-3">close</mat-icon>
                                        </button>
                                    </div>
                                }
                            </div>
                        }

                        <div class="space-y-2">
                            <!-- Sector Dropdown -->
                            <select
                                class="w-full"
                                [value]="''"
                                (change)="onSectorSelect($event)"
                            >
                                <option value="" disabled>+ Ajouter un secteur</option>
                                <optgroup label="Secteurs disponibles">
                                    @for (
                                        sector of allSecteurs();
                                        track sector.id ?? sector.nom
                                    ) {
                                        @if (!isAlreadySelected(sector)) {
                                            <option [value]="sector.nom">
                                                {{ sector.nom }}
                                            </option>
                                        }
                                    }
                                </optgroup>
                            </select>

                            <!-- Create New Sector -->
                            <div class="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Nom du nouveau secteur..."
                                    [value]="newSecteurName()"
                                    (input)="newSecteurName.set($any($event.target).value)"
                                    (keyup.enter)="addNewSecteur()"
                                    class="flex-1"
                                />
                                <button
                                    type="button"
                                    (click)="addNewSecteur()"
                                    [disabled]="!newSecteurName().trim()"
                                    class="px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <mat-icon class="!text-base !w-4 !h-4">add</mat-icon>
                                    Créer
                                </button>
                            </div>
                            @if (newSecteurName().trim()) {
                                <p class="text-xs text-gray-500">
                                    Appuyez sur Entrée ou cliquez sur "Créer" pour ajouter "{{ newSecteurName() }}"
                                </p>
                            }
                        </div>
                    </div>

                    <!-- Description -->
                    <div>
                        <label>Description</label>
                        <textarea
                            formControlName="description"
                            rows="3"
                            placeholder="Décrivez les objectifs et le contexte du programme..."
                        ></textarea>
                    </div>

                    <!-- Couleur du thème avec gradients -->
                    <div>
                        <label>Couleur du thème *</label>
                        <div class="grid grid-cols-3 gap-3 mt-2">
                            @for (color of colorOptions; track color.value) {
                                <button
                                    type="button"
                                    (click)="selectColor(color.value)"
                                    class="color-btn"
                                    [class.selected]="form.get('couleurTheme')?.value === color.value"
                                >
                                    <div 
                                        class="color-preview"
                                        [style.background]="getGradientStyle(color.value)"
                                    ></div>
                                    <p class="text-xs text-gray-700">{{ color.label }}</p>
                                </button>
                            }
                        </div>
                    </div>

                    <!-- Logo -->
                    <div>
                        <label>Logo du programme</label>
                        <p class="text-xs text-gray-500 mb-3">
                            Téléchargez une image (PNG, JPG) pour personnaliser votre programme
                        </p>
                        <div class="flex items-center gap-4">
                            @if (logoPreview()) {
                                <div class="relative">
                                    <img 
                                        [src]="logoPreview()" 
                                        alt="Logo du programme" 
                                        class="w-24 h-24 rounded-lg object-cover border-2 border-gray-200" 
                                    />
                                    <button
                                        type="button"
                                        (click)="removeLogo()"
                                        class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
                                        title="Supprimer le logo"
                                    >
                                        <mat-icon class="!text-xs !w-3 !h-3">close</mat-icon>
                                    </button>
                                </div>
                            } @else {
                                <div class="w-24 h-24 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <mat-icon class="!text-4xl text-gray-400">image</mat-icon>
                                </div>
                            }
                            
                            <div class="flex-1 space-y-2">
                                <input
                                    #fileInput
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg"
                                    (change)="onFileSelected($event)"
                                    class="hidden"
                                    id="logo-upload"
                                />
                                <label
                                    for="logo-upload"
                                    class="inline-flex items-center gap-2 cursor-pointer bg-[#2a7b8c] hover:bg-[#1a6778] text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                                >
                                    <mat-icon class="!text-base !w-4 !h-4">upload</mat-icon>
                                    <span>{{ logoPreview() ? 'Modifier le logo' : 'Télécharger un logo' }}</span>
                                </label>
                                <p class="text-xs text-gray-500">
                                    Formats acceptés : PNG, JPG • Taille max : 5MB
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Buttons -->
            <div class="flex justify-end gap-4 mt-6 pt-6 border-t border-slate-200">
                <button
                    type="button"
                    (click)="dialogRef.close()"
                    class="px-6 py-3 rounded-lg border-2 border-slate-300 font-medium hover:bg-slate-50 transition"
                >
                    Annuler
                </button>
                <button
                    (click)="save()"
                    [disabled]="form.invalid || saving()"
                    class="px-8 py-3 bg-[#ea5073] hover:bg-[#d4476a] text-white rounded-lg font-bold shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                    {{
                        saving()
                            ? 'Enregistrement…'
                            : data
                              ? 'Modifier le programme'
                              : 'Créer le programme'
                    }}
                </button>
            </div>
        </div>
    `,
})
export class ProgrammeDialogComponent {
    private fb = inject(FormBuilder);
    service = inject(ProgrammeService);
    dialogRef = inject(MatDialogRef<ProgrammeDialogComponent>);

    saving = signal(false);
    logoPreview = signal<string | null>(null);
    selectedFile: File | null = null;

    newSecteurName = signal('');
    selectedSecteurs = signal<Secteur[]>([]);

    allSecteurs = computed(() => this.service.secteurs());
    
    // Gradient color options matching React
    colorOptions = [
        { value: 'from-[#6d3345] to-[#2a5f6f]', label: 'Bordeaux-Teal' },
        { value: 'from-[#ea5073] to-[#6d3345]', label: 'Rouge-Bordeaux' },
        { value: 'from-[#2a7b8c] to-[#1a4d5c]', label: 'Teal' },
        { value: 'from-[#ea5073] to-[#2a7b8c]', label: 'Rouge-Teal' },
        { value: 'from-emerald-500 to-teal-600', label: 'Vert' },
        { value: 'from-orange-500 to-red-500', label: 'Orange-Rouge' },
    ];

    isAlreadySelected = (secteur: Secteur) =>
        this.selectedSecteurs().some(
            (s) => s.nom.toLowerCase() === secteur.nom.toLowerCase(),
        );

    form = this.fb.group({
        nom: ['', Validators.required],
        annee: [
            new Date().getFullYear(),
            [Validators.required, Validators.min(2000)],
        ],
        typeProgramme: ['', Validators.required],
        dateDebut: ['', Validators.required],
        dateFin: ['', Validators.required],
        responsableId: [null as number | null, Validators.required],
        nombreBeneficiaires: [null as number | null],
        statut: ['NON_DEMARREE' as StatutProgramme],
        description: [''],
        couleurTheme: ['from-[#6d3345] to-[#2a5f6f]'], // Default gradient
    });

    constructor(@Inject(MAT_DIALOG_DATA) public data?: Programme) {
        this.service.loadSecteurs();

        if (this.data) {
            this.form.patchValue({
                nom: this.data.nom,
                annee: this.data.annee,
                typeProgramme: this.data.typeProgramme,
                dateDebut: this.data.dateDebut?.substring(0, 10) || '',
                dateFin: this.data.dateFin?.substring(0, 10) || '',
                responsableId: this.data.responsableId ?? null,
                nombreBeneficiaires: this.data.nombreBeneficiaires ?? null,
                statut: this.data.statut ?? 'NON_DEMARREE',
                description: this.data.description ?? '',
                couleurTheme: this.data.couleurTheme ?? 'from-[#6d3345] to-[#2a5f6f]',
            });

            this.logoPreview.set(
                this.data.logoUrl
                    ? 'https://redboost.tn' + this.data.logoUrl
                    : null,
            );
            if (this.data.secteurs?.length) {
                this.selectedSecteurs.set([...this.data.secteurs]);
            }
        }
    }

    selectColor(color: string) {
        this.form.patchValue({ couleurTheme: color });
    }

    getGradientStyle(colorClass: string): string {
        const gradients: Record<string, string> = {
            'from-[#6d3345] to-[#2a5f6f]': 'linear-gradient(to right, #6d3345, #2a5f6f)',
            'from-[#ea5073] to-[#6d3345]': 'linear-gradient(to right, #ea5073, #6d3345)',
            'from-[#2a7b8c] to-[#1a4d5c]': 'linear-gradient(to right, #2a7b8c, #1a4d5c)',
            'from-[#ea5073] to-[#2a7b8c]': 'linear-gradient(to right, #ea5073, #2a7b8c)',
            'from-emerald-500 to-teal-600': 'linear-gradient(to right, #10b981, #0d9488)',
            'from-orange-500 to-red-500': 'linear-gradient(to right, #f97316, #ef4444)',
        };
        return gradients[colorClass] || gradients['from-[#6d3345] to-[#2a5f6f]'];
    }

    onSectorSelect(event: Event) {
        const select = event.target as HTMLSelectElement;
        const value = select.value;
        if (value) {
            const sector = this.allSecteurs().find(s => s.nom === value);
            if (sector && !this.isAlreadySelected(sector)) {
                this.selectedSecteurs.update((arr) => [...arr, sector]);
            }
            select.value = ''; // Reset select
        }
    }

    addNewSecteur() {
        const name = this.newSecteurName().trim();
        if (name) {
            const exists = this.selectedSecteurs().some(
                s => s.nom.toLowerCase() === name.toLowerCase()
            );
            if (!exists) {
                this.selectedSecteurs.update((arr) => [
                    ...arr,
                    { nom: name } as Secteur,
                ]);
                this.newSecteurName.set('');
            }
        }
    }

    removeSecteur(secteur: Secteur) {
        this.selectedSecteurs.update((arr) =>
            arr.filter((s) => s.nom !== secteur.nom),
        );
    }

    onFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Veuillez sélectionner un fichier image (PNG, JPG, etc.)');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Le fichier est trop volumineux. Taille maximale : 5MB');
                return;
            }

            this.selectedFile = file;
            const reader = new FileReader();
            reader.onload = () => this.logoPreview.set(reader.result as string);
            reader.readAsDataURL(file);
        }
    }

    removeLogo() {
        this.logoPreview.set(null);
        this.selectedFile = null;
    }

    save() {
        if (this.form.invalid || this.saving()) return;
        this.saving.set(true);

        const raw = this.form.getRawValue();

        const programme: Programme = {
            id: this.data?.id,
            nom: raw.nom!,
            annee: raw.annee!,
            typeProgramme: raw.typeProgramme!,
            dateDebut: raw.dateDebut!,
            dateFin: raw.dateFin!,
            responsableId: raw.responsableId!,
            nombreBeneficiaires: raw.nombreBeneficiaires ?? undefined,
            statut: raw.statut!,
            description: raw.description || '',
            couleurTheme: raw.couleurTheme!,
            secteurs: this.selectedSecteurs(),
            logoUrl: this.data?.logoUrl,
        };

        const request = this.data?.id
            ? this.service.update(this.data.id, programme)
            : this.service.create(programme);

        request.subscribe({
            next: (saved) => {
                if (this.selectedFile && saved.id) {
                    this.service
                        .uploadLogo(saved.id, this.selectedFile)
                        .subscribe({
                            next: (response) => {
                                const updatedProgramme = {
                                    ...saved,
                                    logoUrl: response.logoUrl,
                                };
                                this.service.programmes.update((list) =>
                                    list.map((p) =>
                                        p.id === updatedProgramme.id
                                            ? updatedProgramme
                                            : p,
                                    ),
                                );
                                this.dialogRef.close(true);
                            },
                            error: (err) => {
                                console.error('Échec upload logo:', err);
                                this.saving.set(false);
                                alert(
                                    'Programme sauvegardé, mais le logo n\'a pas pu être uploadé.',
                                );
                            },
                        });
                } else {
                    this.dialogRef.close(true);
                }
            },
            error: (err) => {
                console.error('Échec sauvegarde programme:', err);
                this.saving.set(false);
                alert('Erreur lors de la sauvegarde du programme');
            },
        });
    }
}