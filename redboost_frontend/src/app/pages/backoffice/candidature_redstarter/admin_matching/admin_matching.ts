import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environment';
import { MatchingService, MatchingSession, MatchingItem } from '../services/matching.service';
import { ThematiqueService, ThematiqueCoaching } from '../services/thematique.service';

interface Programme { id: number; nom: string; typeProgramme: string; dateDebut: string; dateFin: string; }
interface CoachUser { id: number; firstName: string; lastName: string; expertise: string; }

@Component({
    selector: 'app-admin-matching',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="matching-page">
      <!-- ── Header ─────────────────────── -->
      <div class="matching-header">
        <div>
          <h1 class="matching-title">Matching IA Coach / Entrepreneur</h1>
          <p class="matching-subtitle">Sélectionnez un programme, configurez les thématiques et lancez l'analyse IA</p>
        </div>
        <div class="header-actions" *ngIf="currentSession">
          <div class="ia-badge">
            <i class="pi pi-bolt"></i> IA RedBoost Activée
          </div>
          <button class="btn-validate-all" (click)="validateSession()" [disabled]="bulkLoading">
            {{ bulkLoading ? 'Validation...' : 'Valider tous les matchings (' + results.length + ')' }}
          </button>
        </div>
      </div>

      <!-- ── Tabs ─────────────────────── -->
      <div class="matching-tabs">
        <button class="tab-btn" [class.active]="activeTab === 'nouveau'" (click)="activeTab = 'nouveau'">
          Nouveau Matching
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'thematiques'" (click)="activeTab = 'thematiques'">
          Thématiques
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'historique'" (click)="setTab('historique')">
          Historique
        </button>
      </div>

      <!-- ════════════════════════════════════════════════════ -->
      <!-- TAB: Nouveau Matching                                -->
      <!-- ════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'nouveau'" class="tab-content">
        <div class="card">
          <div class="card-header-row">
            <div class="card-icon"><i class="pi pi-bolt"></i></div>
            <h2 class="card-title">Lancer le Matching IA</h2>
          </div>

          <div class="form-grid">
            <!-- Programme -->
            <div class="form-group">
              <label>Programme <span class="required">*</span></label>
              <select [(ngModel)]="selectedProgId" (change)="onProgChange()" class="form-select">
                <option [ngValue]="0">Sélectionnez un programme...</option>
                <option *ngFor="let p of programmes" [ngValue]="p.id">{{ p.nom }}</option>
              </select>
            </div>

            <!-- Thématique -->
            <div class="form-group">
              <label>Thématique du matching</label>
              <select [(ngModel)]="selectedThematiqueId" class="form-select">
                <option [ngValue]="0">Toutes les thématiques...</option>
                <option *ngFor="let t of thematiques" [ngValue]="t.id">
                  {{ t.nom }} ({{ t.dateDebut }} → {{ t.dateFin }})
                </option>
              </select>
              <p class="hint">Optionnel : la thématique influence le score IA (30% du poids)</p>
            </div>
          </div>

          <!-- Stats -->
          <div *ngIf="selectedProgId && stats" class="stats-row">
            <span class="stat-badge stat-warning">
              En attente : {{ stats.unmatchedCount }}
            </span>
            <span class="stat-badge stat-success">
              Matchés actifs : {{ stats.activeCount }}
            </span>
          </div>

          <!-- Launch button -->
          <div *ngIf="selectedProgId" class="launch-section">
            <div *ngIf="stats && stats.unmatchedCount === 0" class="empty-state-inline">
              <p><strong>Félicitations !</strong> Tous les entrepreneurs ont déjà un coaching actif.</p>
            </div>
            <button *ngIf="!stats || stats.unmatchedCount > 0"
              class="btn-launch" (click)="runMatching()" [disabled]="isLoading">
              {{ isLoading ? 'L\'IA analyse les profils...' : 'Lancer le matching IA' }}
            </button>
            <p class="hint" *ngIf="!stats || stats.unmatchedCount > 0">
              L'IA propose le meilleur coach pour chaque entrepreneur du programme.
            </p>
          </div>
        </div>

        <!-- ── Résultats ── -->
        <div *ngIf="currentSession" class="results-section">
          <div class="results-header">
            <div>
              <h3>Propositions de Matching</h3>
              <p class="results-meta">Session #{{ currentSession.id }} • {{ results.length }} matchings générés</p>
            </div>
            <button class="btn-validate-all" (click)="validateSession()" [disabled]="bulkLoading">
              Tout Valider
            </button>
          </div>

          <div *ngFor="let m of results" class="matching-card" [style.border-left-color]="scoreColor(m.scoreIa)">
            <div class="mc-body">
              <div class="mc-person">
                <div class="avatar avatar-ent">{{ getInitial(m.entName) }}</div>
                <div>
                  <p class="person-name">{{ m.entName }}</p>
                  <p class="person-detail">{{ m.entSector }}</p>
                </div>
              </div>

              <div class="mc-arrow">
                <span class="arrow-icon"><i class="pi pi-arrow-right"></i></span>
                <span class="score-text" [style.color]="scoreColor(m.scoreIa)">{{ m.scoreIa }}%</span>
              </div>

              <div class="mc-person">
                <div class="avatar avatar-coach">{{ getInitial(m.coachName) }}</div>
                <div>
                  <p class="person-name">{{ m.coachName }}</p>
                  <p class="person-detail">{{ m.coachExpertise }}</p>
                  <div class="score-badge" [style.background]="scoreColor(m.scoreIa) + '18'" [style.color]="scoreColor(m.scoreIa)">
                    Score IA : {{ m.scoreIa }}%
                  </div>
                </div>
              </div>

              <div class="mc-actions">
                <button class="btn-action-validate" (click)="validateSingle(m.matchingId)" [disabled]="singleLoading[m.matchingId]">
                  {{ singleLoading[m.matchingId] ? '...' : 'Valider' }}
                </button>
              </div>
            </div>

            <div class="mc-ia-box" *ngIf="m.justification">
              <span class="ia-label">Analyse IA : </span>{{ m.justification }}
            </div>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════ -->
      <!-- TAB: Thématiques                                     -->
      <!-- ════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'thematiques'" class="tab-content">
        <div class="card">
          <div class="card-header-row">
            <div class="card-icon"><i class="pi pi-list"></i></div>
            <h2 class="card-title">Gestion des Thématiques de Coaching</h2>
          </div>

          <!-- Programme selector -->
          <div class="form-group" style="max-width: 400px; margin-bottom: 20px;">
            <label>Programme</label>
            <select [(ngModel)]="selectedProgId" (change)="onProgChange()" class="form-select">
              <option [ngValue]="0">Sélectionnez un programme...</option>
              <option *ngFor="let p of programmes" [ngValue]="p.id">{{ p.nom }}</option>
            </select>
          </div>

          <!-- Add Thematique Form -->
          <div *ngIf="selectedProgId" class="thematique-form">
            <h4>{{ editingThematique ? 'Modifier la thématique' : 'Nouvelle thématique' }}</h4>
            <div class="form-grid-3">
              <div class="form-group">
                <label>Nom *</label>
                <input [(ngModel)]="newThematique.nom" placeholder="Ex: Business Model" class="form-input" />
              </div>
              <div class="form-group">
                <label>Date de début *</label>
                <input type="date" [(ngModel)]="newThematique.dateDebut" class="form-input" />
              </div>
              <div class="form-group">
                <label>Date de fin *</label>
                <input type="date" [(ngModel)]="newThematique.dateFin" class="form-input" />
              </div>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="newThematique.description" rows="2" placeholder="Description de la thématique..." class="form-input"></textarea>
            </div>
            <div class="form-actions">
              <button class="btn-launch" (click)="saveThematique()">
                {{ editingThematique ? 'Mettre à jour' : 'Ajouter' }}
              </button>
              <button *ngIf="editingThematique" class="btn-cancel" (click)="cancelEditThematique()">Annuler</button>
            </div>
          </div>

          <!-- List -->
          <div *ngIf="selectedProgId && thematiques.length > 0" class="thematiques-list">
            <div *ngFor="let t of thematiques" class="thematique-card">
              <div class="tc-info">
                <div class="tc-name">{{ t.nom }}</div>
                <div class="tc-dates">{{ t.dateDebut }} - {{ t.dateFin }}</div>
                <div class="tc-desc" *ngIf="t.description">{{ t.description }}</div>
              </div>
              <div class="tc-right">
                <span class="status-badge" [class.active]="t.statut === 'ACTIVE'" [class.expired]="t.statut === 'TERMINEE'">
                  {{ t.statut }}
                </span>
                <div class="tc-actions">
                  <button class="btn-sm" (click)="editThematique(t)"><i class="pi pi-pencil"></i></button>
                  <button class="btn-sm btn-sm-danger" (click)="deleteThematique(t.id!)"><i class="pi pi-trash"></i></button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="selectedProgId && thematiques.length === 0" class="empty-state-inline">
            <p>Aucune thématique définie pour ce programme.</p>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════ -->
      <!-- TAB: Historique                                      -->
      <!-- ════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'historique'" class="tab-content">
        <div class="card">
          <div class="card-header-row">
            <div class="card-icon"><i class="pi pi-clock"></i></div>
            <h2 class="card-title">Historique des Matchings</h2>
          </div>

          <div class="form-group" style="max-width: 400px; margin-bottom: 20px;">
            <label>Programme</label>
            <select [(ngModel)]="selectedProgId" (change)="onProgChange()" class="form-select">
              <option [ngValue]="0">Sélectionnez un programme...</option>
              <option *ngFor="let p of programmes" [ngValue]="p.id">{{ p.nom }}</option>
            </select>
          </div>

          <div *ngIf="historyLoading" class="loading-box">
            Chargement de l'historique...
          </div>

          <div *ngIf="!historyLoading && history.length === 0 && selectedProgId" class="empty-state-inline">
            <p>Aucun matching validé dans l'historique.</p>
          </div>

          <div *ngFor="let m of history" class="history-card">
            <div class="hc-left">
              <div class="hc-pair">
                <div class="avatar avatar-ent">{{ m.entrepreneur?.nom?.[0] || 'E' }}</div>
                <div>
                  <p class="hc-role">Entrepreneur</p>
                  <p class="hc-name">{{ m.entrepreneur?.nom || 'N/A' }}</p>
                </div>
              </div>
              <div class="hc-arrow"><i class="pi pi-arrow-right"></i></div>
              <div class="hc-pair">
                <div class="avatar avatar-coach">{{ m.coach?.prenom?.[0] || 'C' }}</div>
                <div>
                  <p class="hc-role">Coach</p>
                  <p class="hc-name">{{ m.coach?.prenom }} {{ m.coach?.nom }}</p>
                </div>
              </div>
            </div>
            <div class="hc-right">
              <p class="hc-score" [style.color]="scoreColor(m.scoreIa)">{{ m.scoreIa }}%</p>
              <p class="hc-score-label">Score IA</p>
              <span class="status-badge active">{{ m.statut }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    `,
    styles: [`
      :host { display: block; }

      .matching-page { padding: 24px; background: #F5F6FA; min-height: 100vh; }

      .matching-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
      .matching-title { font-size: 28px; font-weight: 800; color: #1A1A2E; margin: 0; }
      .matching-subtitle { color: #8a8a8a; font-size: 14px; margin-top: 4px; }
      .header-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
      .ia-badge {
        display: flex; align-items: center; gap: 6px; padding: 8px 16px;
        border-radius: 12px; font-size: 13px; font-weight: 700; color: #fff;
        background: linear-gradient(135deg, #ea5073, #6d3345);
      }

      /* Tabs */
      .matching-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
      .tab-btn {
        padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600;
        border: none; cursor: pointer; transition: all .2s;
        background: #F3F4F6; color: #6B7280;
      }
      .tab-btn.active { background: #ea5073; color: #fff; }
      .tab-btn:hover:not(.active) { background: #E5E7EB; }

      /* Cards */
      .card {
        background: #fff; border-radius: 20px; padding: 24px;
        box-shadow: 0 2px 16px rgba(0,0,0,0.07); margin-bottom: 20px;
      }
      .card-header-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
      .card-icon {
        width: 36px; height: 36px; border-radius: 10px; display: flex;
        align-items: center; justify-content: center; font-size: 16px;
        background: linear-gradient(135deg, #ea5073, #6d3345); color: white;
      }
      .card-title { font-size: 18px; font-weight: 700; color: #1A1A2E; margin: 0; }

      /* Forms */
      .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
      .form-group { display: flex; flex-direction: column; gap: 6px; }
      .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
      .required { color: #ea5073; }
      .form-select, .form-input {
        width: 100%; padding: 10px 14px; border: 1px solid #E5E7EB;
        border-radius: 12px; font-size: 14px; outline: none;
        background: #fff; color: #333; transition: border-color .2s;
        box-sizing: border-box;
      }
      .form-select:focus, .form-input:focus { border-color: #ea5073; }
      textarea.form-input { resize: vertical; font-family: inherit; }
      .hint { font-size: 12px; color: #9CA3AF; font-style: italic; margin-top: 4px; }

      /* Stats */
      .stats-row { display: flex; gap: 12px; margin: 16px 0; }
      .stat-badge {
        display: flex; align-items: center; gap: 6px; padding: 6px 14px;
        border-radius: 20px; font-size: 12px; font-weight: 600;
      }
      .stat-warning { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
      .stat-success { background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; }

      /* Launch */
      .launch-section { margin-top: 20px; padding-top: 20px; border-top: 1px solid #F3F4F6; }
      .btn-launch {
        display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px;
        border-radius: 12px; font-size: 15px; font-weight: 700; color: #fff;
        background: linear-gradient(135deg, #ea5073, #6d3345); border: none;
        cursor: pointer; transition: all .2s;
        box-shadow: 0 4px 12px rgba(234, 80, 115, 0.3);
      }
      .btn-launch:hover { opacity: 0.9; transform: translateY(-1px); }
      .btn-launch:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

      .btn-cancel {
        padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600;
        background: #F3F4F6; color: #6B7280; border: none; cursor: pointer;
      }
      .form-actions { display: flex; gap: 12px; margin-top: 12px; }

      /* Validate all */
      .btn-validate-all {
        padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 700;
        background: #16a34a; color: #fff; border: none; cursor: pointer;
        transition: all .2s;
      }
      .btn-validate-all:hover { opacity: 0.9; }
      .btn-validate-all:disabled { opacity: 0.5; }

      /* Results */
      .results-section { margin-top: 24px; }
      .results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
      .results-header h3 { font-size: 22px; font-weight: 800; color: #1A1A2E; margin: 0; }
      .results-meta { font-size: 13px; color: #9CA3AF; margin-top: 4px; }

      /* Matching Card */
      .matching-card {
        background: #fff; border-radius: 20px; overflow: hidden;
        box-shadow: 0 2px 16px rgba(0,0,0,0.07); margin-bottom: 16px;
        border-left: 4px solid #ea5073;
      }
      .mc-body {
        padding: 20px; display: flex; align-items: center; gap: 16px;
      }
      .mc-person { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
      .avatar {
        width: 44px; height: 44px; border-radius: 12px; display: flex;
        align-items: center; justify-content: center; color: #fff;
        font-size: 14px; font-weight: 700; flex-shrink: 0;
      }
      .avatar-ent { background: linear-gradient(135deg, #ea5073, #6d3345); }
      .avatar-coach { background: linear-gradient(135deg, #3B82F6, #1D4ED8); }
      .person-name { font-weight: 700; font-size: 14px; color: #1A1A2E; margin: 0; }
      .person-detail { font-size: 12px; color: #9CA3AF; margin: 2px 0 0; }
      .score-badge {
        display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 10px;
        border-radius: 20px; margin-top: 4px;
      }

      .mc-arrow { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; padding: 0 8px; }
      .arrow-icon { font-size: 20px; color: #D1D5DB; }
      .score-text { font-size: 11px; font-weight: 700; }

      .mc-actions { display: flex; gap: 8px; flex-shrink: 0; }
      .btn-action-validate {
        padding: 8px 16px; border-radius: 10px; font-size: 12px; font-weight: 600;
        color: #fff; border: none; cursor: pointer; transition: all .2s;
        background: linear-gradient(135deg, #ea5073, #6d3345);
      }
      .btn-action-validate:hover { opacity: 0.9; }
      .btn-action-validate:disabled { opacity: 0.4; }

      .mc-ia-box {
        margin: 0 20px 16px; padding: 12px 16px; border-radius: 12px;
        font-size: 12px; color: #374151; line-height: 1.6;
        background: #EFF6FF; border-left: 4px solid #3B82F6;
      }
      .ia-label { font-weight: 700; color: #1D4ED8; }

      /* Thematiques */
      .thematique-form {
        background: #F9FAFB; border-radius: 16px; padding: 20px;
        margin-bottom: 20px; border: 1px solid #E5E7EB;
      }
      .thematique-form h4 { margin: 0 0 16px; font-size: 15px; font-weight: 700; color: #1A1A2E; }

      .thematiques-list { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
      .thematique-card {
        display: flex; justify-content: space-between; align-items: center;
        padding: 16px 20px; background: #F9FAFB; border-radius: 16px;
        border: 1px solid #E5E7EB; transition: all .2s;
      }
      .thematique-card:hover { background: #F3F4F6; }
      .tc-info { flex: 1; }
      .tc-name { font-weight: 700; font-size: 15px; color: #1A1A2E; }
      .tc-dates { font-size: 12px; color: #9CA3AF; margin-top: 4px; }
      .tc-desc { font-size: 13px; color: #6B7280; margin-top: 4px; }
      .tc-right { display: flex; align-items: center; gap: 12px; }
      .tc-actions { display: flex; gap: 6px; }
      .btn-sm {
        padding: 6px 10px; border-radius: 8px; font-size: 12px;
        border: 1px solid #E5E7EB; background: #fff; cursor: pointer;
      }
      .btn-sm:hover { background: #F3F4F6; }
      .btn-sm-danger:hover { background: #FEE2E2; }

      /* Status */
      .status-badge {
        padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;
      }
      .status-badge.active { background: #D1FAE5; color: #065F46; }
      .status-badge.expired { background: #FEE2E2; color: #991B1B; }

      /* History */
      .history-card {
        display: flex; justify-content: space-between; align-items: center;
        padding: 20px; background: #fff; border-radius: 20px;
        box-shadow: 0 2px 16px rgba(0,0,0,0.07); margin-bottom: 12px;
        border-left: 4px solid #22C55E;
      }
      .hc-left { display: flex; align-items: center; gap: 20px; flex: 1; }
      .hc-pair { display: flex; align-items: center; gap: 12px; }
      .hc-arrow { color: #D1D5DB; font-size: 20px; }
      .hc-role { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
      .hc-name { font-weight: 700; color: #1A1A2E; margin: 0; }
      .hc-right { text-align: center; min-width: 100px; }
      .hc-score { font-size: 22px; font-weight: 800; margin: 0; }
      .hc-score-label { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin: 2px 0 8px; }

      /* Utilities */
      .loading-box { text-align: center; padding: 40px; color: #9CA3AF; font-weight: 600; }
      .empty-state-inline {
        text-align: center; padding: 32px; color: #6B7280; font-size: 14px;
        background: #F9FAFB; border-radius: 16px; border: 1px dashed #E5E7EB;
      }

      @media (max-width: 768px) {
        .form-grid, .form-grid-3 { grid-template-columns: 1fr; }
        .mc-body { flex-wrap: wrap; }
        .matching-header { flex-direction: column; gap: 12px; }
      }
    `]
})
export class AdminMatchingComponent implements OnInit {
    activeTab: 'nouveau' | 'thematiques' | 'historique' = 'nouveau';

    programmes: Programme[] = [];
    selectedProgId = 0;
    selectedThematiqueId = 0;
    thematiques: ThematiqueCoaching[] = [];

    isLoading = false;
    errorMessage: string | null = null;
    loadingText = "L'IA analyse les profils...";
    launchText = 'Lancer le matching';
    bulkLoading = false;
    historyLoading = false;
    singleLoading: Record<number, boolean> = {};

    stats: { activeCount: number; unmatchedCount: number } | null = null;
    currentSession: MatchingSession | null = null;
    results: any[] = [];
    history: any[] = [];

    // Thematique form
    newThematique: Partial<ThematiqueCoaching> = { nom: '', description: '', dateDebut: '', dateFin: '' };
    editingThematique: ThematiqueCoaching | null = null;

    constructor(
        private http: HttpClient,
        private matchingSvc: MatchingService,
        private thematiqueSvc: ThematiqueService
    ) {}

    ngOnInit(): void {
        this.http.get<Programme[]>(`${environment.apiUrl}/backoffice/programmes`).subscribe({
            next: (data) => this.programmes = data,
            error: (e) => console.error('Failed to load programmes', e)
        });
    }

    onProgChange(): void {
        this.currentSession = null;
        this.results = [];
        this.stats = null;
        this.thematiques = [];
        this.selectedThematiqueId = 0;

        if (this.selectedProgId) {
            this.matchingSvc.getMatchingStats(this.selectedProgId).subscribe({
                next: (s) => this.stats = s,
                error: () => {}
            });
            this.thematiqueSvc.getByProgramme(this.selectedProgId).subscribe({
                next: (t) => this.thematiques = t,
                error: () => {}
            });
            if (this.activeTab === 'historique') {
                this.loadHistory();
            }
        }
    }

    setTab(tab: 'nouveau' | 'thematiques' | 'historique'): void {
        this.activeTab = tab;
        if (tab === 'historique' && this.selectedProgId) {
            this.loadHistory();
        }
    }

    // ─── Matching ────────────────────────────────────
    runMatching(): void {
        if (!this.selectedProgId) return;
        this.isLoading = true;
        const thId = this.selectedThematiqueId || undefined;
        this.matchingSvc.runMatchingIA(this.selectedProgId, thId).subscribe({
            next: (session) => {
                this.currentSession = session;
                if (session.matchings && session.matchings.length > 0) {
                    this.results = session.matchings.map(m => this.buildResultView(m));
                }
                this.isLoading = false;
                if (this.selectedProgId) {
                    this.matchingSvc.getMatchingStats(this.selectedProgId).subscribe(s => this.stats = s);
                }
            },
            error: (e) => {
                console.error('Matching failed', e);
                this.isLoading = false;
                alert('Erreur lors du matching IA: ' + (e.error?.message || e.message || 'Erreur inconnue'));
            }
        });
    }

    validateSession(): void {
        if (!this.currentSession) return;
        this.bulkLoading = true;
        this.matchingSvc.validateSession(this.currentSession.id, 1).subscribe({
            next: () => {
                this.bulkLoading = false;
                this.currentSession = null;
                this.results = [];
                this.setTab('historique');
            },
            error: (e) => { console.error(e); this.bulkLoading = false; }
        });
    }

    validateSingle(matchingId: number): void {
        this.singleLoading[matchingId] = true;
        this.matchingSvc.validateSingle(matchingId, 1).subscribe({
            next: () => {
                this.results = this.results.filter(r => r.matchingId !== matchingId);
                this.singleLoading[matchingId] = false;
                if (this.selectedProgId) {
                    this.matchingSvc.getMatchingStats(this.selectedProgId).subscribe(s => this.stats = s);
                }
                if (this.results.length === 0) {
                    this.currentSession = null;
                    this.setTab('historique');
                }
            },
            error: (e) => { console.error(e); this.singleLoading[matchingId] = false; }
        });
    }

    loadHistory(): void {
        if (!this.selectedProgId) return;
        this.historyLoading = true;
        this.matchingSvc.getHistory(this.selectedProgId).subscribe({
            next: (data) => { this.history = data; this.historyLoading = false; },
            error: () => this.historyLoading = false
        });
    }

    // ─── Thematiques ─────────────────────────────────
    saveThematique(): void {
        if (!this.selectedProgId || !this.newThematique.nom || !this.newThematique.dateDebut || !this.newThematique.dateFin) return;

        const th: ThematiqueCoaching = {
            programmeId: this.selectedProgId,
            nom: this.newThematique.nom!,
            description: this.newThematique.description,
            dateDebut: this.newThematique.dateDebut!,
            dateFin: this.newThematique.dateFin!
        };

        if (this.editingThematique) {
            this.thematiqueSvc.update(this.editingThematique.id!, th).subscribe({
                next: () => { this.cancelEditThematique(); this.onProgChange(); },
                error: (e) => console.error(e)
            });
        } else {
            this.thematiqueSvc.create(th).subscribe({
                next: () => {
                    this.newThematique = { nom: '', description: '', dateDebut: '', dateFin: '' };
                    this.onProgChange();
                },
                error: (e) => console.error(e)
            });
        }
    }

    editThematique(t: ThematiqueCoaching): void {
        this.editingThematique = t;
        this.newThematique = { nom: t.nom, description: t.description, dateDebut: t.dateDebut, dateFin: t.dateFin };
    }

    cancelEditThematique(): void {
        this.editingThematique = null;
        this.newThematique = { nom: '', description: '', dateDebut: '', dateFin: '' };
    }

    deleteThematique(id: number): void {
        if (!confirm('Supprimer cette thématique ?')) return;
        this.thematiqueSvc.delete(id).subscribe({
            next: () => this.onProgChange(),
            error: (e) => console.error(e)
        });
    }

    buildResultView(m: MatchingItem): any {
        // Find coach and entrepreneur names from available data
        const coach = this.getCoachById(m.coachId);
        return {
            matchingId: m.id,
            entName: 'Entrepreneur #' + m.entrepreneurId,
            entSector: '',
            coachName: coach ? `${coach.firstName} ${coach.lastName}` : `Coach #${m.coachId}`,
            coachExpertise: coach?.expertise || '',
            scoreIa: m.scoreIa,
            justification: m.justification
        };
    }

    private getCoachById(id: number): CoachUser | undefined {
        return undefined; // Coach details come from history endpoint
    }

    scoreColor(s: number): string {
        if (s >= 76) return '#22C55E';
        if (s >= 50) return '#F59E0B';
        return '#EF4444';
    }

    getInitial(name: string): string {
        return name ? name.charAt(0).toUpperCase() : '?';
    }
}
