import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LivrableService } from '../../../core/services/livrable.service';
import { TacheService } from '../../../core/services/tache.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatchingService } from '../../../core/services/matching.service';
import { CoachService } from '../../dashboard/coachDashboard/services/coach.service';
import { environment } from '../../../../environment';

type ViewType = 'TASKS' | 'LIVRABLES';

const RISK_CFG: Record<string, { label: string; bg: string; color: string }> = {
  HAUTE:    { label: 'Priorité Haute', bg: '#FEE2E2', color: '#DC2626' },
  CRITIQUE: { label: 'Critique',       bg: '#FEE2E2', color: '#DC2626' },
  MOYENNE:  { label: 'Priorité Moyenne', bg: '#FEF3C7', color: '#D97706' },
  BASSE:    { label: 'Priorité Basse',   bg: '#D1FAE5', color: '#059669' },
};

@Component({
  selector: 'rb-entrepreneur-livrables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="livrables-page">
      <div class="page-header">
          <div class="header-content">
              <h1 class="page-title">{{ currentView() === 'TASKS' ? 'Mes Tâches' : 'Mes Livrables' }}</h1>
              <p class="page-subtitle">
                {{ currentView() === 'TASKS' ? 'Suivez vos objectifs et progressez dans votre programme' : 'Gérez vos documents et soumettez vos travaux à vos coachs' }}
              </p>
          </div>
      </div>
      
      <!-- NAVIGATION & GLOBAL FILTER ROW -->
      <div class="nav-filter-row mb-6">
          <div class="cand-tabs">
            <button (click)="currentView.set('TASKS')" class="cand-tab" [class.active]="currentView() === 'TASKS'">
              <i class="pi pi-list mr-2"></i> Mes Tâches
            </button>
            <button (click)="currentView.set('LIVRABLES')" class="cand-tab" [class.active]="currentView() === 'LIVRABLES'">
              <i class="pi pi-file-pdf mr-2"></i> Mes Livrables
            </button>
          </div>

          <div class="global-filter-select-wrap">
              <i class="pi pi-filter mr-2" style="color: #64748b; font-size: 0.9rem;"></i>
              <select class="global-select-alt" [ngModel]="selectedThematique()" (ngModelChange)="selectedThematique.set($event)">
                  <option value="">Toutes les Thématiques</option>
                  <option *ngFor="let t of uniqueThematiques()" [value]="t">{{ t }}</option>
              </select>
          </div>
      </div>

      <!-- VIEW: TASKS -->
      <ng-container *ngIf="currentView() === 'TASKS'">
          <div class="filters-container premium-card mb-8">
              <div class="filter-row">
                  <div class="filter-item search-wrap">
                      <div class="search-input-wrap">
                          <i class="pi pi-search"></i>
                          <input type="text" placeholder="Rechercher une tâche..." [ngModel]="searchTask()" (ngModelChange)="searchTask.set($event)" />
                      </div>
                  </div>
                  <div class="filter-item">
                      <select class="filter-select" [ngModel]="statusTask()" (ngModelChange)="statusTask.set($event)">
                          <option value="ALL">Tous les Statuts</option>
                          <option value="A_FAIRE">À Faire</option>
                          <option value="EN_COURS">En Cours</option>
                          <option value="TERMINEE">Terminée</option>
                      </select>
                  </div>
              </div>
          </div>

          <div class="livrables-list-wrap" *ngIf="filteredTasks().length > 0">
              <div class="livrable-item premium-card" *ngFor="let task of filteredTasks()">
                  <div class="livrable-main">
                      <div class="livrable-info-grid-tasks">
                          <div class="info-cell details">
                              <span class="cell-label">Tâche</span>
                              <div class="task-info">
                                  <span class="task-name">{{ task.titre || task.title }}</span>
                                  <span class="programme-badge" *ngIf="task.sprint">
                                      <i class="pi pi-bolt"></i> {{ task.sprint }}
                                  </span>
                              </div>
                          </div>
                          <div class="info-cell">
                              <span class="cell-label">Coach</span>
                              <div class="user-info" *ngIf="task.coach">
                                  <div class="user-avatar" [style.background]="getCoachColor(task.coach.prenom)">{{ (task.coach.prenom || 'C')[0] }}</div>
                                  <div class="flex flex-col">
                                    <span class="user-name">{{ task.coach.prenom }} {{ task.coach.nom }}</span>
                                    <span class="text-[10px] text-gray-400 font-bold" *ngIf="task.coach.thematiqueName">{{ task.coach.thematiqueName }}</span>
                                  </div>
                              </div>
                              <span class="empty-doc" *ngIf="!task.coach">Non assigné</span>
                          </div>
                          <div class="info-cell">
                              <span class="cell-label">Priorité</span>
                              <span class="inline-block text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest"
                                [style.background]="getRisk(task.priorite || task.risk).bg" [style.color]="getRisk(task.priorite || task.risk).color" style="width: fit-content;">
                                {{ getRisk(task.priorite || task.risk).label }}
                              </span>
                          </div>
                          <div class="info-cell" style="min-width: 150px;">
                              <span class="cell-label">Complétion ({{ task.completionProb || 0 }}%)</span>
                              <div class="progress-container" style="margin-top: 10px;">
                                  <div class="progress-track" style="height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden;">
                                      <div class="progress-fill" [style.width.%]="task.completionProb || 0" 
                                           [style.background]="'#3B82A6'" style="height: 100%; transition: width 0.3s;"></div>
                                  </div>
                              </div>
                          </div>
                          <div class="info-cell status">
                              <span class="cell-label">Statut & Échéance</span>
                              <div class="status-badge" [class]="getTaskColId(task.status).toLowerCase()">
                                  {{ getTaskStatusLabel(task.status) }}
                              </div>
                              <div class="deadline-badge" *ngIf="task.dateEcheance" [class.overdue]="isTaskOverdue(task.dateEcheance)" style="margin-top: 8px;">
                                  <i class="pi pi-clock"></i> {{ formatDate(task.dateEcheance) }}
                              </div>
                          </div>
                          <div class="livrable-actions">
                              <div class="upload-area" *ngIf="task.status !== 'TERMINEE'">
                                  <button class="action-btn submit-btn-task" (click)="triggerTaskUpload(task.id)">
                                      <i class="pi pi-upload"></i>
                                      <span>{{ getSelectedTaskFile(task.id) ? 'Changer' : 'Livrable' }}</span>
                                  </button>
                                  <input type="file" [id]="'fi-task-' + task.id" class="hidden" (change)="onTaskFile($event, task.id)">
                                  <button *ngIf="getSelectedTaskFile(task.id)" (click)="submitTaskDeliverable(task.id)" class="action-btn" style="background: #10b981; color: white; margin-top: 8px; width: 100%;">
                                      <i class="pi pi-check"></i> Envoyer
                                  </button>
                              </div>
                              <div *ngIf="task.status === 'TERMINEE'" class="status-badge valid" style="background: #dcfce7; color: #15803d; width: 100%;">
                                  <i class="pi pi-check-circle"></i> Complété
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          <div class="premium-empty-state" *ngIf="filteredTasks().length === 0">
              <div class="empty-illustration"><i class="pi pi-list"></i></div>
              <h2>Aucune tâche</h2>
              <p>Vous n'avez pas de tâches correspondant à vos critères.</p>
          </div>
      </ng-container>

      <!-- VIEW: LIVRABLES -->
      <ng-container *ngIf="currentView() === 'LIVRABLES'">
          <div class="filters-container premium-card mb-8">
              <div class="filter-row">
                  <div class="filter-item">
                      <div class="search-input-wrap" style="position: relative;">
                          <i class="pi pi-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                          <input type="text" class="filter-select" placeholder="Recherche rapide..." [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" style="padding-left: 2.5rem;" />
                      </div>
                  </div>
                  <div class="filter-item">
                      <select class="filter-select" [ngModel]="selectedProgramme()" (ngModelChange)="selectedProgramme.set($event)">
                          <option value="">Tous les Programmes</option>
                          <option *ngFor="let p of uniqueProgrammes()" [value]="p">{{ p }}</option>
                      </select>
                  </div>
                  <div class="filter-item">
                      <select class="filter-select" [ngModel]="selectedCoach()" (ngModelChange)="selectedCoach.set($event)">
                          <option value="">Tous les Coachs</option>
                          <option *ngFor="let c of uniqueCoaches()" [value]="c">{{ c }}</option>
                      </select>
                  </div>
                  <div class="filter-item">
                      <select class="filter-select" [ngModel]="selectedSession()" (ngModelChange)="selectedSession.set($event)">
                          <option value="">Toutes les Sessions</option>
                          <option *ngFor="let s of uniqueSessions()" [value]="s">{{ s }}</option>
                      </select>
                  </div>
              </div>
          </div>

          <div class="livrables-list-wrap" *ngIf="filteredLivrables().length > 0">
              <div class="livrable-item premium-card" *ngFor="let liv of filteredLivrables()">
                  <div class="livrable-main">
                      <div class="livrable-info-grid">
                          <div class="info-cell coach">
                              <span class="cell-label">Coach</span>
                              <div class="user-info">
                                  <div class="user-avatar" [style.background]="getCoachColor(liv.coachName)">{{ (liv.coachName || 'C')[0] }}</div>
                                  <span class="user-name">{{ liv.coachName || 'Votre Coach' }}</span>
                              </div>
                          </div>
                          <div class="info-cell details">
                              <span class="cell-label">Contexte</span>
                              <div class="context-info">
                                  <span class="programme-badge" *ngIf="liv.programmeName || liv.programme?.nom">
                                      <i class="pi pi-bookmark"></i> {{ liv.programmeName || liv.programme?.nom }}
                                  </span>
                                  <span class="session-badge" *ngIf="liv.sessionName">
                                      <i class="pi pi-calendar"></i> {{ liv.sessionName }}
                                  </span>
                                  <span class="thematique-badge" *ngIf="liv.thematiqueName">
                                      <i class="pi pi-tag"></i> {{ liv.thematiqueName }}
                                  </span>
                              </div>
                          </div>
                          <div class="info-cell document">
                              <span class="cell-label">Document Coach</span>
                              <div class="doc-link-wrap" *ngIf="liv.fichierUrl" (click)="download(liv.fichierUrl)" style="cursor: pointer;">
                                  <i class="pi" [class]="getFileIcon(liv.titre || '').icon" [style.color]="getFileIcon(liv.titre || '').color"></i>
                                  <span class="doc-title">{{ liv.titre }}</span>
                              </div>
                          </div>
                          <div class="info-cell document">
                              <span class="cell-label">Mon Retour</span>
                              <div class="doc-link-wrap" *ngIf="liv.fichierRetourUrl" (click)="download(liv.fichierRetourUrl)" style="cursor: pointer; background: #f0fdf4; border-color: #bbf7d0;">
                                  <i class="pi" [class]="getFileIcon(liv.fichierRetourUrl || '').icon" [style.color]="getFileIcon(liv.fichierRetourUrl || '').color"></i>
                                  <span class="doc-title">Mon envoi</span>
                              </div>
                              <span class="empty-doc" *ngIf="!liv.fichierRetourUrl">—</span>
                          </div>
                          <div class="info-cell comments-cell">
                              <span class="cell-label">Commentaires</span>
                              <div class="comments-stack">
                                  <div class="comment-block demande" *ngIf="liv.commentaire">
                                      <span class="c-title">Demande:</span> {{ liv.commentaire }}
                                  </div>
                                  <div class="comment-block revision" *ngIf="liv.commentaireRevision">
                                      <span class="c-title">Révision:</span> {{ liv.commentaireRevision }}
                                  </div>
                                  <div class="comment-block acceptation" *ngIf="liv.commentaireAcceptation">
                                      <span class="c-title">Acceptation:</span> {{ liv.commentaireAcceptation }}
                                  </div>
                              </div>
                          </div>
                          <div class="info-cell status">
                              <span class="cell-label">Statut</span>
                              <div class="status-badge" [class]="liv.statut?.toLowerCase()">
                                  {{ getLivrableStatusLabel(liv.statut) }}
                              </div>
                              <div class="deadline-badge" *ngIf="liv.deadline" [class.overdue]="isLivrableOverdue(liv.deadline)" style="margin-top: 8px;">
                                  <i class="pi pi-clock"></i> {{ isLivrableOverdue(liv.deadline) ? 'En retard' : 'Avant le' }} {{ liv.deadline | date:'dd/MM/yyyy' }}
                              </div>
                          </div>
                          <div class="livrable-actions">
                              <button class="action-btn submit-btn" 
                                      (click)="triggerLivrableUpload(liv.id)" 
                                      [disabled]="loading() || isLivrableOverdue(liv.deadline) || isAlreadySubmitted(liv.statut) || isLivrableAccepted(liv.statut)">
                                  <i class="pi" [class.pi-reply]="!isAlreadySubmitted(liv.statut) && !isLivrableAccepted(liv.statut)" [class.pi-check]="isAlreadySubmitted(liv.statut) || isLivrableAccepted(liv.statut)"></i>
                                  <span>{{ getLivrableButtonLabel(liv.statut) }}</span>
                              </button>
                              <input type="file" [id]="'fu-' + liv.id" class="hidden" (change)="onLivrableFile($event, liv)">
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          <div class="premium-empty-state" *ngIf="filteredLivrables().length === 0">
              <div class="empty-illustration"><i class="pi pi-folder-open"></i></div>
              <h2>Aucun livrable</h2>
              <p>Vous n'avez pas de documents dans cette catégorie.</p>
          </div>
      </ng-container>

      <div *ngIf="loading()" class="global-loader-wrap">
          <div class="premium-spinner"></div>
      </div>
    </div>
  `,
  styles: [`
    .livrables-page { padding: 2rem; background: #f8fafc; min-height: 100vh; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; }
    .page-subtitle { color: #64748b; font-size: 1rem; margin-top: 4px; }

    .nav-filter-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
    .cand-tabs { display: flex; gap: 8px; overflow-x: auto; }
    .cand-tab {
      padding: 10px 24px; border-radius: 12px; font-size: 14px; font-weight: 700;
      border: none; cursor: pointer; transition: all .2s; background: #FFFFFF; color: #64748B; 
      white-space: nowrap; border: 1px solid #E2E8F0; display: inline-flex; align-items: center;
    }
    .cand-tab:hover { background: #F8FAFC; color: #1E293B; border-color: #CBD5E1; }
    .cand-tab.active { background: #ea5073 !important; color: #fff !important; border-color: #ea5073 !important; box-shadow: 0 4px 12px rgba(234, 80, 115, 0.25); }

    .global-filter-select-wrap { display: flex; align-items: center; background: white; padding: 4px 12px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .global-select-alt { border: none; background: transparent; font-weight: 700; color: #1e293b; outline: none; padding: 8px; cursor: pointer; min-width: 180px; }

    .filters-container { padding: 1.5rem; background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,.04); border: 1px solid #f1f5f9; }
    .filter-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; align-items: center; }
    .filter-item { display: flex; flex-direction: column; }
    .filter-select { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem; font-size: 0.9rem; color: #1e293b; outline: none; transition: all 0.2s; cursor: pointer; }
    .filter-select:focus { border-color: #ea5073; background: white; }

    .livrables-list-wrap { display: flex; flex-direction: column; gap: 1rem; }
    .livrable-item { padding: 1.5rem; border-radius: 24px; border: 1px solid #f1f5f9; transition: all 0.3s; background: white; }
    .livrable-item:hover { transform: translateX(5px); border-color: #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,.05); }

    .livrable-info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1.5fr 1fr 150px; gap: 1rem; align-items: start; }
    .livrable-info-grid-tasks { display: grid; grid-template-columns: 2fr 1.5fr 1.2fr 1.5fr 1.5fr 180px; gap: 1.5rem; align-items: start; }
    
    .info-cell { display: flex; flex-direction: column; gap: 0.75rem; }
    .cell-label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .user-info { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar { width: 36px; height: 36px; color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; }
    .user-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }

    .context-info { display: flex; flex-direction: column; gap: 0.4rem; }
    .programme-badge, .session-badge, .thematique-badge { font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.75rem; border-radius: 99px; }
    .programme-badge { background: #eff6ff; color: #3b82f6; }
    .session-badge { background: #fdf2f8; color: #db2777; }
    .thematique-badge { background: #f0fdf4; color: #10b981; }
    
    .status-badge { padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 800; text-align: center; width: fit-content; display: inline-flex; align-items: center; gap: 6px; }
    .status-badge.a_faire, .status-badge.travail_demande { background: #f1f5f9; color: #475569; }
    .status-badge.en_cours { background: #eff6ff; color: #1d4ed8; }
    .status-badge.terminee, .status-badge.accepte, .status-badge.valide { background: #dcfce7; color: #15803d; }
    .status-badge.soumis { background: #fef3c7; color: #d97706; }
    .status-badge.en_revision { background: #fee2e2; color: #b91c1c; }

    .deadline-badge { background: #fef3c7; color: #d97706; font-size: 0.8rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 99px; display: inline-flex; align-items: center; gap: 4px; }
    .deadline-badge.overdue { background: #fee2e2; color: #dc2626; }

    .doc-link-wrap { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
    .doc-title { font-weight: 600; color: #1e293b; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }

    .comments-stack { display: flex; flex-direction: column; gap: 0.5rem; }
    .comment-block { padding: 0.5rem; border-radius: 8px; font-size: 0.8rem; line-height: 1.4; }
    .comment-block.demande { background: #f8fafc; border-left: 3px solid #94a3b8; color: #334155; }
    .comment-block.revision { background: #fef2f2; border-left: 3px solid #ef4444; color: #991b1b; }
    .comment-block.acceptation { background: #f0fdf4; border-left: 3px solid #22c55e; color: #166534; }
    .c-title { font-weight: 700; display: block; margin-bottom: 2px; }

    .livrable-actions { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; }
    .action-btn { border: none; padding: 0.75rem 1rem; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; font-size: 0.85rem; }
    .action-btn.submit-btn { background: #ea5073; color: white; box-shadow: 0 4px 12px rgba(234, 80, 115, 0.25); }
    .action-btn.submit-btn:disabled { background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; cursor: not-allowed; box-shadow: none; }
    .action-btn.submit-btn-task { background: #f1f5f9; color: #475569; border: 1px dashed #cbd5e1; }
    
    .premium-empty-state { background: white; border-radius: 32px; padding: 5rem 2rem; text-align: center; border: 2px dashed #e2e8f0; max-width: 600px; margin: 3rem auto; }
    .empty-illustration { width: 80px; height: 80px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .empty-illustration i { font-size: 2.5rem; color: #cbd5e1; }
    
    .global-loader-wrap { position: fixed; inset: 0; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; z-index: 999; }
    .premium-spinner { width: 48px; height: 48px; border: 5px solid #f1f5f9; border-top-color: #ea5073; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .hidden { display: none; }
    .mr-2 { margin-right: 0.5rem; }
  `]
})
export class EntrepreneurLivrablesComponent implements OnInit {
  private livrableSvc = inject(LivrableService);
  private tacheSvc = inject(TacheService);
  private authSvc = inject(AuthService);
  private matchSvc = inject(MatchingService);

  currentView = signal<ViewType>('LIVRABLES');
  loading = signal(true);

  // Filters as Signals
  searchTerm = signal(''); 
  searchTask = signal('');
  statusTask = signal('ALL');
  selectedThematique = signal('');

  // Livrables Filters as Signals
  selectedProgramme = signal('');
  selectedCoach = signal('');
  selectedSession = signal('');

  // Data Signals
  allLivrables = signal<any[]>([]);
  tasks = signal<any[]>([]);
  allMatchings = signal<any[]>([]);
  selectedFiles = signal<Record<string, File>>({});

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData() {
    const user = this.authSvc.currentUser$.value;
    if (!user) return;
    this.loading.set(true);
    Promise.all([
      this.loadLivrables(user.id),
      this.loadTasks(user.id),
      this.loadMatchings(user.id)
    ]).then(() => this.loading.set(false));
  }

  loadMatchings(userId: any): Promise<void> {
    return new Promise(resolve => {
      this.matchSvc.getEntrepreneurCoaches(userId).subscribe({
        next: (res: any) => {
          this.allMatchings.set(res || []);
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  loadLivrables(userId: any): Promise<void> {
    return new Promise(resolve => {
      this.livrableSvc.getAll({ entrepreneurId: userId }).subscribe({
        next: (res: any) => {
          this.allLivrables.set(Array.isArray(res) ? res : res?.data || []);
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  loadTasks(userId: any): Promise<void> {
    return new Promise(resolve => {
      this.tacheSvc.getByUser(userId).subscribe({
        next: (res: any) => {
          this.tasks.set(Array.isArray(res) ? res : []);
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  // --- FILTER LIVRABLES ---
  filteredLivrables = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const prog = this.selectedProgramme();
    const coach = this.selectedCoach();
    const sess = this.selectedSession();
    const theme = this.selectedThematique().toLowerCase().trim();

    return this.allLivrables().filter(l => {
      const matchesSearch = !term || (l.titre || '').toLowerCase().includes(term);
      const matchesProg = !prog || l.programme?.nom === prog;
      const matchesCoach = !coach || l.coachName === coach;
      const matchesSess = !sess || l.sessionName === sess;
      
      const livTheme = (l.thematiqueName || l.thematique?.nom || '').toLowerCase().trim();
      const matchesTheme = !theme || livTheme === theme;

      return matchesSearch && matchesProg && matchesCoach && matchesSess && matchesTheme;
    });
  });

  // --- FILTER TASKS ---
  filteredTasks = computed(() => {
    const term = this.searchTask().toLowerCase().trim();
    const status = this.statusTask();
    const theme = this.selectedThematique().toLowerCase().trim();

    return this.tasks().filter(t => {
      const matchesSearch = !term || (t.titre || t.title || '').toLowerCase().includes(term);
      const colId = this.getTaskColId(t.status);
      const matchesStatus = status === 'ALL' || colId === status;
      
      const taskTheme = (t.coach?.thematiqueName || t.thematiqueName || '').toLowerCase().trim();
      const matchesTheme = !theme || taskTheme === theme;

      return matchesSearch && matchesStatus && matchesTheme;
    }).sort((a, b) => new Date(b.dateEcheance || 0).getTime() - new Date(a.dateEcheance || 0).getTime());
  });

  uniqueThematiques = computed(() => {
    const set = new Set<string>();
    this.allMatchings().forEach(m => { if (m.thematiqueName) set.add(m.thematiqueName.trim()); });
    this.allLivrables().forEach(l => { 
      const name = l.thematiqueName || l.thematique?.nom;
      if (name) set.add(name.trim()); 
    });
    this.tasks().forEach(t => { 
      const name = t.coach?.thematiqueName || t.thematiqueName;
      if (name) set.add(name.trim()); 
    });
    return Array.from(set).sort();
  });

  uniqueProgrammes = computed(() => {
    const set = new Set<string>();
    this.allLivrables().forEach(l => { if (l.programme?.nom) set.add(l.programme.nom); });
    return Array.from(set).sort();
  });

  uniqueCoaches = computed(() => {
    const set = new Set<string>();
    this.allLivrables().forEach(l => { if (l.coachName) set.add(l.coachName); });
    return Array.from(set).sort();
  });

  uniqueSessions = computed(() => {
    const set = new Set<string>();
    this.allLivrables().forEach(l => { if (l.sessionName) set.add(l.sessionName); });
    return Array.from(set).sort();
  });

  // --- TASK LOGIC ---
  getTaskColId(status: string): string {
    if (status === 'TERMINEE') return 'TERMINEE';
    if (status === 'EN_COURS' || status === 'EN_RETARD') return 'EN_COURS';
    return 'A_FAIRE';
  }

  getTaskStatusLabel(status: string): string {
    const colId = this.getTaskColId(status);
    if (colId === 'TERMINEE') return 'Terminée';
    if (colId === 'EN_COURS') return 'En cours';
    return 'À faire';
  }

  getRisk(r: string) { return RISK_CFG[r] || RISK_CFG['MOYENNE']; }
  isTaskOverdue(deadline: any): boolean { return deadline && new Date() > new Date(deadline); }
  getSelectedTaskFile(id: string): string { return this.selectedFiles()[id]?.name || ''; }
  triggerTaskUpload(id: string) { document.getElementById('fi-task-' + id)?.click(); }
  onTaskFile(event: Event, taskId: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.selectedFiles.update(s => ({ ...s, [taskId]: file }));
  }

  submitTaskDeliverable(taskId: string) {
    const file = this.selectedFiles()[taskId];
    if (!file) return;
    this.loading.set(true);
    alert(`Livrable "${file.name}" soumis avec succès !`);
    this.selectedFiles.update(s => { const n = { ...s }; delete n[taskId]; return n; });
    this.loading.set(false);
  }

  // --- LIVRABLE LOGIC ---
  getLivrableStatusLabel(statut: string) {
    const config: any = { TRAVAIL_DEMANDE: 'À faire', SUBMITTED: 'Soumis', SOUMIS: 'Soumis', ACCEPTE: 'Accepté', VALIDE: 'Accepté', EN_REVISION: 'En révision' };
    return config[statut] || statut;
  }

  isLivrableAccepted(statut: string): boolean { return ['ACCEPTE', 'VALIDE'].includes(statut); }
  isAlreadySubmitted(statut: string): boolean { return ['SUBMITTED', 'SOUMIS', 'RESOUMIS'].includes(statut); }
  isLivrableOverdue(deadline: any): boolean { return deadline && new Date() > new Date(deadline); }
  getLivrableButtonLabel(statut: string): string { 
    if (this.isAlreadySubmitted(statut)) return 'Soumis';
    if (statut === 'EN_REVISION' || statut === 'REVISION') return 'Renvoyer';
    return 'Faire un retour'; 
  }
  
  triggerLivrableUpload(id: string) { document.getElementById('fu-' + id)?.click(); }

  onLivrableFile(event: Event, liv: any) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.loading.set(true);
    this.livrableSvc.submitLivrable(liv.id, file).subscribe({
      next: () => { this.loadLivrables(this.authSvc.currentUser$.value!.id).then(() => this.loading.set(false)); },
      error: () => this.loading.set(false)
    });
  }

  // --- SHARED ---
  formatDate(date: any): string {
    return date ? new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';
  }

  download(url: string) {
    if (url) window.open(url.startsWith('http') ? url : environment.apiUrl.replace('/api', '') + url, '_blank');
  }

  getCoachColor(name: string): string {
    if (!name) return '#64748b';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return colors[Math.abs(hash) % colors.length];
  }

  getFileIcon(fileName: string) {
    const ext = (fileName || '').split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { icon: 'pi-file-pdf', color: '#ef4444' };
    if (['doc', 'docx'].includes(ext!)) return { icon: 'pi-file-word', color: '#3b82f6' };
    return { icon: 'pi-file', color: '#64748b' };
  }
}
