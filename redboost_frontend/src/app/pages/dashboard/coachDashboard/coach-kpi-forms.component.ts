import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KpiFormService, KpiFormResponse, KpiFormAnswer, KpiForm, KpiFormQuestion } from '../../backoffice/kpi_forms/kpi-form.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'rb-coach-kpi-forms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cand-page">
      <!-- Header -->
      <div class="cand-header">
        <div>
          <h1 class="cand-title">Mes Formulaires d'Évaluation</h1>
          <p class="cand-subtitle">Formulaires reçus par l'administration — veuillez les remplir avant la date limite</p>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="background: #FFF0F5; border: 1px solid #fad2e1; border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 8px;">
            <i class="pi pi-exclamation-circle" style="color: #ea5073; font-size: 16px;"></i>
            <span style="font-size: 13px; font-weight: 700; color: #ea5073;">{{ pendingCount() }} formulaire(s) en attente</span>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
        <div style="border-radius: 20px; padding: 20px; color: white; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); box-shadow: 0 4px 16px rgba(15,23,42,0.20);">
          <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; opacity: 0.9;">Total reçus</p>
          <h3 style="font-size: 32px; font-weight: 900; margin: 0;">{{ responses().length }}</h3>
        </div>
        <div style="border-radius: 20px; padding: 20px; color: white; background: linear-gradient(135deg, #ea5073 0%, #d4476a 100%); box-shadow: 0 4px 16px rgba(234,80,115,0.30);">
          <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; opacity: 0.9;">En attente</p>
          <h3 style="font-size: 32px; font-weight: 900; margin: 0;">{{ pendingCount() }}</h3>
        </div>
        <div style="border-radius: 20px; padding: 20px; color: white; background: linear-gradient(135deg, #059669 0%, #047857 100%); box-shadow: 0 4px 16px rgba(5,150,105,0.20);">
          <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; opacity: 0.9;">Soumis</p>
          <h3 style="font-size: 32px; font-weight: 900; margin: 0;">{{ submittedCount() }}</h3>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 300px 1fr; gap: 24px; min-height: 600px;">
        <!-- Forms List -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          @for (f of responses(); track f.id) {
            <div (click)="selectForm(f)" class="form-card-item" [class.active]="selectedResponse()?.id === f.id">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #1A1A2E; margin: 0; flex: 1; padding-right: 8px; line-height: 1.4;">{{ f.formTitle }}</h3>
                <span class="status-badge"
                  [ngClass]="f.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'">
                  {{ f.status === 'PENDING' ? 'À remplir' : 'Soumis' }}
                </span>
              </div>
              @if (f.status === 'PENDING') {
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 8px;">
                  <span style="width: 8px; height: 8px; background: #ea5073; border-radius: 50%; animation: pulse 1.5s infinite;"></span>
                  <span style="font-size: 11px; color: #ea5073; font-weight: 700;">Urgent — À compléter</span>
                </div>
              }
            </div>
          }
          @if (responses().length === 0 && !isLoading()) {
            <div style="padding: 32px 20px; text-align: center; border: 2px dashed #E5E7EB; border-radius: 20px; background: white;">
              <i class="pi pi-check-circle" style="font-size: 32px; color: #059669; margin-bottom: 12px; display: block;"></i>
              <p style="font-size: 14px; font-weight: 700; color: #6B7280; margin: 0;">Aucun formulaire en attente</p>
              <p style="font-size: 12px; color: #9CA3AF; margin-top: 4px;">Vous êtes à jour !</p>
            </div>
          }
          @if (isLoading()) {
            <div style="padding: 32px 20px; text-align: center;">
              <i class="pi pi-spin pi-spinner" style="font-size: 24px; color: #ea5073;"></i>
            </div>
          }
        </div>

        <!-- Form Content Panel -->
        <div>
          @if (selectedResponse() && activeFormDetails()) {
            <div class="table-card" style="height: 100%; display: flex; flex-direction: column; overflow: hidden;">
              <!-- Form Header Banner -->
              <div style="background: linear-gradient(135deg, #1A1A2E 0%, #ea5073 100%); padding: 28px 32px; color: white; position: relative; overflow: hidden; flex-shrink: 0;">
                <div style="position: absolute; right: -20px; top: -20px; width: 100px; height: 100px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>
                <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 6px 0;">{{ activeFormDetails()?.title }}</h2>
                <p style="opacity: 0.8; font-size: 13px; margin: 0 0 12px 0;">{{ activeFormDetails()?.description }}</p>
                @if (activeFormDetails()?.deadline) {
                  <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.15); border-radius: 12px; padding: 8px 14px;">
                    <i class="pi pi-clock" style="font-size: 14px;"></i>
                    <span style="font-size: 13px; font-weight: 700;">Date limite : {{ activeFormDetails()?.deadline | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                }
              </div>

              <!-- Questions -->
              <div style="padding: 28px 32px; overflow-y: auto; flex: 1;">
                @if (selectedResponse()?.status === 'SUBMITTED' || selectedResponse()?.status === 'VALIDATED') {
                  <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 16px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
                    <i class="pi pi-check-circle" style="color: #059669; font-size: 20px;"></i>
                    <div>
                      <p style="font-weight: 700; color: #065F46; margin: 0; font-size: 14px;">Formulaire soumis avec succès</p>
                      <p style="color: #6B7280; font-size: 12px; margin: 0;">Vos réponses ont été transmises à l'administration.</p>
                    </div>
                  </div>
                }

                <form (ngSubmit)="submitForm()" #form="ngForm">
                  <div style="display: flex; flex-direction: column; gap: 20px;">
                    @for (q of activeFormDetails()?.questions; track q.id; let i = $index) {
                      <div style="background: #F9FAFB; border-radius: 16px; padding: 20px; border: 1px solid #E5E7EB;">
                        <label style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                          Question {{ i + 1 }} @if (q.required) { <span style="color: #ea5073;">*</span> }
                        </label>
                        <p style="font-size: 14px; font-weight: 700; color: #1A1A2E; margin: 0 0 12px 0;">{{ q.text }}</p>

                        @switch (q.type) {
                          @case ('TEXT') {
                            <input type="text" [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required"
                              class="search-input-kpi" style="padding: 10px 14px;"
                              placeholder="Votre réponse..."
                              [disabled]="selectedResponse()?.status !== 'PENDING'">
                          }
                          @case ('NUMBER') {
                            <input type="number" [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required"
                              class="search-input-kpi" style="padding: 10px 14px;"
                              [disabled]="selectedResponse()?.status !== 'PENDING'">
                          }
                          @case ('TEXTAREA') {
                            <textarea [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required" rows="4"
                              class="search-input-kpi" style="padding: 10px 14px; resize: vertical;"
                              placeholder="Détaillez votre réponse..."
                              [disabled]="selectedResponse()?.status !== 'PENDING'"></textarea>
                          }
                          @case ('SELECT') {
                            <select [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required"
                              class="filter-select-kpi" style="width: 100%; padding: 10px 14px;"
                              [disabled]="selectedResponse()?.status !== 'PENDING'">
                              <option value="" disabled selected>-- Sélectionner --</option>
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
                    <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
                      <button type="submit" [disabled]="!form.form.valid" class="btn-gradient-kpi" style="padding: 14px 28px; font-size: 14px; display: flex; align-items: center; gap: 10px; opacity: 1;" [style.opacity]="!form.form.valid ? '0.5' : '1'">
                        <i class="pi pi-send"></i>
                        Soumettre le formulaire
                      </button>
                    </div>
                  }
                </form>
              </div>
            </div>
          } @else {
            <div style="height: 100%; min-height: 500px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed #E5E7EB; border-radius: 20px; background: white;">
              <div style="width: 80px; height: 80px; background: #F9FAFB; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <i class="pi pi-inbox" style="font-size: 32px; color: #D1D5DB;"></i>
              </div>
              <p style="font-size: 18px; font-weight: 800; color: #1A1A2E; margin: 0;">Sélectionnez un formulaire</p>
              <p style="font-size: 13px; color: #6B7280; margin-top: 8px;">Cliquez sur un formulaire dans la liste pour le visualiser et le remplir.</p>
            </div>
          }
        </div>
      </div>

      <!-- SUCCESS TOAST -->
      @if (showSuccess()) {
        <div style="position: fixed; bottom: 32px; right: 32px; background: #065F46; color: white; padding: 16px 24px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 12px; z-index: 9999; animation: slideIn 0.3s ease;">
          <i class="pi pi-check-circle" style="font-size: 20px;"></i>
          <span style="font-weight: 700;">Formulaire soumis avec succès !</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .form-card-item {
      background: white; border: 2px solid #F3F4F6; border-radius: 16px;
      padding: 16px; cursor: pointer; transition: all .2s;
    }
    .form-card-item:hover { border-color: #fad2e1; box-shadow: 0 4px 16px rgba(234,80,115,0.1); }
    .form-card-item.active { border-color: #ea5073; box-shadow: 0 4px 20px rgba(234,80,115,0.15); }
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
    .btn-gradient-kpi {
      display: flex; align-items: center; gap: 8px; padding: 10px 20px;
      border-radius: 12px; font-size: 14px; font-weight: 600; color: #fff;
      background: #ea5073; border: none; cursor: pointer;
      transition: all .2s; box-shadow: 0 4px 12px rgba(234, 80, 115, 0.3);
    }
    .btn-gradient-kpi:hover:not(:disabled) { background: #d4476a; transform: translateY(-1px); }
    @keyframes pulse {
      0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
    }
    @keyframes slideIn {
      from { transform: translateX(100px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    /* Shared admin styles */
    .cand-page { padding: 32px; background: #F9FAFB; min-height: 100vh; }
    .cand-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .cand-title { font-size: 28px; font-weight: 900; color: #1A1A2E; margin: 0; }
    .cand-subtitle { font-size: 14px; color: #6B7280; margin: 4px 0 0 0; }
    .table-card { background: white; border-radius: 20px; border: 1px solid #E5E7EB; overflow: hidden; }
    .status-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
    .bg-amber-100 { background-color: #FEF3C7; }
    .text-amber-600 { color: #D97706; }
    .bg-emerald-100 { background-color: #D1FAE5; }
    .text-emerald-600 { color: #059669; }
  `]
})
export class CoachKpiFormsComponent implements OnInit {
  private svc = inject(KpiFormService);
  private auth = inject(AuthService);

  responses = signal<KpiFormResponse[]>([]);
  selectedResponse = signal<KpiFormResponse | null>(null);
  activeFormDetails = signal<KpiForm | null>(null);
  isLoading = signal(false);
  showSuccess = signal(false);

  currentAnswers: KpiFormAnswer[] = [];

  pendingCount = () => this.responses().filter(r => r.status === 'PENDING').length;
  submittedCount = () => this.responses().filter(r => r.status === 'SUBMITTED' || r.status === 'VALIDATED').length;

  ngOnInit(): void {
    this.loadResponses();
  }

  loadResponses() {
    const user = this.auth.currentUser$.value;
    if (!user) return;
    this.isLoading.set(true);
    this.svc.getPendingFormsForCoach(user.id).subscribe({
      next: (res: KpiFormResponse[]) => {
        this.responses.set(res || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  selectForm(response: KpiFormResponse) {
    this.selectedResponse.set(response);
    this.svc.getFormById(response.formId).subscribe((form: KpiForm) => {
      this.activeFormDetails.set(form);
      this.currentAnswers = form.questions.map((q: KpiFormQuestion) => {
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
      this.showSuccess.set(true);
      this.loadResponses();
      this.selectedResponse.update(curr => curr ? { ...curr, status: 'SUBMITTED' } : null);
      setTimeout(() => this.showSuccess.set(false), 3500);
    });
  }
}
