import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import {
    KpiActivity,
    KpiCategoryActivity,
    TaskActivity,
} from '../../../models/TaskActivity.modal';
import { throwError } from 'rxjs';
import { environment } from '../../../../environment';

@Injectable({
    providedIn: 'root',
})
export class KpiActivityService {
    private apiUrl = `${environment.apiUrl}/kpi-activities`;

    constructor(private http: HttpClient) {}

    getKpiActivitiesByCategoryId(
        categoryId: number,
    ): Observable<KpiActivity[]> {
        return this.http
            .get<KpiActivity[]>(`${this.apiUrl}/category/${categoryId}`)
            .pipe(map((rawKpis) => this.transformKpiActivities(rawKpis)));
    }

    getKpiActivitiesByTaskActivityId(
        taskActivityId: number,
    ): Observable<KpiActivity[]> {
        return this.http
            .get<KpiActivity[]>(`${this.apiUrl}/task/${taskActivityId}`)
            .pipe(map((rawKpis) => this.transformKpiActivities(rawKpis)));
    }

    private transformKpiActivities(rawKpis: any[]): KpiActivity[] {
        if (!rawKpis) return [];
        return rawKpis.map((rawKpi) => {
            return {
                id: rawKpi.id,
                name: rawKpi.name,
                value: rawKpi.value,
                kpiCategoryActivity: rawKpi.kpiCategoryActivity
                    ? ({
                          id: rawKpi.kpiCategoryActivity.id,
                          name: rawKpi.kpiCategoryActivity.name,
                      } as KpiCategoryActivity)
                    : undefined,
                taskActivity: rawKpi.taskActivity
                    ? {
                          taskActivityId: rawKpi.taskActivity.taskActivityId,
                          title: rawKpi.taskActivity.title || '',
                          xpPoint: rawKpi.taskActivity.xpPoint || 0,
                          activity: rawKpi.taskActivity.activity,
                      }
                    : undefined,
                taskActivityId: rawKpi.taskActivityId,
                lastUpdated: rawKpi.lastUpdated,
            } as KpiActivity;
        });
    }

    createKpiActivity(kpi: KpiActivity): Observable<KpiActivity> {
        if (!kpi.taskActivity?.taskActivityId) {
            console.error('TaskActivityId is required for KPI creation');
            throw new Error('TaskActivityId is required for KPI creation');
        }

        // Restructure the data for the backend
        const kpiData = {
            ...kpi,
            taskActivityId: kpi.taskActivity.taskActivityId, // Add taskActivityId at root level
        };

        return this.http.post<KpiActivity>(this.apiUrl, kpiData);
    }

    updateKpiActivity(id: number, kpi: KpiActivity): Observable<KpiActivity> {
        console.log('Sending KPI update request:', kpi);
        return this.http.put<KpiActivity>(`${this.apiUrl}/${id}`, kpi).pipe(
            tap((response) =>
                console.log('Raw response from server:', response),
            ),
            map((response) => {
                // Ensure all fields are present in the response
                const transformedResponse: KpiActivity = {
                    ...response,
                    taskActivityId: kpi.taskActivityId,
                    kpiCategoryActivity: kpi.kpiCategoryActivity,
                    taskActivity: kpi.taskActivity,
                };
                console.log('Transformed response:', transformedResponse);
                return transformedResponse;
            }),
            tap((response) =>
                console.log('Final KPI update response:', response),
            ),
        );
    }

    deleteKpiActivity(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getKpiHistoryByTaskId(taskActivityId: number): Observable<KpiActivity[]> {
        return this.http
            .get<KpiActivity[]>(`${this.apiUrl}/history/${taskActivityId}`)
            .pipe(map((rawKpis) => this.transformKpiActivities(rawKpis)));
    }
}
