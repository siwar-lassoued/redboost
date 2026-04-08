import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environment';

export interface DisponibiliteSlot {
    id: string;
    coachId: string;
    programmeId: string;
    dateDebut: string;
    dateFin: string;
    dureeMinutes: number;
    statut: 'LIBRE' | 'RESERVE' | 'ANNULE';
    recurrent: boolean;
    recurrenceRule?: string;
}

export interface DisponibiliteRequest {
    dateDebut: string;
    dateFin: string;
    dureeMinutes: number;
    recurrent: boolean;
    recurrenceRule?: string;
}

@Injectable({ providedIn: 'root' })
export class DisponibiliteService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/disponibilites`;

    addSlots(coachId: string, programmeId: string, slots: DisponibiliteRequest[]): Observable<DisponibiliteSlot[]> {
        return this.http.post<ApiResponse<DisponibiliteSlot[]>>(`${this.baseUrl}/coach/${coachId}/programme/${programmeId}`, slots).pipe(
            map(res => res.data)
        );
    }

    getLibreSlots(coachId: string, programmeId: string): Observable<DisponibiliteSlot[]> {
        return this.http.get<ApiResponse<DisponibiliteSlot[]>>(`${this.baseUrl}/coach/${coachId}/programme/${programmeId}/libre`).pipe(
            map(res => res.data)
        );
    }

    getAllCoachSlots(coachId: string, programmeId?: string): Observable<DisponibiliteSlot[]> {
        const params: any = {};
        if (programmeId) params.programmeId = programmeId;
        return this.http.get<ApiResponse<DisponibiliteSlot[]>>(`${this.baseUrl}/coach/${coachId}`, { params }).pipe(
            map(res => res.data)
        );
    }

    deleteSlot(slotId: string, coachId: string): Observable<void> {
        return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${slotId}`, {
            params: { coachId }
        }).pipe(map(res => res.data));
    }
}
