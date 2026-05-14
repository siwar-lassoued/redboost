import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environment';

export interface DisponibiliteDTO {
  id?: number;
  coachId: number;
  thematiqueId: number;
  thematiqueNom?: string;
  dateDebut: string;
  dateFin: string;
  couleur?: string;
}

export interface SessionCoachDTO {
  id?: number;
  disponibiliteId: number;
  titre: string;
  dateSession: string;
  heureDebut: string;
  heureFin: string;
  typeSession?: string; 
  sessionGroupId?: string; 
  thematiqueNom?: string;
  thematiqueDateDebut?: string;
  thematiqueDateFin?: string;
  programmeNom?: string;
  isBooked?: boolean;
  isBookedByMe?: boolean;
  isGroupReservedByMe?: boolean;
  meetLink?: string;
  couleur?: string;
  isExceptionnelle?: boolean;
  bookingStatus?: string;
  entrepreneurName?: string;
  entrepreneurId?: number;
  thematiqueId?: number;
}

export interface SessionGroupDTO {
  sessionGroupId: string;
  sessionTitle: string;
  reservedByMe: boolean;
  slots: SessionCoachDTO[];
  isExceptionnelle?: boolean;
}

export interface SeanceExceptionnelleDTO {
  id?: number;
  coachId: number;
  entrepreneurId: number;
  thematiqueId?: number;
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
  typeReclamation?: string;
  description: string;
  pieceJointeUrl?: string;
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
  startupName?: string;
  secteur?: string;
  profilePictureUrl?: string;
  completionRate?: number;
  delayedTasksCount?: number;
  completedTasksCount?: number;
  stage?: string;
  programName?: string;
}

export interface CoachCalendarEventDTO {
  id: string;
  type: 'DISPONIBILITE_COACH' | 'SESSION_SLOT' | 'SESSION' | 'SEANCE_EXCEPTIONNELLE';
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  source?: 'coach' | 'entrepreneur';
  thematiqueNom?: string;
  thematiqueDateDebut?: string;
  thematiqueDateFin?: string;
  programmeNom?: string;
  color?: string;
  booked?: boolean;
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
  id: number | string;
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
    statut: string;
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
  addDisponibilite(coachId: number, thematiqueId: number, couleur: string = '#FF4D85'): Observable<DisponibiliteDTO> {
    return this.http.post<DisponibiliteDTO>(`${this.apiUrl}/${coachId}/disponibilites/${thematiqueId}?couleur=${encodeURIComponent(couleur)}`, {});
  }
  deleteDisponibilite(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/disponibilites/${id}`);
  }
  updateDisponibilite(dispoId: number, thematiqueId: number): Observable<DisponibiliteDTO> {
    return this.http.put<DisponibiliteDTO>(`${this.apiUrl}/disponibilites/${dispoId}/thematique/${thematiqueId}`, {});
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
  updateSession(sessionId: number, session: SessionCoachDTO): Observable<SessionCoachDTO> {
    return this.http.put<SessionCoachDTO>(`${this.apiUrl}/sessions/${sessionId}`, session);
  }
  rebookSession(sessionId: string, newSlotId: number, entrepreneurId: number): Observable<any> {
    let params = new HttpParams()
      .set('newSlotId', newSlotId.toString())
      .set('entrepreneurId', entrepreneurId.toString());
    return this.http.put<any>(`${this.apiUrl}/sessions/${sessionId}/rebook`, {}, { params });
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
  addReclamation(coachId: number, entrepreneurId: number, reclamation: ReclamationDTO, file?: File): Observable<ReclamationDTO> {
    const formData = new FormData();
    formData.append('reclamation', new Blob([JSON.stringify(reclamation)], { type: 'application/json' }));
    if (file) {
      formData.append('file', file);
    }
    return this.http.post<ReclamationDTO>(`${this.apiUrl}/${coachId}/reclamations/${entrepreneurId}`, formData);
  }

  // PROGRAMMES
  getProgrammes(): Observable<ProgrammeDTO[]> {
    return this.http.get<ProgrammeDTO[]>(`${environment.apiUrl}/backoffice/programmes`);
  }

  // THEMATIQUES
  getThematiquesAssignedToCoach(coachId: number): Observable<ThematiqueCoachingDTO[]> {
    return this.http.get<ThematiqueCoachingDTO[]>(`${this.apiUrl}/${coachId}/thematiques`);
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

  getMatchedEntrepreneursGrouped(coachId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${coachId}/matched-entrepreneurs`);
  }
  getCalendarEvents(coachId: number): Observable<CoachCalendarEventDTO[]> {
    return this.http.get<CoachCalendarEventDTO[]>(`${this.apiUrl}/${coachId}/calendar-events`);
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

  getReclamationSessions(coachId: number): Observable<SessionCoachDTO[]> {
    return this.http.get<SessionCoachDTO[]>(`${this.apiUrl}/${coachId}/reclamation-sessions`);
  }

  // BOOKING (Entrepreneur)
  bookSession(sessionCoachId: number, entrepreneurId: number, notes?: string): Observable<any> {
    let url = `${this.apiUrl}/sessions/${sessionCoachId}/book?entrepreneurId=${entrepreneurId}`;
    if (notes && notes.trim()) {
      url += `&notes=${encodeURIComponent(notes.trim())}`;
    }
    return this.http.post(url, {});
  }

  cancelBooking(sessionCoachId: number, entrepreneurId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sessions/${sessionCoachId}/book?entrepreneurId=${entrepreneurId}`);
  }

  cancelSessionById(sessionId: string, entrepreneurId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sessions/cancel/${sessionId}?entrepreneurId=${entrepreneurId}`);
  }

  rescheduleSession(sessionId: string, newDate: string, entrepreneurId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/sessions/${sessionId}/reschedule?newDate=${newDate}&entrepreneurId=${entrepreneurId}`, {});
  }
  getSessionBookings(sessionCoachId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sessions/${sessionCoachId}/bookings`);
  }
  getAvailableSessionsForEntrepreneur(coachId: number, entrepreneurId: number, thematiqueId?: number): Observable<SessionCoachDTO[]> {
    let url = `${this.apiUrl}/${coachId}/available-sessions?entrepreneurId=${entrepreneurId}`;
    if (thematiqueId) {
      url += `&thematiqueId=${thematiqueId}`;
    }
    return this.http.get<SessionCoachDTO[]>(url);
  }

  /** Returns sessions grouped by sessionGroupId with a reservedByMe flag per group */
  getAvailableSessionsGrouped(coachId: number, entrepreneurId: number, thematiqueId?: number): Observable<SessionGroupDTO[]> {
    let url = `${this.apiUrl}/${coachId}/available-sessions-grouped?entrepreneurId=${entrepreneurId}`;
    if (thematiqueId) {
      url += `&thematiqueId=${thematiqueId}`;
    }
    return this.http.get<SessionGroupDTO[]>(url);
  }

  // RAPPORT MISSION COACH
  getRapportsMission(coachId: number, programmeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/rapports-mission-coach/coach/${coachId}/programme/${programmeId}`);
  }

  getRapportsMissionByThematique(coachId: number, thematiqueId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/rapports-mission-coach/coach/${coachId}/thematique/${thematiqueId}`);
  }

  saveRapportMission(payload: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/rapports-mission-coach`, payload);
  }

  deleteRapportMission(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/rapports-mission-coach/${id}`);
  }

  // RAPPORT SESSION COACH
  getRapportsSession(coachId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/rapports-session-coach/coach/${coachId}`);
  }

  getRapportsSessionByThematique(coachId: number, thematiqueId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/rapports-session-coach/coach/${coachId}/thematique/${thematiqueId}`);
  }

  getRapportsSessionByIds(ids: number[]): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/rapports-session-coach/ids?ids=${ids.join(',')}`);
  }

  saveRapportSession(payload: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/rapports-session-coach`, payload);
  }

  deleteRapportSession(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/rapports-session-coach/${id}`);
  }

  getConsolidatedPdf(entrepreneurId: number, coachId: number, thematiqueId?: number, dateSession?: string): Observable<Blob> {
    let url = `${environment.apiUrl}/rapports-session-coach/entrepreneur/${entrepreneurId}/coach/${coachId}/consolidated-pdf`;
    const params: string[] = [];
    if (thematiqueId) params.push(`thematiqueId=${thematiqueId}`);
    if (dateSession) params.push(`dateSession=${dateSession}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return this.http.get(url, {
      responseType: 'blob'
    });
  }


getMyCoaches(entrepreneurId: number): Observable<any[]> {
  return this.http.get<any[]>(
    `${environment.apiUrl}/matching/entrepreneur/${entrepreneurId}/coaches`
  );
}
}
