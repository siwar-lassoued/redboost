import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ImproveRequest {
    text: string;
    type: string;
    context?: string;
    model?: string;
}

export interface ImproveResponse {
    original_text: string;
    improved_text: string;
    feedback: string[];
    score: number;
}

@Injectable({
    providedIn: 'root'
})
export class AiService {
    private apiUrl = 'http://localhost:8087/api/ai';

    constructor(private http: HttpClient) {}

    improve(request: ImproveRequest): Observable<ImproveResponse> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.post<ImproveResponse>(`${this.apiUrl}/improve`, request, { headers });
    }
}