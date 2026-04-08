import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EvaluationService, CoachRating } from './evaluation.service';

export interface CoachStats {
    id: number;
    name: string;
    email: string;
    avatar: string;
    count: number;
    avg: number;
    avgComm: number;
    avgExp: number;
    avgDispo: number;
    programs: string[];
}

@Component({
  selector: 'rb-stars',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-0.5">
      @for (s of [1,2,3,4,5]; track s) {
        <i class="pi" 
           [ngClass]="s <= round(value) ? 'pi-star-fill' : 'pi-star'"
           [style.color]="s <= round(value) ? '#F59E0B' : '#E5E7EB'"
           [style.fontSize.px]="size">
        </i>
      }
    </div>
  `
})
export class StarsComponent {
  @Input() value = 0;
  @Input() size = 14;
  round = Math.round;
}

type PageTab = 'byCoach' | 'allRatings';

@Component({
  selector: 'rb-admin-evaluations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, StarsComponent],
  template: `
    <div class="p-6 bg-background min-h-screen font-sans">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-gray-900 tracking-tight">Évaluations Coach</h1>
          <p class="text-gray-500 mt-1">Vue d'ensemble des notes reçues par les coaches · Confidentiel</p>
        </div>
        <div class="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-full text-xs font-black shadow-sm">
          <div class="w-2 h-2 rounded-full bg-pink-600 animate-pulse"></div>
          {{ kpis().unread }} NON LUES
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        @for (k of kpiCards(); track k.label) {
          <div class="rounded-2xl p-5 text-white relative overflow-hidden shadow-xl" [style.background]="k.gradient" [style.boxShadow]="k.shadow">
            <div class="absolute -right-4 -top-4 rounded-full w-20 h-20 bg-white/10"></div>
            <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <i class="pi {{ k.icon }} text-xl"></i>
            </div>
            <p class="text-[10px] font-bold tracking-widest opacity-80 uppercase mb-1">{{ k.label }}</p>
            <h3 class="text-3xl font-black leading-none mb-1">{{ k.value }}</h3>
            <p class="text-xs opacity-70">{{ k.sub }}</p>
          </div>
        }
      </div>

      <!-- Filters Wrapper -->
      <div class="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2 text-gray-500 mr-2">
          <i class="pi pi-filter text-sm"></i>
          <span class="text-[10px] font-black uppercase tracking-widest">Filtres</span>
        </div>

        <select [(ngModel)]="filterProgram" class="text-gray-800 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-100 cursor-pointer">
          <option value="all">Tous les programmes</option>
          @for (p of programs(); track p) { <option [value]="p">{{ p }}</option> }
        </select>

        <select [(ngModel)]="filterCoach" class="text-gray-800 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-100 cursor-pointer">
          <option value="all">Tous les coaches</option>
          @for (c of coaches(); track c) { <option [value]="c">{{ c }}</option> }
        </select>

        <select [(ngModel)]="filterStatus" class="text-gray-800 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-100 cursor-pointer">
          <option value="all">Tous les statuts</option>
          <option value="NON_LU">Non lu</option>
          <option value="LU">Lu</option>
          <option value="ARCHIVE">Archivé</option>
        </select>

        <select [(ngModel)]="filterNote" class="text-gray-800 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-100 cursor-pointer">
          <option value="all">Toutes les notes</option>
          <option value="high">Haute (≥ 4)</option>
          <option value="low">Faible (≤ 2)</option>
        </select>

        @if (hasFilters()) {
          <button (click)="resetFilters()" class="border-none bg-transparent cursor-pointer text-xs font-black text-pink-500 hover:underline ml-auto uppercase tracking-tighter">Réinitialiser</button>
        }
      </div>

      <!-- Tabs Nav -->
      <div class="flex gap-2 mb-6">
        <button (click)="pageTab.set('byCoach')" 
          [class]="pageTab() === 'byCoach' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20 border-transparent' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'"
          class="border flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer">
          <i class="pi pi-chart-bar text-sm"></i>
          Moyenne par Coach
        </button>
        <button (click)="pageTab.set('allRatings')" 
          [class]="pageTab() === 'allRatings' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20 border-transparent' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'"
          class="border flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer">
          <i class="pi pi-list text-sm"></i>
          Toutes les évaluations
        </button>
      </div>

      <!-- TABLES SECTION -->
      <div class="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
        <div class="overflow-x-auto min-w-full">
          @if (pageTab() === 'byCoach') {
            <!-- Tab 1: Aggregate by Coach -->
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-100">
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Coach</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Programmes</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Total Avis</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Moyenne</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Critères</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (coach of coachStats(); track coach.id) {
                  <tr class="hover:bg-gray-50 transition-colors" [class]="coach.avg > 0 && coach.avg < 3 ? 'bg-red-50' : ''">
                    <td class="px-6 py-5">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md"
                          style="background: linear-gradient(135deg, #00d2ff, #3aafff)">
                          {{ coach.avatar }}
                        </div>
                        <div>
                          <p class="text-sm font-black text-gray-900 leading-tight">{{ coach.name }}</p>
                          <p class="text-[11px] text-gray-500 font-medium">{{ coach.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-5">
                      <div class="flex flex-wrap gap-1">
                        @for (p of coach.programs.slice(0, 2); track p) {
                          <span class="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-black uppercase tracking-tighter">{{ p }}</span>
                        }
                        @if (coach.programs.length > 2) {
                          <span class="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-black">+{{ coach.programs.length - 2 }}</span>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-5">
                      <span class="text-sm font-black text-gray-900">{{ coach.count }} avis</span>
                    </td>
                    <td class="px-6 py-5">
                      @if (coach.count > 0) {
                        <div class="flex flex-col gap-1.5">
                          <div class="flex items-center gap-1.5">
                            <rb-stars [value]="coach.avg" [size]="12"></rb-stars>
                            <span class="text-sm font-black" [style.color]="ratingColor(coach.avg)">{{ coach.avg }}</span>
                            @if (coach.avg < 3) { <i class="pi pi-exclamation-triangle text-red-500 text-xs"></i> }
                          </div>
                          <div class="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div class="h-full rounded-full transition-all" [style.width.%]="(coach.avg/5)*100" [style.background]="ratingColor(coach.avg)"></div>
                          </div>
                        </div>
                      } @else { <span class="text-xs text-gray-400 italic">Aucun avis</span> }
                    </td>
                    <td class="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-tighter space-y-0.5">
                      <p>COMM : <span class="text-gray-900">{{ coach.avgComm }}</span></p>
                      <p>EXP : <span class="text-gray-900">{{ coach.avgExp }}</span></p>
                      <p>DISPO : <span class="text-gray-900">{{ coach.avgDispo }}</span></p>
                    </td>
                    <td class="px-6 py-5 text-center">
                      @if (coach.count > 0) {
                        <button (click)="openCoachModal(coach)" class="flex items-center gap-1.5 mx-auto px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-pink-200 text-pink-600 hover:bg-pink-50 transition-all cursor-pointer bg-transparent">
                          <i class="pi pi-eye text-[10px]"></i>
                          Voir les notes
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <!-- Tab 2: Individual Ratings -->
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-100">
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Coach</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Programme</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Entrepreneur</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Note</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Date</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Statut</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (r of filtered(); track r.id) {
                  <tr class="hover:bg-gray-50 transition-colors" [class]="r.globalRating <= 2 ? 'bg-red-50' : ''">
                    <td class="px-6 py-5 text-sm font-black text-gray-900">{{ r.coach?.firstName }} {{ r.coach?.lastName }}</td>
                    <td class="px-6 py-5 text-xs font-medium text-gray-500">{{ r.programme?.nom }}</td>
                    <td class="px-6 py-5">
                      <span class="text-sm font-bold text-gray-900">{{ r.entrepreneur?.firstName }} {{ r.entrepreneur?.lastName }}</span>
                    </td>
                    <td class="px-6 py-5">
                      <div class="flex items-center gap-1.5 text-sm font-black" [style.color]="ratingColor(r.globalRating)">
                        {{ r.globalRating }}
                        <rb-stars [value]="r.globalRating" [size]="12"></rb-stars>
                        @if (r.globalRating <= 2) { <i class="pi pi-exclamation-triangle text-red-500 text-xs"></i> }
                      </div>
                    </td>
                    <td class="px-6 py-5 text-[11px] text-gray-500 font-medium">{{ r.createdAt | date:'dd/MM/yyyy' }}</td>
                    <td class="px-6 py-5">
                      @if (r.statut === 'NON_LU') { <span class="px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 text-[10px] font-black uppercase tracking-tighter">Non lu</span> }
                      @else if (r.statut === 'LU') { <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-tighter">Lu</span> }
                      @else { <span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-tighter">Archivé</span> }
                    </td>
                    <td class="px-6 py-5 text-center flex items-center justify-center gap-2">
                       <button (click)="openRatingModal(r)" class="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-sky-500 transition-all border-none bg-transparent cursor-pointer"><i class="pi pi-eye text-sm"></i></button>
                      <button (click)="archiveRating(r.id!)" class="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-all border-none bg-transparent cursor-pointer"><i class="pi pi-inbox text-sm"></i></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>

      <!-- MODALS IMPLEMENTATION -->
      <!-- Custom modal wrappers to avoid missing ModalComponent dependency -->

      <!-- COACH DETAIL MODAL -->
      @if (selectedCoach()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="selectedCoach.set(null)">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-[700px] max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="p-6 bg-gray-900 flex items-center justify-between rounded-t-3xl">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg"
                  style="background: linear-gradient(135deg, #00d2ff, #3aafff)">
                  {{ selectedCoach()?.avatar }}
                </div>
                <div>
                  <h2 class="text-xl font-black text-white leading-tight">{{ selectedCoach()?.name }}</h2>
                  <p class="text-white/60 text-xs font-medium tracking-wide uppercase">Notes reçues · {{ selectedCoach()?.count }} évaluations</p>
                </div>
              </div>
              <button (click)="selectedCoach.set(null)" class="text-white/60 hover:text-white bg-transparent border-none cursor-pointer"><i class="pi pi-times text-xl"></i></button>
            </div>
            
            <div class="p-6 space-y-6">
              <div class="grid grid-cols-4 gap-4">
                <div class="col-span-1 bg-gray-50 rounded-2xl p-5 text-center flex flex-col items-center justify-center">
                  <p class="text-4xl font-black mb-1" [style.color]="ratingColor(selectedCoach()?.avg || 0)">{{ selectedCoach()?.avg }}</p>
                  <rb-stars [value]="selectedCoach()?.avg || 0" [size]="14"></rb-stars>
                  <p class="text-[10px] text-gray-400 mt-2 font-black uppercase tracking-widest">Score Global</p>
                </div>
                <div class="col-span-3 bg-gray-50 rounded-2xl p-5 space-y-4">
                  @for (c of [
                    { label: 'Communication', value: selectedCoach()?.avgComm || 0 },
                    { label: 'Expertise', value: selectedCoach()?.avgExp || 0 },
                    { label: 'Disponibilité', value: selectedCoach()?.avgDispo || 0 }
                  ]; track c.label) {
                    <div class="flex items-center gap-4">
                      <span class="text-xs font-bold text-gray-600 w-32">{{ c.label }}</span>
                      <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500" [style.width.%]="(c.value/5)*100" [style.background]="ratingColor(c.value)"></div>
                      </div>
                      <span class="text-xs font-black w-8 text-right" [style.color]="ratingColor(c.value)">{{ c.value }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3">
                @for (r of coachRatings(); track r.id) {
                  <div class="p-4 rounded-2xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50 transition-all">
                    <div class="flex items-start justify-between mb-2">
                      <div>
                        <p class="text-sm font-black text-gray-900">{{ r.entrepreneur?.firstName }} {{ r.entrepreneur?.lastName }}</p>
                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{{ r.programme?.nom }}</p>
                      </div>
                      <div class="text-right">
                        <rb-stars [value]="r.globalRating" [size]="12"></rb-stars>
                        <p class="text-[10px] text-gray-400 mt-1 font-medium">{{ r.createdAt | date:'dd MMM yyyy' }}</p>
                      </div>
                    </div>
                    @if (r.commentaire) {
                      <p class="text-xs text-gray-700 italic leading-relaxed">"{{ r.commentaire }}"</p>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- INDIVIDUAL RATING MODAL -->
      @if (selectedRating()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="selectedRating.set(null)">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-[650px]" (click)="$event.stopPropagation()">
            
            <div class="p-6 bg-gray-900 flex items-center justify-between rounded-t-3xl">
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-4">
                  <div class="text-center">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm mb-1 shadow-md" style="background: linear-gradient(135deg, #00d2ff, #3aafff)">
                      {{ getInitial(selectedRating()?.coach) }}
                    </div>
                    <p class="text-[10px] text-white/60 font-black uppercase">Coach</p>
                  </div>
                  <div class="text-white/30 font-black">/</div>
                  <div class="text-center">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm mb-1 shadow-md" style="background: linear-gradient(135deg, #7B2D8B, #4A148C)">
                      {{ getInitial(selectedRating()?.entrepreneur) }}
                    </div>
                    <p class="text-[10px] text-white/60 font-black uppercase">Entrepreneur</p>
                  </div>
                </div>
                <div>
                  <h2 class="text-xl font-black text-white leading-tight">{{ selectedRating()?.coach?.firstName }} {{ selectedRating()?.coach?.lastName }}</h2>
                  <p class="text-white/60 text-xs font-medium">{{ selectedRating()?.entrepreneur?.firstName }} {{ selectedRating()?.entrepreneur?.lastName }}</p>
                </div>
              </div>
              <button (click)="selectedRating.set(null)" class="text-white/60 hover:text-white bg-transparent border-none cursor-pointer"><i class="pi pi-times text-xl"></i></button>
            </div>

            <div class="p-6 space-y-8">
              <div class="text-center">
                <div class="flex justify-center mb-4">
                  <rb-stars [value]="selectedRating()?.globalRating || 0" [size]="32"></rb-stars>
                </div>
                <p class="text-5xl font-black leading-none" [style.color]="ratingColor(selectedRating()?.globalRating || 0)">
                  {{ selectedRating()?.globalRating }}<span class="text-gray-200 text-3xl"> / 5</span>
                </p>
                @if ((selectedRating()?.globalRating || 0) <= 2) {
                  <div class="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-red-100 text-red-600 text-xs font-black uppercase tracking-widest">
                    <i class="pi pi-exclamation-triangle text-[10px]"></i>
                    Note critique - Action recommandée
                  </div>
                }
              </div>

              <div class="grid grid-cols-3 gap-4">
                @for (c of [
                  { label: 'Communication', value: selectedRating()?.communication || 0 },
                  { label: 'Expertise', value: selectedRating()?.expertise || 0 },
                  { label: 'Disponibilité', value: selectedRating()?.availability || 0 }
                ]; track c.label) {
                  <div class="bg-gray-50 rounded-2xl p-4 text-center">
                    <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">{{ c.label }}</p>
                    <rb-stars [value]="c.value" [size]="16" class="justify-center mb-2"></rb-stars>
                    <p class="text-lg font-black" [style.color]="ratingColor(c.value)">{{ c.value }} / 5</p>
                  </div>
                }
              </div>

              @if (selectedRating()?.commentaire) {
                <div class="bg-pink-50/30 border-l-4 border-pink-500 p-6 rounded-r-2xl shadow-sm">
                  <p class="text-gray-600 text-sm italic leading-relaxed font-medium">"{{ selectedRating()?.commentaire }}"</p>
                </div>
              }

              <div class="grid grid-cols-3 gap-4">
                @for (item of [
                  { icon: 'pi-book', label: 'Programme', value: selectedRating()?.programme?.nom },
                  { icon: 'pi-calendar', label: 'Date', value: selectedRating()?.createdAt | date:'dd MMMM yyyy' }
                ]; track item.label) {
                  <div class="bg-gray-50 rounded-2xl p-4">
                    <div class="flex items-center gap-2 mb-1 text-gray-400">
                      <i class="pi {{ item.icon }} text-[10px]"></i>
                      <span class="text-[10px] font-black uppercase tracking-widest">{{ item.label }}</span>
                    </div>
                    <p class="text-sm font-black text-gray-900">{{ item.value }}</p>
                  </div>
                }
              </div>
            </div>

            <div class="p-6 flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
              <button (click)="archiveRating(selectedRating()?.id!)" class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-gray-200 text-gray-400 hover:text-gray-600 transition-all cursor-pointer">
                <i class="pi pi-inbox text-[10px]"></i>
                Archiver
              </button>
              <button (click)="markRead(selectedRating()?.id!)" class="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white border-transparent rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:scale-[1.02] transition-all cursor-pointer">
                <i class="pi pi-check-circle text-sm"></i>
                Marquer comme lu
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class AdminEvaluationsComponent implements OnInit {
  private svc = inject(EvaluationService);

  pageTab = signal<PageTab>('byCoach');
  ratings = signal<CoachRating[]>([]);
  selectedCoach = signal<CoachStats | null>(null);
  selectedRating = signal<CoachRating | null>(null);

  filterProgram = 'all';
  filterCoach = 'all';
  filterStatus = 'all';
  filterNote = 'all';

  ngOnInit(): void {
    this.svc.getAllRatings().subscribe(r => this.ratings.set(r));
  }

  programs = computed(() => Array.from(new Set(this.ratings().map(r => r.programme?.nom))));
  coaches = computed(() => Array.from(new Set(this.ratings().map(r => `${r.coach?.firstName} ${r.coach?.lastName}`))));

  kpis = computed(() => {
    const list = this.ratings();
    const sum = list.reduce((acc, r) => acc + (r.globalRating || 0), 0);
    return {
      total: list.length,
      unread: list.filter(r => r.statut === 'NON_LU').length,
      avg: list.length ? (sum / list.length).toFixed(1) : '—',
      alerts: new Set(list.filter(r => r.globalRating < 3).map(r => r.coach?.id)).size
    };
  });

  kpiCards = computed(() => {
    const data = this.kpis();
    return [
      { label: 'ÉVALUATIONS', sub: 'au total', value: data.total, icon: 'pi-chart-bar', gradient: 'linear-gradient(135deg,#a17dfd 0%,#7B52D3 100%)', shadow: '0 4px 16px rgba(161,125,253,0.30)' },
      { label: 'NON LUES', sub: 'à traiter', value: data.unread, icon: 'pi-eye', gradient: 'linear-gradient(135deg,#ff3d91 0%,#a17dfd 100%)', shadow: '0 4px 16px rgba(255,61,145,0.30)' },
      { label: 'NOTE MOYENNE', sub: 'sur 5 étoiles', value: `${data.avg}★`, icon: 'pi-star', gradient: 'linear-gradient(135deg,#F59E0B 0%,#FF6F00 100%)', shadow: '0 4px 16px rgba(245,158,11,0.30)' },
      { label: 'ALERTES', sub: 'note critique', value: data.alerts, icon: 'pi-chart-line', gradient: 'linear-gradient(135deg,#FF6F00 0%,#C0392B 100%)', shadow: '0 4px 16px rgba(192,57,43,0.25)' },
    ];
  });

  filtered = computed(() => {
    return this.ratings().filter(r => {
      if (this.filterProgram !== 'all' && r.programme?.nom !== this.filterProgram) return false;
      const coachFullName = `${r.coach?.firstName} ${r.coach?.lastName}`;
      if (this.filterCoach !== 'all' && coachFullName !== this.filterCoach) return false;
      if (this.filterStatus !== 'all' && r.statut !== this.filterStatus) return false;
      if (this.filterNote === 'low' && r.globalRating > 2) return false;
      if (this.filterNote === 'high' && r.globalRating < 4) return false;
      return true;
    });
  });

  coachStats = computed(() => {
    const list = this.ratings();
    const coachIds = Array.from(new Set(list.map(r => r.coach?.id).filter(id => id != null)));
    return coachIds.map(id => {
      const cr = list.filter(r => r.coach?.id === id);
      const n = cr.length;
      return {
        id,
        name: `${cr[0].coach?.firstName} ${cr[0].coach?.lastName}`,
        email: `coach.${id}@coach.tn`, // Default email since not in User obj directly
        avatar: this.getInitial(cr[0].coach),
        count: n,
        avg: n ? parseFloat((cr.reduce((acc, r) => acc + r.globalRating, 0) / n).toFixed(1)) : 0,
        avgComm: n ? parseFloat((cr.reduce((acc, r) => acc + r.communication, 0) / n).toFixed(1)) : 0,
        avgExp: n ? parseFloat((cr.reduce((acc, r) => acc + r.expertise, 0) / n).toFixed(1)) : 0,
        avgDispo: n ? parseFloat((cr.reduce((acc, r) => acc + r.availability, 0) / n).toFixed(1)) : 0,
        programs: Array.from(new Set(cr.map(r => r.programme?.nom).filter(p => p != null)))
      } as CoachStats;
    });
  });

  coachRatings = computed(() => {
    const coach = this.selectedCoach();
    if (!coach) return [];
    return this.ratings().filter(r => r.coach?.id === coach.id);
  });

  hasFilters = computed(() => this.filterProgram !== 'all' || this.filterCoach !== 'all' || this.filterStatus !== 'all' || this.filterNote !== 'all');

  resetFilters() {
    this.filterProgram = 'all';
    this.filterCoach = 'all';
    this.filterStatus = 'all';
    this.filterNote = 'all';
  }

  ratingColor(v: number) {
    if (v >= 4) return '#22C55E';
    if (v >= 3) return '#F97316';
    return '#ff3d91';
  }

  getInitial(user: any): string {
    if (!user) return '?';
    return user.firstName ? user.firstName.charAt(0).toUpperCase() : '?';
  }

  openCoachModal(coach: CoachStats) {
    this.selectedCoach.set(coach);
  }

  openRatingModal(rating: CoachRating) {
    this.selectedRating.set(rating);
    if (rating.statut === 'NON_LU') {
      this.markRead(rating.id!);
    }
  }

  markRead(id: number) {
    this.svc.updateStatus(id, 'LU').subscribe(() => {
      this.ratings.update(all => all.map(r => r.id === id ? { ...r, statut: 'LU' } : r));
    });
  }

  archiveRating(id: number) {
    this.svc.updateStatus(id, 'ARCHIVE').subscribe(() => {
      this.ratings.update(all => all.map(r => r.id === id ? { ...r, statut: 'ARCHIVE' } : r));
      if (this.selectedRating()?.id === id) this.selectedRating.set(null);
    });
  }
}
