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
    <div class="p-6 md:p-8 min-h-screen" style="background: #fcfdfe; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div *ngIf="isLoading" class="flex flex-col items-center justify-center h-64 text-gray-500">
        <i class="pi pi-spin pi-spinner text-4xl mb-4" style="color: #ff3d91;"></i>
        <p>Chargement du profil...</p>
      </div>

      <div *ngIf="!isLoading && entrepreneur">
        <!-- Back + Header -->
        <div class="mb-6">
          <a
            routerLink="/coach-entrepreneurs"
            class="flex items-center gap-2 text-sm mb-4 transition-colors"
            style="color: #8a8a8a; text-decoration: none;"
          >
            <i class="pi pi-arrow-left" style="font-size: 1rem;"></i>
            <span class="hover:text-[#ff3d91]">Retour aux entrepreneurs</span>
          </a>

          <!-- Page header -->
          <div class="flex items-start justify-between gap-4 mb-5">
            <div class="flex items-center gap-4">
              <div
                class="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                [style.background]="getAvatarGradient(entrepreneur)"
              >
                {{ getInitials(entrepreneur) }}
              </div>
              <div>
                <h1 style="font-size: 22px; font-weight: 700; color: #000; margin: 0;">
                  {{ entrepreneur.firstName }} {{ entrepreneur.lastName }}
                </h1>
                <p style="font-size: 13px; color: #8a8a8a; margin-top: 3px;">
                  {{ entrepreneur.entreprise || 'Startup' }} · {{ entrepreneur.secteur || 'Non spécifié' }}
                </p>
                <p style="font-size: 13px; color: #374151; margin-top: 8px; line-height: 1.5; max-width: 600px;">
                  <strong style="color: #000;">Description du projet : </strong>
                  {{ entrepreneur.startupDescription || 'Aucune description fournie.' }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              <div *ngIf="getTasksOverdueCount() > 0"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style="background: #FEE2E2; color: #DC2626;"
              >
                <i class="pi pi-exclamation-triangle" style="font-size: 12px;"></i>
                {{ getTasksOverdueCount() }} tâches en retard
              </div>
              <div
                class="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style="background: #1A3A3A; color: #FFFFFF; font-size: 13px; font-weight: 600;"
              >
                <div style="width: 6px; height: 6px; border-radius: 50%; background: #3aafff; flex-shrink: 0;"></div>
                Coach Assigné
              </div>
            </div>
          </div>

          <!-- Mini KPI bar -->
          <div
            class="bg-white rounded-xl px-5 py-3 flex items-center gap-6 flex-wrap"
            style="box-shadow: 0 1px 4px rgba(0,0,0,0.06);"
          >
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" style="background: #ff3d91;"></div>
              <span style="font-size: 13px; color: #8a8a8a;">Progression</span>
              <span style="font-size: 13px; font-weight: 700; color: #000;">{{ entrepreneur.completionRate || 0 }}%</span>
            </div>
            <div class="w-px h-5 bg-gray-200"></div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" style="background: #3aafff;"></div>
              <span style="font-size: 13px; color: #8a8a8a;">Livrables validés</span>
              <span style="font-size: 13px; font-weight: 700; color: #000;">{{ getValidatedDeliverablesCount() }}</span>
            </div>
            <div class="w-px h-5 bg-gray-200"></div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" [style.background]="getTasksOverdueCount() > 0 ? '#EF4444' : '#22C55E'"></div>
              <span style="font-size: 13px; color: #8a8a8a;">Tâches en retard</span>
              <span style="font-size: 13px; font-weight: 700;" [style.color]="getTasksOverdueCount() > 0 ? '#EF4444' : '#000'">{{ getTasksOverdueCount() }}</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-0 border-b border-gray-200 mb-5 overflow-x-auto">
          <button
            (click)="activeTab = 'taches'"
            class="py-3 px-5 text-sm font-semibold border-b-2 transition-all capitalize whitespace-nowrap"
            [ngClass]="activeTab === 'taches' ? 'border-[#ff3d91] text-[#ff3d91]' : 'border-transparent text-gray-500 hover:text-gray-700'"
          >
            Tâches
          </button>
          <button
            (click)="activeTab = 'livrables'"
            class="py-3 px-5 text-sm font-semibold border-b-2 transition-all capitalize whitespace-nowrap"
            [ngClass]="activeTab === 'livrables' ? 'border-[#ff3d91] text-[#ff3d91]' : 'border-transparent text-gray-500 hover:text-gray-700'"
          >
            Livrables
            <span class="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full" 
                  [style.background]="getPendingReviewCount() > 0 ? '#fff0f5' : '#F3F4F6'"
                  [style.color]="getPendingReviewCount() > 0 ? '#ff3d91' : '#6B7280'">
              {{ getPendingReviewCount() > 0 ? getPendingReviewCount() + ' à valider' : (entrepreneur.livrables.length || 0) }}
            </span>
          </button>
          <button
            (click)="activeTab = 'reporting'"
            class="py-3 px-5 text-sm font-semibold border-b-2 transition-all capitalize whitespace-nowrap"
            [ngClass]="activeTab === 'reporting' ? 'border-[#ff3d91] text-[#ff3d91]' : 'border-transparent text-gray-500 hover:text-gray-700'"
          >
            Reporting Sessions
            <span class="ml-1.5 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{{ entrepreneur.notes.length || 0 }}</span>
          </button>
          
          <button
            *ngIf="activeTab === 'taches' || activeTab === 'reporting'"
            (click)="activeTab === 'taches' ? openTaskModal() : goToCreateReport(entrepreneur.id)"
            class="ml-auto flex items-center gap-1.5 px-4 py-2 mb-1 rounded-xl text-sm font-semibold text-white flex-shrink-0 hover:opacity-90 transition-opacity"
            style="background: #ff3d91;"
          >
            <i class="pi pi-plus" style="font-size: 14px;"></i>
            {{ activeTab === 'taches' ? 'Ajouter une tâche' : 'Nouveau rapport' }}
          </button>
        </div>

        <!-- Tâches Tab -->
        <div *ngIf="activeTab === 'taches'" class="space-y-3">
          <div *ngIf="!entrepreneur?.tasks?.length" class="text-center py-20">
            <i class="pi pi-check-circle mx-auto mb-4 text-green-400" style="font-size: 48px;"></i>
            <p class="text-gray-500 font-medium">Aucune tâche assignée</p>
          </div>
          
          <div *ngFor="let tache of entrepreneur?.tasks" class="bg-white rounded-2xl p-4 flex items-center gap-4" style="box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                <p class="font-medium text-[#1A1A2E] text-sm">{{ tache.titre }}</p>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      [style.background]="tache.status === 'TERMINEE' ? '#D1FAE5' : (tache.status === 'EN_COURS' ? '#DBEAFE' : '#FEE2E2')"
                      [style.color]="tache.status === 'TERMINEE' ? '#059669' : (tache.status === 'EN_COURS' ? '#2563EB' : '#DC2626')">
                  {{ tache.status === 'TERMINEE' ? 'Terminé' : (tache.status === 'EN_COURS' ? 'En cours' : 'À faire') }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-1" *ngIf="tache.description">{{ tache.description }}</p>
            </div>
            <div class="text-right flex-shrink-0" *ngIf="tache.status === 'TERMINEE'">
              <i class="pi pi-check-circle text-green-500" style="font-size: 24px;"></i>
            </div>
          </div>
        </div>

        <!-- Livrables Tab -->
        <div *ngIf="activeTab === 'livrables'">
          <div class="flex items-center gap-4 mb-5 p-4 bg-white rounded-2xl" style="box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                <i class="pi pi-check-circle text-green-600" style="font-size: 16px;"></i>
              </div>
              <div>
                <p class="text-xs text-gray-400">Livrables reçus</p>
                <p class="text-sm font-bold text-[#1A1A2E]">{{ entrepreneur.livrables.length || 0 }}</p>
              </div>
            </div>
            <div class="w-px h-8 bg-gray-200"></div>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                <i class="pi pi-exclamation-triangle text-amber-600" style="font-size: 16px;"></i>
              </div>
              <div>
                <p class="text-xs text-gray-400">En révision</p>
                <p class="text-sm font-bold text-[#1A1A2E]">{{ getRevisionCount() }}</p>
              </div>
            </div>
            <div class="w-px h-8 bg-gray-200" *ngIf="getPendingReviewCount() > 0"></div>
            <div class="flex items-center gap-2" *ngIf="getPendingReviewCount() > 0">
              <div class="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                <i class="pi pi-eye text-[#ff3d91]" style="font-size: 16px;"></i>
              </div>
              <div>
                <p class="text-xs text-gray-400">À valider</p>
                <p class="text-sm font-bold text-[#ff3d91]">{{ getPendingReviewCount() }}</p>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div *ngIf="!entrepreneur?.livrables?.length" class="text-center py-20">
              <div class="text-5xl mb-4">📦</div>
              <p class="text-gray-500 font-medium">Aucun livrable soumis</p>
            </div>

            <div *ngFor="let del of entrepreneur?.livrables" 
                 class="rounded-xl overflow-hidden bg-white"
                 style="box-shadow: 0 2px 8px rgba(0,0,0,0.06);"
                 [style.border-left]="del.statut === 'ACCEPTED' || del.statut === 'VALIDE' || del.statut === 'APPROUVE' ? '4px solid #22C55E' : (del.statut === 'REVISION' || del.statut === 'EN_REVISION' ? '4px solid #F97316' : '4px solid #F59E0B')">
              <div class="p-4">
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="flex items-start gap-2 flex-1 min-w-0">
                    <span class="text-base mt-0.5 flex-shrink-0">
                      <i *ngIf="del.statut === 'ACCEPTED' || del.statut === 'VALIDE' || del.statut === 'APPROUVE'" class="pi pi-check-circle text-green-500"></i>
                      <i *ngIf="del.statut === 'REVISION' || del.statut === 'EN_REVISION'" class="pi pi-refresh text-orange-400"></i>
                      <i *ngIf="!['ACCEPTED', 'VALIDE', 'APPROUVE', 'REVISION', 'EN_REVISION'].includes(del.statut)" class="pi pi-clock text-amber-400"></i>
                    </span>
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-[#1A1A2E] leading-snug">{{ del.tacheTitre || 'Livrable' }}</p>
                      <p class="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><i class="pi pi-calendar"></i> {{ del.dateUpload | date:'d MMM yyyy' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-xs px-2.5 py-1 rounded-full font-semibold"
                          [style.background]="['ACCEPTED', 'VALIDE', 'APPROUVE'].includes(del.statut) ? '#D1FAE5' : (['REVISION', 'EN_REVISION'].includes(del.statut) ? '#FEF3C7' : '#FEF9C3')"
                          [style.color]="['ACCEPTED', 'VALIDE', 'APPROUVE'].includes(del.statut) ? '#065F46' : (['REVISION', 'EN_REVISION'].includes(del.statut) ? '#B45309' : '#92400E')">
                      {{ ['ACCEPTED', 'VALIDE', 'APPROUVE'].includes(del.statut) ? 'Accepté' : (['REVISION', 'EN_REVISION'].includes(del.statut) ? 'À réviser' : 'En attente') }}
                    </span>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50">
                    <span class="text-lg"><i class="pi" [ngClass]="del.nom.endsWith('.pdf') ? 'pi-file-pdf text-red-500' : 'pi-file text-blue-500'"></i></span>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-medium text-gray-800 truncate">{{ del.nom }}</p>
                      <p class="text-[10px] text-gray-400 flex items-center gap-1">Document <i class="pi pi-calendar" style="font-size:9px"></i> {{ del.dateUpload | date:'d MMM yyyy' }}</p>
                    </div>
                    <div class="flex gap-1.5">
                      <a [href]="del.url" target="_blank" class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" style="text-decoration:none;">
                        <i class="pi pi-eye" style="font-size: 12px;"></i> Voir
                      </a>
                      <a [href]="del.url" download class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors" style="text-decoration:none;">
                        <i class="pi pi-download" style="font-size: 12px;"></i> DL
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Reporting Tab -->
        <div *ngIf="activeTab === 'reporting'">
          <div *ngIf="!entrepreneur?.notes?.length" class="text-center py-20">
            <i class="pi pi-file mx-auto mb-4 text-gray-200" style="font-size: 48px;"></i>
            <p class="text-gray-500 font-medium">Aucun rapport de missions pour l'instant</p>
          </div>
          
          <div class="space-y-4">
            <div *ngFor="let note of entrepreneur?.notes" class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div class="px-5 py-4 flex items-center justify-between" style="background: linear-gradient(135deg, #1A2035, #2C3E50);">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-sm">
                    <i class="pi pi-user"></i>
                  </div>
                  <div>
                    <p class="text-white font-semibold text-sm">Session Coach</p>
                    <p class="text-white/60 text-xs">{{ note.date | date:'mediumDate' }}</p>
                  </div>
                </div>
              </div>
              <div class="p-5">
                <p class="text-sm text-gray-600 mb-4 leading-relaxed">{{ note.synthese }}</p>
                <div *ngIf="note.appreciation">
                  <p class="text-xs font-semibold text-gray-400 mb-2">APPRÉCIATION</p>
                  <div class="flex items-start gap-2">
                    <i class="pi pi-check-circle text-green-500 mt-0.5 flex-shrink-0" style="font-size: 14px;"></i>
                    <p class="text-sm text-gray-700">{{ note.appreciation }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Task Modal -->
        <div *ngIf="showTaskModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.5);">
          <div class="bg-white rounded-2xl w-full max-w-lg overflow-hidden" style="box-shadow: 0 20px 60px rgba(0,0,0,0.2);">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 class="font-bold text-lg text-[#1A1A2E]">Ajouter une tâche</h3>
                <p class="text-xs text-gray-400 mt-0.5">Créez une nouvelle tâche pour cet entrepreneur</p>
              </div>
              <button (click)="showTaskModal = false" class="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <i class="pi pi-times" style="font-size: 18px;"></i>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Titre de la tâche *</label>
                <input type="text" [(ngModel)]="newTask.titre" placeholder="Ex: Préparer le Business Model Canvas" class="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#ff3d91] transition-colors" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea [(ngModel)]="newTask.description" rows="3" class="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#ff3d91] resize-none transition-colors"></textarea>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Date limite *</label>
                <input type="date" [(ngModel)]="newTask.dateLimite" class="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#ff3d91] transition-colors" />
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3" style="background: #fafafa;">
              <button (click)="showTaskModal = false" class="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">Annuler</button>
              <button (click)="submitNewTask()" [disabled]="isCreatingTask || !newTask.titre || !newTask.dateLimite" class="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed" style="background: linear-gradient(135deg, #1A3A3A, #C0392B);">
                <i *ngIf="isCreatingTask" class="pi pi-spin pi-spinner"></i>
                {{ isCreatingTask ? 'Création...' : 'Créer la tâche' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes spin { to { transform: rotate(360deg); } }
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

  getAvatarGradient(ent: any): string {
    const colors = [
        ['#FF4D85', '#FF758C'],
        ['#7C3AED', '#A78BFA'],
        ['#2563EB', '#60A5FA'],
        ['#059669', '#34D399'],
        ['#D97706', '#FBBF24']
    ];
    const index = (ent.id || 0) % colors.length;
    return `linear-gradient(135deg, ${colors[index][0]} 0%, ${colors[index][1]} 100%)`;
  }

  getInitials(ent: any): string {
    if (!ent.firstName && !ent.lastName) return 'E';
    return ((ent.firstName?.[0] || '') + (ent.lastName?.[0] || '')).toUpperCase();
  }

  getStatusInfo(status: string) {
    switch (status) {
      case 'ACCEPTED':
      case 'VALIDE':
      case 'APPROVED':
      case 'APPROUVE':
        return { text: 'Accepté', class: 'status-accepted', icon: 'pi pi-check-circle' };
      case 'REVISION':
      case 'EN_REVISION':
        return { text: 'À réviser', class: 'status-revision', icon: 'pi pi-refresh' };
      case 'REJECTED':
      case 'REJETE':
        return { text: 'Rejeté', class: 'status-rejected', icon: 'pi pi-times-circle' };
      case 'PENDING':
      case 'PENDING_REVIEW':
      case 'SOUMIS':
      case 'SUBMITTED':
      default:
        return { text: 'En attente', class: 'status-pending', icon: 'pi pi-clock' };
    }
  }

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

  getTasksOverdueCount(): number {
    if (!this.entrepreneur || !this.entrepreneur.tasks) return 0;
    const now = new Date();
    // Assuming tasks might have dateLimite, if not it just won't throw
    return this.entrepreneur.tasks.filter(t => t.dateLimite && new Date(t.dateLimite) < now && t.status !== 'TERMINEE').length;
  }

  getPendingReviewCount(): number {
    if (!this.entrepreneur || !this.entrepreneur.livrables) return 0;
    return this.entrepreneur.livrables.filter(l => l.statut === 'PENDING' || l.statut === 'SOUMIS' || l.statut === 'PENDING_REVIEW').length;
  }

  getRevisionCount(): number {
    if (!this.entrepreneur || !this.entrepreneur.livrables) return 0;
    return this.entrepreneur.livrables.filter(l => l.statut === 'REVISION' || l.statut === 'EN_REVISION').length;
  }

  getValidatedDeliverablesCount(): number {
    if (!this.entrepreneur || !this.entrepreneur.livrables) return 0;
    return this.entrepreneur.livrables.filter(l => l.statut === 'ACCEPTED' || l.statut === 'VALIDE' || l.statut === 'APPROUVE').length;
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