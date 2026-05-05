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

/** Mirrors SessionService.MyCalendarEvent from the backend */
export interface MyCalendarEvent {
    id: string;
    title: string;
    description?: string;
    dateTime: string;        // ISO-8601
    endDateTime?: string;
    type: 'SESSION' | 'SESSION_SLOT' | 'SEANCE';
    statut: string;          // PLANIFIE | CONFIRME | TERMINE | DISPONIBLE
    meetLink?: string;
    googleEventId?: string;
    coachName?: string;
    entrepreneurName?: string;
    isOnline: boolean;
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

    requestReschedule(sessionId: string, newDate: string, entrepreneurId: number): Observable<any> {
        return this.http.put<any>(
            `${environment.apiUrl}/coach/sessions/${sessionId}/reschedule?newDate=${newDate}&entrepreneurId=${entrepreneurId}`, 
            {}
        );
    }

    /**
     * Unified calendar feed for the current user.
     * Returns all sessions + slots visible to this user, sorted by date.
     */
    getMyCalendar(userId: string | number, role: string): Observable<MyCalendarEvent[]> {
        return this.http.get<MyCalendarEvent[]>(
            `${this.baseUrl}/my-calendar?userId=${userId}&role=${role}`
        );
    }
}
