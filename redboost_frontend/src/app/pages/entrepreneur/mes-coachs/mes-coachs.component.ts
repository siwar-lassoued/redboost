import {
  Component,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environment';

interface SessionSlot {
  id: number;
  dateSession: string;
  heureDebut: string;
  heureFin: string;
  typeSession: 'EN_LIGNE' | 'PRESENTIEL';
  titre: string;
}

interface Disponibilite {
  id: number;
  dateDebut: string;
  dateFin: string;
  thematiqueNom?: string;
  sessions: SessionSlot[];
}

interface CoachView {
  coachId: number;
  firstName: string;
  lastName: string;
  email: string;
  expertise?: string;
  skills?: string;
  profilePictureUrl?: string;
  matchingScore: number;
  justification?: string;
  pointsForts?: string;
  disponibilites: Disponibilite[];
  // UI state
  expanded?: boolean;
  parsedPoints?: string[];
}

@Component({
  selector: 'rb-mes-coachs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 bg-[#F8FAFC] min-h-screen">

      <!-- ── Header ─────────────────────────────────────────────── -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-[#1A1A2E] tracking-tight">
            Mes Coachs
          </h1>
          <p class="text-gray-500 mt-1 font-medium">
            {{ coaches().length }} coach{{ coaches().length > 1 ? 's' : '' }} assigné{{ coaches().length > 1 ? 's' : '' }}
          </p>
        </div>

        <!-- Badge -->
        <div
          class="flex items-center gap-2 px-5 py-2.5 bg-[#1A3A3A] text-white
                 rounded-full text-xs font-black shadow-lg shadow-[#1A3A3A]/20">
          <i class="pi pi-users"></i>
          Accompagnement actif
        </div>
      </div>

      <!-- ── Loading ─────────────────────────────────────────────── -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-24">
          <div class="w-16 h-16 rounded-3xl bg-white shadow-xl flex items-center
                      justify-center mb-4 animate-pulse">
            <i class="pi pi-spin pi-spinner text-2xl text-[#3aafff]"></i>
          </div>
          <p class="text-sm font-black text-gray-400 uppercase tracking-widest">
            Chargement…
          </p>
        </div>
      }

      <!-- ── Empty state ─────────────────────────────────────────── -->
      @if (!loading() && coaches().length === 0) {
        <div
          class="flex flex-col items-center justify-center py-24 bg-white
                 rounded-3xl border-2 border-dashed border-gray-200">
          <div class="w-20 h-20 bg-[#F8FAFC] rounded-3xl flex items-center
                      justify-center mb-5">
            <i class="pi pi-user-plus text-4xl text-gray-300"></i>
          </div>
          <p class="text-base font-black text-gray-400 uppercase tracking-widest mb-2">
            Aucun coach assigné
          </p>
          <p class="text-sm text-gray-400 text-center max-w-xs mb-6">
            Votre coach sera visible ici dès que l'équipe RedBoost
            aura finalisé votre matching.
          </p>
          <button
            routerLink="/entrepreneur/dashboard"
            class="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm
                   font-black text-white shadow-lg transition-all hover:scale-[1.02]"
            style="background: linear-gradient(135deg, #1A3A3A, #3aafff)">
            <i class="pi pi-home"></i>
            Retour au tableau de bord
          </button>
        </div>
      }

      <!-- ── Coach Cards ─────────────────────────────────────────── -->
      @if (!loading()) {
        <div class="space-y-6">
          @for (coach of coaches(); track coach.coachId) {
            <div
              class="bg-white rounded-[32px] shadow-xl shadow-gray-200/50
                     border border-gray-100 overflow-hidden transition-all
                     hover:shadow-2xl hover:-translate-y-0.5">

              <!-- ── Coach Header ─────────────────────────────────── -->
              <div class="p-6">
                <div class="flex items-start gap-5">

                  <!-- Avatar -->
                  <div class="relative flex-shrink-0">
                    @if (coach.profilePictureUrl) {
                      <img
                        [src]="coach.profilePictureUrl"
                        [alt]="coach.firstName"
                        class="w-20 h-20 rounded-2xl object-cover shadow-lg" />
                    } @else {
                      <div
                        class="w-20 h-20 rounded-2xl flex items-center justify-center
                               text-white text-2xl font-black shadow-lg"
                        style="background: linear-gradient(135deg, #1A3A3A, #3aafff)">
                        {{ coach.firstName[0] }}{{ coach.lastName[0] }}
                      </div>
                    }
                    <!-- Score badge -->
                    <div
                      class="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl
                             flex items-center justify-center text-white text-[10px]
                             font-black shadow-lg border-2 border-white"
                      [style.background]="scoreGradient(coach.matchingScore)">
                      {{ coach.matchingScore | number:'1.0-0' }}
                    </div>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 mb-1 flex-wrap">
                      <h2 class="text-xl font-black text-[#1A1A2E]">
                        {{ coach.firstName }} {{ coach.lastName }}
                      </h2>
                      <span
                        class="text-[10px] px-2.5 py-1 rounded-full font-black
                               uppercase tracking-widest"
                        style="background: #e8f9ff; color: #3aafff">
                        {{ coach.firstName.toLowerCase() }} {{ coach.lastName.toLowerCase() }}
                      </span>
                    </div>

                    @if (coach.expertise) {
                      <p class="text-sm text-gray-500 font-medium mb-3 leading-relaxed">
                        {{ coach.expertise }}
                      </p>
                    }

                    <!-- Skill tags -->
                    @if (coach.skills) {
                      <div class="flex flex-wrap gap-1.5 mb-4">
                        @for (skill of parseSkills(coach.skills); track skill) {
                          <span
                            class="text-[10px] px-2.5 py-1 rounded-full font-black
                                   uppercase tracking-widest"
                            style="background: #F3F4F6; color: #374151">
                            {{ skill }}
                          </span>
                        }
                      </div>
                    }

                    <!-- Points forts from matching IA -->
                    @if (coach.parsedPoints && coach.parsedPoints.length > 0) {
                      <div class="flex flex-col gap-1.5 mb-4">
                        <p class="text-[10px] font-black text-gray-400 uppercase
                                  tracking-widest mb-1">
                          Points forts identifiés par l'IA
                        </p>
                        @for (pt of coach.parsedPoints.slice(0, 3); track pt) {
                          <div class="flex items-start gap-2">
                            <i class="pi pi-check-circle text-emerald-400 text-xs
                                      mt-0.5 flex-shrink-0"></i>
                            <span class="text-xs text-gray-600 font-medium">{{ pt }}</span>
                          </div>
                        }
                      </div>
                    }
                  </div>

                  <!-- Right column: actions + score meter -->
                  <div class="flex-shrink-0 flex flex-col items-end gap-3">

                    <!-- Score meter -->
                    <div class="text-right mb-1">
                      <p class="text-[10px] font-black text-gray-400 uppercase
                                tracking-widest mb-1">
                        Score matching
                      </p>
                      <div class="flex items-center gap-2">
                        <div class="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full transition-all duration-700"
                            [style.width]="coach.matchingScore + '%'"
                            [style.background]="scoreGradient(coach.matchingScore)">
                          </div>
                        </div>
                        <span class="text-sm font-black" [style.color]="scoreColor(coach.matchingScore)">
                          {{ coach.matchingScore | number:'1.0-0' }}%
                        </span>
                      </div>
                    </div>

                    <!-- Action buttons -->
                    <div class="flex gap-2">
                      <a
                        [href]="'mailto:' + coach.email"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-2xl
                               text-xs font-black text-white transition-all
                               hover:scale-[1.03] shadow-lg shadow-[#3aafff]/20"
                        style="background: linear-gradient(135deg, #1A3A3A, #3aafff)">
                        <i class="pi pi-envelope"></i>
                        Contacter
                      </a>
                      <button
                        [routerLink]="['/entrepreneur/chat']"
                        [queryParams]="{ with: coach.coachId }"
                        class="w-10 h-10 rounded-2xl flex items-center justify-center
                               text-white transition-all hover:scale-[1.05]
                               shadow-lg shadow-[#ff3d91]/20"
                        style="background: linear-gradient(135deg, #ff3d91, #a17dfd)">
                        <i class="pi pi-comments text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Justification (collapsible) -->
                @if (coach.justification) {
                  <div class="mt-4 p-4 bg-[#F8FAFC] rounded-2xl border border-gray-100">
                    <p class="text-[10px] font-black text-gray-400 uppercase
                              tracking-widest mb-2">
                      Pourquoi ce matching ?
                    </p>
                    <p class="text-xs text-gray-600 leading-relaxed font-medium italic">
                      "{{ coach.justification }}"
                    </p>
                  </div>
                }

                <!-- Toggle disponibilités -->
                <button
                  (click)="toggleCoach(coach)"
                  class="mt-4 w-full flex items-center justify-between px-5 py-3
                         rounded-2xl bg-[#F8FAFC] border border-gray-200 text-sm
                         font-black text-[#1A1A2E] hover:border-[#3aafff]/40
                         hover:bg-[#e8f9ff]/30 transition-all cursor-pointer">
                  <span class="flex items-center gap-2">
                    <i class="pi pi-calendar text-[#3aafff]"></i>
                    Disponibilités & créneaux
                    <span
                      class="text-[10px] px-2 py-0.5 rounded-full font-black"
                      style="background: #e8f9ff; color: #3aafff">
                      {{ totalSlots(coach) }}
                    </span>
                  </span>
                  <i class="pi text-gray-400 text-sm transition-transform duration-300"
                    [class.pi-chevron-down]="!coach.expanded"
                    [class.pi-chevron-up]="coach.expanded"></i>
                </button>
              </div>

              <!-- ── Disponibilités Panel ──────────────────────────── -->
              @if (coach.expanded) {
                <div
                  class="border-t border-gray-100 bg-[#FAFBFF] px-6 pb-6 pt-4">

                  @if (coach.disponibilites.length === 0) {
                    <div class="py-8 text-center">
                      <i class="pi pi-calendar text-3xl text-gray-200 mb-2 block"></i>
                      <p class="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Aucune disponibilité publiée
                      </p>
                    </div>
                  }

                  <div class="space-y-5">
                    @for (dispo of coach.disponibilites; track dispo.id) {
                      <div class="bg-white rounded-2xl border border-gray-100
                                  shadow-sm overflow-hidden">

                        <!-- Dispo header -->
                        <div
                          class="flex items-center justify-between px-5 py-3
                                 border-b border-gray-100"
                          style="background: linear-gradient(135deg, #F8FAFC, #e8f9ff)">
                          <div class="flex items-center gap-3">
                            @if (dispo.thematiqueNom) {
                              <span
                                class="text-[10px] px-3 py-1 rounded-full font-black
                                       uppercase tracking-widest"
                                style="background: #1A3A3A; color: white">
                                {{ dispo.thematiqueNom }}
                              </span>
                            }
                            <span class="text-xs text-gray-500 font-medium">
                              <i class="pi pi-calendar mr-1"></i>
                              {{ formatDate(dispo.dateDebut) }}
                              →
                              {{ formatDate(dispo.dateFin) }}
                            </span>
                          </div>
                          <span
                            class="text-[10px] px-2 py-0.5 rounded-full font-black"
                            style="background: #e8f9ff; color: #3aafff">
                            {{ dispo.sessions.length }} créneau{{ dispo.sessions.length > 1 ? 'x' : '' }}
                          </span>
                        </div>

                        <!-- Session slots grid -->
                        @if (dispo.sessions.length === 0) {
                          <div class="py-5 text-center">
                            <p class="text-xs text-gray-400 font-medium">
                              Aucun créneau publié pour cette disponibilité
                            </p>
                          </div>
                        }

                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4">
                          @for (slot of dispo.sessions; track slot.id) {
                            <div
                              class="relative rounded-xl p-4 border-2 transition-all
                                     hover:scale-[1.01] hover:shadow-md"
                              [style.borderColor]="slot.typeSession === 'EN_LIGNE' ? '#3aafff33' : '#ff3d9133'"
                              [style.background]="slot.typeSession === 'EN_LIGNE' ? '#f0fbff' : '#fff0f7'">

                              <!-- Type badge (top right) -->
                              <span
                                class="absolute top-2 right-2 text-[8px] px-2 py-0.5
                                       rounded-full font-black uppercase tracking-widest"
                                [style.background]="slot.typeSession === 'EN_LIGNE' ? '#3aafff' : '#ff3d91'"
                                style="color: white">
                                {{ slot.typeSession === 'EN_LIGNE' ? '📹 Ligne' : '🏢 Présentiel' }}
                              </span>

                              <!-- Date big -->
                              <div class="flex items-center gap-3 mb-2">
                                <div
                                  class="w-11 h-11 rounded-xl flex flex-col items-center
                                         justify-center text-white flex-shrink-0 shadow"
                                  [style.background]="slot.typeSession === 'EN_LIGNE'
                                    ? 'linear-gradient(135deg,#1A3A3A,#3aafff)'
                                    : 'linear-gradient(135deg,#ff3d91,#a17dfd)'">
                                  <span class="text-[9px] font-bold opacity-80 uppercase leading-none">
                                    {{ slotMonth(slot.dateSession) }}
                                  </span>
                                  <span class="text-lg font-black leading-none">
                                    {{ slotDay(slot.dateSession) }}
                                  </span>
                                </div>
                                <div>
                                  <p class="text-xs font-black text-[#1A1A2E]">
                                    {{ slotDayName(slot.dateSession) }}
                                  </p>
                                  <p class="text-[11px] text-gray-500 font-medium">
                                    {{ slot.heureDebut | slice:0:5 }}
                                    –
                                    {{ slot.heureFin | slice:0:5 }}
                                  </p>
                                </div>
                              </div>

                              @if (slot.titre) {
                                <p class="text-[11px] text-gray-500 font-medium truncate pr-8">
                                  {{ slot.titre }}
                                </p>
                              }

                              <!-- Book button -->
                              <button
                                (click)="bookSlot(slot, coach)"
                                class="mt-3 w-full py-2 rounded-xl text-[10px] font-black
                                       text-white uppercase tracking-widest transition-all
                                       hover:opacity-90 cursor-pointer border-0"
                                [style.background]="slot.typeSession === 'EN_LIGNE'
                                  ? 'linear-gradient(135deg,#1A3A3A,#3aafff)'
                                  : 'linear-gradient(135deg,#ff3d91,#a17dfd)'">
                                Réserver ce créneau
                              </button>
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
      }
    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class MesCoachsComponent implements OnInit {
  private http = inject(HttpClient);
  private authSvc = inject(AuthService);

  loading = signal(true);
  coaches = signal<CoachView[]>([]);

  ngOnInit(): void {
    const user = this.authSvc.currentUser$.value;
    if (!user) {
      this.loading.set(false);
      return;
    }

    this.http
      .get<any[]>(
        `${environment.apiUrl}/matching/entrepreneur/${user.id}/coaches`
      )
      .subscribe({
        next: (data) => {
          const mapped: CoachView[] = data.map((c) => ({
            ...c,
            expanded: false,
            parsedPoints: this.tryParseArray(c.pointsForts),
          }));
          this.coaches.set(mapped);
          this.loading.set(false);
        },
        error: () => {
          this.coaches.set([]);
          this.loading.set(false);
        },
      });
  }

  // ── UI helpers ──────────────────────────────────────────────────

  toggleCoach(coach: CoachView): void {
    coach.expanded = !coach.expanded;
    // Trigger signal update by spreading
    this.coaches.update((list) => [...list]);
  }

  totalSlots(coach: CoachView): number {
    return coach.disponibilites.reduce(
      (sum, d) => sum + d.sessions.length,
      0
    );
  }

  parseSkills(raw: string): string[] {
    if (!raw) return [];
    return raw
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);
  }

  tryParseArray(raw?: string): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  scoreGradient(score: number): string {
    if (score >= 75) return 'linear-gradient(135deg, #22c55e, #16a34a)';
    if (score >= 50) return 'linear-gradient(135deg, #f59e0b, #d97706)';
    return 'linear-gradient(135deg, #ef4444, #dc2626)';
  }

  scoreColor(score: number): string {
    if (score >= 75) return '#16a34a';
    if (score >= 50) return '#d97706';
    return '#dc2626';
  }

  formatDate(raw: string): string {
    if (!raw) return '—';
    return new Date(raw).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  slotMonth(raw: string): string {
    return new Date(raw)
      .toLocaleDateString('fr-FR', { month: 'short' })
      .toUpperCase();
  }

  slotDay(raw: string): string {
    return new Date(raw).getDate().toString();
  }

  slotDayName(raw: string): string {
    return new Date(raw).toLocaleDateString('fr-FR', { weekday: 'long' });
  }

  // ── Book slot ───────────────────────────────────────────────────

  bookSlot(slot: SessionSlot, coach: CoachView): void {
    const user = this.authSvc.currentUser$.value;
    if (!user) return;

    if (
      !confirm(
        `Confirmer la réservation du créneau du ${this.slotDayName(slot.dateSession)} ${this.slotDay(slot.dateSession)} ${this.slotMonth(slot.dateSession)} de ${slot.heureDebut?.slice(0, 5)} à ${slot.heureFin?.slice(0, 5)} avec ${coach.firstName} ${coach.lastName} ?`
      )
    )
      return;

    this.http
      .post(
        `${environment.apiUrl}/coach/sessions/${slot.id}/book?entrepreneurId=${user.id}`,
        {}
      )
      .subscribe({
        next: (res: any) => {
          alert(
            res?.meetLink
              ? `✅ Réservation confirmée !\nLien Meet : ${res.meetLink}`
              : '✅ Réservation confirmée !'
          );
        },
        error: (err) => {
          alert(
            '❌ ' +
              (err.error?.error || err.error?.message || 'Erreur de réservation')
          );
        },
      });
  }
}