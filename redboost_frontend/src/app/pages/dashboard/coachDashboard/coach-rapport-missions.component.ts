import { Component, OnInit, signal, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="matching-page">
      <!-- ── Header ─────────────────────── -->
      <div class="matching-header">
        <div>
          <h1 class="matching-title">Rapports d'Accompagnement (Missions)</h1>
          <p class="matching-subtitle">Générez et documentez vos rapports de mission globaux par programme</p>
        </div>
      </div>

      <!-- ── Générateur / Configuration ─────────────────────── -->
      <div class="card" *ngIf="!editingReport">
        <div class="card-header-row">
          <div class="card-icon"><i class="pi pi-cog"></i></div>
          <div>
            <h2 class="card-title">Configuration du Rapport</h2>
            <p class="hint" style="margin-top:2px;">Sélectionnez le programme et la période couverte par ce rapport d'accompagnement.</p>
          </div>
        </div>

        <div class="form-grid">
          <!-- Left Column -->
          <div style="display:flex; flex-direction:column; gap:20px;">
            <div class="form-group">
              <label>Programme d'incubation <span class="required">*</span></label>
              <select [(ngModel)]="selectedProgramId" class="form-select" (change)="loadHistory()">
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

            <div class="form-group" style="min-height:80px;">
              <div *ngIf="periodType === 'LIBRE'" style="display:flex; gap:16px;">
                <div style="flex:1">
                  <label class="hint" style="display:block; margin-bottom:4px;">Du</label>
                  <input type="date" [(ngModel)]="dateFrom" class="form-input">
                </div>
                <div style="flex:1">
                  <label class="hint" style="display:block; margin-bottom:4px;">Au</label>
                  <input type="date" [(ngModel)]="dateTo" class="form-input">
                </div>
              </div>

              <div *ngIf="periodType === 'HEBDO'" style="display:flex; flex-wrap:wrap; gap:8px;">
                <label *ngFor="let opt of hebdoOptions" class="opt-label" [class.active-opt]="hebdoOpt === opt.val">
                  <input type="radio" name="hebdo" [value]="opt.val" [(ngModel)]="hebdoOpt" style="display:none;">
                  {{ opt.label }}
                </label>
                <input *ngIf="hebdoOpt === 'custom'" type="week" [(ngModel)]="customWeek" class="form-input" style="margin-top:8px;">
              </div>

              <div *ngIf="periodType === 'MOIS'" style="display:flex; flex-wrap:wrap; gap:8px;">
                <label *ngFor="let opt of moisOptions" class="opt-label" [class.active-opt]="moisOpt === opt.val">
                  <input type="radio" name="mois" [value]="opt.val" [(ngModel)]="moisOpt" style="display:none;">
                  {{ opt.label }}
                </label>
                <input *ngIf="moisOpt === 'custom'" type="month" [(ngModel)]="customMonth" class="form-input" style="margin-top:8px;">
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div>
            <div class="form-group">
              <label>Structure de ce modèle (Template de Reporting)</label>
              <div style="display:flex; flex-direction:column; gap:12px; margin-top:8px;">
                <div *ngFor="let inc of templateSections" class="data-item">
                  <div class="data-icon"><i class="pi pi-check"></i></div>
                  <span style="font-weight:700; margin-right:8px;">{{ inc.num }}</span>
                  <span>{{ inc.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="launch-section">
          <button (click)="initNewReport()" [disabled]="selectedProgramId === 0" class="btn-launch" style="width:100%; justify-content:center;">
            <i class="pi pi-pencil"></i> Rédiger le rapport d'accompagnement
          </button>
        </div>
      </div>

      <!-- ── Rapport d'Activité / Éditeur ─────────────────────── -->
      <div *ngIf="editingReport" class="card" style="padding:0; overflow:hidden; border-left:5px solid #FF4D85;">
        <div class="report-header">
          <div>
            <h2 class="card-title" style="display:flex; align-items:center; gap:10px;">
              <i class="pi pi-file" style="color:#FF4D85;"></i> Édition du Rapport de Mission
            </h2>
            <p class="hint" style="margin-top:6px;">
              <span class="report-tag">{{ currentReport.periodType }}</span>
              Période : {{ currentReport.dateDebut }} au {{ currentReport.dateFin }}
            </p>
          </div>
          <div style="display:flex; gap:8px;">
             <!-- Back button to cancel drafting -->
             <button (click)="cancelEdit()" class="btn-cancel" style="padding:8px 12px;">
               <i class="pi pi-arrow-left"></i> Retour
             </button>
             <button (click)="saveReport()" class="btn-launch" style="padding:8px 16px; font-size:13px; background: #10B981; box-shadow: none;">
               <i class="pi" [ngClass]="isSaving ? 'pi-spinner pi-spin' : 'pi-save'"></i>
               {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
             </button>
             <!-- PDF button downloads the preview -->
             <button (click)="downloadPdf()" [disabled]="isSaving" class="btn-launch" style="padding:8px 16px; font-size:13px;">
               <i class="pi pi-file-pdf"></i> PDF
             </button>
          </div>
        </div>

        <!-- The Report content wrapper for PDF capture -->
        <div id="reportToDownload" style="padding:24px; background: white;">
          
          <div class="report-pdf-header" style="margin-bottom: 24px; text-align: center; display: none;">
             <!-- Hidden by default, displayed inline if downloading PDF to give it a nice title -->
             <h2>Rapport d'Accompagnement</h2>
             <p>Programme : {{ getProgramName(selectedProgramId) }} | Période : {{ currentReport.dateDebut }} au {{ currentReport.dateFin }}</p>
          </div>

          <div class="form-grid" style="grid-template-columns: 1fr;">

            <!-- 1. Introduction -->
            <div class="report-section">
              <h3 class="section-title"><span class="sec-num">1</span> Introduction</h3>
              <textarea class="rich-textarea" [(ngModel)]="currentReport.introduction" rows="5" 
                placeholder="- Présentation du programme&#10;- Contexte et partenaires&#10;- Objectifs du programme&#10;- Objectif du présent rapport"></textarea>
            </div>

            <!-- 2. Présentation de la phase -->
            <div class="report-section">
              <h3 class="section-title"><span class="sec-num">2</span> Présentation de la phase / période</h3>
              <textarea class="rich-textarea" [(ngModel)]="currentReport.presentationPhase" rows="4" 
                placeholder="2.1 Objectifs de la phase&#10;2.2 Méthodologie d’accompagnement&#10;2.3 Organisation des séances"></textarea>
            </div>

            <!-- 3. Déroulement de l’accompagnement -->
            <div class="report-section">
              <h3 class="section-title"><span class="sec-num">3</span> Déroulement de l’accompagnement</h3>
              <textarea class="rich-textarea" [(ngModel)]="currentReport.deroulementAccompagnement" rows="4" 
                placeholder="- Description des activités réalisées&#10;- Thématiques abordées&#10;- Implication des bénéficiaires"></textarea>
            </div>

            <!-- 4. Résultats obtenus -->
            <div class="report-section highlight-box">
              <h3 class="section-title green-title"><i class="pi pi-chart-line"></i> 4. Résultats obtenus</h3>
              <textarea class="rich-textarea no-border-area" [(ngModel)]="currentReport.resultatsObtenus" rows="4" 
                placeholder="4.1 Résultats qualitatifs&#10;4.2 Résultats quantitatifs&#10;4.3 Cas concret / success story"></textarea>
            </div>

            <!-- 5. Suivi des bénéficiaires -->
            <div class="report-section">
              <h3 class="section-title"><span class="sec-num">5</span> Suivi des bénéficiaires</h3>
              <textarea class="rich-textarea" [(ngModel)]="currentReport.suiviBeneficiaires" rows="4" 
                placeholder="- Nom du projet&#10;- Niveau d’avancement&#10;- Besoins identifiés&#10;- Actions réalisées"></textarea>
            </div>

            <!-- 6. Planning des séances -->
            <div class="report-section">
              <h3 class="section-title"><span class="sec-num">6</span> Planning des séances</h3>
              <textarea class="rich-textarea" [(ngModel)]="currentReport.planningSeances" rows="4" 
                placeholder="- Date&#10;- Bénéficiaire&#10;- Durée"></textarea>
            </div>

            <!-- 7. Feedback des bénéficiaires -->
            <div class="report-section">
              <h3 class="section-title"><span class="sec-num">7</span> Feedback des bénéficiaires</h3>
              <textarea class="rich-textarea" [(ngModel)]="currentReport.feedbackBeneficiaires" rows="3" 
                placeholder="- Satisfaction&#10;- Points forts&#10;- Points d’amélioration"></textarea>
            </div>

            <!-- 8. Analyse & leçons apprises -->
            <div class="report-section">
              <h3 class="section-title"><span class="sec-num">8</span> Analyse & leçons apprises</h3>
              <textarea class="rich-textarea" [(ngModel)]="currentReport.analyseLecons" rows="3" 
                placeholder="- Difficultés rencontrées&#10;- Enseignements&#10;- Opportunités"></textarea>
            </div>

            <!-- 9. Recommandations & prochaines étapes -->
            <div class="report-section alert-box">
              <h3 class="section-title blue-title"><i class="pi pi-lightbulb"></i> 9. Recommandations & prochaines étapes</h3>
              <textarea class="rich-textarea no-border-area" [(ngModel)]="currentReport.recommandationsEtapes" rows="4" 
                placeholder="Détaillez les recommandations stratégiques et actions à mener"></textarea>
            </div>

            <!-- 10. Conclusion -->
            <div class="report-section">
              <h3 class="section-title"><span class="sec-num">10</span> Conclusion</h3>
              <textarea class="rich-textarea" [(ngModel)]="currentReport.conclusion" rows="3" 
                placeholder="Synthèse et impact global de cette période d'accompagnement"></textarea>
            </div>

          </div>
        </div>
      </div>

      <!-- ── Historique ─────────────────────── -->
      <div class="card" *ngIf="!editingReport">
        <div class="card-header-row" style="margin-bottom:0;">
          <div class="card-icon" style="background:#F3F4F6; color:#6B7280;"><i class="pi pi-history"></i></div>
          <h2 class="card-title">Historique des Rapports ({{ history.length }})</h2>
        </div>

        <div style="margin-top:20px;">
          <div *ngIf="selectedProgramId === 0" class="empty-state-inline">
            <p>Sélectionnez un programme pour voir l'historique des rapports.</p>
          </div>
          <div *ngIf="history.length === 0 && selectedProgramId !== 0" class="empty-state-inline">
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
                  <button (click)="openReport(h)" class="btn-sm" title="Éditer / Consulter"><i class="pi pi-eye"></i></button>
                  <button (click)="deleteReport(h.id)" class="btn-sm btn-sm-danger" style="margin-left:6px;"><i class="pi pi-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    
    /* Variables communes et structure (Mirroring Admin Workflow) */
    .matching-page { padding: 24px; background: #F8FAFC; min-height: 100vh; font-family: var(--font-family); }
    .matching-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .matching-title { font-size: 28px; font-weight: 800; color: #1A1A2E; margin: 0; }
    .matching-subtitle { color: #8a8a8a; font-size: 14px; margin-top: 4px; }
    
    .card { background: #fff; border-radius: 20px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); margin-bottom: 20px; border: 1px solid #F1F5F9; }
    .card-header-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .card-icon {
      width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px;
      background: linear-gradient(135deg, #FF6B9E, #FF3366); color: white;
    }
    .card-title { font-size: 18px; font-weight: 700; color: #1A1A2E; margin: 0; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
    .required { color: #FF4D85; }
    .form-select, .form-input, .rich-textarea {
      width: 100%; padding: 12px 16px; border: 1px solid #E2E8F0; background: #F8FAFC;
      border-radius: 12px; font-size: 14px; outline: none; font-weight: 500; font-family: inherit;
      color: #1A202C; transition: all .2s; box-sizing: border-box;
    }
    .form-select:focus, .form-input:focus, .rich-textarea:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); background: white; }
    .rich-textarea { resize: vertical; line-height: 1.6; }
    .hint { font-size: 12px; color: #9CA3AF; margin-top: 4px; }
    .empty-state-inline { text-align: center; padding: 32px; color: #6B7280; font-size: 14px; background: #F8FAFC; border-radius: 16px; border: 1px dashed #CBD5E0; }

    .btn-launch {
      display: inline-flex; align-items: center; gap: 8px; padding: 16px 24px; border-radius: 12px; font-size: 15px; font-weight: 700; color: #fff;
      background: linear-gradient(135deg, #FF6B9E, #E83E8C); border: none; cursor: pointer; transition: all .2s; box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3); font-family: inherit;
    }
    .btn-launch:hover:not(:disabled) { transform: translateY(-2px); }
    .btn-launch:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; transform: none; }
    
    .btn-cancel { padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; background: #F1F5F9; color: #475569; border: none; cursor: pointer; transition: background .2s; font-family: inherit; }
    .btn-cancel:hover { background: #E2E8F0; }
    .launch-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid #F1F5F9; }

    /* Period Tabs */
    .period-tabs { display: flex; background: #F1F5F9; padding: 6px; border-radius: 12px; }
    .period-btn { flex: 1; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; transition: all .2s; background: transparent; color: #64748B; font-family: inherit;}
    .period-btn.active { background: linear-gradient(135deg, #FF6B9E, #E83E8C); color: #fff; box-shadow: 0 2px 4px rgba(255,77,133,0.2); }

    .opt-label {
      flex: 1; min-width: 100px; display: flex; align-items: center; justify-content: center; padding: 12px; border-radius: 12px; border: 2px solid #F1F5F9; background: #F8FAFC;
      color: #64748B; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .2s; text-align: center;
    }
    .opt-label.active-opt { border-color: #FF4D85; background: #FFF5F7; color: #FF4D85; }

    /* Données incluses */
    .data-item { display: flex; align-items: center; padding: 12px; border-radius: 12px; border: 1px solid #F1F5F9; background: #F8FAFC; font-size: 13px; font-weight: 600; color: #475569; }
    .data-icon { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #FF6B9E, #E83E8C); color: #fff; font-size: 10px; margin-right: 12px; }

    /* Report Details Header */
    .report-header { padding: 20px 24px; border-bottom: 1px solid #F1F5F9; background: linear-gradient(to right, #ffffff, #FFF5F7); display: flex; justify-content: space-between; align-items: center; }
    .report-tag { background: rgba(255,77,133,0.1); color: #FF4D85; font-weight: 800; padding: 4px 8px; border-radius: 6px; font-size: 10px; text-transform: uppercase; margin-right: 8px; }

    /* Report Sections Styles (The Editor) */
    .report-section { margin-bottom: 1.5rem; }
    .section-title { font-size: 14px; font-weight: 800; color: #1A202C; text-transform: uppercase; display: flex; align-items: center; gap: 8px; margin: 0 0 12px; }
    .sec-num { background: #CBD5E0; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
    
    .green-title { color: #059669; }
    .blue-title { color: #2563EB; }
    
    .highlight-box { padding: 20px; border-radius: 16px; background: #F0FDF4; border: 1px solid #DCFCE7; }
    .highlight-box .rich-textarea { background: white; border-color: #BBF7D0; }
    
    .alert-box { padding: 20px; border-radius: 16px; background: #EFF6FF; border: 1px solid #DBEAFE; }
    .alert-box .rich-textarea { background: white; border-color: #BFDBFE; }

    /* Table Historique */
    .history-table { width: 100%; border-collapse: collapse; }
    .history-table th { text-align: left; padding: 16px 20px; font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #E2E8F0; background: #F8FAFC; }
    .history-table td { padding: 16px 20px; border-bottom: 1px solid #F1F5F9; }
    .history-table tr:hover td { background: #F8FAFC; }

    .btn-sm { padding: 8px 12px; border-radius: 8px; font-size: 14px; color: #3B82F6; border: none; background: transparent; cursor: pointer; transition: background .2s; }
    .btn-sm:hover { background: #EFF6FF; }
    .btn-sm-danger { color: #EF4444; }
    .btn-sm-danger:hover { background: #FEF2F2; color: #EF4444; }

    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .matching-header { flex-direction: column; gap: 12px; }
      .report-header { flex-direction: column; align-items: flex-start; gap: 16px; }
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

  templateSections = [
    { num: '1', label: 'Introduction & Objectifs' },
    { num: '2', label: 'Présentation de la Phase' },
    { num: '3', label: 'Déroulement de l’Accompagnement' },
    { num: '4', label: 'Résultats Quali & Quanti' },
    { num: '5', label: 'Suivi par Bénéficiaire' },
    { num: '6', label: 'Planning des Séances' },
    { num: '7', label: 'Feedback des Bénéficiaires' },
    { num: '8', label: 'Analyse & Leçons Apprises' },
    { num: '9', label: 'Recommandations Stratégiques' },
    { num: '10', label: 'Conclusion & Impact Global' }
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
    this.coachId = typeof cid === 'string' ? parseInt(cid, 10) : cid;

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
  }

  openReport(reportData: any) {
      this.currentReport = { ...reportData };
      this.currentReport.coachId = this.coachId;
      this.currentReport.programmeId = this.selectedProgramId;
      this.editingReport = true;
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
      if(confirm('Avez-vous bien sauvegardé vos modifications ?')) {
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
      if (this.customWeek) return { start: \`\${this.customWeek.substring(0,4)}-01-01\`, end: \`\${this.customWeek.substring(0,4)}-12-31\` };
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
        return { start: \`\${this.customMonth}-01\`, end: format(endM) };
      }
    }
    return { start: null, end: null };
  }

  async downloadPdf() {
    this.toastr.info("Génération du PDF en cours...");
    
    // Temporarily show header for PDF
    const pdfHeader = document.querySelector('.report-pdf-header') as HTMLElement;
    if (pdfHeader) pdfHeader.style.display = 'block';

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
      
      const fileName = \`Rapport_Accompagnement_\${this.getProgramName(this.selectedProgramId)}.pdf\`;
      pdf.save(fileName);
      this.toastr.success("PDF téléchargé.");
    } catch (e) {
      console.error('Erreur de génération du PDF', e);
      this.toastr.error("Erreur PDF.");
    } finally {
        if (pdfHeader) pdfHeader.style.display = 'none';
    }
  }
}
