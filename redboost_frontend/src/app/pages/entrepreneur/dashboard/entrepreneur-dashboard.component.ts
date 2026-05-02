import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';
import { TacheService } from '../../../core/services/tache.service';
import { MatchingService, MatchingView } from '../../../core/services/matching.service';
import { UserService } from '../../../core/services/user.service';
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

        
        <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
          <h3 class="text-lg font-black text-[#1A1A2E] mb-5 flex items-center gap-2">
            <i class="pi pi-user-edit text-[#ff3d91]"></i>
            Mon Coach
          </h3>
          
          @if (assignedCoach()) {
            <div class="flex items-center gap-4 mb-4">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg"
                style="background: linear-gradient(135deg, #3B82A6, #10B981)">
                {{ assignedCoach()!.nom ? assignedCoach()!.nom[0] : 'C' }}
              </div>
              <div>
                <p class="font-black text-[#1A1A2E]">{{ assignedCoach()!.nom }}</p>
                <p class="text-xs text-gray-400 font-medium">{{ assignedCoach()!.specialite || 'Coach Expert' }}</p>
              </div>
            </div>

            
            <div class="flex items-center gap-1 mb-4">
              @for (star of [1,2,3,4,5]; track star) {
                <span class="text-sm" [class]="star <= (assignedCoach()!.scoreMatching > 80 ? 5 : 4) ? 'text-amber-400' : 'text-gray-200'">★</span>
              }
              <span class="text-xs text-gray-400 ml-1 font-bold">{{ assignedCoach()!.scoreMatching > 80 ? '4.9' : '4.5' }}</span>
            </div>

            
            <div class="flex flex-wrap gap-1.5 mb-5">
              @for (tag of coachTags(); track tag) {
                <span class="text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest"
                  style="background: #F0FDF4; color: #10B981">{{ tag }}</span>
              }
            </div>

              <div class="flex gap-2">
                <button routerLink="/entrepreneur/mes-coachs"
                  class="flex-1 py-3 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] shadow-lg shadow-[#3B82A6]/20"
                  style="background: linear-gradient(135deg, #3B82A6, #475569)">
                  Profil complet
                </button>
                <button [routerLink]="['/entrepreneur/chat']" [queryParams]="{with: assignedCoach()!.id}"
                  class="w-14 py-3 rounded-2xl flex items-center justify-center text-white transition-all hover:scale-[1.05] shadow-lg shadow-[#F97316]/20"
                  style="background: linear-gradient(135deg, #F97316, #EF4444)">
                  <i class="pi pi-comments"></i>
                </button>
              </div>
            } @else {
              <div class="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <i class="pi pi-search text-3xl mx-auto text-gray-300 mb-2"></i>
                <p class="text-xs font-bold text-gray-400">Aucun coach assigné</p>
              </div>
            }
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
            
            <div class="rounded-2xl p-5 mb-4 text-white" style="background: linear-gradient(135deg, #3B82A6 0%, #475569 100%)">
              <div class="flex items-center gap-2.5 mb-2">
                <i class="pi pi-calendar opacity-75"></i>
                <span class="text-sm font-black">{{ nextSession()!.date }}</span>
              </div>
              <div class="flex items-center gap-2.5 mb-3">
                <i class="pi pi-clock opacity-75"></i>
                <span class="text-sm font-medium">{{ nextSession()!.time }} — {{ nextSession()!.duration }} min</span>
              </div>
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
              <button routerLink="/entrepreneur/mes-sessions"
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
  private userSvc = inject(UserService);

  urgentTasks = signal<any[]>([]);
  nextSession = signal<{ date: string; time: string; duration: number; meetLink?: string } | null>(null);
  assignedCoach = signal<MatchingView | null>(null);
  coachTags = signal<string[]>([]);
  currentUserProfile: any = null;

  totalTasks = signal(0);
  progress = signal(0);

  ngOnInit() {
    const userSnapshot = (this.auth as any).currentUser$ ? (this.auth as any).currentUser$.value : null;
    if (!userSnapshot) return;

    // Refresh current user to get full dynamic data (startup name, etc)
    this.userSvc.getById(userSnapshot.id).subscribe(u => {
      this.currentUserProfile = u;
    });

    // Load Coach
    this.matchSvc.getEntrepreneurCoaches(userSnapshot.id).subscribe(matches => {
      if (matches.length > 0) {
        this.assignedCoach.set(matches[0]);
        try {
          this.coachTags.set(JSON.parse(matches[0].pointsForts || '[]').slice(0, 3));
        } catch(e) {
          this.coachTags.set(['Coaching', 'Stratégie', 'Expertise']);
        }
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

      const completed = myTaches.filter((t: any) => t.status === 'TERMINEE').length;
      this.progress.set(myTaches.length ? Math.round((completed / myTaches.length) * 100) : 0);
    });

    // Load Sessions
    this.sessionSvc.getByEntrepreneur(userSnapshot.id).subscribe((sessions: any) => {
      const mySessions: any[] = Array.isArray(sessions) ? sessions : (sessions?.data || []);
      const upcoming = mySessions
        .filter((s: any) => new Date(s.date).getTime() > Date.now())
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      if (upcoming) {
        this.nextSession.set({
          date: new Date(upcoming.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' }),
          time: new Date(upcoming.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          duration: 60,
          meetLink: upcoming.meetLink,
        });
      }
    });
  }

  kpiCards = computed(() => {
    const coach = this.assignedCoach();
    return [
      { 
        label: 'COACH', 
        value: coach ? (coach.nom.length > 12 ? coach.nom.substring(0,12)+'...' : coach.nom) : 'Aucun', 
        subtext: coach ? coach.specialite || 'Expert' : 'En attente', 
        footer: 'Accompagnement actif', 
        icon: 'user-edit', 
        gradient: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)', 
        shadow: '0 4px 16px rgba(249,115,22,0.30)' 
      },
      { label: 'SESSION', value: this.nextSession() ? 'OUI' : 'NON', subtext: 'prochaine', footer: this.nextSession() ? 'Planifiée' : 'Aucune', icon: 'calendar', gradient: 'linear-gradient(135deg, #A855F7 0%, #7C3339 100%)', shadow: '0 4px 16px rgba(168,85,247,0.30)' },
      { label: 'TÂCHES', value: this.totalTasks().toString(), subtext: 'à faire', footer: 'En cours', icon: 'list', gradient: 'linear-gradient(135deg, #3B82A6 0%, #475569 100%)', shadow: '0 4px 16px rgba(59,130,166,0.25)' },
      { label: 'PROGRESSION', value: this.progress() + '%', subtext: 'globale', footer: 'Performance', icon: 'chart-line', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', shadow: '0 4px 16px rgba(16,185,129,0.25)' },
    ];
  });
}
