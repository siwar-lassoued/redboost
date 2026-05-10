import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AdminPlanningService } from '../../../core/services/admin-planning.service';
import {
  SessionDetail,
  CoachPlanningItem,
  EntrepreneurPlanningItem,
  TodoItem,
  LivrableItem,
  AdminPlanningOverview,
  SessionStats,
  TodoStats
} from '../../../core/models/admin-planning.model';

@Component({
  selector: 'app-admin-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="planning-page">
      <!-- Header avec statistiques -->
      <div class="page-header">
        <div class="header-content">
          <div>
            <h1><i class="pi pi-calendar" style="color: #ea5073"></i> Planning Global</h1>
            <p>Vue d'ensemble complète des sessions, To-Do et livrables</p>
          </div>
        </div>
        
        <!-- Stats cards -->
        <div class="stats-grid" *ngIf="overview">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #ea5073, #FF6B9E);">
              <i class="pi pi-user"></i>
            </div>
            <div>
              <span class="stat-label">Coachs</span>
              <span class="stat-value">{{ overview.totalCoaches || 0 }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4299E1, #63B3ED);">
              <i class="pi pi-briefcase"></i>
            </div>
            <div>
              <span class="stat-label">Entrepreneurs</span>
              <span class="stat-value">{{ overview.totalEntrepreneurs || 0 }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #48BB78, #68D391);">
              <i class="pi pi-calendar"></i>
            </div>
            <div>
              <span class="stat-label">Sessions</span>
              <span class="stat-value">{{ overview.totalSessions || 0 }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #ED8936, #F6AD55);">
              <i class="pi pi-list-check"></i>
            </div>
            <div>
              <span class="stat-label">To-Do Pending</span>
              <span class="stat-value">{{ overview.pendingTodos || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tab-bar">
        <button 
          class="tab" 
          [class.active]="activeTab === 'coach'" 
          (click)="selectTab('coach')">
          <i class="pi pi-user"></i> Par Coach
        </button>
        <button 
          class="tab" 
          [class.active]="activeTab === 'entrepreneur'" 
          (click)="selectTab('entrepreneur')">
          <i class="pi pi-briefcase"></i> Par Entrepreneur
        </button>
        <button 
          class="tab" 
          [class.active]="activeTab === 'todos'" 
          (click)="selectTab('todos')">
          <i class="pi pi-list-check"></i> To-Do & Livrables
        </button>
      </div>

      <!-- Loading indicator -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des données...</p>
      </div>

      <!-- Tab 1: Planning par Coach -->
      <div *ngIf="activeTab === 'coach' && !loading" class="tab-content">
        <div class="content-header">
          <div class="search-bar">
            <i class="pi pi-search"></i>
            <input 
              type="text" 
              placeholder="Rechercher un coach..." 
              [(ngModel)]="coachSearch"
              (ngModelChange)="onCoachSearchChange($event)">
          </div>
          <span class="result-count">{{ filteredCoaches.length }} coach(s) trouvé(s)</span>
        </div>

        <div *ngIf="filteredCoaches.length === 0" class="empty-state">
          <i class="pi pi-inbox"></i>
          <p>Aucun coach trouvé</p>
        </div>

        <div *ngFor="let coach of filteredCoaches" class="accordion-card">
          <div class="accordion-header" (click)="toggleCoach(coach)">
            <div class="header-left">
              <div class="avatar-circle" style="background: linear-gradient(135deg, #ea5073, #FF6B9E)">
                {{ getInitials(coach.coachName) }}
              </div>
              <div class="header-info">
                <h3>{{ coach.coachName }}</h3>
                <div class="header-meta">
                  <span *ngIf="coach.specialty" class="meta-item">
                    <i class="pi pi-tag"></i> {{ coach.specialty }}
                  </span>
                  <span class="meta-item">
                    <i class="pi pi-calendar"></i> {{ coach.totalSessions }} sessions
                  </span>
                  <span class="meta-item" *ngIf="coach.upcomingSessions > 0" style="color: #48BB78;">
                    <i class="pi pi-clock"></i> {{ coach.upcomingSessions }} à venir
                  </span>
                  <span class="meta-item" *ngIf="coach.completedSessions > 0" style="color: #A0AEC0;">
                    <i class="pi pi-check-circle"></i> {{ coach.completedSessions }} complétées
                  </span>
                </div>
              </div>
            </div>
            <i class="pi expand-icon" [class.pi-chevron-down]="!coach.expanded" [class.pi-chevron-up]="coach.expanded"></i>
          </div>

          <div *ngIf="coach.expanded" class="accordion-body">
            <div *ngIf="!coach.sessions || coach.sessions.length === 0" class="empty-msg">
              <i class="pi pi-calendar"></i>
              <p>Aucune session planifiée pour ce coach</p>
            </div>

            <div *ngFor="let session of coach.sessions" class="session-card">
              <div class="session-header">
                <div class="session-title-block">
                  <h4>{{ session.titre }}</h4>
                  <span class="status-badge" [class]="'badge-' + session.statut.toLowerCase()">
                    {{ session.statut }}
                  </span>
                </div>
                <div class="session-actions">
                  <a *ngIf="session.meetLink" 
                     [href]="session.meetLink" 
                     target="_blank" 
                     class="action-btn meet-btn"
                     title="Rejoindre la réunion">
                    <i class="pi pi-video"></i>
                    <span>Meet</span>
                  </a>
                </div>
              </div>

              <div class="session-details">
                <div class="detail-row">
                  <span class="detail-label">
                    <i class="pi pi-calendar"></i> Date & Heure
                  </span>
                  <span class="detail-value">
                    {{ session.date | date:'dd/MM/yyyy à HH:mm' }}
                    <span class="duration">({{ session.dureeMinutes }} min)</span>
                  </span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">
                    <i class="pi pi-user"></i> Entrepreneur
                  </span>
                  <span class="detail-value">{{ session.entrepreneurName }}</span>
                </div>

                <div class="detail-row" *ngIf="session.programmeName">
                  <span class="detail-label">
                    <i class="pi pi-briefcase"></i> Programme
                  </span>
                  <span class="detail-value">{{ session.programmeName }}</span>
                </div>

                <div class="detail-row" *ngIf="session.description">
                  <span class="detail-label">
                    <i class="pi pi-info-circle"></i> Description
                  </span>
                  <span class="detail-value">{{ session.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Planning par Entrepreneur -->
      <div *ngIf="activeTab === 'entrepreneur' && !loading" class="tab-content">
        <div class="content-header">
          <div class="search-bar">
            <i class="pi pi-search"></i>
            <input 
              type="text" 
              placeholder="Rechercher un entrepreneur..." 
              [(ngModel)]="entSearch"
              (ngModelChange)="onEntrepreneurSearchChange($event)">
          </div>
          <span class="result-count">{{ filteredEntrepreneurs.length }} entrepreneur(s) trouvé(s)</span>
        </div>

        <div *ngIf="filteredEntrepreneurs.length === 0" class="empty-state">
          <i class="pi pi-inbox"></i>
          <p>Aucun entrepreneur trouvé</p>
        </div>

        <div *ngFor="let entrepreneur of filteredEntrepreneurs" class="accordion-card">
          <div class="accordion-header" (click)="toggleEntrepreneur(entrepreneur)">
            <div class="header-left">
              <div class="avatar-circle" style="background: linear-gradient(135deg, #4299E1, #63B3ED)">
                {{ getInitials(entrepreneur.entrepreneurName) }}
              </div>
              <div class="header-info">
                <h3>{{ entrepreneur.entrepreneurName }}</h3>
                <div class="header-meta">
                  <span class="meta-item">
                    <i class="pi pi-user"></i> Coach: {{ entrepreneur.coachName }}
                  </span>
                  <span class="meta-item" *ngIf="entrepreneur.programme">
                    <i class="pi pi-briefcase"></i> {{ entrepreneur.programme }}
                  </span>
                  <span class="meta-item">
                    <i class="pi pi-calendar"></i> {{ entrepreneur.totalSessions }} sessions
                  </span>
                  <span class="meta-item" *ngIf="entrepreneur.upcomingSessions > 0" style="color: #48BB78;">
                    <i class="pi pi-clock"></i> {{ entrepreneur.upcomingSessions }} à venir
                  </span>
                </div>
              </div>
            </div>
            <i class="pi expand-icon" [class.pi-chevron-down]="!entrepreneur.expanded" [class.pi-chevron-up]="entrepreneur.expanded"></i>
          </div>

          <div *ngIf="entrepreneur.expanded" class="accordion-body">
            <div *ngIf="!entrepreneur.sessions || entrepreneur.sessions.length === 0" class="empty-msg">
              <i class="pi pi-calendar"></i>
              <p>Aucune session planifiée pour cet entrepreneur</p>
            </div>

            <div *ngFor="let session of entrepreneur.sessions" class="session-card">
              <div class="session-header">
                <div class="session-title-block">
                  <h4>{{ session.titre }}</h4>
                  <span class="status-badge" [class]="'badge-' + session.statut.toLowerCase()">
                    {{ session.statut }}
                  </span>
                </div>
                <div class="session-actions">
                  <a *ngIf="session.meetLink" 
                     [href]="session.meetLink" 
                     target="_blank" 
                     class="action-btn meet-btn"
                     title="Rejoindre la réunion">
                    <i class="pi pi-video"></i>
                    <span>Meet</span>
                  </a>
                </div>
              </div>

              <div class="session-details">
                <div class="detail-row">
                  <span class="detail-label">
                    <i class="pi pi-calendar"></i> Date & Heure
                  </span>
                  <span class="detail-value">
                    {{ session.date | date:'dd/MM/yyyy à HH:mm' }}
                    <span class="duration">({{ session.dureeMinutes }} min)</span>
                  </span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">
                    <i class="pi pi-user"></i> Coach
                  </span>
                  <span class="detail-value">{{ session.coachName }}</span>
                </div>

                <div class="detail-row" *ngIf="session.programmeName">
                  <span class="detail-label">
                    <i class="pi pi-briefcase"></i> Programme
                  </span>
                  <span class="detail-value">{{ session.programmeName }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: To-Do & Livrables -->
      <div *ngIf="activeTab === 'todos' && !loading" class="tab-content">
        <div class="content-header">
          <div class="search-bar">
            <i class="pi pi-search"></i>
            <input 
              type="text" 
              placeholder="Rechercher une tâche ou un livrable..." 
              [(ngModel)]="todoSearch"
              (ngModelChange)="onTodoSearchChange($event)">
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <div class="filter-group">
            <label>Filtrer par Coach:</label>
            <select [(ngModel)]="selectedCoachIdForTodos" (ngModelChange)="loadTodosAndLivrables()">
              <option [value]="null">-- Tous les coachs --</option>
              <option *ngFor="let coach of coachListForTodos" [value]="coach.id">
                {{ coach.name }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Filtrer par Statut:</label>
            <select [(ngModel)]="selectedTodoStatus" (ngModelChange)="onStatusFilterChange()">
              <option [value]="null">-- Tous les statuts --</option>
              <option value="NON_DEMARREE">Non démarrée</option>
              <option value="EN_COURS">En cours</option>
              <option value="BLOQUE">Bloquée</option>
              <option value="EN_RETARD">En retard</option>
              <option value="TERMINEE">Terminée</option>
            </select>
          </div>
        </div>

        <!-- Todos Section -->
        <div class="section-card">
          <div class="section-header">
            <h3><i class="pi pi-list-check"></i> To-Do</h3>
            <span class="count-badge">{{ filteredTodos().length }}</span>
          </div>

          <div *ngIf="filteredTodos().length === 0" class="empty-msg">
            <i class="pi pi-inbox"></i>
            <p>Aucune tâche trouvée</p>
          </div>

          <div *ngIf="filteredTodos().length > 0" class="todos-list">
            <div *ngFor="let todo of filteredTodos()" class="todo-card">
              <div class="todo-header">
                <div class="todo-title-block">
                  <h4>{{ todo.titre }}</h4>
                  <span class="status-badge" [class]="'badge-' + todo.status.toLowerCase()">
                    {{ todo.status }}
                  </span>
                  <span class="priority-badge" [class]="'priority-' + todo.priorite.toLowerCase()">
                    {{ todo.priorite }}
                  </span>
                </div>
              </div>

              <div class="todo-info">
                <div class="info-row">
                  <span class="info-label">Entrepreneur:</span>
                  <span class="info-value">{{ todo.entrepreneurName }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Coach:</span>
                  <span class="info-value">{{ todo.coachName }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Programme:</span>
                  <span class="info-value">{{ todo.programmeName }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date limite:</span>
                  <span class="info-value">{{ todo.dateLimite | date:'dd/MM/yyyy' }}</span>
                </div>
                <div *ngIf="todo.description" class="info-row full-width">
                  <span class="info-label">Description:</span>
                  <span class="info-value">{{ todo.description }}</span>
                </div>
              </div>

              <div class="todo-documents" *ngIf="todo.documents && todo.documents.length > 0">
                <span class="doc-label">Documents:</span>
                <div class="doc-links">
                  <a *ngFor="let doc of todo.documents" 
                     [href]="doc.url" 
                     target="_blank" 
                     class="doc-link">
                    <i class="pi pi-file"></i> {{ doc.nom }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Livrables Section -->
        <div class="section-card">
          <div class="section-header">
            <h3><i class="pi pi-file-export"></i> Livrables</h3>
            <span class="count-badge">{{ filteredLivrables().length }}</span>
          </div>

          <div *ngIf="filteredLivrables().length === 0" class="empty-msg">
            <i class="pi pi-inbox"></i>
            <p>Aucun livrable trouvé</p>
          </div>

          <div *ngIf="filteredLivrables().length > 0" class="livrables-grid">
            <div *ngFor="let livrable of filteredLivrables()" class="livrable-card">
              <div class="livrable-header">
                <i class="pi pi-file"></i>
                <span class="file-name">{{ livrable.nom }}</span>
              </div>

              <div class="livrable-info">
                <div class="info-item">
                  <span class="label">Tâche:</span>
                  <span class="value">{{ livrable.tacheTitre }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Entrepreneur:</span>
                  <span class="value">{{ livrable.entrepreneurName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Coach:</span>
                  <span class="value">{{ livrable.coachName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Date:</span>
                  <span class="value">{{ livrable.dateUpload | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="info-item" *ngIf="livrable.fileSize">
                  <span class="label">Taille:</span>
                  <span class="value">{{ (livrable.fileSize / 1024 / 1024).toFixed(2) }} MB</span>
                </div>
              </div>

              <div class="livrable-actions">
                <a [href]="livrable.url" 
                   target="_blank" 
                   class="action-btn download-btn"
                   title="Télécharger">
                  <i class="pi pi-download"></i>
                  <span>Télécharger</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary-color: #ea5073;
      --secondary-color: #4299E1;
      --success-color: #48BB78;
      --warning-color: #ED8936;
      --text-primary: #2D3748;
      --text-secondary: #718096;
      --text-light: #A0AEC0;
      --bg-light: #f8f9fa;
      --bg-white: white;
      --border-color: #E2E8F0;
      --border-light: #EDF2F7;
    }

    .planning-page {
      padding: 2rem;
      background: var(--bg-light);
      min-height: calc(100vh - 70px);
      font-family: var(--font-family), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .page-header { margin-bottom: 2rem; }
    .header-content { margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { color: var(--text-secondary); margin-top: 0.5rem; font-size: 0.95rem; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
    .stat-card { background: white; border-radius: 12px; padding: 1rem 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border-left: 4px solid transparent; }
    .stat-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; }
    .stat-label { display: block; font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 0.25rem; }
    .stat-value { display: block; font-size: 1.75rem; font-weight: 700; color: var(--text-primary); }

    .tab-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background: white; padding: 0.5rem; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .tab { flex: 1; padding: 0.75rem 1rem; border-radius: 10px; border: none; background: transparent; font-family: inherit; font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s ease; }
    .tab.active { background: var(--primary-color); color: white; box-shadow: 0 4px 12px rgba(234,80,115,0.3); }
    .tab:hover:not(.active) { background: #FFF5F7; color: var(--primary-color); }

    .content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; }
    .search-bar { position: relative; flex: 1; max-width: 400px; }
    .search-bar input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.8rem; border-radius: 10px; border: 1px solid var(--border-color); background: white; font-family: inherit; font-size: 0.9rem; outline: none; transition: all 0.2s; }
    .search-bar input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(234,80,115,0.1); }
    .search-bar i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-light); }
    .result-count { color: var(--text-secondary); font-size: 0.85rem; font-weight: 500; }

    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; gap: 1rem; }
    .spinner { width: 50px; height: 50px; border: 4px solid var(--border-light); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-state p { color: var(--text-secondary); font-size: 0.95rem; }

    .empty-state { text-align: center; padding: 4rem 2rem; }
    .empty-state i { font-size: 3rem; color: var(--border-color); display: block; margin-bottom: 1rem; }
    .empty-state p { color: var(--text-light); font-size: 1rem; }

    .accordion-card { background: white; border-radius: 12px; margin-bottom: 0.75rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden; transition: box-shadow 0.2s; }
    .accordion-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .accordion-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; cursor: pointer; transition: background 0.2s; }
    .accordion-header:hover { background: #FAFBFC; }
    .header-left { display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 0; }
    .avatar-circle { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
    .header-info { min-width: 0; flex: 1; }
    .header-info h3 { margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-primary); }
    .header-meta { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 0.5rem; }
    .meta-item { font-size: 0.8rem; color: var(--text-light); display: flex; align-items: center; gap: 0.3rem; }
    .expand-icon { color: var(--text-secondary); transition: transform 0.3s; }

    .accordion-body { padding: 0 1.5rem 1.5rem; border-top: 1px solid var(--border-light); background: #FAFBFC; }
    .empty-msg { padding: 2rem 1rem; text-align: center; color: var(--text-light); }
    .empty-msg i { display: block; font-size: 2rem; margin-bottom: 0.5rem; color: var(--border-color); }

    .session-card { background: white; border-radius: 10px; padding: 1rem; margin-bottom: 1rem; border-left: 4px solid var(--primary-color); transition: all 0.2s; }
    .session-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .session-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
    .session-title-block { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
    .session-title-block h4 { margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
    .status-badge { font-size: 0.65rem; padding: 0.3rem 0.6rem; border-radius: 6px; font-weight: 600; text-transform: uppercase; white-space: nowrap; }
    .badge-planifiee { background: #EBF8FF; color: #2B6CB0; }
    .badge-confirmee { background: #C6F6D5; color: #276749; }
    .badge-realisee { background: #E2E8F0; color: #4A5568; }
    .badge-annulee { background: #FED7D7; color: #9B2C2C; }
    
    .session-actions { display: flex; gap: 0.5rem; }
    .action-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.9rem; border-radius: 8px; text-decoration: none; font-size: 0.8rem; font-weight: 600; transition: all 0.2s; border: none; cursor: pointer; }
    .meet-btn { background: #EBF8FF; color: #2B6CB0; }
    .meet-btn:hover { background: #BEE3F8; }
    
    .session-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
    .detail-row { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-label { font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem; }
    .detail-value { font-size: 0.9rem; color: var(--text-primary); font-weight: 500; }
    .duration { color: var(--text-light); font-size: 0.8rem; font-weight: normal; }

    .filters-section { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .filter-group { display: flex; align-items: center; gap: 0.75rem; }
    .filter-group label { font-weight: 600; color: var(--text-secondary); font-size: 0.9rem; white-space: nowrap; }
    .filter-group select { padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid var(--border-color); font-family: inherit; background: white; font-size: 0.9rem; outline: none; cursor: pointer; transition: all 0.2s; }
    .filter-group select:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(234,80,115,0.1); }

    .section-card { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--border-light); }
    .section-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem; }
    .count-badge { background: #EBF8FF; color: #2B6CB0; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; }

    .todos-list { display: grid; gap: 1rem; }
    .todo-card { background: #FAFBFC; border-radius: 10px; padding: 1rem; border-left: 4px solid var(--primary-color); }
    .todo-header { margin-bottom: 1rem; }
    .todo-title-block { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .todo-title-block h4 { margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
    .priority-badge { font-size: 0.65rem; padding: 0.3rem 0.6rem; border-radius: 6px; font-weight: 600; text-transform: uppercase; }
    .priority-basse { background: #C6F6D5; color: #276749; }
    .priority-moyenne { background: #FEFCBF; color: #975A16; }
    .priority-haute { background: #FED7D7; color: #9B2C2C; }
    
    .todo-info { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid white; }
    .info-row { display: flex; gap: 1rem; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .info-row.full-width { flex-direction: column; }
    .info-label { font-weight: 600; color: var(--text-secondary); min-width: 120px; }
    .info-value { color: var(--text-primary); }
    
    .todo-documents { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid white; }
    .doc-label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 0.5rem; }
    .doc-links { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .doc-link { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.8rem; background: white; border: 1px solid var(--border-color); border-radius: 6px; color: var(--primary-color); text-decoration: none; font-weight: 500; font-size: 0.8rem; transition: all 0.2s; }
    .doc-link:hover { background: var(--primary-color); color: white; border-color: var(--primary-color); }

    .livrables-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .livrable-card { background: #FAFBFC; border-radius: 10px; padding: 1rem; border: 1px solid var(--border-light); display: flex; flex-direction: column; transition: all 0.2s; }
    .livrable-card:hover { border-color: var(--primary-color); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .livrable-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid white; }
    .livrable-header i { font-size: 1.5rem; color: var(--primary-color); }
    .file-name { font-weight: 600; color: var(--text-primary); word-break: break-word; }
    .livrable-info { flex: 1; margin-bottom: 1rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.8rem; margin-bottom: 0.5rem; }
    .info-item .label { color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-item .value { color: var(--text-primary); font-weight: 500; }
    .livrable-actions { display: flex; gap: 0.5rem; }
    .download-btn { flex: 1; background: #48BB78; color: white !important; justify-content: center; }
    .download-btn:hover { background: #38A169; }

    @media (max-width: 768px) {
      .planning-page { padding: 1rem; }
      .page-header h1 { font-size: 1.5rem; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .tab-bar { flex-wrap: wrap; }
      .session-details { grid-template-columns: 1fr; }
      .livrables-grid { grid-template-columns: 1fr; }
      .header-meta { flex-direction: column; gap: 0.5rem; }
      .content-header { flex-direction: column; }
      .search-bar { max-width: 100%; }
      .result-count { order: 1; width: 100%; text-align: center; }
      .filters-section { flex-direction: column; }
      .filter-group { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class AdminPlanningComponent implements OnInit, OnDestroy {
  activeTab: string = 'coach';
  loading = false;
  coachSearch = '';
  entSearch = '';
  todoSearch = '';
  selectedCoachIdForTodos: string | null = null;
  selectedTodoStatus: string | null = null;

  overview: AdminPlanningOverview | null = null;
  filteredCoaches: CoachPlanningItem[] = [];
  filteredEntrepreneurs: EntrepreneurPlanningItem[] = [];
  todos: TodoItem[] = [];
  livrables: LivrableItem[] = [];
  coachListForTodos: { id: string; name: string }[] = [];

  private destroy$ = new Subject<void>();
  private coachSearch$ = new Subject<string>();
  private entSearch$ = new Subject<string>();
  private todoSearch$ = new Subject<string>();

  constructor(private adminPlanningService: AdminPlanningService) {}

  ngOnInit(): void {
    this.loadAllData();
    this.setupSearchDebouncing();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAllData(): void {
    this.loading = true;
    this.adminPlanningService.getOverview()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (overview) => {
          this.overview = overview;
          this.loadCoaches();
          this.loadEntrepreneurs();
          this.loadCoachList();
        },
        error: (err) => {
          console.error('Erreur lors du chargement de l\'overview:', err);
          this.loading = false;
        }
      });
  }

  private loadCoaches(): void {
    this.adminPlanningService.getCoachPlannings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (coaches) => {
          this.filteredCoaches = coaches;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des coachs:', err);
          this.loading = false;
        }
      });
  }

  private loadEntrepreneurs(): void {
    this.adminPlanningService.getEntrepreneurPlannings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (entrepreneurs) => {
          this.filteredEntrepreneurs = entrepreneurs;
        },
        error: (err) => console.error('Erreur lors du chargement des entrepreneurs:', err)
      });
  }

  private loadCoachList(): void {
    const coachMap = new Map<string, string>();
    this.filteredCoaches.forEach(coach => {
      coachMap.set(coach.coachId, coach.coachName);
    });
    this.coachListForTodos = Array.from(coachMap.entries())
      .map(([id, name]) => ({ id, name }));
  }

  private setupSearchDebouncing(): void {
    this.coachSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.filterCoaches());

    this.entSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.filterEntrepreneurs());

    this.todoSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {});
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'todos') {
      this.loadTodosAndLivrables();
    }
  }

  toggleCoach(coach: CoachPlanningItem): void {
    coach.expanded = !coach.expanded;
  }

  toggleEntrepreneur(entrepreneur: EntrepreneurPlanningItem): void {
    entrepreneur.expanded = !entrepreneur.expanded;
  }

  onCoachSearchChange(value: string): void {
    this.coachSearch = value;
    this.coachSearch$.next(value);
  }

  onEntrepreneurSearchChange(value: string): void {
    this.entSearch = value;
    this.entSearch$.next(value);
  }

  onTodoSearchChange(value: string): void {
    this.todoSearch = value;
    this.todoSearch$.next(value);
  }

  private filterCoaches(): void {
    if (!this.coachSearch.trim()) {
      this.loadCoaches();
      return;
    }
    const search = this.coachSearch.toLowerCase();
    this.filteredCoaches = this.filteredCoaches.filter(coach =>
      coach.coachName.toLowerCase().includes(search) ||
      (coach.email?.toLowerCase().includes(search) || false) ||
      (coach.specialty?.toLowerCase().includes(search) || false)
    );
  }

  private filterEntrepreneurs(): void {
    if (!this.entSearch.trim()) {
      this.loadEntrepreneurs();
      return;
    }
    const search = this.entSearch.toLowerCase();
    this.filteredEntrepreneurs = this.filteredEntrepreneurs.filter(ent =>
      ent.entrepreneurName.toLowerCase().includes(search) ||
      (ent.email?.toLowerCase().includes(search) || false) ||
      (ent.programme?.toLowerCase().includes(search) || false)
    );
  }

  loadTodosAndLivrables(): void {
    this.loading = true;
    const filters = {
      coachId: this.selectedCoachIdForTodos || undefined,
      statut: this.selectedTodoStatus || undefined
    };

    this.adminPlanningService.getAllTodos(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (todos) => {
          this.todos = todos;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des To-Do:', err);
          this.loading = false;
        }
      });

    this.adminPlanningService.getAllLivrables(filters as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (livrables) => {
          this.livrables = livrables;
        },
        error: (err) => console.error('Erreur lors du chargement des livrables:', err)
      });
  }

  onStatusFilterChange(): void {
    this.loadTodosAndLivrables();
  }

  filteredTodos(): TodoItem[] {
    if (!this.todoSearch.trim()) return this.todos;
    const search = this.todoSearch.toLowerCase();
    return this.todos.filter(todo =>
      todo.titre.toLowerCase().includes(search) ||
      todo.entrepreneurName.toLowerCase().includes(search) ||
      todo.programmeName.toLowerCase().includes(search)
    );
  }

  filteredLivrables(): LivrableItem[] {
    if (!this.todoSearch.trim()) return this.livrables;
    const search = this.todoSearch.toLowerCase();
    return this.livrables.filter(livrable =>
      livrable.nom.toLowerCase().includes(search) ||
      livrable.entrepreneurName.toLowerCase().includes(search) ||
      livrable.tacheTitre.toLowerCase().includes(search) ||
      livrable.programmeName.toLowerCase().includes(search)
    );
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }
}
