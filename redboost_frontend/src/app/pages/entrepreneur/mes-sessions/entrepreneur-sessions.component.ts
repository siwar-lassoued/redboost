import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { CoachService } from '../../dashboard/coachDashboard/services/coach.service';

type Tab = 'PLANIFIEE' | 'REALISEE' | 'ANNULEE';
type ViewMode = 'list' | 'calendar';

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
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6 bg-[#F8FAFC] min-h-screen relative">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-black text-[#1A1A2E] tracking-tight">Mes Sessions</h1>
          <p class="text-gray-500 mt-1 font-medium">{{ allSessions().length }} sessions au total</p>
        </div>
        <div class="flex items-center gap-4">
          <!-- View Toggle -->
          <div class="flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button (click)="viewMode.set('list')" 
              class="px-4 py-2 text-sm font-bold transition-all"
              [class]="viewMode() === 'list' ? 'bg-[#1A3A3A] text-white' : 'text-gray-500 hover:bg-gray-50'">
              <i class="pi pi-list mr-1"></i> Liste
            </button>
            <button (click)="viewMode.set('calendar')" 
              class="px-4 py-2 text-sm font-bold transition-all"
              [class]="viewMode() === 'calendar' ? 'bg-[#1A3A3A] text-white' : 'text-gray-500 hover:bg-gray-50'">
              <i class="pi pi-calendar mr-1"></i> Calendrier
            </button>
          </div>
          
          <div class="flex items-center gap-2 px-5 py-2.5 bg-[#1A3A3A] text-white rounded-full text-xs font-black shadow-lg shadow-[#1A3A3A]/20">
            <i class="pi pi-video"></i>
            {{ getCount('PLANIFIEE') }} à venir
          </div>
        </div>
      </div>

      <!-- Toolbar (Only in list view) -->
      @if (viewMode() === 'list') {
        <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
          @for (tab of tabs; track tab.id) {
            <button (click)="activeTab.set(tab.id)"
              class="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 cursor-pointer whitespace-nowrap"
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
      }

      <!-- MAIN CONTENT -->
      @if (viewMode() === 'list') {
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
                      <button (click)="openRescheduleModal(s)"
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
      } @else {
        <!-- WEEK CALENDAR VIEW -->
        <div class="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div class="flex items-center justify-between p-6 border-b border-gray-100">
            <button (click)="prevWeek()" class="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <i class="pi pi-chevron-left"></i>
            </button>
            <h2 class="text-xl font-black text-[#1A1A2E]">{{ weekRangeLabel() }}</h2>
            <div class="flex gap-2">
              <button (click)="goToday()" class="px-4 py-2 rounded-xl bg-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors">
                Aujourd'hui
              </button>
              <button (click)="nextWeek()" class="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                <i class="pi pi-chevron-right"></i>
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-7 min-h-[500px]">
            @for (day of currentWeekDays(); track day.date.toISOString()) {
              <div class="border-r border-gray-100 last:border-0 flex flex-col">
                <div class="p-3 text-center border-b border-gray-100" [class.bg-sky-50]="isToday(day.date)">
                  <span class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{ day.dayName }}</span>
                  <span class="inline-flex w-8 h-8 items-center justify-center rounded-full mt-1 text-lg font-black" 
                    [class]="isToday(day.date) ? 'bg-[#3aafff] text-white shadow-md shadow-sky-200' : 'text-[#1A1A2E]'">
                    {{ day.dayNum }}
                  </span>
                </div>
                <div class="flex-1 p-2 space-y-2 bg-gray-50/30">
                  @for (s of getSessionsForDay(day.date); track s.id) {
                    <div class="p-2 rounded-xl text-xs cursor-pointer hover:brightness-95 transition-all shadow-sm border-l-4"
                      [style.background]="getBadge(s.statut).bg"
                      [style.borderLeftColor]="getBadge(s.statut).color"
                      (click)="viewMode.set('list'); activeTab.set(s.statut === 'TERMINE' ? 'REALISEE' : s.statut)">
                      <div class="font-bold text-[#1A1A2E] mb-1 truncate">{{ s.titre || 'Session' }}</div>
                      <div class="flex items-center gap-1 text-gray-500 font-medium">
                        <i class="pi pi-clock text-[10px]"></i> {{ formatTime(s.date) }}
                      </div>
                      @if(s.coach) {
                        <div class="mt-1 text-[10px] text-gray-400 truncate">👨‍🏫 {{ s.coach.nom }}</div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
      
      <!-- RESCHEDULE MODAL -->
      @if (rescheduleSessionId()) {
        <div class="fixed inset-0 bg-[#1A1A2E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <div>
                <h2 class="text-xl font-black text-[#1A1A2E]">Reprogrammer la session</h2>
                <p class="text-xs text-gray-500 font-medium mt-1">Choisissez un nouveau créneau disponible avec votre coach</p>
              </div>
              <button (click)="closeRescheduleModal()" class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <i class="pi pi-times"></i>
              </button>
            </div>
            
            <div class="p-6 overflow-y-auto flex-1">
              @if (loadingSlots()) {
                <div class="flex flex-col items-center justify-center py-12">
                  <i class="pi pi-spin pi-spinner text-3xl text-sky-500 mb-4"></i>
                  <p class="text-gray-500 text-sm font-medium">Recherche des disponibilités du coach...</p>
                </div>
              } @else if (availableSlots().length === 0) {
                <div class="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
                  <i class="pi pi-calendar-times text-3xl text-orange-400 mb-3 block"></i>
                  <p class="text-orange-800 font-bold mb-1">Aucune disponibilité trouvée</p>
                  <p class="text-orange-600 text-xs">Votre coach n'a pas défini de nouveaux créneaux libres pour le moment. Veuillez le contacter directement par message.</p>
                </div>
              } @else {
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  @for (slot of availableSlots(); track slot.id) {
                    <div class="border-2 rounded-2xl p-4 cursor-pointer transition-all hover:border-sky-300"
                         [class]="selectedSlotId() === slot.id ? 'border-sky-500 bg-sky-50 shadow-md shadow-sky-100' : 'border-gray-100 bg-white'"
                         (click)="selectedSlotId.set(slot.id)">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex flex-col items-center justify-center">
                          <span class="text-[9px] font-black uppercase">{{ formatMonth(slot.dateSession) }}</span>
                          <span class="text-sm font-black">{{ formatDay(slot.dateSession) }}</span>
                        </div>
                        <div>
                          <div class="text-sm font-black text-[#1A1A2E]">{{ formatTimeOnly(slot.heureDebut) }} - {{ formatTimeOnly(slot.heureFin) }}</div>
                          <div class="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-1">
                            <i class="pi" [class.pi-video]="slot.typeSession === 'EN_LIGNE'" [class.pi-users]="slot.typeSession !== 'EN_LIGNE'"></i>
                            {{ slot.typeSession === 'EN_LIGNE' ? 'En ligne' : 'Présentiel' }}
                          </div>
                        </div>
                        @if (selectedSlotId() === slot.id) {
                          <div class="ml-auto w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-sm">
                            <i class="pi pi-check text-[10px] font-bold"></i>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
              
              <!-- Custom Date Fallback -->
              <div class="mt-8 pt-6 border-t border-gray-100">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ou proposer une date manuellement</p>
                <div class="flex items-center gap-3">
                  <input type="datetime-local" [(ngModel)]="customRescheduleDate" 
                    class="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all">
                </div>
              </div>
            </div>
            
            <div class="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button (click)="closeRescheduleModal()" class="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button (click)="confirmReschedule()" [disabled]="!selectedSlotId() && !customRescheduleDate"
                class="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                style="background: linear-gradient(135deg, #1A3A3A, #3aafff)">
                Envoyer la demande
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class EntrepreneurSessionsComponent implements OnInit {
  private sessionSvc = inject(SessionService);
  private authSvc = inject(AuthService);
  private coachSvc = inject(CoachService);

  tabs = TAB_CONFIG;
  activeTab = signal<Tab>('PLANIFIEE');
  viewMode = signal<ViewMode>('list');
  allSessions = signal<any[]>([]);
  
  // Calendar State
  currentWeekStart = signal<Date>(this.getMonday(new Date()));
  
  // Reschedule State
  rescheduleSessionId = signal<number | null>(null);
  selectedCoachId = signal<number | null>(null);
  loadingSlots = signal<boolean>(false);
  availableSlots = signal<any[]>([]);
  selectedSlotId = signal<number | null>(null);
  customRescheduleDate = '';

  filteredSessions = computed(() => {
    const tab = this.activeTab();
    return this.allSessions().filter(s => {
      // Map TERMINE → REALISEE for tab matching
      const statut = s.statut === 'TERMINE' ? 'REALISEE' : s.statut;
      return statut === tab;
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  currentTabConfig = computed(() => this.tabs.find(t => t.id === this.activeTab())!);

  // Calendar Computeds
  weekRangeLabel = computed(() => {
    const start = this.currentWeekStart();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    } else if (start.getFullYear() === end.getFullYear()) {
      return `${start.getDate()} ${start.toLocaleDateString('fr-FR', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`;
    } else {
      return `${start.getDate()} ${start.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} - ${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`;
    }
  });

  currentWeekDays = computed(() => {
    const start = this.currentWeekStart();
    const days = [];
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({
        date: d,
        dayName: dayNames[i],
        dayNum: d.getDate()
      });
    }
    return days;
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
      const st = s.statut === 'TERMINE' ? 'REALISEE' : s.statut;
      return st === statut;
    }).length;
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
  
  formatTimeOnly(timeStr: string): string {
    if (!timeStr) return '';
    // timeStr could be "HH:mm:ss" or "HH:mm"
    return timeStr.substring(0, 5).replace(':', 'h');
  }

  // --- Calendar Methods ---
  getMonday(d: Date): Date {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday;
  }

  prevWeek(): void {
    const d = new Date(this.currentWeekStart());
    d.setDate(d.getDate() - 7);
    this.currentWeekStart.set(d);
  }

  nextWeek(): void {
    const d = new Date(this.currentWeekStart());
    d.setDate(d.getDate() + 7);
    this.currentWeekStart.set(d);
  }

  goToday(): void {
    this.currentWeekStart.set(this.getMonday(new Date()));
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  getSessionsForDay(date: Date): any[] {
    return this.allSessions().filter(s => {
      if (!s.date) return false;
      const sd = new Date(s.date);
      return sd.getDate() === date.getDate() &&
             sd.getMonth() === date.getMonth() &&
             sd.getFullYear() === date.getFullYear();
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // --- Reschedule Modal Methods ---
  openRescheduleModal(session: any): void {
    if (!session || !session.coach || !session.coach.id) {
      alert("Impossible de reprogrammer cette session : le coach n'est pas identifié.");
      return;
    }
    
    const user = this.authSvc.currentUser$.value;
    if (!user) return;
    
    this.rescheduleSessionId.set(session.id);
    this.selectedCoachId.set(session.coach.id);
    this.selectedSlotId.set(null);
    this.customRescheduleDate = '';
    
    this.loadingSlots.set(true);
    this.coachSvc.getAvailableSessionsForEntrepreneur(session.coach.id, Number(user.id)).subscribe({
      next: (slots: any[]) => {
        // filter future slots only
        const now = new Date().getTime();
        const futureSlots = (slots || []).filter((s: any) => {
          if(!s.dateSession || !s.heureDebut) return false;
          const slotTime = new Date(s.dateSession + 'T' + s.heureDebut).getTime();
          return slotTime > now;
        });
        
        this.availableSlots.set(futureSlots);
        this.loadingSlots.set(false);
      },
      error: (err: any) => {
        console.error('Error fetching available slots', err);
        this.availableSlots.set([]);
        this.loadingSlots.set(false);
      }
    });
  }

  closeRescheduleModal(): void {
    this.rescheduleSessionId.set(null);
    this.selectedCoachId.set(null);
  }

  confirmReschedule(): void {
    const user = this.authSvc.currentUser$.value;
    if (!user) return;
    
    const sessionId = this.rescheduleSessionId();
    if (!sessionId) return;
    
    let newDateStr = '';
    
    if (this.selectedSlotId()) {
      const slot = this.availableSlots().find(s => s.id === this.selectedSlotId());
      if (slot) {
        // Compose proper datetime string
        newDateStr = slot.dateSession + 'T' + slot.heureDebut;
      }
    } else if (this.customRescheduleDate) {
      newDateStr = this.customRescheduleDate;
    }
    
    if (!newDateStr) {
      alert("Veuillez choisir un créneau ou indiquer une date.");
      return;
    }
    
    if (confirm('Voulez-vous vraiment demander la reprogrammation de cette session à cette date ?')) {
      this.sessionSvc.requestReschedule(String(sessionId), newDateStr, Number(user.id)).subscribe({
        next: () => {
           alert('Demande de reprogrammation envoyée au coach.');
           this.closeRescheduleModal();
           this.loadSessions(); // Refresh list
        },
        error: (err: any) => {
           console.error(err);
           alert("Erreur: " + (err.error?.error || "Contactez l'administration"));
        }
      });
    }
  }
}
