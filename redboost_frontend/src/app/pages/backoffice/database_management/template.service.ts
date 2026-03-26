// services/template.service.ts
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../frontoffice/service/auth.service';
import {
    CreateTemplateRequest,
    TemplateResponse,
    TemplateStats,
    TemplateDataRow,
    ExportDataRequest,
} from '../../../models/template.models';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class TemplateService {
    private apiUrl = 'http://localhost:8087/api/templates';

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) {}

    private getHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        const headers: any = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return new HttpHeaders(headers);
    }

    // ==================== TEMPLATE CRUD ====================

    getAllTemplates(): Observable<TemplateResponse[]> {
        return this.http.get<TemplateResponse[]>(this.apiUrl, {
            headers: this.getHeaders(),
        });
    }

    getTemplate(id: number): Observable<TemplateResponse> {
        return this.http.get<TemplateResponse>(`${this.apiUrl}/${id}`, {
            headers: this.getHeaders(),
        });
    }

    createTemplate(
        request: CreateTemplateRequest,
    ): Observable<TemplateResponse> {
        return this.http.post<TemplateResponse>(this.apiUrl, request, {
            headers: this.getHeaders(),
        });
    }

    updateTemplate(
        id: number,
        request: CreateTemplateRequest,
    ): Observable<TemplateResponse> {
        return this.http.put<TemplateResponse>(
            `${this.apiUrl}/${id}`,
            request,
            {
                headers: this.getHeaders(),
            },
        );
    }

    deleteTemplate(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, {
            headers: this.getHeaders(),
        });
    }

    getTemplateStats(): Observable<TemplateStats> {
        // Calculate stats from templates
        return new Observable((observer) => {
            this.getAllTemplates().subscribe({
                next: (templates) => {
                    const stats: TemplateStats = {
                        totalBases: templates.length,
                        totalEnregistrements: 0, // Will be updated when we have data
                        basesPrincipales: templates.length, // Or implement logic to determine principal bases
                    };
                    observer.next(stats);
                    observer.complete();
                },
                error: (error) => observer.error(error),
            });
        });
    }

    // ==================== DATA OPERATIONS ====================

    addDataRow(
        templateId: number,
        rowData: any,
    ): Observable<{ rowId: string; message: string }> {
        return this.http.post<{ rowId: string; message: string }>(
            `${this.apiUrl}/${templateId}/data`,
            rowData,
            { headers: this.getHeaders() },
        );
    }

    getAllData(templateId: number): Observable<TemplateDataRow[]> {
        return this.http.get<TemplateDataRow[]>(
            `${this.apiUrl}/${templateId}/data`,
            { headers: this.getHeaders() },
        );
    }

    getDataRow(templateId: number, rowId: string): Observable<TemplateDataRow> {
        return this.http.get<TemplateDataRow>(
            `${this.apiUrl}/${templateId}/data/${rowId}`,
            { headers: this.getHeaders() },
        );
    }

    updateDataRow(
        templateId: number,
        rowId: string,
        rowData: any,
    ): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(
            `${this.apiUrl}/${templateId}/data/${rowId}`,
            rowData,
            { headers: this.getHeaders() },
        );
    }

    deleteDataRow(templateId: number, rowId: string): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/${templateId}/data/${rowId}`,
            { headers: this.getHeaders() },
        );
    }

    // ==================== IMPORT/EXPORT ====================

    importExcel(templateId: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);

        const token = this.authService.getToken();
        const headers: any = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return this.http.post(
            `${this.apiUrl}/${templateId}/import/excel`,
            formData,
            { headers: new HttpHeaders(headers) },
        );
    }

    importCSV(templateId: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);

        const token = this.authService.getToken();
        const headers: any = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return this.http.post(
            `${this.apiUrl}/${templateId}/import/csv`,
            formData,
            { headers: new HttpHeaders(headers) },
        );
    }

    exportExcel(
        templateId: number,
        columnIds?: number[],
        includeHeaders: boolean = true,
    ): Observable<Blob> {
        const body = {
            columnIds: columnIds,
            exportFormat: 'EXCEL',
            includeHeaders: includeHeaders,
        };

        return this.http.post(`${this.apiUrl}/${templateId}/export`, body, {
            headers: this.getHeaders(),
            responseType: 'blob',
        });
    }

    exportCSV(
        templateId: number,
        columnIds?: number[],
        includeHeaders: boolean = true,
    ): Observable<Blob> {
        const body = {
            columnIds: columnIds,
            exportFormat: 'CSV',
            includeHeaders: includeHeaders,
        };

        return this.http.post(`${this.apiUrl}/${templateId}/export`, body, {
            headers: this.getHeaders(),
            responseType: 'blob',
        });
    }

    // Add this method to your TemplateService

    exportData(
        templateId: number,
        request: ExportDataRequest,
    ): Observable<Blob> {
        const url = `${this.apiUrl}/${templateId}/export`;

        return this.http
            .post(url, request, {
                responseType: 'blob',
                observe: 'response',
            })
            .pipe(map((response: HttpResponse<Blob>) => response.body as Blob));
    }

    // Keep your existing downloadFile method
    downloadFile(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}
