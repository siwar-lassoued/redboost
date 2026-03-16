// src/app/pages/backoffice/programmes/dialogs/activity-dialog.component.ts
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Activite } from '../../../../../models/programme';

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
    uniteMesure: string;
    category: {
        id: number;
        nom: string;
        couleur?: string;
    };
}

interface KpiCategory {
    categoryName: string;
    categoryColor: string;
    kpis: KpiOption[];
    isExpanded: boolean;
}

@Component({
    selector: 'app-activity-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule, DatePipe],
    template: `
       <div
           class="modal-overlay"
           *ngIf="isOpen()"
           (click)="onClose()"
       >
           <div class="modal-box" (click)="$event.stopPropagation()">
               <!-- HEADER -->
               <div class="modal-header">
                   <div>
                        <h2 class="modal-title">
                            {{ isEditing ? 'Modifier' : 'Créer' }} une
                            activité
                       </h2>
                       
                   </div>
               </div>

               <!-- ✅ ERROR ALERT (appears below header) -->
               <div class="error-alert" *ngIf="validationError()">
                    <mat-icon class="error-icon">
                        error
                   </mat-icon>
                   <div class="error-content">
                       <h4 class="error-title">
                           Erreur de validation des dates
                       </h4>
                       <p class="error-message">{{ validationError() }}</p>
                   </div>
                   <button
                       class="error-close"
                       (click)="validationError.set(null)"
                       type="button"
                   >
                        <mat-icon>
                            close
                       </mat-icon>
                   </button>
               </div>

               <!-- BODY (scrollable) -->
               <div class="modal-body">
                   <!-- Nom -->
                   <div class="form-group">
                        <label class="form-label">
                            Nom de l'activité *
                       </label>
                       <input
                           class="form-input"
                           type="text"
                           [(ngModel)]="activityData.nom"
                           placeholder="Ex: Formation en innovation"
                       />
                   </div>

                   <!-- Type -->
                   <div class="form-group">
                        <label class="form-label">
                            Type d'activité
                       </label>
                       <select
                           class="custom-select-modal"
                           [(ngModel)]="activityData.type"
                       >
                           <option value="" disabled>
                                Sélectionner un type
                           </option>
                           <option
                               *ngFor="let type of activityTypes"
                               [value]="type.value"
                           >
                               {{ type.label }}
                           </option>
                       </select>
                   </div>

                   <!-- ✅ Champ personnalisé si "Autre" est sélectionné -->
                   <div class="form-group" *ngIf="activityData.type === 'autre'">
                        <label class="form-label">
                            Précisez le type d'activité *
                       </label>
                       <input
                           class="form-input"
                           type="text"
                           [(ngModel)]="customActivityType"
                           placeholder="Ex: Atelier, Conférence, Networking..."
                       />
                   </div>

                   <!-- Description -->
                   <div class="form-group">
                        <label class="form-label">
                            Description
                       </label>
                       <textarea
                           class="form-textarea"
                           [(ngModel)]="activityData.description"
                           placeholder="Décrivez l'objectif et le contenu de cette activité..."
                       ></textarea>
                   </div>

                   <!-- Date Début / Date Limite -->
                   <div class="form-group">
                       <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label class="form-label">
                                    Date de début *
                               </label>
                               <input
                                   class="form-input"
                                   type="date"
                                   [(ngModel)]="activityData.dateDebut"
                               />
                           </div>
                            <div>
                                <label class="form-label">
                                    Date limite *
                               </label>
                               <input
                                   class="form-input"
                                   type="date"
                                   [(ngModel)]="activityData.dateLimite"
                               />
                           </div>
                       </div>
                   </div>

                   <!-- Intervenant / Responsable -->
                   <div class="form-group">
                        <label class="form-label">
                            Intervenant / Responsable
                       </label>
                       <select
                           class="custom-select-modal"
                           [(ngModel)]="activityData.responsableId"
                       >
                           <option [ngValue]="null">
                                Sélectionner un intervenant
                           </option>
                           <option
                               *ngFor="let user of responsables"
                               [ngValue]="user.id"
                           >
                               {{ user.fullName }}
                           </option>
                       </select>
                       <p style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">
                           L'intervenant sera responsable de cette activité
                       </p>
                   </div>

                   <!-- KPI Section -->
                   <div class="form-group">
                       <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                           <mat-icon style="color: #10b981; font-size: 1.25rem;">
                                check_circle
                           </mat-icon>
                            <label class="form-label" style="margin: 0;">
                                Sélectionner des KPI par catégorie
                           </label>
                       </div>
                       <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.75rem;">
                           Cliquez sur le bouton + pour
                            afficher les KPI de chaque catégorie
                       </p>

                       <div class="kpi-categories-wrapper" *ngIf="kpiCategories.length > 0">
                           <div *ngFor="let category of kpiCategories" class="category-section">
                               <div class="category-header" (click)="toggleCategory(category)">
                                   <div
                                       class="category-badge"
                                       [style.background-color]="category.categoryColor"
                                   >
                                        {{ category.categoryName }}
                                   </div>
                                    <span class="category-count">
                                        {{
                                            getSelectedInCategory(category)
                                        }}/{{ category.kpis.length }}
                                   </span>
                                   <button type="button" class="expand-btn">
                                       <mat-icon>
                                            {{
                                                category.isExpanded
                                                    ? 'remove'
                                                    : 'add'
                                            }}
                                       </mat-icon>
                                   </button>
                               </div>

                               <div class="kpi-list-collapsible" *ngIf="category.isExpanded">
                                   <label
                                       *ngFor="let kpi of category.kpis"
                                       class="kpi-checkbox-item"
                                   >
                                       <input
                                           type="checkbox"
                                           class="kpi-checkbox-input"
                                           [checked]="isKpiSelected(kpi.id)"
                                           (change)="toggleKpi(kpi.id)"
                                       />
                                       <span class="kpi-checkbox-label">
                                            {{
                                                kpi.nom
                                            }}
                                       </span>
                                   </label>
                               </div>
                           </div>
                       </div>

                       <div class="no-kpis" *ngIf="kpiCategories.length === 0">
                            <mat-icon>
                                info
                           </mat-icon>
                           <p>Aucun KPI optionnel disponible</p>
                       </div>

                       <p style="font-size: 0.75rem; color: #64748b; margin-top: 0.5rem;">
                           Sélection optionnelle - Sélectionnez les KPI que
                            cette activité contribue à atteindre
                       </p>
                   </div>
               </div>

               <!-- FOOTER -->
               <div class="modal-footer">
                   <button type="button" class="btn-cancel" (click)="onClose()">
                        Annuler
                   </button>
                   <button type="button" class="btn-submit activity" (click)="onSave()">
                        {{ isEditing ? 'Enregistrer' : "Créer l'activité" }}
                   </button>
               </div>
           </div>
       </div>
    `,
  // Updated styles for activity-dialog.component.ts
styles: [
    `
        .modal-overlay {
            @apply fixed inset-0 bg-black/50 flex items-center justify-center p-4;
            z-index: 9999; /* ✅ Very high z-index to appear above everything */
        }

        .modal-box {
            @apply bg-white rounded-xl w-full overflow-hidden shadow-xl;
            max-width: 650px;
            max-height: 90vh; /* ✅ Ensure modal doesn't exceed viewport */
            display: flex;
            flex-direction: column;
            animation: fadeIn 0.2s ease-out;
        }

        .modal-header {
            @apply p-6 pb-4 border-b border-slate-100 flex-shrink-0;
        }

        .modal-title {
            @apply text-xl font-bold text-slate-900;
        }

        .modal-subtitle {
            @apply text-slate-500 text-sm mt-1;
        }

        /* ✅ ERROR ALERT STYLES */
        .error-alert {
            @apply mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 flex-shrink-0;
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
            @apply p-6 py-4 space-y-4 overflow-y-auto flex-1;
            /* ✅ This makes the body scrollable while header/footer stay fixed */
        }

        .modal-footer {
            @apply p-6 pt-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0;
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

        .custom-select-modal {
            @apply w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 appearance-none cursor-pointer transition-all;
        }

        .custom-select-modal:focus {
            @apply outline-none ring-2 ring-pink-200 border-pink-400 bg-white;
        }

        .kpi-categories-wrapper {
            @apply border border-slate-200 rounded-lg bg-white overflow-hidden;
        }

        .category-section {
            @apply border-b border-slate-100 last:border-b-0;
        }

        .category-header {
            @apply flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors;
        }

        .category-badge {
            @apply px-3 py-1 rounded-full text-white text-xs font-semibold flex-shrink-0;
        }

        .category-count {
            @apply text-sm text-slate-600 flex-1;
        }

        .expand-btn {
            @apply w-6 h-6 flex items-center justify-center text-teal-600 hover:bg-teal-50 rounded transition-colors;
        }

        .expand-btn mat-icon {
            @apply text-lg;
        }

        .kpi-list-collapsible {
            @apply bg-slate-50 px-4 py-2 space-y-2;
        }

        .kpi-checkbox-item {
            @apply flex items-center gap-2 py-2 cursor-pointer;
        }

        .kpi-checkbox-input {
            @apply w-4 h-4 rounded border-2 border-slate-300 text-teal-600 focus:ring-2 focus:ring-teal-200 cursor-pointer;
        }

        .kpi-checkbox-label {
            @apply text-sm text-slate-700 flex-1;
        }

        .no-kpis {
            @apply flex flex-col items-center justify-center py-8 text-slate-400;
        }

        .no-kpis mat-icon {
            @apply text-4xl mb-2;
        }

        .no-kpis p {
            @apply text-sm;
        }

        .btn-cancel {
            @apply px-4 py-2 bg-white border border-slate-200 rounded-md text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors;
        }

        .btn-submit {
            @apply px-4 py-2 rounded-md font-medium text-sm shadow-sm text-white transition-all active:translate-y-[1px];
        }

        .btn-submit.activity {
            @apply bg-[#5F7C8A] hover:bg-[#455A64] border-b-2 border-[#37474F] active:border-b-0;
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

        /* ✅ Responsive adjustments for smaller screens */
        @media (max-width: 768px) {
            .modal-box {
                max-width: 95vw;
                max-height: 95vh;
            }

            .modal-header,
            .modal-body,
            .modal-footer {
                @apply px-4;
            }
        }
    `,
]
})
export class ActivityModalComponent {
    @Input() set show(value: boolean) {
        this.isOpen.set(value);
    }

    @Input() set activity(value: any) {
        if (value && value.id) {
            this.isEditing = true;
            this.activityData = { ...value };
            this.selectedKpiIds = value.kpis
                ? value.kpis.map((k: any) => k.id)
                : [];
            // ✅ Gérer le type personnalisé en mode édition
            if (value.type && !this.activityTypes.find(t => t.value === value.type)) {
                this.customActivityType = value.type;
                this.activityData.type = 'autre';
            } else {
                this.customActivityType = '';
            }
        } else {
            this.isEditing = false;
            const today = new Date().toISOString().split('T')[0];
            this.activityData = {
                nom: '',
                description: '',
                dateDebut: today,
                dateLimite: today,
                type: '', // ✅ Initialize as empty string instead of undefined
            };
            this.selectedKpiIds = [];
            this.customActivityType = ''; // ✅ Réinitialiser le type personnalisé
        }
        // Clear error when opening modal
        this.validationError.set(null);
    }

    @Input() responsables: Responsable[] = [];

    @Input() set availableKpis(value: KpiOption[]) {
        this._availableKpis = value || [];
        this.groupKpisByCategory();
    }

    @Input() set error(value: any) {
        if (value) {
            let msg = "Erreur lors de l'opération sur l'activité";
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

    private _availableKpis: KpiOption[] = [];
    kpiCategories: KpiCategory[] = [];

    @Output() close = new EventEmitter();
    @Output() save = new EventEmitter<{
        activity: Partial<Activite>;
        kpiIds: number[];
    }>();

    isOpen = signal(false);
    isEditing = false;
    activityData: Partial<Activite> = {};
    selectedKpiIds: number[] = [];
    validationError = signal<string | null>(null);
    customActivityType: string = ''; // ✅ Pour stocker le type personnalisé

    // ✅ Activity type options with "Autre" added
    activityTypes: ActivityTypeOption[] = [
        { value: 'formation', label: 'Formation' },
        { value: 'pitch_day', label: 'Pitch Day' },
        { value: 'appel_candidatures', label: 'Appel à candidatures' },
        { value: 'comite_ph', label: 'Comité PH' },
        { value: 'autre', label: 'Autre' },
    ];

    private groupKpisByCategory() {
        const categoryMap = new Map<string, KpiOption[]>();

        this._availableKpis.forEach((kpi) => {
            const categoryName = kpi.category?.nom || 'Sans catégorie';
            if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, []);
            }
            categoryMap.get(categoryName)!.push(kpi);
        });

        this.kpiCategories = Array.from(categoryMap.entries()).map(
            ([categoryName, kpis]) => ({
                categoryName,
                categoryColor: kpis[0]?.category?.couleur || '#94a3b8',
                kpis,
                isExpanded: false,
            }),
        );
    }

    toggleCategory(category: KpiCategory) {
        category.isExpanded = !category.isExpanded;
    }

    getSelectedInCategory(category: KpiCategory): number {
        return category.kpis.filter((kpi) => this.isKpiSelected(kpi.id)).length;
    }

    isKpiSelected(kpiId: number): boolean {
        return this.selectedKpiIds.includes(kpiId);
    }

    toggleKpi(kpiId: number) {
        const index = this.selectedKpiIds.indexOf(kpiId);
        if (index > -1) {
            this.selectedKpiIds = this.selectedKpiIds.filter(
                (id) => id !== kpiId,
            );
        } else {
            this.selectedKpiIds = [...this.selectedKpiIds, kpiId];
        }
    }

    onClose() {
        this.validationError.set(null);
        this.close.emit();
    }

    onSave() {
         console.log('🔍 Activity Data before save:', this.activityData);
    console.log('🔍 Type value:', this.activityData.type);
        
        if (!this.activityData.nom) {
            this.validationError.set("Le nom de l'activité est obligatoire");
            return;
        }

        // ✅ Validation pour le type personnalisé
        if (this.activityData.type === 'autre' && !this.customActivityType.trim()) {
            this.validationError.set("Veuillez spécifier le type d'activité");
            return;
        }
        
        this.validationError.set(null); // Clear any previous errors

        // ✅ Utiliser le type personnalisé si "autre" est sélectionné
        const activityToSave = {
            ...this.activityData,
            type: this.activityData.type === 'autre' ? this.customActivityType : this.activityData.type
        };

        this.save.emit({
            activity: activityToSave,
            kpiIds: this.selectedKpiIds,
        });
    }
}