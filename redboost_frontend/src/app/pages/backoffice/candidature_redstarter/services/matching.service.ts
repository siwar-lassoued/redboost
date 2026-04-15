import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environment';

export interface MatchingSession {
    id: number;
    programmeId: number;
    thematiqueId?: number;
    statut: 'EN_ATTENTE' | 'VALIDE' | 'ARCHIVE';
    nbMatchings: number;
    dateMatching: string;
    dateValidation?: string;
    valideParId?: number;
    alertesJson?: string;
    matchings?: MatchingItem[];
}

export interface MatchingItem {
    id: number;
    coachId: number;
    entrepreneurId: number;
    programmeId: number;
    thematiqueId?: number;
    scoreIa: number;
    scoresDetail?: string;
    justification: string;
    pointsForts?: string;
    pointsAttention?: string;
    recommandationSession1?: string;
    decisionSupport?: string;
    rankTop?: number;
    statut: 'PROPOSE' | 'VALIDE' | 'TERMINE' | 'LIBERE';
    dateValidation?: string;
}

@Injectable({ providedIn: 'root' })
export class MatchingService {
    private readonly baseUrl = `${environment.apiUrl}/matching`;

    constructor(private http: HttpClient) {}

    runMatchingIA(programmeId: number, thematiqueId?: number): Observable<MatchingSession> {
        const params: any = {};
        if (thematiqueId) params.thematiqueId = thematiqueId;
        return this.http.post<MatchingSession>(`${this.baseUrl}/run/${programmeId}`, {}, { params });
    }

    validateSession(sessionId: number, adminId: number): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/session/${sessionId}/validate`, null, {
            params: { adminId }
        });
    }

    validateSingle(matchingId: number, adminId: number): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/validate/single/${matchingId}`, null, {
            params: { adminId }
        });
    }

    getSessionDetails(sessionId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/session/${sessionId}/details`);
    }

    getHistory(programmeId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/history/${programmeId}`);
    }

    getHistoryByThematique(programmeId: number, thematiqueId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/history/${programmeId}/thematique/${thematiqueId}`);
    }

    getMatchingStats(programmeId: number): Observable<{ activeCount: number, unmatchedCount: number }> {
        return this.http.get<{ activeCount: number, unmatchedCount: number }>(`${this.baseUrl}/stats/${programmeId}`);
    }

    getManualCandidates(programmeId: number, thematiqueId: number): Observable<{ programme: string; thematique: string; entrepreneurs: any[]; coaches: any[] }> {
        return this.http.get<any>(`${this.baseUrl}/manual/candidates/${programmeId}`, { params: { thematiqueId } });
    }

    createManualMatching(entrepreneurId: number, coachId: number, programmeId: number,
                         thematiqueId: number, note?: string): Observable<any> {
        const params: any = { entrepreneurId, coachId, programmeId, thematiqueId };
        if (note) params.note = note;
        return this.http.post<any>(`${this.baseUrl}/manual`, null, { params });
    }

    updateManualMatching(matchingId: number, coachId?: number, entrepreneurId?: number, note?: string): Observable<any> {
        const params: any = {};
        if (coachId) params.coachId = coachId;
        if (entrepreneurId) params.entrepreneurId = entrepreneurId;
        if (note) params.note = note;
        return this.http.put<any>(`${this.baseUrl}/manual/${matchingId}`, null, { params });
    }
}
