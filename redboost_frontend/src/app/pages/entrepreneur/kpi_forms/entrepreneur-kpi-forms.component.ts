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

            <div class="kf-group-content">
              @if (evalForms().length === 0) {
                <div class="kf-empty-group">
                  <i class="pi pi-check-circle"></i>
                  <p>Aucun formulaire d'évaluation en attente</p>
                </div>
              }

              @for (f of evalForms(); track f.id) {
                <div class="kf-card"
                  [class.kf-card-selected]="selectedResponse()?.id === f.id"
                  [class.eval-selected]="selectedResponse()?.id === f.id"
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
          </div>

          <!-- Group: Formulaires KPI -->
          <div class="kf-group">
            <div class="kf-group-header kpi-header">
              <i class="pi pi-chart-line kf-group-icon"></i>
              <span class="kf-group-title">Formulaires KPI</span>
              <span class="kf-group-count">{{ kpiForms().length }}</span>
            </div>

            <div class="kf-group-content">
              @if (kpiForms().length === 0) {
                <div class="kf-empty-group">
                  <i class="pi pi-check-circle"></i>
                  <p>Aucun formulaire KPI en attente</p>
                </div>
              }

              @for (f of kpiForms(); track f.id) {
                <div class="kf-card"
                  [class.kf-card-selected]="selectedResponse()?.id === f.id"
                  [class.kpi-selected]="selectedResponse()?.id === f.id"
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
              <div class="kf-form-header" [class.kf-form-header-eval]="selectedResponse()?.formType === 'EVALUATION'" [class.kf-form-header-kpi]="selectedResponse()?.formType !== 'EVALUATION'">
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
                      <button type="submit" [disabled]="!kpiForm.form.valid || isSubmitting" 
                              class="kf-submit-btn" 
                              [class.kf-submit-btn-eval]="selectedResponse()?.formType === 'EVALUATION'">
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
    .kf-page { padding: 32px; background: #F8FAFC; min-height: 100vh; font-family: 'Inter', sans-serif; }

    /* ── Header ── */
    .kf-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
    .kf-title { font-size: 32px; font-weight: 900; color: #0F172A; margin: 0 0 8px; letter-spacing: -0.02em; }
    .kf-subtitle { color: #64748B; font-size: 15px; margin: 0; }
    .kf-header-badges { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .kf-count-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 99px; font-size: 13px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .kpi-color { background: white; color: #EA4C89; border: 1px solid #FCE7F3; }
    .eval-color { background: white; color: #8B5CF6; border: 1px solid #EDE9FE; }

    /* ── Layout ── */
    .kf-layout { display: grid; grid-template-columns: 360px 1fr; gap: 32px; }
    @media (max-width: 900px) { .kf-layout { grid-template-columns: 1fr; } }

    /* ── Left panel ── */
    .kf-list-panel { display: flex; flex-direction: column; gap: 24px; }

    .kf-group { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #F1F5F9; display: flex; flex-direction: column; height: 420px; }
    .kf-group-content { flex: 1; overflow-y: auto; }
    .kf-group-content::-webkit-scrollbar { width: 6px; }
    .kf-group-content::-webkit-scrollbar-track { background: transparent; }
    .kf-group-content::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 6px; }

    .kf-group-header { display: flex; align-items: center; gap: 12px; padding: 20px 24px; border-bottom: 1px solid #F1F5F9; background: #fff; position: relative; }
    .kf-group-header::after { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 4px; }
    .kpi-header::after { background: linear-gradient(135deg, #EA4C89, #FF7EB3); }
    .eval-header::after { background: linear-gradient(135deg, #6366F1, #8B5CF6); }
    
    .kpi-header .kf-group-icon { color: #EA4C89; font-size: 18px; }
    .eval-header .kf-group-icon { color: #8B5CF6; font-size: 18px; }
    
    .kf-group-title { color: #0F172A; font-size: 16px; font-weight: 900; flex: 1; letter-spacing: -0.01em; }
    
    .kpi-header .kf-group-count { background: #FDF2F8; color: #BE185D; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 99px; }
    .eval-header .kf-group-count { background: #F5F3FF; color: #6D28D9; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 99px; }

    .kf-empty-group { padding: 32px 20px; text-align: center; color: #94A3B8; font-size: 13px; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .kf-empty-group i { font-size: 24px; color: #E2E8F0; }

    .kf-card {
      padding: 20px 24px; cursor: pointer; border-bottom: 1px solid #F1F5F9;
      transition: all 0.2s; position: relative;
    }
    .kf-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: transparent; transition: background 0.2s; }
    .kf-card:last-child { border-bottom: none; }
    .kf-card:hover { background: #F8FAFC; }
    .kf-card-selected.kpi-selected { background: #FDF2F8 !important; }
    .kf-card-selected.kpi-selected::before { background: #EA4C89; }
    .kf-card-selected.eval-selected { background: #F5F3FF !important; }
    .kf-card-selected.eval-selected::before { background: #8B5CF6; }
    .kf-card-submitted { opacity: 0.65; }

    .kf-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .kf-card-title { font-size: 14px; font-weight: 700; color: #1E293B; margin: 0; line-height: 1.4; flex: 1; }

    .kf-status-badge { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 99px; white-space: nowrap; flex-shrink: 0; }
    .badge-pending { background: #FEF3C7; color: #B45309; }
    .badge-submitted { background: #DCFCE7; color: #15803D; }

    .kf-card-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .kf-deadline { font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 8px; background: #F1F5F9; color: #64748B; }
    .kf-deadline-urgent { background: #FEE2E2 !important; color: #DC2626 !important; }

    .kf-type-tag { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px; }
    .kpi-tag { background: #FDF2F8; color: #BE185D; }
    .eval-tag { background: #F5F3FF; color: #6D28D9; }

    .kf-all-empty { padding: 64px 32px; text-align: center; background: #fff; border-radius: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.04); border: 1px solid #F1F5F9; }
    .kf-all-empty-icon { width: 80px; height: 80px; background: #F8FAFC; border-radius: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
    .kf-all-empty-icon i { font-size: 32px; color: #CBD5E1; }
    .kf-all-empty-title { font-size: 18px; font-weight: 800; color: #0F172A; margin: 0 0 8px; }
    .kf-all-empty-sub { font-size: 14px; color: #64748B; margin: 0; line-height: 1.5; }

    /* ── Right panel ── */
    .kf-content-panel { position: relative; }

    .kf-form-wrapper { background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04); border: 1px solid #F1F5F9; display: flex; flex-direction: column; min-height: 600px; }

    .kf-form-header { padding: 40px; background: #fff; border-bottom: 1px solid #F1F5F9; position: relative; }
    .kf-form-header::after { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 6px; }
    .kf-form-header-kpi::after { background: linear-gradient(135deg, #EA4C89, #FF7EB3); }
    .kf-form-header-eval::after { background: linear-gradient(135deg, #6366F1, #8B5CF6); }

    .kf-form-header-content { position: relative; }
    .kf-form-type-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
    .type-eval { background: #F5F3FF; color: #6D28D9; }
    .type-kpi { background: #FDF2F8; color: #BE185D; }

    .kf-form-title { font-size: 28px; font-weight: 900; color: #0F172A; margin: 0 0 12px; letter-spacing: -0.02em; }
    .kf-form-desc { font-size: 15px; color: #475569; margin: 0; line-height: 1.6; }

    .kf-form-deadline-info { display: inline-flex; align-items: center; gap: 8px; margin-top: 20px; padding: 10px 16px; border-radius: 12px; background: #F8FAFC; color: #475569; font-size: 13px; font-weight: 700; }
    .kf-form-deadline-info.urgent { background: #FEF2F2; color: #DC2626; }

    .kf-submitted-banner { display: flex; align-items: center; gap: 20px; padding: 24px 40px; background: #ECFDF5; border-bottom: 1px solid #D1FAE5; }
    .kf-submitted-icon { width: 48px; height: 48px; background: #D1FAE5; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kf-submitted-icon i { color: #059669; font-size: 20px; }
    .kf-submitted-title { font-size: 15px; font-weight: 800; color: #065F46; margin: 0 0 4px; }
    .kf-submitted-sub { font-size: 13px; color: #34D399; margin: 0; }

    .kf-questions-body { padding: 40px; flex: 1; overflow-y: auto; background: #FAFAFA; }
    .kf-questions-list { display: flex; flex-direction: column; gap: 24px; }

    .kf-question-item { display: flex; flex-direction: column; gap: 8px; }
    .kf-q-label { font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.1em; margin-left: 4px; }
    .kf-required { color: #EA4C89; margin-left: 2px; }
    
    .kf-q-box { background: #fff; border-radius: 16px; padding: 28px; border: 1px solid #E2E8F0; box-shadow: 0 2px 12px rgba(0,0,0,0.02); transition: all 0.2s; }
    .kf-q-box:focus-within { border-color: #EA4C89; box-shadow: 0 4px 20px rgba(234, 76, 137, 0.08); }
    .kf-q-text { font-size: 15px; font-weight: 700; color: #1E293B; margin: 0 0 20px; line-height: 1.5; }

    .kf-input, .kf-select { width: 100%; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px 20px; border-radius: 12px; font-size: 15px; font-weight: 500; color: #0F172A; transition: all 0.2s; box-sizing: border-box; }
    .kf-input::placeholder { color: #94A3B8; }
    .kf-input:focus, .kf-select:focus { outline: none; border-color: #EA4C89; background: #fff; box-shadow: 0 0 0 4px rgba(234, 76, 137, 0.1); }
    .kf-textarea { resize: vertical; min-height: 100px; }
    .kf-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; background-size: 16px; padding-right: 40px; }

    .kf-submit-row { padding-top: 32px; border-top: 1px solid #E2E8F0; display: flex; justify-content: flex-end; margin-top: 32px; }
    .kf-submit-btn {
      display: flex; align-items: center; gap: 10px; padding: 16px 32px;
      background: linear-gradient(135deg, #EA4C89 0%, #FF7EB3 100%);
      color: white; border: none; border-radius: 16px; font-size: 15px; font-weight: 800;
      cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 24px rgba(234, 76, 137, 0.25);
      letter-spacing: 0.02em;
    }
    .kf-submit-btn-eval {
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
    }
    .kf-submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(234, 76, 137, 0.35); }
    .kf-submit-btn-eval:hover:not(:disabled) { box-shadow: 0 12px 32px rgba(99, 102, 241, 0.35); }
    .kf-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

    .kf-select-hint { min-height: 600px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; text-align: center; background: #fff; border-radius: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.04); border: 1px solid #F1F5F9; }
    .kf-select-hint-icon { width: 96px; height: 96px; background: #F8FAFC; border-radius: 28px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
    .kf-select-hint-icon i { font-size: 40px; color: #CBD5E1; }
    .kf-select-hint-title { font-size: 22px; font-weight: 900; color: #0F172A; margin: 0 0 12px; letter-spacing: -0.3px; }
    .kf-select-hint-sub { font-size: 14px; color: #64748B; margin: 0; max-width: 320px; line-height: 1.6; }
    
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

    let submitAnswers = [...this.currentAnswers];

    this.isSubmitting = true;
    this.svc.submitResponse(res.id, submitAnswers).subscribe({
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
