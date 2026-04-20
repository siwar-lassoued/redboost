import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachService, ReclamationDTO, UserDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-coach-reclamations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-[#f0f4ff] min-h-full">
       <div class="max-w-4xl mx-auto">
           <h2 class="text-3xl font-bold text-[#0A4955] mb-6">Réclamations</h2>
           <p class="text-gray-600 mb-8">Soumettez une réclamation concernant un entrepreneur (ex: absences répétées, comportement).</p>
           
           <div class="bg-white rounded-xl shadow-md p-6 border-t-4 border-[#0A4955] mb-8">
               <h3 class="text-xl font-semibold mb-6">Envoyer une réclamation</h3>
               
               <div class="space-y-4">
                  <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Entrepreneur concerné</label>
                      <select [(ngModel)]="newReclamation.entrepreneurId" class="w-full border rounded p-2 focus:ring-[#245C67] focus:border-[#245C67]">
                         <option [value]="0">Sélectionnez un entrepreneur</option>
                         <option *ngFor="let e of entrepreneurs" [value]="e.id">{{e.firstName}} {{e.lastName}}</option>
                      </select>
                  </div>
                  <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                      <input type="text" [(ngModel)]="newReclamation.sujet" class="w-full border rounded p-2 focus:ring-[#245C67]">
                  </div>
                  <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea [(ngModel)]="newReclamation.description" rows="4" class="w-full border rounded p-2 focus:ring-[#245C67] placeholder-gray-400" placeholder="Décrivez le problème rencontré..."></textarea>
                  </div>
                  
                  <button (click)="submit()" class="bg-[#E44D62] hover:bg-[#c73b4e] text-white py-2 px-6 rounded-lg font-medium shadow transition">
                      Envoyer la réclamation
                  </button>
               </div>
           </div>
           
           <div>
               <h3 class="text-lg font-bold text-[#245C67] mb-4">Mes Réclamations</h3>
               <div class="space-y-4">
                  <div *ngFor="let r of reclamations" class="bg-white p-5 rounded-lg border-l-4 border-l-[#E44D62] shadow-sm">
                      <div class="flex justify-between items-start mb-2">
                         <h4 class="font-bold text-gray-800">{{r.sujet}}</h4>
                         <span class="px-3 py-1 text-xs rounded-full font-bold" 
                              [ngClass]="{'bg-yellow-100 text-yellow-800': r.statut==='EN_ATTENTE', 'bg-green-100 text-green-800': r.statut==='TRAITEE', 'bg-red-100 text-red-800': r.statut==='REJETEE'}">
                             {{r.statut}}
                         </span>
                      </div>
                      <p class="text-sm text-[#0A4955] font-semibold mb-1">Entrepreneur concerné : {{r.entrepreneurName}}</p>
                      <p class="text-gray-600 text-sm whitespace-pre-wrap">{{r.description}}</p>
                      <p class="text-xs text-gray-400 text-right mt-3">{{r.dateReclamation | date:'dd/MM/yyyy HH:mm'}}</p>
                  </div>
                  <div *ngIf="reclamations.length === 0" class="text-center py-6 bg-white rounded-lg border border-dashed border-gray-300">
                      <p class="text-gray-500">Vous n'avez soumis aucune réclamation.</p>
                  </div>
               </div>
           </div>
       </div>
    </div>
  `
})
export class ReclamationsComponent implements OnInit {
  coachId!: number;
  entrepreneurs: UserDTO[] = [];
  reclamations: ReclamationDTO[] = [];
  
  newReclamation: ReclamationDTO = {
    coachId: 0,
    entrepreneurId: 0,
    sujet: '',
    description: ''
  };

  constructor(
      private coachService: CoachService, 
      private authService: AuthService, 
      private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const rawCoachId = this.authService.getUserId();
    if (rawCoachId) {
      this.coachId = typeof rawCoachId === 'string' ? parseInt(rawCoachId, 10) : rawCoachId;
      this.newReclamation.coachId = this.coachId;
      
      this.loadEntrepreneurs();
      this.loadReclamations();
    }
  }

  loadEntrepreneurs() {
      this.coachService.getCoachEntrepreneurs(this.coachId).subscribe({
          next: (data) => this.entrepreneurs = data as any[]
      });
  }

  loadReclamations() {
      this.coachService.getReclamations(this.coachId).subscribe({
          next: (data) => this.reclamations = data
      });
  }

  submit() {
      if (!this.newReclamation.entrepreneurId || !this.newReclamation.sujet || !this.newReclamation.description) {
          this.toastr.warning('Veuillez remplir tous les champs');
          return;
      }
      this.coachService.addReclamation(this.coachId, this.newReclamation.entrepreneurId, this.newReclamation).subscribe({
          next: (data) => {
              this.toastr.success('Réclamation envoyée à l\'administration.');
              this.reclamations.unshift(data);
              this.newReclamation = { coachId: this.coachId, entrepreneurId: 0, sujet: '', description: '' };
          },
          error: () => this.toastr.error('Erreur lors de l\'envoi')
      });
  }
}
