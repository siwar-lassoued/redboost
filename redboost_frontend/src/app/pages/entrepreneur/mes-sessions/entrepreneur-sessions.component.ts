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
        <div>
          <h1 class="cand-title">Mes Sessions</h1>
          <p class="cand-subtitle">Suivez votre parcours d'accompagnement</p>
        </div>
        <div class="cand-header-actions">
           <span class="cand-count-badge">{{ allSessions().length }} sessions au total</span>
        </div>
      </div>

      <!-- TABS -->
      <div class="cand-tabs">
        <button (click)="activeTab.set('PLANIFIEE')" class="cand-tab" [class.active]="activeTab() === 'PLANIFIEE'">
          Sessions Planifiées ({{ getCount('PLANIFIEE') }})
        </button>
        <button (click)="activeTab.set('REALISEE')" class="cand-tab" [class.active]="activeTab() === 'REALISEE'">
          Sessions Terminées ({{ getCount('REALISEE') }})
        </button>
        <button (click)="activeTab.set('ANNULEE')" class="cand-tab" [class.active]="activeTab() === 'ANNULEE'">
          Sessions Annulées ({{ getCount('ANNULEE') }})
        </button>
      </div>

      <!-- FILTERS -->
      <div class="cand-filters">
        <div class="search-wrap">
          <i class="pi pi-search search-icon"></i>
          <input type="text" 
            [ngModel]="searchText()"
            (ngModelChange)="searchText.set($event)"
            placeholder="Rechercher par titre ou coach..." 
            class="search-input">
        </div>
      </div>

      <!-- SESSIONS TABLE -->
      @if (filteredSessions().length > 0) {
        <div class="table-card">
          <div class="table-scroll">
            <table class="cand-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Coach</th>
                  <th>Date & Heure</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (s of filteredSessions(); track s.id) {
                  <tr class="table-row" (click)="onViewDetail(s)">
                    <td>
                      <div class="name-cell">
                        <span class="name-text">{{ s.titre || 'Session de coaching' }}</span>
                        <span class="email-text">ID: #{{ s.id.substring(0,8) }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="coach-cell" *ngIf="s.coach">
                        <span class="name-text">{{ s.coach.firstName || s.coach.prenom }} {{ s.coach.lastName || s.coach.nom }}</span>
                      </div>
                    </td>
                    <td class="date-cell">
                      <div class="flex flex-col">
                        <span>{{ s.date | date:'dd/MM/yyyy' }}</span>
                        <span class="text-[10px] text-gray-400">{{ s.date | date:'HH:mm' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="type-badge" [class.presentiel]="s.lieu" [class.online]="!s.lieu">
                        {{ s.lieu ? 'Présentiel' : 'À distance' }}
                      </span>
                    </td>
                    <td>
                      <div class="status-badge" [style.background]="getBadge(s.statut).bg" [style.color]="getBadge(s.statut).color">
                        <i class="pi" [class.pi-calendar-clock]="s.statut === 'PLANIFIEE'" [class.pi-check-circle]="s.statut === 'REALISEE' || s.statut === 'TERMINE'" [class.pi-times-circle]="s.statut === 'ANNULEE'" style="font-size: 10px;"></i>
                        {{ getBadge(s.statut).label }}
                      </div>
                    </td>
                    <td>
                      <button (click)="$event.stopPropagation(); onViewDetail(s)" class="btn-detail">Voir détails</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <i class="pi pi-calendar-times" style="font-size: 3rem; color: #D1D5DB; margin-bottom: 1rem; display: block;"></i>
          <p class="empty-text">Aucune session trouvée</p>
          <p class="empty-sub">Il n'y a pas de sessions dans cette catégorie.</p>
        </div>
      }
    </div>

    <!-- DETAIL MODAL (Admin Style) -->
    @if (showDetail() && selected()) {
      <div class="modal-overlay" (click)="showDetail.set(false)">
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
            <button (click)="showDetail.set(false)" class="modal-close">
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
                    <p class="answer-text">{{ selected()!.titre || 'Non spécifié' }}</p>
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
              </div>
            }
          </div>

          <div class="modal-footer">
            @if (selected()!.statut === 'PLANIFIEE' && selected()!.meetLink) {
              <a [href]="selected()!.meetLink" target="_blank" class="btn-action btn-blue">
                <i class="pi pi-video"></i> Rejoindre la session
              </a>
            }
            @if (selected()!.statut === 'REALISEE' || selected()!.statut === 'TERMINE') {
              <button [routerLink]="['/coach-rating', selected()!.id]" (click)="showDetail.set(false)" class="btn-action btn-amber">
                <i class="pi pi-star"></i> Laisser une évaluation
              </button>
            }
            <button (click)="showDetail.set(false)" class="btn-close-modal">Fermer</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .cand-page { padding: 24px; background: #F5F6FA; min-height: 100vh; }
    .cand-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .cand-title { font-size: 28px; font-weight: 800; color: #1A1A2E; margin: 0; }
    .cand-subtitle { color: #8a8a8a; font-size: 14px; margin-top: 4px; }
    .cand-count-badge { background: #E2E8F0; color: #4A5568; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    
    .cand-tabs { display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px; }
    .cand-tab {
      padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600;
      border: none; cursor: pointer; transition: all .2s; background: #F3F4F6; color: #6B7280; white-space: nowrap;
    }
    .cand-tab.active { background: #ea5073; color: #fff; }

    .cand-filters { display: flex; align-items: stretch; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .search-wrap { position: relative; flex: 1; min-width: 200px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9CA3AF; }
    .search-input {
      width: 100%; padding: 12px 16px 12px 40px; border: 1px solid #E5E7EB;
      border-radius: 12px; font-size: 14px; outline: none; color: #333; transition: all .2s; background: #fff; box-sizing: border-box;
    }
    .search-input:focus { border-color: #3B82A6; box-shadow: 0 0 0 3px rgba(59, 130, 166, 0.1); }

    .table-card { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.07); border: 1px solid #F1F5F9; }
    .table-scroll { overflow-x: auto; min-width: 100%; }
    .cand-table { width: 100%; border-collapse: collapse; text-align: left; }
    .cand-table th {
      padding: 12px 16px; font-size: 11px; font-weight: 700; color: #6B7280;
      text-transform: uppercase; letter-spacing: 0.05em; background: #F9FAFB; border-bottom: 1px solid #F3F4F6;
    }
    .cand-table td { padding: 14px 16px; border-bottom: 1px solid #F3F4F6; }
    .table-row { transition: background .15s; cursor: pointer; }
    .table-row:hover { background: #FFF5F8; }

    .name-cell { display: flex; flex-direction: column; }
    .name-text { font-weight: 700; font-size: 14px; color: #1A1A2E; }
    .email-text { font-size: 11px; color: #9CA3AF; margin-top: 2px; }
    
    .type-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
    .type-badge.online { background: #E0F2FE; color: #0369A1; }
    .type-badge.presentiel { background: #FEF3C7; color: #92400E; }
    
    .date-cell { font-size: 13px; color: #1A1A2E; font-weight: 500; }
    .status-badge {
      padding: 5px 12px; border-radius: 20px; font-size: 10px; font-weight: 800;
      display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; text-transform: uppercase;
    }
    .btn-detail { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #3B82A6; background: none; border: none; cursor: pointer; transition: all .2s; }
    .btn-detail:hover { background: #EBF5FF; }

    .empty-state { text-align: center; padding: 60px 20px; background: #fff; border-radius: 20px; border: 2px dashed #E5E7EB; }
    .empty-text { color: #6B7280; font-weight: 700; font-size: 16px; margin-top: 8px; }
    .empty-sub { color: #9CA3AF; font-size: 13px; margin-top: 4px; }

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

    .note-box { margin-top: 20px; padding: 16px; border-radius: 16px; border: 1px solid; }
    .note-danger { background: #FFF5F5; border-color: #FED7D7; color: #C53030; }
    .note-label { font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; }

    .modal-footer { padding: 24px 32px; border-top: 1px solid #F1F5F9; display: flex; align-items: center; gap: 16px; }
    .btn-action {
      display: flex; align-items: center; gap: 10px; padding: 12px 24px;
      border-radius: 16px; font-size: 14px; font-weight: 800; border: none; cursor: pointer; color: #fff; transition: all .2s;
    }
    .btn-blue { background: #3B82A6; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3); }
    .btn-amber { background: #F59E0B; box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.3); }
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

  filteredSessions = computed(() => {
    const tab = this.activeTab();
    const search = this.searchText().toLowerCase().trim();
    
    return this.allSessions().filter(s => {
      let statut = (s.statut === 'TERMINE' || s.statut === 'REALISEE') ? 'REALISEE' : s.statut;
      if (statut === 'PLANIFIE') statut = 'PLANIFIEE';
      if (statut !== tab) return false;
      
      if (!search) return true;
      const title = (s.titre || '').toLowerCase();
      const coachName = s.coach ? `${s.coach.prenom} ${s.coach.nom}`.toLowerCase() : '';
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
    this.showDetail.set(true);
  }

  getBadge(statut: string) {
    const config: Record<string, { label: string; bg: string; color: string }> = {
      PLANIFIE:  { label: 'Planifiée', bg: '#EBF5FF', color: '#3B82A6' },
      PLANIFIEE: { label: 'Planifiée', bg: '#EBF5FF', color: '#3B82A6' },
      REALISEE:  { label: 'Terminée', bg: '#ECFDF5', color: '#10B981' },
      TERMINE:   { label: 'Terminée', bg: '#ECFDF5', color: '#10B981' },
      ANNULEE:   { label: 'Annulée',  bg: '#FEF2F2', color: '#EF4444' },
      ANNULE:    { label: 'Annulée',  bg: '#FEF2F2', color: '#EF4444' },
    };
    return config[statut] || { label: statut, bg: '#F1F5F9', color: '#475569' };
  }
}
