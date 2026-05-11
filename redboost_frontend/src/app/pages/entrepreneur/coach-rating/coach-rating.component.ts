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
    <div class="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 flex items-center justify-center font-sans" [style.--font-sans]="'var(--font-family)'">
      <div class="w-full max-w-[600px]">

        @if (!isSuccess) {
          <!-- RATING FORM CARD -->
          <div class="bg-[#262626] rounded-[24px] shadow-2xl overflow-hidden border border-white/5">
            
            <!-- Header/Coach Info -->
            <div class="p-8 text-center border-b border-white/5">
              <div class="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 overflow-hidden">
                @if (selectedCoachName) {
                  <span class="text-2xl font-black text-white">{{ selectedCoachName[0] }}</span>
                } @else {
                  <i class="pi pi-user text-3xl text-white/30"></i>
                }
              </div>
              <h2 class="text-xl font-black text-white mb-1">{{ selectedCoachName || 'Chargement...' }}</h2>
              <p class="text-white/40 text-[11px] font-bold uppercase tracking-[2px]">Coach — RedBoost Tunisie</p>
            </div>

            <!-- Global Rating -->
            <div class="p-8 text-center">
              <p class="text-white/50 text-[12px] font-bold uppercase tracking-widest mb-6">Note globale</p>
              
              <div class="flex justify-center gap-3 mb-4">
                @for (s of [1,2,3,4,5]; track s) {
                  <button 
                    (mouseenter)="hoverGlobal = s" 
                    (mouseleave)="hoverGlobal = 0"
                    (click)="rating.globalRating = s"
                    class="bg-transparent border-none p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  >
                    <i class="pi pi-star-fill text-3xl transition-colors duration-200"
                      [style.color]="s <= (hoverGlobal || rating.globalRating) ? '#EF9F27' : '#444444'"></i>
                  </button>
                }
              </div>
              <p class="text-white/70 text-sm font-medium">{{ globalLabel }}</p>
            </div>

            <div class="px-8"><div class="h-[0.5px] bg-white/5"></div></div>

            <!-- Detailed Criteria -->
            <div class="p-8">
              <h3 class="text-white/50 text-[12px] font-bold uppercase tracking-widest mb-6">Critères détaillés</h3>
              
              <div class="grid grid-cols-2 gap-x-12 gap-y-8">
                @for (c of criteres; track c.id) {
                  <div>
                    <p class="text-white/80 text-[13px] font-medium mb-3">{{ c.label }}</p>
                    <div class="flex gap-1.5">
                      @for (s of [1,2,3,4,5]; track s) {
                        <button 
                          (mouseenter)="c.hover = s" 
                          (mouseleave)="c.hover = 0"
                          (click)="rating[c.id] = s"
                          class="bg-transparent border-none p-0 cursor-pointer"
                        >
                          <i class="pi pi-star-fill text-[14px] transition-colors"
                            [style.color]="s <= (c.hover || rating[c.id]) ? '#EF9F27' : '#444444'"></i>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="px-8"><div class="h-[0.5px] bg-white/5"></div></div>

            <!-- Strength Tags -->
            <div class="p-8">
              <h3 class="text-white/50 text-[12px] font-bold uppercase tracking-widest mb-6">Points forts</h3>
              <div class="flex flex-wrap gap-2.5">
                @for (tag of strengthTags; track tag) {
                  <button 
                    (click)="toggleTag(tag)"
                    class="px-4 py-2 rounded-full text-[12px] font-bold transition-all duration-200 border cursor-pointer"
                    [ngClass]="selectedTags.has(tag) ? 'bg-[#E1F5EE] border-[#5DCAA5] text-[#0F6E56]' : 'bg-transparent border-white/10 text-white/50 hover:border-white/30'"
                  >
                    {{ tag }}
                  </button>
                }
              </div>
            </div>

            <!-- Comment -->
            <div class="p-8 pt-0">
              <h3 class="text-white/50 text-[12px] font-bold uppercase tracking-widest mb-4">Commentaire (optionnel)</h3>
              <textarea 
                [(ngModel)]="rating.commentaire"
                placeholder="Partagez votre expérience avec ce coach..."
                class="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-white/20 min-h-[120px] transition-colors placeholder:text-white/20"
              ></textarea>
            </div>

            <!-- Action -->
            <div class="p-8 pt-0">
              <button 
                (click)="submit()"
                [disabled]="isSubmitting || rating.globalRating === 0"
                class="w-full py-4 rounded-xl font-bold text-[13px] uppercase tracking-[1px] transition-all duration-200 border flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                [ngClass]="rating.globalRating === 0 ? 'bg-transparent border-white/10 text-white/20' : 'bg-white/5 border-white/20 text-white hover:bg-white/10 cursor-pointer'"
              >
                @if (isSubmitting) {
                  <i class="pi pi-spinner pi-spin"></i>
                  Envoi...
                } @else {
                  Envoyer l'évaluation <i class="pi pi-arrow-up-right text-[10px]"></i>
                }
              </button>
            </div>
          </div>
        } @else {
          <!-- SUCCESS SCREEN -->
          <div class="bg-white rounded-[12px] shadow-2xl p-12 text-center max-w-[560px] mx-auto border border-black/[0.05] animate-in fade-in zoom-in duration-500">
            <div class="w-20 h-20 bg-[#E1F5EE] rounded-full flex items-center justify-center mx-auto mb-8">
              <i class="pi pi-check text-3xl text-[#0F6E56]"></i>
            </div>
            <h2 class="text-2xl font-black text-gray-900 mb-4">Évaluation envoyée !</h2>
            <p class="text-gray-500 mb-10 leading-relaxed">
              Merci d'avoir partagé votre expérience. Votre avis est essentiel pour maintenir l'excellence de notre accompagnement.
            </p>
            <div class="h-[0.5px] bg-black/[0.05] mb-10"></div>
            <button 
              (click)="router.navigate(['/entrepreneur-dashboard'])"
              class="px-10 py-3 rounded-full border border-gray-200 bg-transparent text-gray-600 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-[0.98] cursor-pointer"
            >
              Retour au tableau de bord
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .font-sans { font-family: var(--font-sans, 'Inter', sans-serif); }
  `],
})
export class CoachRatingComponent implements OnInit {
  rating: any = {
    coachId: null,
    entrepreneurId: null,
    sessionId: null,
    globalRating: 0,
    communication: 5,
    expertise: 5,
    availability: 5,
    impact: 5,
    tags: '',
    commentaire: ''
  };
  isSubmitting = false;
  isSuccess = false;
  isLoadingSessions = true;
  sessions: any[] = [];
  selectedCoachName = '';
  hoverGlobal = 0;

  criteres = [
    { id: 'communication', label: 'Communication', icon: 'comments', hover: 0 },
    { id: 'expertise', label: 'Expertise', icon: 'verified', hover: 0 },
    { id: 'availability', label: 'Disponibilité', icon: 'calendar', hover: 0 },
    { id: 'impact', label: 'Impact sur mon projet', icon: 'bolt', hover: 0 },
  ];

  strengthTags = [
    'Écoute active', 'Feedback clair', 'Réseau utile', 
    'Adaptabilité', 'Vision stratégique', 'Suivi régulier'
  ];
  selectedTags = new Set<string>();

  get globalLabel(): string {
    const val = this.hoverGlobal || this.rating.globalRating;
    if (val === 1) return 'Décevant';
    if (val === 2) return 'Moyen';
    if (val === 3) return 'Bien';
    if (val === 4) return 'Très bien';
    if (val === 5) return 'Excellent !';
    return 'Sélectionnez une note';
  }

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private ratingService: CoachRatingService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user?.id) {
        this.rating.entrepreneurId = Number(user.id);
        this.loadSessions();
      }
    });

    // If sessionId is in route, pre-fill
    const sessionIdParam = this.route.snapshot.params['sessionId'];
    if (sessionIdParam) {
      this.rating.sessionId = sessionIdParam;
    }
  }

  loadSessions() {
    this.isLoadingSessions = true;
    this.http.get<any>(`${environment.apiUrl}/sessions/entrepreneur/${this.rating.entrepreneurId}`)
      .subscribe({
        next: (res) => {
          const sessions = res?.data || res || [];
          // Show past sessions OR the currently targeted session
          const now = new Date();
          this.sessions = sessions.filter((s: any) => 
            new Date(s.date) < now || s.id === this.rating.sessionId || s.statut === 'TERMINE' || s.statut === 'REALISEE'
          );
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
      // Try multiple ways to get coachId
      this.rating.coachId = session.coach?.id || session.coachId || (typeof session.coach === 'number' ? session.coach : null);
      
      // Try multiple ways to get coach name
      if (session.coach?.firstName) {
        this.selectedCoachName = session.coach.firstName + ' ' + (session.coach.lastName || '');
      } else {
        this.selectedCoachName = session.coachName || session.coachNom || 'Votre Coach';
      }

      if (session.programme) {
        this.rating.programmeId = session.programme.id || session.programme;
      }
    }
  }

  toggleTag(tag: string) {
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
    this.rating.tags = Array.from(this.selectedTags).join(', ');
  }

  submit() {
    if (this.rating.globalRating === 0) return;
    if (!this.rating.coachId || !this.rating.entrepreneurId) {
      alert('Veuillez sélectionner une séance à évaluer.');
      return;
    }
    this.isSubmitting = true;
    this.ratingService.create(this.rating).subscribe({
      next: () => {
        this.isSuccess = true;
        this.isSubmitting = false;
      },
      error: (err) => {
        alert(err.error?.error || err.error?.message || "Erreur lors de l'envoi");
        this.isSubmitting = false;
      }
    });
  }
}
