// src/app/pages/backoffice/programmes/Gestion_sprint/dialogs/task-view-details.component.ts

import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-task-view-details',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule],
    template: `
        <div *ngIf="show()" class="fixed inset-0 z-[9999] overflow-y-auto">
            <!-- Backdrop -->
            <div class="fixed inset-0 bg-black/50 transition-opacity" (click)="onClose()"></div>

            <!-- Modal -->
            <div class="flex min-h-screen items-center justify-center p-4">
                <div class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
                    <!-- Header -->
                    <div class="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <mat-icon class="text-[#ea5073] !w-5 !h-5 text-[20px]">visibility</mat-icon>
                                    <h2 class="text-xl font-semibold text-gray-900">Détails de la tâche</h2>
                                </div>
                                <p class="text-sm text-gray-500">Informations complètes et documents justificatifs</p>
                            </div>
                            <button (click)="onClose()" class="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
                                <mat-icon class="!w-6 !h-6 text-[24px]">close</mat-icon>
                            </button>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="p-6 space-y-6">
                        <!-- Informations de base -->
                        <div class="space-y-3">
                            <!-- Title -->
                            <div>
                                <h4 class="text-sm text-gray-700 mb-1">Titre</h4>
                                <p class="text-base text-gray-900">{{ task()?.titre }}</p>
                            </div>

                            <!-- Description -->
                            <div *ngIf="task()?.description">
                                <h4 class="text-sm text-gray-700 mb-1">Description</h4>
                                <p class="text-sm text-gray-900">{{ task()?.description }}</p>
                            </div>

                            <!-- Intervenant & Priority Grid -->
                            <div class="grid grid-cols-2 gap-4">
                                <!-- Intervenant -->
                                <div>
                                    <h4 class="text-sm text-gray-700 mb-1">Intervenant</h4>
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#6d3345]/10 text-[#6d3345] border border-[#6d3345]/30 rounded-lg text-sm font-medium">
                                        <mat-icon class="!w-3 !h-3 text-[12px]">person</mat-icon>
                                        {{ getResponsableName() }}
                                    </span>
                                </div>

                                <!-- Priority -->
                                <div>
                                    <h4 class="text-sm text-gray-700 mb-1">Priorité</h4>
                                    <span class="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium" 
                                          [ngClass]="getPriorityClass()">
                                        {{ task()?.priorite }}
                                    </span>
                                </div>
                            </div>

                            <!-- Dates Grid -->
                            <div class="grid grid-cols-2 gap-4">
                                <!-- Start Date -->
                                <div>
                                    <h4 class="text-sm text-gray-700 mb-1">Date de début</h4>
                                    <p class="text-sm text-gray-900 flex items-center gap-1">
                                        <mat-icon class="text-gray-500 !w-3 !h-3 text-[12px]">event</mat-icon>
                                        {{ formatDate(task()?.dateDebut) }}
                                    </p>
                                </div>

                                <!-- End Date -->
                                <div>
                                    <h4 class="text-sm text-gray-700 mb-1">Date limite</h4>
                                    <p class="text-sm text-gray-900 flex items-center gap-1">
                                        <mat-icon class="text-gray-500 !w-3 !h-3 text-[12px]">event</mat-icon>
                                        {{ formatDate(task()?.dateLimite) }}
                                    </p>
                                </div>
                            </div>

                            <!-- Status -->
                            <div>
                                <h4 class="text-sm text-gray-700 mb-1">Statut</h4>
                                <span class="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium" 
                                      [ngClass]="getStatusClass()">
                                    {{ getStatusLabel() }}
                                </span>
                            </div>

                            <!-- KPI associés -->
                            <div *ngIf="task()?.kpis && task()?.kpis.length > 0">
                                <h4 class="text-sm text-gray-700 mb-2">KPI associés</h4>
                                <div class="space-y-2">
                                    <div *ngFor="let category of groupedKpis()" class="space-y-1">
                                        <span class="inline-flex px-2.5 py-1 text-xs font-medium border rounded-lg"
                                              [style.borderColor]="category.color"
                                              [style.color]="category.color">
                                            {{ category.name }}
                                        </span>
                                        <div class="flex flex-wrap gap-2 ml-2">
                                            <span *ngFor="let kpi of category.kpis" 
                                                  class="inline-flex px-2.5 py-1 text-xs font-medium rounded-lg bg-[#ea5073] text-white">
                                                {{ kpi.nom }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Difficulties -->
                            <div *ngIf="task()?.difficulte" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h4 class="text-sm text-gray-700 mb-1 flex items-center gap-1">
                                    <mat-icon class="!w-4 !h-4 text-[16px] text-yellow-600">warning</mat-icon>
                                    Difficultés rencontrées
                                </h4>
                                <p class="text-sm text-yellow-800">{{ task()?.difficulte }}</p>
                            </div>
                        </div>

                        <!-- Documents justificatifs -->
                        <div class="pt-4 border-t border-gray-200">
                            <div class="flex items-center justify-between mb-3">
                                <h4 class="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                    <mat-icon class="!w-4 !h-4 text-[16px]">attach_file</mat-icon>
                                    Documents justificatifs
                                </h4>
                                <label class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#ea5073] bg-[#ea5073]/10 hover:bg-[#ea5073]/20 rounded-lg transition-colors border border-[#ea5073]/30 cursor-pointer">
                                    <input 
                                        type="file" 
                                        multiple 
                                        (change)="onFileSelect($event)"
                                        class="hidden"
                                    />
                                    <mat-icon class="!w-4 !h-4 text-[16px]">add</mat-icon>
                                    Ajouter
                                </label>
                            </div>

                            <!-- Upload Progress -->
                            <div *ngIf="isUploading()" class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div class="flex items-center gap-2">
                                    <mat-icon class="!w-5 !h-5 text-[20px] text-blue-600 animate-spin">refresh</mat-icon>
                                    <span class="text-sm text-blue-800">Téléchargement en cours...</span>
                                </div>
                            </div>

                            <!-- Documents List -->
                            <div *ngIf="task()?.documents && task()?.documents.length > 0" class="space-y-2">
                                <div *ngFor="let doc of task()?.documents" 
                                     class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#ea5073]/30 hover:shadow-sm transition-all group">
                                    <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                                        <mat-icon class="!w-6 !h-6 text-[24px] text-gray-500">description</mat-icon>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <a [href]="'http://localhost:8087' + doc.cheminFichier" 
                                           target="_blank" 
                                           class="text-sm font-medium text-gray-900 hover:text-[#ea5073] truncate block transition-colors">
                                            {{ doc.nom }}
                                        </a>
                                        <div class="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                            <span>{{ formatFileSize(doc.tailleFichier) }}</span>
                                            <span>•</span>
                                            <span>{{ formatDate(doc.dateUpload) }}</span>
                                        </div>
                                    </div>
                                    <a [href]="'http://localhost:8087' + doc.cheminFichier" 
                                       download 
                                       class="p-2 text-gray-400 hover:text-[#2a7b8c] hover:bg-[#2a7b8c]/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                       title="Télécharger">
                                        <mat-icon class="!w-5 !h-5 text-[20px]">download</mat-icon>
                                    </a>
                                    <button
                                       (click)="onRemoveDocument(doc)"
                                       [disabled]="isDeleting(doc.id)"
                                       class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                       title="Supprimer">
                                        <mat-icon class="!w-5 !h-5 text-[20px]" *ngIf="!isDeleting(doc.id)">delete</mat-icon>
                                        <mat-icon class="!w-5 !h-5 text-[20px] animate-spin" *ngIf="isDeleting(doc.id)">refresh</mat-icon>
                                    </button>
                                </div>
                            </div>

                            <!-- Empty State -->
                            <div *ngIf="!task()?.documents || task()?.documents.length === 0" 
                                 class="text-center py-8 text-sm text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <mat-icon class="!w-12 !h-12 text-[48px] text-gray-300 mb-2">insert_drive_file</mat-icon>
                                <p>Aucun document ajouté</p>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                        <button 
                            (click)="onClose()"
                            class="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Fermer
                        </button>
                        <button 
                            (click)="onEdit()"
                            class="px-6 py-2.5 text-sm font-medium text-white bg-[#6d3345] hover:bg-[#5a2838] rounded-lg transition-colors flex items-center gap-2">
                            <mat-icon class="!w-5 !h-5 text-[20px]">edit</mat-icon>
                            Modifier
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host ::ng-deep .mat-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .animate-spin {
            animation: spin 1s linear infinite;
        }
    `]
})
export class TaskViewDetailsComponent {
    @Input() show = signal(false);
    @Input() task = signal<any>(null);
    @Input() responsables: any[] = [];
    
    @Output() close = new EventEmitter<void>();
    @Output() edit = new EventEmitter<void>();
    @Output() uploadDocuments = new EventEmitter<File[]>();
    @Output() removeDocument = new EventEmitter<any>();

    isUploading = signal(false);
    deletingDocIds = signal<Set<number>>(new Set());

    onClose() {
        this.close.emit();
    }

    onEdit() {
        this.edit.emit();
    }

    onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const files = Array.from(input.files);
            this.isUploading.set(true);
            this.uploadDocuments.emit(files);
            // Reset input
            input.value = '';
        }
    }

    onRemoveDocument(doc: any) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
            this.deletingDocIds.update(ids => {
                const newIds = new Set(ids);
                newIds.add(doc.id);
                return newIds;
            });
            this.removeDocument.emit(doc);
        }
    }

    isDeleting(docId: number): boolean {
        return this.deletingDocIds().has(docId);
    }

    // Reset upload state - call this from parent after upload completes
    resetUploadState() {
        this.isUploading.set(false);
    }

    // Reset delete state - call this from parent after delete completes
    resetDeleteState(docId: number) {
        this.deletingDocIds.update(ids => {
            const newIds = new Set(ids);
            newIds.delete(docId);
            return newIds;
        });
    }

    getResponsableName(): string {
        const responsableId = this.task()?.responsableId;
        if (!responsableId) return 'Non assigné';
        
        const responsable = this.responsables.find(r => r.id === responsableId);
        return responsable ? responsable.fullName : 'Inconnu';
    }

    getPriorityClass(): string {
        const priority = this.task()?.priorite?.toLowerCase();
        const classes: Record<string, string> = {
            'haute': 'bg-red-100 text-red-700 border border-red-300',
            'high': 'bg-red-100 text-red-700 border border-red-300',
            'moyenne': 'bg-orange-100 text-orange-700 border border-orange-300',
            'medium': 'bg-orange-100 text-orange-700 border border-orange-300',
            'basse': 'bg-blue-100 text-blue-700 border border-blue-300',
            'low': 'bg-blue-100 text-blue-700 border border-blue-300'
        };
        return classes[priority || ''] || 'bg-gray-100 text-gray-700 border border-gray-300';
    }

    getStatusClass(): string {
        const status = this.task()?.status;
        const classes: Record<string, string> = {
            'TERMINEE': 'bg-green-500 text-white',
            'EN_COURS': 'bg-[#2a7b8c] text-white',
            'BLOQUE': 'bg-orange-600 text-white',
            'EN_RETARD': 'bg-red-500 text-white',
            'NON_DEMARREE': 'bg-gray-500 text-white'
        };
        return classes[status || ''] || 'bg-gray-500 text-white';
    }

    getStatusLabel(): string {
        const status = this.task()?.status;
        const labels: Record<string, string> = {
            'NON_DEMARREE': 'Non démarrée',
            'EN_COURS': 'En cours',
            'BLOQUE': 'Bloquée',
            'EN_RETARD': 'En retard',
            'TERMINEE': 'Terminée'
        };
        return labels[status || ''] || status || 'En cours';
    }

    formatDate(date: any): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    groupedKpis() {
        const kpis = this.task()?.kpis || [];
        const grouped = new Map<string, { name: string; color: string; kpis: any[] }>();

        kpis.forEach((kpi: any) => {
            const categoryName = kpi.categoryNom || 'Sans catégorie';
            const categoryColor = kpi.categoryCouleur || '#94a3b8';

            if (!grouped.has(categoryName)) {
                grouped.set(categoryName, {
                    name: categoryName,
                    color: categoryColor,
                    kpis: []
                });
            }

            grouped.get(categoryName)!.kpis.push(kpi);
        });

        return Array.from(grouped.values());
    }
}