// src/app/pages/backoffice/programmes/prog_kpi_list.component.ts

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KpiWithStatus, ProgrammeService } from '../../programme.service';
import { KpiManagementComponent } from '../kpi-management/kpi-management.component';
import { SprintManagementComponent } from '../sprint-management/sprint-management.component';
import { RapportRedactionComponent } from '../workflow/rapport.component';

interface KpiGroup {
  title: string;
  isGlobal: boolean;
  attachedCount: number;
  totalCount: number;
  kpis: KpiWithStatus[];
}

@Component({
    selector: 'app-last-programme-kpi-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatProgressSpinnerModule,
        KpiManagementComponent,
        SprintManagementComponent,
        RapportRedactionComponent,
    ],
    templateUrl: './prog-kpi-list.html',
    styleUrls: ['./prog-kpi-list.component.scss'],
})
export class LastProgrammeKpiListComponent implements OnInit {
    private route = inject(ActivatedRoute);
    protected service = inject(ProgrammeService);

    // Core signals
    programmeId = signal<number>(0);
    activeTab = signal<'kpi' | 'sprints' | 'rapport'>('sprints');
    kpiGroups = signal<KpiGroup[]>([]);

    // Programme
    programme = signal<any>(null);
    programmeLoading = signal(true);
    programmeStartDate = signal<string>('');
    programmeEndDate = signal<string>('');

    // Deep-link signals — passed down as @Input to SprintManagementComponent.
    // Populated from query params: ?tab=sprints&sprintId=X&activiteId=Y&tacheId=Z
    // The URL stays at /programme/:id — no route change occurs.
    deepLinkSprintId   = signal<number | null>(null);
    deepLinkActiviteId = signal<number | null>(null);
    deepLinkTacheId    = signal<number | null>(null);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.programmeId.set(+id);
            this.loadProgramme();
            this.loadKpis();
        }

        // Subscribe to query params so deep-link works both on first load
        // and when navigating from another page (e.g. Mes Tâches).
        this.route.queryParams.subscribe(params => {
            // Switch to the sprints tab if requested
            if (params['tab'] === 'sprints') {
                this.activeTab.set('sprints');
            }

            // Store the three IDs — SprintManagementComponent reads these
            // via @Input and handles expand + scroll + highlight internally.
            this.deepLinkSprintId.set(params['sprintId']   ? +params['sprintId']   : null);
            this.deepLinkActiviteId.set(params['activiteId'] ? +params['activiteId'] : null);
            this.deepLinkTacheId.set(params['tacheId']    ? +params['tacheId']    : null);
        });
    }

    loadProgramme() {
        this.programmeLoading.set(true);
        this.service.getProgrammeById(this.programmeId()).subscribe({
            next: (data) => {
                this.programme.set(data);
                if (data.dateDebut) this.programmeStartDate.set(data.dateDebut);
                if (data.dateFin)   this.programmeEndDate.set(data.dateFin);
                this.programmeLoading.set(false);
            },
            error: (err) => {
                console.error('Erreur chargement programme', err);
                this.programmeLoading.set(false);
            },
        });
    }

    loadKpis() {
        this.service.getKpisDetail(this.programmeId()).subscribe({
            next: (kpisData: Record<string, KpiWithStatus[]>) => {
                const groups: KpiGroup[] = Object.entries(kpisData).map(([categoryName, kpis]) => {
                    const isGlobal      = kpis.length > 0 && kpis[0].isGlobal;
                    const attachedCount = kpis.filter(k => k.isAttached).length;
                    return {
                        title: categoryName,
                        isGlobal,
                        attachedCount,
                        totalCount: kpis.length,
                        kpis,
                    };
                });
                this.kpiGroups.set(groups);
            },
            error: (err) => console.error('❌ Erreur chargement KPIs', err),
        });
    }

    getResponsableName(id?: number): string {
        if (!id) return 'Non assigné';
        const user = this.service.responsables().find(u => u.id === id);
        return user ? user.fullName : 'Inconnu';
    }

    onKpiSelectionChanged() {
        this.loadKpis();
    }

    selectedKpiCount = computed(() =>
        this.kpiGroups().reduce((total, group) =>
            total + group.kpis.filter(k => k.isAttached && !k.isGlobal).length, 0)
    );

    totalKpiCount = computed(() =>
        this.kpiGroups().reduce((total, group) =>
            total + group.kpis.filter(k => !k.isGlobal).length, 0)
    );
}