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
    <div class="entrepreneurs-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">Mes Entrepreneurs 👥</h1>
          <p class="page-subtitle">Accompagnez vos porteurs de projet vers le succès et la réussite ✨</p>
        </div>
        <div class="header-actions">
           <div class="search-wrap premium-card">
              <i class="pi pi-search"></i>
              <input type="text" placeholder="Rechercher un entrepreneur..." [(ngModel)]="searchTerm" (ngModelChange)="filterEntrepreneurs()" />
           </div>
        </div>
      </div>

      <!-- Quick Filters -->
      <div class="filters-scroll">
        <button class="filter-pill" [class.active]="activeFilter === 'all'" (click)="setFilter('all')">
          Tous ({{entrepreneurs.length}})
        </button>
        <button *ngFor="let sector of sectors" class="filter-pill" 
          [class.active]="activeFilter === sector" (click)="setFilter(sector)">
          {{sector}}
        </button>
      </div>

      @if (loading) {
        <div class="loading-state">
           <div class="premium-spinner"></div>
        </div>
      } @else {
        <!-- Grid -->
        <div class="entrepreneurs-grid" *ngIf="filteredEntrepreneurs.length > 0">
          <div *ngFor="let ent of filteredEntrepreneurs" class="ent-card-premium" [routerLink]="['/coach-entrepreneurs', ent.id]">
            <div class="card-top">
                <div class="stage-badge-premium" [style.background]="getStageColor(ent.secteur || 'MVP').bg" [style.color]="getStageColor(ent.secteur || 'MVP').color">
                  {{ ent.secteur || 'MVP' }}
                </div>
                <div class="ent-avatar-premium" [style.background]="getAvatarGradient(ent)">
                  {{ getInitials(ent) }}
                </div>
            </div>

            <div class="card-body-premium">
              <h3 class="ent-name">{{ ent.firstName }} {{ ent.lastName }}</h3>
              <p class="ent-company">{{ ent.entreprise || 'Startup en création' }}</p>
              
              <div class="progression-box">
                <div class="progression-meta">
                  <span class="label">PROGRESSION DU PROGRAMME</span>
                  <span class="value">{{ ent.completionRate || 0 }}%</span>
                </div>
                <div class="p-bar-bg">
                  <div class="p-bar-fill" [style.width.%]="ent.completionRate || 0"></div>
                </div>
              </div>

              <div class="capsules-row">
                 <div class="capsule-warning" *ngIf="(ent.delayedTasksCount || 0) > 0">
                   <i class="pi pi-clock"></i>
                   <span>{{ ent.delayedTasksCount }} Retards</span>
                 </div>
                 <div class="capsule-info">
                   <i class="pi pi-check-circle"></i>
                   <span>{{ ent.completedTasksCount || 0 }} Tâches</span>
                 </div>
              </div>
            </div>

            <div class="card-action-premium">
              <span>Consulter le profil</span>
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div class="empty-results-premium" *ngIf="filteredEntrepreneurs.length === 0">
          <div class="empty-icon">📂</div>
          <h3>Aucun entrepreneur trouvé</h3>
          <p>Essayez d'ajuster vos filtres ou votre recherche.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .entrepreneurs-page { padding: 3rem; background: #f8fafc; min-height: 100vh; animation: fadeIn 0.4s ease; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
    .page-title { font-size: 2.8rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -1.5px; }
    .page-subtitle { color: #64748b; font-size: 1.15rem; margin-top: 0.5rem; }
    
    .search-wrap { position: relative; background: white; border-radius: 24px; width: 380px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .search-wrap input { width: 100%; padding: 1.1rem 1.5rem 1.1rem 4rem; border: none; background: transparent; font-size: 1rem; outline: none; color: #0f172a; font-weight: 500; }
    .search-wrap i { position: absolute; left: 1.5rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.2rem; }

    .filters-scroll { display: flex; gap: 1rem; margin-bottom: 3rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: none; }
    .filter-pill { padding: 0.85rem 1.75rem; border-radius: 100px; background: white; border: 1px solid #e2e8f0; color: #64748b; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
    .filter-pill.active { background: #0f172a; color: white; border-color: #0f172a; box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2); }

    .entrepreneurs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 2.5rem; }
    
    .ent-card-premium { 
      background: white; 
      border-radius: 40px; 
      border: 1px solid rgba(226, 232, 240, 0.8); 
      overflow: hidden; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
      display: flex; 
      flex-direction: column; 
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
    }
    
    .ent-card-premium:hover { 
      transform: translateY(-12px); 
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08); 
      border-color: #cbd5e1;
    }

    .card-top { padding: 2.5rem 2.5rem 1rem; display: flex; flex-direction: column; align-items: center; position: relative; }
    
    .stage-badge-premium { 
      position: absolute; 
      top: 1.5rem; 
      right: 1.5rem; 
      padding: 0.4rem 0.9rem; 
      border-radius: 100px; 
      font-size: 0.75rem; 
      font-weight: 800; 
      letter-spacing: 0.05em; 
    }

    .ent-avatar-premium { 
      width: 100px; 
      height: 100px; 
      border-radius: 35px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 2.2rem; 
      font-weight: 800; 
      color: white; 
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      margin-top: 1rem;
    }

    .card-body-premium { padding: 1.5rem 2.5rem 2rem; flex: 1; text-align: center; }
    .ent-name { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
    .ent-company { font-size: 1rem; font-weight: 600; color: #3b82f6; margin: 0.5rem 0 2rem; }

    .progression-box { margin-bottom: 2rem; text-align: left; }
    .progression-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; letter-spacing: 0.05em; }
    .value { font-size: 1rem; font-weight: 800; color: #0f172a; }
    
    .p-bar-bg { height: 10px; background: #f1f5f9; border-radius: 100px; overflow: hidden; }
    .p-bar-fill { height: 100%; background: linear-gradient(90deg, #FF4D85, #FF758C); border-radius: 100px; transition: width 1s ease-out; }

    .capsules-row { display: flex; gap: 1rem; justify-content: center; }
    
    .capsule-warning { display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 1.1rem; border-radius: 100px; background: #fff1f2; color: #f43f5e; font-weight: 700; font-size: 0.85rem; }
    .capsule-info { display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 1.1rem; border-radius: 100px; background: #eff6ff; color: #3b82f6; font-weight: 700; font-size: 0.85rem; }

    .card-action-premium { 
      padding: 1.5rem; 
      background: #fafafa; 
      border-top: 1px solid #f1f5f9; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      gap: 0.75rem; 
      color: #0f172a; 
      font-weight: 700; 
      font-size: 0.95rem; 
      transition: all 0.2s;
    }
    
    .ent-card-premium:hover .card-action-premium { background: #0f172a; color: white; }

    .empty-results-premium { text-align: center; padding: 6rem 2rem; background: white; border-radius: 40px; border: 2px dashed #e2e8f0; max-width: 600px; margin: 4rem auto; }
    .empty-icon { font-size: 3rem; margin-bottom: 1.5rem; }
    .empty-results-premium h3 { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
    .empty-results-premium p { color: #64748b; font-size: 1.1rem; }

    .loading-state { padding: 10rem 0; text-align: center; }
    .premium-spinner { width: 60px; height: 60px; border: 6px solid #f1f5f9; border-top-color: #0f172a; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
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

  getAvatarGradient(ent: CoachEntrepreneurDTO): string {
    const gradients = [
      'linear-gradient(135deg, #6366f1, #a855f7)',
      'linear-gradient(135deg, #3b82f6, #2dd4bf)',
      'linear-gradient(135deg, #f59e0b, #ef4444)',
      'linear-gradient(135deg, #10b981, #3b82f6)',
    ];
    const index = (ent.id || 0) % gradients.length;
    return gradients[index];
  }

  getStageColor(stage: string): { bg: string; color: string } {
    const stageColors: Record<string, { bg: string; color: string }> = {
      "Pre-Seed": { bg: "#FEF3C7", color: "#D97706" },
      "Seed": { bg: "#DBEAFE", color: "#2563EB" },
      "MVP": { bg: "#F3E8FF", color: "#7C3AED" },
      "Series A": { bg: "#D1FAE5", color: "#059669" },
    };
    return stageColors[stage] || { bg: "#f1f5f9", color: "#64748b" };
  }

  getInitials(ent: CoachEntrepreneurDTO): string {
    if (!ent.firstName && !ent.lastName) return 'E';
    return ((ent.firstName?.[0] || '') + (ent.lastName?.[0] || '')).toUpperCase();
  }
}
