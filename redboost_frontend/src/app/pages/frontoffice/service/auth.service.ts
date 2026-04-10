import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import {
    catchError,
    Observable,
    of,
    switchMap,
    tap,
    finalize,
    throwError,
} from 'rxjs';
import { environment } from '../../../../environment';
import { Auth, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth'; // Import Auth from AngularFire
import { jwtDecode } from 'jwt-decode';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    [x: string]: any;
    private readonly API_URL = `${environment.apiUrl}/Auth`; // Use environment.apiUrl with /Auth
    isRefreshing = false;
    private token: string | null = null;

    constructor(
        private http: HttpClient,
        private router: Router,
        private messageService: MessageService,
        private auth: Auth,
    ) {
        // Initialize token from localStorage
        this.token = localStorage.getItem('accessToken');
    }

    // auth.service.ts
    login(email: string, password: string): Observable<any> {
        return this.http
            .post(
                `${this.API_URL}/login`,
                { email, password },
                { withCredentials: true }, // Include cookies
            )
            .pipe(
                tap((response: any) => {
                    // Store tokens in localStorage for quick access
                    localStorage.setItem('accessToken', response.accessToken);
                    localStorage.setItem('refreshToken', response.refreshToken);
                }),
            );
    }

    refreshToken(): Observable<any> {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
            return throwError(() => new Error('No refresh token found'));
        }

        return this.http
            .post(
                `${this.API_URL}/refresh`,
                { refreshToken },
                { withCredentials: true },
            )
            .pipe(
                tap((response: any) => {
                    // Store the new access token in localStorage
                    localStorage.setItem('accessToken', response.accessToken);
                    // Update the token in memory as well
                    this.token = response.accessToken;
                }),
                catchError((error) => {
                    // Clear tokens on refresh failure
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    return throwError(error);
                }),
            );
    }

    resendConfirmationEmail(email: string): Observable<any> {
        return this.http.post(`${this.API_URL}/resend-confirmation`, { email });
    }

    // Google Login using the new modular Firebase SDK
    async googleLogin(): Promise<Observable<any>> {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });

            const result = await signInWithPopup(this.auth, provider);
            const idToken = await result.user?.getIdToken();


            const loginPayload = { idToken };

            return this.http.post(`${this.API_URL}/firebase`, loginPayload, {
                withCredentials: true,
            });
        } catch (error) {
            this.messageService.add({
                severity: 'error',
                summary: 'Google Error',
                detail: 'Login failed',
            });
            throw error;
        }
    }

    // Get the user role from the decoded JWT token
    getUserRole(): string | null {
        const token = this.getToken();
        if (!token) {
            return null;
        }
        try {
            const decodedToken: any = jwtDecode(token);
            return decodedToken.role; // Matches "role" claim from JwtUtil
        } catch (error) {
            return null;
        }
    }

    verifyToken(): Observable<any> {
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
            return throwError(() => new Error('No access token found'));
        }

        return this.http.get(`${this.API_URL}/verifyToken`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
    }

    getToken(): string | null {
        if (this.token) {
            return this.token;
        }
        return localStorage.getItem('accessToken');
    }

    getUserId(): string | null {
        const token = this.getToken();
        if (!token) {
            return null;
        }
        try {
            const decodedToken: any = jwtDecode(token);
            return decodedToken.userId; // Matches "userId" claim from JwtUtil
        } catch (error) {
            return null;
        }
    }

    // auth.service.ts
    logout(): Observable<any> {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return this.http
            .post(`${this.API_URL}/logout`, {}, { withCredentials: true })
            .pipe(
                catchError((error) => {
                    return throwError(error);
                }),
            );
    }

    // Nouvelle méthode pour récupérer l'ID et le rôle de l'utilisateur connecté
    getCurrentUser(): Observable<{
        id: number;
        role: string;
        email?: string;
    } | null> {
        const token = this.getToken();
        if (!token) return of(null);

        try {
            const decodedToken: any = jwtDecode(token);
            return of({
                id: parseInt(decodedToken.userId, 10),
                role: decodedToken.role,
                email: decodedToken.sub, // Use sub claim as email since that's where it's stored in the token
            });
        } catch (error) {
            return of(null);
        }
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        const token = this.getToken();
        return !!token;
    }

    // Check if the current route is a public route
    isPublicRoute(url: string): boolean {
        const publicRoutes = [
            '/signin',
            '/signup',
            '/forgot-password',
            '/reset-password',
            '/confirm-email',
            '/coach-request',
            '/',
            '/landing-marketplace',
        ];
        return publicRoutes.some((route) => url.startsWith(route));
    }

    // Method to handle API requests with token refresh
    handleRequest<T>(request: Observable<T>): Observable<T> {
        return request.pipe(
            catchError((error: any) => {
                if (error.status === 401 || error.status === 403) {
                    if (!this.isRefreshing) {
                        this.isRefreshing = true;
                        return this.refreshToken().pipe(
                            switchMap(() => {
                                // Retry the original request with new token
                                return request;
                            }),
                            finalize(() => {
                                this.isRefreshing = false;
                            }),
                        );
                    }
                    // If already refreshing, wait for it to complete
                    return this.refreshToken().pipe(
                        switchMap(() => {
                            return request;
                        }),
                    );
                }
                return throwError(() => error);
            }),
        );
    }
}