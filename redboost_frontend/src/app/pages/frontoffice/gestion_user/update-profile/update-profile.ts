import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ChipModule } from 'primeng/chip';
import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    FormsModule,
    Validators,
    AbstractControl,
    ValidationErrors,
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../../../../environment';

// Custom phone validator
function phoneValidator(control: AbstractControl): ValidationErrors | null {
    const phone = control.value;
    if (!phone) return null;
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone) ? null : { invalidPhone: true };
}

@Component({
    selector: 'app-profile-update-dialog',
    standalone: true,
    imports: [
        CommonModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        ChipModule,
        CheckboxModule,
        CalendarModule,
        DropdownModule,
        ReactiveFormsModule,
        FormsModule,
        ToastModule,
    ],
    templateUrl: './update-profile.html',
    styleUrls: ['./update-profile.scss'],
    providers: [MessageService],
})
export class ProfileUpdateDialogComponent implements OnInit, OnChanges {
    @Input() visible: boolean = false;
    @Input() user: any;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() profileUpdated = new EventEmitter<void>();

    profileForm: FormGroup;
    activeFilter: string = 'all';
    isSubmitting: boolean = false;

    // Skills and expertise management
    skills: string[] = [];
    expertise: string[] = [];
    skillInput: string = '';
    expertiseInput: string = '';
    defaultSkills: string[] = [
        'Leadership',
        'Communication',
        'Strategic Planning',
        'Team Management',
        'Marketing',
        'Sales',
        'Finance',
        'Product Development',
    ];

    // Maximum date for date of birth (today)
    maxDate: Date = new Date();

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private messageService: MessageService
    ) {
        this.profileForm = this.createForm();
    }

    ngOnInit(): void {
        if (this.user) {
            this.populateForm();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['user'] && this.user && this.profileForm) {
            this.populateForm();
        }
        if (changes['visible'] && this.visible && this.user) {
            this.populateForm();
        }
    }

    createForm(): FormGroup {
        return this.fb.group({
            // General fields
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required, phoneValidator]],
            bio: ['', [Validators.maxLength(500)]],
            linkedin: [''],
            facebook: [''],
            instagram: [''],
            dateNaissance: [null],
            secteur: [''],
            region: [''],
            entreprise: [''],

            // Coach-specific fields
            yearsOfExperience: [null, [Validators.min(0)]],
            formationAcademNom: [''],
            formationAcademDate: [null],
            formationAcademRealisations: [''],
            nbEntreCoaches: [null, [Validators.min(0)]],
            competencesProNom: [''],
            competencesProDate: [null],
            competencesProCertificat: [''],
            succesClient: [''],
            engagementCommunautaire: [''],
            sessionEssai: [false],

            // Entrepreneur-specific fields
            startupName: [''],
            industry: [''],
            formaAcademNom: [''],
            formaAcademDate: [null],
            formaAcademRealisations: [''],
            apprentInformelNom: [''],
            apprentInformelDate: [null],
            apprentInformelCertificat: [''],
            obstaclePrincipal: [''],
        });
    }

    populateForm(): void {
        if (!this.user) return;


        this.profileForm.patchValue({
            firstName: this.user.firstName || '',
            lastName: this.user.lastName || '',
            email: this.user.email || '',
            phone: this.user.phoneNumber || '',
            bio: this.user.bio || '',
            linkedin: this.user.linkedinUrl || '',
            facebook: this.user.facebookUrl || '',
            instagram: this.user.instagramUrl || '',
            dateNaissance: this.user.dateNaissance ? new Date(this.user.dateNaissance) : null,
            secteur: this.user.secteur || '',
            region: this.user.region || '',
            entreprise: this.user.entreprise || '',

            // Coach fields
            yearsOfExperience: this.user.yearsOfExperience || null,
            formationAcademNom: this.user.formationAcademNom || '',
            formationAcademDate: this.user.formationAcademDate ? new Date(this.user.formationAcademDate) : null,
            formationAcademRealisations: this.user.formationAcademRealisations || '',
            nbEntreCoaches: this.user.nbEntreCoaches || null,
            competencesProNom: this.user.competencesProNom || '',
            competencesProDate: this.user.competencesProDate ? new Date(this.user.competencesProDate) : null,
            competencesProCertificat: this.user.competencesProCertificat || '',
            succesClient: this.user.succesClient || '',
            engagementCommunautaire: this.user.engagementCommunautaire || '',
            sessionEssai: this.user.sessionEssai || false,

            // Entrepreneur fields
            startupName: this.user.startupName || '',
            industry: this.user.industry || '',
            formaAcademNom: this.user.formaAcademNom || '',
            formaAcademDate: this.user.formaAcademDate ? new Date(this.user.formaAcademDate) : null,
            formaAcademRealisations: this.user.formaAcademRealisations || '',
            apprentInformelNom: this.user.apprentInformelNom || '',
            apprentInformelDate: this.user.apprentInformelDate ? new Date(this.user.apprentInformelDate) : null,
            apprentInformelCertificat: this.user.apprentInformelCertificat || '',
            obstaclePrincipal: this.user.obstaclePrincipal || '',
        });

        // Parse skills and expertise
        this.skills = [];
        this.expertise = [];
        
        if (this.user.skills) {
            this.skills = this.user.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s);
        }
        if (this.user.expertise) {
            this.expertise = this.user.expertise.split(',').map((e: string) => e.trim()).filter((e: string) => e);
        }
    }

    setFilter(filter: string): void {
        this.activeFilter = filter;
    }

    get userRole(): string {
        return this.user?.role?.toLowerCase() || '';
    }

    // Skills management
    addSkill(event: Event): void {
        if (event instanceof KeyboardEvent && event.key !== 'Enter') return;
        event.preventDefault();

        const skill = this.skillInput.trim();
        if (skill && !this.skills.includes(skill)) {
            this.skills.push(skill);
            this.skillInput = '';
        }
    }

    removeSkill(skill: string): void {
        this.skills = this.skills.filter(s => s !== skill);
    }

    toggleSkill(skill: string): void {
        const index = this.skills.indexOf(skill);
        if (index > -1) {
            this.skills.splice(index, 1);
        } else {
            this.skills.push(skill);
        }
    }

    // Expertise management
    addExpertise(event: Event): void {
        if (event instanceof KeyboardEvent && event.key !== 'Enter') return;
        event.preventDefault();

        const exp = this.expertiseInput.trim();
        if (exp && !this.expertise.includes(exp)) {
            this.expertise.push(exp);
            this.expertiseInput = '';
        }
    }

    removeExpertise(exp: string): void {
        this.expertise = this.expertise.filter(e => e !== exp);
    }

  updateProfile(): void {
    if (this.profileForm.invalid) {
        this.markFormGroupTouched(this.profileForm);
        this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Veuillez corriger les erreurs dans le formulaire',
        });
        return;
    }

    this.isSubmitting = true;
    const formValue = this.profileForm.value;

    // Helper to only add non-null/non-empty values
    const payload: any = {};
    const addIfPresent = (key: string, value: any) => {
        if (value !== null && value !== undefined && value !== '') {
            payload[key] = value;
        }
    };

    // General fields — always included if filled
    addIfPresent('firstName', formValue.firstName);
    addIfPresent('lastName', formValue.lastName);
    addIfPresent('phoneNumber', formValue.phone);
    addIfPresent('bio', formValue.bio);
    addIfPresent('linkedin', formValue.linkedin);
    addIfPresent('facebook', formValue.facebook);
    addIfPresent('instagram', formValue.instagram);
    addIfPresent('secteur', formValue.secteur);
    addIfPresent('region', formValue.region);
    addIfPresent('entreprise', formValue.entreprise);
    
    // Only include dateNaissance if user actually selected a date
    if (formValue.dateNaissance) {
        addIfPresent('dateNaissance', this.formatDate(formValue.dateNaissance));
    }

    // Role-specific fields
    if (this.userRole === 'coach') {
        addIfPresent('yearsOfExperience', formValue.yearsOfExperience);
        addIfPresent('skills', this.skills.length > 0 ? this.skills.join(', ') : null);
        addIfPresent('expertise', this.expertise.length > 0 ? this.expertise.join(', ') : null);
        addIfPresent('formationAcademNom', formValue.formationAcademNom);
        if (formValue.formationAcademDate) {
            addIfPresent('formationAcademDate', this.formatDate(formValue.formationAcademDate));
        }
        addIfPresent('formationAcademRealisations', formValue.formationAcademRealisations);
        addIfPresent('nbEntreCoaches', formValue.nbEntreCoaches);
        addIfPresent('competencesProNom', formValue.competencesProNom);
        if (formValue.competencesProDate) {
            addIfPresent('competencesProDate', this.formatDate(formValue.competencesProDate));
        }
        addIfPresent('competencesProCertificat', formValue.competencesProCertificat);
        addIfPresent('succesClient', formValue.succesClient);
        addIfPresent('engagementCommunautaire', formValue.engagementCommunautaire);
        // sessionEssai is boolean so handle separately — false is a valid value
        if (formValue.sessionEssai !== null && formValue.sessionEssai !== undefined) {
            payload['sessionEssai'] = formValue.sessionEssai;
        }
    } else if (this.userRole === 'entrepreneur') {
        addIfPresent('startupName', formValue.startupName);
        addIfPresent('industry', formValue.industry);
        addIfPresent('formaAcademNom', formValue.formaAcademNom);
        if (formValue.formaAcademDate) {
            addIfPresent('formaAcademDate', this.formatDate(formValue.formaAcademDate));
        }
        addIfPresent('formaAcademRealisations', formValue.formaAcademRealisations);
        addIfPresent('apprentInformelNom', formValue.apprentInformelNom);
        if (formValue.apprentInformelDate) {
            addIfPresent('apprentInformelDate', this.formatDate(formValue.apprentInformelDate));
        }
        addIfPresent('apprentInformelCertificat', formValue.apprentInformelCertificat);
        addIfPresent('obstaclePrincipal', formValue.obstaclePrincipal);
    }


    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Session expirée. Veuillez vous reconnecter.',
        });
        this.isSubmitting = false;
        return;
    }

    const headers = new HttpHeaders({
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    });

    this.http.patch(`${environment.apiUrl}/users/updateprofile`, payload, { headers })
        .subscribe({
            next: (response: any) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Profil mis à jour avec succès',
                });
                this.isSubmitting = false;
                this.profileUpdated.emit();
                this.close();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: error.error?.message || 'Échec de la mise à jour du profil',
                });
                this.isSubmitting = false;
            },
        });
}

    formatDate(date: Date): string {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    close(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }
}