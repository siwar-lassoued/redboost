import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachService, SessionCoachDTO, SeanceExceptionnelleDTO, CoachEntrepreneurDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { forkJoin, firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-coach-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cand-page">
      <!-- PAGE HEADER -->
      <div class="cand-header">
          <div>
              <h1 class="cand-title">Mes Sessions</h1>
              <p class="cand-subtitle">Gérez et suivez vos créneaux de coaching et séances exceptionnelles</p>
          </div>
          <div class="cand-header-actions" style="display: flex; gap: 12px; align-items: center;">
              <button class="btn-primary shadow-glow" (click)="openExceptionnelleModal()">
                  <i class="pi pi-plus" style="margin-right: 8px;"></i> Ajouter une séance exceptionnelle
              </button>
             <p class="cand-count-badge">{{filteredSessions.length}} Session{{filteredSessions.length > 1 ? 's' : ''}} au total</p>
          </div>
      </div>

      <!-- TABS & FILTERS -->
      <div class="sessions-nav-header">
        <div class="status-tabs">
          <button (click)="setFilter('en_cours')" [class.active]="activeFilter === 'en_cours'" class="tab-btn">
            <i class="pi pi-calendar"></i> En cours
          </button>
          <button (click)="setFilter('termine')" [class.active]="activeFilter === 'termine'" class="tab-btn">
            <i class="pi pi-check-circle"></i> Terminées
          </button>
          <button (click)="setFilter('annule')" [class.active]="activeFilter === 'annule'" class="tab-btn">
            <i class="pi pi-times-circle"></i> Annulées
          </button>
        </div>

        <div class="filters-secondary">
          <div class="search-wrap">
              <i class="pi pi-search search-icon"></i>
              <input type="text" placeholder="Rechercher une session..." [(ngModel)]="searchTerm" (ngModelChange)="filterSessions()" class="search-input" />
          </div>
          
          <div class="filter-wrap" style="min-width: 220px;">
              <select [(ngModel)]="selectedEntrepreneurId" (change)="filterSessions()" class="filter-select" style="width: 100%;">
                <option [ngValue]="0">Tous les entrepreneurs</option>
                <option *ngFor="let ent of entrepreneurs" [value]="ent.id">{{ ent.firstName }} {{ ent.lastName }}</option>
              </select>
          </div>
          <label class="toggle-exceptionnelle">
            <input type="checkbox" [(ngModel)]="showExceptionnelle" (change)="filterSessions()">
            <span class="toggle-label">Sessions exceptionnelles</span>
          </label>
        </div>
      </div>

      <!-- SESSIONS TABLE -->
      @if (filteredSessions.length > 0) {
        <div class="table-card">
          <div class="table-scroll">
            <table class="cand-table">
              <thead>
                <tr>
                  <th>Titre de la Session</th>
                  <th>Dates & Horaires</th>
                  <th>Nom de l'entrepreneur</th>
                  <th>Type</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <ng-container *ngFor="let s of filteredSessions">
                  <tr class="table-row">
                    <td>
                      <div class="name-cell">
                        <div class="flex items-center gap-2">
                          <span class="name-text">{{ s.titre }}</span>
                          <span *ngIf="s.isExceptionnelle" class="exception-badge">Exceptionnelle</span>
                        </div>
                        <span class="email-text" *ngIf="s.programmeNom">{{ s.programmeNom }} <span *ngIf="s.thematiqueNom">- {{ s.thematiqueNom }}</span></span>
                        <span class="email-text" *ngIf="!s.programmeNom && s.thematiqueNom">{{ s.thematiqueNom }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="date-cell-custom">
                        <div class="mini-date-badge">
                           {{ s.dateSession | date:'dd/MM/yyyy' }} de {{ s.heureDebut.substring(0,5) }} à {{ s.heureFin.substring(0,5) }}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="name-cell">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                          <span class="name-text" *ngIf="s.isBooked && s.entrepreneurName">{{ s.entrepreneurName }}</span>
                          <button *ngIf="s.isBooked" (click)="openReclamationModal(s)" title="Signaler un problème" 
                            style="background: transparent; border: 1px solid #EF4444; color: #EF4444; border-radius: 6px; padding: 2px 6px; cursor: pointer; font-size: 10px;">
                            <i class="pi pi-exclamation-triangle"></i>
                          </button>
                        </div>
                        <span class="text-sm text-gray-400 italic" *ngIf="!s.isBooked || !s.entrepreneurName">Non réservé</span>
                      </div>
                    </td>
                    <td>
                      <ng-container *ngIf="s.typeSession === 'EN_LIGNE'">
                        <a *ngIf="s.meetLink" [href]="s.meetLink" target="_blank" class="type-badge online" style="text-decoration:none; cursor:pointer; background:#E0F2FE; color:#0369A1;" title="Rejoindre le Meet">
                          <i class="pi pi-video"></i> Rejoindre Meet
                        </a>
                        <span *ngIf="!s.meetLink" class="type-badge online">
                          <i class="pi pi-video"></i> En ligne
                        </span>
                      </ng-container>
                      <span *ngIf="s.typeSession === 'PRESENTIEL'" class="type-badge presentiel">
                        <i class="pi pi-building"></i> Présentiel
                      </span>
                    </td>
                    <td>
                      <div class="status-badge" 
                        [class.upcoming]="isUpcoming(s) && !hasCancelled(s)" 
                        [class.past]="!isUpcoming(s) && !hasCancelled(s)"
                        [class.cancelled]="hasCancelled(s)">
                        <i class="pi" 
                          [class.pi-calendar-clock]="isUpcoming(s) && !hasCancelled(s)" 
                          [class.pi-check-circle]="!isUpcoming(s) && !hasCancelled(s)"
                          [class.pi-times-circle]="hasCancelled(s)"></i>
                        {{ hasCancelled(s) ? 'Annulée' : (isUpcoming(s) ? 'À venir' : 'Terminée') }}
                      </div>
                    </td>

                  </tr>
                </ng-container>
              </tbody>
            </table>
          </div>
        </div>
      } @else if (!loading) {
        <div class="empty-state">
          <i class="pi pi-calendar-times" style="font-size: 3rem; color: #D1D5DB; margin-bottom: 1rem; display: block;"></i>
          <p class="empty-text">Aucune session trouvée</p>
          <p class="empty-sub">Ajustez vos filtres ou créez de nouvelles disponibilités.</p>
        </div>
      }

      <!-- Modal Planifier une séance exceptionnelle -->
      <div *ngIf="showExceptionnelleModal" class="modal-overlay" (click)="closeExceptionnelleModal()">
          <div class="modal-box" (click)="$event.stopPropagation()">
              <div class="modal-header">
                  <div class="modal-header-info">
                      <h2 class="modal-name">Planifier une séance exceptionnelle</h2>
                      <p class="modal-subtitle" style="color: #64748B; font-size: 13px;">En dehors de vos disponibilités habituelles</p>
                  </div>
                  <button class="modal-close" (click)="closeExceptionnelleModal()"><i class="pi pi-times"></i></button>
              </div>
              <div class="modal-body">
                  <div class="form-group" style="margin-bottom: 12px;">
                      <label style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block;">Thématique *</label>
                      <select class="search-input" [(ngModel)]="newSeance.thematiqueId" (ngModelChange)="onThematiqueChange()" style="padding: 10px 16px;">
                          <option [ngValue]="undefined">Sélectionnez une thématique...</option>
                          <option *ngFor="let t of thematiques" [ngValue]="t.id">{{ t.nom }}</option>
                      </select>
                  </div>
                  <div class="form-group" style="margin-bottom: 12px;">
                      <label style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block;">Titre de la séance (modèle) *</label>
                      <select class="search-input" [(ngModel)]="newSeance.titre" [disabled]="!newSeance.thematiqueId" style="padding: 10px 16px;">
                          <option value="">Sélectionnez une session...</option>
                          <option *ngFor="let title of availableTitles" [ngValue]="title">{{ title }}</option>
                      </select>
                  </div>
                  <div class="form-group" style="margin-bottom: 12px;">
                      <label style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block;">Entrepreneur *</label>
                      <select class="search-input" [(ngModel)]="newSeance.entrepreneurId" [disabled]="!newSeance.thematiqueId" style="padding: 10px 16px;">
                          <option [ngValue]="0">Sélectionnez un entrepreneur...</option>
                          <option *ngFor="let e of filteredEntrepreneurs" [ngValue]="e.id">{{ e.firstName }} {{ e.lastName }} — {{ e.entreprise || 'N/A' }}</option>
                      </select>
                  </div>
                  <div class="form-row" style="display: flex; gap: 12px; margin-bottom: 12px;">
                      <div class="form-group" style="flex: 1;">
                          <label style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block;">Date *</label>
                          <input type="date" class="search-input" [(ngModel)]="newSeance.dateSeance" style="padding: 10px 16px;">
                      </div>
                      <div class="form-group" style="flex: 1;">
                          <label style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block;">Début *</label>
                          <input type="time" class="search-input" [(ngModel)]="newSeance.heureDebut" style="padding: 10px 16px;">
                      </div>
                      <div class="form-group" style="flex: 1;">
                          <label style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block;">Fin *</label>
                          <input type="time" class="search-input" [(ngModel)]="newSeance.heureFin" style="padding: 10px 16px;">
                      </div>
                  </div>
                  <div *ngIf="modalError" style="color: #E53E3E; background: #FFF5F5; padding: 10px; border-radius: 8px; font-size: 13px; margin-top: 12px;">
                      <i class="pi pi-exclamation-triangle"></i> {{ modalError }}
                  </div>
              </div>
              <div class="modal-footer">
                  <button class="btn-close-modal" (click)="closeExceptionnelleModal()" style="margin-right: 12px;">Annuler</button>
                  <button class="btn-detail" (click)="submitSeanceExceptionnelle()" [disabled]="savingSeance" style="background: #ea5073; color: white;">
                      <i class="pi" [class.pi-check]="!savingSeance" [class.pi-spin]="savingSeance" [class.pi-spinner]="savingSeance" style="margin-right: 6px;"></i>
                      {{ savingSeance ? 'Planification...' : 'Planifier' }}
                  </button>
              </div>
          </div>
      </div>

      <!-- Main Loading Overlay -->
      <div *ngIf="loading" class="modal-overlay" style="background: rgba(255,255,255,0.7)">
          <div class="spinner"></div>
      </div>

      <!-- Reclamation Modal -->
      <div *ngIf="showReclamationModal" class="modal-overlay" (click)="closeReclamationModal()">
        <div class="modal-box max-w-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-header-info">
              <h3 class="modal-name" style="color: #EF4444;"><i class="pi pi-exclamation-triangle"></i> Signaler un problème</h3>
              <p class="modal-meta" style="margin-top: 4px; color: #64748B;">Signaler l'entrepreneur : <strong style="color: #1E293B;">{{reclamationTarget?.entrepreneurName}}</strong></p>
            </div>
            <button (click)="closeReclamationModal()" class="modal-close"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
            <div class="form-group">
              <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Sujet de la réclamation</label>
              <input type="text" [(ngModel)]="reclamationData.sujet" class="search-input" placeholder="Ex: Absence non justifiée" />
            </div>
            <div class="form-group">
              <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Type de problème</label>
              <select [(ngModel)]="reclamationData.typeReclamation" class="filter-select w-full" style="width: 100%;">
                <option value="RETARD">Retard excessif</option>
                <option value="COMPORTEMENT">Comportement inapproprié</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div class="form-group">
              <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Description détaillée</label>
              <textarea [(ngModel)]="reclamationData.description" rows="4" class="search-input" style="width: 100%; border-radius: 12px; resize: none; padding: 12px;" placeholder="Décrivez le problème rencontré..."></textarea>
            </div>
          </div>
          <div class="modal-footer" style="gap: 12px;">
            <button (click)="closeReclamationModal()" class="btn-close-modal">Annuler</button>
            <button (click)="submitReclamation()" class="action-buttons" style="background: #EF4444; color: white; border: none; padding: 10px 24px; border-radius: 12px; font-weight: 700; cursor: pointer;">
              <i class="pi pi-send"></i> Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cand-page { padding: 24px; background: #F5F6FA; min-height: 100vh; position: relative; }
    .cand-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .cand-title { font-size: 28px; font-weight: 800; color: #1A1A2E; margin: 0; }
    .cand-subtitle { color: #8a8a8a; font-size: 14px; margin-top: 4px; }
    .cand-count-badge { background: #E2E8F0; color: #4A5568; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    
    .cand-filters { display: flex; align-items: stretch; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .search-wrap { position: relative; flex: 1; min-width: 200px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9CA3AF; }
    .search-input {
      width: 100%; padding: 10px 16px 10px 40px; border: 1px solid #E5E7EB;
      border-radius: 12px; font-size: 14px; outline: none; color: #333; transition: border-color .2s; background: #fff; box-sizing: border-box;
    }
    .filter-select { padding: 10px 14px; border: 1px solid #E5E7EB; border-radius: 12px; font-size: 13px; outline: none; color: #333; cursor: pointer; background: #fff; }

    .sessions-nav-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
    .status-tabs { display: flex; background: #fff; padding: 6px; border-radius: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .tab-btn {
      padding: 10px 20px; border: none; background: transparent; border-radius: 12px;
      font-size: 14px; font-weight: 700; color: #64748B; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;
    }
    .tab-btn:hover { background: #F8FAFC; color: #334155; }
    .tab-btn.active { background: #ea5073; color: white; box-shadow: 0 4px 12px rgba(234, 80, 115, 0.3); }
    
    .filters-secondary { display: flex; align-items: center; gap: 20px; flex: 1; justify-content: flex-end; }
    .toggle-exceptionnelle { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
    .toggle-exceptionnelle input { width: 18px; height: 18px; cursor: pointer; accent-color: #ea5073; }
    .toggle-label { font-size: 14px; font-weight: 600; color: #475569; }
    
    .exception-badge { background: #FDECF2; color: #ea5073; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; }

    .table-card { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
    .cand-table { width: 100%; border-collapse: collapse; text-align: left; }
    .cand-table th { padding: 12px 16px; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; background: #F9FAFB; border-bottom: 1px solid #F3F4F6; }
    .cand-table td { padding: 14px 16px; border-bottom: 1px solid #F3F4F6; }
    .table-row:hover { background: #FFF5F8; }

    .name-cell { display: flex; flex-direction: column; }
    .name-text { font-weight: 700; font-size: 14px; color: #1A1A2E; }
    .email-text { font-size: 11px; color: #9CA3AF; }
    
    .mini-date-badge { display: inline-block; background: #F3F4F6; color: #4A5568; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; margin-right: 4px; margin-bottom: 4px; }
    
    .type-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
    .type-badge.online { background: #E0F2FE; color: #0369A1; }
    .type-badge.presentiel { background: #FEF3C7; color: #92400E; }

    .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
    .status-badge.upcoming { background: #D1FAE5; color: #065F46; }
    .status-badge.past { background: #F3F4F6; color: #9CA3AF; }
    .status-badge.cancelled { background: #FEE2E2; color: #B91C1C; }
    
    .action-buttons { display: flex; align-items: center; gap: 8px; }
    .btn-detail { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; color: #ea5073; border: 1px solid #ea5073; background: transparent; cursor: pointer; transition: all .2s; }
    .btn-detail:hover { background: #ea5073; color: white; }
    .btn-delete-icon { background: #FFF5F5; color: #E53E3E; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; }
    .btn-primary { background: linear-gradient(135deg, #FF4D85); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: transform 0.2s; }
    .btn-primary:hover { transform: translateY(-2px); }

    .empty-state { text-align: center; padding: 60px 20px; background: #fff; border-radius: 20px; }
    .empty-text { font-weight: 700; font-size: 16px; color: #4A5568; }
    .empty-sub { font-size: 13px; color: #9CA3AF; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
    .modal-box { background: white; border-radius: 24px; width: 100%; max-width: 600px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.15); }
    .modal-header { padding: 24px; border-bottom: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center; }
    .modal-header-info { flex: 1; }
    .modal-name { font-size: 20px; font-weight: 800; color: #1E293B; margin: 0 0 8px; }
    .modal-close { background: #F8FAFC; border: none; width: 36px; height: 36px; border-radius: 12px; cursor: pointer; color: #64748B; }
    
    .modal-body { padding: 24px; overflow-y: auto; }
    .modal-footer { padding: 20px 24px; border-top: 1px solid #F1F5F9; display: flex; justify-content: flex-end; }
    .btn-close-modal { padding: 10px 24px; border-radius: 12px; background: #F1F5F9; border: none; font-weight: 700; color: #475569; cursor: pointer; }

    .spinner { width: 40px; height: 40px; border: 4px solid #F1F5F9; border-top-color: #ea5073; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SessionsComponent implements OnInit {
  coachId!: number;
  loading: boolean = false;
  searchTerm: string = '';
  activeFilter: string = 'en_cours';
  selectedEntrepreneurId: number = 0;
  showExceptionnelle: boolean = true;
  
  sessions: SessionCoachDTO[] = [];
  filteredSessions: SessionCoachDTO[] = [];
  
  // Exceptionnelle
  showExceptionnelleModal = false;
  savingSeance = false;
  modalError: string | null = null;
  entrepreneurs: CoachEntrepreneurDTO[] = [];
  filteredEntrepreneurs: CoachEntrepreneurDTO[] = [];
  thematiques: any[] = [];
  availableTitles: string[] = [];
  groupedMatchings: any[] = [];
  
  newSeance: SeanceExceptionnelleDTO = {
    coachId: 0,
    entrepreneurId: 0,
    thematiqueId: undefined,
    titre: '',
    dateSeance: '',
    heureDebut: '',
    heureFin: ''
  };

  showReclamationModal: boolean = false;
  reclamationTarget: any = null;
  reclamationData = {
    sujet: '',
    typeReclamation: 'RETARD',
    description: ''
  };

  constructor(
    private coachService: CoachService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const rawId = this.authService.getUserId();
    if (rawId) {
      this.coachId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;
      this.newSeance.coachId = this.coachId;
      this.loadSessions();
      this.loadThematiques();
      this.loadEntrepreneurs();
      this.loadMatchedEntrepreneurs();
    }
  }

  loadSessions() {
    this.loading = true;
    forkJoin({
      sessions: this.coachService.getAllSessionsByCoach(this.coachId),
      seances: this.coachService.getSeancesExceptionnelles(this.coachId)
    }).subscribe({
      next: ({ sessions, seances }) => {
        const mappedSeances: SessionCoachDTO[] = seances.map(se => ({
          id: (se.id || 0) + 1000000, 
          disponibiliteId: 0,
          titre: se.titre,
          dateSession: se.dateSeance,
          heureDebut: se.heureDebut,
          heureFin: se.heureFin,
          typeSession: 'EN_LIGNE',
          sessionGroupId: `seance-${se.id}`,
          isBooked: true,
          entrepreneurName: se.entrepreneurName,
          isExceptionnelle: true,
          bookingStatus: 'CONFIRME'
        } as SessionCoachDTO));

        this.sessions = [...sessions, ...mappedSeances];
        this.filterSessions();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.filterSessions();
  }

  formatDateString(dateObj: any): string {
    if (!dateObj) return '';
    if (Array.isArray(dateObj)) {
        return `${dateObj[0]}-${String(dateObj[1]).padStart(2, '0')}-${String(dateObj[2]).padStart(2, '0')}`;
    }
    return String(dateObj);
  }

  formatTimeString(timeObj: any): string {
    if (!timeObj) return '23:59:00';
    if (Array.isArray(timeObj)) {
        return `${String(timeObj[0]).padStart(2, '0')}:${String(timeObj[1]).padStart(2, '0')}:00`;
    }
    const str = String(timeObj);
    return str.length === 5 ? str + ':00' : str;
  }

  isUpcoming(s: any): boolean {
    if (!s.dateSession || !s.heureFin) return false;
    const dateStr = this.formatDateString(s.dateSession);
    const timeStr = this.formatTimeString(s.heureFin);
    const sessionDate = new Date(dateStr + 'T' + timeStr);
    return sessionDate.getTime() > new Date().getTime();
  }

  hasCancelled(s: SessionCoachDTO): boolean {
    return s.bookingStatus === 'ANNULE';
  }

  filterSessions() {
    // Only keep reserved sessions (isBooked === true)
    let rawResult = this.sessions.filter(s => s.isBooked);
    
    // Search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      rawResult = rawResult.filter(s => s.titre.toLowerCase().includes(term) || (s.programmeNom && s.programmeNom.toLowerCase().includes(term)));
    }

    // Exceptional Sessions Filter
    if (!this.showExceptionnelle) {
      rawResult = rawResult.filter(s => !s.isExceptionnelle);
    }

    // Status Filter (Tabs)
    if (this.activeFilter === 'en_cours') {
      rawResult = rawResult.filter(s => this.isUpcoming(s) && !this.hasCancelled(s));
    } else if (this.activeFilter === 'termine') {
      rawResult = rawResult.filter(s => !this.isUpcoming(s) && !this.hasCancelled(s));
    } else if (this.activeFilter === 'annule') {
      rawResult = rawResult.filter(s => this.hasCancelled(s));
    }
    
    // Entrepreneur Filter
    if (this.selectedEntrepreneurId > 0) {
      rawResult = rawResult.filter(s => s.entrepreneurId == this.selectedEntrepreneurId);
    }

    this.filteredSessions = rawResult.sort((a,b) => {
        const dateA = new Date(a.dateSession).getTime();
        const dateB = new Date(b.dateSession).getTime();
        return dateB - dateA;
    });
  }

  async deleteSession(s: SessionCoachDTO) {
    if (confirm(`Supprimer le créneau "${s.titre}" ?`)) {
      this.loading = true;
      try {
        await firstValueFrom(this.coachService.deleteSession(s.id!));
        this.loadSessions();
      } catch (error) {
        this.loading = false;
        alert('Erreur lors de la suppression.');
      }
    }
  }

  openReclamationModal(booking: any) {
    this.reclamationTarget = booking;
    this.reclamationData = { sujet: '', typeReclamation: 'RETARD', description: '' };
    this.showReclamationModal = true;
  }

  closeReclamationModal() {
    this.showReclamationModal = false;
    this.reclamationTarget = null;
  }

  submitReclamation() {
    if (!this.reclamationData.sujet || !this.reclamationData.description) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    this.loading = true;
    const finalReclamation: any = {
      ...this.reclamationData,
      coachId: this.coachId,
      entrepreneurId: this.reclamationTarget.entrepreneurId || 0
    };
    
    this.coachService.addReclamation(this.coachId, finalReclamation.entrepreneurId, finalReclamation)
      .subscribe({
        next: () => {
          alert('Réclamation envoyée avec succès.');
          this.loading = false;
          this.closeReclamationModal();
        },
        error: (err) => {
          alert("Erreur lors de l'envoi de la réclamation. L'entrepreneur n'est peut-être pas trouvé.");
          console.error(err);
          this.loading = false;
        }
      });
  }

  // --- Seance Exceptionnelle Modal Logic ---
  openExceptionnelleModal() {
    this.showExceptionnelleModal = true;
    this.modalError = null;
  }

  closeExceptionnelleModal() {
    this.showExceptionnelleModal = false;
  }

  loadMatchedEntrepreneurs() {
    this.coachService.getMatchedEntrepreneursGrouped(this.coachId).subscribe({
      next: (data) => this.groupedMatchings = data,
      error: () => {}
    });
  }

  loadThematiques() {
      this.coachService.getThematiquesAssignedToCoach(this.coachId).subscribe({
          next: (data) => this.thematiques = data,
          error: () => console.error('Erreur chargement thematiques')
      });
  }

  loadEntrepreneurs() {
      this.coachService.getCoachEntrepreneurs(this.coachId).subscribe({
          next: (data) => this.entrepreneurs = data,
          error: () => console.error('Erreur chargement entrepreneurs')
      });
  }

  onThematiqueChange() {
    this.availableTitles = [];
    this.filteredEntrepreneurs = [];
    this.newSeance.titre = '';
    this.newSeance.entrepreneurId = 0;

    if (!this.newSeance.thematiqueId) return;

    const theme = this.thematiques.find(t => t.id === this.newSeance.thematiqueId);
    if (theme) {
      const titlesSet = new Set<string>();
      this.sessions.forEach(s => {
        if (s.thematiqueNom === theme.nom) {
          titlesSet.add(s.titre);
        }
      });
      this.availableTitles = Array.from(titlesSet).sort();

      const matchingGroup = this.groupedMatchings.find(g => g.thematiqueId === this.newSeance.thematiqueId);
      if (matchingGroup) {
        this.filteredEntrepreneurs = matchingGroup.entrepreneurs;
      }
    }
  }

  submitSeanceExceptionnelle() {
      this.modalError = null;
      if (!this.newSeance.thematiqueId) {
          this.modalError = 'Veuillez sélectionner une thématique.'; return;
      }
      if (!this.newSeance.titre) { this.modalError = 'Le titre est requis.'; return; }
      if (!this.newSeance.entrepreneurId || this.newSeance.entrepreneurId === 0) {
          this.modalError = 'Veuillez sélectionner un entrepreneur.'; return;
      }
      if (!this.newSeance.dateSeance) { this.modalError = 'La date est requise.'; return; }
      if (!this.newSeance.heureDebut || !this.newSeance.heureFin) { this.modalError = 'Les heures sont requises.'; return; }
      if (this.newSeance.heureDebut >= this.newSeance.heureFin) {
          this.modalError = "L'heure de début doit être avant l'heure de fin."; return;
      }

      this.savingSeance = true;
      this.coachService.addSeanceExceptionnelle(this.coachId, this.newSeance.entrepreneurId, this.newSeance).subscribe({
          next: (data) => {
              this.toastr.success('Séance exceptionnelle planifiée !');
              
              const mappedSeance: SessionCoachDTO = {
                id: (data.id || 0) + 1000000, 
                disponibiliteId: 0,
                titre: data.titre,
                dateSession: data.dateSeance,
                heureDebut: data.heureDebut,
                heureFin: data.heureFin,
                typeSession: 'EN_LIGNE',
                sessionGroupId: `seance-${data.id}`,
                isBooked: true,
                entrepreneurName: data.entrepreneurName,
                isExceptionnelle: true,
                bookingStatus: 'CONFIRME'
              };
              
              this.sessions.push(mappedSeance);
              this.filterSessions();
              this.newSeance = { coachId: this.coachId, entrepreneurId: 0, thematiqueId: undefined, titre: '', dateSeance: '', heureDebut: '', heureFin: '' };
              this.availableTitles = [];
              this.filteredEntrepreneurs = [];
              this.closeExceptionnelleModal();
              this.savingSeance = false;
          },
          error: () => { this.modalError = 'Erreur lors de la planification.'; this.savingSeance = false; }
      });
  }
}
