import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Livrable } from '../models/livrable.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environment';

export interface LivrableFilters {
    programmeId?: string;
    statut?: string;
    entrepreneurId?: string;
    coachId?: string;
}

@Injectable({ providedIn: 'root' })
export class LivrableService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/livrables`;

    getAll(filters?: LivrableFilters): Observable<ApiResponse<Livrable[]>> {
        let params = new HttpParams();
        if (filters?.programmeId) params = params.set('programmeId', filters.programmeId);
        if (filters?.statut) params = params.set('statut', filters.statut);
        if (filters?.entrepreneurId) params = params.set('entrepreneurId', filters.entrepreneurId);
        if (filters?.coachId) params = params.set('coachId', filters.coachId);
        return this.http.get<ApiResponse<Livrable[]>>(this.baseUrl, { params });
    }

    getById(id: string): Observable<Livrable> {
        return this.http.get<Livrable>(`${this.baseUrl}/${id}`);
    }

    upload(programmeId: string, entrepreneurIds: string[], file: File, meta: Partial<Livrable>): Observable<ApiResponse<Livrable[]>> {
        const form = new FormData();
        form.append('file', file);
        form.append('programmeId', programmeId);
        entrepreneurIds.forEach(id => form.append('entrepreneurIds', id));
        form.append('titre', meta.titre ?? file.name);
        form.append('type', meta.type ?? 'Document');
        return this.http.post<ApiResponse<Livrable[]>>(`${this.baseUrl}/upload`, form);
    }

    updateStatus(id: string, statut: Livrable['statut']): Observable<ApiResponse<Livrable>> {
        return this.http.patch<ApiResponse<Livrable>>(`${this.baseUrl}/${id}/statut`, { statut });
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
