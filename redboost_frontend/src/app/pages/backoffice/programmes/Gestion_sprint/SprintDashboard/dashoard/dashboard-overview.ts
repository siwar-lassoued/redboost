import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProgrammeService } from '../../../programme.service';
import { Programme } from '../../../../../../models/programme';
import { SprintManagerComponent } from '../sprints/sprint-management';

interface MetricCard {
    iconName: string;
    title: string;
    value: string;
    subtitle: string;
    percentage?: number;
    badge: string;
    badgeClass: string;
    color: string;
}

interface Alert {
    title: string;
    description: string;
    days: string;
}

interface Stats {
    totalActivities: number;
    completedActivities: number;
    inProgressActivities: number;
    totalTasks: number;
    completedTasks: number;
    remainingTasks: number;
    teamMembers: number;
}

interface GlobalStatistics {
    deadlineCompliance: {
        sprints:  { late: number; onTime: number };
        activites: { late: number; onTime: number };
        taches:   { late: number; onTime: number };
    };
    kpiCompletionRate: number;
    respectDelaisRate: number;
    objectifsDepassesRate: number;
}

@Component({
    selector: 'app-dashboard-overview',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        DatePipe,
        SprintManagerComponent,
    ],
    templateUrl: './dashboard-overview.html',
    styleUrls: ['./dashboard-overview.scss'],
})
export class DashboardViewComponent implements OnInit {
    protected service = inject(ProgrammeService);

    @ViewChild('sprintManager') sprintManager!: SprintManagerComponent;

    // ── UI state ──────────────────────────────────────────────────────────────
    activeTab      = signal<'dashboard' | 'sprints'>('dashboard');
    sprintsLoading = signal(true);

    // ── Raw data signals ──────────────────────────────────────────────────────
    sprints     = signal<any[]>([]);
    programmes  = signal<Programme[]>([]);
    alerts      = signal<Alert[]>([]);
    retardItems = signal<any>(null);
    globalStats = signal<GlobalStatistics | null>(null);

    // ── Derived stats (computed so they always reflect latest sprints) ────────
    stats = computed<Stats>(() => {
        const allActivities = this.sprints().flatMap((s) => s.activites || []);
        const allTasks      = allActivities.flatMap((a: any) => a.taches || []);

        return {
            totalActivities:      allActivities.length,
            completedActivities:  allActivities.filter((a: any) => a.status === 'TERMINEE').length,
            inProgressActivities: allActivities.filter((a: any) => a.status === 'EN_COURS').length,
            totalTasks:     allTasks.length,
            completedTasks: allTasks.filter((t: any) => t.status === 'TERMINEE').length,
            remainingTasks: allTasks.filter((t: any) => t.status !== 'TERMINEE').length,
            teamMembers: new Set(
                allActivities.map((a: any) => a.responsableId).filter(Boolean)
            ).size,
        };
    });

    // ── Metrics (computed — auto-updates when EITHER signal changes) ──────────
    metrics = computed<MetricCard[]>(() => {
        const s  = this.stats();
        const gs = this.globalStats();   // null until API responds

        const taskCompletionRate = s.totalTasks > 0
            ? Math.round((s.completedTasks / s.totalTasks) * 100)
            : 0;

        // Use real API values; fall back to 0 only while data is loading
        const kpiRate       = gs != null ? Math.round(gs.kpiCompletionRate)    : 0;
        const delayRate     = gs != null ? Math.round(gs.respectDelaisRate)    : 0;
        const objectifsRate = gs != null ? Math.round(gs.objectifsDepassesRate): 0;

        const totalLate = gs != null
            ? gs.deadlineCompliance.sprints.late
              + gs.deadlineCompliance.activites.late
              + gs.deadlineCompliance.taches.late
            : 0;

        const totalOnTime = gs != null
            ? gs.deadlineCompliance.sprints.onTime
              + gs.deadlineCompliance.activites.onTime
              + gs.deadlineCompliance.taches.onTime
            : 0;

        return [
            {
                iconName:  'trending_up',
                title:     'Objectifs dépassés !',
                value:     `${objectifsRate}%`,
                subtitle:  "d'atteinte",
                percentage: Math.min(objectifsRate, 100),
                badge:      objectifsRate > 0 ? `+${objectifsRate}%` : '0%',
                badgeClass: objectifsRate >= 100 ? 'success' : objectifsRate > 0 ? 'good' : 'warning',
                color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            },
            {
                iconName:  'track_changes',
                title:     "Taux d'atteinte KPI",
                value:     `${kpiRate}%`,
                subtitle:  'vs 100%',
                percentage: Math.min(kpiRate, 100),
                badge:      kpiRate >= 90 ? 'Excellent' : kpiRate >= 70 ? 'Bon' : 'À améliorer',
                badgeClass: kpiRate >= 90 ? 'excellent' : kpiRate >= 70 ? 'good' : 'warning',
                color: 'white',
            },
            {
                iconName:  'check_circle',
                title:     'Tâches réalisées',
                value:     `${s.completedTasks}`,
                subtitle:  `/${s.totalTasks}`,
                percentage: taskCompletionRate,
                badge:      `${taskCompletionRate}%`,
                badgeClass: taskCompletionRate >= 80 ? 'excellent' : taskCompletionRate >= 50 ? 'good' : 'warning',
                color: 'white',
            },
            {
                iconName:  'event_available',
                title:     'Respect des délais',
                value:     `${delayRate}%`,
                subtitle:  'conformité globale',
                percentage: delayRate,
                badge:      delayRate >= 70 ? 'Bon' : delayRate >= 50 ? 'Moyen' : 'Retard',
                badgeClass: delayRate >= 70 ? 'success' : delayRate >= 50 ? 'good' : 'warning',
                color: 'white',
            },
           {
    iconName:  'star',
    title:     'Qualité moyenne',
    value:     '4.5',
    subtitle:  '/5',
    percentage: 90,
    badge:      'Excellent',
    badgeClass: 'excellent',
    color: 'white',
},
        ];
    });

    // ── Active sprints (no done ones) ─────────────────────────────────────────
    activeInProgressSprints = computed(() =>
        this.sprints().filter(s => this.isActive(s) && !this.isDone(s))
    );

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.loadProgrammes();
        this.loadSprints();
        this.loadRetardItems();
        this.loadGlobalStatistics();
    }

    // ── Data loaders ──────────────────────────────────────────────────────────
    loadProgrammes() {
        this.service.getAllProgrammesBasic().subscribe({
            next:  (data) => this.programmes.set(data),
            error: (err)  => console.error('Error loading programmes', err),
        });
    }

    loadSprints() {
        this.sprintsLoading.set(true);
        this.service.getAllSprints().subscribe({
            next: (data) => {
                if (data && Array.isArray(data)) {
                    this.sprints.set(data.map((sprint) => ({
                        ...sprint,
                        dateFin:    sprint.dateFin    || sprint.dateDebut,
                        activites:  Array.isArray(sprint.activites)  ? sprint.activites  : [],
                        documents:  Array.isArray(sprint.documents)  ? sprint.documents  : [],
                    })));
                } else {
                    this.sprints.set([]);
                }
                this.sprintsLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading sprints', err);
                this.sprints.set([]);
                this.sprintsLoading.set(false);
            },
        });
    }

    loadRetardItems() {
        this.service.getRetardItems().subscribe({
            next: (data) => {
                this.retardItems.set(data);
                const newAlerts: Alert[] = [];
                if (data?.items) {
                    data.items.forEach((item: any) => {
                        const itemName = item.type === 'TACHE' ? item.titre : item.nom;
                        const itemDate = item.type === 'SPRINT' ? item.dateFin : item.dateLimite;
                        newAlerts.push({
                            title:       `${item.type}: ${itemName}`,
                            description: item.description || `Date limite: ${itemDate}`,
                            days:        `${item.daysLate} jour${item.daysLate > 1 ? 's' : ''}`,
                        });
                    });
                }
                this.alerts.set(newAlerts);
            },
            error: () => this.alerts.set([]),
        });
    }

    loadGlobalStatistics() {
        this.service.getGlobalStatistics().subscribe({
            next: (data: GlobalStatistics) => {
                console.log('Global statistics loaded:', data); // ← keep until confirmed working
                this.globalStats.set(data);
            },
            error: (err) => console.error('Error loading global statistics', err),
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    triggerNewSprint() {
        this.activeTab.set('sprints');
        setTimeout(() => this.sprintManager?.openSprintModal(), 0);
    }

    isLate(sprint: any): boolean {
        return new Date() > new Date(sprint.dateFin || sprint.dateLimite);
    }

    isActive(sprint: any): boolean {
        const now = new Date();
        return now >= new Date(sprint.dateDebut)
            && now <= new Date(sprint.dateFin || sprint.dateLimite);
    }

    isDone(sprint: any): boolean {
        return sprint.status === 'TERMINEE';
    }

    getStatusLabel(sprint: any): string {
        if (this.isDone(sprint))   return 'Terminé';
        if (this.isLate(sprint))   return 'En retard';
        if (this.isActive(sprint)) return 'En cours';
        return 'Non démarrée';
    }

    getSprintStatusClass(sprint: any): string {
        if (this.isDone(sprint))   return 'done';
        if (this.isLate(sprint))   return 'late';
        if (this.isActive(sprint)) return 'in-progress';
        return 'not-started';
    }

    getDelayDays(sprint: any): number  { return sprint.retardJours  || 0; }
    getSprintProgress(sprint: any): number { return sprint.progression || 0; }
}