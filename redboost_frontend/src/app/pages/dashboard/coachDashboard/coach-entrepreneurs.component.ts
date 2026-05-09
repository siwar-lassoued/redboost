import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CoachService, CoachEntrepreneurDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';

@Component({
  selector: 'app-coach-entrepreneurs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto min-h-screen font-sans bg-gray-50/50">
      <div class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
              <h1 class="text-3xl font-black tracking-tight text-gray-900 mb-2">Mes Entrepreneurs</h1>
              <p class="text-gray-500 font-medium">Consultez et suivez l'avancement de vos programmes d'accompagnement</p>
          </div>
          <div class="relative w-full md:w-80 shadow-sm rounded-2xl group">
              <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors"></i>
              <input type="text" placeholder="Rechercher..." [(ngModel)]="searchTerm" (ngModelChange)="filterEntrepreneurs()" 
                class="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-gray-400" />
          </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-2 mb-10">
          <button class="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            [class]="activeFilter === 'all' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'"
            (click)="setFilter('all')">
            Tous ({{entrepreneurs.length}})
          </button>
          <button *ngFor="let sector of sectors" class="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            [class]="activeFilter === sector ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'"
            (click)="setFilter(sector)">
              {{sector}} ({{getCountBySector(sector)}})
          </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div *ngFor="let ent of filteredEntrepreneurs" class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden">
              <div class="absolute top-0 left-0 w-full h-1" style="background: linear-gradient(90deg, #3B82F6, #8B5CF6);"></div>
              
              <div class="flex justify-between items-start mb-6 pt-2">
                  <div class="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-inner bg-gradient-to-br from-blue-500 to-indigo-600">
                      {{getInitials(ent)}}
                  </div>
                  <span class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border"
                    [style.backgroundColor]="getStageColor(ent.secteur || 'MVP').bg"
                    [style.color]="getStageColor(ent.secteur || 'MVP').color"
                    [style.borderColor]="getStageColor(ent.secteur || 'MVP').color + '20'">
                    {{ent.secteur || 'MVP'}}
                  </span>
              </div>
              
              <div class="flex-1 mb-6">
                  <h3 class="text-lg font-black text-gray-900 leading-tight mb-1">{{ent.firstName}} {{ent.lastName}}</h3>
                  <div class="text-sm font-bold text-blue-600 mb-6">{{ent.entreprise || 'Projet en cours'}}</div>
                  
                  <div class="space-y-4">
                    <div>
                        <div class="flex justify-between items-center text-xs mb-2">
                            <span class="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Progression globale</span>
                            <span class="font-black text-gray-700">{{ent.completionRate || 0}}%</span>
                        </div>
                        <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div class="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" [style.width.%]="ent.completionRate || 0"></div>
                        </div>
                    </div>

                    <div *ngIf="ent.delayedTasksCount && ent.delayedTasksCount > 0" class="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <i class="pi pi-exclamation-triangle text-amber-500"></i>
                        <span class="text-xs font-bold text-amber-700">{{ ent.delayedTasksCount }} retards signalés</span>
                    </div>
                  </div>
              </div>
              
              <div class="mt-auto">
                  <a [routerLink]="['/coach-entrepreneurs', ent.id]" 
                     class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-gray-700 bg-gray-50 hover:bg-gray-900 hover:text-white transition-colors group-hover:bg-blue-50 group-hover:text-blue-700">
                     Voir le profil <i class="pi pi-chevron-right text-[10px] mt-0.5"></i>
                  </a>
              </div>
          </div>
          <div *ngIf="filteredEntrepreneurs.length === 0 && !loading" class="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <i class="pi pi-users text-4xl text-gray-300 mb-4 block"></i>
              <p class="text-lg font-bold text-gray-500">Aucun entrepreneur trouvé</p>
              <p class="text-sm text-gray-400 mt-2">Modifiez vos filtres de recherche.</p>
          </div>
      </div>

      <div *ngIf="loading" class="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div class="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    </div>
  `,
  styles: []
})
export class CoachEntrepreneursComponent implements OnInit {
  loading: boolean = false;
  searchTerm: string = '';
  activeFilter: string = 'all';
  entrepreneurs: CoachEntrepreneurDTO[] = [];
  filteredEntrepreneurs: CoachEntrepreneurDTO[] = [];
  sectors: string[] = [];

  constructor(
    private coachService: CoachService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadEntrepreneurs();
  }

  loadEntrepreneurs() {
    const rawCoachId = this.authService.getUserId();
    const coachId = typeof rawCoachId === 'string' ? parseInt(rawCoachId, 10) : rawCoachId;

    if (!coachId) return;

    this.loading = true;
    this.coachService.getCoachEntrepreneurs(coachId).subscribe({
      next: (data) => {
        this.entrepreneurs = data;
        this.filteredEntrepreneurs = [...data];
        this.sectors = [
          ...new Set(
            data
              .map(e => e.secteur)
              .filter((s): s is string => typeof s === 'string' && s.trim() !== ''),
          ),
        ];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.filterEntrepreneurs();
  }

  filterEntrepreneurs() {
    let result = [...this.entrepreneurs];
    if (this.activeFilter !== 'all') {
      result = result.filter(e => e.secteur === this.activeFilter);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(e =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(term) ||
        (e.entreprise || '').toLowerCase().includes(term) ||
        (e.secteur || '').toLowerCase().includes(term)
      );
    }
    this.filteredEntrepreneurs = result;
  }

  getCountBySector(sector: string): number {
    return this.entrepreneurs.filter(e => e.secteur === sector).length;
  }

  getInitials(ent: CoachEntrepreneurDTO): string {
    return (ent.firstName?.charAt(0) || '') + (ent.lastName?.charAt(0) || '');
  }

  getStageColor(stage: string): { bg: string; color: string } {
    const stageColor: Record<string, { bg: string; color: string }> = {
      "Pre-Seed": { bg: "#FEF3C7", color: "#D97706" },
      "Seed": { bg: "#DBEAFE", color: "#2563EB" },
      "MVP": { bg: "#F3E8FF", color: "#7C3AED" },
      "Series A": { bg: "#D1FAE5", color: "#059669" },
    };
    // Default fallback style
    return stageColor[stage] || { bg: "#F3F4F6", color: "#4B5563" };
  }
}
