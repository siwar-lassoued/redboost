import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EvaluationService, CoachRating } from './evaluation.service';
import { KpiFormService, KpiForm, ThematiqueCoaching, User as FormUser, KpiFormResponse } from '../kpi_forms/kpi-form.service';
import { ProgrammeService } from '../programmes/programme.service';

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
    avgImpact: number;
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

type PageTab = 'byCoach' | 'allRatings' | 'forms';

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
        <div class="flex items-center gap-4">
          <button (click)="openFormModal()" 
                  class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#ea5073] border-none cursor-pointer transition-all shadow-[0_4px_12px_rgba(234,80,115,0.3)] hover:bg-[#d4476a] hover:-translate-y-px">
            <i class="pi pi-plus text-xs"></i>
            Nouveau Formulaire
          </button>
          <div class="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-full text-xs font-black shadow-sm">
            <div class="w-2 h-2 rounded-full bg-pink-600 animate-pulse"></div>
            {{ kpis().unread }} NON LUES
          </div>
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
        <button (click)="pageTab.set('forms')" 
          [class]="pageTab() === 'forms' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20 border-transparent' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'"
          class="border flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer">
          <i class="pi pi-file text-sm"></i>
          Formulaires d'évaluation
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
                      <p>IMPACT : <span class="text-gray-900">{{ coach.avgImpact }}</span></p>
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
          } @else if (pageTab() === 'allRatings') {
            <!-- Tab 2: Individual Ratings -->
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-100">
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Coach</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Séance</th>
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
                    <td class="px-6 py-5 text-xs font-bold text-[#3B82A6]">{{ r.session?.titre || 'Session' }}</td>
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
          } @else if (pageTab() === 'forms') {
            <!-- Tab 3: Forms -->
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-100">
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Formulaire</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Programme</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Date limite</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Questions</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Statut</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (f of formsList(); track f.id) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-5">
                      <p class="text-sm font-black text-gray-900">{{ f.title }}</p>
                      <p class="text-[11px] text-gray-500 font-medium truncate max-w-[200px]">{{ f.description }}</p>
                    </td>
                    <td class="px-6 py-5 text-xs font-bold text-[#3B82A6]">
                      {{ getProgrammeName(f.programmeId) }}
                    </td>
                    <td class="px-6 py-5 text-xs font-black text-pink-500">
                      {{ f.deadline | date:'dd/MM/yyyy' }}
                    </td>
                    <td class="px-6 py-5 text-sm font-black text-gray-900">
                      {{ f.questions.length || 0 }}
                    </td>
                    <td class="px-6 py-5">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter"
                        [ngClass]="{
                          'bg-gray-100 text-gray-600': f.status === 'DRAFT',
                          'bg-emerald-100 text-emerald-600': f.status === 'SENT',
                          'bg-red-100 text-red-600': f.status === 'CLOSED'
                        }">
                        {{ f.status }}
                      </span>
                    </td>
                    <td class="px-6 py-5 text-center flex items-center justify-center gap-2">
                       <button (click)="openFormModalForEdit(f)" class="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-sky-500 transition-all border-none bg-transparent cursor-pointer"><i class="pi pi-pencil text-sm"></i></button>
                       <button (click)="viewResponses(f)" class="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-pink-500 transition-all border-none bg-transparent cursor-pointer" title="Voir les réponses"><i class="pi pi-users text-sm"></i></button>
                    </td>
                  </tr>
                }
                @if (formsList().length === 0) {
                  <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-sm font-medium text-gray-400">Aucun formulaire d'évaluation trouvé.</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>

      <!-- MODALS IMPLEMENTATION -->
      <!-- Custom modal wrappers to avoid missing ModalComponent dependency -->

      <!-- RESPONSES MODAL -->
      @if (showResponsesModal && viewingForm()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="closeModals()">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-6 bg-gray-900 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 class="text-xl font-black text-white">Réponses — {{ viewingForm()?.title }}</h2>
                <p class="text-white/60 text-xs font-medium mt-1">{{ formResponses().length }} réponse(s) reçue(s)</p>
              </div>
              <button (click)="closeModals()" class="text-white/60 hover:text-white bg-transparent border-none cursor-pointer"><i class="pi pi-times text-xl"></i></button>
            </div>
            <div class="p-6 overflow-y-auto flex-1 bg-gray-50">
              @if (isLoadingResponses) {
                <div class="flex flex-col items-center justify-center py-16 gap-4">
                  <i class="pi pi-spin pi-spinner text-4xl text-pink-500"></i>
                  <p class="text-gray-500 text-sm font-medium">Chargement des réponses...</p>
                </div>
              } @else if (formResponses().length === 0) {
                <div class="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <i class="pi pi-inbox text-5xl text-gray-300"></i>
                  <p class="text-gray-700 font-black text-lg">Aucune réponse reçue</p>
                  <p class="text-gray-400 text-sm">Les entrepreneurs n'ont pas encore soumis leurs réponses.</p>
                </div>
              } @else {
                <div class="flex flex-col gap-4">
                  @for (resp of formResponses(); track resp.id) {
                    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div class="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow" style="background: linear-gradient(135deg, #ea5073, #d4476a);">
                            {{ (resp.entrepreneurName || 'E').charAt(0).toUpperCase() }}
                          </div>
                          <div>
                            <p class="font-black text-sm text-gray-900">{{ resp.entrepreneurName || 'Entrepreneur' }}</p>
                            <p class="text-[11px] text-gray-400">ID: {{ resp.entrepreneurId }}</p>
                          </div>
                        </div>
                        <div class="flex items-center gap-3">
                          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter"
                            [ngClass]="{'bg-amber-100 text-amber-700': resp.status==='PENDING', 'bg-emerald-100 text-emerald-700': resp.status==='SUBMITTED', 'bg-blue-100 text-blue-700': resp.status==='VALIDATED'}">
                            {{ resp.status === 'PENDING' ? 'En attente' : resp.status === 'SUBMITTED' ? 'Soumis' : 'Validé' }}
                          </span>
                          @if (resp.submittedAt) {
                            <span class="text-[11px] text-gray-400">{{ resp.submittedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                          }
                        </div>
                      </div>
                      @if (resp.answers && resp.answers.length > 0) {
                        <div class="p-5 flex flex-col gap-3">
                          @for (ans of resp.answers; track ans.questionId) {
                            <div class="bg-gray-50 rounded-xl p-4 border-l-4 border-pink-400">
                              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{{ ans.questionText }}</p>
                              <p class="text-sm font-semibold text-gray-900">{{ ans.answerValue || '—' }}</p>
                            </div>
                          }
                        </div>
                      } @else {
                        <p class="px-5 py-4 text-sm text-gray-400 italic">Aucune réponse fournie.</p>
                      }
                    </div>
                  }
                </div>
              }
            </div>
            <div class="px-6 py-4 border-t border-gray-100 bg-white flex justify-end">
              <button (click)="closeModals()" class="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 border-none cursor-pointer transition-all">Fermer</button>
            </div>
          </div>
        </div>
      }

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
                    { label: 'Disponibilité', value: selectedCoach()?.avgDispo || 0 },
                    { label: 'Impact', value: selectedCoach()?.avgImpact || 0 }
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
                  { label: 'Disponibilité', value: selectedRating()?.availability || 0 },
                  { label: 'Impact', value: selectedRating()?.impact || 0 }
                ]; track c.label) {
                  <div class="bg-gray-50 rounded-2xl p-4 text-center">
                    <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">{{ c.label }}</p>
                    <rb-stars [value]="c.value" [size]="16" class="justify-center mb-2"></rb-stars>
                    <p class="text-lg font-black" [style.color]="ratingColor(c.value)">{{ c.value }} / 5</p>
                  </div>
                }
              </div>

              @if (selectedRating()?.tags) {
                <div class="flex flex-wrap gap-2 mb-4">
                  @for (tag of selectedRating()?.tags?.split(', '); track tag) {
                    <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">{{ tag }}</span>
                  }
                </div>
              }

              @if (selectedRating()?.commentaire) {
                <div class="bg-pink-50/30 border-l-4 border-pink-500 p-6 rounded-r-2xl shadow-sm">
                  <p class="text-gray-600 text-sm italic leading-relaxed font-medium">"{{ selectedRating()?.commentaire }}"</p>
                </div>
              }

              <div class="grid grid-cols-3 gap-4">
                @for (item of [
                  { icon: 'pi-book', label: 'Programme', value: selectedRating()?.programme?.nom },
                  { icon: 'pi-calendar-clock', label: 'Séance', value: selectedRating()?.session?.titre },
                  { icon: 'pi-calendar', label: 'Date', value: selectedRating()?.createdAt }
                ]; track item.label) {
                  <div class="bg-gray-50 rounded-2xl p-4">
                    <div class="flex items-center gap-2 mb-1 text-gray-400">
                      <i class="pi {{ item.icon }} text-[10px]"></i>
                      <span class="text-[10px] font-black uppercase tracking-widest">{{ item.label }}</span>
                    </div>
                    <p class="text-sm font-black text-gray-900">
                      @if (item.label === 'Date') {
                        {{ item.value | date:'dd MMMM yyyy' }}
                      } @else {
                        {{ item.value || '—' }}
                      }
                    </p>
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
      <!-- FORM BUILDER MODAL (EXACT COPY FROM KPI PAGE) -->
      @if (showFormModal) {
        <div class="modal-overlay" (click)="closeModals()">
          <div class="modal-box" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-info">
                <h2 class="modal-name">{{ editingForm.id ? 'Modifier' : 'Nouveau' }} Formulaire Évaluation</h2>
              </div>
              <button (click)="closeModals()" class="modal-close"><i class="pi pi-times"></i></button>
            </div>
            
            <div class="modal-body" style="background: #F9FAFB;">
               <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                 <div style="grid-column: span 2;">
                   <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Titre du formulaire *</label>
                   <input type="text" [(ngModel)]="editingForm.title" class="search-input-kpi" style="padding: 12px 16px;">
                 </div>
                 <div style="grid-column: span 2;">
                   <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Description</label>
                   <textarea [(ngModel)]="editingForm.description" rows="2" class="search-input-kpi" style="padding: 12px 16px; resize: vertical;"></textarea>
                 </div>
                 <div>
                   <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Date limite</label>
                   <input type="datetime-local" [(ngModel)]="editingForm.deadline" class="search-input-kpi" style="padding: 11px 16px;">
                 </div>

                 <div>
                   <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Coach</label>
                   <select [(ngModel)]="editingForm.coachId" (change)="onCoachChange()" class="filter-select-kpi" style="width: 100%; padding: 12px 16px;">
                     <option [value]="null">-- Sélectionner un coach --</option>
                     @for (c of allCoaches(); track c.id) {
                       <option [value]="c.id">{{ c.firstName }} {{ c.lastName }}</option>
                     }
                   </select>
                 </div>

                 <div>
                   <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Thématique</label>
                   <select [(ngModel)]="editingForm.thematiqueId" (change)="onThematiqueChange()" class="filter-select-kpi" style="width: 100%; padding: 12px 16px;">
                     <option [value]="null">-- Sélectionner une thématique --</option>
                     @for (t of allThematiques(); track t.id) {
                       <option [value]="t.id">{{ t.nom }}</option>
                     }
                   </select>
                 </div>

                 <div style="grid-column: span 2;">
                   <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Programme (auto-rempli selon la thématique)</label>
                   @if (editingForm.programmeId) {
                     <div style="padding: 11px 16px; border: 1px solid #D1FAE5; border-radius: 12px; background: #ECFDF5; font-size: 14px; font-weight: 700; color: #065F46; display: flex; align-items: center; gap: 8px;">
                       <i class="pi pi-check-circle" style="color: #059669;"></i>
                       {{ getProgrammeName(editingForm.programmeId) }}
                     </div>
                   } @else {
                     <div style="padding: 11px 16px; border: 1px solid #E5E7EB; border-radius: 12px; background: #F9FAFB; font-size: 14px; color: #9CA3AF;">
                       Sélectionnez d'abord une thématique
                     </div>
                   }
                 </div>
               </div>

               <div>
                 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #E5E7EB;">
                   <h3 style="font-size: 16px; font-weight: 800; color: #1A1A2E; margin: 0;">Questions</h3>
                   <button (click)="addQuestion()" class="btn-outline-sm-kpi" style="color: #ea5073; border-color: #ea5073;">
                     <i class="pi pi-plus"></i> Ajouter
                   </button>
                 </div>

                 <div style="display: flex; flex-direction: column; gap: 16px;">
                   @for (q of editingForm.questions; track $index) {
                     <div style="background: white; padding: 20px; border-radius: 16px; border: 1px solid #E5E7EB; box-shadow: 0 2px 8px rgba(0,0,0,0.02); position: relative;">
                       <button (click)="removeQuestion($index)" style="position: absolute; top: 16px; right: 16px; padding: 8px; background: #FFF0F5; color: #C0392B; border: none; border-radius: 8px; cursor: pointer; transition: all .2s;">
                         <i class="pi pi-trash"></i>
                       </button>
                       
                       <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; padding-right: 40px;">
                         <div style="grid-column: span 3;">
                           <label style="display: block; font-size: 10px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Texte de la question</label>
                           <input type="text" [(ngModel)]="q.text" placeholder="Poser la question..." class="search-input-kpi" style="padding: 10px 14px;">
                         </div>
                         <div style="grid-column: span 1;">
                           <label style="display: block; font-size: 10px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Type de réponse</label>
                           <select [(ngModel)]="q.type" class="filter-select-kpi" style="width: 100%; padding: 10px 14px;">
                             <option value="TEXT">Texte Court</option>
                             <option value="TEXTAREA">Multi-lignes</option>
                             <option value="NUMBER">Nombre / Montant</option>
                             <option value="SELECT">Choix Unique</option>
                           </select>
                         </div>
                         <div style="grid-column: span 2; display: flex; align-items: flex-end; padding-bottom: 10px;">
                           <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">
                             <input type="checkbox" [(ngModel)]="q.required" style="width: 16px; height: 16px; accent-color: #ea5073;"> Obligatoire
                           </label>
                         </div>

                         @if (q.type === 'SELECT') {
                           <div style="grid-column: span 3;">
                              <label style="display: block; font-size: 10px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Options (séparées par virgule)</label>
                              <input type="text" [(ngModel)]="q.options" placeholder="Option 1, Option 2, Option 3..." class="search-input-kpi" style="padding: 10px 14px;">
                           </div>
                         }
                       </div>
                     </div>
                   }
                   @if (!editingForm.questions.length) {
                     <div class="py-12 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white/50" style="text-align: center; padding: 30px 20px; border: 2px dashed #E5E7EB; background: white;">
                       <p style="color: #9CA3AF; font-weight: 700; font-size: 16px; margin: 0;">Aucune question ajoutée. Cliquez sur "Ajouter".</p>
                     </div>
                   }
                 </div>
               </div>
            </div>

            <div class="modal-footer">
               <button (click)="closeModals()" class="btn-close-modal-kpi">Annuler</button>
               <button (click)="saveForm()" [disabled]="!editingForm.title" class="btn-gradient-kpi" [style.opacity]="!editingForm.title ? '0.5' : '1'">Sauvegarder</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
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
      background: #ea5073; border: none; cursor: pointer;
      transition: all .2s; box-shadow: 0 4px 12px rgba(234, 80, 115, 0.3);
    }
    .btn-gradient-kpi:hover:not(:disabled) { background: #d4476a; transform: translateY(-1px); }
    .search-input-kpi {
      width: 100%; border: 1px solid #E5E7EB; border-radius: 12px; font-size: 14px; 
      outline: none; color: #333; transition: border-color .2s; background: #fff; box-sizing: border-box;
    }
    .search-input-kpi:focus { border-color: #ea5073; }
    .filter-select-kpi {
      border: 1px solid #E5E7EB; border-radius: 12px; font-size: 14px; 
      outline: none; color: #333; cursor: pointer; background: #fff; transition: border-color .2s;
    }
    .filter-select-kpi:focus { border-color: #ea5073; }
    .btn-outline-sm-kpi {
      display: flex; align-items: center; gap: 8px; padding: 8px 16px;
      border-radius: 10px; font-size: 13px; font-weight: 700;
      background: #fff; color: #333; border: 1px solid #E5E7EB; cursor: pointer; transition: all .2s;
    }
    .btn-outline-sm-kpi:hover { background: #F3F4F6; }
  `],
})
export class AdminEvaluationsComponent implements OnInit {
  private svc = inject(EvaluationService);
  private kpiFormSvc = inject(KpiFormService);
  private programmeSvc = inject(ProgrammeService);
  router = inject(Router);
  private route = inject(ActivatedRoute);

  // Form Builder state
  showFormModal = false;
  editingForm: KpiForm = this.getEmptyForm();
  programmesList = signal<{id: number, nom: string}[]>([]);
  thematiques = signal<ThematiqueCoaching[]>([]);
  coachesList = signal<FormUser[]>([]);
  availableKpis = signal<any[]>([]);
  entrepreneurs = signal<FormUser[]>([]);
  allThematiques = signal<ThematiqueCoaching[]>([]);
  allCoaches = signal<FormUser[]>([]);

  // Responses modal
  showResponsesModal = false;
  viewingForm = signal<KpiForm | null>(null);
  formResponses = signal<any[]>([]);
  isLoadingResponses = false;

  pageTab = signal<PageTab>('byCoach');
  ratings = signal<CoachRating[]>([]);
  formsList = signal<KpiForm[]>([]);
  selectedCoach = signal<CoachStats | null>(null);
  selectedRating = signal<CoachRating | null>(null);

  filterProgram = 'all';
  filterCoach = 'all';
  filterStatus = 'all';
  filterNote = 'all';

  ngOnInit(): void {
    this.svc.getAllRatings().subscribe(r => {
      // Sort by date descending
      const sorted = r.sort((a, b) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      this.ratings.set(sorted);
    });

    // Load programmes for form builder
    this.programmeSvc.getAllProgrammesBasic().subscribe(p => 
      this.programmesList.set(p.filter(prog => prog.id !== undefined) as {id: number, nom: string}[])
    );
    
    this.loadForms();

    // Load all thematiques and coaches for dropdowns
    this.kpiFormSvc.getAllThematiques().subscribe(t => this.allThematiques.set(t || []));
    // Load all coaches (users with role COACH)
    this.kpiFormSvc.getCoachesByProgramme(0).subscribe({
      next: c => this.allCoaches.set(c || []),
      error: () => {
        // fallback: load coaches per programme is not needed for the dropdown
        // The dropdown will populate as user selects thematique first
      }
    });
  }

  loadForms() {
    this.kpiFormSvc.getEvaluationForms().subscribe(f => {
      this.formsList.set(f || []);
    });
  }

  getProgrammeName(id: number | undefined): string {
    if (!id) return 'Non assigné';
    const prog = this.programmesList().find(p => p.id === id);
    return prog ? prog.nom : 'Programme inconnu';
  }

  // --- Form Builder Methods ---
  getEmptyForm(): KpiForm {
    return {
      title: '',
      description: '',
      questions: [],
      formType: 'EVALUATION',
      status: 'DRAFT'
    };
  }

  openFormModal() {
    this.editingForm = this.getEmptyForm();
    this.showFormModal = true;
  }

  openFormModalForEdit(form: KpiForm) {
    this.editingForm = JSON.parse(JSON.stringify(form));
    this.showFormModal = true;
  }

  closeModals() {
    this.showFormModal = false;
    this.showResponsesModal = false;
  }

  onProgrammeChange() {
    const pId = this.editingForm.programmeId;
    if (!pId) {
      this.thematiques.set([]);
      this.coachesList.set([]);
      return;
    }
    this.kpiFormSvc.getThematiquesByProgramme(pId).subscribe(t => this.thematiques.set(t || []));
    this.kpiFormSvc.getCoachesByProgramme(pId).subscribe(c => this.coachesList.set(c || []));
    this.editingForm.thematiqueId = undefined;
  }

  onThematiqueChange() {
    const tId = this.editingForm.thematiqueId;
    // Auto-fill programmeId from selected thematique
    if (tId) {
      const theme = this.allThematiques().find(t => t.id === Number(tId));
      if (theme?.programmeId) {
        this.editingForm.programmeId = theme.programmeId;
        // Also load coaches for that programme
        this.kpiFormSvc.getCoachesByProgramme(theme.programmeId).subscribe(c => this.allCoaches.set(c || []));
      }
    }
  }

  onCoachChange() {
    // Store the coach selection - coachId is already bound via ngModel to editingForm.coachId
  }

  addQuestion() {
    this.editingForm.questions.push({ text: '', type: 'TEXT', required: false });
  }

  removeQuestion(idx: number) {
    this.editingForm.questions.splice(idx, 1);
  }

  saveForm() {
    const request = this.editingForm.id 
      ? this.kpiFormSvc.updateForm(this.editingForm.id, this.editingForm) 
      : this.kpiFormSvc.createForm(this.editingForm);
      
    request.subscribe({
      next: (form) => {
        this.loadForms();
        this.closeModals();
      },
      error: (e) => console.error('Failed to save form', e)
    });
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
        avgImpact: n ? parseFloat((cr.reduce((acc, r) => acc + (r.impact || 0), 0) / n).toFixed(1)) : 0,
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

  viewResponses(form: KpiForm) {
    this.viewingForm.set(form);
    this.formResponses.set([]);
    this.isLoadingResponses = true;
    this.showResponsesModal = true;
    this.kpiFormSvc.getResponsesForForm(form.id!).subscribe({
      next: (responses) => {
        this.formResponses.set(responses || []);
        this.isLoadingResponses = false;
      },
      error: () => {
        this.isLoadingResponses = false;
      }
    });
  }
}
