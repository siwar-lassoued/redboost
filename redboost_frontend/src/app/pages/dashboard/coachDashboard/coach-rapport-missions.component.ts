import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachService, ProgrammeDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-coach-rapport-missions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="matching-page">
      <!-- ── Header ─────────────────────── -->
      <div class="matching-header">
        <div>
          <h1 class="matching-title">Rapport de missions (Expert)</h1>
          <p class="matching-subtitle">Template de Reporting d'Accompagnement — Sélectionnez un programme et une période</p>
        </div>
        <div class="header-actions">
          <div class="ia-badge">
            <i class="pi pi-file"></i> Rapport Expert
          </div>
        </div>
      </div>

      <!-- ── Configuration du rapport ─────────────────────── -->
      <div class="card">
        <div class="card-header-row">
          <div class="card-icon"><i class="pi pi-cog"></i></div>
          <div>
            <h2 class="card-title">Configuration du rapport</h2>
            <p class="hint" style="margin-top:2px;">Sélectionnez le programme et la période pour générer votre rapport de mission.</p>
          </div>
        </div>

        <div class="form-grid">
          <!-- Left Column -->
          <div style="display:flex; flex-direction:column; gap:20px;">
            <div class="form-group">
              <label>Programme d'accompagnement <span class="required">*</span></label>
              <select [ngModel]="selectedProgramme" (ngModelChange)="selectedProgramme = $event" class="form-select">
                <option value="" disabled>Choisir un programme...</option>
                <option *ngFor="let prog of programs" [value]="prog.nom">{{prog.nom}} ({{prog.annee}})</option>
                <option *ngIf="programs.length === 0" disabled>Aucun programme trouvé</option>
              </select>
            </div>

            <div class="form-group">
              <label>Période d'analyse <span class="required">*</span></label>
              <div style="display:flex; gap:16px;">
                <div style="flex:1">
                  <label class="hint" style="display:block; margin-bottom:4px;">Du</label>
                  <input type="date" [(ngModel)]="dateDebut" class="form-input">
                </div>
                <div style="flex:1">
                  <label class="hint" style="display:block; margin-bottom:4px;">Au</label>
                  <input type="date" [(ngModel)]="dateFin" class="form-input">
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div>
            <div class="form-group">
              <label>Données incluses dans le rapport</label>
              <div style="display:flex; flex-direction:column; gap:12px; margin-top:8px;">
                <div *ngFor="let inc of inclusionItems" class="data-item">
                  <div class="data-icon"><i class="pi pi-check"></i></div>
                  <i [class]="'pi pi-' + inc.icon" style="color:#9CA3AF; margin-right:8px;"></i>
                  <span>{{ inc.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="launch-section">
          <button (click)="chargerDonnees()" [disabled]="!selectedProgramme || !dateDebut || !dateFin" class="btn-launch" style="width:100%; justify-content:center;">
            <i class="pi pi-refresh"></i>
            Charger les données et Rédiger
          </button>
        </div>
      </div>

      <div *ngIf="donneesChargees" class="success-banner">
        <i class="pi pi-check-circle"></i>
        <span>Données chargées</span>
        <span class="hint" style="margin-left:8px;">Programme : <b>{{selectedProgramme}}</b></span>
      </div>

      <!-- ═══ Sections du rapport ═══ -->
      <div *ngIf="donneesChargees" class="rapport-sections">

        <!-- Section 1: Introduction -->
        <div class="card report-card" style="padding:0; overflow:hidden; border-left:5px solid #ea5073;">
          <div class="report-section-header">
            <div class="section-num">1</div>
            <h2 class="card-title">Introduction</h2>
          </div>
          <div class="report-section-body">
            <div class="sub-section">
              <h3 class="sub-title"><i class="pi pi-building" style="color:#ea5073; margin-right:8px;"></i> Présentation du programme</h3>
              <textarea class="report-textarea" rows="3" [(ngModel)]="rapport.presentationProgramme"
                  placeholder="Décrivez le programme d'accompagnement..."></textarea>
            </div>

            <div class="sub-section">
              <h3 class="sub-title"><i class="pi pi-users" style="color:#ea5073; margin-right:8px;"></i> Contexte et partenaires</h3>
              <textarea class="report-textarea" rows="3" [(ngModel)]="rapport.contextePartenaires"
                  placeholder="Contexte de la mission et partenaires impliqués..."></textarea>
            </div>

            <div class="sub-section">
              <h3 class="sub-title"><i class="pi pi-flag" style="color:#ea5073; margin-right:8px;"></i> Objectifs du programme</h3>
              <textarea class="report-textarea" rows="3" [(ngModel)]="rapport.objectifsProgramme"
                  placeholder="Exemple : • Structurer les modèles économiques&#10;• Développer les stratégies marketing"></textarea>
            </div>

            <div class="sub-section">
              <h3 class="sub-title"><i class="pi pi-file" style="color:#ea5073; margin-right:8px;"></i> Objectif du présent rapport</h3>
              <textarea class="report-textarea" rows="2" [(ngModel)]="rapport.objectifRapport"
                  placeholder="Ce rapport a pour objectif de..."></textarea>
            </div>
          </div>
        </div>

        <!-- Section 2: Présentation de la phase/période -->
        <div class="card report-card" style="padding:0; overflow:hidden; border-left:5px solid #3B82F6;">
          <div class="report-section-header" style="background: linear-gradient(to right, #ffffff, #EFF6FF);">
            <div class="section-num" style="background: linear-gradient(135deg, #3B82F6, #1D4ED8);">2</div>
            <h2 class="card-title">Présentation de la phase / période</h2>
          </div>
          <div class="report-section-body">
            <div class="sub-section">
              <h3 class="sub-title"><i class="pi pi-target" style="color:#3B82F6; margin-right:8px;"></i> 2.1 Objectifs de la phase</h3>
              <textarea class="report-textarea" rows="3" [(ngModel)]="rapport.objectifsPhase"
                  placeholder="Objectifs spécifiques de cette phase d'accompagnement..."></textarea>
            </div>

            <div class="sub-section">
              <h3 class="sub-title"><i class="pi pi-sitemap" style="color:#3B82F6; margin-right:8px;"></i> 2.2 Méthodologie d'accompagnement</h3>
              <textarea class="report-textarea" rows="3" [(ngModel)]="rapport.methodologie"
                  placeholder="Les séances ont été organisées de manière hebdomadaire avec une durée moyenne de 1h à 2h par entrepreneur."></textarea>
            </div>

            <div class="sub-section">
              <h3 class="sub-title"><i class="pi pi-calendar" style="color:#3B82F6; margin-right:8px;"></i> 2.3 Organisation des séances de coaching</h3>
              <textarea class="report-textarea" rows="3" [(ngModel)]="rapport.organisationSeances"
                  placeholder="Décrivez l'organisation, le nombre de séances, la fréquence..."></textarea>
            </div>

            <div class="sub-section">
              <h3 class="sub-title"><i class="pi pi-play" style="color:#3B82F6; margin-right:8px;"></i> 2.4 Déroulement de la phase</h3>
              <textarea class="report-textarea" rows="3" [(ngModel)]="rapport.deroulementPhase"
                  placeholder="Décrivez les activités réalisées, les ateliers et les sessions individuelles..."></textarea>
            </div>

            <div class="sub-section">
              <h3 class="sub-title"><i class="pi pi-chart-line" style="color:#059669; margin-right:8px;"></i> 2.5 Résultats obtenus</h3>
              <textarea class="report-textarea" rows="4" [(ngModel)]="rapport.resultatsObtenus"
                  placeholder="• Amélioration du business model&#10;• Validation du marché&#10;• Préparation des pitch decks"></textarea>
            </div>

            <div class="sub-section">
              <h3 class="sub-title"><i class="pi pi-table" style="color:#3B82F6; margin-right:8px;"></i> 2.6 Planning des séances</h3>
              <p class="hint" style="margin-bottom:16px;">Tableau de suivi automatique — les données sont extraites du système.</p>
              <div class="planning-table-wrapper">
                <table class="planning-table">
                  <thead>
                    <tr>
                      <th class="sticky-col">Coach</th>
                      <th *ngFor="let day of planningDays">{{day}}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let coach of planningCoaches">
                      <td class="sticky-col coach-name">{{coach.name}}</td>
                      <td *ngFor="let day of planningDays" [class]="getCellClass(coach, day)">
                        {{getCellValue(coach, day)}}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="legend">
                <span class="legend-title">Légende :</span>
                <span class="legend-item"><span class="legend-color phase-identification"></span> Phase d'identification</span>
                <span class="legend-item"><span class="legend-color phase-investigation"></span> Phase d'investigation</span>
                <span class="legend-item"><span class="legend-color phase-synthese"></span> Phase de synthèse</span>
              </div>
            </div>

            <div class="sub-section">
              <h3 class="sub-title"><i class="pi pi-lightbulb" style="color:#D97706; margin-right:8px;"></i> 2.7 Leçons apprises</h3>
              <textarea class="report-textarea" rows="4" [(ngModel)]="rapport.leconsApprises"
                  placeholder="• Importance de la validation du marché&#10;• Nécessité d'un suivi régulier"></textarea>
            </div>
          </div>
        </div>

        <!-- Section 3: Conclusion -->
        <div class="card report-card" style="padding:0; overflow:hidden; border-left:5px solid #059669;">
          <div class="report-section-header" style="background: linear-gradient(to right, #ffffff, #ECFDF5);">
            <div class="section-num" style="background: linear-gradient(135deg, #059669, #047857);">3</div>
            <h2 class="card-title">Conclusion & Recommandations</h2>
          </div>
          <div class="report-section-body">
            <textarea class="report-textarea" rows="5" [(ngModel)]="rapport.conclusion"
                placeholder="Résumez l'impact global de la mission, les perspectives futures et les recommandations pour la prochaine phase."></textarea>
          </div>
        </div>

        <!-- Action Buttons Footer -->
        <div class="actions-footer">
          <button class="btn-cancel" (click)="saveAsDraft()"><i class="pi pi-save"></i> Enregistrer brouillon</button>
          <button class="btn-launch" (click)="generateReport()"><i class="pi pi-file-pdf"></i> Générer le rapport</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ── Admin Reporting IA shared design system ── */
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
    .card {
      background: #fff; border-radius: 20px; padding: 24px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07); margin-bottom: 20px;
    }
    .card-header-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .card-icon {
      width: 36px; height: 36px; border-radius: 10px; display: flex;
      align-items: center; justify-content: center; font-size: 16px;
      background: linear-gradient(135deg, #ea5073, #6d3345); color: white;
    }
    .card-title { font-size: 18px; font-weight: 700; color: #1A1A2E; margin: 0; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
    .required { color: #ea5073; }
    .form-select, .form-input {
      width: 100%; padding: 12px 16px; border: 1px solid #E5E7EB; background: #F9FAFB;
      border-radius: 12px; font-size: 14px; outline: none; font-weight: 500;
      color: #333; transition: border-color .2s; box-sizing: border-box; font-family: inherit;
    }
    .form-select:focus, .form-input:focus { border-color: #ea5073; box-shadow: 0 0 0 3px rgba(234,80,115,0.1); }
    .hint { font-size: 12px; color: #9CA3AF; margin-top: 4px; }

    /* Data items */
    .data-item {
      display: flex; align-items: center; padding: 12px; border-radius: 12px;
      border: 1px solid #F3F4F6; background: #F9FAFB; font-size: 13px; font-weight: 600; color: #4B5563;
    }
    .data-icon {
      width: 20px; height: 20px; border-radius: 4px; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #ea5073, #6d3345); color: #fff; font-size: 10px; margin-right: 12px;
    }

    /* Buttons */
    .btn-launch {
      display: inline-flex; align-items: center; gap: 8px; padding: 16px 24px;
      border-radius: 12px; font-size: 15px; font-weight: 700; color: #fff;
      background: linear-gradient(135deg, #ea5073, #6d3345); border: none;
      cursor: pointer; transition: all .2s; box-shadow: 0 4px 12px rgba(234,80,115,0.3);
      font-family: inherit;
    }
    .btn-launch:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-launch:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-cancel {
      padding: 14px 24px; border-radius: 12px; font-size: 14px; font-weight: 600;
      background: #fff; color: #6B7280; border: 2px solid #E5E7EB; cursor: pointer;
      transition: all .2s; font-family: inherit; display: inline-flex; align-items: center; gap: 8px;
    }
    .btn-cancel:hover { background: #F3F4F6; border-color: #D1D5DB; }
    .launch-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid #F3F4F6; }

    .success-banner {
      padding: 14px 20px; background: #ECFDF5; border: 1px solid #A7F3D0;
      border-radius: 16px; color: #065F46; display: flex; align-items: center;
      gap: 10px; font-weight: 600; font-size: 14px; margin-bottom: 20px;
      animation: fadeIn 0.3s ease-out;
    }

    /* ── Report Sections (admin reporting style) ── */
    .rapport-sections { display: flex; flex-direction: column; gap: 20px; }

    .report-card { transition: all .2s; }
    .report-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.1); }

    .report-section-header {
      padding: 20px 24px; border-bottom: 1px solid #F3F4F6;
      background: linear-gradient(to right, #ffffff, #FFF0F5);
      display: flex; align-items: center; gap: 14px;
    }
    .section-num {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #ea5073, #6d3345);
      color: white; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 800; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(234,80,115,0.3);
    }
    .report-section-body { padding: 24px; }

    .sub-section { margin-bottom: 24px; }
    .sub-section:last-child { margin-bottom: 0; }
    .sub-title {
      font-size: 14px; font-weight: 700; color: #1A1A2E; margin: 0 0 10px;
      display: flex; align-items: center;
    }

    .report-textarea {
      width: 100%; padding: 14px 18px; border-radius: 14px;
      border: 2px solid #E5E7EB; background: #F9FAFB;
      font-family: inherit; font-size: 14px; color: #1A1A2E;
      outline: none; transition: all .25s ease; resize: vertical;
      line-height: 1.6; box-sizing: border-box;
    }
    .report-textarea:focus {
      border-color: #ea5073; background: #fff;
      box-shadow: 0 0 0 4px rgba(234,80,115,0.08);
    }
    .report-textarea:hover:not(:focus) { border-color: #CBD5E0; }

    /* Planning Table */
    .planning-table-wrapper { overflow-x: auto; border-radius: 14px; border: 1px solid #E5E7EB; }
    .planning-table { width: 100%; border-collapse: collapse; min-width: 800px; }
    .planning-table th, .planning-table td {
      padding: 12px 10px; text-align: center; border: 1px solid #EDF2F7; font-size: 13px;
    }
    .planning-table th { background: #F9FAFB; color: #4A5568; font-weight: 700; font-size: 12px; text-transform: uppercase; }
    .sticky-col { position: sticky; left: 0; background: white; z-index: 1; text-align: left; font-weight: 600; min-width: 130px; }
    .coach-name { color: #1A1A2E; }
    .planning-table thead .sticky-col { background: #F9FAFB; }

    .cell-identification { background: rgba(66,133,244,0.15); color: #1D4ED8; font-weight: 600; }
    .cell-investigation { background: rgba(234,67,53,0.12); color: #DC2626; font-weight: 600; }
    .cell-synthese { background: rgba(52,168,83,0.12); color: #059669; font-weight: 600; }

    .legend { margin-top: 16px; display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
    .legend-title { font-weight: 800; color: #374151; font-size: 12px; text-transform: uppercase; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6B7280; font-weight: 500; }
    .legend-color { width: 16px; height: 16px; border-radius: 4px; }
    .phase-identification { background: rgba(66,133,244,0.35); }
    .phase-investigation { background: rgba(234,67,53,0.25); }
    .phase-synthese { background: rgba(52,168,83,0.25); }

    .actions-footer {
      display: flex; justify-content: center; gap: 16px; padding: 8px 0 24px;
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .matching-header { flex-direction: column; gap: 12px; }
      .report-section-header { flex-direction: row; }
      .actions-footer { flex-direction: column; align-items: stretch; }
      .btn-launch, .btn-cancel { width: 100%; justify-content: center; }
    }
  `]
})
export class CoachRapportMissionsComponent implements OnInit {
  selectedProgramme: string = '';
  programs: ProgrammeDTO[] = [];
  coachId: number | null = null;
  dateDebut: string = '';
  dateFin: string = '';
  donneesChargees: boolean = false;

  inclusionItems = [
    { label: 'Sessions de Coaching réalisées', icon: 'calendar' },
    { label: 'Tâches et Livrables', icon: 'check-square' },
    { label: 'Suivi des entrepreneurs', icon: 'users' },
    { label: 'Planning et organisation', icon: 'clock' }
  ];

  // Rapport form fields (matching Google Doc template)
  rapport: any = {
    // Section 1
    presentationProgramme: '',
    contextePartenaires: '',
    objectifsProgramme: '',
    objectifRapport: '',
    // Section 2
    objectifsPhase: '',
    methodologie: '',
    organisationSeances: '',
    deroulementPhase: '',
    resultatsObtenus: '',
    leconsApprises: '',
    // Section 3
    conclusion: ''
  };

  // Planning grid data
  planningDays: number[] = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  planningCoaches: any[] = [
    { name: 'Coach 1', sessions: {} },
    { name: 'Coach 2', sessions: {} },
  ];

  constructor(
      private coachService: CoachService,
      private authService: AuthService,
      private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const rawId = this.authService.getUserId();
    this.coachId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;

    if (this.coachId) {
        this.loadPrograms();
    }
  }

  loadPrograms() {
    if (!this.coachId) return;
    this.coachService.getCoachProgrammes(this.coachId).subscribe({
        next: (data) => {
            this.programs = data;
            if (this.programs.length > 0) {
                this.selectedProgramme = this.programs[0].nom;
            }
        },
        error: (err) => console.error('Error loading programs:', err)
    });
  }

  chargerDonnees() {
    this.donneesChargees = true;
    // TODO: load actual session data for the planning grid
  }

  saveAsDraft() {
    this.toastr.success('Brouillon enregistré !', 'Succès');
  }

  generateReport() {
    this.toastr.info('Génération du rapport PDF en cours...', 'Info');
    // TODO: integrate PDF generation
  }

  getCellClass(coach: any, day: number): string {
    const session = coach.sessions[day];
    if (!session) return '';
    return 'cell-' + session.phase;
  }

  getCellValue(coach: any, day: number): string {
    const session = coach.sessions[day];
    return session ? session.value : '';
  }
}
