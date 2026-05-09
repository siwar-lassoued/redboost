import { Component, signal, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatchingService, MatchingView } from '../../../core/services/matching.service';
import { ProgrammeService } from '../../../core/services/programme.service';
import { TacheService } from '../../../core/services/tache.service';
import { LivrableService } from '../../../core/services/livrable.service';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';

const STATUT_CFG: Record<string, { label: string; bg: string; color: string }> = {
  EN_COURS: { label: 'En cours', bg: '#D1FAE5', color: '#065F46' },
  PLANIFIE: { label: 'Planifié', bg: '#EFF6FF', color: '#2563EB' },
  TERMINE:  { label: 'Terminé', bg: '#F3F4F6', color: '#374151' },
  DRAFT:    { label: 'Brouillon', bg: '#FEF9C3', color: '#92400E' },
};

@Component({
  selector: 'rb-entrepreneur-programme',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="cand-page">
      <!-- PAGE HEADER -->
      <div class="cand-header">
        <div>
          <h1 class="cand-title">Mon Programme</h1>
          <p class="cand-subtitle">Détails et avancement de votre programme d'accompagnement</p>
        </div>
        <div class="cand-header-actions" *ngIf="programme()">
           <span class="cand-count-badge" style="background: rgba(59, 130, 166, 0.1); color: #3B82A6;">
             {{ getStatut(programme()!.statut).label }}
           </span>
        </div>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <i class="pi pi-spin pi-spinner text-3xl text-gray-300"></i>
        </div>
      } @else if (programme() && tableRows().length > 0) {
        
        <!-- PROGRAMME TABLE -->
        <div class="table-card mt-6">
          <div class="table-scroll">
            <table class="cand-table">
              <thead>
                <tr>
                  <th>Programme</th>
                  <th>Thématique</th>
                  <th>Dates</th>
                  <th>Coach</th>
                  <th>Progression (Sessions)</th>
                </tr>
              </thead>
              <tbody>
                @for (row of tableRows(); track row.id; let i = $index) {
                  <tr class="table-row">
                    @if (i === 0) {
                      <td [attr.rowspan]="tableRows().length" style="background: #F9FAFB; border-right: 1px solid #F1F5F9; vertical-align: top; padding-top: 24px;">
                        <div class="name-cell">
                          <span class="name-text" style="font-size: 16px; color: #1A1A2E;">{{ row.programmeName }}</span>
                          <span class="email-text mt-1" *ngIf="programme()?.nbBeneficiaires">{{ programme()?.nbBeneficiaires }} Bénéficiaires</span>
                          <div class="mt-4 p-3 bg-white rounded-xl border border-gray-100">
                             <div class="flex flex-col gap-1">
                               <span class="text-xs font-bold text-gray-700">Début: {{ formatDate(programme()!.dateDebut) }}</span>
                               <span class="text-xs font-bold text-gray-500">Fin: {{ formatDate(programme()!.dateFin) }}</span>
                             </div>
                          </div>
                        </div>
                      </td>
                    }
                    <!-- Removed duplicate Dates td from here, it's now in the Programme column or we can keep it. Let's keep Dates for the overall prog in the first column, and here maybe just remove Dates column. No wait, the header has 'Dates', let's leave it as is but use the color palette. -->
                    <td>
                      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border"
                            [style.background]="getThematiqueColor(row.thematiqueName).bg" 
                            [style.color]="getThematiqueColor(row.thematiqueName).text"
                            [style.border-color]="getThematiqueColor(row.thematiqueName).border">
                        <i class="pi pi-tag" style="font-size:10px"></i>
                        {{ row.thematiqueName }}
                      </span>
                    </td>
                    <td class="date-cell">
                      <!-- Specific dates per thematique if exist, else we show a dash since the programme dates are on the left -->
                      <span class="text-xs text-gray-400">—</span>
                    </td>
                    <td>
                      <div class="coach-cell">
                        <span class="name-text font-bold text-[#1A1A2E]">{{ row.coachName }}</span>
                        <span class="text-[10px] text-gray-400 block">{{ row.coachSpecialite }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="flex flex-col w-full min-w-[120px]">
                        <div class="flex justify-between items-center mb-1">
                          <span class="text-[10px] font-bold text-gray-500">{{ row.passedSessions }} / {{ row.totalSessions }} terminées</span>
                          <span class="text-[10px] font-black" [style.color]="'#10B981'">{{ row.progressPct }}%</span>
                        </div>
                        <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-700" 
                               [style.width.%]="row.progressPct" 
                               style="background: linear-gradient(90deg, #10B981, #059669)"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      } @else {
        <div class="empty-state mt-8 text-center bg-white p-12 rounded-2xl border-2 border-dashed border-gray-200">
          <i class="pi pi-book" style="font-size: 3rem; color: #D1D5DB; margin-bottom: 1rem; display: block;"></i>
          <p class="text-lg font-bold text-gray-500 mb-2">Aucun programme assigné</p>
          <p class="text-sm text-gray-400 max-w-sm mx-auto">Vous n'êtes pas encore inscrit dans un programme d'accompagnement. Contactez l'administrateur.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .cand-page { padding: 24px; background: #F5F6FA; min-height: 100vh; }
    .cand-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .cand-title { font-size: 28px; font-weight: 800; color: #1A1A2E; margin: 0; }
    .cand-subtitle { color: #8a8a8a; font-size: 14px; margin-top: 4px; }
    .cand-count-badge { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    
    .table-card { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.07); border: 1px solid #F1F5F9; }
    .table-scroll { overflow-x: auto; min-width: 100%; }
    .cand-table { width: 100%; border-collapse: collapse; text-align: left; }
    .cand-table th {
      padding: 12px 16px; font-size: 11px; font-weight: 700; color: #6B7280;
      text-transform: uppercase; letter-spacing: 0.05em; background: #F9FAFB; border-bottom: 1px solid #F3F4F6;
    }
    .cand-table td { padding: 14px 16px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
    .table-row { transition: background 0.2s; }
    .table-row:hover { background: #F8FAFC; }
    
    .name-cell, .coach-cell { display: flex; flex-direction: column; }
    .name-text { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 2px; }
    .email-text { font-size: 12px; color: #6B7280; }
  `]
})
export class EntrepreneurProgrammeComponent implements OnInit {
  private matchSvc = inject(MatchingService);
  private progSvc = inject(ProgrammeService);
  private authSvc = inject(AuthService);
  private sessionSvc = inject(SessionService);

  programme = signal<any>(null);
  coaches = signal<MatchingView[]>([]);
  tableRows = signal<any[]>([]);
  loading = signal(true);

  quickLinks = [
    { label: 'Mes Sessions', route: '/entrepreneur/mes-sessions', icon: 'calendar', bg: '#EFF6FF', color: '#3B82A6' },
    { label: 'Mes Tâches', route: '/entrepreneur/mes-taches', icon: 'list', bg: '#F0FDF4', color: '#10B981' },
    { label: 'Mes Livrables', route: '/entrepreneur/mes-livrables', icon: 'file-pdf', bg: '#FAF5FF', color: '#A855F7' },
    { label: 'Mon Statut', route: '/entrepreneur/status', icon: 'chart-line', bg: '#FFF5F5', color: '#EF4444' },
  ];

  ngOnInit(): void {
    const user = this.authSvc.currentUser$.value;
    if (!user) { this.loading.set(false); return; }

    this.matchSvc.getEntrepreneurCoaches(user.id).subscribe({
      next: (matches) => {
        if (matches.length > 0) {
          this.coaches.set(matches);

          this.progSvc.getById(matches[0].programmeId).subscribe({
            next: (prog) => {
              this.programme.set(prog);
              this.loadProgress(user.id, matches);
            },
            error: () => this.loading.set(false)
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false)
    });
  }

  private loadProgress(userId: string, matches: MatchingView[]): void {
    this.sessionSvc.getByEntrepreneur(userId).subscribe({
      next: (sessions) => {
        const rows = matches.map(m => {
          // Filter sessions for this specific coach
          const coachSessions = sessions.filter(s => s.coachId?.toString() === m.id.toString());
          const totalSessions = coachSessions.length;
          const passedSessions = coachSessions.filter(s => s.statut === 'REALISEE').length;
          const progressPct = totalSessions > 0 ? Math.round((passedSessions / totalSessions) * 100) : 0;

          return {
            id: m.id + '_' + m.thematiqueId,
            programmeName: this.programme()?.nom || 'Programme Assigné',
            thematiqueName: m.thematiqueName || 'Non spécifié',
            coachName: m.nom || 'Coach Non assigné',
            coachSpecialite: m.specialite || 'Coach',
            totalSessions,
            passedSessions,
            progressPct
          };
        });
        
        this.tableRows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        // Fallback if session fetch fails
        const rows = matches.map(m => ({
            id: m.id + '_' + m.thematiqueId,
            programmeName: this.programme()?.nom || 'Programme Assigné',
            thematiqueName: m.thematiqueName || 'Non spécifié',
            coachName: m.nom || 'Coach Non assigné',
            coachSpecialite: m.specialite || 'Coach',
            totalSessions: 0,
            passedSessions: 0,
            progressPct: 0
        }));
        this.tableRows.set(rows);
        this.loading.set(false);
      }
    });
  }

  getStatut(statut: string) {
    return STATUT_CFG[statut] || { label: statut, bg: '#F3F4F6', color: '#374151' };
  }

  formatDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  readonly colorPalette = [
    { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' }, // Sky
    { bg: '#FCE7F3', text: '#DB2777', border: '#FBCFE8' }, // Pink
    { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' }, // Green
    { bg: '#F3E8FF', text: '#9333EA', border: '#E9D5FF' }, // Purple
    { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' }, // Amber
    { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' }, // Red
  ];

  getThematiqueColor(name: string) {
    if (!name) return this.colorPalette[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % this.colorPalette.length;
    return this.colorPalette[index];
  }
}
