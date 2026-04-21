import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ToastrService } from 'ngx-toastr';
import { CoachService } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';

type PeriodType = 'LIBRE' | 'HEBDO' | 'MOIS';
type HebdoOption = 'current' | 'last' | 'custom';
type MoisOption = 'current' | 'last' | 'custom';

@Component({
  selector: 'app-coach-rapport-missions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rapport-container">
      <div class="header-row">
        <div class="header-text">
            <h1 class="rapport-title">Rapports d'Accompagnement (Missions)</h1>
            <p class="rapport-subtitle">Générez et documentez vos rapports de mission globaux par programme</p>
        </div>
        <div class="header-actions" *ngIf="editingReport">
            <button class="btn-outline-teal" (click)="cancelEdit()">
                <i class="pi pi-times"></i> Liste des rapports
            </button>
            <span class="badge-step">Étape {{ currentSection }}/{{ totalSections }}</span>
        </div>
      </div>

      <!-- LIST VIEW AND INITIAL CONFIG -->
      <div *ngIf="!editingReport">
        <div class="section-card">
          <h2 class="section-title">Nouveau Rapport d'Accompagnement</h2>
          <div class="form-grid">
            <!-- Left Column -->
            <div style="display:flex; flex-direction:column; gap:20px;">
              <div class="form-group">
                <label>Programme d'incubation <span class="required">*</span></label>
                <select [(ngModel)]="selectedProgramId" class="premium-input" (change)="loadHistory()">
                  <option [ngValue]="0" disabled>Choisir un programme...</option>
                  <option *ngFor="let p of programmes" [value]="p.id">{{ p.nom }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>Période couverte <span class="required">*</span></label>
                <div class="period-tabs">
                  <button *ngFor="let pt of periodTypes"
                      (click)="periodType = pt.id"
                      class="period-btn"
                      [class.active]="periodType === pt.id">
                    {{ pt.label }}
                  </button>
                </div>
              </div>

              <!-- date pickers -->
              <div class="form-group" style="min-height:80px;">
                <div *ngIf="periodType === 'LIBRE'" style="display:flex; gap:16px;">
                  <div style="flex:1">
                    <label class="hint" style="display:block; margin-bottom:4px;">Du</label>
                    <input type="date" [(ngModel)]="dateFrom" class="premium-input">
                  </div>
                  <div style="flex:1">
                    <label class="hint" style="display:block; margin-bottom:4px;">Au</label>
                    <input type="date" [(ngModel)]="dateTo" class="premium-input">
                  </div>
                </div>

                <div *ngIf="periodType === 'HEBDO'" style="display:flex; flex-wrap:wrap; gap:8px;">
                  <label *ngFor="let opt of hebdoOptions" class="opt-label" [class.active-opt]="hebdoOpt === opt.val">
                    <input type="radio" name="hebdo" [value]="opt.val" [(ngModel)]="hebdoOpt" style="display:none;">
                    {{ opt.label }}
                  </label>
                  <input *ngIf="hebdoOpt === 'custom'" type="week" [(ngModel)]="customWeek" class="premium-input" style="margin-top:8px;">
                </div>

                <div *ngIf="periodType === 'MOIS'" style="display:flex; flex-wrap:wrap; gap:8px;">
                  <label *ngFor="let opt of moisOptions" class="opt-label" [class.active-opt]="moisOpt === opt.val">
                    <input type="radio" name="mois" [value]="opt.val" [(ngModel)]="moisOpt" style="display:none;">
                    {{ opt.label }}
                  </label>
                  <input *ngIf="moisOpt === 'custom'" type="month" [(ngModel)]="customMonth" class="premium-input" style="margin-top:8px;">
                </div>
              </div>
            </div>
            
            <div class="launch-section" style="display:flex; align-items:flex-end;">
              <button (click)="initNewReport()" [disabled]="selectedProgramId === 0" class="btn-primary" style="width:100%; justify-content:center;">
                <i class="pi pi-pencil"></i> Rédiger le rapport
              </button>
            </div>
          </div>
        </div>

        <!-- History -->
        <div class="section-card" style="margin-top: 1.5rem;">
           <h2 class="section-title"><i class="pi pi-history"></i> Historique des Rapports ({{ history.length }})</h2>
           <div *ngIf="selectedProgramId === 0" class="empty-state">
             <p>Sélectionnez un programme pour voir l'historique des rapports.</p>
           </div>
           <div *ngIf="history.length === 0 && selectedProgramId !== 0" class="empty-state">
             <p>Aucun rapport d'accompagnement n'a été créé pour ce programme.</p>
           </div>
           
           <table *ngIf="history.length > 0" class="history-table">
            <thead>
              <tr>
                <th>Programme / ID</th>
                <th>Période</th>
                <th>Dernière modif.</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of history">
                <td>
                  <div style="font-weight:700; color:#1A1A2E;">{{ getProgramName(selectedProgramId) }}</div>
                  <div class="hint">Rapport #{{ h.id }}</div>
                </td>
                <td>
                  <span class="report-tag">{{ h.periodType }}</span>
                  <div style="font-size:13px; margin-top:4px; font-weight:500;">{{ h.dateDebut }} au {{ h.dateFin }}</div>
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
      </div> <!-- END LIST VIEW -->

      <!-- EDITOR / WIZARD VIEW -->
      <div *ngIf="editingReport" id="reportToDownload">
          <!-- Progress Bar -->
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

          <!-- Section Navigation Tabs -->
          <div class="section-tabs data-html2canvas-ignore">
              <button class="section-tab" [class.active]="currentSection === 1" [class.completed]="isSectionCompleted(1)" (click)="goToSection(1)">
                  <i *ngIf="isSectionCompleted(1)" class="icon-check"></i>
                  Introduction
              </button>
              <button class="section-tab" [class.active]="currentSection === 2" [class.completed]="isSectionCompleted(2)" (click)="goToSection(2)">
                  <i *ngIf="isSectionCompleted(2)" class="icon-check"></i>
                  Déroulement
              </button>
              <button class="section-tab" [class.active]="currentSection === 3" [class.completed]="isSectionCompleted(3)" (click)="goToSection(3)">
                  <i *ngIf="isSectionCompleted(3)" class="icon-check"></i>
                  Suivi Pédagogique
              </button>
              <button class="section-tab" [class.active]="currentSection === 4" [class.completed]="isSectionCompleted(4)" (click)="goToSection(4)">
                  <i *ngIf="isSectionCompleted(4)" class="icon-check"></i>
                  Conclusion
              </button>
          </div>

          <!-- The Sections Content -->
          <!-- SECTION 1 -->
          <div class="section-card" *ngIf="currentSection === 1">
             <h2 class="section-title">Introduction & Contexte</h2>
             
             <div class="form-group">
                <label>1.1 Introduction</label>
                <textarea class="premium-textarea" [(ngModel)]="currentReport.introduction" rows="5" 
                  placeholder="- Présentation du programme&#10;- Contexte et partenaires&#10;- Objectifs du programme&#10;- Objectif du présent rapport"></textarea>
             </div>
             
             <div class="form-group">
                <label>1.2 Présentation de la phase / période</label>
                <textarea class="premium-textarea" [(ngModel)]="currentReport.presentationPhase" rows="5" 
                  placeholder="2.1 Objectifs de la phase&#10;2.2 Méthodologie d’accompagnement&#10;2.3 Organisation des séances"></textarea>
             </div>
          </div>

          <!-- SECTION 2 -->
          <div class="section-card" *ngIf="currentSection === 2">
             <h2 class="section-title">Déroulement & Résultats</h2>
             
             <div class="form-group">
                <label>2.1 Déroulement de l’accompagnement</label>
                <textarea class="premium-textarea" [(ngModel)]="currentReport.deroulementAccompagnement" rows="5" 
                  placeholder="- Description des activités réalisées&#10;- Thématiques abordées&#10;- Implication des bénéficiaires"></textarea>
             </div>
             
             <div class="form-group">
                <label>2.2 Résultats obtenus</label>
                <textarea class="premium-textarea highlight-area" [(ngModel)]="currentReport.resultatsObtenus" rows="5" 
                  placeholder="4.1 Résultats qualitatifs&#10;4.2 Résultats quantitatifs&#10;4.3 Cas concret / success story"></textarea>
             </div>
          </div>

          <!-- SECTION 3 -->
          <div class="section-card" *ngIf="currentSection === 3">
             <h2 class="section-title">Suivi & Feedbacks</h2>
             
             <div class="form-group">
                <label>3.1 Suivi des bénéficiaires</label>
                <textarea class="premium-textarea" [(ngModel)]="currentReport.suiviBeneficiaires" rows="5" 
                  placeholder="- Nom du projet&#10;- Niveau d’avancement&#10;- Besoins identifiés&#10;- Actions réalisées"></textarea>
             </div>
             
             <div class="form-group">
                <label>3.2 Planning des séances</label>
                <textarea class="premium-textarea" [(ngModel)]="currentReport.planningSeances" rows="5" 
                  placeholder="- Date&#10;- Bénéficiaire&#10;- Durée"></textarea>
             </div>

             <div class="form-group">
                <label>3.3 Feedback des bénéficiaires</label>
                <textarea class="premium-textarea" [(ngModel)]="currentReport.feedbackBeneficiaires" rows="5" 
                  placeholder="- Satisfaction&#10;- Points forts&#10;- Points d’amélioration"></textarea>
             </div>
          </div>

          <!-- SECTION 4 -->
          <div class="section-card" *ngIf="currentSection === 4">
             <h2 class="section-title">Analyse & Conclusion</h2>
             
             <div class="form-group">
                <label>4.1 Analyse & leçons apprises</label>
                <textarea class="premium-textarea" [(ngModel)]="currentReport.analyseLecons" rows="5" 
                  placeholder="- Difficultés rencontrées&#10;- Enseignements&#10;- Opportunités"></textarea>
             </div>
             
             <div class="form-group">
                <label>4.2 Recommandations & prochaines étapes</label>
                <textarea class="premium-textarea insight-area" [(ngModel)]="currentReport.recommandationsEtapes" rows="5" 
                  placeholder="Détaillez les recommandations stratégiques et actions à mener"></textarea>
             </div>

             <div class="form-group">
                <label>4.3 Conclusion</label>
                <textarea class="premium-textarea" [(ngModel)]="currentReport.conclusion" rows="5" 
                  placeholder="Synthèse et impact global de cette période d'accompagnement"></textarea>
             </div>
          </div>

          <!-- Navigation Footer -->
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
    .rapport-container {
      background: #F9FAFB;
      min-height: 100vh;
      padding: 2rem;
      font-family: var(--font-family, 'Inter', sans-serif);
      margin-top: -1rem;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .rapport-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }
    .rapport-subtitle {
      font-size: 1rem;
      color: #6B7280;
      margin: 0;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .btn-outline-teal {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #FFFFFF;
      border: 1px solid #155e75;
      color: #155e75;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-outline-teal:hover { background: #F0FDFA; }
    
    .badge-step {
      background: #267D8B;
      color: #FFFFFF;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .section-card {
      background: #FFFFFF;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
      border: 1px solid #E5E7EB;
    }
    .section-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #1F2937;
      margin: 0 0 1.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Form Fields from admin config side */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; font-weight: 600; color: #4a5568; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .required { color: #E11D48; }

    .premium-input, .premium-textarea {
      width: 100%; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc;
      font-family: inherit; font-size: 0.95rem; color: #2D3748; outline: none; transition: all 0.2s; resize: vertical; box-sizing: border-box;
    }
    .premium-input:focus, .premium-textarea:focus { border-color: #245C67; background: white; box-shadow: 0 0 0 3px rgba(36, 92, 103, 0.1); }
    
    .highlight-area { background: #F0FDF4; border-color: #DCFCE7; }
    .highlight-area:focus { border-color: #059669; }
    .insight-area { background: #EFF6FF; border-color: #DBEAFE; }
    .insight-area:focus { border-color: #2563EB; }

    /* Period Tabs */
    .period-tabs { display: flex; background: #F1F5F9; padding: 6px; border-radius: 12px; }
    .period-btn { flex: 1; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; transition: all .2s; background: transparent; color: #64748B; font-family: inherit;}
    .period-btn.active { background: #245C67; color: #fff; box-shadow: 0 2px 4px rgba(36, 92, 103, 0.2); }

    .opt-label {
      flex: 1; min-width: 100px; display: flex; align-items: center; justify-content: center; padding: 12px; border-radius: 12px; border: 2px solid #F1F5F9; background: #F8FAFC;
      color: #64748B; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .2s; text-align: center;
    }
    .opt-label.active-opt { border-color: #245C67; background: #F0FDFA; color: #245C67; }

    .btn-primary { background: #245C67; color: white; border: none; padding: 0.8rem 2rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; font-family: inherit; }
    .btn-primary:hover:not(:disabled) { background: #1a424a; transform: translateY(-2px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    /* History table */
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

    /* Editing Wizard Progress & Tabs */
    .progress-card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .progress-info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      font-size: 0.95rem;
    }
    .progress-label { color: #6B7280; font-weight: 500; }
    .progress-percentage { font-weight: 700; color: #111827; }
    .progress-track {
      width: 100%; height: 8px; background-color: #FCE7F3; border-radius: 999px; overflow: hidden; margin-bottom: 0.5rem;
    }
    .progress-fill {
      height: 100%; background-color: #E11D48; border-radius: 999px; transition: width 0.4s ease;
    }
    .progress-sections-labels {
      display: flex; justify-content: space-between; color: #9CA3AF; font-size: 0.85rem; margin-top: 0.25rem;
    }

    .section-tabs {
      display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto;
    }
    .section-tab {
      flex: 1; min-width: 180px; padding: 1rem 1.5rem; background: #FFFFFF; border: 2px solid #E5E7EB; border-radius: 12px;
      font-weight: 500; color: #6B7280; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; justify-content: center; font-family: inherit;
    }
    .section-tab:hover { border-color: #245C67; transform: translateY(-2px); }
    .section-tab.active { background: #245C67; color: white; border-color: #245C67; }
    .section-tab.completed { background: #10B981; color: white; border-color: #10B981; }
    .section-tab.completed:not(.active) { opacity: 0.7; }
    .icon-check::before { content: '✓'; }

    .navigation-footer {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-top: 1.5rem;
      border: 1px solid #E5E7EB;
    }
    .btn-nav-secondary {
      padding: 0.625rem 1.25rem; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; color: #E44D62; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s; font-family: inherit;
    }
    .btn-nav-secondary:hover:not(:disabled) { background: #F9FAFB; border-color: #E44D62; }
    .btn-nav-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .btn-nav-save {
      padding: 0.75rem 1.5rem; background: #FFFFFF; border: 2px solid #E44D62; border-radius: 8px; color: #E44D62; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s; font-family: inherit;
    }
    .btn-nav-save:hover:not(:disabled) { background: #E44D62; color: white; }
    .btn-nav-save:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .btn-nav-primary {
      padding: 0.75rem 1.5rem; background: #245C67; border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s; font-family: inherit;
    }
    .btn-nav-primary:hover:not(:disabled) { background: #1a424a; }
    .btn-nav-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .header-row { flex-direction: column; gap: 1rem; }
      .navigation-footer { flex-wrap: wrap; justify-content: stretch; gap: 0.5rem; }
      .navigation-footer button { flex: 1; justify-content: center; }
      .spacer { display: none; }
    }
  `]
})
export class CoachRapportMissionsComponent implements OnInit {
  
  periodTypes = [
    { id: 'LIBRE' as PeriodType, label: 'Personnalisé' },
    { id: 'HEBDO' as PeriodType, label: 'Hebdo' },
    { id: 'MOIS' as PeriodType, label: 'Mensuel' },
  ];

  hebdoOptions = [
    { val: 'current' as HebdoOption, label: 'Cette semaine' },
    { val: 'last' as HebdoOption, label: 'Semaine passée' },
    { val: 'custom' as HebdoOption, label: 'Choisir semaine' },
  ];

  moisOptions = [
    { val: 'current' as MoisOption, label: 'Ce mois' },
    { val: 'last' as MoisOption, label: 'Mois passé' },
    { val: 'custom' as MoisOption, label: 'Choisir mois' },
  ];

  programmes: any[] = [];
  selectedProgramId: number = 0;
  
  periodType: PeriodType = 'MOIS';
  dateFrom = '';
  dateTo = '';
  hebdoOpt: HebdoOption = 'current';
  moisOpt: MoisOption = 'current';
  customWeek = '';
  customMonth = '';

  coachId: number = 0;

  // View state
  editingReport = false;
  isSaving = false;
  
  // Wizard state
  currentSection = 1;
  totalSections = 4;

  // Data State
  history: any[] = [];
  currentReport: any = {};

  constructor(
    private coachService: CoachService,
    private authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const cid = this.authService.getUserId();
    this.coachId = typeof cid === 'string' ? parseInt(cid, 10) : (cid || 0);

    this.coachService.getCoachProgrammes(this.coachId).subscribe(
      (data) => {
        this.programmes = data;
        if(this.programmes.length > 0) {
            this.selectedProgramId = this.programmes[0].id;
            this.loadHistory();
        }
        this.cdr.detectChanges();
      }
    );
  }

  getProgramName(id: number): string {
      const p = this.programmes.find(prog => prog.id === id);
      return p ? p.nom : 'Programme inconnu';
  }

  loadHistory() {
      if(this.selectedProgramId === 0 || !this.coachId) return;
      this.coachService.getRapportsMission(this.coachId, this.selectedProgramId).subscribe({
          next: (data) => {
              this.history = data;
              this.cdr.detectChanges();
          },
          error: () => {
              this.toastr.error('Erreur lors du chargement de l\'historique');
          }
      });
  }

  initNewReport() {
    if (this.selectedProgramId === 0) return;
    const { start, end } = this.calculateDates();
    if (!start || !end) {
      this.toastr.warning("Veuillez vérifier les dates de la période."); return;
    }

    this.currentReport = {
        coachId: this.coachId,
        programmeId: this.selectedProgramId,
        periodType: this.periodType,
        dateDebut: start,
        dateFin: end,
        
        // Blank sections out
        introduction: '',
        presentationPhase: '',
        deroulementAccompagnement: '',
        resultatsObtenus: '',
        suiviBeneficiaires: '',
        planningSeances: '',
        feedbackBeneficiaires: '',
        analyseLecons: '',
        recommandationsEtapes: '',
        conclusion: ''
    };

    this.editingReport = true;
    this.currentSection = 1;
  }

  openReport(reportData: any) {
      this.currentReport = { ...reportData };
      this.currentReport.coachId = this.coachId;
      this.currentReport.programmeId = this.selectedProgramId;
      this.editingReport = true;
      this.currentSection = 1;
  }

  saveReport() {
      this.isSaving = true;
      this.coachService.saveRapportMission(this.currentReport).subscribe({
          next: (res) => {
              this.toastr.success('Rapport enregistré avec succès');
              this.currentReport = res; // update ID if needed
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
          this.coachService.deleteRapportMission(id).subscribe({
              next: () => {
                  this.toastr.success('Rapport supprimé');
                  this.loadHistory();
              },
              error: () => this.toastr.error('Erreur de suppression')
          });
      }
  }

  // --- WIZARD LOGIC ---
  get progress(): number {
    return (this.currentSection / this.totalSections) * 100;
  }

  get sectionLabel(): string {
    const labels = [
        'Introduction & Contexte',
        'Déroulement & Résultats',
        'Suivi Pédagogique',
        'Conclusion & Recommandations'
    ];
    return labels[this.currentSection - 1];
  }

  isSectionCompleted(section: number): boolean {
    return section < this.currentSection;
  }

  goToSection(section: number): void {
    if (section >= 1 && section <= this.totalSections) {
        this.currentSection = section;
    }
  }

  nextSection(): void {
    if (this.currentSection < this.totalSections) {
        this.currentSection++;
        window.scrollTo(0, 0);
    }
  }

  previousSection(): void {
    if (this.currentSection > 1) {
        this.currentSection--;
        window.scrollTo(0, 0);
    }
  }

  // --- UTILS ---
  private calculateDates(): { start: string | null, end: string | null } {
    const pt = this.periodType;
    const today = new Date();
    const format = (d: Date) => d.toISOString().split('T')[0];
    
    if (pt === 'LIBRE') return { start: this.dateFrom || null, end: this.dateTo || null };
    if (pt === 'HEBDO') {
      const startW = new Date(today);
      startW.setDate(today.getDate() - today.getDay() + 1);
      const endW = new Date(startW); endW.setDate(startW.getDate() + 6);

      if (this.hebdoOpt === 'current') return { start: format(startW), end: format(endW) };
      if (this.hebdoOpt === 'last') {
        startW.setDate(startW.getDate() - 7); endW.setDate(endW.getDate() - 7);
        return { start: format(startW), end: format(endW) };
      }
      if (this.customWeek) return { start: `${this.customWeek.substring(0,4)}-01-01`, end: `${this.customWeek.substring(0,4)}-12-31` };
    }
    if (pt === 'MOIS') {
      if (this.moisOpt === 'current') {
        const startM = new Date(today.getFullYear(), today.getMonth(), 1);
        const endM = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { start: format(startM), end: format(endM) };
      }
      if (this.moisOpt === 'last') {
        const lM = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lMEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start: format(lM), end: format(lMEnd) };
      }
      if (this.customMonth) {
        const [y, m] = this.customMonth.split('-');
        const endM = new Date(Number(y), Number(m), 0);
        return { start: `${this.customMonth}-01`, end: format(endM) };
      }
    }
    return { start: null, end: null };
  }

  async downloadPdf() {
    this.toastr.info("Génération du PDF en cours...");
    
    // Hide tabs/buttons temporarily so they don't appear in PDF
    const ignored = document.querySelectorAll('.data-html2canvas-ignore');
    ignored.forEach(el => (el as HTMLElement).style.display = 'none');

    // Force show all sections to capture entire report
    const originalSection = this.currentSection;
    
    if (!confirm('Veuillez noter que le PDF téléchargé comportera la section affichée. Avez-vous cliqué sur "Enregistrer" ?')) {
        ignored.forEach(el => (el as HTMLElement).style.display = '');
        return;
    }

    try {
      const element = document.getElementById('reportToDownload');
      if (!element) return;

      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `Rapport_Accompagnement_${this.getProgramName(this.selectedProgramId)}.pdf`;
      pdf.save(fileName);
      this.toastr.success("PDF téléchargé.");
    } catch (e) {
      console.error('Erreur de génération du PDF', e);
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