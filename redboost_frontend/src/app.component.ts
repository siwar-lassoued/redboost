// app.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from './app/pages/frontoffice/service/auth.service';
import { UserService } from './app/pages/frontoffice/service/UserService';
import { NotificationWebSocketService } from './app/pages/services/notification-websocket.service';
import { HttpClient } from '@angular/common/http';
import { ToastModule } from 'primeng/toast';
import { filter } from 'rxjs/operators';
import { environment } from './environment';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterModule, RouterOutlet, ToastModule],
    template: ` <router-outlet></router-outlet> <p-toast></p-toast> `,
    styleUrls: ['./app.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent implements OnInit, OnDestroy {
    private publicRoutes = [
        '/signin',
        '/signup',
        '/forgot-password',
        '/reset-password',
        '/confirm-email',
        '/coach-request',
        '/binome-coach-request',
        '/about',
        '/redstarter',
        '/entrepreneurial',
        '/resources',
        '/marketlanding',
        '/contactlanding',
        '/landing-marketplace',
        '/privacy',
        '/',
    ];

    constructor(
        private authService: AuthService,
        private router: Router,
        private userService: UserService,
        private http: HttpClient,
        private notificationService: NotificationWebSocketService, // ✅ Inject notification service
    ) {}

    ngOnInit() {

        // Subscribe to NavigationEnd to get the correct URL after routing
        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                const currentUrl = event.urlAfterRedirects.split('?')[0];

                const isPublicRoute = this.publicRoutes.includes(currentUrl);
               

                if (isPublicRoute) {
                    return;
                }

                this.checkAuthentication();
            });
    }

    ngOnDestroy() {
        this.notificationService.disconnect();
    }

    private checkAuthentication() {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!accessToken && !refreshToken) {
            this.handleAuthFailure();
            return;
        }

        if (accessToken && refreshToken) {
            this.authService.verifyToken().subscribe({
                next: (response) => {
                    this.fetchUserProfile();
                },
                error: (error) => {
                    this.attemptTokenRefresh();
                },
            });
        } else {
            this.attemptTokenRefresh();
        }
    }

    private attemptTokenRefresh() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            this.handleAuthFailure();
            return;
        }

        this.authService.refreshToken().subscribe({
            next: (response: any) => {
                localStorage.setItem('accessToken', response.accessToken);
                localStorage.setItem('refreshToken', response.refreshToken);
                this.fetchUserProfile();
            },
            error: (error) => {
                this.handleAuthFailure();
            },
        });
    }

    private handleAuthFailure() {
        this.clearTokens();
        this.userService.setUser(null);
        this.notificationService.disconnect(); 
        this.router.navigate(['/']);
    }

    private fetchUserProfile() {
        this.http
            .get(`${environment.apiUrl}/users/profile`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            })
            .subscribe({
                next: (response: any) => {
                    this.userService.setUser(response);
                    
                
                    if (response?.id && response?.email) {
                        this.notificationService.connect(response.id, response.email);
                        this.notificationService.requestNotificationPermission();
                    }
                },
                error: (error) => {
                    this.userService.setUser(null);
                },
            });
    }

    private clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
}