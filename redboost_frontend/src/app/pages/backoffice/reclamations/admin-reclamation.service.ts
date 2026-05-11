import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environment';

export interface AdminReclamation {
  id: number;
  coach: any;
  entrepreneur: any;
  sujet: string;
  typeReclamation: string;
  description: string;
  statut: string;
  dateReclamation: string;
  roleEmetteur?: string;
  programmeName?: string;
  thematiqueName?: string;
  sessionDetails?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminReclamationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/reclamations`;

  getAllReclamations(): Observable<AdminReclamation[]> {
    return this.http.get<AdminReclamation[]>(this.apiUrl);
  }

  updateStatus(id: number, status: string): Observable<AdminReclamation> {
    return this.http.patch<AdminReclamation>(`${this.apiUrl}/${id}/status`, { status });
  }
}
