import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntrepreneurService, ReclamationDTO, EntrepreneurCoachDTO } from '../services/entrepreneur.service';
import { AuthService } from '../../../frontoffice/service/auth.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../../environment';

@Component({
  selector: 'app-entrepre-reclamations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reclamations-page">
       <div class="max-w-5xl mx-auto p-4 md:p-8">
           <!-- Header -->
           <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
               <div>
                   <h1 class="text-3xl font-extrabold text-[#1A1A2E] tracking-tight">Réclamations Administratives</h1>
                   <p class="text-gray-500 mt-1 font-medium">Signalez un incident ou un comportement anormal concernant un coach.</p>
               </div>
               <div class="px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                   <div class="w-10 h-10 rounded-xl bg-[#F0F7FF] flex items-center justify-center text-[#3B82F6]">
                       <i class="pi pi-shield text-xl"></i>
                   </div>
                   <div>
                       <div class="text-[10px] uppercase tracking-wider font-bold text-gray-400">Total envoyés</div>
                       <div class="text-lg font-black text-[#1A1A2E]">{{ reclamations.length }}</div>
                   </div>
               </div>
           </div>
           
           <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <!-- Form Column -->
               <div class="lg:col-span-2">
                   <div class="premium-card p-6 md:p-8">
                       <h3 class="text-xl font-bold text-[#1A1A2E] mb-6 flex items-center gap-2">
                           <i class="pi pi-plus-circle text-[#3B82F6]"></i>
                           Nouvelle réclamation
                       </h3>
                       
                       <div class="space-y-6">
                           <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div class="form-group">
                                   <label class="form-label">Coach concerné *</label>
                                   <select [(ngModel)]="newReclamation.coachId" class="premium-input">
                                      <option [value]="0">Choisir un coach...</option>
                                      <option *ngFor="let c of coaches" [value]="c.id">{{c.firstName}} {{c.lastName}} ({{c.thematiqueName}})</option>
                                   </select>
                               </div>
                               <div class="form-group">
                                   <label class="form-label">Type de réclamation *</label>
                                   <select [(ngModel)]="newReclamation.typeReclamation" class="premium-input">
                                      <option value="COMPORTEMENT">Problème de comportement</option>
                                      <option value="RETARD">Absences / Retards répétés</option>
                                      <option value="AUTRE">Autre motif</option>
                                   </select>
                               </div>
                           </div>

                           <div class="form-group">
                               <label class="form-label">Sujet / Titre *</label>
                               <input type="text" [(ngModel)]="newReclamation.sujet" placeholder="Ex: Report incessant de session" class="premium-input">
                           </div>

                           <div class="form-group">
                               <label class="form-label">Description détaillée *</label>
                               <textarea [(ngModel)]="newReclamation.description" rows="5" class="premium-input" placeholder="Décrivez les faits de manière précise et objective..."></textarea>
                           </div>

                           <!-- File Upload Zone -->
                           <div class="form-group">
                               <label class="form-label">Pièce jointe (Optionnel)</label>
                               <div class="upload-zone" [class.has-file]="selectedFile" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
                                   <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)" accept=".pdf,.png,.jpg,.jpeg,.docx">
                                   
                                   <div *ngIf="!selectedFile" class="flex flex-col items-center py-4">
                                       <div class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                           <i class="pi pi-cloud-upload text-gray-400 text-xl"></i>
                                       </div>
                                       <p class="text-sm font-semibold text-gray-600">Cliquez pour ajouter un fichier justificatif</p>
                                       <p class="text-xs text-gray-400 mt-1">PDF, Images ou Word (Max 5MB)</p>
                                   </div>

                                   <div *ngIf="selectedFile" class="flex items-center justify-between w-full bg-white p-3 rounded-xl border border-[#3B82F6]/20">
                                       <div class="flex items-center gap-3">
                                           <div class="w-10 h-10 rounded-lg bg-[#F0F7FF] flex items-center justify-center text-[#3B82F6]">
                                               <i class="pi pi-file text-lg"></i>
                                           </div>
                                           <div class="text-left">
                                               <div class="text-sm font-bold text-[#1A1A2E] truncate max-w-[200px]">{{ selectedFile.name }}</div>
                                               <div class="text-[10px] text-gray-400">{{ formatFileSize(selectedFile.size) }}</div>
                                           </div>
                                       </div>
                                       <button (click)="$event.stopPropagation(); selectedFile = null" class="text-gray-400 hover:text-red-500 transition">
                                           <i class="pi pi-times"></i>
                                       </button>
                                   </div>
                               </div>
                           </div>
                           
                           <div class="pt-4">
                               <button (click)="submit()" [disabled]="loading" class="w-full bg-[#1A1A2E] hover:bg-[#0f0f1c] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#1A1A2E]/10 transition-all flex items-center justify-center gap-3 group">
                                   <i class="pi" [class.pi-send]="!loading" [class.pi-spin]="loading" [class.pi-spinner]="loading"></i>
                                   {{ loading ? 'Envoi en cours...' : 'Envoyer à l\\'administration' }}
                               </button>
                           </div>
                       </div>
                   </div>
               </div>

               <!-- History Column -->
               <div class="lg:col-span-1">
                   <h3 class="text-lg font-bold text-[#1A1A2E] mb-6 flex items-center gap-2">
                       <i class="pi pi-history text-gray-400"></i>
                       Derniers envois
                   </h3>
                   
                   <div class="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                       <div *ngFor="let r of reclamations" class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-[#3B82F6]/30 transition-all">
                           <div class="flex justify-between items-start mb-3">
                               <span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider" 
                                     [ngClass]="{
                                       'bg-amber-50 text-amber-600': r.statut==='EN_ATTENTE', 
                                       'bg-emerald-50 text-emerald-600': r.statut==='TRAITEE', 
                                       'bg-rose-50 text-rose-600': r.statut==='REJETEE',
                                       'bg-gray-50 text-gray-600': r.statut==='ANNULEE'
                                     }">
                                   {{ r.statut?.replace('_', ' ') }}
                               </span>
                               <span class="text-[10px] font-bold text-gray-400">{{ r.dateReclamation | date:'dd MMM yyyy' }}</span>
                           </div>
                           
                           <h4 class="font-bold text-[#1A1A2E] mb-1">{{ r.sujet }}</h4>
                           <div class="text-xs font-semibold text-[#3B82F6] mb-3 flex items-center gap-1">
                               <i class="pi pi-user text-[10px]"></i> Coach concerné
                           </div>
                           
                           <p class="text-xs text-gray-500 line-clamp-3 mb-4 leading-relaxed italic border-l-2 border-gray-100 pl-3">
                               "{{ r.description }}"
                           </p>
                           
                           <div class="flex items-center justify-between mt-2 pt-3 border-t border-gray-50">
                               <div class="flex gap-2">
                                   <div class="w-6 h-6 rounded bg-gray-50 flex items-center justify-center text-gray-400" title="Type: {{r.typeReclamation}}">
                                       <i class="pi pi-tag text-[10px]"></i>
                                   </div>
                                   <div *ngIf="r.pieceJointeUrl" (click)="downloadAttachment(r.pieceJointeUrl)" class="w-6 h-6 rounded bg-[#F0F7FF] flex items-center justify-center text-[#3B82F6] cursor-pointer hover:bg-[#3B82F6] hover:text-white transition-all" title="Télécharger la pièce jointe">
                                       <i class="pi pi-paperclip text-[10px]"></i>
                                   </div>
                               </div>
                               <button class="text-[10px] font-bold text-gray-400 hover:text-[#1A1A2E] transition">Voir détails</button>
                           </div>
                       </div>

                       <div *ngIf="reclamations.length === 0" class="bg-white rounded-2xl p-10 border-2 border-dashed border-gray-100 flex flex-col items-center text-center">
                           <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                               <i class="pi pi-inbox text-2xl text-gray-200"></i>
                           </div>
                           <p class="text-sm font-bold text-gray-400">Aucune réclamation</p>
                       </div>
                   </div>
               </div>
           </div>
       </div>
    </div>
  `,
  styles: [`
    .reclamations-page { background: #F8FAFC; min-h-screen; font-family: 'Inter', sans-serif; }
    .premium-card { background: white; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.02); }
    .form-label { display: block; font-size: 13px; font-weight: 700; color: #64748B; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .premium-input { width: 100%; background: #F9FAFB; border: 2px solid #F1F5F9; border-radius: 16px; padding: 12px 16px; font-size: 14px; color: #1A1A2E; font-weight: 500; transition: all 0.2s; outline: none; }
    .premium-input:focus { border-color: #3B82F6; background: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05); }
    .upload-zone { border: 2px dashed #F1F5F9; border-radius: 16px; background: #F9FAFB; transition: all 0.2s; cursor: pointer; padding: 12px; }
    .upload-zone:hover { border-color: #3B82F6; background: #F0F7FF; }
    .upload-zone.has-file { border-style: solid; border-color: #3B82F6; background: white; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
    .hidden { display: none; }
  `]
})
export class EntrepreneurReclamationsComponent implements OnInit {
  entrepreneurId!: number;
  coaches: EntrepreneurCoachDTO[] = [];
  reclamations: ReclamationDTO[] = [];
  loading = false;
  selectedFile: File | null = null;
  
  newReclamation: ReclamationDTO = {
    coachId: 0,
    entrepreneurId: 0,
    sujet: '',
    typeReclamation: 'COMPORTEMENT',
    description: ''
  };

  constructor(
      private entrepreneurService: EntrepreneurService, 
      private authService: AuthService, 
      private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const rawId = this.authService.getUserId();
    this.entrepreneurId = typeof rawId === 'string' ? parseInt(rawId, 10) : (rawId ?? 0);
    if (this.entrepreneurId) {
      this.newReclamation.entrepreneurId = this.entrepreneurId;
      this.loadCoaches();
      this.loadReclamations();
    }
  }

  loadCoaches() {
      this.entrepreneurService.getCoaches(this.entrepreneurId).subscribe({
          next: (data) => this.coaches = data
      });
  }

  loadReclamations() {
      this.entrepreneurService.getReclamations(this.entrepreneurId).subscribe({
          next: (data) => this.reclamations = data.sort((a,b) => 
            new Date(b.dateReclamation!).getTime() - new Date(a.dateReclamation!).getTime())
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('Fichier trop volumineux (Max 5MB)');
        return;
      }
      this.selectedFile = file;
    }
  }

  onDragOver(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: any) {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  downloadAttachment(url: string) {
    const fullUrl = url.startsWith('http') ? url : environment.apiUrl.replace('/api', '') + url;
    window.open(fullUrl, '_blank');
  }

  submit() {
      if (this.newReclamation.coachId === 0 || !this.newReclamation.sujet || !this.newReclamation.description) {
          this.toastr.warning('Veuillez remplir tous les champs obligatoires');
          return;
      }
      
      this.loading = true;
      this.entrepreneurService.addReclamation(this.entrepreneurId, this.newReclamation.coachId, this.newReclamation, this.selectedFile || undefined).subscribe({
          next: (data) => {
              this.toastr.success('Réclamation envoyée à l\'administration.');
              this.reclamations.unshift(data);
              this.resetForm();
              this.loading = false;
          },
          error: () => {
            this.toastr.error('Erreur lors de l\'envoi');
            this.loading = false;
          }
      });
  }

  resetForm() {
    this.newReclamation = {
      entrepreneurId: this.entrepreneurId,
      coachId: 0,
      sujet: '',
      typeReclamation: 'COMPORTEMENT',
      description: ''
    };
    this.selectedFile = null;
  }
}
