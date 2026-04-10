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
          <h1>Rapport de Session</h1>
          <p>Détaillez les points clés et les recommandations pour cette séance de coaching.</p>
        </header>

        <form (ngSubmit)="saveNote()" #noteForm="ngForm" class="note-form">
          <div class="form-grid">
            <!-- Left Column: Synthese & Appreciation -->
            <div class="form-main">
              <div class="form-group">
                <label for="synthese">Synthèse de la séance <span class="required">*</span></label>
                <textarea 
                  id="synthese" 
                  name="synthese" 
                  [(ngModel)]="note.synthese" 
                  required 
                  placeholder="Qu'est-ce qui a été discuté durant cette session ?"
                  rows="6"
                  class="premium-input"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="appreciation">Appréciation globale <span class="required">*</span></label>
                <textarea 
                  id="appreciation" 
                  name="appreciation" 
                  [(ngModel)]="note.appreciation" 
                  required 
                  placeholder="Évaluation de la progression et de l'implication de l'entrepreneur."
                  rows="4"
                  class="premium-input"
                ></textarea>
              </div>
            </div>

            <!-- Right Column: Recommendations & Meta -->
            <div class="form-sidebar">
              <div class="form-group">
                <label for="recommendation">Recommandations</label>
                <textarea 
                  id="recommendation" 
                  name="recommendation" 
                  [(ngModel)]="note.recommendation" 
                  placeholder="Actions à entreprendre pour la prochaine fois."
                  rows="6"
                  class="premium-input"
                ></textarea>
              </div>

              <div class="info-card">
                <div class="info-item">
                  <i class="pi pi-calendar"></i>
                  <span>Session ID: {{ rendezVousId }}</span>
                </div>
                <div class="info-item">
                  <i class="pi pi-user"></i>
                  <span>Entrepreneur: {{ entrepreneurName || 'Chargement...' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="goBack()">Annuler</button>
            <button type="submit" class="btn-primary" [disabled]="!noteForm.form.valid || isSaving">
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
      background: #f0f2f5;
      padding: 2rem;
      font-family: 'Inter', sans-serif;
    }
    .glass-container {
      max-width: 1000px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 2.5rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.05);
      border: 1px solid rgba(255,255,255,0.3);
    }
    .page-header { margin-bottom: 2.5rem; }
    .page-header h1 { font-size: 2.2rem; font-weight: 800; color: #1a202c; margin: 1rem 0 0.5rem; }
    .page-header p { color: #718096; font-size: 1.1rem; }
    .btn-back { 
      color: #718096; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem;
      transition: color 0.2s;
    }
    .btn-back:hover { color: #FF4D85; }

    .form-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; font-weight: 600; color: #4a5568; margin-bottom: 0.5rem; font-size: 0.95rem; }
    .required { color: #e53e3e; }

    .premium-input {
      width: 100%;
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #f7fafc;
      font-family: inherit;
      font-size: 1rem;
      transition: all 0.2s;
      outline: none;
    }
    .premium-input:focus {
      border-color: #FF4D85;
      background: white;
      box-shadow: 0 0 0 4px rgba(255, 77, 133, 0.1);
    }

    .info-card {
      background: linear-gradient(135deg, #FF6B9E, #FF3366);
      border-radius: 16px;
      padding: 1.5rem;
      color: white;
      box-shadow: 0 10px 20px rgba(255, 51, 102, 0.2);
    }
    .info-item { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.8rem; font-weight: 500; }
    .info-item:last-child { margin-bottom: 0; }

    .form-actions { 
      margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid #edf2f7; 
      display: flex; justify-content: flex-end; gap: 1rem;
    }
    .btn-primary {
      background: #FF4D85; color: white; border: none; padding: 0.8rem 2rem; border-radius: 12px;
      font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 15px rgba(255, 77, 133, 0.3); }
    .btn-primary:disabled { background: #cbd5e0; cursor: not-allowed; transform: none; box-shadow: none; }
    
    .btn-secondary {
      background: white; color: #4a5568; border: 1px solid #e2e8f0; padding: 0.8rem 2rem; border-radius: 12px;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-secondary:hover { background: #f7fafc; border-color: #cbd5e0; }

    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class NoteDeSyntheseCreateComponent implements OnInit {
  rendezVousId: number | null = null;
  entrepreneurName: string = '';
  isSaving = false;
  note: any = {
    synthese: '',
    appreciation: '',
    recommendation: '',
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
    
    // In a real scenario, we need to link the entrepreneur and coach entities
    // For this simple integration, we'll send the IDs or objects
    const payload = {
        ...this.note,
        dateCreation: new Date().toISOString(),
        rendezVous: { id: this.rendezVousId },
        coach: { id: typeof coachId === 'string' ? parseInt(coachId, 10) : coachId }
        // entrepreneur needs to be resolved from session or passed in state
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
