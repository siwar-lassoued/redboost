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
    <div class="ent-page-container">

      <!-- Page Title -->
      <div class="page-top-bar">
        <div>
          <h1 class="page-heading">Mes Entrepreneurs</h1>
          <p class="page-sub">{{ filteredEntrepreneurs.length }} entrepreneurs assignés</p>
        </div>
        <div class="search-wrap">
          <i class="pi pi-search"></i>
          <input type="text"
                 [(ngModel)]="searchTerm"
                 (input)="filterItems()"
                 placeholder="Rechercher un entrepreneur..." />
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <select [(ngModel)]="selectedProgram" (change)="filterItems()" class="filter-select">
          <option value="">Tous les programmes</option>
          <option *ngFor="let prog of programs" [value]="prog">{{ prog }}</option>
        </select>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="loading-wrap">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Chargement...</span>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && filteredEntrepreneurs.length === 0" class="empty-wrap">
        <i class="pi pi-users empty-icon"></i>
        <h3>Aucun entrepreneur assigné</h3>
        <p>Contactez l'administrateur pour obtenir des affectations</p>
      </div>

      <!-- Cards Grid -->
      <div *ngIf="!isLoading && filteredEntrepreneurs.length > 0" class="cards-grid">
        <div *ngFor="let ent of filteredEntrepreneurs"
             class="profile-card"
             (click)="goToDetail(ent.id)">

          <!-- Banner (like profile header-bg) -->
          <div class="card-banner"></div>

          <!-- Card Body -->
          <div class="card-body-wrap">
            <!-- Avatar (like profile-img-container) -->
            <div class="card-avatar-wrap">
              <div class="card-avatar" [style.background]="getAvatarGradient(ent)">
                {{ getInitials(ent) }}
                <span class="online-dot"></span>
              </div>
            </div>

            <!-- Info -->
            <div class="card-info">
              <div class="card-name-row">
                <h3 class="card-name">{{ ent.firstName }} {{ ent.lastName }}</h3>
                <span class="card-badge"
                      [style.background]="getStageStyles(ent.secteur).bg"
                      [style.color]="getStageStyles(ent.secteur).color">
                  {{ ent.secteur || 'NON SPÉCIFIÉ' }}
                </span>
              </div>

              <p class="card-startup">
                <i class="pi pi-building"></i>
                {{ ent.entreprise || 'Startup non spécifiée' }}
              </p>

              <div class="card-chips-row">
                <div class="card-chip">
                  <i class="pi pi-chart-line"></i>
                  <span>{{ ent.completionRate || 0 }}% avancement</span>
                </div>
                <div *ngIf="(ent.delayedTasksCount || 0) > 0" class="card-chip chip-alert">
                  <i class="pi pi-exclamation-triangle"></i>
                  <span>{{ ent.delayedTasksCount }} retard{{ (ent.delayedTasksCount || 0) > 1 ? 's' : '' }}</span>
                </div>
                <div class="card-action-chip">
                  <i class="pi pi-arrow-right"></i>
                  Voir le profil
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="card-progress-wrap">
                <div class="card-progress-track">
                  <div class="card-progress-fill"
                       [style.width.%]="ent.completionRate || 0"
                       [style.background]="getProgressGradient(ent.completionRate || 0)">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ---- Page Layout ---- */
    .ent-page-container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1.5rem;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
    }

    .page-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-heading {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .page-sub {
      color: #6b7280;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    /* ---- Search ---- */
    .search-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-wrap i {
      position: absolute;
      left: 1rem;
      color: #9ca3af;
      font-size: 0.9rem;
    }

    .search-wrap input {
      padding: 0.75rem 1.25rem 0.75rem 2.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 50px;
      width: 280px;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      background: white;
    }

    .search-wrap input:focus {
      border-color: #DC2626;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    /* ---- Filter Bar ---- */
    .filter-bar {
      margin-bottom: 2rem;
    }

    .filter-select {
      padding: 0.65rem 1.25rem;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #374151;
      background: white;
      outline: none;
      cursor: pointer;
      min-width: 280px;
      transition: border-color 0.2s;
    }

    .filter-select:focus {
      border-color: #DC2626;
    }

    /* ---- Cards Grid ---- */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.5rem;
    }

    /* ---- Profile Card (mirrors profile.component.scss) ---- */
    .profile-card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .profile-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    }

    /* Banner — identical gradient to profile header-bg */
    .card-banner {
      height: 100px;
      background: linear-gradient(135deg, #DC2626, #111827);
    }

    .card-body-wrap {
      display: flex;
      align-items: flex-start;
      padding: 0 1.5rem 1.5rem;
      gap: 1.25rem;
      margin-top: -40px;
    }

    /* Avatar — mirrors profile-img-container */
    .card-avatar-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .card-avatar {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      border: 5px solid #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      font-weight: 800;
      color: white;
      position: relative;
    }

    .online-dot {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 14px;
      height: 14px;
      background: #22c55e;
      border: 3px solid white;
      border-radius: 50%;
    }

    /* Info section */
    .card-info {
      flex: 1;
      padding-top: 48px;
      min-width: 0;
    }

    .card-name-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.3rem;
    }

    .card-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .profile-card:hover .card-name {
      color: #DC2626;
    }

    /* Badge — mirrors profile-badge */
    .card-badge {
      display: inline-block;
      padding: 0.2rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .card-startup {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: #6b7280;
      font-size: 0.85rem;
      font-weight: 500;
      margin: 0 0 0.75rem;
    }

    .card-startup i {
      font-size: 0.8rem;
      color: #DC2626;
    }

    /* Chips — mirrors contact-item */
    .card-chips-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }

    .card-chip {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.75rem;
      background: #f3f4f6;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #374151;
    }

    .card-chip i {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .chip-alert {
      background: #fef2f2;
      color: #dc2626;
    }

    .chip-alert i {
      color: #dc2626;
    }

    .card-action-chip {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.75rem;
      background: #111827;
      color: white;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      transition: background 0.2s;
    }

    .profile-card:hover .card-action-chip {
      background: #DC2626;
    }

    /* Progress Bar */
    .card-progress-wrap {
      margin-top: 0.5rem;
    }

    .card-progress-track {
      height: 6px;
      background: #f3f4f6;
      border-radius: 100px;
      overflow: hidden;
    }

    .card-progress-fill {
      height: 100%;
      border-radius: 100px;
      transition: width 1s ease-out;
    }

    /* ---- Loading & Empty ---- */
    .loading-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 6rem;
      color: #6b7280;
      font-size: 1rem;
    }

    .empty-wrap {
      text-align: center;
      padding: 6rem 2rem;
    }

    .empty-icon {
      font-size: 3rem;
      color: #d1d5db;
      margin-bottom: 1rem;
      display: block;
    }

    .empty-wrap h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .empty-wrap p {
      color: #9ca3af;
      font-size: 0.95rem;
    }

    /* ---- Responsive ---- */
    @media (max-width: 768px) {
      .page-top-bar { flex-direction: column; }
      .search-wrap input { width: 100%; }
      .cards-grid { grid-template-columns: 1fr; }
      .card-body-wrap { flex-direction: column; align-items: center; text-align: center; }
      .card-info { padding-top: 0.5rem; }
      .card-name-row { justify-content: center; }
      .card-chips-row { justify-content: center; }
      .card-action-chip { margin-left: 0; }
    }
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

  getAvatarGradient(ent: CoachEntrepreneurDTO): string {
    const gradients = [
      'linear-gradient(135deg, #DC2626, #7f1d1d)',
      'linear-gradient(135deg, #111827, #374151)',
      'linear-gradient(135deg, #1d4ed8, #1e40af)',
      'linear-gradient(135deg, #059669, #065f46)',
      'linear-gradient(135deg, #d97706, #92400e)',
    ];
    return gradients[(ent.id || 0) % gradients.length];
  }

  getStageStyles(stage: string | undefined): { bg: string; color: string } {
    const stageColors: Record<string, { bg: string; color: string }> = {
      'Pre-Seed': { bg: '#FEF3C7', color: '#D97706' },
      'Seed':     { bg: '#DBEAFE', color: '#2563EB' },
      'MVP':      { bg: '#F3E8FF', color: '#7C3AED' },
      'Series A': { bg: '#D1FAE5', color: '#059669' },
    };
    return stageColors[stage || ''] || { bg: 'rgba(220,38,38,0.1)', color: '#DC2626' };
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
