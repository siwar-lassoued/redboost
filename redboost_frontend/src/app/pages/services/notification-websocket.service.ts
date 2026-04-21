// src/app/pages/services/notification-websocket.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../../environment';

// Matches the backend Entity/DTO
export interface AppNotification {
  id: number;
  message: string;
  createdAt: string; // ISO string
  read: boolean;     // Matches DTO "read"
  type?: string;
  entityId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationWebSocketService {
  // backend endpoints
  private apiUrl = `${environment.apiUrl}/notifications`;
  private wsUrl = environment.apiUrl.replace('http', 'ws') + '/ws'; // Convert http/https to ws/wss

  private stompClient: Client | null = null;
  
  // State management
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  
  notifications$: Observable<AppNotification[]> = this.notificationsSubject.asObservable();
  connectionStatus$: Observable<boolean> = this.connectionStatusSubject.asObservable();

  private reconnectDelay = 5000;
  private currentUserEmail: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // ==========================================
  // 1. INITIALIZATION & HTTP (History)
  // ==========================================

  /**
   * Connects to WebSocket AND fetches historical data
   */
  connect(userId: number, userEmail: string) {
    this.currentUserEmail = userEmail;
    
    
    // 1. Fetch History from DB first
    this.loadHistory();

    // 2. Connect WebSocket for Real-time updates
    if (this.stompClient?.active) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error(' No access token found');
      return;
    }

    
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl, null, {
        transports: ['xhr-streaming', 'xhr-polling']
      }),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
      },
      reconnectDelay: this.reconnectDelay,
      
      onConnect: (frame) => {
        this.connectionStatusSubject.next(true);

        // Subscribe to user specific queue
        const subscriptionPath = '/user/queue/notifications';
        
        const subscription = this.stompClient?.subscribe(
          subscriptionPath,
          (message: IMessage) => {
            this.handleRealTimeNotification(message);
          }
        );
        
        if (subscription) {
        } else {
        }
      },
      
      onStompError: (frame) => {
        console.error(' STOMP Error:', frame);
        this.connectionStatusSubject.next(false);
      },
      
      onWebSocketError: (event) => {
        console.error(' WebSocket Error:', event);
        this.connectionStatusSubject.next(false);
      },
      
      onWebSocketClose: (event) => {
        this.connectionStatusSubject.next(false);
      }
    });

    this.stompClient.activate();
  }

  /**
   * Fetch existing notifications from the REST API
   */
  loadHistory() {
    this.http.get<AppNotification[]>(this.apiUrl).subscribe({
      next: (data) => {
        // Backend returns ordered by date desc, so just set them
        this.notificationsSubject.next(data);
      },
      error: (err) => {
      }
    });
  }

  // ==========================================
  // 2. REAL-TIME HANDLING
  // ==========================================

  private handleRealTimeNotification(message: IMessage): void {
    try {
      const newNotification: AppNotification = JSON.parse(message.body);
      
      // Add new notification to the TOP of the list
      const current = this.notificationsSubject.value;
      const updated = [newNotification, ...current];
      
      this.notificationsSubject.next(updated);

      // Play sound and show browser notification
      this.playNotificationSound();
      this.showBrowserNotification(newNotification.message);

    } catch (error) {
    }
  }

  // ==========================================
  // 3. ACTIONS (Persist to Backend)
  // ==========================================

  markAsRead(index: number) {
    const currentList = this.notificationsSubject.value;
    const notification = currentList[index];

    if (!notification || notification.read) {
      return;
    }


    // Optimistic Update (update UI immediately)
    const updatedList = [...currentList];
    updatedList[index] = { ...notification, read: true };
    this.notificationsSubject.next(updatedList);

    // Call Backend
    this.http.patch<AppNotification>(`${this.apiUrl}/${notification.id}/read`, {}).subscribe({
      next: (response) => {
      },
      error: (err) => {
        // Revert on error
        this.notificationsSubject.next(currentList);
      }
    });
  }

  markAllAsRead() {
    const currentList = this.notificationsSubject.value;
    
    // Optimistic Update
    const updatedList = currentList.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(updatedList);

    // Call Backend
    this.http.patch(`${this.apiUrl}/mark-all-read`, {}).subscribe({
      next: () => {
      },
      error: (err) => {
        this.notificationsSubject.next(currentList);
      }
    });
  }

  clearNotification(index: number) {
    const currentList = this.notificationsSubject.value;
    const notification = currentList[index];

    if (!notification) {
      return;
    }


    // Optimistic Update
    const updatedList = currentList.filter((_, i) => i !== index);
    this.notificationsSubject.next(updatedList);

    // Call Backend
    this.http.delete(`${this.apiUrl}/${notification.id}`).subscribe({
      next: () => {
      },
      error: (err) => {
        this.notificationsSubject.next(currentList);
      }
    });
  }

  clearAllNotifications() {
    const currentList = this.notificationsSubject.value;
    
    // Optimistic Update (clear UI immediately)
    this.notificationsSubject.next([]);

    // Call Backend
    this.http.delete(`${this.apiUrl}/delete-all`).subscribe({
      next: () => {
      },
      error: (err) => {
        // Revert on error
        this.notificationsSubject.next(currentList);
      }
    });
  }

  // ==========================================
  // 4. NAVIGATION
  // ==========================================

  /**
   * Handle notification click and navigate to the appropriate page
   */
  handleNotificationClick(notification: AppNotification) {
  if (notification.type === 'TASK_ASSIGNMENT' && notification.entityId) {
    this.router.navigate(['/mes-taches'], {
      queryParams: { taskId: notification.entityId }
    });
  } else if (notification.type === 'ACTIVITY_ASSIGNMENT' && notification.entityId) {
    this.router.navigate(['/mes-taches'], {
      queryParams: { 
        activiteId: notification.entityId,
        tab: 'activites'          // ensures the activités tab is selected
      }
    });
  } else {
    this.router.navigate(['/mes-taches']);
  }
}

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
    this.connectionStatusSubject.next(false);
    this.currentUserEmail = null;
  }

  // ==========================================
  // 5. UTILS
  // ==========================================

  private showBrowserNotification(message: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('RedBoost', { body: message, icon: '/assets/logo.png' });
    } else {
    }
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
      });
    }
  }

  private playNotificationSound() {
    try {
      const audio = new Audio('assets/notification.mp3');
      audio.load();
    } catch (error) {
    }
  }
}