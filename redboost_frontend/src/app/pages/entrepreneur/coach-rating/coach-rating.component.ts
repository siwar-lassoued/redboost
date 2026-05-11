import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CoachRatingService } from '../../../core/services/coach-rating.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-coach-rating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 flex justify-center">
      <div class="w-full max-w-2xl">

        <!-- Header -->
        <div class="mb-10 text-center">
          <h1 class="text-3xl font-black text-[#1A1A2E] tracking-tight">Évaluer votre séance</h1>
          <p class="text-gray-500 mt-2 font-medium">Votre avis améliore la qualité de l'accompagnement</p>
        </div>

        <!-- Session Selector (if no sessionId in route) -->
        @if (!rating.sessionId && sessions.length > 0) {
          <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 mb-8">
            <label class="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Sélectionner la séance à évaluer</label>
            <select [(ngModel)]="rating.sessionId" (ngModelChange)="onSessionChange($event)"
              class="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm font-semibold text-[#1A1A2E] focus:outline-none focus:border-[#3B82A6] transition-colors cursor-pointer">
              <option value="">-- Choisir une séance --</option>
              @for (s of sessions; track s.id) {
                <option [value]="s.id">{{ s.titre || 'Séance' }} - {{ s.date | date:'dd/MM/yyyy HH:mm' }}</option>
              }
            </select>
          </div>
        }

        @if (!sessions.length && !isLoadingSessions) {
          <div class="flex flex-col items-center justify-center py-16 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 mb-8">
            <div class="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <i class="pi pi-calendar-times text-4xl text-amber-500"></i>
            </div>
            <h3 class="text-lg font-black text-gray-800">Aucune séance passée</h3>
            <p class="text-sm text-gray-500 mt-1 font-medium">Vous devez d'abord avoir effectué une séance avec un coach.</p>
          </div>
        }

        <!-- Rating Card -->
        <div class="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">

          <!-- Coach info if available -->
          @if (selectedCoachName) {
            <div class="flex items-center gap-4 p-4 bg-[#F0FDF4] rounded-2xl mb-8 border border-[#BBF7D0]">
              <div class="w-12 h-12 rounded-xl bg-[#16A34A] flex items-center justify-center text-white text-xl font-black shrink-0 shadow-md">
                {{ selectedCoachName[0] }}
              </div>
              <div>
                <p class="text-[10px] font-black text-[#15803D] uppercase tracking-widest mb-0.5">Coach évalué</p>
                <p class="text-lg font-black text-[#1A1A2E] leading-tight">{{ selectedCoachName }}</p>
              </div>
            </div>
          }

          <!-- Global Rating -->
          <div class="text-center mb-10">
            <span class="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Note Globale</span>
            <div class="flex justify-center gap-2 sm:gap-4">
              @for (s of [1,2,3,4,5]; track s) {
                <button (click)="rating.globalRating = s"
                  class="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                  [ngClass]="s <= rating.globalRating ? 'bg-[#FDE047] shadow-lg shadow-yellow-200 scale-110' : 'bg-gray-100 hover:bg-gray-200'">
                  <i class="pi pi-star-fill text-xl sm:text-2xl transition-colors duration-300"
                    [ngClass]="s <= rating.globalRating ? 'text-yellow-600' : 'text-gray-300'"></i>
                </button>
              }
            </div>
          </div>

          <!-- Sub-criteria -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            @for (critere of criteres; track critere.id) {
              <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
                  <i [class]="'pi pi-' + critere.icon" class="text-[#3B82A6] text-lg"></i>
                </div>
                <span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{{ critere.label }}</span>
                <div class="flex justify-center gap-1.5">
                  @for (s of [1,2,3,4,5]; track s) {
                    <div (click)="rating[critere.id] = s" class="cursor-pointer p-1">
                      <div class="w-2.5 h-2.5 rounded-full transition-colors duration-200"
                        [ngClass]="s <= rating[critere.id] ? 'bg-[#3B82A6]' : 'bg-gray-200'"></div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Comment -->
          <div class="mb-8">
            <label class="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 pl-1">Commentaire (optionnel)</label>
            <textarea [(ngModel)]="rating.commentaire" placeholder="Partagez votre expérience avec ce coach..."
              class="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-[#3B82A6] rounded-2xl text-sm text-gray-700 font-medium outline-none min-h-[120px] resize-y transition-colors"></textarea>
          </div>

          <!-- Submit -->
          <button (click)="submit()" [disabled]="isSubmitting || !rating.coachId || !rating.entrepreneurId"
            class="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-xl"
            [ngClass]="(isSubmitting || !rating.coachId || !rating.entrepreneurId) ? 'bg-gray-300 cursor-not-allowed opacity-70 shadow-none' : 'bg-gradient-to-r from-[#2A7B8C] to-[#1A6778] hover:scale-[1.02] shadow-[#2A7B8C]/30'">
            @if (isSubmitting) {
              <i class="pi pi-spin pi-spinner text-xl"></i>
              Envoi en cours...
            } @else {
              SOUMETTRE MON ÉVALUATION
              <i class="pi pi-arrow-right font-bold"></i>
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class CoachRatingComponent implements OnInit {
  rating: any = {
    coachId: null,
    entrepreneurId: null,
    sessionId: null,
    globalRating: 5,
    communication: 5,
    expertise: 5,
    availability: 5,
    commentaire: ''
  };
  isSubmitting = false;
  isLoadingSessions = true;
  sessions: any[] = [];
  selectedCoachName = '';

  criteres = [
    { id: 'communication', label: 'Communication', icon: 'comments' },
    { id: 'expertise', label: 'Expertise', icon: 'verified' },
    { id: 'availability', label: 'Disponibilité', icon: 'calendar' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private ratingService: CoachRatingService
  ) {}

  ngOnInit() {
    const user = this.authService.currentUser$.value;
    if (user?.id) {
      this.rating.entrepreneurId = Number(user.id);
    }

    // If sessionId is in route, pre-fill
    const sessionIdParam = this.route.snapshot.params['sessionId'];
    if (sessionIdParam) {
      this.rating.sessionId = sessionIdParam;
    }

    // Load past sessions for this entrepreneur
    this.loadSessions();
  }

  loadSessions() {
    this.isLoadingSessions = true;
    this.http.get<any>(`${environment.apiUrl}/sessions/entrepreneur/${this.rating.entrepreneurId}`)
      .subscribe({
        next: (res) => {
          const sessions = res?.data || res || [];
          // Only show past sessions
          const now = new Date();
          this.sessions = sessions.filter((s: any) => new Date(s.date) < now);
          if (this.rating.sessionId) {
            this.onSessionChange(this.rating.sessionId);
          }
          this.isLoadingSessions = false;
        },
        error: () => {
          this.sessions = [];
          this.isLoadingSessions = false;
        }
      });
  }

  onSessionChange(sessionId: any) {
    const session = this.sessions.find(s => s.id == sessionId);
    if (session) {
      this.rating.coachId = session.coach?.id;
      this.selectedCoachName = (session.coach?.firstName || '') + ' ' + (session.coach?.lastName || '');
      if (session.programme) {
        this.rating.programmeId = session.programme.id;
      }
    }
  }

  submit() {
    if (!this.rating.coachId || !this.rating.entrepreneurId) {
      alert('Veuillez sélectionner une séance à évaluer.');
      return;
    }
    this.isSubmitting = true;
    this.ratingService.create(this.rating).subscribe({
      next: () => {
        alert('Merci pour votre évaluation !');
        this.router.navigate(['/entrepreneur-dashboard']);
      },
      error: (err) => {
        alert(err.error?.error || err.error?.message || "Erreur lors de l'envoi");
        this.isSubmitting = false;
      }
    });
  }
}
