import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Rapport, PeriodType } from '../models/rapport.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environment';
import { map } from 'rxjs/operators';

export interface GenerateRapportRequest {
    programmeId: string;
    dateDebut: string;
    dateFin: string;
    pdfAttachments: { base64: string }[];
}

@Injectable({ providedIn: 'root' })
export class RapportService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/rapports`;

    getHistory(programmeId?: string): Observable<Rapport[]> {
        let params = new HttpParams();
        if (programmeId) params = params.set('programmeId', programmeId);
        return this.http.get<ApiResponse<Rapport[]>>(this.baseUrl, { params }).pipe(
            map(res => res.data || [])
        );
    }

    getById(id: string): Observable<Rapport> {
        return this.http.get<Rapport>(`${this.baseUrl}/${id}`);
    }

    generate(request: GenerateRapportRequest): Observable<Rapport> {
        return this.http.post<Rapport>(`${this.baseUrl}/generate`, request);
    }

    save(rapport: Rapport): Observable<Rapport> {
        return rapport.id
            ? this.http.put<Rapport>(`${this.baseUrl}/${rapport.id}`, rapport)
            : this.http.post<Rapport>(this.baseUrl, rapport);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
