import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environment';

export interface LivrableAdmin {
    id?: number;
    titre: string;
    type: string;
    description?: string;
    fichierUrl?: string;
    statut?: string;
    dateSoumission?: string;
    entrepreneur?: { id: number, firstName: string, lastName: string };
    programme?: { id: number, nom: string };
    tache?: { id: number, titre: string };
    commentaire?: string;
    coachComment?: string;
    validatedAt?: string;
    fileSize?: string;
    coachName?: string;
    coachEmail?: string;
}

@Injectable({
    providedIn: 'root'
})
export class LivrableAdminService {
    private apiUrl = `${environment.apiUrl}/livrables`;

    constructor(private http: HttpClient) {}

    getAllLivrables(): Observable<LivrableAdmin[]> {
        return this.http.get<LivrableAdmin[]>(this.apiUrl);
    }

    getLivrableById(id: number): Observable<LivrableAdmin> {
        return this.http.get<LivrableAdmin>(`${this.apiUrl}/${id}`);
    }

    createLivrable(livrable: LivrableAdmin): Observable<LivrableAdmin> {
        return this.http.post<LivrableAdmin>(this.apiUrl, livrable);
    }

    updateStatus(id: number, statut: string, coachComment?: string): Observable<LivrableAdmin> {
        return this.http.patch<LivrableAdmin>(`${this.apiUrl}/${id}/statut`, { statut, coachComment });
    }

    deleteLivrable(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
