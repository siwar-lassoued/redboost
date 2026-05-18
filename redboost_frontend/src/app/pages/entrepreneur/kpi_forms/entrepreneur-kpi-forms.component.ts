import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KpiFormService, KpiFormResponse, KpiFormAnswer, KpiForm, KpiFormQuestion } from '../../backoffice/kpi_forms/kpi-form.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'rb-entrepreneur-kpi-forms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="kf-page">
      <!-- HEADER -->
      <div class="kf-header">
        <div>
          <h1 class="kf-title">Mes Formulaires</h1>
          <p class="kf-subtitle">Remplissez vos formulaires KPI et d'évaluation envoyés par l'administration</p>
        </div>
        <div class="kf-header-badges">
          <span class="kf-count-badge kpi-color">
            <i class="pi pi-chart-line"></i>
            {{ kpiForms().length }} KPI
          </span>
          <span class="kf-count-badge eval-color">
            <i class="pi pi-star"></i>
            {{ evalForms().length }} Évaluation
          </span>
        </div>
      </div>

      <div class="kf-layout">
        <!-- LEFT PANEL: Forms list grouped -->
        <div class="kf-list-panel">

          <!-- Group: Évaluations Coach -->
          <div class="kf-group">
            <div class="kf-group-header eval-header">
              <i class="pi pi-star-fill kf-group-icon"></i>
              <span class="kf-group-title">Évaluations Coach</span>
              <span class="kf-group-count">{{ evalForms().length }}</span>
            </div>

            @if (evalForms().length === 0) {
              <div class="kf-empty-group">
                <i class="pi pi-check-circle"></i>
                <p>Aucun formulaire d'évaluation en attente</p>
              </div>
            }

            @for (f of evalForms(); track f.id) {
              <div class="kf-card"
                [class.kf-card-selected]="selectedResponse()?.id === f.id"
                [class.kf-card-submitted]="f.status !== 'PENDING'"
                (click)="selectForm(f)">
                <div class="kf-card-top">
                  <h3 class="kf-card-title">{{ f.formTitle }}</h3>
                  <span class="kf-status-badge" [class.badge-pending]="f.status === 'PENDING'" [class.badge-submitted]="f.status !== 'PENDING'">
                    {{ f.status === 'PENDING' ? 'À remplir' : 'Soumis' }}
                  </span>
                </div>
                <div class="kf-card-meta">
                  @if (f.deadline) {
                    <span class="kf-deadline" [class.kf-deadline-urgent]="isUrgent(f.deadline)">
                      <i class="pi pi-clock"></i>
                      {{ getDaysRemaining(f.deadline) }}
                    </span>
                  }
                  <span class="kf-type-tag eval-tag">
                    <i class="pi pi-star"></i> Évaluation
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- Group: Formulaires KPI -->
          <div class="kf-group">
            <div class="kf-group-header kpi-header">
              <i class="pi pi-chart-line kf-group-icon"></i>
              <span class="kf-group-title">Formulaires KPI</span>
              <span class="kf-group-count">{{ kpiForms().length }}</span>
            </div>

            @if (kpiForms().length === 0) {
              <div class="kf-empty-group">
                <i class="pi pi-check-circle"></i>
                <p>Aucun formulaire KPI en attente</p>
              </div>
            }

            @for (f of kpiForms(); track f.id) {
              <div class="kf-card"
                [class.kf-card-selected]="selectedResponse()?.id === f.id"
                [class.kf-card-submitted]="f.status !== 'PENDING'"
                (click)="selectForm(f)">
                <div class="kf-card-top">
                  <h3 class="kf-card-title">{{ f.formTitle }}</h3>
                  <span class="kf-status-badge" [class.badge-pending]="f.status === 'PENDING'" [class.badge-submitted]="f.status !== 'PENDING'">
                    {{ f.status === 'PENDING' ? 'À remplir' : 'Soumis' }}
                  </span>
                </div>
                <div class="kf-card-meta">
                  @if (f.deadline) {
                    <span class="kf-deadline" [class.kf-deadline-urgent]="isUrgent(f.deadline)">
                      <i class="pi pi-clock"></i>
                      {{ getDaysRemaining(f.deadline) }}
                    </span>
                  }
                  <span class="kf-type-tag kpi-tag">
                    <i class="pi pi-chart-line"></i> KPI
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- All empty state -->
          @if (allForms().length === 0) {
            <div class="kf-all-empty">
              <div class="kf-all-empty-icon">
                <i class="pi pi-inbox"></i>
              </div>
              <p class="kf-all-empty-title">Tout est à jour !</p>
              <p class="kf-all-empty-sub">Aucun formulaire en attente pour le moment.</p>
            </div>
          }
        </div>

        <!-- RIGHT PANEL: Form details -->
        <div class="kf-content-panel">
          @if (selectedResponse() && activeFormDetails()) {
            <div class="kf-form-wrapper">
              <!-- Form Header -->
              <div class="kf-form-header" [class.kf-form-header-eval]="selectedResponse()?.formType === 'EVALUATION'">
                <div class="kf-form-header-deco"></div>
                <div class="kf-form-header-content">
                  <div class="kf-form-type-badge" [class.type-eval]="selectedResponse()?.formType === 'EVALUATION'" [class.type-kpi]="selectedResponse()?.formType !== 'EVALUATION'">
                    <i class="pi" [class.pi-star]="selectedResponse()?.formType === 'EVALUATION'" [class.pi-chart-line]="selectedResponse()?.formType !== 'EVALUATION'"></i>
                    {{ selectedResponse()?.formType === 'EVALUATION' ? 'Évaluation Coach' : 'Formulaire KPI' }}
                  </div>
                  <h2 class="kf-form-title">{{ activeFormDetails()?.title }}</h2>
                  <p class="kf-form-desc">{{ activeFormDetails()?.description }}</p>
                  @if (selectedResponse()?.deadline) {
                    <div class="kf-form-deadline-info" [class.urgent]="isUrgent(selectedResponse()!.deadline!)">
                      <i class="pi pi-calendar-clock"></i>
                      Date limite : {{ selectedResponse()!.deadline! | date:'dd MMMM yyyy' }}
                    </div>
                  }
                </div>
              </div>

              <!-- Submitted banner -->
              @if (selectedResponse()?.status !== 'PENDING') {
                <div class="kf-submitted-banner">
                  <div class="kf-submitted-icon">
                    <i class="pi pi-check-circle"></i>
                  </div>
                  <div>
                    <p class="kf-submitted-title">Formulaire soumis avec succès</p>
                    <p class="kf-submitted-sub">Vos réponses ont été enregistrées et transmises à l'administration.</p>
                  </div>
                </div>
              }

              <!-- Form Questions -->
              <div class="kf-questions-body">
                <form (ngSubmit)="submitForm()" #kpiForm="ngForm">
                  <div class="kf-questions-list">
                    @for (q of activeFormDetails()?.questions; track q.id; let i = $index) {
                      <div class="kf-question-item">
                        <label class="kf-q-label">
                          Question {{ i + 1 }}
                          @if (q.required) { <span class="kf-required">*</span> }
                        </label>
                        <div class="kf-q-box">
                          <p class="kf-q-text">{{ q.text }}</p>

                          @switch (q.type) {
                            @case ('TEXT') {
                              <input type="text" [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required"
                                class="kf-input"
                                placeholder="Votre réponse ici..."
                                [disabled]="selectedResponse()?.status !== 'PENDING'">
                            }
                            @case ('NUMBER') {
                              <input type="number" [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required"
                                class="kf-input"
                                [disabled]="selectedResponse()?.status !== 'PENDING'">
                            }
                            @case ('TEXTAREA') {
                              <textarea [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required" rows="4"
                                class="kf-input kf-textarea"
                                placeholder="Détaillez votre réponse..."
                                [disabled]="selectedResponse()?.status !== 'PENDING'"></textarea>
                            }
                            @case ('SELECT') {
                              <select [(ngModel)]="currentAnswers[i].answerValue" name="q_{{i}}" [required]="q.required"
                                class="kf-select"
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
                    <div class="kf-submit-row">
                      <button type="submit" [disabled]="!kpiForm.form.valid || isSubmitting" class="kf-submit-btn">
                        @if (isSubmitting) {
                          <i class="pi pi-spin pi-spinner"></i> Envoi en cours...
                        } @else {
                          <i class="pi pi-send"></i> Soumettre le formulaire
                        }
                      </button>
                    </div>
                  }
                </form>
              </div>
            </div>
          } @else {
            <!-- Empty state -->
            <div class="kf-select-hint">
              <div class="kf-select-hint-icon">
                <i class="pi pi-file-edit"></i>
              </div>
              <p class="kf-select-hint-title">Sélectionnez un formulaire</p>
              <p class="kf-select-hint-sub">Choisissez un formulaire dans la liste de gauche pour le visualiser et le remplir.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ── Page ── */
    .kf-page { padding: 28px; background: #F5F6FA; min-height: 100vh; font-family: 'Inter', sans-serif; }

    /* ── Header ── */
    .kf-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
    .kf-title { font-size: 28px; font-weight: 900; color: #1A1A2E; margin: 0; letter-spacing: -0.5px; }
    .kf-subtitle { color: #8a8a8a; font-size: 14px; margin-top: 4px; }
    .kf-header-badges { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .kf-count-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .kpi-color { background: #EBF5FF; color: #1565C0; }
    .eval-color { background: #FFF0F9; color: #C0178A; }

    /* ── Layout ── */
    .kf-layout { display: grid; grid-template-columns: 340px 1fr; gap: 24px; }
    @media (max-width: 900px) { .kf-layout { grid-template-columns: 1fr; } }

    /* ── Left panel ── */
    .kf-list-panel { display: flex; flex-direction: column; gap: 20px; }

    .kf-group { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .kf-group-header { display: flex; align-items: center; gap: 10px; padding: 14px 18px; }
    .kpi-header { background: linear-gradient(135deg, #1565C0 0%, #1976D2 100%); }
    .eval-header { background: linear-gradient(135deg, #C0178A 0%, #e91e8c 100%); }
    .kf-group-icon { color: white; font-size: 16px; }
    .kf-group-title { color: white; font-size: 14px; font-weight: 800; flex: 1; letter-spacing: 0.02em; }
    .kf-group-count { background: rgba(255,255,255,0.25); color: white; font-size: 11px; font-weight: 900; padding: 2px 8px; border-radius: 20px; }

    .kf-empty-group { padding: 20px; text-align: center; color: #9CA3AF; font-size: 12px; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .kf-empty-group i { font-size: 20px; color: #D1FAE5; }

    .kf-card {
      padding: 16px 18px; cursor: pointer; border-bottom: 1px solid #F3F4F6;
      transition: background 0.15s, border-left 0.15s;
      border-left: 3px solid transparent;
    }
    .kf-card:last-child { border-bottom: none; }
    .kf-card:hover { background: #FAFBFF; }
    .kf-card-selected { background: #F0F7FF !important; border-left-color: #1565C0 !important; }
    .kf-card-submitted { opacity: 0.75; }

    .kf-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
    .kf-card-title { font-size: 13px; font-weight: 700; color: #1A1A2E; margin: 0; line-height: 1.4; flex: 1; }

    .kf-status-badge { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 8px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
    .badge-pending { background: #FEF3C7; color: #92400E; }
    .badge-submitted { background: #D1FAE5; color: #065F46; }

    .kf-card-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .kf-deadline { font-size: 10px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; background: #F3F4F6; color: #6B7280; }
    .kf-deadline-urgent { background: #FEE2E2 !important; color: #DC2626 !important; }

    .kf-type-tag { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 6px; }
    .kpi-tag { background: #EBF5FF; color: #1565C0; }
    .eval-tag { background: #FFF0F9; color: #C0178A; }

    .kf-all-empty { padding: 40px 20px; text-align: center; background: #fff; border-radius: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .kf-all-empty-icon { width: 64px; height: 64px; background: #F8FAFC; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .kf-all-empty-icon i { font-size: 28px; color: #CBD5E1; }
    .kf-all-empty-title { font-size: 16px; font-weight: 800; color: #1A1A2E; margin: 0 0 4px; }
    .kf-all-empty-sub { font-size: 12px; color: #9CA3AF; margin: 0; }

    /* ── Right panel ── */
    .kf-content-panel { position: relative; }

    .kf-form-wrapper { background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); display: flex; flex-direction: column; min-height: 600px; }

    .kf-form-header { padding: 32px; color: white; position: relative; overflow: hidden; background: linear-gradient(135deg, #1565C0 0%, #0D47A1 100%); }
    .kf-form-header-eval { background: linear-gradient(135deg, #880E4F 0%, #C0178A 100%); }
    .kf-form-header-deco { position: absolute; right: -20px; top: -20px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.08); }

    .kf-form-header-content { position: relative; }
    .kf-form-type-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }

    .kf-form-title { font-size: 22px; font-weight: 900; margin: 0 0 8px; letter-spacing: -0.3px; }
    .kf-form-desc { font-size: 13px; opacity: 0.85; margin: 0; line-height: 1.5; }

    .kf-form-deadline-info { margin-top: 12px; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 8px; }
    .kf-form-deadline-info.urgent { background: rgba(239,68,68,0.3); }

    .kf-submitted-banner { display: flex; align-items: center; gap: 16px; padding: 20px 28px; background: #ECFDF5; border-bottom: 1px solid #D1FAE5; }
    .kf-submitted-icon { width: 40px; height: 40px; background: #D1FAE5; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kf-submitted-icon i { color: #059669; font-size: 18px; }
    .kf-submitted-title { font-size: 14px; font-weight: 800; color: #065F46; margin: 0 0 2px; }
    .kf-submitted-sub { font-size: 12px; color: #6EE7B7; margin: 0; }

    .kf-questions-body { padding: 28px; flex: 1; overflow-y: auto; }
    .kf-questions-list { display: flex; flex-direction: column; gap: 20px; }

    .kf-question-item { display: flex; flex-direction: column; gap: 6px; }
    .kf-q-label { font-size: 10px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; }
    .kf-required { color: #ea5073; margin-left: 2px; }
    .kf-q-box { background: #F8FAFC; border-radius: 16px; padding: 20px; border: 2px solid transparent; transition: all 0.2s; }
    .kf-q-box:focus-within { border-color: #BFDBFE; background: #fff; box-shadow: 0 4px 12px rgba(21,101,192,0.08); }
    .kf-q-text { font-size: 14px; font-weight: 700; color: #1A1A2E; margin: 0 0 14px; line-height: 1.4; }

    .kf-input { width: 100%; background: transparent; border: none; outline: none; font-size: 14px; font-weight: 600; color: #374151; line-height: 1.5; resize: none; box-sizing: border-box; }
    .kf-input::placeholder { color: #D1D5DB; }
    .kf-textarea { resize: vertical; min-height: 80px; }
    .kf-select { width: 100%; background: transparent; border: none; outline: none; font-size: 14px; font-weight: 600; color: #374151; cursor: pointer; appearance: none; }

    .kf-submit-row { padding-top: 24px; border-top: 1px solid #F1F5F9; display: flex; justify-content: flex-end; margin-top: 24px; }
    .kf-submit-btn {
      display: flex; align-items: center; gap: 10px; padding: 14px 28px;
      background: linear-gradient(135deg, #1565C0 0%, #0D47A1 100%);
      color: white; border: none; border-radius: 16px; font-size: 14px; font-weight: 800;
      cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 20px rgba(21,101,192,0.25);
      letter-spacing: 0.02em;
    }
    .kf-submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(21,101,192,0.35); }
    .kf-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .kf-select-hint { min-height: 600px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center; background: #fff; border-radius: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .kf-select-hint-icon { width: 80px; height: 80px; background: #F8FAFC; border-radius: 24px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    .kf-select-hint-icon i { font-size: 36px; color: #CBD5E1; }
    .kf-select-hint-title { font-size: 20px; font-weight: 900; color: #1A1A2E; margin: 0 0 8px; letter-spacing: -0.3px; }
    .kf-select-hint-sub { font-size: 13px; color: #9CA3AF; margin: 0; max-width: 280px; line-height: 1.5; }
  `],
})
export class EntrepreneurKpiFormsComponent implements OnInit {
  private svc = inject(KpiFormService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  private allResponses = signal<KpiFormResponse[]>([]);
  selectedResponse = signal<KpiFormResponse | null>(null);
  activeFormDetails = signal<KpiForm | null>(null);
  currentAnswers: KpiFormAnswer[] = [];
  isSubmitting = false;

  // Computed: separate by formType
  kpiForms = computed(() => this.allResponses().filter(r => (r.formType || 'KPI') === 'KPI'));
  evalForms = computed(() => this.allResponses().filter(r => r.formType === 'EVALUATION'));
  allForms = computed(() => this.allResponses());

  ngOnInit(): void {
    this.loadResponses();
  }

  loadResponses() {
    const user = this.auth.currentUser$.value;
    if (!user) return;
    this.svc.getPendingFormsForEntrepreneur(user.id).subscribe((res: KpiFormResponse[]) => {
      this.allResponses.set(res || []);
      this.cdr.markForCheck();
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
      this.cdr.markForCheck();
    });
  }

  parseOptions(optionsStr: string | undefined): string[] {
    if (!optionsStr) return [];
    return optionsStr.split(',').map(s => s.trim());
  }

  getDaysRemaining(deadline: string): string {
    const d = new Date(deadline);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Deadline dépassée';
    if (diff === 0) return "Expire aujourd'hui";
    if (diff === 1) return 'Expire demain';
    return `Expire dans ${diff} jours`;
  }

  isUrgent(deadline: string): boolean {
    const d = new Date(deadline);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 2;
  }

  submitForm() {
    const res = this.selectedResponse();
    if (!res?.id) return;
    this.isSubmitting = true;
    this.svc.submitResponse(res.id, this.currentAnswers).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.loadResponses();
        this.selectedResponse.update(curr => curr ? { ...curr, status: 'SUBMITTED' } : null);
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }
}
