import { Component, EventEmitter, input, Output, inject, signal, HostListener, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { ProgrammeService } from '../../../programme.service';
import { Programme, Sprint, Activite, Tache } from '../../../../../../models/programme';

// Import your Modals
import { GlobalSprintModalComponent } from '../modals/global-sprint-modal';
import { TaskModalComponent } from '../../../gestion_program/dialogs/tache-dialog';
import { DocumentUploadDialogComponent } from '../../../gestion_program/dialogs/document-upload-dialog.component';
import { ActivityDocumentUploadDialogComponent } from '../../../gestion_program/dialogs/activity-document.component';
import { GlobalActivityModalComponent } from '../modals/global-activity-modal';

@Component({
  selector: 'app-sprint-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FormsModule,
    DatePipe,
    TaskModalComponent,
    DocumentUploadDialogComponent,
    ActivityDocumentUploadDialogComponent,
    GlobalSprintModalComponent,
    GlobalActivityModalComponent,
  ],
  templateUrl: './sprint-management.html',
  styleUrls: ['./sprint-management.scss'],
})
export class SprintManagerComponent {
    protected service = inject(ProgrammeService);

    // Signal Inputs
    sprints = input<any[]>([]);
    programmes = input<Programme[]>([]);
    loading = input<boolean>(false);
    
    @Output() refresh = new EventEmitter<void>();

    // UI State
    expandedSprints = signal<number[]>([]);
    expandedActivites = signal<number[]>([]);
    statusMenuOpen = signal<number | null>(null);
    
    // Filter State
    searchQuery = signal<string>('');
    selectedStatus = signal<string>('all');
    selectedPeriod = signal<string>('all');
    selectedProgramme = signal<string>('all');
    selectedMember = signal<string>('all');

    // Modal State - Sprint
    showGlobalSprintModal = signal(false);
    currentSprint = signal<Partial<Sprint> | null>(null);
    sprintValidationError = signal<string | null>(null);

    // Modal State - Activity
    showGlobalActivityModal = signal(false);
    currentSprintId = signal<number | null>(null);
    currentActivity = signal<Partial<Activite> | null>(null);
    optionnelKpis = signal<any[]>([]);
    activityValidationError = signal<string | null>(null);

    // Modal State - Task
    showTacheModal = signal(false);
    currentActiviteId = signal<number | null>(null);
    currentTask = signal<Partial<Tache> | null>(null);
    currentActivityKpis = signal<any[]>([]);
    tacheValidationError = signal<string | null>(null);

    // Modal State - Documents
    showDocumentUploadDialog = signal(false);
    currentSprintForDocuments = signal<number | null>(null);
    uploadingDocuments = signal(false);

    showActivityDocumentUploadDialog = signal(false);
    currentActivityForDocuments = signal<number | null>(null);
    uploadingActivityDocuments = signal(false);

    // Computed filtered sprints - FIXED: Call sprints() as a function
    filteredSprints = computed(() => {
        let result = this.sprints(); // ✅ FIXED: Added () to call the signal
        
        // Search filter
        const query = this.searchQuery().toLowerCase();
        if (query) {
            result = result.filter(sprint => 
                sprint.nom?.toLowerCase().includes(query) ||
                sprint.description?.toLowerCase().includes(query)
            );
        }
        
        // Status filter
        const status = this.selectedStatus();
        if (status !== 'all') {
            result = result.filter(sprint => {
                switch(status) {
                    case 'en_cours':
                        return this.isActive(sprint) && !this.isDone(sprint);
                    case 'en_retard':
                        return this.isLate(sprint) && !this.isDone(sprint);
                    case 'termine':
                        return this.isDone(sprint);
                    case 'non_demarre':
                        return !this.isActive(sprint) && !this.isDone(sprint) && !this.isLate(sprint);
                    default:
                        return true;
                }
            });
        }
        
        // Programme filter
        const programme = this.selectedProgramme();
        if (programme !== 'all') {
            result = result.filter(sprint => sprint.programmeId?.toString() === programme);
        }
        
        // Period filter
        const period = this.selectedPeriod();
        if (period !== 'all') {
            const now = new Date();
            result = result.filter(sprint => {
                const startDate = new Date(sprint.dateDebut);
                const endDate = new Date(sprint.dateFin || sprint.dateLimite);
                
                switch(period) {
                    case 'cette_semaine':
                        return this.isThisWeek(startDate, endDate, now);
                    case 'ce_mois':
                        return this.isThisMonth(startDate, endDate, now);
                    case 'ce_trimestre':
                        return this.isThisQuarter(startDate, endDate, now);
                    default:
                        return true;
                }
            });
        }
        
        // Team member filter
        const member = this.selectedMember();
        if (member !== 'all') {
            result = result.filter(sprint => {
                return sprint.activites?.some((act: any) => 
                    act.responsableId?.toString() === member ||
                    act.taches?.some((t: any) => t.responsableId?.toString() === member)
                );
            });
        }
        
        return result;
    });

    // Period helper methods
    private isThisWeek(start: Date, end: Date, now: Date): boolean {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        return (start <= endOfWeek && end >= startOfWeek);
    }

    private isThisMonth(start: Date, end: Date, now: Date): boolean {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        return (start <= endOfMonth && end >= startOfMonth);
    }

    private isThisQuarter(start: Date, end: Date, now: Date): boolean {
        const quarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
        
        return (start <= endOfQuarter && end >= startOfQuarter);
    }

    // Get unique team members from sprints - FIXED: Call sprints() as a function
    getTeamMembers(): { id: number; name: string }[] {
        const memberSet = new Set<string>();
        const members: { id: number; name: string }[] = [];
        
        this.sprints().forEach(sprint => { // ✅ FIXED: Added () to call the signal
            sprint.activites?.forEach((act: any) => {
                if (act.responsableId) {
                    const key = `${act.responsableId}`;
                    if (!memberSet.has(key)) {
                        memberSet.add(key);
                        members.push({
                            id: act.responsableId,
                            name: this.getResponsableName(act.responsableId)
                        });
                    }
                }
                act.taches?.forEach((tache: any) => {
                    if (tache.responsableId) {
                        const key = `${tache.responsableId}`;
                        if (!memberSet.has(key)) {
                            memberSet.add(key);
                            members.push({
                                id: tache.responsableId,
                                name: this.getResponsableName(tache.responsableId)
                            });
                        }
                    }
                });
            });
        });
        
        return members.sort((a, b) => a.name.localeCompare(b.name));
    }

    // --- Sprint Logic ---
    openSprintModal(sprint?: any) {
        if (sprint) {
            this.currentSprint.set({
                ...sprint,
                dateDebut: this.convertToInputDate(sprint.dateDebut),
                dateLimite: this.convertToInputDate(sprint.dateFin || sprint.dateLimite),
            });
        } else {
            this.currentSprint.set(null);
        }
        this.showGlobalSprintModal.set(true);
    }

    closeGlobalSprintModal() {
        this.showGlobalSprintModal.set(false);
        this.currentSprint.set(null);
        this.sprintValidationError.set(null);
    }

    onSaveGlobalSprint(data: { sprint: Partial<Sprint>; programmeId: number }) {
        this.sprintValidationError.set(null);
        const sprintToSave = {
            ...data.sprint,
            dateDebut: this.convertToISODate(data.sprint.dateDebut),
            dateLimite: this.convertToISODate(data.sprint.dateLimite),
        };

        const req = data.sprint.id 
            ? this.service.updateSprint(data.sprint.id, sprintToSave as Sprint)
            : this.service.createSprintForProgramme(data.programmeId, sprintToSave as Sprint);

        req.subscribe({
            next: () => {
                this.refresh.emit();
                this.closeGlobalSprintModal();
            },
            error: (err) => {
                console.error('Error saving sprint', err);
                
                let errorMessage = 'Une erreur est survenue lors de la sauvegarde.';
                
                if (err.error && typeof err.error === 'object') {
                    if (err.error.message) {
                        errorMessage = err.error.message;
                    } else if (err.error.error) {
                        errorMessage = err.error.error;
                    }
                } else if (typeof err.error === 'string') {
                    errorMessage = err.error;
                }

                this.sprintValidationError.set(errorMessage);
            }
        });
    }

    deleteSprint(id: number) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce sprint ?')) {
            this.service.deleteSprint(id).subscribe({
                next: () => this.refresh.emit(),
                error: (err) => console.error(err)
            });
        }
    }

    // --- Activity Logic --- FIXED: Call sprints() as a function
    openActivityModal(sprintId: number, activity?: any) {
        this.currentSprintId.set(sprintId);

        if (activity) {
            this.currentActivity.set({
                ...activity,
                dateDebut: this.convertToInputDate(activity.dateDebut),
                dateLimite: this.convertToInputDate(activity.dateFin || activity.dateLimite),
                kpis: activity.kpis || [],
            });
        } else {
            this.currentActivity.set(null);
        }

        const sprint = this.sprints().find(s => s.id === sprintId); // ✅ FIXED: Added () to call the signal
        if (sprint && sprint.programmeId) {
            this.service.getOptionnelKpis(sprint.programmeId).subscribe({
                next: (kpis) => {
                    this.optionnelKpis.set(kpis);
                    this.showGlobalActivityModal.set(true);
                },
                error: () => {
                    this.optionnelKpis.set([]);
                    this.showGlobalActivityModal.set(true);
                }
            });
        } else {
            this.optionnelKpis.set([]);
            this.showGlobalActivityModal.set(true);
        }
    }

    closeGlobalActivityModal() {
        this.showGlobalActivityModal.set(false);
        this.currentActivity.set(null);
        this.activityValidationError.set(null);
    }

    onSaveGlobalActivity(data: { activity: Partial<Activite>; kpiIds: number[] }) {
        this.activityValidationError.set(null);
        const activityToSave = {
            ...data.activity,
            dateDebut: this.convertToISODate(data.activity.dateDebut),
            dateLimite: this.convertToISODate(data.activity.dateLimite),
        };

        const req = data.activity.id 
            ? this.service.updateActivity(data.activity.id, activityToSave as Activite, data.kpiIds)
            : this.service.createActivityInSprint(this.currentSprintId()!, activityToSave as Activite, data.kpiIds);
        
        req.subscribe({
            next: () => {
                this.refresh.emit();
                this.closeGlobalActivityModal();
            },
            error: (err) => {
                console.error('❌ Error saving activity:', err);
                
                let errorMessage = "Une erreur est survenue lors de l'enregistrement.";

                if (err.error) {
                    if (typeof err.error === 'object') {
                        if (err.error.message) {
                            errorMessage = err.error.message;
                        } else if (err.error.error) {
                            errorMessage = err.error.error;
                        }
                    } else if (typeof err.error === 'string') {
                        errorMessage = err.error;
                    }
                }

                this.activityValidationError.set(errorMessage);
            }
        });
    }

    deleteActivity(id: number) {
        if (confirm('Supprimer cette activité ?')) {
            this.service.deleteActivity(id).subscribe({
                next: () => this.refresh.emit(),
                error: (err) => console.error(err)
            });
        }
    }

    // --- Task Logic ---
    openTacheModal(activityId: number, tache?: any) {
        this.currentActiviteId.set(activityId);
        this.service.getActivityKpis(activityId).subscribe({
            next: (kpis) => {
                this.currentActivityKpis.set(kpis);
                
                if (tache && tache.id) {
                    this.service.getTacheDocuments(tache.id).subscribe({
                        next: (docs) => {
                            this.prepareTaskModal(tache, docs);
                        },
                        error: () => this.prepareTaskModal(tache, [])
                    });
                } else {
                    this.prepareTaskModal(tache, []);
                }
            },
            error: () => {
                this.currentActivityKpis.set([]);
                this.prepareTaskModal(tache, []);
            }
        });
    }

    private prepareTaskModal(tache: any, docs: any[]) {
        if (tache) {
            this.currentTask.set({
                ...tache,
                dateDebut: this.convertToInputDate(tache.dateDebut),
                dateLimite: this.convertToInputDate(tache.dateLimite),
                kpis: tache.kpis || [],
                documents: docs
            });
        } else {
            this.currentTask.set(null);
        }
        this.showTacheModal.set(true);
    }

    closeTacheModal() {
        this.showTacheModal.set(false);
        this.currentTask.set(null);
    }

    onSaveTask(data: { task: Partial<Tache>; kpiIds: number[]; files?: File[] }) {
        let sprintId: number | undefined;
        let programmeId: number | undefined;

        // Find parent IDs - FIXED: Call sprints() as a function
        for (const sprint of this.sprints()) { // ✅ FIXED: Added () to call the signal
            if (sprint.activites?.find((a: any) => a.id === this.currentActiviteId())) {
                sprintId = sprint.id;
                programmeId = sprint.programmeId;
                break;
            }
        }

        if (!programmeId) return;

        const taskToSave = {
            ...data.task,
            dateDebut: this.convertToISODate(data.task.dateDebut),
            dateLimite: this.convertToISODate(data.task.dateLimite),
        };

        const req = data.task.id
            ? this.service.updateTache(data.task.id, taskToSave as Tache, data.kpiIds)
            : this.service.createTache(programmeId, sprintId!, this.currentActiviteId()!, taskToSave as Tache, data.kpiIds);

        req.subscribe({
            next: (savedTask) => {
                if (data.files && data.files.length > 0 && savedTask.id) {
                    this.service.uploadTacheDocuments(savedTask.id, data.files).subscribe({
                        next: () => {
                            this.refresh.emit();
                            this.closeTacheModal();
                        },
                        error: () => {
                            this.refresh.emit();
                            this.closeTacheModal();
                        }
                    });
                } else {
                    this.refresh.emit();
                    this.closeTacheModal();
                }
            },
            error: (err) => {
                this.tacheValidationError.set(err.error?.message || "Erreur sauvegarde tâche");
            }
        });
    }

    deleteTache(id: number) {
        if (confirm('Supprimer cette tâche ?')) {
            this.service.deleteTache(id).subscribe(() => this.refresh.emit());
        }
    }

    toggleTacheStatus(tache: any) {
        const newStatus = tache.status === 'TERMINEE' ? 'EN_COURS' : 'TERMINEE';
        const tacheToSave = {
            ...tache,
            status: newStatus,
            dateDebut: this.convertToISODate(tache.dateDebut),
            dateLimite: this.convertToISODate(tache.dateLimite),
        };

        this.service.updateTache(tache.id!, tacheToSave).subscribe({
            next: () => {
                tache.status = newStatus;
                this.refresh.emit(); // ✅ Added refresh to update parent immediately
            }
        });
    }
    
    onDeleteTacheDocument(documentId: number) {
        if (!confirm('Supprimer ce document ?')) return;
        this.service.deleteTacheDocument(documentId).subscribe({
            next: () => {
                const current = this.currentTask();
                if (current && current.documents) {
                    this.currentTask.set({
                        ...current,
                        documents: current.documents.filter((d: any) => d.id !== documentId)
                    });
                }
                this.refresh.emit();
            }
        });
    }

    // --- Document Logic ---
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
            next: () => {
                this.refresh.emit();
                this.closeDocumentUploadDialog();
            },
            error: () => {
                this.uploadingDocuments.set(false);
                alert('Erreur upload');
            }
        });
    }

    deleteDocument(documentId: number) {
        if (confirm('Supprimer ce document ?')) {
            this.service.deleteSprintDocument(documentId).subscribe(() => this.refresh.emit());
        }
    }
    
    // Activity Docs
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
        const actId = this.currentActivityForDocuments();
        if (!actId) return;
        this.uploadingActivityDocuments.set(true);
        this.service.uploadActivityDocuments(actId, files).subscribe({
            next: () => {
                this.refresh.emit();
                this.closeActivityDocumentUploadDialog();
            },
            error: () => {
                this.uploadingActivityDocuments.set(false);
                alert('Erreur upload');
            }
        });
    }
    
    deleteActivityDocument(documentId: number, activityId: number) {
        if (confirm('Supprimer ce document ?')) {
            this.service.deleteActivityDocument(documentId).subscribe(() => this.refresh.emit());
        }
    }

    // --- Helper UI Methods ---
    toggleSprint(id: number) {
        this.expandedSprints.update(list => list.includes(id) ? list.filter(i => i !== id) : [...list, id]);
    }

    toggleActivite(id: number) {
        this.expandedActivites.update(list => list.includes(id) ? list.filter(i => i !== id) : [...list, id]);
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

    // Status Helpers
    isLate(sprint: any): boolean {
        const now = new Date();
        const end = new Date(sprint.dateFin || sprint.dateLimite);
        return now > end;
    }

    isActive(sprint: any): boolean {
        const now = new Date();
        const start = new Date(sprint.dateDebut);
        const end = new Date(sprint.dateFin || sprint.dateLimite);
        return now >= start && now <= end;
    }

    isDone(sprint: any): boolean { return sprint.status === 'TERMINEE'; }
    getDelayDays(sprint: any): number { return sprint.retardJours || 0; }
    getSprintProgress(sprint: any): number { return sprint.progression || 0; }
    getActivityProgress(act: any): number { return act.progression || 0; }
    isActivityLate(act: any): boolean { return (act.retardJours || 0) > 0; }

    getStatusLabel(sprint: any): string {
        if (this.isLate(sprint) && !this.isDone(sprint)) return 'En retard';
        if (this.isDone(sprint)) return 'Terminé';
        if (this.isActive(sprint)) return 'En cours';
        return 'Non démarrée';
    }

    getResponsableName(id?: number): string {
        if (!id) return 'Non assigné';
        const user = this.service.responsables().find((u) => u.id === id);
        return user ? user.fullName : 'Inconnu';
    }

    formatStatus(status: string): string {
        const map: Record<string, string> = {
            NON_DEMARREE: 'Non démarrée', EN_COURS: 'En cours', BLOQUE: 'Bloqué',
            EN_RETARD: 'En retard', TERMINEE: 'Terminée',
        };
        return map[status] || status;
    }

    isTaskLate(tache: any): boolean {
        if (tache.status === 'TERMINEE') return false;
        const now = new Date();
        const deadline = new Date(tache.dateLimite);
        return now > deadline;
    }

    getTaskDelayDays(tache: any): number {
        if (tache.status === 'TERMINEE') return 0;
        const now = new Date();
        const deadline = new Date(tache.dateLimite);
        const diffTime = now.getTime() - deadline.getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    groupKpisByCategory(kpis: any[]) {
        const grouped = new Map<string, { name: string; color: string; kpis: any[] }>();
        kpis.forEach((kpi) => {
            const categoryName = kpi.categoryNom || 'Sans catégorie';
            const categoryColor = kpi.categoryCouleur || '#94a3b8';
            if (!grouped.has(categoryName)) {
                grouped.set(categoryName, { name: categoryName, color: categoryColor, kpis: [] });
            }
            grouped.get(categoryName)!.kpis.push(kpi);
        });
        return Array.from(grouped.values());
    }

    // Document Helpers
    getDocumentIcon(type: string): string {
        if (type.includes('pdf')) return 'picture_as_pdf';
        if (type.includes('word')) return 'description';
        if (type.includes('excel') || type.includes('spreadsheet')) return 'table_chart';
        if (type.includes('image')) return 'image';
        return 'insert_drive_file';
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

    // Date Conversion Helpers
    private convertToISODate(date: any): string {
        if (!date) return '';
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
            const [day, month, year] = date.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        if (date instanceof Date) return date.toISOString().split('T')[0];
        return date;
    }

    private convertToInputDate(date: any): string {
        return this.convertToISODate(date);
    }
    
    // FIXED: Call sprints() as a function
    getSprintDates(sprintId: number): { start: string; end: string } {
        const sprint = this.sprints().find((s) => s.id === sprintId); // ✅ FIXED: Added () to call the signal
        return {
            start: sprint?.dateDebut || '',
            end: sprint?.dateFin || sprint?.dateLimite || '',
        };
    }

    // --- Styling Helpers for New Design ---
    getSprintStatusBadge(sprint: any) {
        if (this.isDone(sprint)) return 'bg-green-50 text-green-700 border-green-200 border';
        if (this.isLate(sprint)) return 'bg-red-50 text-red-700 border-red-200 border';
        if (this.isActive(sprint)) return 'bg-teal-50 text-teal-700 border-teal-200 border';
        return 'bg-slate-50 text-slate-700 border-slate-200 border';
    }

    getActivityStatusBadge(act: any) {
        if (act.status === 'TERMINEE') return 'bg-green-50 text-green-700 border-green-200 border text-xs px-2 py-0.5';
        if (this.isActivityLate(act)) return 'bg-red-50 text-red-700 border-red-200 border text-xs px-2 py-0.5';
        if (act.status === 'EN_COURS') return 'bg-teal-50 text-teal-700 border-teal-200 border text-xs px-2 py-0.5';
        return 'bg-slate-50 text-slate-700 border-slate-200 border text-xs px-2 py-0.5';
    }

    getTaskStatusBadge(tache: any) {
        if (tache.status === 'TERMINEE') return 'bg-green-50 text-green-700 border-green-200 border text-[10px] px-1.5 py-0.5';
        if (this.isTaskLate(tache)) return 'bg-red-50 text-red-700 border-red-200 border text-[10px] px-1.5 py-0.5';
        if (tache.status === 'EN_COURS') return 'bg-blue-50 text-blue-700 border-blue-200 border text-[10px] px-1.5 py-0.5';
        if (tache.status === 'BLOQUE') return 'bg-yellow-50 text-yellow-700 border-yellow-200 border text-[10px] px-1.5 py-0.5';
        return 'bg-slate-50 text-slate-700 border-slate-200 border text-[10px] px-1.5 py-0.5';
    }

    getPriorityBadge(priority: string) {
        switch(priority) {
            case 'Haute': return 'bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 py-0.5';
            case 'Moyenne': return 'bg-orange-50 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0.5';
            case 'Basse': return 'bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0.5';
            default: return 'bg-slate-50 text-slate-700 border-slate-200 text-[10px] px-1.5 py-0.5';
        }
    }
}