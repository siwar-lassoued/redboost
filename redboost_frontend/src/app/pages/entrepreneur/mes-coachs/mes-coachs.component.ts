import { Component, signal, inject, ChangeDetectionStrategy, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchingService, MatchingView } from '../../../core/services/matching.service';
import { AuthService } from '../../../core/services/auth.service';
import { CoachService, SessionGroupDTO, SessionCoachDTO, DashboardStatsDTO } from '../../dashboard/coachDashboard/services/coach.service';
import { SessionService } from '../../../core/services/session.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CalendarComponent } from '../../backoffice/event_organizer/calendar/event_calendar';


interface ProgramGroup {
  name: string;
  thematiques: ThematiqueGroup[];
}

interface ExtendedSessionGroupDTO extends SessionGroupDTO {
  isExceptionnelle?: boolean;
}

interface ThematiqueGroup {
  name: string;
  dateDebut?: string;
  dateFin?: string;
  sessions: ExtendedSessionGroupDTO[];
}

interface ExtendedMatching extends MatchingView {
  coachDetails?: any | null;
  groupedByProgram?: ProgramGroup[];
  exceptionalGroup?: ProgramGroup;
  stats?: DashboardStatsDTO | null;
}

import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'rb-mes-coachs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatTooltipModule, CalendarComponent],
  template: `
    <div class="p-8 bg-[#F8FAFC] min-h-screen font-sans">
      
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 class="text-[28px] font-extrabold text-[#1A1A2E] leading-tight">Réservation</h1>
          <p class="text-[#8a8a8a] text-sm mt-1">Gérez vos rendez-vous et votre planning</p>
        </div>

        <!-- Premium Tab Switcher -->
        <div class="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50 w-fit">
          <button (click)="selectedTab = 'mes-coachs'"
            [class]="selectedTab === 'mes-coachs' ? 'bg-white shadow-sm text-[#1A1A2E]' : 'text-gray-500 hover:text-gray-700'"
            class="px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2">
            <i class="pi pi-user-check" [class.text-[#3aafff]]="selectedTab === 'mes-coachs'"></i>
            Mes Coachs
          </button>
          <button (click)="selectedTab = 'calendar'"
            [class]="selectedTab === 'calendar' ? 'bg-white shadow-sm text-[#1A1A2E]' : 'text-gray-500 hover:text-gray-700'"
            class="px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2">
            <i class="pi pi-calendar" [class.text-[#3aafff]]="selectedTab === 'calendar'"></i>
            Calendrier
          </button>
        </div>
      </div>
      
      <!-- Thematic Filter Bar -->
      @if (availableThematiques().length > 0) {
        <div class="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100 overflow-x-auto custom-scrollbar no-wrap">
          <button (click)="selectedThematiqueId.set(null)"
            [class]="!selectedThematiqueId() ? 'bg-[#3aafff] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-100'"
            class="px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 border whitespace-nowrap">
            Toutes les thématiques
          </button>
          @for (them of availableThematiques(); track them.id) {
            <button (click)="selectedThematiqueId.set(them.id)"
              [class]="selectedThematiqueId() === them.id ? 'bg-[#3aafff] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-100'"
              class="px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 border whitespace-nowrap">
              {{ them.name }}
            </button>
          }
        </div>
      }

      @if (selectedTab === 'mes-coachs') {
        @if (filteredMatchings().length > 0) {

        @for (coach of filteredMatchings(); track coach.id) {
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
                    <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" style="background: #7c3aed"></span><span class="text-[9px] font-bold text-gray-400">Exceptionnelle</span></div>
                    <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" style="background: #2563eb"></span><span class="text-[9px] font-bold text-gray-400">Disponible</span></div>
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
                                <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col h-full hover:bg-white transition-colors duration-300"
                                     [class.border-purple-200]="session.isExceptionnelle">
                                  <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/50">
                                    <p class="text-[11px] font-bold text-[#1A1A2E] truncate pr-2" [matTooltip]="session.sessionTitle">
                                      {{ session.sessionTitle }}
                                    </p>
                                    <div class="flex items-center gap-1">
                                      @if (session.isExceptionnelle) {
                                        <span class="flex-shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded-full" style="background:#f3e8ff;color:#7c3aed">EXC</span>
                                      }
                                      @if (canModifySession(session)) {
                                        <span class="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center cursor-pointer"
                                              (click)="cancelAndRebook(session)" matTooltip="Modifier / Annuler">
                                          <i class="pi pi-pencil text-[10px]"></i>
                                        </span>
                                      }
                                    </div>
                                  </div>
                                  
                                  <div class="space-y-2 mt-auto">
                                    @for (slot of session.slots; track slot.id) {
                                      @if (session.isExceptionnelle || slot.isBookedByMe || (!isSlotPast(slot) && !slot.isBooked && !session.reservedByMe)) {
                                        <div class="slot-pill"
                                          [class.past-me]="slot.isBookedByMe && (slot.bookingStatus === 'TERMINE' || slot.bookingStatus === 'REALISEE' || slot.bookingStatus === 'TERMINEE')"
                                          [class.future-me]="slot.isBookedByMe && slot.bookingStatus !== 'TERMINE' && slot.bookingStatus !== 'REALISEE' && slot.bookingStatus !== 'TERMINEE' && !session.isExceptionnelle"
                                          [class.exceptionnelle-me]="session.isExceptionnelle"
                                          [class.available-blue]="!isSlotPast(slot) && !slot.isBooked && !session.reservedByMe && !session.isExceptionnelle"
                                          [class.disabled-gray]="!session.isExceptionnelle && ((isSlotPast(slot) && !slot.isBookedByMe) || (!isSlotPast(slot) && slot.isBooked && !slot.isBookedByMe) || (!isSlotPast(slot) && session.reservedByMe && !slot.isBookedByMe))"
                                          [matTooltip]="session.isExceptionnelle ? 'Séance exceptionnelle planifiée par votre coach' : getSlotTooltip(slot, session.reservedByMe)"
                                          (click)="(!session.isExceptionnelle && !isSlotPast(slot) && !slot.isBooked && !session.reservedByMe) ? selectSlot(slot, session.sessionTitle, coach) : (slot.isBookedByMe && canModifySession(session) && !session.isExceptionnelle) ? cancelAndRebook(session) : null"
                                          [class.cursor-pointer]="!session.isExceptionnelle && ((!isSlotPast(slot) && !slot.isBooked && !session.reservedByMe) || (slot.isBookedByMe && canModifySession(session)))">
                                          <div class="flex items-center justify-between px-3 py-2">
                                            <div class="flex flex-col">
                                              <span class="text-[9px] font-bold uppercase opacity-60">{{ formatSlotDayName(slot.dateSession) }}</span>
                                              <span class="text-[11px] font-bold">{{ formatSlotDate(slot.dateSession) }}</span>
                                            </div>
                                            <div class="text-xs font-black">{{ slot.heureDebut }}</div>
                                          </div>
                                        </div>
                                      }
                                    }
                                  </div>
                                </div>
                              } @empty {
                                <div class="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                  <i class="pi pi-calendar-times text-5xl text-gray-200 mb-4"></i>
                                  <p class="text-sm text-gray-400 font-bold uppercase tracking-widest">Aucune session enregistrée</p>
                                </div>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    }

                    <!-- Séances Exceptionnelles Section (Strictly below everything) -->
                    @if (coach.exceptionalGroup) {
                      <div class="program-section mb-10 mt-8 pt-8 border-t border-dashed border-gray-200">
                        <div class="flex items-center gap-3 mb-6">
                          <span class="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] px-3 py-1 bg-purple-50 rounded-full">{{ coach.exceptionalGroup.name }}</span>
                          <div class="h-px flex-1 bg-gradient-to-r from-purple-100 to-transparent"></div>
                        </div>

                        @for (them of coach.exceptionalGroup.thematiques; track them.name) {
                          <div class="thematique-section mb-8 pl-4 border-l-2 border-purple-50">
                            <div class="flex items-center justify-between mb-4">
                              <h4 class="text-sm font-bold text-[#1A1A2E] flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                {{ them.name }}
                              </h4>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                              @for (session of them.sessions; track session.sessionGroupId) {
                                <div class="p-4 bg-purple-50/30 rounded-xl border border-purple-100 flex flex-col h-full hover:bg-white transition-colors duration-300">
                                  <div class="flex items-center justify-between mb-3 pb-2 border-b border-purple-100/50">
                                    <p class="text-[11px] font-bold text-[#1A1A2E] truncate pr-2" [matTooltip]="session.sessionTitle">
                                      {{ session.sessionTitle }}
                                    </p>
                                    <div class="flex items-center gap-1">
                                      <span class="flex-shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded-full" style="background:#f3e8ff;color:#7c3aed">EXC</span>
                                    </div>
                                  </div>
                                  
                                  <div class="space-y-2 mt-auto">
                                    @for (slot of session.slots; track slot.id) {
                                      <div class="slot-pill exceptionnelle-me"
                                        [matTooltip]="'Séance exceptionnelle planifiée par votre coach'">
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
           <i class="pi pi-search text-5xl text-gray-200 mb-4"></i>
           <h3 class="text-lg font-bold text-[#1A1A2E]">Aucun accompagnement trouvé</h3>
           <p class="text-sm text-gray-400 mt-2">Aucun de vos coachs ne propose de sessions pour cette thématique.</p>
           <button (click)="selectedThematiqueId.set(null)" class="mt-6 text-[#3aafff] font-bold hover:underline bg-transparent border-none cursor-pointer">
             Voir tout mon planning
           </button>
        </div>
      }
    } @else {
      <div class="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[600px]">
        <app-calendar></app-calendar>
      </div>
    }
    </div>

    <!-- Booking Confirmation Modal -->
    <div class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" *ngIf="selectedSlot" (click)="selectedSlot = null">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-[600px] flex flex-col overflow-hidden transform transition-all" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <h3 class="m-0 text-xl font-semibold text-gray-900" style="color: #000000ff;">
            Confirmer la réservation
          </h3>
          <button (click)="selectedSlot = null" class="text-gray-400 hover:text-gray-600 transition-colors outline-none bg-transparent border-none cursor-pointer">
            <i class="pi pi-times text-lg"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 flex flex-col gap-5">
          <p class="text-sm text-gray-600 m-0">
            Vérifiez les détails et confirmez la réservation avec le coach.
            <br>
            <strong class="text-gray-900">{{ selectedGroupTitle }}</strong> <span *ngIf="selectedCoachForBooking"> &bull; {{ selectedCoachForBooking.nom }}</span>
          </p>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-gray-700 m-0">Détails du créneau</label>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span class="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</span>
                <span class="block text-sm font-semibold text-gray-900 mt-1">{{ selectedSlot.dateSession | date:'dd MMMM yyyy' }}</span>
              </div>
              <div>
                <span class="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Horaire</span>
                <span class="block text-sm font-semibold text-gray-900 mt-1">{{ formatSlotTime(selectedSlot.heureDebut) }} &rarr; {{ formatSlotTime(selectedSlot.heureFin) }}</span>
              </div>
              <div *ngIf="selectedSlot.typeSession">
                <span class="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Mode</span>
                <span class="block text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1.5">
                  <i class="pi" [class]="selectedSlot.typeSession === 'EN_LIGNE' ? 'pi-video text-blue-500' : 'pi-map-marker text-emerald-500'"></i>
                  {{ selectedSlot.typeSession === 'EN_LIGNE' ? 'En ligne' : 'Présentiel' }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-gray-700 m-0 flex items-center gap-2">
              Notes pour le coach <span class="text-xs font-normal text-gray-400">(Optionnel)</span>
            </label>
            <textarea class="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#10B981] focus:border-[#10B981] transition-all resize-y min-h-[100px]" 
                      [(ngModel)]="bookingNotes" 
                      placeholder="Précisez vos attentes ou questions éventuelles..."></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button class="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors outline-none cursor-pointer" 
                  (click)="selectedSlot = null" [disabled]="isBooking">
            Annuler
          </button>
          <button class="px-4 py-2 border-none rounded-md text-white font-medium bg-[#EF4444] hover:bg-[#059669] transition-colors flex items-center gap-2 outline-none cursor-pointer" 
                  (click)="confirmBooking()" [disabled]="isBooking">
            <i class="pi" [class]="isBooking ? 'pi-spin pi-spinner' : 'pi-check'"></i>
            {{ isBooking ? 'Réservation en cours...' : 'Confirmer la réservation' }}
          </button>
        </div>
      </div>
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
    .slot-pill.exceptionnelle-me {
      background: #faf5ff;
      border-color: #d8b4fe;
      color: #7c3aed;
      box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.15);
    }
    .slot-pill.exceptionnelle-me:hover {
      background: #f3e8ff;
      transform: translateY(-1px);
    }
    .program-section:not(:last-child) {
      margin-bottom: 3rem;
    }
  `]
})
export class MesCoachsComponent implements OnInit {
  selectedTab: 'mes-coachs' | 'calendar' = 'mes-coachs';
  private readonly matchSvc = inject(MatchingService);
  private readonly authSvc = inject(AuthService);
  private readonly coachSvc = inject(CoachService);
  private readonly sessionSvc = inject(SessionService);
  private readonly snackBar = inject(MatSnackBar);

  extendedMatchings = signal<ExtendedMatching[]>([]);
  availableThematiques = signal<{id: string, name: string}[]>([]);
  selectedThematiqueId = signal<string | null>(null);

  // Computed signal for filtered display
  filteredMatchings = computed(() => {
    const all = this.extendedMatchings();
    const filterId = this.selectedThematiqueId();
    if (!filterId) return all;

    return all.map(coach => {
      // Filter programs and thematics within each coach
      const filteredPrograms = coach.groupedByProgram?.map(prog => {
        const matchingThematiques = prog.thematiques.filter(t => {
          // Find matching by name or just check if it's the one (since we mapped it)
          // To be robust, we'll check if the thematic name matches the one associated with the ID
          const targetThem = this.availableThematiques().find(at => at.id === filterId);
          return t.name === targetThem?.name;
        });

        if (matchingThematiques.length > 0) {
          return { ...prog, thematiques: matchingThematiques };
        }
        return null;
      }).filter(p => p !== null) as ProgramGroup[];

      if (filteredPrograms.length > 0 || (coach.exceptionalGroup && !filterId)) {
        return { ...coach, groupedByProgram: filteredPrograms };
      }
      return null;
    }).filter(c => c !== null) as ExtendedMatching[];
  });

  // Booking states
  selectedSlot: any | null = null;
  selectedCoachForBooking: any | null = null;
  selectedGroupTitle: string = '';
  selectedSession: any | null = null;
  bookingNotes: string = '';
  isBooking: boolean = false;
  isCancellingBooking: boolean = false;

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
        
        // Extract available thematics for filtering
        const themMap = new Map<string, string>();
        matchings.forEach(m => {
          if (m.thematiqueId && m.thematiqueName) {
            themMap.set(String(m.thematiqueId), m.thematiqueName);
          }
        });
        this.availableThematiques.set(
          Array.from(themMap.entries()).map(([id, name]) => ({ id, name }))
        );

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
                g.slots.forEach((s: SessionCoachDTO) => {
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
            
            // Filter out groups that have no valid slots for the entrepreneur
            const validGroups = allGroups.filter(group => {
              if (group.reservedByMe) return true;
              return group.slots && group.slots.some(slot => {
                const isPast = this.isSlotPast(slot);
                return !isPast && !slot.isBooked;
              });
            });

            const programGroups: ProgramGroup[] = [];
            
            validGroups.forEach(group => {
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

          // First set the base extended matchings
          this.extendedMatchings.set(extended);

          // Then asynchronously enrich with exceptional sessions per coach
          uniqueMatchings.forEach((m, i) => {
            const coachId = m.id;
            const entId = Number(userId);
            this.coachSvc.getSeancesExceptionnelles(Number(coachId))
              .pipe(catchError(() => of([])))
              .subscribe((seances: any[]) => {
                const mySeances = seances.filter((se: any) => String(se.entrepreneurId) === String(entId));
                if (mySeances.length === 0) return;

                const excProgGroup: any = {
                  name: 'Séances Exceptionnelles',
                  thematiques: [{
                    name: 'Planifiées par votre coach',
                    sessions: mySeances.map((se: any) => ({
                      sessionGroupId: `exc-${se.id}`,
                      sessionTitle: se.titre,
                      reservedByMe: true,
                      isExceptionnelle: true,
                      slots: [{
                        id: `exc-slot-${se.id}`,
                        dateSession: se.dateSeance,
                        heureDebut: se.heureDebut?.substring(0, 5) || '',
                        heureFin: se.heureFin?.substring(0, 5) || '',
                        isBookedByMe: true,
                        isBooked: true,
                        bookingStatus: 'PLANIFIE'
                      }]
                    }))
                  }]
                };

                const current = this.extendedMatchings();
                const updated = current.map(em => {
                  if (String(em.id) === String(coachId)) {
                    return { ...em, exceptionalGroup: excProgGroup };
                  }
                  return em;
                });
                this.extendedMatchings.set(updated);
              });
          });
        });
      });
    });
  }

  getExpertises(coach: ExtendedMatching): string[] {
    const expertiseStr = coach.coachDetails?.expertise || coach.coachDetails?.skills || '';
    if (!expertiseStr) return [];
    return expertiseStr.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
  }

  isSlotPast(slot: any): boolean {
    if (!slot.dateSession) return false;
    const now = new Date();
    const slotDate = new Date(slot.dateSession);
    if (slot.heureDebut) {
      const [h, m] = slot.heureDebut.split(':');
      slotDate.setHours(Number(h), Number(m));
    }
    return slotDate < now;
  }

  canModifySession(session: any): boolean {
    if (!session.reservedByMe) return false;
    const bookedSlot = session.slots?.find((s: any) => s.isBookedByMe);
    if (!bookedSlot) return true; // Allows fallback cancellation if slot is hidden or missing
    
    // Check if it's completed by status
    if (bookedSlot.bookingStatus === 'TERMINE' || bookedSlot.bookingStatus === 'REALISEE' || bookedSlot.bookingStatus === 'TERMINEE') {
      return false;
    }
    
    // Check if it's past
    if (this.isSlotPast(bookedSlot)) {
      return false;
    }
    
    return true;
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
    if (slot.isBookedByMe) return this.isSlotPast(slot) ? 'Votre séance passée' : 'Votre réservation à venir (Cliquez pour modifier)';
    if (slot.isBooked) return 'Créneau déjà réservé par un autre entrepreneur';
    if (this.isSlotPast(slot)) return 'Ce créneau est passé';
    if (groupReserved) return 'Vous avez déjà réservé un créneau pour cette session';
    return 'Disponible pour réservation (Cliquez pour réserver)';
  }

  formatSlotTime(timeStr: string | undefined): string {
    if (!timeStr) return '';
    return timeStr.substring(0, 5).replace(':', 'h');
  }

  selectSlot(slot: any, groupTitle: string, coach: any): void {
    this.selectedSlot = slot;
    this.selectedGroupTitle = groupTitle;
    this.selectedCoachForBooking = coach;
    this.bookingNotes = '';
  }

  confirmBooking(): void {
    const user = this.authSvc.currentUser$.value;
    if (!this.selectedSlot || !user) return;

    this.isBooking = true;
    this.coachSvc.bookSession(Number(this.selectedSlot.id), Number(user.id), this.bookingNotes).subscribe({
      next: (res: any) => {
        this.isBooking = false;
        const meetLink = res?.meetLink;
        if (meetLink) {
          this.snackBar.open(
            'Session réservée ! Lien Meet disponible.',
            'Ouvrir Meet',
            { duration: 8000, panelClass: ['success-snackbar'] }
          ).onAction().subscribe(() => window.open(meetLink, '_blank'));
        } else {
          this.snackBar.open('Session réservée avec succès !', 'Fermer', {
            duration: 5000, panelClass: ['success-snackbar']
          });
        }
        this.selectedSlot = null;
        this.selectedSession = null;
        this.loadAllData(user.id);
      },
      error: (err: any) => {
        this.isBooking = false;
        console.error('Erreur réservation:', err);
        const msg = err.error?.error || err.error?.message || err.message || 'Erreur lors de la réservation';
        this.snackBar.open(msg, 'Fermer', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }

  cancelAndRebook(session: any): void {
    if (!confirm('Voulez-vous vraiment annuler votre réservation pour cette session ? Vous pourrez ensuite choisir un autre créneau.')) {
      return;
    }
    const user = this.authSvc.currentUser$.value;
    
    // session in thematique groups doesn't have myBookedSlot directly mapped as easily as in the calendar, but we have reservedByMe
    // We need to find the booked slot id inside session.slots
    let bookedSlot = session.slots.find((s: any) => s.isBookedByMe);
    
    // Fallback if the slot was generated as a supplementary group and hasn't full details
    let bookingId = bookedSlot?.id;
    if (!bookingId && session.slots[0]?.bookingStatus) {
      // It's a supplementary group mapped from allMySessions
      bookingId = session.sessionGroupId; // The session ID in the DB
    }

    if (!user || !bookingId) return;

    this.isCancellingBooking = true;
    
    const obs = (typeof bookingId === 'string' && bookingId.includes('-')) 
      ? this.coachSvc.cancelSessionById(bookingId, Number(user.id))
      : this.coachSvc.cancelBooking(Number(bookingId), Number(user.id));

    obs.subscribe({
      next: () => {
        this.isCancellingBooking = false;
        this.snackBar.open('Réservation annulée. Choisissez un nouveau créneau.', 'OK', {
          duration: 4000, panelClass: ['success-snackbar']
        });
        this.loadAllData(user.id);
      },
      error: (err: any) => {
        this.isCancellingBooking = false;
        const msg = err.error?.message || 'Erreur lors de l\'annulation';
        this.snackBar.open(msg, 'Fermer', { duration: 4000, panelClass: ['error-snackbar'] });
      }
    });
  }
}
