// src/app/pages/backoffice/programmes/Gestion_sprint/sprint-management/sprint-management.component.ts

import {
    Component,
    HostListener,
    inject,
    Input,
    OnInit,
    OnChanges,
    SimpleChanges,
    signal,
    ElementRef,
} from '@angular/core';
// Add to existing imports at the top of the file
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { ProgrammeService } from '../../programme.service';
import { Sprint, Activite, Tache } from '../../../../../models/programme';
import { SprintModalComponent } from '../dialogs/sprint-dialog';
import { ActivityModalComponent } from '../dialogs/activity-dialog';
import { TaskModalComponent } from '../dialogs/tache-dialog';
import { DocumentUploadDialogComponent } from '../dialogs/document-upload-dialog.component';
import { ActivityDocumentUploadDialogComponent } from '../dialogs/activity-document.component';
import { TaskViewDetailsComponent } from "../dialogs/task-detail/task-detail";

@Component({
    selector: 'app-sprint-management',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        FormsModule,
        DatePipe,
        DragDropModule,          // ← add this
        SprintModalComponent,
        ActivityModalComponent,
        TaskModalComponent,
        DocumentUploadDialogComponent,
        ActivityDocumentUploadDialogComponent,
        TaskViewDetailsComponent,
    ],
    templateUrl: './sprint-management.component.html',
    styleUrls: ['./sprint-management.component.scss'],
})
export class SprintManagementComponent implements OnInit, OnChanges {
    @Input() programmeId!: number;
    @Input() programmeStartDate: string = '';
    @Input() programmeEndDate: string = '';

    // ─── Deep-link inputs ────────────────────────────────────────────────────
    // Set by the parent (LastProgrammeKpiListComponent) when navigating from
    // "Mes Tâches" via ?tab=sprints&sprintId=X&activiteId=Y&tacheId=Z.
    // When present, we auto-expand the matching sprint + activité and scroll
    // to the task row after the sprint list has been fetched.
    @Input() deepLinkSprintId: number | null = null;
    @Input() deepLinkActiviteId: number | null = null;
    @Input() deepLinkTacheId: number | null = null;
    // ─────────────────────────────────────────────────────────────────────────

    protected service = inject(ProgrammeService);
    private el = inject(ElementRef);

    // Sprints
    sprints = signal<any[]>([]);
    sprintsLoading = signal(true);
    expandedSprints = signal<number[]>([]);
    expandedActivites = signal<number[]>([]);

    // Highlighted task (visual pulse while deep-linking)
    highlightedTacheId = signal<number | null>(null);

    // Sprint Modal State
    showSprintModal = signal(false);
    currentSprint = signal<Partial<Sprint> | null>(null);

    // Activity Modal State
    currentSprintId = signal<number | null>(null);
    showActivityModal = signal(false);
    currentActivity = signal<Partial<Activite> | null>(null);

    // Task Modal State
    currentActiviteId = signal<number | null>(null);
    showTacheModal = signal(false);
    currentTask = signal<Partial<Tache> | null>(null);

    // KPI Lists
    optionnelKpis = signal<any[]>([]);
    currentActivityKpis = signal<any[]>([]);

    // Other
    statusMenuOpen = signal<number | null>(null);

    // Document Upload State
    showDocumentUploadDialog = signal(false);
    currentSprintForDocuments = signal<number | null>(null);
    uploadingDocuments = signal(false);

    // Activity Document State
    showActivityDocumentUploadDialog = signal(false);
    currentActivityForDocuments = signal<number | null>(null);
    uploadingActivityDocuments = signal(false);

    // Error handling signals
    sprintValidationError = signal<string | null>(null);
    activityValidationError = signal<string | null>(null);
    tacheValidationError = signal<string | null>(null);

    showTaskViewModal = signal(false);
    currentTaskForView = signal<any>(null);
    taskViewComponentRef = signal<TaskViewDetailsComponent | null>(null);

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    ngOnInit(): void {
        this.loadSprints();
        this.loadOptionnelKpis();
    }

    /**
     * Called whenever the parent updates any @Input().
     * If the deep-link IDs change (e.g. user clicks a second task while already
     * on the page), re-apply the expand + scroll logic.
     */
    ngOnChanges(changes: SimpleChanges): void {
        const deepLinkChanged =
            changes['deepLinkSprintId'] ||
            changes['deepLinkActiviteId'] ||
            changes['deepLinkTacheId'];

        if (deepLinkChanged && this.deepLinkSprintId && !this.sprintsLoading()) {
            // Sprints already loaded — apply immediately
            this.applyDeepLink();
        }
        // If sprints are still loading, applyDeepLink() is called from
        // inside loadSprints() once the data arrives.
    }

    // ─── Deep-link helpers ───────────────────────────────────────────────────

    /**
     * Expand the target sprint + activité, highlight the task, and scroll to it.
     * Safe to call even if some IDs are null (graceful no-op for missing IDs).
     */
    private applyDeepLink(): void {
    if (!this.deepLinkSprintId) return;

    // 1. Expand the sprint
    this.expandedSprints.update(list =>
        list.includes(this.deepLinkSprintId!)
            ? list
            : [...list, this.deepLinkSprintId!]
    );

    // 2. One tick later so *ngIf renders the expanded content
    setTimeout(() => {
        if (this.deepLinkActiviteId) {
            // Expand the activité
            this.expandedActivites.update(list =>
                list.includes(this.deepLinkActiviteId!)
                    ? list
                    : [...list, this.deepLinkActiviteId!]
            );
        }

        // 3. Another tick so tâches render (if needed)
        setTimeout(() => {
            if (this.deepLinkTacheId) {
                // TACHE: scroll to task + highlight
                this.highlightedTacheId.set(this.deepLinkTacheId);
                this.scrollToElement(`task-${this.deepLinkTacheId}`);
                setTimeout(() => this.highlightedTacheId.set(null), 4000);

            } else if (this.deepLinkActiviteId) {
                // ACTIVITE: scroll to activité header
                this.scrollToElement(`activite-${this.deepLinkActiviteId}`);

            } else {
                // SPRINT only: scroll to the sprint card and briefly highlight it
                this.scrollToElement(`sprint-${this.deepLinkSprintId}`);
            }
        }, 300);
    }, 150);
}

    /** Smooth-scroll to a DOM element by id. Falls back silently if not found. */
    private scrollToElement(id: string): void {
        // Look inside this component's host first, then fall back to document
        const el: HTMLElement | null =
            (this.el.nativeElement as HTMLElement).querySelector(`#${id}`) ??
            document.getElementById(id);

        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // ─── Data loading ────────────────────────────────────────────────────────



onSprintDrop(event: CdkDragDrop<any[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    // Optimistic UI update
    this.sprints.update(list => {
        const updated = [...list];
        moveItemInArray(updated, event.previousIndex, event.currentIndex);
        return updated;
    });

    // Persist to backend
    const orderedIds = this.sprints().map(s => s.id);
    this.service.reorderSprints(orderedIds).subscribe({
        error: () => {
            // Rollback: re-fetch from DB if the call fails
            this.loadSprints();
        }
    });
}

    loadOptionnelKpis() {
        this.service.getOptionnelKpis(this.programmeId).subscribe({
            next: (data) => this.optionnelKpis.set(data),
            error: (err) => console.error('Error loading optionnel KPIs', err),
        });
    }

    loadSprints() {
        this.sprintsLoading.set(true);
        this.service.getSprintsWithDetails(this.programmeId).subscribe({
            next: (data) => {
                this.sprints.set(data);
                this.sprintsLoading.set(false);

                // Apply deep-link once we have data
                if (this.deepLinkSprintId) {
                    this.applyDeepLink();
                }
            },
            error: (err) => {
                console.error('Error loading Sprints', err);
                this.sprintsLoading.set(false);
            },
        });
    }

    // ─── Sprint expand/collapse ───────────────────────────────────────────────

    toggleSprint(id: number) {
        this.expandedSprints.update((list) =>
            list.includes(id) ? list.filter((i) => i !== id) : [...list, id]
        );
    }

    toggleActivite(id: number) {
        this.expandedActivites.update((list) =>
            list.includes(id) ? list.filter((i) => i !== id) : [...list, id]
        );
    }

    // ─── Status helpers ───────────────────────────────────────────────────────

    getStatusLabel(sprint: any): string {
    if (sprint.status === 'TERMINEE') return 'Terminé';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(sprint.dateFin || sprint.dateLimite); end.setHours(0, 0, 0, 0);
    const start = new Date(sprint.dateDebut); start.setHours(0, 0, 0, 0);
    if (today > end) return 'En retard';
    if (today >= start && today <= end) return 'En cours';
    return 'À venir';
}


   isLate(sprint: any): boolean {
    if (sprint.status === 'TERMINEE') return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(sprint.dateFin || sprint.dateLimite); end.setHours(0, 0, 0, 0);
    return today > end;
}

    isActivityLate(act: any): boolean {
        if (act.status === 'TERMINEE') return false;
        return (act.retardJours || 0) > 0;
    }

    isDone(sprint: any): boolean {
        return sprint.status === 'TERMINEE';
    }

    getDelayDays(sprint: any): number {
        return sprint.retardJours || 0;
    }

    getSprintProgress(sprint: any): number {
        return sprint.progression || 0;
    }

    getActivityProgress(act: any): number {
        return act.progression || 0;
    }

    getResponsableName(id?: number): string {
        if (!id) return 'Non assigné';
        const user = this.service.responsables().find((u) => u.id === id);
        return user ? user.fullName : 'Inconnu';
    }

    formatStatus(status: string): string {
        const map: Record<string, string> = {
            NON_DEMARREE: 'Non démarrée',
            EN_COURS: 'En cours',
            BLOQUE: 'Bloqué',
            EN_RETARD: 'En retard',
            TERMINEE: 'Terminée',
        };
        return map[status] || status;
    }

    getSprintStatusBadge(sprint: any): string {
    if (sprint.status === 'TERMINEE') return 'bg-green-500 text-white';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(sprint.dateFin || sprint.dateLimite); end.setHours(0, 0, 0, 0);
    const start = new Date(sprint.dateDebut); start.setHours(0, 0, 0, 0);
    if (today > end) return 'bg-red-500 text-white';
    if (today >= start && today <= end) return 'bg-[#2a7b8c] text-white';
    return 'bg-gray-500 text-white';
}

    getActivityStatusBadge(activity: any): string {
        if (activity.status === 'TERMINEE') return 'bg-green-500 text-white text-xs';
        if (this.isActivityLate(activity)) return 'bg-red-500 text-white text-xs';
        if (activity.status === 'NON_DEMARREE') return 'bg-gray-500 text-white text-xs'; // ← add this
        return 'bg-[#2a7b8c] text-white text-xs';
    }

    getTaskStatusBadge(task: any): string {
        if (task.status === 'TERMINEE') return 'bg-green-500 text-white text-xs';
        if (this.isTaskLate(task)) return 'bg-red-500 text-white text-xs';
        if (task.status === 'BLOQUE') return 'bg-orange-600 text-white text-xs';
        if (task.status === 'EN_COURS') return 'bg-[#2a7b8c] text-white text-xs';
        return 'text-gray-600 text-xs';
    }

    getPriorityBadge(priority: string): string {
        const map: Record<string, string> = {
            Haute: 'text-red-600 border-red-300 text-xs',
            Moyenne: 'text-orange-600 border-orange-300 text-xs',
            Basse: 'text-blue-600 border-blue-300 text-xs',
            high: 'text-red-600 border-red-300 text-xs',
            medium: 'text-orange-600 border-orange-300 text-xs',
            low: 'text-blue-600 border-blue-300 text-xs',
        };
        return map[priority] || 'text-gray-600 border-gray-300 text-xs';
    }

    isTaskLate(tache: any): boolean {
    if (tache.status === 'TERMINEE') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // strip time → midnight
    const limit = new Date(tache.dateLimite);
    limit.setHours(0, 0, 0, 0); // strip time → midnight
    return today > limit; // only late if strictly AFTER the deadline day
}

    getTaskDelayDays(tache: any): number {
    if (tache.status === 'TERMINEE') return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(tache.dateLimite);
    limit.setHours(0, 0, 0, 0);
    const diff = today.getTime() - limit.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

    // ─── Checkbox toggle ─────────────────────────────────────────────────────

    toggleTacheStatus(tache: any) {
        const newStatus: 'TERMINEE' | 'EN_COURS' =
            tache.status === 'TERMINEE' ? 'EN_COURS' : 'TERMINEE';

        const tacheToSave = {
            id: tache.id,
            titre: tache.titre,
            description: tache.description,
            responsableId: tache.responsableId ? Number(tache.responsableId) : undefined,
            priorite: tache.priorite,
            dateDebut: tache.dateDebut,
            dateLimite: tache.dateLimite,
            difficulte: tache.difficulte,
            status: newStatus,
        };

        const kpiIds = (tache.tachesKpis || tache.kpis || []).map(
            (tk: any) => tk.kpiId || tk.id
        );

        this.service.updateTache(tache.id!, tacheToSave, kpiIds).subscribe({
            next: () => {
                tache.status = newStatus;
                this.calculateRealTimeProgressAndStatus();
            },
            error: (err) => console.error('Error updating tache status', err),
        });
    }

    // ─── Real-time progress recalculation ────────────────────────────────────

    private calculateRealTimeProgressAndStatus() {
        const now = new Date();
        this.sprints.update((sprints) =>
            sprints.map((sprint) => {
                const activites = sprint.activites?.map((act: any) => {
                    const total = act.taches?.length || 0;
                    let progression = 0;
                    let actStatus = act.status;
                    if (total > 0) {
                        const done = act.taches.filter((t: any) => t.status === 'TERMINEE').length;
                        progression = Math.round((done / total) * 100);
                        actStatus = done === total ? 'TERMINEE' : 'EN_COURS';
                    }
                    const actEnd = new Date(act.dateFin || act.dateLimite);
                    const retardJours =
                        actStatus !== 'TERMINEE' && now > actEnd
                            ? Math.ceil((now.getTime() - actEnd.getTime()) / 86400000)
                            : 0;
                    return { ...act, progression, status: actStatus, retardJours };
                }) || [];

                const totalActs = activites.length;
                let sprintProgression = sprint.progression;
                let sprintStatus = sprint.status;
                if (totalActs > 0) {
                    sprintProgression = Math.round(
                        activites.reduce((s: number, a: any) => s + (a.progression || 0), 0) / totalActs
                    );
                    const doneActs = activites.filter((a: any) => a.status === 'TERMINEE').length;
                    sprintStatus = doneActs === totalActs ? 'TERMINEE' : 'EN_COURS';
                }
                const sprintEnd = new Date(sprint.dateFin || sprint.dateLimite);
                const retardJours =
                    sprintStatus !== 'TERMINEE' && now > sprintEnd
                        ? Math.ceil((now.getTime() - sprintEnd.getTime()) / 86400000)
                        : 0;
                return { ...sprint, activites, progression: sprintProgression, status: sprintStatus, retardJours };
            })
        );
    }

    // ─── Sprint CRUD ──────────────────────────────────────────────────────────

    openSprintModal(sprint?: any) {
        this.currentSprint.set(sprint
            ? { ...sprint, dateDebut: this.convertToInputDate(sprint.dateDebut), dateLimite: this.convertToInputDate(sprint.dateFin || sprint.dateLimite) }
            : {}
        );
        this.showSprintModal.set(true);
    }

    closeSprintModal() {
        this.showSprintModal.set(false);
        this.currentSprint.set(null);
        this.sprintValidationError.set(null);
    }

    onSaveSprint(sprintData: Partial<Sprint>) {
        this.sprintValidationError.set(null);
        const dto = {
            nom: sprintData.nom,
            description: sprintData.description,
            dateDebut: this.convertToISODate(sprintData.dateDebut),
            dateLimite: this.convertToISODate(sprintData.dateLimite),
            status: sprintData.status || 'EN_COURS',
        };
        const req = sprintData.id
            ? this.service.updateSprint(sprintData.id, dto as Sprint)
            : this.service.createSprint(this.programmeId, dto as Sprint);

        req.subscribe({
            next: () => { this.loadSprints(); this.closeSprintModal(); },
            error: (err) => this.sprintValidationError.set(err.error?.message || err.message || 'Erreur sprint'),
        });
    }

    deleteSprint(id: number) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce sprint ?')) {
            this.service.deleteSprint(id).subscribe({ next: () => this.loadSprints() });
        }
    }

    // ─── Activity CRUD ────────────────────────────────────────────────────────

    openActivityModal(sprintId: number, activity?: any) {
        this.currentSprintId.set(sprintId);
        this.currentActivity.set(activity
            ? { ...activity, dateDebut: this.convertToInputDate(activity.dateDebut), dateLimite: this.convertToInputDate(activity.dateFin || activity.dateLimite), kpis: activity.kpis || [] }
            : {} as Activite
        );
        this.showActivityModal.set(true);
    }

    closeActivityModal() {
        this.showActivityModal.set(false);
        this.currentActivity.set(null);
        this.activityValidationError.set(null);
    }

    onSaveActivity(data: { activity: Partial<Activite>; kpiIds: number[] }) {
        this.activityValidationError.set(null);
        const dto = {
            nom: data.activity.nom,
            description: data.activity.description,
            type: data.activity.type,
            dateDebut: this.convertToISODate(data.activity.dateDebut),
            dateLimite: this.convertToISODate(data.activity.dateLimite),
            status: data.activity.status || 'EN_COURS',
            responsableId: data.activity.responsableId,
        };
        const req = data.activity.id
            ? this.service.updateActivity(data.activity.id, dto as Activite, data.kpiIds)
            : this.service.createActivity(this.programmeId, this.currentSprintId()!, dto as Activite, data.kpiIds);

        req.subscribe({
            next: () => { this.loadSprints(); this.closeActivityModal(); },
            error: (err) => this.activityValidationError.set(err.error?.message || err.message || 'Erreur activité'),
        });
    }

    deleteActivity(id: number) {
        if (confirm('Supprimer cette activité ?')) {
            this.service.deleteActivity(id).subscribe({ next: () => this.loadSprints() });
        }
    }

    // ─── Task CRUD ────────────────────────────────────────────────────────────

    openTacheModal(activityId: number, tache?: any) {
        this.currentActiviteId.set(activityId);
        this.service.getActivityKpis(activityId).subscribe({
            next: (kpis) => {
                this.currentActivityKpis.set(kpis);
                if (tache?.id) {
                    this.service.getTacheDocuments(tache.id).subscribe({
                        next: (docs) => { this.currentTask.set({ ...tache, dateDebut: this.convertToInputDate(tache.dateDebut), dateLimite: this.convertToInputDate(tache.dateLimite), kpis: tache.kpis || [], documents: docs }); this.showTacheModal.set(true); },
                        error: () => { this.currentTask.set({ ...tache, dateDebut: this.convertToInputDate(tache.dateDebut), dateLimite: this.convertToInputDate(tache.dateLimite), kpis: tache.kpis || [], documents: [] }); this.showTacheModal.set(true); },
                    });
                } else if (tache) {
                    this.currentTask.set({ ...tache, dateDebut: this.convertToInputDate(tache.dateDebut), dateLimite: this.convertToInputDate(tache.dateLimite), kpis: tache.kpis || [], documents: [] });
                    this.showTacheModal.set(true);
                } else {
                    this.currentTask.set({});
                    this.showTacheModal.set(true);
                }
            },
            error: () => { this.currentActivityKpis.set([]); this.showTacheModal.set(true); },
        });
    }

    closeTacheModal() {
        this.showTacheModal.set(false);
        this.currentTask.set(null);
        this.tacheValidationError.set(null);
    }

    onSaveTask(data: { task: Partial<Tache>; kpiIds: number[]; files?: File[] }) {
        this.tacheValidationError.set(null);
        let sprintId: number | undefined;
        for (const sprint of this.sprints()) {
            if (sprint.activites?.find((a: any) => a.id === this.currentActiviteId())) {
                sprintId = sprint.id;
                break;
            }
        }
        const taskToSave = {
            ...data.task,
            responsableId: data.task.responsableId ? Number(data.task.responsableId) : undefined,
            dateDebut: this.convertToISODate(data.task.dateDebut),
            dateLimite: this.convertToISODate(data.task.dateLimite),
        };

        const afterSave = (taskId: number) => {
            if (data.files?.length) {
                this.service.uploadTacheDocuments(taskId, data.files).subscribe({
                    next: () => { this.loadSprints(); this.closeTacheModal(); },
                    error: () => { this.loadSprints(); this.closeTacheModal(); },
                });
            } else {
                this.calculateRealTimeProgressAndStatus();
                this.loadSprints();
                this.closeTacheModal();
            }
        };

        if (data.task.id) {
            this.service.updateTache(data.task.id, taskToSave as Tache, data.kpiIds).subscribe({
                next: (t) => afterSave(t.id!),
                error: (err) => this.tacheValidationError.set(err.error?.message || err.message || 'Erreur tâche'),
            });
        } else if (sprintId) {
            this.service.createTache(this.programmeId, sprintId, this.currentActiviteId()!, taskToSave as Tache, data.kpiIds).subscribe({
                next: (t) => afterSave(t.id!),
                error: (err) => this.tacheValidationError.set(err.error?.message || err.message || 'Erreur tâche'),
            });
        } else {
            this.tacheValidationError.set('Impossible de trouver le sprint parent');
        }
    }

    onDeleteTacheDocument(documentId: number) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
        this.service.deleteTacheDocument(documentId).subscribe({
            next: () => {
                const t = this.currentTask();
                if (t?.documents) this.currentTask.set({ ...t, documents: t.documents.filter((d: any) => d.id !== documentId) });
                this.loadSprints();
            },
            error: () => alert('Erreur lors de la suppression du document'),
        });
    }

    deleteTache(id: number) {
        if (confirm('Supprimer cette tâche ?')) {
            this.service.deleteTache(id).subscribe({ next: () => this.loadSprints() });
        }
    }

    // ─── Document management ──────────────────────────────────────────────────

    openDocumentUploadDialog(sprintId: number) {
        this.currentSprintForDocuments.set(sprintId);
        this.showDocumentUploadDialog.set(true);
    }

    closeDocumentUploadDialog() {
        this.showDocumentUploadDialog.set(false);
        this.currentSprintForDocuments.set(null);
        this.uploadingDocuments.set(false);
    }

    onUploadDocuments(files: File[]) {
        const sprintId = this.currentSprintForDocuments();
        if (!sprintId) return;
        this.uploadingDocuments.set(true);
        this.service.uploadSprintDocuments(sprintId, files).subscribe({
            next: () => { this.loadSprints(); this.closeDocumentUploadDialog(); },
            error: () => { this.uploadingDocuments.set(false); alert('Erreur téléchargement'); },
        });
    }

    deleteDocument(documentId: number, _sprintId: number) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
            this.service.deleteSprintDocument(documentId).subscribe({ next: () => this.loadSprints() });
        }
    }

    openActivityDocumentUploadDialog(activityId: number) {
        this.currentActivityForDocuments.set(activityId);
        this.showActivityDocumentUploadDialog.set(true);
    }

    closeActivityDocumentUploadDialog() {
        this.showActivityDocumentUploadDialog.set(false);
        this.currentActivityForDocuments.set(null);
        this.uploadingActivityDocuments.set(false);
    }

    onUploadActivityDocuments(files: File[]) {
        const activityId = this.currentActivityForDocuments();
        if (!activityId) return;
        this.uploadingActivityDocuments.set(true);
        this.service.uploadActivityDocuments(activityId, files).subscribe({
            next: () => { this.loadSprints(); this.closeActivityDocumentUploadDialog(); },
            error: () => { this.uploadingActivityDocuments.set(false); alert('Erreur téléchargement'); },
        });
    }

    deleteActivityDocument(documentId: number, _activityId: number) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
            this.service.deleteActivityDocument(documentId).subscribe({ next: () => this.loadSprints() });
        }
    }

    // ─── Task view details ────────────────────────────────────────────────────

    openTaskViewDetails(task: any, event: Event) {
        event.stopPropagation();
        if (task.id) {
            this.service.getTacheDocuments(task.id).subscribe({
                next: (docs) => { this.currentTaskForView.set({ ...task, documents: docs }); this.showTaskViewModal.set(true); },
                error: () => { this.currentTaskForView.set({ ...task, documents: [] }); this.showTaskViewModal.set(true); },
            });
        } else {
            this.currentTaskForView.set(task);
            this.showTaskViewModal.set(true);
        }
    }

    closeTaskViewDetails() {
        this.showTaskViewModal.set(false);
        this.currentTaskForView.set(null);
    }

    onEditFromView() {
        const task = this.currentTaskForView();
        if (!task) return;
        this.closeTaskViewDetails();
        let activityId: number | null = null;
        for (const sprint of this.sprints()) {
            for (const activity of sprint.activites || []) {
                if (activity.taches?.find((t: any) => t.id === task.id)) { activityId = activity.id; break; }
            }
            if (activityId) break;
        }
        if (activityId) this.openTacheModal(activityId, task);
    }

    onRemoveDocumentFromView(document: any) {
        if (!document.id) return;
        this.service.deleteTacheDocument(document.id).subscribe({
            next: () => {
                const t = this.currentTaskForView();
                if (t?.documents) this.currentTaskForView.set({ ...t, documents: t.documents.filter((d: any) => d.id !== document.id) });
                const ref = this.taskViewComponentRef();
                if (ref) ref.resetDeleteState(document.id);
                this.loadSprints();
            },
            error: () => {
                alert('Erreur lors de la suppression du document');
                const ref = this.taskViewComponentRef();
                if (ref) ref.resetDeleteState(document.id);
            },
        });
    }

    onUploadDocumentsFromView(files: File[]) {
        const task = this.currentTaskForView();
        if (!task?.id) return;
        this.service.uploadTacheDocuments(task.id, files).subscribe({
            next: (uploadedDocs) => {
                const t = this.currentTaskForView();
                if (t) this.currentTaskForView.set({ ...t, documents: [...(t.documents || []), ...uploadedDocs] });
                const ref = this.taskViewComponentRef();
                if (ref) ref.resetUploadState();
                this.loadSprints();
            },
            error: () => {
                alert('Erreur lors du téléchargement des documents');
                const ref = this.taskViewComponentRef();
                if (ref) ref.resetUploadState();
            },
        });
    }

    // ─── Utility ──────────────────────────────────────────────────────────────

    groupKpisByCategory(kpis: any[]) {
        const grouped = new Map<string, { name: string; color: string; kpis: any[] }>();
        kpis.forEach((kpi) => {
            const name = kpi.categoryNom || 'Sans catégorie';
            if (!grouped.has(name)) grouped.set(name, { name, color: kpi.categoryCouleur || '#94a3b8', kpis: [] });
            grouped.get(name)!.kpis.push(kpi);
        });
        return Array.from(grouped.values());
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('fr-FR');
    }

    toggleStatusMenu(activityId: number) {
        this.statusMenuOpen.set(this.statusMenuOpen() === activityId ? null : activityId);
    }

    @HostListener('document:click')
    closeStatusMenu() {
        this.statusMenuOpen.set(null);
    }

    changeActivityStatus(activity: any, newStatus: 'EN_COURS' | 'TERMINEE') {
        activity.status = newStatus;
        this.statusMenuOpen.set(null);
    }

    getDocumentIcon(type: string): string {
        if (type.includes('pdf')) return 'picture_as_pdf';
        if (type.includes('word')) return 'description';
        if (type.includes('excel') || type.includes('spreadsheet')) return 'table_chart';
        if (type.includes('image')) return 'image';
        return 'insert_drive_file';
    }

    private convertToISODate(date: any): string {
        if (!date) return '';
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
            const [d, m, y] = date.split('/');
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        if (date instanceof Date) return date.toISOString().split('T')[0];
        return date;
    }

    private convertToInputDate(date: any): string {
        if (!date) return '';
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
            const [d, m, y] = date.split('/');
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        if (date instanceof Date) return date.toISOString().split('T')[0];
        return date;
    }
}