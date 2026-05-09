import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachService, SessionCoachDTO, SeanceExceptionnelleDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { forkJoin } from 'rxjs';
import { firstValueFrom } from 'rxjs';

export interface SessionGroup {
  sessionGroupId: string;
  titre: string;
  sessions: SessionCoachDTO[];
  dateRange: string;
  typeSession: string;
  totalSlots: number;
  bookedSlots: number;
  isUpcoming: boolean;
  meetLink?: string;
}

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
              <p class="cand-subtitle">Gérez et suivez vos créneaux de coaching</p>
          </div>
          <div class="cand-header-actions">
             <p class="cand-count-badge">{{filteredGroups.length}} Session{{filteredGroups.length > 1 ? 's' : ''}} au total</p>
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
          <label class="toggle-exceptionnelle">
            <input type="checkbox" [(ngModel)]="showExceptionnelle" (change)="filterSessions()">
            <span class="toggle-label">Sessions exceptionnelles</span>
          </label>
        </div>
      </div>

      <!-- SESSIONS TABLE -->
      @if (filteredGroups.length > 0) {
        <div class="table-card">
          <div class="table-scroll">
            <table class="cand-table">
              <thead>
                <tr>
                  <th>Titre de la Session</th>
                  <th>Dates & Horaires</th>
                  <th>Type</th>
                  <th>Réservations</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <ng-container *ngFor="let g of filteredGroups">
                  <tr class="table-row">
                    <td>
                      <div class="name-cell">
                        <div class="flex items-center gap-2">
                          <span class="name-text">{{ g.titre }}</span>
                          <span *ngIf="g.sessions[0]?.isExceptionnelle" class="exception-badge">Exceptionnelle</span>
                        </div>
                        <span class="email-text">ID Groupe: {{ g.sessionGroupId.substring(0,8) }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="date-cell-custom">
                        <div *ngFor="let s of g.sessions | slice:0:2" class="mini-date-badge">
                           {{ s.dateSession | date:'dd/MM' }} &#64; {{ s.heureDebut.substring(0,5) }}
                        </div>
                        <span *ngIf="g.sessions.length > 2" class="more-dates text-xs text-gray-400">
                          + {{ g.sessions.length - 2 }} autres
                        </span>
                      </div>
                    </td>
                    <td>
                      <ng-container *ngIf="g.typeSession === 'EN_LIGNE'">
                        <a *ngIf="g.meetLink" [href]="g.meetLink" target="_blank" class="type-badge online" style="text-decoration:none; cursor:pointer; background:#E0F2FE; color:#0369A1;" title="Rejoindre le Meet">
                          <i class="pi pi-video"></i> Rejoindre Meet
                        </a>
                        <span *ngIf="!g.meetLink" class="type-badge online">
                          <i class="pi pi-video"></i> En ligne
                        </span>
                      </ng-container>
                      <span *ngIf="g.typeSession === 'PRESENTIEL'" class="type-badge presentiel">
                        <i class="pi pi-building"></i> Présentiel
                      </span>
                    </td>
                    <td>
                      <div class="booking-stats">
                        <span class="stats-text">{{ g.bookedSlots }} / {{ g.totalSlots }}</span>
                        <div class="progress-bar-mini">
                          <div class="progress-fill" [style.width.%]="(g.bookedSlots / g.totalSlots) * 100"></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="status-badge" 
                        [class.upcoming]="g.isUpcoming && !hasCancelled(g)" 
                        [class.past]="!g.isUpcoming && !hasCancelled(g)"
                        [class.cancelled]="hasCancelled(g)">
                        <i class="pi" 
                          [class.pi-calendar-clock]="g.isUpcoming && !hasCancelled(g)" 
                          [class.pi-check-circle]="!g.isUpcoming && !hasCancelled(g)"
                          [class.pi-times-circle]="hasCancelled(g)"></i>
                        {{ hasCancelled(g) ? 'Annulée' : (g.isUpcoming ? 'À venir' : 'Terminée') }}
                      </div>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn-detail" (click)="viewGroupDetails(g)">
                           Détails
                        </button>
                        <button *ngIf="g.isUpcoming && g.bookedSlots === 0" class="btn-delete-icon" (click)="deleteGroup(g)">
                           <i class="pi pi-trash"></i>
                        </button>
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

      <!-- DETAILS MODAL -->
      <div *ngIf="showGroupModal" class="modal-overlay" (click)="closeGroupModal()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-header-info">
              <h3 class="modal-name">{{ selectedGroup?.titre }}</h3>
              <div class="modal-badges">
                <span class="type-badge online" *ngIf="selectedGroup?.typeSession === 'EN_LIGNE'">Visioconférence</span>
                <span class="type-badge presentiel" *ngIf="selectedGroup?.typeSession === 'PRESENTIEL'">Présentiel</span>
                <span class="status-badge" [class.upcoming]="selectedGroup?.isUpcoming" [class.past]="!selectedGroup?.isUpcoming">
                  {{ selectedGroup?.isUpcoming ? 'Session Active' : 'Session Terminée' }}
                </span>
              </div>
            </div>
            <button (click)="closeGroupModal()" class="modal-close"><i class="pi pi-times"></i></button>
          </div>

          <div class="modal-body">
            <h4 class="section-title"><i class="pi pi-list"></i> Liste des créneaux ({{ selectedGroup?.sessions?.length }})</h4>
            <div class="slots-list-modal">
              <div *ngFor="let s of selectedGroup?.sessions" class="slot-item-card">
                <div class="slot-time-info">
                  <span class="slot-date">{{ s.dateSession | date:'fullDate' }}</span>
                  <span class="slot-hours">{{ s.heureDebut.substring(0,5) }} — {{ s.heureFin.substring(0,5) }}</span>
                </div>
                <div class="slot-booking-info">
                   @if (s.isBooked) {
                      <div class="booked-entrepreneur">
                        <i class="pi pi-user-check text-green-500"></i>
                        <span>Réservez par un entrepreneur</span>
                      </div>
                   } @else {
                      <span class="empty-slot-badge">Disponible</span>
                   }
                </div>
                <button *ngIf="s.isBooked" class="btn-view-entrepreneur" (click)="viewBookings(s)">
                  Inscriptions
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button (click)="closeGroupModal()" class="btn-close-modal">Fermer</button>
          </div>
        </div>
      </div>

      <!-- Bookings Modal -->
      <div *ngIf="showBookingsModal" class="modal-overlay" (click)="closeBookingsModal()">
        <div class="modal-box max-w-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-name"><i class="pi pi-users" style="color: #ea5073"></i> Entrepreneurs inscrits</h3>
            <button (click)="closeBookingsModal()" class="modal-close"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div *ngIf="loadingBookings" class="loading-state" style="display: flex; justify-content: center; padding: 2rem;">
              <div class="spinner"></div>
            </div>
            <div *ngIf="!loadingBookings && selectedSessionBookings.length === 0" class="empty-msg" style="text-align: center; color: #6B7280; padding: 2rem;">
              Aucun entrepreneur inscrit pour le moment.
            </div>
            <div *ngFor="let b of selectedSessionBookings" class="booking-item" style="padding: 1rem; border-bottom: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center;">
              <div class="booking-info" style="display: flex; flex-direction: column;">
                <strong style="color: #1E293B;">{{b.entrepreneurName}}</strong>
                <span class="booking-date" style="font-size: 11px; color: #94A3B8;">Réservé le : {{b.dateBooking | date:'dd/MM/yyyy HH:mm'}}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="status-pill" [class]="'pill-' + b.statut?.toLowerCase()" style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 12px; background: #F3F4F6; color: #64748B;">{{b.statut}}</span>
                <button class="btn-detail" style="border-color: #EF4444; color: #EF4444;" (click)="openReclamationModal(b)" onmouseover="this.style.backgroundColor='#EF4444'; this.style.color='#fff'" onmouseout="this.style.backgroundColor='transparent'; this.style.color='#EF4444'">
                  <i class="pi pi-exclamation-triangle" style="font-size: 10px"></i> Signaler
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="closeBookingsModal()" class="btn-close-modal">Fermer</button>
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

    /* NEW TABS & TOGGLE */
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
    
    .booking-stats { display: flex; flex-direction: column; gap: 4px; }
    .stats-text { font-size: 12px; font-weight: 700; color: #4A5568; }
    .progress-bar-mini { width: 60px; height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: #ea5073; border-radius: 3px; }

    .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
    .status-badge.upcoming { background: #D1FAE5; color: #065F46; }
    .status-badge.past { background: #F3F4F6; color: #9CA3AF; }
    .status-badge.cancelled { background: #FEE2E2; color: #B91C1C; }
    
    .action-buttons { display: flex; align-items: center; gap: 8px; }
    .btn-detail { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; color: #ea5073; border: 1px solid #ea5073; background: transparent; cursor: pointer; transition: all .2s; }
    .btn-detail:hover { background: #ea5073; color: white; }
    .btn-delete-icon { background: #FFF5F5; color: #E53E3E; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; }

    .empty-state { text-align: center; padding: 60px 20px; background: #fff; border-radius: 20px; }
    .empty-text { font-weight: 700; font-size: 16px; color: #4A5568; }
    .empty-sub { font-size: 13px; color: #9CA3AF; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
    .modal-box { background: white; border-radius: 24px; width: 100%; max-width: 600px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.15); }
    .modal-header { padding: 24px; border-bottom: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center; }
    .modal-header-info { flex: 1; }
    .modal-name { font-size: 20px; font-weight: 800; color: #1E293B; margin: 0 0 8px; }
    .modal-badges { display: flex; gap: 8px; }
    .modal-close { background: #F8FAFC; border: none; width: 36px; height: 36px; border-radius: 12px; cursor: pointer; color: #64748B; }
    
    .modal-body { padding: 24px; overflow-y: auto; }
    .section-title { font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    
    .slot-item-card { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #F8FAFC; border: 1px solid #F1F5F9; border-radius: 16px; margin-bottom: 12px; }
    .slot-time-info { display: flex; flex-direction: column; gap: 4px; }
    .slot-date { font-size: 13px; font-weight: 700; color: #1E293B; }
    .slot-hours { font-size: 12px; color: #64748B; }
    .booked-entrepreneur { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #059669; }
    .empty-slot-badge { font-size: 11px; font-weight: 700; color: #94A3B8; background: #EDF2F7; padding: 4px 10px; border-radius: 8px; }
    .btn-view-entrepreneur { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; background: #3B82A6; color: white; border: none; cursor: pointer; }

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
  showExceptionnelle: boolean = true;
  showOnlyReserved: boolean = true;
  sessions: SessionCoachDTO[] = [];
  filteredGroups: SessionGroup[] = [];
  selectedGroup: SessionGroup | null = null;
  showGroupModal: boolean = false;
  
  showBookingsModal: boolean = false;
  loadingBookings: boolean = false;
  selectedSessionBookings: any[] = [];
  
  showReclamationModal: boolean = false;
  reclamationTarget: any = null;
  reclamationData = {
    sujet: '',
    typeReclamation: 'RETARD',
    description: ''
  };

  constructor(
    private coachService: CoachService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const rawId = this.authService.getUserId();
    if (rawId) {
      this.coachId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;
      this.loadSessions();
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
          id: (se.id || 0) + 1000000, // offset id
          disponibiliteId: 0,
          titre: se.titre + ' (Session Exceptionnelle)',
          dateSession: se.dateSeance,
          heureDebut: se.heureDebut,
          heureFin: se.heureFin,
          typeSession: 'EN_LIGNE',
          sessionGroupId: `seance-${se.id}`,
          isBooked: true,
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

  isUpcoming(s: any): boolean {
    if (!s.dateSession || !s.heureFin) return false;
    const sessionDate = new Date(s.dateSession + 'T' + s.heureFin);
    return sessionDate.getTime() > new Date().getTime();
  }

  groupSessions(sessions: SessionCoachDTO[]): SessionGroup[] {
    const groupsMap: { [key: string]: SessionGroup } = {};
    
    sessions.forEach(s => {
      const gid = s.sessionGroupId || `single-${s.id}`;
      if (!groupsMap[gid]) {
        groupsMap[gid] = {
          sessionGroupId: gid,
          titre: s.titre,
          sessions: [],
          dateRange: '',
          typeSession: s.typeSession || 'EN_LIGNE',
          totalSlots: 0,
          bookedSlots: 0,
          isUpcoming: false
        };
      }
      groupsMap[gid].sessions.push(s);
      groupsMap[gid].totalSlots++;
      if (s.isBooked) groupsMap[gid].bookedSlots++;
      if (this.isUpcoming(s)) groupsMap[gid].isUpcoming = true;
      if (s.meetLink && !groupsMap[gid].meetLink) groupsMap[gid].meetLink = s.meetLink;
    });

    return Object.values(groupsMap).map(g => {
      g.sessions.sort((a, b) => new Date(a.dateSession).getTime() - new Date(b.dateSession).getTime());
      return g;
    });
  }

  filterSessions() {
    let rawResult = [...this.sessions];
    
    // Search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      rawResult = rawResult.filter(s => s.titre.toLowerCase().includes(term));
    }

    // Exceptional Sessions Filter
    if (!this.showExceptionnelle) {
      rawResult = rawResult.filter(s => !s.isExceptionnelle);
    }

    let grouped = this.groupSessions(rawResult);

    // Reserved Only Filter
    if (this.showOnlyReserved) {
      grouped = grouped.filter(g => g.bookedSlots > 0);
    }

    // Status Filter (Tabs)
    if (this.activeFilter === 'en_cours') {
      grouped = grouped.filter(g => g.isUpcoming && !this.hasCancelled(g));
    } else if (this.activeFilter === 'termine') {
      grouped = grouped.filter(g => !g.isUpcoming && !this.hasCancelled(g));
    } else if (this.activeFilter === 'annule') {
      grouped = grouped.filter(g => this.hasCancelled(g));
    }

    this.filteredGroups = grouped.sort((a,b) => {
        const dateA = new Date(a.sessions[0].dateSession).getTime();
        const dateB = new Date(b.sessions[0].dateSession).getTime();
        return dateB - dateA;
    });
  }

  hasCancelled(g: SessionGroup): boolean {
    return g.sessions.some(s => s.bookingStatus === 'ANNULE');
  }

  viewGroupDetails(g: SessionGroup) {
    this.selectedGroup = g;
    this.showGroupModal = true;
  }

  closeGroupModal() {
    this.showGroupModal = false;
    this.selectedGroup = null;
  }

  async deleteGroup(g: SessionGroup) {
    if (confirm(`Supprimer tout le groupe de session "${g.titre}" (${g.sessions.length} créneaux) ?`)) {
      this.loading = true;
      try {
        const promises = g.sessions.map(s => firstValueFrom(this.coachService.deleteSession(s.id!)));
        await Promise.all(promises);
        this.loadSessions();
      } catch (error) {
        this.loading = false;
        alert('Erreur lors de la suppression de certains créneaux.');
      }
    }
  }

  viewBookings(session: SessionCoachDTO) {
    if (!session.id) return;
    this.showBookingsModal = true;
    this.loadingBookings = true;
    this.selectedSessionBookings = [];
    this.coachService.getSessionBookings(session.id).subscribe({
      next: (data) => {
        this.selectedSessionBookings = data;
        this.loadingBookings = false;
      },
      error: () => {
        this.loadingBookings = false;
      }
    });
  }

  closeBookingsModal() {
    this.showBookingsModal = false;
    this.selectedSessionBookings = [];
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
      entrepreneurId: this.reclamationTarget.entrepreneurId
    };
    this.coachService.addReclamation(this.coachId, this.reclamationTarget.entrepreneurId, finalReclamation)
      .subscribe({
        next: () => {
          alert('Réclamation envoyée avec succès.');
          this.loading = false;
          this.closeReclamationModal();
        },
        error: (err) => {
          alert('Erreur lors de l\'envoi de la réclamation.');
          console.error(err);
          this.loading = false;
        }
      });
  }
}
