import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

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
  sectors?: string;          // JSON string from backend
  questionsJson?: string;    // JSON string from backend
  deadline?: string;
  createdAt?: string;
}

/** Frontend view model (parsed from backend DTO) */
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

  getById(id: string): Observable<FormTemplateDTO> {
    return this.http.get<FormTemplateDTO>(`${this.baseUrl}/${id}`);
  }

  create(template: FormTemplateDTO): Observable<FormTemplateDTO> {
    return this.http.post<FormTemplateDTO>(this.baseUrl, template);
  }

  update(id: string, template: FormTemplateDTO): Observable<FormTemplateDTO> {
    return this.http.put<FormTemplateDTO>(`${this.baseUrl}/${id}`, template);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Convert backend DTO to frontend view model */
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

  /** Convert frontend view model back to backend DTO for saving */
  static toDTO(view: {
    title: string;
    description: string;
    profileType: 'coach' | 'entrepreneur';
    program?: string;
    sectors?: string[];
    questions: FormQuestionDTO[];
    deadline?: string;
  }): FormTemplateDTO {
    return {
      title: view.title,
      description: view.description,
      profileType: view.profileType.toUpperCase() as 'COACH' | 'ENTREPRENEUR',
      program: view.program,
      sectors: JSON.stringify(view.sectors || []),
      questionsJson: JSON.stringify(view.questions),
      deadline: view.deadline
    };
  }
}
