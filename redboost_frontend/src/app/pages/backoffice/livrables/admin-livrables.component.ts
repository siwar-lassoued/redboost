import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LivrableAdminService, LivrableAdmin } from './livrable-admin.service';

@Component({
  selector: 'rb-admin-livrables',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-background min-h-screen font-sans">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-gray-900 tracking-tight">Livrables Coach</h1>
          <p class="text-gray-500 mt-1">Suivi des rapports et documents soumis par les coaches</p>
        </div>
        <button (click)="handleExport()" class="flex items-center gap-2 px-6 py-3 bg-pink-500 text-white border-none cursor-pointer rounded-2xl text-sm font-black shadow-xl shadow-pink-500/20 hover:scale-[1.02] transition-all">
          <i class="pi pi-download text-sm"></i>
          Exporter Excel
        </button>
      </div>

      <!-- Stats KPI -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        @for (stat of stats(); track stat.label) {
          <div class="rounded-2xl p-5 text-white relative overflow-hidden shadow-xl" [style.background]="stat.gradient" [style.boxShadow]="stat.shadow">
            <div class="absolute -right-4 -top-4 rounded-full w-16 h-16 bg-white/10"></div>
            <p class="text-[10px] font-bold tracking-widest opacity-80 uppercase mb-1">{{ stat.label }}</p>
            <h3 class="text-4xl font-black leading-none mb-1">{{ stat.value }}</h3>
            <p class="text-xs opacity-70">{{ stat.sub }}</p>
          </div>
        }
      </div>

      <!-- Filters Wrapper -->
      <div class="bg-white rounded-3xl p-6 mb-8 shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div class="relative flex-1 min-w-[200px]">
          <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input [(ngModel)]="searchQuery" type="text" placeholder="Rechercher un coach ou un titre..." 
            class="text-gray-900 w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-300 transition-all">
        </div>

        <select [(ngModel)]="filterProgram" class="text-gray-900 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-pink-100 cursor-pointer">
          <option value="all">Tous les programmes</option>
          @for (p of programs(); track p) { <option [value]="p">{{ p }}</option> }
        </select>

        <select [(ngModel)]="filterType" class="text-gray-900 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-pink-100 cursor-pointer">
          <option value="all">Tous les types</option>
          @for (t of types(); track t) { <option [value]="t">{{ t }}</option> }
        </select>

        <select [(ngModel)]="filterStatus" class="text-gray-900 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-pink-100 cursor-pointer">
          <option value="all">Tous les statuts</option>
          <option value="SUBMITTED">Soumis</option>
          <option value="PENDING_REVIEW">En révision</option>
          <option value="APPROVED">Approuvé</option>
          <option value="REJECTED">Refusé</option>
        </select>
      </div>

      <!-- Table Section -->
      <div class="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
        <div class="overflow-x-auto min-w-full">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Coach</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Programme</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Entrepreneur</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Type</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Titre</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Statut</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (l of filtered(); track l.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-5">
                    <div>
                      <p class="text-sm font-black text-gray-900 leading-tight">{{ l.coachName }}</p>
                      <p class="text-[11px] text-gray-500 font-medium">{{ l.coachEmail }}</p>
                    </div>
                  </td>
                  <td class="px-6 py-5 text-sm font-medium text-gray-600">{{ l.programme?.nom }}</td>
                  <td class="px-6 py-5 text-sm font-bold text-gray-900">{{ l.entrepreneur?.firstName }} {{ l.entrepreneur?.lastName }}</td>
                  <td class="px-6 py-5">
                    <span class="text-[10px] px-2 py-1 rounded-lg bg-gray-100 text-gray-600 font-black uppercase tracking-tighter">{{ l.type }}</span>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-2">
                      <i class="pi pi-file text-gray-400"></i>
                      <p class="text-sm font-black text-gray-900">{{ l.titre }}</p>
                    </div>
                  </td>
                  <td class="px-6 py-5 text-center">
                    <span class="text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest"
                      [style.background]="getStatusConfig(l.statut).bg" [style.color]="getStatusConfig(l.statut).color">
                      {{ getStatusConfig(l.statut).label }}
                    </span>
                  </td>
                  <td class="px-6 py-5 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button class="p-2 hover:bg-gray-100 bg-transparent border-none cursor-pointer rounded-xl text-gray-400 hover:text-sky-500 transition-all" title="Voir"><i class="pi pi-eye text-sm"></i></button>
                      <button class="p-2 hover:bg-gray-100 bg-transparent border-none cursor-pointer rounded-xl text-gray-400 hover:text-emerald-500 transition-all" title="Télécharger"><i class="pi pi-download text-sm"></i></button>
                    </div>
                  </td>
                </tr>
              }
              @if (filtered().length === 0) {
                <tr>
                  <td colSpan="7" class="px-6 py-20 text-center">
                    <div class="flex flex-col items-center gap-3 opacity-40">
                      <i class="pi pi-folder-open text-5xl text-gray-500"></i>
                      <p class="text-sm font-black uppercase tracking-widest text-gray-500">Aucun livrable trouvé</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer Info -->
      @if (filtered().length > 0) {
        <div class="mt-6 text-center">
          <p class="text-xs text-gray-500 font-medium">Affichage de <span class="text-pink-500 font-black">{{ filtered().length }}</span> livrable(s) sur {{ livrables().length }} au total</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class AdminLivrablesComponent implements OnInit {
  private svc = inject(LivrableAdminService);

  livrables = signal<LivrableAdmin[]>([]);
  searchQuery = '';
  filterProgram = 'all';
  filterStatus = 'all';
  filterType = 'all';

  ngOnInit(): void {
    this.svc.getAllLivrables().subscribe(r => this.livrables.set(r || []));
  }

  programs = computed(() => Array.from(new Set(this.livrables().filter(l => l.programme?.nom).map(l => l.programme!.nom as string))));
  types = computed(() => Array.from(new Set(this.livrables().filter(l => l.type).map(l => l.type as string))));

  filtered = computed(() => {
    return this.livrables().filter(l => {
      const matchSearch = !this.searchQuery ||
        (l.coachName?.toLowerCase().includes(this.searchQuery.toLowerCase()) ?? false) ||
        l.titre.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchProgram = this.filterProgram === 'all' || l.programme?.nom === this.filterProgram;
      const matchStatus = this.filterStatus === 'all' || l.statut === this.filterStatus;
      const matchType = this.filterType === 'all' || l.type === this.filterType;
      return matchSearch && matchProgram && matchStatus && matchType;
    });
  });

  stats = computed(() => {
    const list = this.livrables();
    return [
      { label: 'LIVRABLES', sub: 'au total', value: list.length, gradient: 'linear-gradient(135deg,#1A3A3A 0%,#3aafff 100%)', shadow: '0 4px 16px rgba(58,175,255,0.22)' },
      { label: 'EN ATTENTE', sub: 'à réviser', value: list.filter(l => l.statut === 'PENDING_REVIEW' || l.statut === 'SUBMITTED' || l.statut === 'EN_ATTENTE' || l.statut === 'SOUMIS').length, gradient: 'linear-gradient(135deg,#FF6F00 0%,#F59E0B 100%)', shadow: '0 4px 16px rgba(255,111,0,0.25)' },
      { label: 'APPROUVÉS', sub: 'validés', value: list.filter(l => l.statut === 'APPROVED' || l.statut === 'VALIDE').length, gradient: 'linear-gradient(135deg,#43A047 0%,#065f46 100%)', shadow: '0 4px 16px rgba(67,160,71,0.25)' },
      { label: 'REFUSÉS', sub: 'rejetés', value: list.filter(l => l.statut === 'REJECTED' || l.statut === 'REJETE').length, gradient: 'linear-gradient(135deg,#ff3d91 0%,#C0392B 100%)', shadow: '0 4px 16px rgba(192,57,43,0.22)' },
    ];
  });

  getStatusConfig(status?: string) {
    if (!status) return { bg: '#F3F4F6', color: '#374151', label: 'Inconnu' };
    
    const config: Record<string, { bg: string, color: string, label: string }> = {
      SUBMITTED: { bg: '#DBEAFE', color: '#1E40AF', label: 'Soumis' },
      SOUMIS: { bg: '#DBEAFE', color: '#1E40AF', label: 'Soumis' },
      PENDING_REVIEW: { bg: '#FEF3C7', color: '#92400E', label: 'En révision' },
      EN_ATTENTE: { bg: '#FEF3C7', color: '#92400E', label: 'En révision' },
      APPROVED: { bg: '#D1FAE5', color: '#065F46', label: 'Approuvé' },
      VALIDE: { bg: '#D1FAE5', color: '#065F46', label: 'Approuvé' },
      REJECTED: { bg: '#FEE2E2', color: '#991B1B', label: 'Refusé' },
      REJETE: { bg: '#FEE2E2', color: '#991B1B', label: 'Refusé' },
    };
    return config[status] || { bg: '#F3F4F6', color: '#374151', label: status };
  }

  handleExport() {
    console.log('Exporting...');
  }
}
