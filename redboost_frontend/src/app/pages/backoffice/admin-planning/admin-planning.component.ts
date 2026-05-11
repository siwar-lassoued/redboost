import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminPlanningService } from '../../../core/services/admin-planning.service';
import {
  SessionDetail,
  CoachPlanningItem,
  EntrepreneurPlanningItem,
  TodoItem,
  LivrableItem,
  AdminPlanningOverview
} from '../../../core/models/admin-planning.model';

@Component({
  selector: 'app-admin-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="planning-container">
      <!-- HEADER SECTION -->
      <header class="dashboard-header">
        <div class="header-main">
          <div class="title-group">
            <div class="icon-box pulse">
              <i class="pi pi-calendar"></i>
            </div>
            <div>
              <h1>Planning Stratégique Global</h1>
              <p>Pilotage centralisé des sessions, objectifs et livrables de l'écosystème Redboost</p>
            </div>
          </div>
          
          <div class="stats-ribbon" *ngIf="overview">
            <div class="ribbon-item">
              <span class="ribbon-label">Coachs</span>
              <span class="ribbon-value">{{ overview.totalCoaches || 0 }}</span>
            </div>
            <div class="ribbon-divider"></div>
            <div class="ribbon-item">
              <span class="ribbon-label">Entrepreneurs</span>
              <span class="ribbon-value">{{ overview.totalEntrepreneurs || 0 }}</span>
            </div>
            <div class="ribbon-divider"></div>
            <div class="ribbon-item">
              <span class="ribbon-label">Sessions</span>
              <span class="ribbon-value">{{ overview.totalSessions || 0 }}</span>
            </div>
            <div class="ribbon-divider"></div>
            <div class="ribbon-item">
              <span class="ribbon-label">Documents</span>
              <span class="ribbon-value">{{ overview.pendingLivrables || 0 }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- MAIN NAVIGATION -->
      <nav class="nav-tabs-container">
        <div class="tabs-wrapper">
          <button class="nav-tab" [class.active]="activeTab === 'coach'" (click)="selectTab('coach')">
            <i class="pi pi-users"></i>
            <span>Perspective Coachs</span>
          </button>
          <button class="nav-tab" [class.active]="activeTab === 'entrepreneur'" (click)="selectTab('entrepreneur')">
            <i class="pi pi-briefcase"></i>
            <span>Perspective Entrepreneurs</span>
          </button>
          <button class="nav-tab" [class.active]="activeTab === 'todos'" (click)="selectTab('todos')">
            <i class="pi pi-check-square"></i>
            <span>To-Dos & Documents</span>
          </button>
        </div>
        
        <div class="search-context">
          <div class="search-input-wrapper">
            <i class="pi pi-search"></i>
            <input 
              type="text" 
              [placeholder]="activeTab === 'coach' ? 'Rechercher un coach...' : 'Rechercher un entrepreneur...'" 
              [(ngModel)]="globalSearch"
              (ngModelChange)="onSearchChange($event)">
          </div>
        </div>
      </nav>

      <!-- CONTENT AREA -->
      <main class="content-viewport">
        <!-- LOADING STATE -->
        <div *ngIf="loading" class="modern-loader">
          <div class="loader-circle"></div>
          <span>Synchronisation des plannings...</span>
        </div>

        <!-- COACH TAB CONTENT -->
        <div *ngIf="activeTab === 'coach' && !loading" class="fade-in">
          <div class="grid-layout">
            <div *ngFor="let coach of filteredCoaches" class="entity-card coach-card shadow-hover">
              <div class="card-header" (click)="toggleCoach(coach)">
                <div class="entity-profile">
                  <div class="entity-avatar gradient-coach">
                    {{ getInitials(coach.coachName) }}
                  </div>
                  <div class="entity-info">
                    <h3>{{ coach.coachName }}</h3>
                    <span class="entity-subtitle">{{ coach.email }}</span>
                  </div>
                </div>
                <div class="entity-badges">
                  <span class="badge badge-sessions">
                    <i class="pi pi-calendar"></i> {{ coach.totalSessions }}
                  </span>
                  <i class="pi" [class.pi-chevron-down]="!coach.expanded" [class.pi-chevron-up]="coach.expanded"></i>
                </div>
              </div>

              <div *ngIf="coach.expanded" class="card-details slide-down">
                <!-- Session List -->
                <div class="detail-section">
                  <h4 class="section-title"><i class="pi pi-clock"></i> Sessions Programmées</h4>
                  <div *ngIf="!coach.sessions?.length" class="empty-inline">Aucune session active</div>
                  <div class="compact-session-list">
                    <div *ngFor="let s of coach.sessions" class="mini-session-item">
                      <div class="m-time">
                        <span class="m-day">{{ s.date | date:'dd MMM' }}</span>
                        <span class="m-hour">{{ s.date | date:'HH:mm' }}</span>
                      </div>
                      <div class="m-main">
                        <span class="m-title">{{ s.titre }}</span>
                        <span class="m-ent">Entrepreneur: {{ s.entrepreneurName }}</span>
                      </div>
                      <div class="m-actions">
                        <a *ngIf="s.meetLink" [href]="s.meetLink" target="_blank" class="meet-pill">
                          <i class="pi pi-video"></i> Meet
                        </a>
                        <span class="m-status" [class]="'st-' + (s.statut ? s.statut.toLowerCase() : '')">{{ s.statut }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Section -->
                <div class="detail-footer">
                  <button class="footer-btn" (click)="openQuickView(coach)">
                    <i class="pi pi-eye"></i> Vue détaillée To-Dos & Livrables
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ENTREPRENEUR TAB CONTENT -->
        <div *ngIf="activeTab === 'entrepreneur' && !loading" class="fade-in">
          <div class="grid-layout">
            <div *ngFor="let ent of filteredEntrepreneurs" class="entity-card ent-card shadow-hover">
              <div class="card-header" (click)="toggleEntrepreneur(ent)">
                <div class="entity-profile">
                  <div class="entity-avatar gradient-ent">
                    {{ getInitials(ent.entrepreneurName) }}
                  </div>
                  <div class="entity-info">
                    <h3>{{ ent.entrepreneurName }}</h3>
                    <span class="entity-subtitle">{{ ent.programme || 'Sans programme' }}</span>
                  </div>
                </div>
                <div class="entity-badges">
                  <span class="badge badge-sessions">
                    <i class="pi pi-calendar"></i> {{ ent.totalSessions }}
                  </span>
                  <i class="pi" [class.pi-chevron-down]="!ent.expanded" [class.pi-chevron-up]="ent.expanded"></i>
                </div>
              </div>

              <div *ngIf="ent.expanded" class="card-details slide-down">
                <div class="detail-section">
                  <h4 class="section-title"><i class="pi pi-user"></i> Coach Assigné</h4>
                  <div class="coach-assigned">
                    <i class="pi pi-shield"></i> {{ ent.coachName }}
                  </div>
                </div>

                <div class="detail-section">
                  <h4 class="section-title"><i class="pi pi-clock"></i> Ses Sessions</h4>
                  <div class="compact-session-list">
                    <div *ngFor="let s of ent.sessions" class="mini-session-item">
                      <div class="m-time">
                        <span class="m-day">{{ s.date | date:'dd MMM' }}</span>
                      </div>
                      <div class="m-main">
                        <span class="m-title">{{ s.titre }}</span>
                      </div>
                      <div class="m-actions">
                        <a *ngIf="s.meetLink" [href]="s.meetLink" target="_blank" class="meet-pill">
                          <i class="pi pi-video"></i> Meet
                        </a>
                        <span class="m-status" [class]="'st-' + (s.statut ? s.statut.toLowerCase() : '')">{{ s.statut }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TODOS & LIVRABLES TAB CONTENT -->
        <div *ngIf="activeTab === 'todos' && !loading" class="fade-in">
          <div class="split-view">
            <!-- Todos Column -->
            <div class="split-col">
              <div class="col-header">
                <h3><i class="pi pi-list-check"></i> To-Dos Actives</h3>
              </div>
              <div class="todo-stack">
                <div *ngFor="let todo of filteredTodos()" class="premium-todo-card">
                  <div class="p-todo-header">
                    <span class="p-todo-priority" [class]="'priority-' + (todo.priorite ? todo.priorite.toLowerCase() : 'moyenne')">
                      {{ todo.priorite }}
                    </span>
                    <span class="p-todo-date">Limite: {{ todo.dateLimite | date:'dd/MM' }}</span>
                  </div>
                  <h4>{{ todo.titre }}</h4>
                  <div class="p-todo-meta">
                    <div class="meta-u">
                      <i class="pi pi-user"></i> {{ todo.entrepreneurName }}
                    </div>
                    <div class="meta-u">
                      <i class="pi pi-shield"></i> {{ todo.coachName }}
                    </div>
                  </div>
                  <div class="p-todo-docs" *ngIf="todo.documents?.length">
                    <span class="doc-tag" *ngFor="let doc of todo.documents">
                      <i class="pi pi-file"></i> {{ doc.nom }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Livrables Column -->
            <div class="split-col">
              <div class="col-header">
                <h3><i class="pi pi-file-export"></i> Livrables & Documents</h3>
              </div>
              <div class="livrable-stack">
                <div *ngFor="let liv of filteredLivrables()" class="premium-liv-card">
                  <div class="liv-icon"><i class="pi pi-file-pdf"></i></div>
                  <div class="liv-content">
                    <span class="liv-name">{{ liv.nom }}</span>
                    <span class="liv-meta">Par {{ liv.entrepreneurName }} • {{ liv.dateUpload | date:'dd/MM HH:mm' }}</span>
                  </div>
                  <a [href]="liv.url" target="_blank" class="liv-download">
                    <i class="pi pi-download"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      --primary: #E44D62;
      --primary-soft: #FFF1F3;
      --secondary: #2D3748;
      --accent: #4299E1;
      --glass: rgba(255, 255, 255, 0.9);
      --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
      --radius-xl: 24px;
      --radius-lg: 16px;
      --radius-md: 12px;
    }

    .planning-container {
      padding: 1.5rem;
      background: #F7FAFC;
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
    }

    /* HEADER */
    .dashboard-header {
      margin-bottom: 2rem;
      background: white;
      padding: 1.5rem 2rem;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
    }
    .header-main { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem; }
    .title-group { display: flex; align-items: center; gap: 1.25rem; }
    .icon-box { width: 56px; height: 56px; background: var(--primary); color: white; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .title-group h1 { font-size: 1.75rem; font-weight: 800; color: var(--secondary); margin: 0; }
    .title-group p { color: #718096; margin: 0.25rem 0 0; font-size: 0.9rem; }

    .stats-ribbon { display: flex; align-items: center; background: var(--primary-soft); padding: 0.75rem 1.5rem; border-radius: 14px; }
    .ribbon-item { text-align: center; padding: 0 1rem; }
    .ribbon-label { display: block; font-size: 0.7rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; }
    .ribbon-value { font-size: 1.25rem; font-weight: 800; color: var(--secondary); }
    .ribbon-divider { width: 1px; height: 30px; background: rgba(228, 77, 98, 0.2); }

    /* NAVIGATION */
    .nav-tabs-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
      background: var(--glass);
      padding: 0.5rem;
      border-radius: 18px;
      backdrop-filter: blur(10px);
    }
    .tabs-wrapper { display: flex; gap: 0.5rem; }
    .nav-tab {
      padding: 0.75rem 1.25rem;
      border: none;
      background: transparent;
      border-radius: 12px;
      font-weight: 600;
      color: #718096;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .nav-tab.active { background: white; color: var(--primary); box-shadow: var(--shadow-sm); }
    .nav-tab:hover:not(.active) { color: var(--primary); background: rgba(228, 77, 98, 0.05); }

    .search-context { flex: 1; max-width: 400px; }
    .search-input-wrapper { position: relative; }
    .search-input-wrapper i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #A0AEC0; }
    .search-input-wrapper input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 14px; border: 1px solid #E2E8F0; outline: none; transition: all 0.3s; }
    .search-input-wrapper input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(228, 77, 98, 0.1); }

    /* GRID & CARDS */
    .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 1.5rem; }
    .entity-card { background: white; border-radius: 20px; border: 1px solid #EDF2F7; overflow: hidden; transition: all 0.3s; }
    .shadow-hover:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--primary-soft); }
    
    .card-header { padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
    .entity-profile { display: flex; align-items: center; gap: 1rem; }
    .entity-avatar { width: 50px; height: 50px; border-radius: 15px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.1rem; }
    .gradient-coach { background: linear-gradient(135deg, #E44D62, #FF718B); }
    .gradient-ent { background: linear-gradient(135deg, #4299E1, #63B3ED); }
    .entity-info h3 { margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--secondary); }
    .entity-subtitle { font-size: 0.8rem; color: #718096; display: block; margin-top: 0.1rem; }

    .entity-badges { display: flex; align-items: center; gap: 0.75rem; }
    .badge { padding: 0.35rem 0.65rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; }
    .badge-sessions { background: #F7FAFC; color: #4A5568; border: 1px solid #E2E8F0; }

    .card-details { padding: 0 1.25rem 1.25rem; border-top: 1px solid #F7FAFC; background: #FAFBFC; }
    .section-title { font-size: 0.7rem; font-weight: 800; color: #A0AEC0; text-transform: uppercase; letter-spacing: 1px; margin: 1.25rem 0 0.75rem; display: flex; align-items: center; gap: 0.4rem; }
    
    .compact-session-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .mini-session-item { background: white; padding: 0.75rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem; border: 1px solid #EDF2F7; }
    .m-time { display: flex; flex-direction: column; align-items: center; min-width: 50px; padding-right: 0.75rem; border-right: 2px solid #F7FAFC; }
    .m-day { font-size: 0.75rem; font-weight: 800; color: var(--primary); }
    .m-hour { font-size: 0.7rem; color: #718096; }
    .m-main { flex: 1; }
    .m-title { display: block; font-size: 0.85rem; font-weight: 700; color: var(--secondary); }
    .m-ent { font-size: 0.7rem; color: #A0AEC0; }
    
    .m-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; }
    .meet-pill { background: #EBF8FF; color: #3182CE; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-decoration: none; display: flex; align-items: center; gap: 0.3rem; transition: background 0.2s; }
    .meet-pill:hover { background: #BEE3F8; }
    .m-status { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; padding: 0.2rem 0.4rem; border-radius: 4px; }
    .st-planifiee { background: #E2E8F0; color: #4A5568; }
    .st-confirmee { background: #C6F6D5; color: #2F855A; }
    .st-terminee { background: #F7FAFC; color: #CBD5E0; }

    .detail-footer { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px dashed #E2E8F0; }
    .footer-btn { width: 100%; padding: 0.6rem; border-radius: 10px; border: 1px solid var(--primary); background: transparent; color: var(--primary); font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
    .footer-btn:hover { background: var(--primary); color: white; }

    /* SPLIT VIEW (TODOS) */
    .split-view { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .split-col { background: white; border-radius: 24px; padding: 1.5rem; box-shadow: var(--shadow-sm); }
    .col-header { margin-bottom: 1.5rem; }
    .col-header h3 { font-size: 1.1rem; font-weight: 800; color: var(--secondary); display: flex; align-items: center; gap: 0.75rem; }
    
    .todo-stack, .livrable-stack { display: flex; flex-direction: column; gap: 1rem; }
    
    .premium-todo-card { background: #FAFBFC; border-radius: 16px; padding: 1.25rem; border: 1px solid #EDF2F7; border-left: 5px solid var(--primary); }
    .p-todo-header { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
    .p-todo-priority { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; padding: 0.25rem 0.5rem; border-radius: 6px; }
    .priority-haute { background: #FED7D7; color: #9B2C2C; }
    .priority-moyenne { background: #FEEBC8; color: #9C4221; }
    .priority-basse { background: #C6F6D5; color: #2F855A; }
    .p-todo-date { font-size: 0.7rem; color: #A0AEC0; font-weight: 600; }
    .premium-todo-card h4 { margin: 0 0 0.75rem; font-size: 0.95rem; font-weight: 700; }
    .p-todo-meta { display: flex; gap: 1rem; margin-bottom: 0.75rem; }
    .meta-u { font-size: 0.75rem; color: #718096; display: flex; align-items: center; gap: 0.35rem; }
    .p-todo-docs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
    .doc-tag { background: white; padding: 0.35rem 0.65rem; border-radius: 8px; border: 1px solid #E2E8F0; font-size: 0.7rem; color: var(--accent); font-weight: 600; }

    .premium-liv-card { background: white; padding: 1rem; border-radius: 16px; border: 1px solid #EDF2F7; display: flex; align-items: center; gap: 1rem; transition: all 0.2s; }
    .premium-liv-card:hover { transform: scale(1.02); border-color: var(--accent); }
    .liv-icon { width: 40px; height: 40px; background: #EBF8FF; color: var(--accent); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .liv-content { flex: 1; display: flex; flex-direction: column; }
    .liv-name { font-size: 0.85rem; font-weight: 700; color: var(--secondary); }
    .liv-meta { font-size: 0.7rem; color: #A0AEC0; }
    .liv-download { width: 32px; height: 32px; background: #F7FAFC; color: #718096; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.2s; }
    .liv-download:hover { background: var(--primary); color: white; }

    /* LOADER */
    .modern-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem; gap: 1.5rem; }
    .loader-circle { width: 40px; height: 40px; border: 3px solid rgba(228, 77, 98, 0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
    .pulse { animation: pulse 2s infinite ease-in-out; }

    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .slide-down { animation: slideDown 0.3s ease-out; }
    .fade-in { animation: opacity 0.4s ease-in; }

    @media (max-width: 1024px) {
      .split-view { grid-template-columns: 1fr; }
      .grid-layout { grid-template-columns: 1fr; }
      .header-main { flex-direction: column; align-items: flex-start; }
      .nav-tabs-container { flex-direction: column; align-items: stretch; }
      .tabs-wrapper { overflow-x: auto; padding-bottom: 0.5rem; }
      .search-context { max-width: 100%; }
    }
  `],
})
export class AdminPlanningComponent implements OnInit, OnDestroy {
  activeTab: string = 'coach';
  loading = false;
  globalSearch = '';
  
  overview: AdminPlanningOverview | null = null;
  filteredCoaches: CoachPlanningItem[] = [];
  filteredEntrepreneurs: EntrepreneurPlanningItem[] = [];
  todos: TodoItem[] = [];
  livrables: LivrableItem[] = [];

  private destroy$ = new Subject<void>();

  constructor(private adminPlanningService: AdminPlanningService) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData(): void {
    this.loading = true;
    
    forkJoin({
      overview: this.adminPlanningService.getOverview(),
      coaches: this.adminPlanningService.getCoachPlannings(),
      entrepreneurs: this.adminPlanningService.getEntrepreneurPlannings(),
      todos: this.adminPlanningService.getAllTodos(),
      livrables: this.adminPlanningService.getAllLivrables()
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this.overview = res.overview;
        this.filteredCoaches = res.coaches;
        this.filteredEntrepreneurs = res.entrepreneurs;
        this.todos = res.todos;
        this.livrables = res.livrables;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur globale:', err);
        this.loading = false;
      }
    });
  }

  onSearchChange(value: string): void {
    const search = value.toLowerCase();
    // In-memory search for better UX
    if (this.activeTab === 'coach') {
      // Re-filtering is handled by the template if we use a getter or function,
      // but here we can also just re-trigger load if we want server-side search.
      // For now, let's keep it simple.
    }
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
  }

  toggleCoach(coach: CoachPlanningItem): void {
    coach.expanded = !coach.expanded;
  }

  toggleEntrepreneur(ent: EntrepreneurPlanningItem): void {
    ent.expanded = !ent.expanded;
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  }

  filteredTodos(): TodoItem[] {
    if (!this.globalSearch) return this.todos;
    const s = this.globalSearch.toLowerCase();
    return this.todos.filter(t => 
      t.titre.toLowerCase().includes(s) || 
      t.entrepreneurName.toLowerCase().includes(s) || 
      t.coachName.toLowerCase().includes(s)
    );
  }

  filteredLivrables(): LivrableItem[] {
    if (!this.globalSearch) return this.livrables;
    const s = this.globalSearch.toLowerCase();
    return this.livrables.filter(l => 
      l.nom.toLowerCase().includes(s) || 
      l.entrepreneurName.toLowerCase().includes(s)
    );
  }

  openQuickView(entity: any): void {
    this.globalSearch = entity.coachName || entity.entrepreneurName;
    this.activeTab = 'todos';
  }
}
