import {
    Component,
    AfterViewInit,
    ElementRef,
    ViewChild,
    ViewChildren,
    QueryList,
} from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { TopbarWidget } from './topbarwidget.component';
import { FooterWidget } from './footerwidget';
import { ScrollToTopComponent } from './ScrollToTopComponent';
import { PricingWidget } from './pricingwidget';
import { MarketingLandingCardsComponent } from './marketing-landing-cards';
import { CommonModule } from '@angular/common';
import { EntrepreneurialFaqComponent } from './entrepreneurial-faq.component';

@Component({
    selector: 'app-entrepreneurial',
    standalone: true,
    imports: [
        RouterModule,
        TopbarWidget,
        FooterWidget,
        RippleModule,
        StyleClassModule,
        ButtonModule,
        DividerModule,
        TimelineModule,
        CardModule,
        CommonModule,
        ScrollToTopComponent,
        PricingWidget,
        MarketingLandingCardsComponent,
        EntrepreneurialFaqComponent,
    ],
    template: `
        <div class="min-h-screen flex flex-col relative">
            <!-- Decorative Background with Stars -->
            <div class="decorative-bg">
                <div
                    class="star"
                    style="top: 10%; left: 5%; animation-duration: 5s; animation-delay: 0s;"
                ></div>
                <div
                    class="star"
                    style="top: 20%; right: 10%; animation-duration: 4s; animation-delay: 2s;"
                ></div>
                <div
                    class="star"
                    style="top: 50%; left: 15%; animation-duration: 6s; animation-delay: 1s;"
                ></div>
                <div
                    class="star"
                    style="bottom: 15%; right: 20%; animation-duration: 5s; animation-delay: 3s;"
                ></div>
                <div
                    class="star"
                    style="bottom: 5%; left: 25%; animation-duration: 4s; animation-delay: 4s;"
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

            <!-- Topbar -->
            <topbar-widget
                class="sticky top-0 w-full bg-white shadow-md z-10"
            />

            <!-- Main Content -->
            <main class="flex-grow">
                <!-- Hero Section -->
                <section
                    #heroSection
                    class="header-section px-4 md:px-6 lg:px-8 xl:px-4"
                >
                    <div class="header-content w-full max-w-6xl mx-auto">
                        <h1 class="main-title">
                            Votre Aventure Entrepreneuriale
                        </h1>
                        <h2 class="creative-title">Commence Ici</h2>
                        <p class="subtitle">
                            Transformez vos idées en projets concrets avec notre
                            accompagnement personnalisé, nos programmes de
                            coaching et nos opportunités d’investissement.
                        </p>
                        <button
                            pButton
                            pRipple
                            label="Démarrez Maintenant"
                            class="hero-button"
                            (click)="onStartNow()"
                        ></button>
                    </div>
                </section>

                <div class="content-wrapper">
                    <pricing-widget class="service-section" #serviceSection />
                    <app-marketing-landing-cards
                        class="service-section"
                        #serviceSection
                    />
                    <app-entrepreneurial-faq
                        class="service-section"
                        #serviceSection
                    />
                </div>
            </main>

            <!-- Footer -->
            <footer-widget class="mt-auto bg-teal-900 text-white py-4 z-10" />
            <app-scroll-to-top class="z-10" />
        </div>
    `,
    styles: [
        `
            @import 'tailwindcss/base';
            @import 'tailwindcss/components';
            @import 'tailwindcss/utilities';

            :host {
                --primary-color: #c8223a;
                --secondary-color: #034a55;
                --gradient-start: #c8223a;
                --gradient-end: #034a55;
                --card-bg: #ffffff;
                --border-color: #e2e8f0;
                display: block;
            }

            .min-h-screen {
                min-height: 100vh;
                background: #ffffff !important;
                position: relative;
                overflow: visible;
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

            .z-10 {
                z-index: 10;
            }

            .shadow-md {
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .mt-auto {
                margin-top: auto;
            }

            .header-section {
                margin-bottom: 20px;
                padding: 40px 0;
                text-align: center;
                position: relative;
                z-index: 2;
                background: #ffffff !important;
            }

            .header-content {
                position: relative;
                color: #034a55;
                padding: 0;
                z-index: 2;
                width: 100%;
                max-width: 48rem; /* Adjusted to 6xl (768px) for better centering */
                margin-left: auto;
                margin-right: auto;
            }

            .main-title {
                font-family: var(--font-family);
                font-size: 4.5rem;
                font-weight: 800;
                margin: 0;
                line-height: 1.2;
                background: linear-gradient(
                    90deg,
                    var(--gradient-start),
                    var(--gradient-end)
                );
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            }

            .creative-title {
                font-family: 'Poppins', sans-serif;
                font-size: 2.5rem;
                font-weight: 600;
                color: var(--gradient-end);
                margin: 20px 0;
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
                position: relative;
            }

            .creative-title::after {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                width: 120px;
                height: 4px;
                background: linear-gradient(
                    to right,
                    var(--gradient-start),
                    var(--gradient-end)
                );
                border-radius: 2px;
            }

            .subtitle {
                font-family: var(--font-family);
                font-size: 1.6rem;
                font-weight: 400;
                margin: 24px auto 24px;
                max-width: 800px;
                line-height: 1.8;
                color: #444;
            }

            .hero-button.p-button {
                padding: 0.75rem 2rem;
                font-size: 1.1rem;
                font-family: 'Poppins', sans-serif;
                font-weight: 600;
                border-radius: 50px;
                color: #ffffff;
                background: linear-gradient(
                    to right,
                    var(--gradient-start),
                    var(--gradient-end)
                );
                border: none;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .hero-button.p-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                opacity: 0.92;
            }

            .content-wrapper {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
            }

            .service-section {
                margin-bottom: 40px;
                opacity: 1;
                transition:
                    opacity 0.8s ease-out,
                    transform 0.8s ease-out;
                background: #ffffff !important;
            }

            .service-section.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .decorative-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
                background: transparent !important;
            }

            .star {
                position: absolute;
                width: 10px;
                height: 10px;
                background: radial-gradient(
                    circle,
                    rgba(200, 34, 58, 0.7),
                    rgba(255, 255, 255, 0)
                );
                border-radius: 50%;
                animation: fallStar 5s linear infinite;
                will-change: transform, opacity;
            }

            @keyframes fallStar {
                0% {
                    transform: translateY(-100vh) translateX(0);
                    opacity: 0.7;
                }
                100% {
                    transform: translateY(100vh) translateX(20px);
                    opacity: 0;
                }
            }

            @media (max-width: 1024px) {
                .header-section {
                    padding: 24px 0;
                }

                .main-title {
                    font-size: 3.2rem;
                }

                .creative-title {
                    font-size: 1.9rem;
                    max-width: 400px;
                }

                .subtitle {
                    font-size: 1.3rem;
                    max-width: 500px;
                }

                .star {
                    width: 8px;
                    height: 8px;
                }
            }

            @media (max-width: 640px) {
                .header-section {
                    padding: 16px 0;
                }

                .main-title {
                    font-size: 2.4rem;
                }

                .creative-title {
                    font-size: 1.5rem;
                }

                .subtitle {
                    font-size: 1.1rem;
                }

                .hero-button.p-button {
                    font-size: 0.9rem;
                    padding: 0.5rem 1.2rem;
                }

                .star {
                    width: 6px;
                    height: 6px;
                }
            }
        `,
    ],
})
export class EntrepreneurialComponent implements AfterViewInit {
    @ViewChild('heroSection', { static: true }) heroSection!: ElementRef;
    @ViewChildren('serviceSection') serviceSections!: QueryList<ElementRef>;

    constructor(private router: Router) {}

    ngAfterViewInit() {
        console.log('ngAfterViewInit: Observing sections');
        const sections = [this.heroSection, ...this.serviceSections.toArray()];
        console.log('Sections to observe:', sections.length, sections);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    console.log(
                        'IntersectionObserver entry:',
                        entry.target,
                        entry.isIntersecting,
                    );
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '50px' },
        );

        sections.forEach((section) => {
            if (section?.nativeElement) {
                console.log('Observing section:', section.nativeElement);
                observer.observe(section.nativeElement);
            } else {
                console.warn('Section element not found:', section);
            }
        });
    }

    onStartNow() {
        console.log('Start Now clicked, navigating to /signup');
        this.router.navigate(['/signup']).catch((err) => {
            console.error('Navigation error to /signup:', err);
        });
    }
}
