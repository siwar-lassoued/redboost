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
    <div class="rapport-page">
      <div class="page-header">
          <div class="page-title-row">
              <div class="page-icon">📄</div>
              <div>
                  <h1>Rapport de missions (Expert)</h1>
                  <p>Template de Reporting d'Accompagnement — Sélectionnez un programme et une période</p>
              </div>
          </div>
      </div>

      <!-- Configuration du rapport -->
      <div class="config-card">
          <h2 class="config-title">Configuration du rapport</h2>
          <div class="config-grid">
              <div class="form-group">
                  <label>Programme *</label>
                  <select class="premium-select" [(ngModel)]="selectedProgramme">
                      <option *ngFor="let prog of programs" [value]="prog.nom">{{prog.nom}} ({{prog.annee}})</option>
                      <option *ngIf="programs.length === 0" disabled>Aucun programme trouvé</option>
                  </select>
              </div>
              <div class="form-group">
                  <label>Date début *</label>
                  <input type="date" class="premium-select" [(ngModel)]="dateDebut">
              </div>
              <div class="form-group">
                  <label>Date fin *</label>
                  <input type="date" class="premium-select" [(ngModel)]="dateFin">
              </div>
              <div class="form-group flex-none" style="align-self: flex-end;">
                  <button class="btn-primary" (click)="chargerDonnees()">
                      <i class="pi pi-refresh"></i> Charger les données
                  </button>
              </div>
          </div>

          <div *ngIf="donneesChargees" class="success-banner">
              <i class="pi pi-check-circle"></i>
              <span>Données chargées</span>
              <span class="text-sm ml-2">Programme : <b>{{selectedProgramme}}</b></span>
          </div>
      </div>

      <!-- Sections du rapport (based on Google Doc template) -->
      <div *ngIf="donneesChargees" class="rapport-sections">

          <!-- Section 1: Introduction -->
          <div class="section-card">
              <h2 class="section-title"><span class="section-num">1</span> Introduction</h2>

              <div class="sub-section">
                  <h3>Présentation du programme</h3>
                  <textarea class="premium-textarea" rows="3" [(ngModel)]="rapport.presentationProgramme"
                      placeholder="Décrivez le programme d'accompagnement..."></textarea>
              </div>

              <div class="sub-section">
                  <h3>Contexte et partenaires</h3>
                  <textarea class="premium-textarea" rows="3" [(ngModel)]="rapport.contextePartenaires"
                      placeholder="Contexte de la mission et partenaires impliqués..."></textarea>
              </div>

              <div class="sub-section">
                  <h3>Objectifs du programme</h3>
                  <textarea class="premium-textarea" rows="3" [(ngModel)]="rapport.objectifsProgramme"
                      placeholder="Exemple : • Structurer les modèles économiques&#10;• Développer les stratégies marketing"></textarea>
              </div>

              <div class="sub-section">
                  <h3>Objectif du présent rapport</h3>
                  <textarea class="premium-textarea" rows="2" [(ngModel)]="rapport.objectifRapport"
                      placeholder="Ce rapport a pour objectif de..."></textarea>
              </div>
          </div>

          <!-- Section 2: Présentation de la phase/période -->
          <div class="section-card">
              <h2 class="section-title"><span class="section-num">2</span> Présentation de la phase / période</h2>

              <div class="sub-section">
                  <h3>2.1 Objectifs de la phase</h3>
                  <textarea class="premium-textarea" rows="3" [(ngModel)]="rapport.objectifsPhase"
                      placeholder="Objectifs spécifiques de cette phase d'accompagnement..."></textarea>
              </div>

              <div class="sub-section">
                  <h3>2.2 Méthodologie d'accompagnement</h3>
                  <textarea class="premium-textarea" rows="3" [(ngModel)]="rapport.methodologie"
                      placeholder="Les séances ont été organisées de manière hebdomadaire avec une durée moyenne de 1h à 2h par entrepreneur."></textarea>
              </div>

              <div class="sub-section">
                  <h3>2.3 Organisation des séances de coaching</h3>
                  <textarea class="premium-textarea" rows="3" [(ngModel)]="rapport.organisationSeances"
                      placeholder="Décrivez l'organisation, le nombre de séances, la fréquence..."></textarea>
              </div>

              <div class="sub-section">
                  <h3>2.4 Déroulement de la phase</h3>
                  <textarea class="premium-textarea" rows="3" [(ngModel)]="rapport.deroulementPhase"
                      placeholder="Décrivez les activités réalisées, les ateliers et les sessions individuelles..."></textarea>
              </div>

              <div class="sub-section">
                  <h3>2.5 Résultats obtenus</h3>
                  <textarea class="premium-textarea" rows="4" [(ngModel)]="rapport.resultatsObtenus"
                      placeholder="• Amélioration du business model&#10;• Validation du marché&#10;• Préparation des pitch decks"></textarea>
              </div>

              <div class="sub-section">
                  <h3>2.6 Planning des séances</h3>
                  <p class="section-desc">Tableau de suivi automatique — les données sont extraites du système.</p>
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
                  <h3>2.7 Leçons apprises</h3>
                  <textarea class="premium-textarea" rows="4" [(ngModel)]="rapport.leconsApprises"
                      placeholder="• Importance de la validation du marché&#10;• Nécessité d'un suivi régulier"></textarea>
              </div>
          </div>

          <!-- Section 3: Conclusion -->
          <div class="section-card">
              <h2 class="section-title"><span class="section-num">3</span> Conclusion & Recommandations</h2>
              <textarea class="premium-textarea" rows="5" [(ngModel)]="rapport.conclusion"
                  placeholder="Résumez l'impact global de la mission, les perspectives futures et les recommandations pour la prochaine phase."></textarea>
          </div>

          <!-- Action Buttons Footer -->
          <div class="actions-footer">
              <button class="btn-outline" (click)="saveAsDraft()"><i class="pi pi-save"></i> Enregistrer brouillon</button>
              <button class="btn-primary shadow-glow" (click)="generateReport()"><i class="pi pi-file-pdf"></i> Générer le rapport</button>
          </div>
      </div>
    </div>
  `,
  styles: [`
    .rapport-page {
        padding: 2rem;
        background: #f8f9fa;
        min-height: calc(100vh - 70px);
        font-family: var(--font-family);
        margin-top: -1rem;
    }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-title-row { display: flex; align-items: center; gap: 1rem; }
    .page-icon { width: 50px; height: 50px; background: linear-gradient(135deg, #FFF5F7, #FFE0E8); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: #2D3748; margin: 0; }
    .page-header p { color: #718096; font-size: 1rem; margin-top: 0.2rem; }

    .config-card {
        background: white;
        border-radius: 1.5rem;
        padding: 2rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.03);
        margin-bottom: 2rem;
    }
    .config-title { font-size: 1.3rem; font-weight: 700; color: #2D3748; margin: 0 0 1.5rem 0; }
    .config-grid { display: flex; gap: 1.5rem; align-items: flex-start; flex-wrap: wrap; }

    .form-group { display: flex; flex-direction: column; flex: 1; min-width: 180px; }
    .form-group label { font-size: 0.9rem; font-weight: 600; color: #4A5568; margin-bottom: 0.5rem; }

    .premium-select {
        padding: 0.7rem 1rem; border-radius: 10px; border: 1px solid #E2E8F0;
        background: #F8FAFC; font-family: inherit; font-size: 0.95rem; color: #4A5568;
        outline: none; transition: all 0.2s; flex: 1;
    }
    .premium-select:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); }

    .btn-primary {
        background: linear-gradient(135deg, #FF6B9E 0%, #E83E8C 100%);
        color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 12px;
        font-weight: 600; display: flex; align-items: center; gap: 0.5rem;
        cursor: pointer; transition: transform 0.2s; white-space: nowrap; font-family: inherit;
    }
    .btn-primary:hover { transform: translateY(-2px); }
    .shadow-glow { box-shadow: 0 4px 15px rgba(233,30,99,0.4); }

    .btn-outline {
        background: white; border: 1px solid #E2E8F0; color: #4A5568;
        padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 600;
        display: flex; align-items: center; gap: 0.5rem; cursor: pointer;
        transition: all 0.2s; font-family: inherit;
    }
    .btn-outline:hover { background: #F8FAFC; border-color: #CBD5E0; }

    .success-banner {
        margin-top: 1.5rem; padding: 1rem 1.5rem; background: #F0FFF4;
        border: 1px solid #C6F6D5; border-radius: 12px; color: #276749;
        display: flex; align-items: center; gap: 0.5rem; font-weight: 500;
    }

    .rapport-sections { display: flex; flex-direction: column; gap: 2rem; }

    .section-card {
        background: white; border-radius: 1.5rem; padding: 2rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.03);
    }
    .section-title {
        font-size: 1.3rem; font-weight: 700; color: #2D3748; margin: 0 0 1.5rem 0;
        display: flex; align-items: center; gap: 0.8rem;
    }
    .section-num {
        width: 32px; height: 32px;
        background: linear-gradient(135deg, #FF6B9E, #E83E8C);
        color: white; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.9rem; font-weight: 700; flex-shrink: 0;
    }
    .section-desc { color: #718096; font-size: 0.95rem; margin-bottom: 1rem; }

    .sub-section { margin-top: 1.5rem; }
    .sub-section h3 { font-size: 1.1rem; font-weight: 700; color: #2D3748; margin-bottom: 0.8rem; }

    .premium-textarea {
        width: 100%; padding: 1rem 1.2rem; border-radius: 12px;
        border: 1px solid #E2E8F0; background: #F8FAFC;
        font-family: inherit; font-size: 0.95rem; color: #2D3748;
        outline: none; transition: all 0.2s; resize: vertical;
    }
    .premium-textarea:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); background: white; }

    /* Planning Table */
    .planning-table-wrapper { overflow-x: auto; border-radius: 12px; border: 1px solid #E2E8F0; }
    .planning-table { width: 100%; border-collapse: collapse; min-width: 800px; }
    .planning-table th, .planning-table td {
        padding: 0.8rem 0.6rem; text-align: center; border: 1px solid #EDF2F7; font-size: 0.85rem;
    }
    .planning-table th { background: #F7FAFC; color: #4A5568; font-weight: 700; }
    .sticky-col { position: sticky; left: 0; background: white; z-index: 1; text-align: left; font-weight: 600; min-width: 130px; }
    .coach-name { color: #2D3748; }
    .planning-table thead .sticky-col { background: #F7FAFC; }

    .cell-identification { background: rgba(66,133,244,0.2); color: #2D3748; font-weight: 600; }
    .cell-investigation { background: rgba(234,67,53,0.15); color: #2D3748; font-weight: 600; }
    .cell-synthese { background: rgba(52,168,83,0.15); color: #2D3748; font-weight: 600; }

    .legend { margin-top: 1rem; display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; }
    .legend-title { font-weight: 700; color: #4A5568; font-size: 0.9rem; }
    .legend-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: #718096; }
    .legend-color { width: 16px; height: 16px; border-radius: 4px; }
    .phase-identification { background: rgba(66,133,244,0.4); }
    .phase-investigation { background: rgba(234,67,53,0.3); }
    .phase-synthese { background: rgba(52,168,83,0.3); }

    .actions-footer {
        display: flex; justify-content: center; gap: 1rem; padding: 2rem 0;
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
