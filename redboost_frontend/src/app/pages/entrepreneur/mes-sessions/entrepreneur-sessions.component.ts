import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';

type Tab = 'PLANIFIEE' | 'REALISEE' | 'ANNULEE';

@Component({
  selector: 'rb-entrepreneur-sessions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="cand-page">
      <!-- PAGE HEADER -->
      <div class="cand-header">
        <div class="header-content">
          <h1 class="cand-title">Mes Sessions</h1>
          <p class="cand-subtitle">Gérez et suivez vos sessions d'accompagnement</p>
        </div>
        <div class="header-stats">
           <div class="stat-item">
             <span class="stat-value">{{ allSessions().length }}</span>
             <span class="stat-label">Total</span>
           </div>
           <div class="stat-divider"></div>
           <div class="stat-item">
             <span class="stat-value">{{ getCount('PLANIFIEE') }}</span>
             <span class="stat-label">À venir</span>
           </div>
        </div>
      </div>

      <!-- TABS -->
      <div class="cand-tabs">
        <button (click)="activeTab.set('PLANIFIEE')" class="cand-tab" [class.active]="activeTab() === 'PLANIFIEE'">
          Planifiées
        </button>
        <button (click)="activeTab.set('REALISEE')" class="cand-tab" [class.active]="activeTab() === 'REALISEE'">
          Terminées
        </button>
        <button (click)="activeTab.set('ANNULEE')" class="cand-tab" [class.active]="activeTab() === 'ANNULEE'">
          Annulées
        </button>
      </div>

      <!-- FILTERS -->
      <div class="cand-filters">
        <div class="search-wrap shadow-premium">
          <i class="pi pi-search search-icon"></i>
          <input type="text" 
            [ngModel]="searchText()"
            (ngModelChange)="searchText.set($event)"
            placeholder="Rechercher par coach, titre ou programme..." 
            class="search-input">
        </div>
      </div>

      <!-- SESSIONS GRID -->
      <div class="sessions-grid" *ngIf="filteredSessions().length > 0">
        <div class="premium-session-card" *ngFor="let s of filteredSessions(); track s.id" (click)="onViewDetail(s)">
          <div class="card-top">
            <div class="session-type-pill" [class.presentiel]="s.lieu" [class.online]="!s.lieu">
              <i class="pi" [class.pi-map-marker]="s.lieu" [class.pi-video]="!s.lieu"></i>
              {{ s.lieu ? 'Présentiel' : 'En ligne' }}
            </div>
            <div class="exceptionnelle-badge" *ngIf="s.isExceptionnelle">
              <i class="pi pi-star-fill"></i>
              Session Exceptionnelle
            </div>
            <div class="status-dot-wrap">
               <div class="status-dot" [style.background]="getBadge(s.statut).color"></div>
               <span class="status-text">{{ getBadge(s.statut).label }}</span>
            </div>
          </div>

          <div class="card-body">
            <h3 class="session-title">{{ s.titre || 'Session de coaching' }}</h3>
            <p class="session-theme" *ngIf="s.thematiqueName || s.programme?.nom">{{ s.thematiqueName || s.programme?.nom }}</p>
            
            <div class="session-meta">
              <div class="meta-item">
                <i class="pi pi-calendar"></i>
                <span>{{ s.date | date:'EEEE d MMMM yyyy' : '' : 'fr-FR' }}</span>
              </div>
              <div class="meta-item">
                <i class="pi pi-clock"></i>
                <span>{{ s.date | date:'HH:mm' }} <small class="text-gray-400">({{ s.duree || 60 }} min)</small></span>
              </div>
            </div>

            <div class="coach-info-mini">
              <div class="coach-avatar-mini" [style.background]="getCoachAvatarColor(s.coach)">
                {{ (s.coach?.prenom || s.coach?.firstName || 'C')[0] }}
              </div>
              <div class="coach-details-mini">
                <span class="coach-label">Votre coach</span>
                <span class="coach-name">{{ s.coach?.prenom || s.coach?.firstName }} {{ s.coach?.nom || s.coach?.lastName }}</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
             <button class="btn-card-action">Voir les détails</button>
             <button *ngIf="s.meetLink && !isPast(s.date)" (click)="$event.stopPropagation(); openMeet(s.meetLink)" class="btn-meet">
               <i class="pi pi-video"></i>
             </button>
          </div>
        </div>
      </div>

      <div class="empty-state-v2" *ngIf="filteredSessions().length === 0">
        <div class="empty-icon-wrap">
          <i class="pi pi-calendar-plus"></i>
        </div>
        <h3>Aucune session {{ activeTab().toLowerCase() }}</h3>
        <p>Vos sessions apparaîtront ici une fois planifiées.</p>
        </div>
    </div>

    <!-- DETAIL MODAL (Admin Style) -->
    @if (showDetail() && selected()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-header-left">
              <div class="modal-header-info">
                <h3 class="modal-name">{{ selected()!.titre || 'Session de coaching' }}</h3>
                <div class="modal-badges">
                  <span class="type-badge" [class.presentiel]="selected()!.lieu" [class.online]="!selected()!.lieu">
                    {{ selected()!.lieu ? 'Présentiel' : 'Visioconférence' }}
                  </span>
                  <span class="status-badge" [style.background]="getBadge(selected()!.statut).bg" [style.color]="getBadge(selected()!.statut).color">
                    {{ getBadge(selected()!.statut).label }}
                  </span>
                </div>
                <p class="modal-meta">
                  <span><i class="pi pi-calendar"></i> Le {{ selected()!.date | date:'fullDate' }} à {{ selected()!.date | date:'HH:mm' }}</span>
                  <span *ngIf="selected()!.coach"> · <i class="pi pi-user"></i> {{ selected()!.coach?.firstName || selected()!.coach?.prenom }} {{ selected()!.coach?.lastName || selected()!.coach?.nom }}</span>
                </p>
              </div>
            </div>
            <button (click)="closeModal()" class="modal-close">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="modal-tabs">
              <button (click)="modalTab.set('detail')" class="modal-tab" [class.active]="modalTab() === 'detail'">
                <i class="pi pi-info-circle"></i> Détails du passage
              </button>
            </div>

            @if (modalTab() === 'detail') {
              <div class="answers-list">
                <div class="answer-item">
                  <div class="answer-question">
                    <p class="answer-q-text">Objectif / Titre de la session</p>
                  </div>
                  <div class="answer-content">
                    <p class="answer-text">{{ selected()!.titre || 'Non renseigné' }}</p>
                  </div>
                </div>

                <div class="answer-item">
                  <div class="answer-question">
                    <p class="answer-q-text">Date et Horaire</p>
                  </div>
                  <div class="answer-content">
                    <p class="answer-text">Prévue le {{ selected()!.date | date:'dd MMMM yyyy' }} à {{ selected()!.date | date:'HH:mm' }} (Durée: {{ selected()!.duree || 60 }} min)</p>
                  </div>
                </div>

                <div class="answer-item" *ngIf="selected()!.lieu || selected()!.meetLink">
                  <div class="answer-question">
                    <p class="answer-q-text">Lieu / Lien Meet</p>
                  </div>
                  <div class="answer-content">
                    <p class="answer-text" *ngIf="selected()!.lieu">{{ selected()!.lieu }}</p>
                    <a *ngIf="selected()!.meetLink" [href]="selected()!.meetLink" target="_blank" class="text-blue-600 font-bold hover:underline">
                      <i class="pi pi-video"></i> Lien de la visioconférence
                    </a>
                  </div>
                </div>

                <div class="answer-item" *ngIf="selected()!.notesCoach">
                  <div class="answer-question">
                    <p class="answer-q-text">Notes du Coach</p>
                  </div>
                  <div class="answer-content">
                    <p class="answer-text italic text-gray-600">"{{ selected()!.notesCoach }}"</p>
                  </div>
                </div>

                @if (selected()!.statut === 'ANNULEE' && selected()!.annulationMotif) {
                  <div class="note-box note-danger">
                    <p class="note-label">Motif d'annulation</p>
                    <p>{{ selected()!.annulationMotif }}</p>
                  </div>
                }

                @if (rescheduleMode()) {
                  <div class="note-box" style="background: #FFFBEB; border-color: #FDE68A; color: #92400E; margin-top: 16px;">
                    <p class="note-label">Choisir une nouvelle date</p>
                    <input type="datetime-local" [ngModel]="newRescheduleDate()" (ngModelChange)="newRescheduleDate.set($event)" class="reschedule-input" />
                    <div class="reschedule-actions">
                      <button class="btn-action btn-blue" (click)="confirmReschedule()">Confirmer</button>
                      <button class="btn-action btn-cancel" (click)="rescheduleMode.set(false)">Annuler</button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <div class="modal-footer">
            @if ((selected()!.statut === 'PLANIFIEE' || selected()!.statut === 'PLANIFIE') && selected()!.meetLink && !isPast(selected()!.date)) {
              <a [href]="selected()!.meetLink" target="_blank" class="btn-action btn-blue">
                <i class="pi pi-video"></i> Rejoindre la session
              </a>
            }
            @if ((selected()!.statut === 'PLANIFIEE' || selected()!.statut === 'PLANIFIE') && !isPast(selected()!.date) && !rescheduleMode()) {
              <button (click)="rescheduleMode.set(true)" class="btn-action btn-indigo">
                <i class="pi pi-calendar-plus"></i> Reprogrammer
              </button>
            }
            @if (selected()!.statut === 'REALISEE' || selected()!.statut === 'TERMINE') {
              <button [routerLink]="['/coach-rating', selected()!.id]" (click)="closeModal()" class="btn-action btn-amber">
                <i class="pi pi-star"></i> Laisser une évaluation
              </button>
            }
            <button (click)="closeModal()" class="btn-close-modal">Fermer</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .cand-page { padding: 2.5rem; background: #f8fafc; min-height: 100vh; font-family: var(--font-family); }
    
    .cand-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2.5rem; }
    .cand-title { font-size: 2.25rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.025em; }
    .cand-subtitle { color: #64748b; font-size: 1.1rem; margin-top: 0.5rem; }
    
    .header-stats { display: flex; align-items: center; gap: 2rem; background: white; padding: 1rem 2rem; border-radius: 20px; box-shadow: var(--premium-shadow-sm); border: 1px solid #f1f5f9; }
    .stat-item { display: flex; flex-direction: column; align-items: center; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
    .stat-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-divider { width: 1px; height: 30px; background: #f1f5f9; }

    .cand-tabs { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
    .cand-tab {
      padding: 0.75rem 1.5rem; border-radius: 14px; font-size: 0.95rem; font-weight: 700;
      border: none; cursor: pointer; transition: all .3s cubic-bezier(0.4, 0, 0.2, 1); background: white; color: #64748b; border: 1px solid #f1f5f9;
    }
    .cand-tab.active { background: #1e293b; color: #fff; box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2); border-color: #1e293b; }
    .cand-tab:hover:not(.active) { background: #f1f5f9; transform: translateY(-1px); }

    .cand-filters { margin-bottom: 2.5rem; }
    .search-wrap { position: relative; max-width: 500px; }
    .search-icon { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.1rem; }
    .search-input {
      width: 100%; padding: 1rem 1rem 1rem 3.25rem; border: 1px solid #f1f5f9;
      border-radius: 18px; font-size: 1rem; outline: none; color: #1e293b; transition: all .3s; background: white;
    }
    .search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08); }
    .shadow-premium { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); }

    /* Sessions Grid */
    .sessions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 2rem; }
    .premium-session-card {
      background: white; border-radius: 24px; padding: 1.5rem; border: 1px solid #f1f5f9;
      box-shadow: var(--premium-shadow-sm); transition: all .4s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer; position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 1.25rem;
    }
    .premium-session-card:hover { transform: translateY(-8px); box-shadow: var(--premium-shadow-lg); border-color: #e2e8f0; }
    
    .card-top { display: flex; justify-content: space-between; align-items: center; }
    .session-type-pill {
      padding: 0.5rem 1rem; border-radius: 100px; font-size: 0.75rem; font-weight: 700;
      display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.02em;
    }
    .session-type-pill.online { background: #eff6ff; color: #2563eb; }
    .session-type-pill.presentiel { background: #fff7ed; color: #c2410c; }
    
    .exceptionnelle-badge {
      position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      background: #fdf2f8; color: #db2777; font-size: 0.7rem; font-weight: 800;
      padding: 0.4rem 1rem; border-radius: 0 0 12px 12px; display: flex; align-items: center; gap: 0.4rem;
      text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #fbcfe8; border-top: none;
    }

    .status-dot-wrap { display: flex; align-items: center; gap: 0.5rem; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; }
    .status-text { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; }

    .session-title { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin: 0; line-height: 1.3; }
    .session-theme { font-size: 0.9rem; font-weight: 600; color: #64748b; margin: 0.25rem 0 0; }
    
    .session-meta { display: flex; flex-direction: column; gap: 0.5rem; margin: 0.5rem 0; }
    .meta-item { display: flex; align-items: center; gap: 0.75rem; color: #475569; font-size: 0.95rem; font-weight: 500; }
    .meta-item i { color: #94a3b8; font-size: 1rem; }

    .coach-info-mini {
      display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fafc;
      border-radius: 16px; border: 1px solid #f1f5f9;
    }
    .coach-avatar-mini {
      width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center;
      justify-content: center; color: white; font-weight: 800; font-size: 1.1rem;
    }
    .coach-details-mini { display: flex; flex-direction: column; }
    .coach-label { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .coach-name { font-size: 0.95rem; font-weight: 700; color: #1e293b; }

    .card-footer { display: flex; gap: 0.75rem; margin-top: auto; }
    .btn-card-action {
      flex: 1; padding: 0.75rem; border-radius: 12px; background: white; border: 1px solid #e2e8f0;
      color: #1e293b; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all .2s;
    }
    .btn-card-action:hover { background: #f8fafc; border-color: #cbd5e1; }
    .btn-meet {
      width: 44px; height: 44px; border-radius: 12px; background: #10b981; border: none;
      color: white; display: flex; align-items: center; justify-content: center; cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); transition: all .2s;
    }
    .btn-meet:hover { transform: scale(1.05); background: #059669; }

    .empty-state-v2 {
      text-align: center; padding: 5rem 2rem; background: white; border-radius: 32px;
      border: 2px dashed #e2e8f0; max-width: 600px; margin: 3rem auto;
    }
    .empty-icon-wrap {
      width: 80px; height: 80px; background: #f8fafc; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;
    }
    .empty-icon-wrap i { font-size: 2.5rem; color: #cbd5e1; }
    .empty-state-v2 h3 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
    .empty-state-v2 p { color: #64748b; font-size: 1.1rem; }

    /* Modal Style (Admin) */
    .modal-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); }
    .modal-box {
      background: #fff; border-radius: 32px; width: 100%; max-width: 700px; max-height: 90vh;
      overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); display: flex; flex-direction: column;
      animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes modalIn { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    
    .modal-header { padding: 32px; border-bottom: 1px solid #F1F5F9; display: flex; align-items: flex-start; justify-content: space-between; background: #F8FAFC; }
    .modal-header-info { flex: 1; }
    .modal-name { font-weight: 900; font-size: 24px; color: #1E293B; margin: 0 0 12px; letter-spacing: -0.5px; }
    .modal-badges { display: flex; gap: 8px; margin-bottom: 12px; }
    .modal-meta { font-size: 13px; color: #64748B; font-weight: 600; display: flex; gap: 12px; }
    .modal-close { width: 40px; height: 40px; border-radius: 12px; border: none; background: #fff; cursor: pointer; color: #64748B; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    
    .modal-body { padding: 32px; overflow-y: auto; flex: 1; }
    .modal-tabs { display: flex; gap: 24px; margin-bottom: 24px; border-bottom: 2px solid #F1F5F9; }
    .modal-tab {
      padding: 0 0 12px; font-size: 14px; font-weight: 800; border: none; cursor: pointer;
      background: transparent; color: #94A3B8; border-bottom: 2px solid transparent;
      transition: all .2s; text-transform: uppercase; letter-spacing: 1px;
    }
    .modal-tab.active { color: #1E293B; border-bottom-color: #3B82A6; }

    .answers-list { display: flex; flex-direction: column; gap: 16px; }
    .answer-item { background: #F8FAFC; border-radius: 16px; padding: 20px; border-left: 5px solid #3B82A6; }
    .answer-q-text { font-weight: 800; font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .answer-text { font-size: 15px; color: #1E293B; font-weight: 600; line-height: 1.5; margin: 0; }

    .note-box { padding: 16px; border-radius: 16px; border: 1px solid; }
    .note-danger { background: #FFF5F5; border-color: #FED7D7; color: #C53030; }
    .note-label { font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; }

    .reschedule-input { width: 100%; padding: 10px 12px; border: 1px solid #FDE68A; border-radius: 10px; font-size: 14px; margin-top: 8px; outline: none; background: #fff; box-sizing: border-box; }
    .reschedule-actions { display: flex; gap: 8px; margin-top: 12px; }

    .modal-footer { padding: 24px 32px; border-top: 1px solid #F1F5F9; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .btn-action {
      display: flex; align-items: center; gap: 10px; padding: 12px 24px;
      border-radius: 16px; font-size: 14px; font-weight: 800; border: none; cursor: pointer; color: #fff; transition: all .2s;
    }
    .btn-blue { background: #3B82A6; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3); }
    .btn-amber { background: #F59E0B; box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.3); }
    .btn-indigo { background: #6366F1; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3); }
    .btn-cancel { background: #E5E7EB; color: #374151; }
    .btn-close-modal { margin-left: auto; font-size: 14px; font-weight: 700; color: #64748B; background: none; border: none; cursor: pointer; }
  `]
})
export class EntrepreneurSessionsComponent implements OnInit {
  private sessionSvc = inject(SessionService);
  private authSvc = inject(AuthService);

  activeTab = signal<Tab>('PLANIFIEE');
  allSessions = signal<any[]>([]);
  searchText = signal<string>('');
  
  showDetail = signal<boolean>(false);
  selected = signal<any | null>(null);
  modalTab = signal<'detail'>('detail');

  rescheduleMode = signal<boolean>(false);
  newRescheduleDate = signal<string>('');

  filteredSessions = computed(() => {
    const tab = this.activeTab();
    const search = this.searchText().toLowerCase().trim();
    
    return this.allSessions().filter(s => {
      let statut = (s.statut === 'TERMINE' || s.statut === 'REALISEE') ? 'REALISEE' : s.statut;
      if (statut === 'PLANIFIE') statut = 'PLANIFIEE';
      if (statut !== tab) return false;
      
      if (!search) return true;
      const title = (s.titre || '').toLowerCase();
      const coachName = s.coach ? `${s.coach.prenom || ''} ${s.coach.nom || ''} ${s.coach.firstName || ''} ${s.coach.lastName || ''}`.toLowerCase() : '';
      return title.includes(search) || coachName.includes(search);
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions() {
    const user = this.authSvc.currentUser$.value;
    if (!user) return;

    this.sessionSvc.getByEntrepreneur(user.id).subscribe({
      next: (sessions) => {
        this.allSessions.set(Array.isArray(sessions) ? sessions : []);
      },
      error: (err: any) => {
        console.error('Error loading sessions:', err);
        this.allSessions.set([]);
      }
    });
  }

  getCount(statut: Tab): number {
    return this.allSessions().filter(s => {
      let st = (s.statut === 'TERMINE' || s.statut === 'REALISEE') ? 'REALISEE' : s.statut;
      if (st === 'PLANIFIE') st = 'PLANIFIEE';
      return st === statut;
    }).length;
  }

  onViewDetail(s: any) {
    this.selected.set(s);
    this.rescheduleMode.set(false);
    this.newRescheduleDate.set('');
    this.showDetail.set(true);
  }

  closeModal() {
    this.showDetail.set(false);
    this.rescheduleMode.set(false);
  }

  isPast(date: string): boolean {
    return new Date(date) < new Date();
  }

  confirmReschedule() {
    if (!this.newRescheduleDate()) {
      alert('Veuillez choisir une date.');
      return;
    }
    const sessionId = this.selected()!.id;
    const user = this.authSvc.currentUser$.value;

    this.sessionSvc.requestReschedule(sessionId, this.newRescheduleDate(), Number(user!.id)).subscribe({
      next: () => {
        alert('Demande de reprogrammation envoyée au coach.');
        this.closeModal();
        this.loadSessions();
      },
      error: (err: any) => {
        alert(err.error?.error || err.error?.message || 'Erreur lors de la reprogrammation.');
        console.error(err);
      }
    });
  }
  getBadge(statut: string): { label: string; bg: string; color: string } {
    const config: any = {
      PLANIFIEE: { label: 'Planifiée', bg: '#EFF6FF', color: '#3B82F6' },
      REALISEE: { label: 'Réalisée', bg: '#F0FDF4', color: '#22C55E' },
      ANNULEE: { label: 'Annulée', bg: '#FEF2F2', color: '#EF4444' }
    };
    return config[statut] || { label: statut, bg: '#F1F5F9', color: '#475569' };
  }

  getCoachAvatarColor(coach: any): string {
    if (!coach) return '#cbd5e1';
    const name = coach.prenom || coach.firstName || 'C';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[Math.abs(hash) % colors.length];
  }

  openMeet(link: string) {
    if (link) window.open(link, '_blank');
  }
}
