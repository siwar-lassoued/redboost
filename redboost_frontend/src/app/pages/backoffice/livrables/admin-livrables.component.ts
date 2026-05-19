import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LivrableAdminService, RapportSessionAdmin, RapportMissionAdmin } from './livrable-admin.service';

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
          <p class="text-gray-500 mt-1">Suivi des rapports de sessions et de missions soumis par les coaches</p>
        </div>
      </div>

      <!-- TABS -->
      <div class="flex gap-4 mb-8 border-b border-gray-200">
        <button (click)="activeTab.set('sessions')" 
                class="px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2"
                [ngClass]="activeTab() === 'sessions' ? 'text-pink-500 border-pink-500' : 'text-gray-400 border-transparent hover:text-gray-600'">
          Rapports de Sessions
        </button>
        <button (click)="activeTab.set('missions')" 
                class="px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2"
                [ngClass]="activeTab() === 'missions' ? 'text-pink-500 border-pink-500' : 'text-gray-400 border-transparent hover:text-gray-600'">
          Rapports de Missions
        </button>
      </div>

      <!-- Filters Wrapper -->
      <div class="bg-white rounded-3xl p-6 mb-8 shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div class="relative flex-1 min-w-[200px]">
          <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input [(ngModel)]="searchQuery" type="text" placeholder="Rechercher un coach, bénéficiaire..." 
            class="text-gray-900 w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-300 transition-all">
        </div>

        <select [(ngModel)]="filterThematique" class="text-gray-900 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-pink-100 cursor-pointer">
          <option value="all">Toutes les thématiques</option>
          @for (t of thematiques(); track t) { <option [value]="t">{{ t }}</option> }
        </select>

        <select [(ngModel)]="filterCoach" class="text-gray-900 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-pink-100 cursor-pointer">
          <option value="all">Tous les coachs</option>
          @for (c of coaches(); track c) { <option [value]="c">{{ c }}</option> }
        </select>
        
        <select *ngIf="activeTab() === 'sessions'" [(ngModel)]="filterSession" class="text-gray-900 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-pink-100 cursor-pointer">
          <option value="all">Toutes les sessions</option>
          @for (s of sessionNumbers(); track s) { <option [value]="s">Session {{ s }}</option> }
        </select>
        
        <select *ngIf="activeTab() === 'missions'" [(ngModel)]="filterProgramme" class="text-gray-900 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-pink-100 cursor-pointer">
          <option value="all">Tous les programmes</option>
          @for (p of programmes(); track p) { <option [value]="p">{{ p }}</option> }
        </select>
      </div>

      <!-- Table Section -->
      <div class="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
        <div class="overflow-x-auto min-w-full">
          <!-- SESSIONS TABLE -->
          <table *ngIf="activeTab() === 'sessions'" class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Coach</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Bénéficiaire (Entreprise)</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Thématique</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Date Session</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Soumis le</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (s of filteredSessions(); track s.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-5">
                    <p class="text-sm font-black text-gray-900">{{ s.coachNom || (s.coach?.firstName + ' ' + s.coach?.lastName) || 'Inconnu' }}</p>
                  </td>
                  <td class="px-6 py-5">
                    <p class="text-sm font-bold text-gray-900">{{ s.beneficiaireNom || 'N/A' }}</p>
                    <p class="text-[11px] text-gray-500">{{ s.entrepriseNom }}</p>
                  </td>
                  <td class="px-6 py-5 text-sm font-medium text-gray-600">{{ s.thematique?.nom || 'N/A' }}</td>
                  <td class="px-6 py-5">
                    <span class="text-[10px] px-2 py-1 rounded-lg bg-teal-50 text-teal-600 font-black uppercase tracking-tighter">Session {{ s.numeroSession || '#' }}</span>
                  </td>
                  <td class="px-6 py-5 text-sm text-gray-500">{{ s.dateSession || 'N/A' }}</td>
                  <td class="px-6 py-5">
                    <span class="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{{ s.dateCreation | date:'dd/MM/yyyy HH:mm' }}</span>
                  </td>
                  <td class="px-6 py-5 text-center">
                    <button (click)="viewSessionPdf(s.id)" class="p-2 hover:bg-gray-100 bg-transparent border-none cursor-pointer rounded-xl text-gray-400 hover:text-pink-500 transition-all" title="Voir PDF">
                      <i class="pi pi-file-pdf text-xl"></i>
                    </button>
                  </td>
                </tr>
              }
              @if (filteredSessions().length === 0) {
                <tr>
                  <td colSpan="7" class="px-6 py-20 text-center">
                    <div class="flex flex-col items-center gap-3 opacity-40">
                      <i class="pi pi-folder-open text-5xl text-gray-500"></i>
                      <p class="text-sm font-black uppercase tracking-widest text-gray-500">Aucun rapport de session trouvé</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- MISSIONS TABLE -->
          <table *ngIf="activeTab() === 'missions'" class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Coach</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Programme</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Thématique</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Période</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Soumis le</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (m of filteredMissions(); track m.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-5">
                    <p class="text-sm font-black text-gray-900">{{ (m.coach?.firstName + ' ' + m.coach?.lastName) || 'Inconnu' }}</p>
                  </td>
                  <td class="px-6 py-5 text-sm font-bold text-gray-900">{{ m.programme?.nom || 'N/A' }}</td>
                  <td class="px-6 py-5 text-sm font-medium text-gray-600">{{ m.thematique?.nom || 'N/A' }}</td>
                  <td class="px-6 py-5">
                    <span class="text-[11px] text-gray-500 font-medium">Du {{ m.dateDebut || 'N/A' }} au {{ m.dateFin || 'N/A' }}</span>
                  </td>
                  <td class="px-6 py-5">
                    <span class="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{{ m.dateCreation | date:'dd/MM/yyyy HH:mm' }}</span>
                  </td>
                  <td class="px-6 py-5 text-center">
                    <button (click)="viewMissionPdf(m.id)" class="p-2 hover:bg-gray-100 bg-transparent border-none cursor-pointer rounded-xl text-gray-400 hover:text-purple-500 transition-all" title="Voir PDF">
                      <i class="pi pi-file-pdf text-xl"></i>
                    </button>
                  </td>
                </tr>
              }
              @if (filteredMissions().length === 0) {
                <tr>
                  <td colSpan="6" class="px-6 py-20 text-center">
                    <div class="flex flex-col items-center gap-3 opacity-40">
                      <i class="pi pi-folder-open text-5xl text-gray-500"></i>
                      <p class="text-sm font-black uppercase tracking-widest text-gray-500">Aucun rapport de mission trouvé</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Footer Info -->
      <div class="mt-6 text-center">
        <p *ngIf="activeTab() === 'sessions' && filteredSessions().length > 0" class="text-xs text-gray-500 font-medium">
          Affichage de <span class="text-pink-500 font-black">{{ filteredSessions().length }}</span> rapport(s) sur {{ sessionsList().length }} au total
        </p>
        <p *ngIf="activeTab() === 'missions' && filteredMissions().length > 0" class="text-xs text-gray-500 font-medium">
          Affichage de <span class="text-purple-500 font-black">{{ filteredMissions().length }}</span> rapport(s) sur {{ missionsList().length }} au total
        </p>
      </div>

    </div>
  `,
  styles: [':host { display: block; }']
})
export class AdminLivrablesComponent implements OnInit {
  private svc = inject(LivrableAdminService);

  activeTab = signal<'sessions'|'missions'>('sessions');

  sessionsList = signal<RapportSessionAdmin[]>([]);
  missionsList = signal<RapportMissionAdmin[]>([]);

  searchQuery = signal('');
  filterThematique = signal('all');
  filterCoach = signal('all');
  filterSession = signal('all');
  filterProgramme = signal('all');

  ngOnInit(): void {
    this.svc.getAllSessionReports().subscribe(r => this.sessionsList.set(r || []));
    this.svc.getAllMissionReports().subscribe(r => this.missionsList.set(r || []));
  }

  thematiques = computed(() => {
    const list1 = this.sessionsList().map(s => s.thematique?.nom).filter(Boolean);
    const list2 = this.missionsList().map(m => m.thematique?.nom).filter(Boolean);
    return Array.from(new Set([...list1, ...list2])) as string[];
  });

  sessionNumbers = computed(() => {
    return Array.from(new Set(this.sessionsList().map(s => s.numeroSession).filter(Boolean))) as string[];
  });
  
  programmes = computed(() => {
    return Array.from(new Set(this.missionsList().map(m => m.programme?.nom).filter(Boolean))) as string[];
  });

  coaches = computed(() => {
    const list1 = this.sessionsList().map(s => s.coachNom || (s.coach?.firstName + ' ' + s.coach?.lastName)).filter(Boolean);
    const list2 = this.missionsList().map(m => (m.coach?.firstName + ' ' + m.coach?.lastName)).filter(Boolean);
    return Array.from(new Set([...list1, ...list2])) as string[];
  });

  filteredSessions = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const theme = this.filterThematique();
    const sessionNum = this.filterSession();
    const coachFilter = this.filterCoach();

    return this.sessionsList().filter(s => {
      const rawCoachName = s.coachNom || (s.coach?.firstName + ' ' + s.coach?.lastName) || 'Inconnu';
      const coachName = rawCoachName.toLowerCase();
      const benName = (s.beneficiaireNom || '').toLowerCase();
      const matchSearch = !search || coachName.includes(search) || benName.includes(search);
      const matchTheme = theme === 'all' || s.thematique?.nom === theme;
      const matchSession = sessionNum === 'all' || s.numeroSession === sessionNum;
      const matchCoach = coachFilter === 'all' || rawCoachName === coachFilter;
      
      return matchSearch && matchTheme && matchSession && matchCoach;
    });
  });

  filteredMissions = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const theme = this.filterThematique();
    const prog = this.filterProgramme();
    const coachFilter = this.filterCoach();

    return this.missionsList().filter(m => {
      const rawCoachName = (m.coach?.firstName + ' ' + m.coach?.lastName) || 'Inconnu';
      const coachName = rawCoachName.toLowerCase();
      const matchSearch = !search || coachName.includes(search);
      const matchTheme = theme === 'all' || m.thematique?.nom === theme;
      const matchProg = prog === 'all' || m.programme?.nom === prog;
      const matchCoach = coachFilter === 'all' || rawCoachName === coachFilter;
      
      return matchSearch && matchTheme && matchProg && matchCoach;
    });
  });

  viewSessionPdf(id: number) {
    const url = this.svc.getSessionReportPdfUrl(id);
    window.open(url, '_blank');
  }

  viewMissionPdf(id: number) {
    const url = this.svc.getMissionReportPdfUrl(id);
    window.open(url, '_blank');
  }
}
