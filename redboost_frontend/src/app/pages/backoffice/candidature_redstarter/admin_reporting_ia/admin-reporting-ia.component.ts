import { Component, OnInit, signal, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    <div class="page-wrapper min-h-screen bg-gray-50 pb-20">
      <!-- ── Header ─────────────────────────────────────────── -->
      <div class="flex items-center justify-between mb-8 px-6 pt-6">
        <div>
          <h1 class="text-3xl font-extrabold text-[#1A1A2E] tracking-tight m-0">Reporting & Performance</h1>
          <p class="text-gray-500 text-sm mt-1">Générez des rapports analytiques et holistiques sur vos programmes</p>
        </div>
        <div class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#FF4D85] bg-[#fff0f5] border border-[#FF4D85]/20 shadow-sm">
          <i class="pi pi-star fill-[#FF4D85]/20" style="font-size: 1.25rem;"></i>
          IA RedBoost
        </div>
      </div>

      <!-- ── Section 1 — Générateur ─────────────────────────── -->
      <div class="mx-6 bg-white rounded-2xl p-8 mb-10 shadow-sm" style="border: 1px solid rgba(0,0,0,0.04);">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md" style="background: var(--gradient-pink, linear-gradient(135deg, #FF6B9E 0%, #E83E8C 100%));">
            <i class="pi pi-plus-circle" style="font-size: 1.25rem;"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-[#1A1A2E] m-0">Générer un rapport Stratégique</h2>
            <p class="text-xs text-gray-400">Croisement automatique des sessions, tâches, et livrables (documents partagés).</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div class="space-y-6">
            <!-- Programme -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Programme d'incubation</label>
              <div class="relative">
                <select 
                  [ngModel]="selectedProgramId()"
                  (ngModelChange)="selectedProgramId.set($event)"
                  class="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#FF4D85] bg-gray-50 appearance-none font-medium cursor-pointer transition-colors"
                >
                  <option value="0" disabled>Choisir un programme...</option>
                  <option *ngFor="let p of programmes()" [value]="p.id">{{ p.nom }}</option>
                </select>
                <i class="pi pi-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style="font-size: 1.25rem;"></i>
              </div>
            </div>

            <!-- Période -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Période d'analyse</label>
              <div class="flex bg-gray-100 p-1.5 rounded-xl">
                <button *ngFor="let pt of periodTypes"
                    (click)="periodType.set(pt.id)"
                    class="flex-1 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer"
                    [ngStyle]="{'background': periodType() === pt.id ? 'var(--gradient-pink, #FF4D85)' : 'transparent', 'color': periodType() === pt.id ? 'white' : '#6B7280', 'box-shadow': periodType() === pt.id ? '0 2px 4px rgba(255,107,158,0.2)' : 'none'}">
                  {{ pt.label }}
                </button>
              </div>
            </div>

            <div class="min-h-[80px]">
              <div *ngIf="periodType() === 'LIBRE'" class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1">Du</label>
                  <input type="date" [(ngModel)]="dateFrom" class="w-full border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-[#FF4D85] bg-gray-50 font-medium">
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1">Au</label>
                  <input type="date" [(ngModel)]="dateTo" class="w-full border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-[#FF4D85] bg-gray-50 font-medium">
                </div>
              </div>

              <div *ngIf="periodType() === 'HEBDO'" class="flex flex-wrap gap-2">
                <label *ngFor="let opt of hebdoOptions" class="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors" [class]="hebdoOpt() === opt.val ? 'border-[#FF4D85] bg-[#fff0f5] text-[#FF4D85]' : 'border-gray-100 bg-gray-50 text-gray-500'">
                  <input type="radio" name="hebdo" [value]="opt.val" [ngModel]="hebdoOpt()" (ngModelChange)="hebdoOpt.set($event)" class="hidden">
                  <span class="text-xs font-bold">{{ opt.label }}</span>
                </label>
                <input *ngIf="hebdoOpt() === 'custom'" type="week" [(ngModel)]="customWeek" class="w-full mt-2 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-[#FF4D85] bg-gray-50 font-medium">
              </div>

              <div *ngIf="periodType() === 'MOIS'" class="flex flex-wrap gap-2">
                <label *ngFor="let opt of moisOptions" class="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors" [class]="moisOpt() === opt.val ? 'border-[#FF4D85] bg-[#fff0f5] text-[#FF4D85]' : 'border-gray-100 bg-gray-50 text-gray-500'">
                  <input type="radio" name="mois" [value]="opt.val" [ngModel]="moisOpt()" (ngModelChange)="moisOpt.set($event)" class="hidden">
                  <span class="text-xs font-bold">{{ opt.label }}</span>
                </label>
                <input *ngIf="moisOpt() === 'custom'" type="month" [(ngModel)]="customMonth" class="w-full mt-2 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-[#FF4D85] bg-gray-50 font-medium">
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Données traitées</label>
              <div class="space-y-3">
                <div *ngFor="let inc of inclusionItems" class="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 opacity-90 pointer-events-none">
                  <div class="w-5 h-5 rounded flex items-center justify-center text-white" style="background: var(--gradient-pink, #FF4D85)">
                    <i class="pi pi-check" style="font-size: 1.25rem;"></i>
                  </div>
                  <i [class]="'pi pi-' + inc.icon + ' text-gray-400'"></i>
                  <span class="text-sm font-semibold text-gray-600">{{ inc.label }}</span>
                </div>
              </div>
              <p class="text-xs text-gray-400 mt-4 leading-relaxed bg-[#fff0f5] p-3 rounded-xl border border-[#ffb3c6]">
                 <i class="pi pi-info-circle inline text-[#FF4D85] -mt-0.5 mr-1" style="font-size: 1.25rem;"></i>
              </p>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-gray-100">
          <button 
            (click)="handleGenerate()"
            [disabled]="loading() || selectedProgramId() === 0"
            class="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-white font-bold transition-all hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            style="background: var(--gradient-pink, linear-gradient(135deg, #FF6B9E 0%, #E83E8C 100%)); box-shadow: 0 4px 14px rgba(255,107,158,0.3)"
          >
            <ng-container *ngIf="loading()">
              <i class="pi pi-spinner pi-spin " style="font-size: 1.25rem;"></i>
              <span class="text-lg tracking-wide">Traitement en cours...</span>
            </ng-container>
            <ng-container *ngIf="!loading()">
              <i class="pi pi-bolt  text-white" style="font-size: 1.25rem;"></i>
              <span class="text-lg tracking-wide">Générer le rapport stratégique</span>
            </ng-container>
          </button>
        </div>
      </div>

      <!-- ── Section 2 — Rapport Généré ─────────────────────── -->
      <div *ngIf="generatedReport() as report" class="mx-6 bg-white rounded-2xl overflow-hidden shadow-sm mb-10" style="border: 1px solid rgba(0,0,0,0.04);">
        <div class="px-8 py-5 border-b border-gray-100 flex items-center justify-between" style="background: linear-gradient(to right, #ffffff, #fff0f5)">
          <div>
            <div class="flex items-center gap-3">
              <i class="pi pi-file text-[#FF4D85]" style="font-size: 1.25rem;"></i>
              <h2 class="text-2xl font-black text-[#1A1A2E] m-0 tracking-tight">Rapport d'Activité</h2>
            </div>
            <p class="text-xs text-gray-500 mt-1 font-medium">
              <span class="text-[#FF4D85] font-bold uppercase tracking-wider bg-[#FF4D85]/10 px-2 py-0.5 rounded mr-2">{{ report.periodType }}</span>
              {{ report.periodLabel }} • Généré par <span class="font-bold border-b border-dashed border-gray-300 pb-0.5">{{ report.generatedBy }}</span>
            </p>
          </div>
          <button (click)="generatedReport.set(null)" class="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-xl transition-colors cursor-pointer border-none">
             <i class="pi pi-times" style="font-size: 1.25rem;"></i>
          </button>
        </div>

        <div class="p-8">
          <!-- KPIs -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="rounded-2xl p-5 border border-blue-100 bg-blue-50/50 flex flex-col justify-center items-center">
              <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <i class="pi pi-calendar" style="font-size: 1.25rem;"></i>
              </div>
              <div class="text-3xl font-black text-blue-600 leading-none mb-1">{{ report.sessionsCompleted }}<span class="text-sm text-blue-400 font-bold ml-1">/{{report.totalSessions}}</span></div>
              <div class="text-[10px] font-bold text-blue-800 uppercase tracking-widest text-center mt-1">Sessions Validées</div>
            </div>
            <div class="rounded-2xl p-5 border-emerald-100 bg-emerald-50/50 flex flex-col justify-center items-center">
              <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <i class="pi pi-check-square" style="font-size: 1.25rem;"></i>
              </div>
              <div class="text-3xl font-black text-emerald-600 leading-none mb-1">{{ report.tachesCompleted }}<span class="text-sm text-emerald-400 font-bold ml-1">/{{report.totalTaches}}</span></div>
              <div class="text-[10px] font-bold text-emerald-800 uppercase tracking-widest text-center mt-1">Tâches Clôturées</div>
            </div>
            <div class="rounded-2xl p-5 border-purple-100 bg-purple-50/50 flex flex-col justify-center items-center">
              <div class="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                <i class="pi pi-id-card" style="font-size: 1.25rem;"></i>
              </div>
              <div class="text-3xl font-black text-purple-600 leading-none mb-1">{{ report.totalLivrables }}</div>
              <div class="text-[10px] font-bold text-purple-800 uppercase tracking-widest text-center mt-1">Livrables Soumis</div>
            </div>
            <!-- Empty metric or rating -->
            <div class="rounded-2xl p-5 border-amber-100 bg-amber-50/50 flex flex-col justify-center items-center">
              <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                <i class="pi pi-chart-line" style="font-size: 1.25rem;"></i>
              </div>
              <div class="text-3xl font-black text-amber-600 leading-none mb-1">{{ (report.tachesCompleted / (report.totalTaches || 1) * 100).toFixed(0) }}%</div>
              <div class="text-[10px] font-bold text-amber-800 uppercase tracking-widest text-center mt-1">Progression Proj.</div>
            </div>
          </div>

          <!-- Exec Summary -->
          <div class="bg-[#f8f9fa] border-l-4 border-[#FF4D85] p-6 rounded-r-xl mb-8">
            <h3 class="text-sm font-black text-[#1A1A2E] uppercase tracking-wider mb-3 flex items-center gap-2">
              <i class="pi pi-star text-[#FF4D85]" style="font-size: 1.25rem;"></i> Résumé Exécutif
            </h3>
            <p class="text-gray-700 leading-relaxed font-medium text-sm">{{ report.resumeExecutif }}</p>
          </div>

          <!-- Analyse Livrables -->
          <div class="bg-gray-50 border border-gray-100 p-6 rounded-xl mb-8" *ngIf="report.analyseLivrables">
            <h3 class="text-sm font-black text-purple-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <i class="pi pi-book text-purple-600" style="font-size: 1.25rem;"></i> Synthèse des Livrables lus par l'IA
            </h3>
            <p class="text-gray-600 leading-relaxed text-sm">{{ report.analyseLivrables }}</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Highlights -->
            <div>
              <h3 class="text-sm font-black text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <i class="pi pi-chart-line" style="font-size: 1.25rem;"></i> Points de Succès
              </h3>
              <ul class="space-y-3">
                <li *ngFor="let k of getParsed(report.kpisJson)" class="flex items-start gap-3 bg-white border border-emerald-50 p-4 rounded-xl shadow-sm">
                  <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                  <span class="text-sm text-gray-700 font-medium">{{ k }}</span>
                </li>
              </ul>
            </div>

            <!-- Alerts & Recos -->
            <div class="space-y-6">
              <div>
                <h3 class="text-sm font-black text-red-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i class="pi pi-exclamation-triangle" style="font-size: 1.25rem;"></i> Vigilance & Retards
                </h3>
                <div class="space-y-3">
                  <div *ngFor="let a of getParsedAlerts(report.alertesJson)" class="flex items-start gap-3 bg-[#FEF2F2] border border-red-100 p-4 rounded-xl">
                     <i class="pi pi-megaphone text-red-500 flex-shrink-0 mt-0.5" style="font-size: 1.25rem;"></i>
                     <div>
                       <span class="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">{{ a.type || 'ALERTE' }}</span>
                       <span class="text-sm text-red-900 font-medium leading-tight">{{ a.message || a }}</span>
                     </div>
                  </div>
                  <div *ngIf="getParsedAlerts(report.alertesJson).length === 0" class="text-sm text-gray-400 italic p-2">Aucune alerte soulevée.</div>
                </div>
              </div>

              <div>
                <h3 class="text-sm font-black text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i class="pi pi-lightbulb" style="font-size: 1.25rem;"></i> Recommandations Stratégiques
                </h3>
                <div class="space-y-3">
                  <div *ngFor="let r of getParsed(report.recommandationsJson)" class="bg-[#EFF6FF] text-blue-900 p-4 rounded-xl text-sm font-medium border border-blue-100 shadow-sm leading-relaxed">
                     {{ r }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Section 3 — Historique ─────────────────────────── -->
      <div class="mx-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-[#1A1A2E] m-0">Historique des Rapports</h2>
          <span class="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full font-bold">{{ history().length }} rapports archivés</span>
        </div>

        <div class="bg-white rounded-xl shadow-sm overflow-hidden" style="border: 1px solid rgba(0,0,0,0.04);">
          <div *ngIf="history().length === 0" class="py-12 flex flex-col items-center justify-center text-gray-400">
            <i class="pi pi-copy opacity-20 mb-3" style="font-size: 1.25rem;"></i>
            <p class="text-sm font-medium">Aucun rapport d'activité n'est disponible</p>
          </div>

          <table *ngIf="history().length > 0" class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Programme</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type Période</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Couverture</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Santé (Tâches)</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr *ngFor="let h of history()" class="hover:bg-gray-50/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="text-sm font-bold text-[#1A1A2E]">{{ h.programme?.nom || 'Programme N/A' }}</div>
                  <div class="text-xs text-gray-400 mt-0.5">Le {{ h.dateGeneration }}</div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-[10px] bg-[#fff0f5] text-[#FF4D85] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border border-[#ffb3c6]/40">{{ h.periodType }}</span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 font-medium">
                  {{ h.periodLabel }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div class="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                       <div class="h-full bg-emerald-500 rounded-full" [style.width]="(h.tachesCompleted / (h.totalTaches || 1) * 100) + '%'"></div>
                    </div>
                    <span class="text-xs font-bold text-emerald-600">{{ h.tachesCompleted }}/{{ h.totalTaches }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-2">
                    <button (click)="generatedReport.set(h)" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer" title="Voir">
                       <i class="pi pi-eye" style="font-size: 1.25rem;"></i>
                    </button>
                    <button (click)="handleDelete(h.id)" class="p-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors border-none bg-transparent cursor-pointer" title="Supprimer">
                       <i class="pi pi-trash" style="font-size: 1.25rem;"></i>
                    </button>
                  </div>
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
    { label: 'Tâches (Statut & Descriptions)', icon: 'check-square' },
    { label: 'Sessions de Coaching (Entretiens)', icon: 'users' },
    { label: 'Livrables Partagés (Analyse du contenu PDF)', icon: 'book-open' }
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
        alert("Erreur lors de la génération avec l'IA. Vérifiez la clé API.");
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
}
