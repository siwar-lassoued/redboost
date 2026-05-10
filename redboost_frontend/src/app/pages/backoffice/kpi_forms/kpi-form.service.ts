import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environment';

export interface KpiFormQuestion {
    id?: number;
    text: string;
    type: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT' | 'FILE' | 'TEXTAREA';
    options?: string;
    required: boolean;
    kpiId?: number;
    kpiName?: string;
    orderIndex?: number;
}

export interface KpiForm {
    id?: number;
    title: string;
    description: string;
    programmeId?: number;
    thematiqueId?: number;
    coachId?: number;
    thematiqueLabel?: string;
    coachName?: string;
    status?: 'DRAFT' | 'SENT' | 'CLOSED';
    formType?: 'KPI' | 'EVALUATION';
    deadline?: string;
    createdAt?: string;
    questions: KpiFormQuestion[];
}

export interface KpiFormAnswer {
    id?: number;
    questionId: number;
    questionText: string;
    answerValue: string;
    kpiId?: number;
}

export interface KpiFormResponse {
    id?: number;
    formId: number;
    formTitle: string;
    entrepreneurId: number;
    entrepreneurName: string;
    status: 'PENDING' | 'SUBMITTED' | 'VALIDATED';
    submittedAt?: string;
    answers: KpiFormAnswer[];
}

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    programmes?: { id: number }[];
}

export interface ThematiqueCoaching {
    id: number;
    nom: string;        // backend field is "nom", not "titre"
    titre?: string;     // keep for compatibility
    description?: string;
    programmeId: number;
    statut?: string;
}

@Injectable({
    providedIn: 'root'
})
export class KpiFormService {
    private apiUrl = `${environment.apiUrl}/kpi-forms`;
    private thematiquesUrl = `${environment.apiUrl}/thematiques`;
    private usersUrl = `${environment.apiUrl}/users`;

    constructor(private http: HttpClient) {}

    getAllForms(): Observable<KpiForm[]> {
        return this.http.get<KpiForm[]>(this.apiUrl);
    }

    getFormsByProgramme(programmeId: string | number): Observable<KpiForm[]> {
        return this.http.get<KpiForm[]>(`${this.apiUrl}/programme/${programmeId}`);
    }

    getKpiForms(): Observable<KpiForm[]> {
        return this.http.get<KpiForm[]>(`${this.apiUrl}/type/kpi`);
    }

    getEvaluationForms(): Observable<KpiForm[]> {
        return this.http.get<KpiForm[]>(`${this.apiUrl}/type/evaluation`);
    }

    getEvaluationFormsByThematique(thematiqueId: string | number): Observable<KpiForm[]> {
        return this.http.get<KpiForm[]>(`${this.apiUrl}/evaluation/thematique/${thematiqueId}`);
    }

    getEvaluationFormsByCoach(coachId: string | number): Observable<KpiForm[]> {
        return this.http.get<KpiForm[]>(`${this.apiUrl}/evaluation/coach/${coachId}`);
    }

    /**
     * Uses the existing /api/thematiques/programme/{id} endpoint
     * which is already deployed and working.
     */
    getThematiquesByProgramme(programmeId: string | number): Observable<ThematiqueCoaching[]> {
        return this.http.get<ThematiqueCoaching[]>(
            `${this.thematiquesUrl}/programme/${programmeId}`
        );
    }

    /**
     * Uses the existing /api/users?role=COACH endpoint,
     * then filters to those whose programmes include the given programmeId.
     */
    getCoachesByProgramme(programmeId: string | number): Observable<User[]> {
        return this.http.get<User[]>(`${this.usersUrl}?role=COACH`).pipe(
            map((coaches: User[]) =>
                coaches.filter(coach =>
                    coach.programmes &&
                    coach.programmes.some(p => p.id === Number(programmeId))
                )
            )
        );
    }

    getEntrepreneursForEvaluation(programmeId: string | number, thematiqueId: string | number): Observable<User[]> {
        return this.http.get<User[]>(
            `${this.apiUrl}/programme/${programmeId}/thematique/${thematiqueId}/entrepreneurs`
        );
    }

    getEntrepreneursForProgramme(programmeId: string | number): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/programme/${programmeId}/entrepreneurs`);
    }

    getFormById(id: string | number): Observable<KpiForm> {
        return this.http.get<KpiForm>(`${this.apiUrl}/${id}`);
    }

    createForm(form: KpiForm): Observable<KpiForm> {
        return this.http.post<KpiForm>(this.apiUrl, form);
    }

    updateForm(id: string | number, form: KpiForm): Observable<KpiForm> {
        return this.http.put<KpiForm>(`${this.apiUrl}/${id}`, form);
    }

    deleteForm(id: string | number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    sendForm(id: string | number, entrepreneurIds: (string | number)[]): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/send`, { entrepreneurIds });
    }

    getResponsesForForm(id: string | number): Observable<KpiFormResponse[]> {
        return this.http.get<KpiFormResponse[]>(`${this.apiUrl}/${id}/responses`);
    }

    getPendingFormsForEntrepreneur(entrepreneurId: string | number): Observable<KpiFormResponse[]> {
        return this.http.get<KpiFormResponse[]>(`${this.apiUrl}/entrepreneur/${entrepreneurId}`);
    }

    submitResponse(responseId: string | number, answers: KpiFormAnswer[]): Observable<KpiFormResponse> {
        return this.http.post<KpiFormResponse>(
            `${this.apiUrl}/responses/${responseId}/submit`,
            answers
        );
    }
}