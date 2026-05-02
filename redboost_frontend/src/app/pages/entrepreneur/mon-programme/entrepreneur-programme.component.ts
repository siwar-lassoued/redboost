import { Component, signal, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatchingService, MatchingView } from '../../../core/services/matching.service';
import { ProgrammeService } from '../../../core/services/programme.service';
import { TacheService } from '../../../core/services/tache.service';
import { LivrableService } from '../../../core/services/livrable.service';
import { AuthService } from '../../../core/services/auth.service';

const STATUT_CFG: Record<string, { label: string; bg: string; color: string }> = {
  EN_COURS: { label: 'En cours', bg: '#D1FAE5', color: '#065F46' },
  PLANIFIE: { label: 'Planifié', bg: '#EFF6FF', color: '#2563EB' },
  TERMINE:  { label: 'Terminé', bg: '#F3F4F6', color: '#374151' },
  DRAFT:    { label: 'Brouillon', bg: '#FEF9C3', color: '#92400E' },
};

@Component({
  selector: 'rb-entrepreneur-programme',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 bg-[#F8FAFC] min-h-screen">
      
      <div class="mb-8">
        <h1 class="text-3xl font-black text-[#1A1A2E] tracking-tight">Mon Programme</h1>
        <p class="text-gray-500 mt-1 font-medium">Détails et avancement de votre programme d'accompagnement</p>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <i class="pi pi-spin pi-spinner text-3xl text-gray-300"></i>
        </div>
      } @else if (programme()) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div class="lg:col-span-2 space-y-6">
            
            <div class="bg-white rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100">
              <div class="p-8 text-white relative overflow-hidden" style="background: linear-gradient(135deg, #3B82A6 0%, #475569 100%)">
                <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10"></div>
                <div class="relative">
                  <span class="text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest"
                    style="background: rgba(255,255,255,0.2)">
                    {{ getStatut(programme()!.statut).label }}
                  </span>
                  <h2 class="text-2xl font-black mt-4 mb-2">{{ programme()!.nom }}</h2>
                  <p class="text-sm opacity-80 leading-relaxed max-w-xl">{{ programme()!.description }}</p>
                </div>
              </div>

              <div class="p-6">
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div class="p-4 bg-gray-50 rounded-2xl text-center">
                    <i class="pi pi-calendar mx-auto mb-2 text-[#3aafff] text-xl block"></i>
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Début</p>
                    <p class="text-sm font-black text-[#1A1A2E]">{{ formatDate(programme()!.dateDebut) }}</p>
                  </div>
                  <div class="p-4 bg-gray-50 rounded-2xl text-center">
                    <i class="pi pi-calendar-plus mx-auto mb-2 text-[#22c55e] text-xl block"></i>
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fin</p>
                    <p class="text-sm font-black text-[#1A1A2E]">{{ formatDate(programme()!.dateFin) }}</p>
                  </div>
                  <div class="p-4 bg-gray-50 rounded-2xl text-center">
                    <i class="pi pi-users mx-auto mb-2 text-[#a17dfd] text-xl block"></i>
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bénéficiaires</p>
                    <p class="text-sm font-black text-[#1A1A2E]">{{ programme()!.nbBeneficiaires || '—' }}</p>
                  </div>
                  <div class="p-4 bg-gray-50 rounded-2xl text-center">
                    <i class="pi pi-globe mx-auto mb-2 text-[#ff3d91] text-xl block"></i>
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Année</p>
                    <p class="text-sm font-black text-[#1A1A2E]">{{ programme()!.annee || '—' }}</p>
                  </div>
                </div>

                
                @if (programme()!.secteurs?.length) {
                  <div class="mb-6">
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Secteurs</p>
                    <div class="flex flex-wrap gap-2">
                      @for (s of programme()!.secteurs; track s) {
                        <span class="text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest"
                          style="background: #e8f9ff; color: #3aafff">{{ s }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            
            <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
              <h3 class="text-lg font-black text-[#1A1A2E] mb-6 flex items-center gap-2">
                <i class="pi pi-chart-bar text-[#a17dfd]"></i>
                Progression
              </h3>
              <div class="space-y-5">
                @for (bar of progressBars(); track bar.label) {
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-xs font-bold text-gray-600">{{ bar.label }}</span>
                      <span class="text-xs font-black" [style.color]="bar.color">{{ bar.value }}%</span>
                    </div>
                    <div class="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-700" [style.width.%]="bar.value" [style.background]="bar.gradient"></div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          
          <div class="space-y-6">
            @if (coach()) {
              <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                <h3 class="text-lg font-black text-[#1A1A2E] mb-5 flex items-center gap-2">
                  <i class="pi pi-user-edit text-[#ff3d91]"></i>
                  Mon Coach
                </h3>
                <div class="text-center mb-5">
                  <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black mx-auto mb-3 shadow-lg"
                    style="background: linear-gradient(135deg, #3B82A6, #10B981)">
                    {{ coach()!.nom[0] }}
                  </div>
                  <h4 class="font-black text-[#1A1A2E]">{{ coach()!.nom }}</h4>
                  <p class="text-xs text-gray-400 font-medium">{{ coach()!.specialite || 'Coach Expert' }}</p>
                </div>
                <div class="space-y-2">
                  <button [routerLink]="['/entrepreneur/chat']" [queryParams]="{with: coach()!.id}"
                    class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] shadow-lg cursor-pointer border-none"
                    style="background: linear-gradient(135deg, #F97316, #EF4444)">
                    <i class="pi pi-comments mr-1"></i>
                    Envoyer un message
                  </button>
                  <button routerLink="/entrepreneur/mes-coachs"
                    class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer border-none">
                    <i class="pi pi-user mr-1"></i>
                    Voir le profil
                  </button>
                </div>
              </div>
            }

            
            <div class="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
              <h3 class="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Accès rapides</h3>
              <div class="space-y-2">
                @for (link of quickLinks; track link.route) {
                  <a [routerLink]="link.route"
                    class="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors no-underline">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center" [style.background]="link.bg">
                      <i class="pi pi-{{link.icon}}" [style.color]="link.color"></i>
                    </div>
                    <span class="text-sm font-bold text-[#1A1A2E]">{{ link.label }}</span>
                    <i class="pi pi-chevron-right ml-auto text-gray-300 text-xs"></i>
                  </a>
                }
              </div>
            </div>
          </div>
        </div>
      } @else {
        
        <div class="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <i class="pi pi-book text-5xl text-gray-200 mb-4 block"></i>
          <h3 class="font-black text-gray-500 mb-2">Aucun programme assigné</h3>
          <p class="text-sm text-gray-400 max-w-sm text-center">Vous n'êtes pas encore inscrit dans un programme d'accompagnement. Contactez l'administrateur.</p>
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class EntrepreneurProgrammeComponent implements OnInit {
  private matchSvc = inject(MatchingService);
  private progSvc = inject(ProgrammeService);
  private tacheSvc = inject(TacheService);
  private livrableSvc = inject(LivrableService);
  private authSvc = inject(AuthService);

  programme = signal<any>(null);
  coach = signal<MatchingView | null>(null);
  loading = signal(true);
  progressBars = signal<any[]>([]);

  quickLinks = [
    { label: 'Mes Sessions', route: '/entrepreneur/mes-sessions', icon: 'calendar', bg: '#EFF6FF', color: '#3B82A6' },
    { label: 'Mes Tâches', route: '/entrepreneur/mes-taches', icon: 'list', bg: '#F0FDF4', color: '#10B981' },
    { label: 'Mes Livrables', route: '/entrepreneur/mes-livrables', icon: 'file-pdf', bg: '#FAF5FF', color: '#A855F7' },
    { label: 'Mon Statut', route: '/entrepreneur/status', icon: 'chart-line', bg: '#FFF5F5', color: '#EF4444' },
  ];

  ngOnInit(): void {
    const user = this.authSvc.currentUser$.value;
    if (!user) { this.loading.set(false); return; }

    // Load matching to find the programme
    this.matchSvc.getEntrepreneurCoaches(user.id).subscribe({
      next: (matches) => {
        if (matches.length > 0) {
          const m = matches[0];
          this.coach.set(m);

          // Load programme details
          this.progSvc.getById(m.programmeId).subscribe({
            next: (prog) => {
              this.programme.set(prog);
              this.loadProgress(user.id);
            },
            error: () => this.loading.set(false)
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false)
    });
  }

  private loadProgress(userId: string): void {
    this.tacheSvc.getByUser(userId).subscribe({
      next: (taches: any) => {
        const arr = Array.isArray(taches) ? taches : [];
        const total = arr.length;
        const done = arr.filter((t: any) => t.status === 'TERMINEE').length;
        const taskPct = total > 0 ? Math.round((done / total) * 100) : 0;

        this.livrableSvc.getAll({ entrepreneurId: userId }).subscribe({
          next: (res: any) => {
            const livs = Array.isArray(res) ? res : (res.data || []);
            const livTotal = livs.length;
            const livDone = livs.filter((l: any) => ['VALIDE', 'APPROVED', 'ACCEPTED'].includes(l.statut)).length;
            const livPct = livTotal > 0 ? Math.round((livDone / livTotal) * 100) : 0;

            this.progressBars.set([
              { label: 'Tâches complétées', value: taskPct, color: '#A855F7', gradient: 'linear-gradient(90deg, #A855F7, #7C3339)' },
              { label: 'Livrables approuvés', value: livPct, color: '#10B981', gradient: 'linear-gradient(90deg, #10B981, #059669)' },
              { label: 'Progression globale', value: Math.round((taskPct + livPct) / 2), color: '#3B82A6', gradient: 'linear-gradient(90deg, #3B82A6, #475569)' },
            ]);
            this.loading.set(false);
          },
          error: () => {
            this.progressBars.set([
              { label: 'Tâches complétées', value: taskPct, color: '#A855F7', gradient: 'linear-gradient(90deg, #A855F7, #7C3339)' },
            ]);
            this.loading.set(false);
          }
        });
      },
      error: () => this.loading.set(false)
    });
  }

  getStatut(statut: string) {
    return STATUT_CFG[statut] || { label: statut, bg: '#F3F4F6', color: '#374151' };
  }

  formatDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
