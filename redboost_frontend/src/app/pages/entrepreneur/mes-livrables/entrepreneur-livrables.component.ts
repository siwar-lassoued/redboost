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
    <div class="p-6 bg-[#F8FAFC] min-h-screen">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-[#1A1A2E] tracking-tight">Mes Livrables</h1>
          <p class="text-gray-500 mt-1 font-medium">{{ allLivrables().length }} livrables soumis</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6 overflow-x-auto pb-1" style="scrollbar-width: none;">
        @for (tab of tabs; track tab.id) {
          <button (click)="activeTab.set(tab.id)"
            class="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap cursor-pointer"
            [style.background]="activeTab() === tab.id ? tab.color : 'white'"
            [style.color]="activeTab() === tab.id ? 'white' : '#6B7280'"
            [style.borderColor]="activeTab() === tab.id ? tab.color : '#E5E7EB'">
            <i class="pi pi-{{tab.icon}} ml-1"></i>
            {{ tab.label }}
            <span class="ml-1 min-w-[20px] h-[20px] rounded-full flex items-center justify-center text-[10px]"
              [style.background]="activeTab() === tab.id ? 'rgba(255,255,255,0.25)' : '#F3F4F6'">
              {{ getTabCount(tab.id) }}
            </span>
          </button>
        }
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <i class="pi pi-spin pi-spinner text-3xl text-gray-300"></i>
        </div>
      } @else {
        <!-- Livrables Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (liv of filtered(); track liv.id) {
            <div class="bg-white rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100 transition-all hover:shadow-2xl hover:-translate-y-0.5">
              <!-- Status header bar -->
              <div class="px-5 py-3 flex items-center justify-between"
                [style.background]="getStatus(liv.statut || liv.status).bg">
                <div class="flex items-center gap-2">
                  <i class="pi pi-{{getStatus(liv.statut || liv.status).icon}}"
                    [style.color]="getStatus(liv.statut || liv.status).color"></i>
                  <span class="text-[10px] font-black uppercase tracking-widest"
                    [style.color]="getStatus(liv.statut || liv.status).color">
                    {{ getStatus(liv.statut || liv.status).label }}
                  </span>
                </div>
                <span class="text-[9px] text-gray-400 font-medium">{{ formatDate(liv.dateSoumission || liv.createdAt) }}</span>
              </div>

              <!-- Content -->
              <div class="p-5">
                <div class="flex items-start gap-3 mb-4">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style="background: linear-gradient(135deg, #1A3A3A, #3aafff)">
                    <i class="pi pi-file-pdf text-white text-xl"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3 class="text-sm font-black text-[#1A1A2E] truncate">{{ liv.titre }}</h3>
                    <p class="text-[10px] text-gray-400 font-medium">{{ liv.type || 'Document' }}</p>
                  </div>
                </div>

                @if (liv.fileName || liv.fichierUrl) {
                  <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-xl mb-3">
                    <i class="pi pi-paperclip text-gray-400"></i>
                    <span class="text-xs text-gray-600 truncate">{{ liv.fileName || 'Fichier soumis' }}</span>
                    @if (liv.fileSize) {
                      <span class="text-[9px] text-gray-400 ml-auto flex-shrink-0">{{ liv.fileSize }}</span>
                    }
                    @if (liv.fichierUrl) {
                      <a [href]="liv.fichierUrl" target="_blank" class="text-sky-500 hover:text-sky-600 ml-auto flex-shrink-0">
                        <i class="pi pi-download"></i>
                      </a>
                    }
                  </div>
                }

                <!-- Coach Comment -->
                @if (liv.commentaire || liv.coachComment) {
                  <div class="p-3 rounded-xl text-xs leading-relaxed italic"
                    style="background: #FFFBEB; border-left: 3px solid #F97316; color: #92400E">
                    "{{ liv.commentaire || liv.coachComment }}"
                  </div>
                }
              </div>

              <!-- Re-upload for rejected -->
              @if (isRejected(liv.statut || liv.status)) {
                <div class="px-5 pb-5">
                  <div class="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:border-[#ff3d91] hover:bg-pink-50/20 transition-all"
                    (click)="triggerUpload(liv.id)">
                    <i class="pi pi-upload text-xl mx-auto mb-1 text-gray-300 block"></i>
                    <p class="text-[9px] text-gray-400">{{ getSelectedFile(liv.id) || 'Soumettre une nouvelle version' }}</p>
                  </div>
                  <input type="file" [id]="'fu-' + liv.id" class="hidden" (change)="onFile($event, liv.id)">
                </div>
              }
            </div>
          }
        </div>

        <!-- Empty State -->
        @if (filtered().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <i class="pi pi-file-excel text-5xl text-gray-200 mb-4 block"></i>
            <p class="text-sm font-black text-gray-400 uppercase tracking-widest">Aucun livrable</p>
            <p class="text-xs text-gray-300 mt-1">Soumettez vos livrables depuis la page Tâches</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
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
}
