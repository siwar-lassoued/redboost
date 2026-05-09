import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminReclamationService, AdminReclamation } from './admin-reclamation.service';

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
          <h1 class="text-3xl font-black text-gray-900 tracking-tight">Réclamations & Litiges</h1>
          <p class="text-gray-500 mt-1">Supervision des signalements effectués par les coachs</p>
        </div>
        <div class="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black shadow-sm">
          <div class="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
          {{ kpis().enAttente }} À TRAITER
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="rounded-2xl p-5 text-white relative overflow-hidden shadow-xl" style="background: linear-gradient(135deg, #1E293B 0%, #334155 100%);">
          <div class="absolute -right-4 -top-4 rounded-full w-20 h-20 bg-white/10"></div>
          <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <i class="pi pi-inbox text-xl"></i>
          </div>
          <p class="text-[10px] font-bold tracking-widest opacity-80 uppercase mb-1">Total</p>
          <h3 class="text-3xl font-black leading-none mb-1">{{ kpis().total }}</h3>
          <p class="text-xs opacity-70">Réclamations enregistrées</p>
        </div>
        
        <div class="rounded-2xl p-5 text-white relative overflow-hidden shadow-xl" style="background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%);">
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

      <!-- Filters Wrapper -->
      <div class="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2 text-gray-500 mr-2">
          <i class="pi pi-filter text-sm"></i>
          <span class="text-[10px] font-black uppercase tracking-widest">Filtres</span>
        </div>

        <select [(ngModel)]="filterStatus" class="text-gray-800 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-100 cursor-pointer">
          <option value="all">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="TRAITEE">Traitée</option>
          <option value="REJETEE">Rejetée</option>
        </select>

        <select [(ngModel)]="filterType" class="text-gray-800 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-100 cursor-pointer">
          <option value="all">Tous les types</option>
          <option value="RETARD">Retard</option>
          <option value="COMPORTEMENT">Comportement</option>
          <option value="AUTRE">Autre</option>
        </select>
        
        <div class="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl w-64">
          <i class="pi pi-search text-gray-400 text-sm mr-2"></i>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Chercher un nom..." class="w-full text-xs font-bold outline-none bg-transparent">
        </div>
      </div>

      <!-- TABLES SECTION -->
      <div class="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
        <div class="overflow-x-auto min-w-full">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Signalant (Coach)</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Cible (Entrepreneur)</th>
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
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow-sm bg-indigo-500">
                        {{ getInitial(r.coach) }}
                      </div>
                      <div>
                        <p class="text-sm font-black text-gray-900 leading-tight">{{ r.coach?.firstName }} {{ r.coach?.lastName }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow-sm bg-slate-500">
                        {{ getInitial(r.entrepreneur) }}
                      </div>
                      <div>
                        <p class="text-sm font-bold text-gray-900 leading-tight">{{ r.entrepreneur?.firstName }} {{ r.entrepreneur?.lastName }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex flex-col">
                      <span class="text-[10px] font-black text-gray-500 mb-1 uppercase">{{ r.typeReclamation }}</span>
                      <span class="text-sm font-bold text-gray-800">{{ r.sujet }}</span>
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
                  <td colspan="6" class="px-6 py-12 text-center text-gray-400 font-medium">Aucune réclamation trouvée.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- DETAIL MODAL -->
      @if (selectedReclamation()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="selectedReclamation.set(null)">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-[650px]" (click)="$event.stopPropagation()">
            
            <div class="p-6 bg-gray-900 flex items-center justify-between rounded-t-3xl border-b border-gray-800">
              <div>
                <h2 class="text-xl font-black text-white leading-tight">Dossier de Réclamation #{{ selectedReclamation()?.id }}</h2>
                <p class="text-white/60 text-xs font-medium mt-1">{{ selectedReclamation()?.dateReclamation | date:'fullDate' }}</p>
              </div>
              <button (click)="selectedReclamation.set(null)" class="text-white/60 hover:text-white bg-transparent border-none cursor-pointer"><i class="pi pi-times text-xl"></i></button>
            </div>

            <div class="p-6 space-y-6">
              <div class="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div class="text-center w-1/2 border-r border-gray-200 pr-4">
                  <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Signalant (Coach)</p>
                  <p class="text-sm font-black text-indigo-600">{{ selectedReclamation()?.coach?.firstName }} {{ selectedReclamation()?.coach?.lastName }}</p>
                </div>
                <div class="text-center w-1/2 pl-4">
                  <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Cible (Entrepreneur)</p>
                  <p class="text-sm font-black text-slate-700">{{ selectedReclamation()?.entrepreneur?.firstName }} {{ selectedReclamation()?.entrepreneur?.lastName }}</p>
                </div>
              </div>

              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-black uppercase">{{ selectedReclamation()?.typeReclamation }}</span>
                </div>
                <h3 class="text-lg font-black text-gray-900 mb-2">{{ selectedReclamation()?.sujet }}</h3>
                <div class="bg-red-50/50 border-l-4 border-red-500 p-4 rounded-r-xl text-sm text-gray-700 leading-relaxed">
                  {{ selectedReclamation()?.description }}
                </div>
              </div>
            </div>

            <div class="p-6 flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
              <span class="text-xs font-bold text-gray-500 uppercase">Statut actuel: <span class="text-gray-900">{{ selectedReclamation()?.statut }}</span></span>
              
              <div class="flex gap-2">
                @if (selectedReclamation()?.statut !== 'REJETEE') {
                  <button (click)="updateStatus(selectedReclamation()?.id!, 'REJETEE')" class="px-4 py-2 rounded-xl text-xs font-black uppercase bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 transition-all cursor-pointer shadow-sm">
                    Rejeter
                  </button>
                }
                @if (selectedReclamation()?.statut !== 'TRAITEE') {
                  <button (click)="updateStatus(selectedReclamation()?.id!, 'TRAITEE')" class="px-4 py-2 rounded-xl text-xs font-black uppercase bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:scale-105 transition-all cursor-pointer">
                    Marquer comme Traitée
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminReclamationsComponent implements OnInit {
  private svc = inject(AdminReclamationService);

  reclamations = signal<AdminReclamation[]>([]);
  selectedReclamation = signal<AdminReclamation | null>(null);

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
