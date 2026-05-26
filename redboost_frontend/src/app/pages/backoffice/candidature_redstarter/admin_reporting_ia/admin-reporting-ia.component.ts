import { Component, OnInit, signal, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FormsModule } from '@angular/forms';
import { AiReportingService } from '../services/ai-reporting.service';
import { ProgrammeService } from '../services/programme.service';
import { AiReporting, AiPeriodType } from '../models/ai-reporting.model';

type HebdoOption = 'current' | 'last' | 'custom';
type MoisOption = 'current' | 'last' | 'custom';

@Component({
  selector: 'rb-admin-reporting-ia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="matching-page">
      <!-- ── Header ─────────────────────── -->
      <div class="matching-header">
        <div>
          <h1 class="matching-title">Reporting & Performance</h1>
          <p class="matching-subtitle">Rapports analytiques générés par IA (Llama 3.3 70B via Groq) sur vos programmes</p>
        </div>
        <div class="header-actions">
          <div class="ia-badge">
            <i class="pi pi-bolt"></i> Groq · Llama 3.3
          </div>
        </div>
      </div>

      <!-- ── Générateur ─────────────────────── -->
      <div class="card">
        <div class="card-header-row">
          <div class="card-icon"><i class="pi pi-plus-circle"></i></div>
          <div>
            <h2 class="card-title">Générer un rapport Stratégique</h2>
            <p class="hint" style="margin-top:2px;">Analyse croisée par LLM (Groq Llama 3.3 70B) des sessions, tâches et livrables du programme sélectionné.</p>
          </div>
        </div>

        <div class="form-grid">
          <!-- Left Column -->
          <div style="display:flex; flex-direction:column; gap:20px;">
            <div class="form-group">
              <label>Programme d'incubation <span class="required">*</span></label>
              <select [ngModel]="selectedProgramId()" (ngModelChange)="selectedProgramId.set($event)" class="form-select">
                <option [ngValue]="0" disabled>Choisir un programme...</option>
                <option *ngFor="let p of programmes()" [value]="p.id">{{ p.nom }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Période d'analyse <span class="required">*</span></label>
              <div class="period-tabs">
                <button *ngFor="let pt of periodTypes"
                    (click)="periodType.set(pt.id)"
                    class="period-btn"
                    [class.active]="periodType() === pt.id">
                  {{ pt.label }}
                </button>
              </div>
            </div>

            <div class="form-group" style="min-height:80px;">
              <div *ngIf="periodType() === 'LIBRE'" style="display:flex; gap:16px;">
                <div style="flex:1">
                  <label class="hint" style="display:block; margin-bottom:4px;">Du</label>
                  <input type="date" [(ngModel)]="dateFrom" class="form-input">
                </div>
                <div style="flex:1">
                  <label class="hint" style="display:block; margin-bottom:4px;">Au</label>
                  <input type="date" [(ngModel)]="dateTo" class="form-input">
                </div>
              </div>

              <div *ngIf="periodType() === 'HEBDO'" style="display:flex; flex-wrap:wrap; gap:8px;">
                <label *ngFor="let opt of hebdoOptions" class="opt-label" [class.active-opt]="hebdoOpt() === opt.val">
                  <input type="radio" name="hebdo" [value]="opt.val" [ngModel]="hebdoOpt()" (ngModelChange)="hebdoOpt.set($event)" style="display:none;">
                  {{ opt.label }}
                </label>
                <input *ngIf="hebdoOpt() === 'custom'" type="week" [(ngModel)]="customWeek" class="form-input" style="margin-top:8px;">
              </div>

              <div *ngIf="periodType() === 'MOIS'" style="display:flex; flex-wrap:wrap; gap:8px;">
                <label *ngFor="let opt of moisOptions" class="opt-label" [class.active-opt]="moisOpt() === opt.val">
                  <input type="radio" name="mois" [value]="opt.val" [ngModel]="moisOpt()" (ngModelChange)="moisOpt.set($event)" style="display:none;">
                  {{ opt.label }}
                </label>
                <input *ngIf="moisOpt() === 'custom'" type="month" [(ngModel)]="customMonth" class="form-input" style="margin-top:8px;">
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div>
            <div class="form-group">
              <label>Données traitées par l'IA</label>
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
          <button (click)="handleGenerate()" [disabled]="loading() || selectedProgramId() === 0" class="btn-launch" style="width:100%; justify-content:center;">
            <i [class]="loading() ? 'pi pi-spinner pi-spin' : 'pi pi-bolt'"></i>
            {{ loading() ? 'Veuillez patienter, traitement en cours...' : 'Générer le rapport stratégique' }}
          </button>
        </div>
      </div>

      <!-- ── Rapport Généré ─────────────────────── -->
      <div id="reportToDownload" *ngIf="generatedReport() as report" class="card" style="padding:0; overflow:hidden; border-left:5px solid #ec407a;">
        <div class="report-header">
          <div>
            <h2 class="card-title" style="display:flex; align-items:center; gap:10px;">
              <i class="pi pi-file" style="color:#ec407a;"></i> Rapport d'Activité
            </h2>
            <p class="hint" style="margin-top:6px;">
              <span class="report-tag">{{ report.periodType }}</span>
              {{ report.periodLabel }} • Généré par <strong>{{ report.generatedBy }}</strong>
            </p>
          </div>
          <div style="display:flex; gap:8px;">
             <button (click)="downloadPdf()" [disabled]="downloadingPdf()" class="btn-launch" style="padding:8px 16px; font-size:13px;">
               <i class="pi" [ngClass]="downloadingPdf() ? 'pi-spinner pi-spin' : 'pi-file-pdf'"></i>
               {{ downloadingPdf() ? 'Génération...' : 'Télécharger PDF' }}
             </button>
             <button (click)="generatedReport.set(null)" class="btn-cancel" style="padding:8px 12px;">
               <i class="pi pi-times"></i>
             </button>
          </div>
        </div>

        <div style="padding:24px;">
          <!-- KPIs -->
          <div class="kpi-grid">
            <div class="kpi-box blue-kpi">
              <i class="pi pi-calendar kpi-icon"></i>
              <div class="kpi-val">{{ report.sessionsCompleted }}<span class="kpi-max">/{{report.totalSessions}}</span></div>
              <div class="kpi-label">Sessions Validées</div>
            </div>
            <div class="kpi-box green-kpi">
              <i class="pi pi-check-square kpi-icon"></i>
              <div class="kpi-val">{{ report.tachesCompleted }}<span class="kpi-max">/{{report.totalTaches}}</span></div>
              <div class="kpi-label">Tâches Clôturées</div>
            </div>
            <div class="kpi-box purple-kpi">
              <i class="pi pi-id-card kpi-icon"></i>
              <div class="kpi-val">{{ report.totalLivrables }}</div>
              <div class="kpi-label">Livrables Soumis</div>
            </div>
            <div class="kpi-box yellow-kpi">
              <i class="pi pi-chart-line kpi-icon"></i>
              <div class="kpi-val">{{ (report.tachesCompleted / (report.totalTaches || 1) * 100).toFixed(0) }}%</div>
              <div class="kpi-label">Progression Proj.</div>
            </div>
          </div>

          <!-- Exec Summary -->
          <div class="exec-summary">
            <h3><i class="pi pi-star" style="color:#ec407a; margin-right:8px;"></i> Résumé Exécutif</h3>
            <p>{{ report.resumeExecutif }}</p>
          </div>

          <!-- Analyse Livrables -->
          <div class="livrables-summary" *ngIf="report.analyseLivrables">
            <h3><i class="pi pi-book" style="margin-right:8px;"></i> Synthèse des Livrables lus par l'IA</h3>
            <p>{{ report.analyseLivrables }}</p>
          </div>

          <div class="form-grid">
            <!-- Highlights -->
            <div>
              <h3 class="section-title green-title"><i class="pi pi-chart-line"></i> Points de Succès</h3>
              <div style="display:flex; flex-direction:column; gap:12px;">
                <div *ngFor="let k of getParsed(report.kpisJson)" class="highlight-item">
                  <div class="dot-green"></div>
                  <span>{{ k }}</span>
                </div>
              </div>
            </div>

            <!-- Alerts & Recos -->
            <div style="display:flex; flex-direction:column; gap:24px;">
              <div>
                <h3 class="section-title red-title"><i class="pi pi-exclamation-triangle"></i> Vigilance & Retards</h3>
                <div style="display:flex; flex-direction:column; gap:12px;">
                  <div *ngFor="let a of getParsedAlerts(report.alertesJson)" class="alert-item">
                     <i class="pi pi-megaphone"></i>
                     <div>
                       <span class="alert-type">{{ a.type || 'ALERTE' }}</span>
                       <span class="alert-msg">{{ a.message || a }}</span>
                     </div>
                  </div>
                  <div *ngIf="getParsedAlerts(report.alertesJson).length === 0" class="hint">Aucune alerte soulevée.</div>
                </div>
              </div>

              <div>
                <h3 class="section-title blue-title"><i class="pi pi-lightbulb"></i> Recommandations Stratégiques</h3>
                <div style="display:flex; flex-direction:column; gap:12px;">
                  <div *ngFor="let r of getParsed(report.recommandationsJson)" class="reco-item">
                     {{ r }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Performances Individuelles -->
          <div style="margin-top: 24px;">
            <h3 class="section-title purple-title" style="color: #7C3AED; margin-bottom:16px; font-size:16px; font-weight:700;"><i class="pi pi-users" style="margin-right:8px;"></i> Performances Individuelles</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              
              <!-- Entrepreneur Plus Actif -->
              <div class="perf-card" *ngIf="getParsedObject(report.meilleurEntrepreneurJson) as bestEnt">
                <div class="perf-header"><i class="pi pi-star-fill" style="color:#22C55E"></i> Entrepreneur Plus Actif</div>
                <div class="perf-name">{{ bestEnt.nom }}</div>
                <div class="perf-reason">{{ bestEnt.raison }}</div>
              </div>

              <!-- Entrepreneur Moins Actif -->
              <div class="perf-card" *ngIf="getParsedObject(report.entrepreneurEnDifficulteJson) as worstEnt">
                <div class="perf-header"><i class="pi pi-exclamation-circle" style="color:#EF4444"></i> Entrepreneur En Difficulté</div>
                <div class="perf-name">{{ worstEnt.nom }}</div>
                <div class="perf-reason">{{ worstEnt.raison }}</div>
              </div>

              <!-- Coach Plus Actif -->
              <div class="perf-card" *ngIf="getParsedObject(report.meilleurCoachJson) as bestCoach">
                <div class="perf-header"><i class="pi pi-star-fill" style="color:#3B82F6"></i> Coach Plus Actif</div>
                <div class="perf-name">{{ bestCoach.nom }}</div>
                <div class="perf-reason">{{ bestCoach.raison }}</div>
              </div>

              <!-- Coach Moins Actif -->
              <div class="perf-card" *ngIf="getParsedObject(report.coachASurveillerJson) as worstCoach">
                <div class="perf-header"><i class="pi pi-exclamation-circle" style="color:#F59E0B"></i> Coach À Surveiller</div>
                <div class="perf-name">{{ worstCoach.nom }}</div>
                <div class="perf-reason">{{ worstCoach.raison }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Historique ─────────────────────── -->
      <div class="card">
        <div class="card-header-row" style="margin-bottom:0;">
          <div class="card-icon" style="background:#F3F4F6; color:#6B7280;"><i class="pi pi-history"></i></div>
          <h2 class="card-title">Historique des Rapports ({{ history().length }})</h2>
        </div>

        <div style="margin-top:20px;">
          <div *ngIf="history().length === 0" class="empty-state-inline">
            <p>Aucun rapport d'activité n'est disponible pour ce programme.</p>
          </div>

          <table *ngIf="history().length > 0" class="history-table">
            <thead>
              <tr>
                <th>Programme / Date</th>
                <th>Période</th>
                <th>Santé (Tâches)</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of history()">
                <td>
                  <div style="font-weight:700; color:#2c3e50;">{{ h.programme?.nom || 'Programme N/A' }}</div>
                  <div class="hint">Le {{ h.dateGeneration }}</div>
                </td>
                <td>
                  <span class="report-tag">{{ h.periodType }}</span>
                  <div style="font-size:13px; margin-top:4px; font-weight:500;">{{ h.periodLabel }}</div>
                </td>
                <td>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:60px; height:6px; background:#F3F4F6; border-radius:10px; overflow:hidden;">
                       <div style="height:100%; background:#10B981; border-radius:10px;" [style.width]="(h.tachesCompleted / (h.totalTaches || 1) * 100) + '%'"></div>
                    </div>
                    <span style="font-size:12px; font-weight:700; color:#059669;">{{ h.tachesCompleted }}/{{ h.totalTaches }}</span>
                  </div>
                </td>
                <td style="text-align:right;">
                  <button (click)="generatedReport.set(h)" class="btn-sm"><i class="pi pi-eye"></i></button>
                  <button (click)="handleDelete(h.id)" class="btn-sm btn-sm-danger" style="margin-left:6px;"><i class="pi pi-trash"></i></button>
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
    
    /* Variables communes depuis admin_matching.ts */
    .matching-page { padding: 24px; background: #f8f9fa; min-height: 100vh; }
    .matching-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .matching-title { font-size: 28px; font-weight: 800; color: #2c3e50; margin: 0; }
    .matching-subtitle { color: #95a5a6; font-size: 14px; margin-top: 4px; }
    .header-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .ia-badge {
      display: flex; align-items: center; gap: 6px; padding: 8px 16px;
      border-radius: 12px; font-size: 13px; font-weight: 700; color: #fff;
      background: linear-gradient(135deg, #ec407a, #d81b60);
    }
    .card {
      background: #fff; border-radius: 20px; padding: 24px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07); margin-bottom: 20px;
    }
    .card-header-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .card-icon {
      width: 36px; height: 36px; border-radius: 10px; display: flex;
      align-items: center; justify-content: center; font-size: 16px;
      background: linear-gradient(135deg, #ec407a, #d81b60); color: white;
    }
    .card-title { font-size: 18px; font-weight: 700; color: #2c3e50; margin: 0; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
    .required { color: #ec407a; }
    .form-select, .form-input {
      width: 100%; padding: 12px 16px; border: 1px solid #E5E7EB; background: #F9FAFB;
      border-radius: 12px; font-size: 14px; outline: none; font-weight: 500;
      color: #333; transition: border-color .2s; box-sizing: border-box;
    }
    .form-select:focus, .form-input:focus { border-color: #ec407a; }
    .hint { font-size: 12px; color: #9CA3AF; margin-top: 4px; }
    .empty-state-inline {
      text-align: center; padding: 32px; color: #6B7280; font-size: 14px;
      background: #F9FAFB; border-radius: 16px; border: 1px dashed #E5E7EB;
    }

    .btn-launch {
      display: inline-flex; align-items: center; gap: 8px; padding: 16px 24px;
      border-radius: 12px; font-size: 15px; font-weight: 700; color: #fff;
      background: linear-gradient(135deg, #ec407a, #d81b60); border: none;
      cursor: pointer; transition: all .2s; box-shadow: 0 4px 12px rgba(236, 64, 122, 0.3);
    }
    .btn-launch:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-launch:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-cancel {
      padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600;
      background: #F3F4F6; color: #6B7280; border: none; cursor: pointer; transition: background .2s;
    }
    .btn-cancel:hover { background: #E5E7EB; }
    .launch-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid #F3F4F6; }

    /* Period Tabs */
    .period-tabs { display: flex; background: #F3F4F6; padding: 6px; border-radius: 12px; }
    .period-btn {
      flex: 1; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 700;
      border: none; cursor: pointer; transition: all .2s; background: transparent; color: #6B7280;
    }
    .period-btn.active {
      background: linear-gradient(135deg, #ec407a, #d81b60); color: #fff;
      box-shadow: 0 2px 4px rgba(236,64,122,0.2);
    }

    .opt-label {
      flex: 1; min-width: 100px; display: flex; align-items: center; justify-content: center;
      padding: 12px; border-radius: 12px; border: 2px solid #F3F4F6; background: #F9FAFB;
      color: #6B7280; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .2s; text-align: center;
    }
    .opt-label.active-opt { border-color: #ec407a; background: #fce4ec; color: #ec407a; }

    /* Données traitées */
    .data-item {
      display: flex; align-items: center; padding: 12px; border-radius: 12px;
      border: 1px solid #F3F4F6; background: #F9FAFB; font-size: 13px; font-weight: 600; color: #4B5563;
    }
    .data-icon {
      width: 20px; height: 20px; border-radius: 4px; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #ec407a, #d81b60); color: #fff; font-size: 10px; margin-right: 12px;
    }

    /* Report Details Header */
    .report-header {
      padding: 20px 24px; border-bottom: 1px solid #F3F4F6;
      background: linear-gradient(to right, #ffffff, #fce4ec);
      display: flex; justify-content: space-between; align-items: center;
    }
    .report-tag {
      background: rgba(236,64,122,0.1); color: #ec407a; font-weight: 800;
      padding: 2px 8px; border-radius: 4px; font-size: 10px; text-transform: uppercase; margin-right: 8px;
    }

    /* KPIs */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .kpi-box {
      border-radius: 16px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center;
      border: 1px solid transparent; text-align: center;
    }
    .kpi-icon { font-size: 20px; margin-bottom: 12px; }
    .kpi-val { font-size: 32px; font-weight: 900; line-height: 1; margin-bottom: 4px; }
    .kpi-max { font-size: 14px; font-weight: 700; opacity: 0.7; margin-left: 4px; }
    .kpi-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }

    .blue-kpi { background: #EFF6FF; border-color: #DBEAFE; color: #1D4ED8; }
    .blue-kpi .kpi-icon { color: #2563EB; width:40px; height:40px; background:#DBEAFE; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .green-kpi { background: #ECFDF5; border-color: #D1FAE5; color: #047857; }
    .green-kpi .kpi-icon { color: #059669; width:40px; height:40px; background:#D1FAE5; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .purple-kpi { background: #FAF5FF; border-color: #F3E8FF; color: #6D28D9; }
    .purple-kpi .kpi-icon { color: #7C3AED; width:40px; height:40px; background:#F3E8FF; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .yellow-kpi { background: #FFFBEB; border-color: #FEF3C7; color: #B45309; }
    .yellow-kpi .kpi-icon { color: #D97706; width:40px; height:40px; background:#FEF3C7; border-radius:50%; display:flex; align-items:center; justify-content:center; }

    /* Summaries */
    .exec-summary {
      background: #F9FAFB; border-left: 4px solid #ec407a;
      padding: 24px; border-radius: 0 16px 16px 0; margin-bottom: 32px;
    }
    .exec-summary h3 { font-size: 14px; font-weight: 800; color: #2c3e50; text-transform: uppercase; margin: 0 0 12px; display: flex; align-items: center; }
    .exec-summary p { margin: 0; font-size: 14px; color: #374151; line-height: 1.6; font-weight: 500; }

    .livrables-summary {
      background: #FAFAF9; border: 1px solid #E5E7EB; padding: 24px; border-radius: 16px; margin-bottom: 32px;
    }
    .livrables-summary h3 { font-size: 14px; font-weight: 800; color: #4338CA; text-transform: uppercase; margin: 0 0 12px; display: flex; align-items: center; }
    .livrables-summary p { margin: 0; font-size: 14px; color: #4B5563; line-height: 1.6; }

    .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; display: flex; align-items: center; gap: 8px; margin: 0 0 16px; }
    .green-title { color: #059669; }
    .red-title { color: #DC2626; }
    .blue-title { color: #2563EB; }

    .highlight-item {
      display: flex; align-items: flex-start; gap: 12px; padding: 16px; border-radius: 16px;
      background: #fff; border: 1px solid #ECFDF5; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      font-size: 14px; color: #374151; font-weight: 500; line-height: 1.5;
    }
    .dot-green { width: 8px; height: 8px; border-radius: 50%; background: #10B981; margin-top: 6px; flex-shrink: 0; }

    .alert-item {
      display: flex; align-items: flex-start; gap: 12px; padding: 16px; border-radius: 16px;
      background: #FEF2F2; border: 1px solid #FEE2E2; color: #7F1D1D;
    }
    .alert-item i { color: #EF4444; margin-top: 2px; font-size: 18px; }
    .alert-type { display: block; font-size: 10px; font-weight: 900; color: #DC2626; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .alert-msg { font-size: 14px; font-weight: 500; line-height: 1.4; }

    .reco-item { background: #E0F2FE; color: #0284C7; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.5; font-weight: 500; }
    
    .perf-card { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .perf-header { font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
    .perf-name { font-size: 16px; font-weight: 800; color: #111827; }
    .perf-reason { font-size: 13px; color: #4B5563; line-height: 1.5; }

    /* Table */
    .history-table { width: 100%; border-collapse: collapse; }
    .history-table th {
      text-align: left; padding: 16px 20px; font-size: 12px; font-weight: 700; color: #6B7280;
      text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #E5E7EB; background: #F9FAFB;
    }
    .history-table td { padding: 16px 20px; border-bottom: 1px solid #F3F4F6; }
    .history-table tr:last-child td { border-bottom: none; }
    .history-table tr:hover td { background: #F9FAFB; }

    .btn-sm {
      padding: 8px 12px; border-radius: 8px; font-size: 14px; color: #3B82F6;
      border: none; background: transparent; cursor: pointer; transition: background .2s;
    }
    .btn-sm:hover { background: #EFF6FF; }
    .btn-sm-danger { color: #F87171; }
    .btn-sm-danger:hover { background: #FEF2F2; color: #EF4444; }

    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .kpi-grid { grid-template-columns: 1fr 1fr; }
      .matching-header { flex-direction: column; gap: 12px; }
      .report-header { flex-direction: column; align-items: flex-start; gap: 16px; }
    }
  `]
})
export class AdminReportingIaComponent implements OnInit {
  private svc = inject(AiReportingService);
  private progSvc = inject(ProgrammeService);

  periodTypes = [
    { id: 'LIBRE' as AiPeriodType, label: 'Personnalisé' },
    { id: 'HEBDO' as AiPeriodType, label: 'Hebdo' },
    { id: 'MOIS' as AiPeriodType, label: 'Mensuel' },
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

  inclusionItems = [
    { label: 'Tâches — statut, descriptions, retards', icon: 'check-square' },
    { label: 'Sessions de coaching — comptes-rendus', icon: 'users' },
    { label: 'Livrables PDF — résumé du contenu par LLM', icon: 'book-open' },
    { label: 'Moteur IA : Groq / Llama 3.3 70B (ultra-rapide)', icon: 'bolt' }
  ];

  programmes = signal<any[]>([]);
  selectedProgramId = signal<number>(0);
  
  periodType = signal<AiPeriodType>('MOIS');
  dateFrom = '';
  dateTo = '';
  hebdoOpt = signal<HebdoOption>('current');
  moisOpt = signal<MoisOption>('current');
  customWeek = '';
  customMonth = '';

  loading = signal(false);
  generatedReport = signal<AiReporting | null>(null);
  history = signal<AiReporting[]>([]);

  downloadingPdf = signal(false);

  ngOnInit() {
    this.progSvc.getAll().subscribe((r: any[]) => {
      this.programmes.set(r);
      if (r && r.length > 0) {
        this.selectedProgramId.set(r[0].id);
        this.loadHistory(r[0].id);
      }
    });
  }

  loadHistory(progId: number) {
    this.svc.getHistory(progId).subscribe(h => this.history.set(h));
  }

  handleGenerate() {
    if (this.selectedProgramId() === 0) return;
    const { start, end } = this.calculateDates();
    if (!start || !end) {
      alert("Dates invalides."); return;
    }

    this.loading.set(true);
    this.svc.generateReport({
      programmeId: this.selectedProgramId(),
      dateDebut: start,
      dateFin: end,
      periodType: this.periodType()
    }).subscribe({
      next: (rep) => {
        this.generatedReport.set(rep);
        this.loadHistory(this.selectedProgramId());
        this.loading.set(false);
      },
      error: (e) => {
        console.error(e);
        this.loading.set(false);
        alert("Erreur lors de la génération. Vérifiez que le service IA (Groq) est démarré et que GROQ_API_KEY est configurée dans ai_service/.env.");
      }
    });
  }

  handleDelete(id: number) {
    if(confirm("Confirmer la suppression ?")) {
      this.svc.deleteReport(id).subscribe(() => this.loadHistory(this.selectedProgramId()));
    }
  }

  getParsed(jsonStr: string): string[] {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [jsonStr];
    }
  }

  getParsedAlerts(jsonStr: string): any[] {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [{ message: jsonStr }];
    }
  }

  private calculateDates(): { start: string | null, end: string | null } {
    const pt = this.periodType();
    const today = new Date();
    const format = (d: Date) => d.toISOString().split('T')[0];
    
    if (pt === 'LIBRE') return { start: this.dateFrom || null, end: this.dateTo || null };
    if (pt === 'HEBDO') {
      const startW = new Date(today);
      startW.setDate(today.getDate() - today.getDay() + 1);
      const endW = new Date(startW); endW.setDate(startW.getDate() + 6);

      if (this.hebdoOpt() === 'current') return { start: format(startW), end: format(endW) };
      if (this.hebdoOpt() === 'last') {
        startW.setDate(startW.getDate() - 7); endW.setDate(endW.getDate() - 7);
        return { start: format(startW), end: format(endW) };
      }
      if (this.customWeek) return { start: `${this.customWeek.substring(0,4)}-01-01`, end: `${this.customWeek.substring(0,4)}-12-31` }; // rough estimation for simplicity
    }
    if (pt === 'MOIS') {
      if (this.moisOpt() === 'current') {
        const startM = new Date(today.getFullYear(), today.getMonth(), 1);
        const endM = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { start: format(startM), end: format(endM) };
      }
      if (this.moisOpt() === 'last') {
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
    this.downloadingPdf.set(true);
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
      
      const programmeMenu = this.programmes().find(p => p.id === this.selectedProgramId());
      const fileName = `Rapport_Strategies_${programmeMenu?.nom || 'Programme'}.pdf`;
      
      pdf.save(fileName);
    } catch (e) {
      console.error('Erreur de génération du PDF', e);
    } finally {
      this.downloadingPdf.set(false);
    }
  }
}

