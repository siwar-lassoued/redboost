import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CoachRating, RatingStatus } from '../models/coach-rating.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environment';

export interface RatingFilters {
    coachId?: string;
    entrepreneurId?: string;
    programmeId?: string;
}

@Injectable({ providedIn: 'root' })
export class CoachRatingService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/coach-ratings`;

    getAll(filters?: RatingFilters): Observable<CoachRating[]> {
        let params = new HttpParams();
        if (filters?.coachId) params = params.set('coachId', filters.coachId);
        if (filters?.entrepreneurId) params = params.set('entrepreneurId', filters.entrepreneurId);
        if (filters?.programmeId) params = params.set('programmeId', filters.programmeId);
        return this.http.get<ApiResponse<CoachRating[]>>(this.baseUrl, { params }).pipe(
            map(res => res.data)
        );
    }

    getById(id: string): Observable<CoachRating> {
        return this.http.get<CoachRating>(`${this.baseUrl}/${id}`);
    }

    create(data: Partial<CoachRating>): Observable<CoachRating> {
        return this.http.post<CoachRating>(this.baseUrl, data);
    }

    update(id: string, data: Partial<CoachRating>): Observable<CoachRating> {
        return this.http.put<CoachRating>(`${this.baseUrl}/${id}`, data);
    }

    updateStatus(id: string, status: RatingStatus): Observable<CoachRating> {
        return this.http.patch<CoachRating>(`${this.baseUrl}/${id}/status`, { status });
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
