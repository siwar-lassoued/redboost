import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CandidatureRedstarter {
    id?: number;
    nomPrenom?: string;
    genre?: string;
    age?: number;
    numeroTelephone?: string;
    email?: string;
    roleEntreprise?: string;
    nomEntreprise?: string;
    entrepriseEst?: string;
    dateCreation?: Date;
    regionBasee?: string;
    breveDescription?: string;
    lienReseauxSociaux?: string;
    labelStartupAct?: boolean;
    dateObtentionLabel?: Date;
    phaseMaturite?: string;
    marchePersonnasCibles?: string;
    composanteInnovation?: string;
    impactEnvironnemental?: string;
    impactSocial?: string;
    viabiliteCommerciale?: string;
    valeurAjoutee?: number;
    nombreCoFondateurs?: number;
    impliquesGestion?: boolean;
    nombreImpliquesGestion?: number;
    experienceEquipeFondatrice?: string;
    nombreEmploisCrees?: number;
    besoinsAccompagnement?: string[];
    beneficieAccompagnement?: boolean;
    detailsAccompagnement?: string;
    besoinsFormation?: string[];
    documents?: File[];
    statut?: string;
    dateCreationCandidature?: Date;
    commentairesAdmin?: string;

    formTemplateId?: string | number;
    dynamicAnswers?: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface ApiResponse {
    success: boolean;
    message: string;
    candidatureId?: number;
    candidature?: CandidatureRedstarter;
}

@Injectable({
    providedIn: 'root',
})
export class CandidatureService {
    private apiUrl = 'https://redboost.tn/api/candidatures';

    constructor(private http: HttpClient) {}

    /**
     * Submit a new candidature
     */
    submitCandidature(
        candidature: CandidatureRedstarter,
        documents?: File[],
    ): Observable<ApiResponse> {
        const formData = new FormData();

        // Add all candidature fields to FormData
        Object.keys(candidature).forEach((key) => {
            const value = (candidature as any)[key];

            if (value !== null && value !== undefined) {
                if (Array.isArray(value)) {
                    // Handle arrays (besoinsAccompagnement, besoinsFormation)
                    value.forEach((item) => {
                        formData.append(key, item);
                    });
                } else if (value instanceof Date) {
                    formData.append(key, value.toISOString().split('T')[0]);
                } else if (typeof value === 'boolean') {
                    formData.append(key, String(value));
                } else {
                    formData.append(key, value);
                }
            }
        });

        // Add documents
        if (documents && documents.length > 0) {
            documents.forEach((file) => {
                formData.append('documents', file, file.name);
            });
        }

        return this.http.post<ApiResponse>(`${this.apiUrl}/submit`, formData);
    }

    /**
     * Get all candidatures (Admin)
     */
    getAllCandidatures(
        page: number = 0,
        size: number = 10,
        sortBy: string = 'dateCreationCandidature',
        sortDir: string = 'DESC',
    ): Observable<PageResponse<CandidatureRedstarter>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sortBy', sortBy)
            .set('sortDir', sortDir);

        return this.http.get<PageResponse<CandidatureRedstarter>>(
            `${this.apiUrl}/admin/all`,
            { params },
        );
    }

    /**
     * Get candidature by ID (Admin)
     */
    getCandidatureById(id: number): Observable<CandidatureRedstarter> {
        return this.http.get<CandidatureRedstarter>(
            `${this.apiUrl}/admin/${id}`,
        );
    }

    /**
     * Get candidatures by status (Admin)
     */
    getCandidaturesByStatus(
        status: string,
        page: number = 0,
        size: number = 10,
    ): Observable<PageResponse<CandidatureRedstarter>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<CandidatureRedstarter>>(
            `${this.apiUrl}/admin/status/${status}`,
            { params },
        );
    }

    /**
     * Update candidature status (Admin)
     */
    updateCandidatureStatus(
        id: number,
        status: string,
        commentaires?: string,
    ): Observable<ApiResponse> {
        const body = {
            statut: status,
            commentaires: commentaires || '',
        };

        return this.http.put<ApiResponse>(
            `${this.apiUrl}/admin/${id}/status`,
            body,
        );
    }

    /**
     * Search candidatures (Admin)
     */
    searchCandidatures(
        query: string,
        page: number = 0,
        size: number = 10,
    ): Observable<PageResponse<CandidatureRedstarter>> {
        const params = new HttpParams()
            .set('query', query)
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<CandidatureRedstarter>>(
            `${this.apiUrl}/admin/search`,
            { params },
        );
    }

    /**
     * Get statistics (Admin)
     */
    getStatistics(): Observable<{ [key: string]: number }> {
        return this.http.get<{ [key: string]: number }>(
            `${this.apiUrl}/admin/statistics`,
        );
    }

    /**
     * Delete candidature (Admin)
     */
    deleteCandidature(id: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.apiUrl}/admin/${id}`);
    }
}
