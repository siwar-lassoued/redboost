import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CoachService } from './services/coach.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../frontoffice/service/auth.service';

interface ActionSuivi {
  action: string;
  description: string;
  statut: string;
  commentaire: string;
}

@Component({
  selector: 'app-note-de-synthese-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="note-create-page">
      <div class="glass-container">
        <header class="page-header">
          <div class="back-nav">
            <a routerLink="/coach-dashboard" class="btn-back">
              <i class="pi pi-arrow-left"></i> Retour au Dashboard
            </a>
          </div>
          <h1>📋 Reporting de Session</h1>
          <p>Modèle de reporting de session individuel détaillant l'avancement et le suivi.</p>
        </header>

        <form (ngSubmit)="saveNote()" #noteForm="ngForm" class="note-form">

          <!-- Section 1: Informations générales -->
          <div class="section-card">
            <h2 class="section-title"><span class="section-num">1</span> Informations générales</h2>
            <div class="info-grid">
              <div class="form-group">
                <label>Nom de l'entreprise</label>
                <input type="text" class="premium-input" [(ngModel)]="note.entreprise" name="entreprise" placeholder="Saisir le nom">
              </div>
              <div class="form-group">
                <label>Secteur d'activité</label>
                <input type="text" class="premium-input" [(ngModel)]="note.secteur" name="secteur" placeholder="Ex: Healthtech, Fintech...">
              </div>
              <div class="form-group">
                <label>Gouvernorat</label>
                <input type="text" class="premium-input" [(ngModel)]="note.gouvernorat" name="gouvernorat" placeholder="Ex: Tunis">
              </div>
              <div class="form-group">
                <label>Nom du bénéficiaire</label>
                <input type="text" class="premium-input" [(ngModel)]="note.nomBeneficiaire" name="nomBeneficiaire" [placeholder]="entrepreneurName || 'Nom du bénéficiaire'">
              </div>
              <div class="form-group">
                <label>Nom du coach</label>
                <input type="text" class="premium-input" [(ngModel)]="note.nomCoach" name="nomCoach" placeholder="Votre nom">
              </div>
              <div class="form-group">
                <label>Type de session</label>
                <div class="type-session-selector">
                  <button type="button" class="type-btn" [class.active]="note.typeSession === 'TERRAIN'" (click)="note.typeSession = 'TERRAIN'">
                    <i class="pi pi-building"></i> Terrain
                  </button>
                  <button type="button" class="type-btn" [class.active]="note.typeSession === 'EN_LIGNE'" (click)="note.typeSession = 'EN_LIGNE'">
                    <i class="pi pi-video"></i> En ligne
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>Numéro de session</label>
                <input type="text" class="premium-input" [(ngModel)]="note.numeroSession" name="numeroSession" placeholder="Ex: Session 1">
              </div>
              <div class="form-group">
                <label>Date de session</label>
                <input type="date" class="premium-input" [(ngModel)]="note.dateSession" name="dateSession">
              </div>
            </div>
          </div>

          <!-- Section 2: Contenu de la session -->
          <div class="section-card">
            <h2 class="section-title"><span class="section-num">2</span> Contenu de la session</h2>

            <div class="form-group">
              <label>Objectif de la session <span class="required">*</span></label>
              <textarea class="premium-input" [(ngModel)]="note.objectifSession" name="objectifSession" required
                placeholder="Quel était l'objectif principal de la session ?" rows="2"></textarea>
            </div>

            <div class="form-group">
              <label>Déroulement / Aspects traités <span class="required">*</span></label>
              <textarea class="premium-input" [(ngModel)]="note.synthese" name="synthese" required
                placeholder="Détaillez les thèmes et sujets abordés" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label>Apprentissage / Capacités développées</label>
              <textarea class="premium-input" [(ngModel)]="note.apprentissage" name="apprentissage"
                placeholder="Quelles nouvelles compétences ou apprentissages ont été acquis ?" rows="2"></textarea>
            </div>

            <div class="info-grid">
                <div class="form-group">
                  <label>Avancement des actions par rapport à la session N-1</label>
                  <textarea class="premium-input" [(ngModel)]="note.avancementActions" name="avancementActions" rows="3"></textarea>
                </div>
                <div class="form-group">
                  <label>Problématiques identifiées</label>
                  <textarea class="premium-input" [(ngModel)]="note.problematiques" name="problematiques" rows="3"></textarea>
                </div>
            </div>

            <div class="info-grid">
                <div class="form-group">
                  <label>Recommandations / Conseils</label>
                  <textarea class="premium-input" [(ngModel)]="note.recommendation" name="recommendation" rows="3"></textarea>
                </div>
                <div class="form-group">
                  <label>Travail à préparer pour la prochaine session</label>
                  <textarea class="premium-input" [(ngModel)]="note.travailAPreparer" name="travailAPreparer" rows="3"></textarea>
                </div>
            </div>

            <div class="form-group">
              <label>Appréciation globale / Session narrative (Feedback coach) <span class="required">*</span></label>
              <textarea class="premium-input" [(ngModel)]="note.appreciation" name="appreciation" required
                placeholder="Évaluation du dynamisme, implication et comportement" rows="3"></textarea>
            </div>
          </div>

          <!-- Section 3: Suivi des actions -->
          <div class="section-card">
            <h2 class="section-title">
              <div style="display:flex; align-items:center; gap:0.8rem;">
                <span class="section-num">3</span> Suivi des actions
              </div>
              <button type="button" class="btn-sm-primary" (click)="addAction()">
                 <i class="pi pi-plus"></i> Ajouter une action
              </button>
            </h2>

            <div class="actions-table-wrapper" *ngIf="actions.length > 0">
                <table class="actions-table">
                    <thead>
                        <tr>
                            <th>Action</th>
                            <th>Description</th>
                            <th>Statut</th>
                            <th>Commentaire</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let act of actions; let i = index">
                            <td><input type="text" class="table-input" [(ngModel)]="act.action" name="act_action_{{i}}" placeholder="Ex: Rédiger BP"></td>
                            <td><input type="text" class="table-input" [(ngModel)]="act.description" name="act_desc_{{i}}" placeholder="..."></td>
                            <td>
                                <select class="table-input" [(ngModel)]="act.statut" name="act_statut_{{i}}">
                                    <option value="A faire">A faire</option>
                                    <option value="En cours">En cours</option>
                                    <option value="Terminé">Terminé</option>
                                </select>
                            </td>
                            <td><input type="text" class="table-input" [(ngModel)]="act.commentaire" name="act_comment_{{i}}" placeholder="..."></td>
                            <td>
                                <button type="button" class="btn-icon text-red-500" (click)="removeAction(i)"><i class="pi pi-trash"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div *ngIf="actions.length === 0" class="empty-actions">
                Aucune action ajoutée. Cliquez sur "Ajouter une action" pour commencer.
            </div>
          </div>

          <!-- Section 4: Validation -->
          <div class="section-card validation-card">
            <h2 class="section-title"><span class="section-num">4</span> Validation</h2>
            <div class="info-grid">
               <div class="form-group">
                   <label>Nom & Signature du validateur</label>
                   <input type="text" class="premium-input" [(ngModel)]="note.nomCoach" disabled name="validationNom" placeholder="Le nom du coach fera office de signature">
               </div>
               <div class="form-group">
                   <label>Cochez pour confirmer</label>
                   <label class="checkbox-container" style="margin-top: 10px;">
                      <input type="checkbox" required name="validationCheck" [(ngModel)]="isValidated">
                      <span class="checkmark"></span>
                      Je certifie l'exactitude des informations rapportées dans ce document.
                   </label>
               </div>
            </div>
          </div>

          <!-- Session Info Card -->
          <div class="info-banner" *ngIf="rendezVousId">
            <div class="info-item"><i class="pi pi-calendar"></i> <span>Session ID: {{ rendezVousId }}</span></div>
            <div class="info-item"><i class="pi pi-user"></i> <span>Entrepreneur: {{ entrepreneurName || 'Chargement...' }}</span></div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="goBack()">Annuler</button>
            <button type="submit" class="btn-primary shadow-glow" [disabled]="!noteForm.form.valid || !isValidated || isSaving">
              <i class="pi" [class.pi-save]="!isSaving" [class.pi-spin]="isSaving" [class.pi-spinner]="isSaving"></i>
              {{ isSaving ? 'Enregistrement...' : 'Enregistrer le rapport de session' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .note-create-page {
      min-height: 100vh; background: #f8f9fa; padding: 2rem; font-family: var(--font-family); margin-top: -1rem;
    }
    .glass-container { max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: #2D3748; margin: 1rem 0 0.3rem; }
    .page-header p { color: #718096; font-size: 1rem; }
    .btn-back { color: #718096; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem; transition: color 0.2s; }
    .btn-back:hover { color: #FF4D85; }

    .section-card {
      background: white; border-radius: 1.5rem; padding: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin-bottom: 1.5rem;
    }
    .validation-card { background: linear-gradient(to right, #ffffff, #F0FFF4); border: 1px solid #C6F6D5; }
    .section-title {
      font-size: 1.3rem; font-weight: 700; color: #2D3748; margin: 0 0 1.5rem 0;
      display: flex; align-items: center; justify-content: space-between; gap: 0.8rem;
    }
    .section-num {
      width: 32px; height: 32px; background: linear-gradient(135deg, #FF6B9E, #E83E8C); color: white; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 700; flex-shrink: 0;
    }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-weight: 600; color: #4a5568; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .required { color: #e53e3e; }

    .premium-input {
      width: 100%; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc;
      font-family: inherit; font-size: 0.95rem; color: #2D3748; outline: none; transition: all 0.2s; resize: vertical; box-sizing: border-box;
    }
    .premium-input:focus { border-color: #FF4D85; background: white; box-shadow: 0 0 0 3px rgba(255, 77, 133, 0.1); }
    .premium-input:disabled { background: #EDF2F7; color: #A0AEC0; cursor: not-allowed; }

    .type-session-selector { display: flex; gap: 0.75rem; }
    .type-btn {
      flex: 1; padding: 0.6rem 1rem; border-radius: 10px; border: 2px solid #E2E8F0; background: white; font-family: inherit; font-size: 0.85rem; color: #4A5568;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 500; transition: all 0.2s;
    }
    .type-btn:hover { border-color: #FF4D85; color: #FF4D85; }
    .type-btn.active { background: linear-gradient(135deg, #FF4D85, #FF6B9E); color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(255,77,133,0.3); }

    /* Actions Table */
    .btn-sm-primary {
      background: #F8FAFC; color: #FF4D85; border: 1px solid #FF4D85; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem;
    }
    .btn-sm-primary:hover { background: #FF4D85; color: white; }
    .actions-table-wrapper { overflow-x: auto; margin-top: 1rem; border: 1px solid #E2E8F0; border-radius: 12px; }
    .actions-table { width: 100%; border-collapse: collapse; }
    .actions-table th { background: #F8FAFC; padding: 12px; text-align: left; font-size: 0.85rem; color: #718096; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #E2E8F0; }
    .actions-table td { padding: 8px; border-bottom: 1px solid #E2E8F0; }
    .actions-table tr:last-child td { border-bottom: none; }
    .table-input { width: 100%; padding: 0.5rem; border: 1px solid transparent; border-radius: 6px; font-family: inherit; font-size: 0.9rem; background: transparent; transition: all 0.2s; box-sizing: border-box; }
    .table-input:focus { border-color: #CBD5E0; background: white; outline: none; }
    .table-input:hover { background: #F8FAFC; }
    .btn-icon { background: none; border: none; cursor: pointer; padding: 0.5rem; border-radius: 6px; transition: background 0.2s; }
    .btn-icon:hover { background: #FEE2E2; }
    .text-red-500 { color: #EF4444; }
    .empty-actions { padding: 2rem; text-align: center; color: #A0AEC0; font-size: 0.95rem; border: 2px dashed #E2E8F0; border-radius: 12px; margin-top: 1rem; }

    /* Custom Checkbox */
    .checkbox-container { display: flex; align-items: center; cursor: pointer; font-size: 0.95rem; color: #4A5568; position: relative; padding-left: 30px; user-select: none; }
    .checkbox-container input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
    .checkmark { position: absolute; top: 0; left: 0; height: 20px; width: 20px; background-color: #fff; border: 2px solid #CBD5E0; border-radius: 4px; transition: all 0.2s; }
    .checkbox-container:hover input ~ .checkmark { border-color: #48BB78; }
    .checkbox-container input:checked ~ .checkmark { background-color: #48BB78; border-color: #48BB78; }
    .checkmark:after { content: ""; position: absolute; display: none; }
    .checkbox-container input:checked ~ .checkmark:after { display: block; left: 6px; top: 2px; width: 5px; height: 10px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }

    .info-banner { display: flex; gap: 2rem; padding: 1rem 1.5rem; background: linear-gradient(135deg, #FF6B9E, #E83E8C); border-radius: 1rem; color: white; margin-bottom: 1.5rem; box-shadow: 0 8px 20px rgba(255,77,133,0.2); }
    .info-item { display: flex; align-items: center; gap: 0.5rem; font-weight: 500; font-size: 0.9rem; }

    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem 0; }
    .btn-primary { background: linear-gradient(135deg, #FF6B9E 0%, #E83E8C 100%); color: white; border: none; padding: 0.8rem 2rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; font-family: inherit; }
    .btn-primary:hover { transform: translateY(-2px); }
    .btn-primary:disabled { background: #cbd5e0; background-image: none; cursor: not-allowed; transform: none; box-shadow: none; opacity: 0.7; }
    .shadow-glow { box-shadow: 0 4px 15px rgba(233,30,99,0.4); }

    .btn-secondary { background: white; color: #4a5568; border: 1px solid #e2e8f0; padding: 0.8rem 2rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .btn-secondary:hover { background: #f7fafc; border-color: #cbd5e0; }

    @media (max-width: 768px) {
      .info-grid { grid-template-columns: 1fr; }
      .info-banner { flex-direction: column; gap: 0.5rem; }
      .actions-table th, .actions-table td { white-space: nowrap; }
    }
  `]
})
export class NoteDeSyntheseCreateComponent implements OnInit {
  rendezVousId: number | null = null;
  entrepreneurName: string = '';
  isSaving = false;
  isValidated = false;
  
  note: any = {
    // Section 1
    entreprise: '',
    secteur: '',
    gouvernorat: '',
    nomBeneficiaire: '',
    nomCoach: '',
    typeSession: 'EN_LIGNE',
    numeroSession: '',
    dateSession: new Date().toISOString().split('T')[0],
    
    // Section 2
    objectifSession: '',
    synthese: '',
    apprentissage: '',
    avancementActions: '',
    problematiques: '',
    recommendation: '',
    travailAPreparer: '',
    appreciation: '',
    
    actionsSuivi: '', // will hold JSON

    // Links
    rendezVous: null,
    entrepreneur: null,
    coach: null
  };

  actions: ActionSuivi[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coachService: CoachService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.rendezVousId = +params['id'];
    });

    const state = window.history.state;
    if (state && state.note) {
      this.note = { ...this.note, ...state.note };
      if(this.note.actionsSuivi) {
          try {
              this.actions = JSON.parse(this.note.actionsSuivi);
          } catch(e) {}
      }
    }
  }

  addAction() {
      this.actions.push({ action: '', description: '', statut: 'A faire', commentaire: '' });
  }

  removeAction(index: number) {
      this.actions.splice(index, 1);
  }

  saveNote() {
    this.isSaving = true;
    const coachId = this.authService.getUserId();

    // Serialize actions
    this.note.actionsSuivi = JSON.stringify(this.actions);

    const payload = {
        ...this.note,
        dateCreation: new Date().toISOString(),
        rendezVous: { id: this.rendezVousId },
        coach: { id: typeof coachId === 'string' ? parseInt(coachId, 10) : coachId }
    };

    // Assuming we extend note directly, or the backend accepts it.
    this.coachService.saveNote(payload).subscribe({
      next: () => {
        this.toastr.success("Rapport de session enregistré", "Succès");
        this.router.navigate(["/coach-dashboard"]);
      },
      error: (err) => {
        console.error("Error saving note:", err);
        this.toastr.error("Erreur lors de l'enregistrement", "Erreur");
        this.isSaving = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/coach-dashboard']);
  }
}
