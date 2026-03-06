import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environment';

@Injectable({
    providedIn: 'root',
})
export class ImageService {
    private logoUrlCache = new Map<string, SafeUrl>();
    private avatarUrlCache = new Map<string, SafeUrl>();
    defaultImage = '/assets/images/default-logo.png';
    defaultAvatar =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADPSURBVHhe7dEBDQAgAMAw3/yvOQ9NswkJoQMIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAgAAQAAIAAEgAASAABAAAgAAQAALWot3pD5K6gAAAABJRU5ErkJggg==';
    imageLoadStatus: { [key: string]: 'loaded' | 'failed' | 'loading' } = {};

    constructor(
        private http: HttpClient,
        private sanitizer: DomSanitizer,
    ) {}

    sanitizedImageUrl(url: string | null | undefined): Observable<SafeUrl> {
        if (
            !url ||
            url === 'null' ||
            url.trim() === '' ||
            this.imageLoadStatus[url] === 'failed'
        ) {
            return of(this.sanitizer.bypassSecurityTrustUrl(this.defaultImage));
        }

        if (this.logoUrlCache.has(url)) {
            return of(this.logoUrlCache.get(url)!);
        }

        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            console.error('No access token found');
            return of(this.sanitizer.bypassSecurityTrustUrl(this.defaultImage));
        }

        const headers = new HttpHeaders({
            Authorization: `Bearer ${accessToken}`,
        });

        const fullUrl = url.startsWith('http')
            ? url
            : `${environment.apiUploads}${url.startsWith('/uploads') ? url : `/${url}`}`;
        this.imageLoadStatus[fullUrl] = 'loading';

        return this.http.get(fullUrl, { headers, responseType: 'blob' }).pipe(
            map((blob) => {
                const objectUrl = URL.createObjectURL(blob);
                const safeUrl =
                    this.sanitizer.bypassSecurityTrustUrl(objectUrl);
                this.logoUrlCache.set(url, safeUrl);
                this.imageLoadStatus[fullUrl] = 'loaded';
                return safeUrl;
            }),
            catchError((error) => {
                console.error('Failed to fetch image:', error);
                this.imageLoadStatus[fullUrl] = 'failed';
                return of(
                    this.sanitizer.bypassSecurityTrustUrl(this.defaultImage),
                );
            }),
        );
    }

    sanitizedAvatarUrl(url: string | null | undefined): Observable<SafeUrl> {
        if (!url || url === 'null' || url.trim() === '') {
            return of(
                this.sanitizer.bypassSecurityTrustUrl(this.defaultAvatar),
            );
        }

        if (this.avatarUrlCache.has(url)) {
            return of(this.avatarUrlCache.get(url)!);
        }

        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            console.error('No access token found');
            return of(
                this.sanitizer.bypassSecurityTrustUrl(this.defaultAvatar),
            );
        }

        const headers = new HttpHeaders({
            Authorization: `Bearer ${accessToken}`,
        });

        let fullUrl = url;
        if (url.startsWith('/api/projets/Getcardfounder')) {
            fullUrl = `${environment.apiUrl}${url}`;
        } else {
            fullUrl = url.startsWith('http')
                ? url
                : `${environment.apiUploads}${url.startsWith('/uploads') ? url : `/${url}`}`;
        }

        return this.http.get(fullUrl, { headers, responseType: 'blob' }).pipe(
            map((blob) => {
                const objectUrl = URL.createObjectURL(blob);
                const safeUrl =
                    this.sanitizer.bypassSecurityTrustUrl(objectUrl);
                this.avatarUrlCache.set(url, safeUrl);
                return safeUrl;
            }),
            catchError((error) => {
                console.error('Failed to fetch avatar:', error);
                return of(
                    this.sanitizer.bypassSecurityTrustUrl(this.defaultAvatar),
                );
            }),
        );
    }

    clearCache(): void {
        this.logoUrlCache.clear();
        this.avatarUrlCache.clear();
    }
}
