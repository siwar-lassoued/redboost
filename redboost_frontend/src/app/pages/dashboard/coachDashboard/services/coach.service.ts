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
  typeSession?: string; // EN_LIGNE or PRESENTIEL
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

export interface CoachEntrepreneurDTO {
  id: number;
  firstName: string;
  lastName: string;
  entreprise?: string;
  secteur?: string;
  profilePictureUrl?: string;
  completionRate?: number;
  delayedTasksCount?: number;
}

export interface DashboardStatsDTO {
  nbRendezVous: number;
  nbTaches: number;
  nbPhases: number;
  nbProjet: number;
  completionRate?: number;
  activity?: Array<{ time: string; text: string }>;
}

export interface UpcomingSessionDTO {
  id: number;
  entrepreneurName: string;
  dateSession: string;
  heureDebut: string;
  statut: string;
  meetingLink?: string;
}

export interface CoachEntrepreneurDetailDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  entreprise: string;
  secteur: string;
  profilePictureUrl: string;
  startupDescription: string;
  completionRate: number;
  tasks: any[];
  livrables: Array<{
    id: number;
    nom: string;
    dateUpload: string;
    typeFichier: string;
    tailleFichier: number;
    url: string;
    tacheTitre: string;
  }>;
  notes: Array<{
    id: number;
    date: string;
    synthese: string;
    appreciation: string;
  }>;
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
    return this.http.get<ThematiqueCoachingDTO[]>(`${environment.apiUrl}/thematiques/coach/${coachId}`);
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

  // DASHBOARD STATS - Dynamic data loading
  getDashboardStats(coachId: number): Observable<DashboardStatsDTO> {
    return this.http.get<DashboardStatsDTO>(`${this.apiUrl}/${coachId}/dashboard-stats`);
  }

  // Get entrepreneurs assigned to the coach
  getCoachEntrepreneurs(coachId: number): Observable<CoachEntrepreneurDTO[]> {
    return this.http.get<CoachEntrepreneurDTO[]>(`${this.apiUrl}/${coachId}/entrepreneurs`);
  }

  // Get upcoming sessions for the coach
  getUpcomingSessions(coachId: number): Observable<UpcomingSessionDTO[]> {
    return this.http.get<UpcomingSessionDTO[]>(`${this.apiUrl}/${coachId}/upcoming-sessions`);
  }

  // Get dashboard overview (combines stats, entrepreneurs, and sessions)
  getDashboardOverview(coachId: number): Observable<{
    stats: DashboardStatsDTO;
    entrepreneurs: CoachEntrepreneurDTO[];
    sessions: UpcomingSessionDTO[];
  }> {
    return this.http.get<{
      stats: DashboardStatsDTO;
      entrepreneurs: CoachEntrepreneurDTO[];
      sessions: UpcomingSessionDTO[];
    }>(`${this.apiUrl}/${coachId}/dashboard-overview`);
  }

  // Get details for a specific entrepreneur
  getEntrepreneurDetail(coachId: number, entrepreneurId: number): Observable<CoachEntrepreneurDetailDTO> {
    return this.http.get<CoachEntrepreneurDetailDTO>(`${this.apiUrl}/${coachId}/entrepreneurs/${entrepreneurId}/details`);
  }

  /**
   * Create or update a session report (Note de synthèse)
   */
  saveNote(note: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/notes`, note);
  }

  /**
   * Get programs assigned to the coach
   */
  getCoachProgrammes(coachId: number): Observable<ProgrammeDTO[]> {
    return this.http.get<ProgrammeDTO[]>(`${this.apiUrl}/${coachId}/programmes`);
  }

  // BOOKING (Entrepreneur)
  bookSession(sessionCoachId: number, entrepreneurId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/sessions/${sessionCoachId}/book?entrepreneurId=${entrepreneurId}`, {});
  }
  rescheduleSession(sessionId: string, newDate: string, entrepreneurId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/sessions/${sessionId}/reschedule?newDate=${newDate}&entrepreneurId=${entrepreneurId}`, {});
  }
  getSessionBookings(sessionCoachId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sessions/${sessionCoachId}/bookings`);
  }
  getAvailableSessionsForEntrepreneur(coachId: number): Observable<SessionCoachDTO[]> {
    return this.http.get<SessionCoachDTO[]>(`${this.apiUrl}/${coachId}/available-sessions`);
  }

  // RAPPORT MISSION COACH
  getRapportsMission(coachId: number, programmeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/rapports-mission-coach/coach/${coachId}/programme/${programmeId}`);
  }

  saveRapportMission(payload: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/rapports-mission-coach`, payload);
  }

  deleteRapportMission(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/rapports-mission-coach/${id}`);
  }
}
