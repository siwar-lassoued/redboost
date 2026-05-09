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
          <h1 class="page-title">Mes Entrepreneurs</h1>
          <p class="page-subtitle">Suivez l'avancement et accompagnez vos entrepreneurs vers le succès</p>
        </div>
        <div class="header-actions">
           <div class="search-wrap premium-card">
              <i class="pi pi-search"></i>
              <input type="text" placeholder="Rechercher un entrepreneur, une entreprise..." [(ngModel)]="searchTerm" (ngModelChange)="filterEntrepreneurs()" />
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
          {{sector}} ({{getCountBySector(sector)}})
        </button>
      </div>

      @if (loading) {
        <div class="loading-state">
           <div class="premium-spinner"></div>
        </div>
      } @else {
        <!-- Grid -->
        <div class="entrepreneurs-grid" *ngIf="filteredEntrepreneurs.length > 0">
          <div *ngFor="let ent of filteredEntrepreneurs" class="ent-card premium-card">
            <div class="card-top">
               <div class="stage-badge" [style.background]="getStageColor(ent.secteur || 'MVP').bg" [style.color]="getStageColor(ent.secteur || 'MVP').color">
                 {{ ent.secteur || 'MVP' }}
               </div>
               <div class="ent-avatar-wrap">
                  <div class="ent-avatar" [style.background]="getAvatarGradient(ent)">
                    {{ getInitials(ent) }}
                  </div>
               </div>
            </div>

            <div class="card-info">
              <h3 class="ent-name">{{ ent.firstName }} {{ ent.lastName }}</h3>
              <p class="ent-company">{{ ent.entreprise || 'Startup en création' }}</p>
              
              <div class="progress-section">
                <div class="progress-meta">
                  <span class="p-label">Progression du programme</span>
                  <span class="p-value">{{ ent.completionRate || 0 }}%</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" [style.width.%]="ent.completionRate || 0"></div>
                </div>
              </div>

              <div class="stats-row">
                 <div class="stat-item" [class.warning]="ent.delayedTasksCount > 0">
                   <i class="pi pi-calendar"></i>
                   <span>{{ ent.delayedTasksCount || 0 }} Retards</span>
                 </div>
                 <div class="stat-item">
                   <i class="pi pi-check-circle"></i>
                   <span>{{ ent.completedTasksCount || 0 }} Tâches</span>
                 </div>
              </div>
            </div>

            <div class="card-footer">
              <a [routerLink]="['/coach-entrepreneurs', ent.id]" class="btn-profile">
                Consulter le profil
                <i class="pi pi-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div class="empty-results" *ngIf="filteredEntrepreneurs.length === 0">
          <div class="empty-icon-wrap">
            <i class="pi pi-users"></i>
          </div>
          <h3>Aucun entrepreneur</h3>
          <p>Affinez vos critères de recherche pour trouver vos entrepreneurs.</p>
        </div>
      }
    </div>

  `,
  styles: [`
    .entrepreneurs-page { padding: 2.5rem; background: #f8fafc; min-height: 100vh; font-family: var(--font-family, sans-serif); }
    
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 1.5rem; }
    .page-title { font-size: 2.5rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.025em; }
    .page-subtitle { color: #64748b; font-size: 1.1rem; margin-top: 0.5rem; }
    
    .search-wrap { position: relative; background: white; border-radius: 20px; width: 340px; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
    .search-wrap input { width: 100%; padding: 1rem 1rem 1rem 3.5rem; border: none; background: transparent; font-size: 0.95rem; outline: none; }
    .search-wrap i { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }

    .filters-scroll { display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 1.5rem; scrollbar-width: none; }
    .filter-pill { padding: 0.7rem 1.5rem; border-radius: 14px; background: white; border: 1px solid #f1f5f9; color: #64748b; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.3s; white-space: nowrap; }
    .filter-pill.active { background: #1e293b; color: white; border-color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

    .entrepreneurs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
    .ent-card { background: white; border-radius: 32px; border: 1px solid #f1f5f9; overflow: hidden; transition: all 0.4s; display: flex; flex-direction: column; }
    .ent-card:hover { transform: translateY(-8px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }

    .card-top { padding: 1.75rem; display: flex; justify-content: space-between; align-items: flex-start; }
    .stage-badge { padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
    .ent-avatar { width: 64px; height: 64px; border-radius: 22px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; color: white; box-shadow: inset 0 -4px 0 rgba(0,0,0,0.1); }

    .card-info { padding: 0 1.75rem 1.75rem; flex: 1; }
    .ent-name { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin: 0; }
    .ent-company { font-size: 0.95rem; font-weight: 600; color: #3b82f6; margin: 0.25rem 0 1.5rem; }

    .progress-section { margin-bottom: 1.5rem; }
    .progress-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .p-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .p-value { font-size: 0.85rem; font-weight: 800; color: #1e293b; }
    .progress-bar-bg { height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
    .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #6366f1); border-radius: 10px; }

    .stats-row { display: flex; gap: 1rem; }
    .stat-item { flex: 1; display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; border-radius: 16px; background: #f8fafc; border: 1px solid #f1f5f9; }
    .stat-item i { font-size: 0.9rem; color: #94a3b8; }
    .stat-item span { font-size: 0.8rem; font-weight: 700; color: #475569; }
    .stat-item.warning { background: #fffbeb; border-color: #fef3c7; }
    .stat-item.warning i, .stat-item.warning span { color: #d97706; }

    .card-footer { padding: 1.5rem 1.75rem; border-top: 1px solid #f1f5f9; background: #fcfdfe; }
    .btn-profile { width: 100%; padding: 0.85rem; border-radius: 16px; background: white; border: 1px solid #e2e8f0; color: #1e293b; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.75rem; transition: all 0.2s; text-decoration: none; }
    .btn-profile:hover { background: #1e293b; color: white; border-color: #1e293b; }

    .empty-results { text-align: center; padding: 5rem 2rem; background: white; border-radius: 40px; border: 2px dashed #e2e8f0; max-width: 600px; margin: 2rem auto; }
    .empty-icon-wrap { width: 100px; height: 100px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 2.5rem; color: #cbd5e1; }
    .empty-results h3 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
    .empty-results p { color: #94a3b8; }

    .loading-state { padding: 5rem 0; text-align: center; }
    .premium-spinner { width: 50px; height: 50px; border: 5px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
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
}
