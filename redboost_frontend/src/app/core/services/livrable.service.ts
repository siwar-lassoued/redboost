import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Livrable } from '../models/livrable.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environment';

export interface LivrableFilters {
    programmeId?: string;
    statut?: string;
    entrepreneurId?: string | number;
    coachId?: string | number;
}

@Injectable({ providedIn: 'root' })
export class LivrableService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/livrables`;

    getAll(filters?: LivrableFilters): Observable<any> {
        let params = new HttpParams();
        if (filters?.programmeId) params = params.set('programmeId', filters.programmeId.toString());
        if (filters?.statut) params = params.set('statut', filters.statut);
        if (filters?.entrepreneurId) params = params.set('entrepreneurId', filters.entrepreneurId.toString());
        if (filters?.coachId) params = params.set('coachId', filters.coachId.toString());
        return this.http.get<any>(this.baseUrl, { params });
    }

    getReceived(coachId: number | string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/received?coachId=${coachId}`);
    }

    getSent(coachId: number | string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/sent?coachId=${coachId}`);
    }

    getById(id: string): Observable<Livrable> {
        return this.http.get<Livrable>(`${this.baseUrl}/${id}`);
    }

    /**
     * Upload a file to the server and create livrable records.
     * @param programmeId  optional programme ID
     * @param entrepreneurIds  list of entrepreneur user IDs
     * @param file  the file to upload
     * @param meta  titre, type fields
     * @param coachId  optional coach ID so the backend can record the uploader
     */
    upload(
        programmeId: string,
        entrepreneurIds: string[],
        file: File,
        meta: Partial<Livrable>,
        coachId?: string | number
    ): Observable<any> {
        const form = new FormData();
        form.append('file', file);
        if (programmeId) form.append('programmeId', programmeId);
        entrepreneurIds.forEach(id => form.append('entrepreneurIds', id));
        form.append('titre', meta.titre ?? file.name);
        form.append('type', meta.type ?? 'Document');
        if (coachId) form.append('coachId', coachId.toString());
        return this.http.post<any>(`${this.baseUrl}/upload`, form);
    }

    updateStatus(id: string, statut: Livrable['statut'], coachComment?: string): Observable<any> {
        return this.http.patch<any>(`${this.baseUrl}/${id}/statut`, { statut, coachComment });
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
