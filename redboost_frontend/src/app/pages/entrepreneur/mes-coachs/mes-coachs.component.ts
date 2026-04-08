import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { MatchingService, MatchingView } from '../../../core/services/matching.service';
import { AuthService } from '../../../core/services/auth.service';
import { DisponibiliteService, DisponibiliteSlot } from '../../../core/services/disponibilite.service';
import { SessionBookingService } from '../../../core/services/session-booking.service';

@Component({
  selector: 'rb-mes-coachs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule, DropdownModule, ButtonModule],
  template: `
    <div class="p-6 bg-[#F8FAFC] min-h-screen">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-black text-[#1A1A2E] tracking-tight">Mes Coachs</h1>
        <p class="text-gray-500 mt-1 font-medium">Profils et accompagnements personnalisés</p>
      </div>

      @if (matchings().length > 0) {
        @for (coach of matchings(); track coach.id) {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <!-- Coach Profile Card -->
            <div class="lg:col-span-1">
            <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
              <!-- Avatar -->
              <div class="text-center mb-6">
                <div class="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-2xl shadow-sky-400/30"
                  style="background: linear-gradient(135deg, #00d2ff, #3aafff)">
                  {{ coach.nom?.[0] }}
                </div>
                <div class="flex items-center justify-center gap-2 mb-1">
                  <h2 class="text-xl font-black text-[#1A1A2E]">{{ coach.nom }}</h2>
                  <i class="pi pi-check-circle text-blue-500 text-lg"></i>
                </div>
                <p class="text-sm text-gray-500 font-medium">{{ coach.specialite || 'Coach Expert' }}</p>
              </div>

              <!-- AI Match Justification (Crucial) -->
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

              <!-- CTAs -->
              <div class="space-y-3">
                <button [routerLink]="['/gestion_comm']" [queryParams]="{with: coach.id}"
                  class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] shadow-lg"
                  style="background: linear-gradient(135deg, #1A3A3A, #C0392B)">
                  <i class="pi pi-comments pb-1 px-1"></i>
                  Discuter avec ce coach
                </button>
              </div>
            </div>
          </div>

            <!-- Right: Availability & Booking -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Calendly Widget -->
              @if (coach.calendlyUrl) {
                <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-black text-[#1A1A2E] flex items-center gap-2">
                      <i class="pi pi-calendar-clock text-[#ff3d91]"></i>
                      Prendre rendez-vous via Calendly
                    </h3>
                  </div>
                  <div class="calendly-inline-widget min-w-[320px] h-[630px]" [attr.data-url]="coach.calendlyUrl" style="width:100%;"></div>
                </div>
              } @else {
                <!-- Available Slots Dropdown -->
                <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-black text-[#1A1A2E] flex items-center gap-2">
                      <i class="pi pi-calendar-clock text-[#ff3d91]"></i>
                      Réserver votre prochaine séance
                    </h3>
                  </div>
  
                  <div class="flex flex-col gap-4">
                    @if (getCoachSlots(coach.id).length > 0) {
                      <div class="flex gap-4">
                        <p-dropdown 
                          [options]="getCoachSlots(coach.id)" 
                          [(ngModel)]="selectedSlots[coach.id]"
                          optionLabel="label" 
                          placeholder="Sélectionnez un créneau disponible"
                          [style]="{'width': '100%'}">
                        </p-dropdown>
                        <p-button 
                          [disabled]="!selectedSlots[coach.id]"
                          label="Réserver"
                          icon="pi pi-plus-circle"
                          (onClick)="openBookingModal(selectedSlots[coach.id], coach)">
                        </p-button>
                      </div>
                    } @else {
                      <div class="text-center py-8 border-2 border-dashed border-gray-100 rounded-3xl">
                        <i class="pi pi-calendar-minus text-3xl mx-auto mb-3 text-gray-200"></i>
                        <p class="text-sm font-bold text-gray-400">Aucun créneau disponible pour ce coach</p>
                        <p class="text-[10px] text-gray-300 mt-1">Dès que votre coach ajoutera des créneaux, ils apparaîtront ici.</p>
                      </div>
                    }
                  </div>
                </div>
              }

            <!-- Recommendation Box -->
            @if (coach.recommandationSession1) {
              <div class="bg-sky-600 rounded-3xl p-6 text-white shadow-xl shadow-sky-200/50">
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
           <i class="pi pi-search text-5xl text-gray-200 mb-4"></i>
           <h3 class="font-bold text-gray-500">Matching en cours...</h3>
           <p class="text-sm text-gray-400 mt-1">L'administrateur est en train de finaliser votre attribution de coach(s).</p>
        </div>
      }

      <!-- Booking Modal -->
      @if (selectedSlotToBook()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div class="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div class="p-6 bg-[#C0392B] text-white">
              <h3 class="font-black text-lg">Confirmer la réservation</h3>
              <p class="text-xs opacity-80 mt-1">Session avec {{ selectedCoachForBooking()?.nom }}</p>
            </div>
            <div class="p-6 space-y-4">
              <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div class="flex items-center gap-3 mb-2">
                  <i class="pi pi-calendar text-[#C0392B]"></i>
                  <span class="font-bold text-sm">{{ selectedSlotToBook()?.dateDebut | date:'fullDate' }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <i class="pi pi-clock text-[#C0392B]"></i>
                  <span class="font-bold text-sm">{{ selectedSlotToBook()?.dateDebut | date:'HH:mm' }} ({{ selectedSlotToBook()?.dureeMinutes }} min)</span>
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Notes pour le coach (optionnel)</label>
                <textarea 
                  [(ngModel)]="bookingNotes"
                  placeholder="Précisez vos attentes pour cette session..."
                  class="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C0392B] min-h-[100px]"
                ></textarea>
              </div>

              <div class="flex gap-3 pt-2">
                <button (click)="cancelBooking()" class="flex-1 py-3 border-2 border-gray-100 rounded-2xl text-sm font-black text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                <button (click)="confirmBooking()" class="flex-[2] py-3 bg-[#1A3A3A] text-white rounded-2xl text-sm font-black shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  @if (isBooking()) {
                    <i class="pi pi-spinner pi-spin"></i>
                    Réservation...
                  } @else {
                    <i class="pi pi-check"></i>
                    Confirmer
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
  private dispoSvc = inject(DisponibiliteService);
  private bookingSvc = inject(SessionBookingService);
  private authSvc = inject(AuthService);

  matchings = signal<MatchingView[]>([]);
  allSlots: { [coachId: string]: any[] } = {};
  selectedSlots: { [coachId: string]: any } = {};
  
  selectedSlotToBook = signal<DisponibiliteSlot | null>(null);
  selectedCoachForBooking = signal<MatchingView | null>(null);
  bookingNotes = '';
  isBooking = signal(false);

  ngOnInit(): void {
    const user = this.authSvc.currentUser$.value;
    const userId = user?.id;
    if (userId) {
      this.matchSvc.getEntrepreneurCoaches(userId).subscribe(data => {
        this.matchings.set(data);
        data.forEach(m => {
          this.loadSlots(m.id, m.programmeId);
        });
      });
    }
  }

  getPointsForts(coach: MatchingView): string[] {
    try {
      return JSON.parse(coach.pointsForts || '[]');
    } catch(e) { 
      return ['Expertise', 'Accompagnement']; 
    }
  }

  loadSlots(coachId: string, programmeId: string): void {
    this.dispoSvc.getLibreSlots(coachId, programmeId).subscribe(slots => {
      // Format them for prime dropdown
      this.allSlots[coachId] = slots.map(s => ({
         ...s,
         label: `${new Date(s.dateDebut!).toLocaleString('fr-FR', {weekday: 'short', day: '2-digit', month: 'short', hour:'2-digit', minute:'2-digit'})} (${s.dureeMinutes} min)`
      }));
    });
  }

  getCoachSlots(coachId: string): any[] {
    return this.allSlots[coachId] || [];
  }

  openBookingModal(dropdownSelection: any, coach: MatchingView): void {
    if (!dropdownSelection) return;
    this.selectedCoachForBooking.set(coach);
    this.selectedSlotToBook.set(dropdownSelection);
    this.bookingNotes = '';
  }
  
  cancelBooking(): void {
    this.selectedSlotToBook.set(null);
    this.selectedCoachForBooking.set(null);
  }

  confirmBooking(): void {
    const slot = this.selectedSlotToBook();
    const coach = this.selectedCoachForBooking();
    const user = this.authSvc.currentUser$.value;
    const userId = user?.id;
    if (!slot || !userId || !coach) return;

    this.isBooking.set(true);
    this.bookingSvc.book(userId, slot.id, this.bookingNotes).subscribe({
      next: () => {
        this.isBooking.set(false);
        this.cancelBooking();
        this.selectedSlots[coach.id] = null;
        this.loadSlots(coach.id, coach.programmeId); // Reload slots
      },
      error: (e) => {
        console.error(e);
        this.isBooking.set(false);
      }
    });
  }
}
