// src/app/pages/services/notification-websocket.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';

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
  private apiUrl = 'https://redboost.tn/api/notifications';
  private wsUrl = 'https://redboost.tn/ws';

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
    
    console.log('🚀 Starting connection process for user:', userEmail);
    
    // 1. Fetch History from DB first
    this.loadHistory();

    // 2. Connect WebSocket for Real-time updates
    if (this.stompClient?.active) {
      console.log('⚠️ WebSocket already connected');
      return;
    }

    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('❌ No access token found');
      return;
    }

    console.log('🔐 Using token:', token.substring(0, 20) + '...');
    
    this.stompClient = new Client({
      webSocketFactory: () => {
        console.log('🏭 Creating WebSocket connection...');
        return new SockJS(this.wsUrl) as any;
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        console.log('🔍 STOMP Debug:', str);
      },
      reconnectDelay: this.reconnectDelay,
      
      onConnect: (frame) => {
        console.log('✅ WebSocket Connected Successfully!', frame);
        this.connectionStatusSubject.next(true);

        // Subscribe to user specific queue
        const subscriptionPath = '/user/queue/notifications';
        console.log('📡 Subscribing to:', subscriptionPath);
        
        const subscription = this.stompClient?.subscribe(
          subscriptionPath,
          (message: IMessage) => {
            console.log('📨 Raw message received:', message);
            this.handleRealTimeNotification(message);
          }
        );
        
        if (subscription) {
          console.log('✅ Successfully subscribed to notifications queue');
        } else {
          console.error('❌ Failed to subscribe to notifications queue');
        }
      },
      
      onStompError: (frame) => {
        console.error('❌ STOMP Error:', frame);
        this.connectionStatusSubject.next(false);
      },
      
      onWebSocketError: (event) => {
        console.error('❌ WebSocket Error:', event);
        this.connectionStatusSubject.next(false);
      },
      
      onWebSocketClose: (event) => {
        console.log('🔌 WebSocket Closed:', event);
        this.connectionStatusSubject.next(false);
      }
    });

    console.log('🔄 Activating STOMP client...');
    this.stompClient.activate();
  }

  /**
   * Fetch existing notifications from the REST API
   */
  loadHistory() {
    console.log('📚 Loading notification history...');
    this.http.get<AppNotification[]>(this.apiUrl).subscribe({
      next: (data) => {
        console.log('✅ Loaded', data.length, 'notifications from history');
        // Backend returns ordered by date desc, so just set them
        this.notificationsSubject.next(data);
      },
      error: (err) => {
        console.error('❌ Failed to load notification history', err);
      }
    });
  }

  // ==========================================
  // 2. REAL-TIME HANDLING
  // ==========================================

  private handleRealTimeNotification(message: IMessage): void {
    console.log('🎯 Processing real-time notification...');
    try {
      const newNotification: AppNotification = JSON.parse(message.body);
      console.log('✅ Parsed notification:', newNotification);
      
      // Add new notification to the TOP of the list
      const current = this.notificationsSubject.value;
      const updated = [newNotification, ...current];
      
      console.log('📊 Updating notifications list. New count:', updated.length);
      this.notificationsSubject.next(updated);

      // Play sound and show browser notification
      this.playNotificationSound();
      this.showBrowserNotification(newNotification.message);

    } catch (error) {
      console.error('❌ Error parsing notification:', error);
    }
  }

  // ==========================================
  // 3. ACTIONS (Persist to Backend)
  // ==========================================

  markAsRead(index: number) {
    const currentList = this.notificationsSubject.value;
    const notification = currentList[index];

    if (!notification || notification.read) {
      console.log('⚠️ Notification already read or not found');
      return;
    }

    console.log('📝 Marking notification as read:', notification.id);

    // Optimistic Update (update UI immediately)
    const updatedList = [...currentList];
    updatedList[index] = { ...notification, read: true };
    this.notificationsSubject.next(updatedList);

    // Call Backend
    this.http.patch<AppNotification>(`${this.apiUrl}/${notification.id}/read`, {}).subscribe({
      next: (response) => {
        console.log('✅ Successfully marked as read on server');
      },
      error: (err) => {
        // Revert on error
        console.error('❌ Failed to mark as read on server:', err);
        this.notificationsSubject.next(currentList);
      }
    });
  }

  markAllAsRead() {
    console.log('📝 Marking all notifications as read');
    const currentList = this.notificationsSubject.value;
    
    // Optimistic Update
    const updatedList = currentList.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(updatedList);

    // Call Backend
    this.http.patch(`${this.apiUrl}/mark-all-read`, {}).subscribe({
      next: () => {
        console.log('✅ All notifications marked as read');
      },
      error: (err) => {
        console.error('❌ Failed to mark all as read:', err);
        this.notificationsSubject.next(currentList);
      }
    });
  }

  clearNotification(index: number) {
    const currentList = this.notificationsSubject.value;
    const notification = currentList[index];

    if (!notification) {
      console.log('⚠️ Notification not found');
      return;
    }

    console.log('🗑️ Deleting notification:', notification.id);

    // Optimistic Update
    const updatedList = currentList.filter((_, i) => i !== index);
    this.notificationsSubject.next(updatedList);

    // Call Backend
    this.http.delete(`${this.apiUrl}/${notification.id}`).subscribe({
      next: () => {
        console.log('✅ Notification deleted');
      },
      error: (err) => {
        console.error('❌ Failed to delete notification:', err);
        this.notificationsSubject.next(currentList);
      }
    });
  }

  clearAllNotifications() {
    console.log('🗑️ Clearing all notifications');
    const currentList = this.notificationsSubject.value;
    
    // Optimistic Update (clear UI immediately)
    this.notificationsSubject.next([]);

    // Call Backend
    this.http.delete(`${this.apiUrl}/delete-all`).subscribe({
      next: () => {
        console.log('✅ All notifications deleted from server');
      },
      error: (err) => {
        console.error('❌ Failed to delete all notifications:', err);
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
    console.log('🔗 Handling notification click:', notification);

    // Navigate based on notification type
    if (notification.type === 'TASK_ASSIGNMENT' && notification.entityId) {
      // Navigate to mes-taches with the task ID as a query parameter
      this.router.navigate(['/mes-taches'], {
        queryParams: { taskId: notification.entityId }
      });
      console.log('🔗 Navigating to task:', notification.entityId);
    } else {
      // Default navigation to mes-taches
      this.router.navigate(['/mes-taches']);
      console.log('🔗 Navigating to mes-taches (default)');
    }
  }

  disconnect() {
    console.log('🔌 Disconnecting WebSocket...');
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
      console.log('🔔 Showing browser notification');
      new Notification('RedBoost', { body: message, icon: '/assets/logo.png' });
    } else {
      console.log('⚠️ Browser notifications not permitted');
    }
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      console.log('🔔 Requesting notification permission');
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission:', permission);
      });
    }
  }

  private playNotificationSound() {
    try {
      const audio = new Audio('assets/notification.mp3');
      audio.load();
      audio.play().catch(e => console.log('⚠️ Audio play failed:', e));
    } catch (error) {
      console.log('⚠️ Could not play notification sound:', error);
    }
  }
}