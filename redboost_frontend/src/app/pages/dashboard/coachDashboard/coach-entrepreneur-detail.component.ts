import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CoachService, CoachEntrepreneurDetailDTO } from './services/coach.service';
import { TacheService } from '../../../core/services/tache.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-coach-entrepreneur-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="entrepreneur-detail-page">
      <!-- Breadcrumb / Back Navigation -->
      <a routerLink="/coach-dashboard" class="back-link">
          <i class="pi pi-arrow-left"></i> Retour au dashboard
      </a>

      <div *ngIf="isLoading" class="loading-state">
          <p>Chargement des détails de l'entrepreneur...</p>
      </div>

      <div *ngIf="!isLoading && entrepreneur">
        <!-- Profile Header Card -->
        <div class="profile-header-card">
            <div class="avatar pink-avatar">
                {{ entrepreneur.firstName.charAt(0) }}{{ entrepreneur.lastName.charAt(0) }}
            </div>
            <div class="profile-info">
                <h1>{{ entrepreneur.firstName }} {{ entrepreneur.lastName }}</h1>
                <div class="startup-sub">{{ entrepreneur.entreprise }} · {{ entrepreneur.secteur }}</div>
                <div class="project-desc"><b>Description du projet :</b> {{ entrepreneur.startupDescription }}</div>
            </div>
            <div class="header-actions">
                <button class="btn-coach-badge" *ngIf="coachProfile">{{ coachProfile.firstName }} {{ coachProfile.lastName }}</button>
            </div>
        </div>

        <!-- Stats Bar -->
        <div class="stats-bar">
            <div class="stat-item"><span class="dot dot-pink"></span> Progression <b>{{ entrepreneur.completionRate }}%</b></div>
            <div class="stat-item"><span class="dot dot-green"></span> Email <b>{{ entrepreneur.email }}</b></div>
            <div class="stat-item"><span class="dot dot-green"></span> Téléphone <b>{{ entrepreneur.phoneNumber }}</b></div>
        </div>

        <!-- Navigation Tabs -->
        <div class="custom-tabs">
            <button class="tab" [class.active]="activeTab === 'taches'" (click)="activeTab = 'taches'">Tâches</button>
            <button class="tab" [class.active]="activeTab === 'livrables'" (click)="activeTab = 'livrables'">
                Livrables <span class="tab-badge" *ngIf="entrepreneur.livrables.length > 0">{{ entrepreneur.livrables.length }}</span>
            </button>
            <button class="tab" [class.active]="activeTab === 'reporting'" (click)="activeTab = 'reporting'">
                Reporting Sessions <span class="tab-count">{{ entrepreneur.notes.length }}</span>
            </button>
        </div>

        <!-- Tab Content Area -->
        <div class="tab-content">
            <!-- Tâches View -->
            <div *ngIf="activeTab === 'taches'">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-[#2D3748]">Plan d'action ({{ entrepreneur.tasks.length || 0 }} tâches)</h2>
                    <button class="btn-primary" (click)="openTaskModal()">
                        <i class="pi pi-plus"></i> Ajouter une tâche
                    </button>
                </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div *ngIf="!entrepreneur.tasks || entrepreneur.tasks.length === 0" class="p-8 text-center text-gray-500">
                    Aucune tâche spécifique assignée pour le moment.
                </div>

                <div *ngFor="let task of entrepreneur.tasks" class="task-item border-b border-gray-100 p-4 hover:bg-gray-50 flex items-center gap-4">
                    <div class="task-checkbox">
                        <i *ngIf="task.status === 'TERMINEE'" class="pi pi-check-circle text-green-500 text-xl"></i>
                        <div *ngIf="task.status !== 'TERMINEE'" class="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                    </div>
                    <div class="task-content flex-1">
                        <h4 class="font-semibold text-gray-800 m-0">{{ task.titre }}</h4>
                        <p class="text-sm text-gray-500 mt-1 mb-2">{{ task.description }}</p>

                        <div class="task-documents" *ngIf="task.documents && task.documents.length > 0">
                            <div class="text-xs font-bold text-gray-500 mb-1">Documents attachés :</div>
                            <div *ngFor="let doc of task.documents" class="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded mb-1">
                                <i class="pi pi-file text-blue-500"></i>
                                <span class="flex-1 truncate">{{ doc.nom }}</span>
                                <a [href]="doc.cheminFichier" target="_blank" class="text-blue-500 hover:underline">Voir</a>
                                <button (click)="deleteTaskDocument(task, doc.id)" class="text-red-500 hover:text-red-700 ml-2" title="Supprimer">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                        </div>

                        <div class="mt-2">
                           <input type="file" [id]="'file_' + task.id" class="hidden"
                                  (change)="onTaskFileSelected($event, task)" multiple />
                           <button class="text-xs font-bold text-[#FF4D85] bg-pink-50 px-3 py-1.5 rounded-full hover:bg-pink-100 transition-colors flex items-center gap-1"
                                   (click)="triggerFileInput(task.id)">
                               <i class="pi pi-paperclip"></i>
                               {{ uploadingTaskId === task.id ? 'Téléchargement...' : 'Joindre un fichier' }}
                           </button>
                        </div>
                    </div>
                    <div class="task-meta">
                        <span class="badge" [class.badge-success]="task.status === 'TERMINEE'"
                                          [class.badge-warning]="task.status !== 'TERMINEE'">
                            {{ task.status === 'TERMINEE' ? 'Terminé' : 'En cours' }}
                        </span>
                    </div>
                </div>
            </div>
            </div>

            <!-- Livrables View -->
            <div *ngIf="activeTab === 'livrables'">
                <div class="livrable-stats">
                    <div class="livrable-stat"><i class="pi pi-check-circle text-green-500"></i> Livrables reçus <b>{{ entrepreneur.livrables.length }}</b></div>
                </div>

                <div *ngIf="entrepreneur.livrables.length === 0" class="bg-white rounded-xl p-8 text-center text-gray-500 border border-dashed border-gray-300">
                    Aucun livrable n'a encore été déposé par cet entrepreneur.
                </div>

                <div *ngFor="let livrable of entrepreneur.livrables" class="livrable-card">
                    <div class="livrable-header">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-file text-gray-400"></i>
                            <strong>{{ livrable.tacheTitre }}</strong>
                        </div>
                        <span class="tag tag-blue">{{ livrable.typeFichier }}</span>
                    </div>
                    <div class="text-sm text-gray-500 mb-3"><i class="pi pi-calendar"></i> {{ livrable.dateUpload | date:'shortDate' }}</div>
                    <div class="livrable-file">
                        <i class="pi pi-file text-gray-400"></i>
                        <div>
                            <div class="font-medium text-gray-800">{{ livrable.nom }}</div>
                            <div class="text-xs text-gray-400">{{ (livrable.tailleFichier / 1024) | number:'1.0-0' }} KB</div>
                        </div>
                        <div class="ml-auto flex gap-2">
                            <a [href]="livrable.url" target="_blank" class="link-voir"><i class="pi pi-eye"></i> Voir</a>
                            <a [href]="livrable.url" download class="link-dl"><i class="pi pi-download"></i> DL</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Reporting Sessions View -->
            <div *ngIf="activeTab === 'reporting'">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-[#2D3748]">Reporting Sessions</h2>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn-primary" (click)="goToCreateReport(entrepreneur.id)">
                            <i class="pi pi-plus"></i> Ajouter
                        </button>
                        <button class="btn-secondary" (click)="downloadConsolidatedReports(entrepreneur.id)" *ngIf="entrepreneur.notes.length > 0" [disabled]="isDownloadingPdf">
                            <i class="pi" [class.pi-spin]="isDownloadingPdf" [class.pi-spinner]="isDownloadingPdf" [class.pi-download]="!isDownloadingPdf"></i>
                            {{ isDownloadingPdf ? 'Génération...' : 'Rapports consolidés' }}
                        </button>
                    </div>
                </div>

                <div *ngIf="entrepreneur.notes.length === 0" class="bg-white rounded-xl p-8 text-center text-gray-500 border border-dashed border-gray-300">
                    Aucune note de synthèse n'a été rédigée pour le moment.
                </div>

                <div *ngFor="let note of entrepreneur.notes" class="session-report-card">
                    <div class="session-report-header">
                        <div class="flex items-center gap-3">
                            <div class="avatar-sm-dark" *ngIf="coachProfile">{{ getCoachInitials() }}</div>
                            <div>
                                <div class="text-white font-bold">Rapport</div>
                                <div class="text-gray-300 text-sm">{{ note.date | date:'mediumDate' }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="session-report-body">
                        <p class="text-gray-700 font-semibold">Synthèse :</p>
                        <p class="text-gray-700">{{ note.synthese }}</p>
                        <div class="plan-action">
                            <div class="plan-title">APPRÉCIATION</div>
                            <p class="text-sm text-gray-600">{{ note.appreciation }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="!isLoading && !entrepreneur" class="error-state text-center p-20">
          <i class="pi pi-exclamation-circle text-5xl text-red-500 mb-4"></i>
          <p class="text-xl font-bold text-gray-700">Entrepreneur introuvable</p>
          <button routerLink="/coach-dashboard" class="mt-4 text-pink-500 hover:underline">Retour au dashboard</button>
      </div>

      <!-- ══════════════════════════════════════════
           MODAL : Ajouter une Tâche
           ══════════════════════════════════════════ -->
      <div *ngIf="showTaskModal" class="modal-backdrop" (click)="showTaskModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                  <h2>Nouvelle tâche</h2>
                  <button class="close-btn" (click)="showTaskModal = false"><i class="pi pi-times"></i></button>
              </div>
              <div class="modal-body">



                  <div class="form-group mb-4">
                      <label>Titre de la tâche <span class="required">*</span></label>
                      <input type="text" class="premium-input" [(ngModel)]="newTask.titre" placeholder="Ex: Finaliser le deck" />
                  </div>
                  <div class="form-group mb-4">
                      <label>Description détaillée</label>
                      <textarea class="premium-input" [(ngModel)]="newTask.description" rows="3" placeholder="Description de ce qui est attendu..."></textarea>
                  </div>
                
                  <div class="form-row mb-4">
                      <div class="form-group">
                          <label>Date de début</label>
                          <input type="date" class="premium-input" [(ngModel)]="newTask.dateDebut" />
                      </div>
                      <div class="form-group">
                          <label>Date d'échéance <span class="required">*</span></label>
                          <input type="date" class="premium-input" [(ngModel)]="newTask.dateLimite" />
                      </div>
                  </div>
                  <div class="form-group mb-6">
                      <label>Pièce jointe (optionnel)</label>
                      <input type="file" class="premium-input" (change)="onNewTaskFileSelected($event)" style="padding: 0.5rem;" />
                  </div>

                  <button class="btn-primary w-full justify-center"
                          (click)="submitNewTask()"
                          [disabled]="isCreatingTask || !newTask.titre || !newTask.dateLimite">
                      <i class="pi" [ngClass]="isCreatingTask ? 'pi-spinner pi-spin' : 'pi-check'"></i>
                      {{ isCreatingTask ? 'Création en cours...' : 'Créer la tâche' }}
                  </button>
              </div>
          </div>
      </div>

    </div>
  `,
  styles: [`
    .entrepreneur-detail-page {
        padding: 2rem;
        background: #f8f9fa;
        min-height: calc(100vh - 70px);
        font-family: var(--font-family);
        margin-top: -1rem;
    }
    .back-link {
        display: inline-flex; align-items: center; gap: 0.5rem;
        color: #718096; text-decoration: none; font-weight: 500;
        margin-bottom: 2rem; transition: color 0.2s;
    }
    .back-link:hover { color: #FF4D85; }
    .profile-header-card {
        background: white; border-radius: 1.5rem; padding: 2rem;
        display: flex; align-items: center; gap: 2rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 2rem;
    }
    .avatar {
        width: 80px; height: 80px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 1.8rem; color: white;
    }
    .pink-avatar { background: linear-gradient(135deg, #FF6B9E, #FF3366); }
    .profile-info { flex: 1; }
    .profile-info h1 { margin: 0 0 0.5rem 0; font-size: 2rem; color: #2D3748; }
    .startup-sub { color: #718096; font-size: 0.95rem; }
    .project-desc { color: #4A5568; font-size: 0.9rem; margin-top: 0.5rem; line-height: 1.5; }
    .btn-coach-badge {
        background: #1A202C; color: white; border: none;
        padding: 0.5rem 1.2rem; border-radius: 20px; font-weight: 600; font-size: 0.85rem; cursor: default;
    }
    .stats-bar {
        background: white; border-radius: 1rem; padding: 1rem 2rem;
        display: flex; gap: 3rem; box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        margin-bottom: 2rem; border: 1px solid #EDF2F7;
    }
    .stat-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #4A5568; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot-pink { background: #FF4D85; }
    .dot-green { background: #48BB78; }
    .custom-tabs {
        display: flex; gap: 2rem; border-bottom: 2px solid #EDF2F7; margin-bottom: 2rem;
    }
    .tab {
        background: none; border: none; padding: 1rem 0; font-size: 1.05rem;
        font-weight: 600; color: #A0AEC0; cursor: pointer; position: relative; transition: color 0.2s;
    }
    .tab:hover { color: #4A5568; }
    .tab.active { color: #FF4D85; }
    .tab.active::after {
        content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
        height: 3px; background: #FF4D85; border-radius: 3px 3px 0 0;
    }
    .tab-badge {
        background: #FFF5F5; color: #E53E3E; font-size: 0.7rem;
        padding: 0.2rem 0.5rem; border-radius: 8px; font-weight: 700; margin-left: 0.4rem;
    }
    .tab-count {
        background: #EDF2F7; color: #4A5568; font-size: 0.7rem;
        padding: 0.15rem 0.5rem; border-radius: 8px; font-weight: 700; margin-left: 0.4rem;
    }
    .badge { font-size: 0.75rem; padding: 0.3rem 0.8rem; border-radius: 12px; font-weight: 600; }
    .badge-warning { background: #FFF5F5; color: #E53E3E; border: 1px solid #FED7D7; }
    .badge-success { background: #F0FFF4; color: #38A169; border: 1px solid #C6F6D5; }
    .livrable-stats {
        display: flex; gap: 2rem; padding: 1rem 1.5rem; background: white;
        border-radius: 1rem; border: 1px solid #EDF2F7; margin-bottom: 1.5rem;
    }
    .livrable-stat { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #4A5568; }
    .livrable-card {
        background: white; border-radius: 1rem; padding: 1.5rem;
        margin-bottom: 1rem; border: 1px solid #EDF2F7; box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }
    .livrable-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .tag { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: 700; }
    .tag-blue { background: #EBF4FF; color: #3182CE; }
    .livrable-file { display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem; background: #F8FAFC; border-radius: 10px; }
    .link-voir, .link-dl { background: none; border: none; color: #3182CE; font-weight: 600; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; text-decoration: none; }
    .link-dl { color: #718096; }
    .session-report-card { border-radius: 1rem; overflow: hidden; margin-bottom: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
    .session-report-header { background: linear-gradient(135deg, #2D3748, #1A202C); padding: 1.5rem; }
    .avatar-sm-dark {
        width: 40px; height: 40px; border-radius: 50%;
        background: rgba(255,255,255,0.15); display: flex; align-items: center;
        justify-content: center; color: white; font-weight: 700; font-size: 0.85rem;
    }
    .session-report-body { padding: 1.5rem; background: white; }
    .session-report-body p { margin: 0 0 1rem 0; line-height: 1.6; }
    .plan-action { margin-top: 1rem; }
    .plan-title { font-size: 0.75rem; font-weight: 700; color: #A0AEC0; letter-spacing: 1px; margin-bottom: 0.6rem; }

    /* ── Modal ───────────────────────────────────── */
    .modal-backdrop {
        position: fixed; inset: 0; background: rgba(0,0,0,0.45);
        backdrop-filter: blur(4px); z-index: 1000;
        display: flex; align-items: center; justify-content: center; padding: 2rem;
    }
    .modal-content {
        background: white; border-radius: 1.5rem; width: 100%; max-width: 560px;
        max-height: calc(100vh - 4rem); box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        animation: slide-up 0.25s ease-out; overflow: hidden; display: flex; flex-direction: column;
    }
    .modal-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 1.4rem 1.6rem 1rem; border-bottom: 1px solid #EDF2F7;
    }
    .modal-header h2 { font-size: 1.3rem; font-weight: 700; color: #2D3748; margin: 0; }
    .close-btn { background: #F7FAFC; border: none; width: 32px; height: 32px; border-radius: 50%; color: #A0AEC0; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .close-btn:hover { background: #EDF2F7; color: #4A5568; }
    .modal-body { overflow-y: auto; padding: 1.4rem 1.6rem 1.6rem; display: flex; flex-direction: column; gap: 0; }
    .form-group { display: flex; flex-direction: column; }
    .form-group label { font-size: 0.9rem; font-weight: 600; color: #4A5568; margin-bottom: 0.45rem; }
    .required { color: #FF4D85; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .premium-input {
        width: 100%; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid #E2E8F0;
        background: #F8FAFC; font-family: inherit; font-size: 0.95rem; color: #2D3748;
        outline: none; transition: all 0.2s; box-sizing: border-box; resize: vertical;
    }
    .premium-input:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); background: white; }
    .premium-input:disabled { background: #EDF2F7; color: #A0AEC0; cursor: not-allowed; }
    .loading-hint { display: flex; align-items: center; gap: 0.5rem; color: #718096; font-size: 0.9rem; padding: 0.75rem 1rem; background: #F8FAFC; border-radius: 10px; border: 1px solid #E2E8F0; }
    .hint-text { font-size: 0.82rem; color: #E53E3E; margin-top: 0.4rem; display: flex; align-items: center; gap: 0.4rem; }
    .btn-primary {
        background: linear-gradient(135deg, #FF6B9E 0%, #E83E8C 100%); color: white; border: none;
        padding: 0.85rem 1.5rem; border-radius: 12px; font-weight: 700; display: flex;
        align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s;
        font-family: inherit; font-size: 0.95rem;
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(255,77,133,0.35); }
    .btn-primary:disabled { background: #CBD5E0; background-image: none; cursor: not-allowed; transform: none; box-shadow: none; }
    .btn-secondary {
        background: white; border: 1px solid #E2E8F0; color: #4A5568;
        padding: 0.85rem 1.5rem; border-radius: 12px; font-weight: 600;
        cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem;
        font-family: inherit;
    }
    .btn-secondary:hover:not(:disabled) { background: #F8FAFC; border-color: #CBD5E0; }
    .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
    .w-full { width: 100%; }
    .justify-center { justify-content: center; }
    @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class CoachEntrepreneurDetailComponent implements OnInit {
  activeTab: string = 'taches';
  showTaskModal: boolean = false;
  entrepreneur: CoachEntrepreneurDetailDTO | null = null;
  isLoading: boolean = true;
  coachId: number | null = null;

  isUploading: boolean = false;
  uploadingTaskId: number | null = null;
  isDownloadingPdf: boolean = false;
  coachProfile: any = null;

  // ── Task creation ──────────────────────────────
  newTask: any = {
    titre: '',
    description: '',
    priorite: 'Moyenne',
    dateDebut: '',
    dateLimite: ''
  };
  newTaskFile: File | null = null;
  isCreatingTask: boolean = false;

  // ── Activités disponibles pour le sélecteur ───
  activites: any[] = [];
  isLoadingActivites: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private coachService: CoachService,
    private tacheService: TacheService,
    private authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  goToCreateReport(entrepreneurId: number): void {
    this.router.navigate(['/rapport-sessions'], {
      queryParams: { entrepreneurId, action: 'new' }
    });
  }

  ngOnInit(): void {
    const rawCoachId = this.authService.getUserId();
    this.coachId = typeof rawCoachId === 'string' ? parseInt(rawCoachId, 10) : rawCoachId;

    if (this.coachId) {
      this.coachService.getCoachProfile().subscribe({
        next: (profile) => { this.coachProfile = profile; this.cdr.detectChanges(); },
        error: (err) => console.error('Error loading coach profile:', err)
      });
    }

    this.route.params.subscribe(params => {
      const entrepreneurId = +params['id'];
      if (entrepreneurId && this.coachId) {
        this.loadEntrepreneurDetails(this.coachId, entrepreneurId);
      } else {
        this.isLoading = false;
        this.toastr.error('ID Entrepreneur ou Coach manquant', 'Erreur');
      }
    });
  }

  getCoachInitials(): string {
    if (!this.coachProfile) return '';
    return (this.coachProfile.firstName?.charAt(0) || '') + (this.coachProfile.lastName?.charAt(0) || '');
  }

  loadEntrepreneurDetails(coachId: number, entrepreneurId: number): void {
    this.isLoading = true;
    this.coachService.getEntrepreneurDetail(coachId, entrepreneurId).subscribe({
      next: (data) => {
        this.entrepreneur = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        // Charger les activités après avoir chargé l'entrepreneur
        this.loadActivitesForEntrepreneur(entrepreneurId);
      },
      error: (err) => {
        console.error('Error loading entrepreneur details:', err);
        this.isLoading = false;
        this.toastr.error('Erreur lors du chargement des détails', 'Erreur');
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Charge toutes les activités des sprints des programmes de l'entrepreneur
   * en appelant l'endpoint global des sprints détaillés.
   */
  loadActivitesForEntrepreneur(entrepreneurId: number): void {
    this.isLoadingActivites = true;
    const token = this.getAuthToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    // On récupère tous les sprints détaillés globaux et on filtre
    // par responsableId = entrepreneurId, ou on prend tous les sprints
    // de tous les programmes auxquels l'entrepreneur est associé.
    this.http.get<any[]>(
      `${environment.apiUrl}/backoffice/programmes/sprints-detail-global`,
      { headers }
    ).subscribe({
      next: (sprints) => {
        const allActivites: any[] = [];
        sprints.forEach(sprint => {
          if (sprint.activites && sprint.activites.length > 0) {
            sprint.activites.forEach((act: any) => {
              // Inclure toutes les activités, pas seulement celles de l'entrepreneur
              // Le coach peut assigner une tâche à n'importe quelle activité du programme
              allActivites.push({
                id: act.id,
                nom: act.nom,
                sprintNom: sprint.nom,
                programmeNom: sprint.programmeNom,
                programmeId: sprint.programmeId,
                sprintId: sprint.id
              });
            });
          }
        });
        this.activites = allActivites;
        this.isLoadingActivites = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement activités:', err);
        this.isLoadingActivites = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Ouvre le modal et réinitialise le formulaire */
  openTaskModal(): void {
    this.newTask = {
      titre: '',
      description: '',
      priorite: 'Moyenne',
      dateDebut: '',
      dateLimite: ''
    };
    this.newTaskFile = null;
    this.showTaskModal = true;
  }

  triggerFileInput(taskId: number): void {
    const el = document.getElementById('file_' + taskId) as HTMLInputElement;
    if (el) el.click();
  }

  onTaskFileSelected(event: any, task: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0 || !this.coachId) return;

    const filesArray = Array.from(files);
    this.uploadingTaskId = task.id;

    this.tacheService.uploadDocuments(task.id, filesArray, this.coachId).subscribe({
      next: (uploadedDocs) => {
        if (!task.documents) task.documents = [];
        task.documents.push(...uploadedDocs);
        this.uploadingTaskId = null;
        this.toastr.success('Documents chargés avec succès', 'Succès');
        this.cdr.detectChanges();
        event.target.value = '';
      },
      error: (err) => {
        console.error(err);
        this.uploadingTaskId = null;
        this.toastr.error('Erreur lors du chargement des documents', 'Erreur');
        this.cdr.detectChanges();
        event.target.value = '';
      }
    });
  }

  deleteTaskDocument(task: any, docId: number): void {
    if (!confirm('Supprimer ce document ?')) return;

    this.tacheService.deleteDocument(docId).subscribe({
      next: () => {
        task.documents = task.documents.filter((d: any) => d.id !== docId);
        this.toastr.success('Document supprimé', 'Succès');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Erreur lors de la suppression', 'Erreur');
      }
    });
  }

  onNewTaskFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      this.newTaskFile = files[0];
    } else {
      this.newTaskFile = null;
    }
  }

  submitNewTask(): void {
    if (!this.entrepreneur) return;
    
    if (!this.activites || this.activites.length === 0) {
      this.toastr.error("Aucune activité n'est disponible pour cet entrepreneur. Impossible de créer une tâche.", 'Erreur');
      return;
    }

    this.isCreatingTask = true;
    
    // Auto-select the first available activity to attach the task internally
    const activite = this.activites[0];

    if (!activite.programmeId) {
      this.toastr.error('Programme ID manquant pour l\'activité sélectionnée', 'Erreur');
      this.isCreatingTask = false;
      return;
    }

    const token = this.getAuthToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });

    const tachePayload = {
      titre: this.newTask.titre,
      description: this.newTask.description || '',
      responsableId: this.entrepreneur.id,
      priorite: this.newTask.priorite || 'Moyenne',
      dateDebut: this.newTask.dateDebut || null,
      dateLimite: this.newTask.dateLimite,
      difficulte: 'Moyenne',
      status: 'NON_DEMARREE'
    };

    // Le backend attend : { tache: {...}, kpiIds: [] }
    const body = { tache: tachePayload, kpiIds: [] };

    const url = `${environment.apiUrl}/backoffice/programmes/${activite.programmeId}/sprints/${activite.sprintId}/activities/${activite.id}/taches`;

    this.http.post<any>(url, body, { headers }).subscribe({
      next: (createdTask: any) => {
        if (this.newTaskFile) {
          const taskId = typeof createdTask.id === 'string' ? parseInt(createdTask.id, 10) : createdTask.id;
          this.tacheService.uploadDocuments(taskId, [this.newTaskFile], this.coachId || 0).subscribe({
            next: (docs) => {
              createdTask.documents = docs;
              this.finalizeTaskCreation(createdTask);
            },
            error: () => {
              this.toastr.warning("Tâche créée, mais la pièce jointe n'a pas pu être téléchargée.", 'Attention');
              this.finalizeTaskCreation(createdTask);
            }
          });
        } else {
          this.finalizeTaskCreation(createdTask);
        }
      },
      error: (err) => {
        console.error('Erreur création tâche:', err);
        const msg = err?.error?.message || 'Erreur lors de la création de la tâche';
        this.toastr.error(msg, 'Erreur');
        this.isCreatingTask = false;
        this.cdr.detectChanges();
      }
    });
  }

  finalizeTaskCreation(task: any): void {
    if (!this.entrepreneur!.tasks) this.entrepreneur!.tasks = [];
    this.entrepreneur!.tasks.unshift(task);
    this.toastr.success('Tâche créée avec succès', 'Succès');
    this.showTaskModal = false;
    this.isCreatingTask = false;
    this.newTask = { titre: '', description: '', priorite: 'Moyenne', dateDebut: '', dateLimite: '' };
    this.newTaskFile = null;
    this.cdr.detectChanges();
  }

  downloadConsolidatedReports(entrepreneurId: number): void {
    this.isDownloadingPdf = true;
    const token = this.getAuthToken();

    fetch(`${environment.apiUrl}/rapports/entrepreneur/${entrepreneurId}/consolidated`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rapport_Consolide_Entrepreneur_${entrepreneurId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        this.isDownloadingPdf = false;
        this.toastr.success('Le fichier a été téléchargé avec succès');
        this.cdr.detectChanges();
      })
      .catch(err => {
        console.error(err);
        this.isDownloadingPdf = false;
        this.toastr.error('Erreur lors du téléchargement du document consolidé');
        this.cdr.detectChanges();
      });
  }

  /** Récupère le token JWT depuis le localStorage ou sessionStorage */
  private getAuthToken(): string {
    return localStorage.getItem('accessToken')
      || sessionStorage.getItem('accessToken')
      || localStorage.getItem('token')
      || sessionStorage.getItem('token')
      || '';
  }
}