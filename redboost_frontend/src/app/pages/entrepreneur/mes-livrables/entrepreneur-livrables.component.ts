import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LivrableService } from '../../../core/services/livrable.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatchingService } from '../../../core/services/matching.service';
import { CoachService } from '../../dashboard/coachDashboard/services/coach.service';
import { environment } from '../../../../environment';

type LivTab = 'EN_COURS' | 'TERMINE' | 'REVISION';

@Component({
  selector: 'rb-entrepreneur-livrables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="livrables-page">
      <div class="page-header">
          <div class="header-content">
              <h1 class="page-title">Mes Livrables</h1>
              <p class="page-subtitle">Gérez vos documents et soumettez vos travaux à vos coachs</p>
          </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container premium-card mb-6">
          <div class="tab-item" [class.active]="activeTab() === 'EN_COURS'" (click)="activeTab.set('EN_COURS')">
              <i class="pi pi-clock"></i>
              <span>En cours</span>
              <span class="count-badge">{{ getTabCount('EN_COURS') }}</span>
          </div>
          <div class="tab-item" [class.active]="activeTab() === 'TERMINE'" (click)="activeTab.set('TERMINE')">
              <i class="pi pi-check-circle"></i>
              <span>Terminé</span>
              <span class="count-badge">{{ getTabCount('TERMINE') }}</span>
          </div>
          <div class="tab-item" [class.active]="activeTab() === 'REVISION'" (click)="activeTab.set('REVISION')">
              <i class="pi pi-sync"></i>
              <span>En révision</span>
              <span class="count-badge">{{ getTabCount('REVISION') }}</span>
          </div>
      </div>

      <!-- Filters -->
      <div class="filters-container premium-card mb-8">
          <div class="filter-row">
              <div class="filter-item">
                  <div class="search-input-wrap">
                      <i class="pi pi-search"></i>
                      <input type="text" placeholder="Recherche rapide..." [(ngModel)]="searchTerm" />
                  </div>
              </div>
              
              <div class="filter-item">
                  <select class="filter-select" [(ngModel)]="selectedProgramme">
                      <option value="">Tous les Programmes</option>
                      <option *ngFor="let p of uniqueProgrammes()" [value]="p">{{ p }}</option>
                  </select>
              </div>

              <div class="filter-item">
                  <select class="filter-select" [(ngModel)]="selectedCoach">
                      <option value="">Tous les Coachs</option>
                      <option *ngFor="let c of uniqueCoaches()" [value]="c">{{ c }}</option>
                  </select>
              </div>

              <div class="filter-item">
                  <select class="filter-select" [(ngModel)]="selectedSession">
                      <option value="">Toutes les Sessions</option>
                      <option *ngFor="let s of uniqueSessions()" [value]="s">{{ s }}</option>
                  </select>
              </div>

              <div class="filter-item">
                  <select class="filter-select" [(ngModel)]="selectedThematique">
                      <option value="">Toutes les Thématiques</option>
                      <option *ngFor="let t of uniqueThematiques()" [value]="t">{{ t }}</option>
                  </select>
              </div>
          </div>
      </div>

      <!-- Livrables List -->
      <div class="livrables-list-wrap" *ngIf="filtered().length > 0">
          <div class="livrable-item premium-card" *ngFor="let liv of filtered()">
              <div class="livrable-main">
                  <div class="livrable-info-grid">
                      <div class="info-cell coach">
                          <span class="cell-label">Coach Référent</span>
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
                              <span class="session-badge" *ngIf="liv.sessionName" style="background: #fdf2f8; color: #db2777; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.75rem; border-radius: 99px;">
                                  <i class="pi pi-calendar"></i> {{ liv.sessionName }}
                              </span>
                              <span class="thematique-badge" *ngIf="liv.thematiqueName">
                                  <i class="pi pi-tag"></i> {{ liv.thematiqueName }}
                              </span>
                              <span class="deadline-badge" *ngIf="liv.deadline" [class.overdue]="isOverdue(liv.deadline)">
                                  <i class="pi pi-clock"></i> {{ isOverdue(liv.deadline) ? 'En retard' : 'Avant le' }} {{ liv.deadline | date:'dd/MM/yyyy' }}
                              </span>
                          </div>
                      </div>

                      <div class="info-cell document">
                          <span class="cell-label">Titre / Document</span>
                          <div class="task-info">
                              <span class="task-name">{{ liv.titre }}</span>
                              <div class="doc-link-wrap" *ngIf="liv.fichierUrl" (click)="download(liv.fichierUrl)" style="cursor: pointer; margin-top: 5px;">
                                  <i class="pi" [class]="getFileIcon(liv.titre || '').icon" [style.color]="getFileIcon(liv.titre || '').color"></i>
                                  <span class="doc-title">{{ liv.fileSize || 'Consulter' }}</span>
                              </div>
                          </div>
                      </div>

                      <div class="info-cell status">
                          <span class="cell-label">Statut</span>
                          <div class="status-badge" [class]="liv.statut?.toLowerCase()">
                              {{ getStatusLabel(liv.statut) }}
                          </div>
                      </div>

                      <div class="livrable-actions" style="display: flex; flex-direction: column; gap: 8px;">
                          <button class="action-btn download" *ngIf="liv.fichierUrl && (liv.statut === 'A_REMPLIR' || liv.statut === 'EN_REVISION')" (click)="download(liv.fichierUrl)" 
                                  style="background: #f8fafc; border: 1px solid #e2e8f0; color: #1e293b; padding: 8px 12px; border-radius: 10px;" title="Télécharger le document du coach">
                              <i class="pi pi-file-import"></i>
                              <span>Doc Coach</span>
                          </button>
                          
                          <button class="action-btn submit-btn" 
                                  *ngIf="isSubmissionStatus(liv.statut)" 
                                  (click)="triggerUpload(liv.id)" 
                                  [disabled]="loading() || isOverdue(liv.deadline)"
                                  [title]="isOverdue(liv.deadline) ? 'Le délai est dépassé' : ''"
                                  [style.opacity]="isOverdue(liv.deadline) ? '0.5' : '1'"
                                  [style.cursor]="isOverdue(liv.deadline) ? 'not-allowed' : 'pointer'"
                                  style="background: #ea5073; color: white; min-width: 140px; padding: 10px 12px; border-radius: 10px; border: none; font-weight: bold;">
                              <i class="pi pi-reply"></i>
                              <span>{{ (liv.statut === 'EN_REVISION' || liv.statut === 'REVISION') ? 'Renvoyer' : 'Faire un retour' }}</span>
                          </button>
                          
                          <button class="action-btn download" *ngIf="liv.fichierUrl && liv.statut !== 'A_REMPLIR'" (click)="download(liv.fichierUrl)" 
                                  style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 8px 12px; border-radius: 10px;" title="Voir mon envoi">
                              <i class="pi pi-eye"></i>
                              <span>Mon Retour</span>
                          </button>
                          
                          <input type="file" [id]="'fu-' + liv.id" class="hidden" (change)="onFile($event, liv)">
                      </div>
                  </div>
              </div>

              <!-- Coach Feedback -->
              <div class="feedback-box" *ngIf="liv.coachComment">
                  <div class="feedback-header">
                      <i class="pi pi-info-circle"></i>
                      <span>Consignes / Feedback du coach</span>
                  </div>
                  <p class="feedback-text">{{ liv.coachComment }}</p>
              </div>
          </div>
      </div>

      <!-- Empty State -->
      <div class="premium-empty-state" *ngIf="filtered().length === 0">
          <div class="empty-illustration">
              <i class="pi pi-folder-open"></i>
          </div>
          <h2>Aucun livrable</h2>
          <p>Vous n'avez pas de documents dans cette catégorie pour le moment.</p>
      </div>

      <div *ngIf="loading()" class="global-loader-wrap">
          <div class="premium-spinner"></div>
      </div>

      <!-- Depôt Modal -->
      <div *ngIf="showDepotModal" class="modal-overlay" (click)="showDepotModal = false">
          <div class="modal-box" (click)="$event.stopPropagation()">
              <div class="modal-header">
                  <div class="modal-header-info">
                      <h2 class="modal-name">Déposer un livrable</h2>
                      <p class="modal-subtitle">Envoyez un document à vos coachs</p>
                  </div>
                  <button class="modal-close" (click)="showDepotModal = false"><i class="pi pi-times"></i></button>
              </div>

              <div class="modal-body scrollable-body">
                  <div class="form-group" style="margin-bottom: 16px;">
                      <label class="form-label">Titre du document *</label>
                      <input type="text" class="search-input-alt" [(ngModel)]="newLivrable.titre" placeholder="Ex: Rapport d'activité" />
                  </div>

                  <div class="form-group" style="margin-bottom: 16px;">
                      <label class="form-label">Coach destinataire *</label>
                      <select class="search-input-alt" [(ngModel)]="newLivrable.coachId">
                          <option [ngValue]="null">Sélectionner un coach...</option>
                          <option *ngFor="let c of coaches" [value]="c.id">{{c.nom}} ({{c.thematiqueName}})</option>
                      </select>
                  </div>

                  <div class="form-group" style="margin-bottom: 16px;">
                      <label class="form-label">Programme associé</label>
                      <select class="search-input-alt" [(ngModel)]="newLivrable.programmeId">
                          <option [ngValue]="null">Sélectionner un programme (optionnel)...</option>
                          <option *ngFor="let p of programmes" [value]="p.id">{{p.nom}}</option>
                      </select>
                  </div>

                  <div class="form-group" style="margin-bottom: 16px;">
                      <label class="form-label">Document à transmettre *</label>
                      <div class="premium-drop-zone" [class.has-file]="selectedFile" (click)="fileInput.click()">
                          <div class="drop-content" *ngIf="!selectedFile">
                              <div class="upload-pulse">
                                <i class="pi pi-cloud-upload"></i>
                              </div>
                              <p>Cliquez pour <span class="browse-link">parcourrez vos fichiers</span></p>
                          </div>
                          <div class="selected-file-preview" *ngIf="selectedFile">
                              <i class="pi pi-file" style="font-size: 1.5rem; color: #ea5073;"></i>
                              <div class="file-details">
                                  <span class="f-name">{{ selectedFile.name }}</span>
                              </div>
                              <button class="btn-remove-file" (click)="$event.stopPropagation(); selectedFile = null"><i class="pi pi-times"></i></button>
                          </div>
                          <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)" accept=".pdf,.docx,.xlsx" />
                      </div>
                  </div>
              </div>

              <div class="modal-footer">
                  <button class="btn-close-modal" (click)="showDepotModal = false" style="margin-right: 12px;">Annuler</button>
                  <button class="btn-detail" (click)="deposerLivrable()" [disabled]="loading() || !selectedFile || !newLivrable.titre || !newLivrable.coachId" style="background: #ea5073; color: white;">
                      <i class="pi" [class.pi-check]="!loading()" [class.pi-spin]="loading()" [class.pi-spinner]="loading()" style="margin-right: 6px;"></i>
                      {{ loading() ? 'Dépôt en cours...' : 'Confirmer le dépôt' }}
                  </button>
              </div>
          </div>
      </div>
    </div>
  `,
  styles: [`
    .livrables-page { padding: 2rem; background: #f8fafc; min-height: 100vh; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; }
    .page-subtitle { color: #64748b; font-size: 1rem; margin-top: 4px; }

    .tabs-container { display: flex; gap: 2rem; padding: 0.5rem 1.5rem; background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,.04); border: 1px solid #f1f5f9; }
    .tab-item { padding: 1rem 0.5rem; display: flex; align-items: center; gap: 0.75rem; color: #64748b; font-weight: 700; cursor: pointer; position: relative; transition: all 0.2s; }
    .tab-item:hover { color: #0f172a; }
    .tab-item.active { color: #ea5073; }
    .tab-item.active::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 3px; background: #ea5073; border-radius: 3px 3px 0 0; }
    .count-badge { background: #f1f5f9; color: #64748b; font-size: 0.75rem; padding: 0.1rem 0.5rem; border-radius: 99px; }
    .tab-item.active .count-badge { background: #fff1f2; color: #ea5073; }

    .filters-container { padding: 1.5rem; background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,.04); border: 1px solid #f1f5f9; }
    .filter-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; align-items: center; }
    .filter-item { display: flex; flex-direction: column; }
    .filter-select { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem; font-size: 0.9rem; color: #1e293b; outline: none; transition: all 0.2s; cursor: pointer; }
    .filter-select:focus { border-color: #ea5073; background: white; }
    .search-input-wrap i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .search-input-wrap input { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem 1rem 0.75rem 2.5rem; font-size: 0.95rem; color: #1e293b; outline: none; }

    .livrables-list-wrap { display: flex; flex-direction: column; gap: 1rem; }
    .livrable-item { padding: 1.5rem; border-radius: 24px; border: 1px solid #f1f5f9; transition: all 0.3s; background: white; }
    .livrable-item:hover { transform: translateX(5px); border-color: #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,.05); }

    .livrable-main { display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-wrap: wrap; }
    .livrable-info-grid { display: grid; grid-template-columns: 1fr 1.5fr 2fr 1fr; gap: 1.5rem; flex: 1; align-items: start; }
    
    .info-cell { display: flex; flex-direction: column; gap: 0.75rem; }
    .cell-label { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .user-info { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar { width: 36px; height: 36px; color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; }
    .user-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }

    .context-info { display: flex; flex-direction: column; gap: 0.4rem; }
    .programme-badge, .thematique-badge { font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.75rem; border-radius: 99px; }
    .programme-badge { background: #eff6ff; color: #3b82f6; }
    .thematique-badge { background: #f0fdf4; color: #10b981; }
    .deadline-badge { background: #fef3c7; color: #d97706; }
    .deadline-badge.overdue { background: #fee2e2; color: #dc2626; }

    .task-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .task-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }

    .doc-link-wrap { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; width: fit-content; }
    .doc-link-wrap i { font-size: 1.1rem; }
    .doc-title { font-weight: 600; color: #1e293b; font-size: 0.85rem; }

    .status-badge { padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 800; text-align: center; width: fit-content; }
    .status-badge.submitted, .status-badge.pending_review { background: #fef3c7; color: #d97706; }
    .status-badge.accepted, .status-badge.valide, .status-badge.approved { background: #dcfce7; color: #15803d; }
    .status-badge.rejected, .status-badge.rejete { background: #fee2e2; color: #b91c1c; }
    .status-badge.revision { background: #eff6ff; color: #1d4ed8; }

    .livrable-actions { display: flex; flex-direction: column; gap: 0.5rem; width: 150px; }
    .action-btn { border: none; padding: 0.6rem 1rem; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; font-size: 0.85rem; }
    .action-btn.download { background: #f1f5f9; color: #1e293b; }
    .action-btn.submit-btn { background: #ea5073; color: white; box-shadow: 0 4px 12px rgba(234, 80, 115, 0.2); }
    .action-btn.submit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 15px rgba(234, 80, 115, 0.3); }
    .action-btn.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .feedback-box { margin-top: 1.5rem; padding: 1.25rem; background: #fffbeb; border-radius: 16px; border-left: 4px solid #f59e0b; }
    .feedback-header { display: flex; align-items: center; gap: 0.75rem; color: #b45309; font-weight: 700; font-size: 0.9rem; margin-bottom: 0.5rem; }
    .feedback-text { color: #78350f; font-size: 0.9rem; margin: 0; line-height: 1.5; }

    .premium-empty-state { background: white; border-radius: 32px; padding: 5rem 2rem; text-align: center; border: 2px dashed #e2e8f0; max-width: 600px; margin: 3rem auto; }
    .empty-illustration { width: 80px; height: 80px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .empty-illustration i { font-size: 2.5rem; color: #cbd5e1; }
    .premium-spinner { width: 48px; height: 48px; border: 5px solid #f1f5f9; border-top-color: #ea5073; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .hidden { display: none; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
  `]
})
export class EntrepreneurLivrablesComponent implements OnInit {
  private livrableSvc = inject(LivrableService);
  private authSvc = inject(AuthService);
  private matchSvc = inject(MatchingService);
  private coachSvc = inject(CoachService);

  showDepotModal = false;
  selectedFile: File | null = null;
  coaches: any[] = [];
  programmes: any[] = [];
  newLivrable: { titre: string, coachId: number | null, programmeId: number | null } = { titre: '', coachId: null, programmeId: null };

  activeTab = signal<LivTab>('EN_COURS');
  allLivrables = signal<any[]>([]);
  loading = signal(true);
  searchTerm = '';

  selectedProgramme = '';
  selectedCoach = '';
  selectedSession = '';
  selectedThematique = '';

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

  uniqueThematiques = computed(() => {
    const set = new Set<string>();
    this.allLivrables().forEach(l => { if (l.thematiqueName) set.add(l.thematiqueName); });
    return Array.from(set).sort();
  });

  filtered = computed(() => {
    const tab = this.activeTab();
    const term = this.searchTerm.toLowerCase().trim();
    const prog = this.selectedProgramme;
    const coach = this.selectedCoach;
    const sess = this.selectedSession;
    const theme = this.selectedThematique;
    
    return this.allLivrables().filter(l => {
      const matchesTab = this.mapToGroup(l.statut) === tab;
      const matchesSearch = !term || (l.titre || '').toLowerCase().includes(term);
      const matchesProg = !prog || l.programme?.nom === prog;
      const matchesCoach = !coach || l.coachName === coach;
      const matchesSess = !sess || l.sessionName === sess;
      const matchesTheme = !theme || l.thematiqueName === theme;

      return matchesTab && matchesSearch && matchesProg && matchesCoach && matchesSess && matchesTheme;
    });
  });

  ngOnInit(): void {
    this.loadLivrables();
    this.loadCoaches();
  }

  loadCoaches() {
    const user = this.authSvc.currentUser$.value;
    if (!user) return;
    this.matchSvc.getEntrepreneurCoaches(user.id).subscribe(data => {
      this.coaches = data || [];
      
      // Extraire les programmes uniques des matchings
      const progMap = new Map<number, any>();
      this.coaches.forEach(m => {
        if (m.programmeId && m.programmeName) {
          progMap.set(Number(m.programmeId), { id: Number(m.programmeId), nom: m.programmeName });
        }
      });
      this.programmes = Array.from(progMap.values());
    });
  }

  openDepotModal() {
    this.newLivrable = { titre: '', coachId: null, programmeId: null };
    this.selectedFile = null;
    this.showDepotModal = true;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  deposerLivrable() {
    if (!this.newLivrable.titre || !this.selectedFile || !this.newLivrable.coachId) return;
    
    const userId = this.authSvc.currentUser$.value?.id;
    if (!userId) return;

    this.loading.set(true);
    this.livrableSvc.upload(
      this.newLivrable.programmeId ? this.newLivrable.programmeId.toString() : '',
      [userId.toString()],
      this.selectedFile,
      { titre: this.newLivrable.titre, type: 'Document' },
      this.newLivrable.coachId
    ).subscribe({
      next: () => {
        this.showDepotModal = false;
        this.loadLivrables();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadLivrables() {
    const user = this.authSvc.currentUser$.value;
    if (!user) return;
    this.loading.set(true);
    this.livrableSvc.getAll({ entrepreneurId: user.id }).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : (res as any)?.data || [];
        this.allLivrables.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.allLivrables.set([]);
        this.loading.set(false);
      }
    });
  }

  mapToGroup(statut: string): LivTab {
    if (['ACCEPTE', 'APPROVED', 'VALIDE'].includes(statut)) return 'TERMINE';
    if (statut === 'EN_REVISION' || statut === 'REVISION') return 'REVISION';
    return 'EN_COURS';
  }

  getTabCount(tab: LivTab): number {
    return this.allLivrables().filter(l => this.mapToGroup(l.statut) === tab).length;
  }

  getStatusLabel(statut: string) {
    const config: any = {
      SUBMITTED: 'Soumis',
      SOUMIS: 'Soumis',
      RESOUMIS: 'Resoumis',
      PENDING_REVIEW: 'En revue',
      ACCEPTED: 'Validé',
      ACCEPTE: 'Validé',
      APPROVED: 'Approuvé',
      REJECTED: 'Rejeté',
      REVISION: 'Révision',
      EN_REVISION: 'Révision',
      VALIDE: 'Approuvé',
      A_REMPLIR: 'À Remplir'
    };
    return config[statut] || statut;
  }

  isSubmissionStatus(statut: string): boolean {
    return !statut || ['EN_REVISION', 'REVISION', 'A_REMPLIR', 'EN_ATTENTE'].includes(statut);
  }

  isOverdue(deadline: string | null): boolean {
    if (!deadline) return false;
    return new Date() > new Date(deadline);
  }

  triggerUpload(id: string) {
    const el = document.getElementById('fu-' + id) as HTMLInputElement;
    el?.click();
  }

  onFile(event: Event, liv: any) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.loading.set(true);
    this.livrableSvc.submitLivrable(liv.id, file).subscribe({
      next: () => {
        this.loadLivrables();
      },
      error: () => this.loading.set(false)
    });
  }

  download(url: string) {
    if (url) {
      const fullUrl = url.startsWith('http') ? url : environment.apiUrl.replace('/api', '') + url;
      window.open(fullUrl, '_blank');
    }
  }

  getCoachColor(name: string): string {
    if (!name) return '#64748b';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];
    return colors[Math.abs(hash) % colors.length];
  }

  getFileIcon(fileName: string) {
    const ext = (fileName || '').split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { icon: 'pi-file-pdf', color: '#ef4444' };
    if (['doc', 'docx'].includes(ext!)) return { icon: 'pi-file-word', color: '#3b82f6' };
    if (['xls', 'xlsx'].includes(ext!)) return { icon: 'pi-file-excel', color: '#10b981' };
    return { icon: 'pi-file', color: '#64748b' };
  }
}
