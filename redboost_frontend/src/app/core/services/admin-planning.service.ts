// filepath: src/app/core/services/admin-planning.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environment';
import {
  SessionDetail,
  CoachPlanningItem,
  EntrepreneurPlanningItem,
  TodoItem,
  LivrableItem,
  AdminPlanningOverview,
  SessionStats,
  TodoStats
} from '../models/admin-planning.model';

@Injectable({
  providedIn: 'root'
})
export class AdminPlanningService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/planning`;

  /**
   * Récupère la vue globale du planning avec tous les coachs et entrepreneurs
   */
  getOverview(): Observable<AdminPlanningOverview> {
    return this.http.get<AdminPlanningOverview>(`${this.apiUrl}/overview`).pipe(
      catchError(() => of({
        totalCoaches: 0,
        totalEntrepreneurs: 0,
        totalSessions: 0,
        sessionsThisWeek: 0,
        pendingTodos: 0,
        pendingLivrables: 0
      }))
    );
  }

  /**
   * Récupère la liste des coachs avec leurs sessions
   */
  getCoachPlannings(search?: string): Observable<CoachPlanningItem[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<CoachPlanningItem[]>(`${this.apiUrl}/coaches`, { params }).pipe(
      map(coaches => coaches.map(coach => ({
        ...coach,
        totalSessions: coach.sessions?.length || 0,
        upcomingSessions: coach.sessions?.filter(s => new Date(s.date) > new Date()).length || 0,
        completedSessions: coach.sessions?.filter(s => s.statut === 'REALISEE').length || 0,
        expanded: false
      }))),
      catchError(() => of([]))
    );
  }

  /**
   * Récupère la liste des entrepreneurs avec leurs sessions
   */
  getEntrepreneurPlannings(search?: string): Observable<EntrepreneurPlanningItem[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<EntrepreneurPlanningItem[]>(`${this.apiUrl}/entrepreneurs`, { params }).pipe(
      map(entrepreneurs => entrepreneurs.map(ent => ({
        ...ent,
        totalSessions: ent.sessions?.length || 0,
        upcomingSessions: ent.sessions?.filter(s => new Date(s.date) > new Date()).length || 0,
        expanded: false
      }))),
      catchError(() => of([]))
    );
  }

  /**
   * Récupère les sessions d'un coach spécifique
   */
  getCoachSessions(coachId: string): Observable<SessionDetail[]> {
    return this.http.get<SessionDetail[]>(`${this.apiUrl}/coaches/${coachId}/sessions`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Récupère les sessions d'un entrepreneur spécifique
   */
  getEntrepreneurSessions(entrepreneurId: string): Observable<SessionDetail[]> {
    return this.http.get<SessionDetail[]>(`${this.apiUrl}/entrepreneurs/${entrepreneurId}/sessions`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Récupère les détails d'une session
   */
  getSessionDetail(sessionId: string): Observable<SessionDetail> {
    return this.http.get<SessionDetail>(`${this.apiUrl}/sessions/${sessionId}`).pipe(
      catchError(() => of({} as SessionDetail))
    );
  }

  /**
   * Récupère les To-Do associés à un coach
   */
  getCoachTodos(coachId: string): Observable<TodoItem[]> {
    return this.http.get<TodoItem[]>(`${this.apiUrl}/coaches/${coachId}/todos`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Récupère les To-Do associés à un entrepreneur
   */
  getEntrepreneurTodos(entrepreneurId: string): Observable<TodoItem[]> {
    return this.http.get<TodoItem[]>(`${this.apiUrl}/entrepreneurs/${entrepreneurId}/todos`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Récupère tous les To-Do (optionnellement filtrés)
   */
  getAllTodos(filters?: {
    coachId?: string;
    entrepreneurId?: string;
    statut?: string;
    programmeId?: string;
  }): Observable<TodoItem[]> {
    let params = new HttpParams();
    if (filters?.coachId) {
      params = params.set('coachId', filters.coachId);
    }
    if (filters?.entrepreneurId) {
      params = params.set('entrepreneurId', filters.entrepreneurId);
    }
    if (filters?.statut) {
      params = params.set('statut', filters.statut);
    }
    if (filters?.programmeId) {
      params = params.set('programmeId', filters.programmeId);
    }
    return this.http.get<TodoItem[]>(`${this.apiUrl}/todos`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Récupère les livrables associés à un coach
   */
  getCoachLivrables(coachId: string): Observable<LivrableItem[]> {
    return this.http.get<LivrableItem[]>(`${this.apiUrl}/coaches/${coachId}/livrables`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Récupère les livrables associés à un entrepreneur
   */
  getEntrepreneurLivrables(entrepreneurId: string): Observable<LivrableItem[]> {
    return this.http.get<LivrableItem[]>(`${this.apiUrl}/entrepreneurs/${entrepreneurId}/livrables`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Récupère tous les livrables (optionnellement filtrés)
   */
  getAllLivrables(filters?: {
    coachId?: string;
    entrepreneurId?: string;
    programmeId?: string;
    statut?: string;
  }): Observable<LivrableItem[]> {
    let params = new HttpParams();
    if (filters?.coachId) {
      params = params.set('coachId', filters.coachId);
    }
    if (filters?.entrepreneurId) {
      params = params.set('entrepreneurId', filters.entrepreneurId);
    }
    if (filters?.programmeId) {
      params = params.set('programmeId', filters.programmeId);
    }
    if (filters?.statut) {
      params = params.set('statut', filters.statut);
    }
    return this.http.get<LivrableItem[]>(`${this.apiUrl}/livrables`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Récupère les statistiques des sessions
   */
  getSessionStats(): Observable<SessionStats> {
    return this.http.get<SessionStats>(`${this.apiUrl}/stats/sessions`).pipe(
      catchError(() => of({
        total: 0,
        confirmees: 0,
        realisees: 0,
        annulees: 0
      }))
    );
  }

  /**
   * Récupère les statistiques des To-Do
   */
  getTodoStats(): Observable<TodoStats> {
    return this.http.get<TodoStats>(`${this.apiUrl}/stats/todos`).pipe(
      catchError(() => of({
        total: 0,
        enCours: 0,
        bloquees: 0,
        enRetard: 0,
        terminees: 0
      }))
    );
  }

  /**
   * Récupère une vue combinée (sessions + todos + livrables) pour un coach
   */
  getCoachFullPlanning(coachId: string): Observable<{
    coach: CoachPlanningItem;
    sessions: SessionDetail[];
    todos: TodoItem[];
    livrables: LivrableItem[];
  }> {
    return forkJoin({
      sessions: this.getCoachSessions(coachId),
      todos: this.getCoachTodos(coachId),
      livrables: this.getCoachLivrables(coachId)
    }).pipe(
      map(data => ({
        coach: {} as CoachPlanningItem,
        sessions: data.sessions,
        todos: data.todos,
        livrables: data.livrables
      })),
      catchError(() => of({
        coach: {} as CoachPlanningItem,
        sessions: [],
        todos: [],
        livrables: []
      }))
    );
  }

  /**
   * Récupère une vue combinée pour un entrepreneur
   */
  getEntrepreneurFullPlanning(entrepreneurId: string): Observable<{
    entrepreneur: EntrepreneurPlanningItem;
    sessions: SessionDetail[];
    todos: TodoItem[];
    livrables: LivrableItem[];
  }> {
    return forkJoin({
      sessions: this.getEntrepreneurSessions(entrepreneurId),
      todos: this.getEntrepreneurTodos(entrepreneurId),
      livrables: this.getEntrepreneurLivrables(entrepreneurId)
    }).pipe(
      map(data => ({
        entrepreneur: {} as EntrepreneurPlanningItem,
        sessions: data.sessions,
        todos: data.todos,
        livrables: data.livrables
      })),
      catchError(() => of({
        entrepreneur: {} as EntrepreneurPlanningItem,
        sessions: [],
        todos: [],
        livrables: []
      }))
    );
  }
}
