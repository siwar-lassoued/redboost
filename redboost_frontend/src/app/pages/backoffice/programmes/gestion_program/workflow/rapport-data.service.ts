import { environment } from '../../../../../../environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RapportDTO, KpiLightDTO, SprintDetail, DocumentConsolide } from '../../../../../models/rapport.model';

@Injectable({
    providedIn: 'root'
})
export class RapportDataService {
    private apiUrl = `${environment.apiUrl}/rapports`;
    private backofficeUrl = `${environment.apiUrl}/backoffice/programmes`;

    // State management
    private rapportSubject = new BehaviorSubject<RapportDTO | null>(null);
    public rapport$ = this.rapportSubject.asObservable();

    private kpisSubject = new BehaviorSubject<KpiLightDTO[]>([]);
    public kpis$ = this.kpisSubject.asObservable();

    private sprintsSubject = new BehaviorSubject<SprintDetail[]>([]);
    public sprints$ = this.sprintsSubject.asObservable();

    private documentsSubject = new BehaviorSubject<DocumentConsolide[]>([]);
    public documents$ = this.documentsSubject.asObservable();

    constructor(private http: HttpClient) {}

    // Rapport CRUD
    loadRapport(id: number): Observable<RapportDTO> {
        return this.http.get<RapportDTO>(`${this.apiUrl}/${id}`).pipe(
            tap(rapport => this.rapportSubject.next(rapport))
        );
    }

    loadRapportByProgramme(programmeId: number): Observable<RapportDTO> {
        return this.http.get<RapportDTO>(`${this.apiUrl}/programme/${programmeId}`).pipe(
            tap(rapport => this.rapportSubject.next(rapport))
        );
    }

    saveRapport(rapportData: RapportDTO, rapportId?: number): Observable<RapportDTO> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        
        const request = rapportId
            ? this.http.put<RapportDTO>(`${this.apiUrl}/${rapportId}`, rapportData, { headers })
            : this.http.post<RapportDTO>(this.apiUrl, rapportData, { headers });

        return request.pipe(
            tap(rapport => this.rapportSubject.next(rapport))
        );
    }

    // KPIs
    loadKpis(programmeId: number): Observable<KpiLightDTO[]> {
        return this.http.get<KpiLightDTO[]>(`${this.apiUrl}/programme/${programmeId}/kpis`).pipe(
            tap(kpis => this.kpisSubject.next(kpis))
        );
    }

    getKpis(): KpiLightDTO[] {
        return this.kpisSubject.value;
    }

    // Sprints
    loadSprints(programmeId: number): Observable<SprintDetail[]> {
        return this.http.get<SprintDetail[]>(`${this.backofficeUrl}/${programmeId}/sprints`).pipe(
            tap(sprints => this.sprintsSubject.next(sprints))
        );
    }

    loadSprintDetails(sprintIds: number[]): Observable<SprintDetail[]> {
        const requests = sprintIds.map(id =>
            this.http.get<SprintDetail>(`${this.backofficeUrl}/sprints/${id}/full-detail`)
        );
        
        return new Observable(observer => {
            import('rxjs').then(({ forkJoin }) => {
                forkJoin(requests).subscribe({
                    next: (sprints) => {
                        observer.next(sprints);
                        observer.complete();
                    },
                    error: (error) => observer.error(error)
                });
            });
        });
    }

    updateActivity(activityId: number, field: string, value: any): Observable<any> {
        const patchData: { [key: string]: any } = {};
        patchData[field] = value;
        return this.http.patch(`${this.backofficeUrl}/activities/${activityId}/fields`, patchData);
    }

    // Documents
    loadDocuments(programmeId: number): Observable<DocumentConsolide[]> {
        return this.http.get<any[]>(`${this.backofficeUrl}/${programmeId}/documents`).pipe(
            tap(docs => {
                const mapped = docs.map(d => this.mapDocument(d));
                this.documentsSubject.next(mapped);
            })
        );
    }

    private mapDocument(d: any): DocumentConsolide {
        return {
            sprint: d.sprintNom || '',
            activity: d.activiteNom || null,
            task: d.tacheTitre || '',
            documentName: d.nomFichier || '',
            author: d.uploadedByName || 'Système',
            date: this.formatDate(d.date),
            fileType: this.extractFileType(d.typeFichier || d.nomFichier),
            cheminFichier: d.cheminFichier || '',
            documentId: d.documentId || 0,
            niveau: d.niveau || ''
        };
    }

    // ─── Export — PDF ─────────────────────────────────────────────────────────

    exportToPdf(rapportId: number, startDate?: string, endDate?: string): Observable<Blob> {
        const params: any = {};
        if (startDate) params['startDate'] = startDate;
        if (endDate)   params['endDate']   = endDate;
        return this.http.get(`${this.apiUrl}/${rapportId}/export/pdf`, {
            params,
            responseType: 'blob'
        });
    }

    exportExpertiseFrancePdf(rapportId: number, startDate?: string, endDate?: string): Observable<Blob> {
        const params: any = {};
        if (startDate) params['startDate'] = startDate;
        if (endDate)   params['endDate']   = endDate;
        return this.http.get(`${this.apiUrl}/${rapportId}/export/expertise-france/pdf`, {
            params,
            responseType: 'blob'
        });
    }

    // ─── Export — DOCX ────────────────────────────────────────────────────────

    exportToDocx(rapportId: number, startDate?: string, endDate?: string): Observable<Blob> {
        const params: any = {};
        if (startDate) params['startDate'] = startDate;
        if (endDate)   params['endDate']   = endDate;
        return this.http.get(`${this.apiUrl}/${rapportId}/export/docx`, {
            params,
            responseType: 'blob'
        });
    }

    exportExpertiseFranceDocx(rapportId: number, startDate?: string, endDate?: string): Observable<Blob> {
        const params: any = {};
        if (startDate) params['startDate'] = startDate;
        if (endDate)   params['endDate']   = endDate;
        return this.http.get(`${this.apiUrl}/${rapportId}/export/expertise-france/docx`, {
            params,
            responseType: 'blob'
        });
    }

    // ─── Drive share ──────────────────────────────────────────────────────────

    shareToDrive(
        rapportId: number,
        startDate?: string,
        endDate?: string,
        template: 'standard' | 'expertise' = 'standard'
    ): Observable<any> {
        const params: any = {};
        if (startDate) params['startDate'] = startDate;
        if (endDate)   params['endDate']   = endDate;
        params['template'] = template === 'expertise' ? 'EXPERTISE_FRANCE' : 'STANDARD';

        return this.http.post<any>(`${this.apiUrl}/${rapportId}/share/drive`, {}, { params });
    }

    // ─── Utility ─────────────────────────────────────────────────────────────

    private formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    private extractFileType(fileNameOrType: string): string {
        if (!fileNameOrType) return 'file';
        
        if (fileNameOrType.includes('/')) {
            if (fileNameOrType.includes('pdf')) return 'pdf';
            if (fileNameOrType.includes('spreadsheet') || fileNameOrType.includes('excel')) return 'xlsx';
            if (fileNameOrType.includes('word') || fileNameOrType.includes('document')) return 'docx';
            if (fileNameOrType.includes('image')) return 'image';
            return 'file';
        }
        
        const ext = fileNameOrType.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return 'pdf';
            case 'docx':
            case 'doc': return 'docx';
            case 'xlsx':
            case 'xls': return 'xlsx';
            case 'jpg':
            case 'jpeg':
            case 'png': return 'image';
            default: return 'file';
        }
    }
}