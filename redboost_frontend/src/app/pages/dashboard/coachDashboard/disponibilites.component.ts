import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachService, DisponibiliteDTO, SessionCoachDTO, ThematiqueCoachingDTO, ProgrammeDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';

@Component({
  selector: 'app-coach-disponibilites',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calendar-page">
      <!-- Page Header -->
      <div class="page-header">
          <div class="page-title-row">
              <div class="page-icon">📅</div>
              <div>
                  <h1>Calendrier & Disponibilités</h1>
                  <p>Gérez vos créneaux et sessions planifiées</p>
              </div>
          </div>
          <div class="header-actions">
              <span class="event-count-badge">● {{calendarEvents.length}} événements programmés</span>
              <button class="btn-primary shadow-glow" (click)="showDispoModal = true">
                  <i class="pi pi-plus"></i> Ajouter disponibilité
              </button>
          </div>
      </div>

      <!-- Main Content: Calendar + Sidebar -->
      <div class="main-layout">
          <!-- Calendar Grid -->
          <div class="calendar-card">
              <div class="month-header">
                  <h2>{{getMonthName()}} {{currentYear}}</h2>
                  <div class="month-nav">
                      <button class="nav-btn" (click)="prevMonth()"><i class="pi pi-chevron-left"></i></button>
                      <button class="nav-btn" (click)="nextMonth()"><i class="pi pi-chevron-right"></i></button>
                  </div>
              </div>
              <div class="day-headers">
                  <div class="day-header" *ngFor="let d of dayLabels">{{d}}</div>
              </div>
              <div class="calendar-grid">
                  <div *ngFor="let cell of calendarCells" class="calendar-cell" [class.other-month]="!cell.currentMonth" [class.today]="cell.isToday">
                      <div class="cell-day" [class.today-circle]="cell.isToday">{{cell.day}}</div>
                      <div class="cell-events">
                          <div *ngFor="let ev of getEventsForDay(cell.fullDate)" class="event-chip" [style.background]="ev.color">
                              {{ev.title | slice:0:12}}{{ev.title.length > 12 ? '...' : ''}}
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Right Sidebar -->
          <div class="sidebar">
              <div class="sidebar-section">
                  <h3>Événements à venir <span class="count-badge">{{upcomingEvents.length}}</span></h3>
                  <div *ngIf="upcomingEvents.length > 0" class="next-event-label">● Prochain événement</div>
                  <div *ngFor="let event of upcomingEvents; let i = index" class="event-card" [class.highlighted]="i === 0">
                      <div class="event-icon" [style.background]="'#FFF5F7'">
                          <i class="pi pi-calendar" style="color: #FF4D85"></i>
                      </div>
                      <div class="event-details">
                          <div class="event-name">{{event.title}}</div>
                          <div class="event-datetime"><i class="pi pi-calendar"></i> {{event.date}} • {{event.time}}</div>
                      </div>
                  </div>
                  <div *ngIf="upcomingEvents.length === 0" class="text-sm text-gray-400 italic">Aucun événement à venir.</div>
              </div>

              <!-- Disponibilités actives -->
              <div class="sidebar-section">
                  <h3>Disponibilités actives <span class="count-badge">{{disponibilites.length}}</span></h3>
                  <div *ngFor="let dispo of disponibilites" class="dispo-item">
                      <div class="dispo-info">
                          <strong>{{dispo.thematiqueNom || 'Thématique'}}</strong>
                          <span>Du {{dispo.dateDebut | date:'dd/MM/yyyy'}} au {{dispo.dateFin | date:'dd/MM/yyyy'}}</span>
                      </div>
                      <button (click)="deleteDispo(dispo.id!)" class="btn-icon-danger"><i class="pi pi-trash"></i></button>
                  </div>
                  <div *ngIf="disponibilites.length === 0" class="text-sm text-gray-400 italic">Aucune disponibilité.</div>
              </div>
          </div>
      </div>

      <!-- Modal Ajouter une disponibilité -->
      <div *ngIf="showDispoModal" class="modal-backdrop" (click)="showDispoModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                  <div>
                      <h2>Ajouter une disponibilité</h2>
                      <p class="text-sm text-gray-500 mt-1">Créez un nouveau créneau de disponibilité</p>
                  </div>
                  <button class="close-btn" (click)="showDispoModal = false"><i class="pi pi-times"></i></button>
              </div>
              <div class="modal-body">
                  <div class="form-group mb-4">
                      <label>Thématique / Programme *</label>
                      <select class="premium-input" [(ngModel)]="selectedThematiqueId">
                          <option [value]="null">Sélectionner une thématique...</option>
                          <option *ngFor="let t of thematiques" [value]="t.id">{{t.nom}} ({{t.dateDebut | date:'shortDate'}} - {{t.dateFin | date:'shortDate'}})</option>
                      </select>
                  </div>
                  <div class="modal-actions">
                      <button class="btn-outline" (click)="showDispoModal = false">Annuler</button>
                      <button class="btn-primary" [disabled]="!selectedThematiqueId" (click)="addDisponibilite()">Ajouter la disponibilité</button>
                  </div>
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
    .calendar-page { padding: 2rem; background: #f8f9fa; min-height: calc(100vh - 70px); font-family: var(--font-family); margin-top: -1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-title-row { display: flex; align-items: center; gap: 1rem; }
    .page-icon { width: 50px; height: 50px; background: linear-gradient(135deg, #FFF5F7, #FFE0E8); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: #2D3748; margin: 0; }
    .page-header p { color: #718096; font-size: 1rem; margin-top: 0.2rem; }
    .header-actions { display: flex; align-items: center; gap: 1rem; }
    .event-count-badge { background: #FFF5F7; color: #FF4D85; border: 1px solid #FFD0DE; padding: 0.6rem 1.2rem; border-radius: 25px; font-weight: 600; font-size: 0.85rem; }
    .main-layout { display: flex; gap: 2rem; }
    .calendar-card { flex: 1; background: white; border-radius: 1.5rem; padding: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
    .sidebar { width: 340px; display: flex; flex-direction: column; gap: 1.5rem; }
    .month-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .month-header h2 { font-size: 1.4rem; font-weight: 700; color: #2D3748; margin: 0; text-transform: capitalize; }
    .month-nav { display: flex; gap: 0.5rem; }
    .nav-btn { width: 36px; height: 36px; border-radius: 50%; background: white; border: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #4A5568; transition: all 0.2s; }
    .nav-btn:hover { background: #F7FAFC; }
    .day-headers { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 0.5rem; }
    .day-header { text-align: center; font-size: 0.8rem; font-weight: 700; color: #A0AEC0; text-transform: uppercase; padding: 0.5rem; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); border-top: 1px solid #EDF2F7; border-left: 1px solid #EDF2F7; }
    .calendar-cell { min-height: 90px; border-right: 1px solid #EDF2F7; border-bottom: 1px solid #EDF2F7; padding: 0.4rem; }
    .calendar-cell.other-month { background: #FCFCFD; }
    .calendar-cell.other-month .cell-day { color: #CBD5E0; }
    .calendar-cell.today { background: rgba(66,153,225,0.04); }
    .cell-day { font-size: 0.85rem; font-weight: 500; color: #4A5568; padding: 0.2rem 0.4rem; }
    .today-circle { background: #4299E1; color: white !important; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .cell-events { display: flex; flex-direction: column; gap: 2px; margin-top: 2px; }
    .event-chip { font-size: 0.65rem; color: white; padding: 2px 6px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
    .sidebar-section { background: white; border-radius: 1.5rem; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
    .sidebar-section h3 { font-size: 1.1rem; font-weight: 700; color: #2D3748; margin: 0 0 1rem 0; }
    .count-badge { background: #2D3748; color: white; font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 50%; font-weight: 700; }
    .next-event-label { color: #FF4D85; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.8rem; }
    .event-card { display: flex; gap: 1rem; padding: 1rem; border-radius: 12px; margin-bottom: 0.8rem; border: 1px solid #EDF2F7; transition: all 0.2s; }
    .event-card.highlighted { background: #FFF5F7; border-color: #FFD0DE; }
    .event-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
    .event-details { flex: 1; }
    .event-name { font-weight: 700; color: #2D3748; font-size: 0.9rem; }
    .event-datetime { font-size: 0.8rem; color: #718096; margin-top: 0.2rem; display: flex; align-items: center; gap: 0.3rem; }
    .dispo-item { display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; border-radius: 10px; background: #F8FAFC; border: 1px solid #E2E8F0; margin-bottom: 0.5rem; }
    .dispo-info { display: flex; flex-direction: column; }
    .dispo-info strong { color: #2D3748; font-size: 0.9rem; }
    .dispo-info span { color: #718096; font-size: 0.8rem; margin-top: 0.1rem; }
    .btn-icon-danger { background: #FFF5F5; color: #E53E3E; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .btn-icon-danger:hover { background: #FED7D7; }
    .btn-primary { background: var(--gradient-pink); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: transform 0.2s; }
    .btn-primary:hover { transform: translateY(-2px); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .shadow-glow { box-shadow: 0 4px 15px rgba(233,30,99,0.4); }
    .btn-outline { background: white; border: 1px solid #E2E8F0; color: #4A5568; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .modal-content { background: white; border-radius: 1.5rem; width: 100%; max-width: 500px; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.1); animation: slide-up 0.3s ease-out; }
    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .modal-header h2 { font-size: 1.3rem; font-weight: 700; color: #2D3748; margin: 0; }
    .close-btn { background: none; border: none; font-size: 1.2rem; color: #A0AEC0; cursor: pointer; }
    .form-group label { display: block; font-size: 0.9rem; font-weight: 600; color: #4A5568; margin-bottom: 0.5rem; }
    .premium-input { width: 100%; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid #E2E8F0; background: #F8FAFC; font-family: inherit; font-size: 0.95rem; color: #2D3748; outline: none; }
    .premium-input:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
    .loading-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.7); z-index: 999; display: flex; align-items: center; justify-content: center; }
    .spinner { width: 40px; height: 40px; border: 4px solid #EDF2F7; border-top-color: #FF4D85; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class DisponibilitesComponent implements OnInit {
  coachId!: number;
  loading: boolean = false;
  showDispoModal: boolean = false;
  selectedThematiqueId: number | null = null;

  disponibilites: DisponibiliteDTO[] = [];
  sessions: SessionCoachDTO[] = [];
  thematiques: ThematiqueCoachingDTO[] = [];
  calendarEvents: any[] = [];
  upcomingEvents: any[] = [];

  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  dayLabels: string[] = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
  calendarCells: any[] = [];

  private eventColors = ['#FF4D85', '#4299E1', '#48BB78', '#805AD5', '#ED8936', '#38B2AC', '#E53E3E'];

  constructor(
    private coachService: CoachService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const rawId = this.authService.getUserId();
    if (rawId) {
      this.coachId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;
      this.loadData();
    }
    this.buildCalendar();
  }

  loadData() {
    this.loading = true;
    // Load disponibilités
    this.coachService.getDisponibilites(this.coachId).subscribe({
      next: (data) => {
        this.disponibilites = data;
        this.buildCalendarEventsFromDispos();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    // Load sessions
    this.coachService.getAllSessionsByCoach(this.coachId).subscribe({
      next: (data) => {
        this.sessions = data;
        this.buildCalendarEventsFromSessions();
        this.buildUpcomingEvents();
      },
      error: () => {}
    });

    // Load thématiques for modal
    this.coachService.getThematiquesAssignedToCoach(this.coachId).subscribe({
      next: (data) => this.thematiques = data,
      error: () => {}
    });
  }

  buildCalendarEventsFromDispos() {
    const dispoEvents = this.disponibilites.map((d, i) => ({
      title: 'Dispo: ' + (d.thematiqueNom || 'Thématique'),
      date: d.dateDebut,
      color: this.eventColors[i % this.eventColors.length]
    }));
    this.calendarEvents = [...this.calendarEvents.filter(e => !e.title.startsWith('Dispo:')), ...dispoEvents];
  }

  buildCalendarEventsFromSessions() {
    const sessionEvents = this.sessions.map((s, i) => ({
      title: s.titre,
      date: s.dateSession,
      color: this.eventColors[(i + 2) % this.eventColors.length]
    }));
    this.calendarEvents = [...this.calendarEvents.filter(e => e.title.startsWith('Dispo:')), ...sessionEvents];
  }

  buildUpcomingEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.upcomingEvents = this.sessions
      .filter(s => new Date(s.dateSession) >= today)
      .sort((a, b) => new Date(a.dateSession).getTime() - new Date(b.dateSession).getTime())
      .slice(0, 5)
      .map(s => ({
        title: s.titre,
        date: new Date(s.dateSession).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
        time: s.heureDebut
      }));
  }

  addDisponibilite() {
    if (!this.selectedThematiqueId) return;
    this.coachService.addDisponibilite(this.coachId, this.selectedThematiqueId).subscribe({
      next: (data) => {
        this.disponibilites.push(data);
        this.buildCalendarEventsFromDispos();
        this.selectedThematiqueId = null;
        this.showDispoModal = false;
      },
      error: () => {}
    });
  }

  deleteDispo(id: number) {
    if (confirm('Supprimer cette disponibilité ?')) {
      this.coachService.deleteDisponibilite(id).subscribe({
        next: () => {
          this.disponibilites = this.disponibilites.filter(d => d.id !== id);
          this.buildCalendarEventsFromDispos();
        }
      });
    }
  }

  // Calendar logic
  getMonthName(): string {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[this.currentMonth];
  }
  prevMonth() { if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; } else { this.currentMonth--; } this.buildCalendar(); }
  nextMonth() { if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; } else { this.currentMonth++; } this.buildCalendar(); }

  buildCalendar() {
    this.calendarCells = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const m = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
      const y = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
      this.calendarCells.push({ day, currentMonth: false, isToday: false, fullDate: this.formatDate(y, m, day) });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const cellDate = new Date(this.currentYear, this.currentMonth, d); cellDate.setHours(0, 0, 0, 0);
      this.calendarCells.push({ day: d, currentMonth: true, isToday: cellDate.getTime() === today.getTime(), fullDate: this.formatDate(this.currentYear, this.currentMonth, d) });
    }
    const remaining = 42 - this.calendarCells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
      const y = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
      this.calendarCells.push({ day: d, currentMonth: false, isToday: false, fullDate: this.formatDate(y, m, d) });
    }
  }
  formatDate(year: number, month: number, day: number): string { return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
  getEventsForDay(dateStr: string): any[] { return this.calendarEvents.filter(e => e.date === dateStr); }
}
