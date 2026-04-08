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
      <div class="page-header">
          <div>
              <h1>Mes Entrepreneurs</h1>
              <p>Consultez et suivez l'avancement de vos programmes</p>
          </div>
          <div class="search-bar">
              <i class="pi pi-search"></i>
              <input type="text" placeholder="Rechercher un entrepreneur, projet..." [(ngModel)]="searchTerm" (ngModelChange)="filterEntrepreneurs()" />
          </div>
      </div>

      <!-- Filters -->
      <div class="filters">
          <button class="filter-pill" [class.active]="activeFilter === 'all'" (click)="setFilter('all')">Tous ({{entrepreneurs.length}})</button>
          <button *ngFor="let sector of sectors" class="filter-pill" [class.active]="activeFilter === sector" (click)="setFilter(sector)">
              {{sector}} ({{getCountBySector(sector)}})
          </button>
      </div>

      <div class="grid-cards">
          <div *ngFor="let ent of filteredEntrepreneurs" class="entrepreneur-card">
              <div class="card-header">
                  <div class="avatar-container">
                      <div class="avatar pink-avatar">{{getInitials(ent)}}</div>
                  </div>
              </div>
              <div class="card-body">
                  <div class="program-type">{{ent.secteur || 'N/A'}}</div>
                  <h3>{{ent.firstName}} {{ent.lastName}}</h3>
                  <div class="startup-name">{{ent.entreprise || 'Pas d\\'entreprise'}}</div>
                  
                  <div class="progress-section mb-4">
                      <div class="flex justify-between text-xs mb-1">
                          <span>Progression</span>
                          <span>{{ent.completionRate || 0}}%</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-1.5">
                          <div class="bg-pink-500 h-1.5 rounded-full" [style.width.%]="ent.completionRate || 0"></div>
                      </div>
                  </div>

                  <div *ngIf="ent.delayedTasksCount && ent.delayedTasksCount > 0" class="text-xs text-red-500 font-bold mb-2">
                      <i class="pi pi-exclamation-circle"></i> {{ ent.delayedTasksCount }} tâches en retard
                  </div>
              </div>
              <div class="card-footer">
                  <a [routerLink]="['/coach-entrepreneurs', ent.id]" class="btn-secondary w-full">Voir profil complet</a>
              </div>
          </div>
          <div *ngIf="filteredEntrepreneurs.length === 0 && !loading" class="empty-state">
              <i class="pi pi-users" style="font-size: 2rem; color: #CBD5E0;"></i>
              <p>Aucun entrepreneur trouvé.</p>
          </div>
      </div>

      <div *ngIf="loading" class="loading-overlay">
          <div class="spinner"></div>
      </div>
    </div>
  `,
  styles: [`
    .entrepreneurs-page { padding: 2rem; background: #f8f9fa; min-height: calc(100vh - 70px); font-family: var(--font-family); margin-top: -1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 2.2rem; font-weight: 700; color: #2D3748; margin: 0; }
    .page-header p { color: #718096; font-size: 1.1rem; margin-top: 0.5rem; }
    .search-bar { position: relative; width: 350px; }
    .search-bar input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.8rem; border-radius: 12px; border: 1px solid #E2E8F0; background: white; font-family: inherit; font-size: 0.95rem; outline: none; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .search-bar input:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); }
    .search-bar i { position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); color: #A0AEC0; }
    .filters { display: flex; gap: 0.8rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .filter-pill { background: white; border: 1px solid #E2E8F0; padding: 0.6rem 1.2rem; border-radius: 20px; font-weight: 500; color: #4A5568; cursor: pointer; transition: all 0.2s; }
    .filter-pill.active { background: #1A365D; color: white; border-color: #1A365D; }
    .grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
    .entrepreneur-card { background: white; border-radius: 1.5rem; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.04); border: 1px solid #EDF2F7; transition: transform 0.2s, box-shadow 0.2s; display: flex; flex-direction: column; }
    .entrepreneur-card:hover { transform: translateY(-4px); box-shadow: 0 12px 25px rgba(0,0,0,0.08); }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .avatar { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; color: white; }
    .pink-avatar { background: linear-gradient(135deg, #FF6B9E, #FF3366); }
    .btn-more { background: none; border: none; color: #A0AEC0; cursor: pointer; padding: 0.5rem; border-radius: 50%; }
    .btn-more:hover { background: #F7FAFC; color: #4A5568; }
    .program-type { font-size: 0.75rem; font-weight: 700; color: #A0AEC0; letter-spacing: 1px; margin-bottom: 0.3rem; text-transform: uppercase; }
    .card-body h3 { margin: 0; font-size: 1.3rem; color: #2D3748; font-weight: 700; }
    .startup-name { color: #FF4D85; font-weight: 600; font-size: 0.95rem; margin-bottom: 1.2rem; }
    .card-footer { margin-top: auto; }
    .btn-secondary { display: block; text-align: center; text-decoration: none; background: white; border: 1px solid #E2E8F0; color: #4A5568; padding: 0.8rem; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-secondary:hover { background: #F8FAFC; border-color: #CBD5E0; color: #2D3748; }
    .empty-state { text-align: center; padding: 3rem; color: #A0AEC0; grid-column: 1 / -1; }
    .loading-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.7); z-index: 999; display: flex; align-items: center; justify-content: center; }
    .spinner { width: 40px; height: 40px; border: 4px solid #EDF2F7; border-top-color: #FF4D85; border-radius: 50%; animation: spin 0.8s linear infinite; }
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

  getInitials(ent: CoachEntrepreneurDTO): string {
    return (ent.firstName?.charAt(0) || '') + (ent.lastName?.charAt(0) || '');
  }
}
