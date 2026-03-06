// entrepreneur-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ProgrammeService } from '../programme.service';

// Import sub-components
import { EntrepreneurHeaderComponent } from './entrpreneur-header';
import { EntrepreneurIntegrationCardsComponent } from './entrepreneur-integration-cards';
import { KpiFilterSectionComponent } from './kpi-filter';
import { EntrepreneurStatsComponent } from './entrepreneur-stats';
import { EntrepreneurTableComponent } from './entrepreneur-table/entrepreneur-table';
import { AddEntrepreneurModalComponent } from './dialogs/add-entrepreneur/add-entrepreneur';
import { AssignEntrepreneurModalComponent } from './dialogs/assign-entrepreneur/assign-entrepreneur';
import { KpiHistoryModalComponent } from './dialogs/kpi-history/kpi-history';
import { ExcelImportModalComponent } from "./dialogs/importExcel/importexcel";
import { UpdateEntrepreneurModalComponent } from './dialogs/update-entrep/update-entrep';

// Interfaces
import { 
    Programme, 
    Entrepreneur, 
    EntrepreneurDetail, 
    CategoryResponse,
    KpiDetail 
} from '../../../../models/entrepreneur.models';

@Component({
    selector: 'app-entrepreneurs-management',
    standalone: true,
    imports: [
        CommonModule,
        EntrepreneurHeaderComponent,
        EntrepreneurIntegrationCardsComponent,
        KpiFilterSectionComponent,
        EntrepreneurStatsComponent,
        EntrepreneurTableComponent,
        AddEntrepreneurModalComponent,
        AssignEntrepreneurModalComponent,
        KpiHistoryModalComponent,
        ExcelImportModalComponent,
        UpdateEntrepreneurModalComponent
    ],
    template: `
        <div class="min-h-screen bg-[#0A4955]/5 p-8">
            <!-- Header -->
            <app-entrepreneur-header />

            <!-- Integration Cards -->
            <app-entrepreneur-integration-cards
                (onAddClick)="openAddModal()"
                (onAssignClick)="openAssignModal()"
                (onImportExcelClick)="openExcelImportModal()"       
            />

            <!-- KPI Filtering Section -->
            <app-kpi-filter-section
                [categories]="categories"
                [programmes]="programmes"
                [regions]="regions"
                [secteurs]="secteurs"
                [selectedKpiFilter]="selectedKpiFilter"
                [selectedProgrammeFilter]="selectedProgrammeFilter"
                [selectedRegionFilter]="selectedRegionFilter"
                [selectedSecteurFilter]="selectedSecteurFilter"
                [showEntrepreneurTracking]="showEntrepreneurTracking"
                [entrepreneursDetails]="entrepreneursDetails"
                (onKpiFilterChange)="onKpiFilterChange($event)"
                (onProgrammeFilterChange)="onProgrammeFilterChange($event)"
                (onRegionFilterChange)="onRegionFilterChange($event)"
                (onSecteurFilterChange)="onSecteurFilterChange($event)"
                (onResetFilters)="resetFilters()"
                (onToggleTracking)="onToggleTracking($event)"
            />

            <!-- Stats Cards -->
            <app-entrepreneur-stats
                [filteredCount]="filteredEntrepreneurs.length"
                [totalCount]="entrepreneursDetails.length"
            />

            <!-- Entrepreneurs Table -->
            <app-entrepreneur-table
                [entrepreneurs]="filteredEntrepreneurs"
                [searchTerm]="searchTerm"
                (onSearchChange)="onSearch($event)"
                (onDeleteEntrepreneur)="deleteEntrepreneur($event)"
                (onEditEntrepreneur)="openUpdateModal($event)"
                (onOpenKpiHistory)="openKpiHistory($event)"
            />

            <!-- Update Entrepreneur Modal -->
            <app-update-entrepreneur-modal
                [programmes]="programmes"
                [tunisiaRegions]="tunisiaRegions"
                [showModal]="showUpdateModal"
                [entrepreneurToEdit]="selectedEntrepreneur"
                (onClose)="closeUpdateModal()"
                (onUpdateEntrepreneur)="handleUpdateEntrepreneur($event)"
            />

            <!-- Add Entrepreneur Modal -->
            <app-add-entrepreneur-modal
                [showModal]="showAddModal"
                [programmes]="programmes"
                [tunisiaRegions]="tunisiaRegions"
                (onClose)="closeAddModal()"
                (onSubmitEntrepreneur)="onSubmitNewEntrepreneur($event)"
            />

            <!-- Assign Entrepreneur Modal -->
            <app-assign-entrepreneur-modal
                [showAssignModal]="showAssignModal"
                [programmes]="programmes"
                [entrepreneursDetails]="entrepreneursDetails"
                (onClose)="closeAssignModal()"
                (onAssignEntrepreneurs)="assignEntrepreneurs($event)"
            />

            <!-- Excel Import Modal -->
            <app-excel-import-modal
                [isOpen]="showExcelImportModal"
                (isOpenChange)="showExcelImportModal = $event"
                (importSuccess)="onExcelImportSuccess($event)"
            />

            <!-- KPI History Modal -->
            <app-kpi-history-modal
                [showKpiModal]="showKpiModal"
                [selectedKpi]="selectedKpi"
                (onClose)="closeKpiModal()"
            />
        </div>
    `
})
export class EntrepreneursManagementComponent implements OnInit {
    showAddModal = false;
    showAssignModal = false;
    showKpiModal = false;
    showEntrepreneurTracking = true;
    showExcelImportModal = false;
    showUpdateModal = false; // ADD THIS
    
    selectedKpiFilter: number | null = null;
    selectedProgrammeFilter: number | null = null;
    selectedRegionFilter: string | null = null;
    selectedSecteurFilter: string | null = null;
    selectedKpi: any = null;
    selectedEntrepreneur: EntrepreneurDetail | null = null; // ADD THIS

    programmes: Programme[] = [];
    entrepreneursDetails: EntrepreneurDetail[] = [];
    filteredEntrepreneurs: EntrepreneurDetail[] = [];
    categories: CategoryResponse[] = [];
    regions: string[] = [];
    secteurs: string[] = [];
    searchTerm = '';

    tunisiaRegions: string[] = [
        'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
        'Bizerte', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Kairouan',
        'Kasserine', 'Sidi Bouzid', 'Sousse', 'Monastir', 'Mahdia', 'Sfax',
        'Gafsa', 'Tozeur', 'Kebili', 'Gabès', 'Medenine', 'Tataouine'
    ];

    private apiUrl = 'https://redboost.tn/api/users';
    private detailsApiUrl = 'https://redboost.tn/api/backoffice/programmes/entrepreneurs-details';
    private assignApiUrl = 'https://redboost.tn/api/backoffice/programmes';
    private categoriesApiUrl = 'https://redboost.tn/api/backoffice/categories';

    constructor(
        private http: HttpClient,
        private programmeService: ProgrammeService
    ) {}

    ngOnInit() {
        this.loadEntrepreneursDetails();
        this.loadProgrammes();
        this.loadCategories();
    }

    loadCategories() {
        this.http.get<CategoryResponse[]>(this.categoriesApiUrl).subscribe({
            next: (data) => {
                this.categories = data;
            },
            error: (err) => console.error('Error loading categories', err)
        });
    }

    loadProgrammes() {
        this.programmeService.getAllProgrammesBasic().subscribe({
            next: (data: any[]) => {
                this.programmes = data.map((p) => ({
                    id: p.id,
                    name: p.nom || p.name || 'Programme sans nom',
                    checked: false
                }));
            },
            error: (err) => console.error('Error loading programmes', err)
        });
    }

    loadEntrepreneursDetails() {
        this.http.get<EntrepreneurDetail[]>(this.detailsApiUrl).subscribe({
            next: (data) => {
                console.log('Entrepreneurs data:', data);
                this.entrepreneursDetails = data.map((e) => ({
                    ...e,
                    expanded: false,
                    programs: e.programs?.map((p) => ({ ...p, expanded: false })) || []
                }));
                this.filteredEntrepreneurs = this.entrepreneursDetails;
                this.extractFiltersFromData();
            },
            error: (error) => console.error('Error loading entrepreneurs details:', error)
        });
    }

    extractFiltersFromData() {
        const regionsSet = new Set<string>();
        const secteursSet = new Set<string>();

        this.entrepreneursDetails.forEach((e) => {
            if (e.region) regionsSet.add(e.region);
            if (e.secteur) secteursSet.add(e.secteur);
        });

        this.regions = Array.from(regionsSet).sort();
        this.secteurs = Array.from(secteursSet).sort();
    }

    applyFilters() {
        this.filteredEntrepreneurs = this.entrepreneursDetails.filter((e) => {
            if (this.searchTerm) {
                const term = this.searchTerm.toLowerCase();
                const matchesSearch =
                    e.firstName?.toLowerCase().includes(term) ||
                    e.lastName?.toLowerCase().includes(term) ||
                    e.email?.toLowerCase().includes(term) ||
                    e.entreprise?.toLowerCase().includes(term) ||
                    e.region?.toLowerCase().includes(term) ||
                    e.secteur?.toLowerCase().includes(term);
                if (!matchesSearch) return false;
            }

            if (this.selectedProgrammeFilter) {
                const hasProgram = e.programs?.some(p => p.id === this.selectedProgrammeFilter);
                if (!hasProgram) return false;
            }

            if (this.selectedRegionFilter && e.region !== this.selectedRegionFilter) return false;
            if (this.selectedSecteurFilter && e.secteur !== this.selectedSecteurFilter) return false;

            if (this.selectedKpiFilter) {
                const hasKpi = e.programs?.some(p => 
                    p.kpis?.some(k => k.kpiId === this.selectedKpiFilter)
                );
                if (!hasKpi) return false;
            }

            if (this.showEntrepreneurTracking) {
                const hasAnyKpi = e.programs?.some(p => p.kpis && p.kpis.length > 0);
                if (!hasAnyKpi) return false;
            }

            return true;
        });
    }

    onSearch(searchTerm: string) {
        this.searchTerm = searchTerm;
        this.applyFilters();
    }

    onProgrammeFilterChange(programmeId: number | null) {
        this.selectedProgrammeFilter = programmeId;
        this.applyFilters();
    }

    onRegionFilterChange(region: string | null) {
        this.selectedRegionFilter = region;
        this.applyFilters();
    }

    onSecteurFilterChange(secteur: string | null) {
        this.selectedSecteurFilter = secteur;
        this.applyFilters();
    }

    onKpiFilterChange(kpiId: number) {
        this.selectedKpiFilter = this.selectedKpiFilter === kpiId ? null : kpiId;
        this.showEntrepreneurTracking = this.selectedKpiFilter !== null;
        this.applyFilters();
    }

    onToggleTracking(value: boolean) {
        this.showEntrepreneurTracking = value;
        this.applyFilters();
    }

    resetFilters() {
        this.selectedProgrammeFilter = null;
        this.selectedRegionFilter = null;
        this.selectedSecteurFilter = null;
        this.selectedKpiFilter = null;
        this.searchTerm = '';
        this.showEntrepreneurTracking = false;
        this.applyFilters();
    }

    openAddModal() {
        this.showKpiModal = false;
        this.showAssignModal = false;
        this.showUpdateModal = false; // ADD THIS
        this.showAddModal = true;
    }

    closeAddModal() {
        this.showAddModal = false;
    }

    openAssignModal() {
        this.showAssignModal = true;
    }

    closeAssignModal() {
        this.showAssignModal = false;
    }

    openKpiHistory(event: { kpi: KpiDetail; entrepreneurName: string }) {
        this.selectedKpi = {
            ...event.kpi,
            entrepreneurName: event.entrepreneurName
        };
        this.showKpiModal = true;
    }

    closeKpiModal() {
        this.showKpiModal = false;
        this.selectedKpi = null;
    }

    onSubmitNewEntrepreneur(entrepreneurData: Entrepreneur) {
        this.http.post(`${this.apiUrl}/addentrepreneur`, entrepreneurData).subscribe({
            next: () => {
                alert('Entrepreneur ajouté avec succès!');
                this.closeAddModal();
                this.loadEntrepreneursDetails();
            },
            error: (error) => {
                console.error('Error adding entrepreneur:', error);
                alert(error.error?.message || "Erreur lors de l'ajout");
            }
        });
    }

    // Update Modal Methods
    openUpdateModal(entrepreneur: EntrepreneurDetail) {
        console.log('Opening update modal for:', entrepreneur);
        this.selectedEntrepreneur = entrepreneur;
        this.showUpdateModal = true;
    }

    closeUpdateModal() {
        this.showUpdateModal = false;
        this.selectedEntrepreneur = null;
    }

    handleUpdateEntrepreneur(updatedData: any) {
        const entrepreneurId = updatedData.id;
        
        this.http.patch(`${this.apiUrl}/updateentrepreneur/${entrepreneurId}`, updatedData).subscribe({
            next: (response) => {
                console.log('Entrepreneur updated successfully', response);
                this.loadEntrepreneursDetails(); // Reload the list
                this.closeUpdateModal();
                alert('Entrepreneur modifié avec succès!');
            },
            error: (error) => {
                console.error('Error updating entrepreneur', error);
                alert('Erreur lors de la modification: ' + 
                      (error.error?.message || error.message));
            }
        });
    }

    assignEntrepreneurs(event: { programmeId: number; entrepreneurIds: number[] }) {
        this.http.post(
            `${this.assignApiUrl}/${event.programmeId}/entrepreneurs`,
            event.entrepreneurIds
        ).subscribe({
            next: () => {
                alert('Entrepreneurs assignés avec succès!');
                this.closeAssignModal();
                this.loadEntrepreneursDetails();
            },
            error: (error) => {
                console.error('Error assigning entrepreneurs:', error);
                alert(error.error?.message || "Erreur lors de l'assignation");
            }
        });
    }

    deleteEntrepreneur(id: number) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet entrepreneur ?')) {
            return;
        }

        this.http.delete(`${this.apiUrl}/${id}`).subscribe({
            next: () => {
                alert('Entrepreneur supprimé avec succès');
                this.loadEntrepreneursDetails();
            },
            error: (error) => {
                console.error('Error deleting entrepreneur:', error);
                alert("Erreur lors de la suppression");
            }
        });
    }

    openExcelImportModal() {
        this.showExcelImportModal = true;
    }

    onExcelImportSuccess(result: any) {
        console.log('Importation Excel réussie', result);
        this.loadEntrepreneursDetails(); // Refresh the list
        alert(`Importation terminée ! ${result.successCount} entrepreneur(s) ajouté(s)`);
    }
}