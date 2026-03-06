import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { Router } from '@angular/router';
import { TopbarWidget } from './topbarwidget.component';
import { FooterWidget } from './footerwidget';
import { ScrollToTopComponent } from './ScrollToTopComponent';

@Component({
    selector: 'app-investment',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        RippleModule,
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

            <!-- Back to Landing Button -->
            <div class="back-to-landing-row mt-8 px-4 md:px-6 lg:px-8 xl:px-4">
                <button
                    class="back-button"
                    (click)="goBackToLanding()"
                    role="button"
                    aria-label="Go back to landing page"
                >
                    Retour à l'accueil
                </button>
            </div>

            <!-- Main Content -->
            <main class="flex-grow">
                <div class="service-container">
                    <!-- Section 1: Découverte -->
                    <section #section1 class="service-section">
                        <div class="content-wrapper">
                            <div class="text-content">
                                <h2 class="section-title">🔍 Découverte</h2>
                                <p class="section-description">
                                    L’accès au financement commence par une
                                    rencontre avec les bonnes opportunités. Nous
                                    mettons à votre disposition un réseau
                                    d’investisseurs prêts à écouter vos projets
                                    et à croire en votre vision. Vous découvrez
                                    les options qui correspondent le mieux à vos
                                    besoins.
                                </p>
                            </div>
                            <div class="image-content">
                                <img
                                    src="assets/images/decouverte.jpg"
                                    alt="Découverte Illustration"
                                    class="section-image"
                                />
                            </div>
                        </div>
                    </section>

                    <!-- Section 2: Partenariats -->
                    <section #section2 class="service-section">
                        <div class="content-wrapper reverse">
                            <div class="text-content">
                                <h2 class="section-title">💼 Partenariats</h2>
                                <p class="section-description">
                                    L’investissement n’est pas qu’une question
                                    de ressources financières, c’est aussi une
                                    question de synergie. Nous favorisons la
                                    création de partenariats stratégiques où
                                    investisseurs et entrepreneurs avancent main
                                    dans la main pour bâtir une réussite
                                    durable.
                                </p>
                            </div>
                            <div class="image-content">
                                <img
                                    src="assets/images/Partenariats.jpg"
                                    alt="Partenariats Illustration"
                                    class="section-image"
                                />
                            </div>
                        </div>
                    </section>

                    <!-- Section 3: Croissance -->
                    <section #section3 class="service-section">
                        <div class="content-wrapper">
                            <div class="text-content">
                                <h2 class="section-title">📈 Croissance</h2>
                                <p class="section-description">
                                    Avec le soutien des investisseurs, votre
                                    projet prend une nouvelle dimension. Vous
                                    accédez à des ressources, des expertises et
                                    un accompagnement stratégique qui vous
                                    permettent de passer à l’échelle et de
                                    réaliser vos ambitions de croissance.
                                </p>
                            </div>
                            <div class="image-content">
                                <img
                                    src="assets/images/Croissance.jpg"
                                    alt="Croissance Illustration"
                                    class="section-image"
                                />
                            </div>
                        </div>
                    </section>

                    <!-- CTA Button -->
                    <div class="cta-section">
                        <button
                            pButton
                            pRipple
                            label="👉 Découvrez nos opportunités d’investissement et donnez de l’élan à votre projet !"
                            class="service-button"
                            (click)="onDiscoverInvestments()"
                        ></button>
                    </div>
                </div>
            </main>

            <!-- Footer -->
            <footer-widget class="mt-auto bg-teal-900 text-white py-4" />
            <app-scroll-to-top />
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                --primary-color: #c8223a;
                --secondary-color: #034a55;
                --gradient-start: #c8223a;
                --gradient-end: #034a55;
                --text-color: #1e293b;
                --bg-light: #ffffff;
                --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
                --border-radius: 16px;
                --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .min-h-screen {
                min-height: 100vh;
                background: var(--bg-light); /* White background */
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
                box-shadow: var(--shadow-md);
            }

            .mt-8 {
                margin-top: 2rem;
            }

            .mt-auto {
                margin-top: auto;
            }

            .service-container {
                margin: 0 auto;
                max-width: 1200px;
                padding: 40px 20px;
                font-family: 'Inter', sans-serif;
                position: relative;
                z-index: 10;
            }

            .back-to-landing-row {
                padding: 8px 0;
                text-align: center;
                z-index: 20;
            }

            .back-button {
                padding: 8px 16px;
                font-size: 0.9rem;
                font-family: 'Poppins', sans-serif;
                font-weight: 600;
                border-radius: 20px;
                color: #ffffff;
                background: linear-gradient(
                    to right,
                    var(--gradient-start),
                    var(--gradient-end)
                );
                border: none;
                cursor: pointer;
                transition: var(--transition);
                box-shadow: var(--shadow-md);
            }

            .back-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
                opacity: 0.95;
            }

            .service-section {
                width: 100%;
                margin-bottom: 40px;
                opacity: 0;
                transform: translateY(25px);
                transition:
                    opacity 0.8s ease-out,
                    transform 0.8s ease-out;
            }

            .service-section.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .content-wrapper {
                display: flex;
                align-items: center;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(12px);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-md);
                padding: 2rem;
                gap: 2rem;
                border: 2px solid transparent;
                background-image:
                    linear-gradient(var(--bg-light), var(--bg-light)),
                    linear-gradient(
                        to right,
                        var(--gradient-start),
                        var(--gradient-end)
                    );
                background-origin: border-box;
                background-clip: padding-box, border-box;
                transition: var(--transition);
            }

            .content-wrapper:hover {
                transform: translateY(-6px);
                box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
            }

            .content-wrapper.reverse {
                flex-direction: row-reverse;
            }

            .text-content,
            .image-content {
                flex: 1;
                min-width: 0;
            }

            .section-title {
                font-family: 'Poppins', sans-serif;
                font-size: 2.5rem;
                font-weight: 700;
                color: var(--secondary-color);
                margin-bottom: 1rem;
                position: relative;
            }

            .section-title::after {
                content: '';
                position: absolute;
                bottom: -8px;
                left: 0;
                width: 80px;
                height: 4px;
                background: linear-gradient(
                    to right,
                    var(--gradient-start),
                    var(--gradient-end)
                );
                border-radius: 2px;
                animation: growUnderline 1s ease-out forwards;
            }

            .section-description {
                font-family: 'Inter', sans-serif;
                font-size: 1.1rem;
                color: #444;
                line-height: 1.8;
            }

            .section-image {
                width: 100%;
                height: auto;
                border-radius: var(--border-radius);
                object-fit: cover;
                max-height: 300px;
                transition: transform 0.3s ease;
            }

            .content-wrapper:hover .section-image {
                transform: scale(1.05);
            }

            .cta-section {
                text-align: center;
                margin: 3rem 0;
            }

            .service-button.p-button {
                background: linear-gradient(
                    to right,
                    var(--gradient-start),
                    var(--gradient-end)
                );
                border: none;
                border-radius: 50px;
                padding: 0.75rem 2rem;
                font-family: 'Poppins', sans-serif;
                font-size: 1.1rem;
                font-weight: 600;
                color: #ffffff;
                transition: var(--transition);
                box-shadow: var(--shadow-md);
            }

            .service-button.p-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                opacity: 0.92;
            }

            @keyframes growUnderline {
                0% {
                    width: 0;
                }
                100% {
                    width: 80px;
                }
            }

            @media (max-width: 768px) {
                .service-container {
                    padding: 20px 16px;
                }

                .content-wrapper,
                .content-wrapper.reverse {
                    flex-direction: column;
                    padding: 1.5rem;
                }

                .section-title {
                    font-size: 2rem;
                }

                .section-description {
                    font-size: 1rem;
                }

                .section-image {
                    max-height: 200px;
                }

                .service-button.p-button {
                    font-size: 1rem;
                    padding: 0.6rem 1.5rem;
                }
            }

            @media (max-width: 480px) {
                .section-title {
                    font-size: 1.8rem;
                }

                .section-description {
                    font-size: 0.9rem;
                }

                .section-image {
                    max-height: 160px;
                }

                .back-button {
                    font-size: 0.8rem;
                    padding: 6px 12px;
                }
            }
        `,
    ],
})
export class InvestmentComponent implements AfterViewInit {
    @ViewChild('section1', { static: true }) section1!: ElementRef;
    @ViewChild('section2', { static: true }) section2!: ElementRef;
    @ViewChild('section3', { static: true }) section3!: ElementRef;

    constructor(private router: Router) {}

    ngAfterViewInit() {
        const sections = [this.section1, this.section2, this.section3];
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

        sections.forEach((section) => {
            if (section?.nativeElement) {
                observer.observe(section.nativeElement);
            } else {
                console.warn('Section element not found');
            }
        });
    }

    onDiscoverInvestments() {
        console.log('Discover Investments clicked, navigating to /signup');
        this.router.navigate(['/signup']).catch((err) => {
            console.error('Navigation error to /signup:', err);
        });
    }

    goBackToLanding() {
        this.router.navigate(['/landing']);
    }
}
