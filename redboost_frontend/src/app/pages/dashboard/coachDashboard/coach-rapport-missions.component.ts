import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachService, ProgrammeDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';

@Component({
  selector: 'app-coach-rapport-missions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rapport-page">
      <div class="page-header">
          <h1>Rapport de missions</h1>
          <p>Sélectionnez un programme et une période pour générer votre rapport</p>
      </div>

      <!-- Configuration du rapport -->
      <div class="config-card">
          <h2 class="config-title">Configuration du rapport</h2>
          <div class="config-grid">
              <div class="form-group">
                  <label>Programme*</label>
              <select class="premium-select" [(ngModel)]="selectedProgramme">
                  <option *ngFor="let prog of programs" [value]="prog.nom">{{prog.nom}} ({{prog.annee}})</option>
                  <option *ngIf="programs.length === 0" disabled>Aucun programme trouvé</option>
              </select>
              </div>
              <div class="form-group">
                  <label>Date début*</label>
                  <div class="flex gap-2">
                      <select class="premium-select" [(ngModel)]="dateDebutMois">
                          <option>Janvier</option><option>Février</option><option>Mars</option>
                          <option>Avril</option><option>Mai</option><option>Juin</option>
                          <option>Juillet</option><option>Août</option><option>Septembre</option>
                          <option>Octobre</option><option>Novembre</option><option>Décembre</option>
                      </select>
                      <select class="premium-select" [(ngModel)]="dateDebutAnnee">
                          <option>2024</option><option>2025</option><option>2026</option>
                      </select>
                  </div>
              </div>
              <div class="form-group">
                  <label>Date fin*</label>
                  <div class="flex gap-2">
                      <select class="premium-select" [(ngModel)]="dateFinMois">
                          <option>Janvier</option><option>Février</option><option>Mars</option>
                          <option>Avril</option><option>Mai</option><option>Juin</option>
                          <option>Juillet</option><option>Août</option><option>Septembre</option>
                          <option>Octobre</option><option>Novembre</option><option>Décembre</option>
                      </select>
                      <select class="premium-select" [(ngModel)]="dateFinAnnee">
                          <option>2024</option><option>2025</option><option>2026</option>
                      </select>
                  </div>
              </div>
              <div class="form-group flex-none" style="align-self: flex-end;">
                  <button class="btn-primary" (click)="chargerDonnees()">Charger les données</button>
              </div>
          </div>

          <div *ngIf="donneesChargees" class="success-banner">
              <i class="pi pi-check-circle"></i>
              <span>Données chargées</span>
              <span class="text-sm ml-2">Programme : <b>{{selectedProgramme}}</b> • Période : <b>{{dateDebutMois}} {{dateDebutAnnee}} – {{dateFinMois}} {{dateFinAnnee}}</b></span>
          </div>
      </div>

      <!-- Sections du rapport -->
      <div *ngIf="donneesChargees" class="rapport-sections">

          <!-- Section 1: Introduction -->
          <div class="section-card">
              <h2 class="section-title">1. Introduction</h2>
              <p class="section-desc">Décrivez le contexte de la mission, les entrepreneurs accompagnés et les objectifs généraux.</p>
              <textarea class="premium-textarea" rows="5" [(ngModel)]="introduction"
                  placeholder="Exemple : Ce rapport présente les activités de coaching réalisées dans le cadre du programme Startup Booster 2025..."></textarea>
          </div>

          <!-- Section 2: Organisation -->
          <div class="section-card">
              <h2 class="section-title">2. Organisation des séances de coaching</h2>

              <div class="sub-section">
                  <h3>2.1 Rappel des objectifs</h3>
                  <textarea class="premium-textarea" rows="4" [(ngModel)]="rappelObjectifs"
                      placeholder="Exemple : • Structurer les modèles économiques&#10;• Développer les stratégies marketing&#10;• Accompagner la préparation au pitch investisseurs"></textarea>
              </div>

              <div class="sub-section">
                  <h3>2.2 Rappel du fonctionnement de la mission</h3>
                  <textarea class="premium-textarea" rows="3" [(ngModel)]="rappelFonctionnement"
                      placeholder="Exemple : Les séances ont été organisées de manière hebdomadaire avec une durée moyenne de 1h à 2h par entrepreneur."></textarea>
              </div>

              <div class="sub-section">
                  <h3>2.3 Déroulement de la phase</h3>
                  <textarea class="premium-textarea" rows="3" [(ngModel)]="deroulementPhase"
                      placeholder="Décrivez les activités réalisées, les ateliers et les sessions individuelles..."></textarea>
              </div>

              <div class="sub-section">
                  <h3>2.4 Résultats obtenus</h3>
                  <textarea class="premium-textarea" rows="4" [(ngModel)]="resultatsObtenus"
                      placeholder="Exemple : • Amélioration du business model&#10;• Validation du marché&#10;• Préparation des pitch decks"></textarea>
              </div>

              <div class="sub-section">
                  <h3>2.5 Planning</h3>
                  <p class="section-desc">Tableau de suivi des séances de coaching</p>
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
                  <p class="text-xs text-gray-400 mt-1">💡 Cliquez sur une cellule pour ajouter/modifier une session</p>
              </div>

              <div class="sub-section">
                  <h3>2.6 Leçons apprises des actions de coaching</h3>
                  <textarea class="premium-textarea" rows="4" [(ngModel)]="leconsApprises"
                      placeholder="Exemple : • Importance de la validation du marché&#10;• Nécessité d'un suivi régulier&#10;• Impact positif des séances individuelles"></textarea>
              </div>
          </div>

          <!-- Section 3: Conclusion -->
          <div class="section-card">
              <h2 class="section-title">3. Conclusion</h2>
              <p class="section-desc">Résumez l'impact global de la mission et les perspectives futures.</p>
              <textarea class="premium-textarea" rows="5" [(ngModel)]="conclusion"
                  placeholder="Exemple : La mission de coaching a permis aux entrepreneurs d'améliorer significativement leurs projets et de préparer efficacement la prochaine phase du programme."></textarea>
          </div>

          <!-- Action Buttons Footer -->
          <div class="actions-footer">
              <button class="btn-outline"><i class="pi pi-eye"></i> Aperçu du rapport</button>
              <button class="btn-outline"><i class="pi pi-save"></i> Enregistrer brouillon</button>
              <button class="btn-primary shadow-glow"><i class="pi pi-file-pdf"></i> Générer le rapport</button>
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
    .page-header h1 { font-size: 2.2rem; font-weight: 700; color: #2D3748; margin: 0; }
    .page-header p { color: #718096; font-size: 1.1rem; margin-top: 0.3rem; margin-bottom: 1.5rem; }

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
        padding: 0.7rem 1rem;
        border-radius: 10px;
        border: 1px solid #E2E8F0;
        background: #F8FAFC;
        font-family: inherit;
        font-size: 0.95rem;
        color: #4A5568;
        outline: none;
        transition: all 0.2s;
        flex: 1;
    }
    .premium-select:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); }

    .btn-primary {
        background: var(--gradient-pink);
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: transform 0.2s;
        white-space: nowrap;
    }
    .btn-primary:hover { transform: translateY(-2px); }
    .shadow-glow { box-shadow: 0 4px 15px rgba(233,30,99,0.4); }

    .btn-outline {
        background: white;
        border: 1px solid #E2E8F0;
        color: #4A5568;
        padding: 0.8rem 1.5rem;
        border-radius: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    .btn-outline:hover { background: #F8FAFC; border-color: #CBD5E0; }

    .success-banner {
        margin-top: 1.5rem;
        padding: 1rem 1.5rem;
        background: #F0FFF4;
        border: 1px solid #C6F6D5;
        border-radius: 12px;
        color: #276749;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
    }

    .rapport-sections { display: flex; flex-direction: column; gap: 2rem; }

    .section-card {
        background: white;
        border-radius: 1.5rem;
        padding: 2rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.03);
    }
    .section-title { font-size: 1.4rem; font-weight: 700; color: #2D3748; margin: 0 0 0.5rem 0; }
    .section-desc { color: #718096; font-size: 0.95rem; margin-bottom: 1rem; }

    .sub-section { margin-top: 2rem; }
    .sub-section h3 { font-size: 1.15rem; font-weight: 700; color: #2D3748; margin-bottom: 0.8rem; }

    .premium-textarea {
        width: 100%;
        padding: 1rem 1.2rem;
        border-radius: 12px;
        border: 1px solid #E2E8F0;
        background: #F8FAFC;
        font-family: inherit;
        font-size: 0.95rem;
        color: #2D3748;
        outline: none;
        transition: all 0.2s;
        resize: vertical;
    }
    .premium-textarea:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); background: white; }

    /* Planning Table */
    .planning-table-wrapper { overflow-x: auto; border-radius: 12px; border: 1px solid #E2E8F0; }
    .planning-table { width: 100%; border-collapse: collapse; min-width: 800px; }
    .planning-table th, .planning-table td {
        padding: 0.8rem 0.6rem;
        text-align: center;
        border: 1px solid #EDF2F7;
        font-size: 0.85rem;
    }
    .planning-table th { background: #F7FAFC; color: #4A5568; font-weight: 700; }
    .sticky-col { position: sticky; left: 0; background: white; z-index: 1; text-align: left; font-weight: 600; min-width: 130px; }
    .coach-name { color: #2D3748; }
    .planning-table thead .sticky-col { background: #F7FAFC; }

    .cell-identification { background: rgba(66,133,244,0.2); color: #2D3748; font-weight: 600; cursor: pointer; }
    .cell-investigation { background: rgba(234,67,53,0.15); color: #2D3748; font-weight: 600; cursor: pointer; }
    .cell-synthese { background: rgba(52,168,83,0.15); color: #2D3748; font-weight: 600; cursor: pointer; }

    .legend { margin-top: 1rem; display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; }
    .legend-title { font-weight: 700; color: #4A5568; font-size: 0.9rem; }
    .legend-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: #718096; }
    .legend-color { width: 16px; height: 16px; border-radius: 4px; }
    .phase-identification { background: rgba(66,133,244,0.4); }
    .phase-investigation { background: rgba(234,67,53,0.3); }
    .phase-synthese { background: rgba(52,168,83,0.3); }

    .actions-footer {
        display: flex;
        justify-content: center;
        gap: 1rem;
        padding: 2rem 0;
    }
  `]
})
export class CoachRapportMissionsComponent implements OnInit {
  selectedProgramme: string = '';
  programs: ProgrammeDTO[] = [];
  coachId: number | null = null;
  dateDebutMois: string = 'Janvier';
  dateDebutAnnee: string = '2024';
  dateFinMois: string = 'Octobre';
  dateFinAnnee: string = '2026';
  donneesChargees: boolean = false;

  // Form fields
  introduction: string = '';
  rappelObjectifs: string = '';
  rappelFonctionnement: string = '';
  deroulementPhase: string = '';
  resultatsObtenus: string = '';
  leconsApprises: string = '';
  conclusion: string = '';

  // Planning grid data
  planningDays: number[] = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  planningCoaches: any[] = [
    { name: 'Sonia Ibidhi', sessions: { 13: { value: '1H', phase: 'identification' }, 15: { value: '2H', phase: 'identification' } } },
    { name: 'Mariem Essghaier', sessions: { 14: { value: '1H', phase: 'investigation' } } },
    { name: 'Raja Chraity', sessions: { 16: { value: '2H', phase: 'synthese' } } },
    { name: 'Ines Jebbli', sessions: {} },
    { name: 'Asma Dhahri', sessions: {} },
    { name: 'Anissa Hammami', sessions: {} },
    { name: 'Monia Guesmi', sessions: {} },
    { name: 'Siwar Benkraïem', sessions: {} },
  ];

  constructor(
      private coachService: CoachService,
      private authService: AuthService
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
