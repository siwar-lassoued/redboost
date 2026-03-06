import { Component, OnInit } from '@angular/core';
import {
    CandidatureService,
    CandidatureRedstarter,
    PageResponse,
} from '../candidature.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-admin-candidatures',
    templateUrl: './admin_candidature.html',
    styleUrls: ['./admin_candidature.scss'],
    standalone: true,

    imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class AdminCandidaturesComponent implements OnInit {
    candidatures: CandidatureRedstarter[] = [];
    selectedCandidature: CandidatureRedstarter | null = null;

    // Pagination
    currentPage = 0;
    pageSize = 10;
    totalElements = 0;
    totalPages = 0;

    // Filter
    selectedStatus = '';
    searchQuery = '';

    // Statistics
    statistics: { [key: string]: number } = {};

    // Status update
    newStatus = '';
    adminComments = '';

    loading = false;
    Math = Math; // Make Math available in template

    constructor(private candidatureService: CandidatureService) {}

    ngOnInit(): void {
        this.loadCandidatures();
        this.loadStatistics();
    }

    loadCandidatures() {
        this.loading = true;

        if (this.searchQuery) {
            this.searchCandidatures();
        } else if (this.selectedStatus) {
            this.loadByStatus();
        } else {
            this.loadAllCandidatures();
        }
    }

    loadAllCandidatures() {
        this.candidatureService
            .getAllCandidatures(this.currentPage, this.pageSize)
            .subscribe({
                next: (response: PageResponse<CandidatureRedstarter>) => {
                    this.candidatures = response.content;
                    this.totalElements = response.totalElements;
                    this.totalPages = response.totalPages;
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error loading candidatures', error);
                    alert('Erreur lors du chargement des candidatures');
                    this.loading = false;
                },
            });
    }

    loadByStatus() {
        this.candidatureService
            .getCandidaturesByStatus(
                this.selectedStatus,
                this.currentPage,
                this.pageSize,
            )
            .subscribe({
                next: (response: PageResponse<CandidatureRedstarter>) => {
                    this.candidatures = response.content;
                    this.totalElements = response.totalElements;
                    this.totalPages = response.totalPages;
                    this.loading = false;
                },
                error: (error) => {
                    console.error(
                        'Error loading candidatures by status',
                        error,
                    );
                    alert('Erreur lors du chargement des candidatures');
                    this.loading = false;
                },
            });
    }

    searchCandidatures() {
        this.candidatureService
            .searchCandidatures(
                this.searchQuery,
                this.currentPage,
                this.pageSize,
            )
            .subscribe({
                next: (response: PageResponse<CandidatureRedstarter>) => {
                    this.candidatures = response.content;
                    this.totalElements = response.totalElements;
                    this.totalPages = response.totalPages;
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error searching candidatures', error);
                    alert('Erreur lors de la recherche');
                    this.loading = false;
                },
            });
    }

    loadStatistics() {
        this.candidatureService.getStatistics().subscribe({
            next: (stats) => {
                this.statistics = stats;
            },
            error: (error) => {
                console.error('Error loading statistics', error);
            },
        });
    }

    viewCandidature(id: number) {
        this.candidatureService.getCandidatureById(id).subscribe({
            next: (candidature) => {
                this.selectedCandidature = candidature;
                this.newStatus = candidature.statut || 'EN_ATTENTE';
                this.adminComments = candidature.commentairesAdmin || '';
            },
            error: (error) => {
                console.error('Error loading candidature details', error);
                alert('Erreur lors du chargement des détails');
            },
        });
    }

    updateStatus(id: number, newStatus: string, commentaires?: string) {
        if (!newStatus) {
            alert('Veuillez sélectionner un statut');
            return;
        }

        this.candidatureService
            .updateCandidatureStatus(id, newStatus, commentaires)
            .subscribe({
                next: (response) => {
                    console.log('Status updated successfully', response);
                    alert('✅ Statut mis à jour avec succès!');
                    this.selectedCandidature = null;
                    this.loadCandidatures();
                    this.loadStatistics();
                },
                error: (error) => {
                    console.error('Error updating status', error);
                    alert('❌ Erreur lors de la mise à jour du statut');
                },
            });
    }

    deleteCandidature(id: number) {
        if (
            confirm(
                '⚠️ Êtes-vous sûr de vouloir supprimer cette candidature? Cette action est irréversible.',
            )
        ) {
            this.candidatureService.deleteCandidature(id).subscribe({
                next: (response) => {
                    console.log('Candidature deleted', response);
                    alert('✅ Candidature supprimée avec succès!');
                    this.loadCandidatures();
                    this.loadStatistics();
                },
                error: (error) => {
                    console.error('Error deleting candidature', error);
                    alert('❌ Erreur lors de la suppression');
                },
            });
        }
    }

    onStatusFilterChange(status: string) {
        this.selectedStatus = status;
        this.currentPage = 0;
        this.loadCandidatures();
    }

    onSearchQueryChange(query: string) {
        this.searchQuery = query;
        this.currentPage = 0;

        // Debounce search
        setTimeout(() => {
            if (this.searchQuery === query) {
                this.loadCandidatures();
            }
        }, 500);
    }

    clearFilters() {
        this.selectedStatus = '';
        this.searchQuery = '';
        this.currentPage = 0;
        this.loadCandidatures();
    }

    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            this.loadCandidatures();
            window.scrollTo(0, 0);
        }
    }

    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.loadCandidatures();
            window.scrollTo(0, 0);
        }
    }

    goToPage(page: number) {
        this.currentPage = page;
        this.loadCandidatures();
        window.scrollTo(0, 0);
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'EN_ATTENTE':
                return 'badge-warning';
            case 'EN_COURS_EVALUATION':
                return 'badge-info';
            case 'ACCEPTE':
                return 'badge-success';
            case 'REFUSE':
                return 'badge-danger';
            default:
                return 'badge-secondary';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'EN_ATTENTE':
                return 'En Attente';
            case 'EN_COURS_EVALUATION':
                return "En Cours d'Évaluation";
            case 'ACCEPTE':
                return 'Accepté';
            case 'REFUSE':
                return 'Refusé';
            default:
                return status;
        }
    }
}
