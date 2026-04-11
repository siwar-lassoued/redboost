import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environment';
import { MatchingService, MatchingSession, MatchingItem } from '../services/matching.service';
import { ThematiqueService, ThematiqueCoaching } from '../services/thematique.service';

interface Programme { id: number; nom: string; typeProgramme: string; dateDebut: string; dateFin: string; }

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

            <!-- Thématique OBLIGATOIRE -->
            <div class="form-group">
              <label>Thématique du matching <span class="required">*</span></label>
              <select [(ngModel)]="selectedThematiqueId" class="form-select" [class.select-error]="selectedProgId && thematiques.length > 0 && !selectedThematiqueId">
                <option [ngValue]="0">-- Sélectionnez une thématique --</option>
                <option *ngFor="let t of thematiques" [ngValue]="t.id">
                  {{ t.nom }} ({{ t.dateDebut }} → {{ t.dateFin }})
                </option>
              </select>
              <p class="hint warning-hint" *ngIf="selectedProgId && thematiques.length > 0 && !selectedThematiqueId">
                ⚠️ La thématique est obligatoire pour lancer le matching IA
              </p>
              <p class="hint" *ngIf="!selectedProgId || thematiques.length === 0">Sélectionnez un programme avec des thématiques actives</p>
              <p class="hint success-hint" *ngIf="selectedThematiqueId">✓ Thématique sélectionnée — l'IA va prioriser les coachs compatibles</p>
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
            <div *ngIf="errorMessage" class="error-box">
              <p><strong>🚨 Erreur IA Backend :</strong> {{ errorMessage }}</p>
            </div>

            <div *ngIf="selectedProgId && thematiques.length === 0" class="info-box">
              <i class="pi pi-info-circle"></i>
              <p>Aucune thématique n'existe pour ce programme. Créez-en une dans l'onglet <strong>Thématiques</strong> avant de lancer le matching.</p>
            </div>

            <button *ngIf="!stats || stats.unmatchedCount > 0"
              class="btn-launch" (click)="runMatching()"
              [disabled]="isLoading || !selectedThematiqueId">
              {{ isLoading ? loadingText : launchText }}
            </button>
            <p class="hint" *ngIf="(!stats || stats.unmatchedCount > 0) && selectedThematiqueId">
              L'IA va proposer un <strong>TOP 3 de coachs</strong> pour chaque entrepreneur de ce programme, classés par score décroissant.
            </p>
          </div>
        </div>

        <!-- ── Résultats: Top 3 groupés par entrepreneur ── -->
        <div *ngIf="currentSession" class="results-section">
          <div class="results-header">
            <div>
              <h3>Propositions de Matching — TOP 3</h3>
              <p class="results-meta">Session #{{ currentSession.id }} • {{ groupedResults.length }} entrepreneur(s) • {{ totalPropositions }} propositions générées</p>
            </div>
            <button class="btn-validate-all" (click)="validateSession()" [disabled]="bulkLoading">
              {{ bulkLoading ? 'Validation...' : 'Valider tous les Rangs 1 (' + groupedResults.length + ')' }}
            </button>
          </div>

          <!-- Entrepreneur Group Card -->
          <div *ngFor="let group of groupedResults; let gi = index" class="entrepreneur-group">

            <!-- Entrepreneur Header -->
            <div class="eg-header">
              <div class="eg-avatar">{{ (group.entrepreneur?.nom || '?')[0] }}</div>
              <div>
                <h4 class="eg-name">{{ group.entrepreneur?.nom || 'Entrepreneur #' + group.entrepreneurId }}</h4>
                <div class="eg-meta">
                  <span *ngIf="group.entrepreneur?.entreprise">🏢 {{ group.entrepreneur.entreprise }}</span>
                  <span *ngIf="group.entrepreneur?.secteur">📌 {{ group.entrepreneur.secteur }}</span>
                  <span *ngIf="group.entrepreneur?.phaseMaturite">🚀 {{ group.entrepreneur.phaseMaturite }}</span>
                </div>
              </div>
              <div class="eg-badge">{{ group.propositions.length }} coach(s) proposé(s)</div>
            </div>

            <!-- Top 3 Coach Propositions -->
            <div class="eg-propositions">
              <div *ngFor="let m of group.propositions" class="prop-card"
                [class.prop-rank1]="m.rankTop === 1"
                [class.prop-rank2]="m.rankTop === 2"
                [class.prop-rank3]="m.rankTop === 3">

                <!-- Rank Badge + Score -->
                <div class="prop-header">
                  <div class="prop-rank" [class.rank-gold]="m.rankTop === 1" [class.rank-silver]="m.rankTop === 2" [class.rank-bronze]="m.rankTop === 3">
                    <span class="rank-icon">{{ m.rankTop === 1 ? '🥇' : m.rankTop === 2 ? '🥈' : '🥉' }}</span>
                    <span class="rank-label">{{ m.rankTop === 1 ? 'Recommandé' : 'Alternative ' + m.rankTop }}</span>
                  </div>
                  <div class="prop-score">
                    <div class="rc-score-circle small-circle" [style.background]="scoreColor(m.scoreIa)">
                      {{ m.scoreIa | number:'1.0-0' }}%
                    </div>
                    <span class="prop-score-label" [style.color]="scoreColor(m.scoreIa)">{{ scoreLabel(m.scoreIa) }}</span>
                  </div>
                  <div class="prop-actions">
                    <button class="btn-expand btn-sm" (click)="toggleExpand(m.matchingId)">
                      <i [class]="expandedCards[m.matchingId] ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                      {{ expandedCards[m.matchingId] ? 'Moins' : 'Détails' }}
                    </button>
                    <button class="btn-action-validate" (click)="validateSingle(m.matchingId)" [disabled]="singleLoading[m.matchingId]">
                      {{ singleLoading[m.matchingId] ? '...' : 'Choisir ce coach' }}
                    </button>
                  </div>
                </div>

                <!-- Coach Summary -->
                <div class="prop-coach-summary">
                  <div class="coach-avatar">{{ (m.coach?.prenom || '?')[0] }}{{ (m.coach?.nom || '')[0] }}</div>
                  <div class="coach-info">
                    <div class="coach-name">{{ m.coach?.prenom }} {{ m.coach?.nom }}</div>
                    <div class="coach-meta">
                      <span *ngIf="m.coach?.expertise">{{ m.coach.expertise }}</span>
                      <span *ngIf="m.coach?.secteur"> • {{ m.coach.secteur }}</span>
                      <span *ngIf="m.coach?.yearsOfExperience"> • {{ m.coach.yearsOfExperience }} ans exp.</span>
                    </div>
                    <div class="coach-load">
                      <span class="load-badge" [class.load-warn]="m.coach?.nbEntrepreneursActifs >= 3">
                        {{ m.coach?.nbEntrepreneursActifs || 0 }}/5 actifs
                      </span>
                      <span *ngIf="m.coach?.noteMoyenneRating" class="rating-badge">⭐ {{ m.coach.noteMoyenneRating }}/5</span>
                    </div>
                  </div>
                </div>

                <!-- Justification IA toujours visible -->
                <div class="rc-ia-box" *ngIf="m.justification">
                  <span class="rc-ia-label">Analyse IA : </span>{{ m.justification }}
                </div>

                <!-- Détails extensibles -->
                <div *ngIf="expandedCards[m.matchingId]" class="rc-details">

                  <!-- Panel aide à la décision (decision_support) -->
                  <div class="rc-detail-section decision-support" *ngIf="m.parsedDecisionSupport">
                    <h5 class="rc-detail-title"><i class="pi pi-compass"></i> Aide à la décision admin</h5>
                    <div class="ds-items">
                      <div class="ds-item ds-positive">
                        <i class="pi pi-check-circle"></i>
                        <div>
                          <strong>Pourquoi ce coach ?</strong>
                          <p>{{ m.parsedDecisionSupport.pourquoi_ce_coach }}</p>
                        </div>
                      </div>
                      <div class="ds-item ds-warning">
                        <i class="pi pi-exclamation-triangle"></i>
                        <div>
                          <strong>Points non idéaux</strong>
                          <p>{{ m.parsedDecisionSupport.pourquoi_pas_ideal }}</p>
                        </div>
                      </div>
                      <div class="ds-item ds-info">
                        <i class="pi pi-info-circle"></i>
                        <div>
                          <strong>Choisir malgré son rang si...</strong>
                          <p>{{ m.parsedDecisionSupport.cas_ou_choisir_ce_coach }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Score Details -->
                  <div class="rc-detail-section" *ngIf="m.parsedScoresDetail">
                    <h5 class="rc-detail-title"><i class="pi pi-chart-bar"></i> Détail des scores pondérés</h5>
                    <div class="rc-scores-grid">
                      <div class="rc-score-item" *ngFor="let entry of objectEntries(m.parsedScoresDetail)">
                        <span class="rc-score-item-label">{{ formatScoreLabel(entry[0]) }}</span>
                        <div class="rc-score-bar-bg">
                          <div class="rc-score-bar" [style.width.%]="entry[1]" [style.background]="scoreColor(entry[1])"></div>
                        </div>
                        <span class="rc-score-item-value">{{ entry[1] }}%</span>
                      </div>
                    </div>
                  </div>

                  <!-- Points Forts -->
                  <div class="rc-detail-section" *ngIf="m.parsedPointsForts?.length">
                    <h5 class="rc-detail-title rc-detail-success"><i class="pi pi-check-circle"></i> Points Forts</h5>
                    <div class="rc-tags">
                      <span class="rc-tag rc-tag-success" *ngFor="let p of m.parsedPointsForts">{{ p }}</span>
                    </div>
                  </div>

                  <!-- Points Attention -->
                  <div class="rc-detail-section" *ngIf="m.parsedPointsAttention?.length">
                    <h5 class="rc-detail-title rc-detail-warning"><i class="pi pi-exclamation-triangle"></i> Points d'Attention</h5>
                    <div class="rc-tags">
                      <span class="rc-tag rc-tag-warning" *ngFor="let p of m.parsedPointsAttention">{{ p }}</span>
                    </div>
                  </div>

                  <!-- Recommandation Session 1 -->
                  <div class="rc-detail-section" *ngIf="m.recommandationSession1">
                    <h5 class="rc-detail-title"><i class="pi pi-comments"></i> Recommandation 1ère session</h5>
                    <p class="rc-recommandation">{{ m.recommandationSession1 }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
                  <div class="rc-info-item" *ngIf="m.entrepreneur?.email">
                    <span class="rc-info-label">Email</span>
                    <span class="rc-info-value">{{ m.entrepreneur.email }}</span>
                  </div>
                  <div class="rc-info-item" *ngIf="m.entrepreneur?.telephone">
                    <span class="rc-info-label">Téléphone</span>
                    <span class="rc-info-value">{{ m.entrepreneur.telephone }}</span>
                  </div>
                  <div class="rc-info-item" *ngIf="m.entrepreneur?.entreprise">
                    <span class="rc-info-label">Entreprise</span>
                    <span class="rc-info-value">{{ m.entrepreneur.entreprise }}</span>
                  </div>
                  <div class="rc-info-item" *ngIf="m.entrepreneur?.secteur">
                    <span class="rc-info-label">Secteur</span>
                    <span class="rc-info-value">{{ m.entrepreneur.secteur }}</span>
                  </div>
                  <div class="rc-info-item" *ngIf="m.entrepreneur?.phaseMaturite">
                    <span class="rc-info-label">Phase de maturité</span>
                    <span class="rc-info-value">{{ m.entrepreneur.phaseMaturite }}</span>
                  </div>
                  <div class="rc-info-item" *ngIf="m.entrepreneur?.region">
                    <span class="rc-info-label">Région</span>
                    <span class="rc-info-value">{{ m.entrepreneur.region }}</span>
                  </div>
                  <div class="rc-info-item rc-info-full" *ngIf="m.entrepreneur?.description">
                    <span class="rc-info-label">Description</span>
                    <span class="rc-info-value">{{ m.entrepreneur.description }}</span>
                  </div>
                  <div class="rc-info-item rc-info-full" *ngIf="m.entrepreneur?.innovation">
                    <span class="rc-info-label">Innovation</span>
                    <span class="rc-info-value">{{ m.entrepreneur.innovation }}</span>
                  </div>
                  <div class="rc-info-item rc-info-full" *ngIf="m.entrepreneur?.besoinsAccompagnement?.length">
                    <span class="rc-info-label">Besoins d'accompagnement</span>
                    <div class="rc-tags">
                      <span class="rc-tag rc-tag-ent" *ngFor="let b of m.entrepreneur.besoinsAccompagnement">{{ b }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Arrow -->
              <div class="rc-arrow-col">
                <div class="rc-arrow-wrapper">
                  <i class="pi pi-arrow-right"></i>
                </div>
              </div>

              <!-- Coach Profile -->
              <div class="rc-profile-card rc-coach">
                <div class="rc-profile-header">
                  <span class="rc-role-badge rc-role-coach">Coach</span>
                  <span class="rc-charge-badge" *ngIf="m.coach?.nbEntrepreneursActifs != null">
                    {{ m.coach.nbEntrepreneursActifs }} actif(s)
                  </span>
                </div>
                <h4 class="rc-name">{{ m.coach?.prenom }} {{ m.coach?.nom }}</h4>
                <div class="rc-info-grid">
                  <div class="rc-info-item" *ngIf="m.coach?.email">
                    <span class="rc-info-label">Email</span>
                    <span class="rc-info-value">{{ m.coach.email }}</span>
                  </div>
                  <div class="rc-info-item" *ngIf="m.coach?.phoneNumber">
                    <span class="rc-info-label">Téléphone</span>
                    <span class="rc-info-value">{{ m.coach.phoneNumber }}</span>
                  </div>
                  <div class="rc-info-item" *ngIf="m.coach?.expertise">
                    <span class="rc-info-label">Expertise</span>
                    <span class="rc-info-value">{{ m.coach.expertise }}</span>
                  </div>
                  <div class="rc-info-item" *ngIf="m.coach?.secteur">
                    <span class="rc-info-label">Secteur</span>
                    <span class="rc-info-value">{{ m.coach.secteur }}</span>
                  </div>
                  <div class="rc-info-item" *ngIf="m.coach?.skills">
                    <span class="rc-info-label">Compétences</span>
                    <span class="rc-info-value">{{ m.coach.skills }}</span>
                  </div>
                  <div class="rc-info-item" *ngIf="m.coach?.yearsOfExperience">
                    <span class="rc-info-label">Expérience</span>
                    <span class="rc-info-value">{{ m.coach.yearsOfExperience }} ans</span>
                  </div>
                  <div class="rc-info-item rc-info-full" *ngIf="m.coach?.bio">
                    <span class="rc-info-label">Bio</span>
                    <span class="rc-info-value">{{ m.coach.bio }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Expandable Details -->
            <div *ngIf="expandedCards[i]" class="rc-details">
              <!-- Score Details -->
              <div class="rc-detail-section" *ngIf="m.parsedScoresDetail">
                <h5 class="rc-detail-title"><i class="pi pi-chart-bar"></i> Détail des Scores</h5>
                <div class="rc-scores-grid">
                  <div class="rc-score-item" *ngFor="let entry of objectEntries(m.parsedScoresDetail)">
                    <span class="rc-score-item-label">{{ formatScoreLabel(entry[0]) }}</span>
                    <div class="rc-score-bar-bg">
                      <div class="rc-score-bar" [style.width.%]="entry[1]" [style.background]="scoreColor(entry[1])"></div>
                    </div>
                    <span class="rc-score-item-value">{{ entry[1] }}%</span>
                  </div>
                </div>
              </div>

              <!-- Points Forts -->
              <div class="rc-detail-section" *ngIf="m.parsedPointsForts?.length">
                <h5 class="rc-detail-title rc-detail-success"><i class="pi pi-check-circle"></i> Points Forts</h5>
                <div class="rc-tags">
                  <span class="rc-tag rc-tag-success" *ngFor="let p of m.parsedPointsForts">{{ p }}</span>
                </div>
              </div>

              <!-- Points Attention -->
              <div class="rc-detail-section" *ngIf="m.parsedPointsAttention?.length">
                <h5 class="rc-detail-title rc-detail-warning"><i class="pi pi-exclamation-triangle"></i> Points d'Attention</h5>
                <div class="rc-tags">
                  <span class="rc-tag rc-tag-warning" *ngFor="let p of m.parsedPointsAttention">{{ p }}</span>
                </div>
              </div>

              <!-- Recommandation -->
              <div class="rc-detail-section" *ngIf="m.recommandationSession1">
                <h5 class="rc-detail-title"><i class="pi pi-comments"></i> Recommandation 1ère Session</h5>
                <p class="rc-recommandation">{{ m.recommandationSession1 }}</p>
              </div>
            </div>

            <!-- Justification always visible -->
            <div class="rc-ia-box" *ngIf="m.justification">
              <span class="rc-ia-label">Analyse IA : </span>{{ m.justification }}
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
                <div>
                  <p class="hc-role">Entrepreneur</p>
                  <p class="hc-name">{{ m.entrepreneur?.nom || 'N/A' }}</p>
                </div>
              </div>
              <div class="hc-arrow"><i class="pi pi-arrow-right"></i></div>
              <div class="hc-pair">
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

      .select-error { border-color: #EF4444 !important; }
      .warning-hint { color: #D97706 !important; font-style: normal !important; font-weight: 600; }
      .success-hint { color: #16a34a !important; font-style: normal !important; font-weight: 600; }

      .info-box {
        display: flex; align-items: flex-start; gap: 10px; margin-bottom: 15px;
        padding: 12px 16px; background: #EFF6FF; border-left: 4px solid #3B82F6; border-radius: 12px;
      }
      .info-box p { margin: 0; color: #1D4ED8; font-size: 13px; }

      .error-box {
        margin-bottom: 15px; padding: 12px 16px; background: #FEF2F2;
        border-left: 4px solid #EF4444; border-radius: 12px;
      }
      .error-box p { margin: 0; color: #DC2626; font-size: 13px; }

      /* Validate all */
      .btn-validate-all {
        padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 700;
        background: #16a34a; color: #fff; border: none; cursor: pointer;
        transition: all .2s; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
      }
      .btn-validate-all:hover { opacity: 0.9; transform: translateY(-1px); }
      .btn-validate-all:disabled { opacity: 0.5; }

      /* Results */
      .results-section { margin-top: 24px; }
      .results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
      .results-header h3 { font-size: 22px; font-weight: 800; color: #1A1A2E; margin: 0; }
      .results-meta { font-size: 13px; color: #9CA3AF; margin-top: 4px; }

      /* ══════════ Entrepreneur Group ══════════ */
      .entrepreneur-group {
        background: #fff; border-radius: 20px; overflow: hidden;
        box-shadow: 0 2px 16px rgba(0,0,0,0.07); margin-bottom: 28px;
        border: 1px solid #E5E7EB;
      }
      .eg-header {
        display: flex; align-items: center; gap: 16px; padding: 20px 24px;
        background: linear-gradient(135deg, #1A1A2E, #2d2d4e);
        color: #fff;
      }
      .eg-avatar {
        width: 48px; height: 48px; border-radius: 50%; background: rgba(234,80,115,0.8);
        display: flex; align-items: center; justify-content: center;
        font-size: 22px; font-weight: 800; flex-shrink: 0;
      }
      .eg-name { font-size: 18px; font-weight: 800; margin: 0 0 4px; }
      .eg-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #CBD5E1; }
      .eg-badge {
        margin-left: auto; padding: 6px 14px; background: rgba(234,80,115,0.2);
        border: 1px solid rgba(234,80,115,0.4); border-radius: 20px;
        font-size: 12px; font-weight: 700; color: #FDA4AF; white-space: nowrap;
      }

      .eg-propositions { display: flex; flex-direction: column; gap: 0; }

      /* ══════════ Proposition Card ══════════ */
      .prop-card {
        border-bottom: 1px solid #F3F4F6; padding: 20px 24px;
        transition: background .15s;
      }
      .prop-card:last-child { border-bottom: none; }
      .prop-rank1 { background: #FFFBEB; }
      .prop-rank2 { background: #FAFAFA; }
      .prop-rank3 { background: #F9FAFB; }

      .prop-header { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; }
      .prop-rank { display: flex; align-items: center; gap: 8px; min-width: 150px; }
      .rank-icon { font-size: 20px; }
      .rank-label { font-size: 13px; font-weight: 700; }
      .rank-gold .rank-label { color: #B45309; }
      .rank-silver .rank-label { color: #6B7280; }
      .rank-bronze .rank-label { color: #92400E; }

      .prop-score { display: flex; align-items: center; gap: 10px; }
      .small-circle { width: 44px !important; height: 44px !important; font-size: 13px !important; }
      .prop-score-label { font-size: 12px; font-weight: 700; }

      .prop-actions { display: flex; gap: 8px; margin-left: auto; }

      .prop-coach-summary { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
      .coach-avatar {
        width: 42px; height: 42px; border-radius: 50%;
        background: linear-gradient(135deg, #2a7b8c, #1a4d5c);
        display: flex; align-items: center; justify-content: center;
        font-size: 15px; font-weight: 800; color: #fff; flex-shrink: 0;
      }
      .coach-info { flex: 1; }
      .coach-name { font-size: 16px; font-weight: 700; color: #1A1A2E; }
      .coach-meta { font-size: 12px; color: #6B7280; margin-top: 2px; }
      .coach-load { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
      .load-badge {
        font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px;
        background: #D1FAE5; color: #065F46;
      }
      .load-badge.load-warn { background: #FEF3C7; color: #92400E; }
      .rating-badge { font-size: 11px; font-weight: 700; color: #92400E; }

      /* Decision support panel */
      .decision-support { background: #F0FDF4; border: 1px solid #BBF7D0 !important; }
      .ds-items { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
      .ds-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 10px; }
      .ds-item i { font-size: 16px; margin-top: 2px; flex-shrink: 0; }
      .ds-item strong { display: block; font-size: 12px; font-weight: 700; margin-bottom: 2px; }
      .ds-item p { margin: 0; font-size: 13px; line-height: 1.5; color: #374151; }
      .ds-positive { background: #F0FFF4; border: 1px solid #C6F6D5; }
      .ds-positive i { color: #16a34a; }
      .ds-warning { background: #FFFBEB; border: 1px solid #FDE68A; }
      .ds-warning i { color: #D97706; }
      .ds-info { background: #EFF6FF; border: 1px solid #BFDBFE; }
      .ds-info i { color: #2563EB; }

      .rc-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 16px 20px; background: #F9FAFB; border-bottom: 1px solid #F3F4F6;
      }
      .rc-score-section { display: flex; align-items: center; gap: 12px; }
      .rc-score-circle {
        width: 52px; height: 52px; border-radius: 50%; display: flex;
        align-items: center; justify-content: center; color: #fff;
        font-size: 15px; font-weight: 800; flex-shrink: 0;
      }
      .rc-score-label { font-size: 11px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
      .rc-score-level { font-size: 14px; font-weight: 700; margin: 2px 0 0; }
      .rc-actions { display: flex; gap: 8px; align-items: center; }
      .btn-expand {
        padding: 8px 14px; border-radius: 10px; font-size: 12px; font-weight: 600;
        background: #fff; color: #6B7280; border: 1px solid #E5E7EB; cursor: pointer;
        display: flex; align-items: center; gap: 6px; transition: all .2s;
      }
      .btn-expand:hover { background: #F3F4F6; }
      .btn-action-validate {
        padding: 8px 18px; border-radius: 10px; font-size: 12px; font-weight: 700;
        color: #fff; border: none; cursor: pointer; transition: all .2s;
        background: linear-gradient(135deg, #16a34a, #15803d);
        box-shadow: 0 2px 8px rgba(22, 163, 74, 0.25);
      }
      .btn-action-validate:hover { opacity: 0.9; transform: translateY(-1px); }
      .btn-action-validate:disabled { opacity: 0.4; }

      /* Profiles */
      .rc-profiles {
        display: grid; grid-template-columns: 1fr auto 1fr;
        gap: 0; padding: 20px;
      }
      .rc-profile-card {
        padding: 16px; border-radius: 16px; border: 1px solid #F3F4F6;
        background: #FAFBFC;
      }
      .rc-ent { border-left: 3px solid #ea5073; }
      .rc-coach { border-left: 3px solid #2a7b8c; }
      .rc-profile-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
      .rc-role-badge {
        font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px;
        text-transform: uppercase; letter-spacing: 0.04em;
      }
      .rc-role-ent { background: #FFF0F5; color: #C0392B; }
      .rc-role-coach { background: #E8F5F7; color: #2a7b8c; }
      .rc-charge-badge {
        font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 20px;
        background: #FEF3C7; color: #92400E;
      }
      .rc-name { font-size: 16px; font-weight: 700; color: #1A1A2E; margin: 0 0 12px; }
      .rc-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .rc-info-item { display: flex; flex-direction: column; gap: 2px; }
      .rc-info-full { grid-column: 1 / -1; }
      .rc-info-label { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.04em; }
      .rc-info-value { font-size: 13px; color: #374151; line-height: 1.4; word-break: break-word; }

      .rc-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
      .rc-tag {
        font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px;
      }
      .rc-tag-ent { background: #FFF0F5; color: #C0392B; }
      .rc-tag-success { background: #D1FAE5; color: #065F46; }
      .rc-tag-warning { background: #FEF3C7; color: #92400E; }

      .rc-arrow-col {
        display: flex; align-items: center; justify-content: center; padding: 0 16px;
      }
      .rc-arrow-wrapper {
        width: 40px; height: 40px; border-radius: 50%; background: #F3F4F6;
        display: flex; align-items: center; justify-content: center;
        color: #9CA3AF; font-size: 18px;
      }

      /* Expanded details */
      .rc-details {
        padding: 0 20px 16px; display: flex; flex-direction: column; gap: 16px;
        border-top: 1px solid #F3F4F6; margin-top: 0; padding-top: 16px;
      }
      .rc-detail-section {
        background: #F9FAFB; border-radius: 12px; padding: 14px 16px;
        border: 1px solid #F3F4F6;
      }
      .rc-detail-title {
        font-size: 13px; font-weight: 700; color: #1A1A2E; margin: 0 0 10px;
        display: flex; align-items: center; gap: 8px;
      }
      .rc-detail-success { color: #16a34a; }
      .rc-detail-warning { color: #D97706; }

      .rc-scores-grid { display: flex; flex-direction: column; gap: 8px; }
      .rc-score-item { display: flex; align-items: center; gap: 10px; }
      .rc-score-item-label { font-size: 12px; font-weight: 600; color: #6B7280; min-width: 180px; }
      .rc-score-bar-bg {
        flex: 1; height: 8px; border-radius: 4px; background: #E5E7EB; overflow: hidden;
      }
      .rc-score-bar { height: 100%; border-radius: 4px; transition: width .5s ease; }
      .rc-score-item-value { font-size: 12px; font-weight: 700; color: #374151; min-width: 36px; text-align: right; }

      .rc-recommandation {
        font-size: 13px; color: #374151; line-height: 1.6; margin: 0;
        padding: 10px 14px; background: #fff; border-radius: 8px;
        border: 1px solid #E5E7EB;
      }

      /* IA Box */
      .rc-ia-box {
        margin: 0 20px 16px; padding: 12px 16px; border-radius: 12px;
        font-size: 12px; color: #374151; line-height: 1.6;
        background: #EFF6FF; border-left: 4px solid #3B82F6;
      }
      .rc-ia-label { font-weight: 700; color: #1D4ED8; }

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
        .rc-profiles { grid-template-columns: 1fr; }
        .rc-arrow-col { padding: 8px 0; }
        .rc-arrow-wrapper { transform: rotate(90deg); }
        .matching-header { flex-direction: column; gap: 12px; }
        .rc-header { flex-direction: column; gap: 12px; align-items: flex-start; }
        .rc-info-grid { grid-template-columns: 1fr; }
        .rc-score-item { flex-wrap: wrap; }
        .rc-score-item-label { min-width: 120px; }
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
    launchText = '🚀 Lancer le matching IA';
    bulkLoading = false;
    historyLoading = false;
    singleLoading: Record<number, boolean> = {};

    stats: { activeCount: number; unmatchedCount: number } | null = null;
    currentSession: MatchingSession | null = null;
    enrichedResults: any[] = [];
    groupedResults: any[] = []; // Groupés par entrepreneur (Top 3)
    totalPropositions = 0;
    expandedCards: Record<number, boolean> = {};
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
        this.enrichedResults = [];
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
        this.errorMessage = null;
        const thId = this.selectedThematiqueId || undefined;
        this.matchingSvc.runMatchingIA(this.selectedProgId, thId).subscribe({
            next: (session) => {
                this.currentSession = session;
                this.matchingSvc.getSessionDetails(session.id).subscribe({
                    next: (enriched) => {
                        this.enrichedResults = enriched.map(m => this.parseEnrichedResult(m));
                        this.groupedResults = this.buildGroupedResults(this.enrichedResults);
                        this.totalPropositions = this.enrichedResults.length;
                        this.isLoading = false;
                    },
                    error: () => {
                        if (session.matchings && session.matchings.length > 0) {
                            this.enrichedResults = session.matchings.map(m => ({
                                matchingId: m.id,
                                scoreIa: m.scoreIa,
                                justification: m.justification,
                                rankTop: m.rankTop || 1,
                                entrepreneurId: m.entrepreneurId,
                                entrepreneur: { nom: 'Entrepreneur #' + m.entrepreneurId },
                                coach: { nom: 'Coach #' + m.coachId }
                            }));
                            this.groupedResults = this.buildGroupedResults(this.enrichedResults);
                            this.totalPropositions = this.enrichedResults.length;
                        }
                        this.isLoading = false;
                    }
                });
                if (this.selectedProgId) {
                    this.matchingSvc.getMatchingStats(this.selectedProgId).subscribe(s => this.stats = s);
                }
            },
            error: (e) => {
                console.error('Matching failed', e);
                this.isLoading = false;
                if (typeof e.error === 'string') {
                    this.errorMessage = e.error.substring(0, 200) + '...';
                } else if (e.error && e.error.message) {
                    this.errorMessage = e.error.message;
                } else if (!e.ok && e.status === 500) {
                    this.errorMessage = "Le serveur a crashé ou n'arrive pas à contacter le service IA.";
                } else {
                    this.errorMessage = "Erreur serveur : " + e.message;
                }
            }
        });
    }

    parseEnrichedResult(m: any): any {
        const result = { ...m };
        try { result.parsedScoresDetail = typeof m.scoresDetail === 'string' ? JSON.parse(m.scoresDetail) : m.scoresDetail; } catch { result.parsedScoresDetail = null; }
        try { result.parsedPointsForts = typeof m.pointsForts === 'string' ? JSON.parse(m.pointsForts) : m.pointsForts; } catch { result.parsedPointsForts = null; }
        try { result.parsedPointsAttention = typeof m.pointsAttention === 'string' ? JSON.parse(m.pointsAttention) : m.pointsAttention; } catch { result.parsedPointsAttention = null; }
        try { result.parsedDecisionSupport = typeof m.decisionSupport === 'string' ? JSON.parse(m.decisionSupport) : m.decisionSupport; } catch { result.parsedDecisionSupport = null; }
        return result;
    }

    /** Grouper les matchings plats en groupes par entrepreneur avec leurs Top 3 */
    buildGroupedResults(flatResults: any[]): any[] {
        const map = new Map<number, any>();
        for (const m of flatResults) {
            const entId = m.entrepreneurId;
            if (!map.has(entId)) {
                map.set(entId, {
                    entrepreneurId: entId,
                    entrepreneur: m.entrepreneur,
                    propositions: []
                });
            }
            map.get(entId).propositions.push(m);
        }
        // Trier propositions par rank
        map.forEach(group => {
            group.propositions.sort((a: any, b: any) => (a.rankTop || 99) - (b.rankTop || 99));
        });
        return Array.from(map.values());
    }

    validateSession(): void {
        if (!this.currentSession) return;
        this.bulkLoading = true;
        this.matchingSvc.validateSession(this.currentSession.id, 1).subscribe({
            next: () => {
                this.bulkLoading = false;
                this.currentSession = null;
                this.enrichedResults = [];
                this.setTab('historique');
            },
            error: (e) => { console.error(e); this.bulkLoading = false; }
        });
    }

    validateSingle(matchingId: number): void {
        this.singleLoading[matchingId] = true;
        const selectedMatching = this.enrichedResults.find(r => r.matchingId === matchingId);
        this.matchingSvc.validateSingle(matchingId, 1).subscribe({
            next: () => {
                // Retire tous les rangs du même entrepreneur du groupe
                if (selectedMatching?.entrepreneurId) {
                    this.enrichedResults = this.enrichedResults.filter(
                        r => r.entrepreneurId !== selectedMatching.entrepreneurId
                    );
                } else {
                    this.enrichedResults = this.enrichedResults.filter(r => r.matchingId !== matchingId);
                }
                this.groupedResults = this.buildGroupedResults(this.enrichedResults);
                this.totalPropositions = this.enrichedResults.length;
                this.singleLoading[matchingId] = false;
                if (this.selectedProgId) {
                    this.matchingSvc.getMatchingStats(this.selectedProgId).subscribe(s => this.stats = s);
                }
                if (this.groupedResults.length === 0) {
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

    toggleExpand(index: number): void {
        this.expandedCards[index] = !this.expandedCards[index];
    }

    scoreColor(s: number): string {
        if (s >= 76) return '#22C55E';
        if (s >= 50) return '#F59E0B';
        return '#EF4444';
    }

    scoreLabel(s: number): string {
        if (s >= 76) return 'Excellente compatibilité';
        if (s >= 50) return 'Compatibilité moyenne';
        return 'Compatibilité faible';
    }

    formatScoreLabel(key: string): string {
        const labels: Record<string, string> = {
            'alignement_global':             'Alignement global (thématique + secteur) · 30%',
            'competences_complementaires':   'Compétences complémentaires · 25%',
            'stade_maturite':                'Stade de maturité · 20%',
            'compatibilite_humaine':         'Compatibilité humaine · 15%',
            'charge_coach':                  'Charge du coach · 10%',
            // Anciens labels (rétrocompatibilité)
            'alignement_thematique':         'Alignement thématique · 30%',
            'alignement_sectoriel':          'Alignement sectoriel'
        };
        return labels[key] || key.replace(/_/g, ' ');
    }

    objectEntries(obj: any): [string, number][] {
        if (!obj || typeof obj !== 'object') return [];
        return Object.entries(obj) as [string, number][];
    }
}
