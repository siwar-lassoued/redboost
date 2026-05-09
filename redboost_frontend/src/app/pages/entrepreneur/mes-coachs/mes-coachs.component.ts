import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatchingService, MatchingView } from '../../../core/services/matching.service';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';

const STATUT_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  PLANIFIEE: { label: 'Planifiée', bg: '#EFF6FF', color: '#2563EB' },
  REALISEE: { label: 'Terminée', bg: '#F0FDF4', color: '#16A34A' },
  ANNULEE: { label: 'Annulée', bg: '#FEF2F2', color: '#DC2626' },
  TERMINE: { label: 'Terminée', bg: '#F0FDF4', color: '#16A34A' },
};

@Component({
  selector: 'rb-mes-coachs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6 bg-[#F8FAFC] min-h-screen">
      
      <div class="mb-8">
        <h1 class="text-3xl font-black text-[#1A1A2E] tracking-tight">Mes Coachs</h1>
        <p class="text-gray-500 mt-1 font-medium">Profils et accompagnements personnalisés</p>
      </div>

      @if (matchings().length > 0) {
        @for (coach of matchings(); track coach.id) {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            
            <!-- Left: Coach Profile -->
            <div class="lg:col-span-1">
              <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 sticky top-6">
                <div class="text-center mb-6">
                  <div class="flex justify-center mb-3">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
                          [style.background]="getThematiqueColor(coach.thematiqueName).bg" 
                          [style.color]="getThematiqueColor(coach.thematiqueName).text"
                          [style.border-color]="getThematiqueColor(coach.thematiqueName).border">
                      <i class="pi pi-tag" style="font-size:9px"></i>
                      {{ coach.thematiqueName || 'Thématique Non Spécifiée' }}
                    </span>
                  </div>
                  <div class="flex items-center justify-center gap-2 mb-1">
                    <h2 class="text-xl font-black text-[#1A1A2E]">{{ coach.nom }}</h2>
                    <i class="pi pi-check-circle text-blue-500 text-lg"></i>
                  </div>
                  <p class="text-sm text-gray-500 font-medium">{{ coach.specialite || 'Coach Expert' }}</p>
                </div>

                <div class="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <div class="flex items-center gap-2 mb-2">
                    <i class="pi pi-sparkles text-amber-600"></i>
                    <span class="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Pourquoi ce matching ?</span>
                  </div>
                  <p class="text-xs text-amber-900 leading-relaxed italic">"{{ coach.justificationMatching }}"</p>
                </div>

                <div class="space-y-3">
                  <button [routerLink]="['/gestion_comm']" [queryParams]="{with: coach.id}"
                    class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 shadow-md"
                    style="background-color: #ef4444">
                    <i class="pi pi-comments pb-1 px-1"></i>
                    Discuter avec ce coach
                  </button>
                </div>
              </div>
            </div>

            <!-- Right: History & Planning -->
            <div class="lg:col-span-2 space-y-6">
              <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 min-h-[400px]">
                <div class="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
                  <h3 class="text-lg font-black text-[#1A1A2E] flex items-center gap-2">
                    <i class="pi pi-history text-[#3B82A6]"></i>
                    Historique & Planning
                  </h3>
                  <span class="text-xs font-bold text-gray-400">{{ getCoachSessions(coach.id, coach.thematiqueId).length }} sessions</span>
                </div>

                @if (getCoachSessions(coach.id, coach.thematiqueId).length > 0) {
                  <div class="space-y-4">
                    @for (s of getCoachSessions(coach.id, coach.thematiqueId); track s.id) {
                      <div class="p-5 rounded-3xl border-2 transition-all flex items-center gap-5"
                        [class]="isPast(s.date) ? 'border-gray-50 bg-gray-50/30 opacity-60' : (isNextSession(s, coach.id, coach.thematiqueId) ? 'border-[#EC4899] bg-[#FFF1F2]' : 'border-gray-100 bg-white shadow-sm')">
                        
                        <!-- Date Badge -->
                        <div class="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 shadow-sm"
                          [class]="isPast(s.date) ? 'bg-gray-200 text-gray-500' : (isNextSession(s, coach.id, coach.thematiqueId) ? 'bg-[#EC4899] text-white' : 'bg-[#3B82A6] text-white')">
                          <span class="text-[10px] font-black uppercase leading-none">{{ formatMonth(s.date) }}</span>
                          <span class="text-xl font-black leading-tight">{{ formatDay(s.date) }}</span>
                        </div>

                        <!-- Info -->
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-3 mb-1">
                            <h4 class="text-base font-black truncate" [class]="isNextSession(s, coach.id, coach.thematiqueId) ? 'text-[#9D174D]' : 'text-[#1A1A2E]'">
                              {{ s.titre || 'Session de Coaching' }}
                            </h4>
                            @if (isNextSession(s, coach.id, coach.thematiqueId)) {
                              <span class="px-2.5 py-1 bg-[#EC4899] text-white text-[9px] font-black rounded-lg uppercase tracking-wider">Prochaine</span>
                            }
                          </div>
                          
                          <div class="flex items-center gap-4 text-xs font-medium text-gray-400">
                            <span class="flex items-center gap-1.5"><i class="pi pi-clock"></i> {{ getSessionTimeRange(s) }}</span>
                            <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                              [style.background]="getBadge(s.statut).bg" [style.color]="getBadge(s.statut).color">
                              {{ getBadge(s.statut).label }}
                            </span>
                          </div>
                        </div>

                        <!-- Action for Planified -->
                        @if (!isPast(s.date) && s.meetLink) {
                          <a [href]="s.meetLink" target="_blank" 
                             class="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg"
                             [style.background-color]="isNextSession(s, coach.id, coach.thematiqueId) ? '#EC4899' : '#3B82A6'">
                             <i class="pi pi-video"></i>
                          </a>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <div class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                    <i class="pi pi-calendar-minus text-5xl text-gray-200 mb-4"></i>
                    <p class="text-sm font-black text-gray-400 uppercase tracking-widest">Aucune session enregistrée</p>
                  </div>
                }
              </div>

              @if (coach.recommandationSession1) {
                <div class="bg-[#475569] rounded-3xl p-6 text-white shadow-xl shadow-slate-200/50">
                  <div class="flex items-start gap-4">
                     <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                       <i class="pi pi-lightbulb text-xl"></i>
                     </div>
                     <div>
                       <h4 class="font-black text-sm uppercase tracking-widest mb-1 opacity-80">Recommandation Session 1</h4>
                       <p class="text-sm font-medium leading-relaxed italic">"{{ coach.recommandationSession1 }}"</p>
                     </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      } @else {
        <div class="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] shadow-xl shadow-gray-100 border border-gray-50">
           <div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
             <i class="pi pi-search text-5xl text-gray-200"></i>
           </div>
           <h3 class="text-xl font-black text-gray-500">Matching en cours...</h3>
           <p class="text-sm text-gray-400 mt-2 font-medium">Nous finalisons l'attribution de vos coachs experts.</p>
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class MesCoachsComponent implements OnInit {
  private matchSvc = inject(MatchingService);
  private authSvc = inject(AuthService);
  private sessionSvc = inject(SessionService);

  matchings = signal<MatchingView[]>([]);
  allSessions = signal<any[]>([]);

  ngOnInit(): void {
    const user = this.authSvc.currentUser$.value;
    if (user?.id) {
      this.matchSvc.getEntrepreneurCoaches(user.id).subscribe(data => {
        const sanitize = (v: any) => (v === 'Non spécifié' || v === 'non spécifié' || v === 'null' || v === null) ? '' : v;
        const uniqueCoaches = new Map<string, MatchingView>();
        
        (data || []).forEach(c => {
          const uniqueId = c.id + '_' + (c.thematiqueId || 'none');
          if (!uniqueCoaches.has(uniqueId)) {
            uniqueCoaches.set(uniqueId, {
              ...c,
              nom: sanitize(c.nom),
              specialite: sanitize(c.specialite),
              thematiqueName: sanitize(c.thematiqueName),
              pointsForts: sanitize(c.pointsForts)
            });
          }
        });
        
        this.matchings.set(Array.from(uniqueCoaches.values()));
      });
      this.loadSessions(user.id);
    }
  }

  loadSessions(userId: string) {
    this.sessionSvc.getByEntrepreneur(userId).subscribe(sessions => {
      this.allSessions.set(Array.isArray(sessions) ? sessions : []);
    });
  }

  getCoachSessions(coachId: string, thematiqueId?: number): any[] {
    return this.allSessions()
      .filter(s => s.coach && String(s.coach.id) === String(coachId) && 
                   (!thematiqueId || (s.thematique && String(s.thematique.id) === String(thematiqueId))))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  isPast(date: string): boolean {
    return new Date(date) < new Date();
  }

  isNextSession(session: any, coachId: string, thematiqueId?: number): boolean {
    const coachSessions = this.getCoachSessions(coachId, thematiqueId);
    const now = new Date();
    const futureSessions = coachSessions.filter(s => new Date(s.date) >= now);
    return futureSessions.length > 0 && futureSessions[0].id === session.id;
  }

  getPointsForts(coach: MatchingView): string[] {
    try { return JSON.parse(coach.pointsForts || '[]'); }
    catch (e) { return ['Expertise', 'Accompagnement']; }
  }

  getBadge(statut: string) {
    return STATUT_BADGE[statut] || { label: statut, bg: '#F3F4F6', color: '#374151' };
  }

  formatMonth(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
  }

  formatDay(date: string): string {
    if (!date) return '';
    return new Date(date).getDate().toString();
  }

  formatTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getSessionTimeRange(s: any): string {
    if (s.heureDebut && s.heureFin) {
      return `${s.heureDebut.substring(0, 5)} - ${s.heureFin.substring(0, 5)}`;
    }
    return this.formatTime(s.date);
  }

  readonly colorPalette = [
    { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' }, // Sky
    { bg: '#FCE7F3', text: '#DB2777', border: '#FBCFE8' }, // Pink
    { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' }, // Green
    { bg: '#F3E8FF', text: '#9333EA', border: '#E9D5FF' }, // Purple
    { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' }, // Amber
    { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' }, // Red
  ];

  getThematiqueColor(name: string) {
    if (!name) return this.colorPalette[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % this.colorPalette.length;
    return this.colorPalette[index];
  }
}