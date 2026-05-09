import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
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
    <div class="my-entrepreneurs-premium">
      <!-- Header Section -->
      <div class="list-header">
        <div class="header-titles">
          <h1>Mes Entrepreneurs</h1>
          <p class="sub-count">{{ filteredEntrepreneurs.length }} entrepreneurs assignés</p>
        </div>
        
        <div class="header-search">
          <div class="search-input-wrap">
            <input type="text" 
                   [(ngModel)]="searchTerm" 
                   (input)="filterItems()" 
                   placeholder="Rechercher un entrepreneur" />
            <i class="pi pi-search"></i>
          </div>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="filters-row">
        <div class="filter-group">
          <label>Filtrer par programme</label>
          <select [(ngModel)]="selectedProgram" (change)="filterItems()" class="premium-select">
            <option value="">Tous les programmes</option>
            <option *ngFor="let prog of programs" [value]="prog">{{ prog }}</option>
          </select>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && filteredEntrepreneurs.length === 0" class="empty-state-large">
        <div class="empty-icon-circle">👥</div>
        <h3>Aucun entrepreneur assigné</h3>
        <p>Contactez l'admin pour obtenir des affectations</p>
      </div>

      <!-- Grid Layout -->
      <div *ngIf="!isLoading" class="entrepreneurs-grid">
        <div *ngFor="let ent of filteredEntrepreneurs" 
             class="ent-card-premium" 
             (click)="goToDetail(ent.id)">
          
          <div class="card-main-content">
            <div class="card-top">
              <div class="ent-avatar-premium" [style.background]="getAvatarGradient(ent)">
                {{ getInitials(ent) }}
              </div>
              
              <div class="badges-stack">
                <div *ngIf="(ent.delayedTasksCount || 0) > 0" class="retard-pill">
                  <i class="pi pi-exclamation-triangle"></i>
                  {{ ent.delayedTasksCount }} retard{{ (ent.delayedTasksCount || 0) > 1 ? 's' : '' }}
                </div>
                <span class="stage-pill" [style.background]="getStageStyles(ent.secteur).bg" [style.color]="getStageStyles(ent.secteur).color">
                  {{ ent.secteur || 'MVP' }}
                </span>
              </div>
            </div>

            <div class="ent-info">
              <h3 class="ent-name">{{ ent.firstName }} {{ ent.lastName }}</h3>
              <p class="ent-startup">{{ ent.entreprise || 'Startup non spécifiée' }}</p>
              <p class="ent-sector">{{ ent.secteur || 'Secteur non renseigné' }}</p>
            </div>
          </div>

          <!-- Progress Section -->
          <div class="card-progress-section">
            <div class="progress-labels">
              <span>Progression globale</span>
              <span class="pct-value" [style.color]="getProgressColor(ent.completionRate || 0)">
                {{ ent.completionRate || 0 }}%
              </span>
            </div>
            <div class="p-bar-container">
              <div class="p-bar-fill" 
                   [style.width.%]="ent.completionRate || 0"
                   [style.background]="getProgressGradient(ent.completionRate || 0)">
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="card-footer-minimal">
            <span>Voir le détail</span>
            <i class="pi pi-chevron-right"></i>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-grid">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Chargement de vos entrepreneurs...</span>
      </div>
    </div>
  `,
  styles: [`
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

    /* --- My Entrepreneurs Premium Style --- */
    .my-entrepreneurs-premium { padding: 2rem 4rem; background: #fcfdfe; min-height: 100vh; font-family: var(--font-family); }
    
    .list-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
    .header-titles h1 { font-size: 28px; font-weight: 800; color: #000; margin: 0; }
    .sub-count { color: #8a8a8a; font-size: 14px; margin-top: 4px; font-weight: 500; }
    
    .search-input-wrap { position: relative; }
    .search-input-wrap input { padding: 0.75rem 1.25rem 0.75rem 2.5rem; border: 1px solid #e2e8f0; border-radius: 100px; width: 300px; outline: none; transition: all 0.2s; font-size: 0.9rem; }
    .search-input-wrap input:focus { border-color: #ff3d91; box-shadow: 0 0 0 3px rgba(255, 61, 145, 0.1); }
    .search-input-wrap i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.9rem; }

    .filters-row { margin-bottom: 2rem; }
    .filter-group label { display: block; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 0.5rem; }
    .premium-select { width: 100%; max-width: 320px; padding: 0.7rem 1.25rem; border-radius: 16px; border: 1px solid #e2e8f0; background: white; outline: none; font-size: 0.9rem; font-weight: 600; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.04); cursor: pointer; }
    .premium-select:focus { border-color: #ff3d91; }

    .entrepreneurs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
    
    .ent-card-premium { background: white; border-radius: 24px; overflow: hidden; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.02); }
    .ent-card-premium:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
    .ent-card-premium:hover .ent-name { color: #ff3d91; }

    .card-main-content { padding: 1.5rem; }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
    
    .ent-avatar-premium { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem; font-weight: 900; }
    
    .badges-stack { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; }
    .retard-pill { background: #fee2e2; color: #dc2626; padding: 0.2rem 0.6rem; border-radius: 100px; font-size: 0.65rem; font-weight: 800; display: flex; align-items: center; gap: 0.3rem; text-transform: uppercase; }
    .stage-pill { padding: 0.2rem 0.75rem; border-radius: 100px; font-size: 0.7rem; font-weight: 700; }

    .ent-info .ent-name { font-size: 1.15rem; font-weight: 800; color: #1e293b; margin: 0 0 0.2rem; transition: color 0.2s; }
    .ent-info .ent-startup { font-size: 0.95rem; color: #64748b; font-weight: 600; margin: 0; }
    .ent-info .ent-sector { font-size: 0.8rem; color: #94a3b8; margin: 0.2rem 0 0; }

    .card-progress-section { padding: 0 1.5rem 1.5rem; }
    .progress-labels { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.5rem; }
    .p-bar-container { height: 10px; background: #f1f5f9; border-radius: 100px; overflow: hidden; }
    .p-bar-fill { height: 100%; border-radius: 100px; transition: width 1s ease-out; }

    .card-footer-minimal { padding: 0.75rem 1.5rem; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; color: #64748b; font-size: 0.75rem; font-weight: 700; transition: background 0.2s; }
    .ent-card-premium:hover .card-footer-minimal { background: #f1f5f9; }
    .ent-card-premium:hover .pi-chevron-right { color: #ff3d91; transform: translateX(3px); }
    .pi-chevron-right { font-size: 0.7rem; transition: all 0.2s; }

    .empty-state-large { text-align: center; padding: 6rem 2rem; }
    .empty-icon-circle { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state-large h3 { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
    .empty-state-large p { color: #94a3b8; }

    .loading-grid { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8rem; color: #64748b; gap: 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class CoachEntrepreneursComponent implements OnInit {
  isLoading: boolean = false;
  searchTerm: string = '';
  selectedProgram: string = '';
  entrepreneurs: CoachEntrepreneurDTO[] = [];
  filteredEntrepreneurs: CoachEntrepreneurDTO[] = [];
  programs: string[] = [];

  constructor(
    private coachService: CoachService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEntrepreneurs();
  }

  loadEntrepreneurs() {
    const rawCoachId = this.authService.getUserId();
    const coachId = typeof rawCoachId === 'string' ? parseInt(rawCoachId, 10) : rawCoachId;

    if (!coachId) return;

    this.isLoading = true;
    this.coachService.getCoachEntrepreneurs(coachId).subscribe({
      next: (data) => {
        this.entrepreneurs = data;
        this.filteredEntrepreneurs = [...data];
        this.programs = [
          ...new Set(
            data
              .map(e => e.programName)
              .filter((s): s is string => typeof s === 'string' && s.trim() !== ''),
          ),
        ];
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  filterItems() {
    let result = [...this.entrepreneurs];
    
    if (this.selectedProgram) {
      result = result.filter(e => e.programName === this.selectedProgram);
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

  goToDetail(id: number) {
    this.router.navigate(['/coach-entrepreneurs', id]);
  }

  getCountBySector(sector: string): number {
    return this.entrepreneurs.filter(e => e.secteur === sector).length;
  }

  getAvatarGradient(ent: CoachEntrepreneurDTO): string {
    return 'linear-gradient(135deg, #1A3A3A, #C0392B)';
  }

  getStageStyles(stage: string | undefined): { bg: string; color: string } {
    const s = stage || 'MVP';
    const stageColors: Record<string, { bg: string; color: string }> = {
      "Pre-Seed": { bg: "#FEF3C7", color: "#D97706" },
      "Seed": { bg: "#DBEAFE", color: "#2563EB" },
      "MVP": { bg: "#F3E8FF", color: "#7C3AED" },
      "Series A": { bg: "#D1FAE5", color: "#059669" },
    };
    return stageColors[s] || { bg: "#f1f5f9", color: "#64748b" };
  }

  getProgressColor(progress: number): string {
    if (progress >= 70) return '#059669';
    if (progress >= 40) return '#D97706';
    return '#DC2626';
  }

  getProgressGradient(progress: number): string {
    if (progress >= 70) return 'linear-gradient(90deg, #059669, #10B981)';
    if (progress >= 40) return 'linear-gradient(90deg, #D97706, #F59E0B)';
    return 'linear-gradient(90deg, #DC2626, #EF4444)';
  }

  getInitials(ent: CoachEntrepreneurDTO): string {
    if (!ent.firstName && !ent.lastName) return 'E';
    return ((ent.firstName?.[0] || '') + (ent.lastName?.[0] || '')).toUpperCase();
  }
}
