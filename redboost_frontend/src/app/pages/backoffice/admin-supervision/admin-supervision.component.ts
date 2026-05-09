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
    <div class="p-6 bg-gray-50 min-h-screen font-sans">
      <!-- HEADER -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-gray-900 tracking-tight">Supervision Globale</h1>
          <p class="text-gray-500 mt-1">Vue 360° des sessions, tâches et livrables par Coach ou Entrepreneur</p>
        </div>
        <div class="flex items-center gap-2 bg-white rounded-xl border border-gray-200 shadow-sm p-1">
          <button (click)="switchMode('coach')" class="px-4 py-2 rounded-lg text-sm font-black transition-all cursor-pointer"
            [class.bg-indigo-600]="viewMode() === 'coach'" [class.text-white]="viewMode() === 'coach'"
            [class.text-gray-500]="viewMode() !== 'coach'">
            <i class="pi pi-user-check mr-1"></i> Par Coach
          </button>
          <button (click)="switchMode('entrepreneur')" class="px-4 py-2 rounded-lg text-sm font-black transition-all cursor-pointer"
            [class.bg-indigo-600]="viewMode() === 'entrepreneur'" [class.text-white]="viewMode() === 'entrepreneur'"
            [class.text-gray-500]="viewMode() !== 'entrepreneur'">
            <i class="pi pi-briefcase mr-1"></i> Par Entrepreneur
          </button>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <!-- LEFT: USER LIST -->
        <div class="col-span-4">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-4 border-b border-gray-100 bg-gray-50">
              <div class="relative">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input type="text" [(ngModel)]="searchUser" (ngModelChange)="filterUsers()"
                  [placeholder]="viewMode() === 'coach' ? 'Rechercher un coach...' : 'Rechercher un entrepreneur...'"
                  class="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none" />
              </div>
            </div>
            <div class="overflow-y-auto" style="max-height: 70vh;">
              @if (loadingUsers()) {
                <div class="flex items-center justify-center py-12">
                  <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              }
              @for (u of filteredUsers(); track u.id) {
                <div class="flex items-center gap-3 p-4 cursor-pointer border-b border-gray-50 transition-all hover:bg-indigo-50"
                  [class.bg-indigo-50]="selectedUser()?.id === u.id"
                  [class.border-l-4]="selectedUser()?.id === u.id"
                  [class.border-indigo-600]="selectedUser()?.id === u.id"
                  (click)="selectUser(u)">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                    [style.background]="viewMode() === 'coach' ? 'linear-gradient(135deg, #6366F1, #4F46E5)' : 'linear-gradient(135deg, #F59E0B, #D97706)'">
                    {{ getInitial(u) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-black text-gray-900 leading-tight truncate">{{ u.firstName }} {{ u.lastName }}</p>
                    <p class="text-[11px] text-gray-400 font-medium truncate">{{ u.email }}</p>
                  </div>
                  @if (selectedUser()?.id === u.id) {
                    <i class="pi pi-chevron-right text-indigo-600 text-sm flex-shrink-0"></i>
                  }
                </div>
              }
              @if (!loadingUsers() && filteredUsers().length === 0) {
                <div class="text-center py-12 text-gray-400">
                  <i class="pi pi-users text-3xl mb-2 block"></i>
                  <p class="text-sm font-medium">Aucun utilisateur trouvé</p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- RIGHT: DETAILS PANEL -->
        <div class="col-span-8">
          @if (!selectedUser()) {
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-24">
              <div class="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <i class="pi pi-search text-indigo-400 text-2xl"></i>
              </div>
              <h3 class="text-lg font-black text-gray-700">Sélectionnez un utilisateur</h3>
              <p class="text-gray-400 text-sm mt-1">Choisissez un {{ viewMode() === 'coach' ? 'coach' : 'entrepreneur' }} pour voir ses données.</p>
            </div>
          } @else {
            <!-- User Header Card -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg"
                  [style.background]="viewMode() === 'coach' ? 'linear-gradient(135deg, #6366F1, #4F46E5)' : 'linear-gradient(135deg, #F59E0B, #D97706)'">
                  {{ getInitial(selectedUser()) }}
                </div>
                <div>
                  <h2 class="text-xl font-black text-gray-900">{{ selectedUser()!.firstName }} {{ selectedUser()!.lastName }}</h2>
                  <p class="text-sm text-gray-500 font-medium">{{ selectedUser()!.email }}</p>
                  <p class="text-xs text-indigo-600 font-black uppercase tracking-wide mt-1">{{ viewMode() === 'coach' ? 'Coach' : 'Entrepreneur' }}</p>
                </div>
                <div class="ml-auto flex items-center gap-3">
                  <div class="text-center bg-indigo-50 rounded-xl px-4 py-2">
                    <p class="text-2xl font-black text-indigo-600">{{ detail().sessions.length }}</p>
                    <p class="text-[10px] font-black uppercase text-gray-400">Sessions</p>
                  </div>
                  <div class="text-center bg-amber-50 rounded-xl px-4 py-2">
                    <p class="text-2xl font-black text-amber-600">{{ detail().taches.length }}</p>
                    <p class="text-[10px] font-black uppercase text-gray-400">Tâches</p>
                  </div>
                  <div class="text-center bg-emerald-50 rounded-xl px-4 py-2">
                    <p class="text-2xl font-black text-emerald-600">{{ detail().livrables.length }}</p>
                    <p class="text-[10px] font-black uppercase text-gray-400">Livrables</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tabs -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="flex border-b border-gray-100">
                <button (click)="activeTab.set('sessions')" class="flex items-center gap-2 px-6 py-4 text-sm font-black border-b-2 transition-all cursor-pointer"
                  [class.border-indigo-600]="activeTab() === 'sessions'" [class.text-indigo-600]="activeTab() === 'sessions'"
                  [class.border-transparent]="activeTab() !== 'sessions'" [class.text-gray-400]="activeTab() !== 'sessions'">
                  <i class="pi pi-calendar"></i> Sessions ({{ detail().sessions.length }})
                </button>
                <button (click)="activeTab.set('taches')" class="flex items-center gap-2 px-6 py-4 text-sm font-black border-b-2 transition-all cursor-pointer"
                  [class.border-amber-500]="activeTab() === 'taches'" [class.text-amber-600]="activeTab() === 'taches'"
                  [class.border-transparent]="activeTab() !== 'taches'" [class.text-gray-400]="activeTab() !== 'taches'">
                  <i class="pi pi-list"></i> Tâches ({{ detail().taches.length }})
                </button>
                <button (click)="activeTab.set('livrables')" class="flex items-center gap-2 px-6 py-4 text-sm font-black border-b-2 transition-all cursor-pointer"
                  [class.border-emerald-500]="activeTab() === 'livrables'" [class.text-emerald-600]="activeTab() === 'livrables'"
                  [class.border-transparent]="activeTab() !== 'livrables'" [class.text-gray-400]="activeTab() !== 'livrables'">
                  <i class="pi pi-file"></i> Livrables ({{ detail().livrables.length }})
                </button>
              </div>

              <div class="p-6 overflow-y-auto" style="max-height: 55vh;">
                @if (loadingDetail()) {
                  <div class="flex items-center justify-center py-12">
                    <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  </div>
                }

                <!-- SESSIONS TAB -->
                @if (!loadingDetail() && activeTab() === 'sessions') {
                  @if (detail().sessions.length === 0) {
                    <p class="text-center text-gray-400 py-12 font-medium">Aucune session enregistrée.</p>
                  }
                  <div class="space-y-3">
                    @for (s of detail().sessions; track s.id) {
                      <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-600 bg-indigo-100 flex-shrink-0">
                          <i class="pi pi-calendar text-sm"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-black text-gray-900 truncate">{{ s.titre || 'Session de coaching' }}</p>
                          <p class="text-[11px] text-gray-500 font-medium">
                            <i class="pi pi-clock"></i> {{ s.date | date:'dd/MM/yyyy à HH:mm' }}
                            @if (viewMode() === 'coach' && s.entrepreneur) {
                              · <i class="pi pi-briefcase"></i> {{ s.entrepreneur?.firstName || s.entrepreneur?.prenom }} {{ s.entrepreneur?.lastName || s.entrepreneur?.nom }}
                            }
                            @if (viewMode() === 'entrepreneur' && s.coach) {
                              · <i class="pi pi-user-check"></i> {{ s.coach?.firstName || s.coach?.prenom }} {{ s.coach?.lastName || s.coach?.nom }}
                            }
                          </p>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                          <span class="text-[10px] font-black px-2 py-1 rounded-full" [style.background]="getSessionBadge(s.statut).bg" [style.color]="getSessionBadge(s.statut).color">
                            {{ getSessionBadge(s.statut).label }}
                          </span>
                          @if (s.meetLink) {
                            <a [href]="s.meetLink" target="_blank" class="flex items-center gap-1 text-xs font-black text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full hover:bg-green-100 transition-all" style="text-decoration: none;">
                              <i class="pi pi-video text-[10px]"></i> Meet
                            </a>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- TÂCHES TAB -->
                @if (!loadingDetail() && activeTab() === 'taches') {
                  @if (detail().taches.length === 0) {
                    <p class="text-center text-gray-400 py-12 font-medium">Aucune tâche associée.</p>
                  }
                  <div class="space-y-3">
                    @for (t of detail().taches; track t.id) {
                      <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-amber-600 bg-amber-100 flex-shrink-0">
                          <i class="pi pi-check-square text-sm"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-black text-gray-900 truncate">{{ t.titre || t.title || t.nom || 'Tâche' }}</p>
                          <p class="text-[11px] text-gray-500 font-medium" *ngIf="t.description">{{ t.description | slice:0:80 }}{{ t.description?.length > 80 ? '...' : '' }}</p>
                          <p class="text-[10px] text-gray-400 mt-1" *ngIf="t.dateEcheance || t.dateFin">
                            <i class="pi pi-calendar"></i> Échéance: {{ (t.dateEcheance || t.dateFin) | date:'dd/MM/yyyy' }}
                          </p>
                        </div>
                        <span class="text-[10px] font-black px-2 py-1 rounded-full flex-shrink-0"
                          [class.bg-emerald-100]="t.statut === 'TERMINEE' || t.statut === 'DONE'"
                          [class.text-emerald-700]="t.statut === 'TERMINEE' || t.statut === 'DONE'"
                          [class.bg-amber-100]="t.statut === 'EN_COURS' || t.statut === 'IN_PROGRESS'"
                          [class.text-amber-700]="t.statut === 'EN_COURS' || t.statut === 'IN_PROGRESS'"
                          [class.bg-gray-100]="!t.statut || (t.statut !== 'TERMINEE' && t.statut !== 'DONE' && t.statut !== 'EN_COURS' && t.statut !== 'IN_PROGRESS')"
                          [class.text-gray-600]="!t.statut || (t.statut !== 'TERMINEE' && t.statut !== 'DONE' && t.statut !== 'EN_COURS' && t.statut !== 'IN_PROGRESS')">
                          {{ t.statut || 'À faire' }}
                        </span>
                      </div>
                    }
                  </div>
                }

                <!-- LIVRABLES TAB -->
                @if (!loadingDetail() && activeTab() === 'livrables') {
                  @if (detail().livrables.length === 0) {
                    <p class="text-center text-gray-400 py-12 font-medium">Aucun livrable déposé.</p>
                  }
                  <div class="space-y-3">
                    @for (l of detail().livrables; track l.id) {
                      <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-100 flex-shrink-0">
                          <i class="pi pi-file-pdf text-sm"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-black text-gray-900 truncate">{{ l.titre || l.nom || l.fileName || 'Livrable' }}</p>
                          <p class="text-[11px] text-gray-500 font-medium" *ngIf="l.description">{{ l.description | slice:0:80 }}</p>
                          <p class="text-[10px] text-gray-400 mt-1">
                            <i class="pi pi-calendar"></i> {{ (l.dateDepot || l.createdAt || l.date) | date:'dd/MM/yyyy' }}
                          </p>
                        </div>
                        @if (l.fileUrl || l.url || l.path) {
                          <a [href]="l.fileUrl || l.url || l.path" target="_blank" class="flex items-center gap-1 text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-all flex-shrink-0" style="text-decoration: none;">
                            <i class="pi pi-download text-[10px]"></i> Télécharger
                          </a>
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
  `
})
export class AdminSupervisionDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  viewMode = signal<ViewMode>('coach');
  activeTab = signal<DetailTab>('sessions');

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
    this.loadUsers();
  }

  switchMode(mode: ViewMode) {
    this.viewMode.set(mode);
    this.selectedUser.set(null);
    this.detail.set({ sessions: [], taches: [], livrables: [] });
    this.searchUser = '';
    this.loadUsers();
  }

  loadUsers() {
    this.loadingUsers.set(true);
    const role = this.viewMode() === 'coach' ? 'COACH' : 'ENTREPRENEUR';
    this.http.get<any>(`${environment.apiUrl}/users/all?role=${role}`, { headers: this.headers }).subscribe({
      next: (res) => {
        const users = Array.isArray(res) ? res : (res.data || res.content || []);
        this.allUsers.set(users);
        this.filteredUsersData.set(users);
        this.loadingUsers.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingUsers.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  filterUsers() {
    const q = this.searchUser.toLowerCase().trim();
    if (!q) {
      this.filteredUsersData.set(this.allUsers());
    } else {
      this.filteredUsersData.set(
        this.allUsers().filter(u => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q))
      );
    }
  }

  filteredUsers = computed(() => this.filteredUsersData());

  selectUser(user: any) {
    this.selectedUser.set(user);
    this.activeTab.set('sessions');
    this.loadDetail(user.id);
  }

  loadDetail(userId: number) {
    this.loadingDetail.set(true);
    this.detail.set({ sessions: [], taches: [], livrables: [] });

    const mode = this.viewMode();

    // Use AdminPlanningController for rich data (sessions + meet links + todos + livrables)
    if (mode === 'coach') {
      let remaining = 3;
      const merged: any = { sessions: [], taches: [], livrables: [] };
      const done = () => {
        remaining--;
        if (remaining === 0) { this.detail.set(merged); this.loadingDetail.set(false); this.cdr.markForCheck(); }
      };
      // Sessions
      this.http.get<any>(`${environment.apiUrl}/admin/planning/coach/${userId}`, { headers: this.headers }).subscribe({
        next: (res) => { merged.sessions = res.sessions || []; done(); },
        error: () => done()
      });
      // Tâches (via todos endpoint which includes entrepreneur context)
      this.http.get<any>(`${environment.apiUrl}/admin/planning/coach/${userId}/todos`, { headers: this.headers }).subscribe({
        next: (res) => { merged.taches = Array.isArray(res) ? res : []; done(); },
        error: () => done()
      });
      // Livrables
      this.http.get<any>(`${environment.apiUrl}/admin/planning/coach/${userId}/livrables`, { headers: this.headers }).subscribe({
        next: (res) => { merged.livrables = Array.isArray(res) ? res : []; done(); },
        error: () => done()
      });
    } else {
      // Entrepreneur: use SessionController + TacheController
      let remaining = 2;
      const merged: any = { sessions: [], taches: [], livrables: [] };
      const done = () => {
        remaining--;
        if (remaining === 0) { this.detail.set(merged); this.loadingDetail.set(false); this.cdr.markForCheck(); }
      };
      this.http.get<any>(`${environment.apiUrl}/admin/planning/entrepreneur/${userId}`, { headers: this.headers }).subscribe({
        next: (res) => { merged.sessions = res.sessions || []; done(); },
        error: () => done()
      });
      this.http.get<any>(`${environment.apiUrl}/taches/entrepreneur/${userId}`, { headers: this.headers }).subscribe({
        next: (res) => { merged.taches = Array.isArray(res) ? res : (res.data || []); done(); },
        error: () => done()
      });
    }
  }

  getInitial(user: any): string {
    if (!user) return '?';
    return user.firstName ? user.firstName.charAt(0).toUpperCase() : '?';
  }

  getSessionBadge(statut: string) {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      PLANIFIE:  { label: 'Planifiée', bg: '#EBF5FF', color: '#3B82A6' },
      PLANIFIEE: { label: 'Planifiée', bg: '#EBF5FF', color: '#3B82A6' },
      DEMANDE:   { label: 'À confirmer', bg: '#EDE9FE', color: '#6D28D9' },
      REALISEE:  { label: 'Terminée', bg: '#ECFDF5', color: '#10B981' },
      TERMINE:   { label: 'Terminée', bg: '#ECFDF5', color: '#10B981' },
      ANNULEE:   { label: 'Annulée', bg: '#FEF2F2', color: '#EF4444' },
    };
    return map[statut] || { label: statut || '—', bg: '#F1F5F9', color: '#475569' };
  }
}
