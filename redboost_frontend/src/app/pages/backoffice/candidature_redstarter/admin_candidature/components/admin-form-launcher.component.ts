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
    :host { display: block; font-family: 'Poppins', sans-serif; }
    .fl-overlay { position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(0,0,0,0.5); }
    .fl-box { background:#fff; width:100%; max-height:90vh; overflow-y:auto; border-radius:20px; box-shadow:0 20px 60px rgba(0,0,0,0.2); position:relative; }
    .fl-header { padding:24px; border-bottom:1px solid #F3F4F6; position:sticky; top:0; background:#fff; z-index:10; display:flex; align-items:center; justify-content:space-between; }
    .fl-title { @apply text-2xl font-bold text-slate-900 mb-2; margin:0; }
    .fl-subtitle { @apply text-sm text-gray-500; margin:0; }
    .fl-close-btn { padding:8px; border-radius:12px; border:none; background:none; cursor:pointer; color:#9CA3AF; transition:all .2s; }
    .fl-close-btn:hover { background:#F3F4F6; color:#333; }
    .fl-body { padding:24px; }
    .fl-choice-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
    .fl-choice-card { padding:24px; border-radius:20px; border:2px solid #E5E7EB; background:#fff; cursor:pointer; transition:all .2s; text-align:center; }
    .fl-choice-card:hover { transform:scale(1.02); box-shadow:0 8px 24px rgba(0,0,0,0.1); border-color:#ea5073; }
    .fl-choice-card h4 { @apply font-bold text-slate-900 mb-2 text-sm; }
    .fl-choice-card p { @apply text-xs text-gray-500; margin:0;}
    .fl-choice-icon { width:56px; height:56px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
    .fl-back-btn { @apply flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-slate-300 font-medium hover:bg-slate-50 transition text-sm cursor-pointer mb-4; background:none; }
    .fl-templates-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; max-height:70vh; overflow-y:auto; }
    .fl-template-card { background:#fff; border:2px solid #E5E7EB; border-radius:20px; padding:20px; transition:all .2s; }
    .fl-template-card:hover { border-color:#ea5073; box-shadow:0 8px 24px rgba(0,0,0,0.1); }
    .fl-template-header { display:flex; align-items:flex-start; gap:12px; margin-bottom:12px; }
    .fl-template-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .fl-template-info h4 { @apply font-bold text-slate-900 mb-1 text-sm; margin:0; }
    .fl-template-info p { @apply text-xs text-gray-500; margin:0; }
    .fl-template-meta { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .fl-meta-label { @apply text-xs text-gray-500; }
    .fl-meta-badge { @apply text-xs font-semibold px-3 py-1 rounded-full capitalize; }
    .fl-meta-count { @apply text-xs font-bold text-rose-600; }
    .fl-template-actions { display:flex; flex-direction:column; gap:8px; margin-top:12px; }
    .fl-btn-primary { @apply px-8 py-3 bg-[#ea5073] hover:bg-[#d4476a] text-white rounded-lg font-bold shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2; border:none; cursor:pointer; }
    .fl-btn-outline { @apply px-6 py-2.5 rounded-lg border-2 border-rose-500 text-rose-500 font-medium hover:bg-rose-50 transition flex items-center justify-center gap-2; background:none; cursor:pointer; }
    .fl-btn-text { @apply px-6 py-3 rounded-lg border-2 border-slate-300 font-medium hover:bg-slate-50 transition; background:none; cursor:pointer; }
    .fl-form-body { display:flex; flex-direction:column; gap:24px; padding-right:12px; }
    .fl-form-field label { @apply block text-sm font-semibold text-slate-700 mb-2; margin-bottom:8px; }
    .fl-form-field input[type="text"], .fl-form-field input[type="date"], .fl-form-field textarea { @apply w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none transition-all text-sm; box-sizing:border-box; }
    .fl-form-field textarea { resize:none; }
    .fl-radio-group { display:flex; gap:16px; }
    .fl-radio-group label { @apply flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer; }
    .fl-radio-group input[type="radio"] { accent-color:#ea5073; cursor:pointer; transform:scale(1.1); margin:0; }
    .fl-questions-list { display:flex; flex-direction:column; gap:16px; }
    .fl-question-item { border:2px solid #E5E7EB; border-radius:16px; padding:20px; background:#fff; transition:all .2s; }
    .fl-question-item:hover { border-color:#ea5073; box-shadow:0 4px 12px rgba(234, 80, 115, 0.05); }
    .fl-question-row { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
    .fl-question-row input { @apply flex-1 px-4 py-2.5 rounded-lg border-2 border-slate-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none transition-all text-sm; }
    .fl-q-badge { @apply bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold leading-none; }
    .fl-q-delete, .fl-q-delete-sm { padding:8px; border-radius:8px; border:none; background:none; cursor:pointer; color:#9CA3AF; transition:all .2s; }
    .fl-q-delete:hover, .fl-q-delete-sm:hover { color:#ea5073; background:#FEF2F2; }
    .fl-type-row { display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-bottom: 8px; }
    .fl-type-row label { @apply flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer; }
    .fl-type-row input[type="radio"], .fl-type-row input[type="checkbox"] { accent-color:#ea5073; cursor:pointer; margin:0;}
    .fl-required-check { margin-left:auto; border-left:1px solid #E5E7EB; padding-left:12px; }
    .fl-options { margin-left:48px; margin-top:12px; }
    .fl-options-label { @apply text-xs font-semibold text-slate-500 mb-2 block; }
    .fl-option-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .fl-option-row input { @apply flex-1 px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-rose-500 outline-none transition-all text-sm; }
    .fl-add-option { @apply flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 mt-2 cursor-pointer bg-transparent border-none p-0; }
    .fl-add-question { @apply w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-500 hover:border-rose-500 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 cursor-pointer bg-transparent; }
    .fl-footer { padding:24px; border-top:1px solid #F3F4F6; display:flex; align-items:center; justify-content:flex-end; gap:16px; position:sticky; bottom:0; background:#fff; }
    .fl-success-overlay { position:absolute; inset:0; z-index:20; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.9); border-radius:20px; }
    .fl-success-content { display:flex; flex-direction:column; align-items:center; gap:16px; }
    .fl-success-icon { width:64px; height:64px; border-radius:50%; background:#22C55E; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(34,197,94,0.3); }
    .fl-success-content p { @apply text-xl font-bold text-slate-900; margin:0; }
    .text-white { color:#fff; }
    @media(max-width:768px) { .fl-choice-grid { grid-template-columns:1fr; } .fl-templates-grid { grid-template-columns:1fr; } .fl-footer { justify-content:space-between; } }
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
