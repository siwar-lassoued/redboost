import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AiReporting, GenerateReportRequest } from '../models/ai-reporting.model';
import { environment } from '../../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class AiReportingService {
  private http = inject(HttpClient);
  private apiEndpoint = `${environment.apiUrl}/reporting-ia`;

  getHistory(programmeId?: number): Observable<AiReporting[]> {
    let params = new HttpParams();
    if (programmeId) {
      params = params.set('programmeId', programmeId.toString());
    }
    return this.http.get<AiReporting[]>(this.apiEndpoint, { params });
  }

  generateReport(request: GenerateReportRequest): Observable<AiReporting> {
    return this.http.post<AiReporting>(`${this.apiEndpoint}/generate`, request);
  }

  deleteReport(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiEndpoint}/${id}`);
  }
}
