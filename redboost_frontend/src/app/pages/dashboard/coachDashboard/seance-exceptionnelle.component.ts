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
    <div class="seance-page">
      <!-- Page Header -->
      <div class="page-header">
          <div class="page-title-row">
              <div class="page-icon">🎯</div>
              <div>
                  <h1>Séances Exceptionnelles</h1>
                  <p>Programmez des séances hors-disponibilités habituelles</p>
              </div>
          </div>
          <button class="btn-primary shadow-glow" (click)="showModal = true">
              <i class="pi pi-plus"></i> Planifier une séance
          </button>
      </div>

      <!-- KPI Bar -->
      <div class="kpi-bar">
          <div class="kpi-item">
              <span class="kpi-value">{{ seances.length }}</span>
              <span class="kpi-label">Séances planifiées</span>
          </div>
          <div class="kpi-item">
              <span class="kpi-value">{{ getUpcomingCount() }}</span>
              <span class="kpi-label">À venir</span>
          </div>
          <div class="kpi-item">
              <span class="kpi-value">{{ getPastCount() }}</span>
              <span class="kpi-label">Terminées</span>
          </div>
      </div>

      <!-- Filter Pills -->
      <div class="filter-pills">
          <button class="pill" [class.active]="activeFilter === 'all'" (click)="setFilter('all')">Toutes ({{ seances.length }})</button>
          <button class="pill" [class.active]="activeFilter === 'upcoming'" (click)="setFilter('upcoming')">À venir ({{ getUpcomingCount() }})</button>
          <button class="pill" [class.active]="activeFilter === 'past'" (click)="setFilter('past')">Terminées ({{ getPastCount() }})</button>
      </div>

      <!-- Sessions List -->
      <div class="sessions-list">
          <div *ngFor="let s of filteredSeances" class="session-card">
              <div class="session-main">
                  <div class="avatar" [style.background]="getAvatarColor(s.entrepreneurName || s.titre)">
                      {{ getInitials(s.entrepreneurName || s.titre) }}
                  </div>
                  <div class="session-info">
                      <div class="session-name"><strong>{{ s.titre }}</strong></div>
                      <div class="session-meta">
                          <span><i class="pi pi-user"></i> {{ s.entrepreneurName || 'N/A' }}</span>
                          <span><i class="pi pi-calendar"></i> {{ s.dateSeance }}</span>
                          <span><i class="pi pi-clock"></i> {{ s.heureDebut }} — {{ s.heureFin }}</span>
                      </div>
                  </div>
              </div>
              <div class="session-actions">
                  <span class="status-badge" [class]="isUpcoming(s) ? 'badge-upcoming' : 'badge-past'">
                      {{ isUpcoming(s) ? 'À venir' : 'Terminée' }}
                  </span>
              </div>
          </div>
          <div *ngIf="filteredSeances.length === 0 && !loading" class="empty-state">
              <i class="pi pi-calendar" style="font-size: 2rem; color: #CBD5E0;"></i>
              <p>Aucune séance exceptionnelle trouvée.</p>
          </div>
      </div>

      <!-- Modal: Planifier une séance -->
      <div *ngIf="showModal" class="modal-backdrop" (click)="showModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                  <div>
                      <h2>🎯 Planifier une séance exceptionnelle</h2>
                      <p class="modal-subtitle">En dehors de vos disponibilités habituelles</p>
                  </div>
                  <button class="close-btn" (click)="showModal = false"><i class="pi pi-times"></i></button>
              </div>
              <div class="modal-body">
                  <div class="form-group">
                      <label>Entrepreneur *</label>
                      <select class="premium-input" [(ngModel)]="newSeance.entrepreneurId">
                          <option [ngValue]="0">Sélectionnez un entrepreneur...</option>
                          <option *ngFor="let e of entrepreneurs" [ngValue]="e.id">{{ e.firstName }} {{ e.lastName }} — {{ e.entreprise || 'N/A' }}</option>
                      </select>
                  </div>
                  <div class="form-group">
                      <label>Titre de la séance *</label>
                      <input type="text" class="premium-input" [(ngModel)]="newSeance.titre" placeholder="Ex: Point stratégique exceptionnel">
                  </div>
                  <div class="form-row">
                      <div class="form-group">
                          <label>Date *</label>
                          <input type="date" class="premium-input" [(ngModel)]="newSeance.dateSeance">
                      </div>
                      <div class="form-group">
                          <label>Heure de début *</label>
                          <input type="time" class="premium-input" [(ngModel)]="newSeance.heureDebut">
                      </div>
                      <div class="form-group">
                          <label>Heure de fin *</label>
                          <input type="time" class="premium-input" [(ngModel)]="newSeance.heureFin">
                      </div>
                  </div>
                  <div *ngIf="modalError" class="error-banner">
                      <i class="pi pi-exclamation-triangle"></i> {{ modalError }}
                  </div>
              </div>
              <div class="modal-actions">
                  <button class="btn-outline" (click)="showModal = false">Annuler</button>
                  <button class="btn-primary" (click)="submit()" [disabled]="saving">
                      <i class="pi" [class.pi-check]="!saving" [class.pi-spin]="saving" [class.pi-spinner]="saving"></i>
                      {{ saving ? 'Planification...' : 'Planifier la séance' }}
                  </button>
              </div>
          </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-overlay">
          <div class="spinner"></div>
      </div>
    </div>
  `,
  styles: [`
    .seance-page { padding: 2rem; background: #f8f9fa; min-height: calc(100vh - 70px); font-family: var(--font-family); margin-top: -1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-title-row { display: flex; align-items: center; gap: 1rem; }
    .page-icon { width: 50px; height: 50px; background: linear-gradient(135deg, #FFF5F7, #FFE0E8); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: #2D3748; margin: 0; }
    .page-header p { color: #718096; font-size: 1rem; margin-top: 0.2rem; }

    .kpi-bar { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; }
    .kpi-item { background: white; border-radius: 1rem; padding: 1.2rem 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; flex-direction: column; min-width: 140px; }
    .kpi-value { font-size: 2rem; font-weight: 700; color: #2D3748; }
    .kpi-label { font-size: 0.85rem; color: #718096; margin-top: 0.2rem; }

    .filter-pills { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    .pill { padding: 0.5rem 1.2rem; border-radius: 25px; border: 1px solid #E2E8F0; background: white; font-family: inherit; font-size: 0.85rem; color: #4A5568; cursor: pointer; font-weight: 500; transition: all 0.2s; }
    .pill.active { background: #2D3748; color: white; border-color: #2D3748; }

    .sessions-list { display: flex; flex-direction: column; }
    .session-card { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; background: white; border-bottom: 1px solid #EDF2F7; }
    .session-card:first-child { border-radius: 1rem 1rem 0 0; }
    .session-card:last-child { border-radius: 0 0 1rem 1rem; border-bottom: none; }
    .session-card:hover { background: #FAFBFC; }
    .session-main { display: flex; align-items: center; gap: 1rem; flex: 1; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
    .session-info { flex: 1; }
    .session-name strong { font-size: 1rem; color: #2D3748; }
    .session-meta { display: flex; align-items: center; gap: 1rem; margin-top: 0.3rem; font-size: 0.8rem; color: #718096; }
    .session-meta span { display: flex; align-items: center; gap: 0.3rem; }
    .session-actions { display: flex; align-items: center; gap: 0.6rem; }
    .status-badge { font-size: 0.75rem; padding: 0.35rem 0.8rem; border-radius: 20px; font-weight: 600; }
    .badge-upcoming { background: #C6F6D5; color: #276749; }
    .badge-past { background: #E2E8F0; color: #4A5568; }

    .empty-state { text-align: center; padding: 3rem; color: #A0AEC0; background: white; border-radius: 1rem; }

    .btn-primary { background: linear-gradient(135deg, #FF6B9E 0%, #E83E8C 100%); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: transform 0.2s; font-family: inherit; }
    .btn-primary:hover { transform: translateY(-2px); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .shadow-glow { box-shadow: 0 4px 15px rgba(233,30,99,0.4); }
    .btn-outline { background: white; border: 1px solid #E2E8F0; color: #4A5568; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .modal-content { background: white; border-radius: 1.5rem; width: 100%; max-width: 620px; max-height: calc(100vh - 4rem); box-shadow: 0 20px 40px rgba(0,0,0,0.1); animation: slide-up 0.3s ease-out; overflow: hidden; display: flex; flex-direction: column; }
    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.4rem 1.6rem 1rem; border-bottom: 1px solid #EDF2F7; }
    .modal-header h2 { font-size: 1.3rem; font-weight: 700; color: #2D3748; margin: 0; }
    .modal-subtitle { font-size: 0.85rem; color: #718096; margin-top: 0.3rem; }
    .close-btn { background: #F7FAFC; border: none; width: 32px; height: 32px; border-radius: 50%; color: #A0AEC0; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .close-btn:hover { background: #EDF2F7; color: #4A5568; }
    .modal-body { overflow-y: auto; padding: 1.4rem 1.6rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem 1.6rem 1.2rem; border-top: 1px solid #EDF2F7; }

    .form-group { display: flex; flex-direction: column; }
    .form-group label { display: block; font-size: 0.9rem; font-weight: 600; color: #4A5568; margin-bottom: 0.5rem; }
    .premium-input { width: 100%; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid #E2E8F0; background: #F8FAFC; font-family: inherit; font-size: 0.95rem; color: #2D3748; outline: none; }
    .premium-input:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }

    .error-banner { padding: 0.8rem 1rem; background: #FFF5F5; border: 1px solid #FED7D7; border-radius: 10px; color: #E53E3E; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; }

    .loading-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.7); z-index: 999; display: flex; align-items: center; justify-content: center; }
    .spinner { width: 40px; height: 40px; border: 4px solid #EDF2F7; border-top-color: #FF4D85; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    @media (max-width: 768px) {
        .form-row { grid-template-columns: 1fr; }
        .kpi-bar { flex-wrap: wrap; }
        .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
    }
  `]
})
export class SeanceExceptionnelleComponent implements OnInit {
  coachId!: number;
  entrepreneurs: CoachEntrepreneurDTO[] = [];
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
    this.loadSeances();
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

  isUpcoming(s: SeanceExceptionnelleDTO): boolean {
      return new Date(s.dateSeance) >= new Date(new Date().toDateString());
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
      if (!this.newSeance.entrepreneurId || this.newSeance.entrepreneurId === 0) {
          this.modalError = 'Veuillez sélectionner un entrepreneur.'; return;
      }
      if (!this.newSeance.titre) { this.modalError = 'Le titre est requis.'; return; }
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
              this.newSeance = { coachId: this.coachId, entrepreneurId: 0, titre: '', dateSeance: '', heureDebut: '', heureFin: '' };
              this.showModal = false;
              this.saving = false;
          },
          error: () => { this.modalError = 'Erreur lors de la planification.'; this.saving = false; }
      });
  }
}
