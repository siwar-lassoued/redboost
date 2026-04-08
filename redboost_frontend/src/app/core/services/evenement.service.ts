import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evenement } from '../models/evenement.model';
import { environment } from '../../../environment';

export interface EvenementFilters {
    programmeId?: string;
    coachId?: string;
    dateDebut?: string;
    dateFin?: string;
}

@Injectable({ providedIn: 'root' })
export class EvenementService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/evenements`;

    getAll(filters?: EvenementFilters): Observable<Evenement[]> {
        let params = new HttpParams();
        if (filters?.programmeId) params = params.set('programmeId', filters.programmeId);
        if (filters?.coachId) params = params.set('coachId', filters.coachId);
        if (filters?.dateDebut) params = params.set('dateDebut', filters.dateDebut);
        if (filters?.dateFin) params = params.set('dateFin', filters.dateFin);
        return this.http.get<Evenement[]>(this.baseUrl, { params });
    }

    getById(id: string): Observable<Evenement> {
        return this.http.get<Evenement>(`${this.baseUrl}/${id}`);
    }

    create(data: Partial<Evenement>): Observable<Evenement> {
        return this.http.post<Evenement>(this.baseUrl, data);
    }

    update(id: string, data: Partial<Evenement>): Observable<Evenement> {
        return this.http.put<Evenement>(`${this.baseUrl}/${id}`, data);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
