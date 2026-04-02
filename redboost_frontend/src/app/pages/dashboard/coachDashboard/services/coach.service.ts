import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environment';

export interface DisponibiliteDTO {
  id?: number;
  coachId: number;
  thematiqueId: number;
  thematiqueNom?: string;
  dateDebut: string;
  dateFin: string;
}

export interface SessionCoachDTO {
  id?: number;
  disponibiliteId: number;
  titre: string;
  dateSession: string;
  heureDebut: string;
  heureFin: string;
}

export interface SeanceExceptionnelleDTO {
  id?: number;
  coachId: number;
  entrepreneurId: number;
  entrepreneurName?: string;
  titre: string;
  dateSeance: string;
  heureDebut: string;
  heureFin: string;
}

export interface ReclamationDTO {
  id?: number;
  coachId: number;
  entrepreneurId: number;
  entrepreneurName?: string;
  sujet: string;
  description: string;
  statut?: string;
  dateReclamation?: string;
}

export interface ThematiqueCoachingDTO {
  id: number;
  programmeId: number;
  nom: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
}

export interface UserDTO {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  entreprise?: string;
  secteur?: string;
  profilePictureUrl?: string;
}

export interface ProgrammeDTO {
  id: number;
  nom: string;
  annee?: number;
  typeProgramme?: string;
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
  description?: string;
  couleurTheme?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CoachService {
  private apiUrl = `${environment.apiUrl}/coach`;

  constructor(private http: HttpClient) {}

  // DISPONIBILITE
  getDisponibilites(coachId: number): Observable<DisponibiliteDTO[]> {
    return this.http.get<DisponibiliteDTO[]>(`${this.apiUrl}/${coachId}/disponibilites`);
  }
  addDisponibilite(coachId: number, thematiqueId: number): Observable<DisponibiliteDTO> {
    return this.http.post<DisponibiliteDTO>(`${this.apiUrl}/${coachId}/disponibilites/${thematiqueId}`, {});
  }
  deleteDisponibilite(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/disponibilites/${id}`);
  }

  // SESSION
  getSessionsByDisponibilite(dispoId: number): Observable<SessionCoachDTO[]> {
    return this.http.get<SessionCoachDTO[]>(`${this.apiUrl}/disponibilites/${dispoId}/sessions`);
  }
  getAllSessionsByCoach(coachId: number): Observable<SessionCoachDTO[]> {
    return this.http.get<SessionCoachDTO[]>(`${this.apiUrl}/${coachId}/sessions`);
  }
  addSession(dispoId: number, session: SessionCoachDTO): Observable<SessionCoachDTO> {
    return this.http.post<SessionCoachDTO>(`${this.apiUrl}/disponibilites/${dispoId}/sessions`, session);
  }
  deleteSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sessions/${id}`);
  }

  // SEANCE EXCEPTIONNELLE
  getSeancesExceptionnelles(coachId: number): Observable<SeanceExceptionnelleDTO[]> {
    return this.http.get<SeanceExceptionnelleDTO[]>(`${this.apiUrl}/${coachId}/seances-exceptionnelles`);
  }
  addSeanceExceptionnelle(coachId: number, entrepreneurId: number, seance: SeanceExceptionnelleDTO): Observable<SeanceExceptionnelleDTO> {
    return this.http.post<SeanceExceptionnelleDTO>(`${this.apiUrl}/${coachId}/seances-exceptionnelles/${entrepreneurId}`, seance);
  }

  // RECLAMATION
  getReclamations(coachId: number): Observable<ReclamationDTO[]> {
    return this.http.get<ReclamationDTO[]>(`${this.apiUrl}/${coachId}/reclamations`);
  }
  addReclamation(coachId: number, entrepreneurId: number, reclamation: ReclamationDTO): Observable<ReclamationDTO> {
    return this.http.post<ReclamationDTO>(`${this.apiUrl}/${coachId}/reclamations/${entrepreneurId}`, reclamation);
  }

  // PROGRAMMES
  getProgrammes(): Observable<ProgrammeDTO[]> {
    return this.http.get<ProgrammeDTO[]>(`${environment.apiUrl}/programmes`);
  }

  // THEMATIQUES
  getThematiquesAssignedToCoach(coachId: number): Observable<ThematiqueCoachingDTO[]> {
    return this.http.get<ThematiqueCoachingDTO[]>(`${environment.apiUrl}/thematique`);
  }

  // USERS / ENTREPRENEURS
  getEntrepreneurs(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${environment.apiUrl}/users/entrepreneurs`);
  }

  getUserById(userId: number): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${environment.apiUrl}/users/${userId}`);
  }

  // COACH PROFILE (current user)
  getCoachProfile(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${environment.apiUrl}/users/profile`);
  }
}
