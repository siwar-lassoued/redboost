import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatchingService, MatchingView } from '../../../core/services/matching.service';
import { AuthService } from '../../../core/services/auth.service';
import { CoachService, SessionCoachDTO, SessionGroupDTO } from '../../dashboard/coachDashboard/services/coach.service';

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
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            <div class="lg:col-span-1">
            <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
              
              <div class="text-center mb-6">
                <div class="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-2xl shadow-sky-400/30"
                  style="background: linear-gradient(135deg, #3B82A6, #10B981)">
                  {{ coach.nom ? coach.nom[0] : 'C' }}
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
                <p class="text-xs text-amber-900 leading-relaxed italic">
                  "{{ coach.justificationMatching }}"
                </p>
                <div class="mt-2 flex flex-wrap gap-1">
                   @for (tag of getPointsForts(coach); track tag) {
                     <span class="text-[9px] px-2 py-0.5 bg-white/50 rounded-full text-amber-800 font-bold border border-amber-200/50">{{ tag }}</span>
                   }
                </div>
              </div>

              
              <div class="space-y-3">
                <button [routerLink]="['/gestion_comm']" [queryParams]="{with: coach.id}"
                  class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] shadow-lg"
                  style="background: linear-gradient(135deg, #F97316, #EF4444)">
                  <i class="pi pi-comments pb-1 px-1"></i>
                  Discuter avec ce coach
                </button>
              </div>
            </div>
          </div>

            
            <div class="lg:col-span-2 space-y-6">
              
              @if (coach.calendlyUrl) {
                <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-black text-[#1A1A2E] flex items-center gap-2">
                      <i class="pi pi-calendar-clock text-[#3B82A6]"></i>
                      Prendre rendez-vous via Calendly
                    </h3>
                  </div>
                  <div class="calendly-inline-widget min-w-[320px] h-[630px]" [attr.data-url]="coach.calendlyUrl" style="width:100%;"></div>
                </div>
              } @else {
                
                <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-black text-[#1A1A2E] flex items-center gap-2">
                      <i class="pi pi-calendar-clock text-[#3B82A6]"></i>
                      Réserver votre prochaine séance
                    </h3>
                    @if (isLoadingSlots[coach.id]) {
                      <i class="pi pi-spin pi-spinner text-gray-300"></i>
                    }
                  </div>

                  @if (getCoachGroups(coach.id).length > 0) {
                    <div class="space-y-4">
                      @for (group of getCoachGroups(coach.id); track group.sessionGroupId) {
                        
                        <div class="rounded-2xl border-2 overflow-hidden transition-all"
                          [class]="group.reservedByMe
                            ? 'border-green-200 bg-green-50/50 opacity-80'
                            : 'border-gray-100 bg-white hover:border-[#3B82A6]/30'">

                          
                          <div class="flex items-center justify-between px-5 py-3 border-b"
                            [class]="group.reservedByMe ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50/50'">
                            <div class="flex items-center gap-3">
                              <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                [class]="group.reservedByMe ? 'bg-green-100' : 'bg-[#fff0f4]'">
                                <i class="pi text-sm"
                                  [class]="group.reservedByMe ? 'pi-check text-green-600' : 'pi-calendar text-[#3B82A6]'"></i>
                              </div>
                              <div>
                                <p class="font-black text-sm text-[#1A1A2E]">{{ group.sessionTitle }}</p>
                                <p class="text-[10px] text-gray-400 font-medium">{{ group.slots.length }} créneau{{ group.slots.length > 1 ? 'x' : '' }} disponible{{ group.slots.length > 1 ? 's' : '' }}</p>
                              </div>
                            </div>
                            @if (group.reservedByMe) {
                              <span class="flex items-center gap-1.5 text-[10px] font-black text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                                <i class="pi pi-check-circle text-xs"></i>
                                Session réservée
                              </span>
                            }
                          </div>

                          
                          <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            @for (slot of group.slots; track slot.id) {
                                <button
                                  class="flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all w-full relative"
                                  [class]="
                                    slot.isBookedByMe ? 'border-green-500 bg-green-50 cursor-not-allowed' :
                                    (slot.isBooked && !slot.isBookedByMe) ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50' :
                                    (!slot.isBooked && group.reservedByMe) ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60' :
                                    (selectedSlotId[coach.id] === slot.id ? 'border-[#3B82A6] bg-[#EFF6FF] shadow-md' : 'border-gray-100 hover:border-[#3B82A6]/40 hover:bg-gray-50')
                                  "
                                  [disabled]="slot.isBooked || group.reservedByMe"
                                  (click)="!slot.isBooked && !group.reservedByMe && selectSlot(coach.id, slot, group.sessionTitle)">

                                  <!-- Date badge -->
                                  <div class="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                                    [class]="
                                      slot.isBookedByMe ? 'bg-green-500 text-white' :
                                      (slot.isBooked && !slot.isBookedByMe) ? 'bg-gray-300 text-gray-500' :
                                      (selectedSlotId[coach.id] === slot.id && !group.reservedByMe ? 'bg-[#3B82A6] text-white' : 'bg-gray-100 text-gray-600')
                                    ">
                                    <span class="text-[8px] font-black uppercase leading-none">{{ formatSlotMonth(slot.dateSession) }}</span>
                                    <span class="text-sm font-black leading-tight">{{ formatSlotDay(slot.dateSession) }}</span>
                                  </div>

                                  <!-- Details -->
                                  <div class="flex-1 min-w-0">
                                    <p class="text-xs font-black" [class]="slot.isBookedByMe ? 'text-green-700' : 'text-[#1A1A2E]'">
                                      {{ formatSlotTime(slot.heureDebut) }} – {{ formatSlotTime(slot.heureFin) }}
                                    </p>
                                    <p class="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                                      <i class="pi" [class]="slot.typeSession === 'EN_LIGNE' ? 'pi-video' : 'pi-users'"></i>
                                      {{ slot.typeSession === 'EN_LIGNE' ? 'En ligne' : 'Présentiel' }}
                                    </p>
                                  </div>

                                  <!-- Status icons -->
                                  @if (slot.isBookedByMe) {
                                    <div class="absolute right-2 top-2 bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                                      Votre résa
                                    </div>
                                  } @else if (slot.isBooked) {
                                    <div class="absolute right-2 top-2 bg-gray-400 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                                      Réservé
                                    </div>
                                  } @else if (group.reservedByMe) {
                                    <div class="absolute right-2 top-2 bg-gray-300 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                                      Indisponible
                                    </div>
                                  } @else if (selectedSlotId[coach.id] === slot.id && !group.reservedByMe) {
                                    <div class="w-5 h-5 rounded-full bg-[#3B82A6] text-white flex items-center justify-center flex-shrink-0">
                                      <i class="pi pi-check text-[9px]"></i>
                                    </div>
                                  }
                                </button>
                            }
                          </div>

                          
                          @if (!group.reservedByMe && selectedSlotId[coach.id] && isSlotInGroup(selectedSlotId[coach.id], group)) {
                            <div class="px-4 pb-4">
                              <button (click)="openBookingModal(coach)"
                                class="w-full py-3 rounded-2xl text-sm font-black text-white shadow-lg transition-all hover:scale-[1.02]"
                                style="background: linear-gradient(135deg, #3B82A6, #475569)">
                                <i class="pi pi-calendar-plus mr-2"></i>
                                Réserver ce créneau
                              </button>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  } @else if (!isLoadingSlots[coach.id]) {
                    <div class="text-center py-8 border-2 border-dashed border-gray-100 rounded-3xl">
                      <i class="pi pi-calendar-minus text-3xl mx-auto mb-3 text-gray-200 block"></i>
                      <p class="text-sm font-bold text-gray-400">Aucun créneau disponible pour ce coach</p>
                      <p class="text-[10px] text-gray-300 mt-1">Dès que votre coach ajoutera des créneaux, ils apparaîtront ici.</p>
                    </div>
                  }
                </div>
              }

            
            @if (coach.recommandationSession1) {
              <div class="bg-[#475569] rounded-3xl p-6 text-white shadow-xl shadow-slate-200/50">
                <div class="flex items-start gap-4">
                   <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                     <i class="pi pi-lightbulb text-xl"></i>
                   </div>
                   <div>
                     <h4 class="font-black text-sm uppercase tracking-widest mb-1 opacity-80">Recommandation Session 1</h4>
                     <p class="text-sm font-medium leading-relaxed">{{ coach.recommandationSession1 }}</p>
                   </div>
                </div>
              </div>
            }
          </div>
        </div>
        }
      } @else {
        <div class="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
           <i class="pi pi-search text-5xl text-gray-200 mb-4 block"></i>
           <h3 class="font-bold text-gray-500">Matching en cours...</h3>
           <p class="text-sm text-gray-400 mt-1">L'administrateur est en train de finaliser votre attribution de coach(s).</p>
        </div>
      }

      
      @if (selectedSlotToBook()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div class="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div class="p-6 text-white" style="background: linear-gradient(135deg, #3B82A6, #475569)">
              <h3 class="font-black text-lg">Confirmer la réservation</h3>
              <p class="text-xs opacity-80 mt-1">{{ selectedGroupTitle() }} — {{ selectedCoachForBooking()?.nom }}</p>
            </div>
            <div class="p-6 space-y-4">
              <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div class="flex items-center gap-3 mb-2">
                  <i class="pi pi-calendar text-[#3B82A6]"></i>
                  <span class="font-bold text-sm">{{ selectedSlotToBook()?.dateSession | date:'fullDate':'':'fr' }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <i class="pi pi-clock text-[#3B82A6]"></i>
                  <span class="font-bold text-sm">{{ formatSlotTime(selectedSlotToBook()?.heureDebut) }} à {{ formatSlotTime(selectedSlotToBook()?.heureFin) }}</span>
                </div>
                <div class="flex items-center gap-3 mt-2">
                  <i class="pi pi-tag text-[#3B82A6]"></i>
                  <span class="text-xs text-gray-500 font-medium">Session : <strong>{{ selectedGroupTitle() }}</strong></span>
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Notes pour le coach (optionnel)</label>
                <textarea
                  [(ngModel)]="bookingNotes"
                  placeholder="Précisez vos attentes pour cette session..."
                  class="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82A6] min-h-[100px]"
                ></textarea>
              </div>

              <div class="flex gap-3 pt-2">
                <button (click)="cancelBooking()" class="flex-1 py-3 border-2 border-gray-100 rounded-2xl text-sm font-black text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                <button (click)="confirmBooking()" class="flex-[2] py-3 bg-[#3B82A6] text-white rounded-2xl text-sm font-black shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  @if (isBooking()) {
                    <i class="pi pi-spinner pi-spin"></i>
                    Réservation...
                  } @else {
                    <i class="pi pi-check"></i>
                    Confirmer la réservation
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class MesCoachsComponent implements OnInit {
  private matchSvc = inject(MatchingService);
  private coachSvc = inject(CoachService);
  private authSvc = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  matchings = signal<MatchingView[]>([]);

  // Grouped sessions: coachId → SessionGroupDTO[]
  private allGroups: { [coachId: string]: SessionGroupDTO[] } = {};
  isLoadingSlots: { [coachId: string]: boolean } = {};

  // Selected slot per coach
  selectedSlotId: { [coachId: string]: number | undefined } = {};
  private selectedSlotMap: { [coachId: string]: SessionCoachDTO } = {};
  private selectedGroupTitleMap: { [coachId: string]: string } = {};

  selectedSlotToBook = signal<SessionCoachDTO | null>(null);
  selectedCoachForBooking = signal<MatchingView | null>(null);
  selectedGroupTitle = signal<string>('');
  bookingNotes = '';
  isBooking = signal(false);

  ngOnInit(): void {
    const user = this.authSvc.currentUser$.value;
    const userId = user?.id;
    if (userId) {
      this.matchSvc.getEntrepreneurCoaches(userId).subscribe(data => {
        this.matchings.set(data);
        data.forEach(m => this.loadGroups(m.id, Number(userId)));
      });
    }
  }

  getPointsForts(coach: MatchingView): string[] {
    try { return JSON.parse(coach.pointsForts || '[]'); }
    catch(e) { return ['Expertise', 'Accompagnement']; }
  }

  loadGroups(coachId: string, entrepreneurId: number): void {
    this.isLoadingSlots[coachId] = true;
    this.cdr.markForCheck();
    this.coachSvc.getAvailableSessionsGrouped(Number(coachId), entrepreneurId).subscribe({
      next: (groups) => {
        this.allGroups[coachId] = groups;
        this.isLoadingSlots[coachId] = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.allGroups[coachId] = [];
        this.isLoadingSlots[coachId] = false;
        this.cdr.markForCheck();
      }
    });
  }

  getCoachGroups(coachId: string): SessionGroupDTO[] {
    return this.allGroups[coachId] || [];
  }

  selectSlot(coachId: string, slot: SessionCoachDTO, groupTitle: string): void {
    this.selectedSlotId[coachId] = slot.id;
    this.selectedSlotMap[coachId] = slot;
    this.selectedGroupTitleMap[coachId] = groupTitle;
  }

  isSlotInGroup(slotId: number | undefined, group: SessionGroupDTO): boolean {
    if (!slotId) return false;
    return group.slots.some(s => s.id === slotId);
  }

  openBookingModal(coach: MatchingView): void {
    const slot = this.selectedSlotMap[coach.id];
    const groupTitle = this.selectedGroupTitleMap[coach.id] || '';
    if (!slot) return;
    this.selectedCoachForBooking.set(coach);
    this.selectedSlotToBook.set(slot);
    this.selectedGroupTitle.set(groupTitle);
    this.bookingNotes = '';
  }

  cancelBooking(): void {
    this.selectedSlotToBook.set(null);
    this.selectedCoachForBooking.set(null);
    this.selectedGroupTitle.set('');
  }

  confirmBooking(): void {
    const slot = this.selectedSlotToBook();
    const coach = this.selectedCoachForBooking();
    const user = this.authSvc.currentUser$.value;
    const userId = user?.id;
    if (!slot || !userId || !coach || !slot.id) return;

    this.isBooking.set(true);
    this.coachSvc.bookSession(Number(slot.id), Number(userId)).subscribe({
      next: () => {
        this.isBooking.set(false);
        this.cancelBooking();
        this.selectedSlotId[coach.id] = undefined;
        delete this.selectedSlotMap[coach.id];
        // Reload groups to update reservedByMe flags
        this.loadGroups(coach.id, Number(userId));
      },
      error: (e) => {
        console.error(e);
        this.isBooking.set(false);
        alert(e.error?.error || "Erreur lors de la réservation");
      }
    });
  }

  // ---- Date/time formatters ----
  formatSlotDay(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).getDate().toString();
  }

  formatSlotMonth(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
  }

  formatSlotTime(timeStr: string | undefined): string {
    if (!timeStr) return '';
    return timeStr.substring(0, 5).replace(':', 'h');
  }
}