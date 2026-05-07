import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatchingService, MatchingView } from '../../../core/services/matching.service';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';

const STATUT_BADGE: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  PLANIFIEE: { label: 'Planifiée', bg: '#EFF6FF', color: '#2563EB', dot: '#3B82F6' },
  REALISEE:  { label: 'Terminée',  bg: '#F0FDF4', color: '#16A34A', dot: '#22C55E' },
  ANNULEE:   { label: 'Annulée',   bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
  TERMINE:   { label: 'Terminée',  bg: '#F0FDF4', color: '#16A34A', dot: '#22C55E' },
  PLANIFIE:  { label: 'Planifiée', bg: '#EFF6FF', color: '#2563EB', dot: '#3B82F6' },
};

const COACH_COLORS = [
  { gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', light: '#EDE9FE', accent: '#7C3AED' },
  { gradient: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', light: '#E0F2FE', accent: '#0284C7' },
  { gradient: 'linear-gradient(135deg,#f97316,#ef4444)', light: '#FEF3C7', accent: '#EA580C' },
  { gradient: 'linear-gradient(135deg,#10b981,#059669)', light: '#D1FAE5', accent: '#047857' },
  { gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)', light: '#FCE7F3', accent: '#DB2777' },
];

@Component({
  selector: 'rb-mes-coachs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="page-shell">

  <!-- ── Hero Header ── -->
  <div class="hero-header">
    <div class="hero-left">
      <div class="hero-icon">
        <i class="pi pi-users"></i>
      </div>
      <div>
        <h1 class="hero-title">Mes Coachs</h1>
        <p class="hero-sub">Vos accompagnateurs experts par thématique</p>
      </div>
    </div>
    <div class="stats-pill">
      <i class="pi pi-star-fill"></i>
      <span>{{ matchings().length }} coach{{ matchings().length > 1 ? 's' : '' }} assigné{{ matchings().length > 1 ? 's' : '' }}</span>
    </div>
  </div>

  <!-- ── Content ── -->
  @if (matchings().length > 0) {
    <div class="coaches-list">
      @for (coach of matchings(); track (coach.id + '_' + coach.thematiqueId); let i = $index) {
        <div class="coach-block">

          <!-- Thematique ribbon -->
          <div class="them-ribbon" [style.background]="getColor(i).gradient">
            <i class="pi pi-tag"></i>
            <span class="them-label">Thématique</span>
            <span class="them-name">{{ coach.thematiqueName || 'Accompagnement' }}</span>
            <span class="them-spacer"></span>
            <span class="them-sessions-count">
              {{ getSessions(coach, i).length }} session{{ getSessions(coach, i).length !== 1 ? 's' : '' }}
            </span>
          </div>

          <div class="coach-grid">

            <!-- ── Left: Profile Card ── -->
            <div class="profile-card">
              <!-- Avatar -->
              <div class="avatar-wrap">
                <div class="avatar" [style.background]="getColor(i).gradient">
                  {{ initials(coach.nom) }}
                </div>
                <div class="avatar-badge"><i class="pi pi-verified"></i></div>
              </div>

              <h2 class="coach-name">{{ coach.nom }}</h2>
              <p class="coach-role">{{ coach.specialite || 'Coach Expert' }}</p>

              <!-- Score -->
              <div class="score-row">
                <div class="score-bar-wrap">
                  <div class="score-bar-fill" [style.width.%]="coach.scoreMatching || 0" [style.background]="getColor(i).gradient"></div>
                </div>
                <span class="score-label">{{ coach.scoreMatching || 0 }}% match</span>
              </div>

              <!-- Justification -->
              @if (coach.justificationMatching) {
                <div class="justif-box" [style.background]="getColor(i).light">
                  <i class="pi pi-sparkles" [style.color]="getColor(i).accent"></i>
                  <p class="justif-text">"{{ coach.justificationMatching }}"</p>
                </div>
              }

              <!-- CTA -->
              <a [routerLink]="['/entrepreneur/chat']" [queryParams]="{with: coach.id}" class="chat-btn" [style.background]="getColor(i).gradient">
                <i class="pi pi-comments"></i>
                Discuter
              </a>
            </div>

            <!-- ── Right: Sessions ── -->
            <div class="sessions-panel">
              <div class="sessions-header">
                <span class="sessions-title"><i class="pi pi-calendar"></i> Planning des sessions</span>
                <span class="sessions-count-badge" [style.background]="getColor(i).light" [style.color]="getColor(i).accent">
                  {{ getSessions(coach, i).length }}
                </span>
              </div>

              @if (getSessions(coach, i).length > 0) {
                <div class="sessions-scroll">
                  @for (s of getSessions(coach, i); track s.id; let si = $index) {
                    <div class="session-row" [class.session-past]="isPast(s.date)" [class.session-next]="isNext(s, coach, i)">
                      <!-- Date Badge -->
                      <div class="date-badge" [style.background]="isNext(s, coach, i) ? getColor(i).gradient : (isPast(s.date) ? '#E2E8F0' : getColor(i).light)">
                        <span class="date-mon" [style.color]="(isNext(s, coach, i) || !isPast(s.date)) ? (isNext(s, coach, i) ? 'rgba(255,255,255,.75)' : getColor(i).accent) : '#94A3B8'">{{ fmtMon(s.date) }}</span>
                        <span class="date-day" [style.color]="isNext(s, coach, i) ? '#fff' : (isPast(s.date) ? '#94A3B8' : getColor(i).accent)">{{ fmtDay(s.date) }}</span>
                      </div>

                      <!-- Info -->
                      <div class="session-info">
                        <div class="session-title-row">
                          <span class="session-title">{{ s.titre || 'Session de coaching' }}</span>
                          @if (isNext(s, coach, i)) {
                            <span class="next-badge" [style.background]="getColor(i).gradient">Prochaine</span>
                          }
                        </div>
                        <div class="session-meta">
                          <span><i class="pi pi-clock"></i> {{ fmtTime(s.date) }}</span>
                          <span class="statut-dot" [style.background]="getBadge(s.statut).dot"></span>
                          <span class="statut-label" [style.color]="getBadge(s.statut).color">{{ getBadge(s.statut).label }}</span>
                        </div>
                      </div>

                      <!-- Meet link -->
                      @if (!isPast(s.date) && s.meetLink) {
                        <a [href]="s.meetLink" target="_blank" class="meet-btn" [style.background]="getColor(i).gradient">
                          <i class="pi pi-video"></i>
                        </a>
                      }
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-sessions">
                  <div class="empty-icon" [style.background]="getColor(i).light">
                    <i class="pi pi-calendar-minus" [style.color]="getColor(i).accent"></i>
                  </div>
                  <p class="empty-title">Aucune session planifiée</p>
                  <p class="empty-sub">Les sessions apparaîtront ici une fois réservées</p>
                </div>
              }

              <!-- Recommandation -->
              @if (coach.recommandationSession1) {
                <div class="reco-box">
                  <div class="reco-icon" [style.background]="getColor(i).gradient"><i class="pi pi-lightbulb"></i></div>
                  <div>
                    <p class="reco-label">Recommandation</p>
                    <p class="reco-text">"{{ coach.recommandationSession1 }}"</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  } @else {
    <div class="empty-state">
      <div class="empty-anim">
        <i class="pi pi-search"></i>
      </div>
      <h3>Matching en cours...</h3>
      <p>Nous finalisons l'attribution de vos coachs experts.</p>
    </div>
  }

</div>
  `,
  styles: [`
    :host { display: block; }

    /* ── Shell ── */
    .page-shell {
      min-height: 100vh;
      background: #F1F5F9;
      padding: 28px 32px;
      font-family: 'Inter', 'Segoe UI', sans-serif;
    }

    /* ── Hero ── */
    .hero-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
      gap: 16px;
    }
    .hero-left { display: flex; align-items: center; gap: 18px; }
    .hero-icon {
      width: 56px; height: 56px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 22px;
      box-shadow: 0 8px 24px rgba(99,102,241,.3);
    }
    .hero-title { font-size: 28px; font-weight: 900; color: #0F172A; margin: 0; letter-spacing: -0.5px; }
    .hero-sub   { font-size: 13px; color: #64748B; margin: 3px 0 0; font-weight: 500; }
    .stats-pill {
      display: flex; align-items: center; gap: 7px;
      background: white; border: 1px solid #E2E8F0;
      padding: 8px 18px; border-radius: 50px;
      font-size: 13px; font-weight: 700; color: #334155;
      box-shadow: 0 2px 8px rgba(0,0,0,.05);
    }
    .stats-pill .pi-star-fill { color: #F59E0B; }

    /* ── Coach Block ── */
    .coaches-list { display: flex; flex-direction: column; gap: 28px; }

    .coach-block {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,.07);
      border: 1px solid #E2E8F0;
    }

    /* Thematique ribbon */
    .them-ribbon {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 24px; color: white;
    }
    .them-ribbon .pi { font-size: 14px; opacity: .8; }
    .them-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .15em; opacity: .7; }
    .them-name  { font-size: 15px; font-weight: 900; letter-spacing: -0.2px; }
    .them-spacer { flex: 1; }
    .them-sessions-count {
      font-size: 11px; font-weight: 700;
      background: rgba(255,255,255,.2); padding: 3px 12px; border-radius: 20px;
    }

    /* Grid */
    .coach-grid {
      display: grid; grid-template-columns: 280px 1fr;
      gap: 0;
    }

    /* ── Profile Card ── */
    .profile-card {
      padding: 28px 24px;
      border-right: 1px solid #F1F5F9;
      display: flex; flex-direction: column; align-items: center; gap: 14px;
    }
    .avatar-wrap { position: relative; margin-bottom: 4px; }
    .avatar {
      width: 80px; height: 80px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 26px; font-weight: 900;
      box-shadow: 0 8px 24px rgba(0,0,0,.15);
    }
    .avatar-badge {
      position: absolute; bottom: 2px; right: 2px;
      width: 22px; height: 22px; background: white; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; color: #6366f1;
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
    }
    .coach-name { font-size: 17px; font-weight: 900; color: #0F172A; text-align: center; margin: 0; }
    .coach-role { font-size: 12px; color: #64748B; font-weight: 600; text-align: center; margin: 0; }

    .score-row { width: 100%; display: flex; flex-direction: column; gap: 5px; }
    .score-bar-wrap { height: 6px; background: #F1F5F9; border-radius: 10px; overflow: hidden; }
    .score-bar-fill { height: 100%; border-radius: 10px; transition: width .5s ease; }
    .score-label { font-size: 11px; font-weight: 700; color: #64748B; text-align: right; }

    .justif-box {
      width: 100%; padding: 12px 14px; border-radius: 14px;
      display: flex; gap: 8px; align-items: flex-start;
    }
    .justif-box .pi { font-size: 14px; margin-top: 2px; flex-shrink: 0; }
    .justif-text { font-size: 11px; color: #374151; line-height: 1.6; font-style: italic; margin: 0; }

    .chat-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 11px 24px; border-radius: 14px;
      color: white; font-size: 13px; font-weight: 800;
      text-decoration: none; width: 100%; justify-content: center;
      box-shadow: 0 4px 14px rgba(0,0,0,.15);
      transition: opacity .2s, transform .15s;
    }
    .chat-btn:hover { opacity: .92; transform: translateY(-1px); }

    /* ── Sessions Panel ── */
    .sessions-panel { padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }
    .sessions-header { display: flex; align-items: center; justify-content: space-between; }
    .sessions-title { font-size: 14px; font-weight: 800; color: #1E293B; display: flex; align-items: center; gap: 7px; }
    .sessions-title .pi { font-size: 15px; }
    .sessions-count-badge {
      font-size: 12px; font-weight: 800;
      padding: 3px 12px; border-radius: 20px;
    }

    .sessions-scroll { display: flex; flex-direction: column; gap: 10px; }

    .session-row {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 16px; border-radius: 16px;
      border: 1.5px solid #F1F5F9;
      background: #FAFAFA;
      transition: all .2s ease;
    }
    .session-row:hover { border-color: #E2E8F0; box-shadow: 0 4px 16px rgba(0,0,0,.06); }
    .session-past { opacity: .55; }
    .session-next { border-color: transparent !important; background: white; box-shadow: 0 4px 20px rgba(99,102,241,.12); }

    .date-badge {
      width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .date-mon { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
    .date-day { font-size: 20px; font-weight: 900; line-height: 1.1; }

    .session-info { flex: 1; min-width: 0; }
    .session-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
    .session-title { font-size: 14px; font-weight: 800; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .next-badge {
      font-size: 9px; font-weight: 900; color: white;
      padding: 3px 9px; border-radius: 8px; white-space: nowrap; text-transform: uppercase; letter-spacing: .06em;
    }
    .session-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #94A3B8; font-weight: 600; }
    .session-meta .pi-clock { font-size: 11px; }
    .statut-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .statut-label { font-weight: 700; }

    .meet-btn {
      width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 15px; text-decoration: none;
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
      transition: transform .2s, opacity .2s;
    }
    .meet-btn:hover { transform: scale(1.1); opacity: .9; }

    /* Empty state sessions */
    .empty-sessions {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 40px 20px; border: 2px dashed #E2E8F0; border-radius: 20px;
    }
    .empty-icon {
      width: 56px; height: 56px; border-radius: 18px;
      display: flex; align-items: center; justify-content: center; font-size: 22px;
    }
    .empty-title { font-size: 14px; font-weight: 800; color: #334155; margin: 0; }
    .empty-sub   { font-size: 12px; color: #94A3B8; margin: 0; font-weight: 500; text-align: center; }

    /* Recommandation box */
    .reco-box {
      display: flex; gap: 14px; align-items: flex-start;
      padding: 16px 18px; background: #F8FAFC; border-radius: 16px;
      border: 1px solid #E2E8F0;
    }
    .reco-icon {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;
    }
    .reco-label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .12em; color: #94A3B8; margin: 0 0 4px; }
    .reco-text  { font-size: 12px; color: #374151; font-style: italic; line-height: 1.6; margin: 0; }

    /* ── Empty State (no coaches) ── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      padding: 80px 24px; background: white; border-radius: 28px;
      border: 2px dashed #E2E8F0;
    }
    .empty-anim {
      width: 80px; height: 80px; background: #F1F5F9; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 36px; color: #CBD5E1;
    }
    .empty-state h3 { font-size: 18px; font-weight: 900; color: #475569; margin: 0; }
    .empty-state p  { font-size: 13px; color: #94A3B8; margin: 0; font-weight: 500; }

    @media (max-width: 900px) {
      .page-shell { padding: 16px; }
      .coach-grid { grid-template-columns: 1fr; }
      .profile-card { border-right: none; border-bottom: 1px solid #F1F5F9; }
      .hero-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class MesCoachsComponent implements OnInit {
  private matchSvc  = inject(MatchingService);
  private authSvc   = inject(AuthService);
  private sessionSvc = inject(SessionService);

  matchings  = signal<MatchingView[]>([]);
  allSessions = signal<any[]>([]);

  ngOnInit(): void {
    const user = this.authSvc.currentUser$.value;
    if (user?.id) {
      this.matchSvc.getEntrepreneurCoaches(user.id).subscribe(data =>
        this.matchings.set(Array.isArray(data) ? data : [])
      );
      this.sessionSvc.getByEntrepreneur(user.id).subscribe(sessions =>
        this.allSessions.set(Array.isArray(sessions) ? sessions : [])
      );
    }
  }

  /**
   * Returns sessions for a coach+thematique pair.
   * Falls back to coach-only if no session carries a thematiqueId.
   */
  getSessions(coach: MatchingView, colorIdx: number): any[] {
    const coachIdStr = String(coach.id);
    const themIdStr  = coach.thematiqueId ? String(coach.thematiqueId) : null;

    const matched = this.allSessions().filter(s => {
      const sCoachId = s.coach?.id != null ? String(s.coach.id) : null;
      if (sCoachId !== coachIdStr) return false;

      if (themIdStr) {
        const sThemId = s.thematiqueId != null
          ? String(s.thematiqueId)
          : (s.thematique?.id != null ? String(s.thematique.id) : null);
        // If session has a thematique, match strictly; if it doesn't, include it anyway
        if (sThemId) return sThemId === themIdStr;
      }
      return true;
    });

    return matched.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  isNext(session: any, coach: MatchingView, i: number): boolean {
    const now = new Date();
    const future = this.getSessions(coach, i).filter(s => new Date(s.date) >= now);
    return future.length > 0 && future[0].id === session.id;
  }

  isPast(date: string): boolean { return new Date(date) < new Date(); }

  getBadge(statut: string) {
    return STATUT_BADGE[statut] ?? { label: statut, bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF' };
  }

  getColor(i: number) { return COACH_COLORS[i % COACH_COLORS.length]; }

  initials(nom: string): string {
    if (!nom) return 'C';
    return nom.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  fmtMon(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
  }
  fmtDay(date: string): string {
    if (!date) return '';
    return new Date(date).getDate().toString();
  }
  fmtTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}