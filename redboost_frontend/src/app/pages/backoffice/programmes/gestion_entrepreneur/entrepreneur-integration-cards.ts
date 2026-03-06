import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-entrepreneur-integration-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-12">
      <h2 class="text-xl font-semibold text-[#DB1E37] mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Intégration des Entrepreneurs
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Card 1: Import Excel -->
        <div class="bg-white rounded-2xl border border-[#568086]/30 p-8 text-center shadow-sm hover:shadow-md transition-shadow">
          <div class="w-16 h-16 bg-[#245C67]/10 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-[#245C67]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium mb-2 text-[#0A4955]">Import via Excel</h3>
          <p class="text-[#568086] text-sm mb-6">Importer plusieurs entrepreneurs en masse</p>
          <button 
            (click)="triggerExcelImport()"
            class="bg-[#245C67] hover:bg-[#0A4955] text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors shadow-sm hover:shadow">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Importer Excel
          </button>
        </div>

        <!-- Card 2: Saisie manuelle -->
        <div class="bg-white rounded-2xl border border-[#568086]/30 p-8 text-center shadow-sm hover:shadow-md transition-shadow">
          <div class="w-16 h-16 bg-[#E44D62]/10 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-[#E44D62]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 class="text-lg font-medium mb-2 text-[#0A4955]">Saisie manuelle unitaire</h3>
          <p class="text-[#568086] text-sm mb-6">Ajouter un entrepreneur individuellement</p>
          <button 
            (click)="onAddClick.emit()"
            class="bg-[#DB1E37] hover:bg-[#E44D62] text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors shadow-sm hover:shadow">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Ajouter
          </button>
        </div>

        <!-- Card 3: Sélection depuis base -->
        <div class="bg-white rounded-2xl border border-[#568086]/30 p-8 text-center shadow-sm hover:shadow-md transition-shadow">
          <div class="w-16 h-16 bg-[#EA7988]/10 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-[#EA7988]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 2 4 6 4h8c4 0 6-2 6-4V7M4 7c0-2 2-4 6-4h8c4 0 6 2 6 4M4 7c0 2 2 4 6 4h8c4 0 6-2 6-4" />
            </svg>
          </div>
          <h3 class="text-lg font-medium mb-2 text-[#0A4955]">Sélection depuis base</h3>
          <p class="text-[#568086] text-sm mb-6">Choisir depuis la liste existante</p>
          <button 
            (click)="onAssignClick.emit()"
            class="bg-[#7d3659] hover:bg-[#6b2e4b] text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors shadow-sm hover:shadow">
            Sélectionner
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    button {
      transition: all 0.2s ease;
    }
  `]
})
export class EntrepreneurIntegrationCardsComponent {
  @Output() onAddClick = new EventEmitter<void>();
  @Output() onAssignClick = new EventEmitter<void>();
  @Output() onImportExcelClick = new EventEmitter<void>();  // ← This is what the parent listens to

  triggerExcelImport() {
    this.onImportExcelClick.emit();   // Emit event → parent will show the modal
  }
}