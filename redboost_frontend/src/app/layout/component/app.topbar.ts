// app.topbar.component.ts - Enhanced with better notification design

import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectorRef,
    HostListener,
} from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ChipModule } from 'primeng/chip';
import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { AuthService } from '../../pages/frontoffice/service/auth.service';
import { UserService } from '../../pages/frontoffice/service/UserService';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    FormsModule,
    Validators,
    AbstractControl,
    ValidationErrors,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { User } from '../../models/user';
import { NotificationWebSocketService, AppNotification  } from '../../pages/services/notification-websocket.service';
import { environment } from '../../../environment';

interface ExtendedUser extends Omit<User, 'profilePictureUrl'> {
    profilePictureUrl?: string;
    skills?: string;
    expertise?: string;
    bio?: string;
    linkedinUrl?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    yearsOfExperience?: number;
    startupName?: string;
    industry?: string;
}

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [
        RouterModule,
        CommonModule,
        StyleClassModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        ChipModule,
        ReactiveFormsModule,
        FormsModule,
        AppConfigurator,
        MatTooltipModule,
        MatIconModule,
        MatBadgeModule,
        CheckboxModule,
        CalendarModule,
    ],
    template: `
        <div class="layout-topbar">
            <div class="layout-topbar-left">
                <a class="layout-topbar-logo" routerLink="/">
                    <img
                        src="/assets/images/logo_redboost.png"
                        alt="Logo RedBoost"
                        class="redboost-logo"
                    />
                </a>
            </div>

            <div class="layout-topbar-right">
                <!-- Add Button -->
                <button
                    class="topbar-icon-btn add-btn"
                    routerLink="/gestion-reclamation"
                    matTooltip="Ajouter une réclamation"
                >
                    <i class="pi pi-plus"></i>
                </button>

                <!-- Notification Bell -->
                <div class="notification-bell-wrapper">
                    <button
                        class="topbar-icon-btn notification-btn"
                        (click)="toggleNotificationPanel($event)"
                        matTooltip="Notifications"
                    >
                        <mat-icon [class.has-notifications]="unreadNotificationCount > 0">
                            {{ unreadNotificationCount > 0 ? 'notifications_active' : 'notifications' }}
                        </mat-icon>
                        <!-- Custom Badge -->
                        <span class="custom-badge" *ngIf="unreadNotificationCount > 0">
                            {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
                        </span>
                    </button>

                    <!-- Connection Status -->
                    <div class="connection-status" [class.connected]="isWebSocketConnected">
                        <span class="status-dot"></span>
                    </div>

                    <!-- Notification Panel -->
                    <div class="notification-panel custom-scrollbar" *ngIf="showNotificationPanel">
                        <div class="panel-header">
                            <div class="header-title">
                                <h3>Notifications</h3>
                                <span class="notification-count" *ngIf="unreadNotificationCount > 0">
                                    {{ unreadNotificationCount }} non {{ unreadNotificationCount > 1 ? 'lues' : 'lue' }}
                                </span>
                            </div>
                            <div class="header-actions">
                                <button
                                    class="action-btn"
                                    (click)="markAllNotificationsAsRead(); $event.stopPropagation()"
                                    *ngIf="unreadNotificationCount > 0"
                                    matTooltip="Tout marquer comme lu"
                                >
                                    <mat-icon>done_all</mat-icon>
                                </button>
                                <button
                                    class="action-btn"
                                    (click)="clearAllNotifications(); $event.stopPropagation()"
                                    *ngIf="notifications.length > 0"
                                    matTooltip="Tout effacer"
                                >
                                    <mat-icon>delete_outline</mat-icon>
                                </button>
                            </div>
                        </div>

                        <div class="panel-body">
                            <div class="notification-list" *ngIf="notifications.length > 0; else noNotifications">
                                <div
                                    *ngFor="let notification of notifications; let i = index"
                                    class="notification-item"
                                    [class.unread]="!notification.read"
                                    (click)="handleNotificationClick(notification, i)"
                                >
                                    <!-- Unread Indicator -->
                                    <div class="unread-indicator" *ngIf="!notification.read"></div>
                                    
                                    <!-- Notification Icon -->
                                    <div class="notification-icon" [class.unread-icon]="!notification.read">
                                        <mat-icon>{{ getNotificationIcon(notification.type) }}</mat-icon>
                                    </div>
                                    
                                    <!-- Notification Content -->
                                    <div class="notification-content">
                                        <p class="notification-message" [class.unread-text]="!notification.read">
                                            {{ notification.message }}
                                        </p>
                                        <span class="notification-time">
                                            <mat-icon class="time-icon">schedule</mat-icon>
                                            {{ formatNotificationTime(notification.createdAt) }}
                                        </span>
                                    </div>
                                    
                                    <!-- Action Buttons -->
                                    <div class="notification-actions">
                                        <button 
                                            class="action-icon-btn mark-read-btn" 
                                            *ngIf="!notification.read"
                                            (click)="markNotificationAsRead(i); $event.stopPropagation()"
                                            matTooltip="Marquer comme lu"
                                        >
                                            <mat-icon>visibility</mat-icon>
                                        </button>
                                        <button 
                                            class="action-icon-btn remove-btn" 
                                            (click)="removeNotification(i, $event)"
                                            matTooltip="Supprimer"
                                        >
                                            <mat-icon>close</mat-icon>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <ng-template #noNotifications>
                                <div class="empty-state">
                                    <div class="empty-icon-wrapper">
                                        <mat-icon>notifications_none</mat-icon>
                                    </div>
                                    <p class="empty-title">Aucune notification</p>
                                    <p class="empty-subtitle">Vous êtes à jour !</p>
                                </div>
                            </ng-template>
                        </div>
                    </div>
                </div>

                <!-- Profile Menu -->
                <div class="profile-menu-container">
                    <button
                        class="topbar-icon-btn profile-btn"
                        (click)="toggleProfileMenu($event)"
                    >
                        <div class="profile-avatar">
                            <img
                                *ngIf="user?.profilePictureUrl"
                                [src]="getProfilePictureUrl(user.profilePictureUrl)"
                                alt="Photo de profil"
                                class="profile-picture"
                                (error)="handleImageError($event)"
                            />
                            <i *ngIf="!user?.profilePictureUrl" class="pi pi-user"></i>
                        </div>
                    </button>
                    <div class="profile-dropdown custom-scrollbar" *ngIf="showProfileDropdown">
                        <div class="dropdown-header">
                            <h3>{{ user?.firstName || 'Utilisateur' }} {{ user?.lastName || '' }}</h3>
                            <span class="profile-role">{{ user?.role || 'Rôle inconnu' }}</span>
                        </div>
                        <div class="dropdown-body">
                            <a class="profile-item" (click)="navigateToProfile()">
                                <i class="pi pi-user"></i>
                                <span>Voir le profil</span>
                            </a>
                            <a class="profile-item" (click)="showSettings()">
                                <i class="pi pi-pencil"></i>
                                <span>Modifier le profil</span>
                            </a>
                            <div class="separator"></div>
                            <a class="profile-item" (click)="logout()">
                                <i class="pi pi-sign-out"></i>
                                <span>Déconnexion</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styleUrls: ['./app.topbar.scss'],
})
export class AppTopbar implements OnInit, OnDestroy {
    userId: number | null = null;
    userRole: string | null = null;
    user: ExtendedUser = {
        id: 0,
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: '',
        profilePictureUrl: '',
    };
    showProfileDropdown: boolean = false;
    settingsVisible: boolean = false;
    profileForm: FormGroup;

    // Notification properties
    notifications: AppNotification[] = [];
    unreadNotificationCount: number = 0;
    showNotificationPanel: boolean = false;
    isWebSocketConnected: boolean = false;

    private subscriptions: Subscription[] = [];

    constructor(
        public layoutService: LayoutService,
        private authService: AuthService,
        private router: Router,
        private userService: UserService,
        private http: HttpClient,
        private cdr: ChangeDetectorRef,
        private fb: FormBuilder,
        private messageService: MessageService,
        private notificationService: NotificationWebSocketService,
    ) {
        this.profileForm = this.fb.group({});
    }

    ngOnInit(): void {
        // Subscribe to notifications
        this.subscriptions.push(
            this.notificationService.notifications$.subscribe(notifications => {
                this.notifications = notifications;
                this.unreadNotificationCount = notifications.filter(n => !n.read).length;
                this.cdr.detectChanges();
            })
        );

        // Subscribe to connection status
        this.subscriptions.push(
            this.notificationService.connectionStatus$.subscribe(status => {
                this.isWebSocketConnected = status;
                this.cdr.detectChanges();
            })
        );

        // Initialize user
       // AFTER
this.authService.getCurrentUser().subscribe({
    next: (user) => {
        if (user) {
            this.userId = user.id;
            this.userRole = user.role?.toLowerCase() || null;

            if (user.email && user.id) {
                this.notificationService.connect(user.id, user.email);
                this.notificationService.requestNotificationPermission();
            }

            // Fetch full profile to get profilePictureUrl
            const token = localStorage.getItem('accessToken');
            const headers = { Authorization: `Bearer ${token}` };
            this.http.get<any>(`${environment.apiUrl}/users/profile`, { headers }).subscribe({
                next: (profile) => {
                    this.user = {
                        ...this.user,
                        ...profile,
                        profilePictureUrl: this.buildImageUrl(profile.profilePictureUrl)
                    };
                    this.cdr.detectChanges();
                }
            });
        }
        this.cdr.detectChanges();
    }
});}
buildImageUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const base = environment.apiUrl.replace(/\/api$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}
    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        this.notificationService.disconnect();
    }

    // Notification methods
    toggleNotificationPanel(event: Event): void {
        event.stopPropagation();
        this.showNotificationPanel = !this.showNotificationPanel;
        this.showProfileDropdown = false;
        this.cdr.detectChanges();
    }

    markNotificationAsRead(index: number): void {
        this.notificationService.markAsRead(index);
    }

    markAllNotificationsAsRead(): void {
        this.notificationService.markAllAsRead();
    }

    handleNotificationClick(notification: AppNotification, index: number): void {
        this.notificationService.markAsRead(index);
        this.showNotificationPanel = false;
        this.notificationService.handleNotificationClick(notification);
        this.cdr.detectChanges();
    }

    removeNotification(index: number, event: Event): void {
        event.stopPropagation();
        this.notificationService.clearNotification(index);
    }

    clearAllNotifications(): void {
        if (confirm('Êtes-vous sûr de vouloir effacer toutes les notifications ?')) {
            this.notificationService.clearAllNotifications();
        }
    }

    getNotificationIcon(type?: string): string {
        const icons: Record<string, string> = {
            'TASK_ASSIGNMENT': 'assignment',
            'ACTIVITY_ASSIGNMENT': 'event_available',
            'TASK_COMPLETED': 'check_circle',
            'TASK_OVERDUE': 'warning',
            'DEFAULT': 'notifications'
        };
        return icons[type || 'DEFAULT'] || icons['DEFAULT'];
    }

    formatNotificationTime(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes} min`;
        if (hours < 24) return `Il y a ${hours}h`;
        if (days < 7) return `Il y a ${days}j`;
        
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
        });
    }

    showSettings(): void {
        this.settingsVisible = true;
        this.showProfileDropdown = false;
    }

    logout(): void {
        this.authService.logout().subscribe({
            next: () => {
                this.notificationService.disconnect();
                this.router.navigate(['/landing']);
            },
        });
    }

    navigateToProfile(): void {
        this.router.navigate(['/profile']);
        this.showProfileDropdown = false;
    }

    toggleProfileMenu(event: Event): void {
        event.stopPropagation();
        this.showProfileDropdown = !this.showProfileDropdown;
        this.showNotificationPanel = false;
    }
getProfilePictureUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Strip trailing /api or / from base URL, then prepend
    const base = environment.apiUrl.replace(/\/api$/, '').replace(/\/$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}
    handleImageError(event: Event): void {
        const imgElement = event.target as HTMLImageElement;
        imgElement.src = '/assets/images/default-profile.png';
        this.user = { ...this.user, profilePictureUrl: '' };
    }

    @HostListener('document:click', ['$event'])
    closeDropdown(event: Event): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.profile-menu-container')) {
            this.showProfileDropdown = false;
        }
        if (!target.closest('.notification-bell-wrapper')) {
            this.showNotificationPanel = false;
        }
        this.cdr.detectChanges();
    }
}