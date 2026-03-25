import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { FormTemplate, FormQuestion } from '../../models/candidature.model';
import { FormTemplateService, FormTemplateDTO } from '../../services/form-template.service';

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
              <div class="fl-choice-icon" style="background: linear-gradient(135deg, #2563EB, #3B82F6);">
                <lucide-icon name="plus" [size]="24" class="text-white"></lucide-icon>
              </div>
              <h4>Créer un nouveau formulaire</h4>
              <p>Construisez un formulaire personnalisé de A à Z avec vos propres questions.</p>
            </button>
            <button (click)="handleChoiceSelect('existing')" class="fl-choice-card">
              <div class="fl-choice-icon" style="background: linear-gradient(135deg, #7B2D8B, #9F1D8F);">
                <lucide-icon name="file-text" [size]="24" class="text-white"></lucide-icon>
              </div>
              <h4>Utiliser un template existant</h4>
              <p>Réutilisez un ancien formulaire et modifiez les questions si besoin.</p>
            </button>
            <button (click)="handleChoiceSelect('spontaneous')" class="fl-choice-card">
              <div class="fl-choice-icon" style="background: linear-gradient(135deg, #059669, #10B981);">
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
                  [style.background]="template.profileType === 'coach' ? 'linear-gradient(135deg, #00d2ff, #3aafff)' : 'linear-gradient(135deg, #1E40AF, #3B82F6)'">
                  <lucide-icon name="file-text" [size]="20" class="text-white"></lucide-icon>
                </div>
                <div class="fl-template-info">
                  <h4>{{ template.title }}</h4>
                  <p>{{ template.description }}</p>
                </div>
              </div>
              <div class="fl-template-meta">
                <span class="fl-meta-label">Type:</span>
                <span class="fl-meta-badge" [style.background]="template.profileType === 'coach' ? '#DBEAFE' : '#E0E7FF'"
                  [style.color]="template.profileType === 'coach' ? '#1E40AF' : '#4338CA'">{{ template.profileType }}</span>
              </div>
              <div class="fl-template-meta">
                <span class="fl-meta-label">Questions:</span>
                <span class="fl-meta-count">{{ template.questions.length }}</span>
              </div>
              <div class="fl-template-actions">
                <button (click)="handleTemplateSelect(template)" class="fl-btn-primary">
                  <lucide-icon name="check" [size]="14"></lucide-icon> Utiliser ce template
                </button>
                <button (click)="handleTemplateDuplicate(template)" class="fl-btn-outline">
                  <lucide-icon name="copy" [size]="14"></lucide-icon> Dupliquer
                </button>
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
          <div class="fl-form-field">
            <label>Type de profil recherché *</label>
            <div class="fl-radio-group">
              <label><input type="radio" name="profileType" [value]="'coach'" [(ngModel)]="profileType"> Coach</label>
              <label><input type="radio" name="profileType" [value]="'entrepreneur'" [(ngModel)]="profileType"> Entrepreneur</label>
            </div>
          </div>
          <div class="fl-form-field">
            <label>Date limite de candidature</label>
            <input type="date" [(ngModel)]="deadline">
          </div>

          <div class="fl-form-field">
            <label>Questions personnalisées</label>
            <div class="fl-questions-list">
              <div *ngFor="let q of questions; let i = index" class="fl-question-item">
                <div class="fl-question-row">
                  <span class="fl-q-badge">Q{{ i + 1 }}</span>
                  <input [(ngModel)]="q.text" placeholder="Saisissez votre question...">
                  <button (click)="removeQuestion(q.id)" class="fl-q-delete">
                    <lucide-icon name="trash-2" [size]="14"></lucide-icon>
                  </button>
                </div>
                <div class="fl-type-row">
                  <label><input type="radio" [name]="'type-' + q.id" [value]="'text-court'" [(ngModel)]="q.type" (change)="onTypeChange(q)"> Texte court</label>
                  <label><input type="radio" [name]="'type-' + q.id" [value]="'text-long'" [(ngModel)]="q.type" (change)="onTypeChange(q)"> Texte long</label>
                  <label><input type="radio" [name]="'type-' + q.id" [value]="'qcm'" [(ngModel)]="q.type" (change)="onTypeChange(q)"> QCM</label>
                  <label><input type="radio" [name]="'type-' + q.id" [value]="'qcu'" [(ngModel)]="q.type" (change)="onTypeChange(q)"> QCU</label>
                  <label><input type="radio" [name]="'type-' + q.id" [value]="'upload'" [(ngModel)]="q.type" (change)="onTypeChange(q)"> Upload</label>
                  <label class="fl-required-check"><input type="checkbox" [(ngModel)]="q.required"> Obligatoire</label>
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
          <button (click)="handlePublish()" [disabled]="!formTitle || !formDescription || publishing" class="fl-btn-primary">
            <lucide-icon *ngIf="publishing" name="loader-2" [size]="16" class="animate-spin"></lucide-icon>
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
    :host { display: block; }
    .fl-overlay { position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(0,0,0,0.5); }
    .fl-box { background:#fff; width:100%; max-height:90vh; overflow-y:auto; border-radius:20px; box-shadow:0 20px 60px rgba(0,0,0,0.2); position:relative; }
    .fl-header { padding:16px 24px; border-bottom:1px solid #F3F4F6; position:sticky; top:0; background:#fff; z-index:10; display:flex; align-items:center; justify-content:space-between; }
    .fl-title { font-weight:800; font-size:18px; color:#1A1A2E; margin:0; }
    .fl-subtitle { font-size:12px; color:#9CA3AF; margin:4px 0 0; }
    .fl-close-btn { padding:8px; border-radius:12px; border:none; background:none; cursor:pointer; color:#9CA3AF; transition:all .2s; }
    .fl-close-btn:hover { background:#F3F4F6; color:#333; }
    .fl-body { padding:24px; }
    .fl-choice-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
    .fl-choice-card { padding:24px; border-radius:20px; border:2px solid #E5E7EB; background:#fff; cursor:pointer; transition:all .2s; text-align:center; }
    .fl-choice-card:hover { transform:scale(1.02); box-shadow:0 8px 24px rgba(0,0,0,0.1); }
    .fl-choice-card h4 { font-weight:700; color:#1A1A2E; margin:0 0 8px; font-size:14px; }
    .fl-choice-card p { font-size:12px; color:#6B7280; line-height:1.5; margin:0; }
    .fl-choice-icon { width:56px; height:56px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
    .fl-back-btn { display:flex; align-items:center; gap:8px; padding:8px 16px; border-radius:12px; border:none; background:none; cursor:pointer; color:#6B7280; font-size:14px; font-weight:500; transition:all .2s; margin-bottom:16px; }
    .fl-back-btn:hover { background:#F3F4F6; }
    .fl-templates-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; max-height:70vh; overflow-y:auto; }
    .fl-template-card { background:#fff; border:2px solid #E5E7EB; border-radius:20px; padding:20px; transition:all .2s; }
    .fl-template-card:hover { border-color:#3B82F6; box-shadow:0 8px 24px rgba(0,0,0,0.1); }
    .fl-template-header { display:flex; align-items:flex-start; gap:12px; margin-bottom:12px; }
    .fl-template-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .fl-template-info h4 { font-weight:700; font-size:14px; color:#1A1A2E; margin:0 0 4px; }
    .fl-template-info p { font-size:12px; color:#6B7280; margin:0; }
    .fl-template-meta { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .fl-meta-label { font-size:12px; color:#9CA3AF; }
    .fl-meta-badge { font-size:11px; font-weight:600; padding:2px 10px; border-radius:20px; text-transform:capitalize; }
    .fl-meta-count { font-size:12px; font-weight:700; color:#3B82F6; }
    .fl-template-actions { display:flex; flex-direction:column; gap:8px; margin-top:12px; }
    .fl-btn-primary { display:flex; align-items:center; justify-content:center; gap:6px; padding:10px 20px; border-radius:12px; font-size:13px; font-weight:700; color:#fff; border:none; cursor:pointer; transition:all .2s; background:linear-gradient(135deg, #1E40AF, #3B82F6); }
    .fl-btn-primary:hover { opacity:0.9; }
    .fl-btn-primary:disabled { opacity:0.4; cursor:not-allowed; }
    .fl-btn-outline { display:flex; align-items:center; justify-content:center; gap:6px; padding:10px 20px; border-radius:12px; font-size:13px; font-weight:700; color:#3B82F6; border:2px solid #3B82F6; background:none; cursor:pointer; transition:all .2s; }
    .fl-btn-outline:hover { background:#fff0f5; }
    .fl-btn-text { padding:8px 16px; border-radius:12px; border:none; background:none; cursor:pointer; font-size:14px; font-weight:500; color:#6B7280; transition:all .2s; }
    .fl-btn-text:hover { background:#F3F4F6; }
    .fl-form-body { display:flex; flex-direction:column; gap:20px; }
    .fl-form-field label { display:block; font-size:14px; font-weight:600; color:#333; margin-bottom:8px; }
    .fl-form-field input[type="text"], .fl-form-field input[type="date"], .fl-form-field textarea { width:100%; border:1px solid #E5E7EB; border-radius:12px; padding:10px 16px; font-size:13px; outline:none; color:#333; transition:border-color .2s; box-sizing:border-box; }
    .fl-form-field input:focus, .fl-form-field textarea:focus { border-color:#3B82F6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    .fl-form-field textarea { resize:none; }
    .fl-radio-group { display:flex; gap:16px; }
    .fl-radio-group label { display:flex; align-items:center; gap:6px; font-size:14px; color:#333; cursor:pointer; }
    .fl-questions-list { display:flex; flex-direction:column; gap:16px; }
    .fl-question-item { border:1px solid #E5E7EB; border-radius:16px; padding:20px; background:#fff; box-shadow:0 2px 4px rgba(0,0,0,0.02); transition:all .2s; }
    .fl-question-item:hover { border-color:#3B82F6; box-shadow:0 4px 12px rgba(59,130,246,0.05); }
    .fl-question-row { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
    .fl-question-row input { flex:1; background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:6px 12px; font-size:13px; outline:none; color:#333; }
    .fl-question-row input:focus { border-color:#3B82F6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    .fl-q-badge { font-size:11px; font-weight:700; color:#6B7280; background:#fff; padding:4px 8px; border-radius:8px; }
    .fl-q-delete, .fl-q-delete-sm { padding:6px; border-radius:8px; border:none; background:none; cursor:pointer; color:#9CA3AF; transition:all .2s; }
    .fl-q-delete:hover, .fl-q-delete-sm:hover { color:#EF4444; background:#FEF2F2; }
    .fl-type-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
    .fl-type-row label { display:flex; align-items:center; gap:6px; font-size:12px; color:#6B7280; cursor:pointer; font-weight:500; }
    .fl-type-row input[type="radio"], .fl-type-row input[type="checkbox"] { accent-color:#3B82F6; cursor:pointer; }
    .fl-required-check { margin-left:auto; border-left:1px solid #E5E7EB; padding-left:12px; }
    .fl-options { margin-left:24px; margin-top:12px; }
    .fl-options-label { font-size:12px; font-weight:600; color:#6B7280; margin-bottom:8px; }
    .fl-option-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
    .fl-option-row input { flex:1; background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:6px 12px; font-size:12px; outline:none; color:#333; }
    .fl-option-row input:focus { border-color:#3B82F6; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
    .fl-add-option { font-size:12px; color:#3B82F6; font-weight:600; background:none; border:none; cursor:pointer; display:flex; align-items:center; gap:6px; margin-top:8px; padding:4px 0; }
    .fl-add-option:hover { color:#a17dfd; }
    .fl-add-question { width:100%; padding:10px; border:2px dashed #D1D5DB; border-radius:12px; font-size:14px; font-weight:500; color:#6B7280; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all .2s; }
    .fl-add-question:hover { border-color:#3B82F6; color:#3B82F6; }
    .fl-footer { padding:16px 24px; border-top:1px solid #F3F4F6; display:flex; align-items:center; justify-content:space-between; position:sticky; bottom:0; background:#fff; }
    .fl-success-overlay { position:absolute; inset:0; z-index:20; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.9); border-radius:20px; }
    .fl-success-content { display:flex; flex-direction:column; align-items:center; gap:16px; }
    .fl-success-icon { width:64px; height:64px; border-radius:50%; background:#22C55E; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(34,197,94,0.3); }
    .fl-success-content p { font-size:18px; font-weight:700; color:#1A1A2E; margin:0; }
    .text-white { color:#fff; }
    @media(max-width:768px) { .fl-choice-grid { grid-template-columns:1fr; } .fl-templates-grid { grid-template-columns:1fr; } }
  `]
})
export class AdminFormLauncherComponent implements OnChanges {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  private formTemplateSvc = inject(FormTemplateService);

  step = signal<Step>('choice');
  templateMode: 'new' | 'existing' | 'spontaneous' | null = null;
  templates: FormTemplate[] = [];
  publishing = false;
  successMessage = '';
  formTitle = '';
  formDescription = '';
  profileType: 'coach' | 'entrepreneur' = 'coach';
  deadline = '';
  questions: FormQuestion[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.loadTemplates();
    }
  }

  private loadTemplates(): void {
    this.formTemplateSvc.getAll().subscribe({
      next: (dtos) => { this.templates = dtos.map(dto => FormTemplateService.toView(dto)); },
      error: () => { console.warn('Could not load form templates from API'); }
    });
  }

  getStepMaxWidth(): number {
    switch (this.step()) { case 'choice': return 900; case 'templates': return 1000; case 'form': return 800; default: return 800; }
  }

  onClose(): void { this.closed.emit(); this.reset(); }
  reset(): void { this.step.set('choice'); this.templateMode = null; this.formTitle = ''; this.formDescription = ''; this.profileType = 'coach'; this.deadline = ''; this.questions = []; }

  handleChoiceSelect(mode: 'new' | 'existing' | 'spontaneous'): void {
    this.templateMode = mode;
    if (mode === 'existing') { this.step.set('templates'); }
    else if (mode === 'spontaneous') {
      this.formTitle = 'Candidature Spontanée';
      this.formDescription = 'Utilisez ce formulaire pour postuler librement en dehors des appels spécifiques.';
      this.questions = [
        { id: 1, text: 'Pourquoi souhaitez-vous nous rejoindre ?', type: 'text-long', required: true },
        { id: 2, text: 'Curriculum Vitae', type: 'upload', required: true }
      ];
      this.step.set('form');
    } else { this.step.set('form'); }
  }

  handleTemplateSelect(template: FormTemplate): void {
    this.formTitle = template.title; this.formDescription = template.description; this.profileType = template.profileType;
    this.questions = template.questions.map(q => ({ ...q, id: Math.random() })); this.step.set('form');
  }

  handleTemplateDuplicate(template: FormTemplate): void {
    this.formTitle = `${template.title} (copie)`; this.formDescription = template.description; this.profileType = template.profileType;
    this.questions = template.questions.map(q => ({ ...q, id: Math.random() })); this.step.set('form');
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

  handlePublish(): void {
    if (this.publishing) return;
    this.publishing = true;
    const dto = FormTemplateService.toDTO({ title: this.formTitle, description: this.formDescription, profileType: this.profileType, questions: this.questions, deadline: this.deadline });
    this.formTemplateSvc.create(dto).subscribe({
      next: () => { this.publishing = false; this.successMessage = `Formulaire "${this.formTitle}" publié avec succès !`; setTimeout(() => { this.successMessage = ''; this.onClose(); }, 1800); },
      error: (err) => { this.publishing = false; console.error('Failed to publish form:', err); alert('Erreur lors de la publication du formulaire.'); }
    });
  }

  trackByFn(index: number): number { return index; }
}
