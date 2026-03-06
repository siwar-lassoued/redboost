import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../frontoffice/service/UserService';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TopbarWidget } from '../../frontoffice/landing/components/topbarwidget.component';
import { FooterWidget } from '../../frontoffice/landing/components/footerwidget';
import { ScrollToTopComponent } from '../../frontoffice/landing/components/ScrollToTopComponent';

@Component({
    selector: 'app-coach-request',
    standalone: true,
    imports: [
        FormsModule,
        CommonModule,
        RouterModule,
        TopbarWidget,
        FooterWidget,
        ScrollToTopComponent,
    ],
    template: `
        <div class="min-h-screen flex flex-col relative">
            <!-- Topbar -->
            <topbar-widget
                class="sticky top-0 w-full bg-white shadow-md z-50"
            />

            <!-- Main Content -->
            <main class="flex-grow">
                <section class="hero-section">
                    <div class="decorative-bg">
                        <div
                            class="bird"
                            style="top: 10%; left: 5%; animation-duration: 12s; animation-delay: 0s;"
                        ></div>
                        <div
                            class="bird"
                            style="top: 20%; right: 10%; animation-duration: 14s; animation-delay: 2s;"
                        ></div>
                        <div
                            class="bird"
                            style="top: 50%; left: 15%; animation-duration: 13s; animation-delay: 1s;"
                        ></div>
                        <div
                            class="bird"
                            style="bottom: 15%; right: 20%; animation-duration: 15s; animation-delay: 3s;"
                        ></div>
                        <div
                            class="bird"
                            style="bottom: 5%; left: 25%; animation-duration: 11s; animation-delay: 4s;"
                        ></div>
                        <div
                            class="star"
                            style="top: 10%; left: 15%; animation-duration: 5s; animation-delay: 0s;"
                        ></div>
                        <div
                            class="star"
                            style="top: 30%; right: 15%; animation-duration: 4s; animation-delay: 1s;"
                        ></div>
                        <div
                            class="star"
                            style="top: 60%; left: 20%; animation-duration: 6s; animation-delay: 2s;"
                        ></div>
                    </div>

                    <div class="container">
                        <div class="form-wrapper">
                            <div class="form-section">
                                <h2 class="title">
                                    Postuler pour Devenir Coach
                                </h2>
                                <p class="subtitle">
                                    Rejoignez RedBoost et aidez les
                                    entrepreneurs à booster leur business !
                                </p>

                                <form
                                    (ngSubmit)="submitRequest()"
                                    class="space-y-6"
                                    enctype="multipart/form-data"
                                >
                                    <div
                                        *ngIf="currentPage === 1"
                                        class="form-card"
                                    >
                                        <div class="input-group">
                                            <label for="firstName"
                                                >Prénom
                                                <span class="required"
                                                    >*</span
                                                ></label
                                            >
                                            <input
                                                id="firstName"
                                                type="text"
                                                [(ngModel)]="
                                                    coachData.firstName
                                                "
                                                name="firstName"
                                                required
                                                class="input-field"
                                            />
                                        </div>
                                        <div class="input-group">
                                            <label for="lastName"
                                                >Nom
                                                <span class="required"
                                                    >*</span
                                                ></label
                                            >
                                            <input
                                                id="lastName"
                                                type="text"
                                                [(ngModel)]="coachData.lastName"
                                                name="lastName"
                                                required
                                                class="input-field"
                                            />
                                        </div>
                                        <div class="input-group">
                                            <label for="email"
                                                >Email
                                                <span class="required"
                                                    >*</span
                                                ></label
                                            >
                                            <input
                                                id="email"
                                                type="email"
                                                [(ngModel)]="coachData.email"
                                                name="email"
                                                required
                                                class="input-field"
                                            />
                                        </div>
                                        <div class="input-group">
                                            <label for="phoneNumber"
                                                >Numéro de téléphone</label
                                            >
                                            <input
                                                id="phoneNumber"
                                                type="text"
                                                [(ngModel)]="
                                                    coachData.phoneNumber
                                                "
                                                name="phoneNumber"
                                                class="input-field"
                                            />
                                        </div>
                                    </div>

                                    <div
                                        *ngIf="currentPage === 2"
                                        class="form-card"
                                    >
                                        <div class="input-group">
                                            <label for="yearsOfExperience"
                                                >Années d'expérience
                                                <span class="required"
                                                    >*</span
                                                ></label
                                            >
                                            <input
                                                id="yearsOfExperience"
                                                type="number"
                                                [(ngModel)]="
                                                    coachData.yearsOfExperience
                                                "
                                                name="yearsOfExperience"
                                                required
                                                class="input-field"
                                                min="0"
                                            />
                                        </div>
                                        <div class="input-group">
                                            <label for="skills"
                                                >Compétences (séparées par des
                                                virgules)</label
                                            >
                                            <input
                                                id="skills"
                                                type="text"
                                                [(ngModel)]="coachData.skills"
                                                name="skills"
                                                class="input-field"
                                                placeholder="ex. : Entraînement de force, Yoga"
                                            />
                                        </div>
                                        <div class="input-group">
                                            <label for="expertise"
                                                >Expertise (séparée par des
                                                virgules)</label
                                            >
                                            <input
                                                id="expertise"
                                                type="text"
                                                [(ngModel)]="
                                                    coachData.expertise
                                                "
                                                name="expertise"
                                                class="input-field"
                                                placeholder="ex. : Fitness, Nutrition"
                                            />
                                        </div>
                                        <div class="input-group">
                                            <label for="isCertified"
                                                >Avez-vous des
                                                certificats?</label
                                            >
                                            <input
                                                id="isCertified"
                                                type="checkbox"
                                                [(ngModel)]="
                                                    coachData.isCertified
                                                "
                                                name="isCertified"
                                                class="checkbox"
                                            />
                                        </div>
                                        <div class="input-group">
                                            <label for="totalProposedFee"
                                                >Frais proposés totaux
                                                (€)</label
                                            >
                                            <input
                                                id="totalProposedFee"
                                                type="number"
                                                [(ngModel)]="
                                                    coachData.totalProposedFee
                                                "
                                                name="totalProposedFee"
                                                class="input-field"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>

                                    <div
                                        *ngIf="currentPage === 3"
                                        class="form-card"
                                    >
                                        <div class="input-group">
                                            <label for="isBinome"
                                                >Postuler en binôme ?</label
                                            >
                                            <input
                                                id="isBinome"
                                                type="checkbox"
                                                [(ngModel)]="isBinome"
                                                name="isBinome"
                                                (ngModelChange)="
                                                    onBinomeChange()
                                                "
                                                class="checkbox"
                                            />
                                        </div>
                                        <div
                                            class="input-group"
                                            *ngIf="isBinome"
                                        >
                                            <label for="binomeEmail"
                                                >Email du binôme
                                                <span class="required"
                                                    >*</span
                                                ></label
                                            >
                                            <input
                                                id="binomeEmail"
                                                type="email"
                                                [(ngModel)]="
                                                    coachData.binomeEmail
                                                "
                                                name="binomeEmail"
                                                class="input-field"
                                                [required]="isBinome"
                                            />
                                        </div>
                                        <div class="input-group">
                                            <label for="cvFile">CV</label>
                                            <input
                                                id="cvFile"
                                                type="file"
                                                (change)="
                                                    onFileChange(
                                                        $event,
                                                        'cvFile'
                                                    )
                                                "
                                                name="cvFile"
                                                class="file-input"
                                                accept=".pdf"
                                            />
                                        </div>
                                        <div class="input-group">
                                            <label for="trainingProgramFile"
                                                >Programme de formation</label
                                            >
                                            <input
                                                id="trainingProgramFile"
                                                type="file"
                                                (change)="
                                                    onFileChange(
                                                        $event,
                                                        'trainingProgramFile'
                                                    )
                                                "
                                                name="trainingProgramFile"
                                                class="file-input"
                                                accept=".pdf"
                                            />
                                        </div>
                                        <div class="input-group">
                                            <label for="certificationFiles"
                                                >Documents de
                                                certification</label
                                            >
                                            <input
                                                id="certificationFiles"
                                                type="file"
                                                (change)="
                                                    onFileChange(
                                                        $event,
                                                        'certificationFiles'
                                                    )
                                                "
                                                name="certificationFiles"
                                                class="file-input"
                                                accept=".pdf"
                                                multiple
                                            />
                                        </div>
                                    </div>

                                    <div class="pagination">
                                        <button
                                            type="button"
                                            (click)="prevPage()"
                                            [disabled]="currentPage === 1"
                                            class="nav-button"
                                        >
                                            Précédent
                                        </button>
                                        <div
                                            class="progress-bar"
                                            [style.width]="
                                                (currentPage / 3) * 100 + '%'
                                            "
                                        ></div>
                                        <button
                                            type="button"
                                            (click)="nextPage()"
                                            [disabled]="
                                                currentPage === 3 ||
                                                !isPageValid()
                                            "
                                            class="nav-button"
                                            *ngIf="currentPage < 3"
                                        >
                                            Suivant
                                        </button>
                                        <button
                                            type="submit"
                                            [disabled]="!isFormValid()"
                                            class="submit-button"
                                            *ngIf="currentPage === 3"
                                        >
                                            Soumettre
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div class="info-section">
                                <h3 class="info-title">
                                    Devenez un Expert Coach avec RedBoost
                                </h3>
                                <p class="info-text">
                                    Rejoignez notre communauté d'experts et
                                    aidez les entrepreneurs à accélérer leur
                                    croissance.
                                </p>
                                <ul class="info-list">
                                    <li>
                                        Partagez votre expertise en fitness,
                                        nutrition et plus.
                                    </li>
                                    <li>
                                        Accédez à un réseau mondial
                                        d'entrepreneurs motivés.
                                    </li>
                                    <li>
                                        Proposez des programmes personnalisés et
                                        gagnez des revenus compétitifs.
                                    </li>
                                    <li>
                                        Bénéficiez de notre plateforme innovante
                                        pour gérer vos sessions.
                                    </li>
                                </ul>
                                <p class="info-text">
                                    Postulez aujourd'hui et boostez votre
                                    carrière !
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <!-- Footer -->
            <footer-widget class="mt-auto bg-teal-900 text-white py-4" />
            <app-scroll-to-top />
        </div>
    `,
    styles: [
        `
            .min-h-screen {
                min-height: 100vh;
                background: #fff;
                position: relative;
                overflow: hidden;
            }

            .flex {
                display: flex;
            }

            .flex-col {
                flex-direction: column;
            }

            .flex-grow {
                flex-grow: 1;
            }

            .sticky {
                position: sticky;
                top: 0;
            }

            .z-50 {
                z-index: 50;
            }

            .shadow-md {
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .mt-auto {
                margin-top: auto;
            }

            .hero-section {
                position: relative;
                width: 100%;
                min-height: 100vh;
                padding: 80px 20px;
                background: #fff;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                overflow: hidden;
            }

            .decorative-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
                background: #ffffff;
            }

            .bird:hover {
                transform: scale(1.1);
            }

            .star {
                position: absolute;
                width: 10px;
                height: 10px;
                background: radial-gradient(
                    circle,
                    rgba(219, 30, 55, 0.8),
                    rgba(255, 255, 255, 0)
                );
                border-radius: 50%;
                animation: fallStar 5s linear infinite;
                will-change: transform, opacity;
            }

            @keyframes floatBird {
                0%,
                100% {
                    transform: translate(0, 0) rotate(0deg);
                }
                25% {
                    transform: translate(15px, -20px) rotate(5deg);
                }
                50% {
                    transform: translate(-10px, -30px) rotate(0deg);
                }
                75% {
                    transform: translate(10px, -15px) rotate(-5deg);
                }
            }

            @keyframes fadeOut {
                0% {
                    opacity: 0.5;
                }
                100% {
                    opacity: 0;
                }
            }

            @keyframes fallStar {
                0% {
                    transform: translateY(-100vh) translateX(0);
                    opacity: 0.8;
                }
                100% {
                    transform: translateY(100vh) translateX(20px);
                    opacity: 0;
                }
            }

            .container {
                width: 100%;
                max-width: 1300px;
                z-index: 2;
            }

            .form-wrapper {
                display: flex;
                gap: 50px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 25px;
                padding: 50px;
                box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
            }

            .form-section {
                flex: 1;
                min-width: 450px;
            }

            .title {
                font-size: 2.8rem;
                font-weight: 800;
                background: linear-gradient(90deg, #db1e37, #0a4955);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 20px;
                text-align: center;
            }

            .subtitle {
                font-size: 1.3rem;
                color: #555;
                margin-bottom: 40px;
                text-align: center;
            }

            .form-card {
                background: rgba(255, 255, 255, 0.9);
                border-radius: 15px;
                padding: 30px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
                transition:
                    transform 0.3s ease,
                    box-shadow 0.3s ease;
            }

            .form-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            }

            .input-group {
                margin-bottom: 25px;
            }

            label {
                display: block;
                font-weight: 600;
                color: #0a4955;
                margin-bottom: 10px;
            }

            .required {
                color: #db1e37;
            }

            .input-field {
                width: 100%;
                padding: 14px 18px;
                border: 2px solid #e0e0e0;
                border-radius: 10px;
                font-size: 1.1rem;
                transition:
                    border-color 0.3s ease,
                    box-shadow 0.3s ease;
            }

            .input-field:focus {
                border-color: #db1e37;
                box-shadow: 0 0 0 4px rgba(219, 30, 55, 0.15);
                outline: none;
            }

            .checkbox {
                accent-color: #db1e37;
                margin-right: 10px;
            }

            .file-input {
                width: 100%;
                padding: 14px 18px;
                border: 2px solid #e0e0e0;
                border-radius: 10px;
                background: #f9f9f9;
                transition: border-color 0.3s ease;
            }

            .file-input:focus {
                border-color: #db1e37;
            }

            .pagination {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-top: 40px;
            }

            .progress-bar {
                height: 8px;
                background: linear-gradient(to right, #db1e37, #0a4955);
                border-radius: 4px;
                flex-grow: 1;
                transition: width 0.3s ease;
            }

            .nav-button {
                padding: 12px 28px;
                background: #f0f0f0;
                color: #0a4955;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition:
                    background 0.3s ease,
                    transform 0.2s ease;
            }

            .nav-button:hover {
                background: #e0e0e0;
                transform: translateY(-2px);
            }

            .nav-button:disabled {
                background: #f8f8f8;
                color: #aaa;
                cursor: not-allowed;
            }

            .submit-button {
                padding: 14px 30px;
                background: linear-gradient(45deg, #db1e37, #0a4955);
                color: white;
                font-weight: 700;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition:
                    opacity 0.3s ease,
                    transform 0.2s ease;
            }

            .submit-button:hover {
                opacity: 0.95;
                transform: translateY(-2px);
            }

            .submit-button:disabled {
                background: #ccc;
                cursor: not-allowed;
            }

            .info-section {
                flex: 0 0 320px;
                background: rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(15px);
                border-radius: 20px;
                padding: 35px;
                box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(219, 30, 55, 0.1);
                position: relative;
                overflow: hidden;
            }

            .info-section::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(
                    circle,
                    rgba(219, 30, 55, 0.1),
                    transparent 70%
                );
                animation: glow 10s infinite;
                z-index: 0;
            }

            .info-section > * {
                position: relative;
                z-index: 1;
            }

            .info-title {
                font-size: 2rem;
                font-weight: 700;
                color: #0a4955;
                margin-bottom: 20px;
                text-align: center;
            }

            .info-text {
                font-size: 1.1rem;
                color: #666;
                margin-bottom: 20px;
                text-align: center;
            }

            .info-list {
                list-style-type: none;
                padding: 0;
                margin-bottom: 20px;
            }

            .info-list li {
                position: relative;
                padding-left: 30px;
                margin-bottom: 15px;
                color: #555;
                font-size: 1.05rem;
            }

            .info-list li::before {
                content: '✓';
                position: absolute;
                left: 0;
                color: #db1e37;
                font-weight: bold;
                font-size: 1.2rem;
            }

            @keyframes glow {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }

            @media (max-width: 1024px) {
                .form-wrapper {
                    flex-direction: column;
                }

                .info-section {
                    order: -1;
                    margin-bottom: 40px;
                }
            }

            @media (max-width: 768px) {
                .form-wrapper {
                    padding: 20px;
                }

                .title {
                    font-size: 2.2rem;
                }

                .bird {
                    width: 70px;
                    height: 70px;
                }

                .star {
                    width: 8px;
                    height: 8px;
                }

                .form-card {
                    padding: 20px;
                }

                .input-field,
                .file-input {
                    padding: 10px 14px;
                }
            }
        `,
    ],
})
export class CoachRequestComponent implements OnInit {
    coachData: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        yearsOfExperience: number;
        skills: string;
        expertise: string;
        certificationType: string;
        binomeEmail: string;
        isCertified: boolean;
        totalProposedFee: number;
    } = {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        yearsOfExperience: 0,
        skills: '',
        expertise: '',
        certificationType: '',
        binomeEmail: '',
        isCertified: false,
        totalProposedFee: 0,
    };
    isBinome: boolean = false;
    files: {
        cvFile?: File;
        trainingProgramFile?: File;
        certificationFiles?: File[];
    } = {};
    currentPage: number = 1;

    constructor(
        private userService: UserService,
        private messageService: MessageService,
        private router: Router,
    ) {}

    ngOnInit() {
        const currentUser = this.userService.getUser();
        if (currentUser) {
            this.coachData.firstName = currentUser.firstName || '';
            this.coachData.lastName = currentUser.lastName || '';
            this.coachData.email = currentUser.email || '';
            this.coachData.phoneNumber = currentUser.phoneNumber || '';
        }
    }

    isFormValid(): boolean {
        return (
            this.isPageValid(1) && this.isPageValid(2) && this.isPageValid(3)
        );
    }

    isPageValid(page?: number): boolean {
        const p = page || this.currentPage;
        if (p === 1) {
            return (
                !!this.coachData.firstName &&
                !!this.coachData.lastName &&
                !!this.coachData.email
            );
        } else if (p === 2) {
            return this.coachData.yearsOfExperience >= 0;
        } else if (p === 3) {
            return !this.isBinome || !!this.coachData.binomeEmail;
        }
        return false;
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    nextPage() {
        if (this.currentPage < 3 && this.isPageValid()) {
            this.currentPage++;
        }
    }

    onBinomeChange() {
        if (!this.isBinome) {
            this.coachData.binomeEmail = '';
        }
    }

    onFileChange(event: Event, field: string) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            if (field === 'certificationFiles') {
                this.files.certificationFiles = Array.from(input.files);
            } else {
                this.files[field as 'cvFile' | 'trainingProgramFile'] =
                    input.files[0];
            }
        }
    }

    submitRequest() {
        if (!this.isFormValid()) return;

        const formData = new FormData();
        const formDataJson = [
            { key: 'coachData', value: JSON.stringify(this.coachData) },
            { key: 'isBinome', value: this.isBinome.toString() },
        ];
        formData.append('formData', JSON.stringify(formDataJson));

        if (this.files.cvFile) {
            formData.append('cvFile', this.files.cvFile);
        }
        if (this.files.trainingProgramFile) {
            formData.append(
                'trainingProgramFile',
                this.files.trainingProgramFile,
            );
        }
        if (this.files.certificationFiles) {
            this.files.certificationFiles.forEach((file) => {
                formData.append(`certificationFiles`, file);
            });
        }

        this.userService.submitCoachRequest(formData).subscribe({
            next: (response) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Succès',
                    text: "Votre candidature pour devenir coach a été soumise avec succès. En attente d'approbation.",
                    confirmButtonColor: '#0A4955',
                }).then(() => {
                    this.router.navigate(['/landing']);
                });
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail:
                        error.error?.message ||
                        'Échec de la soumission de la candidature',
                });
            },
        });
    }
}
