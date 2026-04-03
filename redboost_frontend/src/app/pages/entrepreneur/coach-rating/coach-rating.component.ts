import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CoachRatingService } from '../../../core/services/coach-rating.service';

@Component({
  selector: 'app-coach-rating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-[#F8FAFC] min-h-screen">
      <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-10">
          <div class="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-amber-200/50 flex items-center justify-center mx-auto mb-4 border border-amber-50">
            <i class="pi pi-star-fill text-4xl text-amber-400"></i>
          </div>
          <h1 class="text-3xl font-black text-[#1A1A2E] tracking-tight">Évaluer votre session</h1>
          <p class="text-gray-500 mt-2 font-medium">Votre feedback aide nos coachs à s'améliorer</p>
        </div>

        <div class="bg-white rounded-[40px] p-8 shadow-2xl shadow-gray-200/50 border border-gray-100">
          <div class="space-y-10">
            <!-- Global Rating -->
            <div class="text-center">
              <span class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 block">Note Globale</span>
              <div class="flex justify-center gap-3">
                @for (s of [1,2,3,4,5]; track s) {
                  <button (click)="rating.globalRating = s" 
                    class="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 transform border-none cursor-pointer"
                    [class.scale-125]="s <= rating.globalRating"
                    [style.background]="s <= rating.globalRating ? 'linear-gradient(135deg, #FFD700, #FFA500)' : '#F8FAFC'"
                    [style.boxShadow]="s <= rating.globalRating ? '0 10px 20px rgba(255,165,0,0.3)' : 'none'">
                    <i class="pi pi-star-fill text-2xl" [class.text-white]="s <= rating.globalRating" [class.text-gray-200]="s > rating.globalRating"></i>
                  </button>
                }
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Communication -->
              @for (critere of criteres; track critere.id) {
                <div class="p-5 bg-[#F8FAFC] rounded-3xl border border-gray-50">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <i class="pi pi-{{critere.icon}} text-[#1A3A3A]"></i>
                    </div>
                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">{{ critere.label }}</span>
                    <div class="flex gap-1">
                      @for (s of [1,2,3,4,5]; track s) {
                        <div (click)="rating[critere.id] = s" class="cursor-pointer">
                          <i class="pi pi-circle-fill text-[8px]" 
                            [class.text-[#1A3A3A]]="s <= rating[critere.id]" 
                            [class.text-gray-200]="s > rating[critere.id]"></i>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>

            <div>
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block pl-2">Commentaires (Optionnel)</label>
              <textarea [(ngModel)]="rating.commentaire" 
                class="w-full p-6 bg-[#F8FAFC] border-2 border-transparent rounded-[32px] focus:bg-white focus:border-[#1A3A3A]/10 focus:ring-0 transition-all min-h-[160px] text-gray-700 font-medium outline-none"
                placeholder="Un petit mot pour votre coach ?"></textarea>
            </div>

            <div class="pt-4">
              <button (click)="submit()" [disabled]="isSubmitting"
                class="w-full py-5 rounded-[24px] text-sm font-black text-white transition-all hover:scale-[1.02] shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 border-none cursor-pointer"
                style="background: linear-gradient(135deg, #1A3A3A, #3aafff)">
                @if (isSubmitting) {
                  <i class="pi pi-spin pi-spinner"></i>
                  ENVOI EN COURS...
                } @else {
                  SOUMETTRE L'ÉVALUATION
                  <i class="pi pi-arrow-right"></i>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class CoachRatingComponent implements OnInit {
  rating: any = {
    coachId: '',
    entrepreneurId: '',
    globalRating: 5,
    communication: 5,
    expertise: 5,
    availability: 5,
    commentaire: ''
  };
  isSubmitting = false;

  criteres = [
    { id: 'communication', label: 'Communication', icon: 'comments' },
    { id: 'expertise',     label: 'Expertise',     icon: 'verified' },
    { id: 'availability',  label: 'Disponibilité',  icon: 'calendar' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ratingService: CoachRatingService
  ) {}

  ngOnInit() {
    this.rating.sessionId = this.route.snapshot.params['sessionId'];
    // In a real app, we would fetch session details here to pre-fill coachId and entrepreneurId
  }

  submit() {
    this.isSubmitting = true;
    this.ratingService.create(this.rating).subscribe({
      next: () => {
        alert('Merci pour votre évaluation !');
        this.router.navigate(['/entrepreneur/dashboard']);
      },
      error: (err) => {
        alert(err.error?.message || "Erreur lors de l'envoi");
        this.isSubmitting = false;
      }
    });
  }
}
