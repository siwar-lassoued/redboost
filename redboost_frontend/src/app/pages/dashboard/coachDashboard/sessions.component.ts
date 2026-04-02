import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachService, SessionCoachDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';

@Component({
  selector: 'app-coach-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sessions-page">
      <div class="page-header">
          <div>
              <h1>Gestion des Sessions</h1>
              <p class="text-gray-500">{{filteredSessions.length}} sessions au total</p>
          </div>
      </div>

      <!-- Search -->
      <div class="search-bar mb-4">
          <i class="pi pi-search"></i>
          <input type="text" placeholder="Rechercher par titre de session..." [(ngModel)]="searchTerm" (ngModelChange)="filterSessions()" />
      </div>

      <!-- Filter Pills -->
      <div class="filter-pills mb-6">
          <button class="pill" [class.active]="activeFilter === 'all'" (click)="setFilter('all')">Toutes ({{sessions.length}})</button>
          <button class="pill" [class.active]="activeFilter === 'upcoming'" (click)="setFilter('upcoming')">À venir ({{getUpcomingCount()}})</button>
          <button class="pill" [class.active]="activeFilter === 'past'" (click)="setFilter('past')">Passées ({{getPastCount()}})</button>
      </div>

      <!-- Sessions List -->
      <div class="sessions-list">
          <div *ngFor="let session of filteredSessions" class="session-card">
              <div class="session-main">
                  <div class="avatar" [style.background]="getAvatarColor(session.titre)">{{getInitials(session.titre)}}</div>
                  <div class="session-info">
                      <div class="session-name">
                          <strong>{{session.titre}}</strong>
                      </div>
                      <div class="session-meta">
                          <span><i class="pi pi-calendar"></i> {{session.dateSession}}</span>
                          <span><i class="pi pi-clock"></i> {{session.heureDebut}} — {{session.heureFin}}</span>
                      </div>
                  </div>
              </div>
              <div class="session-actions">
                  <span class="status-badge" [class]="isUpcoming(session) ? 'badge-upcoming' : 'badge-past'">
                      {{isUpcoming(session) ? 'À venir' : 'Passée'}}
                  </span>
                  <button *ngIf="isUpcoming(session)" class="action-btn btn-danger" (click)="deleteSession(session)"><i class="pi pi-trash"></i></button>
              </div>
          </div>
          <div *ngIf="filteredSessions.length === 0 && !loading" class="empty-state">
              <i class="pi pi-calendar" style="font-size: 2rem; color: #CBD5E0;"></i>
              <p>Aucune session trouvée.</p>
          </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-overlay">
          <div class="spinner"></div>
      </div>
    </div>
  `,
  styles: [`
    .sessions-page { padding: 2rem; background: #f8f9fa; min-height: calc(100vh - 70px); font-family: var(--font-family); margin-top: -1rem; }
    .page-header h1 { font-size: 2.2rem; font-weight: 700; color: #2D3748; margin: 0; }
    .search-bar { position: relative; }
    .search-bar input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.8rem; border-radius: 12px; border: 1px solid #E2E8F0; background: white; font-family: inherit; font-size: 0.95rem; outline: none; }
    .search-bar input:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); }
    .search-bar i { position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); color: #A0AEC0; }
    .filter-pills { display: flex; gap: 0.5rem; }
    .pill { padding: 0.5rem 1.2rem; border-radius: 25px; border: 1px solid #E2E8F0; background: white; font-family: inherit; font-size: 0.85rem; color: #4A5568; cursor: pointer; font-weight: 500; }
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
    .action-btn { padding: 0.4rem 0.6rem; border-radius: 8px; font-size: 0.8rem; border: none; cursor: pointer; display: flex; align-items: center; }
    .btn-danger { background: #FFF5F5; color: #E53E3E; }
    .btn-danger:hover { background: #FED7D7; }
    .empty-state { text-align: center; padding: 3rem; color: #A0AEC0; }
    .loading-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.7); z-index: 999; display: flex; align-items: center; justify-content: center; }
    .spinner { width: 40px; height: 40px; border: 4px solid #EDF2F7; border-top-color: #FF4D85; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SessionsComponent implements OnInit {
  coachId!: number;
  loading: boolean = false;
  searchTerm: string = '';
  activeFilter: string = 'all';
  sessions: SessionCoachDTO[] = [];
  filteredSessions: SessionCoachDTO[] = [];

  private avatarColors = ['#FF4D85', '#4299E1', '#48BB78', '#805AD5', '#ED8936', '#38B2AC', '#2D3748'];

  constructor(
    private coachService: CoachService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const rawId = this.authService.getUserId();
    if (rawId) {
      this.coachId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;
      this.loadSessions();
    }
  }

  loadSessions() {
    this.loading = true;
    this.coachService.getAllSessionsByCoach(this.coachId).subscribe({
      next: (data) => {
        this.sessions = data;
        this.filteredSessions = [...data];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.filterSessions();
  }

  filterSessions() {
    let result = [...this.sessions];
    if (this.activeFilter === 'upcoming') {
      result = result.filter(s => this.isUpcoming(s));
    } else if (this.activeFilter === 'past') {
      result = result.filter(s => !this.isUpcoming(s));
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(s => s.titre.toLowerCase().includes(term));
    }
    this.filteredSessions = result;
  }

  isUpcoming(session: SessionCoachDTO): boolean {
    return new Date(session.dateSession) >= new Date();
  }

  getUpcomingCount(): number { return this.sessions.filter(s => this.isUpcoming(s)).length; }
  getPastCount(): number { return this.sessions.filter(s => !this.isUpcoming(s)).length; }

  getInitials(title: string): string {
    return title.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  }

  getAvatarColor(title: string): string {
    const hash = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return this.avatarColors[hash % this.avatarColors.length];
  }

  deleteSession(session: SessionCoachDTO) {
    if (!session.id) return;
    if (confirm('Supprimer cette session ?')) {
      this.coachService.deleteSession(session.id).subscribe({
        next: () => {
          this.sessions = this.sessions.filter(s => s.id !== session.id);
          this.filterSessions();
        }
      });
    }
  }
}
