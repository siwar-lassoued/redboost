import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KpiFormService, KpiFormResponse, KpiFormAnswer, KpiForm, KpiFormQuestion } from '../../backoffice/kpi_forms/kpi-form.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'rb-entrepreneur-kpi-forms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-[#F8FAFC] min-h-screen">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-[#1A1A2E] tracking-tight">Mes Formulaires KPI</h1>
          <p class="text-gray-500 mt-1 font-medium">Veuillez remplir les formulaires pour mettre à jour votre suivi</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Forms List -->
        <div class="lg:col-span-1 space-y-4">
          @for (f of responses(); track f.id) {
            <div (click)="selectForm(f)" class="p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white"
              [ngClass]="selectedResponse()?.id === f.id ? 'border-[#ff3d91] shadow-xl shadow-[#ff3d91]/10' : 'border-gray-50 hover:border-[#ff3d91]/30 hover:shadow-lg'">
              <div class="flex justify-between items-start mb-3">
                <h3 class="font-black text-[#1A1A2E] line-clamp-2 leading-tight pr-4 text-sm">{{ f.formTitle }}</h3>
                <span class="text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest shrink-0"
                  [ngClass]="f.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'">
                  {{ f.status === 'PENDING' ? 'À remplir' : 'Soumis' }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                <i class="pi pi-calendar"></i>
                Reçu le : {{ f.submittedAt ? (f.submittedAt | date:'dd MMM yyyy') : 'Récemment' }}
              </div>
            </div>
          }
          @if (responses().length === 0) {
            <div class="p-12 text-center border-2 border-dashed border-gray-100 rounded-[40px] bg-white">
               <i class="pi pi-check-circle text-4xl text-emerald-400 mb-3"></i>
               <p class="text-sm font-black text-gray-400 uppercase tracking-widest">Tout est à jour</p>
               <p class="text-xs text-gray-300 mt-1">Aucun formulaire en attente.</p>
            </div>
          }
        </div>

        <!-- Form Content -->
        <div class="lg:col-span-2">
          @if (selectedResponse() && activeFormDetails()) {
             <div class="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden flex flex-col h-full min-h-[600px]">
               <div class="p-8 text-white flex-shrink-0 relative overflow-hidden" 
                 style="background: linear-gradient(135deg, #1A3A3A 0%, #3aafff 100%)">
                  <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10"></div>
                  <div class="relative">
                    <h2 class="text-2xl font-black mb-2">{{ activeFormDetails()?.title }}</h2>
                    <p class="text-white/80 text-sm leading-relaxed max-w-xl">{{ activeFormDetails()?.description }}</p>
                  </div>
               </div>
               
               <div class="p-8 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                 @if (selectedResponse()?.status === 'SUBMITTED' || selectedResponse()?.status === 'VALIDATED') {
                    <div class="p-5 bg-emerald-50 text-emerald-700 rounded-[24px] border border-emerald-100 flex items-center gap-4">
                      <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm text-emerald-500">
                        <i class="pi pi-check-circle text-xl"></i>
                      </div>
                      <div>
                        <p class="font-black text-sm">Formulaire soumis avec succès</p>
                        <p class="text-xs opacity-80">Les KPIs associés ont été mis à jour.</p>
                      </div>
                    </div>
                 }

                 <form (ngSubmit)="submitForm()" #form="ngForm">
                   <div class="space-y-8">
                     @for (q of activeFormDetails()?.questions; track q.id; let i = $index) {
                       <div class="space-y-3">
                         <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.1em] ml-2">
                           Question {{ i + 1 }}
                           @if (q.required) { <span class="text-[#ff3d91] ml-1">*</span> }
                         </label>
                         <div class="bg-[#F8FAFC] p-6 rounded-[32px] border-2 border-transparent transition-all focus-within:border-[#1A3A3A]/10 focus-within:bg-white focus-within:shadow-lg">
                           <p class="text-sm font-black text-[#1A1A2E] mb-4">{{ q.text }}</p>

                           @switch (q.type) {
                             @case ('TEXT') {
                               <input type="text" [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required" 
                                 class="w-full bg-transparent border-none outline-none text-gray-700 font-medium placeholder:text-gray-300" 
                                 placeholder="Votre réponse ici..."
                                 [disabled]="selectedResponse()?.status !== 'PENDING'">
                             }
                             @case ('NUMBER') {
                               <input type="number" [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required" 
                                 class="w-full bg-transparent border-none outline-none text-gray-700 font-medium"
                                 [disabled]="selectedResponse()?.status !== 'PENDING'">
                             }
                             @case ('TEXTAREA') {
                               <textarea [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required" rows="4" 
                                 class="w-full bg-transparent border-none outline-none text-gray-700 font-medium resize-none placeholder:text-gray-300" 
                                 placeholder="Détaillez votre réponse..."
                                 [disabled]="selectedResponse()?.status !== 'PENDING'"></textarea>
                             }
                             @case ('SELECT') {
                               <select [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required" 
                                 class="w-full bg-transparent border-none outline-none text-gray-700 font-medium appearance-none cursor-pointer" 
                                 [disabled]="selectedResponse()?.status !== 'PENDING'">
                                 <option value="" disabled selected>-- Cliquez pour choisir --</option>
                                 @for (opt of parseOptions(q.options); track opt) {
                                   <option [value]="opt">{{ opt }}</option>
                                 }
                               </select>
                             }
                           }
                         </div>
                       </div>
                     }
                   </div>
                   
                   @if (selectedResponse()?.status === 'PENDING') {
                     <div class="mt-12 pt-8 border-t border-gray-50 flex justify-end">
                       <button type="submit" [disabled]="!form.form.valid" 
                         class="px-10 py-5 bg-[#1A3A3A] text-white rounded-[24px] font-black shadow-2xl shadow-[#1A3A3A]/20 hover:scale-[1.02] hover:-translate-y-0.5 transition-all border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3">
                         SOUMETTRE LE FORMULAIRE
                         <i class="pi pi-send"></i>
                       </button>
                     </div>
                   }
                 </form>
               </div>
             </div>
          } @else {
             <div class="h-full min-h-[600px] flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-100 rounded-[40px] bg-white">
               <div class="w-24 h-24 bg-[#F8FAFC] rounded-[32px] flex items-center justify-center mb-6">
                 <i class="pi pi-inbox text-4xl text-gray-300"></i>
               </div>
               <p class="text-xl font-black text-[#1A1A2E] tracking-tight">Sélectionnez un formulaire</p>
               <p class="text-sm font-medium text-gray-400 mt-2 max-w-xs mx-auto">Cliquez sur un formulaire dans la liste pour le visualiser et le remplir.</p>
             </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 10px; }
  `],
})
export class EntrepreneurKpiFormsComponent implements OnInit {
  private svc = inject(KpiFormService);
  private auth = inject(AuthService);

  responses = signal<KpiFormResponse[]>([]);
  selectedResponse = signal<KpiFormResponse | null>(null);
  activeFormDetails = signal<any | null>(null);

  currentAnswers: KpiFormAnswer[] = [];

  ngOnInit(): void {
    this.loadResponses();
  }

  loadResponses() {
    const token = this.auth.getToken();
    const user = token ? { id: (jwtDecode(token as string) as any).userId } : null;
    const user = this.auth.currentUser$.value;
    if (!user) return;
    
    this.svc.getPendingFormsForEntrepreneur(user.id).subscribe((res: KpiFormResponse[]) => {
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
