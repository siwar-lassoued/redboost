import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../../environment';
import { ApiResponse } from '../models/api-response.model';

export interface AppNotification {
    id: string;
    type: 'message' | 'session' | 'livrable' | 'evaluation' | 'acceptance' | 'tache' | 'info';
    titre: string;
    corps: string;
    lu: boolean;
    url?: string;
    createdAt: Date;
}

export interface Toast {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    id: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/notifications`;

    notifications$ = new BehaviorSubject<AppNotification[]>([]);
    unreadCount$ = new BehaviorSubject<number>(0);

    private toasts$ = new BehaviorSubject<Toast[]>([]);
    toasts = this.toasts$.asObservable();
    private counter = 0;

    loadAll(userId: string): Observable<AppNotification[]> {
        return this.http.get<any>(`${this.baseUrl}?userId=${userId}`).pipe(
            map(response => Array.isArray(response) ? response : (response?.data || [])),
            tap(list => {
                this.notifications$.next(list);
                this.unreadCount$.next(list.filter(n => !n.lu).length);
            }),
        );
    }

    markAllRead(userId: string): Observable<void> {
        return this.http.patch<void>(`${this.baseUrl}/mark-all-read?userId=${userId}`, {}).pipe(
            tap(() => {
                const updated = this.notifications$.value.map(n => ({ ...n, lu: true }));
                this.notifications$.next(updated);
                this.unreadCount$.next(0);
            }),
        );
    }

    addLocal(notif: AppNotification): void {
        this.notifications$.next([notif, ...this.notifications$.value]);
        this.unreadCount$.next(this.notifications$.value.filter(n => !n.lu).length);
    }

    show(type: Toast['type'], message: string, duration = 5000): void {
        const toast: Toast = { type, message, id: ++this.counter };
        this.toasts$.next([...this.toasts$.value, toast]);
        setTimeout(() => this.removeToast(toast.id), duration);
    }

    success(msg: string): void { this.show('success', msg); }
    error(msg: string): void { this.show('error', msg); }
    info(msg: string): void { this.show('info', msg); }
    warning(msg: string): void { this.show('warning', msg); }

    private removeToast(id: number): void {
        this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
    }
}
