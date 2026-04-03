import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environment';
import { Session } from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class SessionBookingService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/sessions/booking`;

    book(entrepreneurId: string, disponibiliteId: string, notes: string): Observable<Session> {
        return this.http.post<ApiResponse<Session>>(this.baseUrl, {
            entrepreneurId, disponibiliteId, notes
        }).pipe(map(res => res.data));
    }

    cancel(sessionId: string, requesterId: string, motif?: string): Observable<void> {
        return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${sessionId}`, {
            params: { requesterId, motif: motif || '' }
        }).pipe(map(res => res.data));
    }
}
