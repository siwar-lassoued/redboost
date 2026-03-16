import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { UserService } from '../../service/UserService';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { User } from '../../../../models/user';
import { environment } from '../../../../../environment';
import { ProfileUpdateDialogComponent } from '../update-profile/update-profile';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule, ProfileUpdateDialogComponent],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    providers: [MessageService],
})
export class UserProfileComponent implements OnInit {
    user: any = {
        id: 0,
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: '',
        profilePictureUrl: '',
        bio: '',
        facebookUrl: '',
        instagramUrl: '',
        linkedinUrl: '',
        yearsOfExperience: null,
        skills: '',
        expertise: '',
        startupName: '',
        industry: '',
        formationAcademNom: '',
        formationAcademDate: '',
        formationAcademRealisations: '',
        nbEntreCoaches: null,
        competencesProNom: '',
        competencesProDate: '',
        competencesProCertificat: '',
        succesClient: '',
        engagementCommunautaire: '',
        sessionEssai: null,
        formaAcademNom: '',
        formaAcademDate: '',
        formaAcademRealisations: '',
        apprentInformelNom: '',
        apprentInformelDate: '',
        apprentInformelCertificat: '',
        obstaclePrincipal: '',
        investmentFocus: '',
        dateNaissance: null,
        secteur: '',
        region: '',
        entreprise: '',
    };
    isLoading: boolean = true;
    projetContacts: { [key: number]: any } = {};
    projectContactAvatars: {
        [projectId: number]: { [userId: number]: SafeUrl };
    } = {};
    isLoadingContacts: boolean = false;
    private avatarUrlCache = new Map<string, SafeUrl>();
    defaultAvatar = 'assets/default-profile.png';
    profilePictureDataUrl: SafeUrl | string = this.defaultAvatar;

    isEditingName: boolean = false;
    tempFirstName: string = '';
    tempLastName: string = '';
    
    // Dialog visibility
    showUpdateDialog: boolean = false;

    stats = [
/*         { currentValue: 0, label: 'Projects' },
 */        { currentValue: 0, label: 'Connections' },
        { currentValue: 0, label: 'XP Points' },
    ];

    constructor(
        private http: HttpClient,
        private router: Router,
        private messageService: MessageService,
        private userService: UserService,
        private sanitizer: DomSanitizer,
    ) {}

    ngOnInit(): void {
        this.loadStoredData();
        this.fetchUserProfile();
    }

    loadStoredData(): void {
        const storedContacts = localStorage.getItem('projetContacts');
        if (storedContacts) {
            this.projetContacts = JSON.parse(storedContacts);
        }

        const storedStats = localStorage.getItem('stats');
        if (storedStats) {
            this.stats = JSON.parse(storedStats);
        }
    }

    /**
     * FIXED: Since /uploads/** is served as static resources by Spring's ResourceHandlerRegistry,
     * we don't need to fetch them as blobs. Just construct the full URL and return it directly.
     */
    private fetchProfilePicture(url: string): Observable<SafeUrl | string> {
        if (!url) {
            return of(this.defaultAvatar);
        }


        // Check cache first
        if (this.avatarUrlCache.has(url)) {
            return of(this.avatarUrlCache.get(url)!);
        }

        // For data URLs, return directly
        if (url.startsWith('data:')) {
            return of(url);
        }

        // For /uploads/* paths (static resources served by Spring), construct full URL
        // These are served by WebConfig's ResourceHandlerRegistry and don't need auth headers
        const fullUrl = this.getImageUrl(url);
        
        // Cache and return the URL directly - no need to fetch as blob
        this.avatarUrlCache.set(url, fullUrl);
        return of(fullUrl);
    }

    fetchUserProfile(): void {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please sign in to view profile',
            });
            this.router.navigate(['/signin']);
            return;
        }

        const headers = new HttpHeaders({
            Authorization: `Bearer ${accessToken}`,
        });

        this.http.get(`${environment.apiUrl}/users/profile`, { headers }).subscribe({
            next: (response: any) => {
                
                this.user = {
                    id: response.id || 0,
                    firstName: response.firstName || response.first_name || '',
                    lastName: response.lastName || response.last_name || '',
                    email: response.email || '',
                    phoneNumber: response.phoneNumber || response.phone_number || '',
                    role: response.role || '',
                    profilePictureUrl: response.profilePictureUrl || response.profile_pictureurl || '',
                    bio: response.bio || '',
                    facebookUrl: response.facebookUrl || '',
                    instagramUrl: response.instagramUrl || '',
                    linkedinUrl: response.linkedinUrl || '',
                    yearsOfExperience: response.yearsOfExperience || null,
                    skills: response.skills || '',
                    expertise: response.expertise || '',
                    startupName: response.startupName || '',
                    industry: response.industry || '',
                    formationAcademNom: response.formationAcademNom || '',
                    formationAcademDate: response.formationAcademDate || '',
                    formationAcademRealisations: response.formationAcademRealisations || '',
                    nbEntreCoaches: response.nbEntreCoaches || null,
                    competencesProNom: response.competencesProNom || '',
                    competencesProDate: response.competencesProDate || '',
                    competencesProCertificat: response.competencesProCertificat || '',
                    succesClient: response.succesClient || '',
                    engagementCommunautaire: response.engagementCommunautaire || '',
                    sessionEssai: response.sessionEssai || null,
                    formaAcademNom: response.formaAcademNom || '',
                    formaAcademDate: response.formaAcademDate || '',
                    formaAcademRealisations: response.formaAcademRealisations || '',
                    apprentInformelNom: response.apprentInformelNom || '',
                    apprentInformelDate: response.apprentInformelDate || '',
                    apprentInformelCertificat: response.apprentInformelCertificat || '',
                    obstaclePrincipal: response.obstaclePrincipal || '',
                    investmentFocus: response.investmentFocus || '',
                    dateNaissance: response.dateNaissance || null,
                    secteur: response.secteur || '',
                    region: response.region || '',
                    entreprise: response.entreprise || '',
                };
                
                this.userService.setUser(this.user);
                
                // Load profile picture
                if (this.user.profilePictureUrl) {
                    this.fetchProfilePicture(this.user.profilePictureUrl).subscribe((dataUrl) => {
                        this.profilePictureDataUrl = dataUrl;
                    });
                } else {
                    this.profilePictureDataUrl = this.defaultAvatar;
                }
                
                this.isLoading = false;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to fetch user profile',
                });
                this.isLoading = false;
            },
        });
    }

    fetchAdminSpecificData(): void {
        // This method is no longer needed as all data is fetched in fetchUserProfile
        this.isLoading = false;
    }

    fetchRoleSpecificData(): void {
        // This method is no longer needed as all data is fetched in fetchUserProfile
        this.isLoading = false;
    }

    private saveProfileData(): void {
        localStorage.setItem(
            'profileData',
            JSON.stringify({
                stats: this.stats,
                contacts: this.projetContacts,
            }),
        );
    }

    private mapToUser(apiUser: any | null, projectId: number): User | null {
        if (!apiUser || !apiUser.id) return null;

        const profilePictureUrl = apiUser.profilePictureUrl || apiUser.profile_pictureurl;
        const user: User = {
            id: apiUser.id,
            firstName: apiUser.firstName || apiUser.first_name || '',
            lastName: apiUser.lastName || apiUser.last_name || '',
            email: apiUser.email || '',
            phoneNumber: apiUser.phoneNumber || apiUser.phone_number || '',
            profilePictureUrl: profilePictureUrl || this.defaultAvatar,
            role: apiUser.role || '',
        };

        if (profilePictureUrl) {
            this.fetchProfilePicture(profilePictureUrl).subscribe((dataUrl) => {
                this.projectContactAvatars[projectId] = this.projectContactAvatars[projectId] || {};
                this.projectContactAvatars[projectId][apiUser.id] = dataUrl;
            });
        }

        return user;
    }

    updateConnectionsCount(): void {
        const uniqueConnections = new Set<number>();
        const currentUserId = this.user?.id;

        Object.values(this.projetContacts).forEach((contacts) => {
            [
                contacts.founder,
                ...contacts.entrepreneurs,
                ...contacts.coaches,
                ...contacts.investors,
            ]
                .filter((user) => user?.id && user.id !== currentUserId)
                .forEach((user) => uniqueConnections.add(user!.id));
        });

        this.stats[1].currentValue = uniqueConnections.size;
        this.saveProfileData();
    }

    getRoleSectionTitle(role: string): string {
        switch (role) {
            case 'COACH':
                return 'Professional Information';
            case 'ENTREPRENEUR':
                return 'Business Information';
            case 'INVESTOR':
                return 'Investment Information';
            case 'ADMIN':
            case 'SUPERADMIN':
            case 'EMPLOYEE':
                return 'Administrative Information';
            default:
                return 'Professional Information';
        }
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Please select a valid image file',
                });
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Image size should not exceed 5MB',
                });
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Please sign in to upload profile picture',
                });
                this.router.navigate(['/signin']);
                return;
            }

            const headers = new HttpHeaders({
                Authorization: `Bearer ${accessToken}`,
            });

            this.http.post(`${environment.apiUrl}/users/upload`, formData, { headers }).subscribe({
                next: (response: any) => {
                    const imageUrl = response.imageUrl;
                    
                    // Update user object
                    this.user.profilePictureUrl = imageUrl;
                    
                    // Clear cache for this URL to force refresh
                    this.avatarUrlCache.delete(imageUrl);
                    
                    // Construct the full URL and display immediately
                    const fullImageUrl = this.getImageUrl(imageUrl);
                    
                    // Add cache buster to force browser to reload the image
                    const cacheBustedUrl = `${fullImageUrl}?t=${new Date().getTime()}`;
                    this.profilePictureDataUrl = cacheBustedUrl;
                    
                    // Cache the base URL without cache buster for future use
                    this.avatarUrlCache.set(imageUrl, fullImageUrl);
                    
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Profile picture updated successfully',
                    });
                    
                    this.userService.setUser(this.user);
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.error?.message || 'Failed to upload profile picture',
                    });
                },
            });
        }
    }

    /**
     * Constructs the full URL for an image
     * Handles /uploads/* paths, full HTTP URLs, and data URLs
     */
    getImageUrl(url: string): string {
        if (!url) return this.defaultAvatar;

        // If it's already a complete URL or data URL, return it
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
            return url;
        }

        // If it starts with /uploads, construct the full URL using environment.apiUrl
        // This assumes your Spring backend is serving on the same base URL
        if (url.startsWith('/uploads')) {
            // Extract base URL from apiUrl (remove /api if present)
            const baseUrl = environment.apiUrl.replace('/api', '');
            return `${baseUrl}${url}`;
        }

        // Otherwise, assume it's a relative path and prepend /uploads
        const baseUrl = environment.apiUrl.replace('/api', '');
        return `${baseUrl}/uploads/${url}`;
    }

    startEditingName(): void {
        this.isEditingName = true;
        this.tempFirstName = this.user.firstName || '';
        this.tempLastName = this.user.lastName || '';
    }

    saveName(): void {
        if (!this.tempFirstName || !this.tempLastName) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'First name and last name are required',
            });
            return;
        }

        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please sign in to update profile',
            });
            this.router.navigate(['/signin']);
            return;
        }

        const headers = new HttpHeaders({
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        });

        const updatePayload = {
            firstName: this.tempFirstName,
            lastName: this.tempLastName,
        };

        this.http.patch(`${environment.apiUrl}/users/updateprofile`, updatePayload, { headers }).subscribe({
            next: (response: any) => {
                this.user.firstName = this.tempFirstName;
                this.user.lastName = this.tempLastName;
                this.isEditingName = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Name updated successfully',
                });
                this.userService.setUser(this.user);
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'Failed to update name',
                });
            },
        });
    }

    cancelEditingName(): void {
        this.isEditingName = false;
        this.tempFirstName = '';
        this.tempLastName = '';
    }

    // Dialog methods
    openUpdateDialog(): void {
        this.showUpdateDialog = true;
    }

    onProfileUpdated(): void {
        // Refresh the profile after update
        this.fetchUserProfile();
    }
}