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

export interface RapportSessionAdmin {
    id: number;
    beneficiaireNom?: string;
    entrepriseNom?: string;
    coachNom?: string;
    coach?: { firstName: string, lastName: string };
    numeroSession?: string;
    dateSession?: string;
    thematique?: { nom: string };
    programme?: { id: number, nom: string };
    pdfPath?: string;
    dateCreation?: string;
}

export interface RapportMissionAdmin {
    id: number;
    coach?: { firstName: string, lastName: string };
    programme?: { id: number, nom: string };
    thematique?: { nom: string };
    dateDebut?: string;
    dateFin?: string;
    pdfPath?: string;
    dateCreation?: string;
}

@Injectable({
    providedIn: 'root'
})
export class LivrableAdminService {
    private apiUrl = `${environment.apiUrl}/livrables`;
    private apiSession = `${environment.apiUrl}/rapports-session-coach`;
    private apiMission = `${environment.apiUrl}/rapports-mission-coach`;

    constructor(private http: HttpClient) {}

    // Old generic methods...
    getAllLivrables(): Observable<LivrableAdmin[]> {
        return this.http.get<LivrableAdmin[]>(this.apiUrl);
    }
    
    // New specific methods
    getAllSessionReports(): Observable<RapportSessionAdmin[]> {
        return this.http.get<RapportSessionAdmin[]>(`${this.apiSession}/all`);
    }

    getAllMissionReports(): Observable<RapportMissionAdmin[]> {
        return this.http.get<RapportMissionAdmin[]>(`${this.apiMission}/all`);
    }

    getSessionReportPdfUrl(id: number): string {
        return `${this.apiSession}/${id}/pdf`;
    }

    getMissionReportPdfUrl(id: number): string {
        return `${this.apiMission}/${id}/pdf`;
    }
}
