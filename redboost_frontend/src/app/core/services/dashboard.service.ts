import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environment';

export interface DashboardKpis {
    [key: string]: number;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = `${environment.apiUrl}/dashboard`;

    constructor(private http: HttpClient) { }

    getKpis(role: string): Observable<DashboardKpis> {
        return this.http.get<{ data: DashboardKpis }>(`${this.apiUrl}/${role}`).pipe(
            map(res => res.data)
        );
    }
}
