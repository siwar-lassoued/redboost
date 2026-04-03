import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Session } from '../models/session.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environment';

export interface SessionFilters {
    programmeId?: string;
    coachId?: string;
    entrepreneurId?: string;
    statut?: string;
    page?: number;
    limit?: number;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/sessions`;

    getAll(filters?: SessionFilters): Observable<Session[]> {
        let params = new HttpParams();
        if (filters?.programmeId) params = params.set('programmeId', filters.programmeId);
        if (filters?.coachId) params = params.set('coachId', filters.coachId);
        if (filters?.entrepreneurId) params = params.set('entrepreneurId', filters.entrepreneurId);
        if (filters?.statut) params = params.set('statut', filters.statut);
        return this.http.get<ApiResponse<Session[]>>(this.baseUrl, { params }).pipe(
            map(res => res.data)
        );
    }

    getByProgramme(programmeId: string): Observable<Session[]> {
        return this.http.get<ApiResponse<Session[]>>(`${this.baseUrl}?programmeId=${programmeId}`).pipe(
            map(res => res.data)
        );
    }

    getByCoach(coachId: string): Observable<Session[]> {
        return this.http.get<ApiResponse<Session[]>>(`${this.baseUrl}/coach/${coachId}`).pipe(
            map(res => res.data)
        );
    }

    getByEntrepreneur(entrepreneurId: string): Observable<Session[]> {
        return this.http.get<ApiResponse<Session[]>>(`${this.baseUrl}/entrepreneur/${entrepreneurId}`).pipe(
            map(res => res.data)
        );
    }

    getById(id: string): Observable<Session> {
        return this.http.get<Session>(`${this.baseUrl}/${id}`);
    }

    create(data: Partial<Session>): Observable<Session> {
        return this.http.post<Session>(this.baseUrl, data);
    }

    update(id: string, data: Partial<Session>): Observable<Session> {
        return this.http.put<Session>(`${this.baseUrl}/${id}`, data);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    requestReschedule(id: string, note: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${id}/reschedule`, { note });
    }
}
