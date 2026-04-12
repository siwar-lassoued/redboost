import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Tache, TacheStatus } from '../models/tache.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environment';

export interface TacheFilters {
    programmeId?: string;
    assigneA?: string;
    statut?: TacheStatus;
    page?: number;
    limit?: number;
}

@Injectable({ providedIn: 'root' })
export class TacheService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/taches`;

    getAll(filters?: TacheFilters): Observable<Tache[]> {
        let params = new HttpParams();
        if (filters?.programmeId) params = params.set('programmeId', filters.programmeId);
        if (filters?.assigneA) params = params.set('assigneA', filters.assigneA);
        if (filters?.statut) params = params.set('statut', filters.statut);
        return this.http.get<ApiResponse<Tache[]>>(this.baseUrl, { params }).pipe(
            map(res => res.data)
        );
    }

    getByProgramme(programmeId: string): Observable<Tache[]> {
        return this.http.get<ApiResponse<Tache[]>>(`${this.baseUrl}?programmeId=${programmeId}`).pipe(
            map(res => res.data)
        );
    }

    getByUser(userId: string): Observable<Tache[]> {
        return this.http.get<ApiResponse<Tache[]>>(`${this.baseUrl}/assignee/${userId}`).pipe(
            map(res => res.data)
        );
    }

    getById(id: string): Observable<Tache> {
        return this.http.get<Tache>(`${this.baseUrl}/${id}`);
    }

    create(data: Partial<Tache>): Observable<Tache> {
        return this.http.post<ApiResponse<Tache>>(this.baseUrl, data).pipe(
            map(res => res.data)
        );
    }

    update(id: string, data: Partial<Tache>): Observable<Tache> {
        return this.http.put<ApiResponse<Tache>>(`${this.baseUrl}/${id}`, data).pipe(
            map(res => res.data)
        );
    }

    updateStatus(id: string, statut: TacheStatus): Observable<Tache> {
        return this.http.put<ApiResponse<Tache>>(`${this.baseUrl}/${id}/statut`, { statut }).pipe(
            map(res => res.data)
        );
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    uploadDocuments(tacheId: number, files: File[], uploadedById: number): Observable<any[]> {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('uploadedById', uploadedById.toString());

        return this.http.post<any[]>(`${this.baseUrl}/documents/upload/${tacheId}`, formData);
    }

    getDocumentsByTache(tacheId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/documents/${tacheId}`);
    }

    deleteDocument(documentId: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/documents/${documentId}`);
    }
}
