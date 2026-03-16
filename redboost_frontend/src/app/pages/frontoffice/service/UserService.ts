import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environment'; // Import environment

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private userSubject = new BehaviorSubject<any>(null);
    user$ = this.userSubject.asObservable();
    private userCache = new Map<number, any>(); // Cache for user profiles
    private apiUrl = environment.apiUrl; // Use environment.apiUrl

    constructor(private http: HttpClient) {}

    // Set user data
    setUser(user: any): void {
        this.userSubject.next(user);
        if (user?.id) {
            this.userCache.set(user.id, user); // Cache current user
        }
    }

    // Fetch all coach requests
    getAllCoachRequests(): Observable<any[]> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`, // Updated to 'accessToken'
        });
        return this.http
            .get<any[]>(`${this.apiUrl}/coach/requests`, { headers })
            .pipe(
                catchError((error) => {
                    throw error; // Let the component handle the error
                }),
            );
    }

    // Get user data
    getUser(): any {
        return this.userSubject.value;
    }

    // Fetch user by ID with caching
    getUserById(userId: number): Observable<any> {
        if (this.userCache.has(userId)) {
            return of(this.userCache.get(userId));
        }
        const headers = new HttpHeaders({
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`, // Updated to 'accessToken'
        });
        return this.http
            .get(`${this.apiUrl}/users/${userId}`, { headers })
            .pipe(
                tap((user) => {
                    this.userCache.set(userId, user);
                }),
                catchError((error) => {
                   
                    return of(null);
                }),
            );
    }

    submitCoachRequest(formData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}/coach/submit`, formData);
    }

    submitBinomeCoachRequest(formData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}/coach/binome`, formData);
    }

    getUsers(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/users/ByRoles`);
    }

    approveCoachRequest(requestId: number): Observable<any> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`, // Updated to 'accessToken'
        });
        return this.http
            .post(`${this.apiUrl}/coach/approve/${requestId}`, {}, { headers })
            .pipe(
                catchError((error) => {
                   
                    throw error;
                }),
            );
    }

    rejectCoachRequest(requestId: number): Observable<any> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`, // Updated to 'accessToken'
        });
        return this.http
            .post(`${this.apiUrl}/coach/reject/${requestId}`, {}, { headers })
            .pipe(
                catchError((error) => {
                    
                    throw error;
                }),
            );
    }
}
