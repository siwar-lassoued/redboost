// src/app/services/backoffice.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import {
    BackofficeCategory,
    BackofficeCategoryRequest,
    BackofficeKpi,
    BackofficeKpiRequest,
} from '../../../models/BackofficeCategory';
import { environment } from '../../../../environment'; // ← Fixed import

@Injectable({ providedIn: 'root' })
export class categorieKpiService {
    // Use environment.apiUrl and build the base path
    private apiUrl = `${environment.apiUrl}/backoffice/categories`;

    // Signals for reactivity
    categories = signal<BackofficeCategory[]>([]);
    loading = signal(false);

    constructor(private http: HttpClient) {}

    loadAll() {
        this.loading.set(true);
        this.http.get<BackofficeCategory[]>(this.apiUrl).subscribe({
            next: (data) => {
                this.categories.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    getById(id: number) {
        return this.http.get<BackofficeCategory>(`${this.apiUrl}/${id}`);
    }

    create(category: BackofficeCategoryRequest) {
        return this.http.post<BackofficeCategory>(this.apiUrl, category);
    }

    update(id: number, category: BackofficeCategoryRequest) {
        return this.http.put<BackofficeCategory>(
            `${this.apiUrl}/${id}`,
            category,
        );
    }

    delete(id: number) {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    // KPI methods
    getKpi(kpiId: number) {
        return this.http.get<BackofficeKpi>(`${this.apiUrl}/kpis/${kpiId}`);
    }

    updateKpi(kpiId: number, kpi: BackofficeKpiRequest) {
        return this.http.put<BackofficeKpi>(
            `${this.apiUrl}/kpis/${kpiId}`,
            kpi,
        );
    }

    addKpi(categoryId: number, kpi: BackofficeKpiRequest) {
        return this.http.post<BackofficeKpi>(
            `${this.apiUrl}/${categoryId}/kpis`,
            kpi,
        );
    }

    deleteKpi(kpiId: number) {
        return this.http.delete(`${this.apiUrl}/kpis/${kpiId}`);
    }
}
