import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
// Triggering rebuild after interface update
import { FormsModule } from '@angular/forms';
import { AdminReclamationService } from './admin-reclamation.service';

export interface AdminReclamation {
  id: number;
  coach: any;
  entrepreneur: any;
  sujet: string;
  typeReclamation: string;
  description: string;
  statut: string;
  dateReclamation: string;
  roleEmetteur?: string;
  programmeName?: string;
  thematiqueName?: string;
  sessionDetails?: string;
}

@Component({
  selector: 'rb-admin-reclamations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-background min-h-screen font-sans">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-gray-900 tracking-tight">Réclamations</h1>
          <p class="text-gray-500 mt-1">Supervision des signalements effectués par les coachs et entrepreneurs</p>
        </div>
        <div class="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black shadow-sm">
          <div class="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
          {{ kpis().enAttente }} À TRAITER
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="rounded-2xl p-5 text-white relative overflow-hidden shadow-xl" style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);">
          <div class="absolute -right-4 -top-4 rounded-full w-20 h-20 bg-white/10"></div>
          <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <i class="pi pi-inbox text-xl"></i>
          </div>
          <p class="text-[10px] font-bold tracking-widest opacity-80 uppercase mb-1">Total</p>
          <h3 class="text-3xl font-black leading-none mb-1">{{ kpis().total }}</h3>
          <p class="text-xs opacity-70">Réclamations enregistrées</p>
        </div>
        
        <div class="rounded-2xl p-5 text-white relative overflow-hidden shadow-xl" style="background: linear-gradient(135deg, #ec407a 0%, #d81b60 100%);">
          <div class="absolute -right-4 -top-4 rounded-full w-20 h-20 bg-white/10"></div>
          <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <i class="pi pi-exclamation-circle text-xl"></i>
          </div>
          <p class="text-[10px] font-bold tracking-widest opacity-80 uppercase mb-1">En attente</p>
          <h3 class="text-3xl font-black leading-none mb-1">{{ kpis().enAttente }}</h3>
          <p class="text-xs opacity-70">Nécessitent votre attention</p>
        </div>
        
        <div class="rounded-2xl p-5 text-white relative overflow-hidden shadow-xl" style="background: linear-gradient(135deg, #10B981 0%, #047857 100%);">
          <div class="absolute -right-4 -top-4 rounded-full w-20 h-20 bg-white/10"></div>
          <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <i class="pi pi-check-circle text-xl"></i>
          </div>
          <p class="text-[10px] font-bold tracking-widest opacity-80 uppercase mb-1">Traitées</p>
          <h3 class="text-3xl font-black leading-none mb-1">{{ kpis().traitees }}</h3>
          <p class="text-xs opacity-70">Dossiers clos</p>
        </div>
      </div>

      <!-- Tabs & Filters Wrapper -->
      <div class="bg-white rounded-2xl p-2 mb-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex p-1 bg-gray-50 rounded-xl">
           <button (click)="activeTab.set('COACH')" [class.bg-white]="activeTab()==='COACH'" [class.shadow-sm]="activeTab()==='COACH'" class="px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer" [class.text-[#ec407a]]="activeTab()==='COACH'" [class.text-gray-400]="activeTab()!=='COACH'">
             <i class="pi pi-user-edit mr-2"></i>Coachs
           </button>
           <button (click)="activeTab.set('ENTREPRENEUR')" [class.bg-white]="activeTab()==='ENTREPRENEUR'" [class.shadow-sm]="activeTab()==='ENTREPRENEUR'" class="px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer" [class.text-[#2c3e50]]="activeTab()==='ENTREPRENEUR'" [class.text-gray-400]="activeTab()!=='ENTREPRENEUR'">
             <i class="pi pi-briefcase mr-2"></i>Entrepreneurs
           </button>
        </div>

        <div class="flex flex-wrap items-center gap-3 pr-4">
          <select [(ngModel)]="filterStatus" class="text-gray-800 px-3 py-2 bg-gray-50 border-none rounded-lg text-[10px] font-black uppercase tracking-wider focus:ring-2 focus:ring-red-100 cursor-pointer">
            <option value="all">Statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="TRAITEE">Traitée</option>
            <option value="REJETEE">Rejetée</option>
          </select>

          <select [(ngModel)]="filterType" class="text-gray-800 px-3 py-2 bg-gray-50 border-none rounded-lg text-[10px] font-black uppercase tracking-wider focus:ring-2 focus:ring-red-100 cursor-pointer">
            <option value="all">Types</option>
            <option value="RETARD">Retard</option>
            <option value="COMPORTEMENT">Comportement</option>
            <option value="AUTRE">Autre</option>
          </select>
          
          <div class="flex items-center px-3 py-2 bg-gray-50 rounded-lg w-48">
            <i class="pi pi-search text-gray-400 text-xs mr-2"></i>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Chercher..." class="w-full text-[10px] font-bold outline-none bg-transparent">
          </div>
        </div>
      </div>

      <!-- TABLES SECTION -->
      <div class="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
        <div class="overflow-x-auto min-w-full">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {{ activeTab() === 'COACH' ? 'Signalant (Coach)' : 'Signalant (Entrepreneur)' }}
                </th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {{ activeTab() === 'COACH' ? 'Cible (Entrepreneur)' : 'Cible (Coach)' }}
                </th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Type & Sujet</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Date</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Statut</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (r of filtered(); track r.id) {
                <tr class="hover:bg-gray-50 transition-colors" [class.bg-red-50]="r.statut === 'EN_ATTENTE'">
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow-sm"
                           [class.bg-[#ec407a]]="activeTab()==='COACH'" [class.bg-[#2c3e50]]="activeTab()==='ENTREPRENEUR'">
                        {{ getInitial(activeTab()==='COACH' ? r.coach : r.entrepreneur) }}
                      </div>
                      <div>
                        <p class="text-sm font-black text-gray-900 leading-tight">
                            {{ activeTab()==='COACH' ? (r.coach?.firstName || '') + ' ' + (r.coach?.lastName || '') : (r.entrepreneur?.firstName || '') + ' ' + (r.entrepreneur?.lastName || '') }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow-sm"
                           [class.bg-slate-500]="activeTab()==='COACH'" [class.bg-indigo-400]="activeTab()==='ENTREPRENEUR'">
                        {{ getInitial(activeTab()==='COACH' ? r.entrepreneur : r.coach) }}
                      </div>
                      <div>
                        <p class="text-sm font-bold text-gray-900 leading-tight">
                            {{ activeTab()==='COACH' ? (r.entrepreneur?.firstName || '') + ' ' + (r.entrepreneur?.lastName || '') : (r.coach?.firstName || '') + ' ' + (r.coach?.lastName || '') }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex flex-col">
                      <span class="text-[10px] font-black text-gray-500 mb-1 uppercase">{{ r.typeReclamation }}</span>
                      <span class="text-sm font-bold text-gray-800">{{ r.sujet }}</span>
                      <div class="flex gap-1 mt-1">
                          <span *ngIf="r.programmeName" class="px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded text-[9px] font-bold border border-gray-100">{{r.programmeName}}</span>
                          <span *ngIf="r.thematiqueName" class="px-1.5 py-0.5 bg-[#e2e8f0] text-[#2c3e50] rounded text-[9px] font-bold border border-[#cbd5e1]">{{r.thematiqueName}}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-5 text-[11px] text-gray-500 font-medium">{{ r.dateReclamation | date:'dd/MM/yyyy' }}</td>
                  <td class="px-6 py-5">
                    @if (r.statut === 'EN_ATTENTE') { <span class="px-2 py-1 rounded-md bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-tighter shadow-sm border border-red-200">En attente</span> }
                    @else if (r.statut === 'TRAITEE') { <span class="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-tighter shadow-sm border border-emerald-200">Traitée</span> }
                    @else { <span class="px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-tighter border border-gray-200">Rejetée</span> }
                  </td>
                  <td class="px-6 py-5 text-center">
                    <button (click)="openDetailModal(r)" class="px-3 py-1.5 rounded-lg text-xs font-black bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm transition-all cursor-pointer">
                      Examiner
                    </button>
                  </td>
                </tr>
              }
              @if (filtered().length === 0) {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-gray-400 font-medium">Aucune réclamation trouvée pour cette catégorie.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- DETAIL MODAL -->
      @if (selectedReclamation()) {
        <div class="modal-overlay" (click)="selectedReclamation.set(null)">
          <div class="modal-box" style="max-width: 650px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-info">
                <h2 class="modal-name">Dossier de Réclamation #{{ selectedReclamation()?.id }}</h2>
                <p style="font-size:12px;color:#6B7280;margin:4px 0 0;">{{ selectedReclamation()?.dateReclamation | date:'fullDate' }}</p>
              </div>
              <button (click)="selectedReclamation.set(null)" class="modal-close"><i class="pi pi-times"></i></button>
            </div>

            <div class="modal-body" style="background: #F9FAFB; max-height: 70vh; overflow-y: auto;">
              <div style="background:#fff;border-radius:16px;padding:20px;border:1px solid #E5E7EB;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#ec407a,#d81b60);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:14px;">
                      {{ selectedReclamation()?.roleEmetteur === 'COACH' ? (selectedReclamation()?.coach?.firstName || 'C').charAt(0).toUpperCase() : (selectedReclamation()?.entrepreneur?.firstName || 'E').charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p style="font-weight:800;font-size:14px;color:#1A1A2E;margin:0;">
                        {{ selectedReclamation()?.roleEmetteur === 'COACH' ? (selectedReclamation()?.coach?.firstName || '') + ' ' + (selectedReclamation()?.coach?.lastName || '') : (selectedReclamation()?.entrepreneur?.firstName || '') + ' ' + (selectedReclamation()?.entrepreneur?.lastName || '') }}
                      </p>
                      <p style="font-size:11px;color:#9CA3AF;margin:0;">Signalant ({{ selectedReclamation()?.roleEmetteur === 'COACH' ? 'Coach' : 'Entrepreneur' }})</p>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-3">
                    <div style="text-align: right;">
                      <p style="font-weight:800;font-size:14px;color:#1A1A2E;margin:0;">
                        {{ selectedReclamation()?.roleEmetteur === 'COACH' ? (selectedReclamation()?.entrepreneur?.firstName || '') + ' ' + (selectedReclamation()?.entrepreneur?.lastName || '') : (selectedReclamation()?.coach?.firstName || '') + ' ' + (selectedReclamation()?.coach?.lastName || '') }}
                      </p>
                      <p style="font-size:11px;color:#9CA3AF;margin:0;">Cible ({{ selectedReclamation()?.roleEmetteur === 'COACH' ? 'Entrepreneur' : 'Coach' }})</p>
                    </div>
                    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#2c3e50,#34495e);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:14px;">
                      {{ selectedReclamation()?.roleEmetteur === 'COACH' ? (selectedReclamation()?.entrepreneur?.firstName || 'E').charAt(0).toUpperCase() : (selectedReclamation()?.coach?.firstName || 'C').charAt(0).toUpperCase() }}
                    </div>
                  </div>
                </div>

                <div style="margin-bottom: 16px;">
                  <div style="display:flex;gap:8px;margin-bottom:12px;">
                    <span style="font-size:10px;font-weight:900;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.05em;background:#F3F4F6;color:#4B5563;">{{ selectedReclamation()?.typeReclamation }}</span>
                    <span *ngIf="selectedReclamation()?.programmeName" style="font-size:10px;font-weight:900;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.05em;background:#fce4ec;color:#ec407a;">Prog: {{ selectedReclamation()?.programmeName }}</span>
                    <span *ngIf="selectedReclamation()?.thematiqueName" style="font-size:10px;font-weight:900;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.05em;background:#e2e8f0;color:#2c3e50;">Thème: {{ selectedReclamation()?.thematiqueName }}</span>
                  </div>
                  <h3 style="font-size: 16px; font-weight: 800; color: #1A1A2E; margin: 0 0 8px 0;">{{ selectedReclamation()?.sujet }}</h3>
                  
                  <div *ngIf="selectedReclamation()?.sessionDetails" style="background:#FFFBEB;border:1px solid #FEF3C7;border-radius:12px;padding:12px;margin-bottom:12px;">
                    <p style="font-size:10px;font-weight:800;color:#D97706;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Session concernée</p>
                    <p style="font-size:13px;font-weight:600;color:#92400E;margin:0;">{{ selectedReclamation()?.sessionDetails }}</p>
                  </div>
                  
                  <div style="background:#f8f9fa;border-radius:12px;padding:16px;border-left:4px solid #ef4444;">
                    <p style="font-size:10px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">Description</p>
                    <p style="font-size:14px;font-weight:500;color:#374151;margin:0;line-height:1.6;">{{ selectedReclamation()?.description }}</p>
                  </div>
                </div>

              </div>
            </div>

            <div class="modal-footer">
               <span style="font-size:12px;font-weight:700;color:#6B7280;margin-right:auto;">Statut actuel: <span style="color:#1A1A2E;">{{ selectedReclamation()?.statut }}</span></span>
               
               @if (selectedReclamation()?.statut !== 'REJETEE') {
                 <button (click)="updateStatus(selectedReclamation()?.id!, 'REJETEE')" class="btn-close-modal-kpi">Rejeter</button>
               }
               @if (selectedReclamation()?.statut !== 'TRAITEE') {
                 <button (click)="updateStatus(selectedReclamation()?.id!, 'TRAITEE')" class="btn-gradient-kpi" style="background:#10B981;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                   <i class="pi pi-check"></i> Marquer comme Traitée
                 </button>
               }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep .pi { font-size: inherit; }
    .modal-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
    .modal-box { background: #fff; border-radius: 24px; width: 100%; max-width: 800px; max-height: 90vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15); display: flex; flex-direction: column; }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid #F3F4F6; background: #fff; display: flex; align-items: center; justify-content: space-between; }
    .modal-header-info { flex: 1; }
    .modal-name { font-weight: 800; font-size: 20px; color: #1A1A2E; margin: 0; }
    .modal-close { width: 36px; height: 36px; border-radius: 12px; border: none; background: #F3F4F6; cursor: pointer; color: #6B7280; transition: all .2s; display: flex; align-items: center; justify-content: center; }
    .modal-close:hover { background: #E5E7EB; color: #1A1A2E; }
    .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
    .modal-footer { padding: 20px 24px; border-top: 1px solid #F3F4F6; background: #fff; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .btn-close-modal-kpi { padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; color: #6B7280; background: #F3F4F6; border: none; cursor: pointer; transition: all .2s; }
    .btn-close-modal-kpi:hover { background: #E5E7EB; color: #1A1A2E; }
    .btn-gradient-kpi {
      display: flex; align-items: center; gap: 8px; padding: 10px 20px;
      border-radius: 12px; font-size: 14px; font-weight: 600; color: #fff;
      background: #ec407a; border: none; cursor: pointer;
      transition: all .2s; box-shadow: 0 4px 12px rgba(236, 64, 122, 0.3);
    }
    .btn-gradient-kpi:hover:not(:disabled) { background: #d81b60; transform: translateY(-1px); }
  `]
})
export class AdminReclamationsComponent implements OnInit {
  private svc = inject(AdminReclamationService);

  reclamations = signal<AdminReclamation[]>([]);
  selectedReclamation = signal<AdminReclamation | null>(null);
  activeTab = signal<'COACH' | 'ENTREPRENEUR'>('COACH');

  filterStatus = 'all';
  filterType = 'all';
  searchQuery = '';

  ngOnInit(): void {
    this.svc.getAllReclamations().subscribe(r => this.reclamations.set(r));
  }

  kpis = computed(() => {
    const list = this.reclamations();
    return {
      total: list.length,
      enAttente: list.filter(r => r.statut === 'EN_ATTENTE').length,
      traitees: list.filter(r => r.statut === 'TRAITEE').length
    };
  });

  filtered = computed(() => {
    return this.reclamations().filter(r => {
      // Grouping by active tab (roleEmetteur)
      const role = r.roleEmetteur || 'COACH'; // Fallback to COACH for legacy data
      if (role !== this.activeTab()) return false;

      if (this.filterStatus !== 'all' && r.statut !== this.filterStatus) return false;
      if (this.filterType !== 'all' && r.typeReclamation !== this.filterType) return false;
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const n1 = `${r.coach?.firstName} ${r.coach?.lastName}`.toLowerCase();
        const n2 = `${r.entrepreneur?.firstName} ${r.entrepreneur?.lastName}`.toLowerCase();
        if (!n1.includes(q) && !n2.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.dateReclamation).getTime() - new Date(a.dateReclamation).getTime());
  });

  getInitial(user: any): string {
    if (!user) return '?';
    return user.firstName ? user.firstName.charAt(0).toUpperCase() : '?';
  }

  openDetailModal(r: AdminReclamation) {
    this.selectedReclamation.set(r);
  }

  updateStatus(id: number, status: string) {
    this.svc.updateStatus(id, status).subscribe(updated => {
      this.reclamations.update(all => all.map(r => r.id === id ? { ...r, statut: status } : r));
      if (this.selectedReclamation()?.id === id) {
        this.selectedReclamation.set({ ...this.selectedReclamation()!, statut: status });
      }
    });
  }
}
