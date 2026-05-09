import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LivrableService } from '../../../core/services/livrable.service';
import { AuthService } from '../../../core/services/auth.service';

type LivTab = 'ALL' | 'EN_ATTENTE' | 'VALIDE' | 'REJETE';

const TAB_CFG: { id: LivTab; label: string; icon: string; color: string }[] = [
  { id: 'ALL',        label: 'Tous',      icon: 'files',       color: '#1A3A3A' },
  { id: 'EN_ATTENTE', label: 'En attente', icon: 'clock',       color: '#f59e0b' },
  { id: 'VALIDE',     label: 'Approuvés',  icon: 'check-circle', color: '#22c55e' },
  { id: 'REJETE',     label: 'Rejetés',    icon: 'x-circle',    color: '#ef4444' },
];

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  EN_ATTENTE:     { label: 'En attente',    bg: '#FEF9C3', color: '#92400E', icon: 'clock' },
  SOUMIS:         { label: 'Soumis',        bg: '#EFF6FF', color: '#2563EB', icon: 'send' },
  PENDING:        { label: 'En attente',    bg: '#FEF9C3', color: '#92400E', icon: 'clock' },
  PENDING_REVIEW: { label: 'En revue',      bg: '#FEF3C7', color: '#D97706', icon: 'eye' },
  SUBMITTED:      { label: 'Soumis',        bg: '#EFF6FF', color: '#2563EB', icon: 'send' },
  VALIDE:         { label: 'Approuvé ✓',    bg: '#D1FAE5', color: '#065F46', icon: 'check-circle' },
  APPROVED:       { label: 'Approuvé ✓',    bg: '#D1FAE5', color: '#065F46', icon: 'check-circle' },
  ACCEPTED:       { label: 'Accepté ✓',     bg: '#D1FAE5', color: '#065F46', icon: 'check-circle' },
  REJETE:         { label: 'Rejeté',        bg: '#FEE2E2', color: '#991B1B', icon: 'x-circle' },
  REJECTED:       { label: 'Rejeté',        bg: '#FEE2E2', color: '#991B1B', icon: 'x-circle' },
  REVISION:       { label: 'Révision',      bg: '#FEF3C7', color: '#B45309', icon: 'refresh-cw' },
  RESUBMITTED:    { label: 'Resoumis',      bg: '#EFF6FF', color: '#1D4ED8', icon: 'refresh-cw' },
};

@Component({
  selector: 'rb-entrepreneur-livrables',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="livrables-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">Mes Livrables</h1>
          <p class="page-subtitle">Retrouvez tous vos documents et livrables d'accompagnement</p>
        </div>
        <div class="header-stats">
           <div class="stat-pill">
             <span class="stat-count">{{ allLivrables().length }}</span>
             <span class="stat-label">Total</span>
           </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <div class="tabs-scroll">
          @for (tab of tabs; track tab.id) {
            <button (click)="activeTab.set(tab.id)"
              class="premium-tab"
              [class.active]="activeTab() === tab.id"
              [style.--tab-color]="tab.color">
              <i class="pi pi-{{tab.icon}}"></i>
              <span>{{ tab.label }}</span>
              <span class="tab-badge">{{ getTabCount(tab.id) }}</span>
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="premium-loader"></div>
        </div>
      } @else {
        <!-- Grid -->
        <div class="livrables-grid" *ngIf="filtered().length > 0">
          @for (liv of filtered(); track liv.id) {
            <div class="premium-liv-card" [class.rejected]="isRejected(liv.statut || liv.status)">
              <div class="card-glass-header" [style.background]="getStatus(liv.statut || liv.status).bg + '80'">
                 <div class="status-chip" [style.color]="getStatus(liv.statut || liv.status).color" [style.background]="getStatus(liv.statut || liv.status).bg">
                    <i class="pi pi-{{getStatus(liv.statut || liv.status).icon}}"></i>
                    <span>{{ getStatus(liv.statut || liv.status).label }}</span>
                 </div>
                 <span class="date-tag">{{ formatDate(liv.dateSoumission || liv.createdAt) }}</span>
              </div>

              <div class="card-content">
                <div class="file-preview-row">
                   <div class="file-icon-box" [style.background]="getFileIconColor(liv.titre || '').bg">
                      <i class="pi" [class]="getFileIconColor(liv.titre || '').icon" [style.color]="getFileIconColor(liv.titre || '').color"></i>
                   </div>
                   <div class="file-meta">
                      <h3 class="liv-title">{{ liv.titre }}</h3>
                      <p class="liv-type">{{ liv.type || 'Document officiel' }}</p>
                   </div>
                </div>

                <div class="file-attachment" *ngIf="liv.fileName || liv.fichierUrl">
                   <div class="attachment-info">
                      <i class="pi pi-paperclip"></i>
                      <span class="file-name-text">{{ liv.fileName || 'Document de session' }}</span>
                      <span class="file-size-text" *ngIf="liv.fileSize">{{ liv.fileSize }}</span>
                   </div>
                   <button *ngIf="liv.fichierUrl" (click)="download(liv.fichierUrl)" class="btn-download-circle" matTooltip="Télécharger">
                      <i class="pi pi-download"></i>
                   </button>
                </div>

                @if (liv.commentaire || liv.coachComment) {
                  <div class="coach-feedback">
                    <div class="feedback-header">
                       <i class="pi pi-comment"></i>
                       <span>Note du coach</span>
                    </div>
                    <p class="feedback-text">"{{ liv.commentaire || liv.coachComment }}"</p>
                  </div>
                }
              </div>

              @if (isRejected(liv.statut || liv.status)) {
                <div class="card-action-zone">
                  <button class="btn-reupload" (click)="triggerUpload(liv.id)">
                    <i class="pi pi-refresh"></i>
                    Soumettre une nouvelle version
                  </button>
                  <input type="file" [id]="'fu-' + liv.id" class="hidden" (change)="onFile($event, liv.id)">
                </div>
              }
            </div>
          }
        </div>

        <!-- Empty -->
        @if (filtered().length === 0) {
          <div class="premium-empty-state">
            <div class="empty-illustration">
              <i class="pi pi-folder-open"></i>
            </div>
            <h2>Aucun livrable trouvé</h2>
            <p>Les documents partagés par vos coachs apparaîtront ici.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .livrables-page {
      padding: 2rem;
      background: #f8fafc;
      min-height: calc(100vh - 80px);
      font-family: 'Inter', sans-serif;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
      letter-spacing: -1px;
    }

    .page-subtitle {
      color: #64748b;
      font-size: 1.1rem;
      margin-top: 0.5rem;
    }

    .stat-pill {
      background: white;
      padding: 0.75rem 1.5rem;
      border-radius: 99px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #f1f5f9;
    }

    .stat-count {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: 99px;
      font-size: 0.9rem;
    }

    .stat-label {
      color: #64748b;
      font-weight: 600;
      font-size: 0.9rem;
    }

    /* Tabs */
    .tabs-container {
      margin-bottom: 2.5rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }

    .tabs-scroll {
      display: flex;
      gap: 1rem;
    }

    .premium-tab {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1.5rem;
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .premium-tab i {
      font-size: 1rem;
      color: var(--tab-color);
    }

    .premium-tab span {
      font-weight: 600;
      color: #64748b;
    }

    .tab-badge {
      background: #f1f5f9;
      color: #64748b;
      font-size: 0.75rem;
      padding: 0.1rem 0.5rem;
      border-radius: 99px;
      min-width: 20px;
      text-align: center;
    }

    .premium-tab:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      border-color: #e2e8f0;
    }

    .premium-tab.active {
      background: var(--tab-color);
      border-color: var(--tab-color);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .premium-tab.active i,
    .premium-tab.active span {
      color: white;
    }

    .premium-tab.active .tab-badge {
      background: rgba(255,255,255,0.2);
      color: white;
    }

    /* Grid & Cards */
    .livrables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 2rem;
    }

    .premium-liv-card {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid #f1f5f9;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
    }

    .premium-liv-card:hover {
      transform: translateY(-8px) scale(1.01);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
      border-color: #e2e8f0;
    }

    .card-glass-header {
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      backdrop-filter: blur(8px);
    }

    .status-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 99px;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .date-tag {
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
    }

    .card-content {
      padding: 1.5rem;
      flex: 1;
    }

    .file-preview-row {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .file-icon-box {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .file-icon-box i {
      font-size: 1.75rem;
    }

    .liv-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.3;
    }

    .liv-type {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0.25rem 0 0;
    }

    .file-attachment {
      background: #f8fafc;
      border: 1px dashed #e2e8f0;
      border-radius: 16px;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .attachment-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      overflow: hidden;
    }

    .attachment-info i {
      color: #64748b;
      font-size: 1rem;
    }

    .file-name-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: #334155;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size-text {
      font-size: 0.75rem;
      color: #94a3b8;
      background: white;
      padding: 0.1rem 0.5rem;
      border-radius: 4px;
    }

    .btn-download-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #0f172a;
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-download-circle:hover {
      transform: scale(1.1);
      background: #334155;
    }

    .coach-feedback {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 1rem;
      border-radius: 0 12px 12px 0;
    }

    .feedback-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #92400e;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }

    .feedback-text {
      font-size: 0.95rem;
      color: #78350f;
      margin: 0;
      font-style: italic;
      line-height: 1.5;
    }

    .card-action-zone {
      padding: 1rem 1.5rem 1.5rem;
      border-top: 1px solid #f1f5f9;
    }

    .btn-reupload {
      width: 100%;
      background: #0f172a;
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-reupload:hover {
      background: #334155;
      transform: translateY(-2px);
    }

    /* Empty State */
    .premium-empty-state {
      background: white;
      border-radius: 32px;
      padding: 5rem 2rem;
      text-align: center;
      border: 1px dashed #e2e8f0;
      margin-top: 2rem;
    }

    .empty-illustration {
      width: 120px;
      height: 120px;
      background: #f8fafc;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 2rem;
    }

    .empty-illustration i {
      font-size: 3rem;
      color: #94a3b8;
    }

    .premium-empty-state h2 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .premium-empty-state p {
      color: #64748b;
      font-size: 1.1rem;
      margin-top: 1rem;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 5rem;
    }

    .premium-loader {
      width: 48px;
      height: 48px;
      border: 5px solid #f1f5f9;
      border-bottom-color: #0f172a;
      border-radius: 50%;
      display: inline-block;
      box-sizing: border-box;
      animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

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
        const data = Array.isArray(res) ? res : (res as any).data || [];
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
    return STATUS_MAP[statut] || { label: statut, bg: '#F3F4F6', color: '#374151', icon: 'file' };
  }

  formatDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getSelectedFile(id: string): string { return this.selectedFiles()[id] || ''; }

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

  getFileIconColor(fileName: string) {
    const ext = (fileName || '').split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { icon: 'pi-file-pdf', color: '#ef4444', bg: '#fef2f2' };
    if (['doc', 'docx'].includes(ext!)) return { icon: 'pi-file-word', color: '#3b82f6', bg: '#eff6ff' };
    if (['xls', 'xlsx'].includes(ext!)) return { icon: 'pi-file-excel', color: '#10b981', bg: '#f0fdf4' };
    return { icon: 'pi-file', color: '#94a3b8', bg: '#f8fafc' };
  }
}
