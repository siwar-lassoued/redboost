import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KpiFormService, KpiForm, KpiFormQuestion, KpiFormResponse, User, ThematiqueCoaching } from './kpi-form.service';
import { ActivatedRoute } from '@angular/router';
import { ProgrammeService } from '../programmes/programme.service';

@Component({
  selector: 'rb-admin-kpi-forms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cand-page">
      <!-- Header -->
      <div class="cand-header">
        <div>
          <h1 class="cand-title">Formulaires KPI</h1>
          <p class="cand-subtitle">Créez et envoyez des formulaires pour automatiser la collecte des KPIs</p>
        </div>
        <div class="cand-header-actions">
          <button (click)="openFormModal()" class="btn-gradient">
            <i class="pi pi-plus text-sm"></i>
            Nouveau Formulaire
          </button>
        </div>
      </div>

      <!-- Stats  -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        @for (stat of stats(); track stat.label) {
          <div style="border-radius: 20px; padding: 20px; color: white; position: relative; overflow: hidden;" 
               [style.background]="stat.gradient" [style.boxShadow]="stat.shadow">
            <div style="position: absolute; right: -16px; top: -16px; border-radius: 50%; width: 64px; height: 64px; background: rgba(255,255,255,0.1);"></div>
            <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; opacity: 0.9;">{{ stat.label }}</p>
            <h3 style="font-size: 32px; font-weight: 900; margin: 0;">{{ stat.value }}</h3>
          </div>
        }
      </div>

      <!-- Tabs Nav -->
      <div style="display: flex; gap: 12px; mb-6; margin-bottom: 24px;">
        <button (click)="pageTab.set('responses')" 
          [class]="pageTab() === 'responses' ? 'bg-[#ec407a] text-white shadow-lg shadow-[0_4px_12px_rgba(236,64,122,0.3)]' : 'bg-white text-gray-500 hover:bg-gray-50'"
          class="btn-tab-premium"
          style="border: 1px solid #E5E7EB; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 14px; transition: all 0.2s;">
          <i class="pi pi-list text-sm"></i>
          Toutes les réponses
        </button>
        <button (click)="pageTab.set('forms')" 
          [class]="pageTab() === 'forms' ? 'bg-[#ec407a] text-white shadow-lg shadow-[0_4px_12px_rgba(236,64,122,0.3)]' : 'bg-white text-gray-500 hover:bg-gray-50'"
          class="btn-tab-premium"
          style="border: 1px solid #E5E7EB; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 14px; transition: all 0.2s;">
          <i class="pi pi-file text-sm"></i>
          Formulaires KPI
        </button>
      </div>

      <!-- Table Section -->
      @if (pageTab() === 'responses') {
        <div class="table-card">
          <div class="table-scroll">
            <table class="cand-table">
              <thead>
                <tr>
                  <th>Formulaire</th>
                  <th>Programme</th>
                  <th>Entrepreneur</th>
                  <th>Date de soumission</th>
                  <th style="text-align: center;">Statut</th>
                  <th style="text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (resp of allResponses(); track resp.id || $index) {
                  <tr class="table-row">
                    <td>
                      <div class="name-cell">
                        <span class="name-text">{{ resp.formTitle }}</span>
                        <div style="margin-top: 4px; display: flex; gap: 4px;">
                          <span class="kf-type-tag" [ngClass]="resp.formType === 'EVALUATION' ? 'eval-tag' : 'kpi-tag'" style="padding: 2px 6px; font-size: 9px; font-weight: 800; border-radius: 4px; display: inline-flex; align-items: center; gap: 2px;">
                            <i class="pi" [ngClass]="resp.formType === 'EVALUATION' ? 'pi-star' : 'pi-chart-line'" style="font-size: 8px;"></i>
                            {{ resp.formType === 'EVALUATION' ? 'Évaluation Coach' : 'KPI' }}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="prog-badge">
                        <i class="pi pi-book" style="font-size: 10px;"></i>
                        {{ getProgrammeName(resp.programmeId) }}
                      </span>
                    </td>
                    <td>
                      <span style="font-weight: 700; color: #1A1A2E;">{{ resp.entrepreneurName }}</span>
                    </td>
                    <td class="date-cell">
                      @if (resp.submittedAt) {
                        {{ resp.submittedAt | date:'dd/MM/yyyy HH:mm' }}
                      } @else {
                        <span style="color: #9CA3AF; font-style: italic;">Non soumis</span>
                      }
                    </td>
                    <td style="text-align: center;">
                      <span class="status-badge"
                        [ngClass]="{
                          'bg-amber-100 text-amber-700': resp.status === 'PENDING',
                          'bg-emerald-100 text-emerald-700': resp.status === 'SUBMITTED',
                          'bg-blue-100 text-blue-700': resp.status === 'VALIDATED'
                        }">
                        {{ resp.status === 'PENDING' ? 'En attente' : resp.status === 'SUBMITTED' ? 'Soumis' : 'Validé' }}
                      </span>
                    </td>
                    <td style="text-align: center;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <button (click)="selectedResponse.set(resp)" title="Voir les réponses" class="btn-detail" style="color: #e91e63; font-size: 1.1rem; padding: 6px; border-radius: 8px; background: none; border: none; cursor: pointer;">
                          <i class="pi pi-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @if (allResponses().length === 0) {
                  <tr>
                    <td colSpan="6">
                      <div class="empty-state">
                        <i class="pi pi-inbox" style="font-size: 3rem; color: #D1D5DB; margin-bottom: 1rem; display: block;"></i>
                        <p class="empty-text">Aucune réponse soumise</p>
                        <p class="empty-sub">Les réponses des entrepreneurs s'afficheront ici.</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (pageTab() === 'forms') {
        <div class="table-card">
          <div class="table-scroll">
            <table class="cand-table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Programme</th>
                  <th>Créé le</th>
                  <th>Deadline</th>
                  <th>Questions</th>
                  <th style="text-align: center;">Statut</th>
                  <th style="text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (f of forms(); track f.id) {
                  <tr class="table-row">
                    <td>
                      <div class="name-cell">
                        <span class="name-text">{{ f.title }}</span>
                        <span class="email-text line-clamp-1" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ f.description }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="prog-badge">
                        <i class="pi pi-book" style="font-size: 10px;"></i>
                        {{ getProgrammeName(f.programmeId) }}
                      </span>
                    </td>
                    <td class="date-cell">{{ f.createdAt | date:'dd/MM/yyyy' }}</td>
                    <td class="date-cell" style="color: #e91e63; font-weight: 700;">{{ f.deadline | date:'dd/MM/yyyy' }}</td>
                    <td>
                      <span style="font-size: 14px; font-weight: 700; color: #1A1A2E;">{{ f.questions.length || 0 }}</span>
                    </td>
                    <td style="text-align: center;">
                      <span class="status-badge"
                        [ngClass]="{
                          'bg-gray-100 text-gray-600': f.status === 'DRAFT',
                          'bg-emerald-100 text-emerald-600': f.status === 'SENT',
                          'bg-red-100 text-red-600': f.status === 'CLOSED'
                        }">
                        {{ f.status }}
                      </span>
                    </td>
                    <td style="text-align: center;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                         <button (click)="openFormModal(f)" title="Éditer" class="btn-detail"><i class="pi pi-pencil"></i></button>
                         <button (click)="openSendModal(f)" title="Envoyer" class="btn-detail" style="color: #059669"><i class="pi pi-send"></i></button>
                         <button (click)="viewResponses(f)" title="Réponses" class="btn-detail" style="color: #1565C0"><i class="pi pi-users"></i></button>
                      </div>
                    </td>
                  </tr>
                }
                @if (forms().length === 0) {
                  <tr>
                    <td colSpan="8">
                      <div class="empty-state">
                        <i class="pi pi-file-edit" style="font-size: 3rem; color: #D1D5DB; margin-bottom: 1rem; display: block;"></i>
                        <p class="empty-text">Aucun formulaire trouvé</p>
                        <p class="empty-sub">Créez votre premier formulaire KPI.</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- FORM BUILDER MODAL -->
      @if (showFormModal) {
        <div class="modal-overlay" (click)="closeModals()">
          <div class="modal-box" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-info">
                <h2 class="modal-name">{{ editingForm.id ? 'Modifier' : 'Nouveau' }} Formulaire KPI</h2>
              </div>
              <button (click)="closeModals()" class="modal-close"><i class="pi pi-times"></i></button>
            </div>
            
            <div class="modal-body" style="background: #F9FAFB;">
               <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                 <div style="grid-column: span 2;">
                   <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Titre du formulaire *</label>
                   <input type="text" [(ngModel)]="editingForm.title" class="search-input" style="padding: 12px 16px;">
                 </div>
                 <div style="grid-column: span 2;">
                   <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Description</label>
                   <textarea [(ngModel)]="editingForm.description" rows="2" class="search-input" style="padding: 12px 16px; resize: vertical;"></textarea>
                 </div>
                 
                 <div>
                   <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Date limite</label>
                   <input type="date" [(ngModel)]="editingForm.deadline" class="search-input" style="padding: 11px 16px;">
                 </div>

                 <div>
                   <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Thématique</label>
                   <select [(ngModel)]="editingForm.thematiqueId" (change)="onThematiqueChange()" class="filter-select" style="width: 100%; padding: 12px 16px;">
                     <option [ngValue]="null">-- Sélectionner une thématique --</option>
                     @for (t of allThematiques(); track t.id) {
                       <option [ngValue]="t.id">{{ t.nom }}</option>
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

              <!-- Matched Entrepreneurs Preview -->
              @if (editingForm.programmeId && editingForm.thematiqueId) {
                <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #E5E7EB; border-radius: 12px; background: #F9FAFB;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 style="font-size: 13px; font-weight: 800; color: #1A1A2E; margin: 0;">Entrepreneurs ciblés</h4>
                    <span style="font-size: 11px; font-weight: 700; color: #e91e63; background: #fce4ec; padding: 4px 8px; border-radius: 8px;">
                      {{ entrepreneurs().length }} destinataire(s)
                    </span>
                  </div>
                  @if (isLoadingEntrepreneurs()) {
                    <div style="text-align: center; padding: 12px;">
                      <i class="pi pi-spin pi-spinner" style="color: #e91e63; font-size: 1.2rem;"></i>
                      <span style="font-size: 12px; color: #6B7280; margin-left: 8px;">Vérification des correspondances...</span>
                    </div>
                  } @else if (entrepreneurs().length === 0) {
                    <div style="text-align: center; padding: 12px; color: #6B7280; font-size: 12px; font-style: italic;">
                      Aucun entrepreneur n'a de matching validé pour cette thématique. Le formulaire ne sera envoyé à personne.
                    </div>
                  } @else {
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                      @for (ent of entrepreneurs(); track ent.id) {
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

               <div>
                 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #E5E7EB;">
                   <h3 style="font-size: 16px; font-weight: 800; color: #1A1A2E; margin: 0;">Questions</h3>
                   <button (click)="addQuestion()" class="btn-outline-sm" style="color: #e91e63; border-color: #e91e63;">
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
                           <input type="text" [(ngModel)]="q.text" placeholder="Poser la question..." class="search-input" style="padding: 10px 14px;">
                         </div>
                         <div style="grid-column: span 1;">
                           <label style="display: block; font-size: 10px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Type de réponse</label>
                           <select [(ngModel)]="q.type" class="filter-select" style="width: 100%; padding: 10px 14px;">
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
                              <input type="text" [(ngModel)]="q.options" placeholder="Option 1, Option 2, Option 3..." class="search-input" style="padding: 10px 14px;">
                           </div>
                            <div style="grid-column: span 3; background: #fce4ec; padding: 12px 16px; border-radius: 12px; border: 1px solid #fad2e1; display: flex; align-items: center; gap: 16px; margin-top: 8px;">
                              <div style="flex: 1;">
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800; color: #C0392B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
                                  <i class="pi pi-link"></i> Lier à un KPI Backoffice (Automatique)
                                </label>
                                <div style="display: flex; gap: 12px; align-items: center;">
                                  <select [(ngModel)]="q.kpiId" class="filter-select" style="flex: 1; padding: 8px 12px;">
                                    <option [value]="undefined">-- Aucun KPI lié --</option>
                                    @for (k of availableKpis(); track k.id) {
                                      <option [value]="k.id">{{ k.nom }} ({{ k.uniteMesure }})</option>
                                    }
                                  </select>
                                  <p style="font-size: 11px; color: #e91e63; margin: 0; line-height: 1.4; max-width: 200px;">
                                    La réponse mettra à jour automatiquement ce KPI pour l'entrepreneur.
                                  </p>
                                </div>
                              </div>
                            </div>
                         }

                       </div>
                     </div>
                   }
                   @if (!editingForm.questions.length) {
                     <div class="empty-state" style="padding: 30px 20px; border: 2px dashed #E5E7EB; background: white;">
                       <p class="empty-text" style="color: #9CA3AF;">Aucune question ajoutée. Cliquez sur "Ajouter".</p>
                     </div>
                   }
                 </div>
               </div>
            </div>

            <div class="modal-footer">
               <button (click)="closeModals()" class="btn-close-modal" [disabled]="isSavingForm">Annuler</button>
               <button (click)="saveForm()" [disabled]="!editingForm.title || isSavingForm" class="btn-gradient" [style.opacity]="(!editingForm.title || isSavingForm) ? '0.5' : '1'">
                 @if (isSavingForm) {
                   <i class="pi pi-spin pi-spinner" style="margin-right: 8px;"></i>
                 }
                 Sauvegarder
               </button>
            </div>
          </div>
        </div>
      }

      <!-- SEND MODAL -->
      @if (showSendModal) {
        <div class="modal-overlay" (click)="closeModals()">
          <div class="modal-box" style="max-width: 600px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-info">
                <h2 class="modal-name">Envoyer un Formulaire</h2>
              </div>
              <button (click)="closeModals()" class="modal-close"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="background: #F9FAFB;">
               <div class="note-box note-info" style="margin-top: 0; margin-bottom: 20px; background: #fce4ec; border-color: #e91e63;">
                  <p style="color: #333;">Vous allez envoyer le formulaire <strong style="color: #1A1A2E;">"{{ formToSend?.title }}"</strong> à des entrepreneurs.</p>
               </div>
               
               <div style="margin-bottom: 24px;">
                 <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Sélectionner les Entrepreneurs</label>
                 
                 <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                   <button (click)="selectAllEntrepreneurs()" class="btn-outline-sm" style="font-size: 11px; padding: 6px 12px;">Tout sélectionner</button>
                   <button (click)="deselectAllEntrepreneurs()" class="btn-outline-sm" style="font-size: 11px; padding: 6px 12px;">Tout désélectionner</button>
                 </div>

                 <div style="background: white; border: 1px solid #E5E7EB; border-radius: 16px; max-height: 300px; overflow-y: auto;">
                   @if (availableEntrepreneurs().length === 0) {
                     <div style="padding: 24px; text-align: center; color: #9CA3AF;">
                       <i class="pi pi-users" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
                       Aucun entrepreneur trouvé pour ce programme.
                     </div>
                   }
                   @for (ent of availableEntrepreneurs(); track ent.id) {
                     <label style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #F3F4F6; cursor: pointer; transition: background .2s;">
                       <input type="checkbox" 
                              [checked]="selectedEntIds().includes(ent.id)" 
                              (change)="toggleEntrepreneurSelection(ent.id)"
                              style="width: 18px; height: 18px; accent-color: #e91e63;">
                       <div style="display: flex; flex-direction: column;">
                         <span style="font-size: 14px; font-weight: 700; color: #1A1A2E;">{{ ent.firstName }} {{ ent.lastName }}</span>
                         <span style="font-size: 11px; color: #6B7280;">ID: {{ ent.id }} · {{ ent.email }}</span>
                       </div>
                     </label>
                   }
                 </div>
                 
                 <div style="margin-top: 16px; padding: 12px; background: #F0F9FF; border-radius: 12px; border: 1px solid #E0F2FE;">
                   <p style="font-size: 12px; color: #0369a1; margin: 0; font-weight: 600;">
                     <i class="pi pi-check-circle" style="margin-right: 6px;"></i>
                     {{ selectedEntIds().length }} entrepreneur(s) sélectionné(s)
                   </p>
                 </div>
               </div>
            </div>
            <div class="modal-footer">
               <button (click)="closeModals()" class="btn-close-modal" [disabled]="isSendingForm">Annuler</button>
               <button (click)="submitSendForm()" [disabled]="isSubmitDisabled() || isSendingForm" class="btn-gradient" [style.opacity]="(isSubmitDisabled() || isSendingForm) ? '0.5' : '1'">
                 @if (isSendingForm) {
                   <i class="pi pi-spin pi-spinner" style="margin-right: 8px;"></i>
                 }
                 Envoyer
               </button>
            </div>
          </div>
        </div>
      }

      <!-- RESPONSES MODAL -->
      @if (showResponsesModal && viewingForm()) {
        <div class="modal-overlay" (click)="closeModals()">
          <div class="modal-box" style="max-width: 850px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-info">
                <h2 class="modal-name">Réponses — {{ viewingForm()?.title }}</h2>
                <p style="font-size:12px;color:#6B7280;margin:4px 0 0;">{{ formResponses().length }} réponse(s) reçue(s)</p>
              </div>
              <button (click)="closeModals()" class="modal-close"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="background: #F9FAFB; max-height: 70vh; overflow-y: auto;">
              @if (isLoadingResponses) {
                <div style="text-align:center;padding:40px;">
                  <i class="pi pi-spin pi-spinner" style="font-size:2rem;color:#e91e63;"></i>
                  <p style="margin-top:10px;color:#6B7280;">Chargement des réponses...</p>
                </div>
              } @else if (formResponses().length === 0) {
                <div class="empty-state">
                  <i class="pi pi-inbox" style="font-size: 3rem; color: #D1D5DB; margin-bottom: 1rem; display: block;"></i>
                  <p class="empty-text">Aucune réponse reçue</p>
                  <p class="empty-sub">Les entrepreneurs n'ont pas encore soumis leurs réponses.</p>
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
                          <span style="font-size:10px;font-weight:900;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.05em;"
                            [ngClass]="{'bg-amber-100 text-amber-700': resp.status==='PENDING', 'bg-emerald-100 text-emerald-700': resp.status==='SUBMITTED', 'bg-blue-100 text-blue-700': resp.status==='VALIDATED'}">
                            {{ resp.status === 'PENDING' ? 'En attente' : resp.status === 'SUBMITTED' ? 'Soumis' : 'Validé' }}
                          </span>
                          @if (resp.submittedAt) {
                            <span style="font-size:11px;color:#6B7280;">{{ resp.submittedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                          }
                        </div>
                      </div>

                      @if (resp.answers && resp.answers.length > 0) {
                        <div style="display:flex;flex-direction:column;gap:10px;">
                          @for (ans of resp.answers; track ans.questionId) {
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
                  }
                </div>
              }
            </div>
            <div class="modal-footer">
              <button (click)="closeModals()" class="btn-close-modal">Fermer</button>
            </div>
          </div>
        </div>
      }

      <!-- INDIVIDUAL RESPONSE DETAIL MODAL -->
      @if (selectedResponse()) {
        <div class="modal-overlay" (click)="selectedResponse.set(null)">
          <div class="modal-box" style="max-width: 850px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-info">
                <h2 class="modal-name">Réponses — {{ selectedResponse()?.formTitle }}</h2>
                <p style="font-size:12px;color:#6B7280;margin:4px 0 0;">
                  <span class="kf-type-tag" [ngClass]="selectedResponse()?.formType === 'EVALUATION' ? 'eval-tag' : 'kpi-tag'" style="padding: 2px 6px; font-size: 9px; font-weight: 800; border-radius: 4px; display: inline-flex; align-items: center; gap: 2px;">
                    <i class="pi" [ngClass]="selectedResponse()?.formType === 'EVALUATION' ? 'pi-star' : 'pi-chart-line'" style="font-size: 8px;"></i>
                    {{ selectedResponse()?.formType === 'EVALUATION' ? 'Évaluation Coach' : 'KPI' }}
                  </span>
                </p>
              </div>
              <button (click)="selectedResponse.set(null)" class="modal-close"><i class="pi pi-times"></i></button>
            </div>
            
            <div class="modal-body" style="background: #F9FAFB; max-height: 70vh; overflow-y: auto;">
              <div style="background:#fff;border-radius:16px;padding:20px;border:1px solid #E5E7EB;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#e91e63,#c2185b);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:14px;">
                      {{ (selectedResponse()?.entrepreneurName || 'E').charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p style="font-weight:800;font-size:14px;color:#1A1A2E;margin:0;">{{ selectedResponse()?.entrepreneurName || 'Entrepreneur' }}</p>
                      <p style="font-size:11px;color:#9CA3AF;margin:0;">ID: {{ selectedResponse()?.entrepreneurId }}</p>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:10px;font-weight:900;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.05em;"
                      [ngClass]="{'bg-amber-100 text-amber-700': selectedResponse()?.status==='PENDING', 'bg-emerald-100 text-emerald-700': selectedResponse()?.status==='SUBMITTED', 'bg-blue-100 text-blue-700': selectedResponse()?.status==='VALIDATED'}">
                      {{ selectedResponse()?.status === 'PENDING' ? 'En attente' : selectedResponse()?.status === 'SUBMITTED' ? 'Soumis' : 'Validé' }}
                    </span>
                    @if (selectedResponse()?.submittedAt) {
                      <span style="font-size:11px;color:#6B7280;">{{ selectedResponse()?.submittedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                    }
                  </div>
                </div>

                @if (selectedResponse()?.answers && selectedResponse()!.answers.length > 0) {
                  <div style="display:flex;flex-direction:column;gap:10px;">
                    @for (ans of selectedResponse()!.answers; track ans.questionId || $index) {
                      <div style="background:#f8f9fa;border-radius:12px;padding:14px;border-left:4px solid #e91e63;">
                        <p style="font-size:10px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">{{ ans.questionText }}</p>
                        
                        @if (ans.questionId === -1) {
                          <!-- 5-Star General Rating Block -->
                          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                              @for (s of [1,2,3,4,5]; track s) {
                                <i class="pi" 
                                   [ngClass]="s <= toNumber(ans.answerValue) ? 'pi-star-fill' : 'pi-star'"
                                   [style.color]="s <= toNumber(ans.answerValue) ? '#F59E0B' : '#E5E7EB'"
                                   style="font-size: 24px;">
                                </i>
                              }
                              <span style="font-size: 18px; font-weight: 900; color: #1A1A2E; margin-left: 8px;">
                                {{ ans.answerValue }} / 5
                              </span>
                            </div>
                            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;"
                              [style.color]="toNumber(ans.answerValue) >= 4 ? '#22C55E' : (toNumber(ans.answerValue) >= 3 ? '#F97316' : '#e91e63')">
                              {{ toNumber(ans.answerValue) === 5 ? 'Excellent !' : toNumber(ans.answerValue) === 4 ? 'Très bien' : toNumber(ans.answerValue) === 3 ? 'Bien' : toNumber(ans.answerValue) === 2 ? 'Moyen' : 'Décevant' }}
                            </span>
                          </div>
                        } @else {
                          <p style="font-size:14px;font-weight:600;color:#1A1A2E;margin:0;">{{ ans.answerValue || '—' }}</p>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <p style="font-size:13px;color:#9CA3AF;font-style:italic;margin:0;">Aucune réponse fournie.</p>
                }
              </div>
            </div>
            
            <div class="modal-footer">
              <button (click)="selectedResponse.set(null)" class="btn-close-modal">Fermer</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    
    /* ── Page ── */
    .cand-page { padding: 24px; background: #F5F6FA; min-height: 100vh; font-family: var(--font-family, 'Inter', sans-serif); }
    .cand-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .cand-title { font-size: 28px; font-weight: 800; color: #1A1A2E; margin: 0; }
    .cand-subtitle { color: #8a8a8a; font-size: 14px; margin-top: 4px; margin-bottom: 0; }
    .cand-header-actions { display: flex; align-items: center; gap: 12px; }

    /* ── Buttons ── */
    .btn-gradient {
      display: flex; align-items: center; gap: 8px; padding: 10px 20px;
      border-radius: 12px; font-size: 14px; font-weight: 600; color: #fff;
      background: #e91e63; border: none; cursor: pointer;
      transition: all .2s; box-shadow: 0 4px 12px rgba(234, 80, 115, 0.3);
    }
    .btn-gradient:hover:not(:disabled) { background: #c2185b; transform: translateY(-1px); }
    
    .btn-outline-sm {
      display: flex; align-items: center; gap: 8px; padding: 8px 16px;
      border-radius: 10px; font-size: 13px; font-weight: 700;
      background: #fff; color: #333; border: 1px solid #E5E7EB; cursor: pointer; transition: all .2s;
    }
    .btn-outline-sm:hover { background: #F3F4F6; }

    /* ── Inputs ── */
    .search-input {
      width: 100%; border: 1px solid #E5E7EB; border-radius: 12px; font-size: 14px; 
      outline: none; color: #333; transition: border-color .2s; background: #fff; box-sizing: border-box;
    }
    .search-input:focus { border-color: #e91e63; }
    .filter-select {
      border: 1px solid #E5E7EB; border-radius: 12px; font-size: 14px; 
      outline: none; color: #333; cursor: pointer; background: #fff; transition: border-color .2s;
    }
    .filter-select:focus { border-color: #e91e63; }

    /* ── Table ── */
    .table-card { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
    .table-scroll { overflow-x: auto; min-width: 100%; }
    .cand-table { width: 100%; border-collapse: collapse; text-align: left; }
    .cand-table th {
      padding: 12px 16px; font-size: 11px; font-weight: 700; color: #6B7280;
      text-transform: uppercase; letter-spacing: 0.05em; background: #F9FAFB; border-bottom: 1px solid #F3F4F6;
    }
    .cand-table td { padding: 14px 16px; }
    .table-row { border-bottom: 1px solid #F3F4F6; transition: background .15s; }
    .table-row:hover { background: #FFF5F8; }
    
    .name-cell { display: flex; flex-direction: column; }
    .name-text { font-weight: 700; font-size: 14px; color: #1A1A2E; margin-bottom: 2px; }
    .email-text { font-size: 12px; color: #9CA3AF; }
    .prog-badge { font-size: 12px; padding: 4px 10px; border-radius: 20px; background: #E3F2FD; color: #1565C0; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
    .date-cell { white-space: nowrap; font-size: 13px; color: #6B7280; font-weight: 500; }
    .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 4px; }
    
    .btn-detail { padding: 6px; border-radius: 8px; font-size: 14px; color: #6B7280; background: none; border: none; cursor: pointer; transition: all .2s; }
    .btn-detail:hover { background: #F3F4F6; color: #e91e63; }

    .empty-state { text-align: center; padding: 60px 20px; background: #fff; border-radius: 20px; }
    .empty-text { color: #4A5568; font-weight: 700; font-size: 16px; margin: 0; }
    .empty-sub { color: #9CA3AF; font-size: 13px; margin-top: 4px; }

    /* ── Modal ── */
    .modal-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
    .modal-box { background: #fff; border-radius: 24px; width: 100%; max-width: 800px; max-height: 90vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15); display: flex; flex-direction: column; }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid #F3F4F6; background: #fff; display: flex; align-items: center; justify-content: space-between; }
    .modal-header-info { flex: 1; }
    .modal-name { font-weight: 800; font-size: 20px; color: #1A1A2E; margin: 0; }
    .modal-close { width: 36px; height: 36px; border-radius: 12px; border: none; background: #F3F4F6; cursor: pointer; color: #6B7280; transition: all .2s; display: flex; align-items: center; justify-content: center; }
    .modal-close:hover { background: #E5E7EB; color: #1A1A2E; }
    
    .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
    
    .modal-footer { padding: 20px 24px; border-top: 1px solid #F3F4F6; background: #fff; display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .btn-close-modal { padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; color: #6B7280; background: #F3F4F6; border: none; cursor: pointer; transition: all .2s; }
    .btn-close-modal:hover { background: #E5E7EB; color: #1A1A2E; }
    
    .note-box { padding: 12px 16px; border-radius: 12px; border-left: 4px solid; }
    
    .kf-type-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .eval-tag { background: #FEF0F1; color: #e91e63; border: 1px solid #fcd2db; }
    .kpi-tag { background: #E0F2FE; color: #0369a1; border: 1px solid #bae6fd; }
  `]
})
export class AdminKpiFormsComponent implements OnInit {
  private svc = inject(KpiFormService);
  private programmeSvc = inject(ProgrammeService); 
  private route = inject(ActivatedRoute);
  programmes = signal<{id: number, nom: string}[]>([]);
  forms = signal<KpiForm[]>([]);
  
  showFormModal = false;
  editingForm: KpiForm = this.getEmptyForm();

  showSendModal = false;
  formToSend: KpiForm | null = null;
  entrepreneurIdsString = '';

  // Signaux pour les listes dynamiques
  thematiques = signal<ThematiqueCoaching[]>([]);
  coaches = signal<User[]>([]);
  entrepreneurs = signal<User[]>([]);
  availableKpis = signal<any[]>([]);
  availableEntrepreneurs = signal<User[]>([]);
  selectedEntIds = signal<number[]>([]);
  parsedEntrepreneurIds = signal<number[]>([]);
  allThematiques = signal<ThematiqueCoaching[]>([]);

  // Responses modal
  showResponsesModal = false;
  viewingForm = signal<KpiForm | null>(null);
  formResponses = signal<KpiFormResponse[]>([]);
  isLoadingResponses = false;
  isLoadingEntrepreneurs = signal<boolean>(false);
  isSavingForm = false;
  isSendingForm = false;

  pageTab = signal<'responses' | 'forms'>('responses');
  selectedResponse = signal<any | null>(null);

  allResponses = computed(() => {
    const list: any[] = [];
    this.forms().forEach(form => {
      if (form.responses) {
        form.responses.forEach(resp => {
          list.push({
            ...resp,
            formTitle: form.title,
            programmeId: form.programmeId,
            deadline: form.deadline,
            formType: form.formType || 'KPI'
          });
        });
      }
    });
    return list.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
  });

  toNumber(val: string): number {
    return Number(val) || 0;
  }

  ngOnInit() {
    this.loadForms();
    this.programmeSvc.getAllProgrammesBasic().subscribe(p => 
      this.programmes.set(p.filter(prog => prog.id !== undefined) as {id: number, nom: string}[])
    );
    // Load all thematiques for the dropdown
    this.svc.getAllThematiques().subscribe(t => this.allThematiques.set(t || []));

    this.route.queryParams.subscribe(params => {
      if (params['openModal'] === 'true') {
        const type = params['type'] || 'KPI';
        this.openFormModal();
        if (type === 'EVALUATION') {
          this.editingForm.formType = 'EVALUATION';
        }
      }
    });
  }

  loadForms() {
    this.svc.getKpiForms().subscribe(r => this.forms.set(r || []));
  }

  getProgrammeName(id: number | undefined): string {
    if (!id) return 'Non assigné';
    const prog = this.programmes().find(p => p.id === id);
    return prog ? prog.nom : 'Programme inconnu';
  }

  loadThematiquesForProgramme(programmeId: number | undefined) {
    if (!programmeId) {
      console.log(' No programmeId, clearing thematiques');
      this.thematiques.set([]);
      return;
    }
    console.log(' Loading thematiques for programme:', programmeId);
    this.svc.getThematiquesByProgramme(programmeId).subscribe({
      next: (t) => {
        console.log('Thematiques received:', t);
        this.thematiques.set(t || []);
      },
      error: (err) => {
        console.error('Error loading thematiques:', err);
        this.thematiques.set([]);
      }
    });
  }

  loadCoachesForProgramme(programmeId: number | undefined) {
    if (!programmeId) {
      console.log(' No programmeId, clearing coaches');
      this.coaches.set([]);
      return;
    }
    console.log(' Loading coaches for programme:', programmeId);
    this.svc.getCoachesByProgramme(programmeId).subscribe({
      next: (c) => {
        console.log(' Coaches received:', c);
        this.coaches.set(c || []);
      },
      error: (err) => {
        console.error('Error loading coaches:', err);
        this.coaches.set([]);
      }
    });
  }

  loadEntrepreneursForEvaluation(programmeId: number | undefined, thematiqueId: number | undefined) {
    if (!programmeId || !thematiqueId) {
      this.entrepreneurs.set([]);
      return;
    }
    this.isLoadingEntrepreneurs.set(true);
    this.svc.getEntrepreneursForEvaluation(programmeId, thematiqueId).subscribe({
      next: (e) => {
        this.entrepreneurs.set(e || []);
        this.isLoadingEntrepreneurs.set(false);
      },
      error: (err) => {
        console.error(' Error loading entrepreneurs:', err);
        this.entrepreneurs.set([]);
        this.isLoadingEntrepreneurs.set(false);
      }
    });
  }

  loadAvailableKpis(programmeId: number | undefined) {
    if (!programmeId) {
      this.availableKpis.set([]);
      return;
    }
    this.programmeSvc.getProgrammeKpiValues(programmeId).subscribe({
      next: (kpis) => {
        this.availableKpis.set(kpis || []);
      },
      error: (err) => {
        console.error('Error loading KPIs:', err);
        this.availableKpis.set([]);
      }
    });
  }

  loadAvailableEntrepreneurs(programmeId: number | undefined, thematiqueId?: number | undefined) {
    if (!programmeId) {
      this.availableEntrepreneurs.set([]);
      return;
    }
    if (thematiqueId) {
      this.svc.getEntrepreneursForEvaluation(programmeId, thematiqueId).subscribe({
        next: (ents) => {
          this.availableEntrepreneurs.set(ents || []);
        },
        error: (err) => {
          console.error('Error loading eligible entrepreneurs:', err);
          this.availableEntrepreneurs.set([]);
        }
      });
    } else {
      this.svc.getEntrepreneursForProgramme(programmeId).subscribe({
        next: (ents) => {
          this.availableEntrepreneurs.set(ents || []);
        },
        error: (err) => {
          console.error('Error loading eligible entrepreneurs:', err);
          this.availableEntrepreneurs.set([]);
        }
      });
    }
  }

  onProgrammeChange() {
    const programmeId = this.editingForm.programmeId;
    this.loadThematiquesForProgramme(programmeId);
    this.loadCoachesForProgramme(programmeId);
    this.loadAvailableKpis(programmeId);
    // Reset thématique when programme changes
    this.editingForm.thematiqueId = undefined;
    this.entrepreneurs.set([]);
  }

  onThematiqueChange() {
    const thematiqueId = this.editingForm.thematiqueId;
    // Auto-fill programmeId based on selected thematique
    if (thematiqueId) {
      const theme = this.allThematiques().find(t => t.id === Number(thematiqueId));
      if (theme?.programmeId) {
        this.editingForm.programmeId = theme.programmeId;
        this.loadThematiquesForProgramme(theme.programmeId);
        this.loadCoachesForProgramme(theme.programmeId);
        this.loadAvailableKpis(theme.programmeId);
      }
    }
    this.loadEntrepreneursForEvaluation(this.editingForm.programmeId, this.editingForm.thematiqueId);
  }

  parseEntrepreneurIds() {
    if (!this.entrepreneurIdsString.trim()) {
      this.parsedEntrepreneurIds.set([]);
      return;
    }
    const ids = this.entrepreneurIdsString
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));
    this.parsedEntrepreneurIds.set(ids);
  }

  onEntrepreneurIdsChange() {
    this.parseEntrepreneurIds();
  }

  isSubmitDisabled(): boolean {
    return this.selectedEntIds().length === 0;
  }

  getSubmitOpacity(): string {
    return this.isSubmitDisabled() ? '0.5' : '1';
  }

  toggleEntrepreneurSelection(id: number) {
    const current = this.selectedEntIds();
    if (current.includes(id)) {
      this.selectedEntIds.set(current.filter(i => i !== id));
    } else {
      this.selectedEntIds.set([...current, id]);
    }
  }

  selectAllEntrepreneurs() {
    this.selectedEntIds.set(this.availableEntrepreneurs().map(e => e.id));
  }

  deselectAllEntrepreneurs() {
    this.selectedEntIds.set([]);
  }

  stats = computed(() => {
    const list = this.forms();
    return [
      { label: 'TOTAL FORMULAIRES', value: list.length, gradient: 'linear-gradient(135deg, #ec407a 0%, #d81b60 100%)', shadow: '0 4px 16px rgba(236,64,122,0.30)' },
      { label: 'FORMULAIRES ENVOYÉS', value: list.filter(f => f.status === 'SENT').length, gradient: 'linear-gradient(135deg, #8e24aa 0%, #5e1174 100%)', shadow: '0 4px 16px rgba(142,36,170,0.30)' },
      { label: 'EN MODE BROUILLON', value: list.filter(f => f.status === 'DRAFT').length, gradient: 'linear-gradient(135deg, #26a69a 0%, #00695c 100%)', shadow: '0 4px 16px rgba(38,166,154,0.30)' },
    ];
  });

  getEmptyForm(): KpiForm {
    return {
      title: '',
      description: '',
      questions: [],
      formType: 'KPI',
      status: 'DRAFT'
    };
  }

  openFormModal(form?: KpiForm) {
    if (form) {
      this.editingForm = { ...form, questions: [...(form.questions || [])], formType: form.formType || 'KPI' };
      if (this.editingForm.programmeId) {
        this.loadAvailableKpis(this.editingForm.programmeId);
        this.loadThematiquesForProgramme(this.editingForm.programmeId);
        this.loadCoachesForProgramme(this.editingForm.programmeId);
        this.loadEntrepreneursForEvaluation(this.editingForm.programmeId, this.editingForm.thematiqueId);
      }
    } else {
      this.editingForm = { title: '', description: '', questions: [], formType: 'KPI', status: 'DRAFT' };
      this.entrepreneurs.set([]);
    }
    this.showFormModal = true;
  }

  addQuestion() {
    if (!this.editingForm.questions) this.editingForm.questions = [];
    this.editingForm.questions.push({
      text: '',
      type: 'TEXT',
      required: false
    });
  }

  removeQuestion(index: number) {
    this.editingForm.questions.splice(index, 1);
  }

  saveForm() {
    const isNew = !this.editingForm.id;
    this.isSavingForm = true;
    const ob$ = this.editingForm.id 
      ? this.svc.updateForm(this.editingForm.id, this.editingForm)
      : this.svc.createForm(this.editingForm);

    ob$.subscribe({
      next: (form: KpiForm) => {
        this.isSavingForm = false;
        this.loadForms();
        this.closeModals();
      },
      error: (err) => {
        this.isSavingForm = false;
        console.error('Erreur lors de la sauvegarde du formulaire:', err);
        alert('Une erreur est survenue lors de la sauvegarde. Veuillez vérifier les champs.');
      }
    });
  }

  openSendModal(form: KpiForm) {
    this.formToSend = form;
    this.selectedEntIds.set([]);
    this.loadAvailableEntrepreneurs(form.programmeId, form.thematiqueId);
    this.showSendModal = true;
  }

  submitSendForm() {
    if (!this.formToSend?.id) return;
    const ids = this.selectedEntIds();
      
    if (ids.length === 0) return;

    this.isSendingForm = true;
    this.svc.sendForm(this.formToSend.id, ids).subscribe({
      next: () => {
        this.isSendingForm = false;
        this.loadForms();
        this.closeModals();
      },
      error: (err) => {
        this.isSendingForm = false;
        console.error('Erreur lors de l\'envoi du formulaire:', err);
        alert('Une erreur est survenue lors de l\'envoi.');
      }
    });
  }

  viewResponses(form: KpiForm) {
    this.viewingForm.set(form);
    this.formResponses.set([]);
    this.isLoadingResponses = true;
    this.showResponsesModal = true;
    this.svc.getResponsesForForm(form.id!).subscribe({
      next: (responses) => {
        this.formResponses.set(responses || []);
        this.isLoadingResponses = false;
      },
      error: () => {
        this.isLoadingResponses = false;
      }
    });
  }

  closeModals() {
    this.showFormModal = false;
    this.showSendModal = false;
    this.showResponsesModal = false;
  }
}
