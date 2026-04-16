import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CoachService } from './services/coach.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../frontoffice/service/auth.service';

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
          <h1>📋 Rapport de Session</h1>
          <p>Modèle de reporting de session — Détaillez les points clés et les recommandations.</p>
        </header>

        <form (ngSubmit)="saveNote()" #noteForm="ngForm" class="note-form">

          <!-- Section 1: Informations générales -->
          <div class="section-card">
            <h2 class="section-title"><span class="section-num">1</span> Informations générales</h2>
            <div class="info-grid">
              <div class="form-group">
                <label>Nom de l'entreprise</label>
                <input type="text" class="premium-input" [(ngModel)]="note.entreprise" name="entreprise" placeholder="Nom de l'entreprise">
              </div>
              <div class="form-group">
                <label>Secteur d'activité</label>
                <input type="text" class="premium-input" [(ngModel)]="note.secteur" name="secteur" placeholder="Secteur d'activité">
              </div>
              <div class="form-group">
                <label>Gouvernorat</label>
                <input type="text" class="premium-input" [(ngModel)]="note.gouvernorat" name="gouvernorat" placeholder="Gouvernorat">
              </div>
              <div class="form-group">
                <label>Nom du bénéficiaire</label>
                <input type="text" class="premium-input" [(ngModel)]="note.beneficiaire" name="beneficiaire" [placeholder]="entrepreneurName || 'Nom du bénéficiaire'">
              </div>
              <div class="form-group">
                <label>Nom du coach</label>
                <input type="text" class="premium-input" [(ngModel)]="note.nomCoach" name="nomCoach" placeholder="Nom du coach">
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
                <input type="number" class="premium-input" [(ngModel)]="note.numeroSession" name="numeroSession" placeholder="Ex: 1">
              </div>
              <div class="form-group">
                <label>Date</label>
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
                placeholder="Quel était l'objectif principal de cette session ?" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label>Déroulement de la session <span class="required">*</span></label>
              <textarea class="premium-input" [(ngModel)]="note.synthese" name="synthese" required
                placeholder="Comment s'est déroulée la session ? Qu'est-ce qui a été discuté et réalisé ?" rows="5"></textarea>
            </div>

            <div class="form-group">
              <label>Résultats obtenus</label>
              <textarea class="premium-input" [(ngModel)]="note.resultats" name="resultats"
                placeholder="Quels résultats concrets ont été atteints durant cette session ?" rows="4"></textarea>
            </div>
          </div>

          <!-- Section 3: Problématiques & Plan d'action -->
          <div class="section-card">
            <h2 class="section-title"><span class="section-num">3</span> Problématiques identifiées & Plan d'action</h2>

            <div class="form-group">
              <label>Problématiques identifiées</label>
              <textarea class="premium-input" [(ngModel)]="note.problematiques" name="problematiques"
                placeholder="Y a-t-il des problèmes ou obstacles rencontrés ? Détaillez ici." rows="4"></textarea>
            </div>

            <div class="form-group">
              <label>Plan d'action / Recommandations</label>
              <textarea class="premium-input" [(ngModel)]="note.recommendation" name="recommendation"
                placeholder="Actions à entreprendre pour la prochaine session. Plan d'action pour l'entrepreneur." rows="4"></textarea>
            </div>

            <div class="form-group">
              <label>Appréciation globale <span class="required">*</span></label>
              <textarea class="premium-input" [(ngModel)]="note.appreciation" name="appreciation" required
                placeholder="Évaluation de la progression et de l'implication de l'entrepreneur." rows="3"></textarea>
            </div>
          </div>

          <!-- Session Info Card -->
          <div class="info-banner" *ngIf="rendezVousId">
            <div class="info-item"><i class="pi pi-calendar"></i> <span>Session ID: {{ rendezVousId }}</span></div>
            <div class="info-item"><i class="pi pi-user"></i> <span>Entrepreneur: {{ entrepreneurName || 'Chargement...' }}</span></div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="goBack()">Annuler</button>
            <button type="submit" class="btn-primary shadow-glow" [disabled]="!noteForm.form.valid || isSaving">
              <i class="pi" [class.pi-save]="!isSaving" [class.pi-spin]="isSaving" [class.pi-spinner]="isSaving"></i>
              {{ isSaving ? 'Enregistrement...' : 'Enregistrer le rapport' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .note-create-page {
      min-height: 100vh;
      background: #f8f9fa;
      padding: 2rem;
      font-family: var(--font-family);
      margin-top: -1rem;
    }
    .glass-container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: #2D3748; margin: 1rem 0 0.3rem; }
    .page-header p { color: #718096; font-size: 1rem; }
    .btn-back {
      color: #718096; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem;
      transition: color 0.2s;
    }
    .btn-back:hover { color: #FF4D85; }

    .section-card {
      background: white;
      border-radius: 1.5rem;
      padding: 2rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
      margin-bottom: 1.5rem;
    }
    .section-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: #2D3748;
      margin: 0 0 1.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
    .section-num {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #FF6B9E, #E83E8C);
      color: white; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; font-weight: 700; flex-shrink: 0;
    }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-weight: 600; color: #4a5568; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .required { color: #e53e3e; }

    .premium-input {
      width: 100%; padding: 0.75rem 1rem; border-radius: 10px;
      border: 1px solid #e2e8f0; background: #f8fafc;
      font-family: inherit; font-size: 0.95rem; color: #2D3748;
      outline: none; transition: all 0.2s; resize: vertical;
    }
    .premium-input:focus {
      border-color: #FF4D85; background: white;
      box-shadow: 0 0 0 3px rgba(255, 77, 133, 0.1);
    }

    .type-session-selector { display: flex; gap: 0.75rem; }
    .type-btn {
      flex: 1; padding: 0.6rem 1rem; border-radius: 10px; border: 2px solid #E2E8F0;
      background: white; font-family: inherit; font-size: 0.85rem; color: #4A5568;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      gap: 0.5rem; font-weight: 500; transition: all 0.2s;
    }
    .type-btn:hover { border-color: #FF4D85; color: #FF4D85; }
    .type-btn.active { background: linear-gradient(135deg, #FF4D85, #FF6B9E); color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(255,77,133,0.3); }

    .info-banner {
      display: flex; gap: 2rem; padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #FF6B9E, #E83E8C);
      border-radius: 1rem; color: white; margin-bottom: 1.5rem;
      box-shadow: 0 8px 20px rgba(255,77,133,0.2);
    }
    .info-item { display: flex; align-items: center; gap: 0.5rem; font-weight: 500; font-size: 0.9rem; }

    .form-actions {
      display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem 0;
    }
    .btn-primary {
      background: linear-gradient(135deg, #FF6B9E 0%, #E83E8C 100%); color: white; border: none;
      padding: 0.8rem 2rem; border-radius: 12px; font-weight: 700; cursor: pointer;
      transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; font-family: inherit;
    }
    .btn-primary:hover { transform: translateY(-2px); }
    .btn-primary:disabled { background: #cbd5e0; cursor: not-allowed; transform: none; box-shadow: none; }
    .shadow-glow { box-shadow: 0 4px 15px rgba(233,30,99,0.4); }

    .btn-secondary {
      background: white; color: #4a5568; border: 1px solid #e2e8f0; padding: 0.8rem 2rem;
      border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .btn-secondary:hover { background: #f7fafc; border-color: #cbd5e0; }

    @media (max-width: 768px) {
      .info-grid { grid-template-columns: 1fr; }
      .info-banner { flex-direction: column; gap: 0.5rem; }
    }
  `]
})
export class NoteDeSyntheseCreateComponent implements OnInit {
  rendezVousId: number | null = null;
  entrepreneurName: string = '';
  isSaving = false;
  note: any = {
    // Section 1
    entreprise: '',
    secteur: '',
    gouvernorat: '',
    beneficiaire: '',
    nomCoach: '',
    typeSession: 'EN_LIGNE',
    numeroSession: null,
    dateSession: '',
    // Section 2
    objectifSession: '',
    synthese: '',
    resultats: '',
    // Section 3
    problematiques: '',
    recommendation: '',
    appreciation: '',
    // Links
    rendezVous: null,
    entrepreneur: null,
    coach: null
  };

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
      if (this.rendezVousId) {
        this.loadSessionDetails(this.rendezVousId);
      }
    });

    const state = window.history.state;
    if (state && state.note) {
      this.note = { ...this.note, ...state.note };
    }
  }

  loadSessionDetails(id: number) {
    // We could fetch session details to get entrepreneur info
    // For now, if we came from dashboard, we might have it in state
  }

  saveNote() {
    this.isSaving = true;
    const coachId = this.authService.getUserId();

    const payload = {
        synthese: this.note.synthese,
        appreciation: this.note.appreciation,
        recommendation: this.note.recommendation,
        objectifSession: this.note.objectifSession,
        resultats: this.note.resultats,
        problematiques: this.note.problematiques,
        dateCreation: new Date().toISOString(),
        rendezVous: { id: this.rendezVousId },
        coach: { id: typeof coachId === 'string' ? parseInt(coachId, 10) : coachId }
    };

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
