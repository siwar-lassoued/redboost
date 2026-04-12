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
      <!-- Header -->
      <div class="matching-header">
        <div>
          <h1 class="matching-title">Matching Coach / Entrepreneur</h1>
          <p class="matching-subtitle">Matching automatique par IA ou sélection manuelle</p>
        </div>
        <div *ngIf="currentSession" class="ia-badge">
          <i class="pi pi-bolt"></i> IA RedBoost Activée
        </div>
      </div>

      <!-- Tabs -->
      <div class="matching-tabs">
        <button class="tab-btn" [class.active]="activeTab === 'nouveau'" (click)="activeTab = 'nouveau'">
          <i class="pi pi-bolt"></i> Matching IA
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'manuel'" (click)="setTab('manuel')">
          <i class="pi pi-users"></i> Matching Manuel
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'thematiques'" (click)="activeTab = 'thematiques'">
          <i class="pi pi-list"></i> Thématiques
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'historique'" (click)="setTab('historique')">
          <i class="pi pi-clock"></i> Historique
        </button>
      </div>

      <!-- ══ TAB: Matching IA ══ -->
      <div *ngIf="activeTab === 'nouveau'" class="tab-content">
        <div class="card">
          <div class="card-header-row">
            <div class="card-icon"><i class="pi pi-bolt"></i></div>
            <h2 class="card-title">Lancer le Matching par IA</h2>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Programme <span class="required">*</span></label>
              <select [(ngModel)]="selectedProgId" (change)="onProgChange()" class="form-select">
                <option [ngValue]="0">Sélectionnez un programme...</option>
                <option *ngFor="let p of programmes" [ngValue]="p.id">{{ p.nom }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Thématique <span class="required">*</span></label>
              <select [(ngModel)]="selectedThematiqueId" class="form-select"
                [class.select-error]="selectedProgId && thematiques.length > 0 && !selectedThematiqueId">
                <option [ngValue]="0">-- Sélectionnez une thématique --</option>
                <option *ngFor="let t of thematiques" [ngValue]="t.id">{{ t.nom }} ({{ t.dateDebut }} → {{ t.dateFin }})</option>
              </select>
              <p class="hint warning-hint" *ngIf="selectedProgId && thematiques.length > 0 && !selectedThematiqueId">La thématique est obligatoire</p>
              <p class="hint success-hint" *ngIf="selectedThematiqueId">Thématique sélectionnée — l'IA priorisera les coachs compatibles</p>
            </div>
          </div>

          <div *ngIf="selectedProgId && stats" class="stats-row">
            <span class="stat-badge stat-warning">En attente : {{ stats.unmatchedCount }}</span>
            <span class="stat-badge stat-success">Matchés actifs : {{ stats.activeCount }}</span>
          </div>

          <div *ngIf="selectedProgId" class="launch-section">
            <div *ngIf="stats && stats.unmatchedCount === 0" class="empty-state-inline">
              <p><strong>Félicitations !</strong> Tous les entrepreneurs ont déjà un coaching actif.</p>
            </div>
            <div *ngIf="errorMessage" class="error-box"><p><strong>Erreur IA :</strong> {{ errorMessage }}</p></div>
            <div *ngIf="selectedProgId && thematiques.length === 0" class="info-box">
              <i class="pi pi-info-circle"></i>
              <p>Aucune thématique pour ce programme. Créez-en une dans l'onglet <strong>Thématiques</strong>.</p>
            </div>
            <button *ngIf="!stats || stats.unmatchedCount > 0" class="btn-launch"
              (click)="runMatching()" [disabled]="isLoading || !selectedThematiqueId">
              {{ isLoading ? loadingText : launchText }}
            </button>
          </div>
        </div>

        <!-- Results - IA -->
        <div *ngIf="currentSession" class="results-section">
          <div class="results-header">
            <div>
              <h3>Propositions de Matching</h3>
              <p class="results-meta">Session #{{ currentSession.id }} · {{ groupedResults.length }} entrepreneur(s) · {{ getProgName() }}</p>
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
                    <div class="profile-tag" *ngIf="group.entrepreneur?.phaseMaturite">{{ group.entrepreneur.phaseMaturite }}</div>
                  </div>
                  <div class="match-divider">
                    <i class="pi pi-arrow-right"></i>
                    <div class="match-divider-label">Recommandé par IA</div>
                  </div>
                  <div class="profile-block">
                    <div class="profile-label">Coach conseillé</div>
                    <div class="profile-name">{{ getTopMatch(group).coach?.prenom }} {{ getTopMatch(group).coach?.nom }}</div>
                    <div class="profile-meta">
                      <span *ngIf="getTopMatch(group).coach?.expertise">{{ getTopMatch(group).coach.expertise }}</span>
                      <span class="meta-sep" *ngIf="getTopMatch(group).coach?.expertise && getTopMatch(group).coach?.secteur"> · </span>
                      <span *ngIf="getTopMatch(group).coach?.secteur">{{ getTopMatch(group).coach.secteur }}</span>
                    </div>
                    <div class="coach-stats">
                      <span *ngIf="getTopMatch(group).coach?.yearsOfExperience">{{ getTopMatch(group).coach.yearsOfExperience }} ans d'exp.</span>
                      <span class="meta-sep" *ngIf="getTopMatch(group).coach?.yearsOfExperience && getTopMatch(group).coach?.noteMoyenneRating"> · </span>
                      <span *ngIf="getTopMatch(group).coach?.noteMoyenneRating">Note {{ getTopMatch(group).coach.noteMoyenneRating }}/5</span>
                    </div>
                  </div>
                </div>

                <div class="match-justification" *ngIf="getTopMatch(group).justification">
                  <span class="justification-label">Analyse IA :</span> {{ getTopMatch(group).justification }}
                </div>

                <div class="match-actions">
                  <button class="btn-accept" (click)="validateSingle(getTopMatch(group).matchingId)" [disabled]="singleLoading[getTopMatch(group).matchingId]">
                    <i class="pi pi-check"></i>
                    {{ singleLoading[getTopMatch(group).matchingId] ? 'Validation...' : 'Accepter' }}
                  </button>
                  <button class="btn-details" (click)="toggleExpand(gi)">
                    <i [class]="expandedCards[gi] ? 'pi pi-chevron-up' : 'pi pi-eye'"></i>
                    {{ expandedCards[gi] ? 'Masquer les détails' : 'Voir tous les détails' }}
                  </button>
                  <button class="btn-change" *ngIf="group.propositions.length > 1" (click)="toggleAlternatives(group.entrepreneurId)">
                    <i class="pi pi-list"></i>
                    {{ showAlternatives[group.entrepreneurId] ? 'Masquer' : 'Changer de coach' }}
                  </button>
                </div>

                <div *ngIf="expandedCards[gi]" class="details-panel">
                  <div class="details-section">
                    <h4 class="details-title"><i class="pi pi-user"></i> Profil de l'Entrepreneur</h4>
                    <div class="details-grid">
                      <div class="detail-item" *ngIf="group.entrepreneur?.email"><span class="detail-key">Email</span><span class="detail-val">{{ group.entrepreneur.email }}</span></div>
                      <div class="detail-item" *ngIf="group.entrepreneur?.telephone"><span class="detail-key">Téléphone</span><span class="detail-val">{{ group.entrepreneur.telephone }}</span></div>
                      <div class="detail-item" *ngIf="group.entrepreneur?.region"><span class="detail-key">Région</span><span class="detail-val">{{ group.entrepreneur.region }}</span></div>
                      <div class="detail-item" *ngIf="group.entrepreneur?.roleEntreprise"><span class="detail-key">Rôle</span><span class="detail-val">{{ group.entrepreneur.roleEntreprise }}</span></div>
                      <div class="detail-item full-width" *ngIf="group.entrepreneur?.description"><span class="detail-key">Description du projet</span><span class="detail-val">{{ group.entrepreneur.description }}</span></div>
                      <div class="detail-item full-width" *ngIf="group.entrepreneur?.innovation"><span class="detail-key">Composante innovation</span><span class="detail-val">{{ group.entrepreneur.innovation }}</span></div>
                      <div class="detail-item full-width" *ngIf="group.entrepreneur?.viabiliteCommerciale"><span class="detail-key">Viabilité commerciale</span><span class="detail-val">{{ group.entrepreneur.viabiliteCommerciale }}</span></div>
                      <div class="detail-item full-width" *ngIf="group.entrepreneur?.besoinsAccompagnement?.length"><span class="detail-key">Besoins d'accompagnement</span><span class="detail-val">{{ group.entrepreneur.besoinsAccompagnement.join(', ') }}</span></div>
                      <div class="detail-item full-width" *ngIf="group.entrepreneur?.besoinsFormation?.length"><span class="detail-key">Besoins de formation</span><span class="detail-val">{{ group.entrepreneur.besoinsFormation.join(', ') }}</span></div>
                    </div>
                    <div *ngIf="group.entrepreneur?.reponsesFormulaire" class="dynamic-answers">
                      <div class="dyn-title">Réponses au formulaire</div>
                      <div *ngFor="let entry of objectEntries(group.entrepreneur.reponsesFormulaire)" class="dyn-row">
                        <span class="dyn-key">{{ entry[0] }}</span><span class="dyn-val">{{ entry[1] }}</span>
                      </div>
                    </div>
                    <div *ngIf="group.entrepreneur?.documents?.length" class="docs-section">
                      <div class="docs-title">Documents fournis</div>
                      <div class="docs-list">
                        <a *ngFor="let doc of group.entrepreneur.documents" [href]="getDocumentUrl(doc)" target="_blank" class="doc-link">
                          <i class="pi pi-file-pdf"></i> {{ doc }}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div class="details-section">
                    <h4 class="details-title"><i class="pi pi-briefcase"></i> Profil du Coach recommandé</h4>
                    <div class="details-grid">
                      <div class="detail-item" *ngIf="getTopMatch(group).coach?.email"><span class="detail-key">Email</span><span class="detail-val">{{ getTopMatch(group).coach.email }}</span></div>
                      <div class="detail-item" *ngIf="getTopMatch(group).coach?.yearsOfExperience"><span class="detail-key">Expérience</span><span class="detail-val">{{ getTopMatch(group).coach.yearsOfExperience }} ans</span></div>
                      <div class="detail-item" *ngIf="getTopMatch(group).coach?.noteMoyenneRating"><span class="detail-key">Note</span><span class="detail-val">{{ getTopMatch(group).coach.noteMoyenneRating }} / 5</span></div>
                      <div class="detail-item" *ngIf="getTopMatch(group).coach?.nbEntrepreneursActifs !== undefined"><span class="detail-key">Charge actuelle</span><span class="detail-val">{{ getTopMatch(group).coach.nbEntrepreneursActifs }} / 5</span></div>
                      <div class="detail-item full-width" *ngIf="getTopMatch(group).coach?.bio"><span class="detail-key">Biographie</span><span class="detail-val">{{ getTopMatch(group).coach.bio }}</span></div>
                      <div class="detail-item full-width" *ngIf="getTopMatch(group).coach?.skills"><span class="detail-key">Compétences</span><span class="detail-val">{{ getTopMatch(group).coach.skills }}</span></div>
                    </div>
                    <div *ngIf="getTopMatch(group).parsedScoresDetail" class="scores-breakdown">
                      <div class="scores-title">Détail du score IA</div>
                      <div *ngFor="let entry of objectEntries(getTopMatch(group).parsedScoresDetail)" class="score-bar-row">
                        <div class="score-bar-label">{{ formatScoreLabel(entry[0]) }}</div>
                        <div class="score-bar-bg"><div class="score-bar-fill" [style.width.%]="entry[1]" [class.bar-high]="entry[1] >= 76" [class.bar-mid]="entry[1] >= 50 && entry[1] < 76" [class.bar-low]="entry[1] < 50"></div></div>
                        <div class="score-bar-val">{{ entry[1] }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div *ngIf="showAlternatives[group.entrepreneurId]" class="alternatives-panel">
                  <div class="alt-header">Sélectionner un coach manuellement</div>
                  <div *ngFor="let alt of getAlternatives(group)" class="alt-row">
                    <div class="alt-info">
                      <div class="alt-rank">Alternative {{ alt.rankTop }}</div>
                      <div class="alt-coach-name">{{ alt.coach?.prenom }} {{ alt.coach?.nom }}</div>
                      <div class="alt-coach-meta"><span *ngIf="alt.coach?.expertise">{{ alt.coach.expertise }}</span><span *ngIf="alt.coach?.secteur"> · {{ alt.coach.secteur }}</span></div>
                    </div>
                    <div class="alt-score"><span class="alt-score-val">{{ alt.scoreIa | number:'1.0-0' }}%</span><span class="alt-score-label">Score IA</span></div>
                    <div class="alt-justif" *ngIf="alt.justification">{{ alt.justification }}</div>
                    <button class="btn-select-alt" (click)="validateSingle(alt.matchingId)" [disabled]="singleLoading[alt.matchingId]">
                      <i class="pi pi-check-circle"></i> {{ singleLoading[alt.matchingId] ? '...' : 'Sélectionner ce coach' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ TAB: Matching Manuel ══ -->
      <div *ngIf="activeTab === 'manuel'" class="tab-content">

        <!-- Programme selector -->
        <div class="card">
          <div class="card-header-row">
            <div class="card-icon"><i class="pi pi-users"></i></div>
            <h2 class="card-title">Matching Manuel</h2>
            <span class="manual-badge">Sans IA</span>
          </div>
          <p class="card-desc">Sélectionnez un programme, puis choisissez un entrepreneur et un coach pour créer un matching directement.</p>

          <div class="form-grid">
            <div class="form-group">
              <label>Programme <span class="required">*</span></label>
              <select [(ngModel)]="manualProgId" (change)="onManualProgChange()" class="form-select">
                <option [ngValue]="0">Sélectionnez un programme...</option>
                <option *ngFor="let p of programmes" [ngValue]="p.id">{{ p.nom }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Thématique <span class="required">*</span></label>
              <select [(ngModel)]="manualThematiqueId" (change)="onManualThematiqueChange()"
                      class="form-select" [class.select-error]="manualProgId && !manualThematiqueId"
                      [disabled]="!manualProgId || manualThematiques.length === 0">
                <option [ngValue]="0">-- Sélectionnez une thématique --</option>
                <option *ngFor="let t of manualThematiques" [ngValue]="t.id">{{ t.nom }} ({{ t.dateDebut }} → {{ t.dateFin }})</option>
              </select>
              <p class="hint warning-hint" *ngIf="manualProgId && manualThematiques.length === 0">Aucune thématique pour ce programme — créez-en une dans l'onglet <strong>Thématiques</strong>.</p>
              <p class="hint warning-hint" *ngIf="manualProgId && manualThematiques.length > 0 && !manualThematiqueId">La thématique est obligatoire</p>
              <p class="hint success-hint" *ngIf="manualThematiqueId">Thématique sélectionnée — les profils liés s'affichent ci-dessous</p>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="manualLoading" class="loading-box">
          <i class="pi pi-spin pi-spinner" style="font-size:24px; color:#ea5073"></i>
          <p style="margin-top:12px">Chargement des candidats...</p>
        </div>

        <!-- Error -->
        <div *ngIf="manualError" class="error-box" style="margin-top:16px"><p>{{ manualError }}</p></div>

        <!-- Confirmation toast -->
        <div *ngIf="manualSuccess" class="success-toast">
          <i class="pi pi-check-circle"></i>
          Matching créé avec succès : <strong>{{ manualSuccess.entrepreneurNom }}</strong> → <strong>{{ manualSuccess.coachNom }}</strong>
        </div>

        

        <!-- Two-column layout -->
        <div *ngIf="manualProgId && manualThematiqueId && !manualLoading && (manualEntrepreneurs.length > 0 || manualCoaches.length > 0)" class="manual-workspace">

          <!-- Left: Entrepreneurs -->
          <div class="manual-panel">
            <div class="manual-panel-header">
              <h3 class="manual-panel-title">Entrepreneurs disponibles</h3>
              <span class="manual-count-badge">{{ manualEntrepreneurs.length }}</span>
            </div>

            <div *ngIf="manualEntrepreneurs.length === 0" class="empty-state-inline" style="margin:16px">
              <p>Tous les entrepreneurs ont déjà un coaching actif.</p>
            </div>

            <div *ngFor="let ent of manualEntrepreneurs"
                 class="manual-card"
                 [class.manual-card-selected]="selectedEntrepreneur?.id === ent.id"
                 (click)="selectEntrepreneur(ent)">
              <div class="mc-top-row">
                <div class="mc-name">{{ ent.nom }}</div>
                <div class="mc-select-indicator" *ngIf="selectedEntrepreneur?.id === ent.id">
                  <i class="pi pi-check-circle"></i>
                </div>
              </div>
              <div class="mc-meta" *ngIf="ent.entreprise">{{ ent.entreprise }}</div>
              <div class="mc-detail-row">
                <span *ngIf="ent.secteur" class="mc-chip">{{ ent.secteur }}</span>
                <span *ngIf="ent.phaseMaturite" class="mc-chip mc-chip-phase">{{ ent.phaseMaturite }}</span>
                <span *ngIf="ent.region" class="mc-chip mc-chip-region">{{ ent.region }}</span>
              </div>
              <div class="mc-desc" *ngIf="ent.description">{{ ent.description }}</div>
              <div class="mc-needs" *ngIf="ent.besoinsAccompagnement?.length">
                <span class="mc-needs-label">Besoins :</span> {{ ent.besoinsAccompagnement.join(', ') }}
              </div>
            </div>
          </div>

          <!-- Center Arrow -->
          <div class="manual-center">
            <div class="manual-arrow-box" [class.arrow-ready]="selectedEntrepreneur && selectedCoach">
              <i class="pi pi-arrow-right"></i>
            </div>
            <div class="manual-confirm-zone" *ngIf="selectedEntrepreneur && selectedCoach">
              <div class="confirm-pair">
                <div class="confirm-name">{{ selectedEntrepreneur.nom }}</div>
                <div class="confirm-arrow"><i class="pi pi-link"></i></div>
                <div class="confirm-name">{{ selectedCoach.prenom }} {{ selectedCoach.nom }}</div>
              </div>
              <div class="form-group" style="margin: 12px 0;">
                <label style="font-size:12px;font-weight:700;color:#6B7280;">Note / Raison (optionnel)</label>
                <textarea [(ngModel)]="manualNote" rows="3" placeholder="Ajoutez une note pour ce matching..." class="form-input" style="font-size:13px;"></textarea>
              </div>
              <button class="btn-confirm-manual" (click)="confirmManualMatch()" [disabled]="manualSaving">
                <i class="pi pi-check-circle"></i>
                {{ manualSaving ? 'Création...' : 'Confirmer le matching' }}
              </button>
            </div>
           
          </div>

          <!-- Right: Coaches -->
          <div class="manual-panel">
            <div class="manual-panel-header">
              <h3 class="manual-panel-title">Coachs disponibles</h3>
              <span class="manual-count-badge">{{ manualCoaches.length }}</span>
            </div>

            <div *ngIf="manualCoaches.length === 0" class="empty-state-inline" style="margin:16px">
              <p>Aucun coach disponible pour ce programme.</p>
            </div>

            <div *ngFor="let coach of manualCoaches"
                 class="manual-card"
                 [class.manual-card-selected]="selectedCoach?.id === coach.id"
                 [class.manual-card-saturated]="!coach.disponible"
                 (click)="selectCoach(coach)">
              <div class="mc-top-row">
                <div class="mc-name">{{ coach.prenom }} {{ coach.nom }}</div>
                <div class="mc-select-indicator" *ngIf="selectedCoach?.id === coach.id">
                  <i class="pi pi-check-circle"></i>
                </div>
              </div>
              <div class="mc-meta" *ngIf="coach.expertise">{{ coach.expertise }}</div>
              <div class="mc-detail-row">
                <span *ngIf="coach.secteur" class="mc-chip">{{ coach.secteur }}</span>
                <span *ngIf="coach.yearsOfExperience" class="mc-chip">{{ coach.yearsOfExperience }} ans</span>
                <span class="mc-chip" [class.mc-chip-dispo]="coach.disponible" [class.mc-chip-saturated]="!coach.disponible">
                  {{ coach.disponible ? 'Disponible' : 'Saturé' }}
                </span>
              </div>
              <div class="mc-coach-stats">
                <div class="mc-stat">
                  <span class="mc-stat-val">{{ coach.nbEntrepreneursActifs }}</span>
                  <span class="mc-stat-label">/ 5 actifs</span>
                </div>
                <div class="mc-stat" *ngIf="coach.noteMoyenneRating">
                  <span class="mc-stat-val">{{ coach.noteMoyenneRating }}</span>
                  <span class="mc-stat-label">/ 5 ★</span>
                </div>
              </div>
              <div class="mc-desc" *ngIf="coach.bio">{{ coach.bio }}</div>
              <div class="mc-chip-row" *ngIf="coach.skills">
                <span class="mc-chip mc-chip-skill" *ngFor="let s of coach.skills?.split(',')?.slice(0,3)">{{ s.trim() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state if programme selected but no candidates -->
        <div *ngIf="manualProgId && !manualLoading && manualEntrepreneurs.length === 0 && manualCoaches.length === 0 && !manualError" class="empty-state-inline" style="margin-top:20px">
          <i class="pi pi-check-circle" style="font-size:40px;color:#22c55e;margin-bottom:12px;display:block"></i>
          <p><strong>Tous les entrepreneurs sont déjà matchés</strong> pour ce programme.</p>
        </div>
      </div>

      <!-- ══ TAB: Thématiques ══ -->
      <div *ngIf="activeTab === 'thematiques'" class="tab-content">
        <div class="card">
          <div class="card-header-row">
            <div class="card-icon"><i class="pi pi-list"></i></div>
            <h2 class="card-title">Gestion des Thématiques de Coaching</h2>
          </div>
          <div class="form-group" style="max-width: 400px; margin-bottom: 20px;">
            <label>Programme</label>
            <select [(ngModel)]="selectedProgId" (change)="onProgChange()" class="form-select">
              <option [ngValue]="0">Sélectionnez un programme...</option>
              <option *ngFor="let p of programmes" [ngValue]="p.id">{{ p.nom }}</option>
            </select>
          </div>
          <div *ngIf="selectedProgId" class="thematique-form">
            <h4>{{ editingThematique ? 'Modifier la thématique' : 'Nouvelle thématique' }}</h4>
            <div class="form-grid-3">
              <div class="form-group"><label>Nom *</label><input [(ngModel)]="newThematique.nom" placeholder="Ex: Business Model" class="form-input" /></div>
              <div class="form-group"><label>Date de début *</label><input type="date" [(ngModel)]="newThematique.dateDebut" class="form-input" /></div>
              <div class="form-group"><label>Date de fin *</label><input type="date" [(ngModel)]="newThematique.dateFin" class="form-input" /></div>
            </div>
            <div class="form-group"><label>Description</label><textarea [(ngModel)]="newThematique.description" rows="2" placeholder="Description..." class="form-input"></textarea></div>
            <div class="form-actions">
              <button class="btn-launch" (click)="saveThematique()">{{ editingThematique ? 'Mettre à jour' : 'Ajouter' }}</button>
              <button *ngIf="editingThematique" class="btn-cancel" (click)="cancelEditThematique()">Annuler</button>
            </div>
          </div>
          <div *ngIf="selectedProgId && thematiques.length > 0" class="thematiques-list">
            <div *ngFor="let t of thematiques" class="thematique-card">
              <div class="tc-info">
                <div class="tc-name">{{ t.nom }}</div>
                <div class="tc-dates">{{ t.dateDebut }} - {{ t.dateFin }}</div>
                <div class="tc-desc" *ngIf="t.description">{{ t.description }}</div>
              </div>
              <div class="tc-right">
                <span class="status-badge" [class.active]="t.statut === 'ACTIVE'" [class.expired]="t.statut === 'TERMINEE'">{{ t.statut }}</span>
                <div class="tc-actions">
                  <button class="btn-sm" (click)="editThematique(t)"><i class="pi pi-pencil"></i></button>
                  <button class="btn-sm btn-sm-danger" (click)="deleteThematique(t.id!)"><i class="pi pi-trash"></i></button>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="selectedProgId && thematiques.length === 0" class="empty-state-inline"><p>Aucune thématique définie.</p></div>
        </div>
      </div>

      <!-- ══ TAB: Historique ══ -->
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
          <div *ngIf="historyLoading" class="loading-box">Chargement...</div>
          <div *ngIf="!historyLoading && history.length === 0 && selectedProgId" class="empty-state-inline"><p>Aucun matching dans l'historique.</p></div>
          <div *ngFor="let m of history" class="history-card">
            <div class="hc-left">
              <div class="hc-pair"><div><p class="hc-role">Entrepreneur</p><p class="hc-name">{{ m.entrepreneur?.nom || 'N/A' }}</p></div></div>
              <div class="hc-arrow"><i class="pi pi-arrow-right"></i></div>
              <div class="hc-pair"><div><p class="hc-role">Coach</p><p class="hc-name">{{ m.coach?.prenom }} {{ m.coach?.nom }}</p></div></div>
            </div>
            <div class="hc-right">
              <p class="hc-score" [style.color]="scoreColor(m.scoreIa)">{{ m.scoreIa ? (m.scoreIa + '%') : 'Manuel' }}</p>
              <p class="hc-score-label">Score</p>
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
      .ia-badge { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 12px; font-size: 13px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #ea5073, #6d3345); }

      .matching-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
      .tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: all .2s; background: #F3F4F6; color: #6B7280; }
      .tab-btn.active { background: #ea5073; color: #fff; }
      .tab-btn:hover:not(.active) { background: #E5E7EB; }

      .card { background: #fff; border-radius: 20px; padding: 24px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); margin-bottom: 20px; }
      .card-header-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
      .card-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; background: linear-gradient(135deg, #ea5073, #6d3345); color: white; }
      .card-title { font-size: 18px; font-weight: 700; color: #1A1A2E; margin: 0; flex: 1; }
      .card-desc { font-size: 13px; color: #6B7280; margin: 0 0 20px; line-height: 1.5; }
      .manual-badge { padding: 4px 12px; border-radius: 20px; background: #EDE9FE; color: #7C3AED; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

      .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
      .form-group { display: flex; flex-direction: column; gap: 6px; }
      .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
      .required { color: #ea5073; }
      .form-select, .form-input { width: 100%; padding: 10px 14px; border: 1px solid #E5E7EB; border-radius: 12px; font-size: 14px; outline: none; background: #fff; color: #333; transition: border-color .2s; box-sizing: border-box; }
      .form-select:focus, .form-input:focus { border-color: #ea5073; }
      textarea.form-input { resize: vertical; font-family: inherit; }
      .hint { font-size: 12px; color: #9CA3AF; font-style: italic; margin-top: 4px; }
      .warning-hint { color: #D97706 !important; font-style: normal !important; font-weight: 600; }
      .success-hint { color: #16a34a !important; font-style: normal !important; font-weight: 600; }
      .select-error { border-color: #EF4444 !important; }

      .stats-row { display: flex; gap: 12px; margin: 16px 0; }
      .stat-badge { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; }
      .stat-warning { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
      .stat-success { background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; }

      .launch-section { margin-top: 20px; padding-top: 20px; border-top: 1px solid #F3F4F6; }
      .btn-launch { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 12px; font-size: 15px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #ea5073, #6d3345); border: none; cursor: pointer; transition: all .2s; box-shadow: 0 4px 12px rgba(234,80,115,0.3); }
      .btn-launch:hover { opacity: 0.9; transform: translateY(-1px); }
      .btn-launch:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      .btn-cancel { padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; background: #F3F4F6; color: #6B7280; border: none; cursor: pointer; }
      .form-actions { display: flex; gap: 12px; margin-top: 12px; }

      .info-box { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 15px; padding: 12px 16px; background: #EFF6FF; border-left: 4px solid #3B82F6; border-radius: 12px; }
      .info-box p { margin: 0; color: #1D4ED8; font-size: 13px; }
      .error-box { margin-bottom: 15px; padding: 12px 16px; background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 12px; }
      .error-box p { margin: 0; color: #DC2626; font-size: 13px; }

      .success-toast { display: flex; align-items: center; gap: 10px; padding: 14px 20px; background: #D1FAE5; border-left: 4px solid #22C55E; border-radius: 12px; font-size: 14px; color: #065F46; margin-bottom: 16px; }
      .success-toast i { font-size: 18px; }

      .results-section { margin-top: 24px; }
      .results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .results-header h3 { font-size: 22px; font-weight: 800; color: #1A1A2E; margin: 0; }
      .results-meta { font-size: 13px; color: #9CA3AF; margin-top: 4px; }
      .btn-validate-all { padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 700; background: #16a34a; color: #fff; border: none; cursor: pointer; transition: all .2s; box-shadow: 0 4px 12px rgba(22,163,74,0.25); }
      .btn-validate-all:hover { opacity: 0.9; }
      .btn-validate-all:disabled { opacity: 0.5; }

      .match-row { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 20px; }
      .match-score-col { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 80px; padding-top: 20px; }
      .score-circle { width: 70px; height: 70px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #fff; box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
      .score-high { background: linear-gradient(135deg, #22c55e, #16a34a); }
      .score-mid  { background: linear-gradient(135deg, #f59e0b, #d97706); }
      .score-low  { background: linear-gradient(135deg, #ef4444, #dc2626); }
      .score-label-text { font-size: 10px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 0.04em; }
      .color-high { color: #16a34a; }
      .color-mid  { color: #d97706; }
      .color-low  { color: #dc2626; }
      .match-main-col { flex: 1; }

      .match-card { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.07); border-top: 3px solid #ea5073; overflow: hidden; }
      .match-card-header { display: flex; align-items: flex-start; padding: 20px 24px; }
      .profile-block { flex: 1; padding: 0 16px; }
      .profile-block:first-child { padding-left: 0; }
      .profile-block:last-child { padding-right: 0; }
      .profile-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #ea5073; margin-bottom: 6px; }
      .profile-name { font-size: 17px; font-weight: 700; color: #1A1A2E; line-height: 1.3; }
      .profile-meta { font-size: 13px; color: #6B7280; margin-top: 4px; }
      .meta-sep { color: #D1D5DB; }
      .profile-tag { display: inline-block; margin-top: 8px; padding: 3px 10px; background: #FEF3C7; color: #92400E; border-radius: 20px; font-size: 11px; font-weight: 600; }
      .coach-stats { font-size: 13px; color: #6B7280; margin-top: 4px; }
      .match-divider { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 16px; gap: 4px; color: #D1D5DB; min-width: 80px; }
      .match-divider i { font-size: 20px; }
      .match-divider-label { font-size: 9px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }

      .match-justification { margin: 0 24px; padding: 12px 16px; background: #F0F9FF; border-left: 3px solid #38bdf8; border-radius: 0 10px 10px 0; font-size: 13px; color: #0369a1; line-height: 1.6; }
      .justification-label { font-weight: 700; }

      .match-actions { display: flex; align-items: center; gap: 10px; padding: 16px 24px; border-top: 1px solid #F3F4F6; }
      .btn-accept { display: inline-flex; align-items: center; gap: 6px; padding: 9px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #ea5073, #c43355); color: #fff; border: none; cursor: pointer; transition: all .2s; box-shadow: 0 3px 10px rgba(234,80,115,0.3); }
      .btn-accept:hover { transform: translateY(-1px); }
      .btn-accept:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      .btn-details { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; background: #fff; color: #374151; border: 1px solid #E5E7EB; cursor: pointer; transition: all .2s; }
      .btn-details:hover { background: #F9FAFB; }
      .btn-change { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; background: #fff; color: #ea5073; border: 1.5px solid #ea5073; cursor: pointer; transition: all .2s; }
      .btn-change:hover { background: #FFF1F3; }

      .details-panel { border-top: 1px solid #F3F4F6; }
      .details-section { padding: 20px 24px; border-bottom: 1px solid #F3F4F6; }
      .details-section:last-child { border-bottom: none; }
      .details-title { font-size: 14px; font-weight: 700; color: #1A1A2E; display: flex; align-items: center; gap: 8px; margin: 0 0 16px; }
      .details-title i { color: #ea5073; }
      .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .detail-item { display: flex; flex-direction: column; gap: 2px; }
      .detail-item.full-width { grid-column: 1 / -1; }
      .detail-key { font-size: 11px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.04em; }
      .detail-val { font-size: 13px; color: #374151; line-height: 1.5; }
      .dynamic-answers { margin-top: 16px; background: #F9FAFB; border-radius: 12px; padding: 16px; }
      .dyn-title { font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
      .dyn-row { display: flex; gap: 12px; padding: 6px 0; border-bottom: 1px solid #F0F0F0; }
      .dyn-row:last-child { border-bottom: none; }
      .dyn-key { font-size: 12px; font-weight: 600; color: #6B7280; min-width: 160px; flex-shrink: 0; }
      .dyn-val { font-size: 13px; color: #374151; }
      .docs-section { margin-top: 16px; }
      .docs-title { font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
      .docs-list { display: flex; flex-wrap: wrap; gap: 8px; }
      .doc-link { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; background: #FEF2F2; color: #ea5073; font-size: 12px; font-weight: 600; text-decoration: none; border: 1px solid #FECDD3; transition: all .2s; }
      .doc-link:hover { background: #FECDDA; }
      .scores-breakdown { margin-top: 16px; }
      .scores-title { font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
      .score-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
      .score-bar-label { font-size: 12px; color: #6B7280; min-width: 200px; }
      .score-bar-bg { flex: 1; height: 7px; border-radius: 4px; background: #E5E7EB; overflow: hidden; }
      .score-bar-fill { height: 100%; border-radius: 4px; transition: width .5s ease; }
      .bar-high { background: #22c55e; }
      .bar-mid  { background: #f59e0b; }
      .bar-low  { background: #ef4444; }
      .score-bar-val { font-size: 12px; font-weight: 700; color: #374151; min-width: 28px; text-align: right; }

      .alternatives-panel { border-top: 1px solid #F3F4F6; background: #FAFAFA; }
      .alt-header { padding: 14px 24px 10px; font-size: 12px; font-weight: 800; color: #6B7280; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #F0F0F0; }
      .alt-row { display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto; gap: 4px 16px; padding: 16px 24px; border-bottom: 1px solid #F0F0F0; align-items: start; }
      .alt-row:last-child { border-bottom: none; }
      .alt-info { grid-row: 1; grid-column: 1; }
      .alt-rank { font-size: 10px; font-weight: 700; color: #ea5073; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
      .alt-coach-name { font-size: 15px; font-weight: 700; color: #1A1A2E; }
      .alt-coach-meta { font-size: 12px; color: #6B7280; margin-top: 2px; }
      .alt-score { grid-row: 1; grid-column: 2; text-align: center; display: flex; flex-direction: column; align-items: center; }
      .alt-score-val { font-size: 20px; font-weight: 800; color: #1A1A2E; }
      .alt-score-label { font-size: 10px; color: #9CA3AF; text-transform: uppercase; font-weight: 600; }
      .alt-justif { grid-row: 2; grid-column: 1; font-size: 12px; color: #6B7280; line-height: 1.5; padding-top: 4px; }
      .btn-select-alt { grid-row: 2; grid-column: 2; align-self: center; display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; font-size: 12px; font-weight: 700; background: linear-gradient(135deg, #ea5073, #c43355); color: #fff; border: none; cursor: pointer; transition: all .2s; white-space: nowrap; }
      .btn-select-alt:hover { opacity: 0.9; }
      .btn-select-alt:disabled { opacity: 0.5; cursor: not-allowed; }

      /* ══ Manual Matching Layout ══ */
      .manual-workspace { display: grid; grid-template-columns: 1fr 260px 1fr; gap: 16px; align-items: start; margin-top: 8px; }

      .manual-panel { background: #fff; border-radius: 20px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); overflow: hidden; }
      .manual-panel-header { display: flex; align-items: center; gap: 10px; padding: 18px 20px; border-bottom: 1px solid #F3F4F6; background: #FAFAFA; }
      .manual-panel-title { font-size: 15px; font-weight: 700; color: #1A1A2E; margin: 0; flex: 1; }
      .manual-count-badge { background: #ea5073; color: #fff; border-radius: 20px; font-size: 12px; font-weight: 700; padding: 2px 10px; }

      .manual-card {
        padding: 16px 20px; border-bottom: 1px solid #F9FAFB;
        cursor: pointer; transition: all .2s;
      }
      .manual-card:last-child { border-bottom: none; }
      .manual-card:hover { background: #FFF5F7; }
      .manual-card-selected { background: #FFF1F3 !important; border-left: 3px solid #ea5073; }
      .manual-card-saturated { opacity: 0.6; }

      .mc-top-row { display: flex; justify-content: space-between; align-items: flex-start; }
      .mc-name { font-size: 15px; font-weight: 700; color: #1A1A2E; line-height: 1.3; }
      .mc-select-indicator { color: #ea5073; font-size: 18px; }
      .mc-meta { font-size: 12px; color: #6B7280; margin-top: 3px; }
      .mc-detail-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .mc-chip { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #F3F4F6; color: #6B7280; }
      .mc-chip-phase { background: #FEF3C7; color: #92400E; }
      .mc-chip-region { background: #EDE9FE; color: #7C3AED; }
      .mc-chip-dispo { background: #D1FAE5; color: #065F46; }
      .mc-chip-saturated { background: #FEE2E2; color: #991B1B; }
      .mc-chip-skill { background: #EFF6FF; color: #1D4ED8; }
      .mc-desc { font-size: 12px; color: #9CA3AF; margin-top: 8px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .mc-needs { font-size: 12px; color: #6B7280; margin-top: 6px; }
      .mc-needs-label { font-weight: 700; color: #374151; }
      .mc-coach-stats { display: flex; gap: 16px; margin-top: 8px; }
      .mc-stat { display: flex; align-items: baseline; gap: 3px; }
      .mc-stat-val { font-size: 18px; font-weight: 800; color: #1A1A2E; }
      .mc-stat-label { font-size: 11px; color: #9CA3AF; }
      .mc-chip-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }

      /* Center Column */
      .manual-center { display: flex; flex-direction: column; align-items: center; gap: 16px; padding-top: 60px; }
      .manual-arrow-box { width: 52px; height: 52px; border-radius: 50%; background: #F3F4F6; display: flex; align-items: center; justify-content: center; font-size: 22px; color: #D1D5DB; transition: all .3s; }
      .arrow-ready { background: linear-gradient(135deg, #ea5073, #c43355); color: #fff; box-shadow: 0 4px 16px rgba(234,80,115,0.4); transform: scale(1.1); }
      .manual-hint { font-size: 12px; color: #9CA3AF; text-align: center; line-height: 1.6; }
      .manual-confirm-zone { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 4px 20px rgba(234,80,115,0.15); border: 2px solid #ea5073; width: 100%; }
      .confirm-pair { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 16px; }
      .confirm-name { font-size: 14px; font-weight: 700; color: #1A1A2E; text-align: center; }
      .confirm-arrow { color: #ea5073; font-size: 18px; }
      .btn-confirm-manual { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 20px; border-radius: 12px; font-size: 14px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #ea5073, #c43355); border: none; cursor: pointer; transition: all .2s; box-shadow: 0 4px 12px rgba(234,80,115,0.35); }
      .btn-confirm-manual:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(234,80,115,0.45); }
      .btn-confirm-manual:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

      /* Thematiques */
      .thematique-form { background: #F9FAFB; border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid #E5E7EB; }
      .thematique-form h4 { margin: 0 0 16px; font-size: 15px; font-weight: 700; color: #1A1A2E; }
      .thematiques-list { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
      .thematique-card { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #F9FAFB; border-radius: 16px; border: 1px solid #E5E7EB; }
      .thematique-card:hover { background: #F3F4F6; }
      .tc-info { flex: 1; }
      .tc-name { font-weight: 700; font-size: 15px; color: #1A1A2E; }
      .tc-dates { font-size: 12px; color: #9CA3AF; margin-top: 4px; }
      .tc-desc { font-size: 13px; color: #6B7280; margin-top: 4px; }
      .tc-right { display: flex; align-items: center; gap: 12px; }
      .tc-actions { display: flex; gap: 6px; }
      .btn-sm { padding: 6px 10px; border-radius: 8px; font-size: 12px; border: 1px solid #E5E7EB; background: #fff; cursor: pointer; }
      .btn-sm:hover { background: #F3F4F6; }
      .btn-sm-danger:hover { background: #FEE2E2; }
      .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
      .status-badge.active { background: #D1FAE5; color: #065F46; }
      .status-badge.expired { background: #FEE2E2; color: #991B1B; }

      .history-card { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: #fff; border-radius: 20px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); margin-bottom: 12px; border-left: 4px solid #22C55E; }
      .hc-left { display: flex; align-items: center; gap: 20px; flex: 1; }
      .hc-pair { display: flex; align-items: center; gap: 12px; }
      .hc-arrow { color: #D1D5DB; font-size: 20px; }
      .hc-role { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
      .hc-name { font-weight: 700; color: #1A1A2E; margin: 0; }
      .hc-right { text-align: center; min-width: 100px; }
      .hc-score { font-size: 22px; font-weight: 800; margin: 0; }
      .hc-score-label { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin: 2px 0 8px; }

      .loading-box { text-align: center; padding: 40px; color: #9CA3AF; font-weight: 600; }
      .empty-state-inline { text-align: center; padding: 32px; color: #6B7280; font-size: 14px; background: #F9FAFB; border-radius: 16px; border: 1px dashed #E5E7EB; }

      @media (max-width: 900px) {
        .manual-workspace { grid-template-columns: 1fr; }
        .manual-center { padding-top: 0; flex-direction: row; flex-wrap: wrap; justify-content: center; }
        .form-grid, .form-grid-3 { grid-template-columns: 1fr; }
        .match-card-header { flex-direction: column; }
        .details-grid { grid-template-columns: 1fr; }
        .match-row { flex-direction: column; }
        .match-score-col { flex-direction: row; padding-top: 0; }
      }
    `]
})
export class AdminMatchingComponent implements OnInit {
    activeTab: 'nouveau' | 'manuel' | 'thematiques' | 'historique' = 'nouveau';

    programmes: Programme[] = [];
    selectedProgId = 0;
    selectedThematiqueId = 0;
    thematiques: ThematiqueCoaching[] = [];

    isLoading = false;
    errorMessage: string | null = null;
    loadingText = "L'IA analyse les profils...";
    launchText = 'Lancer le matching IA';
    bulkLoading = false;
    historyLoading = false;
    singleLoading: Record<number, boolean> = {};

    stats: { activeCount: number; unmatchedCount: number } | null = null;
    currentSession: MatchingSession | null = null;
    enrichedResults: any[] = [];
    groupedResults: any[] = [];
    totalPropositions = 0;
    expandedCards: Record<number, boolean> = {};
    showAlternatives: Record<number, boolean> = {};
    history: any[] = [];

    newThematique: Partial<ThematiqueCoaching> = { nom: '', description: '', dateDebut: '', dateFin: '' };
    editingThematique: ThematiqueCoaching | null = null;

    // ── Manual Matching State ──
    manualProgId = 0;
    manualThematiqueId = 0;
    manualThematiques: ThematiqueCoaching[] = [];
    manualEntrepreneurs: any[] = [];
    manualCoaches: any[] = [];
    manualLoading = false;
    manualSaving = false;
    manualError: string | null = null;
    manualSuccess: any = null;
    manualNote = '';
    selectedEntrepreneur: any = null;
    selectedCoach: any = null;

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
        this.groupedResults = [];
        this.stats = null;
        this.thematiques = [];
        this.selectedThematiqueId = 0;

        if (this.selectedProgId) {
            this.matchingSvc.getMatchingStats(this.selectedProgId).subscribe({ next: (s) => this.stats = s, error: () => {} });
            this.thematiqueSvc.getByProgramme(this.selectedProgId).subscribe({ next: (t) => this.thematiques = t, error: () => {} });
            if (this.activeTab === 'historique') this.loadHistory();
        }
    }

    onManualProgChange(): void {
        this.selectedEntrepreneur = null;
        this.selectedCoach = null;
        this.manualEntrepreneurs = [];
        this.manualCoaches = [];
        this.manualThematiques = [];
        this.manualThematiqueId = 0;
        this.manualError = null;
        this.manualSuccess = null;

        if (!this.manualProgId) return;

        this.thematiqueSvc.getByProgramme(this.manualProgId).subscribe({
            next: (t) => this.manualThematiques = t,
            error: () => {}
        });
    }

    onManualThematiqueChange(): void {
        this.selectedEntrepreneur = null;
        this.selectedCoach = null;
        this.manualEntrepreneurs = [];
        this.manualCoaches = [];
        this.manualError = null;
        this.manualSuccess = null;

        if (!this.manualProgId || !this.manualThematiqueId) return;

        this.manualLoading = true;
        this.matchingSvc.getManualCandidates(this.manualProgId, this.manualThematiqueId).subscribe({
            next: (data) => {
                this.manualEntrepreneurs = data.entrepreneurs || [];
                this.manualCoaches = data.coaches || [];
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
        if (!this.selectedEntrepreneur || !this.selectedCoach || !this.manualProgId || !this.manualThematiqueId) return;
        this.manualSaving = true;
        this.manualError = null;

        this.matchingSvc.createManualMatching(
            this.selectedEntrepreneur.id,
            this.selectedCoach.id,
            this.manualProgId,
            this.manualThematiqueId,
            this.manualNote || undefined
        ).subscribe({
            next: (result) => {
                this.manualSuccess = result;
                this.manualSaving = false;
                this.manualNote = '';
                // Remove matched entrepreneur from list
                this.manualEntrepreneurs = this.manualEntrepreneurs.filter(e => e.id !== this.selectedEntrepreneur.id);
                // Update coach charge
                const coach = this.manualCoaches.find(c => c.id === this.selectedCoach.id);
                if (coach) {
                    coach.nbEntrepreneursActifs = (coach.nbEntrepreneursActifs || 0) + 1;
                    coach.disponible = coach.nbEntrepreneursActifs < 5;
                }
                this.selectedEntrepreneur = null;
                this.selectedCoach = null;
            },
            error: (e) => {
                this.manualError = e.error?.message || 'Erreur lors de la création du matching.';
                this.manualSaving = false;
            }
        });
    }

    setTab(tab: 'nouveau' | 'manuel' | 'thematiques' | 'historique'): void {
        this.activeTab = tab;
        if (tab === 'historique' && this.selectedProgId) this.loadHistory();
        if (tab === 'manuel') {
            this.manualProgId = 0;
            this.manualEntrepreneurs = [];
            this.manualCoaches = [];
            this.selectedEntrepreneur = null;
            this.selectedCoach = null;
            this.manualSuccess = null;
            this.manualError = null;
        }
    }

    runMatching(): void {
        if (!this.selectedProgId) return;
        this.isLoading = true;
        this.errorMessage = null;

        let thId: number | undefined = undefined;
        if (this.selectedThematiqueId) {
            let idStr = String(this.selectedThematiqueId);
            if (idStr.includes(':')) idStr = idStr.split(':')[1].trim();
            thId = parseInt(idStr, 10);
            if (isNaN(thId) || thId === 0) thId = undefined;
        }

        if (!thId) {
            this.errorMessage = 'Une thématique est obligatoire pour lancer le matching IA.';
            this.isLoading = false;
            return;
        }

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
                                matchingId: m.id, scoreIa: m.scoreIa, justification: m.justification,
                                rankTop: m.rankTop || 1, entrepreneurId: m.entrepreneurId,
                                entrepreneur: { nom: 'Entrepreneur #' + m.entrepreneurId },
                                coach: { nom: 'Coach #' + m.coachId }
                            }));
                            this.groupedResults = this.buildGroupedResults(this.enrichedResults);
                            this.totalPropositions = this.enrichedResults.length;
                        }
                        this.isLoading = false;
                    }
                });
                if (this.selectedProgId) this.matchingSvc.getMatchingStats(this.selectedProgId).subscribe(s => this.stats = s);
            },
            error: (e) => {
                this.isLoading = false;
                this.errorMessage = e.error?.message || ('Erreur serveur : ' + e.message);
            }
        });
    }

    parseEnrichedResult(m: any): any {
        const result = { ...m };
        try { result.parsedScoresDetail = typeof m.scoresDetail === 'string' ? JSON.parse(m.scoresDetail) : m.scoresDetail; } catch { result.parsedScoresDetail = null; }
        try { result.parsedPointsForts = typeof m.pointsForts === 'string' ? JSON.parse(m.pointsForts) : m.pointsForts; } catch { result.parsedPointsForts = null; }
        try { result.parsedPointsAttention = typeof m.pointsAttention === 'string' ? JSON.parse(m.pointsAttention) : m.pointsAttention; } catch { result.parsedPointsAttention = null; }
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

    getTopMatch(group: any): any {
        return group.propositions.find((p: any) => p.rankTop === 1) || group.propositions[0] || {};
    }

    getAlternatives(group: any): any[] {
        return group.propositions.filter((p: any) => p.rankTop !== 1);
    }

    getDocumentUrl(filename: string): string {
        return `${environment.apiUrl.replace('/api', '')}/uploads/candidatures/${filename}`;
    }

    validateSession(): void {
        if (!this.currentSession) return;
        this.bulkLoading = true;
        this.matchingSvc.validateSession(this.currentSession.id, 1).subscribe({
            next: () => { this.bulkLoading = false; this.currentSession = null; this.enrichedResults = []; this.groupedResults = []; this.setTab('historique'); },
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
                this.totalPropositions = this.enrichedResults.length;
                this.singleLoading[matchingId] = false;
                if (this.selectedProgId) this.matchingSvc.getMatchingStats(this.selectedProgId).subscribe(s => this.stats = s);
                if (this.groupedResults.length === 0) { this.currentSession = null; this.setTab('historique'); }
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

    saveThematique(): void {
        if (!this.selectedProgId || !this.newThematique.nom || !this.newThematique.dateDebut || !this.newThematique.dateFin) return;
        const th: ThematiqueCoaching = { programmeId: this.selectedProgId, nom: this.newThematique.nom!, description: this.newThematique.description, dateDebut: this.newThematique.dateDebut!, dateFin: this.newThematique.dateFin! };
        if (this.editingThematique) {
            this.thematiqueSvc.update(this.editingThematique.id!, th).subscribe({ next: () => { this.cancelEditThematique(); this.onProgChange(); }, error: (e) => console.error(e) });
        } else {
            this.thematiqueSvc.create(th).subscribe({ next: () => { this.newThematique = { nom: '', description: '', dateDebut: '', dateFin: '' }; this.onProgChange(); }, error: (e) => console.error(e) });
        }
    }

    editThematique(t: ThematiqueCoaching): void { this.editingThematique = t; this.newThematique = { nom: t.nom, description: t.description, dateDebut: t.dateDebut, dateFin: t.dateFin }; }
    cancelEditThematique(): void { this.editingThematique = null; this.newThematique = { nom: '', description: '', dateDebut: '', dateFin: '' }; }
    deleteThematique(id: number): void { if (!confirm('Supprimer cette thématique ?')) return; this.thematiqueSvc.delete(id).subscribe({ next: () => this.onProgChange(), error: (e) => console.error(e) }); }
    toggleExpand(id: number): void { this.expandedCards[id] = !this.expandedCards[id]; }
    toggleAlternatives(entrepreneurId: number): void { this.showAlternatives[entrepreneurId] = !this.showAlternatives[entrepreneurId]; }
    getProgName(): string { const p = this.programmes.find(prog => prog.id === this.selectedProgId); return p ? p.nom : ''; }
    scoreColor(s: number): string { if (s >= 76) return '#22C55E'; if (s >= 50) return '#F59E0B'; return '#EF4444'; }
    scoreLabel(s: number): string { if (s >= 76) return 'Excellent'; if (s >= 50) return 'Moyen'; return 'Faible'; }
    formatScoreLabel(key: string): string {
        const labels: Record<string, string> = { 'alignement_global': 'Alignement global · 30%', 'competences_complementaires': 'Compétences · 25%', 'stade_maturite': 'Stade de maturité · 20%', 'compatibilite_humaine': 'Compatibilité humaine · 15%', 'charge_coach': 'Charge du coach · 10%', 'alignement_thematique': 'Alignement thématique · 30%', 'alignement_sectoriel': 'Alignement sectoriel' };
        return labels[key] || key.replace(/_/g, ' ');
    }
    objectEntries(obj: any): [string, any][] { if (!obj || typeof obj !== 'object') return []; return Object.entries(obj); }
}
