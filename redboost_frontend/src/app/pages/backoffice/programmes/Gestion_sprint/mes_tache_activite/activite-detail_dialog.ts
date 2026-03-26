// activity-details-modal.component.ts
import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnInit,
    OnDestroy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

interface KpiDTO {
    id: number;
    nom: string;
    description?: string;
    uniteMesure: string;
    objectif?: string | null;
    type?: string;
    categoryId?: number;
    categoryNom: string;
    categoryCouleur?: string;
    valeurActuelle?: number | null;
    valeur?: number | null;
}

interface DocumentDTO {
    id: number;
    nom: string;
    cheminFichier: string;
    typeFichier: string;
    tailleFichier: number;
    dateUpload: string;
    uploadedById?: number;
    uploadedByName?: string;
}

interface TacheInActivite {
    id: number;
    titre: string;
    description: string;
    priorite: string;
    status: string;
    responsableId?: number;
    responsableNom?: string | null;
    difficulte?: string;
    dateDebut: string;
    dateLimite: string;
    kpis: KpiDTO[];
    documents: DocumentDTO[];
    activiteNom: string;
    sprintNom?: string;
    programmeNom?: string;
}

interface ActiviteDetailDTO {
    id: number;
    nom: string;
    description: string;
    objectif?: string | null;
    methodologie?: string | null;
    resultatAttendu?: string | null;
    type?: string | null;
    dateDebut: string;
    dateFin: string;
    responsableId?: number;
    responsableNom?: string | null;
    status: string;
    retardJours: number;
    progression: number;
    nombreTaches: number;
    kpis: KpiDTO[];
    taches: TacheInActivite[];
    documents: DocumentDTO[];
    sprintNom?: string;
    programmeNom?: string;
}

@Component({
    selector: 'app-activity-details-modal',
    standalone: true,
    imports: [CommonModule, DatePipe],
    template: `
        <div
            *ngIf="isVisible && activite"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            (click)="close()"
        >
            <div
                class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[78vh] flex flex-col"
                (click)="$event.stopPropagation()"
            >
                <!-- ══ Header ══ -->
                <div class="flex items-start justify-between p-6 pb-4 flex-shrink-0">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-full border-2 border-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span class="material-icons text-rose-500" style="font-size:18px;">adjust</span>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-gray-900 leading-tight">Détails de l'activité</h2>
                            <p class="text-sm text-gray-400 mt-0.5">Informations complètes et tâches associées</p>
                        </div>
                    </div>
                    <button (click)="close()" class="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100 flex-shrink-0">
                        <span class="material-icons" style="font-size:20px;">close</span>
                    </button>
                </div>

                <!-- ══ Scrollable body ══ -->
                <div class="overflow-y-auto flex-1 px-6 pb-2 space-y-5">

                    <!-- Activity info card -->
                    <div class="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <!-- Name + status -->
                        <div class="flex items-center gap-3 mb-2 flex-wrap">
<span class="material-icons text-pink-500">track_changes</span>                
            <h3 class="text-lg font-semibold text-gray-900">{{ activite.nom }}</h3>
                            <span
                                class="px-3 py-0.5 rounded-full text-xs font-medium"
                                [ngClass]="{
                                    'bg-blue-100 text-blue-700':   activite.status === 'EN_COURS',
                                    'bg-green-100 text-green-700': activite.status === 'TERMINEE',
                                    'bg-red-100 text-red-700':     activite.status === 'EN_RETARD',
                                    'bg-gray-100 text-gray-600':   activite.status === 'NON_DEMARREE'
                                }"
                            >{{ getStatusLabel(activite.status) }}</span>
                            <span *ngIf="activite.type"
                                class="px-3 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                                {{ formatType(activite.type) }}
                            </span>
                            <span *ngIf="activite.retardJours > 0"
                                class="px-3 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 flex items-center gap-1">
                                <span class="material-icons" style="font-size:13px;">warning</span>
                                {{ activite.retardJours }} j. de retard
                            </span>
                        </div>

                        <!-- Description -->
                        <p *ngIf="activite.description" class="text-sm text-gray-600 mb-4">
                            {{ activite.description }}
                        </p>

                        <!-- Programme + Sprint + Échéance row -->
                        <div class="flex items-center gap-6 text-sm text-gray-600 mb-4 flex-wrap">
                            <span *ngIf="activite.programmeNom" class="flex items-center gap-1.5">
                                <span class="material-icons text-gray-400" style="font-size:17px;">folder</span>
                                <span class="text-gray-500">Programme :</span>
                                <span class="font-medium text-gray-800">{{ activite.programmeNom }}</span>
                            </span>
                            <span *ngIf="activite.sprintNom" class="flex items-center gap-1.5">
                                <span class="material-icons text-gray-400" style="font-size:17px;">speed</span>
                                <span class="text-gray-500">Sprint :</span>
                                <span class="font-medium text-gray-800">{{ activite.sprintNom }}</span>
                            </span>
                            <span *ngIf="activite.dateFin" class="flex items-center gap-1.5">
                                <span class="material-icons text-gray-400" style="font-size:17px;">calendar_today</span>
                                <span class="text-gray-500">Échéance :</span>
                                <span class="font-medium text-gray-800">{{ activite.dateFin | date:'dd MMMM yyyy' }}</span>
                            </span>
                            <span *ngIf="activite.responsableNom" class="flex items-center gap-1.5">
                                <span class="material-icons text-gray-400" style="font-size:17px;">person</span>
                                <span class="font-medium text-gray-800">{{ activite.responsableNom }}</span>
                            </span>
                        </div>

                        <!-- Progression -->
                        <div>
                            <div class="flex justify-between text-sm mb-1.5">
                                <span class="text-gray-600">Progression globale</span>
                                <span class="text-gray-500">
                                    {{ countCompletedTasks() }}/{{ activite.nombreTaches }} tâches
                                    <span class="font-semibold text-gray-700">({{ activite.progression }}%)</span>
                                </span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                    class="bg-rose-500 h-full rounded-full transition-all duration-500"
                                    [style.width.%]="activite.progression"
                                ></div>
                            </div>
                        </div>
                    </div>

                    <!-- ── Objectif ── -->
                    <div *ngIf="activite.objectif" class="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                        <h4 class="text-sm font-semibold text-amber-800 mb-1.5 flex items-center gap-2">
                            <span class="material-icons text-amber-500" style="font-size:17px;">flag</span>
                            Objectif
                        </h4>
                        <p class="text-sm text-amber-900 leading-relaxed">{{ activite.objectif }}</p>
                    </div>

                    <!-- ── Méthodologie ── -->
                    <div *ngIf="activite.methodologie" class="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                        <h4 class="text-sm font-semibold text-blue-800 mb-1.5 flex items-center gap-2">
                            <span class="material-icons text-blue-500" style="font-size:17px;">account_tree</span>
                            Méthodologie
                        </h4>
                        <p class="text-sm text-blue-900 leading-relaxed">{{ activite.methodologie }}</p>
                    </div>

                    <!-- ── Résultat attendu ── -->
                    <div *ngIf="activite.resultatAttendu" class="bg-green-50 rounded-2xl p-4 border border-green-100">
                        <h4 class="text-sm font-semibold text-green-800 mb-1.5 flex items-center gap-2">
                            <span class="material-icons text-green-500" style="font-size:17px;">emoji_events</span>
                            Résultat attendu
                        </h4>
                        <p class="text-sm text-green-900 leading-relaxed">{{ activite.resultatAttendu }}</p>
                    </div>

                    <!-- ── KPIs ── -->
                    <div *ngIf="activite.kpis && activite.kpis.length > 0">
                        <div class="flex items-center gap-2 mb-3">
                            <span class="material-icons text-rose-500" style="font-size:18px;">analytics</span>
                            <h4 class="text-sm font-semibold text-gray-800">KPIs associés</h4>
                            <span class="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{{ activite.kpis.length }}</span>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div
                                *ngFor="let kpi of activite.kpis"
                                class="rounded-xl p-3.5 border"
                                [style.background-color]="kpi.categoryCouleur ? kpi.categoryCouleur + '10' : '#f9fafb'"
                                [style.border-color]="kpi.categoryCouleur ? kpi.categoryCouleur + '40' : '#e5e7eb'"
                            >
                                <div class="flex items-start justify-between gap-2 mb-1">
                                    <span class="text-sm font-semibold text-gray-800 leading-tight">{{ kpi.nom }}</span>
                                    <span *ngIf="kpi.type"
                                        class="text-xs px-2 py-0.5 rounded-full bg-white border flex-shrink-0"
                                        [style.color]="kpi.categoryCouleur || '#6b7280'"
                                        [style.border-color]="kpi.categoryCouleur ? kpi.categoryCouleur + '60' : '#d1d5db'"
                                    >{{ kpi.type }}</span>
                                </div>
                                <p *ngIf="kpi.description" class="text-xs text-gray-500 mb-2">{{ kpi.description }}</p>
                                <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                    <span class="px-2 py-0.5 rounded-md bg-white border border-gray-200 font-medium"
                                        [style.color]="kpi.categoryCouleur || '#6b7280'">
                                        {{ kpi.categoryNom }}
                                    </span>
                                    <span class="flex items-center gap-0.5">
                                        <span class="material-icons" style="font-size:12px;">straighten</span>
                                        {{ kpi.uniteMesure }}
                                    </span>
                                    <span *ngIf="kpi.objectif" class="flex items-center gap-0.5">
                                        <span class="material-icons" style="font-size:12px;">flag</span>
                                        {{ kpi.objectif }}
                                    </span>
                                    <span *ngIf="kpi.valeurActuelle != null" class="flex items-center gap-0.5 font-medium text-gray-700">
                                        <span class="material-icons" style="font-size:12px;">trending_up</span>
                                        {{ kpi.valeurActuelle }} {{ kpi.uniteMesure }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ── Tâches ── -->
                    <div>
                        <div class="flex items-center gap-2 mb-3">
                            <span class="material-icons text-rose-500" style="font-size:18px;">check_box</span>
                            <h4 class="text-sm font-semibold text-gray-800">Tâches associées</h4>
                            <span class="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                                {{ activite.nombreTaches }}
                            </span>
                        </div>

                        <div *ngIf="activite.taches && activite.taches.length > 0" class="space-y-3">
                            <div
                                *ngFor="let tache of activite.taches"
                                class="rounded-xl border p-4 hover:shadow-sm transition-shadow"
                                [ngClass]="{
                                    'border-red-200 bg-red-50/30':  tache.status === 'EN_RETARD',
                                    'border-gray-200 bg-white':     tache.status !== 'EN_RETARD'
                                }"
                            >
                                <div class="flex items-start gap-3">
                                    <!-- Status icon -->
                                    <span class="flex-shrink-0 mt-0.5 material-icons"
                                        style="font-size:22px;"
                                        [ngClass]="getStatusIconColor(tache.status)">
                                        {{ getStatusIcon(tache.status) }}
                                    </span>

                                    <!-- Content -->
                                    <div class="flex-1 min-w-0">
                                        <!-- Title + retard badge -->
                                        <div class="flex items-start justify-between gap-3 mb-1">
                                            <div class="flex items-center gap-2 flex-wrap min-w-0">
                                                <span class="font-semibold text-gray-900 text-sm">{{ tache.titre }}</span>
                                                <span *ngIf="tache.status === 'EN_RETARD' || (tache.status === 'EN_COURS' && isDatePassed(tache.dateLimite))"
                                                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 border border-red-200 flex-shrink-0">
                                                    <span class="material-icons" style="font-size:13px;">error_outline</span>
                                                    Retard
                                                </span>
                                            </div>
                                            <!-- Right badges stacked -->
                                            <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                <span class="px-3 py-0.5 rounded-full text-xs font-medium"
                                                    [ngClass]="{
                                                        'bg-blue-100 text-blue-700':   tache.status === 'EN_COURS',
                                                        'bg-green-100 text-green-700': tache.status === 'TERMINEE',
                                                        'bg-red-100 text-red-700':     tache.status === 'EN_RETARD',
                                                        'bg-gray-100 text-gray-600':   tache.status === 'NON_DEMARREE'
                                                    }">{{ getStatusLabel(tache.status) }}</span>
                                                <span class="px-3 py-0.5 rounded-full text-xs font-medium"
                                                    [ngClass]="{
                                                        'bg-red-100 text-red-600':       tache.priorite === 'Haute',
                                                        'bg-orange-100 text-orange-600': tache.priorite === 'Moyenne',
                                                        'bg-green-100 text-green-600':   tache.priorite === 'Basse'
                                                    }">{{ tache.priorite }}</span>
                                            </div>
                                        </div>

                                        <!-- Description -->
                                        <p *ngIf="tache.description" class="text-xs text-gray-500 mb-2 leading-relaxed">
                                            {{ tache.description }}
                                        </p>

                                        <!-- Meta -->
                                        <div class="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                                            <span *ngIf="tache.dateLimite" class="flex items-center gap-1">
                                                <span class="material-icons" style="font-size:13px;">calendar_today</span>
                                                {{ tache.dateLimite | date:'dd/MM/yyyy' }}
                                            </span>
                                            <span *ngIf="tache.responsableNom" class="flex items-center gap-1">
                                                <span class="material-icons" style="font-size:13px;">person</span>
                                                {{ tache.responsableNom }}
                                            </span>
                                            <span *ngIf="tache.difficulte" class="flex items-center gap-1">
                                                <span class="material-icons" style="font-size:13px;">fitness_center</span>
                                                {{ tache.difficulte }}
                                            </span>
                                            <span *ngIf="tache.kpis && tache.kpis.length > 0" class="flex items-center gap-1">
                                                <span class="material-icons" style="font-size:13px;">analytics</span>
                                                {{ tache.kpis.length }} KPI(s)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div *ngIf="!activite.taches || activite.taches.length === 0"
                            class="text-center py-8 text-gray-400 text-sm">
                            <span class="material-icons block mb-2" style="font-size:40px; color:#e5e7eb;">assignment</span>
                            Aucune tâche associée
                        </div>
                    </div>

                    <!-- ── Documents ── -->
                    <div *ngIf="activite.documents && activite.documents.length > 0">
                        <div class="flex items-center gap-2 mb-3">
                            <span class="material-icons text-gray-400" style="font-size:18px;">attachment</span>
                            <h4 class="text-sm font-semibold text-gray-800">Documents</h4>
                            <span class="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{{ activite.documents.length }}</span>
                        </div>
                        <div class="space-y-2">
                            <div *ngFor="let doc of activite.documents"
                                class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
                                <span class="material-icons text-gray-400" style="font-size:20px;">{{ getFileIcon(doc.typeFichier) }}</span>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-800 truncate">{{ doc.nom }}</p>
                                    <p class="text-xs text-gray-400">
                                        {{ formatFileSize(doc.tailleFichier) }}
                                        <span *ngIf="doc.uploadedByName"> · {{ doc.uploadedByName }}</span>
                                    </p>
                                </div>
                                <a [href]="'http://localhost:8087' + doc.cheminFichier"
                                    target="_blank"
                                    class="text-rose-500 hover:text-rose-700 flex-shrink-0">
                                    <span class="material-icons" style="font-size:20px;">download</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- bottom padding -->
                    <div class="h-2"></div>
                </div>

                <!-- ══ Footer ══ -->
                <div class="flex items-center gap-3 p-5 border-t border-gray-100 bg-white rounded-b-2xl flex-shrink-0">
                    <button
                        (click)="close()"
                        class="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
                    >
                        Fermer
                    </button>
                    <button
    (click)="goToMyTasks()"
    class="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition text-sm flex items-center justify-center gap-2 shadow-sm"
>
    <span class="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0">
        <span class="material-icons" style="font-size:12px;">adjust</span>
    </span>
    Voir mes Tâches
</button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .material-icons {
            font-family: 'Material Icons';
            font-weight: normal;
            font-style: normal;
            font-size: 20px;
            line-height: 1;
            letter-spacing: normal;
            text-transform: none;
            display: inline-block;
            white-space: nowrap;
            word-wrap: normal;
            direction: ltr;
            -webkit-font-smoothing: antialiased;
        }
    `],
})
export class ActivityDetailsModalComponent implements OnInit, OnDestroy {
    @Input() activite: ActiviteDetailDTO | null = null;
    @Input() isVisible = false;
@Output() closeModal = new EventEmitter<void>();
@Output() switchToTaches = new EventEmitter<void>(); // ← ADD


goToMyTasks() {
    this.close();
    this.switchToTaches.emit(); // ← emit to parent
}
    constructor(private router: Router) {}

    ngOnInit() {
        if (this.isVisible) document.body.style.overflow = 'hidden';
    }

    ngOnDestroy() {
        document.body.style.overflow = 'auto';
    }

    close() {
        document.body.style.overflow = 'auto';
        this.closeModal.emit();
    }

   

    countCompletedTasks(): number {
        if (!this.activite) return 0;
        return this.activite.taches.filter(t => t.status === 'TERMINEE').length;
    }

    formatType(type: string): string {
        return type.replace(/_/g, ' ');
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'TERMINEE':   return 'check_circle';
            case 'EN_RETARD':  return 'error';
            case 'EN_COURS':   return 'access_time';
            default:           return 'radio_button_unchecked';
        }
    }

    getStatusIconColor(status: string): string {
        switch (status) {
            case 'TERMINEE':   return 'text-green-500';
            case 'EN_RETARD':  return 'text-red-400';
            case 'EN_COURS':   return 'text-blue-400';
            default:           return 'text-gray-300';
        }
    }
    isDatePassed(dateStr: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date(new Date().toDateString());
}

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            EN_COURS:     'En cours',
            TERMINEE:     'Terminée',
            EN_RETARD:    'En retard',
            NON_DEMARREE: 'Non démarrée',
        };
        return labels[status] || status;
    }

    getFileIcon(type: string): string {
        if (!type) return 'description';
        const t = type.toLowerCase();
        if (t.includes('pdf'))                                              return 'picture_as_pdf';
        if (t.includes('image') || t.includes('png') || t.includes('jpg')) return 'image';
        if (t.includes('word') || t.includes('doc'))                        return 'article';
        if (t.includes('excel') || t.includes('xls'))                       return 'table_chart';
        return 'description';
    }

    
    formatFileSize(bytes: number): string {
        if (bytes < 1024)        return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}