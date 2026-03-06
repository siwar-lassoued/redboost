// components/entrepreneur-header/entrepreneur-header.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-entrepreneur-header',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="mb-10">
            <div class="flex items-center gap-4 mb-2">
                <div class="w-12 h-12 bg-[#DB1E37] rounded-lg flex items-center justify-center text-white text-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-8 0h2m-2 0h-2" />
                    </svg>
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-[#0A4955]">Gestion des Entrepreneurs</h1>
                    <p class="text-[#568086]">Intégrer, associer et suivre les entrepreneurs participants aux programmes</p>
                </div>
            </div>
        </div>
    `
})
export class EntrepreneurHeaderComponent {}