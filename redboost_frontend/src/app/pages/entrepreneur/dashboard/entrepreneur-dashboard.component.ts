import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';
import { TacheService } from '../../../core/services/tache.service';
import { MatchingService, MatchingView } from '../../../core/services/matching.service';
import { UserService } from '../../../core/services/user.service';
import { CoachService } from '../../dashboard/coachDashboard/services/coach.service';
import { OnInit, computed } from '@angular/core';

@Component({
  selector: 'rb-entrepreneur-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 bg-[#F8FAFC] min-h-screen">
      
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-[#1A1A2E] tracking-tight">
            Bonjour, {{ currentUserProfile?.prenom || 'Entrepreneur' }} 
          </h1>
          <p class="text-gray-500 mt-1 font-medium">
            {{ currentUserProfile?.startupName || 'Ma Startup' }} · 
            {{ currentUserProfile?.secteur || 'Secteur' }} · 
            <span class="font-black text-sky-500">Seed</span>
          </p>
        </div>
        <div class="flex items-center gap-2 px-5 py-2.5 bg-[#3B82A6] text-white rounded-full text-xs font-black shadow-lg shadow-[#3B82A6]/20">
          <div class="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></div>
          {{ progress() }}% COMPLÉTÉ
        </div>
      </div>

      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        @for (kpi of kpiCards(); track kpi.label) {
          <div class="rounded-3xl p-6 text-white relative overflow-hidden shadow-xl transition-all hover:scale-[1.02] hover:-translate-y-1"
            [style.background]="kpi.gradient" [style.boxShadow]="kpi.shadow">
            <div class="absolute -right-6 -top-6 rounded-full w-24 h-24 bg-white/10"></div>
            <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <i class="pi pi-{{ kpi.icon }} text-xl"></i>
            </div>
            <p class="text-[10px] font-bold tracking-widest opacity-80 uppercase mb-1">{{ kpi.label }}</p>
            <h3 class="font-black leading-none mb-1" [class]="kpi.label === 'COACH' ? 'text-xl' : 'text-4xl'">{{ kpi.value }}</h3>
            <p class="text-xs opacity-70 mb-4">{{ kpi.subtext }}</p>
            <div class="pt-3 border-t border-white/20 flex items-center gap-2 text-[10px] font-bold opacity-90 uppercase tracking-tighter">
              <div class="w-1.5 h-1.5 rounded-full bg-white/70"></div>
              {{ kpi.footer }}
            </div>
          </div>
        }
      </div>

      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        
        <!-- Sessions à réserver -->
        <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-black text-[#1A1A2E] flex items-center gap-2">
              <i class="pi pi-calendar-plus text-[#10B981]"></i>
              Sessions à réserver
            </h3>
            <button routerLink="/entrepreneur/mes-coachs" class="text-xs font-black text-gray-400 hover:text-[#10B981] transition-colors uppercase tracking-widest">Voir coachs</button>
          </div>
          
          <div class="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
            @for (session of sessionsToBook(); track session.sessionGroupId) {
              <div class="p-4 rounded-2xl border border-gray-100 bg-[#F8FAFC] hover:border-[#10B981]/30 transition-all">
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div class="min-w-0">
                    <p class="text-sm font-black text-[#1A1A2E] truncate">{{ session.sessionTitle }}</p>
                    <p class="text-[11px] text-gray-400 font-medium truncate">{{ session.coachName }}</p>
                  </div>
                  <div class="flex-shrink-0 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm text-center">
                    <p class="text-[10px] font-black text-[#10B981] leading-none">{{ session.slotsCount }}</p>
                    <p class="text-[8px] font-bold text-gray-400 uppercase">créneaux</p>
                  </div>
                </div>
                
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest"
                      style="background: #FFF0F5; color: #ea5073">{{ session.thematiqueName }}</span>
                  </div>
                  <button routerLink="/entrepreneur/mes-coachs" 
                    class="text-[11px] font-black text-[#10B981] hover:underline uppercase tracking-tighter flex items-center gap-1">
                    Réserver <i class="pi pi-chevron-right text-[9px]"></i>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <i class="pi pi-check-circle text-3xl mx-auto text-emerald-300 mb-2"></i>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Tout est à jour !</p>
                <p class="text-[10px] text-gray-400 px-4 mt-1">Vous avez réservé toutes vos sessions thématiques.</p>
              </div>
            }
          </div>
        </div>

        
        <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-black text-[#1A1A2E] flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-[#EF4444]"></i>
              Tâches Urgentes
            </h3>
            <button routerLink="/entrepreneur/mes-taches" class="text-xs font-black text-gray-400 hover:text-[#EF4444] transition-colors uppercase tracking-widest">Voir tout</button>
          </div>

          @if (urgentTasks().length === 0) {
            <div class="py-12 text-center">
              <i class="pi pi-check-circle text-5xl text-emerald-300 mb-3 block"></i>
              <p class="text-sm font-black text-gray-400 uppercase tracking-widest">Aucune tâche urgente !</p>
              <p class="text-xs text-gray-400 mt-1">Continuez comme ça </p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (task of urgentTasks(); track task.id) {
                <div class="flex items-center gap-3 p-4 rounded-2xl border"
                  style="background: #FEF2F2; border-color: rgba(239,68,68,0.15)">
                  <i class="pi pi-exclamation-triangle flex-shrink-0 text-[#EF4444]"></i>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-black text-[#1A1A2E] truncate">{{ task.title }}</p>
                    <p class="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                      <i class="pi pi-clock text-[11px]"></i>
                      {{ task.deadline }}
                    </p>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        
        <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
          <h3 class="text-lg font-black text-[#1A1A2E] mb-5 flex items-center gap-2">
            <i class="pi pi-calendar text-[#3B82A6]"></i>
            Prochaine Session
          </h3>

          @if (nextSession()) {
            
            <div class="rounded-2xl p-5 mb-4 text-white" style="background-color: #3B82A6">
              <div class="flex items-center gap-2.5 mb-2">
                <i class="pi pi-calendar opacity-75"></i>
                <span class="text-sm font-black">{{ nextSession()!.date }}</span>
              </div>
              <div class="flex items-center gap-2.5 mb-3">
                <i class="pi pi-clock opacity-75"></i>
                <span class="text-sm font-medium">{{ nextSession()!.time }} — {{ nextSession()!.duration }} min</span>
              </div>

              @if (nextSession()!.coachName) {
                <div class="flex items-center gap-2.5 mb-2 pt-2 border-t border-white/20 mt-2">
                  <i class="pi pi-user opacity-75"></i>
                  <span class="text-sm font-medium">{{ nextSession()!.coachName }}</span>
                </div>
              }
              @if (nextSession()!.thematiqueName) {
                <div class="flex items-center gap-2.5 mb-3">
                  <i class="pi pi-tag opacity-75"></i>
                  <span class="text-[13px] font-medium opacity-90 truncate max-w-[200px]">{{ nextSession()!.thematiqueName }}</span>
                </div>
              }

              <span class="text-[10px] px-2.5 py-1 rounded-full font-black uppercase"
                style="background: rgba(34,197,94,0.25); color: #86EFAC">
                ● Confirmé
              </span>
            </div>
            @if (nextSession()!.meetLink) {
              <a [href]="nextSession()!.meetLink" target="_blank"
                class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-white bg-[#3B82A6] hover:bg-[#2C6B8E] transition-colors shadow-lg shadow-[#3B82A6]/20">
                <i class="pi pi-video"></i>
                Rejoindre la session
              </a>
            }
          } @else {
            <div class="py-12 text-center">
              <i class="pi pi-calendar text-5xl text-gray-200 mb-3 block"></i>
              <p class="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Aucune session planifiée</p>
              <button routerLink="/calendar"
                class="flex items-center gap-1.5 text-sm font-black text-[#3B82A6] mx-auto hover:underline uppercase tracking-widest">
                Réserver maintenant <i class="pi pi-chevron-right text-[10px]"></i>
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class EntrepreneurDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private sessionSvc = inject(SessionService);
  private tacheSvc = inject(TacheService);
  private matchSvc = inject(MatchingService);
  private coachSvc = inject(CoachService);
  private userSvc = inject(UserService);

  urgentTasks = signal<any[]>([]);
  nextSession = signal<{ date: string; time: string; duration: number; meetLink?: string; coachName?: string; thematiqueName?: string } | null>(null);
  sessionsToBook = signal<any[]>([]);
  assignedCoach = signal<MatchingView | null>(null);
  coachTags = signal<string[]>([]);
  currentUserProfile: any = null;

  totalTasks = signal(0);
  progress = signal(0);
  totalCoaches = signal(0);
  upcomingSessionsCount = signal(0);

  ngOnInit() {
    const userSnapshot = (this.auth as any).currentUser$ ? (this.auth as any).currentUser$.value : null;
    if (!userSnapshot) return;

    // Refresh current user to get full dynamic data (startup name, etc)
    this.userSvc.getById(userSnapshot.id).subscribe(u => {
      this.currentUserProfile = u;
    });

    // Load Coach
    this.matchSvc.getEntrepreneurCoaches(userSnapshot.id).subscribe(matches => {
      this.totalCoaches.set(matches?.length || 0);
      if (matches.length > 0) {
        this.assignedCoach.set(matches[0]);
        try {
          this.coachTags.set(JSON.parse(matches[0].pointsForts || '[]').slice(0, 3));
        } catch(e) {
          this.coachTags.set(['Coaching', 'Stratégie', 'Expertise']);
        }

        // Fetch available sessions for each matched coach
        const allSessionsToBook: any[] = [];
        matches.forEach(match => {
          this.coachSvc.getAvailableSessionsGrouped(Number(match.id), Number(userSnapshot.id), match.thematiqueId ? Number(match.thematiqueId) : undefined).subscribe(groups => {
            const available = groups.filter(g => !g.reservedByMe).map(g => ({
              sessionGroupId: g.sessionGroupId,
              sessionTitle: g.sessionTitle,
              coachName: match.nom,
              thematiqueName: match.thematiqueName || 'Général',
              slotsCount: g.slots.length
            }));
            allSessionsToBook.push(...available);
            this.sessionsToBook.set([...allSessionsToBook]);
          });
        });
      }
    });

    // Load Tasks
    this.tacheSvc.getByUser(userSnapshot.id).subscribe((taches: any) => {
      const myTaches: any[] = Array.isArray(taches) ? taches : (taches?.data || []);
      this.totalTasks.set(myTaches.length);

      const urgent = myTaches
        .filter((t: any) => t.status !== 'TERMINEE' && t.dateEcheance)
        .sort((a: any, b: any) => new Date(a.dateEcheance!).getTime() - new Date(b.dateEcheance!).getTime())
        .slice(0, 3)
        .map((t: any) => ({
          id: t.id,
          title: t.titre,
          deadline: new Date(t.dateEcheance!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
        }));
      this.urgentTasks.set(urgent);
    });

    // Load Sessions
    this.sessionSvc.getByEntrepreneur(userSnapshot.id).subscribe((sessions: any) => {
      const mySessions: any[] = Array.isArray(sessions) ? sessions : (sessions?.data || []);
      
      const now = Date.now();
      const upcoming = mySessions.filter((s: any) => new Date(s.date).getTime() > now);
      this.upcomingSessionsCount.set(upcoming.length);

      // Progression calculation based on sessions
      const totalSess = mySessions.length;
      if (totalSess > 0) {
        const passedCount = mySessions.filter((s: any) => new Date(s.date).getTime() < now || s.statut === 'REALISEE' || s.statut === 'TERMINE').length;
        this.progress.set(Math.round((passedCount / totalSess) * 100));
      } else {
        this.progress.set(0);
      }

      const nextSess = upcoming.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      if (nextSess) {
        const coachName = nextSess.coach ? `${nextSess.coach.firstName || nextSess.coach.prenom || ''} ${nextSess.coach.lastName || nextSess.coach.nom || ''}`.trim() : undefined;
        const thematiqueName = nextSess.thematique?.nom || nextSess.thematiqueName || nextSess.titre;

        this.nextSession.set({
          date: new Date(nextSess.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' }),
          time: new Date(nextSess.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          duration: 60,
          meetLink: nextSess.meetLink,
          coachName: coachName || undefined,
          thematiqueName: thematiqueName || undefined
        });
      }
    });
  }

  kpiCards = computed(() => {
    return [
      { 
        label: 'COACH', 
        value: this.totalCoaches().toString(), 
        subtext: 'assignés', 
        footer: 'Accompagnement actif', 
        icon: 'users', 
        gradient: '#F97316', 
        shadow: '0 4px 16px rgba(249,115,22,0.15)' 
      },
      { label: 'SESSION', value: this.upcomingSessionsCount().toString(), subtext: 'à venir', footer: this.nextSession() ? 'Planifiée' : 'Aucune', icon: 'calendar', gradient: '#8B5CF6', shadow: '0 4px 16px rgba(139,92,246,0.15)' },
      { label: 'TÂCHES', value: this.totalTasks().toString(), subtext: 'à faire', footer: 'En cours', icon: 'list', gradient: '#3B82A6', shadow: '0 4px 16px rgba(59,130,166,0.15)' },
      { label: 'PROGRESSION', value: this.progress() + '%', subtext: 'sessions réalisées', footer: 'Avancement global', icon: 'chart-line', gradient: '#10B981', shadow: '0 4px 16px rgba(16,185,129,0.15)' },
    ];
  });
}
