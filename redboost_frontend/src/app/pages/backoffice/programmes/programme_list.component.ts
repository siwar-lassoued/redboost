import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProgrammeService } from './programme.service';
import { ProgrammeDialogComponent } from './program-dialog.component';
import { Programme } from '../../../models/programme';

@Component({
    selector: 'app-programme-list',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatIconModule,
        RouterModule,
        FormsModule,
    ],
    styles: [
        `
            :host {
                display: block;
                font-family: system-ui, -apple-system, sans-serif;
                background-color: #ffffff;
                min-height: 100vh;
            }

            /* Header Styles */
            h1 {
                font-size: 1.875rem;
                font-weight: 700;
                color: #111827;
                margin: 0;
            }

            /* Filter Bar */
            .filter-input,
            .filter-select {
                background-color: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 0.5rem;
                padding: 0.625rem 1rem;
                font-size: 0.875rem;
                color: #4b5563;
                width: 100%;
                outline: none;
                transition: all 0.15s;
            }

            .filter-input:focus,
            .filter-select:focus {
                border-color: #d1d5db;
                box-shadow: 0 0 0 3px rgba(209, 213, 219, 0.1);
            }

            .filter-select {
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 0.75rem center;
                background-size: 1.25rem;
                padding-right: 2.5rem;
            }

            /* Card Design */
            .programme-card {
                background: white;
                border-radius: 0.75rem;
                overflow: hidden;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                transition: box-shadow 0.2s;
            }

            .programme-card:hover {
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }

            .card-header {
                height: 6rem;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .card-title {
                color: white;
                font-size: 1.25rem;
                font-weight: 600;
                text-align: center;
                z-index: 1;
            }

            .card-actions {
                position: absolute;
                top: 0.75rem;
                right: 0.75rem;
                display: flex;
                gap: 0.5rem;
                z-index: 2;
            }

            .action-btn {
                width: 2rem;
                height: 2rem;
                border-radius: 9999px;
                background: rgba(255, 255, 255, 0.9);
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.15s;
            }

            .action-btn:hover {
                background: white;
                transform: scale(1.05);
            }

            .action-btn mat-icon {
                font-size: 1rem;
                width: 1rem;
                height: 1rem;
                line-height: 1rem;
                color: #374151;
            }

            .action-btn.delete-btn mat-icon {
                color: #ea5073;
            }

            /* Avatar/Logo */
            .avatar-container {
                position: relative;
                margin-top: -3rem;
                display: flex;
                justify-content: center;
            }

            .avatar-wrapper {
                width: 6rem;
                height: 6rem;
                border-radius: 9999px;
                background: white;
                border: 4px solid white;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0.5rem;
            }

            .avatar-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                object-position: center;
            }

            /* Fallback for missing images */
            .avatar-img-error {
                width: 3rem;
                height: 3rem;
                color: #d1d5db;
            }

            /* Card Content */
            .card-content {
                padding: 1rem 1.5rem 1.5rem;
            }

            .info-row {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 1rem;
            }

            .info-row mat-icon {
                font-size: 1rem;
                width: 1rem;
                height: 1rem;
                line-height: 1rem;
                color: #6b7280;
            }

            .info-row span {
                font-size: 0.875rem;
                color: #4b5563;
            }

            /* Sectors */
            .sectors-container {
                display: flex;
                flex-wrap: wrap;
                gap: 0.25rem;
                margin-bottom: 1rem;
            }

            .sector-badge {
                padding: 0.25rem 0.625rem;
                font-size: 0.75rem;
                border: 1px solid #d1d5db;
                border-radius: 0.375rem;
                color: #374151;
                background: white;
            }

            /* Status Badge */
            .status-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding-top: 0.5rem;
                margin-bottom: 1rem;
            }

            .status-badge {
                padding: 0.375rem 0.75rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
                color: white;
            }

            .status-en-cours {
                background-color: #2a7b8c;
            }

            .status-complete {
                background-color: #16a34a;
            }

            .status-en-retard {
                background-color: #ea5073;
            }

            .status-planifie {
                background-color: #6b7280;
            }

            /* Detail Button */
            .btn-detail {
                width: 100%;
                padding: 0.75rem 1rem;
                border-radius: 0.5rem;
                background-color: #2a5f6f;
                color: white;
                font-weight: 600;
                font-size: 0.875rem;
                letter-spacing: 0.025em;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                transition: background-color 0.15s;
            }

            .btn-detail:hover {
                background-color: #1a4d5c;
            }

            .btn-detail mat-icon {
                font-size: 1rem;
                width: 1rem;
                height: 1rem;
                line-height: 1rem;
            }

            /* Add Program Button */
            .btn-add {
                background-color: #ea5073;
                color: white;
                padding: 0.625rem 1.25rem;
                border-radius: 0.5rem;
                font-weight: 500;
                font-size: 0.875rem;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                transition: all 0.2s;
            }

            .btn-add:hover {
                background-color: #d4476a;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }

            .btn-add mat-icon {
                font-size: 1rem;
                width: 1rem;
                height: 1rem;
                line-height: 1rem;
            }

            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 3rem 0;
            }

            .empty-state p {
                color: #6b7280;
                font-size: 1rem;
            }
        `,
    ],
    template: `
        <div class="p-6 space-y-8">
            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1>Vos Programmes</h1>
                    <p class="text-gray-500 mt-1" style="font-size: 0.875rem;">
                        Gérez vos programmes et suivez leur progression
                    </p>
                </div>
                <button
                    (click)="openCreateDialog()"
                    class="btn-add"
                >
                    <mat-icon>add</mat-icon>
                    Ajouter un programme
                </button>
            </div>

            <!-- Advanced Filters -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Search Filter -->
                <div class="relative">
                    <mat-icon style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); font-size: 1rem; width: 1rem; height: 1rem; color: #9ca3af;">search</mat-icon>
                    <input
                        type="text"
                        placeholder="Rechercher un programme..."
                        class="filter-input"
                        style="padding-left: 2.5rem;"
                        [ngModel]="searchTerm()"
                        (ngModelChange)="searchTerm.set($event)"
                    />
                </div>

                <!-- Status Filter -->
                <select 
                    class="filter-select"
                    [ngModel]="selectedStatus()"
                    (ngModelChange)="selectedStatus.set($event)"
                >
                    <option value="">Tous les statuts</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="COMPLETE">Complet</option>
                    <option value="EN_RETARD">En retard</option>
                    <option value="NON_DEMARREE">Non démarré</option>
                </select>

                <!-- Year Filter -->
                <select 
                    class="filter-select"
                    [ngModel]="selectedYear()"
                    (ngModelChange)="selectedYear.set($event)"
                >
                    <option value="">Toutes les années</option>
                    @for (year of availableYears(); track year) {
                        <option [value]="year">{{ year }}</option>
                    }
                </select>

                <!-- Sector Filter -->
                <select 
                    class="filter-select"
                    [ngModel]="selectedSector()"
                    (ngModelChange)="selectedSector.set($event)"
                >
                    <option value="">Tous les secteurs</option>
                    @for (sector of availableSectors(); track sector) {
                        <option [value]="sector">{{ sector }}</option>
                    }
                </select>
            </div>

            <!-- Programs Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (p of filteredProgrammes(); track p.id) {
                    <div class="programme-card">
                        <!-- Header with gradient -->
                        <div
                            class="card-header"
                            [style.background]="getGradient(p.couleurTheme)"
                        >
                            <!-- Program Name -->
                            <h3 class="card-title">{{ p.nom }}</h3>

                            <!-- Action buttons -->
                            <div class="card-actions">
                                <button 
                                    class="action-btn" 
                                    (click)="goToDetail(p.id!)"
                                    title="Voir les détails"
                                >
                                    <mat-icon>play_arrow</mat-icon>
                                </button>
                                <button
                                    class="action-btn"
                                    (click)="openEditDialog(p)"
                                    title="Modifier"
                                >
                                    <mat-icon>edit</mat-icon>
                                </button>
                                <button
                                    class="action-btn delete-btn"
                                    (click)="deleteProgramme(p)"
                                    title="Supprimer"
                                >
                                    <mat-icon>delete</mat-icon>
                                </button>
                            </div>
                        </div>

                        <!-- Avatar/Logo -->
                        <div class="avatar-container">
                            <div class="avatar-wrapper">
                                @if (p.logoUrl) {
                                    <img
                                        [src]="getLogoUrl(p.logoUrl)"
                                        class="avatar-img"
                                        alt="Logo du programme"
                                        (error)="onImageError($event)"
                                    />
                                } @else {
                                    <mat-icon class="avatar-img-error">image</mat-icon>
                                }
                            </div>
                        </div>

                        <!-- Card Content -->
                        <div class="card-content">
                            <!-- Type -->
                            <div class="info-row">
                                <mat-icon>description</mat-icon>
                                <span>{{ p.typeProgramme }}</span>
                            </div>

                            <!-- Dates -->
                            <div class="info-row">
                                <mat-icon>calendar_today</mat-icon>
                                <span>
                                    {{ p.dateDebut | date: 'dd/MM/yyyy' }} - 
                                    {{ p.dateFin | date: 'dd/MM/yyyy' }}
                                </span>
                            </div>

                            <!-- Manager -->
                            <div class="info-row">
                                <mat-icon>person</mat-icon>
                                <span>{{ getResponsableName(p.responsableId) }}</span>
                            </div>

                            <!-- Beneficiaries -->
                            <div class="info-row">
                                <mat-icon>groups</mat-icon>
                                <span>{{ p.nombreBeneficiaires || 0 }} bénéficiaires</span>
                            </div>

                            <!-- Sectors -->
                            @if (p.secteurs && p.secteurs.length > 0) {
                                <div class="sectors-container">
                                    @for (s of p.secteurs; track s.id) {
                                        <span class="sector-badge">{{ s.nom }}</span>
                                    }
                                </div>
                            }

                            <!-- Status Badge -->
                            <div class="status-container">
                                <span
                                    class="status-badge"
                                    [ngClass]="getStatusClass(p.statut)"
                                >
                                    {{ formatStatus(p.statut) }}
                                </span>
                            </div>

                            <!-- Action Button -->
                            <button 
                                (click)="goToDetail(p.id!)" 
                                class="btn-detail"
                            >
                                <mat-icon>play_arrow</mat-icon>
                                VOIR DÉTAILS
                            </button>
                        </div>
                    </div>
                }
            </div>

            <!-- Empty State -->
            @if (filteredProgrammes().length === 0) {
                <div class="empty-state">
                    <p>Aucun programme trouvé avec les filtres actuels.</p>
                </div>
            }
        </div>
    `,
})
export class ProgrammeListComponent implements OnInit {
    private service = inject(ProgrammeService);
    private dialog = inject(MatDialog);
    private router = inject(Router);

    programmes = this.service.programmes;

    // Convert filter states to signals
    searchTerm = signal('');
    selectedStatus = signal('');
    selectedYear = signal('');
    selectedSector = signal('');

    // Computed signals for filter options
    availableYears = computed(() => {
        const years = new Set<number>();
        this.programmes().forEach(p => {
            if (p.annee) {
                years.add(p.annee);
            }
        });
        return Array.from(years).sort((a, b) => b - a);
    });

    availableSectors = computed(() => {
        const sectors = new Set<string>();
        this.programmes().forEach(p => {
            if (p.secteurs && p.secteurs.length > 0) {
                p.secteurs.forEach(s => sectors.add(s.nom));
            }
        });
        return Array.from(sectors).sort();
    });

    // Filtered programmes computed signal
    filteredProgrammes = computed(() => {
        let filtered = this.programmes();

        const search = this.searchTerm().toLowerCase().trim();
        if (search) {
            filtered = filtered.filter(p => 
                p.nom.toLowerCase().includes(search) ||
                p.typeProgramme?.toLowerCase().includes(search) ||
                p.description?.toLowerCase().includes(search)
            );
        }

        if (this.selectedStatus()) {
            filtered = filtered.filter(p => p.statut === this.selectedStatus());
        }

        if (this.selectedYear()) {
            const year = parseInt(this.selectedYear());
            filtered = filtered.filter(p => p.annee === year);
        }

        if (this.selectedSector()) {
            filtered = filtered.filter(p => 
                p.secteurs?.some(s => s.nom === this.selectedSector())
            );
        }

        return filtered;
    });

    ngOnInit(): void {
        this.service.loadAll();
    }

    hasActiveFilters(): boolean {
        return !!(
            this.searchTerm().trim() ||
            this.selectedStatus() ||
            this.selectedYear() ||
            this.selectedSector()
        );
    }

    clearFilters(): void {
        this.searchTerm.set('');
        this.selectedStatus.set('');
        this.selectedYear.set('');
        this.selectedSector.set('');
    }

    openCreateDialog(): void {
        this.dialog
            .open(ProgrammeDialogComponent, {
                width: '850px',
                maxWidth: '95vw',
                panelClass: 'custom-dialog-panel',
            })
            .afterClosed()
            .subscribe((res) => {
                if (res) {
                    this.service.loadAll();
                }
            });
    }

    openEditDialog(p: Programme): void {
        this.dialog
            .open(ProgrammeDialogComponent, {
                data: p,
                width: '850px',
                maxWidth: '95vw',
            })
            .afterClosed()
            .subscribe((res) => {
                if (res) {
                    this.service.loadAll();
                }
            });
    }

    getLogoUrl(url: string | null | undefined): string {
        if (!url) return 'assets/images/placeholder.png';
        if (url.startsWith('http')) return url;
        return `https://redboost.tn${url.startsWith('/') ? '' : '/'}${url}`;
    }

    onImageError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.style.display = 'none';
        // Show fallback icon instead
        if (img.parentElement) {
            const icon = document.createElement('mat-icon');
            icon.className = 'avatar-img-error';
            icon.textContent = 'image';
            img.parentElement.appendChild(icon);
        }
    }

    deleteProgramme(p: Programme): void {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
            this.service.delete(p.id!).subscribe(() => this.service.loadAll());
        }
    }

    goToDetail(id: number): void {
        this.router.navigate(['/programme', id]);
    }

    getGradient(color?: string): string {
        const gradients: Record<string, string> = {
            'from-[#6d3345] to-[#2a5f6f]': 'linear-gradient(to right, #6d3345, #2a5f6f)',
            'from-[#ea5073] to-[#6d3345]': 'linear-gradient(to right, #ea5073, #6d3345)',
            'from-[#2a7b8c] to-[#1a4d5c]': 'linear-gradient(to right, #2a7b8c, #1a4d5c)',
            'from-[#ea5073] to-[#2a7b8c]': 'linear-gradient(to right, #ea5073, #2a7b8c)',
            'from-emerald-500 to-teal-600': 'linear-gradient(to right, #10b981, #0d9488)',
            'from-orange-500 to-red-500': 'linear-gradient(to right, #f97316, #ef4444)',
        };
        
        return gradients[color || ''] || 'linear-gradient(to right, #6d3345, #2a5f6f)';
    }

    getResponsableName(id: number | undefined): string {
        if (id === undefined || id === null) {
            return 'Non assigné';
        }
        const user = this.service.responsables().find((u) => u.id === id);
        return user ? user.fullName : 'Non assigné';
    }

    formatStatus(status: string): string {
        const map: Record<string, string> = {
            NON_DEMARREE: 'Planifié',
            EN_COURS: 'En cours',
            EN_RETARD: 'En retard',
            COMPLETE: 'Terminé',
        };
        return map[status] || status;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'EN_COURS':
                return 'status-en-cours';
            case 'EN_RETARD':
                return 'status-en-retard';
            case 'COMPLETE':
                return 'status-complete';
            case 'NON_DEMARREE':
                return 'status-planifie';
            default:
                return 'status-en-cours';
        }
    }
}