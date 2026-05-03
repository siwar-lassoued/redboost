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
    <div class="p-6 bg-background min-h-screen font-sans">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-gray-900 tracking-tight">Formulaires KPI Dynamiques</h1>
          <p class="text-gray-500 mt-1">Créez et envoyez des formulaires pour automatiser la collecte des KPIs</p>
        </div>
        <button (click)="openFormModal()" class="flex items-center gap-2 px-6 py-3 bg-red-600 text-white border-none cursor-pointer rounded-2xl text-sm font-black shadow-xl shadow-red-600/20 hover:scale-[1.02] transition-all">
          <i class="pi pi-plus text-sm"></i>
          Nouveau Formulaire
        </button>
      </div>

      <!-- Stats  -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        @for (stat of stats(); track stat.label) {
          <div class="rounded-2xl p-5 text-white relative overflow-hidden shadow-xl" [style.background]="stat.gradient" [style.boxShadow]="stat.shadow">
            <div class="absolute -right-4 -top-4 rounded-full w-16 h-16 bg-white/10"></div>
            <p class="text-[10px] font-bold tracking-widest opacity-80 uppercase mb-1">{{ stat.label }}</p>
            <h3 class="text-4xl font-black leading-none mb-1">{{ stat.value }}</h3>
          </div>
        }
      </div>

      <!-- Table Section -->
      <div class="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
        <div class="overflow-x-auto min-w-full">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Titre</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Programme</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Créé le</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Deadline</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Questions</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Statut</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (f of forms(); track f.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-5">
                    <p class="text-sm font-black text-gray-900">{{ f.title }}</p>
                    <p class="text-[11px] text-gray-500 line-clamp-1 border-gray-50">{{ f.description }}</p>
                  </td>
                  <div>
                  <label class="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Programme</label>
                  <select [(ngModel)]="editingForm.programmeId" 
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none">
                    <option [value]="null">-- Sélectionner un programme --</option>
                    @for (p of programmes(); track p.id) {
                      <option [value]="p.id">{{ p.nom }}</option>
                    }
                  </select>
                </div>
                  <td class="px-6 py-5 text-[11px] text-gray-500 font-medium">{{ f.createdAt | date:'dd/MM/yyyy' }}</td>
                  <td class="px-6 py-5 text-[11px] text-red-600 font-bold">{{ f.deadline | date:'dd/MM/yyyy' }}</td>
                  <td class="px-6 py-5 text-sm font-black text-gray-900">{{ f.questions.length || 0 }}</td>
                  <td class="px-6 py-5 text-center">
                    <span class="text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest"
                      [ngClass]="{
                        'bg-gray-100 text-gray-600': f.status === 'DRAFT',
                        'bg-emerald-100 text-emerald-600': f.status === 'SENT',
                        'bg-red-100 text-red-600': f.status === 'CLOSED'
                      }">
                      {{ f.status }}
                    </span>
                  </td>
                  <td class="px-6 py-5 text-center">
                    <div class="flex items-center justify-center gap-2">
                       <button (click)="openFormModal(f)" title="Éditer" class="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-sky-500 transition-all border-none bg-transparent cursor-pointer"><i class="pi pi-pencil text-sm"></i></button>
                       <button (click)="openSendModal(f)" title="Envoyer" class="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-emerald-500 transition-all border-none bg-transparent cursor-pointer"><i class="pi pi-send text-sm"></i></button>
                       <button (click)="viewResponses(f)" title="Réponses" class="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-red-600 transition-all border-none bg-transparent cursor-pointer"><i class="pi pi-users text-sm"></i></button>
                    </div>
                  </td>
                </tr>
              }
              @if (forms().length === 0) {
                <tr>
                  <td colSpan="7" class="px-6 py-20 text-center">
                    <div class="flex flex-col items-center gap-3 opacity-40">
                      <i class="pi pi-file-edit text-5xl text-gray-500"></i>
                      <p class="text-sm font-black uppercase tracking-widest text-gray-500">Aucun formulaire trouvé</p>
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
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4" (click)="closeModals()">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-[800px] max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-6 bg-red-600 rounded-t-3xl flex justify-between items-center text-white shrink-0">
              <h2 class="text-xl font-black">{{ editingForm.id ? 'Modifier' : 'Nouveau' }} Formulaire KPI</h2>
              <button (click)="closeModals()" class="text-white/60 hover:text-white bg-transparent border-none cursor-pointer"><i class="pi pi-times text-xl"></i></button>
            </div>
            
            <div class="p-6 overflow-y-auto flex-1 bg-gray-50 space-y-6">
               <div class="grid grid-cols-2 gap-4">
                 <div class="col-span-2">
                   <label class="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Titre du formulaire *</label>
                   <input type="text" [(ngModel)]="editingForm.title" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none">
                 </div>
                 <div class="col-span-2">
                   <label class="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Description</label>
                   <textarea [(ngModel)]="editingForm.description" rows="2" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"></textarea>
                 </div>
                 <div>
                   <label class="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Programme *</label>
                   <select [(ngModel)]="editingForm.programmeId" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none">
                     <option [value]="null">-- Sélectionner un programme --</option>
                     @for (p of programmes(); track p.id) {
                       <option [value]="p.id">{{ p.nom }}</option>
                     }
                   </select>
                 </div>
                 <div>
                   <label class="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Date limite</label>
                   <input type="datetime-local" [(ngModel)]="editingForm.deadline" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none">
                 </div>
               </div>

               <div>
                 <div class="flex justify-between items-center mb-4 border-b pb-2">
                   <h3 class="text-lg font-black text-gray-900">Questions</h3>
                   <button (click)="addQuestion()" class="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-red-700 transition-colors border-none cursor-pointer">
                     + Ajouter Question
                   </button>
                 </div>

                 <div class="space-y-4">
                   @for (q of editingForm.questions; track $index) {
                     <div class="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative group">
                       <button (click)="removeQuestion($index)" class="absolute top-2 right-2 text-red-500 p-2 bg-red-50 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer"><i class="pi pi-trash"></i></button>
                       
                       <div class="grid grid-cols-12 gap-4">
                         <div class="col-span-12 md:col-span-7">
                           <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Texte de la question</label>
                           <input type="text" [(ngModel)]="q.text" placeholder="Poser la question..." class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-600 outline-none">
                         </div>
                         <div class="col-span-6 md:col-span-3">
                           <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Type de réponse</label>
                           <select [(ngModel)]="q.type" class="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-red-600 outline-none">
                             <option value="TEXT">Texte Court</option>
                             <option value="TEXTAREA">Multi-lignes</option>
                             <option value="NUMBER">Nombre / Montant</option>
                             <option value="SELECT">Choix Unique</option>
                           </select>
                         </div>
                         <div class="col-span-6 md:col-span-2 flex flex-col justify-end">
                           <label class="flex items-center gap-2 text-xs font-bold cursor-pointer h-10">
                             <input type="checkbox" [(ngModel)]="q.required" class="w-4 h-4 text-red-600 rounded"> Obligatoire
                           </label>
                         </div>

                         @if (q.type === 'SELECT') {
                           <div class="col-span-12">
                              <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Options (séparées par virgule)</label>
                              <input type="text" [(ngModel)]="q.options" placeholder="Option 1, Option 2, Option 3..." class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-600 outline-none">
                           </div>
                         }

                         <div class="col-span-12 bg-pink-50/50 p-3 rounded-xl border border-red-100 flex items-center gap-4">
                           <div class="flex-1">
                             <label class="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                               <i class="pi pi-link"></i> Lier à un KPI Backoffice (Automatique)
                             </label>
                             <div class="flex gap-2">
                               <input type="number" [(ngModel)]="q.kpiId" placeholder="ID du KPI" class="w-24 px-3 py-2 rounded-lg border border-red-200 focus:ring-2 focus:ring-red-600 outline-none text-sm">
                               <p class="text-xs text-gray-500 flex-1 leading-tight py-2">
                                 Si l'ID du KPI est renseigné, la réponse mettra à jour automatiquement le tableau de bord de l'entrepreneur.
                               </p>
                             </div>
                           </div>
                         </div>

                       </div>
                     </div>
                   }
                   @if (!editingForm.questions.length) {
                     <div class="text-center p-8 border-2 border-dashed border-gray-200 rounded-2xl">
                       <p class="text-gray-400 font-medium">Aucune question ajoutée. Cliquez sur "+ Ajouter Question".</p>
                     </div>
                   }
                 </div>
               </div>
            </div>

            <div class="p-6 bg-white rounded-b-3xl border-t border-gray-100 flex justify-end gap-3 shrink-0">
               <button (click)="closeModals()" class="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors border-none cursor-pointer">Annuler</button>
               <button (click)="saveForm()" [disabled]="!editingForm.title" class="px-6 py-2.5 rounded-xl font-black text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 transition-colors border-none cursor-pointer disabled:opacity-50">Sauvegarder</button>
            </div>
          </div>
        </div>
      }

      <!-- SEND MODAL -->
       @if (showSendModal) {
         <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4" (click)="closeModals()">
           <div class="bg-white rounded-3xl shadow-2xl w-full max-w-[500px]" (click)="$event.stopPropagation()">
             <div class="p-6 bg-emerald-600 rounded-t-3xl flex justify-between items-center text-white">
                <h2 class="text-xl font-black">Envoyer un Formulaire</h2>
                <button (click)="closeModals()" class="text-white/60 hover:text-white bg-transparent border-none cursor-pointer"><i class="pi pi-times text-xl"></i></button>
             </div>
             <div class="p-6 space-y-4">
                <p class="text-sm font-medium text-gray-600">Vous allez envoyer le formulaire <strong class="text-gray-900">"{{ formToSend?.title }}"</strong>.</p>
                
                <div>
                  <label class="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">IDs des Entrepreneurs (séparés par virgule)</label>
                  <input type="text" [(ngModel)]="entrepreneurIdsString" placeholder="Ex: 5, 8, 12" class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <p class="text-xs text-gray-500 mt-2">En production, cela sera un sélecteur multiple avec recherche.</p>
                </div>
             </div>
             <div class="p-6 bg-gray-50 rounded-b-3xl border-t border-gray-100 flex justify-end gap-3">
               <button (click)="closeModals()" class="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors border-none cursor-pointer bg-transparent">Annuler</button>
               <button (click)="submitSendForm()" class="px-6 py-2.5 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-colors border-none cursor-pointer flex items-center gap-2">
                 <i class="pi pi-send text-sm"></i>
                 Envoyer
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

  stats = computed(() => {
    const list = this.forms();
    return [
      { label: 'FORMULAIRES', value: list.length, gradient: 'linear-gradient(135deg,#a17dfd 0%,#7B52D3 100%)', shadow: '0 4px 16px rgba(161,125,253,0.30)' },
      { label: 'ENVOYÉS', value: list.filter(f => f.status === 'SENT').length, gradient: 'linear-gradient(135deg,#10B981 0%,#059669 100%)', shadow: '0 4px 16px rgba(16,185,129,0.30)' },
      { label: 'BROUILLONS', value: list.filter(f => f.status === 'DRAFT').length, gradient: 'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)', shadow: '0 4px 16px rgba(245,158,11,0.30)' },
    ];
  });

  getEmptyForm(): KpiForm {
    return {
      title: '',
      description: '',
      questions: [],
      status: 'DRAFT'
    };
  }

  openFormModal(form?: KpiForm) {
    if (form) {
      // Create a deep copy to avoid editing original until save
      this.editingForm = JSON.parse(JSON.stringify(form));
    } else {
      this.editingForm = this.getEmptyForm();
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
    // Naviguer vers la vue des réponses
    console.log("View responses for", form.id);
  }

  closeModals() {
    this.showFormModal = false;
    this.showSendModal = false;
  }
}