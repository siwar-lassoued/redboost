// src/app/services/programme-dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../environment';

// Interfaces matching backend DTOs
export interface CategoryTaskStats {
    categoryName: string;
    categoryColor: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
}

export interface TaskRealizationByCategoryDTO {
    categories: CategoryTaskStats[];
    totalTasks: number;
    totalCompletedTasks: number;
}

export interface KpiPerformanceStats {
    kpiName: string;
    categoryName: string;
    categoryColor: string;
    unit: string;
    valeurPrecedente: string | null;
    valeurActuelle: string | null;
    valeurCible: string | null;
    achievementRate: number | null;
}

export interface GlobalKpiPerformanceDTO {
    kpis: KpiPerformanceStats[];
    averageAchievementRate: number;
}

export interface CategoryDistributionStats {
    categoryName: string;
    categoryColor: string;
    count: number;
    percentage: number;
    globalKpiCount: number;
    optionnelKpiCount: number;
}

export interface KpiDistributionByCategoryDTO {
    categories: CategoryDistributionStats[];
    totalKpis: number;
}

export interface KpiEvolutionByCategoryDTO {
    categoryName: string;
    categoryColor: string;
    dataPoints: KpiEvolutionDataPoint[];
}

export interface KpiEvolutionDataPoint {
    date: string;
    achievementRate: number;
}

export interface ActivityTypeCounts {
    [activityType: string]: number;
}

// NEW: KPI Statistics by Sprint interfaces
export interface KpiStatistic {
    kpiId: number;
    kpiNom: string;
    uniteMesure: string;
    totalValeur: number;
}

export interface SprintKpiStatistics {
    sprintId: number;
    sprintNom: string;
    kpiStatistics: KpiStatistic[];
}

export interface DashboardData {
    taskRealization: TaskRealizationByCategoryDTO;
    globalKpiPerformance: GlobalKpiPerformanceDTO;
    kpiDistribution: KpiDistributionByCategoryDTO;
    kpiEvolution: KpiEvolutionByCategoryDTO[];
    activityTypeCounts: ActivityTypeCounts;
    sprintKpiStatistics: SprintKpiStatistics[];
}

@Injectable({
    providedIn: 'root',
})
export class ProgrammeDashboardService {
    private apiUrl = `${environment.apiUrl}/backoffice/programmes`;

    constructor(private http: HttpClient) {}

    /**
     * Get task realization by category for a programme
     */
    getTaskRealizationByCategory(
        programmeId: number,
    ): Observable<TaskRealizationByCategoryDTO> {
        return this.http.get<TaskRealizationByCategoryDTO>(
            `${this.apiUrl}/${programmeId}/dashboard/task-realization-by-category`,
        );
    }

    /**
     * Get global KPI performance for a programme
     */
    getGlobalKpiPerformance(
        programmeId: number,
    ): Observable<GlobalKpiPerformanceDTO> {
        return this.http.get<GlobalKpiPerformanceDTO>(
            `${this.apiUrl}/${programmeId}/dashboard/global-kpi-performance`,
        );
    }

    /**
     * Get KPI distribution by category for a programme
     */
    getKpiDistributionByCategory(
        programmeId: number,
    ): Observable<KpiDistributionByCategoryDTO> {
        return this.http.get<KpiDistributionByCategoryDTO>(
            `${this.apiUrl}/${programmeId}/dashboard/kpi-distribution-by-category`,
        );
    }

    /**
     * Get KPI evolution by category for a programme
     */
    getKpiEvolutionByCategory(
        programmeId: number,
    ): Observable<KpiEvolutionByCategoryDTO[]> {
        return this.http.get<KpiEvolutionByCategoryDTO[]>(
            `${this.apiUrl}/${programmeId}/dashboard/kpi-evolution-by-category`,
        );
    }

    /**
     * Get activity type counts for a programme
     */
    getActivityTypeCounts(programmeId: number): Observable<ActivityTypeCounts> {
        return this.http.get<ActivityTypeCounts>(
            `${this.apiUrl}/${programmeId}/activities/count-by-type`
        );
    }

    /**
     * NEW: Get KPI statistics by sprint for a programme
     */
    getKpiStatisticsBySprint(programmeId: number): Observable<SprintKpiStatistics[]> {
        return this.http.get<SprintKpiStatistics[]>(
            `${this.apiUrl}/${programmeId}/kpi-statistics`
        );
    }

    /**
     * Get all dashboard data at once (optimized)
     */
    getDashboardData(programmeId: number): Observable<DashboardData> {
        return forkJoin({
            taskRealization: this.getTaskRealizationByCategory(programmeId),
            globalKpiPerformance: this.getGlobalKpiPerformance(programmeId),
            kpiDistribution: this.getKpiDistributionByCategory(programmeId),
            kpiEvolution: this.getKpiEvolutionByCategory(programmeId),
            activityTypeCounts: this.getActivityTypeCounts(programmeId),
            sprintKpiStatistics: this.getKpiStatisticsBySprint(programmeId),
        });
    }
}