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

      <div class="flex flex-col gap-6 p-2" *ngIf="!loading && templates.length > 0">
        <div *ngFor="let tpl of templates" 
             class="offer-card group relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-2 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
             [ngClass]="tpl.profileType === 'coach' ? 'bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:border-blue-400' : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200 hover:border-emerald-400'"
             (click)="apply(tpl)">
            
            <!-- Hover overlay -->
            <div class="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none"
                 [ngClass]="tpl.profileType === 'coach' ? 'bg-blue-500' : 'bg-emerald-500'"></div>

            <div class="flex-1 mb-6 md:mb-0 relative z-10 w-full md:pr-8">
                <!-- Badges -->
                <div class="flex flex-wrap items-center gap-3 mb-4">
                    <span class="px-4 py-1.5 text-xs font-black rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5" 
                          [ngClass]="tpl.profileType === 'coach' ? 'bg-blue-600 text-white border border-blue-700' : 'bg-emerald-600 text-white border border-emerald-700'">
                        <i class="pi text-sm" [ngClass]="tpl.profileType === 'coach' ? 'pi-user' : 'pi-briefcase'"></i>
                        {{ tpl.profileType === 'coach' ? 'Recherche Coach' : 'Smart capital / Financement' }}
                    </span>
                    <span *ngIf="tpl.deadline" class="px-3 py-1.5 text-xs font-bold rounded-full border flex items-center gap-1.5 shadow-sm bg-white"
                          [ngClass]="isExpiringSoon(tpl.deadline) ? 'border-red-300 text-red-700' : 'border-surface-200 text-surface-700'">
                        <i class="pi pi-clock" [ngClass]="{'animate-pulse text-red-500': isExpiringSoon(tpl.deadline)}"></i>
                        <ng-container *ngIf="getRemainingDays(tpl.deadline) !== null">
                          {{ getRemainingDays(tpl.deadline) }} jour{{ getRemainingDays(tpl.deadline)! > 1 ? 's' : '' }} restant{{ getRemainingDays(tpl.deadline)! > 1 ? 's' : '' }}
                        </ng-container>
                    </span>
                </div>
                
                <!-- Texts -->
                <h3 class="text-2xl md:text-3xl font-black mb-3 tracking-tight transition-colors duration-300"
                    [ngClass]="tpl.profileType === 'coach' ? 'text-blue-950 group-hover:text-blue-700' : 'text-emerald-950 group-hover:text-emerald-700'">
                    {{ tpl.title }}
                </h3>
                <p class="text-sm md:text-base line-clamp-2 leading-relaxed font-medium"
                   [ngClass]="tpl.profileType === 'coach' ? 'text-blue-800/80' : 'text-emerald-800/80'">
                    {{ tpl.description }}
                </p>
                
                <!-- Program Tag -->
                <div *ngIf="tpl.program" class="mt-5 flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg inline-flex bg-white/60 backdrop-blur-sm border shadow-sm"
                     [ngClass]="tpl.profileType === 'coach' ? 'text-blue-900 border-blue-100' : 'text-emerald-900 border-emerald-100'">
                   <i class="pi pi-box mb-[2px]" [ngClass]="tpl.profileType === 'coach' ? 'text-blue-500' : 'text-emerald-500'"></i> 
                   {{ tpl.program }}
                </div>
            </div>

            <!-- Action Button -->
            <div class="relative z-10 w-full md:w-auto flex justify-end">
               <button class="w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group/btn"
                       [ngClass]="tpl.profileType === 'coach' ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/40' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/40'"
                       (click)="apply(tpl); $event.stopPropagation()">
                  Postuler maintenant 
                  <i class="pi pi-arrow-right group-hover/btn:translate-x-1 transition-transform"></i>
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
        border-bottom: 1px solid var(--surface-200);
        padding: 1.5rem 2rem;
        background: #ffffff;
        border-radius: 1.5rem 1.5rem 0 0;
    }
    ::ng-deep .offers-dialog .p-dialog-title {
        font-weight: 800;
        font-size: 1.5rem;
        color: var(--surface-900);
    }
    ::ng-deep .offers-dialog .p-dialog-content {
        padding: 2rem;
        background-color: var(--surface-50);
        border-radius: 0 0 1.5rem 1.5rem;
    }
    .dark ::ng-deep .offers-dialog .p-dialog-content {
        background-color: var(--surface-900);
    }
    
    .styled-apply-btn {
        background: var(--primary-color, #ea5073);
        color: white;
        padding: 0.75rem 1.75rem;
        border-radius: 12px;
        font-weight: 700;
        font-size: 0.875rem;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px -2px rgba(234, 80, 115, 0.4);
        transition: all 0.2s ease;
        white-space: nowrap;
    }
    .styled-apply-btn:hover {
        background: #d4476a;
        box-shadow: 0 6px 20px -2px rgba(234, 80, 115, 0.5);
        transform: translateY(-2px);
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
              const all = dtos.map(dto => FormTemplateService.toView(dto));
              const valid = all.filter(t => !t.deadline || !this.isExpired(t.deadline));
              
              // Group by profileType and get the latest
              const latestMap = new Map<string, FormTemplateView>();
              // dtos are usually returned in insertion order. Let's assume the last one is the latest.
              valid.forEach(t => {
                  latestMap.set(t.profileType, t);
              });
              
              this.templates = Array.from(latestMap.values());
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
