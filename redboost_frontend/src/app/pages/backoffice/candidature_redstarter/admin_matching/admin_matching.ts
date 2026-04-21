import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environment';
import { MatchingService, MatchingSession } from '../services/matching.service';
import { ThematiqueService, ThematiqueCoaching } from '../services/thematique.service';

interface Programme { id: number; nom: string; typeProgramme: string; dateDebut: string; dateFin: string; }

@Component({
    selector: 'app-admin-matching',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="matching-page">
      <!-- Header -->
      <div class="matching-header">
        <div>
          <h1 class="matching-title">Matching Coach / Entrepreneur</h1>
          <p class="matching-subtitle">Vue unifiée — sélectionnez un programme puis gérez vos thématiques et matchings</p>
        </div>
      </div>

      <!-- Programme Selector -->
      <div class="card prog-card">
        <div class="form-group" style="max-width:480px">
          <label>Programme <span class="required">*</span></label>
          <select [(ngModel)]="selectedProgId" (change)="onProgChange()" class="form-select">
            <option [ngValue]="0">Tous les programmes (Filtre)</option>
            <option *ngFor="let p of programmes" [ngValue]="p.id">{{ p.nom }}</option>
          </select>
        </div>
      </div>

      <!-- Everything is displayed by default, programme filters thematiques -->
      <ng-container>

        <!-- ═══ Thématique Selector + Add ═══ -->
        <div class="card thematique-selector-card">
          <div class="thematique-selector-row">
            <div style="flex:1">
              <label class="section-label">Thématiques <span class="count-chip">{{ thematiques.length }}</span></label>
              <!-- "All" option -->
              <div class="th-list-item" [class.th-list-item-active]="selectedThematiqueId === 0" (click)="selectedThematiqueId = 0; onThematiqueChange()">
                <div class="th-list-item-main">
                  <span class="th-list-nom">Toutes les thématiques</span>
                </div>
              </div>
              <!-- One row per thematique -->
              <div *ngFor="let t of thematiques"
                   class="th-list-item"
                   [class.th-list-item-active]="selectedThematiqueId === t.id"
                   (click)="selectedThematiqueId = t.id!; onThematiqueChange()">
                <div class="th-list-item-main">
                  <span class="th-list-nom">{{ t.nom }}</span>
                  <span class="th-list-dates">{{ t.dateDebut }} → {{ t.dateFin }}</span>
                </div>
                <div class="th-list-prog">
                  <i class="pi pi-folder-open" style="font-size:11px;margin-right:4px;opacity:.7"></i>
                  {{ getProgrammeName(t.programmeId) }}
                </div>
                <span class="th-list-status"
                      [class.th-status-active]="t.statut === 'ACTIVE'"
                      [class.th-status-done]="t.statut === 'TERMINEE'"
                      [class.th-status-cancelled]="t.statut === 'ANNULEE'">{{ t.statut }}</span>
              </div>
            </div>
            <button class="btn-add-thematique" (click)="showAddForm = !showAddForm">
              <i class="pi pi-plus"></i> {{ showAddForm ? 'Annuler' : 'Ajouter Thématique' }}
            </button>
          </div>

          <!-- Add/Edit Form (collapsible) -->
          <div *ngIf="showAddForm" class="thematique-add-form">
            <h4>{{ editingThematique ? 'Modifier la thématique' : 'Nouvelle thématique' }}</h4>
            <div class="form-grid-3">
              <div class="form-group"><label>Programme *</label>
                <select [(ngModel)]="newThematique.programmeId" class="form-select">
                  <option disabled [value]="undefined">Sélectionnez...</option>
                  <option *ngFor="let p of programmes" [ngValue]="p.id">{{ p.nom }}</option>
                </select>
              </div>
              <div class="form-group"><label>Nom *</label><input [(ngModel)]="newThematique.nom" placeholder="Ex: Business Model" class="form-input" /></div>
              <div class="form-group"><label>Date de début *</label><input type="date" [(ngModel)]="newThematique.dateDebut" class="form-input" /></div>
              <div class="form-group"><label>Date de fin *</label><input type="date" [(ngModel)]="newThematique.dateFin" class="form-input" /></div>
            </div>
            <div class="form-group" style="margin-top:12px"><label>Description</label><textarea [(ngModel)]="newThematique.description" rows="2" placeholder="Description..." class="form-input"></textarea></div>
            <div class="form-actions">
              <button class="btn-launch" (click)="saveThematique()">{{ editingThematique ? 'Mettre à jour' : 'Ajouter' }}</button>
              <button *ngIf="editingThematique" class="btn-cancel" (click)="cancelEditThematique()">Annuler</button>
            </div>
          </div>
        </div>

        <!-- ═══ Selected Thématique content (when a specific one is chosen) ═══ -->
        <ng-container *ngIf="selectedThematiqueId">
          <div class="thematique-section">
            <!-- Header -->
            <div class="th-card-header" *ngIf="selectedThematiqueObj">
              <div class="th-card-title-row">
                <div class="th-card-info">
                  <h3 class="th-name">{{ selectedThematiqueObj.nom }}</h3>
                  <p class="th-dates">{{ selectedThematiqueObj.dateDebut }} → {{ selectedThematiqueObj.dateFin }}</p>
                </div>
                <span class="status-badge" [class.active]="selectedThematiqueObj.statut === 'ACTIVE'" [class.expired]="selectedThematiqueObj.statut === 'TERMINEE'">{{ selectedThematiqueObj.statut }}</span>
                <div class="th-card-actions-top">
                  <button class="btn-sm" (click)="editThematique(selectedThematiqueObj)"><i class="pi pi-pencil"></i></button>
                  <button class="btn-sm btn-sm-danger" (click)="deleteThematique(selectedThematiqueObj.id!)"><i class="pi pi-trash"></i></button>
                </div>
              </div>
              <p class="th-desc" *ngIf="selectedThematiqueObj.description">{{ selectedThematiqueObj.description }}</p>

              <!-- KPIs -->
              <div class="th-kpis" *ngIf="thematiqueMatchings.length > 0">
                <span class="stat-badge stat-success">Validés : {{ countByStatut('VALIDE') }}</span>
                <span class="stat-badge stat-warning">En attente : {{ countByStatut('PROPOSE') }}</span>
                <span class="stat-badge stat-info">Terminés : {{ countByStatut('TERMINE') }}</span>
                <span class="stat-badge stat-neutral">Libérés : {{ countByStatut('LIBERE') }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="th-action-bar">
              <button class="btn-launch" (click)="runMatchingIA()" [disabled]="isLoading || selectedThematiqueObj?.statut !== 'ACTIVE'">
                <i class="pi pi-bolt"></i> {{ isLoading ? loadingText : 'Lancer Matching IA' }}
              </button>
              <button class="btn-manual-toggle" (click)="toggleManualPanel()" [class.active]="showManualPanel">
                <i class="pi pi-users"></i> {{ showManualPanel ? 'Masquer Manuel' : 'Matching Manuel' }}
              </button>
            </div>

            <!-- Error -->
            <div *ngIf="errorMessage" class="error-box"><p><strong>Erreur IA :</strong> {{ errorMessage }}</p></div>

            <!-- IA Results (inline) -->
            <div *ngIf="currentSession" class="results-section">
              <div class="results-header">
                <div>
                  <h3>Propositions IA</h3>
                  <p class="results-meta">Session #{{ currentSession.id }} · {{ groupedResults.length }} entrepreneur(s)</p>
                </div>
                <button class="btn-validate-all" (click)="validateSession()" [disabled]="bulkLoading">
                  {{ bulkLoading ? 'Validation...' : 'Tout valider (' + groupedResults.length + ')' }}
                </button>
              </div>

              <div *ngFor="let group of groupedResults; let gi = index" class="match-row">
                <div class="match-score-col">
                  <div class="score-circle"
                    [class.score-high]="getTopMatch(group).scoreIa >= 76"
                    [class.score-mid]="getTopMatch(group).scoreIa >= 50 && getTopMatch(group).scoreIa < 76"
                    [class.score-low]="getTopMatch(group).scoreIa < 50">
                    {{ getTopMatch(group).scoreIa | number:'1.0-0' }}%
                  </div>
                  <div class="score-label-text"
                    [class.color-high]="getTopMatch(group).scoreIa >= 76"
                    [class.color-mid]="getTopMatch(group).scoreIa >= 50 && getTopMatch(group).scoreIa < 76"
                    [class.color-low]="getTopMatch(group).scoreIa < 50">
                    {{ scoreLabel(getTopMatch(group).scoreIa) }}
                  </div>
                </div>
                <div class="match-main-col">
                  <div class="match-card">
                    <div class="match-card-header">
                      <div class="profile-block">
                        <div class="profile-label">Entrepreneur</div>
                        <div class="profile-name">{{ group.entrepreneur?.nom || 'Entrepreneur #' + group.entrepreneurId }}</div>
                        <div class="profile-meta">
                          <span *ngIf="group.entrepreneur?.entreprise">{{ group.entrepreneur.entreprise }}</span>
                          <span class="meta-sep" *ngIf="group.entrepreneur?.entreprise && group.entrepreneur?.secteur"> · </span>
                          <span *ngIf="group.entrepreneur?.secteur">{{ group.entrepreneur.secteur }}</span>
                        </div>
                      </div>
                      <div class="match-divider"><i class="pi pi-arrow-right"></i><div class="match-divider-label">Recommandé IA</div></div>
                      <div class="profile-block">
                        <div class="profile-label">Coach</div>
                        <div class="profile-name">{{ getTopMatch(group).coach?.prenom }} {{ getTopMatch(group).coach?.nom }}</div>
                        <div class="profile-meta">
                          <span *ngIf="getTopMatch(group).coach?.expertise">{{ getTopMatch(group).coach.expertise }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="match-justification" *ngIf="getTopMatch(group).justification">
                      <span class="justification-label">Analyse IA :</span> {{ getTopMatch(group).justification }}
                    </div>
                    <div class="match-actions">
                      <button class="btn-accept" (click)="validateSingle(getTopMatch(group).matchingId)" [disabled]="singleLoading[getTopMatch(group).matchingId]">
                        <i class="pi pi-check"></i> {{ singleLoading[getTopMatch(group).matchingId] ? 'Validation...' : 'Accepter' }}
                      </button>
                      <button class="btn-details" (click)="toggleExpand(gi)">
                        <i [class]="expandedCards[gi] ? 'pi pi-chevron-up' : 'pi pi-eye'"></i>
                        {{ expandedCards[gi] ? 'Masquer' : 'Détails' }}
                      </button>
                      <button class="btn-change" *ngIf="group.propositions.length > 1" (click)="toggleAlternatives(group.entrepreneurId)">
                        <i class="pi pi-list"></i> {{ showAlternatives[group.entrepreneurId] ? 'Masquer' : 'Changer de coach' }}
                      </button>
                    </div>

                    <!-- Expanded details -->
                    <div *ngIf="expandedCards[gi]" class="details-panel">
                      <div class="details-section">
                        <h4 class="details-title"><i class="pi pi-user"></i> Profil Entrepreneur</h4>
                        <div class="details-grid">
                          <div class="detail-item" *ngIf="group.entrepreneur?.email"><span class="detail-key">Email</span><span class="detail-val">{{ group.entrepreneur.email }}</span></div>
                          <div class="detail-item" *ngIf="group.entrepreneur?.telephone"><span class="detail-key">Téléphone</span><span class="detail-val">{{ group.entrepreneur.telephone }}</span></div>
                          <div class="detail-item" *ngIf="group.entrepreneur?.region"><span class="detail-key">Région</span><span class="detail-val">{{ group.entrepreneur.region }}</span></div>
                          <div class="detail-item full-width" *ngIf="group.entrepreneur?.description"><span class="detail-key">Description</span><span class="detail-val">{{ group.entrepreneur.description }}</span></div>
                        </div>
                      </div>
                      <div class="details-section" *ngIf="getTopMatch(group).parsedScoresDetail">
                        <h4 class="details-title"><i class="pi pi-chart-bar"></i> Détail du score IA</h4>
                        <div *ngFor="let entry of objectEntries(getTopMatch(group).parsedScoresDetail)" class="score-bar-row">
                          <div class="score-bar-label">{{ formatScoreLabel(entry[0]) }}</div>
                          <div class="score-bar-bg"><div class="score-bar-fill" [style.width.%]="entry[1]" [class.bar-high]="entry[1] >= 76" [class.bar-mid]="entry[1] >= 50 && entry[1] < 76" [class.bar-low]="entry[1] < 50"></div></div>
                          <div class="score-bar-val">{{ entry[1] }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- Alternatives -->
                    <div *ngIf="showAlternatives[group.entrepreneurId]" class="alternatives-panel">
                      <div class="alt-header">Alternatives</div>
                      <div *ngFor="let alt of getAlternatives(group)" class="alt-row">
                        <div class="alt-info">
                          <div class="alt-rank">Rang {{ alt.rankTop }}</div>
                          <div class="alt-coach-name">{{ alt.coach?.prenom }} {{ alt.coach?.nom }}</div>
                          <div class="alt-coach-meta"><span *ngIf="alt.coach?.expertise">{{ alt.coach.expertise }}</span></div>
                        </div>
                        <div class="alt-score"><span class="alt-score-val">{{ alt.scoreIa | number:'1.0-0' }}%</span></div>
                        <button class="btn-select-alt" (click)="validateSingle(alt.matchingId)" [disabled]="singleLoading[alt.matchingId]">
                          <i class="pi pi-check-circle"></i> {{ singleLoading[alt.matchingId] ? '...' : 'Sélectionner' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ═══ Manual Matching Panel (collapsible) ═══ -->
            <div *ngIf="showManualPanel" class="manual-section">
              <div class="card">
                <div class="card-header-row">
                  <div class="card-icon"><i class="pi pi-users"></i></div>
                  <h2 class="card-title">Matching Manuel</h2>
                  <span class="manual-badge">Sans IA</span>
                </div>

                <div *ngIf="manualLoading" class="loading-box"><i class="pi pi-spin pi-spinner" style="font-size:24px;color:#ea5073"></i><p style="margin-top:12px">Chargement des candidats...</p></div>
                <div *ngIf="manualError" class="error-box" style="margin-top:16px"><p>{{ manualError }}</p></div>
                <div *ngIf="manualSuccess" class="success-toast"><i class="pi pi-check-circle"></i> Matching créé : <strong>{{ manualSuccess.entrepreneurNom }}</strong> → <strong>{{ manualSuccess.coachNom }}</strong></div>

                <div *ngIf="!manualLoading && (manualEntrepreneurs.length > 0 || manualCoaches.length > 0)" class="manual-workspace">
                  <!-- Left: Entrepreneurs -->
                  <div class="manual-panel">
                    <div class="manual-panel-header">
                      <h3 class="manual-panel-title">Entrepreneurs</h3>
                      <span class="manual-count-badge">{{ manualEntrepreneurs.length }}</span>
                    </div>
                    <div *ngIf="manualEntrepreneurs.length === 0" class="empty-state-inline" style="margin:16px"><p>Tous matchés.</p></div>
                    <div *ngFor="let ent of manualEntrepreneurs" class="manual-card" [class.manual-card-selected]="selectedEntrepreneur?.id === ent.id" (click)="selectEntrepreneur(ent)">
                      <div class="mc-top-row">
                        <div class="mc-name">{{ ent.nom }}</div>
                        <div class="mc-select-indicator" *ngIf="selectedEntrepreneur?.id === ent.id"><i class="pi pi-check-circle"></i></div>
                      </div>
                      <div class="mc-meta" *ngIf="ent.entreprise">{{ ent.entreprise }}</div>
                      <div class="mc-detail-row">
                        <span *ngIf="ent.secteur" class="mc-chip">{{ ent.secteur }}</span>
                        <span *ngIf="ent.phaseMaturite" class="mc-chip mc-chip-phase">{{ ent.phaseMaturite }}</span>
                        <span *ngIf="ent.region" class="mc-chip mc-chip-region">{{ ent.region }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Center -->
                  <div class="manual-center">
                    <div class="manual-arrow-box" [class.arrow-ready]="selectedEntrepreneur && selectedCoach"><i class="pi pi-arrow-right"></i></div>
                    <div class="manual-confirm-zone" *ngIf="selectedEntrepreneur && selectedCoach">
                      <div class="confirm-pair">
                        <div class="confirm-name">{{ selectedEntrepreneur.nom }}</div>
                        <div class="confirm-arrow"><i class="pi pi-link"></i></div>
                        <div class="confirm-name">{{ selectedCoach.prenom }} {{ selectedCoach.nom }}</div>
                      </div>
                      <div class="form-group" style="margin:12px 0;">
                        <label style="font-size:12px;font-weight:700;color:#6B7280;">Note (optionnel)</label>
                        <textarea [(ngModel)]="manualNote" rows="2" placeholder="Ajoutez une note..." class="form-input" style="font-size:13px;"></textarea>
                      </div>
                      <button class="btn-confirm-manual" (click)="confirmManualMatch()" [disabled]="manualSaving">
                        <i class="pi pi-check-circle"></i> {{ manualSaving ? 'Création...' : 'Confirmer le matching' }}
                      </button>
                    </div>
                  </div>

                  <!-- Right: Coaches -->
                  <div class="manual-panel">
                    <div class="manual-panel-header">
                      <h3 class="manual-panel-title">Coachs</h3>
                      <span class="manual-count-badge">{{ manualCoaches.length }}</span>
                    </div>
                    <div *ngIf="manualCoaches.length === 0" class="empty-state-inline" style="margin:16px"><p>Aucun coach.</p></div>
                    <div *ngFor="let coach of manualCoaches" class="manual-card" [class.manual-card-selected]="selectedCoach?.id === coach.id" [class.manual-card-saturated]="!coach.disponible" (click)="selectCoach(coach)">
                      <div class="mc-top-row">
                        <div class="mc-name">{{ coach.prenom }} {{ coach.nom }}</div>
                        <div class="mc-select-indicator" *ngIf="selectedCoach?.id === coach.id"><i class="pi pi-check-circle"></i></div>
                      </div>
                      <div class="mc-meta" *ngIf="coach.expertise">{{ coach.expertise }}</div>
                      <div class="mc-detail-row">
                        <span *ngIf="coach.secteur" class="mc-chip">{{ coach.secteur }}</span>
                        <span class="mc-chip" [class.mc-chip-dispo]="coach.disponible" [class.mc-chip-saturated]="!coach.disponible">{{ coach.disponible ? 'Disponible' : 'Saturé' }}</span>
                      </div>
                      <div class="mc-coach-stats">
                        <div class="mc-stat"><span class="mc-stat-val">{{ coach.nbEntrepreneursActifs }}</span><span class="mc-stat-label">/ 5 actifs</span></div>
                        <div class="mc-stat" *ngIf="coach.noteMoyenneRating"><span class="mc-stat-val">{{ coach.noteMoyenneRating }}</span><span class="mc-stat-label">/ 5 ★</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div *ngIf="!manualLoading && manualEntrepreneurs.length === 0 && manualCoaches.length === 0 && !manualError" class="empty-state-inline" style="margin-top:20px">
                  <p><strong>Tous les entrepreneurs sont déjà matchés</strong> pour cette thématique.</p>
                </div>
              </div>
            </div>

            <!-- ═══ Matchings of this thématique ═══ -->
            <div class="card" style="margin-top:16px">
              <div class="card-header-row">
                <div class="card-icon"><i class="pi pi-list"></i></div>
                <h2 class="card-title">Matchings de cette thématique</h2>
              </div>

              <div *ngIf="thematiqueMatchingsLoading" class="loading-box">Chargement...</div>

              <div *ngIf="!thematiqueMatchingsLoading && thematiqueMatchings.length === 0" class="empty-state-inline">
                <p>Aucun matching pour cette thématique.</p>
              </div>

              <div *ngFor="let m of thematiqueMatchings" class="history-card" [class.history-valide]="m.statut === 'VALIDE'" [class.history-propose]="m.statut === 'PROPOSE'" [class.history-termine]="m.statut === 'TERMINE'" [class.history-libere]="m.statut === 'LIBERE'">
                <div class="hc-left">
                  <div class="hc-pair"><div><p class="hc-role">Entrepreneur</p><p class="hc-name">{{ m.entrepreneur?.nom || 'N/A' }}</p></div></div>
                  <div class="hc-arrow"><i class="pi pi-arrow-right"></i></div>
                  <div class="hc-pair"><div><p class="hc-role">Coach</p><p class="hc-name">{{ m.coach?.prenom }} {{ m.coach?.nom }}</p></div></div>
                </div>
                <div class="hc-right">
                  <p class="hc-score" [style.color]="scoreColor(m.scoreIa)">{{ m.scoreIa ? (m.scoreIa + '%') : 'Manuel' }}</p>
                  <p class="hc-score-label">Score</p>
                  <span class="status-badge" [class.active]="m.statut === 'VALIDE'" [class.proposed]="m.statut === 'PROPOSE'" [class.expired]="m.statut === 'TERMINE' || m.statut === 'LIBERE'">{{ m.statut }}</span>
                  <button *ngIf="m.statut === 'VALIDE' || m.statut === 'PROPOSE'" class="btn-sm" style="margin-top: 8px; display: block; margin-left: auto; margin-right: auto;" (click)="editMatching(m)" title="Modifier ce matching">
                    <i class="pi pi-pencil"></i> Modifier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ng-container>

        

      </ng-container>

      <!-- ═══ All Thématiques Overview ═══
      <ng-container *ngIf="!selectedThematiqueId">
        <div *ngIf="thematiques.length === 0" class="empty-state-inline" style="margin-top:20px">
          <i class="pi pi-info-circle" style="font-size:32px;color:#9CA3AF;display:block;margin-bottom:12px"></i>
          <p *ngIf="selectedProgId">Aucune thématique créée pour ce programme. Utilisez le bouton <strong>+ Ajouter Thématique</strong> ci-dessus.</p>
          <p *ngIf="!selectedProgId">Aucune thématique trouvée au total.</p>
        </div>

        <div *ngFor="let t of thematiques" class="th-overview-card" (click)="selectThematiqueFromOverview(t)">
          <div class="th-overview-left">
            <div class="th-overview-icon">📌</div>
            <div>
              <h3 class="th-overview-name">{{ t.nom }}</h3>
              <p class="th-overview-prog"><i class="pi pi-folder" style="font-size:12px; margin-right:4px;"></i> {{ getProgrammeName(t.programmeId) }}</p>
              <p class="th-overview-dates">{{ t.dateDebut }} → {{ t.dateFin }}</p>
              <p class="th-overview-desc" *ngIf="t.description">{{ t.description }}</p>
            </div>
          </div>
          <div class="th-overview-right">
            <span class="status-badge" [class.active]="t.statut === 'ACTIVE'" [class.expired]="t.statut === 'TERMINEE'">{{ t.statut }}</span>
            <div class="th-overview-actions">
              <button class="btn-sm" (click)="$event.stopPropagation(); editThematique(t)"><i class="pi pi-pencil"></i></button>
              <button class="btn-sm btn-sm-danger" (click)="$event.stopPropagation(); deleteThematique(t.id!)"><i class="pi pi-trash"></i></button>
            </div>
          </div>
        </div>
      </ng-container> -->

    </div>
    `,
    styles: [`
      :host { display: block; }
      .matching-page { padding: 24px; background: #F5F6FA; min-height: 100vh; }

      .matching-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
      .matching-title { font-size: 28px; font-weight: 800; color: #1A1A2E; margin: 0; }
      .matching-subtitle { color: #8a8a8a; font-size: 14px; margin-top: 4px; }

      .card { background: #fff; border-radius: 20px; padding: 24px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); margin-bottom: 16px; }
      .prog-card { margin-bottom: 16px; }
      .card-header-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
      .card-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; background: linear-gradient(135deg, #ea5073, #6d3345); color: white; }
      .card-title { font-size: 18px; font-weight: 700; color: #1A1A2E; margin: 0; flex: 1; }
      .manual-badge { padding: 4px 12px; border-radius: 20px; background: #EDE9FE; color: #7C3AED; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

      .form-group { display: flex; flex-direction: column; gap: 6px; }
      .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
      .required { color: #ea5073; }
      .form-select, .form-input { width: 100%; padding: 10px 14px; border: 1px solid #E5E7EB; border-radius: 12px; font-size: 14px; outline: none; background: #fff; color: #333; transition: border-color .2s; box-sizing: border-box; }
      .form-select:focus, .form-input:focus { border-color: #ea5073; }
      textarea.form-input { resize: vertical; font-family: inherit; }
      .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
      .form-actions { display: flex; gap: 12px; margin-top: 12px; }

      /* Thematique selector */
      .thematique-selector-card { padding: 20px 24px; }
      .thematique-selector-row { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
      .btn-add-thematique { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 700; background: #F3F4F6; color: #374151; border: 1px solid #E5E7EB; cursor: pointer; transition: all .2s; white-space: nowrap; }
      .btn-add-thematique:hover { background: #E5E7EB; }
      .thematique-add-form { margin-top: 20px; padding-top: 20px; border-top: 1px solid #F3F4F6; }
      .thematique-add-form h4 { margin: 0 0 16px; font-size: 15px; font-weight: 700; color: #1A1A2E; }

      /* Thematique section */
      .thematique-section { }
      .th-card-header { background: #fff; border-radius: 20px; padding: 24px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); margin-bottom: 16px; }
      .th-card-title-row { display: flex; align-items: center; gap: 12px; }
      .th-card-icon { font-size: 24px; }
      .th-card-info { flex: 1; }
      .th-name { font-size: 20px; font-weight: 800; color: #1A1A2E; margin: 0; }
      .th-dates { font-size: 13px; color: #9CA3AF; margin: 2px 0 0; }
      .th-desc { font-size: 13px; color: #6B7280; margin: 12px 0 0; line-height: 1.5; }
      .th-card-actions-top { display: flex; gap: 6px; margin-left: 12px; }
      .th-kpis { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }

      .stat-badge { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; }
      .stat-warning { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
      .stat-success { background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; }
      .stat-info { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }
      .stat-neutral { background: #F3F4F6; color: #6B7280; border: 1px solid #E5E7EB; }

      .th-action-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
      .btn-launch { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 12px; font-size: 15px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #ea5073, #6d3345); border: none; cursor: pointer; transition: all .2s; box-shadow: 0 4px 12px rgba(234,80,115,0.3); }
      .btn-launch:hover { opacity: 0.9; transform: translateY(-1px); }
      .btn-launch:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      .btn-cancel { padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; background: #F3F4F6; color: #6B7280; border: none; cursor: pointer; }
      .btn-manual-toggle { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 12px; font-size: 15px; font-weight: 700; color: #374151; background: #fff; border: 2px solid #E5E7EB; cursor: pointer; transition: all .2s; }
      .btn-manual-toggle:hover { border-color: #ea5073; color: #ea5073; }
      .btn-manual-toggle.active { border-color: #ea5073; color: #ea5073; background: #FFF1F3; }

      .error-box { margin-bottom: 15px; padding: 12px 16px; background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 12px; }
      .error-box p { margin: 0; color: #DC2626; font-size: 13px; }
      .success-toast { display: flex; align-items: center; gap: 10px; padding: 14px 20px; background: #D1FAE5; border-left: 4px solid #22C55E; border-radius: 12px; font-size: 14px; color: #065F46; margin-bottom: 16px; }

      /* IA Results */
      .results-section { margin-bottom: 20px; }
      .results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .results-header h3 { font-size: 22px; font-weight: 800; color: #1A1A2E; margin: 0; }
      .results-meta { font-size: 13px; color: #9CA3AF; margin-top: 4px; }
      .btn-validate-all { padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 700; background: #16a34a; color: #fff; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(22,163,74,0.25); }
      .btn-validate-all:disabled { opacity: 0.5; }

      .match-row { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 20px; }
      .match-score-col { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 80px; padding-top: 20px; }
      .score-circle { width: 70px; height: 70px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #fff; box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
      .score-high { background: linear-gradient(135deg, #22c55e, #16a34a); }
      .score-mid  { background: linear-gradient(135deg, #f59e0b, #d97706); }
      .score-low  { background: linear-gradient(135deg, #ef4444, #dc2626); }
      .score-label-text { font-size: 10px; font-weight: 700; text-align: center; text-transform: uppercase; }
      .color-high { color: #16a34a; } .color-mid { color: #d97706; } .color-low { color: #dc2626; }
      .match-main-col { flex: 1; }

      .match-card { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.07); border-top: 3px solid #ea5073; overflow: hidden; }
      .match-card-header { display: flex; align-items: flex-start; padding: 20px 24px; }
      .profile-block { flex: 1; padding: 0 16px; }
      .profile-block:first-child { padding-left: 0; }
      .profile-block:last-child { padding-right: 0; }
      .profile-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #ea5073; margin-bottom: 6px; }
      .profile-name { font-size: 17px; font-weight: 700; color: #1A1A2E; }
      .profile-meta { font-size: 13px; color: #6B7280; margin-top: 4px; }
      .meta-sep { color: #D1D5DB; }
      .match-divider { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 16px; gap: 4px; color: #D1D5DB; min-width: 80px; }
      .match-divider i { font-size: 20px; }
      .match-divider-label { font-size: 9px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; white-space: nowrap; }
      .match-justification { margin: 0 24px; padding: 12px 16px; background: #F0F9FF; border-left: 3px solid #38bdf8; border-radius: 0 10px 10px 0; font-size: 13px; color: #0369a1; line-height: 1.6; }
      .justification-label { font-weight: 700; }

      .match-actions { display: flex; align-items: center; gap: 10px; padding: 16px 24px; border-top: 1px solid #F3F4F6; }
      .btn-accept { display: inline-flex; align-items: center; gap: 6px; padding: 9px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #ea5073, #c43355); color: #fff; border: none; cursor: pointer; box-shadow: 0 3px 10px rgba(234,80,115,0.3); }
      .btn-accept:disabled { opacity: 0.5; cursor: not-allowed; }
      .btn-details { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; background: #fff; color: #374151; border: 1px solid #E5E7EB; cursor: pointer; }
      .btn-change { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; background: #fff; color: #ea5073; border: 1.5px solid #ea5073; cursor: pointer; }

      .details-panel { border-top: 1px solid #F3F4F6; }
      .details-section { padding: 20px 24px; border-bottom: 1px solid #F3F4F6; }
      .details-title { font-size: 14px; font-weight: 700; color: #1A1A2E; display: flex; align-items: center; gap: 8px; margin: 0 0 16px; }
      .details-title i { color: #ea5073; }
      .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .detail-item { display: flex; flex-direction: column; gap: 2px; }
      .detail-item.full-width { grid-column: 1 / -1; }
      .detail-key { font-size: 11px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; }
      .detail-val { font-size: 13px; color: #374151; line-height: 1.5; }
      .score-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
      .score-bar-label { font-size: 12px; color: #6B7280; min-width: 200px; }
      .score-bar-bg { flex: 1; height: 7px; border-radius: 4px; background: #E5E7EB; overflow: hidden; }
      .score-bar-fill { height: 100%; border-radius: 4px; transition: width .5s ease; }
      .bar-high { background: #22c55e; } .bar-mid { background: #f59e0b; } .bar-low { background: #ef4444; }
      .score-bar-val { font-size: 12px; font-weight: 700; color: #374151; min-width: 28px; text-align: right; }

      .alternatives-panel { border-top: 1px solid #F3F4F6; background: #FAFAFA; }
      .alt-header { padding: 14px 24px 10px; font-size: 12px; font-weight: 800; color: #6B7280; text-transform: uppercase; border-bottom: 1px solid #F0F0F0; }
      .alt-row { display: flex; align-items: center; gap: 16px; padding: 16px 24px; border-bottom: 1px solid #F0F0F0; }
      .alt-row:last-child { border-bottom: none; }
      .alt-info { flex: 1; }
      .alt-rank { font-size: 10px; font-weight: 700; color: #ea5073; text-transform: uppercase; margin-bottom: 2px; }
      .alt-coach-name { font-size: 15px; font-weight: 700; color: #1A1A2E; }
      .alt-coach-meta { font-size: 12px; color: #6B7280; }
      .alt-score { text-align: center; }
      .alt-score-val { font-size: 20px; font-weight: 800; color: #1A1A2E; }
      .btn-select-alt { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; font-size: 12px; font-weight: 700; background: linear-gradient(135deg, #ea5073, #c43355); color: #fff; border: none; cursor: pointer; white-space: nowrap; }
      .btn-select-alt:disabled { opacity: 0.5; }

      /* Manual matching */
      .manual-section { margin-bottom: 16px; }
      .manual-workspace { display: grid; grid-template-columns: 1fr 260px 1fr; gap: 16px; align-items: start; margin-top: 8px; }
      .manual-panel { background: #fff; border-radius: 20px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); overflow: hidden; max-height: 500px; overflow-y: auto; }
      .manual-panel-header { display: flex; align-items: center; gap: 10px; padding: 18px 20px; border-bottom: 1px solid #F3F4F6; background: #FAFAFA; position: sticky; top: 0; z-index: 1; }
      .manual-panel-title { font-size: 15px; font-weight: 700; color: #1A1A2E; margin: 0; flex: 1; }
      .manual-count-badge { background: #ea5073; color: #fff; border-radius: 20px; font-size: 12px; font-weight: 700; padding: 2px 10px; }
      .manual-card { padding: 16px 20px; border-bottom: 1px solid #F9FAFB; cursor: pointer; transition: all .2s; }
      .manual-card:hover { background: #FFF5F7; }
      .manual-card-selected { background: #FFF1F3 !important; border-left: 3px solid #ea5073; }
      .manual-card-saturated { opacity: 0.6; }
      .mc-top-row { display: flex; justify-content: space-between; align-items: flex-start; }
      .mc-name { font-size: 15px; font-weight: 700; color: #1A1A2E; }
      .mc-select-indicator { color: #ea5073; font-size: 18px; }
      .mc-meta { font-size: 12px; color: #6B7280; margin-top: 3px; }
      .mc-detail-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .mc-chip { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #F3F4F6; color: #6B7280; }
      .mc-chip-phase { background: #FEF3C7; color: #92400E; }
      .mc-chip-region { background: #EDE9FE; color: #7C3AED; }
      .mc-chip-dispo { background: #D1FAE5; color: #065F46; }
      .mc-chip-saturated { background: #FEE2E2; color: #991B1B; }
      .mc-coach-stats { display: flex; gap: 16px; margin-top: 8px; }
      .mc-stat { display: flex; align-items: baseline; gap: 3px; }
      .mc-stat-val { font-size: 18px; font-weight: 800; color: #1A1A2E; }
      .mc-stat-label { font-size: 11px; color: #9CA3AF; }

      .manual-center { display: flex; flex-direction: column; align-items: center; gap: 16px; padding-top: 60px; }
      .manual-arrow-box { width: 52px; height: 52px; border-radius: 50%; background: #F3F4F6; display: flex; align-items: center; justify-content: center; font-size: 22px; color: #D1D5DB; transition: all .3s; }
      .arrow-ready { background: linear-gradient(135deg, #ea5073, #c43355); color: #fff; box-shadow: 0 4px 16px rgba(234,80,115,0.4); transform: scale(1.1); }
      .manual-confirm-zone { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 4px 20px rgba(234,80,115,0.15); border: 2px solid #ea5073; width: 100%; }
      .confirm-pair { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 16px; }
      .confirm-name { font-size: 14px; font-weight: 700; color: #1A1A2E; text-align: center; }
      .confirm-arrow { color: #ea5073; font-size: 18px; }
      .btn-confirm-manual { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 20px; border-radius: 12px; font-size: 14px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #ea5073, #c43355); border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(234,80,115,0.35); }
      .btn-confirm-manual:disabled { opacity: 0.5; cursor: not-allowed; }

      /* History cards */
      .history-card { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: #fff; border-radius: 20px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); margin-bottom: 12px; border-left: 4px solid #D1D5DB; transition: all .2s; }
      .history-valide { border-left-color: #22C55E; }
      .history-propose { border-left-color: #F59E0B; }
      .history-termine { border-left-color: #3B82F6; }
      .history-libere { border-left-color: #9CA3AF; }
      .hc-left { display: flex; align-items: center; gap: 20px; flex: 1; }
      .hc-pair { display: flex; align-items: center; gap: 12px; }
      .hc-arrow { color: #D1D5DB; font-size: 20px; }
      .hc-role { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin: 0; }
      .hc-name { font-weight: 700; color: #1A1A2E; margin: 0; }
      .hc-right { text-align: center; min-width: 100px; }
      .hc-score { font-size: 22px; font-weight: 800; margin: 0; }
      .hc-score-label { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin: 2px 0 8px; }

      .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #F3F4F6; color: #6B7280; }
      .status-badge.active { background: #D1FAE5; color: #065F46; }
      .status-badge.proposed { background: #FEF3C7; color: #92400E; }
      .status-badge.expired { background: #FEE2E2; color: #991B1B; }
      .btn-sm { padding: 6px 10px; border-radius: 8px; font-size: 12px; border: 1px solid #E5E7EB; background: #fff; cursor: pointer; }
      .btn-sm:hover { background: #F3F4F6; }
      .btn-sm-danger:hover { background: #FEE2E2; }

      /* Overview cards */
      .th-overview-card { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: #fff; border-radius: 20px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); margin-bottom: 12px; cursor: pointer; transition: all .2s; border-left: 4px solid #ea5073; }
      .th-overview-card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.1); }
      .th-overview-left { display: flex; align-items: flex-start; gap: 16px; flex: 1; }
      .th-overview-icon { font-size: 24px; }
      .th-overview-name { font-size: 17px; font-weight: 700; color: #1A1A2E; margin: 0; }
      .th-overview-dates { font-size: 12px; color: #9CA3AF; margin: 4px 0 0; }
      .th-overview-desc { font-size: 13px; color: #6B7280; margin: 4px 0 0; }
      .th-overview-prog { font-size: 13px; font-weight: 700; color: #ea5073; margin: 4px 0 0; display: flex; align-items: center; }
      .th-overview-right { display: flex; align-items: center; gap: 12px; }
      .th-overview-actions { display: flex; gap: 6px; }

      .loading-box { text-align: center; padding: 40px; color: #9CA3AF; font-weight: 600; }
      .empty-state-inline { text-align: center; padding: 32px; color: #6B7280; font-size: 14px; background: #F9FAFB; border-radius: 16px; border: 1px dashed #E5E7EB; }

      /* Thematique list */
      .section-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 8px; }
      .count-chip { background: #F3F4F6; color: #6B7280; border-radius: 10px; padding: 1px 8px; font-size: 11px; font-weight: 600; }
      .th-list-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; cursor: pointer; transition: background .15s, border-color .15s; border: 1.5px solid transparent; margin-bottom: 6px; background: #F9FAFB; }
      .th-list-item:hover { background: #F3F4F6; border-color: #E5E7EB; }
      .th-list-item-active { background: #FFF0F4 !important; border-color: #ea5073 !important; }
      .th-list-item-main { display: flex; flex-direction: column; flex: 1; min-width: 0; }
      .th-list-nom { font-size: 14px; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .th-list-dates { font-size: 11px; color: #9CA3AF; margin-top: 2px; }
      .th-list-prog { font-size: 12px; font-weight: 600; color: #ea5073; white-space: nowrap; display: flex; align-items: center; flex-shrink: 0; }
      .th-list-status { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 8px; white-space: nowrap; flex-shrink: 0; }
      .th-status-active { background: #D1FAE5; color: #065F46; }
      .th-status-done { background: #E5E7EB; color: #374151; }
      .th-status-cancelled { background: #FEE2E2; color: #991B1B; }

      @media (max-width: 900px) {
        .manual-workspace { grid-template-columns: 1fr; }
        .manual-center { padding-top: 0; flex-direction: row; flex-wrap: wrap; justify-content: center; }
        .form-grid-3 { grid-template-columns: 1fr; }
        .match-card-header { flex-direction: column; }
        .details-grid { grid-template-columns: 1fr; }
        .match-row { flex-direction: column; }
        .match-score-col { flex-direction: row; padding-top: 0; }
        .thematique-selector-row { flex-direction: column; align-items: stretch; }
      }
    `]
})
export class AdminMatchingComponent implements OnInit {
    programmes: Programme[] = [];
    selectedProgId = 0;
    selectedThematiqueId = 0;
    thematiques: ThematiqueCoaching[] = [];
    allThematiques: ThematiqueCoaching[] = [];

    showAddForm = false;
    newThematique: Partial<ThematiqueCoaching> = { nom: '', description: '', dateDebut: '', dateFin: '', programmeId: undefined };
    editingThematique: ThematiqueCoaching | null = null;

    // IA Matching
    isLoading = false;
    errorMessage: string | null = null;
    loadingText = "L'IA analyse les profils...";
    bulkLoading = false;
    singleLoading: Record<number, boolean> = {};
    currentSession: MatchingSession | null = null;
    enrichedResults: any[] = [];
    groupedResults: any[] = [];
    expandedCards: Record<number, boolean> = {};
    showAlternatives: Record<number, boolean> = {};

    // Manual Matching
    showManualPanel = false;
    editingMatchingId: number | null = null;
    manualEntrepreneurs: any[] = [];
    manualCoaches: any[] = [];
    manualLoading = false;
    manualSaving = false;
    manualError: string | null = null;
    manualSuccess: any = null;
    manualNote = '';
    selectedEntrepreneur: any = null;
    selectedCoach: any = null;

    // Thematique matchings
    thematiqueMatchings: any[] = [];
    thematiqueMatchingsLoading = false;

    constructor(
        private http: HttpClient,
        private matchingSvc: MatchingService,
        private thematiqueSvc: ThematiqueService
    ) {}

    ngOnInit(): void {
        this.http.get<Programme[]>(`${environment.apiUrl}/backoffice/programmes`).subscribe({
          next: (data) => this.programmes = data,
            // next: (data) => {
            //     this.programmes = data;
            //     this.loadAllThematiques();
            // },
            error: (e) => console.error('Failed to load programmes', e)
        });
        
        this.loadAllThematiques();
    }

    loadAllThematiques(): void {
        this.thematiqueSvc.getAll().subscribe({
            next: (t) => {
                this.allThematiques = t;
                this.applyProgFilter();
            }
        });
    }

    applyProgFilter(): void {
        if (this.selectedProgId) {
            this.thematiques = this.allThematiques.filter(t => t.programmeId === this.selectedProgId);
        } else {
            this.thematiques = this.allThematiques;
        }
    }

    // loadAllThematiques(): void {
    //     this.thematiqueSvc.getAll().subscribe({
    //         next: (data) => this.thematiques = data,
    //         error: (e) => console.error(e)
    //     });
    // }

    // getProgrammeName(progId: number): string {
    //     const p = this.programmes.find(prog => prog.id === progId);
    //     return p ? p.nom : 'Programme inconnu';
    // }

    getProgrammeName(progId: number): string {
        const p = this.programmes.find(prog => prog.id === progId);
        return p ? p.nom : '—';
    }

    get selectedThematiqueObj(): ThematiqueCoaching | null {
        return this.thematiques.find(t => t.id === this.selectedThematiqueId) || null;
    }

    // ─── Programme change ───
    onProgChange(): void {
        this.currentSession = null;
        this.enrichedResults = [];
        this.groupedResults = [];
        this.selectedThematiqueId = 0;
        this.thematiqueMatchings = [];
        this.showManualPanel = false;
        this.errorMessage = null;

// <<<<<<< HEAD
        this.applyProgFilter();
// =======
//         if (this.selectedProgId) {
//             this.thematiqueSvc.getByProgramme(this.selectedProgId).subscribe({
//                 next: (t) => this.thematiques = t,
//                 error: () => {}
//             });
//         } else {
//             this.loadAllThematiques();
//         }
// >>>>>>> 146cef4 (show associated program under each theme)
    }

    // ─── Thématique change ───
    onThematiqueChange(): void {
        this.currentSession = null;
        this.enrichedResults = [];
        this.groupedResults = [];
        this.errorMessage = null;
        this.showManualPanel = false;
        this.editingMatchingId = null;
        this.manualEntrepreneurs = [];
        this.manualCoaches = [];
        this.selectedEntrepreneur = null;
        this.selectedCoach = null;
        this.manualSuccess = null;
        this.manualError = null;
        this.thematiqueMatchings = [];

        if (this.selectedThematiqueId) {
            this.loadThematiqueMatchings();
        }
    }

    loadThematiqueMatchings(): void {
        const pId = this.selectedThematiqueObj?.programmeId || this.selectedProgId;
        if (!pId) return;

        this.thematiqueMatchingsLoading = true;
        this.matchingSvc.getHistoryByThematique(pId, this.selectedThematiqueId).subscribe({
            next: (data) => { this.thematiqueMatchings = data; this.thematiqueMatchingsLoading = false; },
            error: () => { this.thematiqueMatchings = []; this.thematiqueMatchingsLoading = false; }
        });
    }

    countByStatut(statut: string): number {
        return this.thematiqueMatchings.filter(m => m.statut === statut).length;
    }

    // ─── Run IA ───
    runMatchingIA(): void {
        const pId = this.selectedThematiqueObj?.programmeId || this.selectedProgId;
        if (!pId || !this.selectedThematiqueId) return;
        this.isLoading = true;
        this.errorMessage = null;

        this.matchingSvc.runMatchingIA(pId, this.selectedThematiqueId).subscribe({
            next: (session) => {
                this.currentSession = session;
                this.matchingSvc.getSessionDetails(session.id).subscribe({
                    next: (enriched) => {
                        this.enrichedResults = enriched.map(m => this.parseEnrichedResult(m));
                        this.groupedResults = this.buildGroupedResults(this.enrichedResults);
                        this.isLoading = false;
                    },
                    error: () => {
                        if (session.matchings && session.matchings.length > 0) {
                            this.enrichedResults = session.matchings.map(m => ({
                                matchingId: m.id, scoreIa: m.scoreIa, justification: m.justification,
                                rankTop: m.rankTop || 1, entrepreneurId: m.entrepreneurId,
                                entrepreneur: { nom: 'Entrepreneur #' + m.entrepreneurId },
                                coach: { nom: 'Coach #' + m.coachId }
                            }));
                            this.groupedResults = this.buildGroupedResults(this.enrichedResults);
                        }
                        this.isLoading = false;
                    }
                });
            },
            error: (e) => {
                this.isLoading = false;
                this.errorMessage = e.error?.message || ('Erreur serveur : ' + e.message);
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
                this.enrichedResults = [];
                this.groupedResults = [];
                this.loadThematiqueMatchings();
            },
            error: (e) => { console.error(e); this.bulkLoading = false; }
        });
    }

    validateSingle(matchingId: number): void {
        this.singleLoading[matchingId] = true;
        const selected = this.enrichedResults.find(r => r.matchingId === matchingId);
        this.matchingSvc.validateSingle(matchingId, 1).subscribe({
            next: () => {
                if (selected?.entrepreneurId) this.enrichedResults = this.enrichedResults.filter(r => r.entrepreneurId !== selected.entrepreneurId);
                else this.enrichedResults = this.enrichedResults.filter(r => r.matchingId !== matchingId);
                this.groupedResults = this.buildGroupedResults(this.enrichedResults);
                this.singleLoading[matchingId] = false;
                this.loadThematiqueMatchings();
                if (this.groupedResults.length === 0) this.currentSession = null;
            },
            error: (e) => { console.error(e); this.singleLoading[matchingId] = false; }
        });
    }

    // ─── Manual Matching ───
    toggleManualPanel(): void {
        this.showManualPanel = !this.showManualPanel;
        this.editingMatchingId = null;
        this.selectedEntrepreneur = null;
        this.selectedCoach = null;
        if (this.showManualPanel && this.manualEntrepreneurs.length === 0 && this.manualCoaches.length === 0) {
            this.loadManualCandidates();
        }
    }

    editMatching(m: any): void {
        this.editingMatchingId = m.matchingId || m.id;
        this.showManualPanel = true;
        this.manualError = null;
        this.manualSuccess = null;
        
        this.selectedEntrepreneur = { id: m.entrepreneurId, nom: m.entrepreneur?.nom, email: m.entrepreneur?.email };
        this.selectedCoach = { id: m.coach?.id || m.coachId, prenom: m.coach?.prenom, nom: m.coach?.nom, disponible: true };

        if (this.manualEntrepreneurs.length === 0 && this.manualCoaches.length === 0) {
            this.loadManualCandidates();
        } else {
            this.injectEditedCandidates();
        }
        
        window.scrollTo({ top: 300, behavior: 'smooth' });
    }

    private injectEditedCandidates(): void {
        if (this.editingMatchingId && this.selectedEntrepreneur) {
            if (!this.manualEntrepreneurs.find(e => e.id === this.selectedEntrepreneur.id)) {
                this.manualEntrepreneurs.unshift(this.selectedEntrepreneur);
            }
        }
        if (this.editingMatchingId && this.selectedCoach) {
            if (!this.manualCoaches.find(c => c.id === this.selectedCoach.id)) {
                this.manualCoaches.unshift(this.selectedCoach);
            }
        }
    }

    loadManualCandidates(): void {
        const pId = this.selectedThematiqueObj?.programmeId || this.selectedProgId;
        if (!pId || !this.selectedThematiqueId) return;
        this.manualLoading = true;
        this.manualError = null;
        this.matchingSvc.getManualCandidates(pId, this.selectedThematiqueId).subscribe({
            next: (data) => {
                this.manualEntrepreneurs = data.entrepreneurs || [];
                this.manualCoaches = data.coaches || [];
                this.injectEditedCandidates();
                this.manualLoading = false;
            },
            error: (e) => {
                this.manualError = e.error?.message || 'Erreur lors du chargement des candidats.';
                this.manualLoading = false;
            }
        });
    }

    selectEntrepreneur(ent: any): void {
        this.selectedEntrepreneur = this.selectedEntrepreneur?.id === ent.id ? null : ent;
        this.manualSuccess = null;
    }

    selectCoach(coach: any): void {
        this.selectedCoach = this.selectedCoach?.id === coach.id ? null : coach;
        this.manualSuccess = null;
    }

    confirmManualMatch(): void {
        const pId = this.selectedThematiqueObj?.programmeId || this.selectedProgId;
        if (!this.selectedEntrepreneur || !this.selectedCoach || !pId || !this.selectedThematiqueId) return;
        this.manualSaving = true;
        this.manualError = null;

        if (this.editingMatchingId) {
            this.matchingSvc.updateManualMatching(
                this.editingMatchingId, this.selectedCoach.id,
                this.selectedEntrepreneur.id, this.manualNote || undefined
            ).subscribe({
                next: (result) => {
                    this.manualSuccess = result;
                    this.manualSaving = false;
                    this.manualNote = '';
                    this.editingMatchingId = null;
                    const coach = this.manualCoaches.find(c => c.id === this.selectedCoach.id);
                    if (coach) { coach.nbEntrepreneursActifs = (coach.nbEntrepreneursActifs || 0) + 1; coach.disponible = coach.nbEntrepreneursActifs < 5; }
                    this.selectedEntrepreneur = null;
                    this.selectedCoach = null;
                    this.loadThematiqueMatchings();
                },
                error: (e) => { this.manualError = e.error?.message || 'Erreur lors de la modification.'; this.manualSaving = false; }
            });
        } else {
            this.matchingSvc.createManualMatching(
                this.selectedEntrepreneur.id, this.selectedCoach.id,
                pId, this.selectedThematiqueId,
                this.manualNote || undefined
            ).subscribe({
                next: (result) => {
                    this.manualSuccess = result;
                    this.manualSaving = false;
                    this.manualNote = '';
                    this.manualEntrepreneurs = this.manualEntrepreneurs.filter(e => e.id !== this.selectedEntrepreneur.id);
                    const coach = this.manualCoaches.find(c => c.id === this.selectedCoach.id);
                    if (coach) { coach.nbEntrepreneursActifs = (coach.nbEntrepreneursActifs || 0) + 1; coach.disponible = coach.nbEntrepreneursActifs < 5; }
                    this.selectedEntrepreneur = null;
                    this.selectedCoach = null;
                    this.loadThematiqueMatchings();
                },
                error: (e) => { this.manualError = e.error?.message || 'Erreur.'; this.manualSaving = false; }
            });
        }
    }

    // ─── Thématique CRUD ───
    saveThematique(): void {
        const pId = this.newThematique.programmeId || this.selectedProgId;
        if (!pId || !this.newThematique.nom || !this.newThematique.dateDebut || !this.newThematique.dateFin) {
            alert('Veuillez remplir tous les champs obligatoires (Programme, Nom, Dates).');
            return;
        }
        const th: ThematiqueCoaching = { programmeId: pId, nom: this.newThematique.nom!, description: this.newThematique.description, dateDebut: this.newThematique.dateDebut!, dateFin: this.newThematique.dateFin! };
        if (this.editingThematique) {
            this.thematiqueSvc.update(this.editingThematique.id!, th).subscribe({ next: () => { this.cancelEditThematique(); this.showAddForm = false; this.loadAllThematiques(); }, error: (e) => console.error(e) });
        } else {
            this.thematiqueSvc.create(th).subscribe({ next: () => { this.newThematique = { nom: '', description: '', dateDebut: '', dateFin: '', programmeId: undefined }; this.showAddForm = false; this.loadAllThematiques(); }, error: (e) => console.error(e) });
        }
    }

    editThematique(t: ThematiqueCoaching): void {
        this.editingThematique = t;
        this.newThematique = { nom: t.nom, description: t.description, dateDebut: t.dateDebut, dateFin: t.dateFin, programmeId: t.programmeId };
        this.showAddForm = true;
    }

    cancelEditThematique(): void { this.editingThematique = null; this.newThematique = { nom: '', description: '', dateDebut: '', dateFin: '', programmeId: undefined }; }
    deleteThematique(id: number): void { if (!confirm('Supprimer cette thématique ?')) return; this.thematiqueSvc.delete(id).subscribe({ next: () => this.loadAllThematiques(), error: (e) => console.error(e) }); }

    // ─── Helpers ───
    parseEnrichedResult(m: any): any {
        const result = { ...m };
        try { result.parsedScoresDetail = typeof m.scoresDetail === 'string' ? JSON.parse(m.scoresDetail) : m.scoresDetail; } catch { result.parsedScoresDetail = null; }
        return result;
    }

    buildGroupedResults(flatResults: any[]): any[] {
        const map = new Map<number, any>();
        for (const m of flatResults) {
            const entId = m.entrepreneurId;
            if (!map.has(entId)) map.set(entId, { entrepreneurId: entId, entrepreneur: m.entrepreneur, propositions: [] });
            map.get(entId).propositions.push(m);
        }
        map.forEach(group => group.propositions.sort((a: any, b: any) => (a.rankTop || 99) - (b.rankTop || 99)));
        return Array.from(map.values());
    }

    getTopMatch(group: any): any { return group.propositions.find((p: any) => p.rankTop === 1) || group.propositions[0] || {}; }
    getAlternatives(group: any): any[] { return group.propositions.filter((p: any) => p.rankTop !== 1); }
    toggleExpand(id: number): void { this.expandedCards[id] = !this.expandedCards[id]; }
    toggleAlternatives(entrepreneurId: number): void { this.showAlternatives[entrepreneurId] = !this.showAlternatives[entrepreneurId]; }
    scoreColor(s: number): string { if (s >= 76) return '#22C55E'; if (s >= 50) return '#F59E0B'; return '#EF4444'; }
    scoreLabel(s: number): string { if (s >= 76) return 'Excellent'; if (s >= 50) return 'Moyen'; return 'Faible'; }
    formatScoreLabel(key: string): string {
        const labels: Record<string, string> = { 'alignement_global': 'Alignement global · 30%', 'competences_complementaires': 'Compétences · 25%', 'stade_maturite': 'Stade de maturité · 20%', 'compatibilite_humaine': 'Compatibilité humaine · 15%', 'charge_coach': 'Charge du coach · 10%', 'alignement_thematique': 'Alignement thématique · 30%', 'alignement_sectoriel': 'Alignement sectoriel' };
        return labels[key] || key.replace(/_/g, ' ');
    }
    objectEntries(obj: any): [string, any][] { if (!obj || typeof obj !== 'object') return []; return Object.entries(obj); }
}