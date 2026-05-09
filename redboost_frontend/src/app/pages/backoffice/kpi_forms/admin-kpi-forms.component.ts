import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KpiFormService, KpiForm, KpiFormQuestion } from './kpi-form.service';
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
          <h1 class="cand-title">Formulaires KPI & Évaluation</h1>
          <p class="cand-subtitle">Créez et envoyez des formulaires pour automatiser la collecte des KPIs et des évaluations</p>
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

      <!-- Table Section -->
      <div class="table-card">
        <div class="table-scroll">
          <table class="cand-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Programme</th>
                <th>Créé le</th>
                <th>Deadline</th>
                <th>Type</th>
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
                  <td class="date-cell" style="color: #ea5073; font-weight: 700;">{{ f.deadline | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <span class="status-badge" [ngClass]="{'bg-blue-100 text-blue-600': f.formType === 'EVALUATION', 'bg-purple-100 text-purple-600': f.formType !== 'EVALUATION'}">
                      {{ f.formType === 'EVALUATION' ? 'Évaluation' : 'KPI' }}
                    </span>
                  </td>
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
                  <td colSpan="7">
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
                   <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Programme *</label>
                   <select [(ngModel)]="editingForm.programmeId" class="filter-select" style="width: 100%; padding: 12px 16px;">
                     <option [value]="null">-- Sélectionner un programme --</option>
                     @for (p of programmes(); track p.id) {
                       <option [value]="p.id">{{ p.nom }}</option>
                     }
                   </select>
                 </div>
                 <div>
                   <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Date limite</label>
                   <input type="datetime-local" [(ngModel)]="editingForm.deadline" class="search-input" style="padding: 11px 16px;">
                 </div>
                 <div>
                   <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Type de formulaire *</label>
                   <select [(ngModel)]="editingForm.formType" class="filter-select" style="width: 100%; padding: 12px 16px;">
                     <option value="KPI">KPI (Tableau de bord)</option>
                     <option value="EVALUATION">Évaluation (Feedback)</option>
                   </select>
                 </div>
               </div>

               <div>
                 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #E5E7EB;">
                   <h3 style="font-size: 16px; font-weight: 800; color: #1A1A2E; margin: 0;">Questions</h3>
                   <button (click)="addQuestion()" class="btn-outline-sm" style="color: #ea5073; border-color: #ea5073;">
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
                             <input type="checkbox" [(ngModel)]="q.required" style="width: 16px; height: 16px; accent-color: #ea5073;"> Obligatoire
                           </label>
                         </div>

                         @if (q.type === 'SELECT') {
                           <div style="grid-column: span 3;">
                              <label style="display: block; font-size: 10px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Options (séparées par virgule)</label>
                              <input type="text" [(ngModel)]="q.options" placeholder="Option 1, Option 2, Option 3..." class="search-input" style="padding: 10px 14px;">
                           </div>
                         }

                         @if (editingForm.formType !== 'EVALUATION') {
                           <div style="grid-column: span 3; background: #FFF0F5; padding: 12px 16px; border-radius: 12px; border: 1px solid #fad2e1; display: flex; align-items: center; gap: 16px; margin-top: 8px;">
                             <div style="flex: 1;">
                               <label style="display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800; color: #C0392B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
                                 <i class="pi pi-link"></i> Lier à un KPI Backoffice (Automatique)
                               </label>
                               <div style="display: flex; gap: 12px;">
                                 <input type="number" [(ngModel)]="q.kpiId" placeholder="ID du KPI" class="search-input" style="width: 100px; padding: 8px 12px;">
                                 <p style="font-size: 12px; color: #ea5073; margin: 0; line-height: 1.4; display: flex; align-items: center;">
                                   Si l'ID du KPI est renseigné, la réponse mettra à jour automatiquement le tableau de bord de l'entrepreneur.
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
               <button (click)="closeModals()" class="btn-close-modal">Annuler</button>
               <button (click)="saveForm()" [disabled]="!editingForm.title" class="btn-gradient" [style.opacity]="!editingForm.title ? '0.5' : '1'">Sauvegarder</button>
            </div>
          </div>
        </div>
      }

      <!-- SEND MODAL -->
      @if (showSendModal) {
        <div class="modal-overlay" (click)="closeModals()">
          <div class="modal-box" style="max-width: 500px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-info">
                <h2 class="modal-name">Envoyer un Formulaire</h2>
              </div>
              <button (click)="closeModals()" class="modal-close"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="background: #F9FAFB;">
               <div class="note-box note-info" style="margin-top: 0; margin-bottom: 20px; background: #fff; border-color: #ea5073;">
                  <p style="color: #333;">Vous allez envoyer le formulaire <strong style="color: #1A1A2E;">"{{ formToSend?.title }}"</strong>.</p>
               </div>
               
               <div>
                 <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">IDs des Entrepreneurs (séparés par virgule)</label>
                 <input type="text" [(ngModel)]="entrepreneurIdsString" placeholder="Ex: 5, 8, 12" class="search-input" style="padding: 12px 16px;">
                 <p style="font-size: 12px; color: #9CA3AF; margin-top: 8px;">En production, cela sera un sélecteur multiple avec recherche.</p>
               </div>
            </div>
            <div class="modal-footer">
               <button (click)="closeModals()" class="btn-close-modal">Annuler</button>
               <button (click)="submitSendForm()" class="btn-gradient">
                 <i class="pi pi-send"></i> Envoyer
               </button>
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
      background: #ea5073; border: none; cursor: pointer;
      transition: all .2s; box-shadow: 0 4px 12px rgba(234, 80, 115, 0.3);
    }
    .btn-gradient:hover:not(:disabled) { background: #d4476a; transform: translateY(-1px); }
    
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
    .search-input:focus { border-color: #ea5073; }
    .filter-select {
      border: 1px solid #E5E7EB; border-radius: 12px; font-size: 14px; 
      outline: none; color: #333; cursor: pointer; background: #fff; transition: border-color .2s;
    }
    .filter-select:focus { border-color: #ea5073; }

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
    .btn-detail:hover { background: #F3F4F6; color: #ea5073; }

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
  `]
})
export class AdminKpiFormsComponent implements OnInit {
  private svc = inject(KpiFormService);
  private programmeSvc = inject(ProgrammeService); 
  programmes = signal<{id: number, nom: string}[]>([]);
  forms = signal<KpiForm[]>([]);
  
  showFormModal = false;
  editingForm: KpiForm = this.getEmptyForm();

  showSendModal = false;
  formToSend: KpiForm | null = null;
  entrepreneurIdsString = '';

  ngOnInit() {
    this.loadForms();
    this.programmeSvc.getAllProgrammesBasic().subscribe(p => 
      this.programmes.set(p.filter(prog => prog.id !== undefined) as {id: number, nom: string}[])
    );
  }

  loadForms() {
    this.svc.getAllForms().subscribe(r => this.forms.set(r || []));
  }

  getProgrammeName(id: number | undefined): string {
    if (!id) return 'Non assigné';
    const prog = this.programmes().find(p => p.id === id);
    return prog ? prog.nom : 'Programme inconnu';
  }

  stats = computed(() => {
    const list = this.forms();
    return [
      { label: 'TOTAL FORMULAIRES', value: list.length, gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', shadow: '0 4px 16px rgba(15,23,42,0.20)' },
      { label: 'FORMULAIRES ENVOYÉS', value: list.filter(f => f.status === 'SENT').length, gradient: 'linear-gradient(135deg, #ea5073 0%, #d4476a 100%)', shadow: '0 4px 16px rgba(234,80,115,0.30)' },
      { label: 'EN MODE BROUILLON', value: list.filter(f => f.status === 'DRAFT').length, gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', shadow: '0 4px 16px rgba(245,158,11,0.20)' },
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
    } else {
      this.editingForm = { title: '', description: '', questions: [], formType: 'KPI', status: 'DRAFT' };
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
    const ob$ = this.editingForm.id 
      ? this.svc.updateForm(this.editingForm.id, this.editingForm)
      : this.svc.createForm(this.editingForm);

    ob$.subscribe(() => {
      this.loadForms();
      this.closeModals();
    });
  }

  openSendModal(form: KpiForm) {
    this.formToSend = form;
    this.entrepreneurIdsString = '';
    this.showSendModal = true;
  }

  submitSendForm() {
    if (!this.formToSend?.id) return;
    const ids = this.entrepreneurIdsString
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));
      
    if (ids.length === 0) return;

    this.svc.sendForm(this.formToSend.id, ids).subscribe(() => {
      this.loadForms();
      this.closeModals();
    });
  }

  viewResponses(form: KpiForm) {
    console.log("View responses for", form.id);
  }

  closeModals() {
    this.showFormModal = false;
    this.showSendModal = false;
  }
}