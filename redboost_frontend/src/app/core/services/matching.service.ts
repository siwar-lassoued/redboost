import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environment';

export interface MatchingSession {
    id: string;
    programmeId: string;
    statut: 'EN_ATTENTE' | 'VALIDE' | 'ARCHIVE';
    nbMatchings: number;
    dateMatching: string;
    dateValidation?: string;
    valideParId?: string;
    alertesJson?: string;
    matchings?: any[];
}

export interface MatchingView {
    id: string; // entrepreneur id
    nom: string;
    startup?: string;
    sector?: string;
    specialite?: string; // for coach
    calendlyUrl?: string;
    programmeId: string;
    programmeName?: string;
    scoreMatching: number;
    progressMatching?: number;
    justificationMatching: string;
    pointsForts: string; // JSON string
    tasksOverdue?: number;
    progress?: number;
    recommandationSession1?: string;
}

@Injectable({ providedIn: 'root' })
export class MatchingService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/matching`;

    runMatchingIA(programmeId: string): Observable<MatchingSession> {
        return this.http.post<ApiResponse<MatchingSession>>(`${this.baseUrl}/run/${programmeId}`, {}).pipe(
            map(res => res.data)
        );
    }

    validateSession(sessionId: string, adminId: string): Observable<void> {
        return this.http.post<ApiResponse<void>>(`${this.baseUrl}/session/${sessionId}/validate`, null, {
            params: { adminId }
        }).pipe(map(res => res.data));
    }

    validateSingle(matchingId: string, adminId: string): Observable<void> {
        return this.http.post<ApiResponse<void>>(`${this.baseUrl}/validate/single/${matchingId}`, null, {
            params: { adminId }
        }).pipe(map(res => res.data));
    }

    getCoachEntrepreneurs(coachId: string): Observable<MatchingView[]> {
        return this.http.get<ApiResponse<MatchingView[]>>(`${this.baseUrl}/coach/${coachId}/entrepreneurs`).pipe(
            map(res => res.data)
        );
    }

    getEntrepreneurCoaches(entrepreneurId: string): Observable<MatchingView[]> {
        return this.http.get<MatchingView[]>(`${this.baseUrl}/entrepreneur/${entrepreneurId}/coaches`);
    }

    releaseEntrepreneur(matchingId: string): Observable<void> {
        return this.http.post<ApiResponse<void>>(`${this.baseUrl}/release/${matchingId}`, {}).pipe(
            map(res => res.data)
        );
    }

    getHistory(programmeId: string): Observable<any[]> {
        return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/history/${programmeId}`).pipe(
            map(res => res.data)
        );
    }

    getMatchingStats(programmeId: string): Observable<{ activeCount: number, unmatchedCount: number }> {
        return this.http.get<ApiResponse<{ activeCount: number, unmatchedCount: number }>>(`${this.baseUrl}/stats/${programmeId}`).pipe(
            map(res => res.data)
        );
    }
}
