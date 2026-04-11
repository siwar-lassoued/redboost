import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CoachService, CoachEntrepreneurDetailDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-coach-entrepreneur-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
                <button class="btn-coach-badge">Sami Ben Salah</button>
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
                    <button class="btn-primary" (click)="showTaskModal = true">
                        <i class="pi pi-plus"></i> Ajouter une tâche
                    </button>
                </div>

            <!-- Tasks List Mockup (using data if available) -->
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
                        <p class="text-sm text-gray-500 mt-1">{{ task.description }}</p>
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
                    <button class="btn-primary"><i class="pi pi-plus"></i> Nouveau rapport</button>
                </div>

                <div *ngIf="entrepreneur.notes.length === 0" class="bg-white rounded-xl p-8 text-center text-gray-500 border border-dashed border-gray-300">
                    Aucune note de synthèse n'a été rédigée pour le moment.
                </div>

                <div *ngFor="let note of entrepreneur.notes" class="session-report-card">
                    <div class="session-report-header">
                        <div class="flex items-center gap-3">
                            <div class="avatar-sm-dark">SB</div>
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

      <!-- Ajouter une Tâche Modal (Mock) -->
      <div *ngIf="showTaskModal" class="modal-backdrop" (click)="showTaskModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                  <h2>Nouvelle tâche</h2>
                  <button class="close-btn" (click)="showTaskModal = false"><i class="pi pi-times"></i></button>
              </div>
              <div class="modal-body">
                  <div class="form-group mb-4">
                      <label>Titre de la tâche</label>
                      <input type="text" class="premium-input" placeholder="Ex: Finaliser le deck" />
                  </div>
                  <div class="form-group mb-4">
                      <label>Description détaillée</label>
                      <textarea class="premium-input" rows="3" placeholder="Description de ce qui est attendu..."></textarea>
                  </div>
                  <div class="form-group mb-6">
                      <label>Date d'échéance</label>
                      <input type="date" class="premium-input" />
                  </div>
                  <button class="btn-primary w-full justify-center" (click)="showTaskModal = false">
                      Créer la tâche
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
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: #718096;
        text-decoration: none;
        font-weight: 500;
        margin-bottom: 2rem;
        transition: color 0.2s;
    }
    .back-link:hover {
        color: #FF4D85;
    }

    .profile-header-card {
        background: white;
        border-radius: 1.5rem;
        padding: 2rem;
        display: flex;
        align-items: center;
        gap: 2rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        margin-bottom: 2rem;
    }
    .avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.8rem;
        color: white;
    }
    .pink-avatar { background: linear-gradient(135deg, #FF6B9E, #FF3366); }

    .profile-info {
        flex: 1;
    }
    .profile-info h1 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        color: #2D3748;
    }
    .startup-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .program-badge {
        font-size: 0.8rem;
        font-weight: 700;
        background: #EDF2F7;
        color: #4A5568;
        padding: 0.3rem 0.8rem;
        border-radius: 6px;
        letter-spacing: 1px;
    }
    .company-name {
        color: var(--coach-primary);
        font-weight: 600;
        font-size: 1.1rem;
    }

    .header-actions {
        display: flex;
        gap: 1rem;
    }
    .btn-primary {
        background: var(--gradient-pink);
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: transform 0.2s;
        box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);
    }
    .btn-primary:hover { transform: translateY(-2px); }
    
    .btn-secondary {
        background: white;
        border: 1px solid #E2E8F0;
        color: #4A5568;
        padding: 0.8rem 1.5rem;
        border-radius: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    .btn-secondary:hover {
        background: #F8FAFC;
        border-color: #CBD5E0;
    }

    .custom-tabs {
        display: flex;
        gap: 2rem;
        border-bottom: 2px solid #EDF2F7;
        margin-bottom: 2rem;
    }
    .tab {
        background: none;
        border: none;
        padding: 1rem 0;
        font-size: 1.05rem;
        font-weight: 600;
        color: #A0AEC0;
        cursor: pointer;
        position: relative;
        transition: color 0.2s;
    }
    .tab:hover { color: #4A5568; }
    .tab.active {
        color: var(--coach-primary);
    }
    .tab.active::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--coach-primary);
        border-radius: 3px 3px 0 0;
    }

    .badge {
        font-size: 0.75rem;
        padding: 0.3rem 0.8rem;
        border-radius: 12px;
        font-weight: 600;
    }
    .badge-warning { background: #FFF5F5; color: #E53E3E; border: 1px solid #FED7D7; }
    .badge-success { background: #F0FFF4; color: #38A169; border: 1px solid #C6F6D5; }

    /* Modal Styles matching the existing UI components */
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.4);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .modal-content {
        background: white;
        border-radius: 1.5rem;
        width: 100%;
        max-width: 500px;
        padding: 2rem;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        animation: slide-up 0.3s ease-out;
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    .modal-header h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #2D3748;
        margin: 0;
    }
    .close-btn {
        background: none;
        border: none;
        font-size: 1.2rem;
        color: #A0AEC0;
        cursor: pointer;
    }
    
    .form-group label {
        display: block;
        font-size: 0.95rem;
        font-weight: 600;
        color: #4A5568;
        margin-bottom: 0.5rem;
    }
    .premium-input {
        width: 100%;
        padding: 0.8rem 1rem;
        border-radius: 10px;
        border: 1px solid #E2E8F0;
        background: #F8FAFC;
        font-family: inherit;
        font-size: 1rem;
        color: #2D3748;
        outline: none;
        transition: all 0.2s;
    }
    .premium-input:focus {
        border-color: #FF4D85;
        box-shadow: 0 0 0 3px rgba(255, 77, 133, 0.1);
        background: white;
    }

    .upload-zone {
        border: 2px dashed #CBD5E0;
        border-radius: 1rem;
        background: #F8FAFC;
        cursor: pointer;
        transition: all 0.2s;
    }
    .upload-zone:hover {
        border-color: #FF4D85;
        background: #FFF5F7;
    }

    .btn-icon { background: none; border: none; color: #A0AEC0; cursor: pointer; padding: 0.5rem; transition: color 0.2s; border-radius: 50%; }
    .btn-icon:hover { color: #2D3748; background: #F7FAFC; }

    .search-bar {
        position: relative;
    }
    .search-bar input {
        width: 100%;
        padding: 0.8rem 1rem 0.8rem 2.8rem;
        border-radius: 12px;
        border: 1px solid #E2E8F0;
        background: white;
        font-family: inherit;
        font-size: 0.95rem;
        transition: all 0.2s;
    }
    .search-bar input:focus {
        outline: none;
        border-color: #FF4D85;
        box-shadow: 0 0 0 3px rgba(255, 77, 133, 0.1);
    }
    .search-bar i {
        position: absolute;
        left: 1.2rem;
        top: 50%;
        transform: translateY(-50%);
        color: #A0AEC0;
    }

    @keyframes slide-up {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    /* === New enriched styles === */
    .purple-avatar { background: linear-gradient(135deg, #B794F4, #805AD5); }
    .startup-sub { color: #718096; font-size: 0.95rem; }
    .project-desc { color: #4A5568; font-size: 0.9rem; margin-top: 0.5rem; line-height: 1.5; }

    .btn-coach-badge {
        background: #1A202C;
        color: white;
        border: none;
        padding: 0.5rem 1.2rem;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: default;
    }

    .stats-bar {
        background: white;
        border-radius: 1rem;
        padding: 1rem 2rem;
        display: flex;
        gap: 3rem;
        box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        margin-bottom: 2rem;
        border: 1px solid #EDF2F7;
    }
    .stat-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #4A5568; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot-pink { background: #FF4D85; }
    .dot-green { background: #48BB78; }

    .tab-badge {
        background: #FFF5F5;
        color: #E53E3E;
        font-size: 0.7rem;
        padding: 0.2rem 0.5rem;
        border-radius: 8px;
        font-weight: 700;
        margin-left: 0.4rem;
    }
    .tab-count {
        background: #EDF2F7;
        color: #4A5568;
        font-size: 0.7rem;
        padding: 0.15rem 0.5rem;
        border-radius: 8px;
        font-weight: 700;
        margin-left: 0.4rem;
    }

    /* Livrables enriched */
    .livrable-stats {
        display: flex;
        gap: 2rem;
        padding: 1rem 1.5rem;
        background: white;
        border-radius: 1rem;
        border: 1px solid #EDF2F7;
        margin-bottom: 1.5rem;
    }
    .livrable-stat { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #4A5568; }

    .livrable-card {
        background: white;
        border-radius: 1rem;
        padding: 1.5rem;
        margin-bottom: 1rem;
        border: 1px solid #EDF2F7;
        box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }
    .livrable-highlight { border-left: 4px solid #ED8936; }
    .livrable-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }

    .tag { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: 700; }
    .tag-red { background: #FFF5F5; color: #E53E3E; }
    .tag-blue { background: #EBF4FF; color: #3182CE; }
    .tag-gray { background: #EDF2F7; color: #718096; }
    .tag-green { background: #F0FFF4; color: #38A169; }

    .livrable-file { display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem; background: #F8FAFC; border-radius: 10px; }
    .link-voir, .link-dl {
        background: none;
        border: none;
        color: #3182CE;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.3rem;
    }
    .link-dl { color: #718096; }

    .livrable-actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .btn-accept {
        flex: 1;
        background: linear-gradient(135deg, #48BB78, #38A169);
        color: white;
        border: none;
        padding: 0.8rem;
        border-radius: 10px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: transform 0.2s;
    }
    .btn-accept:hover { transform: translateY(-2px); }
    .btn-revision {
        flex: 1;
        background: linear-gradient(135deg, #ED8936, #DD6B20);
        color: white;
        border: none;
        padding: 0.8rem;
        border-radius: 10px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: transform 0.2s;
    }
    .btn-revision:hover { transform: translateY(-2px); }

    /* Reporting Sessions */
    .session-report-card { border-radius: 1rem; overflow: hidden; margin-bottom: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
    .session-report-header {
        background: linear-gradient(135deg, #2D3748, #1A202C);
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .avatar-sm-dark {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 0.85rem;
    }
    .stars { display: flex; gap: 0.2rem; }
    .session-report-body { padding: 1.5rem; background: white; }
    .session-report-body p { margin: 0 0 1rem 0; line-height: 1.6; }
    .plan-action { margin-top: 1rem; }
    .plan-title { font-size: 0.75rem; font-weight: 700; color: #A0AEC0; letter-spacing: 1px; margin-bottom: 0.6rem; }
    .plan-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #4A5568; margin-bottom: 0.4rem; }
  `]
})
export class CoachEntrepreneurDetailComponent implements OnInit {
  activeTab: string = 'taches';
  showTaskModal: boolean = false;
  entrepreneur: CoachEntrepreneurDetailDTO | null = null;
  isLoading: boolean = true;
  coachId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private coachService: CoachService,
    private authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const rawCoachId = this.authService.getUserId();
    this.coachId = typeof rawCoachId === 'string' ? parseInt(rawCoachId, 10) : rawCoachId;
    
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

  loadEntrepreneurDetails(coachId: number, entrepreneurId: number): void {
    this.isLoading = true;
    this.coachService.getEntrepreneurDetail(coachId, entrepreneurId).subscribe({
      next: (data) => {
        this.entrepreneur = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading entrepreneur details:', err);
        this.isLoading = false;
        this.toastr.error('Erreur lors du chargement des détails', 'Erreur');
        this.cdr.detectChanges();
      }
    });
  }
}
