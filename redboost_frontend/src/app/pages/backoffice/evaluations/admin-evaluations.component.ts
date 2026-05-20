import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EvaluationService, CoachRating } from './evaluation.service';
import { KpiFormService, KpiForm, ThematiqueCoaching, User as FormUser, KpiFormResponse } from '../kpi_forms/kpi-form.service';
import { ProgrammeService } from '../programmes/programme.service';


interface FlatEvalResponse {
  formId: number;
  formTitle: string;
  coachId?: number;
  coachName?: string;
  programmeName: string;
  thematiqueName: string;
  response: KpiFormResponse;
}


type PageTab = 'allRatings' | 'forms';

@Component({
  selector: 'rb-admin-evaluations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
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
                  class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#ec407a] border-none cursor-pointer transition-all shadow-[0_4px_12px_rgba(236,64,122,0.3)] hover:bg-[#d81b60] hover:-translate-y-px">
            <i class="pi pi-plus text-xs"></i>
            Nouveau Formulaire
          </button>
          <div class="flex items-center gap-2 px-4 py-2 bg-[#fce4ec] text-pink-600 rounded-full text-xs font-black shadow-sm">
            <div class="w-2 h-2 rounded-full bg-pink-600 animate-pulse"></div>
            {{ kpis().pending }} EN ATTENTE
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
          <option value="PENDING">En attente</option>
          <option value="SUBMITTED">Soumis</option>
          <option value="VALIDATED">Validé</option>
        </select>

        @if (hasFilters()) {
          <button (click)="resetFilters()" class="border-none bg-transparent cursor-pointer text-xs font-black text-pink-500 hover:underline ml-auto uppercase tracking-tighter">Réinitialiser</button>
        }
      </div>

      <!-- Tabs Nav -->
      <div class="flex gap-2 mb-6">
        <button (click)="pageTab.set('allRatings')" 
          [class]="pageTab() === 'allRatings' ? 'bg-[#ec407a] text-white shadow-lg shadow-[0_4px_12px_rgba(236,64,122,0.3)] border-transparent' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'"
          class="border flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer">
          <i class="pi pi-list text-sm"></i>
          Toutes les évaluations
        </button>
        <button (click)="pageTab.set('forms')" 
          [class]="pageTab() === 'forms' ? 'bg-[#ec407a] text-white shadow-lg shadow-[0_4px_12px_rgba(236,64,122,0.3)] border-transparent' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'"
          class="border flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer">
          <i class="pi pi-file text-sm"></i>
          Formulaires envoyés
        </button>
      </div>

      <!-- TABLES SECTION -->
      <div class="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
        <div class="overflow-x-auto min-w-full">
          @if (pageTab() === 'allRatings') {
            <!-- Tab: Toutes les évaluations — une ligne par réponse entrepreneur -->
            @if (isLoadingFlatResponses) {
              <div style="text-align:center;padding:60px 20px;">
                <i class="pi pi-spin pi-spinner" style="font-size:2rem;color:#e91e63;"></i>
                <p style="margin-top:12px;color:#6B7280;font-size:14px;">Chargement des évaluations...</p>
              </div>
            } @else {
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-100">
                    <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Formulaire</th>
                    <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Programme · Thématique</th>
                    <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Coach</th>
                    <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Entrepreneur</th>
                    <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Statut</th>
                    <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Date soumission</th>
                    <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (fr of filteredFlat(); track fr.response.id) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-6 py-4">
                        <p class="text-sm font-black text-gray-900">{{ fr.formTitle }}</p>
                      </td>
                      <td class="px-6 py-4">
                        <p class="text-xs font-bold text-gray-700">{{ fr.programmeName || '—' }}</p>
                        @if (fr.thematiqueName) {
                          <span style="display:inline-flex;align-items:center;gap:4px;margin-top:4px;padding:2px 8px;border-radius:6px;background:#F3E8FF;color:#7C3AED;font-size:10px;font-weight:700;">
                            <i class="pi pi-tag" style="font-size:8px;"></i>{{ fr.thematiqueName }}
                          </span>
                        }
                      </td>
                      <td class="px-6 py-4 text-xs font-medium text-gray-600">{{ getCoachName(fr.coachId) }}</td>
                      <td class="px-6 py-4">
                        <div style="display:flex;align-items:center;gap:8px;">
                          <div style="width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#e91e63,#c2185b);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:12px;flex-shrink:0;">
                            {{ (fr.response.entrepreneurName || 'E').charAt(0).toUpperCase() }}
                          </div>
                          <span class="text-sm font-bold text-gray-900">{{ fr.response.entrepreneurName }}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;"
                          [ngStyle]="{
                            'background': fr.response.status==='PENDING' ? '#FEF3C7' : (fr.response.status==='SUBMITTED' ? '#D1FAE5' : '#DBEAFE'),
                            'color': fr.response.status==='PENDING' ? '#B45309' : (fr.response.status==='SUBMITTED' ? '#047857' : '#1D4ED8')
                          }">
                          {{ fr.response.status === 'PENDING' ? 'En attente' : fr.response.status === 'SUBMITTED' ? 'Soumis' : 'Validé' }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-xs text-gray-500 font-medium">
                        {{ fr.response.submittedAt ? (fr.response.submittedAt | date:'dd/MM/yyyy') : '—' }}
                      </td>
                      <td class="px-6 py-4 text-center">
                        <button (click)="openFlatResponseModal(fr)"
                          style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:10px;font-size:11px;font-weight:700;color:#e91e63;background:#fce4ec;border:1px solid #FECDD3;cursor:pointer;transition:all .2s;"
                          [disabled]="fr.response.status === 'PENDING'">
                          <i class="pi pi-eye" style="font-size:11px;"></i>
                          Voir réponses
                        </button>
                      </td>
                    </tr>
                  }
                  @if (filteredFlat().length === 0) {
                    <tr>
                      <td colspan="7" style="padding:60px 24px;text-align:center;color:#9CA3AF;font-size:14px;font-weight:500;">
                        Aucune évaluation trouvée.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          } @else if (pageTab() === 'forms') {
            <!-- Tab: Formulaires envoyés -->
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-100">
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Formulaire</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Programme</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Date limite</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Questions</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Destinataires</th>
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
                    <td class="px-6 py-5 text-sm font-black text-pink-600">
                      <div class="flex items-center gap-1.5">
                        <i class="pi pi-users text-pink-400"></i>
                        {{ f.responses?.length || 0 }} <span class="text-[10px] text-gray-400 font-normal uppercase">Destinataires</span>
                      </div>
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
                    </td>
                  </tr>
                }
                @if (formsList().length === 0) {
                  <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-sm font-medium text-gray-400">Aucun formulaire d'évaluation envoyé.</td>
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
        <div class="modal-overlay" (click)="closeModals()">
          <div class="modal-box" style="max-width: 850px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-info">
                <h2 class="modal-name">Détails — {{ viewingForm()?.title }}</h2>
                <p style="font-size:12px;color:#6B7280;margin:4px 0 0;">{{ formResponses().length }} entrepreneur(s) associé(s)</p>
              </div>
              <button (click)="closeModals()" class="modal-close"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="background: #F9FAFB; max-height: 70vh; overflow-y: auto;">
              @if (isLoadingResponses) {
                <div style="text-align:center;padding:40px;">
                  <i class="pi pi-spin pi-spinner" style="font-size:2rem;color:#e91e63;"></i>
                  <p style="margin-top:10px;color:#6B7280;">Chargement des détails...</p>
                </div>
              } @else if (formResponses().length === 0) {
                <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: 20px;">
                  <i class="pi pi-inbox" style="font-size: 3rem; color: #D1D5DB; margin-bottom: 1rem; display: block;"></i>
                  <p style="color: #4A5568; font-weight: 700; font-size: 16px; margin: 0;">Aucun entrepreneur lié</p>
                  <p style="color: #9CA3AF; font-size: 13px; margin-top: 4px;">Le formulaire n'a été envoyé à aucun entrepreneur.</p>
                </div>
              } @else {
                <div style="display:flex;flex-direction:column;gap:16px;">
                  @for (resp of formResponses(); track resp.id) {
                    <div style="background:#fff;border-radius:16px;padding:20px;border:1px solid #E5E7EB;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                        <div style="display:flex;align-items:center;gap:10px;">
                          <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#e91e63,#c2185b);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:14px;">
                            {{ (resp.entrepreneurName || 'E').charAt(0).toUpperCase() }}
                          </div>
                          <div>
                            <p style="font-weight:800;font-size:14px;color:#1A1A2E;margin:0;">{{ resp.entrepreneurName || 'Entrepreneur' }}</p>
                            <p style="font-size:11px;color:#9CA3AF;margin:0;">ID: {{ resp.entrepreneurId }}</p>
                          </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;">
                          <span style="padding:4px 12px;border-radius:20px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;display:inline-flex;align-items:center;gap:4px;"
                            [ngStyle]="{
                              'background': resp.status==='PENDING' ? '#FEF3C7' : (resp.status==='SUBMITTED' ? '#D1FAE5' : '#DBEAFE'),
                              'color': resp.status==='PENDING' ? '#B45309' : (resp.status==='SUBMITTED' ? '#047857' : '#1D4ED8')
                            }">
                            {{ resp.status === 'PENDING' ? 'En attente' : resp.status === 'SUBMITTED' ? 'Soumis' : 'Validé' }}
                          </span>
                          @if (resp.submittedAt) {
                            <span style="font-size:11px;color:#9CA3AF;">{{ resp.submittedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                          }
                        </div>
                      </div>
                      @if (resp.answers && resp.answers.length > 0) {
                        <div style="display:flex;flex-direction:column;gap:12px;">
                          @for (ans of resp.answers; track ans.questionId) {
                            <div style="background:#F9FAFB;border-radius:12px;padding:16px;border-left:4px solid #e91e63;">
                              <p style="font-size:10px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px 0;">{{ ans.questionText }}</p>
                              <p style="font-size:14px;font-weight:600;color:#1A1A2E;margin:0;">{{ ans.answerValue || '—' }}</p>
                            </div>
                          }
                        </div>
                      } @else {
                        <p style="padding:16px;font-size:13px;color:#9CA3AF;font-style:italic;margin:0;background:#F9FAFB;border-radius:12px;">Aucune réponse fournie.</p>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }



      <!-- DETAIL RÉPONSE MODAL — utilise modal-overlay (z-index 9999) -->
      @if (selectedFlatResponse()) {
        <div class="modal-overlay" (click)="selectedFlatResponse.set(null)">
          <div class="modal-box" style="max-width:850px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-info">
                <h2 class="modal-name">Réponses — {{ selectedFlatResponse()!.formTitle }}</h2>
                <p style="font-size:12px;color:#6B7280;margin:4px 0 0;">
                  <i class="pi pi-briefcase" style="margin-right:4px;"></i>{{ getCoachName(selectedFlatResponse()!.coachId) }}
                  @if (selectedFlatResponse()!.programmeName) {
                    · {{ selectedFlatResponse()!.programmeName }}
                  }
                  @if (selectedFlatResponse()!.thematiqueName) {
                    · {{ selectedFlatResponse()!.thematiqueName }}
                  }
                </p>
              </div>
              <button (click)="selectedFlatResponse.set(null)" class="modal-close"><i class="pi pi-times"></i></button>
            </div>
            
            <div class="modal-body" style="background: #F9FAFB; max-height: 70vh; overflow-y: auto;">
              <div style="background:#fff;border-radius:16px;padding:20px;border:1px solid #E5E7EB;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#e91e63,#c2185b);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:14px;">
                      {{ (selectedFlatResponse()!.response.entrepreneurName || 'E').charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p style="font-weight:800;font-size:14px;color:#1A1A2E;margin:0;">{{ selectedFlatResponse()!.response.entrepreneurName || 'Entrepreneur' }}</p>
                      <p style="font-size:11px;color:#9CA3AF;margin:0;">ID: {{ selectedFlatResponse()!.response.entrepreneurId }}</p>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:10px;font-weight:900;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.05em;"
                      [ngClass]="{'bg-amber-100 text-amber-700': selectedFlatResponse()!.response.status==='PENDING', 'bg-emerald-100 text-emerald-700': selectedFlatResponse()!.response.status==='SUBMITTED', 'bg-blue-100 text-blue-700': selectedFlatResponse()!.response.status==='VALIDATED'}">
                      {{ selectedFlatResponse()!.response.status === 'PENDING' ? 'En attente' : selectedFlatResponse()!.response.status === 'SUBMITTED' ? 'Soumis' : 'Validé' }}
                    </span>
                    @if (selectedFlatResponse()!.response.submittedAt) {
                      <span style="font-size:11px;color:#6B7280;">{{ selectedFlatResponse()!.response.submittedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                    }
                  </div>
                </div>

                @if (selectedFlatResponse()!.response.answers && selectedFlatResponse()!.response.answers.length > 0) {
                  <div style="display:flex;flex-direction:column;gap:10px;">
                    @for (ans of selectedFlatResponse()!.response.answers; track ans.questionId) {
                      <div style="background:#f8f9fa;border-radius:12px;padding:14px;border-left:4px solid #e91e63;">
                        <p style="font-size:10px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">{{ ans.questionText }}</p>
                        <p style="font-size:14px;font-weight:600;color:#1A1A2E;margin:0;">{{ ans.answerValue || '—' }}</p>
                      </div>
                    }
                  </div>
                } @else {
                  <p style="font-size:13px;color:#9CA3AF;font-style:italic;margin:0;">Aucune réponse fournie.</p>
                }
              </div>
            </div>
            
            <div class="modal-footer">
              <button (click)="selectedFlatResponse.set(null)" class="btn-close-modal-kpi">Fermer</button>
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

                 <div>
                   <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Coach</label>
                   <select [(ngModel)]="editingForm.coachId" (change)="onCoachChange()" [disabled]="!editingForm.programmeId" class="filter-select-kpi" style="width: 100%; padding: 12px 16px;" [ngStyle]="{'opacity': !editingForm.programmeId ? '0.5' : '1'}">
                     <option [value]="null">-- Sélectionner un coach --</option>
                     @for (c of allCoaches(); track c.id) {
                       <option [value]="c.id">{{ c.firstName }} {{ c.lastName }}</option>
                     }
                   </select>
                   @if (!editingForm.programmeId) {
                     <p style="font-size: 10px; color: #e91e63; margin-top: 4px;">Sélectionnez une thématique d'abord</p>
                   }
                   <div>
                     <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Date limite</label>
                     <input type="datetime-local" [(ngModel)]="editingForm.deadline" class="search-input-kpi" style="padding: 11px 16px;">
                   </div>
                 </div>

                 <!-- Matched Entrepreneurs Preview -->
                 @if (editingForm.programmeId && editingForm.thematiqueId && editingForm.coachId) {
                   <div style="grid-column: span 2; margin-bottom: 24px; padding: 16px; border: 1px solid #E5E7EB; border-radius: 12px; background: #F9FAFB;">
                     <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                       <h4 style="font-size: 13px; font-weight: 800; color: #1A1A2E; margin: 0;">Entrepreneurs ciblés</h4>
                       <span style="font-size: 11px; font-weight: 700; color: #e91e63; background: #fce4ec; padding: 4px 8px; border-radius: 8px;">
                         {{ matchedEntrepreneurs().length }} destinataire(s)
                       </span>
                     </div>
                     @if (isLoadingMatchedEntrepreneurs()) {
                       <div style="text-align: center; padding: 12px;">
                         <i class="pi pi-spin pi-spinner" style="color: #e91e63; font-size: 1.2rem;"></i>
                         <span style="font-size: 12px; color: #6B7280; margin-left: 8px;">Vérification des correspondances...</span>
                       </div>
                     } @else if (matchedEntrepreneurs().length === 0) {
                       <div style="text-align: center; padding: 12px; color: #6B7280; font-size: 12px; font-style: italic;">
                         Aucun entrepreneur n'a de matching validé pour cette thématique avec ce coach. Le formulaire ne sera envoyé à personne.
                       </div>
                     } @else {
                       <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                         @for (ent of matchedEntrepreneurs(); track ent.id) {
                           <div style="display: flex; align-items: center; gap: 6px; background: white; padding: 6px 12px; border: 1px solid #E5E7EB; border-radius: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                             <div style="width: 20px; height: 20px; border-radius: 6px; background: linear-gradient(135deg, #e91e63, #c2185b); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 10px;">
                               {{ (ent.firstName ? ent.firstName.charAt(0).toUpperCase() : 'E') }}
                             </div>
                             <span style="font-size: 12px; font-weight: 700; color: #1A1A2E;">{{ ent.firstName }} {{ ent.lastName }}</span>
                           </div>
                         }
                       </div>
                     }
                   </div>
                 }
               </div>

               <div>
                 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #E5E7EB;">
                   <h3 style="font-size: 16px; font-weight: 800; color: #1A1A2E; margin: 0;">Questions</h3>
                   <button (click)="addQuestion()" class="btn-outline-sm-kpi" style="color: #e91e63; border-color: #e91e63;">
                     <i class="pi pi-plus"></i> Ajouter
                   </button>
                 </div>

                 <div style="display: flex; flex-direction: column; gap: 16px;">
                   @for (q of editingForm.questions; track $index) {
                     <div style="background: white; padding: 20px; border-radius: 16px; border: 1px solid #E5E7EB; box-shadow: 0 2px 8px rgba(0,0,0,0.02); position: relative;">
                       <button (click)="removeQuestion($index)" style="position: absolute; top: 16px; right: 16px; padding: 8px; background: #fce4ec; color: #C0392B; border: none; border-radius: 8px; cursor: pointer; transition: all .2s;">
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
                             <input type="checkbox" [(ngModel)]="q.required" style="width: 16px; height: 16px; accent-color: #e91e63;"> Obligatoire
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
               <button (click)="saveForm()" [disabled]="!editingForm.title || isSaving" class="btn-gradient-kpi" [style.opacity]="!editingForm.title || isSaving ? '0.5' : '1'">
                 <i class="pi" [ngClass]="isSaving ? 'pi-spin pi-spinner' : 'pi-send'"></i>
                 {{ isSaving ? 'Envoi en cours...' : 'Sauvegarder et envoyer' }}
               </button>
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
      background: #e91e63; border: none; cursor: pointer;
      transition: all .2s; box-shadow: 0 4px 12px rgba(234, 80, 115, 0.3);
    }
    .btn-gradient-kpi:hover:not(:disabled) { background: #c2185b; transform: translateY(-1px); }
    .search-input-kpi {
      width: 100%; border: 1px solid #E5E7EB; border-radius: 12px; font-size: 14px; 
      outline: none; color: #333; transition: border-color .2s; background: #fff; box-sizing: border-box;
    }
    .search-input-kpi:focus { border-color: #e91e63; }
    .filter-select-kpi {
      border: 1px solid #E5E7EB; border-radius: 12px; font-size: 14px; 
      outline: none; color: #333; cursor: pointer; background: #fff; transition: border-color .2s;
    }
    .filter-select-kpi:focus { border-color: #e91e63; }
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
  allCoaches = signal<FormUser[]>([]); // Used specifically for form builder (filtered by programme)
  globalCoaches = signal<FormUser[]>([]); // All coaches for display
  matchedEntrepreneurs = signal<any[]>([]);
  isLoadingMatchedEntrepreneurs = signal<boolean>(false);

  // Responses modal
  showResponsesModal = false;
  viewingForm = signal<KpiForm | null>(null);
  formResponses = signal<any[]>([]);
  isLoadingResponses = false;

  pageTab = signal<PageTab>('allRatings');
  ratings = signal<CoachRating[]>([]);
  formsList = signal<KpiForm[]>([]);
  selectedRating = signal<CoachRating | null>(null);

  // Flat evaluation responses (one entry per entrepreneur per form)
  flatEvalResponses = signal<FlatEvalResponse[]>([]);
  selectedFlatResponse = signal<FlatEvalResponse | null>(null);
  isLoadingFlatResponses = false;

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

    // Load all thematiques for dropdowns
    this.kpiFormSvc.getAllThematiques().subscribe(t => this.allThematiques.set(t || []));

    // Load all coaches globally to map coachId -> Name
    this.kpiFormSvc.getAllCoaches().subscribe(c => this.globalCoaches.set(c || []));
  }

  getCoachName(coachId?: number): string {
    if (!coachId) return '—';
    const coach = this.globalCoaches().find(c => c.id === coachId);
    return coach ? `${coach.firstName} ${coach.lastName}` : 'Coach inconnu';
  }

  loadForms() {
    this.isLoadingFlatResponses = true;
    this.kpiFormSvc.getEvaluationForms().subscribe(f => {
      const forms = f || [];
      this.formsList.set(forms);
      this.loadAllEvaluationResponses(forms);
    });
  }

  loadAllEvaluationResponses(forms: KpiForm[]) {
    if (!forms.length) {
      this.flatEvalResponses.set([]);
      this.isLoadingFlatResponses = false;
      return;
    }
    const flat: FlatEvalResponse[] = [];
    let remaining = forms.length;
    forms.forEach(form => {
      this.kpiFormSvc.getResponsesForForm(form.id!).subscribe({
        next: (responses) => {
          (responses || []).forEach(resp => {
            const thematiqueName = form.thematiqueLabel ||
              this.allThematiques().find(t => t.id === form.thematiqueId)?.nom || '';
            flat.push({
              formId: form.id!,
              formTitle: form.title,
              coachId: form.coachId,
              programmeName: this.getProgrammeName(form.programmeId),
              thematiqueName,
              response: resp
            });
          });
          remaining--;
          if (remaining === 0) {
            flat.sort((a, b) => {
              const da = new Date(a.response.submittedAt || 0).getTime();
              const db = new Date(b.response.submittedAt || 0).getTime();
              return db - da;
            });
            this.flatEvalResponses.set([...flat]);
            this.isLoadingFlatResponses = false;
          }
        },
        error: () => {
          remaining--;
          if (remaining === 0) {
            this.flatEvalResponses.set([...flat]);
            this.isLoadingFlatResponses = false;
          }
        }
      });
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
    this.allCoaches.set([]);
    this.matchedEntrepreneurs.set([]);
    this.showFormModal = true;
  }

  openFormModalForEdit(form: KpiForm) {
    this.editingForm = JSON.parse(JSON.stringify(form));
    if (this.editingForm.programmeId) {
       this.kpiFormSvc.getCoachesByProgramme(this.editingForm.programmeId).subscribe(c => {
         this.allCoaches.set(c || []);
         this.loadMatchedEntrepreneurs();
       });
    } else {
       this.allCoaches.set([]);
       this.matchedEntrepreneurs.set([]);
    }
    this.showFormModal = true;
  }

  closeModals() {
    this.showFormModal = false;
    this.showResponsesModal = false;
    this.selectedFlatResponse.set(null);
  }

  openFlatResponseModal(fr: FlatEvalResponse) {
    this.selectedFlatResponse.set(fr);
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
    if (tId) {
      const theme = this.allThematiques().find(t => t.id === Number(tId));
      if (theme?.programmeId) {
        this.editingForm.programmeId = theme.programmeId;
        this.kpiFormSvc.getCoachesByProgramme(theme.programmeId).subscribe(c => {
          this.allCoaches.set(c || []);
          this.loadMatchedEntrepreneurs();
        });
      }
    } else {
      this.editingForm.programmeId = undefined;
      this.allCoaches.set([]);
      this.matchedEntrepreneurs.set([]);
    }
  }

  onCoachChange() {
    this.loadMatchedEntrepreneurs();
  }

  loadMatchedEntrepreneurs() {
    const pId = this.editingForm.programmeId;
    const tId = this.editingForm.thematiqueId;
    const cId = this.editingForm.coachId;
    if (pId && tId && cId) {
      this.isLoadingMatchedEntrepreneurs.set(true);
      this.kpiFormSvc.getEntrepreneursForEvaluationCoach(Number(pId), Number(tId), Number(cId)).subscribe({
        next: (ent) => {
          this.matchedEntrepreneurs.set(ent || []);
          this.isLoadingMatchedEntrepreneurs.set(false);
        },
        error: () => {
          this.matchedEntrepreneurs.set([]);
          this.isLoadingMatchedEntrepreneurs.set(false);
        }
      });
    } else {
      this.matchedEntrepreneurs.set([]);
    }
  }

  addQuestion() {
    this.editingForm.questions.push({ text: '', type: 'TEXT', required: false });
  }

  removeQuestion(idx: number) {
    this.editingForm.questions.splice(idx, 1);
  }

  isSaving = false;

  saveForm() {
    if (this.isSaving) return;
    this.isSaving = true;
    
    // Ensure form type is EVALUATION
    this.editingForm.formType = 'EVALUATION';

    const request = this.editingForm.id 
      ? this.kpiFormSvc.updateForm(this.editingForm.id, this.editingForm) 
      : this.kpiFormSvc.createForm(this.editingForm);
      
    request.subscribe({
      next: (form) => {
        this.loadForms();
        this.closeModals();
        this.isSaving = false;
      },
      error: (e) => {
        console.error('Failed to save form', e);
        this.isSaving = false;
      }
    });
  }

  programs = computed(() => Array.from(new Set(this.flatEvalResponses().map(fr => fr.programmeName).filter(Boolean))));
  coaches = computed(() => Array.from(new Set(this.flatEvalResponses().map(fr => this.getCoachName(fr.coachId)).filter(n => n !== '—' && n !== 'Coach inconnu'))));

  kpis = computed(() => {
    const list = this.flatEvalResponses();
    return {
      total: list.length,
      pending: list.filter(fr => fr.response.status === 'PENDING').length,
      submitted: list.filter(fr => fr.response.status === 'SUBMITTED').length,
      forms: this.formsList().length
    };
  });

  kpiCards = computed(() => {
    const data = this.kpis();
    return [
      { label: 'RÉPONSES TOTALES', sub: 'au total', value: data.total, icon: 'pi-chart-bar', gradient: 'linear-gradient(135deg, #ec407a 0%, #d81b60 100%)', shadow: '0 4px 16px rgba(236,64,122,0.30)' },
      { label: 'EN ATTENTE', sub: 'non soumises', value: data.pending, icon: 'pi-clock', gradient: 'linear-gradient(135deg, #8e24aa 0%, #5e1174 100%)', shadow: '0 4px 16px rgba(142,36,170,0.30)' },
      { label: 'SOUMISES', sub: 'réponses reçues', value: data.submitted, icon: 'pi-check-circle', gradient: 'linear-gradient(135deg, #26a69a 0%, #00695c 100%)', shadow: '0 4px 16px rgba(38,166,154,0.30)' },
      { label: 'FORMULAIRES', sub: 'envoyés', value: data.forms, icon: 'pi-file', gradient: 'linear-gradient(135deg, #ff7043 0%, #ff1100 100%)', shadow: '0 4px 16px rgba(255,112,67,0.30)' },
    ];
  });

  filteredFlat = computed(() => {
    return this.flatEvalResponses().filter(fr => {
      if (this.filterProgram !== 'all' && fr.programmeName !== this.filterProgram) return false;
      const cName = this.getCoachName(fr.coachId);
      if (this.filterCoach !== 'all' && cName !== this.filterCoach) return false;
      if (this.filterStatus !== 'all' && fr.response.status !== this.filterStatus) return false;
      return true;
    });
  });

  filtered = computed(() => this.filteredFlat());


  hasFilters = computed(() => this.filterProgram !== 'all' || this.filterCoach !== 'all' || this.filterStatus !== 'all');

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
