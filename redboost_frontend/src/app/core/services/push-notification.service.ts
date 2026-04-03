import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { UserService } from './user.service';
import { NotificationService, AppNotification } from './notification.service';
import { environment } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
    private readonly http = inject(HttpClient);
    private readonly userSvc = inject(UserService);
    private readonly notifSvc = inject(NotificationService);

    permission$ = new BehaviorSubject<NotificationPermission>('default');

    async requestPermissionAndSubscribe(): Promise<void> {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

        const permission = await Notification.requestPermission();
        this.permission$.next(permission);

        if (permission !== 'granted') return;

        try {
            const { getMessaging, getToken, onMessage } = await import('@angular/fire/messaging').catch(() => null as any) ?? {};
            if (!getMessaging) return;

            const { getApp } = await import('@angular/fire/app');
            const messaging = getMessaging(getApp());
            const token: string = await getToken(messaging, { vapidKey: environment.firebase.vapidKey });

            if (token) {
                this.userSvc.saveFcmToken(token).subscribe();
            }

            onMessage(messaging, (payload: any) => {
                const notif: AppNotification = {
                    id: crypto.randomUUID(),
                    type: payload.data?.['type'] ?? 'info',
                    titre: payload.notification?.title ?? 'RedBoost',
                    corps: payload.notification?.body ?? '',
                    lu: false,
                    url: payload.data?.['url'],
                    createdAt: new Date(),
                };
                this.notifSvc.addLocal(notif);
            });
        } catch (err) {
            console.warn('FCM not configured yet:', err);
        }
    }
}
