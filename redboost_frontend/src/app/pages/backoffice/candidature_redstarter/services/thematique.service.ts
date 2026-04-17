import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environment';

export interface ThematiqueCoaching {
    id?: number;
    programmeId: number;
    nom: string;
    description?: string;
    dateDebut: string;
    dateFin: string;
    statut?: 'ACTIVE' | 'TERMINEE' | 'ANNULEE';
    createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ThematiqueService {
    private readonly baseUrl = `${environment.apiUrl}/thematiques`;

    constructor(private http: HttpClient) {}

    create(thematique: ThematiqueCoaching): Observable<ThematiqueCoaching> {
        return this.http.post<ThematiqueCoaching>(this.baseUrl, thematique);
    }

    getAll(): Observable<ThematiqueCoaching[]> {
        return this.http.get<ThematiqueCoaching[]>(this.baseUrl);
    }

    getByProgramme(programmeId: number): Observable<ThematiqueCoaching[]> {
        return this.http.get<ThematiqueCoaching[]>(`${this.baseUrl}/programme/${programmeId}`);
    }

    getActiveByProgramme(programmeId: number): Observable<ThematiqueCoaching[]> {
        return this.http.get<ThematiqueCoaching[]>(`${this.baseUrl}/programme/${programmeId}/active`);
    }

    update(id: number, thematique: ThematiqueCoaching): Observable<ThematiqueCoaching> {
        return this.http.put<ThematiqueCoaching>(`${this.baseUrl}/${id}`, thematique);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
