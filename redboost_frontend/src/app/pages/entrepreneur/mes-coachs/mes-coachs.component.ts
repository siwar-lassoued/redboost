import { Component, signal, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchingService, MatchingView } from '../../../core/services/matching.service';
import { AuthService } from '../../../core/services/auth.service';
import { CoachService, SessionGroupDTO, SessionCoachDTO, DashboardStatsDTO } from '../../dashboard/coachDashboard/services/coach.service';
import { SessionService } from '../../../core/services/session.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatTooltipModule } from '@angular/material/tooltip';

interface ProgramGroup {
  name: string;
  thematiques: ThematiqueGroup[];
}

interface ThematiqueGroup {
  name: string;
  dateDebut?: string;
  dateFin?: string;
  sessions: SessionGroupDTO[];
}

interface ExtendedMatching extends MatchingView {
  coachDetails?: any | null;
  groupedByProgram?: ProgramGroup[];
  stats?: DashboardStatsDTO | null;
}

@Component({
  selector: 'rb-mes-coachs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatTooltipModule],
  template: `
    <div class="p-8 bg-[#F8FAFC] min-h-screen font-sans">
      
      <div class="mb-8">
        <h1 class="text-[28px] font-extrabold text-[#1A1A2E] leading-tight">Mon Coach</h1>
        <p class="text-[#8a8a8a] text-sm mt-1">Profil et historique avec votre coach</p>
      </div>

      @if (extendedMatchings().length > 0) {
        @for (coach of extendedMatchings(); track coach.id) {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            
            <!-- Left: Coach Profile -->
            <div class="lg:col-span-1">
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-[400px] flex flex-col">
                <div class="overflow-y-auto pr-2 custom-scrollbar flex-1">
                  <div class="text-center mb-6">
                    <h2 class="text-xl font-bold text-[#1A1A2E]">{{ coach.nom }}</h2>
                    <p class="text-sm text-gray-500 mt-1 font-medium">{{ coach.sector || coach.specialite || 'Coach Expert' }}</p>
                  </div>

                  <!-- Stats -->
                  <div class="grid grid-cols-3 gap-2 mb-6">
                    <div class="text-center p-3 bg-gray-50 rounded-xl border border-transparent hover:border-[#3aafff]/20 transition-all">
                      <i class="pi pi-users text-[#3aafff] text-sm mb-1"></i>
                      <div class="text-sm font-bold text-[#1A1A2E]">{{ coach.stats?.nbProjet || coach.coachDetails?.nbEntreCoaches || 0 }}</div>
                      <div class="text-[10px] text-gray-400">Entrepreneurs</div>
                    </div>
                    <div class="text-center p-3 bg-gray-50 rounded-xl border border-transparent hover:border-[#3aafff]/20 transition-all">
                      <i class="pi pi-calendar text-[#3aafff] text-sm mb-1"></i>
                      <div class="text-sm font-bold text-[#1A1A2E]">{{ coach.stats?.nbRendezVous || 0 }}</div>
                      <div class="text-[10px] text-gray-400">Sessions</div>
                    </div>
                    <div class="text-center p-3 bg-gray-50 rounded-xl border border-transparent hover:border-[#3aafff]/20 transition-all">
                      <i class="pi pi-chart-line text-[#3aafff] text-sm mb-1"></i>
                      <div class="text-sm font-bold text-[#1A1A2E]">{{ (coach.stats?.completionRate || 0) | number:'1.0-0' }}%</div>
                      <div class="text-[10px] text-gray-400">Complétion</div>
                    </div>
                  </div>

                  <!-- Bio -->
                  <div class="mb-6">
                    <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Biographie</h4>
                    <p class="text-sm text-gray-600 leading-relaxed italic">
                      {{ coach.coachDetails?.bio || 'Aucune biographie disponible pour le moment.' }}
                    </p>
                  </div>

                  <!-- Expertise -->
                  <div class="mb-6">
                    <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Expertises</h4>
                    <div class="flex flex-wrap gap-2">
                      @for (exp of getExpertises(coach); track exp) {
                        <span class="text-[11px] px-3 py-1 rounded-full bg-[#E8F5E9] text-[#059669] font-semibold">
                          {{ exp }}
                        </span>
                      } @empty {
                        <span class="text-xs text-gray-400 italic">Accompagnement, Stratégie</span>
                      }
                    </div>
                  </div>

                  <!-- Matching Justification -->
                  <div class="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div class="flex items-center gap-2 mb-2">
                      <i class="pi pi-sparkles text-amber-600 text-xs"></i>
                      <span class="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Pourquoi ce matching ?</span>
                    </div>
                    <p class="text-xs text-amber-900 leading-relaxed italic text-justify">"{{ coach.justificationMatching }}"</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Disponibilités & Historique -->
            <div class="lg:col-span-2 space-y-8">
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-[400px]">
                <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <h3 class="text-lg font-bold text-[#1A1A2E] flex items-center gap-2">
                    <i class="pi pi-calendar-clock text-[#3aafff]"></i>
                    Disponibilités & Historique
                  </h3>
                  
                  <!-- Legend -->
                  <div class="flex flex-wrap gap-3">
                    <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" style="background: #16a34a"></span><span class="text-[9px] font-bold text-gray-400">Passé (Moi)</span></div>
                    <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" style="background: #ea580c"></span><span class="text-[9px] font-bold text-gray-400">À venir (Moi)</span></div>
                    <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" style="background: #2563eb"></span><span class="text-[9px] font-bold text-gray-400">Disponible</span></div>
                    <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" style="background: #cbd5e1"></span><span class="text-[9px] font-bold text-gray-400">Indisponible</span></div>
                  </div>
                </div>

                <!-- Scrollable Content -->
                <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div class="space-y-10">
                    @for (prog of coach.groupedByProgram; track prog.name) {
                      <div class="program-section mb-10">
                        <!-- Program Subtle Header -->
                        <div class="flex items-center gap-3 mb-6">
                          <span class="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] px-3 py-1 bg-blue-50 rounded-full">{{ prog.name }}</span>
                          <div class="h-px flex-1 bg-gradient-to-r from-blue-100 to-transparent"></div>
                        </div>

                        @for (them of prog.thematiques; track them.name) {
                          <div class="thematique-section mb-8 pl-4 border-l-2 border-gray-50">
                            <div class="flex items-center justify-between mb-4">
                              <h4 class="text-sm font-bold text-[#1A1A2E] flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                {{ them.name }}
                              </h4>
                              @if (them.dateDebut && them.dateFin) {
                                <span class="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                  <i class="pi pi-calendar-minus mr-1 text-[8px]"></i>
                                  {{ formatDatePeriod(them.dateDebut, them.dateFin) }}
                                </span>
                              }
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                              @for (session of them.sessions; track session.sessionGroupId) {
                                <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col h-full hover:bg-white transition-colors duration-300">
                                  <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/50">
                                    <p class="text-[11px] font-bold text-[#1A1A2E] truncate pr-2" [matTooltip]="session.sessionTitle">
                                      {{ session.sessionTitle }}
                                    </p>
                                    @if (session.reservedByMe) {
                                      <span class="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <i class="pi pi-check text-[10px]"></i>
                                      </span>
                                    }
                                  </div>
                                  
                                  <div class="space-y-2 mt-auto">
                                    @for (slot of session.slots; track slot.id) {
                                      <div class="slot-pill"
                                        [class.past-me]="slot.isBookedByMe && (slot.bookingStatus === 'TERMINE' || slot.bookingStatus === 'REALISEE' || slot.bookingStatus === 'TERMINEE')"
                                        [class.future-me]="slot.isBookedByMe && slot.bookingStatus !== 'TERMINE' && slot.bookingStatus !== 'REALISEE' && slot.bookingStatus !== 'TERMINEE'"
                                        [class.available-blue]="!isSlotPast(slot) && !slot.isBooked && !session.reservedByMe"
                                        [class.disabled-gray]="(isSlotPast(slot) && !slot.isBookedByMe) || (!isSlotPast(slot) && slot.isBooked && !slot.isBookedByMe) || (!isSlotPast(slot) && session.reservedByMe && !slot.isBookedByMe)"
                                        [matTooltip]="getSlotTooltip(slot, session.reservedByMe)">
                                        <div class="flex items-center justify-between px-3 py-2">
                                          <div class="flex flex-col">
                                            <span class="text-[9px] font-bold uppercase opacity-60">{{ formatSlotDayName(slot.dateSession) }}</span>
                                            <span class="text-[11px] font-bold">{{ formatSlotDate(slot.dateSession) }}</span>
                                          </div>
                                          <div class="text-xs font-black">{{ slot.heureDebut }}</div>
                                        </div>
                                      </div>
                                    }
                                  </div>
                                </div>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    } @empty {
                      <div class="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <i class="pi pi-calendar-times text-5xl text-gray-200 mb-4"></i>
                        <p class="text-sm text-gray-400 font-bold uppercase tracking-widest">Aucune session enregistrée</p>
                      </div>
                    }
                  </div>
                </div>
              </div>

              @if (coach.recommandationSession1) {
                <div class="bg-[#1A3A3A] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div class="absolute top-0 right-0 p-4 opacity-10">
                    <i class="pi pi-quote-right text-6xl"></i>
                  </div>
                  <div class="flex items-start gap-4 relative z-10">
                     <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-inner">
                       <i class="pi pi-lightbulb text-2xl text-amber-300"></i>
                     </div>
                     <div>
                       <h4 class="font-bold text-[10px] uppercase tracking-widest mb-1 text-amber-200">Recommandation Session 1</h4>
                       <p class="text-sm font-medium leading-relaxed italic text-gray-100">"{{ coach.recommandationSession1 }}"</p>
                     </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      } @else {
        <div class="flex flex-col items-center justify-center py-40 bg-white rounded-2xl shadow-sm border border-gray-100">
           <div class="relative mb-6">
             <div class="w-16 h-16 rounded-full border-4 border-[#3aafff]/20 border-t-[#3aafff] animate-spin"></div>
             <i class="pi pi-users absolute inset-0 flex items-center justify-center text-[#3aafff] text-xl"></i>
           </div>
           <h3 class="text-lg font-bold text-[#1A1A2E]">Chargement de vos accompagnements...</h3>
           <p class="text-sm text-gray-400 mt-2">Nous préparons les profils de vos coachs.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

    .slot-pill {
      border-radius: 10px;
      border: 1.5px solid #e2e8f0;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: default;
      background: white;
      color: #64748b;
    }
    .slot-pill.available-blue {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #2563eb;
    }
    .slot-pill.available-blue:hover {
      background: #dbeafe;
      transform: translateY(-1px);
    }
    .slot-pill.past-me {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #16a34a;
      box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.1);
    }
    .slot-pill.future-me {
      background: #fff7ed;
      border-color: #ffedd5;
      color: #ea580c;
      box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.1);
    }
    .slot-pill.disabled-gray {
      background: #f8fafc;
      border-color: #f1f5f9;
      color: #cbd5e1;
      opacity: 0.8;
      filter: grayscale(1);
    }
    .program-section:not(:last-child) {
      margin-bottom: 3rem;
    }
  `]
})
export class MesCoachsComponent implements OnInit {
  private readonly matchSvc = inject(MatchingService);
  private readonly authSvc = inject(AuthService);
  private readonly coachSvc = inject(CoachService);
  private readonly sessionSvc = inject(SessionService);

  extendedMatchings = signal<ExtendedMatching[]>([]);

  ngOnInit(): void {
    const user = this.authSvc.currentUser$.value;
    if (user?.id) {
      this.loadAllData(user.id);
    }
  }

loadAllData(userId: any) {
    this.authSvc.currentUser$.subscribe(user => {
      if (!user) return;
      const userId = String(user.id);

      forkJoin({
        matchings: this.matchSvc.getEntrepreneurCoaches(userId).pipe(catchError(() => of([]))),
        allMySessions: this.sessionSvc.getByEntrepreneur(userId).pipe(catchError(() => of([])))
      }).subscribe(({ matchings, allMySessions }) => {
        // Deduplicate by coach ID
        const uniqueMatchingsMap = new Map<string, MatchingView>();
        matchings.forEach(m => {
          if (!uniqueMatchingsMap.has(m.id)) {
            uniqueMatchingsMap.set(m.id, { ...m });
          } else {
            const existing = uniqueMatchingsMap.get(m.id)!;
            if (m.thematiqueName && !existing.thematiqueName?.includes(m.thematiqueName)) {
               existing.thematiqueName += ", " + m.thematiqueName;
            }
          }
        });

        const uniqueMatchings = Array.from(uniqueMatchingsMap.values());
        const requests = uniqueMatchings.map(m => {
          const coachId = Number(m.id);
          const entId = Number(userId);

          return forkJoin({
            profile: this.coachSvc.getUserById(coachId).pipe(catchError(() => of(null))),
            groups: this.coachSvc.getAvailableSessionsGrouped(coachId, entId).pipe(catchError(() => of([]))),
            stats: this.coachSvc.getDashboardStats(coachId).pipe(catchError(() => of(null)))
          }).pipe(
            catchError(() => of({ profile: null, groups: [], stats: null }))
          );
        });

        forkJoin(requests).subscribe(results => {
          const extended = uniqueMatchings.map((m, i) => {
            const coachId = m.id;
            const slotGroups = results[i].groups as SessionGroupDTO[];
            
            // Get actual sessions from "Mes Sessions" for this coach
            const coachBookedSessions = allMySessions.filter(s => {
              const sessionCoachId = s.coachId ? String(s.coachId) : (s.coach?.id ? String(s.coach.id) : '');
              return sessionCoachId === String(coachId);
            });

            // Create a set of slot IDs already covered by slotGroups (to avoid duplicates)
            const coveredSlotIds = new Set<string>();
            slotGroups.forEach(g => {
              if (g.slots) {
                g.slots.forEach(s => {
                  if (s.id) coveredSlotIds.add(String(s.id));
                });
              }
            });

            // Convert missing booked sessions to Group format
            const supplementaryGroups: SessionGroupDTO[] = coachBookedSessions
              .filter(s => !s.disponibiliteId || !coveredSlotIds.has(String(s.disponibiliteId)))
              .map(s => {
                const date = new Date(s.date);
                const slot: SessionCoachDTO = {
                  id: s.disponibiliteId ? Number(s.disponibiliteId) : undefined,
                  disponibiliteId: 0, // dummy
                  titre: s.titre,
                  dateSession: date.toISOString().split('T')[0],
                  heureDebut: date.toTimeString().split(' ')[0].substring(0, 5),
                  heureFin: '', // unknown
                  thematiqueNom: s.thematiqueName || 'Session Spéciale',
                  programmeNom: s.programme?.nom || 'Autres Programmes',
                  isBooked: true,
                  isBookedByMe: true,
                  bookingStatus: s.statut
                };
                return {
                  sessionGroupId: s.id,
                  sessionTitle: s.titre,
                  reservedByMe: true,
                  slots: [slot]
                };
              });

            const allGroups = [...slotGroups, ...supplementaryGroups];
            const programGroups: ProgramGroup[] = [];
            
            allGroups.forEach(group => {
              const firstSlot = group.slots[0];
              const progName = firstSlot?.programmeNom || 'Autres Programmes';
              const themName = firstSlot?.thematiqueNom || 'Autres Thématiques';
              
              let progGroup = programGroups.find(p => p.name === progName);
              if (!progGroup) {
                progGroup = { name: progName, thematiques: [] };
                programGroups.push(progGroup);
              }
              
              let themGroup = progGroup.thematiques.find(t => t.name === themName);
              if (!themGroup) {
                themGroup = { 
                  name: themName, 
                  dateDebut: firstSlot?.thematiqueDateDebut,
                  dateFin: firstSlot?.thematiqueDateFin,
                  sessions: [] 
                };
                progGroup.thematiques.push(themGroup);
              }
              
              // Deduplicate groups by ID if necessary (though supplementary should be unique)
              if (!themGroup.sessions.find(s => s.sessionGroupId === group.sessionGroupId)) {
                themGroup.sessions.push(group);
              }
            });

            programGroups.sort((a, b) => a.name.localeCompare(b.name));
            programGroups.forEach(p => p.thematiques.sort((a, b) => a.name.localeCompare(b.name)));

            return {
              ...m,
              coachDetails: results[i].profile,
              groupedByProgram: programGroups,
              stats: results[i].stats
            };
          });
          
          this.extendedMatchings.set(extended);
        });
      });
    });
  }

  getExpertises(coach: ExtendedMatching): string[] {
    const expertiseStr = coach.coachDetails?.expertise || coach.coachDetails?.skills || '';
    if (!expertiseStr) return [];
    return expertiseStr.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
  }

  isSlotPast(slot: SessionCoachDTO): boolean {
    if (!slot.dateSession) return false;
    const now = new Date();
    const slotDate = new Date(slot.dateSession);
    if (slot.heureDebut) {
      const [h, m] = slot.heureDebut.split(':');
      slotDate.setHours(Number(h), Number(m));
    }
    return slotDate < now;
  }

  formatSlotDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  formatSlotDayName(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  }

  formatDatePeriod(start: string, end: string): string {
    if (!start || !end) return '';
    const d1 = new Date(start);
    const d2 = new Date(end);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${d1.toLocaleDateString('fr-FR', options)} - ${d2.toLocaleDateString('fr-FR', options)}`;
  }

  getSlotTooltip(slot: SessionCoachDTO, groupReserved: boolean): string {
    if (slot.isBookedByMe) return this.isSlotPast(slot) ? 'Votre séance passée' : 'Votre réservation à venir';
    if (slot.isBooked) return 'Créneau déjà réservé par un autre entrepreneur';
    if (this.isSlotPast(slot)) return 'Ce créneau est passé';
    if (groupReserved) return 'Vous avez déjà réservé un autre créneau pour cette session';
    return 'Disponible pour réservation';
  }
}
