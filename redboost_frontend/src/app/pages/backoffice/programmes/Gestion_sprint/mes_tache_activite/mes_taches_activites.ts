// mes-taches-activites.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../frontoffice/service/auth.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityDetailsModalComponent } from './activite-detail_dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationWebSocketService } from '../../../../services/notification-websocket.service';

interface TacheDetailDTO {
    id: number;
    titre: string;
    description: string;
    status: string;
    priorite: string;
    dateLimite: string;
    activiteNom: string;
    activiteId: number;      // ← NEW
    sprintNom: string;
    sprintId: number;        // ← NEW
    programmeNom: string;
    programmeId: number;     // ← NEW
    kpis: KpiDTO[];
    documents: DocumentDTO[];
}

interface KpiDTO {
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
    responsableNom?: string;
    difficulte?: string;
    dateDebut: string;
    dateLimite: string;
    kpis: KpiDTO[];
    documents: DocumentDTO[];
    activiteNom: string;
}

interface ActiviteDetailDTO {
    id: number;
    nom: string;
    description: string;
    dateDebut: string;
    dateFin: string;
    responsableId?: number;
    responsableNom?: string;
    status: string;
    retardJours: number;
    progression: number;
    nombreTaches: number;
    kpis: KpiDTO[];
    taches: TacheInActivite[];
    documents: DocumentDTO[];
    sprintNom: string;
    sprintId: number;        // ← NEW
    programmeNom: string;
    programmeId: number;     // ← NEW
}


interface ProgrammeSimple {
    id: number;
    nom: string;
}

@Component({
    selector: 'app-mes-taches-activites',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DatePipe,
        ActivityDetailsModalComponent,
    ],
    template: `
        <div class="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen font-sans">
            <!-- Page Header -->
            <div class="mb-8">
                <div class="flex justify-between items-center gap-4">
                    <div class="min-w-0">
                        <h1 class="text-3xl font-bold text-gray-900 mb-2 truncate">
                            Mes Tâches et Activités
                        </h1>
                        <p class="text-gray-600">
                            Vue personnalisée de vos actions et responsabilités
                        </p>
                    </div>
                    <!-- Real-time indicator -->
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <div class="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 whitespace-nowrap">
                            <div class="relative">
                                <span class="flex h-3 w-3">
                                    <span
                                        *ngIf="isConnected"
                                        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                                    ></span>
                                    <span
                                        class="relative inline-flex rounded-full h-3 w-3"
                                        [class.bg-green-500]="isConnected"
                                        [class.bg-gray-400]="!isConnected"
                                    ></span>
                                </span>
                            </div>
                            <span class="text-sm text-gray-600">
                                {{ isConnected ? 'Mises à jour en temps réel' : 'Hors ligne' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Statistics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div class="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                        <div class="min-w-0">
                            <p class="text-pink-100 text-sm font-medium mb-1 truncate">Total tâches</p>
                            <p class="text-4xl font-bold">{{ mesTaches.length }}</p>
                        </div>
                        <div class="bg-white bg-opacity-20 rounded-xl p-3 flex-shrink-0">
                            <span class="material-icons text-3xl">checklist</span>
                        </div>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                        <div class="min-w-0">
                            <p class="text-green-100 text-sm font-medium mb-1 truncate">Terminées</p>
                            <p class="text-4xl font-bold">{{ getCompletedTasksCount() }}</p>
                        </div>
                        <div class="bg-white bg-opacity-20 rounded-xl p-3 flex-shrink-0">
                            <span class="material-icons text-3xl">check_circle</span>
                        </div>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                        <div class="min-w-0">
                            <p class="text-blue-100 text-sm font-medium mb-1 truncate">En cours</p>
                            <p class="text-4xl font-bold">{{ getInProgressTasksCount() }}</p>
                        </div>
                        <div class="bg-white bg-opacity-20 rounded-xl p-3 flex-shrink-0">
                            <span class="material-icons text-3xl">access_time</span>
                        </div>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                        <div class="min-w-0">
                            <p class="text-orange-100 text-sm font-medium mb-1 truncate">Priorité haute</p>
                            <p class="text-4xl font-bold">{{ getHighPriorityTasksCount() }}</p>
                        </div>
                        <div class="bg-white bg-opacity-20 rounded-xl p-3 flex-shrink-0">
                            <span class="material-icons text-3xl">priority_high</span>
                        </div>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                        <div class="min-w-0">
                            <p class="text-teal-100 text-sm font-medium mb-1 truncate">Activités actives</p>
                            <p class="text-4xl font-bold">{{ mesActivites.length }}</p>
                        </div>
                        <div class="bg-white bg-opacity-20 rounded-xl p-3 flex-shrink-0">
                            <span class="material-icons text-3xl">trending_up</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- New Assignment Banner -->
            <div
                *ngIf="newAssignmentsCount > 0"
                class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg flex items-center justify-between gap-4 animate-slideIn"
            >
                <div class="flex items-center gap-3 min-w-0">
                    <div class="bg-blue-500 rounded-full p-2 flex-shrink-0">
                        <span class="material-icons text-white text-xl animate-bounce">notifications_active</span>
                    </div>
                    <div class="min-w-0">
                        <p class="text-blue-900 font-semibold text-base truncate">
                            Nouvelles assignations!
                        </p>
                        <p class="text-blue-700 text-sm">
                            {{ newAssignmentsCount }} nouvelle(s) {{ newAssignmentsCount > 1 ? 'tâches/activités ont' : 'tâche/activité a' }} été assignée(s)
                        </p>
                    </div>
                </div>
                <button
                    (click)="dismissNewAssignments()"
                    class="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                >
                    Compris
                </button>
            </div>

            <!-- Error / Loading -->
            <div
                *ngIf="errorMessage"
                class="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl"
            >
                {{ errorMessage }}
            </div>

            <div *ngIf="loading" class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
            </div>

            <!-- Content -->
            <div *ngIf="!loading && !errorMessage">
                <!-- Tabs -->
                <div class="flex space-x-8 border-b border-gray-200 mb-6">
                    <button
                        *ngFor="let tab of tabs"
                        (click)="currentTab = tab.id"
                        class="pb-4 px-2 text-lg font-medium relative transition-colors flex items-center gap-2 whitespace-nowrap"
                        [class.text-rose-600]="currentTab === tab.id"
                        [class.text-gray-500]="currentTab !== tab.id"
                    >
                        <span class="material-icons text-xl">{{ tab.icon }}</span>
                        {{ tab.label }} ({{ tab.count }})
                        <span
                            *ngIf="currentTab === tab.id"
                            class="absolute bottom-0 left-0 right-0 h-1 bg-rose-600 rounded-t"
                        ></span>
                    </button>
                </div>

                <!-- Filters -->
                <div class="flex flex-col sm:flex-row gap-4 mb-8">
                    <div class="flex-1 relative min-w-0">
                        <input
                            type="text"
                            [(ngModel)]="searchTerm"
                            (input)="onFilterChange()"
                            placeholder="Rechercher dans les tâches..."
                            class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400"
                        />
                        <svg
                            class="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>

                    <select
                        [(ngModel)]="selectedProgrammeId"
                        (change)="onFilterChange()"
                        class="px-4 py-3 rounded-xl border border-gray-200 bg-white flex-shrink-0"
                    >
                        <option [ngValue]="null">Tous les programmes</option>
                        <option *ngFor="let prog of programmes" [ngValue]="prog.id">
                            {{ prog.nom }}
                        </option>
                    </select>

                    <select
                        [(ngModel)]="selectedStatus"
                        (change)="onFilterChange()"
                        class="px-4 py-3 rounded-xl border border-gray-200 bg-white flex-shrink-0"
                    >
                        <option value="TOUS">Tous les statuts</option>
                        <option value="EN_COURS">En cours</option>
                        <option value="TERMINEE">Terminées</option>
                        <option value="EN_RETARD">En retard</option>
                        <option value="NON_DEMARREE">Non démarrées</option>
                    </select>
                </div>

                <!-- ═══════════════════════════════════
                     MES TÂCHES
                     ═══════════════════════════════════ -->
                <div *ngIf="currentTab === 'taches'">
                    <div
                        *ngIf="filteredTaches.length === 0"
                        class="text-center py-12 text-gray-500"
                    >
                        <span class="material-icons text-6xl text-gray-300 mb-4">assignment</span>
                        <p class="text-lg">Aucune tâche trouvée</p>
                    </div>

                    <div
                        *ngFor="let tache of filteredTaches; let i = index"
                        [id]="'task-' + tache.id"
                        class="bg-white rounded-xl border hover:shadow-md transition-all mb-3"
                        [class.ring-4]="tache.id === highlightedTaskId"
                        [class.ring-rose-500]="tache.id === highlightedTaskId"
                        [class.shadow-xl]="tache.id === highlightedTaskId"
                        [class.animate-slideIn]="isNewAssignment(tache.id)"
                    >
                        <!-- ── Task row: text left (truncates), actions right (fixed) ── -->
                        <div class="flex items-center gap-4 px-5 py-4" style="min-width:0;">

                            <!-- Status icon: fixed -->
                            <span class="flex-shrink-0 material-icons text-xl" [class]="getStatusIconColor(tache.status)">
                                {{ getStatusIcon(tache.status) }}
                            </span>

                            <!-- Text content: takes space, truncates -->
                            <div class="flex-1 min-w-0">
                                <!-- Title + inline badges -->
                                <div class="flex items-center gap-2 mb-1 flex-wrap">
                                    <!-- ─── Clickable title navigates to sprint view ─── -->
                                    <h3
                                        class="text-base font-semibold text-gray-900 truncate cursor-pointer hover:text-rose-600 hover:underline transition-colors group flex items-center gap-1"
                                        [title]="'Voir dans le programme : ' + tache.titre"
                                        (click)="navigateToTask(tache)"
                                    >
                                        {{ tache.titre }}
                                        <span class="material-icons text-sm opacity-0 group-hover:opacity-100 transition-opacity text-rose-500">open_in_new</span>
                                    </h3>
                                    <span
                                        *ngIf="isNewAssignment(tache.id)"
                                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300 flex-shrink-0 whitespace-nowrap"
                                    >
                                        <span class="material-icons text-sm">new_releases</span>
                                        Nouveau
                                    </span>
                                    <span
                                        *ngIf="tache.status === 'EN_RETARD'"
                                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600 flex-shrink-0 whitespace-nowrap"
                                    >
                                        <span class="material-icons text-sm">error_outline</span>
                                        En retard
                                    </span>
                                </div>

                                <!-- Description: clamp to 2 lines -->
                                <p class="text-sm text-gray-600 mb-3 line-clamp-2" [title]="tache.description">
                                    {{ tache.description }}
                                </p>

                                <!-- Meta info row -->
                                <div class="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                                    <span class="flex items-center gap-1.5 min-w-0">
                                        <span class="material-icons text-gray-400 text-base flex-shrink-0">folder</span>
                                        <span class="font-medium truncate max-w-[12ch]" [title]="tache.programmeNom">{{ tache.programmeNom }}</span>
                                    </span>
                                    <span class="flex items-center gap-1.5 min-w-0">
                                        <span class="material-icons text-gray-400 text-base flex-shrink-0">speed</span>
                                        <span class="truncate max-w-[12ch]" [title]="tache.sprintNom">{{ tache.sprintNom }}</span>
                                    </span>
                                    <span class="flex items-center gap-1.5 min-w-0">
                                        <span class="material-icons text-gray-400 text-base flex-shrink-0">widgets</span>
                                        <span class="truncate max-w-[12ch]" [title]="tache.activiteNom">{{ tache.activiteNom }}</span>
                                    </span>
                                    <span class="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
                                        <span class="material-icons text-gray-400 text-base">event</span>
                                        {{ tache.dateLimite | date: 'dd/MM/yyyy' }}
                                    </span>
                                    <!-- ─── "Voir dans le programme" shortcut link ─── -->
                                    <button
                                        (click)="navigateToTask(tache)"
                                        class="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors flex-shrink-0"
                                        title="Ouvrir dans la gestion des sprints"
                                    >
                                        <span class="material-icons text-sm">launch</span>
                                        Voir dans le programme
                                    </button>
                                </div>
                            </div>

                            <!-- Action buttons: fixed, never shrink or wrap -->
                            <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span
                                    class="px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap"
                                    [ngClass]="{
                                        'bg-blue-50 text-blue-600':   tache.status === 'EN_COURS',
                                        'bg-green-50 text-green-600': tache.status === 'TERMINEE',
                                        'bg-red-50 text-red-600':     tache.status === 'EN_RETARD',
                                        'bg-gray-50 text-gray-600':   tache.status === 'NON_DEMARREE'
                                    }"
                                >
                                    {{ getStatusLabel(tache.status) }}
                                </span>
                                <span
                                    class="px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap"
                                    [ngClass]="{
                                        'bg-red-50 text-red-600':       tache.priorite === 'Haute',
                                        'bg-yellow-50 text-yellow-600': tache.priorite === 'Moyenne',
                                        'bg-green-50 text-green-600':   tache.priorite === 'Basse'
                                    }"
                                >
                                    {{ tache.priorite }}
                                </span>

                                <button
                                    *ngIf="tache.status !== 'TERMINEE'"
                                    (click)="marquerTermine(tache.id)"
                                    class="px-5 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm transition-colors shadow-sm whitespace-nowrap"
                                >
                                    Marquer terminé
                                </button>
                                <button
                                    *ngIf="tache.status === 'TERMINEE'"
                                    (click)="rouvrirTache(tache.id)"
                                    class="px-6 py-2.5 rounded-full border-2 border-rose-500 text-rose-600 font-medium text-sm hover:bg-rose-500 hover:text-white transition-all whitespace-nowrap"
                                >
                                    Rouvrir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ═══════════════════════════════════
                     MES ACTIVITÉS
                     ═══════════════════════════════════ -->
                <div
                    *ngIf="currentTab === 'activites'"
                    class="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <div
                        *ngIf="mesActivites.length === 0"
                        class="col-span-2 text-center py-12 text-gray-500"
                    >
                        <span class="material-icons text-6xl text-gray-300 mb-4">widgets</span>
                        <p class="text-lg">Aucune activité assignée</p>
                    </div>

                    <div
                        *ngFor="let act of mesActivites; let i = index"
                        class="bg-white rounded-2xl shadow-sm border-t-4 overflow-hidden hover:shadow-lg transition-all"
                        [style.border-top-color]="getActivityColor(i)"
                        [class.animate-slideIn]="isNewAssignment(act.id)"
                    >
                        <!-- Activity card header -->
                        <div
                            class="p-5 pb-4"
                            [style.background-color]="getActivityColor(i) + '10'"
                        >
                            <!-- Title row -->
                            <div class="flex items-start gap-2 mb-3" style="min-width:0;">
                                <div class="flex items-center gap-2 flex-1 min-w-0">
                                   <h3
    class="text-xl font-semibold text-gray-900 truncate cursor-pointer hover:text-rose-600 hover:underline transition-colors group flex items-center gap-1"
    [title]="'Voir dans le programme : ' + act.nom"
    (click)="navigateToActivity(act)"
>
    {{ act.nom }}
    <span class="material-icons text-sm opacity-0 group-hover:opacity-100 transition-opacity text-rose-500">open_in_new</span>
</h3>
                                    <span
                                        *ngIf="isNewAssignment(act.id)"
                                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300 flex-shrink-0 whitespace-nowrap"
                                    >
                                        <span class="material-icons text-sm">new_releases</span>
                                        Nouveau
                                    </span>
                                </div>
                                <span
                                    class="px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 whitespace-nowrap"
                                    [ngClass]="{
                                        'bg-blue-100 text-blue-700':   act.status === 'EN_COURS',
                                        'bg-green-100 text-green-700': act.status === 'TERMINEE',
                                        'bg-gray-100 text-gray-700':   act.status === 'NON_DEMARREE'
                                    }"
                                >
                                    {{ getStatusLabel(act.status) }}
                                </span>
                            </div>

                            <p class="text-gray-600 text-sm mb-3 line-clamp-2" [title]="act.description">
                                {{ act.description }}
                            </p>

                            <div class="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                                <span class="flex items-center gap-1.5 min-w-0">
                                    <span class="material-icons text-base flex-shrink-0">folder</span>
                                    <span class="truncate max-w-[14ch]" [title]="act.programmeNom">{{ act.programmeNom }}</span>
                                </span>
                                <span class="flex items-center gap-1.5 min-w-0">
                                    <span class="material-icons text-base flex-shrink-0">speed</span>
                                    <span class="truncate max-w-[14ch]" [title]="act.sprintNom">{{ act.sprintNom }}</span>
                                </span>
                                <span class="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
                                    <span class="material-icons text-base">event</span>
                                    {{ act.dateFin | date: 'dd/MM/yyyy' }}
                                </span>

                                <!-- Add after the date span in the activity card header info row -->
<button
    (click)="navigateToActivity(act)"
    class="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors flex-shrink-0"
    title="Ouvrir dans la gestion des sprints"
>
    <span class="material-icons text-sm">launch</span>
    Voir dans le programme
</button>
                            </div>
                        </div>

                        <!-- Activity card footer -->
                        <div class="p-5 pt-4">
                            <div class="mb-4">
                                <div class="flex justify-between text-sm mb-2">
                                    <span class="font-medium text-gray-700">Progression</span>
                                    <span class="text-gray-600 flex-shrink-0">
                                        {{ act.nombreTaches - countCompletedInActivity(act) }}/{{ act.nombreTaches }} tâches ({{ act.progression }}%)
                                    </span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        class="h-full transition-all duration-500 rounded-full"
                                        [style.width.%]="act.progression"
                                        [style.background-color]="getActivityColor(i)"
                                    ></div>
                                </div>
                            </div>
                            <button
                                (click)="openActivityModal(act)"
                                class="w-full py-3 border-2 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
                                [style.border-color]="getActivityColor(i)"
                                [style.color]="getActivityColor(i)"
                            >
                                <span class="material-icons text-lg">trending_up</span>
                                Voir les détails
                                <span class="material-icons text-lg">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <app-activity-details-modal
                [activite]="selectedActivite"
                [isVisible]="showActivityModal"
                (closeModal)="closeActivityModal()"
            >
            </app-activity-details-modal>
        </div>
    `,
    styles: [
        `
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
            html {
                scroll-behavior: smooth;
            }
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .animate-slideIn {
                animation: slideIn 0.3s ease-out;
            }
            .line-clamp-2 {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
        `,
    ],
})
export class MesTachesActivitesComponent implements OnInit, OnDestroy {
    currentTab: 'taches' | 'activites' = 'taches';
    tabs = [
        {
            id: 'taches' as const,
            label: 'Mes Tâches',
            count: 0,
            icon: 'check_circle_outline',
        },
        {
            id: 'activites' as const,
            label: 'Mes Activités',
            count: 0,
            icon: 'widgets',
        },
    ];
    highlightedTaskId: number | null = null;
    private taskIdFromRoute: number | null = null;

    mesTaches: TacheDetailDTO[] = [];
    mesActivites: ActiviteDetailDTO[] = [];
    programmes: ProgrammeSimple[] = [];

    searchTerm = '';
    selectedProgrammeId: number | null = null;
    selectedStatus: string = 'TOUS';

    loading = true;
    errorMessage = '';
    selectedActivite: ActiviteDetailDTO | null = null;
    showActivityModal = false;

    private activityColors = [
        '#E91E63',
        '#16A34A',
        '#3B82F6',
        '#F59E0B',
        '#8B5CF6',
        '#14B8A6',
    ];

    private notificationSubscription?: Subscription;
    private connectionSubscription?: Subscription;
    isConnected = false;

    private previousTacheIds: Set<number> = new Set();
    private previousActiviteIds: Set<number> = new Set();
    private newTacheIds: Set<number> = new Set();
    private newActiviteIds: Set<number> = new Set();
    newAssignmentsCount = 0;

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private route: ActivatedRoute,
        private router: Router,                                   // ← NEW
        private notificationService: NotificationWebSocketService
    ) {}

    ngOnInit(): void {
        const userIdStr = this.authService.getUserId();
        if (!userIdStr || isNaN(+userIdStr)) {
            this.errorMessage = 'Utilisateur non identifié. Veuillez vous reconnecter.';
            this.loading = false;
            return;
        }

        const userId = +userIdStr;

        this.route.queryParams.subscribe(params => {
            const taskId = params['taskId'];
            if (taskId && !isNaN(+taskId)) {
                this.taskIdFromRoute = +taskId;
                this.currentTab = 'taches';
            }
        });

        this.loadAllData(userId);

        this.connectionSubscription = this.notificationService.connectionStatus$.subscribe({
            next: (connected) => { this.isConnected = connected; }
        });

        this.notificationSubscription = this.notificationService.notifications$.subscribe({
            next: (notifications) => {
                const hasNewAssignment = notifications.some(n =>
                    !n.read && (n.type === 'TASK_ASSIGNMENT' || n.type === 'ACTIVITY_ASSIGNMENT')
                );
                if (hasNewAssignment) this.refreshData(userId);
            }
        });
    }

    ngOnDestroy(): void {
        this.notificationSubscription?.unsubscribe();
        this.connectionSubscription?.unsubscribe();
    }

    // ─── NEW: Navigate to sprint management and open the parent activity ───────
    navigateToTask(tache: TacheDetailDTO): void {
        if (!tache.programmeId) {
            console.warn('No programmeId on task, cannot navigate', tache);
            return;
        }
        this.router.navigate(
            ['/programme', tache.programmeId],
            {
                queryParams: {
                    tab: 'sprints',
                    sprintId:   tache.sprintId,
                    activiteId: tache.activiteId,
                    tacheId:    tache.id,
                }
            }
        );
    }


    // Add this method right after navigateToTask()
navigateToActivity(act: ActiviteDetailDTO): void {
    // programmeId / sprintId may be absent on the activity root object if the
    // backend list-endpoint DTO hasn't been updated yet.
    // Fall back to the first child tache which already carries both IDs reliably.
    const programmeId: number | undefined =
        (act as any).programmeId ||
        (act.taches?.[0] as any)?.programmeId ||
        undefined;

    const sprintId: number | undefined =
        (act as any).sprintId ||
        (act.taches?.[0] as any)?.sprintId ||
        undefined;

    if (!programmeId) {
        console.warn(
            'Cannot resolve programmeId for activity — navigation aborted.',
            act
        );
        return;
    }

    this.router.navigate(
        ['/programme', programmeId],
        {
            queryParams: {
                tab:        'sprints',
                sprintId:   sprintId ?? null,
                activiteId: act.id,
                // no tacheId — applyDeepLink() will expand sprint + activité
                // and scroll to the activité header
            }
        }
    );
}


    // ──────────────────────────────────────────────────────────────────────────

    private refreshData(userId: number): void {
        this.http
            .get<TacheDetailDTO[]>(`https://redboost.tn/api/backoffice/programmes/user/${userId}/taches`)
            .subscribe({
                next: (data) => {
                    this.detectNewAssignments(data, this.previousTacheIds, this.newTacheIds, 'tache');
                    this.mesTaches = data;
                    this.updateCount('taches', data.length);
                    this.previousTacheIds = new Set(data.map(t => t.id));
                },
                error: (err) => console.error('❌ Error refreshing tasks:', err)
            });

        this.http
            .get<ActiviteDetailDTO[]>(`https://redboost.tn/api/backoffice/programmes/user/${userId}/activites`)
            .subscribe({
                next: (data) => {
                    this.detectNewAssignments(data, this.previousActiviteIds, this.newActiviteIds, 'activite');
                    this.mesActivites = data;
                    this.updateCount('activites', data.length);
                    this.previousActiviteIds = new Set(data.map(a => a.id));
                },
                error: (err) => console.error('❌ Error refreshing activities:', err)
            });
    }

    private detectNewAssignments(newData: any[], previousIds: Set<number>, newIds: Set<number>, type: 'tache' | 'activite'): void {
        const currentIds = new Set(newData.map(item => item.id));
        const addedIds = [...currentIds].filter(id => !previousIds.has(id));
        if (addedIds.length > 0) {
            addedIds.forEach(id => newIds.add(id));
            this.newAssignmentsCount = this.newTacheIds.size + this.newActiviteIds.size;
        }
    }

    isNewAssignment(id: number): boolean {
        return this.newTacheIds.has(id) || this.newActiviteIds.has(id);
    }

    dismissNewAssignments(): void {
        this.newTacheIds.clear();
        this.newActiviteIds.clear();
        this.newAssignmentsCount = 0;
    }

    private loadAllData(userId: number) {
        this.loading = true;
        this.loadingCounter = 0;
        this.loadProgrammes();
        this.loadTaches(userId);
        this.loadActivites(userId);
    }

    private loadProgrammes() {
        this.http
            .get<any[]>('https://redboost.tn/api/backoffice/programmes')
            .subscribe({
                next: (data) => {
                    this.programmes = data
                        .map((p) => ({ id: p.id, nom: p.nom }))
                        .sort((a, b) => a.nom.localeCompare(b.nom));
                },
                error: () => console.error('Erreur chargement programmes'),
            });
    }

    private loadTaches(userId: number) {
        this.http
            .get<TacheDetailDTO[]>(`https://redboost.tn/api/backoffice/programmes/user/${userId}/taches`)
            .subscribe({
                next: (data) => {
                    this.mesTaches = data;
                    this.updateCount('taches', data.length);
                    this.previousTacheIds = new Set(data.map(t => t.id));
                    if (this.taskIdFromRoute) {
                        this.highlightAndScrollToTask(this.taskIdFromRoute);
                    }
                },
                error: () => (this.errorMessage = 'Erreur lors du chargement des tâches'),
                complete: () => this.checkLoadingComplete(),
            });
    }

    private loadActivites(userId: number) {
        this.http
            .get<ActiviteDetailDTO[]>(`https://redboost.tn/api/backoffice/programmes/user/${userId}/activites`)
            .subscribe({
                next: (data) => {
                    this.mesActivites = data;
                    this.updateCount('activites', data.length);
                    this.previousActiviteIds = new Set(data.map(a => a.id));
                },
                error: () => (this.errorMessage = 'Erreur lors du chargement des activités'),
                complete: () => this.checkLoadingComplete(),
            });
    }

    private highlightAndScrollToTask(taskId: number) {
        const task = this.mesTaches.find(t => t.id === taskId);
        if (!task) return;
        this.highlightedTaskId = taskId;
        setTimeout(() => {
            const element = document.getElementById(`task-${taskId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => { this.highlightedTaskId = null; }, 5000);
            }
        }, 500);
    }

    private loadingCounter = 0;
    private checkLoadingComplete() {
        this.loadingCounter++;
        if (this.loadingCounter >= 2) this.loading = false;
    }

    updateCount(tab: 'taches' | 'activites', count: number) {
        const t = this.tabs.find((x) => x.id === tab);
        if (t) t.count = count;
    }

    get filteredTaches(): TacheDetailDTO[] {
        return this.mesTaches.filter((tache) => {
            if (this.searchTerm.trim()) {
                const term = this.searchTerm.toLowerCase();
                const matchesSearch =
                    tache.titre.toLowerCase().includes(term) ||
                    (tache.description || '').toLowerCase().includes(term) ||
                    tache.activiteNom.toLowerCase().includes(term) ||
                    tache.programmeNom.toLowerCase().includes(term);
                if (!matchesSearch) return false;
            }
            if (this.selectedProgrammeId !== null) {
                const prog = this.programmes.find(p => p.id === this.selectedProgrammeId);
                if (prog && tache.programmeNom !== prog.nom) return false;
            }
            if (this.selectedStatus !== 'TOUS' && tache.status !== this.selectedStatus) return false;
            return true;
        });
    }

    onFilterChange() {}

    getActivityColor(index: number): string {
        return this.activityColors[index % this.activityColors.length];
    }

    getCompletedTasksCount() { return this.mesTaches.filter(t => t.status === 'TERMINEE').length; }
    getInProgressTasksCount() { return this.mesTaches.filter(t => t.status === 'EN_COURS').length; }
    getHighPriorityTasksCount() { return this.mesTaches.filter(t => t.priorite === 'Haute').length; }
    countCompletedInActivity(act: ActiviteDetailDTO) { return act.taches.filter(t => t.status === 'TERMINEE').length; }

    getStatusIcon(status: string) {
        return status === 'TERMINEE' ? 'check_circle'
             : status === 'EN_RETARD' ? 'error'
             : status === 'EN_COURS' ? 'access_time'
             : 'radio_button_unchecked';
    }

    getStatusIconColor(status: string) {
        return status === 'TERMINEE' ? 'text-green-500'
             : status === 'EN_RETARD' ? 'text-red-500'
             : status === 'EN_COURS' ? 'text-blue-500'
             : 'text-gray-400';
    }

    getStatusLabel(status: string) {
        const labels: Record<string, string> = {
            EN_COURS: 'En cours',
            TERMINEE: 'Terminée',
            EN_RETARD: 'En retard',
            NON_DEMARREE: 'Non démarrée',
        };
        return labels[status] || status;
    }

    marquerTermine(tacheId: number) {
        this.http
            .patch<TacheDetailDTO>(`https://redboost.tn/api/backoffice/programmes/taches/${tacheId}/terminer`, {})
            .subscribe({
                next: (updated) => {
                    const idx = this.mesTaches.findIndex(t => t.id === tacheId);
                    if (idx > -1) this.mesTaches[idx] = updated;
                },
                error: () => alert('Erreur lors de la mise à jour'),
            });
    }

    rouvrirTache(tacheId: number) {
        this.http
            .patch<TacheDetailDTO>(`https://redboost.tn/api/backoffice/programmes/taches/${tacheId}/rouvrir`, {})
            .subscribe({
                next: (updated) => {
                    const idx = this.mesTaches.findIndex(t => t.id === tacheId);
                    if (idx > -1) this.mesTaches[idx] = updated;
                },
                error: () => alert('Erreur lors de la réouverture'),
            });
    }

    openActivityModal(activite: ActiviteDetailDTO) {
        this.selectedActivite = activite;
        this.showActivityModal = true;
    }

    closeActivityModal() {
        this.showActivityModal = false;
        this.selectedActivite = null;
    }
}