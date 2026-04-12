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

    book(entrepreneurId: string, disponibiliteId: string, notes: string): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/coach/sessions/${disponibiliteId}/book?entrepreneurId=${entrepreneurId}`, { notes });
    }

    cancel(sessionId: string, requesterId: string, motif?: string): Observable<void> {
        // Fallback for cancellation not yet migrated to new API
        return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${sessionId}`, {
            params: { requesterId, motif: motif || '' }
        }).pipe(map(res => res.data));
    }
}
