import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TacheService } from '../../../core/services/tache.service';
import { LivrableService } from '../../../core/services/livrable.service';
import { AuthService } from '../../../core/services/auth.service';

type KanbanCol = 'A_FAIRE' | 'EN_COURS' | 'TERMINEE';
type TaskRisk = 'HAUTE' | 'CRITIQUE' | 'MOYENNE' | 'BASSE';
type DelStatus = 'EN_ATTENTE' | 'APPROUVE' | 'REJETE' | 'RESOUMIS';

const KANBAN = [
  { id: 'A_FAIRE' as const, label: 'À FAIRE', color: '#6B7280', bg: '#F9FAFB' },
  { id: 'EN_COURS' as const, label: 'EN COURS', color: '#3aafff', bg: '#EFF9FF' },
  { id: 'TERMINEE' as const, label: 'TERMINÉ', color: '#22C55E', bg: '#F0FDF4' },
];

const RISK_CFG: Record<string, { label: string; bg: string; color: string }> = {
  HAUTE:    { label: 'Risque élevé', bg: '#FEE2E2', color: '#DC2626' },
  CRITIQUE: { label: 'Critique',     bg: '#FEE2E2', color: '#DC2626' },
  MOYENNE:  { label: 'Risque moyen', bg: '#FEF3C7', color: '#D97706' },
  BASSE:    { label: 'Faible risque', bg: '#D1FAE5', color: '#059669' },
};

const DEL_CFG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  EN_ATTENTE: { label: 'En attente',        bg: '#FEF9C3', color: '#92400E', icon: 'clock' },
  APPROUVE:   { label: 'Accepté ✓',         bg: '#D1FAE5', color: '#065F46', icon: 'check-circle' },
  REJETE:     { label: 'Révision demandée', bg: '#FEF3C7', color: '#B45309', icon: 'refresh-cw' },
  RESOUMIS:   { label: 'Nouvelle version',  bg: '#EFF6FF', color: '#1D4ED8', icon: 'refresh-cw' },
};

@Component({
  selector: 'rb-entrepreneur-taches',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-[#F8FAFC] min-h-screen">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-[#1A1A2E] tracking-tight">Mes Tâches</h1>
          <p class="text-gray-500 mt-1 font-medium">{{ getRemainingCount() }} tâches restantes</p>
        </div>
        <div class="flex items-center gap-2">
          @for (col of kanbanCols; track col.id) {
            <button (click)="activeTab.set(col.id)"
              class="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all lg:hidden cursor-pointer"
              [style.background]="activeTab() === col.id ? 'linear-gradient(135deg,#1A3A3A,#C0392B)' : '#fff'"
              [style.color]="activeTab() === col.id ? '#fff' : '#6B7280'">
              {{ col.label }}
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <i class="pi pi-spin pi-spinner text-3xl text-gray-300"></i>
        </div>
      } @else {
        <!-- Kanban Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          @for (col of kanbanCols; track col.id) {
            <div class="rounded-3xl p-4 border border-gray-100 shadow-xl shadow-gray-200/50 bg-white"
              [class.hidden]="activeTab() !== 'ALL' && activeTab() !== col.id && isMobileWidth()">
              <!-- Column header -->
              <div class="flex items-center gap-2 mb-4 p-2">
                <div class="w-3 h-3 rounded-full shadow" [style.background]="col.color"></div>
                <span class="text-xs font-black tracking-widest uppercase" [style.color]="col.color">{{ col.label }}</span>
                <span class="ml-auto text-xs bg-gray-100 text-gray-500 min-w-[22px] h-[22px] rounded-full flex items-center justify-center font-black">
                  {{ getColTasks(col.id).length }}
                </span>
              </div>

              <!-- Task Cards -->
              <div class="space-y-3 min-h-[80px]">
                @for (task of getColTasks(col.id); track task.id) {
                  <div class="rounded-2xl border overflow-hidden transition-all shadow-sm hover:shadow-md"
                    [style.borderColor]="'#E5E7EB'" [style.background]="col.bg">
                    <div class="p-4">
                      <p class="text-sm font-black text-[#1A1A2E] leading-snug mb-2">{{ task.titre || task.title }}</p>
                      <div class="space-y-1 mb-3">
                        <p class="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{{ task.sprint || 'Sprint' }}</p>
                        <p class="text-[10px] text-gray-400 flex items-center gap-1">
                          <i class="pi pi-clock text-[10px]"></i>
                          {{ formatDate(task.dateEcheance) }}
                        </p>
                      </div>

                      <!-- Risk + Priority -->
                      <span class="inline-block text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest mb-3"
                        [style.background]="getRisk(task.priorite || task.risk).bg" [style.color]="getRisk(task.priorite || task.risk).color">
                        {{ getRisk(task.priorite || task.risk).label }}
                      </span>

                      <div>
                        <div class="flex justify-between text-[9px] mb-1 font-bold">
                          <span class="text-gray-400 uppercase tracking-wider">Complétion</span>
                          <span [style.color]="col.color">{{ task.completionProb || 0 }}%</span>
                        </div>
                        <div class="w-full bg-white/70 rounded-full h-2 overflow-hidden border border-gray-100">
                          <div class="h-2 rounded-full" [style.width.%]="task.completionProb || 0" [style.background]="col.color"></div>
                        </div>
                      </div>
                    </div>

                    <div class="border-t border-white/60 p-4 pt-3">
                      <!-- Upload zone -->
                      <div class="space-y-2">
                        <p class="text-[9px] text-gray-400 font-black uppercase tracking-widest">Livrable à soumettre</p>
                        <div class="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:border-[#ff3d91] hover:bg-pink-50/20 transition-all"
                          (click)="triggerFileInput(task.id)">
                          <i class="pi pi-upload text-xl mx-auto mb-1 text-gray-300 block"></i>
                          <p class="text-[9px] text-gray-400">{{ getSelectedFile(task.id) || 'Glissez ou cliquez' }}</p>
                        </div>
                        <input type="file" [id]="'fi-' + task.id" class="hidden" (change)="onFile($event, task.id)">
                        <button (click)="submitDeliverable(task.id)" [disabled]="!getSelectedFile(task.id)"
                          class="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black text-white transition-all disabled:opacity-40 cursor-pointer border-none"
                          style="background: linear-gradient(135deg, #1A3A3A, #C0392B)">
                          <i class="pi pi-upload mr-1"></i>
                          Soumettre le livrable
                        </button>
                      </div>
                    </div>
                  </div>
                }
                @if (getColTasks(col.id).length === 0) {
                  <div class="flex items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-2xl">
                    <span class="text-xs text-gray-300 font-black uppercase tracking-widest">Aucune tâche</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class EntrepreneurTachesComponent implements OnInit {
  private tacheSvc = inject(TacheService);
  private authSvc = inject(AuthService);

  kanbanCols = KANBAN;
  activeTab = signal<string>('ALL');
  tasks = signal<any[]>([]);
  loading = signal(true);
  selectedFiles = signal<Record<string, string>>({});

  ngOnInit(): void {
    const user = this.authSvc.currentUser$.value;
    if (!user) return;

    this.tacheSvc.getByUser(user.id).subscribe({
      next: (taches) => {
        const data = Array.isArray(taches) ? taches : [];
        this.tasks.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        this.tasks.set([]);
        this.loading.set(false);
      }
    });
  }

  getRemainingCount(): number {
    return this.tasks().filter(t => t.statut !== 'TERMINEE').length;
  }

  getColTasks(colId: string) {
    return this.tasks().filter(t => {
      // Map statuts to kanban columns
      if (colId === 'A_FAIRE') return t.statut === 'A_FAIRE' || t.statut === 'EN_ATTENTE_VALIDATION';
      if (colId === 'EN_COURS') return t.statut === 'EN_COURS' || t.statut === 'EN_RETARD';
      if (colId === 'TERMINEE') return t.statut === 'TERMINEE';
      return false;
    });
  }

  getRisk(r: string) { return RISK_CFG[r] || RISK_CFG['MOYENNE']; }
  getDel(s: string) { return DEL_CFG[s] || DEL_CFG['EN_ATTENTE']; }
  getSelectedFile(id: string): string { return this.selectedFiles()[id] || ''; }
  isMobileWidth() { return typeof window !== 'undefined' && window.innerWidth < 1024; }

  formatDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  triggerFileInput(id: string) {
    const el = document.getElementById('fi-' + id) as HTMLInputElement;
    el?.click();
  }

  onFile(event: Event, taskId: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.selectedFiles.update(s => ({ ...s, [taskId]: file.name }));
  }

  submitDeliverable(taskId: string) {
    const fileName = this.getSelectedFile(taskId);
    if (!fileName) return;
    // TODO: Integrate with LivrableService.upload() for Cloudinary
    alert(`Livrable "${fileName}" soumis avec succès !`);
    this.selectedFiles.update(s => ({ ...s, [taskId]: '' }));
  }
}
