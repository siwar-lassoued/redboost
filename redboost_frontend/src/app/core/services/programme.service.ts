import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Programme, ProgrammeStatus } from '../models/programme.model';
import { PaginatedResponse } from '../models/api-response.model';
import { environment } from '../../../environment';

export interface ProgrammeFilters {
    search?: string;
    statut?: ProgrammeStatus;
    annee?: number;
    secteur?: string;
    page?: number;
    limit?: number;
}

export interface ProgrammeStats {
    total: number;
    enCours: number;
    planifies: number;
    termines: number;
}

@Injectable({ providedIn: 'root' })
export class ProgrammeService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/programmes`;

    getAll(filters?: ProgrammeFilters): Observable<PaginatedResponse<Programme>> {
        let params = new HttpParams();
        if (filters?.search) params = params.set('search', filters.search);
        if (filters?.statut) params = params.set('statut', filters.statut);
        if (filters?.annee) params = params.set('annee', filters.annee.toString());
        if (filters?.secteur) params = params.set('secteur', filters.secteur);
        if (filters?.page) params = params.set('page', filters.page.toString());
        if (filters?.limit) params = params.set('limit', filters.limit.toString());
        return this.http.get<PaginatedResponse<Programme>>(this.baseUrl, { params });
    }

    getById(id: string): Observable<Programme> {
        return this.http.get<Programme>(`${this.baseUrl}/${id}`);
    }

    create(data: Partial<Programme>): Observable<Programme> {
        return this.http.post<Programme>(this.baseUrl, data);
    }

    update(id: string, data: Partial<Programme>): Observable<Programme> {
        return this.http.put<Programme>(`${this.baseUrl}/${id}`, data);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    uploadLogo(id: string, file: File): Observable<{ url: string }> {
        const form = new FormData();
        form.append('file', file);
        return this.http.post<{ url: string }>(`${this.baseUrl}/${id}/logo`, form);
    }

    getStats(): Observable<ProgrammeStats> {
        return this.http.get<ProgrammeStats>(`${this.baseUrl}/stats`);
    }
}
