// @ts-nocheck
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachService, SeanceExceptionnelleDTO, UserDTO } from '../services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-coach-seance-exceptionnelle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-[#f0f4ff] min-h-full">
       <h2 class="text-3xl font-bold text-[#0A4955] mb-6">Séances Exceptionnelles</h2>
       
       <div class="bg-white rounded-xl shadow-md p-6 mb-8 max-w-2xl">
          <h3 class="text-xl font-semibold mb-6 text-[#E44D62]">Planifier une séance hors-disponibilités</h3>
          
          <div class="space-y-4">
             <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Entrepreneur</label>
                <select [(ngModel)]="newSeance.entrepreneurId" class="w-full border rounded p-2 focus:ring-[#245C67] focus:border-[#245C67]">
                   <option [value]="0">Sélectionnez un entrepreneur</option>
                   <option *ngFor="let e of entrepreneurs" [value]="e.id">{{e.firstName}} {{e.lastName}}</option>
                </select>
             </div>
             
             <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Titre de la séance</label>
                <input type="text" [(ngModel)]="newSeance.titre" class="w-full border rounded p-2 focus:ring-[#245C67] focus:border-[#245C67]">
             </div>
             
             <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" [(ngModel)]="newSeance.dateSeance" class="w-full border rounded p-2 focus:ring-[#245C67] focus:border-[#245C67]">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">De</label>
                    <input type="time" [(ngModel)]="newSeance.heureDebut" class="w-full border rounded p-2 focus:ring-[#245C67] focus:border-[#245C67]">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">À</label>
                    <input type="time" [(ngModel)]="newSeance.heureFin" class="w-full border rounded p-2 focus:ring-[#245C67] focus:border-[#245C67]">
                </div>
             </div>
             
             <button (click)="submit()" class="w-full bg-[#0A4955] hover:bg-[#245C67] text-white py-2.5 rounded-lg font-medium transition mt-4">
                Planifier
             </button>
          </div>
       </div>
       
       <div class="mt-8">
           <h3 class="text-lg font-bold text-[#0A4955] mb-4">Historique des séances exceptionnelles</h3>
           <div class="bg-white rounded-lg shadow overflow-hidden">
               <table class="min-w-full divide-y divide-gray-200">
                   <thead class="bg-[#245C67] text-white">
                       <tr>
                           <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Entrepreneur</th>
                           <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Titre</th>
                           <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date & Heure</th>
                       </tr>
                   </thead>
                   <tbody class="bg-white divide-y divide-gray-200">
                       <tr *ngFor="let s of seances" class="hover:bg-gray-50">
                           <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#E44D62]">{{s.entrepreneurName}}</td>
                           <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{s.titre}}</td>
                           <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{s.dateSeance}} ({{s.heureDebut}} - {{s.heureFin}})</td>
                       </tr>
                       <tr *ngIf="seances.length === 0">
                           <td colspan="3" class="px-6 py-4 text-center text-sm text-gray-500 italic">Aucune séance exceptionnelle programmée.</td>
                       </tr>
                   </tbody>
               </table>
           </div>
       </div>
    </div>
  `
})
export class SeanceExceptionnelleComponent implements OnInit {
  coachId!: number;
  entrepreneurs: UserDTO[] = [];
  seances: SeanceExceptionnelleDTO[] = [];
  
  newSeance: SeanceExceptionnelleDTO = {
    coachId: 0,
    entrepreneurId: 0,
    titre: '',
    dateSeance: '',
    heureDebut: '',
    heureFin: ''
  };

  constructor(
      private coachService: CoachService, 
      private authService: AuthService, 
      private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const rawCoachId = this.authService.getUserId();
    this.coachId = typeof rawCoachId === 'string' ? parseInt(rawCoachId, 10) : rawCoachId;
    this.newSeance.coachId = this.coachId;
    
    this.loadEntrepreneurs();
    this.loadSeances();
  }

  loadEntrepreneurs() {
      this.coachService.getEntrepreneurs().subscribe({
          next: (data) => this.entrepreneurs = data,
          error: () => console.error('Erreur chargement entrepreneurs')
      });
  }

  loadSeances() {
      this.coachService.getSeancesExceptionnelles(this.coachId).subscribe({
          next: (data) => this.seances = data,
          error: () => this.toastr.error('Erreur chargement')
      });
  }

  submit() {
      if (!this.newSeance.entrepreneurId || !this.newSeance.titre || !this.newSeance.dateSeance || !this.newSeance.heureDebut || !this.newSeance.heureFin) {
          this.toastr.warning('Tous les champs sont requis');
          return;
      }
      if (this.newSeance.heureDebut >= this.newSeance.heureFin) {
          this.toastr.error('L\'heure de début doit être avant l\'heure de fin');
          return;
      }

      this.coachService.addSeanceExceptionnelle(this.coachId, this.newSeance.entrepreneurId, this.newSeance).subscribe({
          next: (data) => {
              this.toastr.success('Séance exceptionnelle planifiée');
              this.seances.push(data);
              this.newSeance = { coachId: this.coachId, entrepreneurId: 0, titre: '', dateSeance: '', heureDebut: '', heureFin: '' };
          },
          error: () => this.toastr.error('Erreur de planification')
      });
  }
}
