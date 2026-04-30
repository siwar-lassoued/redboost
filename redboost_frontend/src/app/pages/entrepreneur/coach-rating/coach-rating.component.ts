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
    <div class="min-h-screen" style="background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); padding: 2rem;">
      <div style="max-width: 680px; margin: 0 auto;">

        <!-- Header -->
        <div style="text-align: center; margin-bottom: 2.5rem;">
          <div style="width: 72px; height: 72px; background: linear-gradient(135deg, #1A3A3A, #2d6a4f); border-radius: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 12px 24px rgba(26,58,58,0.25);">
            <i class="pi pi-star-fill" style="color: #FFD700; font-size: 1.8rem;"></i>
          </div>
          <h1 style="font-size: 1.75rem; font-weight: 900; color: #1A1A2E; letter-spacing: -0.5px; margin: 0 0 0.5rem;">Évaluer votre séance</h1>
          <p style="color: #6B7280; font-size: 0.9rem; font-weight: 500; margin: 0;">Votre avis améliore la qualité de l'accompagnement</p>
        </div>

        <!-- Session Selector (if no sessionId in route) -->
        @if (!rating.sessionId && sessions.length > 0) {
          <div style="background: white; border-radius: 20px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #E5E7EB; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
            <label style="display: block; font-size: 0.7rem; font-weight: 900; color: #6B7280; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.75rem;">Sélectionner la séance à évaluer</label>
            <select [(ngModel)]="rating.sessionId" (ngModelChange)="onSessionChange($event)"
              style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 2px solid #E5E7EB; font-size: 0.9rem; font-weight: 600; color: #1A1A2E; background: #F8FAFC; outline: none; cursor: pointer;">
              <option value="">-- Choisir une séance --</option>
              @for (s of sessions; track s.id) {
                <option [value]="s.id">{{ s.titre || 'Séance' }} - {{ s.dateSession | date:'dd/MM/yyyy' }} {{ s.heureDebut }}</option>
              }
            </select>
          </div>
        }

        @if (!sessions.length && !isLoadingSessions) {
          <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 20px; padding: 1.5rem; margin-bottom: 1.5rem; text-align: center;">
            <i class="pi pi-calendar-times" style="font-size: 2rem; color: #F97316; margin-bottom: 0.5rem; display: block;"></i>
            <p style="color: #9A3412; font-weight: 700; font-size: 0.9rem; margin: 0;">Aucune séance passée trouvée</p>
            <p style="color: #C2410C; font-size: 0.8rem; margin: 0.25rem 0 0;">Vous devez d'abord avoir effectué une séance avec un coach.</p>
          </div>
        }

        <!-- Rating Card -->
        <div style="background: white; border-radius: 28px; padding: 2rem; border: 1px solid #E5E7EB; box-shadow: 0 8px 32px rgba(0,0,0,0.08);">

          <!-- Coach info if available -->
          @if (selectedCoachName) {
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: linear-gradient(135deg, #F0FDF4, #DCFCE7); border-radius: 16px; margin-bottom: 2rem; border: 1px solid #BBF7D0;">
              <div style="width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, #10B981, #059669); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; font-weight: 900; flex-shrink: 0;">
                {{ selectedCoachName[0] }}
              </div>
              <div>
                <p style="font-size: 0.7rem; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">Coach évalué</p>
                <p style="font-size: 1rem; font-weight: 900; color: #1A1A2E; margin: 0.15rem 0 0;">{{ selectedCoachName }}</p>
              </div>
            </div>
          }

          <!-- Global Rating -->
          <div style="text-align: center; margin-bottom: 2rem;">
            <span style="font-size: 0.7rem; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-bottom: 1rem;">Note Globale</span>
            <div style="display: flex; justify-content: center; gap: 0.75rem;">
              @for (s of [1,2,3,4,5]; track s) {
                <button (click)="rating.globalRating = s"
                  style="width: 52px; height: 52px; border-radius: 14px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                  [style.background]="s <= rating.globalRating ? 'linear-gradient(135deg, #FFD700, #FFA500)' : '#F3F4F6'"
                  [style.transform]="s <= rating.globalRating ? 'scale(1.15)' : 'scale(1)'"
                  [style.boxShadow]="s <= rating.globalRating ? '0 8px 16px rgba(255,165,0,0.35)' : 'none'">
                  <i class="pi pi-star-fill" style="font-size: 1.4rem;"
                    [style.color]="s <= rating.globalRating ? 'white' : '#D1D5DB'"></i>
                </button>
              }
            </div>
          </div>

          <!-- Sub-criteria -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
            @for (critere of criteres; track critere.id) {
              <div style="padding: 1rem; background: #F8FAFC; border-radius: 16px; border: 1px solid #F1F5F9; text-align: center;">
                <div style="width: 40px; height: 40px; border-radius: 12px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem;">
                  <i [class]="'pi pi-' + critere.icon" style="color: #1A3A3A; font-size: 1rem;"></i>
                </div>
                <span style="font-size: 0.65rem; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.5rem;">{{ critere.label }}</span>
                <div style="display: flex; justify-content: center; gap: 4px;">
                  @for (s of [1,2,3,4,5]; track s) {
                    <div (click)="rating[critere.id] = s" style="cursor: pointer; padding: 2px;">
                      <i class="pi pi-circle-fill" style="font-size: 8px;"
                        [style.color]="s <= rating[critere.id] ? '#1A3A3A' : '#E5E7EB'"></i>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Comment -->
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.7rem; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.75rem; padding-left: 0.25rem;">Commentaire (optionnel)</label>
            <textarea [(ngModel)]="rating.commentaire" placeholder="Partagez votre expérience avec ce coach..."
              style="width: 100%; padding: 1.25rem; background: #F8FAFC; border: 2px solid transparent; border-radius: 20px; font-size: 0.9rem; color: #374151; font-weight: 500; outline: none; min-height: 130px; resize: vertical; font-family: inherit; box-sizing: border-box; transition: border-color 0.2s;"
              (focus)="$event.target.style.borderColor='#1A3A3A'"
              (blur)="$event.target.style.borderColor='transparent'"></textarea>
          </div>

          <!-- Submit -->
          <button (click)="submit()" [disabled]="isSubmitting || !rating.coachId || !rating.entrepreneurId"
            style="width: 100%; padding: 1.1rem; border-radius: 18px; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 900; color: white; background: linear-gradient(135deg, #1A3A3A, #2d6a4f); box-shadow: 0 8px 24px rgba(26,58,58,0.25); display: flex; align-items: center; justify-content: center; gap: 0.75rem; transition: all 0.2s; opacity: 1;"
            [style.opacity]="(isSubmitting || !rating.coachId || !rating.entrepreneurId) ? '0.5' : '1'">
            @if (isSubmitting) {
              <i class="pi pi-spin pi-spinner"></i>
              Envoi en cours...
            } @else {
              SOUMETTRE MON ÉVALUATION
              <i class="pi pi-arrow-right"></i>
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
          this.sessions = sessions.filter((s: any) => new Date(s.dateSession) < now);
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
      this.rating.coachId = session.coachId;
      this.selectedCoachName = session.coachName || session.coachNom || '';
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
