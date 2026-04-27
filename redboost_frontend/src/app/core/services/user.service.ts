import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UserRole, UserStatus } from '../models/user.model';
import { PaginatedResponse, ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environment';

export interface UserFilters {
    role?: UserRole;
    search?: string;
    status?: UserStatus;
    page?: number;
    limit?: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/users`;

    getAll(filters?: UserFilters): Observable<PaginatedResponse<User>> {
        let params = new HttpParams();
        if (filters?.role) params = params.set('role', filters.role);
        if (filters?.status) params = params.set('status', filters.status);
        if (filters?.search) params = params.set('search', filters.search);
        if (filters?.page) params = params.set('page', filters.page.toString());
        if (filters?.limit) params = params.set('limit', filters.limit.toString());
        return this.http.get<PaginatedResponse<User>>(this.baseUrl, { params });
    }

    getById(id: string): Observable<User> {
        return this.http.get<User>(`${this.baseUrl}/${id}`);
    }

    getCoaches(): Observable<User[]> {
        return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/coaches`).pipe(
            map(res => res.data)
        );
    }

    getEntrepreneurs(): Observable<User[]> {
        return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/entrepreneurs`).pipe(
            map(res => res.data)
        );
    }

    getEntrepreneursByCoach(coachId: string): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/coach/${coachId}/entrepreneurs`);
    }

    getCoachesByEntrepreneur(entrepreneurId: string): Observable<User[]> {
        return this.http.get<User[]>(`${this.baseUrl}/entrepreneurs/${entrepreneurId}/coaches`);
    }

    create(data: Partial<User>): Observable<User> {
        return this.http.post<User>(this.baseUrl, data);
    }

    update(id: string, data: Partial<User>): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/${id}`, data);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    saveFcmToken(userId: string, token: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/fcm-token`, { userId, token });
    }
}
