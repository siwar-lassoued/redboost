// src/app/pages/backoffice/programmes/dialogs/tache-dialog.component.ts

import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Tache, DocumentDTO } from '../../../../../models/programme';

interface Responsable {
    id: number;
    fullName: string;
}

interface KpiOption {
    id: number;
    nom: string;
    description?: string;
    uniteMesure: string;
    objectif?: string;
    type?: string;
    categoryId?: number;
    categoryNom: string;
    categoryCouleur?: string;
}

interface KpiCategory {
    categoryName: string;
    categoryColor: string;
    kpis: KpiOption[];
    isExpanded: boolean;
}

@Component({
    selector: 'app-task-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule, DatePipe],
    template: `
         <div class="modal-overlay" *ngIf="isOpen()">
            <div class="modal-box" (click)="$event.stopPropagation()">
<div class="modal-header">
    <div class="flex justify-between items-start">
        <div>
            <h2 class="modal-title">
                {{ isEditing ? 'Modifier' : 'Créer' }} une tâche
            </h2>
        </div>
        <button class="close-btn" (click)="onClose()">
            <mat-icon>close</mat-icon>
                       </button>
                        </div>                    <!-- ✅ ERROR ALERT -->
                    <div class="error-alert" *ngIf="validationError()">
                        <mat-icon class="error-icon">error</mat-icon>
                        <div class="error-content">
                            <p class="error-title">
                                Erreur de validation des dates
                            </p>
                            <p class="error-message">{{ validationError() }}</p>
                        </div>
                        <button
                            class="error-close"
                            (click)="validationError.set(null)"
                        >
                            <mat-icon>close</mat-icon>
                        </button>
                    </div>

                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Titre de la tâche *</label>
                        <input
                            class="form-input"
                            [(ngModel)]="taskData.titre"
                            placeholder="Ex: Préparer le contenu de formation"
                        />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea
                            class="form-textarea"
                            [(ngModel)]="taskData.description"
                            placeholder="Décrivez la tâche..."
                        ></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                       <div class="form-group">
    <label class="form-label">Intervenant *</label>
    <select
        class="custom-select-modal"
        [(ngModel)]="taskData.responsableId"
        [compareWith]="compareById"
    >
        <option [ngValue]="undefined" disabled>
            Sélectionner un intervenant
        </option>
        <option
            *ngFor="let user of responsables"
            [ngValue]="user.id"
        >
            {{ user.fullName }}
        </option>
    </select>
    <p class="text-xs text-slate-400 mt-1">
        L'intervenant sera responsable de cette tâche
    </p>
</div>
                        <div class="form-group">
                            <label class="form-label">Priorité *</label>
                            <select
                                class="custom-select-modal"
                                [(ngModel)]="taskData.priorite"
                            >
                                <option value="Moyenne">Moyenne</option>
                                <option value="Haute">Haute</option>
                                <option value="Basse">Basse</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">Date de début *</label>
                            <input
                                class="form-input"
                                type="date"
                                [ngModel]="
                                    taskData.dateDebut | date: 'yyyy-MM-dd'
                                "
                                (ngModelChange)="taskData.dateDebut = $event"
                            />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date limite *</label>
                            <input
                                class="form-input"
                                type="date"
                                [ngModel]="
                                    taskData.dateLimite | date: 'yyyy-MM-dd'
                                "
                                (ngModelChange)="taskData.dateLimite = $event"
                            />
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label"
                            >Difficultés rencontrées</label
                        >
                        <textarea
                            class="form-textarea h-16"
                            [(ngModel)]="taskData.difficulte"
                            placeholder="Décrivez les difficultés rencontrées..."
                        ></textarea>
                    </div>

                    <!-- KPI Selection by Category -->
                    <div class="form-group">
                        <label class="form-label flex items-center gap-2">
                            <mat-icon class="text-rose-500 text-lg"
                                >check_circle</mat-icon
                            >
                            Sélectionner des KPI par catégorie
                            <span class="text-xs text-slate-500 font-normal"
                                >(limités aux KPI de l'activité)</span
                            >
                        </label>
                        <p class="text-xs text-slate-400 mb-3">
                            Cliquez sur le bouton <strong>+</strong> pour
                            afficher les KPI de chaque catégorie
                        </p>

                        <div
                            class="kpi-categories-wrapper"
                            *ngIf="kpiCategories.length > 0; else noKpis"
                        >
                            <div
                                *ngFor="let category of kpiCategories"
                                class="category-section"
                            >
                                <div
                                    class="category-header"
                                    (click)="toggleCategory(category)"
                                >
                                    <div
                                        class="category-badge"
                                        [style.background-color]="
                                            category.categoryColor || '#94a3b8'
                                        "
                                    >
                                        {{ category.categoryName }}
                                    </div>
                                    <span class="category-count"
                                        >{{
                                            getSelectedInCategory(category)
                                        }}/{{ category.kpis.length }}</span
                                    >
                                    <button type="button" class="expand-btn">
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
                                            [checked]="isKpiSelected(kpi.id)"
                                            (change)="toggleKpi(kpi.id)"
                                            class="kpi-checkbox-input"
                                        />
                                        <span class="kpi-checkbox-label">{{
                                            kpi.nom
                                        }}</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <ng-template #noKpis>
                            <div class="no-kpis">
                                <mat-icon>info</mat-icon>
                                <p>Aucun KPI assigné à l'activité parente</p>
                                <p class="text-xs mt-1">
                                    Ajoutez des KPIs à l'activité pour pouvoir
                                    les assigner aux tâches
                                </p>
                            </div>
                        </ng-template>

                        <p class="text-xs text-slate-400 mt-3">
                            Sélection optionnelle - Sélectionnez les KPI que
                            cette tâche contribue à atteindre
                        </p>
                    </div>

                    <!-- Document Management Section -->
                    <div class="form-group">
                        <label class="form-label flex items-center gap-2">
                            <mat-icon class="text-amber-600 text-lg"
                                >folder</mat-icon
                            >
                            Documents de la tâche
                            <span class="text-xs text-slate-500 font-normal"
                                >(optionnel)</span
                            >
                        </label>
                        <p class="text-xs text-slate-400 mb-3">
                            Ajoutez des documents justificatifs ou supports pour
                            cette tâche
                        </p>

                        <div class="documents-wrapper">
                            <!-- File Upload Area -->
                            <div
                                class="upload-area"
                                (dragover)="onDragOver($event)"
                                (dragleave)="onDragLeave($event)"
                                (drop)="onDrop($event)"
                                [class.drag-over]="isDragOver()"
                            >
                                <mat-icon class="upload-icon"
                                    >cloud_upload</mat-icon
                                >
                                <p class="upload-text">
                                    Glissez-déposez vos fichiers ici ou
                                </p>
                                <label class="upload-btn">
                                    <input
                                        type="file"
                                        multiple
                                        (change)="onFileSelect($event)"
                                        hidden
                                    />
                                    <mat-icon class="text-sm">add</mat-icon>
                                    Choisir des fichiers
                                </label>
                                <p class="upload-hint">
                                    PDF, Word, Excel, Images (Max 10MB par
                                    fichier)
                                </p>
                            </div>

                            <!-- New Files to Upload -->
                            <div
                                class="new-files-section"
                                *ngIf="pendingFiles().length > 0"
                            >
                                <div class="section-header-compact">
                                    <span
                                        class="text-xs font-semibold text-slate-600"
                                        >Nouveaux fichiers ({{
                                            pendingFiles().length
                                        }})</span
                                    >
                                </div>
                                <div class="files-list">
                                    <div
                                        class="file-item"
                                        *ngFor="
                                            let file of pendingFiles();
                                            let i = index
                                        "
                                    >
                                        <mat-icon class="file-icon">{{
                                            getFileIconFromType(file.type)
                                        }}</mat-icon>
                                        <div class="file-info">
                                            <p class="file-name">
                                                {{ file.name }}
                                            </p>
                                            <p class="file-size">
                                                {{
                                                    formatFileSizeFromBytes(
                                                        file.size
                                                    )
                                                }}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            class="remove-btn"
                                            (click)="removePendingFile(i)"
                                            title="Supprimer"
                                        >
                                            <mat-icon>close</mat-icon>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Existing Documents (Edit Mode) -->
                            <div
                                class="existing-docs-section"
                                *ngIf="
                                    isEditing && existingDocuments().length > 0
                                "
                            >
                                <div class="section-header-compact">
                                    <span
                                        class="text-xs font-semibold text-slate-600"
                                        >Documents existants ({{
                                            existingDocuments().length
                                        }})</span
                                    >
                                </div>
                                <div class="files-list">
                                    <div
                                        class="file-item existing"
                                        *ngFor="let doc of existingDocuments()"
                                    >
                                        <mat-icon class="file-icon">{{
                                            getDocumentIcon(doc.typeFichier)
                                        }}</mat-icon>
                                        <div class="file-info">
                                            <p class="file-name">
                                                {{ doc.nom }}
                                            </p>
                                            <p class="file-meta">
                                                {{
                                                    formatFileSize(
                                                        doc.tailleFichier
                                                    )
                                                }}
                                                •
                                                {{ formatDate(doc.dateUpload) }}
                                            </p>
                                        </div>
                                        <div class="doc-actions">
                                            <a
                                                [href]="
                                                    'https://redboost.tn' +
                                                    doc.cheminFichier
                                                "
                                                target="_blank"
                                                class="action-btn download"
                                                title="Télécharger"
                                            >
                                                <mat-icon>download</mat-icon>
                                            </a>
                                            <button
                                                type="button"
                                                class="action-btn delete"
                                                (click)="deleteDocument(doc.id)"
                                                title="Supprimer"
                                            >
                                                <mat-icon>delete</mat-icon>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Empty State -->
                            <div
                                class="empty-docs"
                                *ngIf="
                                    existingDocuments().length === 0 &&
                                    pendingFiles().length === 0
                                "
                            >
                                <mat-icon>description</mat-icon>
                                <p>Aucun document ajouté</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" (click)="onClose()">
                        Annuler
                    </button>
                    <button class="btn-submit task" (click)="onSave()">
                        {{ isEditing ? 'Enregistrer' : 'Créer la tâche' }}
                    </button>
                </div>
            </div>
        </div>
    `,
 // Updated styles for tache-dialog.component.ts

styles: [
    `
        .modal-overlay {
            @apply fixed inset-0 bg-black/50 flex items-center justify-center p-4;
            z-index: 9999; /* ✅ Very high z-index to appear above everything */
        }

        .modal-box {
            @apply bg-white rounded-xl w-full overflow-hidden shadow-xl;
            max-width: 700px;
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
            @apply mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 flex-shrink-0;
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

        .form-input,
        .form-textarea,
        .custom-select-modal {
            @apply w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 transition-all;
        }

        .form-input:focus,
        .form-textarea:focus,
        .custom-select-modal:focus {
            @apply outline-none ring-2 ring-pink-200 border-pink-400 bg-white;
        }

        .form-textarea {
            @apply resize-none min-h-[80px];
        }

        .form-textarea.h-16 {
            @apply min-h-[64px];
        }

        /* KPI Categories */
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
            @apply flex flex-col items-center justify-center py-8 text-slate-400 text-center;
        }

        .no-kpis mat-icon {
            @apply text-4xl mb-2;
        }

        .no-kpis p {
            @apply text-sm;
        }

        /* Document Management */
        .documents-wrapper {
            @apply border border-slate-200 rounded-lg bg-white overflow-hidden;
        }

        .upload-area {
            @apply p-6 text-center border-b border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors;
        }

        .upload-area.drag-over {
            @apply bg-amber-50 border-amber-300;
        }

        .upload-icon {
            @apply text-4xl text-amber-600 mb-2;
        }

        .upload-text {
            @apply text-sm text-slate-600 mb-2;
        }

        .upload-btn {
            @apply inline-flex items-center gap-1 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors cursor-pointer;
        }

        .upload-btn mat-icon {
            @apply text-base;
        }

        .upload-hint {
            @apply text-xs text-slate-500 mt-2;
        }

        .section-header-compact {
            @apply px-4 py-2 bg-slate-100 border-b border-slate-200;
        }

        .new-files-section,
        .existing-docs-section {
            @apply border-b border-slate-200 last:border-b-0;
        }

        .files-list {
            @apply divide-y divide-slate-100;
        }

        .file-item {
            @apply flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors;
        }

        .file-item.existing {
            @apply bg-white;
        }

        .file-icon {
            @apply text-2xl text-slate-400 flex-shrink-0;
        }

        .file-info {
            @apply flex-1 min-w-0;
        }

        .file-name {
            @apply text-sm font-medium text-slate-700 truncate;
        }

        .file-size,
        .file-meta {
            @apply text-xs text-slate-500 mt-0.5;
        }

        .doc-actions {
            @apply flex items-center gap-2;
        }

        .action-btn {
            @apply w-8 h-8 flex items-center justify-center rounded-lg transition-colors;
        }

        .action-btn.download {
            @apply text-blue-600 hover:bg-blue-50;
        }

        .action-btn.delete {
            @apply text-red-600 hover:bg-red-50;
        }

        .action-btn mat-icon {
            @apply text-lg;
        }

        .remove-btn {
            @apply w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0;
        }

        .remove-btn mat-icon {
            @apply text-lg;
        }

        .empty-docs {
            @apply flex flex-col items-center justify-center py-8 text-slate-400;
        }

        .empty-docs mat-icon {
            @apply text-5xl mb-2;
        }

        .empty-docs p {
            @apply text-sm;
        }

        /* Buttons */
        .btn-cancel {
            @apply px-4 py-2 bg-white border border-slate-200 rounded-md text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors;
        }

        .btn-submit {
            @apply px-4 py-2 rounded-md font-medium text-sm shadow-sm text-white transition-all active:translate-y-[1px];
        }

        .btn-submit.task {
            @apply bg-[#A1887F] hover:bg-[#8D6E63] border-b-2 border-[#5D4037] active:border-b-0;
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

            .grid.grid-cols-2 {
                @apply grid-cols-1;
            }
        }
    `,
]
})
export class TaskModalComponent {
    @Input() set show(value: boolean) {
        this.isOpen.set(value);
    }

    @Input() set task(value: any) {
        if (value && value.id) {
            this.isEditing = true;
            this.taskData = { ...value };
            this.selectedKpiIds = value.kpis
                ? value.kpis.map((k: any) => k.id)
                : [];
            this.existingDocuments.set(value.documents || []);
            this.pendingFiles.set([]);
        } else {
            this.isEditing = false;
            const today = new Date().toISOString().split('T')[0];
            this.taskData = {
                titre: '',
                description: '',
                status: 'NON_DEMARREE',
                priorite: 'Moyenne',
                dateDebut: today,
                dateLimite: today,
                difficulte: '',
            };
            this.selectedKpiIds = [];
            this.existingDocuments.set([]);
            this.pendingFiles.set([]);
        }
    }

    validationError = signal<string | null>(null);

    @Input() responsables: Responsable[] = [];
    @Input() set error(value: any) {
        if (value) {
            let msg = "Erreur lors de l'opération sur la tâche";
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
    @Input() set activityKpis(value: KpiOption[]) {
        this._activityKpis = value || [];
        this.groupKpisByCategory();
    }

    private _activityKpis: KpiOption[] = [];
    kpiCategories: KpiCategory[] = [];

    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<{
        task: Partial<Tache>;
        kpiIds: number[];
        files?: File[];
    }>();
    @Output() deleteDoc = new EventEmitter<number>();

    isOpen = signal(false);
    isEditing = false;
    taskData: Partial<Tache> = {};
    selectedKpiIds: number[] = [];

    // Document management
    existingDocuments = signal<DocumentDTO[]>([]);
    pendingFiles = signal<File[]>([]);
    isDragOver = signal(false);

    private groupKpisByCategory() {
        const categoryMap = new Map<string, KpiOption[]>();

        this._activityKpis.forEach((kpi) => {
            const categoryName = kpi.categoryNom || 'Sans catégorie';
            if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, []);
            }
            categoryMap.get(categoryName)!.push(kpi);
        });

        this.kpiCategories = Array.from(categoryMap.entries()).map(
            ([categoryName, kpis]) => ({
                categoryName,
                categoryColor: kpis[0]?.categoryCouleur || '#94a3b8',
                kpis,
                isExpanded: false,
            }),
        );
    }
// Add this method to properly compare select values
compareById(item1: any, item2: any): boolean {
    return item1 === item2;
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

    // Document methods
    onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.addFiles(Array.from(input.files));
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(true);
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);

        if (event.dataTransfer?.files) {
            this.addFiles(Array.from(event.dataTransfer.files));
        }
    }

    addFiles(files: File[]) {
        const validFiles = files.filter((f) => f.size <= 10 * 1024 * 1024); // 10MB max
        this.pendingFiles.update((current) => [...current, ...validFiles]);
    }

    removePendingFile(index: number) {
        this.pendingFiles.update((files) =>
            files.filter((_, i) => i !== index),
        );
    }

    deleteDocument(documentId: number) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
            this.deleteDoc.emit(documentId);
        }
    }

    getDocumentIcon(type: string): string {
        if (type.includes('pdf')) return 'picture_as_pdf';
        if (type.includes('word')) return 'description';
        if (type.includes('excel') || type.includes('spreadsheet'))
            return 'table_chart';
        if (type.includes('image')) return 'image';
        return 'insert_drive_file';
    }

    getFileIconFromType(type: string): string {
        return this.getDocumentIcon(type);
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
        );
    }

    formatFileSizeFromBytes(bytes: number): string {
        return this.formatFileSize(bytes);
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('fr-FR');
    }

    onClose() {
        this.validationError.set(null);
        this.close.emit();
    }

    onSave() {
    if (!this.taskData.titre) return;

    // ✅ CRITICAL FIX: Convert responsableId to number
    const taskToSave = {
        ...this.taskData,
        responsableId: this.taskData.responsableId 
            ? Number(this.taskData.responsableId) 
            : undefined
    };

    console.log('💾 Saving task with data:', taskToSave);
    console.log('🔢 ResponsableId type:', typeof taskToSave.responsableId);
    console.log('🔢 ResponsableId value:', taskToSave.responsableId);

    this.save.emit({
        task: taskToSave,
        kpiIds: this.selectedKpiIds,
        files: this.pendingFiles().length > 0 
            ? this.pendingFiles() 
            : undefined,
    });
}
}
