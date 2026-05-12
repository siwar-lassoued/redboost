import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environment';

type ViewMode = 'coach' | 'entrepreneur';
type DetailTab = 'sessions' | 'taches' | 'livrables';

@Component({
  selector: 'rb-admin-supervision',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 bg-[#f8fafc] min-h-screen font-sans">
      <!-- HEADER -->
      <div class="flex items-center justify-between mb-10">
        <div>
          <h1 class="text-4xl font-black text-[#1e293b] tracking-tight">Planning de coaching</h1>
          <p class="text-[#64748b] mt-1.5 font-semibold text-lg opacity-80">Supervision ciblée par Programme et Thématique</p>
        </div>
        
        <div class="flex items-center gap-6">
          <!-- Global Filters Card -->
          <div class="flex items-center gap-4 bg-white rounded-3xl border border-[#e2e8f0] p-2 shadow-sm">
            <!-- Programme Selector -->
            <div class="group relative flex items-center gap-3 px-5 py-2.5 bg-[#f8fafc] rounded-2xl border border-[#f1f5f9] hover:border-[#ea5073]/30 transition-all duration-300">
              <div class="flex flex-col">
                <label class="text-[9px] font-black uppercase text-[#94a3b8] tracking-widest mb-0.5">Programme</label>
                <div class="flex items-center gap-2">
                  <i class="pi pi-briefcase text-[#ea5073] text-[10px]"></i>
                  <select [(ngModel)]="selectedProgId" (change)="onProgChange()" class="bg-transparent border-none outline-none text-sm font-bold text-[#1e293b] cursor-pointer min-w-[180px]">
                    <option [ngValue]="0">Tous les programmes</option>
                    @for (p of programmes(); track p.id) {
                      <option [ngValue]="p.id">{{ p.nom }}</option>
                    }
                  </select>
                </div>
              </div>
            </div>

            <!-- Thematique Selector -->
            <div class="group relative flex items-center gap-3 px-5 py-2.5 bg-[#f8fafc] rounded-2xl border border-[#f1f5f9] hover:border-[#ea5073]/30 transition-all duration-300" 
                 [class.opacity-50]="selectedProgId === 0" [class.grayscale]="selectedProgId === 0">
              <div class="flex flex-col">
                <label class="text-[9px] font-black uppercase text-[#94a3b8] tracking-widest mb-0.5">Thématique</label>
                <div class="flex items-center gap-2">
                  <i class="pi pi-tag text-[#ea5073] text-[10px]"></i>
                  <select [(ngModel)]="selectedThematiqueId" (change)="onThematiqueChange()" [disabled]="selectedProgId === 0" 
                          class="bg-transparent border-none outline-none text-sm font-bold text-[#1e293b] cursor-pointer min-w-[180px]">
                    <option [ngValue]="0">Toutes les thématiques</option>
                    @for (t of thematiques(); track t.id) {
                      <option [ngValue]="t.id">{{ t.nom }}</option>
                    }
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- View Mode Switcher -->
          <div class="flex items-center gap-2 bg-white rounded-3xl border border-[#e2e8f0] shadow-sm p-2">
            <button (click)="switchMode('coach')" class="px-6 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer flex items-center gap-3"
              [class.bg-[#ea5073]]="viewMode() === 'coach'" [class.text-white]="viewMode() === 'coach'"
              [class.shadow-xl]="viewMode() === 'coach'" [class.shadow-pink-200]="viewMode() === 'coach'"
              [class.text-[#64748b]]="viewMode() !== 'coach'">
              <i class="pi pi-user-check"></i> Coachs
            </button>
            <button (click)="switchMode('entrepreneur')" class="px-6 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer flex items-center gap-3"
              [class.bg-[#ea5073]]="viewMode() === 'entrepreneur'" [class.text-white]="viewMode() === 'entrepreneur'"
              [class.shadow-xl]="viewMode() === 'entrepreneur'" [class.shadow-pink-200]="viewMode() === 'entrepreneur'"
              [class.text-[#64748b]]="viewMode() !== 'entrepreneur'">
              <i class="pi pi-briefcase"></i> Entrepreneurs
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-8">
        <!-- LEFT: USER LIST -->
        <div class="col-span-4">
          <div class="bg-white rounded-[32px] shadow-sm border border-[#f1f5f9] overflow-hidden">
            <div class="p-6 border-b border-[#f1f5f9] bg-[#f8fafc]">
              <div class="relative group">
                <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm group-focus-within:text-[#ea5073] transition-colors"></i>
                <input type="text" [(ngModel)]="searchUser" (ngModelChange)="filterUsers()"
                  [placeholder]="viewMode() === 'coach' ? 'Rechercher un coach...' : 'Rechercher un entrepreneur...'"
                  class="w-full pl-11 pr-4 py-3.5 bg-white border border-[#e2e8f0] rounded-2xl text-sm font-medium outline-none focus:border-[#ea5073] focus:ring-4 focus:ring-pink-50 transition-all" />
              </div>
            </div>
            <div class="overflow-y-auto" style="max-height: 65vh;">
              @if (loadingUsers()) {
                <div class="flex items-center justify-center py-20">
                  <div class="w-12 h-12 border-4 border-[#f1f5f9] border-t-[#ea5073] rounded-full animate-spin"></div>
                </div>
              }
              @for (u of filteredUsers(); track u.id) {
                <div class="flex items-center gap-4 p-5 cursor-pointer border-b border-[#f8fafc] transition-all hover:bg-[#fff5f7] group"
                  [class.bg-[#fff5f7]]="selectedUser()?.id === u.id"
                  [class.border-l-[6px]]="selectedUser()?.id === u.id"
                  [class.border-[#ea5073]]="selectedUser()?.id === u.id"
                  (click)="selectUser(u)">
                  <div class="flex-1 min-w-0">
                    <p class="text-[15px] font-black text-[#1e293b] leading-tight truncate uppercase tracking-tight group-hover:text-[#ea5073] transition-colors">
                      {{ u.fullName }}
                    </p>
                    <div class="flex flex-wrap gap-1 mt-2">
                      @for (p of u.programmes; track p) {
                        <span class="px-2 py-0.5 bg-slate-100 text-[#64748b] text-[9px] font-black rounded uppercase tracking-tighter">{{ p }}</span>
                      }
                      @if (!u.programmes || u.programmes.length === 0) {
                        <span class="text-[11px] text-[#94a3b8] font-bold truncate">{{ u.email }}</span>
                      }
                    </div>
                  </div>
                  @if (selectedUser()?.id === u.id) {
                    <i class="pi pi-chevron-right text-[#ea5073] text-sm flex-shrink-0 animate-pulse"></i>
                  }
                </div>
              }
              @if (!loadingUsers() && filteredUsers().length === 0) {
                <div class="text-center py-32 text-[#94a3b8]">
                  <div class="w-20 h-20 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="pi pi-filter text-4xl opacity-20"></i>
                  </div>
                  <p class="text-lg font-bold">Aucun profil trouvé</p>
                  <p class="text-sm mt-1 opacity-60">Ajustez vos filtres de programme ou de thématique</p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- RIGHT: DETAILS PANEL -->
        <div class="col-span-8">
          @if (!selectedUser()) {
            <div class="bg-white rounded-[32px] shadow-sm border border-[#f1f5f9] flex flex-col items-center justify-center py-40">
              <div class="w-24 h-24 rounded-[32px] bg-[#fff5f7] flex items-center justify-center mb-8">
                <i class="pi pi-users text-[#ea5073] text-4xl opacity-30"></i>
              </div>
              <h3 class="text-2xl font-black text-[#1e293b]">Profil à superviser</h3>
              <p class="text-[#64748b] text-base mt-3 font-semibold opacity-70">Sélectionnez un binôme matché pour voir l'activité réelle.</p>
            </div>
          } @else {
            <!-- User Header Card -->
            <div class="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-6 mb-6 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-48 h-48 bg-[#ea5073]/5 rounded-full -mr-24 -mt-24"></div>
              <div class="flex items-center gap-6 relative z-10">
                <div class="flex-1">
                  <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f1f5f9] text-[#ea5073] text-[9px] font-black uppercase tracking-widest mb-3 border border-[#e2e8f0]">
                    <i class="pi" [class.pi-user-check]="viewMode() === 'coach'" [class.pi-briefcase]="viewMode() === 'entrepreneur'"></i>
                    {{ viewMode() === 'coach' ? 'Expert Coaching' : 'Entrepreneur' }}
                  </div>
                  <h2 class="text-2xl font-black text-[#1e293b] leading-none uppercase tracking-tight">{{ selectedUser()!.firstName }} {{ selectedUser()!.lastName }}</h2>
                  <p class="text-sm text-[#64748b] font-bold mt-2 opacity-80">{{ selectedUser()!.email }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-center bg-white rounded-2xl p-4 border border-[#f0f9ff] min-w-[90px] shadow-sm">
                    <p class="text-2xl font-black text-[#0369a1] leading-none">{{ detail().sessions.length }}</p>
                    <p class="text-[9px] font-black uppercase text-[#0ea5e9] tracking-widest mt-2">Sessions</p>
                  </div>
                  <div class="text-center bg-white rounded-2xl p-4 border border-[#fffbeb] min-w-[90px] shadow-sm">
                    <p class="text-2xl font-black text-[#b45309] leading-none">{{ detail().taches.length }}</p>
                    <p class="text-[9px] font-black uppercase text-[#d97706] tracking-widest mt-2">Tâches</p>
                  </div>
                  <div class="text-center bg-white rounded-2xl p-4 border border-[#f0fdf4] min-w-[90px] shadow-sm">
                    <p class="text-2xl font-black text-[#15803d] leading-none">{{ detail().livrables.length }}</p>
                    <p class="text-[9px] font-black uppercase text-[#22c55e] tracking-widest mt-2">Livrables</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tabs Section -->
            <div class="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] overflow-hidden">
              <div class="flex px-4 border-b border-[#f1f5f9] bg-[#f8fafc]">
                <button (click)="activeTab.set('sessions')" class="flex items-center gap-2 px-6 py-4 text-[13px] font-black border-b-2 transition-all cursor-pointer"
                  [class.border-[#ea5073]]="activeTab() === 'sessions'" [class.text-[#ea5073]]="activeTab() === 'sessions'"
                  [class.border-transparent]="activeTab() !== 'sessions'" [class.text-[#94a3b8]]="activeTab() !== 'sessions'">
                  <i class="pi pi-calendar"></i> SESSIONS
                </button>
                <button (click)="activeTab.set('taches')" class="flex items-center gap-2 px-6 py-4 text-[13px] font-black border-b-2 transition-all cursor-pointer"
                  [class.border-[#ea5073]]="activeTab() === 'taches'" [class.text-[#ea5073]]="activeTab() === 'taches'"
                  [class.border-transparent]="activeTab() !== 'taches'" [class.text-[#94a3b8]]="activeTab() !== 'taches'">
                  <i class="pi pi-list"></i> TÂCHES
                </button>
                <button (click)="activeTab.set('livrables')" class="flex items-center gap-2 px-6 py-4 text-[13px] font-black border-b-2 transition-all cursor-pointer"
                  [class.border-[#ea5073]]="activeTab() === 'livrables'" [class.text-[#ea5073]]="activeTab() === 'livrables'"
                  [class.border-transparent]="activeTab() !== 'livrables'" [class.text-[#94a3b8]]="activeTab() !== 'livrables'">
                  <i class="pi pi-file"></i> LIVRABLES
                </button>
              </div>

              <div class="p-6 overflow-y-auto" style="max-height: 55vh;">
                @if (loadingDetail()) {
                  <div class="flex items-center justify-center py-20">
                    <div class="w-10 h-10 border-4 border-[#f1f5f9] border-t-[#ea5073] rounded-full animate-spin"></div>
                  </div>
                }

                <!-- SESSIONS CONTENT -->
                @if (!loadingDetail() && activeTab() === 'sessions') {
                  <div class="space-y-4">
                    @for (s of detail().sessions; track s.id) {
                      <div class="flex items-start gap-4 p-4 bg-white rounded-2xl border border-[#f1f5f9] hover:border-[#ea5073]/20 hover:shadow-lg hover:shadow-pink-500/5 transition-all group">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-[#ea5073] bg-[#fff5f7] flex-shrink-0 group-hover:scale-105 transition-transform">
                          <i class="pi pi-calendar text-xl"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between">
                            <p class="text-lg font-black text-[#1e293b] truncate uppercase tracking-tight">{{ s.titre || 'Session' }}</p>
                            <span class="text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border" [style.background]="getSessionBadge(s.statut).bg" [style.color]="getSessionBadge(s.statut).color" [style.borderColor]="getSessionBadge(s.statut).color + '20'">
                                {{ getSessionBadge(s.statut).label }}
                            </span>
                          </div>
                          
                          <div class="flex flex-col gap-1 mt-2">
                             <div class="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                <i class="pi pi-bookmark text-sky-500 text-[10px]"></i>
                                <span class="uppercase">{{ s.programmeNom || 'Programme' }}</span>
                                <span class="text-slate-200">|</span>
                                <i class="pi pi-tag text-[#10b981] text-[10px]"></i>
                                <span class="text-slate-500">{{ s.thematiqueNom || 'Thématique' }}</span>
                             </div>
                             <div class="flex items-center gap-3 text-[11px] font-bold text-slate-500 mt-1">
                                <div class="flex items-center gap-1.5"><i class="pi pi-clock text-slate-300"></i> {{ s.date | date:'dd MMM yyyy à HH:mm' }}</div>
                                
                                <div class="flex items-center gap-2">
                                  @if (viewMode() === 'entrepreneur') {
                                    <span class="flex items-center gap-1.5 px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md border border-sky-100">
                                      <i class="pi pi-user-check text-[10px]"></i>
                                      COACH : {{ s.coachName || (s.coach?.firstName + ' ' + s.coach?.lastName) || 'N/A' }}
                                    </span>
                                  } @else {
                                    <span class="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                                      <i class="pi pi-user text-[10px]"></i>
                                      ENTREPRENEUR : {{ s.entrepreneurName || (s.entrepreneur?.firstName + ' ' + s.entrepreneur?.lastName) || 'N/A' }}
                                    </span>
                                  }
                                </div>
                             </div>
                          </div>
                        </div>
                        <div class="flex flex-col items-end gap-3 flex-shrink-0">
                          @if (s.meetLink) {
                            <a [href]="s.meetLink" target="_blank" class="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-[#10b981] hover:bg-[#059669] transition-all shadow-md shadow-emerald-200">
                              <i class="pi pi-video text-base"></i>
                            </a>
                          }
                          <button class="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 group-hover:text-[#ea5073] transition-colors border border-slate-100">
                            <i class="pi pi-chevron-right text-xs"></i>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- OTHER TABS (TASKS/DELIVERABLES) -->
                @if (!loadingDetail() && (activeTab() === 'taches' || activeTab() === 'livrables')) {
                   <div class="grid grid-cols-1 gap-3">
                      @if (activeTab() === 'taches') {
                         @for (t of detail().taches; track t.id) {
                           <div class="flex items-start gap-4 p-4 bg-white rounded-2xl border border-[#f1f5f9] hover:shadow-lg transition-all group">
                             <div class="w-12 h-12 rounded-xl flex items-center justify-center text-amber-600 bg-amber-50 flex-shrink-0 group-hover:scale-105 transition-transform">
                               <i class="pi pi-check-circle text-xl"></i>
                             </div>
                             <div class="flex-1 min-w-0">
                               <div class="flex items-center justify-between">
                                 <p class="text-lg font-black text-slate-800 uppercase tracking-tight">{{ t.titre }}</p>
                                 <span class="text-[9px] font-black px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 uppercase tracking-widest">{{ t.status }}</span>
                               </div>
                               
                               <div class="flex flex-col gap-1 mt-2">
                                 <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <i class="pi pi-bookmark text-sky-500 text-[10px]"></i>
                                    <span class="uppercase">{{ t.programmeName || 'Programme' }}</span>
                                    <span class="text-slate-200">|</span>
                                    <i class="pi pi-tag text-[#10b981] text-[10px]"></i>
                                    <span class="text-slate-500">{{ t.thematiqueNom || 'Thématique' }}</span>
                                 </div>
                                 <div class="flex items-center gap-3 text-[10px] font-bold text-slate-500 mt-1">
                                    <div class="flex items-center gap-1.5" *ngIf="t.dateLimite"><i class="pi pi-clock text-slate-300"></i> ÉCHÉANCE : {{ t.dateLimite | date:'dd MMM yyyy' }}</div>
                                    
                                    <div class="flex items-center gap-2">
                                      @if (viewMode() === 'entrepreneur') {
                                        <span class="flex items-center gap-1.5 px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md border border-sky-100">
                                          <i class="pi pi-user-check text-[10px]"></i> COACH : {{ t.coachName || 'N/A' }}
                                        </span>
                                      } @else {
                                        <span class="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                                          <i class="pi pi-user text-[10px]"></i> ENTREPRENEUR : {{ t.entrepreneurName || 'N/A' }}
                                        </span>
                                      }
                                    </div>
                                 </div>
                               </div>
                             </div>
                           </div>
                         }
                      }

                      @if (activeTab() === 'livrables') {
                         <div class="grid grid-cols-2 gap-4">
                         @for (l of detail().livrables; track l.id) {
                           <div class="p-4 bg-white rounded-2xl border border-[#f1f5f9] hover:shadow-lg transition-all group">
                             <div class="flex items-center gap-3 mb-4">
                               <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" 
                                    [style.background]="getFileIconConfig(l.url).bg">
                                 <i class="pi text-lg" [class]="getFileIconConfig(l.url).icon" [style.color]="getFileIconConfig(l.url).color"></i>
                               </div>
                               <div class="flex-1 min-w-0">
                                 <p class="text-xs font-black text-slate-800 uppercase truncate" [title]="l.nom">{{ l.nom }}</p>
                                 <p class="text-[9px] font-bold text-slate-400 mt-0.5">{{ l.dateUpload | date:'dd MMM yyyy' }}</p>
                               </div>
                             </div>

                             <div class="flex flex-col gap-2 mb-4">
                                <div class="flex items-center gap-2 text-[8px] font-bold text-slate-400">
                                   <i class="pi pi-bookmark text-sky-500 text-[8px]"></i>
                                   <span class="uppercase truncate">{{ l.programmeNom || 'Programme' }}</span>
                                </div>
                                
                                <div class="flex flex-wrap gap-1">
                                   <span class="px-2 py-0.5 rounded bg-slate-50 text-slate-500 text-[8px] font-bold flex items-center gap-1">
                                     <i class="pi pi-tag text-[8px]"></i> {{ l.thematiqueNom || 'Général' }}
                                   </span>
                                   @if (l.tacheTitre) {
                                     <span class="px-2 py-0.5 rounded bg-pink-50 text-[#ea5073] text-[8px] font-bold flex items-center gap-1">
                                       <i class="pi pi-check-square text-[8px]"></i> {{ l.tacheTitre }}
                                     </span>
                                   }
                                </div>

                                <div class="mt-1">
                                   @if (viewMode() === 'entrepreneur') {
                                     <span class="text-[8px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded flex items-center gap-1">
                                       <i class="pi pi-user-check"></i> COACH : {{ l.coachName || 'N/A' }}
                                     </span>
                                   } @else {
                                     <span class="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                                       <i class="pi pi-user"></i> ENTREPRENEUR : {{ l.entrepreneurName || 'N/A' }}
                                     </span>
                                   }
                                </div>
                             </div>

                             <a [href]="getLivrableUrl(l.url)" target="_blank" 
                                class="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 rounded-xl text-[10px] font-black text-slate-600 hover:bg-[#ea5073] hover:text-white transition-all">
                                <i class="pi pi-download"></i> CONSULTER
                             </a>
                           </div>
                         }
                         </div>
                      }
                   </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #f8fafc; }
    ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
    select { 
      appearance: none; 
      -webkit-appearance: none; 
      background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23ea5073' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); 
      background-repeat: no-repeat; 
      background-position: right center; 
      padding-right: 24px;
    }
  `]
})
export class AdminSupervisionDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  viewMode = signal<ViewMode>('coach');
  activeTab = signal<DetailTab>('sessions');

  programmes = signal<any[]>([]);
  selectedProgId = 0;

  thematiques = signal<any[]>([]);
  selectedThematiqueId = 0;

  allUsers = signal<any[]>([]);
  filteredUsersData = signal<any[]>([]);
  loadingUsers = signal<boolean>(false);

  selectedUser = signal<any | null>(null);
  loadingDetail = signal<boolean>(false);
  detail = signal<{ sessions: any[]; taches: any[]; livrables: any[] }>({ sessions: [], taches: [], livrables: [] });

  searchUser = '';

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  ngOnInit(): void {
    this.loadProgrammes();
    this.loadUsers();
  }

  loadProgrammes() {
    this.http.get<any[]>(`${environment.apiUrl}/backoffice/programmes`, { headers: this.headers }).subscribe({
      next: (data) => this.programmes.set(data),
      error: (e) => console.error('Failed to load programmes', e)
    });
  }

  onProgChange() {
    this.selectedThematiqueId = 0;
    this.thematiques.set([]);
    this.selectedUser.set(null);
    if (this.selectedProgId > 0) this.loadThematiques(this.selectedProgId);
    this.loadUsers();
  }

  loadThematiques(progId: number) {
    this.http.get<any[]>(`${environment.apiUrl}/thematiques/programme/${progId}`, { headers: this.headers }).subscribe({
      next: (data) => { this.thematiques.set(data); this.cdr.markForCheck(); },
      error: (e) => console.error('Failed to load thematiques', e)
    });
  }

  onThematiqueChange() { this.selectedUser.set(null); this.loadUsers(); }

  switchMode(mode: ViewMode) {
    this.viewMode.set(mode);
    this.selectedUser.set(null);
    this.detail.set({ sessions: [], taches: [], livrables: [] });
    this.searchUser = '';
    this.loadUsers();
  }

  loadUsers() {
    this.loadingUsers.set(true);
    const mode = this.viewMode();
    if (this.selectedProgId > 0) {
      let url = `${environment.apiUrl}/matching/history/${this.selectedProgId}`;
      if (this.selectedThematiqueId > 0) url = `${environment.apiUrl}/matching/history/${this.selectedProgId}/thematique/${this.selectedThematiqueId}`;
      this.http.get<any[]>(url, { headers: this.headers }).subscribe({
        next: (matchings) => {
          const uniqueUsersMap = new Map<number, any>();
          matchings.forEach(m => {
            const userData = mode === 'coach' ? m.coach : m.entrepreneur;
            const rootId = mode === 'coach' ? m.coachId : m.entrepreneurId;
            const finalId = userData?.id || rootId;
            
            if (finalId) {
              const fullName = (mode === 'coach' ? m.coachName : m.entrepreneurName) || 
                               ((userData?.firstName || userData?.prenom || '').trim() + ' ' + 
                                (userData?.lastName || userData?.nom || '').trim()).trim();

              const existing = uniqueUsersMap.get(finalId);
              const progName = m.programmeName || m.programme?.nom;
              const progs = existing ? existing.programmes : [];
              if (progName && !progs.includes(progName)) progs.push(progName);

              uniqueUsersMap.set(finalId, {
                id: finalId,
                fullName: fullName || userData?.email?.split('@')[0] || 'Utilisateur #' + finalId,
                email: userData?.email || 'N/A',
                programmes: progs
              });
            }
          });
          const users = Array.from(uniqueUsersMap.values());
          this.allUsers.set(users);
          this.filteredUsersData.set(users);
          this.loadingUsers.set(false);
          this.cdr.markForCheck();
        },
        error: () => { this.allUsers.set([]); this.filteredUsersData.set([]); this.loadingUsers.set(false); this.cdr.markForCheck(); }
      });
    } else {
      // General view: use specialized planning endpoints that only return matched users
      const endpoint = mode === 'coach' ? `${environment.apiUrl}/admin/planning/coaches` : `${environment.apiUrl}/admin/planning/entrepreneurs`;
      this.http.get<any[]>(endpoint, { headers: this.headers }).subscribe({
        next: (res) => {
          const users = res.map((u: any) => ({
            id: mode === 'coach' ? (u.coachId || u.id) : (u.entrepreneurId || u.id),
            fullName: (mode === 'coach' ? u.coachName : u.entrepreneurName) || (u.firstName + ' ' + u.lastName) || 'Utilisateur',
            email: u.email || 'N/A',
            programmes: u.programmes || (u.programme ? [u.programme] : [])
          }));
          this.allUsers.set(users);
          this.filteredUsersData.set(users);
          this.loadingUsers.set(false);
          this.cdr.markForCheck();
        },
        error: () => { this.loadingUsers.set(false); this.cdr.markForCheck(); }
      });
    }
  }

  filterUsers() {
    const q = this.searchUser.toLowerCase().trim();
    if (!q) this.filteredUsersData.set(this.allUsers());
    else this.filteredUsersData.set(this.allUsers().filter(u => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)));
  }

  filteredUsers = computed(() => this.filteredUsersData());
  selectUser(user: any) { this.selectedUser.set(user); this.activeTab.set('sessions'); this.loadDetail(user.id); }

  loadDetail(userId: number) {
    this.loadingDetail.set(true);
    this.detail.set({ sessions: [], taches: [], livrables: [] });
    const mode = this.viewMode();
    const progId = this.selectedProgId;
    const themId = this.selectedThematiqueId;
    
    // Construct query params
    let params = `?programmeId=${progId}&thematiqueId=${themId}`;

    if (mode === 'coach') {
      let remaining = 3;
      const merged: any = { sessions: [], taches: [], livrables: [] };
      const done = () => { remaining--; if (remaining === 0) { this.detail.set(merged); this.loadingDetail.set(false); this.cdr.markForCheck(); } };
      this.http.get<any>(`${environment.apiUrl}/admin/planning/coach/${userId}${params}`, { headers: this.headers }).subscribe({
        next: (res) => { merged.sessions = res.sessions || []; done(); },
        error: () => done()
      });
      this.http.get<any>(`${environment.apiUrl}/admin/planning/coach/${userId}/todos${params}`, { headers: this.headers }).subscribe({
        next: (res) => { merged.taches = Array.isArray(res) ? res : []; done(); },
        error: () => done()
      });
      this.http.get<any>(`${environment.apiUrl}/admin/planning/coach/${userId}/livrables${params}`, { headers: this.headers }).subscribe({
        next: (res) => { merged.livrables = Array.isArray(res) ? res : []; done(); },
        error: () => done()
      });
    } else {
      let remaining = 3;
      const merged: any = { sessions: [], taches: [], livrables: [] };
      const done = () => { remaining--; if (remaining === 0) { this.detail.set(merged); this.loadingDetail.set(false); this.cdr.markForCheck(); } };
      this.http.get<any>(`${environment.apiUrl}/admin/planning/entrepreneur/${userId}${params}`, { headers: this.headers }).subscribe({
        next: (res) => { merged.sessions = res.sessions || []; done(); },
        error: () => done()
      });
      this.http.get<any>(`${environment.apiUrl}/admin/planning/entrepreneur/${userId}/todos${params}`, { headers: this.headers }).subscribe({
        next: (res) => { merged.taches = Array.isArray(res) ? res : []; done(); },
        error: () => done()
      });
      this.http.get<any>(`${environment.apiUrl}/admin/planning/entrepreneur/${userId}/livrables${params}`, { headers: this.headers }).subscribe({
        next: (res) => { merged.livrables = Array.isArray(res) ? res : []; done(); },
        error: () => done()
      });
    }
  }

  getSessionBadge(statut: string) {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      PLANIFIE:  { label: 'Planifiée', bg: '#f0f9ff', color: '#0369a1' },
      PLANIFIEE: { label: 'Planifiée', bg: '#f0f9ff', color: '#0369a1' },
      DEMANDE:   { label: 'À confirmer', bg: '#f5f3ff', color: '#6d28d9' },
      REALISEE:  { label: 'Terminée', bg: '#f0fdf4', color: '#15803d' },
      TERMINE:   { label: 'Terminée', bg: '#f0fdf4', color: '#15803d' },
      ANNULEE:   { label: 'Annulée', bg: '#fef2f2', color: '#dc2626' },
    };
    return map[statut] || { label: statut || '—', bg: '#f8fafc', color: '#64748b' };
  }

  getLivrableUrl(url: string): string {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl}/files/tache-documents/${url}`;
  }

  getFileIconConfig(url: string) {
    const ext = (url || '').split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { icon: 'pi-file-pdf', color: '#ef4444', bg: '#fef2f2' };
    if (['doc', 'docx'].includes(ext!)) return { icon: 'pi-file-word', color: '#3b82f6', bg: '#eff6ff' };
    if (['xls', 'xlsx'].includes(ext!)) return { icon: 'pi-file-excel', color: '#10b981', bg: '#f0fdf4' };
    return { icon: 'pi-file', color: '#94a3b8', bg: '#f8fafc' };
  }
}
