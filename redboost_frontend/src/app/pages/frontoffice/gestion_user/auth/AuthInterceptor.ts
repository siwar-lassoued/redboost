import {
    HttpInterceptorFn,
    HttpRequest,
    HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { MessageService } from 'primeng/api';

export const AuthInterceptor: HttpInterceptorFn = (
    req: HttpRequest<any>,
    next: HttpHandlerFn,
) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const messageService = inject(MessageService);

    // Define public API endpoints (without trailing slashes)
    const publicEndpoints = [
        '/api/auth/login',
        '/api/auth/refresh',
        '/api/auth/confirm-email',
        '/api/auth/resend-confirmation',
        '/api/about',
        '/api/services',
        '/api/resources',
        '/api/landing',
        '/api/marketlanding',
        '/api/contactlanding',
        '/api/public/about',
        '/api/public/services',
        '/api/public/resources',
        '/api/public/landing',
        '/api/public/marketlanding',
        '/api/public/contactlanding',
        '/api/projets/GetAllPublic',
        '/api/coach/submit',
        '/api/coach/binome',
    ];

    // Normalize request path: remove domain + trailing slash
    const requestPath = req.url
        .replace(/^https?:\/\/[^\/]+/, '')
        .replace(/\/$/, '');
    console.log(`Intercepted URL: ${req.url}`);
    console.log(`Normalized path: ${requestPath}`);

    // Check if it's a public endpoint
    const isPublic = publicEndpoints.includes(requestPath);
    console.log(`Is public: ${isPublic}`);

    if (isPublic) {
        console.log(
            `Skipping AuthInterceptor for public endpoint: ${requestPath}`,
        );

        const publicReq = req.clone({
            headers: req.headers.delete('Authorization'),
            withCredentials: false,
        });

        return next(publicReq);
    }

    // Skip interceptor for login, refresh, and confirm-email endpoints
    if (
        req.url.includes('/Auth/login') ||
        req.url.includes('/Auth/refresh') ||
        req.url.includes('/Auth/confirm-email')
    ) {
        console.log(`Skipping AuthInterceptor for ${req.url}`);
        return next(req.clone({ withCredentials: true }));
    }

    const accessToken = localStorage.getItem('accessToken');

    let clonedReq = req;
    if (accessToken) {
        clonedReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true,
        });
    }

    return next(clonedReq).pipe(
        catchError((error) => {
            if (error.status === 401 && !authService.isRefreshing) {
                authService.isRefreshing = true;
                console.log('Access token expired, attempting to refresh');

                return authService.refreshToken().pipe(
                    switchMap((response: any) => {
                        console.log(
                            'Refresh successful, new access token:',
                            response.accessToken,
                        );
                        localStorage.setItem(
                            'accessToken',
                            response.accessToken,
                        );
                        authService.isRefreshing = false;

                        const newReq = req.clone({
                            setHeaders: {
                                Authorization: `Bearer ${response.accessToken}`,
                            },
                            withCredentials: true,
                        });

                        return next(newReq);
                    }),
                    catchError((refreshError) => {
                        console.error('Refresh token failed:', refreshError);
                        authService.isRefreshing = false;
                        authService.logout().subscribe({
                            next: () => {
                                messageService.add({
                                    severity: 'error',
                                    summary: 'Session expirée',
                                    detail: 'Votre session a expirée. Veuillez vous reconnecter.',
                                });
                                router.navigate(['/landing']);
                            },
                            error: (logoutError) =>
                                console.error('Logout failed:', logoutError),
                        });
                        return throwError(() => refreshError);
                    }),
                );
            }

            if (error.status === 403) {
                // Skip redirect for project and conversation endpoints
                if (
                    req.url.includes('/projects') ||
                    req.url.includes('/projet') ||
                    req.url.includes('/api/conversations')
                ) {
                    console.warn(
                        `Access denied to ${req.url} (403). Skipping redirect for protected resource.`,
                    );
                    return throwError(() => error); // Let the component handle the error
                }

                // Simply throw the error without redirecting
                return throwError(() => error);
            }

            return throwError(() => error);
        }),
    );
};
