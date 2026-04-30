
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface BookingInfo {
  sessionId: string;
  entrepreneurName: string;
  entrepreneurEmail: string;
  entrepreneurId: number;
  statut: 'CONFIRME' | 'EN_ATTENTE' | 'ANNULE' | 'TERMINE';
  meetLink?: string;
  notesEntrepreneur?: string;
}

export interface SlotWithBookings {
  slotId: number;
  titre: string;
  dateSession: string;
  heureDebut: string;
  heureFin: string;
  typeSession: 'EN_LIGNE' | 'PRESENTIEL';
  thematique?: string;
  thematiqueId?: number;
  bookings: BookingInfo[];
  isBooked: boolean;
}

export interface ExceptionalSession {
  id: number;
  titre: string;
  dateSeance: string;
  heureDebut: string;
  heureFin: string;
  entrepreneurName: string;
  entrepreneurId: number;
  typeSession: 'EN_LIGNE' | 'PRESENTIEL';
}

export interface PlanningStats {
  totalSlots: number;
  bookedSlots: number;
  exceptionalCount: number;
  upcomingCount: number;
}

export interface CoachPlanningDTO {
  slots: SlotWithBookings[];
  exceptional: ExceptionalSession[];
  stats: PlanningStats;
}

@Injectable({ providedIn: 'root' })
export class CoachPlanningService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/coach`;

  getPlanning(coachId: number): Observable<CoachPlanningDTO> {
    return this.http.get<CoachPlanningDTO>(`${this.baseUrl}/${coachId}/planning`);
  }
}