import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LivrableService } from '../../../core/services/livrable.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environment';

type LivTab = 'ALL' | 'EN_ATTENTE' | 'VALIDE' | 'REJETE';

const TAB_CFG: { id: LivTab; label: string; icon: string }[] = [
  { id: 'ALL',        label: 'Tous',       icon: 'pi-copy'       },
  { id: 'EN_ATTENTE', label: 'En attente', icon: 'pi-clock'      },
  { id: 'VALIDE',     label: 'Approuvés',  icon: 'pi-check-circle'},
  { id: 'REJETE',     label: 'Rejetés',    icon: 'pi-times-circle'},
];

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  EN_ATTENTE:     { label: 'En attente',  bg: '#FEF9C3', color: '#92400E', dot: '#f59e0b' },
  SOUMIS:         { label: 'Soumis',      bg: '#EFF6FF', color: '#2563EB', dot: '#3b82f6' },
  PENDING:        { label: 'En attente',  bg: '#FEF9C3', color: '#92400E', dot: '#f59e0b' },
  PENDING_REVIEW: { label: 'En revue',    bg: '#FEF3C7', color: '#D97706', dot: '#f59e0b' },
  SUBMITTED:      { label: 'Soumis',      bg: '#EFF6FF', color: '#2563EB', dot: '#3b82f6' },
  VALIDE:         { label: 'Approuvé',    bg: '#D1FAE5', color: '#065F46', dot: '#22c55e' },
  APPROVED:       { label: 'Approuvé',    bg: '#D1FAE5', color: '#065F46', dot: '#22c55e' },
  ACCEPTED:       { label: 'Accepté',     bg: '#D1FAE5', color: '#065F46', dot: '#22c55e' },
  REJETE:         { label: 'Rejeté',      bg: '#FEE2E2', color: '#991B1B', dot: '#ef4444' },
  REJECTED:       { label: 'Rejeté',      bg: '#FEE2E2', color: '#991B1B', dot: '#ef4444' },
  REVISION:       { label: 'Révision',    bg: '#FEF3C7', color: '#B45309', dot: '#f59e0b' },
  RESUBMITTED:    { label: 'Resoumis',    bg: '#EFF6FF', color: '#1D4ED8', dot: '#6366f1' },
};

@Component({
  selector: 'rb-entrepreneur-livrables',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="cand-page">
      <!-- PAGE HEADER -->
      <div class="cand-header">
        <div class="header-content">
          <h1 class="cand-title">Mes Livrables</h1>
          <p class="cand-subtitle">Documents et livrables partagés par vos coachs</p>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ allLivrables().length }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ getTabCount('EN_ATTENTE') }}</span>
            <span class="stat-label">En attente</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ getTabCount('VALIDE') }}</span>
            <span class="stat-label">Approuvés</span>
          </div>
        </div>
      </div>

      <!-- TABS -->
      <div class="cand-tabs">
        @for (tab of tabs; track tab.id) {
          <button
            (click)="activeTab.set(tab.id)"
            class="cand-tab"
            [class.active]="activeTab() === tab.id">
            <i class="pi {{ tab.icon }}"></i>
            {{ tab.label }}
            <span class="tab-count">{{ getTabCount(tab.id) }}</span>
          </button>
        }
      </div>

      <!-- LOADING -->
      @if (loading()) {
        <div class="loading-wrap">
          <div class="spinner"></div>
        </div>
      } @else {

        <!-- LIVRABLES GRID -->
        <div class="sessions-grid" *ngIf="filtered().length > 0">
          @for (liv of filtered(); track liv.id) {
            <div class="premium-session-card" [class.card-rejected]="isRejected(liv.statut || liv.status)">

              <!-- Card Top -->
              <div class="card-top">
                <div class="file-type-pill" [style.background]="getFileIcon(liv.titre || liv.fileName || '').bg">
                  <i class="pi" [class]="getFileIcon(liv.titre || liv.fileName || '').icon"
                     [style.color]="getFileIcon(liv.titre || liv.fileName || '').color"></i>
                  {{ getFileIcon(liv.titre || liv.fileName || '').label }}
                </div>
                <div class="status-dot-wrap">
                  <div class="status-dot" [style.background]="getStatus(liv.statut || liv.status).dot"></div>
                  <span class="status-text">{{ getStatus(liv.statut || liv.status).label }}</span>
                </div>
              </div>

              <!-- Card Body -->
              <div class="card-body">
                <h3 class="session-title">{{ liv.titre }}</h3>
                <p class="session-theme" *ngIf="liv.programme?.nom">
                  <i class="pi pi-bookmark-fill"></i>
                  {{ liv.programme?.nom }}
                </p>

                <div class="session-meta">
                  <div class="meta-item">
                    <i class="pi pi-calendar"></i>
                    <span>{{ formatDate(liv.dateSoumission || liv.createdAt) }}</span>
                  </div>
                  <div class="meta-item" *ngIf="liv.fileSize">
                    <i class="pi pi-database"></i>
                    <span>{{ liv.fileSize }}</span>
                  </div>
                </div>

                <!-- Coach Info -->
                <div class="coach-info-mini" *ngIf="liv.coachName || liv.coachEmail">
                  <div class="coach-avatar-mini" [style.background]="getCoachColor(liv.coachName || liv.coachEmail)">
                    {{ (liv.coachName || liv.coachEmail || 'C')[0].toUpperCase() }}
                  </div>
                  <div class="coach-details-mini">
                    <span class="coach-label">Déposé par</span>
                    <span class="coach-name">{{ liv.coachName || liv.coachEmail }}</span>
                  </div>
                </div>

                <!-- Coach feedback -->
                @if (liv.commentaire || liv.coachComment) {
                  <div class="feedback-box">
                    <i class="pi pi-comment"></i>
                    <span>{{ liv.commentaire || liv.coachComment }}</span>
                  </div>
                }
              </div>

              <!-- Card Footer -->
              <div class="card-footer">
                <button
                  *ngIf="liv.fichierUrl"
                  (click)="download(liv.fichierUrl)"
                  class="btn-card-action btn-download">
                  <i class="pi pi-download"></i>
                  Télécharger
                </button>
                @if (isRejected(liv.statut || liv.status)) {
                  <button class="btn-card-action btn-reupload" (click)="triggerUpload(liv.id)">
                    <i class="pi pi-refresh"></i>
                    Renvoyer
                  </button>
                  <input type="file" [id]="'fu-' + liv.id" class="hidden" (change)="onFile($event, liv.id)">
                }
              </div>
            </div>
          }
        </div>

        <!-- EMPTY STATE -->
        <div class="empty-state-v2" *ngIf="filtered().length === 0">
          <div class="empty-icon-wrap">
            <i class="pi pi-folder-open"></i>
          </div>
          <h3>Aucun livrable trouvé</h3>
          <p>Les documents partagés par vos coachs apparaîtront ici.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .cand-page { padding: 2.5rem; background: #f8fafc; min-height: 100vh; font-family: var(--font-family, 'Inter', sans-serif); }

    /* ── Header ── */
    .cand-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 1.5rem; }
    .cand-title { font-size: 2.25rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.025em; }
    .cand-subtitle { color: #64748b; font-size: 1.05rem; margin-top: 0.4rem; }

    .header-stats { display: flex; align-items: center; gap: 2rem; background: white; padding: 1rem 2rem; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,.04); border: 1px solid #f1f5f9; }
    .stat-item { display: flex; flex-direction: column; align-items: center; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
    .stat-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; }
    .stat-divider { width: 1px; height: 30px; background: #f1f5f9; }

    /* ── Tabs ── */
    .cand-tabs { display: flex; gap: 0.5rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .cand-tab {
      padding: 0.7rem 1.4rem; border-radius: 14px; font-size: 0.9rem; font-weight: 700;
      border: 1px solid #f1f5f9; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
      transition: all .3s cubic-bezier(.4,0,.2,1); background: white; color: #64748b;
    }
    .cand-tab.active { background: #1e293b; color: #fff; box-shadow: 0 4px 12px rgba(30,41,59,.2); border-color: #1e293b; }
    .cand-tab:hover:not(.active) { background: #f1f5f9; transform: translateY(-1px); }
    .tab-count { background: rgba(0,0,0,.06); color: inherit; font-size: .75rem; font-weight: 800; padding: .1rem .55rem; border-radius: 99px; }
    .cand-tab.active .tab-count { background: rgba(255,255,255,.18); }

    /* ── Grid ── */
    .sessions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 2rem; }

    .premium-session-card {
      background: white; border-radius: 24px; padding: 1.5rem; border: 1px solid #f1f5f9;
      box-shadow: 0 4px 20px rgba(0,0,0,.04); transition: all .4s cubic-bezier(.4,0,.2,1);
      cursor: default; position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 1.25rem;
    }
    .premium-session-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,.08); border-color: #e2e8f0; }
    .card-rejected { border-left: 4px solid #ef4444; }

    /* ── Card Top ── */
    .card-top { display: flex; justify-content: space-between; align-items: center; }

    .file-type-pill {
      padding: .45rem 1rem; border-radius: 100px; font-size: .75rem; font-weight: 700;
      display: flex; align-items: center; gap: .45rem; text-transform: uppercase; letter-spacing: .02em; color: #475569;
    }
    .file-type-pill i { font-size: .9rem; }

    .status-dot-wrap { display: flex; align-items: center; gap: .5rem; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .status-text { font-size: .75rem; font-weight: 700; color: #64748b; text-transform: uppercase; }

    /* ── Card Body ── */
    .card-body { display: flex; flex-direction: column; gap: .75rem; flex: 1; }
    .session-title { font-size: 1.15rem; font-weight: 800; color: #1e293b; margin: 0; line-height: 1.3; }
    .session-theme { font-size: .88rem; font-weight: 600; color: #64748b; margin: 0; display: flex; align-items: center; gap: .4rem; }
    .session-theme i { color: #94a3b8; font-size: .8rem; }

    .session-meta { display: flex; flex-direction: column; gap: .4rem; }
    .meta-item { display: flex; align-items: center; gap: .75rem; color: #475569; font-size: .9rem; font-weight: 500; }
    .meta-item i { color: #94a3b8; font-size: .95rem; }

    .coach-info-mini {
      display: flex; align-items: center; gap: 1rem; padding: .85rem 1rem; background: #f8fafc;
      border-radius: 14px; border: 1px solid #f1f5f9;
    }
    .coach-avatar-mini {
      width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center;
      justify-content: center; color: white; font-weight: 800; font-size: 1rem; flex-shrink: 0;
    }
    .coach-details-mini { display: flex; flex-direction: column; min-width: 0; }
    .coach-label { font-size: .62rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
    .coach-name { font-size: .9rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .feedback-box {
      background: #fffbeb; border-left: 3px solid #f59e0b; padding: .75rem 1rem;
      border-radius: 0 12px 12px 0; font-size: .88rem; color: #78350f; display: flex; gap: .6rem; align-items: flex-start;
    }
    .feedback-box i { color: #f59e0b; margin-top: 2px; flex-shrink: 0; }

    /* ── Card Footer ── */
    .card-footer { display: flex; gap: .75rem; margin-top: auto; }
    .btn-card-action {
      flex: 1; padding: .75rem; border-radius: 12px; border: 1px solid #e2e8f0;
      font-weight: 700; font-size: .88rem; cursor: pointer; transition: all .2s;
      display: flex; align-items: center; justify-content: center; gap: .5rem;
    }
    .btn-download { background: white; color: #1e293b; }
    .btn-download:hover { background: #f8fafc; border-color: #cbd5e1; }
    .btn-reupload { background: #1e293b; color: white; border-color: #1e293b; }
    .btn-reupload:hover { background: #0f172a; }

    /* ── Empty State ── */
    .empty-state-v2 {
      text-align: center; padding: 5rem 2rem; background: white; border-radius: 32px;
      border: 2px dashed #e2e8f0; max-width: 600px; margin: 3rem auto;
    }
    .empty-icon-wrap { width: 80px; height: 80px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .empty-icon-wrap i { font-size: 2.5rem; color: #cbd5e1; }
    .empty-state-v2 h3 { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin-bottom: .5rem; }
    .empty-state-v2 p { color: #64748b; font-size: 1rem; }

    /* ── Loading ── */
    .loading-wrap { display: flex; justify-content: center; align-items: center; padding: 6rem; }
    .spinner { width: 48px; height: 48px; border: 5px solid #f1f5f9; border-bottom-color: #1e293b; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .hidden { display: none; }
  `]
})
export class EntrepreneurLivrablesComponent implements OnInit {
  private livrableSvc = inject(LivrableService);
  private authSvc = inject(AuthService);

  tabs = TAB_CFG;
  activeTab = signal<LivTab>('ALL');
  allLivrables = signal<any[]>([]);
  loading = signal(true);
  selectedFiles = signal<Record<string, string>>({});

  filtered = computed(() => {
    const tab = this.activeTab();
    if (tab === 'ALL') return this.allLivrables();
    return this.allLivrables().filter(l => this.mapToGroup(l.statut || l.status) === tab);
  });

  ngOnInit(): void {
    const user = this.authSvc.currentUser$.value;
    if (!user) return;

    this.livrableSvc.getAll({ entrepreneurId: user.id }).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : (res as any)?.data || [];
        this.allLivrables.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading livrables:', err);
        this.allLivrables.set([]);
        this.loading.set(false);
      }
    });
  }

  getTabCount(tab: LivTab): number {
    if (tab === 'ALL') return this.allLivrables().length;
    return this.allLivrables().filter(l => this.mapToGroup(l.statut || l.status) === tab).length;
  }

  mapToGroup(statut: string): LivTab {
    if (['VALIDE', 'APPROVED', 'ACCEPTED'].includes(statut)) return 'VALIDE';
    if (['REJETE', 'REJECTED', 'REVISION'].includes(statut)) return 'REJETE';
    return 'EN_ATTENTE';
  }

  isRejected(statut: string): boolean {
    return ['REJETE', 'REJECTED', 'REVISION'].includes(statut);
  }

  getStatus(statut: string) {
    return STATUS_MAP[statut] || { label: statut, bg: '#F3F4F6', color: '#374151', dot: '#94a3b8' };
  }

  formatDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getFileIcon(fileName: string) {
    const ext = (fileName || '').split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { icon: 'pi-file-pdf', color: '#ef4444', bg: '#fef2f2', label: 'PDF' };
    if (['doc', 'docx'].includes(ext!)) return { icon: 'pi-file-word', color: '#3b82f6', bg: '#eff6ff', label: 'Word' };
    if (['xls', 'xlsx'].includes(ext!)) return { icon: 'pi-file-excel', color: '#10b981', bg: '#f0fdf4', label: 'Excel' };
    if (['ppt', 'pptx'].includes(ext!)) return { icon: 'pi-file', color: '#f97316', bg: '#fff7ed', label: 'PowerPoint' };
    if (['zip', 'rar'].includes(ext!)) return { icon: 'pi-box', color: '#8b5cf6', bg: '#f5f3ff', label: 'Archive' };
    return { icon: 'pi-file', color: '#64748b', bg: '#f8fafc', label: 'Fichier' };
  }

  getCoachColor(name: string): string {
    if (!name) return '#64748b';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];
    return colors[Math.abs(hash) % colors.length];
  }

  triggerUpload(id: string) {
    const el = document.getElementById('fu-' + id) as HTMLInputElement;
    el?.click();
  }

  onFile(event: Event, id: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.selectedFiles.update(s => ({ ...s, [id]: file.name }));
  }

  download(url: string) {
    if (url) {
      const fullUrl = url.startsWith('http') ? url : environment.apiUrl.replace('/api', '') + url;
      window.open(fullUrl, '_blank');
    }
  }
}
