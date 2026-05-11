import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environment';

export interface CoachRating {
    id?: number;
    coach?: { id: number, firstName: string, lastName: string };
    entrepreneur?: { id: number, firstName: string, lastName: string };
    programme?: { id: number, nom: string };
    session?: { id: string, titre: string };
    globalRating: number;
    communication: number;
    expertise: number;
    availability: number;
    impact: number;
    tags?: string;
    commentaire?: string;
    statut?: 'LU' | 'NON_LU' | 'ARCHIVE';
    createdAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class EvaluationService {
    private apiUrl = `${environment.apiUrl}/coach-ratings`;

    constructor(private http: HttpClient) {}

    getAllRatings(): Observable<CoachRating[]> {
        return this.http.get<CoachRating[]>(this.apiUrl);
    }

    getRatingById(id: number): Observable<CoachRating> {
        return this.http.get<CoachRating>(`${this.apiUrl}/${id}`);
    }

    createRating(rating: CoachRating): Observable<CoachRating> {
        return this.http.post<CoachRating>(this.apiUrl, rating);
    }

    updateStatus(id: number, status: 'LU' | 'NON_LU' | 'ARCHIVE'): Observable<CoachRating> {
        return this.http.patch<CoachRating>(`${this.apiUrl}/${id}/status`, { status });
    }

    deleteRating(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
