import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { animate, style, transition, trigger } from '@angular/animations';

import { categorieKpiService } from './categorieKpi.service';
import {
    BackofficeCategory,
    BackofficeKpi,
} from '../../../models/BackofficeCategory';
import { CategoryDialogComponent } from './category-dialog.component';
import { KpiDialogComponent } from './kpi-dialog.component';

@Component({
    selector: 'app-category-list',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
    animations: [
        trigger('slideDown', [
            transition(':enter', [
                style({ height: 0, opacity: 0, overflow: 'hidden' }),
                animate(
                    '300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    style({ height: '*', opacity: 1 }),
                ),
            ]),
            transition(':leave', [
                animate(
                    '300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    style({ height: 0, opacity: 0, overflow: 'hidden' }),
                ),
            ]),
        ]),
    ],
   styles: `
        :host {
            font-family: 'Poppins', sans-serif;
        }

        .action-btn {
            @apply w-8 h-8 rounded-lg border border-gray-200 bg-white 
             flex items-center justify-center transition-all duration-200
             hover:bg-gray-50 hover:border-gray-300;
        }
        .action-btn.delete {
            @apply text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300;
        }

        .category-icon {
            @apply w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg;
        }
        .category-title {
        
        @apply text-lg font-medium text-gray-900; 
    }

        .kpi-count-badge {
            @apply inline-flex items-center px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-medium text-gray-700;
        }

        .kpi-card {
            @apply bg-white rounded-xl border-2 border-gray-200 p-4 
             hover:border-[#ea5073]/30 transition-all duration-200;
        }
        
        .kpi-header {
            @apply flex items-start justify-between mb-2;
        }
        
        .kpi-title {
            @apply flex items-center gap-2;
        }
        
        .kpi-name {
            @apply text-sm font-medium text-gray-900;
        }
        
        .kpi-desc {
            @apply text-xs text-gray-600 mb-3;
        }
        
        .kpi-meta {
            @apply flex items-center justify-between text-xs;
        }
        
        .unit-badge {
            @apply px-2 py-1 border border-gray-200 rounded-lg text-gray-700 font-medium;
        }
        
        .target {
            @apply flex items-center gap-1 text-gray-600;
        }

        /* Type badges */
        .type-badge {
            @apply inline-flex items-center px-2 py-0.5 
             text-xs font-medium rounded text-white;
        }

        .type-badge.global {
            @apply bg-[#ea5073] hover:bg-[#d4476a];
        }

        .type-badge.optionnel {
            @apply bg-[#2a7b8c] hover:bg-[#2a5f6f];
        }

        .kpi-action-btn {
            @apply w-7 h-7 rounded flex items-center justify-center 
             hover:bg-gray-100 transition-colors;
        }
        
        .kpi-action-btn.delete {
            @apply text-red-600 hover:bg-red-50;
        }
    `,
    template: `
        <div class="max-w-7xl mx-auto px-6 py-10">
            <div class="flex justify-between items-start mb-10">
                <div>
                    <h1 class="text-3xl font-bold text-slate-900">
                        Gestion des Catégories & KPI
                    </h1>
                    <p class="text-slate-500 mt-2">
                        Organisez vos indicateurs de performance par catégories
                    </p>
                </div>
                <button
                    (click)="openCategoryDialog()"
                    class="bg-rose-500 hover:bg-rose-600 text-white px-5 py-3 rounded-xl shadow-sm font-medium flex items-center gap-2 transition-all"
                >
                    <mat-icon>add</mat-icon>
                    Nouvelle Catégorie
                </button>
            </div>

            <div class="space-y-8">
                @for (cat of service.categories(); track cat.id) {
                    <div
                        class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                    >
                        <div
                            class="h-3"
                            [style.background-color]="getCategoryColor(cat)"
                        ></div>

                        <div
                            class="px-6 flex items-start gap-5 transition-all duration-200"
                            [class.pt-9]="collapsed().has(cat.id)"
                            [class.pb-8]="collapsed().has(cat.id)"
                            [class.py-6]="!collapsed().has(cat.id)"
                        >
                            <div
                                class="category-icon shrink-0"
                                [style.background-color]="getCategoryColor(cat)"
                            >
                                <mat-icon>category</mat-icon>
                            </div>

                            <div class="flex-1">
                                <div
                                    class="flex items-baseline gap-3 flex-wrap">
                                    <h4 class="category-title">
                                        {{ cat.nom }}
                                    </h4>

                                    <span class="kpi-count-badge shrink-0">
                                        {{ cat.kpis?.length || 0 }} KPI
                                    </span>
                                </div>
                                <p class="category-subtitle">
                                    {{
                                        cat.description ||
                                            'KPI liés à ' +
                                                (cat.nom | lowercase)
                                    }}
                                </p>
                            </div>

                            <div class="flex gap-3">
                                <button
                                    (click)="toggleCollapse(cat.id)"
                                    class="action-btn"
                                >
                                    <mat-icon>{{
                                        collapsed().has(cat.id)
                                            ? 'expand_more'
                                            : 'expand_less'
                                    }}</mat-icon>
                                </button>
                                <button
                                    (click)="openCategoryDialog(cat)"
                                    class="action-btn"
                                >
                                    <mat-icon class="text-lg">edit</mat-icon>
                                </button>
                                <button
                                    (click)="confirmDelete(cat)"
                                    class="action-btn delete"
                                >
                                    <mat-icon class="text-lg">delete</mat-icon>
                                </button>
                            </div>
                        </div>

                        <!-- KPIs Section -->
                        <div [@slideDown] *ngIf="!collapsed().has(cat.id)">
                            <div
                                class="border-t border-slate-100 bg-slate-50 px-6 py-8"
                            >
                                <div
                                    class="flex justify-between items-center mb-6"
                                >
                                    <h4
                                        class="text-sm font-semibold text-slate-700"
                                    >
                                        KPI de la catégorie
                                    </h4>
                                    <button
                                        (click)="openKpiDialog(cat.id)"
                                        class="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition"
                                    >
                                        <mat-icon class="text-base"
                                            >add</mat-icon
                                        >
                                        Ajouter un KPI
                                    </button>
                                </div>

                                @if (!cat.kpis || cat.kpis.length === 0) {
                                    <div
                                        class="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200"
                                    >
                                        <p class="text-slate-500">
                                            Aucun KPI défini pour cette
                                            catégorie
                                        </p>
                                        <button
                                            (click)="openKpiDialog(cat.id)"
                                            class="mt-4 px-5 py-2.5 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-100 transition"
                                        >
                                            Ajouter mon premier KPI
                                        </button>
                                    </div>
                                } @else {
                                    <div
                                        class="grid grid-cols-1 md:grid-cols-2 gap-6"
                                    >
                                        @for (kpi of cat.kpis; track kpi.id) {
                                            <div class="kpi-card">
                                                <div class="kpi-header">
                                                    <div class="kpi-title">
                                                        <mat-icon
                                                            class="text-gray-500"
                                                            >bar_chart</mat-icon
                                                        >
                                                        <div
                                                            class="flex items-center gap-3"
                                                        >
                                                            <span>{{
                                                                kpi.nom
                                                            }}</span>
                                                            <!-- Type badge -->
                                                            <span
                                                                class="type-badge"
                                                                [class.global]="
                                                                    kpi.type ===
                                                                    'GLOBAL'
                                                                "
                                                                [class.optionnel]="
                                                                    kpi.type ===
                                                                    'OPTIONNEL'
                                                                "
                                                                style="color: #ffffff !important;"
                                                            >
                                                                {{
                                                                    kpi.type ===
                                                                    'GLOBAL'
                                                                        ? 'Global'
                                                                        : 'Optionnel'
                                                                }}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div class="flex gap-2">
                                                        <button
                                                            (click)="
                                                                openKpiDialog(
                                                                    cat.id,
                                                                    kpi
                                                                )
                                                            "
                                                            class="action-btn"
                                                        >
                                                            <mat-icon
                                                                class="text-lg"
                                                                >edit</mat-icon
                                                            >
                                                        </button>
                                                        <button
                                                            (click)="
                                                                deleteKpi(
                                                                    kpi.id
                                                                )
                                                            "
                                                            class="action-btn delete"
                                                        >
                                                            <mat-icon
                                                                class="text-lg"
                                                                >delete</mat-icon
                                                            >
                                                        </button>
                                                    </div>
                                                </div>
                                                <p class="kpi-desc">
                                                    {{
                                                        kpi.description ||
                                                            'Aucune description fournie.'
                                                    }}
                                                </p>
                                                <div class="kpi-meta">
                                                    <span class="unit-badge">{{
                                                        kpi.uniteMesure
                                                    }}</span>
                                                    <div class="target">
                                                        <mat-icon
                                                            class="text-base"
                                                            >trending_up</mat-icon
                                                        >
                                                        Cible:
                                                        {{ kpi.uniteMesure }}
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                }
            </div>
        </div>
    `,
})
export class CategoryListComponent {
    readonly collapsed = signal<Set<number>>(new Set<number>());
    private initialCollapseDone = false;

    constructor(
        public service: categorieKpiService,
        private dialog: MatDialog,
    ) {
        this.service.loadAll();

        effect(() => {
            const categories = this.service.categories();
            if (categories.length > 0 && !this.initialCollapseDone) {
                const allIds = new Set(
                    categories.map((cat) => cat.id!).filter(Boolean),
                );
                this.collapsed.set(allIds);
                this.initialCollapseDone = true;
            }
        });
    }

    // Helper method to get category color with proper fallback
    getCategoryColor(category: BackofficeCategory): string {
        // If category has a color, use it
        if (category.couleur && category.couleur.trim() !== '') {
            return category.couleur;
        }
        // Otherwise return a default slate color
        return '#64748b'; // slate-500
    }

    toggleCollapse(id: number) {
        this.collapsed.update((set) => {
            const newSet = new Set(set);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    }

    openCategoryDialog(cat?: BackofficeCategory) {
        this.dialog
            .open(CategoryDialogComponent, {
                width: '640px',
                data: cat || null,
            })
            .afterClosed()
            .subscribe((result) => result && this.service.loadAll());
    }

 openKpiDialog(catId: number, kpi?: BackofficeKpi) {
    this.collapsed.update((set) => {
        const s = new Set(set);
        s.delete(catId);
        return s;
    });

    this.dialog
        .open(KpiDialogComponent, {
            width: '800px',           // ← Augmentez à 850px ou plus
            maxWidth: '95vw',         // ← Ajoutez ceci pour être responsive
            data: { categoryId: catId, kpi },
        })
        .afterClosed()
        .subscribe((result) => {
            if (result) {
                this.service.loadAll();
                this.collapsed.update((set) => {
                    const s = new Set(set);
                    s.delete(catId);
                    return s;
                });
            }
        });
}

    confirmDelete(cat: BackofficeCategory) {
        if (confirm(`Supprimer "${cat.nom}" et tous ses KPI ?`)) {
            this.service
                .delete(cat.id!)
                .subscribe(() => this.service.loadAll());
        }
    }

    deleteKpi(id: number) {
        if (confirm('Supprimer ce KPI définitivement ?')) {
            this.service.deleteKpi(id).subscribe(() => this.service.loadAll());
        }
    }
}
