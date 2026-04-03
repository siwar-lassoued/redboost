import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, throwError, catchError } from 'rxjs';
import { AuthUser, UserRole } from '../models/user.model';
import { APP_ROUTES } from '../constants/routes.constants';
import { environment } from '../../../environment';

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'rb_user';

import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    currentUser$ = new BehaviorSubject<AuthUser | null>(this.loadStoredUser());

    private loadStoredUser(): AuthUser | null {
        try {
            if (typeof localStorage === 'undefined') return null;
            const token = localStorage.getItem(TOKEN_KEY);
            if (!token) return null;
            const decodedToken: any = jwtDecode(token);
            return {
                id: parseInt(decodedToken.userId, 10),
                role: decodedToken.role,
                email: decodedToken.sub,
                token: token
            } as any;
        } catch {
            return null;
        }
    }

    login(email: string, password: string): Observable<AuthUser> {
        return this.http
            .post<AuthUser>(`${environment.apiUrl}/auth/login`, { email, password })
            .pipe(
                tap(user => this.storeUser(user)),
                catchError(err => {
                    const msg = err.error?.message ?? 'Identifiants invalides.';
                    return throwError(() => new Error(msg));
                }),
            );
    }

    logout(): void {
        this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        this.currentUser$.next(null);
        this.router.navigate([APP_ROUTES.AUTH]);
    }

    changePassword(currentPassword: string, newPassword: string): Observable<void> {
        const email = this.currentUser$.value?.email;
        return this.http.post<void>(`${environment.apiUrl}/auth/change-password`, {
            email,
            currentPassword,
            newPassword,
        });
    }

    isAuthenticated(): boolean {
        return !!this.currentUser$.value;
    }

    isLoggedIn(): boolean {
        return this.isAuthenticated();
    }

    hasRole(role: UserRole): boolean {
        return this.currentUser$.value?.role === role;
    }

    getRole(): UserRole | undefined {
        return this.currentUser$.value?.role;
    }

    getToken(): string | null {
        if (typeof localStorage === 'undefined') return null;
        return localStorage.getItem(TOKEN_KEY);
    }

    redirectByRole(user: AuthUser): void {
        const role = user.role?.toUpperCase();
        let target: string = APP_ROUTES.AUTH;

        if (role === 'ADMIN') target = APP_ROUTES.ADMIN.DASHBOARD;
        else if (role === 'COACH') target = APP_ROUTES.COACH.DASHBOARD;
        else if (role === 'ENTREPRENEUR') target = APP_ROUTES.ENTREPRENEUR.DASHBOARD;

        console.log('Redirecting user to:', target, 'Role:', role);
        this.router.navigateByUrl(target);
    }

    private storeUser(user: AuthUser): void {
        localStorage.setItem(TOKEN_KEY, user.token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUser$.next(user);
    }
}
