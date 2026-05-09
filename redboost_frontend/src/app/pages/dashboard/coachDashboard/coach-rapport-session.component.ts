import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ToastrService } from 'ngx-toastr';
import { CoachService, CoachEntrepreneurDTO, UserDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-coach-rapport-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rapport-container">
      <div class="header-row">
        <div class="header-text">
            <h1 class="rapport-title">Rapports de Session</h1>
            <p class="rapport-subtitle">Générez et documentez vos rapports pour chaque session de coaching</p>
        </div>
        <div class="header-actions" *ngIf="editingReport">
            <button class="btn-outline-teal" (click)="cancelEdit()">
                <i class="pi pi-times"></i> Liste des rapports
            </button>
            <span class="badge-step">Étape {{ currentSection }}/{{ totalSections }}</span>
        </div>
      </div>

      <!-- LIST VIEW -->
      <div *ngIf="!editingReport">
        <div class="section-card">
          <h2 class="section-title">Nouveau Rapport de Session</h2>
          <div class="form-grid">
            <div style="display:flex; flex-direction:column; gap:20px;">
              <div class="form-group">
                <label>Sélectionner un entrepreneur <span class="required">*</span></label>
                <select [(ngModel)]="selectedEntrepreneurId" (change)="onEntrepreneurSelect()" class="premium-input">
                  <option [ngValue]="0" disabled>Choisir un entrepreneur...</option>
                  <option *ngFor="let ent of entrepreneurs" [value]="ent.id">{{ ent.firstName }} {{ ent.lastName }} ({{ ent.entreprise }})</option>
                </select>
              </div>

              <div class="form-group">
                <label>Thématique de coaching <span class="required">*</span></label>
                <select [(ngModel)]="selectedThematiqueId" class="premium-input">
                  <option [ngValue]="0" disabled>Choisir une thématique...</option>
                  <option *ngFor="let t of thematiques" [value]="t.id">{{ t.nom }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>Session réalisée (Optionnel pour pré-remplir)</label>
                <select [(ngModel)]="selectedSessionId" (change)="onSessionSelect()" class="premium-input">
                  <option [ngValue]="0">-- Création manuelle --</option>
                  <option *ngFor="let s of realizedSessions" [value]="s.id">{{ s.titre || 'Session' }} - {{ s.date | date:'shortDate' }}</option>
                </select>
              </div>
            </div>
            
            <div class="launch-section" style="display:flex; align-items:flex-end;">
              <button (click)="initNewReport()" [disabled]="selectedEntrepreneurId === 0" class="btn-primary" style="width:100%; justify-content:center;">
                <i class="pi pi-pencil"></i> Rédiger le rapport
              </button>
            </div>
          </div>
        </div>

        <!-- History -->
        <div class="section-card" style="margin-top: 1.5rem;">
           <h2 class="section-title"><i class="pi pi-history"></i> Historique des Rapports ({{ history.length }})</h2>
           <div *ngIf="history.length === 0" class="empty-state">
             <p>Aucun rapport de session n'a été créé.</p>
           </div>
           
           <table *ngIf="history.length > 0" class="history-table">
            <thead>
              <tr>
                <th>Bénéficiaire / Entreprise</th>
                <th>Date Session</th>
                <th>Dernière modif.</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of history">
                <td>
                  <div style="font-weight:700; color:#1A1A2E;">{{ h.beneficiaireNom }}</div>
                  <div class="hint">{{ h.entrepriseNom }}</div>
                </td>
                <td>
                  <span class="report-tag">Session {{ h.numeroSession || '#' }}</span>
                  <div style="font-size:13px; margin-top:4px; font-weight:500;">{{ h.dateSession | date:'shortDate' }}</div>
                </td>
                <td>
                   <div style="font-size:13px; color:#4B5563;">{{ h.dateCreation | date:'shortDate' }}</div>
                </td>
                <td style="text-align:right;">
                  <button (click)="openReport(h)" class="btn-sm" title="Éditer / Consulter"><i class="pi pi-eye"></i> Consulter</button>
                  <button (click)="deleteReport(h.id)" class="btn-sm btn-sm-danger" style="margin-left:6px;"><i class="pi pi-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- EDITOR / WIZARD VIEW -->
      <div *ngIf="editingReport" id="reportToDownload">
          <div class="progress-card">
              <div class="progress-info-row">
                  <span class="progress-label">Progression de la rédaction</span>
                  <span class="progress-percentage">{{ progress | number:'1.0-0' }}%</span>
              </div>
              <div class="progress-track">
                  <div class="progress-fill" [style.width.%]="progress"></div>
              </div>
              <div class="progress-sections-labels">
                  <span>Section {{ currentSection }}/{{ totalSections }}</span>
                  <span class="text-right">{{ sectionLabel }}</span>
              </div>
          </div>

          <div class="section-tabs data-html2canvas-ignore">
              <button class="section-tab" [class.active]="currentSection === 1" [class.completed]="isSectionCompleted(1)" (click)="goToSection(1)">
                  <i *ngIf="isSectionCompleted(1)" class="icon-check"></i> Informations
              </button>
              <button class="section-tab" [class.active]="currentSection === 2" [class.completed]="isSectionCompleted(2)" (click)="goToSection(2)">
                  <i *ngIf="isSectionCompleted(2)" class="icon-check"></i> Contenu
              </button>
              <button class="section-tab" [class.active]="currentSection === 3" [class.completed]="isSectionCompleted(3)" (click)="goToSection(3)">
                  <i *ngIf="isSectionCompleted(3)" class="icon-check"></i> Actions
              </button>
              <button class="section-tab" [class.active]="currentSection === 4" [class.completed]="isSectionCompleted(4)" (click)="goToSection(4)">
                  <i *ngIf="isSectionCompleted(4)" class="icon-check"></i> Validation
              </button>
          </div>

          <!-- SECTION 1 -->
          <div class="section-card" *ngIf="currentSection === 1">
             <h2 class="section-title">Informations Générales</h2>
             
             <div class="form-grid">
               <div class="form-group">
                 <label>Nom de l'entreprise</label>
                 <input type="text" class="premium-input" [(ngModel)]="currentReport.entrepriseNom">
               </div>
               <div class="form-group">
                 <label>Secteur d'activité</label>
                 <input type="text" class="premium-input" [(ngModel)]="currentReport.secteurActivite">
               </div>
               <div class="form-group">
                 <label>Gouvernorat</label>
                 <input type="text" class="premium-input" [(ngModel)]="currentReport.gouvernorat">
               </div>
               <div class="form-group">
                 <label>Nom du bénéficiaire</label>
                 <input type="text" class="premium-input" [(ngModel)]="currentReport.beneficiaireNom">
               </div>
               <div class="form-group">
                 <label>Nom du coach</label>
                 <input type="text" class="premium-input" [(ngModel)]="currentReport.coachNom">
               </div>
               <div class="form-group">
                 <label>Type de session</label>
                 <select class="premium-input" [(ngModel)]="currentReport.typeSession">
                    <option value="En ligne">En ligne</option>
                    <option value="Terrain">Terrain</option>
                 </select>
               </div>
               <div class="form-group">
                 <label>Numéro de session</label>
                 <input type="text" class="premium-input" [(ngModel)]="currentReport.numeroSession">
               </div>
               <div class="form-group">
                 <label>Date de la session</label>
                 <input type="date" class="premium-input" [(ngModel)]="currentReport.dateSession">
               </div>
             </div>
          </div>

          <!-- SECTION 2 -->
          <div class="section-card" *ngIf="currentSection === 2">
             <h2 class="section-title">Contenu de la Session</h2>
             
             <div class="form-group">
                <label>Objectif de la session</label>
                <textarea class="premium-textarea highlight-area" [(ngModel)]="currentReport.objectifSession" rows="3" placeholder="Quel était l'objectif principal de cette session ?"></textarea>
             </div>
             
             <div class="form-group">
                <label>Déroulement / Aspects traités</label>
                <textarea class="premium-textarea" [(ngModel)]="currentReport.deroulement" rows="4"></textarea>
             </div>

             <div class="form-group">
                <label>Apprentissage / Capacités développées</label>
                <textarea class="premium-textarea" [(ngModel)]="currentReport.apprentissage" rows="3"></textarea>
             </div>

             <div class="form-group">
                <label>Avancement des actions</label>
                <textarea class="premium-textarea" [(ngModel)]="currentReport.avancementActions" rows="3"></textarea>
             </div>

             <div class="form-group">
                <label>Difficultés rencontrées</label>
                <textarea class="premium-textarea" [(ngModel)]="currentReport.difficultes" rows="3"></textarea>
             </div>

             <div class="form-group">
                <label>Recommandations du coach</label>
                <textarea class="premium-textarea insight-area" [(ngModel)]="currentReport.recommandations" rows="3"></textarea>
             </div>

             <div class="form-group">
                <label>Travail à préparer (prochaine session)</label>
                <textarea class="premium-textarea" [(ngModel)]="currentReport.travailProchaineSession" rows="3"></textarea>
             </div>

             <div class="form-group">
                <label>Session narrative (appréciation globale)</label>
                <textarea class="premium-textarea" [(ngModel)]="currentReport.sessionNarrative" rows="4"></textarea>
             </div>
          </div>

          <!-- SECTION 3 -->
          <div class="section-card" *ngIf="currentSection === 3">
             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                <h2 class="section-title" style="margin:0;">Suivi des Actions</h2>
                <button class="btn-nav-primary data-html2canvas-ignore" (click)="addAction()"><i class="pi pi-plus"></i> Ajouter</button>
             </div>
             
             <table class="history-table">
                <thead>
                   <tr>
                      <th>Action</th>
                      <th>Description</th>
                      <th>Statut</th>
                      <th>Commentaire</th>
                      <th class="data-html2canvas-ignore"></th>
                   </tr>
                </thead>
                <tbody>
                   <tr *ngFor="let act of actions; let i = index">
                      <td><input type="text" class="premium-input" [(ngModel)]="act.action" placeholder="Titre de l'action"></td>
                      <td><input type="text" class="premium-input" [(ngModel)]="act.description" placeholder="Description"></td>
                      <td>
                         <select class="premium-input" [(ngModel)]="act.statut">
                            <option value="En cours">En cours</option>
                            <option value="Terminé">Terminé</option>
                            <option value="À faire">À faire</option>
                         </select>
                      </td>
                      <td><input type="text" class="premium-input" [(ngModel)]="act.commentaire" placeholder="Commentaire"></td>
                      <td class="data-html2canvas-ignore">
                         <button class="btn-sm btn-sm-danger" (click)="removeAction(i)"><i class="pi pi-trash"></i></button>
                      </td>
                   </tr>
                   <tr *ngIf="actions.length === 0">
                      <td colspan="5" style="text-align:center; padding: 2rem; color: #64748B;">Aucune action ajoutée pour le moment.</td>
                   </tr>
                </tbody>
             </table>
          </div>

          <!-- SECTION 4 -->
          <div class="section-card" *ngIf="currentSection === 4">
             <h2 class="section-title">Validation</h2>
             
             <div class="form-grid">
               <div class="form-group">
                 <label>Nom du coach</label>
                 <input type="text" class="premium-input" [(ngModel)]="currentReport.validationNom" readonly>
               </div>
               <div class="form-group">
                 <label>Date de validation</label>
                 <input type="date" class="premium-input" [(ngModel)]="currentReport.validationDate">
               </div>
             </div>
             <div class="form-group">
               <label>Signature (Nom ou Initiales)</label>
               <input type="text" class="premium-input" [(ngModel)]="currentReport.validationSignature" style="font-family: 'Brush Script MT', cursive; font-size: 1.5rem; max-width: 300px;">
             </div>
          </div>

          <div class="navigation-footer data-html2canvas-ignore">
              <button class="btn-nav-secondary" *ngIf="currentSection > 1" (click)="previousSection()" [disabled]="isSaving">
                  <i class="pi pi-arrow-left"></i> Précédent
              </button>
              <div class="spacer" style="flex:1;"></div>
              
              <button class="btn-nav-secondary" (click)="downloadPdf()" [disabled]="isSaving" style="margin-right: 8px;">
                  <i class="pi pi-file-pdf"></i> PDF
              </button>

              <button class="btn-nav-save" (click)="saveReport()" [disabled]="isSaving">
                  <i class="pi" [ngClass]="isSaving ? 'pi-spinner pi-spin' : 'pi-save'"></i>
                  {{ isSaving ? "Enregistrement..." : "Enregistrer" }}
              </button>
              
              <button class="btn-nav-primary" *ngIf="currentSection < totalSections" (click)="nextSection()" [disabled]="isSaving" style="margin-left: 8px;">
                  Suivant <i class="pi pi-arrow-right"></i>
              </button>
          </div>
      </div>
    </div>
  `,
  styles: [`
    .rapport-container { background: #F9FAFB; min-height: 100vh; padding: 2rem; font-family: var(--font-family, 'Inter', sans-serif); margin-top: -1rem; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .rapport-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem 0; }
    .rapport-subtitle { font-size: 1rem; color: #6B7280; margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 0.75rem; }
    .btn-outline-teal { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #FFFFFF; border: 1px solid #155e75; color: #155e75; border-radius: 6px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
    .btn-outline-teal:hover { background: #F0FDFA; }
    .badge-step { background: #267D8B; color: #FFFFFF; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; font-size: 0.875rem; }
    .section-card { background: #FFFFFF; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin-bottom: 1.5rem; border: 1px solid #E5E7EB; }
    .section-title { font-size: 1.4rem; font-weight: 700; color: #1F2937; margin: 0 0 1.5rem 0; display: flex; align-items: center; gap: 0.5rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; font-weight: 600; color: #4a5568; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .required { color: #E11D48; }
    .premium-input, .premium-textarea { width: 100%; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; font-family: inherit; font-size: 0.95rem; color: #2D3748; outline: none; transition: all 0.2s; resize: vertical; box-sizing: border-box; }
    .premium-input:focus, .premium-textarea:focus { border-color: #245C67; background: white; box-shadow: 0 0 0 3px rgba(36, 92, 103, 0.1); }
    .highlight-area { background: #F0FDF4; border-color: #DCFCE7; }
    .highlight-area:focus { border-color: #059669; }
    .insight-area { background: #EFF6FF; border-color: #DBEAFE; }
    .insight-area:focus { border-color: #2563EB; }
    .btn-primary { background: #245C67; color: white; border: none; padding: 0.8rem 2rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; font-family: inherit; }
    .btn-primary:hover:not(:disabled) { background: #1a424a; transform: translateY(-2px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .empty-state { text-align: center; padding: 3rem 1rem; color: #6B7280; background: #F9FAFB; border-radius: 12px; border: 1px dashed #D1D5DB; }
    .history-table { width: 100%; border-collapse: collapse; }
    .history-table th { text-align: left; padding: 16px 20px; font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #E2E8F0; background: #F8FAFC; }
    .history-table td { padding: 16px 20px; border-bottom: 1px solid #F1F5F9; font-size: 14px; }
    .history-table tr:hover td { background: #F8FAFC; }
    .report-tag { background: #E0F2FE; color: #0284C7; font-weight: 800; padding: 4px 8px; border-radius: 6px; font-size: 10px; text-transform: uppercase; margin-right: 8px; }
    .btn-sm { padding: 8px 12px; border-radius: 8px; font-size: 14px; color: #3B82F6; border: none; background: transparent; cursor: pointer; transition: background .2s; }
    .btn-sm:hover { background: #EFF6FF; color: #2563EB; }
    .btn-sm-danger { color: #EF4444; }
    .btn-sm-danger:hover { background: #FEF2F2; color: #EF4444; }
    .progress-card { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 1.5rem 2rem; margin-bottom: 2rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .progress-info-row { display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.95rem; }
    .progress-label { color: #6B7280; font-weight: 500; }
    .progress-percentage { font-weight: 700; color: #111827; }
    .progress-track { width: 100%; height: 8px; background-color: #FCE7F3; border-radius: 999px; overflow: hidden; margin-bottom: 0.5rem; }
    .progress-fill { height: 100%; background-color: #E11D48; border-radius: 999px; transition: width 0.4s ease; }
    .progress-sections-labels { display: flex; justify-content: space-between; color: #9CA3AF; font-size: 0.85rem; margin-top: 0.25rem; }
    .section-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; }
    .section-tab { flex: 1; min-width: 150px; padding: 1rem 1.5rem; background: #FFFFFF; border: 2px solid #E5E7EB; border-radius: 12px; font-weight: 500; color: #6B7280; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; justify-content: center; font-family: inherit; }
    .section-tab:hover { border-color: #245C67; transform: translateY(-2px); }
    .section-tab.active { background: #245C67; color: white; border-color: #245C67; }
    .section-tab.completed { background: #10B981; color: white; border-color: #10B981; }
    .section-tab.completed:not(.active) { opacity: 0.7; }
    .icon-check::before { content: '✓'; }
    .navigation-footer { display: flex; align-items: center; padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-top: 1.5rem; border: 1px solid #E5E7EB; }
    .btn-nav-secondary { padding: 0.625rem 1.25rem; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; color: #E44D62; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s; font-family: inherit; }
    .btn-nav-secondary:hover:not(:disabled) { background: #F9FAFB; border-color: #E44D62; }
    .btn-nav-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-nav-save { padding: 0.75rem 1.5rem; background: #FFFFFF; border: 2px solid #E44D62; border-radius: 8px; color: #E44D62; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s; font-family: inherit; }
    .btn-nav-save:hover:not(:disabled) { background: #E44D62; color: white; }
    .btn-nav-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-nav-primary { padding: 0.75rem 1.5rem; background: #245C67; border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s; font-family: inherit; }
    .btn-nav-primary:hover:not(:disabled) { background: #1a424a; }
    .btn-nav-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .header-row { flex-direction: column; gap: 1rem; } .navigation-footer { flex-wrap: wrap; justify-content: stretch; gap: 0.5rem; } .navigation-footer button { flex: 1; justify-content: center; } .spacer { display: none; } }
  `]
})
export class CoachRapportSessionComponent implements OnInit {
  
  entrepreneurs: CoachEntrepreneurDTO[] = [];
  selectedEntrepreneurId: number = 0;
  coachId: number = 0;
  coachProfile: UserDTO | null = null;
  thematiques: any[] = [];
  selectedThematiqueId: number = 0;

  editingReport = false;
  isSaving = false;
  currentSection = 1;
  totalSections = 4;

  history: any[] = [];
  currentReport: any = {};
  actions: any[] = [];
  
  allCoachSessions: any[] = [];
  realizedSessions: any[] = [];
  selectedSessionId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private coachService: CoachService,
    private authService: AuthService,
    private sessionService: SessionService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const cid = this.authService.getUserId();
    this.coachId = typeof cid === 'string' ? parseInt(cid, 10) : (cid || 0);

    if (!this.coachId) return;

    forkJoin({
      profile: this.coachService.getCoachProfile(),
      thematiques: this.coachService.getThematiquesAssignedToCoach(this.coachId),
      entrepreneurs: this.coachService.getCoachEntrepreneurs(this.coachId)
    }).subscribe({
      next: ({ profile, thematiques, entrepreneurs }) => {
        this.coachProfile = profile;
        this.thematiques = thematiques;
        if(this.thematiques.length > 0) {
            this.selectedThematiqueId = this.thematiques[0].id;
        }
        this.entrepreneurs = entrepreneurs;
        if(this.entrepreneurs.length > 0) {
            this.selectedEntrepreneurId = this.entrepreneurs[0].id;
        }
        this.loadHistory();
        this.loadCoachSessions();

        this.route.queryParams.subscribe(params => {
          if (params['action'] === 'new' && params['entrepreneurId']) {
            const eid = Number(params['entrepreneurId']);
            if (this.entrepreneurs.find(e => e.id === eid)) {
              this.selectedEntrepreneurId = eid;
            }
            this.initNewReport();
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données initiales', err);
      }
    });
  }

  loadHistory() {
      if(!this.coachId) return;
      this.coachService.getRapportsSession(this.coachId).subscribe({
          next: (data) => {
              this.history = data;
              this.cdr.detectChanges();
          },
          error: () => this.toastr.error('Erreur lors du chargement de l\'historique')
      });
  }

  loadCoachSessions() {
      if(!this.coachId) return;
      this.sessionService.getByCoach(this.coachId.toString()).subscribe({
          next: (sessions: any[]) => {
              this.allCoachSessions = sessions;
              this.filterRealizedSessions();
          }
      });
  }

  onEntrepreneurSelect() {
      this.selectedSessionId = 0;
      this.filterRealizedSessions();
  }

  filterRealizedSessions() {
      if (!this.allCoachSessions) return;
      this.realizedSessions = this.allCoachSessions.filter(s => 
          (s.statut === 'REALISEE' || s.statut === 'TERMINE') &&
          (this.selectedEntrepreneurId === 0 || (s.entrepreneur && s.entrepreneur.id == this.selectedEntrepreneurId))
      );
  }

  onSessionSelect() {
      const s = this.allCoachSessions.find(x => x.id == this.selectedSessionId);
      if (s) {
          if (s.entrepreneur) this.selectedEntrepreneurId = s.entrepreneur.id;
          if (s.thematique) this.selectedThematiqueId = s.thematique.id;
          this.filterRealizedSessions();
      }
  }

  initNewReport() {
    if (this.selectedEntrepreneurId === 0) return;
    
    const ent = this.entrepreneurs.find(e => e.id == this.selectedEntrepreneurId);
    const session = this.allCoachSessions.find(x => x.id == this.selectedSessionId);
    
    this.currentReport = {
        coachId: this.coachId,
        entrepreneurId: this.selectedEntrepreneurId,
        thematiqueId: this.selectedThematiqueId,
        entrepriseNom: ent ? ent.entreprise : '',
        secteurActivite: ent ? ent.secteur : '',
        gouvernorat: '',
        beneficiaireNom: ent ? ent.firstName + ' ' + ent.lastName : '',
        coachNom: this.coachProfile ? this.coachProfile.firstName + ' ' + this.coachProfile.lastName : '',
        typeSession: session && session.meetLink ? 'En ligne' : 'Terrain',
        numeroSession: '1',
        dateSession: session ? new Date(session.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        
        objectifSession: session ? (session.titre || '') : '',
        deroulement: session ? (session.description || '') : '',
        apprentissage: '',
        avancementActions: '',
        difficultes: '',
        recommandations: '',
        travailProchaineSession: '',
        sessionNarrative: '',
        
        validationNom: this.coachProfile ? this.coachProfile.firstName + ' ' + this.coachProfile.lastName : '',
        validationSignature: '',
        validationDate: new Date().toISOString().split('T')[0]
    };

    this.actions = [];
    this.editingReport = true;
    this.currentSection = 1;
  }

  openReport(reportData: any) {
      this.currentReport = { ...reportData };
      this.currentReport.coachId = this.coachId;
      this.currentReport.thematiqueId = reportData.thematique ? reportData.thematique.id : 0;
      try {
          this.actions = reportData.suiviActionsJson ? JSON.parse(reportData.suiviActionsJson) : [];
      } catch(e) {
          this.actions = [];
      }
      this.editingReport = true;
      this.currentSection = 1;
  }

  saveReport() {
      this.isSaving = true;
      this.currentReport.suiviActionsJson = JSON.stringify(this.actions);
      this.coachService.saveRapportSession(this.currentReport).subscribe({
          next: (res) => {
              this.toastr.success('Rapport de session enregistré avec succès');
              this.currentReport = res;
              this.isSaving = false;
              this.loadHistory();
              this.cdr.detectChanges();
          },
          error: (err) => {
              console.error(err);
              this.toastr.error('Erreur lors de la sauvegarde');
              this.isSaving = false;
              this.cdr.detectChanges();
          }
      })
  }

  cancelEdit() {
      if(confirm('Avez-vous bien sauvegardé vos modifications avant de quitter ?')) {
          this.editingReport = false;
      }
  }

  deleteReport(id: number) {
      if(confirm('Confirmer la suppression de ce rapport ?')) {
          this.coachService.deleteRapportSession(id).subscribe({
              next: () => {
                  this.toastr.success('Rapport supprimé');
                  this.loadHistory();
              },
              error: () => this.toastr.error('Erreur de suppression')
          });
      }
  }

  addAction() {
      this.actions.push({ action: '', description: '', statut: 'En cours', commentaire: '' });
  }

  removeAction(index: number) {
      this.actions.splice(index, 1);
  }

  // WIZARD LOGIC
  get progress(): number { return (this.currentSection / this.totalSections) * 100; }
  get sectionLabel(): string {
    const labels = ['Informations', 'Contenu', 'Actions', 'Validation'];
    return labels[this.currentSection - 1];
  }
  isSectionCompleted(section: number): boolean { return section < this.currentSection; }
  goToSection(section: number): void { if (section >= 1 && section <= this.totalSections) this.currentSection = section; }
  nextSection(): void { if (this.currentSection < this.totalSections) { this.currentSection++; window.scrollTo(0, 0); } }
  previousSection(): void { if (this.currentSection > 1) { this.currentSection--; window.scrollTo(0, 0); } }

  // PDF
  async downloadPdf() {
    this.toastr.info("Génération du PDF en cours...");
    const ignored = document.querySelectorAll('.data-html2canvas-ignore');
    ignored.forEach(el => (el as HTMLElement).style.display = 'none');
    const originalSection = this.currentSection;
    
    if (!confirm('Veuillez noter que le PDF téléchargé comportera la section affichée. Avez-vous cliqué sur "Enregistrer" ?')) {
        ignored.forEach(el => (el as HTMLElement).style.display = '');
        return;
    }

    try {
      const element = document.getElementById('reportToDownload');
      if (!element) return;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Rapport_Session_${this.currentReport.beneficiaireNom || 'Coach'}.pdf`);
      this.toastr.success("PDF téléchargé.");
    } catch (e) {
      this.toastr.error("Erreur PDF.");
    } finally {
        ignored.forEach(el => {
            if (el.classList.contains('section-tabs') || el.classList.contains('navigation-footer')) {
                 (el as HTMLElement).style.display = 'flex';
            } else {
                 (el as HTMLElement).style.display = '';
            }
        });
        this.currentSection = originalSection;
    }
  }
}
