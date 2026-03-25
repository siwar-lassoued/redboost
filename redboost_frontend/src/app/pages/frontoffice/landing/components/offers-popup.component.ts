import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormTemplateService, FormTemplateView } from '../../../backoffice/candidature_redstarter/services/form-template.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-offers-popup',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  template: `
    <!-- Floating Action Button on Bottom Right -->
    <button 
      pButton 
      type="button" 
      class="p-button-rounded shadow-lg pulse-animation offers-fab"
      (click)="showDialog()"
      aria-label="Voir les appels à candidatures">
      <div class="flex items-center gap-2">
         <i class="pi pi-bell text-xl"></i>
         <span class="font-semibold hidden md:inline">Appels à candidatures</span>
         <span *ngIf="templates.length > 0" class="badge-count">{{ templates.length }}</span>
      </div>
    </button>

    <!-- Dialog / Modal -->
    <p-dialog 
      header="Appels à candidatures ouverts" 
      [(visible)]="display" 
      [modal]="true" 
      [breakpoints]="{ '960px': '75vw', '640px': '95vw' }" 
      [style]="{ width: '50vw' }" 
      [draggable]="false" 
      [resizable]="false"
      styleClass="offers-dialog">
      
      <div class="p-4" *ngIf="loading">
        <div class="text-center py-8">
            <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
            <p class="mt-4 text-surface-500">Chargement des offres...</p>
        </div>
      </div>

      <div class="p-2" *ngIf="!loading && templates.length === 0">
        <div class="bg-surface-50 dark:bg-surface-800 p-8 text-center rounded-xl border border-surface-200 dark:border-surface-700">
            <i class="pi pi-inbox text-5xl text-surface-400 mb-4"></i>
            <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-2">Aucun appel en cours</h3>
            <p class="text-surface-600 dark:text-surface-400">Revenez plus tard pour découvrir nos prochains programmes d'accompagnement.</p>
        </div>
      </div>

      <div class="flex flex-col gap-4 p-2" *ngIf="!loading && templates.length > 0">
        <div *ngFor="let tpl of templates" class="offer-card group flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl hover:border-primary transition-all hover:shadow-md">
            
            <div class="flex-1 mb-4 md:mb-0">
                <div class="flex items-center gap-2 mb-2">
                    <span class="px-3 py-1 text-xs font-semibold rounded-full" 
                          [ngClass]="tpl.profileType === 'coach' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'">
                        {{ tpl.profileType === 'coach' ? 'Recherche Coach' : 'Pour Startups / Projets' }}
                    </span>
                    <span *ngIf="tpl.deadline" class="text-xs text-surface-500 font-medium flex items-center gap-1">
                        <i class="pi pi-calendar"></i>
                        {{ tpl.deadline | date:'dd MMM yyyy' }}
                    </span>
                </div>
                
                <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0 mb-1 group-hover:text-primary transition-colors">{{ tpl.title }}</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 md:pr-6">{{ tpl.description }}</p>
                
                <div *ngIf="tpl.program" class="mt-3 text-xs text-surface-500 font-medium border-t border-surface-100 dark:border-surface-700 pt-3">
                   <strong>Programme :</strong> {{ tpl.program }}
                </div>
            </div>

            <button pButton label="Postuler" icon="pi pi-arrow-right" iconPos="right" 
                    class="p-button-outlined w-full md:w-auto p-button-sm md:ml-4 whitespace-nowrap"
                    (click)="apply(tpl)"></button>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    .offers-fab {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        z-index: 1000;
        padding: 0.75rem 1.5rem;
        border-radius: 2rem;
        background: var(--primary-color, #ea5073);
        border: none;
        color: white;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .offers-fab:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 10px 25px -5px rgba(234, 80, 115, 0.4);
        background: var(--primary-color, #ea5073);
        color: white;
    }

    .pulse-animation {
        animation: pulse-ring 2s infinite;
    }

    @keyframes pulse-ring {
        0% { box-shadow: 0 0 0 0 rgba(234, 80, 115, 0.4); }
        70% { box-shadow: 0 0 0 15px rgba(234, 80, 115, 0); }
        100% { box-shadow: 0 0 0 0 rgba(234, 80, 115, 0); }
    }

    .badge-count {
        background: white;
        color: var(--primary-color, #ea5073);
        border-radius: 50%;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: bold;
        margin-left: 0.25rem;
    }

    ::ng-deep .offers-dialog .p-dialog-header {
        border-bottom: 1px solid var(--surface-border);
        padding: 1.5rem;
    }
    ::ng-deep .offers-dialog .p-dialog-content {
        padding: 1rem 1.5rem 2rem 1.5rem;
        background-color: var(--surface-50);
    }
    .dark ::ng-deep .offers-dialog .p-dialog-content {
        background-color: var(--surface-900);
    }
    
    @media (max-width: 768px) {
        .offers-fab {
            bottom: 1.5rem;
            right: 1.5rem;
            padding: 0.75rem;
            width: 3.5rem;
            height: 3.5rem;
            display: flex;
            justify-content: center;
        }
        .offers-fab .pi { margin: 0; }
        ::ng-deep .offers-dialog .p-dialog { border-radius: 1.5rem 1.5rem 0 0; margin-bottom: 0; align-self: flex-end; }
    }
  `]
})
export class OffersPopupComponent implements OnInit {
  display: boolean = false;
  loading: boolean = false;
  templates: FormTemplateView[] = [];
  
  private formTemplateSvc = inject(FormTemplateService);
  private router = inject(Router);

  ngOnInit() {
      this.loadTemplates();
  }

  loadTemplates() {
      this.loading = true;
      this.formTemplateSvc.getAll().subscribe({
          next: (dtos) => {
              // Map DTO to View model
              this.templates = dtos.map(dto => FormTemplateService.toView(dto));
              this.loading = false;
              
              // Optionally pop it up automatically on load if there are templates
              // if(this.templates.length > 0) setTimeout(() => this.display = true, 5000);
          },
          error: (err: any) => {
              console.error('Failed to load form templates', err);
              this.loading = false;
          }
      });
  }

  showDialog() {
      this.display = true;
  }

  apply(template: FormTemplateView) {
      this.display = false;
      // Route to the existing submission form
      this.router.navigate(['/redstarter']);
  }
}
