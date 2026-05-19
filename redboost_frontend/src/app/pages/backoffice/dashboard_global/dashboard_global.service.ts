import { environment } from '../../../../environment';
// src/app/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardGlobalDTO {
  programStats: ProgramStatsDTO;
  globalIndicators: Record<string, GlobalIndicatorDTO[]>; // Changed to categorized structure
  optionnelIndicators: Record<string, GlobalIndicatorDTO[]>; // ← ADD THIS

  platformMetrics: PlatformMetricsDTO;
  smallStats: SmallStatsDTO;
}

export interface ProgramStatsDTO {
  totalProgrammes: number;
  totalBeneficiaires: number;
  programmesEnCours: number;
  programmesEnRetard: number;
}

export interface GlobalIndicatorDTO {
  title: string;
  value: string;
  trend: string;
  period: string;
  icon: string;
  color: string;
  bg: string;
  category: string;
  info: string; // ← ADD THIS
}

export interface PlatformMetricsDTO {
  totalUtilisateurs: number;
  utilisateursActifs: number;
  utilisateursInactifs: number;
  totalLivrables: number;
  livrablesValides: number;
  livrablesEnCours: number;
  totalCoachs: number;
  coachsCertifies: number;
  coachsStagiaires: number;
  candidaturesCoach: number;
  candidaturesSemaine: number;
  candidaturesRevision: number;
}

export interface SmallStatsDTO {
  moyenneBeneficiaires: number;
  tauxCompletion: number;
  programmesPlanifies: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/backoffice/programmes`;

  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<DashboardGlobalDTO> {
    return this.http.get<DashboardGlobalDTO>(`${this.apiUrl}/dashboard-global`);
  }

  getActivityTypesCount() {
    return this.http.get<Record<string, number>>(
      `${environment.apiUrl}/backoffice/programmes/activities/count-by-type-global`
    );
  }
}