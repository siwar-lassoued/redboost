import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { FormTemplate, FormQuestion } from '../../models/candidature.model';
import { FormTemplateService, FormTemplateDTO } from '../../services/form-template.service';
import { ProgrammeService } from '../../../programmes/programme.service';

type Step = 'choice' | 'templates' | 'form';

@Component({
  selector: 'rb-admin-form-launcher',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div *ngIf="open" class="fl-overlay">
      <div class="fl-box" [style.max-width.px]="getStepMaxWidth()">
        <!-- Header -->
        <div class="fl-header">
          <div>
            <h3 class="fl-title">
              {{ step() === 'choice' ? 'Lancer un formulaire de candidature' : step() === 'templates' ? 'Sélectionner un template' : 'Créer le formulaire' }}
            </h3>
            <p class="fl-subtitle">
              {{ step() === 'choice' ? 'Choisissez votre mode de création' : step() === 'templates' ? 'Choisissez un formulaire existant à réutiliser' : 'Configurez les questions et paramètres' }}
            </p>
          </div>
          <button (click)="onClose()" class="fl-close-btn">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>
        </div>

        <!-- STEP 1: Choice -->
        <div *ngIf="step() === 'choice'" class="fl-body">
          <div class="fl-choice-grid">
            <button (click)="handleChoiceSelect('new')" class="fl-choice-card">
              <div class="fl-choice-icon" style="background: linear-gradient(to right, #ea5073, #6d3345);">
                <lucide-icon name="plus" [size]="24" class="text-white"></lucide-icon>
              </div>
              <h4>Créer un nouveau formulaire</h4>
              <p>Construisez un formulaire personnalisé de A à Z avec vos propres questions.</p>
            </button>
            <button (click)="handleChoiceSelect('existing')" class="fl-choice-card">
              <div class="fl-choice-icon" style="background: linear-gradient(to right, #6d3345, #2a5f6f);">
                <lucide-icon name="file-text" [size]="24" class="text-white"></lucide-icon>
              </div>
              <h4>Utiliser un template existant</h4>
              <p>Réutilisez un ancien formulaire et modifiez les questions si besoin.</p>
            </button>
            <button (click)="handleChoiceSelect('spontaneous')" class="fl-choice-card">
              <div class="fl-choice-icon" style="background: linear-gradient(to right, #2a7b8c, #1a4d5c);">
                <lucide-icon name="mail" [size]="24" class="text-white"></lucide-icon>
              </div>
              <h4>Candidature spontanée</h4>
              <p>Template pré-configuré pour recevoir des candidatures spontanées.</p>
            </button>
          </div>
        </div>

        <!-- STEP 2: Templates -->
        <div *ngIf="step() === 'templates'" class="fl-body">
          <button (click)="step.set('choice')" class="fl-back-btn">
            <lucide-icon name="chevron-left" [size]="16"></lucide-icon> Retour
          </button>
          <div class="fl-templates-grid">
            <div *ngFor="let template of templates" class="fl-template-card">
              <div class="fl-template-header">
                <div class="fl-template-icon"
                  [style.background]="template.profileType === 'coach' ? 'linear-gradient(to right, #2a7b8c, #1a4d5c)' : 'linear-gradient(to right, #ea5073, #6d3345)'">
                  <lucide-icon name="file-text" [size]="20" class="text-white"></lucide-icon>
                </div>
                <div class="fl-template-info">
                  <h4>{{ template.title }}</h4>
                  <p>{{ template.description }}</p>
                </div>
              </div>
              <div class="fl-template-meta">
                <span class="fl-meta-label">Type:</span>
                <span class="fl-meta-badge" [style.background]="template.profileType === 'coach' ? '#e5f3f4' : '#fceef1'"
                  [style.color]="template.profileType === 'coach' ? '#1a4d5c' : '#bd3b5a'">{{ template.profileType }}</span>
              </div>
              <div class="fl-template-meta">
                <span class="fl-meta-label">Questions:</span>
                <span class="fl-meta-count">{{ template.questions.length }}</span>
              </div>
              <div class="fl-template-actions">
                <button (click)="handleTemplateSelect(template)" class="fl-btn-primary">
                  <lucide-icon name="check" [size]="14"></lucide-icon> Éditer
                </button>
                <button (click)="handleTemplateDelete(template)" class="fl-btn-outline fl-btn-danger">
                  <lucide-icon name="trash-2" [size]="14"></lucide-icon>
                </button>
              </div>
              <div class="fl-template-link">
                <lucide-icon name="link" [size]="14" style="flex-shrink:0;"></lucide-icon>
                <a [href]="'/redstarter?templateId=' + template.id" target="_blank">Lien direct</a>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 3: Form Builder -->
        <div *ngIf="step() === 'form'" class="fl-body fl-form-body">
          <div class="fl-form-field">
            <label>Titre du formulaire *</label>
            <input type="text" [(ngModel)]="formTitle" placeholder="Ex: Appel à candidatures - Programme 2025">
          </div>
          <div class="fl-form-field">
            <label>Description *</label>
            <textarea [(ngModel)]="formDescription" placeholder="Décrivez l'objectif du programme..." rows="3"></textarea>
          </div>
          <div class="fl-form-field" *ngIf="templateMode !== 'spontaneous'">
            <label>Type de profil recherché *</label>
            <div class="fl-radio-group">
              <label><input type="radio" name="profileType" [value]="'coach'" [(ngModel)]="profileType"> Coach</label>
              <label><input type="radio" name="profileType" [value]="'entrepreneur'" [(ngModel)]="profileType"> Entrepreneur</label>
            </div>
          </div>
          <div class="fl-form-field" *ngIf="templateMode !== 'spontaneous'">
            <label>Date limite de candidature</label>
            <input type="date" [(ngModel)]="deadline">
          </div>
          <div class="fl-form-field" *ngIf="templateMode !== 'spontaneous'">
            <label>Programme associé *</label>
            <select [(ngModel)]="program" class="fl-select">
              <option value="" disabled selected>Sélectionnez un programme existant</option>
              <option *ngFor="let p of activeProgrammes()" [value]="p.nom">{{ p.nom }}</option>
            </select>
          </div>

          <div class="fl-form-field">
            <label>Questions personnalisées</label>
            <div class="fl-questions-list">
              <div *ngFor="let q of questions; let i = index" class="fl-question-item">
                <div class="fl-question-row">
                  <span class="fl-q-badge">Q{{ i + 1 }}</span>
                  <input [(ngModel)]="q.text" [placeholder]="q.isLocked ? '' : 'Saisissez votre question...'" [disabled]="!!q.isLocked">
                  <button *ngIf="!q.isLocked" (click)="removeQuestion(q.id)" class="fl-q-delete">
                    <lucide-icon name="trash-2" [size]="14"></lucide-icon>
                  </button>
                </div>
                <div class="fl-type-row">
                  <label><input type="radio" [name]="'type-' + q.id" [value]="'text-court'" [(ngModel)]="q.type" [disabled]="!!q.isLocked" (change)="onTypeChange(q)"> Texte court</label>
                  <label><input type="radio" [name]="'type-' + q.id" [value]="'text-long'" [(ngModel)]="q.type" [disabled]="!!q.isLocked" (change)="onTypeChange(q)"> Texte long</label>
                  <label><input type="radio" [name]="'type-' + q.id" [value]="'qcm'" [(ngModel)]="q.type" [disabled]="!!q.isLocked" (change)="onTypeChange(q)"> QCM</label>
                  <label><input type="radio" [name]="'type-' + q.id" [value]="'qcu'" [(ngModel)]="q.type" [disabled]="!!q.isLocked" (change)="onTypeChange(q)"> QCU</label>
                  <label><input type="radio" [name]="'type-' + q.id" [value]="'upload'" [(ngModel)]="q.type" [disabled]="!!q.isLocked" (change)="onTypeChange(q)"> Upload</label>
                  <label class="fl-required-check"><input type="checkbox" [(ngModel)]="q.required" [disabled]="!!q.isLocked"> Obligatoire</label>
                </div>
                <div *ngIf="q.type === 'qcm' || q.type === 'qcu'" class="fl-options">
                  <p class="fl-options-label">Options</p>
                  <div *ngFor="let opt of q.options; let optIdx = index; trackBy: trackByFn" class="fl-option-row">
                    <input [(ngModel)]="q.options![optIdx]" [placeholder]="'Option ' + (optIdx + 1)">
                    <button (click)="removeOption(q, optIdx)" class="fl-q-delete-sm"><lucide-icon name="x" [size]="14"></lucide-icon></button>
                  </div>
                  <button (click)="addOption(q)" class="fl-add-option">
                    <lucide-icon name="plus" [size]="12"></lucide-icon> Ajouter une option
                  </button>
                </div>
              </div>
              <button (click)="addQuestion()" class="fl-add-question">
                <lucide-icon name="plus" [size]="16"></lucide-icon> Ajouter une question
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div *ngIf="step() === 'form'" class="fl-footer">
          <button (click)="onBack()" class="fl-btn-text">Retour</button>
          <button (click)="handlePublish()" [disabled]="!isFormValid() || publishing" class="fl-btn-primary">
            <lucide-icon *ngIf="publishing" name="loader" [size]="16" class="animate-spin"></lucide-icon>
            {{ publishing ? 'Publication...' : "Publier le formulaire" }}
          </button>
        </div>

        <!-- Success Toast -->
        <div *ngIf="successMessage" class="fl-success-overlay">
          <div class="fl-success-content">
            <div class="fl-success-icon"><lucide-icon name="check" [size]="32" class="text-white"></lucide-icon></div>
            <p>{{ successMessage }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: 'Poppins', sans-serif; }
    .fl-overlay { position:fixed; inset:0; z-index:99999; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); }
    .fl-box { background:#fff; width:100%; max-height:90vh; overflow-y:auto; border-radius:20px; box-shadow:0 20px 60px rgba(0,0,0,0.2); position:relative; }
    .fl-header { padding:24px 28px; border-bottom:1px solid #F3F4F6; position:sticky; top:0; background:#fff; z-index:10; display:flex; align-items:center; justify-content:space-between; border-radius:20px 20px 0 0; }
    .fl-title { font-size:1.5rem; font-weight:700; color:#0f172a; margin:0 0 4px 0; }
    .fl-subtitle { font-size:0.875rem; color:#6b7280; margin:0; }
    .fl-close-btn { padding:8px; border-radius:12px; border:none; background:none; cursor:pointer; color:#9CA3AF; transition:all .2s; }
    .fl-close-btn:hover { background:#F3F4F6; color:#333; }
    .fl-body { padding:28px; }
    .fl-choice-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
    .fl-choice-card { padding:28px 20px; border-radius:20px; border:2px solid #E5E7EB; background:#fff; cursor:pointer; transition:all .25s ease; text-align:center; }
    .fl-choice-card:hover { transform:translateY(-3px); box-shadow:0 12px 28px rgba(234,80,115,0.12); border-color:#ea5073; }
    .fl-choice-card h4 { font-weight:700; color:#0f172a; margin:0 0 8px; font-size:0.875rem; }
    .fl-choice-card p { font-size:0.75rem; color:#6b7280; margin:0; line-height:1.5; }
    .fl-choice-icon { width:56px; height:56px; border-radius:14px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
    .fl-back-btn { display:flex; align-items:center; gap:8px; padding:8px 16px; border-radius:10px; border:2px solid #cbd5e1; background:none; cursor:pointer; color:#475569; font-size:0.875rem; font-weight:500; transition:all .2s; margin-bottom:16px; }
    .fl-back-btn:hover { background:#f8fafc; border-color:#94a3b8; }
    .fl-templates-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; max-height:70vh; overflow-y:auto; }
    .fl-template-card { background:#fff; border:2px solid #E5E7EB; border-radius:20px; padding:20px; transition:all .2s; }
    .fl-template-card:hover { border-color:#ea5073; box-shadow:0 8px 24px rgba(234,80,115,0.08); }
    .fl-template-header { display:flex; align-items:flex-start; gap:12px; margin-bottom:12px; }
    .fl-template-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .fl-template-info h4 { font-weight:700; font-size:0.875rem; color:#0f172a; margin:0 0 4px; }
    .fl-template-info p { font-size:0.75rem; color:#6b7280; margin:0; }
    .fl-template-meta { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .fl-meta-label { font-size:0.75rem; color:#6b7280; }
    .fl-meta-badge { font-size:0.75rem; font-weight:600; padding:3px 12px; border-radius:20px; text-transform:capitalize; }
    .fl-meta-count { font-size:0.75rem; font-weight:700; color:#e11d48; }
    .fl-template-actions { display:flex; gap:8px; margin-top:16px; margin-bottom: 12px; }
    .fl-btn-primary { flex: 1; display:flex; align-items:center; justify-content:center; gap:8px; padding:10px 20px; border-radius:10px; font-size:0.875rem; font-weight:600; color:#fff; border:none; cursor:pointer; transition:all .2s ease; background:#ea5073; }
    .fl-btn-primary:hover { background:#d4476a; transform:translateY(-1px); }
    .fl-btn-primary:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
    .fl-btn-outline { display:flex; align-items:center; justify-content:center; gap:8px; padding:10px; border-radius:10px; font-size:0.875rem; font-weight:600; color:#ea5073; border:2px solid #ea5073; background:none; cursor:pointer; transition:all .2s; }
    .fl-btn-outline:hover { background:#fdf2f8; }
    .fl-btn-danger { color: #ef4444; border-color: #fca5a5; }
    .fl-btn-danger:hover { background: #fef2f2; border-color: #ef4444; }
    .fl-template-link { display:flex; align-items:center; gap:8px; padding: 8px 12px; background:#f8fafc; border-radius:8px; font-size:0.75rem; font-weight:500; color:#64748b; border: 1px solid #e2e8f0; }
    .fl-template-link a { color:#0ea5e9; text-decoration:none; transition: color 0.15s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; flex: 1; }
    .fl-template-link a:hover { color:#0284c7; text-decoration:underline; }
    .fl-btn-text { padding:12px 24px; border-radius:12px; border:2px solid #cbd5e1; background:none; cursor:pointer; font-size:0.875rem; font-weight:600; color:#475569; transition:all .2s; }
    .fl-btn-text:hover { background:#f8fafc; border-color:#94a3b8; color: #0f172a; }
    .fl-form-body { display:flex; flex-direction:column; gap:28px; }
    .fl-form-field label { display:block; font-size:0.875rem; font-weight:700; color:#1e293b; margin-bottom:10px; }
    .fl-form-field input[type="text"], .fl-form-field input[type="date"], .fl-form-field textarea, .fl-form-field select { width:100%; padding:14px 18px; border:2px solid #e2e8f0; border-radius:12px; font-size:0.875rem; outline:none; color:#0f172a; transition:all .2s; box-sizing:border-box; font-family:inherit; background: #f8fafc; }
    .fl-form-field input[type="text"]:focus, .fl-form-field input[type="date"]:focus, .fl-form-field textarea:focus, .fl-form-field select:focus { border-color:#ea5073; background: #ffffff; box-shadow:0 0 0 4px rgba(234,80,115,0.1); }
    .fl-select { cursor: pointer; appearance: auto; }
    .fl-form-field textarea { resize:vertical; min-height: 100px; }
    .fl-radio-group { display:flex; gap:24px; }
    .fl-radio-group label { display:flex; align-items:center; gap:8px; font-size:0.875rem; color:#475569; font-weight:600; cursor:pointer; padding: 12px 20px; border: 2px solid #e2e8f0; border-radius: 12px; transition: all 0.2s; background: #f8fafc; }
    .fl-radio-group label:has(input:checked) { border-color: #ea5073; background: #fff1f2; color: #ea5073; }
    .fl-radio-group input[type="radio"] { accent-color:#ea5073; cursor:pointer; transform:scale(1.2); margin:0; }
    .fl-questions-list { display:flex; flex-direction:column; gap:20px; }
    .fl-question-item { border:2px solid #E5E7EB; border-radius:16px; padding:20px; background:#fff; transition:all .2s; }
    .fl-question-item:hover { border-color:#ea5073; box-shadow:0 4px 12px rgba(234,80,115,0.06); }
    .fl-question-row { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
    .fl-question-row input { flex:1; padding:10px 16px; border:2px solid #cbd5e1; border-radius:10px; font-size:0.875rem; outline:none; color:#1e293b; transition:all .2s; font-family:inherit; }
    .fl-question-row input:focus:not(:disabled) { border-color:#ea5073; box-shadow:0 0 0 4px rgba(234,80,115,0.1); }
    .fl-question-row input:disabled { background:#F3F4F6; cursor:not-allowed; color:#6b7280; font-weight:600; border-color:#E5E7EB; }
    .fl-q-badge { background:#fce7f3; color:#e11d48; padding:6px 12px; border-radius:8px; font-size:0.75rem; font-weight:700; line-height:1; white-space:nowrap; }
    .fl-q-delete, .fl-q-delete-sm { padding:8px; border-radius:8px; border:none; background:none; cursor:pointer; color:#9CA3AF; transition:all .2s; }
    .fl-q-delete:hover, .fl-q-delete-sm:hover { color:#ea5073; background:#FEF2F2; }
    .fl-type-row { display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-bottom:8px; }
    .fl-type-row label { display:flex; align-items:center; gap:6px; font-size:0.75rem; font-weight:500; color:#475569; cursor:pointer; }
    .fl-type-row input[type="radio"], .fl-type-row input[type="checkbox"] { accent-color:#ea5073; cursor:pointer; margin:0; }
    .fl-required-check { margin-left:auto; border-left:1px solid #E5E7EB; padding-left:12px; }
    .fl-options { margin-left:48px; margin-top:12px; }
    .fl-options-label { font-size:0.75rem; font-weight:600; color:#64748b; margin-bottom:8px; display:block; }
    .fl-option-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .fl-option-row input { flex:1; padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px; font-size:0.875rem; outline:none; color:#1e293b; transition:all .2s; font-family:inherit; }
    .fl-option-row input:focus { border-color:#ea5073; box-shadow:0 0 0 3px rgba(234,80,115,0.1); }
    .fl-add-option { display:flex; align-items:center; gap:4px; font-size:0.75rem; font-weight:600; color:#ea5073; background:transparent; border:none; cursor:pointer; padding:0; margin-top:8px; }
    .fl-add-option:hover { color:#d4476a; }
    .fl-add-question { width:100%; padding:16px; border:2px dashed #cbd5e1; border-radius:14px; font-size:0.875rem; font-weight:600; color:#64748b; background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all .25s ease; }
    .fl-add-question:hover { border-color:#ea5073; color:#ea5073; background:#fdf2f8; }
    .fl-footer { padding:20px 28px; border-top:1px solid #F3F4F6; display:flex; align-items:center; justify-content:flex-end; gap:16px; position:sticky; bottom:0; background:#fff; border-radius:0 0 20px 20px; }
    .fl-success-overlay { position:absolute; inset:0; z-index:20; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.92); border-radius:20px; }
    .fl-success-content { display:flex; flex-direction:column; align-items:center; gap:16px; }
    .fl-success-icon { width:64px; height:64px; border-radius:50%; background:#22C55E; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(34,197,94,0.3); }
    .fl-success-content p { font-size:1.25rem; font-weight:700; color:#0f172a; margin:0; }
    .text-white { color:#fff; }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @media(max-width:1024px) {
      .fl-choice-grid { grid-template-columns:1fr 1fr; }
    }
    @media(max-width:768px) {
      .fl-overlay { padding:0; align-items:flex-end; }
      .fl-box { max-height:95vh; border-radius:20px 20px 0 0; }
      .fl-header { padding:16px 20px; }
      .fl-title { font-size:1.25rem; }
      .fl-body { padding:20px; }
      .fl-choice-grid { grid-template-columns:1fr; gap:12px; }
      .fl-choice-card { padding:20px 16px; }
      .fl-choice-icon { width:44px; height:44px; margin-bottom:12px; }
      .fl-templates-grid { grid-template-columns:1fr; }
      .fl-question-row { flex-wrap:wrap; }
      .fl-question-row input { min-width:0; }
      .fl-type-row { gap:8px; }
      .fl-required-check { margin-left:0; border-left:none; padding-left:0; margin-top:8px; width:100%; }
      .fl-options { margin-left:0; }
      .fl-radio-group { flex-direction:column; gap:12px; }
      .fl-footer { padding:16px 20px; flex-wrap:wrap; gap:10px; }
      .fl-btn-primary { width:100%; }
      .fl-btn-text { width:100%; text-align:center; }
    }
    @media(max-width:400px) {
      .fl-title { font-size:1.1rem; }
      .fl-subtitle { font-size:0.75rem; }
      .fl-body { padding:14px; }
      .fl-choice-card h4 { font-size:0.8rem; }
    }
  `]
})
export class AdminFormLauncherComponent implements OnChanges {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  private formTemplateSvc = inject(FormTemplateService);
  private programmeSvc = inject(ProgrammeService);
  activeProgrammes = this.programmeSvc.programmes;

  step = signal<Step>('choice');
  templateMode: 'new' | 'existing' | 'spontaneous' | null = null;
  templates: FormTemplate[] = [];
  publishing = false;
  successMessage = '';
  formTitle = '';
  formDescription = '';
  profileType: 'coach' | 'entrepreneur' | 'spontanee' = 'coach';
  deadline = '';
  program = '';
  questions: FormQuestion[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.loadTemplates();
      this.programmeSvc.loadAll();
    }
  }

  private loadTemplates(): void {
    this.formTemplateSvc.getAll().subscribe({
      next: (dtos) => { this.templates = dtos.map(dto => FormTemplateService.toView(dto)); },
      error: () => { console.warn('Could not load form templates from API'); }
    });
  }

  getStepMaxWidth(): number {
    switch (this.step()) { 
      case 'choice': return 800; 
      case 'templates': return 900; 
      case 'form': return 750; 
      default: return 750; 
    }
  }

  onClose(): void { this.closed.emit(); this.reset(); }
  reset(): void { this.step.set('choice'); this.templateMode = null; this.formTitle = ''; this.formDescription = ''; this.profileType = 'coach'; this.deadline = ''; this.program = ''; this.questions = []; }

  handleChoiceSelect(mode: 'new' | 'existing' | 'spontaneous'): void {
    this.templateMode = mode;
    if (mode === 'existing') { this.step.set('templates'); }
    else if (mode === 'spontaneous') {
      this.formTitle = 'Candidature Spontanée';
      this.formDescription = 'Utilisez ce formulaire pour postuler librement en dehors des appels spécifiques.';
      this.questions = [
        { id: Math.random(), text: 'Nom et Prénom', type: 'text-court', required: true, isLocked: true },
        { id: Math.random(), text: 'Email', type: 'text-court', required: true, isLocked: true },
        { id: Math.random(), text: 'Numéro de téléphone', type: 'text-court', required: true, isLocked: true },
        { id: Math.random(), text: 'Nom de la startup (si applicable)', type: 'text-court', required: false, isLocked: true },
        { id: Math.random(), text: 'Êtes-vous un Coach ou un Entrepreneur ?', type: 'qcu', options: ['Coach', 'Entrepreneur'], required: true, isLocked: true }
      ];
      this.step.set('form');
    } else {
      this.questions = [
        { id: Math.random(), text: 'Nom et Prénom', type: 'text-court', required: true, isLocked: true },
        { id: Math.random(), text: 'Email', type: 'text-court', required: true, isLocked: true },
        { id: Math.random(), text: 'Numéro de téléphone', type: 'text-court', required: true, isLocked: true },
        { id: Math.random(), text: 'Nom de la startup (si applicable)', type: 'text-court', required: false, isLocked: true }
      ];
      this.step.set('form');
    }
  }

  handleTemplateSelect(template: FormTemplate): void {
    this.formTitle = template.title; this.formDescription = template.description; this.profileType = template.profileType; this.program = template.program;
    this.questions = template.questions.map(q => ({ ...q, id: Math.random() })); this.step.set('form');
  }

  handleTemplateDelete(template: FormTemplate): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le modèle "${template.title}" ?`)) {
      this.formTemplateSvc.delete(template.id).subscribe({
        next: () => {
           this.successMessage = 'Formulaire supprimé !';
           this.loadTemplates();
           setTimeout(() => { this.successMessage = ''; }, 1800);
        },
        error: () => alert('Erreur lors de la suppression')
      });
    }
  }

  onBack(): void {
    if (this.step() === 'choice') { this.onClose(); }
    else if (this.step() === 'templates') { this.step.set('choice'); }
    else { this.step.set(this.templateMode === 'existing' ? 'templates' : 'choice'); }
  }

  addQuestion(): void { this.questions = [...this.questions, { id: Math.random(), text: '', type: 'text-court', required: true }]; }
  removeQuestion(id: number): void { this.questions = this.questions.filter(q => q.id !== id); }
  onTypeChange(q: FormQuestion): void { if ((q.type === 'qcm' || q.type === 'qcu') && (!q.options || q.options.length === 0)) { q.options = ['Option 1', 'Option 2']; } }
  addOption(q: FormQuestion): void { if (!q.options) q.options = []; q.options = [...q.options, `Option ${q.options.length + 1}`]; }
  removeOption(q: FormQuestion, idx: number): void { if (q.options) { q.options = q.options.filter((_, i) => i !== idx); } }

  isFormValid(): boolean {
    if (!this.formTitle || !this.formDescription) return false;
    if (this.templateMode !== 'spontaneous' && !this.program) return false;
    return true;
  }

  handlePublish(): void {
    if (this.publishing || !this.isFormValid()) return;
    this.publishing = true;
    const dto = FormTemplateService.toDTO({ 
      title: this.formTitle, 
      description: this.formDescription, 
      profileType: this.templateMode === 'spontaneous' ? 'spontanee' : this.profileType, // Default saving type 
      questions: this.questions, 
      deadline: this.deadline,
      program: this.templateMode === 'spontaneous' ? 'Spontanée' : this.program
    });
    this.formTemplateSvc.create(dto).subscribe({
      next: () => { this.publishing = false; this.successMessage = `Formulaire "${this.formTitle}" publié avec succès !`; setTimeout(() => { this.successMessage = ''; this.onClose(); }, 1800); },
      error: (err) => { this.publishing = false; console.error('Failed to publish form:', err); alert('Erreur lors de la publication du formulaire.'); }
    });
  }

  trackByFn(index: number): number { return index; }
}