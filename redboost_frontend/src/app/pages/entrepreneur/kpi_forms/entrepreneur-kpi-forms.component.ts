import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KpiFormService, KpiFormResponse, KpiFormAnswer, KpiForm, KpiFormQuestion } from '../../backoffice/kpi_forms/kpi-form.service';

@Component({
  selector: 'rb-entrepreneur-kpi-forms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-background min-h-screen font-sans">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-gray-900 tracking-tight">Mes Formulaires</h1>
          <p class="text-gray-500 mt-1">Veuillez remplir les formulaires ci-dessous pour mettre à jour vos KPIs</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 space-y-4">
          @for (f of responses(); track f.id) {
            <div (click)="selectForm(f)" class="p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white"
              [ngClass]="selectedResponse()?.id === f.id ? 'border-red-500 shadow-lg shadow-red-500/10' : 'border-gray-100 hover:border-red-200 hover:shadow-md'">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-black text-gray-900 line-clamp-2 leading-tight pr-4">{{ f.formTitle }}</h3>
                <span class="text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest shrink-0"
                  [ngClass]="f.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'">
                  {{ f.status === 'PENDING' ? 'À remplir' : 'Soumis' }}
                </span>
              </div>
              <p class="text-xs text-gray-500 font-medium">Reçu le : {{ f.submittedAt ? (f.submittedAt | date:'dd/MM/yyyy') : 'Récemment' }}</p>
            </div>
          }
          @if (responses().length === 0) {
            <div class="p-8 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50">
               <i class="pi pi-check-circle text-4xl text-gray-400 mb-2"></i>
               <p class="text-sm font-black text-gray-500">Aucun formulaire en attente.</p>
            </div>
          }
        </div>

        <div class="lg:col-span-2">
          @if (selectedResponse() && activeFormDetails()) {
             <div class="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col h-full min-h-[500px]">
               <div class="p-8 bg-red-600 text-white flex-shrink-0">
                  <h2 class="text-2xl font-black mb-2">{{ activeFormDetails()?.title }}</h2>
                  <p class="text-white/70 text-sm leading-relaxed">{{ activeFormDetails()?.description }}</p>
               </div>
               
               <div class="p-8 flex-1 overflow-y-auto space-y-6">
                 @if (selectedResponse()?.status === 'SUBMITTED' || selectedResponse()?.status === 'VALIDATED') {
                    <div class="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-3">
                      <i class="pi pi-check-circle text-xl"></i>
                      <div>
                        <p class="font-black text-sm">Formulaire soumis avec succès</p>
                        <p class="text-xs opacity-80">Les KPIs associés ont été mis à jour dans votre tableau de bord.</p>
                      </div>
                    </div>
                 }

                 <form (ngSubmit)="submitForm()" #form="ngForm">
                   <div class="space-y-6">
                     @for (q of activeFormDetails()?.questions; track q.id; let i = $index) {
                       <div class="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                         <label class="block text-sm font-black text-gray-900 mb-3">
                           {{ i + 1 }}. {{ q.text }}
                           @if (q.required) { <span class="text-red-500 ml-1">*</span> }
                         </label>

                         <!-- Input logic depending on type -->
                         @switch (q.type) {
                           @case ('TEXT') {
                             <input type="text" [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required" class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none" [disabled]="selectedResponse()?.status !== 'PENDING'">
                           }
                           @case ('NUMBER') {
                             <input type="number" [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required" class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none" [disabled]="selectedResponse()?.status !== 'PENDING'">
                           }
                           @case ('TEXTAREA') {
                             <textarea [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required" rows="3" class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none" [disabled]="selectedResponse()?.status !== 'PENDING'"></textarea>
                           }
                           @case ('SELECT') {
                             <select [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required" class="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-red-500 outline-none" [disabled]="selectedResponse()?.status !== 'PENDING'">
                               <option value="" disabled selected>-- Sélectionnez --</option>
                               @for (opt of parseOptions(q.options); track opt) {
                                 <option [value]="opt">{{ opt }}</option>
                               }
                             </select>
                           }
                         }
                       </div>
                     }
                   </div>
                   
                   @if (selectedResponse()?.status === 'PENDING') {
                     <div class="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                       <button type="submit" [disabled]="!form.form.valid" class="px-8 py-3 bg-red-500 text-white rounded-xl font-black shadow-lg shadow-red-500/30 hover:scale-[1.02] hover:bg-red-600 transition-all border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                         Soumettre le formulaire
                       </button>
                     </div>
                   }
                 </form>
               </div>
             </div>
          } @else {
             <div class="h-full min-h-[500px] flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
               <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
               <p class="text-lg font-black text-gray-500">Sélectionnez un formulaire</p>
               <p class="text-sm font-medium text-gray-400 mt-2">Cliquez sur un formulaire dans la liste pour le visualiser et le remplir.</p>
             </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class EntrepreneurKpiFormsComponent implements OnInit {
  private svc = inject(KpiFormService);

  responses = signal<KpiFormResponse[]>([]);
  selectedResponse = signal<KpiFormResponse | null>(null);
  activeFormDetails = signal<any | null>(null);

  currentAnswers: KpiFormAnswer[] = [];
  
  // Dans un vrai contexte, ceci serait extrait du UserService / Auth logic
  currentEntrepreneurId = 1; 

  ngOnInit(): void {
    this.loadResponses();
  }

  loadResponses() {
    this.svc.getPendingFormsForEntrepreneur(this.currentEntrepreneurId).subscribe((res: KpiFormResponse[]) => {
      this.responses.set(res || []);
    });
  }

  selectForm(response: KpiFormResponse) {
    this.selectedResponse.set(response);
    // On fetch details for questions
    this.svc.getFormById(response.formId).subscribe((form: KpiForm) => {
      this.activeFormDetails.set(form);
      
      this.currentAnswers = form.questions.map((q: KpiFormQuestion) => {
        // Find existing answer if already submitted, else blank
        const existing = response.answers?.find((a: KpiFormAnswer) => a.questionId === q.id);
        return {
          questionId: q.id!,
          questionText: q.text,
          answerValue: existing ? existing.answerValue : '',
          kpiId: q.kpiId
        };
      });
    });
  }

  parseOptions(optionsStr: string | undefined): string[] {
    if (!optionsStr) return [];
    return optionsStr.split(',').map(s => s.trim());
  }

  submitForm() {
    const res = this.selectedResponse();
    if (!res?.id) return;

    this.svc.submitResponse(res.id, this.currentAnswers).subscribe(() => {
      // Reload UI or show success
      this.loadResponses();
      this.selectedResponse.update(curr => curr ? {...curr, status: 'SUBMITTED'} : null);
      
      // Optionally trigger re-fetch of KPI dashboard if embedded
    });
  }
}
