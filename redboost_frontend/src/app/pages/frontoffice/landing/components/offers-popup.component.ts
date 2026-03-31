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
      [style]="{ width: '45vw', minWidth: '320px' }" 
      [draggable]="false" 
      [resizable]="false"
      [dismissableMask]="true"
      styleClass="offers-dialog">
      
      <div class="p-6" *ngIf="loading">
        <div class="text-center py-10">
            <i class="pi pi-spin pi-spinner text-4xl text-primary" style="color: #ea5073"></i>
            <p class="mt-4 text-surface-500 font-medium tracking-wide">Chargement des offres en cours...</p>
        </div>
      </div>

      <div class="p-6" *ngIf="!loading && templates.length === 0">
        <div class="bg-white dark:bg-surface-800 p-10 text-center rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm">
            <i class="pi pi-inbox text-5xl text-surface-300 mb-5"></i>
            <h3 class="text-xl font-black text-[#0a4955] dark:text-surface-0 mb-3 tracking-tight">Aucun appel en cours</h3>
            <p class="text-surface-600 dark:text-surface-400 font-medium">Revenez plus tard pour découvrir nos prochains programmes d'accompagnement ou inscrivez-vous à notre newsletter.</p>
        </div>
      </div>

      <div class="flex flex-col gap-5 p-2 md:p-4" *ngIf="!loading && templates.length > 0">
        <div *ngFor="let tpl of templates" 
             class="offer-card relative bg-white dark:bg-surface-800 flex flex-col md:flex-row justify-between items-start md:items-center p-6 sm:p-8 border border-surface-200 dark:border-surface-700 rounded-2xl transition-all duration-300 cursor-pointer shadow-sm"
             [style.--hover-color]="tpl.profileType === 'coach' ? '#0a4955' : (tpl.profileType === 'spontanee' ? '#475569' : '#ea5073')"
             (click)="apply(tpl)">
            
            <div class="flex-1 mb-6 md:mb-0 relative z-10 w-full md:pr-8">
                <!-- Badges -->
                <div class="flex flex-wrap items-center gap-3 mb-4">
                    <span class="px-4 py-1.5 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-2" 
                          [ngStyle]="{
                              'background-color': tpl.profileType === 'coach' ? '#0a4955' : (tpl.profileType === 'spontanee' ? '#475569' : '#ea5073'),
                              'color': '#ffffff'
                          }">
                        <i class="pi text-sm" [ngClass]="tpl.profileType === 'coach' ? 'pi-user' : (tpl.profileType === 'spontanee' ? 'pi-send' : 'pi-briefcase')"></i>
                        {{ tpl.profileType === 'coach' ? 'Recherche Coach' : (tpl.profileType === 'spontanee' ? 'Candidature Spontanée' : 'Smart capital / Financement') }}
                    </span>
                    <span *ngIf="tpl.deadline" class="px-3 py-1.5 text-xs font-bold rounded-full border flex items-center gap-1.5 bg-surface-50 dark:bg-surface-800"
                          [ngClass]="isExpiringSoon(tpl.deadline) ? 'border-red-300 text-red-600' : 'border-surface-200 text-surface-600'">
                        <i class="pi pi-clock" [ngClass]="{'animate-pulse text-red-500': isExpiringSoon(tpl.deadline)}"></i>
                        <ng-container *ngIf="getRemainingDays(tpl.deadline) !== null">
                          {{ getRemainingDays(tpl.deadline) }} jour{{ getRemainingDays(tpl.deadline)! > 1 ? 's' : '' }} restant{{ getRemainingDays(tpl.deadline)! > 1 ? 's' : '' }}
                        </ng-container>
                    </span>
                </div>
                
                <!-- Texts -->
                <h3 class="text-2xl font-black mb-3 tracking-tight text-surface-900 dark:text-white transition-colors title-hover">
                    {{ tpl.title }}
                </h3>
                <p class="text-sm line-clamp-2 leading-relaxed font-medium text-surface-500 dark:text-surface-400">
                    {{ tpl.description }}
                </p>
                
                <!-- Program Tag -->
                <div *ngIf="tpl.program" class="mt-5 flex items-center gap-2 text-[11px] font-black px-3 py-1.5 rounded bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 uppercase tracking-widest inline-flex">
                   <i class="pi pi-box"></i> 
                   {{ tpl.program }}
                </div>
            </div>

            <!-- Action Button -->
            <div class="relative z-10 w-full md:w-auto flex justify-end">
               <button class="w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition-all duration-200 flex items-center justify-center gap-2 btn-apply"
                       [ngStyle]="{
                           'background-color': tpl.profileType === 'coach' ? '#0a4955' : (tpl.profileType === 'spontanee' ? '#475569' : '#ea5073')
                       }"
                       (click)="apply(tpl); $event.stopPropagation()">
                  Postuler 
                  <i class="pi pi-arrow-right icon-arrow transition-transform"></i>
               </button>
            </div>
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
        padding: 0.75rem 1.75rem;
        border-radius: 3rem;
        background: #ea5073;
        border: none;
        color: white;
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s;
        box-shadow: 0 8px 20px -4px rgba(234, 80, 115, 0.5);
    }
    
    .offers-fab:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 12px 25px -5px rgba(234, 80, 115, 0.6);
        background: #db1e37;
    }

    .pulse-animation {
        animation: pulse-ring 2.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes pulse-ring {
        0% { box-shadow: 0 0 0 0 rgba(234, 80, 115, 0.4); }
        70% { box-shadow: 0 0 0 15px rgba(234, 80, 115, 0); }
        100% { box-shadow: 0 0 0 0 rgba(234, 80, 115, 0); }
    }

    .badge-count {
        background: white;
        color: #0a4955;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 900;
        margin-left: 0.5rem;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    ::ng-deep .offers-dialog .p-dialog {
        border-radius: 1.5rem;
        overflow: hidden;
        border: none;
        box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.3);
    }
    ::ng-deep .offers-dialog .p-dialog-header {
        border-bottom: 1px solid var(--surface-200);
        padding: 1.75rem 2.5rem;
        background: #ffffff;
    }
    ::ng-deep .offers-dialog .p-dialog-title {
        font-weight: 900;
        font-size: 1.5rem;
        color: #0a4955;
        letter-spacing: -0.02em;
    }
    ::ng-deep .offers-dialog .p-dialog-header .p-dialog-header-icon {
        background: #f1f5f9;
        color: #64748b;
        border-radius: 50%;
        width: 2.5rem;
        height: 2.5rem;
        transition: all 0.2s;
    }
    ::ng-deep .offers-dialog .p-dialog-header .p-dialog-header-icon:hover {
        background: #e2e8f0;
        color: #0f172a;
    }
    ::ng-deep .offers-dialog .p-dialog-content {
        padding: 2rem 1.5rem;
        background-color: #f8fafc;
    }
    
    .offer-card {
        border-left: 5px solid transparent;
    }
    .offer-card:hover {
        border-color: var(--hover-color);
        box-shadow: 0 12px 30px -8px rgba(0,0,0,0.12);
        transform: translateY(-3px);
    }
    .offer-card:hover .title-hover {
        color: var(--hover-color);
    }
    .offer-card:hover .icon-arrow {
        transform: translateX(4px);
    }
    .btn-apply:hover {
        filter: brightness(0.9);
        box-shadow: 0 8px 15px -3px rgba(0,0,0,0.2);
    }

    .dark ::ng-deep .offers-dialog .p-dialog-header {
        background: #1e293b;
        border-bottom-color: #334155;
    }
    .dark ::ng-deep .offers-dialog .p-dialog-header .p-dialog-header-icon {
        background: #334155;
        color: #cbd5e1;
    }
    .dark ::ng-deep .offers-dialog .p-dialog-title {
        color: #f8fafc;
    }
    .dark ::ng-deep .offers-dialog .p-dialog-content {
        background-color: #0f172a;
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
        .offers-fab .pi { margin: 0; font-size: 1.25rem; }
        ::ng-deep .offers-dialog .p-dialog { border-radius: 1.5rem 1.5rem 0 0; margin-bottom: 0; align-self: flex-end; }
        ::ng-deep .offers-dialog .p-dialog-header { padding: 1.5rem; }
        ::ng-deep .offers-dialog .p-dialog-content { padding: 1.5rem 1rem; }
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
              const all = dtos.map(dto => FormTemplateService.toView(dto));
              const valid = all.filter(t => !t.deadline || !this.isExpired(t.deadline));
              
              this.templates = valid;
              this.loading = false;
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
      this.router.navigate(['/redstarter'], { queryParams: { templateId: template.id } });
  }

  /** Check if a deadline date string (YYYY-MM-DD) is in the past */
  isExpired(deadline: string): boolean {
      if (!deadline) return false;
      const deadlineDate = new Date(deadline + 'T23:59:59');
      return deadlineDate.getTime() < Date.now();
  }

  /** Get remaining days until deadline */
  getRemainingDays(deadline: string | undefined): number | null {
      if (!deadline) return null;
      const deadlineDate = new Date(deadline + 'T23:59:59');
      const diff = deadlineDate.getTime() - Date.now();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /** Returns true if less than 7 days remain */
  isExpiringSoon(deadline: string | undefined): boolean {
      const remaining = this.getRemainingDays(deadline);
      return remaining !== null && remaining <= 7;
  }
}
