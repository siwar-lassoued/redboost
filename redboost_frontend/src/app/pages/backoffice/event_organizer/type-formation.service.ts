// type-formation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TypeFormation {
  id: number;
  name: string;
}

export interface CreateTypeFormationRequest {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class TypeFormationService {
  private apiUrl = 'http://localhost:8087/api/type-formation';

  constructor(private http: HttpClient) {}

  getAllTypes(): Observable<TypeFormation[]> {
    return this.http.get<TypeFormation[]>(this.apiUrl);
  }

  createType(request: CreateTypeFormationRequest): Observable<TypeFormation> {
    return this.http.post<TypeFormation>(this.apiUrl, request);
  }

  getTypeById(id: number): Observable<TypeFormation> {
    return this.http.get<TypeFormation>(`${this.apiUrl}/${id}`);
  }

  deleteType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}