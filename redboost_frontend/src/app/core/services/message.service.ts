import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environment';

export interface Message {
    id: number;
    expediteurId: string;
    expediteurNom: string;
    expediteurPrenom: string;
    destinataireId: string;
    contenu: string;
    type: string;
    lu: boolean;
    timestamp: Date;
    sentAt?: Date;
    fichierUrl?: string;
    fichierNom?: string;
    fichierType?: string;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/messages`;

    getConversation(userId1: string, userId2: string): Observable<Message[]> {
        return this.http.get<{ data: Message[] }>(`${this.baseUrl}/history/${userId1}/${userId2}`).pipe(
            map(res => res.data)
        );
    }

    getLastMessages(userId: string): Observable<Message[]> {
        return this.http.get<Message[]>(`${this.baseUrl}/conversations?userId=${userId}`);
    }

    getUnreadCount(userId: string): Observable<number> {
        return this.http.get<{ count: number }>(`${this.baseUrl}/unread?userId=${userId}`).pipe(
            map(res => res.count)
        );
    }

    markAsRead(userId: string, otherUserId: string): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/read/${userId}/${otherUserId}`, {});
    }

    sendMessage(expediteurId: string, destinataireId: string, contenu: string): Observable<Message> {
        return this.http.post<{ data: Message }>(`${this.baseUrl}`, {
            expediteurId,
            destinataireId,
            contenu
        }).pipe(map(res => res.data));
    }

    getPresence(userId: string): Observable<{ online: boolean }> {
        return this.http.get<{ online: boolean }>(`${this.baseUrl}/presence/${userId}`);
    }
}
