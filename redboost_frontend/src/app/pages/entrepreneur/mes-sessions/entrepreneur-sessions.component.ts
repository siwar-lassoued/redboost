import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';

type Tab = 'PLANIFIEE' | 'REALISEE' | 'ANNULEE';

const TAB_CONFIG: { id: Tab; label: string; icon: string; color: string; emptyMsg: string }[] = [
  { id: 'PLANIFIEE', label: 'Planifiées', icon: 'calendar-clock', color: '#3aafff', emptyMsg: 'Aucune session planifiée' },
  { id: 'REALISEE',  label: 'Terminées', icon: 'check-circle',   color: '#22c55e', emptyMsg: 'Aucune session terminée' },
  { id: 'ANNULEE',   label: 'Annulées',  icon: 'x-circle',       color: '#ef4444', emptyMsg: 'Aucune session annulée' },
];

const STATUT_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  PLANIFIEE: { label: 'Planifiée', bg: '#EFF6FF', color: '#2563EB' },
  REALISEE:  { label: 'Terminée', bg: '#F0FDF4', color: '#16A34A' },
  ANNULEE:   { label: 'Annulée',  bg: '#FEF2F2', color: '#DC2626' },
  TERMINE:   { label: 'Terminée', bg: '#F0FDF4', color: '#16A34A' },
};

@Component({
  selector: 'rb-entrepreneur-sessions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 bg-[#F8FAFC] min-h-screen">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-[#1A1A2E] tracking-tight">Mes Sessions</h1>
          <p class="text-gray-500 mt-1 font-medium">{{ allSessions().length }} sessions au total</p>
        </div>
        <div class="flex items-center gap-2 px-5 py-2.5 bg-[#1A3A3A] text-white rounded-full text-xs font-black shadow-lg shadow-[#1A3A3A]/20">
          <i class="pi pi-video"></i>
          {{ getCount('PLANIFIEE') }} à venir
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6">
        @for (tab of tabs; track tab.id) {
          <button (click)="activeTab.set(tab.id)"
            class="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 cursor-pointer"
            [style.background]="activeTab() === tab.id ? tab.color : 'white'"
            [style.color]="activeTab() === tab.id ? 'white' : '#6B7280'"
            [style.borderColor]="activeTab() === tab.id ? tab.color : '#E5E7EB'">
            <i class="pi pi-{{tab.icon}} ml-1"></i>
            {{ tab.label }}
            <span class="ml-1 min-w-[20px] h-[20px] rounded-full flex items-center justify-center text-[10px]"
              [style.background]="activeTab() === tab.id ? 'rgba(255,255,255,0.25)' : '#F3F4F6'"
              [style.color]="activeTab() === tab.id ? 'white' : '#9CA3AF'">
              {{ getCount(tab.id) }}
            </span>
          </button>
        }
      </div>

      <!-- Session Cards -->
      <div class="space-y-4">
        @for (s of filteredSessions(); track s.id) {
          <div class="bg-white rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100 transition-all hover:shadow-2xl hover:-translate-y-0.5">
            <div class="p-6">
              <div class="flex items-start gap-5">
                <!-- Date Badge -->
                <div class="w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0 shadow-lg"
                  [style.background]="activeTab() === 'ANNULEE' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : activeTab() === 'REALISEE' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #1A3A3A, #3aafff)'">
                  <span class="text-[10px] font-bold uppercase opacity-80">{{ formatMonth(s.date) }}</span>
                  <span class="text-2xl font-black leading-none">{{ formatDay(s.date) }}</span>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 class="text-base font-black text-[#1A1A2E]">{{ s.titre || 'Session de coaching' }}</h3>
                    <span class="text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest"
                      [style.background]="getBadge(s.statut).bg" [style.color]="getBadge(s.statut).color">
                      {{ getBadge(s.statut).label }}
                    </span>
                  </div>

                  <div class="flex items-center gap-4 text-xs text-gray-400 font-medium mb-1">
                    <div class="flex items-center gap-1.5">
                      <i class="pi pi-clock"></i>
                      {{ formatTime(s.date) }} — {{ s.dureeMinutes || 60 }} min
                    </div>
                    @if (s.coach) {
                      <div class="flex items-center gap-1.5">
                        <i class="pi pi-user"></i>
                        {{ s.coach.prenom }} {{ s.coach.nom }}
                      </div>
                    }
                  </div>

                  @if (s.notesCoach) {
                    <p class="text-xs text-gray-500 mt-2 italic border-l-2 border-sky-200 pl-3">
                      "{{ s.notesCoach }}"
                    </p>
                  }
                </div>

                <!-- Actions -->
                <div class="flex-shrink-0 flex items-center gap-2">
                  @if (s.statut === 'PLANIFIEE' && s.meetLink) {
                    <a [href]="s.meetLink" target="_blank"
                      class="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-white transition-all hover:scale-[1.03] shadow-lg shadow-sky-400/30"
                      style="background: linear-gradient(135deg, #00d2ff, #3aafff)">
                      <i class="pi pi-video"></i>
                      🎥 Rejoindre
                    </a>
                  }
                  @if (s.statut === 'PLANIFIEE') {
                    <button (click)="rescheduleSession(s)"
                      class="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-blue-600 bg-blue-50 transition-all hover:scale-[1.03] border border-blue-200">
                      <i class="pi pi-calendar-plus"></i>
                      Reprogrammer
                    </button>
                  }
                  @if (s.statut === 'PLANIFIEE' && !s.meetLink) {
                    <span class="text-[10px] text-gray-400 font-bold uppercase px-4 py-2 bg-gray-50 rounded-xl">
                      Lien bientôt disponible
                    </span>
                  }
                  @if (s.statut === 'REALISEE' || s.statut === 'TERMINE') {
                    <button [routerLink]="['/coach-rating', s.id]"
                      class="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-white transition-all hover:scale-[1.03] shadow-lg shadow-amber-400/30"
                      style="background: linear-gradient(135deg, #f59e0b, #d97706)">
                      <i class="pi pi-star"></i>
                      ⭐ Évaluer
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- Annulation Motif (red zone) -->
            @if (s.statut === 'ANNULEE' && s.annulationMotif) {
              <div class="px-6 py-4 border-t-2 border-red-100" style="background: #FEF2F2">
                <div class="flex items-start gap-2">
                  <i class="pi pi-exclamation-circle text-red-400 mt-0.5"></i>
                  <div>
                    <p class="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Motif d'annulation</p>
                    <p class="text-xs text-red-700 leading-relaxed">{{ s.annulationMotif }}</p>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Empty State -->
        @if (filteredSessions().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <i class="pi pi-{{currentTabConfig().icon}} text-5xl text-gray-200 mb-4"></i>
            <p class="text-sm font-black text-gray-400 uppercase tracking-widest">{{ currentTabConfig().emptyMsg }}</p>
            @if (activeTab() === 'PLANIFIEE') {
              <button routerLink="/entrepreneur/coach"
                class="mt-6 flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black text-white shadow-lg transition-all hover:scale-[1.02]"
                style="background: linear-gradient(135deg, #1A3A3A, #3aafff)">
                <i class="pi pi-calendar-plus"></i>
                Réserver une session
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class EntrepreneurSessionsComponent implements OnInit {
  private sessionSvc = inject(SessionService);
  private authSvc = inject(AuthService);

  tabs = TAB_CONFIG;
  activeTab = signal<Tab>('PLANIFIEE');
  allSessions = signal<any[]>([]);

  filteredSessions = computed(() => {
    const tab = this.activeTab();
    return this.allSessions().filter(s => {
      // Map TERMINE → REALISEE for tab matching
      const statut = s.statut === 'TERMINE' ? 'REALISEE' : s.statut;
      return statut === tab;
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  currentTabConfig = computed(() => this.tabs.find(t => t.id === this.activeTab())!);

  ngOnInit(): void {
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
      const st = s.statut === 'TERMINE' ? 'REALISEE' : s.statut;
      return st === statut;
    }).length;
  }

  getBadge(statut: string) {
    return STATUT_BADGE[statut] || { label: statut, bg: '#F3F4F6', color: '#374151' };
  }

  formatMonth(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
  }

  formatDay(date: string): string {
    return new Date(date).getDate().toString();
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  rescheduleSession(session: any): void {
    // Basic reschedule prompt for now
    const note = prompt("Veuillez indiquer vos nouvelles préférences de créneau :");
    if (note) {
      if (confirm('Voulez-vous vraiment demander la reprogrammation de cette session ?')) {
        this.sessionSvc.requestReschedule(session.id, note).subscribe({
          next: () => {
             alert('Demande de reprogrammation envoyée.');
             this.ngOnInit(); // Refresh list
          },
          error: (err: any) => {
             console.error(err);
             alert('Erreur: ' + (err.error?.message || 'Contactez l\'administration'));
          }
        });
      }
    }
  }
}
