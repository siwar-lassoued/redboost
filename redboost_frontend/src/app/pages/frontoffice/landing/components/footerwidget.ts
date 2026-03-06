import {
    Component,
    AfterViewInit,
    ElementRef,
    ViewChildren,
    QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'footer-widget',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        RippleModule,
        ToastModule,
    ],
    providers: [MessageService],
    template: `
        <!-- Banner -->
        <div
            class="banner flex justify-between items-center bg-gradient-to-r from-[#034A55] via-[#6A2C3D] to-[#C8223A] text-white px-6 py-3 md:px-16 lg:px-24 h-[56px]"
        >
            <div class="banner-title">Démarrez ou Demandez une Démo</div>
            <button
                pButton
                pRipple
                label="Réservez une Démo"
                class="banner-button"
                (click)="onBookDemo()"
            ></button>
        </div>

        <!-- Footer Content -->
        <footer class="footer-container">
            <div class="content-wrapper">
                <div class="grid grid-cols-12 gap-6">
                    <!-- About Section -->
                    <div
                        class="col-span-12 md:col-span-4 footer-section"
                        #section1
                    >
                        <a
                            (click)="
                                router.navigate(['/landing'], {
                                    fragment: 'home',
                                })
                            "
                            class="flex items-center cursor-pointer mb-6"
                        >
                            <img
                                src="assets/images/logo_redboost_white.png"
                                alt="RedBoost Logo"
                                class="h-12 mr-2"
                            />
                        </a>
                        <p class="section-description">
                            Votre plateforme tout-en-un pour une gestion
                            efficace des programmes, un soutien aux startups et
                            une communication fluide.
                        </p>
                    </div>

                    <!-- Quick Links -->
                    <div
                        class="col-span-12 md:col-span-2 footer-section"
                        #section2
                    >
                        <h4 class="section-title">Liens Rapides</h4>
                        <ul class="list-none p-0">
                            <li class="mb-2">
                                <a
                                    (click)="
                                        router.navigate(['/landing'], {
                                            fragment: 'about',
                                        })
                                    "
                                    class="section-link"
                                    >À Propos</a
                                >
                            </li>
                            <li class="mb-2">
                                <a
                                    (click)="
                                        router.navigate(['/landing'], {
                                            fragment: 'services',
                                        })
                                    "
                                    class="section-link"
                                    >Nos Services</a
                                >
                            </li>
                            <li class="mb-2">
                                <a
                                    (click)="
                                        router.navigate(['/landing'], {
                                            fragment: 'resources',
                                        })
                                    "
                                    class="section-link"
                                    >Ressources</a
                                >
                            </li>
                            <li class="mb-2">
                                <a
                                    (click)="
                                        router.navigate(['/landing'], {
                                            fragment: 'pricing',
                                        })
                                    "
                                    class="section-link"
                                    >Tarification</a
                                >
                            </li>
                            <li>
                                <a
                                    (click)="
                                        router.navigate(['/landing'], {
                                            fragment: 'contact',
                                        })
                                    "
                                    class="section-link"
                                    >Contact</a
                                >
                            </li>
                        </ul>
                    </div>

                    <!-- Contact Us -->
                    <div
                        class="col-span-12 md:col-span-3 footer-section"
                        #section3
                    >
                        <h4 class="section-title">Nous Contacter</h4>
                        <ul class="list-none p-0">
                            <li class="mb-2">
                                <a href="tel:+21671793125" class="section-link"
                                    ><i class="pi pi-phone mr-2"></i>+216 71 793
                                    125</a
                                >
                            </li>
                            <li class="mb-2">
                                <a
                                    href="mailto:contact@redstart.tn"
                                    class="section-link"
                                    ><i class="pi pi-envelope mr-2"></i
                                    >contact&#64;redstart.tn</a
                                >
                            </li>
                            <li>
                                <div class="flex items-center gap-4 mt-4">
                                    <a
                                        href="https://tn.linkedin.com/company/redstart-tunisie"
                                        target="_blank"
                                        class="section-link"
                                    >
                                        <i class="pi pi-linkedin text-xl"></i>
                                    </a>
                                    <a
                                        href="https://www.instagram.com/redstart_tunisie/"
                                        target="_blank"
                                        class="section-link"
                                    >
                                        <i class="pi pi-instagram text-xl"></i>
                                    </a>
                                    <a
                                        href="https://www.facebook.com/redstartunisie/?locale=fr_FR"
                                        target="_blank"
                                        class="section-link"
                                    >
                                        <i class="pi pi-facebook text-xl"></i>
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <!-- Newsletter -->
                    <div
                        class="col-span-12 md:col-span-3 footer-section"
                        #section4
                    >
                        <h4 class="section-title">
                            Abonnez-vous à notre Newsletter
                        </h4>
                        <p class="section-description mb-4">
                            Restez informé des dernières actualités et mises à
                            jour de RedBoost.
                        </p>
                        <form
                            (ngSubmit)="onSubscribe()"
                            class="flex items-center"
                        >
                            <input
                                type="email"
                                [(ngModel)]="email"
                                name="email"
                                placeholder="Entrez votre email"
                                class="email-input"
                                required
                                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,}$"
                            />
                            <button
                                pButton
                                pRipple
                                type="submit"
                                label="S'abonner"
                                class="subscribe-button"
                            ></button>
                        </form>
                    </div>
                </div>

                <!-- Copyright -->
                <div class="border-t border-gray-700 mt-8 pt-6">
                    <div class="text-center text-gray-300">
                        <p>&copy; 2025 RedBoost. Tous droits réservés.</p>
                    </div>
                </div>
            </div>
            <p-toast position="top-center" />
        </footer>
    `,
    styles: [
        `
            :host {
                display: block;
                --primary-color: #c8223a;
                --secondary-color: #034a55;
                --gradient-start: #c8223a;
                --gradient-end: #034a55;
                --text-color: #e6edee;
                --bg-dark: #0a4955;
                --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
                --border-radius: 8px;
                --transition: all 0.2s ease-in-out;
            }

            .banner {
                background: linear-gradient(
                    to right,
                    var(--gradient-start),
                    #6a2c3d,
                    var(--gradient-end)
                );
                box-shadow: var(--shadow-sm);
                z-index: 50;
            }

            .banner-title {
                font-family: 'Poppins', sans-serif;
                font-size: 1.5rem;
                font-weight: 600;
                color: var(--text-color);
            }

            .banner-button.p-button {
                background: linear-gradient(
                    to right,
                    var(--gradient-start),
                    var(--gradient-end)
                );
                border: none;
                border-radius: 24px;
                padding: 0.5rem 1.5rem;
                font-family: 'Poppins', sans-serif;
                font-size: 1rem;
                font-weight: 500;
                color: #ffffff;
                transition: var(--transition);
            }

            .banner-button.p-button:hover {
                opacity: 0.9;
                box-shadow: var(--shadow-sm);
            }

            .footer-container {
                background: var(--bg-dark);
                padding: 32px 16px;
                font-family: 'Inter', sans-serif;
            }

            .content-wrapper {
                max-width: 1200px;
                margin: 0 auto;
            }

            .grid {
                display: grid;
            }

            .grid-cols-12 {
                grid-template-columns: repeat(12, minmax(0, 1fr));
            }

            .gap-6 {
                gap: 1.5rem;
            }

            .col-span-12 {
                grid-column: span 12 / span 12;
            }

            .md\\:col-span-4 {
                @media (min-width: 768px) {
                    grid-column: span 4 / span 4;
                }
            }

            .md\\:col-span-2 {
                @media (min-width: 768px) {
                    grid-column: span 2 / span 2;
                }
            }

            .md\\:col-span-3 {
                @media (min-width: 768px) {
                    grid-column: span 3 / span 3;
                }
            }

            .footer-section {
                opacity: 0;
                transition: opacity 0.5s ease-out;
            }

            .footer-section.visible {
                opacity: 1;
            }

            .section-title {
                font-family: 'Poppins', sans-serif;
                font-size: 1.5rem;
                font-weight: 600;
                color: var(--text-color);
                margin-bottom: 1rem;
                position: relative;
            }

            .section-title::after {
                content: '';
                position: absolute;
                bottom: -6px;
                left: 0;
                width: 60px;
                height: 3px;
                background: linear-gradient(
                    to right,
                    var(--gradient-start),
                    var(--gradient-end)
                );
                border-radius: 2px;
                animation: growUnderline 0.6s ease-out forwards;
            }

            .section-description {
                font-family: 'Inter', sans-serif;
                font-size: 1rem;
                color: #d1d5db;
                line-height: 1.5;
            }

            .section-link {
                font-family: 'Inter', sans-serif;
                font-size: 1rem;
                color: #d1d5db;
                transition: color var(--transition);
                cursor: pointer;
            }

            .section-link:hover {
                color: var(--primary-color);
            }

            .section-link i {
                transition: color var(--transition);
            }

            .section-link:hover i {
                color: var(--primary-color);
            }

            .email-input {
                width: 100%;
                padding: 0.75rem;
                border: none;
                border-radius: 8px 0 0 8px;
                background: #ffffff;
                font-family: 'Inter', sans-serif;
                font-size: 1rem;
                color: #1e293b;
                transition: var(--transition);
            }

            .email-input:focus {
                outline: none;
                box-shadow: 0 0 0 2px rgba(200, 34, 58, 0.3);
            }

            .subscribe-button.p-button {
                background: linear-gradient(
                    to right,
                    var(--gradient-start),
                    var(--gradient-end)
                );
                border: none;
                border-radius: 0 8px 8px 0;
                padding: 0.75rem 1.5rem;
                font-family: 'Poppins', sans-serif;
                font-size: 1rem;
                font-weight: 500;
                color: #ffffff;
                transition: var(--transition);
            }

            .subscribe-button.p-button:hover {
                opacity: 0.9;
                box-shadow: var(--shadow-sm);
            }

            .border-t {
                border-top: 1px solid #4b5563;
            }

            .mt-8 {
                margin-top: 2rem;
            }

            .pt-6 {
                padding-top: 1.5rem;
            }

            @keyframes growUnderline {
                0% {
                    width: 0;
                }
                100% {
                    width: 60px;
                }
            }

            @media (max-width: 768px) {
                .banner {
                    padding: 0.75rem;
                    flex-direction: column;
                    height: auto;
                    gap: 0.75rem;
                }

                .banner-title {
                    font-size: 1.25rem;
                }

                .banner-button.p-button {
                    font-size: 0.9rem;
                    padding: 0.5rem 1.25rem;
                }

                .footer-container {
                    padding: 24px 12px;
                }

                .section-title {
                    font-size: 1.25rem;
                }

                .section-description,
                .section-link {
                    font-size: 0.9rem;
                }

                .email-input {
                    padding: 0.6rem;
                    font-size: 0.9rem;
                }

                .subscribe-button.p-button {
                    padding: 0.6rem 1.25rem;
                    font-size: 0.9rem;
                }
            }

            @media (max-width: 480px) {
                .banner-title {
                    font-size: 1.1rem;
                }

                .banner-button.p-button {
                    font-size: 0.85rem;
                    padding: 0.5rem 1rem;
                }

                .section-title {
                    font-size: 1.15rem;
                }

                .section-description,
                .section-link {
                    font-size: 0.85rem;
                }

                .section-link i {
                    font-size: 0.9rem;
                }

                .email-input {
                    font-size: 0.85rem;
                }

                .subscribe-button.p-button {
                    font-size: 0.85rem;
                }
            }
        `,
    ],
})
export class FooterWidget implements AfterViewInit {
    email: string = '';

    @ViewChildren('section1, section2, section3, section4')
    sections!: QueryList<ElementRef>;

    constructor(
        public router: Router,
        private messageService: MessageService,
    ) {}

    ngAfterViewInit() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 },
        );

        this.sections.forEach((section) => {
            if (section?.nativeElement) {
                observer.observe(section.nativeElement);
            } else {
                console.warn('Section element not found');
            }
        });
    }

    onSubscribe() {
        if (
            this.email &&
            this.email.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/)
        ) {
            this.messageService.add({
                severity: 'success',
                summary: 'Succès',
                detail: 'Inscription à la newsletter réussie !',
                life: 3000,
            });
            console.log('Newsletter subscription requested for:', this.email);
            this.email = '';
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Veuillez entrer une adresse email valide.',
                life: 3000,
            });
            console.warn('Invalid email address');
        }
    }

    onBookDemo() {
        console.log('Book a Demo clicked, navigating to /demo');
        this.router.navigate(['/demo']).catch((err) => {
            console.error('Navigation error to /demo:', err);
        });
    }
}
