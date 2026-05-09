import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachService, SeanceExceptionnelleDTO, CoachEntrepreneurDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-coach-seance-exceptionnelle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cand-page">
      <!-- PAGE HEADER -->
      <div class="cand-header">
          <div>
              <h1 class="cand-title">Séances Exceptionnelles</h1>
              <p class="cand-subtitle">Programmez des séances hors-disponibilités habituelles</p>
          </div>
          <div class="cand-header-actions">
              <button class="add-event-btn" (click)="showModal = true" style="background: #ea5073; color: white; padding: 10px 24px; border-radius: 12px; font-weight: 500; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(234, 80, 115, 0.3);">
                  <i class="pi pi-plus" style="margin-right: 8px;"></i> Planifier une séance
              </button>
          </div>
      </div>

      <!-- SEARCH & FILTERS -->
      <div class="cand-filters">
          <div class="filter-selects" style="flex: 1; display: flex; gap: 12px;">
            <select [(ngModel)]="activeFilter" (ngModelChange)="setFilter(activeFilter)" class="filter-select">
                <option value="all">Toutes ({{ seances.length }})</option>
                <option value="upcoming">À venir ({{ getUpcomingCount() }})</option>
                <option value="past">Terminées ({{ getPastCount() }})</option>
            </select>
          </div>
      </div>

      <!-- SESSIONS TABLE -->
      @if (filteredSeances.length > 0) {
        <div class="table-card">
          <div class="table-scroll">
            <table class="cand-table">
              <thead>
                <tr>
                  <th>Entrepreneur</th>
                  <th>Titre de la Séance</th>
                  <th>Dates & Horaires</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <ng-container *ngFor="let s of filteredSeances">
                  <tr class="table-row">
                    <td>
                      <div class="name-cell">
                        <span class="name-text">{{ s.entrepreneurName || 'N/A' }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="name-cell">
                        <span class="name-text">{{ s.titre }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="date-cell-custom">
                        <div class="mini-date-badge">
                           {{ s.dateSeance | date:'dd/MM/yyyy' }} &#64; {{ s.heureDebut.substring(0,5) }} - {{ s.heureFin.substring(0,5) }}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="status-badge" [class.upcoming]="isUpcoming(s)" [class.past]="!isUpcoming(s)">
                        <i class="pi" [class.pi-calendar-clock]="isUpcoming(s)" [class.pi-check-circle]="!isUpcoming(s)"></i>
                        {{ isUpcoming(s) ? 'À venir' : 'Terminée' }}
                      </div>
                    </td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
          </div>
        </div>
      } @else if (!loading) {
        <div class="empty-state">
          <i class="pi pi-calendar-times" style="font-size: 3rem; color: #D1D5DB; margin-bottom: 1rem; display: block;"></i>
          <p class="empty-text">Aucune séance trouvée</p>
          <p class="empty-sub">Ajustez vos filtres ou créez de nouvelles séances.</p>
        </div>
      }

      <!-- Modal: Planifier une séance -->
      <div *ngIf="showModal" class="modal-overlay" (click)="showModal = false">
          <div class="modal-box" (click)="$event.stopPropagation()">
              <div class="modal-header">
                  <div class="modal-header-info">
                      <h2 class="modal-name">Planifier une séance exceptionnelle</h2>
                      <p class="modal-subtitle">En dehors de vos disponibilités habituelles</p>
                  </div>
                  <button class="modal-close" (click)="showModal = false"><i class="pi pi-times"></i></button>
              </div>
              <div class="modal-body">
                  <div class="form-group" style="margin-bottom: 12px;">
                      <label style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block;">Thématique *</label>
                      <select class="search-input" [(ngModel)]="newSeance.thematiqueId" style="padding: 10px 16px;">
                          <option [ngValue]="undefined">Sélectionnez une thématique...</option>
                          <option *ngFor="let t of thematiques" [ngValue]="t.id">{{ t.nom }}</option>
                      </select>
                  </div>
                  <div class="form-group" style="margin-bottom: 12px;">
                      <label style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block;">Titre de la séance *</label>
                      <input type="text" class="search-input" [(ngModel)]="newSeance.titre" placeholder="Ex: Point stratégique exceptionnel" style="padding: 10px 16px;">
                  </div>
                  <div class="form-group" style="margin-bottom: 12px;">
                      <label style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block;">Entrepreneur *</label>
                      <select class="search-input" [(ngModel)]="newSeance.entrepreneurId" style="padding: 10px 16px;">
                          <option [ngValue]="0">Sélectionnez un entrepreneur...</option>
                          <option *ngFor="let e of entrepreneurs" [ngValue]="e.id">{{ e.firstName }} {{ e.lastName }} — {{ e.entreprise || 'N/A' }}</option>
                      </select>
                  </div>
                  <div class="form-row" style="display: flex; gap: 12px; margin-bottom: 12px;">
                      <div class="form-group" style="flex: 1;">
                          <label style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block;">Date *</label>
                          <input type="date" class="search-input" [(ngModel)]="newSeance.dateSeance" style="padding: 10px 16px;">
                      </div>
                      <div class="form-group" style="flex: 1;">
                          <label style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block;">Début *</label>
                          <input type="time" class="search-input" [(ngModel)]="newSeance.heureDebut" style="padding: 10px 16px;">
                      </div>
                      <div class="form-group" style="flex: 1;">
                          <label style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block;">Fin *</label>
                          <input type="time" class="search-input" [(ngModel)]="newSeance.heureFin" style="padding: 10px 16px;">
                      </div>
                  </div>
                  <div *ngIf="modalError" style="color: #E53E3E; background: #FFF5F5; padding: 10px; border-radius: 8px; font-size: 13px; margin-top: 12px;">
                      <i class="pi pi-exclamation-triangle"></i> {{ modalError }}
                  </div>
              </div>
              <div class="modal-footer">
                  <button class="btn-close-modal" (click)="showModal = false" style="margin-right: 12px;">Annuler</button>
                  <button class="btn-detail" (click)="submit()" [disabled]="saving" style="background: #ea5073; color: white;">
                      <i class="pi" [class.pi-check]="!saving" [class.pi-spin]="saving" [class.pi-spinner]="saving" style="margin-right: 6px;"></i>
                      {{ saving ? 'Planification...' : 'Planifier' }}
                  </button>
              </div>
          </div>
      </div>

      <!-- Main Loading Overlay -->
      <div *ngIf="loading" class="modal-overlay" style="background: rgba(255,255,255,0.7)">
          <div class="spinner"></div>
      </div>
    </div>
  `,
  styles: [`
    .cand-page { padding: 24px; background: #F5F6FA; min-height: 100vh; position: relative; }
    .cand-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .cand-title { font-size: 28px; font-weight: 800; color: #1A1A2E; margin: 0; }
    .cand-subtitle { color: #8a8a8a; font-size: 14px; margin-top: 4px; }
    .cand-count-badge { background: #E2E8F0; color: #4A5568; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    
    .cand-filters { display: flex; align-items: stretch; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .search-input { width: 100%; border: 1px solid #E5E7EB; border-radius: 12px; font-size: 14px; outline: none; color: #333; transition: border-color .2s; background: #fff; box-sizing: border-box; }
    .filter-select { padding: 10px 14px; border: 1px solid #E5E7EB; border-radius: 12px; font-size: 13px; outline: none; color: #333; cursor: pointer; background: #fff; }

    .table-card { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
    .cand-table { width: 100%; border-collapse: collapse; text-align: left; }
    .cand-table th { padding: 12px 16px; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; background: #F9FAFB; border-bottom: 1px solid #F3F4F6; }
    .cand-table td { padding: 14px 16px; border-bottom: 1px solid #F3F4F6; }
    .table-row:hover { background: #FFF5F8; }

    .name-cell { display: flex; flex-direction: column; }
    .name-text { font-weight: 700; font-size: 14px; color: #1A1A2E; }
    
    .mini-date-badge { display: inline-block; background: #F3F4F6; color: #4A5568; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; margin-right: 4px; margin-bottom: 4px; }
    
    .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
    .status-badge.upcoming { background: #D1FAE5; color: #065F46; }
    .status-badge.past { background: #F3F4F6; color: #9CA3AF; }

    .empty-state { text-align: center; padding: 60px 20px; background: #fff; border-radius: 20px; }
    .empty-text { font-weight: 700; font-size: 16px; color: #4A5568; }
    .empty-sub { font-size: 13px; color: #9CA3AF; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
    .modal-box { background: white; border-radius: 24px; width: 100%; max-width: 600px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.15); }
    .modal-header { padding: 24px; border-bottom: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center; }
    .modal-header-info { flex: 1; }
    .modal-name { font-size: 20px; font-weight: 800; color: #1E293B; margin: 0 0 8px; }
    .modal-subtitle { font-size: 13px; color: #64748B; margin: 0; }
    .modal-close { background: #F8FAFC; border: none; width: 36px; height: 36px; border-radius: 12px; cursor: pointer; color: #64748B; }
    
    .modal-body { padding: 24px; overflow-y: auto; }
    
    .modal-footer { padding: 20px 24px; border-top: 1px solid #F1F5F9; display: flex; justify-content: flex-end; }
    .btn-close-modal { padding: 10px 24px; border-radius: 12px; background: #F1F5F9; border: none; font-weight: 700; color: #475569; cursor: pointer; }
    .btn-detail { padding: 10px 24px; border-radius: 12px; font-size: 13px; font-weight: 700; color: #ea5073; border: 1px solid #ea5073; background: transparent; cursor: pointer; transition: all .2s; }
    .btn-detail:hover { opacity: 0.9; }

    .spinner { width: 40px; height: 40px; border: 4px solid #F1F5F9; border-top-color: #ea5073; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SeanceExceptionnelleComponent implements OnInit {
  coachId!: number;
  entrepreneurs: CoachEntrepreneurDTO[] = [];
  thematiques: any[] = [];
  seances: SeanceExceptionnelleDTO[] = [];
  filteredSeances: SeanceExceptionnelleDTO[] = [];
  loading = false;
  saving = false;
  showModal = false;
  activeFilter = 'all';
  modalError: string | null = null;

  newSeance: SeanceExceptionnelleDTO = {
    coachId: 0,
    entrepreneurId: 0,
    thematiqueId: undefined,
    titre: '',
    dateSeance: '',
    heureDebut: '',
    heureFin: ''
  };

  private avatarColors = ['#FF4D85', '#4299E1', '#48BB78', '#805AD5', '#ED8936', '#38B2AC', '#2D3748'];

  constructor(
      private coachService: CoachService,
      private authService: AuthService,
      private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const rawCoachId = this.authService.getUserId();
    this.coachId = typeof rawCoachId === 'string' ? parseInt(rawCoachId, 10) : (rawCoachId ?? 0);
    this.newSeance.coachId = this.coachId;

    this.loadEntrepreneurs();
    this.loadThematiques();
    this.loadSeances();
  }

  loadThematiques() {
      this.coachService.getThematiquesAssignedToCoach(this.coachId).subscribe({
          next: (data) => this.thematiques = data,
          error: () => console.error('Erreur chargement thematiques')
      });
  }

  loadEntrepreneurs() {
      this.coachService.getCoachEntrepreneurs(this.coachId).subscribe({
          next: (data) => this.entrepreneurs = data,
          error: () => console.error('Erreur chargement entrepreneurs')
      });
  }

  loadSeances() {
      this.loading = true;
      this.coachService.getSeancesExceptionnelles(this.coachId).subscribe({
          next: (data) => { this.seances = data; this.filteredSeances = [...data]; this.loading = false; },
          error: () => { this.loading = false; this.toastr.error('Erreur chargement'); }
      });
  }

  setFilter(filter: string) {
      this.activeFilter = filter;
      if (filter === 'all') { this.filteredSeances = [...this.seances]; }
      else if (filter === 'upcoming') { this.filteredSeances = this.seances.filter(s => this.isUpcoming(s)); }
      else { this.filteredSeances = this.seances.filter(s => !this.isUpcoming(s)); }
  }

  isUpcoming(s: any): boolean {
      if (!s.dateSeance || !s.heureFin) return false;
      const sessionEnd = new Date(s.dateSeance + 'T' + s.heureFin);
      return sessionEnd.getTime() > new Date().getTime();
  }

  getUpcomingCount(): number { return this.seances.filter(s => this.isUpcoming(s)).length; }
  getPastCount(): number { return this.seances.filter(s => !this.isUpcoming(s)).length; }

  getInitials(name: string): string {
      return name.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  }

  getAvatarColor(name: string): string {
      const hash = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return this.avatarColors[hash % this.avatarColors.length];
  }

  submit() {
      this.modalError = null;
      if (!this.newSeance.thematiqueId) {
          this.modalError = 'Veuillez sélectionner une thématique.'; return;
      }
      if (!this.newSeance.titre) { this.modalError = 'Le titre est requis.'; return; }
      if (!this.newSeance.entrepreneurId || this.newSeance.entrepreneurId === 0) {
          this.modalError = 'Veuillez sélectionner un entrepreneur.'; return;
      }
      if (!this.newSeance.dateSeance) { this.modalError = 'La date est requise.'; return; }
      if (!this.newSeance.heureDebut || !this.newSeance.heureFin) { this.modalError = 'Les heures sont requises.'; return; }
      if (this.newSeance.heureDebut >= this.newSeance.heureFin) {
          this.modalError = "L'heure de début doit être avant l'heure de fin."; return;
      }

      this.saving = true;
      this.coachService.addSeanceExceptionnelle(this.coachId, this.newSeance.entrepreneurId, this.newSeance).subscribe({
          next: (data) => {
              this.toastr.success('Séance exceptionnelle planifiée !');
              this.seances.push(data);
              this.setFilter(this.activeFilter);
              this.newSeance = { coachId: this.coachId, entrepreneurId: 0, thematiqueId: undefined, titre: '', dateSeance: '', heureDebut: '', heureFin: '' };
              this.showModal = false;
              this.saving = false;
          },
          error: () => { this.modalError = 'Erreur lors de la planification.'; this.saving = false; }
      });
  }
}
