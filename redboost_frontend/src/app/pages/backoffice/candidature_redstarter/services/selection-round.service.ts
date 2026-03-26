import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environment';
import { SelectionRound, SelectionRoundCandidature } from '../models/selection-round.model';

@Injectable({ providedIn: 'root' })
export class SelectionRoundService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/selection-rounds`;

    advanceRound(programmeId: string): Observable<SelectionRound> {
        return this.http.post<SelectionRound>(`${this.apiUrl}/advance?programmeId=${programmeId}`, {});
    }

    getRoundsForProgramme(programmeId: string): Observable<SelectionRound[]> {
        return this.http.get<SelectionRound[]>(`${this.apiUrl}/programmes/${programmeId}`);
    }

    getCandidaturesForRound(roundId: string): Observable<SelectionRoundCandidature[]> {
        return this.http.get<SelectionRoundCandidature[]>(`${this.apiUrl}/${roundId}/candidatures`);
    }
}
