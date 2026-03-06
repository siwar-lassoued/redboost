import {
    Component,
    EventEmitter,
    Input,
    Output,
    signal,
    OnChanges,
    SimpleChanges,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Activite } from '../../../../../../models/programme';

interface Responsable {
    id: number;
    
    fullName: string;
}

type ActivityType = 'formation' | 'pitch_day' | 'appel_candidatures' | 'comite_ph' | 'autre';

interface ActivityTypeOption {
    value: ActivityType;
    label: string;
}

interface KpiOption {
    id: number;
    nom: string;
    description?: string;
    uniteMesure?: string;
    category?: {
        id: number;
        nom: string;
        couleur?: string;
    };
    categoryNom?: string;
    categoryCouleur?: string;
    selected?: boolean;
}

interface KpiCategory {
    categoryName: string;
    categoryColor: string;
    kpis: KpiOption[];
    isExpanded: boolean;
}

@Component({
    selector: 'app-global-activity-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule, DatePipe],
    template: `
        <div class="modal-overlay" *ngIf="show">
            <div class="modal-box" (click)="$event.stopPropagation()">
                <div class="modal-header">
                <div class="flex justify-between items-start">
                  <div>
                    <h2 class="modal-title">
                        <ng-container *ngIf="activity?.id"
                            >Modifier une activité</ng-container
                        >
                        <ng-container *ngIf="!activity?.id"
                            >Créer une activité</ng-container
                        >
                    </h2>
                    <p class="modal-subtitle">
                        <ng-container *ngIf="activity?.id"
                            >Modifiez les informations de
                            l'activité</ng-container
                        >
                        <ng-container *ngIf="!activity?.id"
                            >Ajoutez une nouvelle activité au
                            sprint</ng-container
                        >
                    </p>
                     </div>
              <button class="close-btn" (click)="close.emit()">
            <mat-icon>close</mat-icon>
        </button>
                </div>     </div>


                <div class="modal-body">
                    <!-- Informations générales -->
                    <div class="form-group">
                        <label class="form-label">Nom de l'activité *</label>
                        <input
                            class="form-input"
                            [(ngModel)]="formData.nom"
                            placeholder="Ex: Formation Marketing Digital"
                        />
                    </div>

                    <!-- ✅ TYPE FIELD -->
                    <div class="form-group">
                        <label class="form-label">Type d'activité *</label>
                        <select
                            class="custom-select-modal"
                            [(ngModel)]="formData.type"
                        >
                            <option [ngValue]="null" disabled>
                                Sélectionner un type
                            </option>
                            <option
                                *ngFor="let type of activityTypes"
                                [ngValue]="type.value"
                            >
                                {{ type.label }}
                            </option>
                        </select>
                    </div>

                    <!-- ✅ CUSTOM TYPE INPUT - appears when "Autre" is selected -->
                    <div class="form-group" *ngIf="formData.type === 'autre'">
                        <label class="form-label">Précisez le type d'activité *</label>
                        <input
                            class="form-input"
                            type="text"
                            [(ngModel)]="customActivityType"
                            placeholder="Ex: Atelier, Conférence, Networking..."
                        />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea
                            class="form-textarea"
                            [(ngModel)]="formData.description"
                            placeholder="Décrivez brièvement l'activité..."
                        ></textarea>
                    </div>

                    <!-- CHAMPS STRATÉGIQUES -->
                    <div
                        class="section-title mt-6 mb-4 flex items-center gap-2"
                    >
                        <mat-icon class="text-rose-600">target</mat-icon>
                        <span>Détails stratégiques</span>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Objectif de l'activité</label>
                        <textarea
                            class="form-textarea"
                            rows="3"
                            [(ngModel)]="formData.objectif"
                            placeholder="Quel est l'objectif principal de cette activité ?"
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Méthodologie</label>
                        <textarea
                            class="form-textarea"
                            rows="4"
                            [(ngModel)]="formData.methodologie"
                            placeholder="Comment allez-vous procéder ? (étapes, outils, approche...)"
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Résultat attendu</label>
                        <textarea
                            class="form-textarea"
                            rows="3"
                            [(ngModel)]="formData.resultatAttendu"
                            placeholder="Quel livrable ou résultat concret attendez-vous ?"
                        ></textarea>
                    </div>

                    <!-- Dates -->
                    <div class="grid grid-cols-2 gap-4 mt-6">
                        <div class="form-group">
                            <label class="form-label">Date de début *</label>
                            <input
                                class="form-input"
                                type="date"
                                [(ngModel)]="formData.dateDebut"
                                [min]="sprintDates?.start"
                                [max]="sprintDates?.end"
                            />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date limite *</label>
                            <input
                                class="form-input"
                                type="date"
                                [(ngModel)]="formData.dateLimite"
                                [min]="formData.dateDebut || sprintDates?.start"
                                [max]="sprintDates?.end"
                            />
                        </div>
                    </div>

                    <div *ngIf="sprintDates" class="date-info mt-2">
                        <mat-icon>info</mat-icon>
                        <span
                            >Sprint :
                            {{ sprintDates.start | date: 'dd/MM/yyyy' }} -
                            {{ sprintDates.end | date: 'dd/MM/yyyy' }}</span
                        >
                    </div>
 <div *ngIf="validationError()" class="error-message mt-4">
    <mat-icon class="flex-shrink-0">error</mat-icon>
    <span class="break-words">{{ validationError() }}</span>
</div>
                    <!-- Responsable -->
                    <div class="form-group mt-6">
                        <label class="form-label">Responsable</label>
                        <select
                            class="custom-select-modal"
                            [(ngModel)]="formData.responsableId"
                        >
                            <option [ngValue]="null">Non assigné</option>
                            <option
                                *ngFor="let resp of responsables"
                                [ngValue]="resp.id"
                            >
                                {{ resp.fullName }}
                            </option>
                        </select>
                    </div>

                 

                    <!-- KPIs par catégorie -->
                    <div
                        class="form-group mt-6"
                        *ngIf="kpiCategories().length > 0; else noKpis"
                    >
                        <label class="form-label flex items-center gap-2">
                            <mat-icon class="text-rose-500 text-lg"
                                >check_circle</mat-icon
                            >
                            KPIs associés à cette activité
                        </label>
                        <p class="text-xs text-slate-400 mb-3">
                            Cliquez pour développer chaque catégorie
                        </p>

                        <div class="kpi-categories-wrapper">
                            <div
                                *ngFor="
                                    let category of kpiCategories();
                                    let i = index
                                "
                                class="category-section"
                            >
                                <div
                                    class="category-header"
                                    [class.expanded]="category.isExpanded"
                                    (click)="toggleCategory(i)"
                                >
                                    <div
                                        class="category-badge"
                                        [style.background-color]="
                                            category.categoryColor
                                        "
                                    >
                                        {{ category.categoryName }}
                                    </div>
                                    <span class="category-count">
                                        {{ getSelectedInCategory(category) }} /
                                        {{
                                            category.kpis.length
                                        }}
                                        sélectionné(s)
                                        <span
                                            class="text-xs text-slate-400 ml-2"
                                            >[{{
                                                category.isExpanded
                                                    ? 'OUVERT'
                                                    : 'FERMÉ'
                                            }}]</span
                                        >
                                    </span>
                                    <button
                                        type="button"
                                        class="expand-btn"
                                        (click)="$event.stopPropagation()"
                                    >
                                        <mat-icon>{{
                                            category.isExpanded
                                                ? 'remove'
                                                : 'add'
                                        }}</mat-icon>
                                    </button>
                                </div>

                                <div
                                    class="kpi-list-collapsible"
                                    *ngIf="category.isExpanded"
                                >
                                    <label
                                        *ngFor="let kpi of category.kpis"
                                        class="kpi-checkbox-item"
                                    >
                                        <input
                                            type="checkbox"
                                            [checked]="kpi.selected"
                                            (change)="toggleKpi(kpi)"
                                        />
                                        <span class="kpi-checkbox-label">{{
                                            kpi.nom
                                        }}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Message si pas de KPI -->
                    <ng-template #noKpis>
                        <div class="no-kpis mt-6">
                            <mat-icon>info</mat-icon>
                            <p>
                                Aucun KPI optionnel disponible pour ce programme
                            </p>
                        </div>
                    </ng-template>

                    <!-- Erreur -->
                  
                </div>

                <div class="modal-footer">
                    <button class="btn-cancel" (click)="close.emit()">
                        Annuler
                    </button>
                    <button class="btn-submit activity" (click)="handleSave()">
                        <ng-container *ngIf="activity?.id"
                            >Enregistrer les modifications</ng-container
                        >
                        <ng-container *ngIf="!activity?.id"
                            >Créer l'activité</ng-container
                        >
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .modal-overlay {
                @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4;
                z-index: 9999 !important;
            }
            .modal-box {
                @apply bg-white rounded-xl w-full max-w-[680px] overflow-hidden shadow-2xl;
            }
            .modal-header {
                @apply p-6 pb-4 border-b border-slate-100;
            }
            .modal-title {
                @apply text-2xl font-bold text-slate-900;
            }
            .modal-subtitle {
                @apply text-slate-500 text-sm mt-1;
            }
            .modal-body {
                @apply p-6 space-y-5 max-h-[75vh] overflow-y-auto;
            }
            .modal-footer {
                @apply p-6 pt-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3;
            }

            .form-group {
                @apply space-y-2;
            }
            .form-label {
                @apply text-sm font-semibold text-slate-700 block;
            }
            .form-input,
            .form-textarea,
            .custom-select-modal {
                @apply w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all;
            }
            .form-textarea {
                @apply resize-none min-h-[80px];
            }

            .section-title {
                @apply text-lg font-semibold text-slate-800;
            }

            .date-info {
                @apply flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-4 py-2 rounded-lg;
            }

            .debug-info {
                @apply bg-blue-50 border border-blue-200 p-3 rounded-lg;
            }

            .kpi-categories-wrapper {
                @apply border border-slate-200 rounded-xl bg-white overflow-hidden;
            }
            .category-section {
                @apply border-b border-slate-100 last:border-b-0;
            }
            .category-header {
                @apply flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors;
            }
            .category-header.expanded {
                @apply bg-slate-50;
            }
            .category-badge {
                @apply px-3 py-1.5 rounded-full text-white text-xs font-bold;
            }
            .category-count {
                @apply text-sm text-slate-600 flex-1;
            }
            .expand-btn {
                @apply w-8 h-8 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 flex items-center justify-center transition-colors;
            }
            .kpi-list-collapsible {
                @apply bg-slate-50 px-5 py-3 space-y-2;
            }
            .kpi-checkbox-item {
                @apply flex items-center gap-3 py-2 cursor-pointer select-none;
            }
            .kpi-checkbox-item input {
                @apply w-5 h-5 rounded border-2 border-slate-300 text-pink-600 focus:ring-pink-200 cursor-pointer;
            }
            .kpi-checkbox-label {
                @apply text-sm text-slate-700;
            }

            .no-kpis {
                @apply flex flex-col items-center py-8 text-slate-400;
            }
            .no-kpis mat-icon {
                @apply text-5xl mb-3;
            }

            .error-message {
                @apply bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm;
            }

            .btn-cancel {
                @apply px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition;
            }
            .btn-submit.activity {
                @apply px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold rounded-lg shadow-md hover:from-pink-700 hover:to-rose-700 transition-all transform hover:scale-105;
            }
            .close-btn {
                @apply w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors;
            }
        `,
    ],
})
export class GlobalActivityModalComponent implements OnChanges {
    @Input() show = false;
    @Input() activity: Partial<Activite> | null = null;
    @Input() responsables: Responsable[] = [];
    @Input() availableKpis: KpiOption[] = [];
    @Input() sprintDates: { start: string; end: string } | null = null;
    @Input() error: string | null = null;
    
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<{
        activity: Partial<Activite>;
        kpiIds: number[];
    }>();

    validationError = signal<string | null>(null);
    kpiCategories = signal<KpiCategory[]>([]);
    customActivityType: string = ''; // ✅ Pour stocker le type personnalisé

    // ✅ Activity type options with "Autre" added
    activityTypes: ActivityTypeOption[] = [
        { value: 'formation', label: 'Formation' },
        { value: 'pitch_day', label: 'Pitch Day' },
        { value: 'appel_candidatures', label: 'Appel à candidatures' },
        { value: 'comite_ph', label: 'Comité PH' },
        { value: 'autre', label: 'Autre' },
    ];

    formData: any = {
        nom: '',
        description: '',
        type: null,
        objectif: '',
        methodologie: '',
        resultatAttendu: '',
        dateDebut: '',
        dateLimite: '',
        responsableId: null,
    };

    ngOnChanges(changes: SimpleChanges) {
        if (changes['availableKpis']) {
            this.groupKpisByCategory();
        }

        // When the modal is opened, reset form data and clear previous errors from the parent.
        if (changes['show'] && this.show) {
            this.validationError.set(null); // Clear local error state
            if (this.activity) {
                // Editing existing activity
                // ✅ Gérer le type personnalisé en mode édition
                let activityType = this.activity.type || null;
                let customType = '';
                
                if (activityType && !this.activityTypes.find(t => t.value === activityType)) {
                    // Si le type n'est pas dans la liste, c'est un type personnalisé
                    customType = activityType;
                    activityType = 'autre';
                }
                
                this.formData = {
                    nom: this.activity.nom || '',
                    description: this.activity.description || '',
                    type: activityType,
                    objectif: this.activity.objectif || '',
                    methodologie: this.activity.methodologie || '',
                    resultatAttendu: this.activity.resultatAttendu || '',
                    dateDebut: this.activity.dateDebut || '',
                    dateLimite: this.activity.dateLimite || '',
                    responsableId: this.activity.responsableId || null,
                };
                this.customActivityType = customType;
                
                // Pre-select KPIs based on the activity
                const selectedIds = this.activity.kpis?.map((k: any) => k.id) || [];
                if (this.availableKpis) {
                    this.availableKpis.forEach(
                        (kpi) => (kpi.selected = selectedIds.includes(kpi.id)),
                    );
                }
            } else {
                // Creating a new activity
                this.formData = {
                    nom: '',
                    description: '',
                    type: null,
                    objectif: '',
                    methodologie: '',
                    resultatAttendu: '',
                    dateDebut: '',
                    dateLimite: '',
                    responsableId: null,
                };
                this.customActivityType = ''; // ✅ Réinitialiser le type personnalisé
                // Ensure all KPIs are unselected
                if (this.availableKpis) {
                    this.availableKpis.forEach((kpi) => (kpi.selected = false));
                }
            }
        }

        // If a new error is passed from the parent, display it.
        // This is now independent of the 'show' change.
        if (changes['error']) {
            this.validationError.set(this.error);
        }

        // This part seems redundant if handled in the 'show' block, but let's keep it
        // for cases where the activity object itself is swapped while the modal is open.
        if (changes['activity'] && this.activity) {
            const selectedIds = this.activity.kpis?.map((k: any) => k.id) || [];
            if (this.availableKpis) {
                this.availableKpis.forEach(
                    (kpi) => (kpi.selected = selectedIds.includes(kpi.id)),
                );
            }
        }
    }

    private groupKpisByCategory() {
        console.log('🔧 Grouping KPIs...');

        if (!this.availableKpis || this.availableKpis.length === 0) {
            console.log('⚠️ No KPIs to group');
            this.kpiCategories.set([]);
            return;
        }

        const map = new Map<string, KpiOption[]>();

        this.availableKpis.forEach((kpi) => {
            const categoryName =
                kpi.category?.nom || kpi.categoryNom || 'Sans catégorie';

            if (!map.has(categoryName)) {
                map.set(categoryName, []);
            }
            map.get(categoryName)!.push(kpi);
        });

        const categories = Array.from(map.entries()).map(([name, kpis]) => {
            const categoryColor =
                kpis[0]?.category?.couleur ||
                kpis[0]?.categoryCouleur ||
                '#94a3b8';

            return {
                categoryName: name,
                categoryColor: categoryColor,
                kpis,
                isExpanded: false,
            };
        });

        this.kpiCategories.set(categories);
        console.log('✅ Created', categories.length, 'categories');
    }

    // FIXED: Use index to update the signal immutably
    toggleCategory(index: number) {
        console.log('🔄 Toggle category at index:', index);

        this.kpiCategories.update((categories) => {
            const newCategories = [...categories];
            newCategories[index] = {
                ...newCategories[index],
                isExpanded: !newCategories[index].isExpanded,
            };

            console.log(
                '✅ Category',
                newCategories[index].categoryName,
                'is now:',
                newCategories[index].isExpanded ? 'EXPANDED' : 'COLLAPSED',
            );

            return newCategories;
        });
    }

    getSelectedInCategory(cat: KpiCategory): number {
        return cat.kpis.filter((k) => k.selected).length;
    }

    toggleKpi(kpi: KpiOption) {
        kpi.selected = !kpi.selected;
    }

    handleSave() {
        this.validationError.set(null);

        if (!this.formData.nom?.trim()) {
            this.validationError.set("Le nom de l'activité est obligatoire");
            return;
        }
        if (!this.formData.type) {
            this.validationError.set("Le type d'activité est obligatoire");
            return;
        }
        // ✅ Validation pour le type personnalisé
        if (this.formData.type === 'autre' && !this.customActivityType.trim()) {
            this.validationError.set("Veuillez spécifier le type d'activité");
            return;
        }
        if (!this.formData.dateDebut || !this.formData.dateLimite) {
            this.validationError.set(
                'Les dates de début et de fin sont obligatoires',
            );
            return;
        }
        if (this.formData.dateDebut > this.formData.dateLimite) {
            this.validationError.set(
                'La date de début doit être antérieure à la date limite',
            );
            return;
        }

        const selectedKpiIds = this.availableKpis
            .filter((kpi) => kpi.selected)
            .map((kpi) => kpi.id);

        console.log('💾 Saving activity with KPI IDs:', selectedKpiIds);

        // ✅ Utiliser le type personnalisé si "autre" est sélectionné
        const activityToSave = {
            id: this.activity?.id,
            ...this.formData,
            type: this.formData.type === 'autre' ? this.customActivityType : this.formData.type
        };

        this.save.emit({
            activity: activityToSave,
            kpiIds: selectedKpiIds,
        });
    }
}