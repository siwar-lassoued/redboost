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
    profileType: 'COACH' | 'ENTREPRENEUR';
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
    profileType: 'coach' | 'entrepreneur';
    program: string;
    sectors: string[];
    questions: FormQuestionDTO[];
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

    static toView(dto: FormTemplateDTO): FormTemplateView {
        let sectors: string[] = [];
        try { sectors = JSON.parse(dto.sectors || '[]'); } catch { sectors = []; }
        let questions: FormQuestionDTO[] = [];
        try { questions = JSON.parse(dto.questionsJson || '[]'); } catch { questions = []; }
        return {
            id: dto.id || '',
            title: dto.title,
            description: dto.description,
            profileType: dto.profileType?.toLowerCase() as 'coach' | 'entrepreneur',
            program: dto.program || '',
            sectors,
            questions,
            createdAt: dto.createdAt || ''
        };
    }

    static toDTO(view: {
        title: string;
        description: string;
        profileType: 'coach' | 'entrepreneur';
        questions: FormQuestionDTO[];
        deadline?: string;
    }): FormTemplateDTO {
        return {
            title: view.title,
            description: view.description,
            profileType: view.profileType.toUpperCase() as 'COACH' | 'ENTREPRENEUR',
            questionsJson: JSON.stringify(view.questions),
            deadline: view.deadline
        };
    }
}
