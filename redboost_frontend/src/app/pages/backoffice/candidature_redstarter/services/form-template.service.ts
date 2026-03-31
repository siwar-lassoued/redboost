import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environment';

export interface FormQuestionDTO {
    id: number;
    text: string;
    type: 'text-court' | 'text-long' | 'qcm' | 'qcu' | 'upload';
    options?: string[];
    required?: boolean;
}

export interface FormTemplateDTO {
    id?: string;
    title: string;
    description: string;
    profileType: 'COACH' | 'ENTREPRENEUR' | 'SPONTANEE';
    program?: string;
    sectors?: string;
    questionsJson?: string;
    deadline?: string;
    createdAt?: string;
}

export interface FormTemplateView {
    id: string;
    title: string;
    description: string;
    profileType: 'coach' | 'entrepreneur' | 'spontanee';
    program: string;
    sectors: string[];
    questions: FormQuestionDTO[];
    deadline?: string;
    createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class FormTemplateService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/form-templates`;

    getAll(): Observable<FormTemplateDTO[]> {
        return this.http.get<FormTemplateDTO[]>(this.baseUrl);
    }

    create(template: FormTemplateDTO): Observable<FormTemplateDTO> {
        return this.http.post<FormTemplateDTO>(this.baseUrl, template);
    }

    delete(id: string | number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    getById(id: string | number): Observable<FormTemplateDTO> {
        return this.http.get<FormTemplateDTO>(`${this.baseUrl}/${id}`);
    }

    static toView(dto: FormTemplateDTO): FormTemplateView {
        let sectors: string[] = [];
        try { sectors = JSON.parse(dto.sectors || '[]'); } catch { sectors = []; }
        let questions: FormQuestionDTO[] = [];
        try { questions = JSON.parse(dto.questionsJson || '[]'); } catch { questions = []; }
        return {
            id: dto.id || '',
            title: dto.title,
            description: dto.description,
            profileType: dto.profileType?.toLowerCase() as 'coach' | 'entrepreneur' | 'spontanee',
            program: dto.program || '',
            sectors,
            questions,
            deadline: dto.deadline,
            createdAt: dto.createdAt || ''
        };
    }

    static toDTO(view: {
        title: string;
        description: string;
        profileType: 'coach' | 'entrepreneur' | 'spontanee';
        questions: FormQuestionDTO[];
        deadline?: string;
        program?: string;
    }): FormTemplateDTO {
        return {
            title: view.title,
            description: view.description,
            profileType: view.profileType.toUpperCase() as 'COACH' | 'ENTREPRENEUR' | 'SPONTANEE',
            questionsJson: JSON.stringify(view.questions),
            deadline: view.deadline,
            program: view.program
        };
    }
}
