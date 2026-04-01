import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environment';

@Injectable({ providedIn: 'root' })
export class ProgrammeService {
    private readonly baseUrl = `${environment.apiUrl}/backoffice/programmes`;
    private readonly http = inject(HttpClient);

    getAll(filters?: any): Observable<any> {
        let params = new HttpParams();
        if (filters?.search) params = params.set('search', filters.search);
        if (filters?.statut) params = params.set('statut', filters.statut);
        return this.http.get<any>(this.baseUrl, { params });
    }

    getById(id: string): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/${id}`);
    }
}
