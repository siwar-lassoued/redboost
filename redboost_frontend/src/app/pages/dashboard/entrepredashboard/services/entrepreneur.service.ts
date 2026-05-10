import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environment';

export interface EntrepreneurCoachDTO {
  id: number;
  firstName: string;
  lastName: string;
  expertise?: string;
  thematiqueName?: string;
}

export interface ReclamationDTO {
  id?: number;
  coachId: number;
  entrepreneurId: number;
  entrepreneurName?: string;
  sujet: string;
  typeReclamation?: string;
  description: string;
  pieceJointeUrl?: string;
  statut?: string;
  dateReclamation?: string;
  roleEmetteur?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EntrepreneurService {
  private apiUrl = `${environment.apiUrl}/entrepreneur`;

  constructor(private http: HttpClient) {}

  getCoaches(entrepreneurId: number): Observable<EntrepreneurCoachDTO[]> {
    return this.http.get<EntrepreneurCoachDTO[]>(`${this.apiUrl}/${entrepreneurId}/coaches`);
  }

  getReclamations(entrepreneurId: number): Observable<ReclamationDTO[]> {
    return this.http.get<ReclamationDTO[]>(`${this.apiUrl}/${entrepreneurId}/reclamations`);
  }

  addReclamation(entrepreneurId: number, coachId: number, reclamation: ReclamationDTO, file?: File): Observable<ReclamationDTO> {
    const formData = new FormData();
    formData.append('reclamation', new Blob([JSON.stringify(reclamation)], { type: 'application/json' }));
    if (file) {
      formData.append('file', file);
    }
    return this.http.post<ReclamationDTO>(`${this.apiUrl}/${entrepreneurId}/reclamations/${coachId}`, formData);
  }

  getProgrammes(entrepreneurId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${entrepreneurId}/programmes`);
  }

  getThematiques(entrepreneurId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${entrepreneurId}/thematiques`);
  }

  getSessions(entrepreneurId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${entrepreneurId}/sessions`);
  }
}
