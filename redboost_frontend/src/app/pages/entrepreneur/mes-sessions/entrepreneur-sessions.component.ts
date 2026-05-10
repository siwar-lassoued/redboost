import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';

type Tab = 'PLANIFIEE' | 'REALISEE' | 'ANNULEE';

@Component({
  selector: 'rb-entrepreneur-sessions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sess-page">
      <!-- PAGE HEADER -->
      <div class="sess-header">
        <div>
          <h1 class="sess-title">Mes Sessions de Coaching</h1>
          <p class="sess-subtitle">Suivez et gérez vos rendez-vous avec vos coachs</p>
        </div>
        <div class="sess-header-actions">
           <span class="sess-count-badge">{{ allSessions().length }} sessions au total</span>
        </div>
      </div>

      <!-- TABS -->
      <div class="sess-tabs">
        <button (click)="activeTab.set('PLANIFIEE')" class="sess-tab" [class.active]="activeTab() === 'PLANIFIEE'">
          <i class="pi pi-calendar"></i> À venir ({{ getCount('PLANIFIEE') }})
        </button>
        <button (click)="activeTab.set('REALISEE')" class="sess-tab" [class.active]="activeTab() === 'REALISEE'">
          <i class="pi pi-check-circle"></i> Terminées ({{ getCount('REALISEE') }})
        </button>
        <button (click)="activeTab.set('ANNULEE')" class="sess-tab" [class.active]="activeTab() === 'ANNULEE'">
          <i class="pi pi-times-circle"></i> Annulées ({{ getCount('ANNULEE') }})
        </button>
      </div>

      <!-- FILTERS -->
      <div class="sess-filters">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input type="text" 
            [ngModel]="searchText()"
            (ngModelChange)="searchText.set($event)"
            placeholder="Filtrer par coach, programme ou thématique..." 
            class="search-input">
        </div>
      </div>

      <!-- HIERARCHICAL VIEW -->
      <div class="hierarchy-container" *ngIf="groupedSessions().length > 0; else emptyState">
        
        <!-- COACH LEVEL -->
        <div *ngFor="let coachEntry of groupedSessions()" class="coach-group-card">
          <div class="coach-group-header">
            <div class="coach-info-main">
              <div class="coach-avatar" [style.background]="getCoachColor(coachEntry.coachId)">
                {{ coachEntry.coachName[0].toUpperCase() }}
              </div>
              <div>
                <h2 class="coach-name">Coach: {{ coachEntry.coachName }}</h2>
                <p class="coach-specialty">{{ coachEntry.specialty || 'Expert Accompagnateur' }}</p>
              </div>
            </div>
          </div>

          <div class="coach-group-body">
            <!-- PROGRAMME LEVEL -->
            <div *ngFor="let prog of coachEntry.programmes" class="prog-block">
              <div class="prog-header">
                <i class="pi pi-folder-open"></i>
                <span>Programme: <strong>{{ prog.programmeName }}</strong></span>
              </div>

              <!-- THEMATIQUE LEVEL -->
              <div *ngFor="let them of prog.thematiques" class="them-block">
                <div class="them-header">
                  <i class="pi pi-tag"></i>
                  <span>Thématique: {{ them.thematiqueName }}</span>
                </div>

                <!-- SESSIONS CARDS -->
                <div class="sessions-grid">
                  <div *ngFor="let s of them.sessions" class="session-card-premium">
                    <div class="sess-card-main">
                      <div class="sess-date-time">
                        <div class="date-big">
                          <span class="day">{{ s.date | date:'dd' }}</span>
                          <span class="month">{{ s.date | date:'MMM' }}</span>
                        </div>
                        <div class="time-wrap">
                          <i class="pi pi-clock"></i>
                          <span>{{ s.date | date:'HH:mm' }}</span>
                        </div>
                      </div>

                      <div class="sess-info-content">
                        <h4 class="sess-card-title">{{ s.titre || 'Session de coaching' }}</h4>
                        <div class="sess-meta-row">
                          <span class="type-badge" [class.online]="!s.lieu" [class.on-site]="s.lieu">
                            <i class="pi" [class.pi-video]="!s.lieu" [class.pi-map-marker]="s.lieu"></i>
                            {{ s.lieu ? 'Présentiel ('+s.lieu+')' : 'Visioconférence' }}
                          </span>
                        </div>
                      </div>

                      <div class="sess-actions-col">
                        <div class="status-indicator" [style.background]="getBadge(s.statut).bg" [style.color]="getBadge(s.statut).color">
                          {{ getBadge(s.statut).label }}
                        </div>
                        <button (click)="onViewDetail(s)" class="btn-info-circle">
                          <i class="pi pi-info-circle"></i>
                        </button>
                      </div>
                    </div>

                    <div class="sess-card-footer" *ngIf="activeTab() === 'PLANIFIEE'">
                      <a *ngIf="s.meetLink" [href]="s.meetLink" target="_blank" class="action-link link-meet">
                        <i class="pi pi-video"></i> Rejoindre Meet
                      </a>
                      <a [href]="getGoogleCalendarLink(s)" target="_blank" class="action-link link-gcal">
                        <i class="pi pi-calendar-plus"></i> Ajouter à l'agenda
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <ng-template #emptyState>
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <i class="pi pi-calendar-times"></i>
          </div>
          <h3>Aucune session trouvée</h3>
          <p>Vous n'avez pas de sessions dans cette catégorie correspondant à votre recherche.</p>
        </div>
      </ng-template>
    </div>

    <!-- DETAIL MODAL -->
    <div class="modal-overlay" *ngIf="showDetail() && selected()" (click)="showDetail.set(false)">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-header-text">
            <h3>{{ selected()!.titre || 'Session de coaching' }}</h3>
            <span class="modal-subtitle">Détails complets de la session</span>
          </div>
          <button (click)="showDetail.set(false)" class="close-modal-btn">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-item">
            <label>Coach</label>
            <div class="val">{{ selected()!.coach?.firstName }} {{ selected()!.coach?.lastName }}</div>
          </div>
          <div class="detail-item">
            <label>Date et Heure</label>
            <div class="val">{{ selected()!.date | date:'fullDate' }} à {{ selected()!.date | date:'HH:mm' }}</div>
          </div>
          <div class="detail-item" *ngIf="selected()!.lieu">
            <label>Lieu</label>
            <div class="val">{{ selected()!.lieu }}</div>
          </div>
          <div class="detail-item" *ngIf="selected()!.notesCoach">
            <label>Notes du Coach</label>
            <div class="val italic">"{{ selected()!.notesCoach }}"</div>
          </div>
        </div>
        <div class="modal-footer">
          <button (click)="showDetail.set(false)" class="btn-close-p">Fermer</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sess-page { padding: 2rem 3rem; background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
    .sess-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .sess-title { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
    .sess-subtitle { color: #64748b; margin-top: 4px; font-size: 1.05rem; }
    .sess-count-badge { background: white; color: #475569; padding: 8px 16px; border-radius: 99px; font-size: 0.85rem; font-weight: 700; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }

    .sess-tabs { display: flex; gap: 12px; margin-bottom: 2rem; }
    .sess-tab { 
      background: white; border: 1px solid #e2e8f0; padding: 12px 24px; border-radius: 16px; 
      font-size: 0.95rem; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; gap: 10px;
    }
    .sess-tab i { font-size: 1.1rem; }
    .sess-tab.active { background: #0f172a; color: white; border-color: #0f172a; box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2); }

    .sess-filters { margin-bottom: 2.5rem; }
    .search-box { position: relative; max-width: 500px; }
    .search-box i { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.1rem; }
    .search-input { 
      width: 100%; padding: 14px 16px 14px 48px; border-radius: 16px; border: 1px solid #e2e8f0;
      font-size: 1rem; outline: none; transition: all 0.2s; background: white;
    }
    .search-input:focus { border-color: #0f172a; box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.05); }

    .coach-group-card { background: white; border-radius: 24px; border: 1px solid #f1f5f9; margin-bottom: 2.5rem; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .coach-group-header { padding: 1.5rem 2rem; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
    .coach-info-main { display: flex; align-items: center; gap: 1.5rem; }
    .coach-avatar { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.4rem; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
    .coach-name { margin: 0; font-size: 1.3rem; font-weight: 800; color: #0f172a; }
    .coach-specialty { margin: 2px 0 0; color: #64748b; font-weight: 600; font-size: 0.9rem; }

    .coach-group-body { padding: 1.5rem 2rem; }
    .prog-block { margin-bottom: 2rem; }
    .prog-header { display: flex; align-items: center; gap: 10px; color: #1e293b; font-weight: 700; margin-bottom: 1.25rem; font-size: 1.1rem; }
    .prog-header i { color: #3b82f6; }

    .them-block { margin-left: 1rem; padding-left: 1.5rem; border-left: 2px solid #f1f5f9; margin-bottom: 1.5rem; }
    .them-header { display: flex; align-items: center; gap: 8px; color: #475569; font-weight: 700; margin-bottom: 1rem; font-size: 0.95rem; }
    .them-header i { color: #94a3b8; }

    .sessions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 1.5rem; }
    .session-card-premium { background: white; border-radius: 20px; border: 1px solid #f1f5f9; overflow: hidden; transition: all 0.3s; }
    .session-card-premium:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); border-color: #e2e8f0; }

    .sess-card-main { padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem; }
    .sess-date-time { text-align: center; background: #f8fafc; padding: 12px; border-radius: 16px; min-width: 80px; }
    .date-big { display: flex; flex-direction: column; line-height: 1.1; }
    .day { font-size: 1.5rem; font-weight: 800; color: #0f172a; }
    .month { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #64748b; }
    .time-wrap { margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 0.8rem; font-weight: 700; color: #475569; }

    .sess-info-content { flex: 1; }
    .sess-card-title { margin: 0 0 8px; font-size: 1.1rem; font-weight: 800; color: #1e293b; line-height: 1.3; }
    .sess-meta-row { display: flex; gap: 10px; }
    .type-badge { font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 8px; display: flex; align-items: center; gap: 6px; }
    .type-badge.online { background: #f0fdf4; color: #166534; }
    .type-badge.on-site { background: #fff7ed; color: #9a3412; }

    .sess-actions-col { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
    .status-indicator { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 99px; }
    .btn-info-circle { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s; }
    .btn-info-circle:hover { background: #e2e8f0; color: #0f172a; }

    .sess-card-footer { padding: 1rem 1.5rem; background: #fafafa; border-top: 1px solid #f1f5f9; display: flex; gap: 1.5rem; }
    .action-link { font-size: 0.85rem; font-weight: 700; text-decoration: none; display: flex; align-items: center; gap: 6px; transition: color 0.2s; }
    .link-meet { color: #059669; }
    .link-meet:hover { color: #047857; }
    .link-gcal { color: #2563eb; }
    .link-gcal:hover { color: #1d4ed8; }

    .empty-state { text-align: center; padding: 5rem 2rem; background: white; border-radius: 32px; border: 2px dashed #e2e8f0; }
    .empty-icon-wrap { width: 80px; height: 80px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .empty-icon-wrap i { font-size: 2.5rem; color: #cbd5e1; }
    .empty-state h3 { font-size: 1.5rem; font-weight: 800; color: #334155; margin-bottom: 0.5rem; }
    .empty-state p { color: #64748b; max-width: 400px; margin: 0 auto; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .modal-card { background: white; border-radius: 32px; width: 100%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
    @keyframes modalIn { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    .modal-header { padding: 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-start; }
    .modal-header-text h3 { margin: 0; font-size: 1.4rem; font-weight: 800; color: #0f172a; }
    .modal-subtitle { color: #64748b; font-size: 0.9rem; font-weight: 600; margin-top: 4px; display: block; }
    .close-modal-btn { background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; color: #64748b; }
    .modal-body { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .detail-item label { display: block; font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
    .detail-item .val { font-size: 1.05rem; font-weight: 700; color: #1e293b; }
    .modal-footer { padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; }
    .btn-close-p { background: #0f172a; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; }
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

  // Grouped and filtered sessions
  groupedSessions = computed(() => {
    const tab = this.activeTab();
    const search = this.searchText().toLowerCase().trim();
    
    // 1. Filter sessions by tab and search
    const filtered = this.allSessions().filter(s => {
      let st = (s.statut === 'TERMINE' || s.statut === 'REALISEE') ? 'REALISEE' : s.statut;
      if (st === 'PLANIFIE') st = 'PLANIFIEE';
      if (st !== tab) return false;
      
      if (!search) return true;
      const content = `${s.titre} ${s.coach?.prenom} ${s.coach?.nom} ${s.thematiqueNom || ''} ${s.programmeNom || ''}`.toLowerCase();
      return content.includes(search);
    });

    // 2. Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 3. Group by Coach -> Programme -> Thematique
    const coaches: any[] = [];

    filtered.forEach(s => {
      const coachId = s.coach?.id || 'unknown';
      const coachName = s.coach ? `${s.coach.prenom} ${s.coach.nom}` : 'Coach inconnu';
      
      let coachEntry = coaches.find(c => c.coachId === coachId);
      if (!coachEntry) {
        coachEntry = { coachId, coachName, specialty: s.coach?.specialite, programmes: [] };
        coaches.push(coachEntry);
      }

      const progName = s.programmeNom || 'Programme de coaching';
      let progEntry = coachEntry.programmes.find((p: any) => p.programmeName === progName);
      if (!progEntry) {
        progEntry = { programmeName: progName, thematiques: [] };
        coachEntry.programmes.push(progEntry);
      }

      const themName = s.thematiqueNom || 'Accompagnement';
      let themEntry = progEntry.thematiques.find((t: any) => t.thematiqueName === themName);
      if (!themEntry) {
        themEntry = { thematiqueName: themName, sessions: [] };
        progEntry.thematiques.push(themEntry);
      }

      themEntry.sessions.push(s);
    });

    return coaches;
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
      PLANIFIE:  { label: 'À venir', bg: '#eff6ff', color: '#1d4ed8' },
      PLANIFIEE: { label: 'À venir', bg: '#eff6ff', color: '#1d4ed8' },
      REALISEE:  { label: 'Terminée', bg: '#f0fdf4', color: '#166534' },
      TERMINE:   { label: 'Terminée', bg: '#f0fdf4', color: '#166534' },
      ANNULEE:   { label: 'Annulée',  bg: '#fff1f2', color: '#e11d48' },
      ANNULE:    { label: 'Annulée',  bg: '#fff1f2', color: '#e11d48' },
    };
    return config[statut] || { label: statut, bg: '#f1f5f9', color: '#475569' };
  }

  getCoachColor(id: any): string {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    const index = typeof id === 'number' ? id % colors.length : 0;
    return colors[index];
  }

  getGoogleCalendarLink(s: any): string {
    const start = new Date(s.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1h duration
    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const dates = `${fmt(start)}/${fmt(end)}`;
    const title = encodeURIComponent(s.titre || 'Session de Coaching RedBoost');
    const details = encodeURIComponent(`Session avec Coach ${s.coach?.prenom} ${s.coach?.nom}. Thématique: ${s.thematiqueNom}`);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&sf=true&output=xml`;
  }
}

