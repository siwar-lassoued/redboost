import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-admin-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="planning-page">
      <div class="page-header">
        <div>
          <h1><i class="pi pi-calendar" style="color: #ea5073"></i> Planning Global</h1>
          <p>Vue d'ensemble des sessions, To-Do et livrables</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tab-bar">
        <button class="tab" [class.active]="activeTab === 'coach'" (click)="activeTab = 'coach'">
          <i class="pi pi-user"></i> Par Coach
        </button>
        <button class="tab" [class.active]="activeTab === 'entrepreneur'" (click)="activeTab = 'entrepreneur'">
          <i class="pi pi-briefcase"></i> Par Entrepreneur
        </button>
        <button class="tab" [class.active]="activeTab === 'todos'" (click)="activeTab = 'todos'">
          <i class="pi pi-list-check"></i> To-Do & Livrables
        </button>
      </div>

      <!-- Tab: Par Coach -->
      <div *ngIf="activeTab === 'coach'" class="tab-content">
        <div class="search-bar">
          <i class="pi pi-search"></i>
          <input type="text" placeholder="Rechercher un coach..." [(ngModel)]="coachSearch">
        </div>

        <div *ngIf="loading" class="loading-state"><div class="spinner"></div></div>

        <div *ngFor="let item of filteredOverview('COACH')" class="accordion-card">
          <div class="accordion-header" (click)="toggleAccordion(item)">
            <div class="acc-left">
              <div class="avatar-circle" style="background: linear-gradient(135deg, #ea5073, #FF6B9E)">
                {{ getInitials(item.coachName || '') }}
              </div>
              <div>
                <h3>{{ item.coachName }}</h3>
                <span class="acc-sub">{{ item.sessions?.length || 0 }} sessions</span>
              </div>
            </div>
            <i class="pi" [class.pi-chevron-down]="!item.expanded" [class.pi-chevron-up]="item.expanded"></i>
          </div>
          <div *ngIf="item.expanded" class="accordion-body">
            <div *ngIf="!item.sessions || item.sessions.length === 0" class="empty-msg">Aucune session planifiée.</div>
            <div *ngFor="let s of item.sessions" class="session-row">
              <div class="sr-info">
                <strong>{{ s.titre }}</strong>
                <span class="sr-meta">
                  <i class="pi pi-calendar"></i> {{ s.date | date:'dd/MM/yyyy HH:mm' }}
                  <span class="status-pill" [class]="'pill-' + s.statut?.toLowerCase()">{{ s.statut }}</span>
                </span>
                <span *ngIf="s.entrepreneurName" class="sr-ent">
                  <i class="pi pi-user"></i> {{ s.entrepreneurName }}
                </span>
              </div>
              <a *ngIf="s.meetLink" [href]="s.meetLink" target="_blank" class="meet-btn">
                <i class="pi pi-video"></i> Meet
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Par Entrepreneur -->
      <div *ngIf="activeTab === 'entrepreneur'" class="tab-content">
        <div class="search-bar">
          <i class="pi pi-search"></i>
          <input type="text" placeholder="Rechercher un entrepreneur..." [(ngModel)]="entSearch">
        </div>

        <div *ngIf="loading" class="loading-state"><div class="spinner"></div></div>

        <div *ngFor="let item of filteredOverview('ENTREPRENEUR')" class="accordion-card">
          <div class="accordion-header" (click)="loadEntrepreneurPlanning(item)">
            <div class="acc-left">
              <div class="avatar-circle" style="background: linear-gradient(135deg, #4299E1, #63B3ED)">
                {{ getInitials(item.entrepreneurName || '') }}
              </div>
              <div>
                <h3>{{ item.entrepreneurName }}</h3>
                <span class="acc-sub">Coach: {{ item.coachName }}</span>
              </div>
            </div>
            <i class="pi" [class.pi-chevron-down]="!item.expanded" [class.pi-chevron-up]="item.expanded"></i>
          </div>
          <div *ngIf="item.expanded && item.entSessions" class="accordion-body">
            <div *ngIf="item.entSessions.length === 0" class="empty-msg">Aucune session.</div>
            <div *ngFor="let s of item.entSessions" class="session-row">
              <div class="sr-info">
                <strong>{{ s.titre }}</strong>
                <span class="sr-meta">
                  <i class="pi pi-calendar"></i> {{ s.date | date:'dd/MM/yyyy HH:mm' }}
                  <span class="status-pill" [class]="'pill-' + s.statut?.toLowerCase()">{{ s.statut }}</span>
                </span>
                <span *ngIf="s.coachName" class="sr-ent"><i class="pi pi-user"></i> {{ s.coachName }}</span>
              </div>
              <a *ngIf="s.meetLink" [href]="s.meetLink" target="_blank" class="meet-btn">
                <i class="pi pi-video"></i> Meet
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: To-Do & Livrables -->
      <div *ngIf="activeTab === 'todos'" class="tab-content">
        <div class="search-bar">
          <i class="pi pi-search"></i>
          <input type="text" placeholder="Rechercher une tâche ou un livrable..." [(ngModel)]="todoSearch">
        </div>

        <!-- Coach selector -->
        <div class="coach-selector" *ngIf="coachList.length > 0">
          <label>Sélectionner un coach :</label>
          <select [(ngModel)]="selectedCoachIdForTodos" (ngModelChange)="loadTodosAndLivrables()">
            <option [ngValue]="null">-- Tous les coachs --</option>
            <option *ngFor="let c of coachList" [ngValue]="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div *ngIf="loading" class="loading-state"><div class="spinner"></div></div>

        <!-- Todos Table -->
        <div class="section-card">
          <h3><i class="pi pi-list-check" style="color: #ea5073"></i> To-Do</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Entrepreneur</th>
                <th>Tâche</th>
                <th>Statut</th>
                <th>Date limite</th>
                <th>Documents</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of filteredTodos()">
                <td>{{ t.entrepreneurName }}</td>
                <td>{{ t.titre }}</td>
                <td><span class="status-pill" [class]="'pill-' + t.status?.toLowerCase()">{{ t.status }}</span></td>
                <td>{{ t.dateLimite }}</td>
                <td>
                  <span *ngIf="!t.documents || t.documents.length === 0" class="no-doc">—</span>
                  <a *ngFor="let d of t.documents" [href]="d.url" target="_blank" class="doc-link">
                    <i class="pi pi-file"></i> {{ d.nom }}
                  </a>
                </td>
              </tr>
              <tr *ngIf="filteredTodos().length === 0">
                <td colspan="5" class="empty-cell">Aucune tâche trouvée</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Livrables Table -->
        <div class="section-card">
          <h3><i class="pi pi-file-export" style="color: #ea5073"></i> Livrables</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Entrepreneur</th>
                <th>Tâche</th>
                <th>Fichier</th>
                <th>Date</th>
                <th>Télécharger</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of filteredLivrables()">
                <td>{{ l.entrepreneurName }}</td>
                <td>{{ l.tacheTitre }}</td>
                <td>{{ l.nom }}</td>
                <td>{{ l.dateUpload }}</td>
                <td><a [href]="l.url" target="_blank" class="download-btn"><i class="pi pi-download"></i></a></td>
              </tr>
              <tr *ngIf="filteredLivrables().length === 0">
                <td colspan="5" class="empty-cell">Aucun livrable trouvé</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .planning-page { padding: 2rem; background: #f8f9fa; min-height: calc(100vh - 70px); font-family: var(--font-family); }
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: #2D3748; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { color: #718096; margin-top: 0.3rem; }

    .tab-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background: white; padding: 0.4rem; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .tab { flex: 1; padding: 0.75rem 1rem; border-radius: 12px; border: none; background: transparent; font-family: inherit; font-size: 0.9rem; font-weight: 600; color: #718096; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; }
    .tab.active { background: #ea5073; color: white; box-shadow: 0 4px 12px rgba(234,80,115,0.3); }
    .tab:hover:not(.active) { background: #FFF5F7; color: #ea5073; }

    .search-bar { position: relative; margin-bottom: 1rem; }
    .search-bar input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.8rem; border-radius: 12px; border: 1px solid #E2E8F0; background: white; font-family: inherit; font-size: 0.9rem; outline: none; }
    .search-bar input:focus { border-color: #ea5073; box-shadow: 0 0 0 3px rgba(234,80,115,0.1); }
    .search-bar i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #A0AEC0; }

    .accordion-card { background: white; border-radius: 16px; margin-bottom: 0.75rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden; }
    .accordion-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; cursor: pointer; transition: background 0.2s; }
    .accordion-header:hover { background: #FAFBFC; }
    .acc-left { display: flex; align-items: center; gap: 1rem; }
    .acc-left h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #2D3748; }
    .acc-sub { font-size: 0.8rem; color: #A0AEC0; }
    .avatar-circle { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.85rem; }

    .accordion-body { padding: 0 1.5rem 1.5rem; border-top: 1px solid #EDF2F7; }
    .session-row { display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 0; border-bottom: 1px solid #F7FAFC; }
    .session-row:last-child { border-bottom: none; }
    .sr-info { display: flex; flex-direction: column; gap: 0.3rem; }
    .sr-info strong { color: #2D3748; font-size: 0.95rem; }
    .sr-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #718096; }
    .sr-ent { font-size: 0.8rem; color: #A0AEC0; display: flex; align-items: center; gap: 0.3rem; }
    .meet-btn { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.8rem; background: #EBF8FF; color: #2B6CB0; border-radius: 8px; text-decoration: none; font-size: 0.8rem; font-weight: 600; }
    .meet-btn:hover { background: #BEE3F8; }

    .status-pill { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 10px; font-weight: 600; text-transform: uppercase; }
    .pill-confirmee, .pill-valide { background: #C6F6D5; color: #276749; }
    .pill-planifiee, .pill-planifie { background: #EBF8FF; color: #2B6CB0; }
    .pill-annulee { background: #FED7D7; color: #9B2C2C; }
    .pill-en_cours { background: #FEFCBF; color: #975A16; }
    .pill-terminee, .pill-termine { background: #E2E8F0; color: #4A5568; }
    .pill-demandee { background: #FFF5F7; color: #ea5073; }
    .pill-non_demarree { background: #F7FAFC; color: #A0AEC0; }

    .coach-selector { margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem; }
    .coach-selector label { font-weight: 600; color: #4A5568; font-size: 0.9rem; }
    .coach-selector select { padding: 0.6rem 1rem; border-radius: 10px; border: 1px solid #E2E8F0; font-family: inherit; background: white; font-size: 0.9rem; outline: none; }
    .coach-selector select:focus { border-color: #ea5073; }

    .section-card { background: white; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .section-card h3 { margin: 0 0 1rem; font-size: 1.1rem; font-weight: 700; color: #2D3748; display: flex; align-items: center; gap: 0.5rem; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .data-table th { text-align: left; padding: 0.6rem 0.8rem; color: #718096; font-weight: 600; border-bottom: 2px solid #EDF2F7; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 0.7rem 0.8rem; border-bottom: 1px solid #F7FAFC; color: #4A5568; }
    .data-table tr:hover td { background: #FAFBFC; }
    .empty-cell { text-align: center; color: #A0AEC0; padding: 2rem !important; }
    .no-doc { color: #CBD5E0; }
    .doc-link { display: inline-flex; align-items: center; gap: 0.3rem; color: #ea5073; text-decoration: none; font-weight: 500; margin-right: 0.5rem; }
    .doc-link:hover { text-decoration: underline; }
    .download-btn { color: #ea5073; text-decoration: none; font-size: 1rem; }
    .download-btn:hover { color: #C0392B; }

    .empty-msg { padding: 1.5rem; text-align: center; color: #A0AEC0; font-size: 0.9rem; }
    .loading-state { padding: 3rem; display: flex; justify-content: center; }
    .spinner { width: 40px; height: 40px; border: 4px solid #EDF2F7; border-top-color: #ea5073; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AdminPlanningComponent implements OnInit {
  activeTab: string = 'coach';
  loading = false;
  coachSearch = '';
  entSearch = '';
  todoSearch = '';

  overview: any[] = [];
  coachPlannings: Map<number, any> = new Map();
  coachList: { id: number; name: string }[] = [];
  selectedCoachIdForTodos: number | null = null;
  todos: any[] = [];
  livrables: any[] = [];

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview() {
    this.loading = true;
    this.http.get<any[]>(`${this.apiUrl}/admin/planning/overview`).subscribe({
      next: (data) => {
        this.overview = data.map(d => ({ ...d, expanded: false }));
        // Build coach list for todos selector
        const coachMap = new Map<number, string>();
        data.forEach(d => {
          if (d.coachId && d.coachName) coachMap.set(d.coachId, d.coachName);
        });
        this.coachList = Array.from(coachMap.entries()).map(([id, name]) => ({ id, name }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  filteredOverview(type: string): any[] {
    if (type === 'COACH') {
      const search = this.coachSearch.toLowerCase();
      // Group by coach
      const grouped = new Map<number, any>();
      this.overview.forEach(o => {
        if (!grouped.has(o.coachId)) {
          grouped.set(o.coachId, { ...o, expanded: o.expanded });
        }
      });
      return Array.from(grouped.values()).filter(o =>
        !search || (o.coachName || '').toLowerCase().includes(search)
      );
    } else {
      const search = this.entSearch.toLowerCase();
      return this.overview.filter(o =>
        !search || (o.entrepreneurName || '').toLowerCase().includes(search)
      );
    }
  }

  toggleAccordion(item: any) {
    item.expanded = !item.expanded;
    if (item.expanded && !item.sessions) {
      this.http.get<any>(`${this.apiUrl}/admin/planning/coach/${item.coachId}`).subscribe({
        next: (data) => {
          item.sessions = data.sessions || [];
          item.slots = data.slots || [];
        }
      });
    }
  }

  loadEntrepreneurPlanning(item: any) {
    item.expanded = !item.expanded;
    if (item.expanded && !item.entSessions) {
      this.http.get<any>(`${this.apiUrl}/admin/planning/entrepreneur/${item.entrepreneurId}`).subscribe({
        next: (data) => {
          item.entSessions = data.sessions || [];
        }
      });
    }
  }

  loadTodosAndLivrables() {
    if (!this.selectedCoachIdForTodos) {
      this.todos = [];
      this.livrables = [];
      return;
    }
    this.loading = true;
    this.http.get<any[]>(`${this.apiUrl}/admin/planning/coach/${this.selectedCoachIdForTodos}/todos`).subscribe({
      next: (data) => {
        this.todos = data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.http.get<any[]>(`${this.apiUrl}/admin/planning/coach/${this.selectedCoachIdForTodos}/livrables`).subscribe({
      next: (data) => { this.livrables = data; }
    });
  }

  filteredTodos(): any[] {
    if (!this.todoSearch.trim()) return this.todos;
    const s = this.todoSearch.toLowerCase();
    return this.todos.filter(t =>
      (t.titre || '').toLowerCase().includes(s) ||
      (t.entrepreneurName || '').toLowerCase().includes(s)
    );
  }

  filteredLivrables(): any[] {
    if (!this.todoSearch.trim()) return this.livrables;
    const s = this.todoSearch.toLowerCase();
    return this.livrables.filter(l =>
      (l.nom || '').toLowerCase().includes(s) ||
      (l.entrepreneurName || '').toLowerCase().includes(s) ||
      (l.tacheTitre || '').toLowerCase().includes(s)
    );
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  }
}
