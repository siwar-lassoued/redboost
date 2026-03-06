/* import { Pipe, PipeTransform } from '@angular/core';

interface Notification {
    id: number;
    userId: number;
    senderId: number;
    message: string;
    createdAt: string;
    isRead: boolean;
}

@Pipe({
    name: 'filterNotifications',
    standalone: true,
})
export class FilterNotificationsPipe implements PipeTransform {
    transform(notifications: Notification[], filter: string): Notification[] {
        if (filter === 'unread') {
            return notifications.filter((n) => !n.isRead);
        }
        return notifications; // 'all' filter returns all notifications
    }
}
 */