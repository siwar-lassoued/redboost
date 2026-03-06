import {
    Component,
    ElementRef,
    ViewChild,
    HostListener,
    OnInit,
    AfterViewInit,
    ViewChildren,
    QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TimelineModule } from 'primeng/timeline';
import { TopbarWidget } from '../frontoffice/landing/components/topbarwidget.component';
import { FooterWidget } from '../frontoffice/landing/components/footerwidget';
import { ContactInfoComponent } from './components/contact-info.component';
import { ScrollToTopComponent } from './components/ScrollToTopComponent';
import { RedstartComponent } from './components/redstart.component';
import { RedboostComponent } from './components/redboost.component';
import { MissionComponent } from './components/mission.component';
import { VisionComponent } from './components/vision.component';
import { ValeursComponent } from './components/valeurs.component';
import {
    trigger,
    state,
    style,
    transition,
    animate,
    keyframes,
} from '@angular/animations';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        RippleModule,
        StyleClassModule,
        ButtonModule,
        DividerModule,
        TimelineModule,
        TopbarWidget,
        FooterWidget,
        ContactInfoComponent,
        ScrollToTopComponent,
        RedstartComponent,
        RedboostComponent,
        MissionComponent,
        VisionComponent,
        ValeursComponent,
    ],
    template: `
        <div class="min-h-screen flex flex-col relative">
            <!-- Decorative Background with Stars -->
            <div class="decorative-bg">
                <div
                    class="star"
                    style="top: 5%; left: 10%; width: 12px; height: 12px; animation-duration: 10s; animation-delay: 0s;"
                ></div>
                <div
                    class="star"
                    style="top: 15%; right: 15%; width: 10px; height: 10px; animation-duration: 12s; animation-delay: 1s;"
                ></div>
                <div
                    class="star"
                    style="top: 40%; left: 20%; width: 14px; height: 14px; animation-duration: 15s; animation-delay: 2s;"
                ></div>
                <div
                    class="star"
                    style="bottom: 10%; right: 10%; width: 8px; height: 8px; animation-duration: 8s; animation-delay: 3s;"
                ></div>
                <div
                    class="star"
                    style="bottom: 5%; left: 30%; width: 10px; height: 10px; animation-duration: 13s; animation-delay: 4s;"
                ></div>
            </div>

            <!-- Topbar -->
            <topbar-widget
                class="sticky top-0 w-full bg-white shadow-md z-50"
            />

            <!-- Main Content -->
            <main class="flex-grow">
                <!-- Hero Section -->
                <section
                    #heroSection
                    class="header-section px-4 md:px-6 lg:px-8 xl:px-4"
                >
                    <div class="header-content w-full max-w-6xl mx-auto">
                        <div class="title-container mb-10">
                            <h1
                                class="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[#034A55] tracking-tight leading-tight"
                                [@textAnimation]="
                                    isVisible ? 'visible' : 'hidden'
                                "
                            >
                                RedBoost :
                                <span class="gradient-text">Accélérateur</span>
                            </h1>
                            <h2
                                class="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#034A55] mt-4"
                                [@textAnimation]="
                                    isVisible ? 'visible' : 'hidden'
                                "
                            >
                                de <span class="gradient-text">Succès</span>
                            </h2>
                            <div
                                class="w-24 h-1 bg-gradient-to-r from-[#C8223A] to-[#034A55] rounded-full mt-8 mx-auto"
                            ></div>
                        </div>
                        <p
                            class="hero-description text-xl text-gray-600 max-w-prose mx-auto mb-10"
                            [@textAnimation]="isVisible ? 'visible' : 'hidden'"
                        >
                            Une plateforme révolutionnaire pour connecter
                            startups, coachs et investisseurs, transformant vos
                            idées en succès concrets.
                        </p>
                        <div
                            class="hero-button-container"
                            [@textAnimation]="isVisible ? 'visible' : 'hidden'"
                        >
                            <button
                                pButton
                                pRipple
                                type="button"
                                label="Découvrir Plus"
                                class="discover-button"
                            ></button>
                        </div>
                    </div>
                </section>

                <div class="content-wrapper">
                    <redstart-component
                        class="full-width-section"
                        #contentSection
                    />
                    <redboost-component
                        class="full-width-section"
                        #contentSection
                    />
                    <mission-component class="full-width-section" />
                    <vision-component class="full-width-section" />
                    <valeurs-component
                        class="full-width-section"
                        #contentSection
                    />
                </div>
            </main>

            <!-- Footer -->
            <footer-widget class="mt-auto bg-teal-900 text-white py-4 w-full" />
            <app-scroll-to-top />
        </div>
    `,
    animations: [
        trigger('textAnimation', [
            state(
                'hidden',
                style({ opacity: 0, transform: 'translateY(50px)' }),
            ),
            state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('hidden => visible', [
                animate(
                    '1.2s ease-out',
                    keyframes([
                        style({
                            opacity: 0,
                            transform: 'translateY(50px)',
                            offset: 0,
                        }),
                        style({
                            opacity: 0.7,
                            transform: 'translateY(20px)',
                            offset: 0.7,
                        }),
                        style({
                            opacity: 1,
                            transform: 'translateY(0)',
                            offset: 1,
                        }),
                    ]),
                ),
            ]),
        ]),
    ],
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
                overflow-x: hidden;
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

            .w-full {
                width: 100%;
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

            .bg-teal-900 {
                background-color: #134e4a;
            }

            .text-white {
                color: white;
            }

            .py-4 {
                padding-top: 1rem;
                padding-bottom: 1rem;
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
                max-width: 48rem;
                margin-left: auto;
                margin-right: auto;
            }

            .gradient-text {
                background: linear-gradient(90deg, #c8223a 0%, #034a55 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                display: inline-block;
                font-weight: 900;
            }

            .title-container {
                margin-bottom: 3rem;
            }

            .title-container h1 {
                font-size: clamp(2.5rem, 5vw, 4rem);
                font-weight: 800;
                color: #034a55;
                line-height: 1.1;
                margin-bottom: 0.5rem;
            }

            .title-container h2 {
                font-size: clamp(2rem, 4vw, 3.5rem);
                font-weight: 700;
                color: #034a55;
                line-height: 1.1;
            }

            .title-container div {
                width: 80px;
                height: 4px;
                background: linear-gradient(to right, #c8223a, #034a55);
                border-radius: 2px;
                margin: 2rem auto 0;
            }

            .hero-description {
                font-family: 'Inter', sans-serif;
                font-size: 1.25rem;
                color: #4b5563;
                line-height: 1.6;
                max-width: 600px;
                margin: 0 auto 3rem;
            }

            .hero-button-container {
                margin-top: 2rem;
            }

            .discover-button {
                padding: 1rem 2.5rem !important;
                font-size: 1.1rem !important;
                font-family: 'Poppins', sans-serif !important;
                font-weight: 600 !important;
                border: none !important;
                cursor: pointer !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                box-shadow: 0 6px 15px rgba(200, 34, 58, 0.3) !important;
                border-radius: 50px !important;
                background: linear-gradient(
                    to right,
                    #c8223a,
                    #034a55
                ) !important;
                color: white !important;
            }

            .discover-button:hover {
                transform: translateY(-3px) !important;
                box-shadow: 0 10px 25px rgba(200, 34, 58, 0.4) !important;
                opacity: 0.95 !important;
            }

            .content-wrapper {
                width: 100%;
                margin: 0 auto;
                padding: 0;
                box-sizing: border-box;
            }

            .content-section {
                margin-bottom: 4rem;
                opacity: 0;
                transform: translateY(30px);
                transition:
                    opacity 0.8s ease-out,
                    transform 0.8s ease-out;
                display: block !important;
                width: 100% !important;
                max-width: 1400px !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }

            .content-section.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .full-width-section {
                width: 100% !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                overflow: hidden; /* Prevent overflow issues */
            }

            .full-width-section .container {
                max-width: 1400px !important;
                margin: 0 auto !important;
                padding: 0 20px !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }

            .full-width-section .container > * {
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
            }

            /* Ensure child components respect full width */
            ::ng-deep .full-width-section > * {
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
            }

            .decorative-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: -1;
                background: transparent;
                overflow: hidden;
            }

            .star {
                position: absolute;
                background: radial-gradient(
                    circle,
                    rgba(200, 34, 58, 0.8),
                    rgba(255, 255, 255, 0)
                );
                border-radius: 50%;
                animation: fallStar 8s linear infinite;
                will-change: transform, opacity;
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

            @media (max-width: 1024px) {
                .header-section {
                    padding: 24px 0;
                }

                .title-container h1 {
                    font-size: clamp(2.2rem, 4.5vw, 3.5rem);
                }

                .title-container h2 {
                    font-size: clamp(1.8rem, 3.5vw, 3rem);
                }

                .hero-description {
                    font-size: 1.1rem;
                }

                .content-section {
                    margin-bottom: 3rem;
                }

                .full-width-section .container {
                    padding: 0 16px !important;
                }
            }

            @media (max-width: 768px) {
                .header-section {
                    padding: 16px 0;
                }

                .title-container {
                    margin-bottom: 2rem;
                }

                .title-container h1 {
                    font-size: 2.2rem;
                }

                .title-container h2 {
                    font-size: 1.8rem;
                }

                .hero-description {
                    font-size: 1rem;
                    margin-bottom: 2rem;
                }

                .discover-button {
                    padding: 0.8rem 2rem !important;
                    font-size: 1rem !important;
                }

                .star {
                    width: 8px !important;
                    height: 8px !important;
                }

                .content-section {
                    margin-bottom: 2.5rem;
                }

                .full-width-section .container {
                    padding: 0 12px !important;
                }
            }

            @media (max-width: 480px) {
                .header-section {
                    padding: 12px 0;
                }

                .title-container h1 {
                    font-size: 1.8rem;
                }

                .title-container h2 {
                    font-size: 1.5rem;
                }

                .title-container div {
                    width: 60px;
                    height: 3px;
                    margin: 1.5rem auto 0;
                }

                .hero-description {
                    font-size: 0.95rem;
                    margin-bottom: 1.5rem;
                }

                .discover-button {
                    padding: 0.6rem 1.5rem !important;
                    font-size: 0.9rem !important;
                }

                .star {
                    width: 6px !important;
                    height: 6px !important;
                }

                .content-section {
                    margin-bottom: 2rem;
                }

                .full-width-section .container {
                    padding: 0 8px !important;
                }
            }
        `,
    ],
})
export class AboutComponent implements OnInit, AfterViewInit {
    @ViewChild('heroSection', { static: true }) heroSection!: ElementRef;
    @ViewChildren('contentSection') contentSections!: QueryList<ElementRef>;

    isVisible: boolean = false;

    @HostListener('window:scroll', [])
    onScroll(): void {
        const rect = this.heroSection.nativeElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        this.isVisible = rect.top <= windowHeight * 0.8 && rect.bottom >= 0;
        if (this.isVisible) {
            this.heroSection.nativeElement.classList.add('visible');
        } else {
            this.heroSection.nativeElement.classList.remove('visible');
        }

        // Check visibility for all content sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            const isVisible =
                rect.top <= windowHeight * 0.8 && rect.bottom >= 0;
            if (isVisible) {
                section.classList.add('visible');
            } else {
                section.classList.remove('visible');
            }
        });
    }

    ngOnInit() {
        this.onScroll();
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.onScroll();
        }, 100);
    }
}
