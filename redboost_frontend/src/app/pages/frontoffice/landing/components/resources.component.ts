import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RouterModule, Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { TopbarWidget } from './topbarwidget.component';
import { FooterWidget } from './footerwidget';
import { ScrollToTopComponent } from './ScrollToTopComponent';

interface Resource {
    title: string;
    author: string;
    description: string;
    image: string;
    link: string;
}

@Component({
    selector: 'app-resources',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        RouterModule,
        TopbarWidget,
        FooterWidget,
        ScrollToTopComponent,
        TooltipModule,
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
            <topbar-widget class="sticky top-0 z-10 bg-white shadow-md" />

            <!-- Main Content -->
            <main class="flex-grow">
                <section
                    #resourcesSection
                    class="header-section px-4 md:px-6 lg:px-8 xl:px-4"
                >
                    <div class="header-content w-full max-w-6xl mx-auto">
                        <h1 class="main-title">Explorez Nos Ressources</h1>
                        <h2 class="creative-title">Commencez Ici</h2>
                        <p class="subtitle">
                            Découvrez des outils et des inspirations pour donner
                            vie à vos projets ambitieux.
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

                <!-- Guides Grid -->
                <div class="guides-grid">
                    <p-card
                        *ngFor="let resource of resources; let i = index"
                        class="guide-card"
                        [ngClass]="'card-animation-' + (i % 6)"
                    >
                        <ng-template pTemplate="header">
                            <div
                                class="p-card-header"
                                [pTooltip]="resource.title"
                                tooltipPosition="top"
                            >
                                {{ resource.title }}
                            </div>
                        </ng-template>
                        <div class="card-content-wrapper">
                            <div class="image-wrapper">
                                <img
                                    [src]="resource.image"
                                    [alt]="resource.title"
                                    class="resource-image"
                                />
                            </div>
                            <p class="resource-author">
                                par {{ resource.author }}
                            </p>
                            <p class="resource-description">
                                {{ resource.description }}
                            </p>
                            <div class="card-footer">
                                <button
                                    pButton
                                    pRipple
                                    label="Découvrir"
                                    class="p-button-raised p-button-rounded learn-more-btn"
                                    (click)="navigateToResource(resource.link)"
                                ></button>
                            </div>
                        </div>
                    </p-card>
                    <p *ngIf="resources.length === 0" class="no-guides">
                        Aucune ressource disponible pour le moment.
                    </p>
                </div>
            </main>

            <!-- Footer -->
            <footer-widget class="mt-auto" />
            <app-scroll-to-top />
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
                font-family: 'Inter', 'Poppins', sans-serif;
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
                opacity: 0;
                transform: translateY(30px);
                transition:
                    opacity 0.8s ease-out,
                    transform 0.8s ease-out;
            }

            .header-section.visible {
                opacity: 1;
                transform: translateY(0);
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

            .main-title {
                font-family: 'Poppins', sans-serif;
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
                font-family: 'Inter', sans-serif;
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

            .guides-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 35px;
                padding: 40px 20px;
                justify-items: center;
                position: relative;
                z-index: 2;
                max-width: 1200px;
                margin: 0 auto;
            }

            .guide-card {
                perspective: 1000px;
                border-radius: 18px;
                overflow: hidden;
                width: 320px;
                height: 440px;
                background: #ffffff;
                box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12);
                transition: all 0.4s ease;
                transform-style: preserve-3d;
                border: 1px solid #e9ecef;
            }

            .guide-card:hover {
                transform: rotateX(4deg) rotateY(4deg) scale(1.06);
                box-shadow: 0 22px 55px rgba(0, 0, 0, 0.18);
                border: 1px solid rgba(219, 30, 55, 0.6);
            }

            .guide-card.card-animation-0 {
                animation: cardRise 0.8s ease-out 0.2s forwards;
            }
            .guide-card.card-animation-1 {
                animation: cardRise 0.8s ease-out 0.3s forwards;
            }
            .guide-card.card-animation-2 {
                animation: cardRise 0.8s ease-out 0.4s forwards;
            }
            .guide-card.card-animation-3 {
                animation: cardRise 0.8s ease-out 0.5s forwards;
            }
            .guide-card.card-animation-4 {
                animation: cardRise 0.8s ease-out 0.6s forwards;
            }
            .guide-card.card-animation-5 {
                animation: cardRise 0.8s ease-out 0.7s forwards;
            }

            .guide-card .p-card-header {
                background: linear-gradient(180deg, #fafbfc, #eceff1);
                padding: 22px 18px;
                font-family: 'Poppins', sans-serif;
                font-size: 1.7rem;
                font-weight: 800;
                color: #0a4955;
                background: linear-gradient(90deg, #db1e37, #0a4955);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.22);
                text-align: center;
                border-bottom: 1px solid #e9ecef;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
                transition: transform 0.3s ease;
                position: relative;
                animation: titleFadeIn 0.8s ease-out forwards;
            }

            .guide-card:hover .p-card-header {
                transform: scale(1.06);
            }

            .p-card-header::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 60px;
                height: 4px;
                background: linear-gradient(to right, #db1e37, #0a4955);
                border-radius: 2px;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .guide-card:hover .p-card-header::after {
                opacity: 1;
            }

            .card-content-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 22px;
                height: 100%;
                color: #444;
            }

            .image-wrapper {
                width: 100%;
                height: 160px;
                overflow: hidden;
                border-radius: 12px;
                margin-bottom: 18px;
                perspective: 1000px;
            }

            .resource-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.4s ease;
            }

            .guide-card:hover .resource-image {
                transform: translateZ(12px) scale(1.06);
            }

            .resource-author {
                font-size: 1rem;
                margin-bottom: 12px;
                font-style: italic;
                font-family: 'Lora', serif;
                color: #333;
            }

            .resource-description {
                font-size: 1.05rem;
                line-height: 1.6;
                margin: 0 0 18px 0;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                font-family: 'Lora', serif;
                flex-grow: 1;
            }

            .card-footer {
                margin-top: auto;
                padding: 0;
                width: 100%;
                display: flex;
                justify-content: center;
            }

            .learn-more-btn {
                background: linear-gradient(to right, #db1e37, #0a4955);
                border: none;
                padding: 12px 24px;
                font-size: 0.95rem;
                font-family: 'Poppins', sans-serif;
                font-weight: 600;
                border-radius: 25px;
                color: #ffffff;
                transition: all 0.3s ease;
                box-shadow: 0 0 12px rgba(219, 30, 55, 0.35);
            }

            .learn-more-btn:hover {
                transform: translateY(-4px);
                box-shadow: 0 0 22px rgba(219, 30, 55, 0.55);
            }

            .no-guides {
                color: #555;
                font-style: italic;
                font-size: 1.2rem;
                margin-top: 30px;
                font-family: 'Lora', serif;
            }

            @keyframes cardRise {
                0% {
                    opacity: 0;
                    transform: translateY(50px) scale(0.9);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes titleFadeIn {
                0% {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .guide-card.card-animation-0 .p-card-header {
                animation-delay: 0.2s;
            }
            .guide-card.card-animation-1 .p-card-header {
                animation-delay: 0.3s;
            }
            .guide-card.card-animation-2 .p-card-header {
                animation-delay: 0.4s;
            }
            .guide-card.card-animation-3 .p-card-header {
                animation-delay: 0.5s;
            }
            .guide-card.card-animation-4 .p-card-header {
                animation-delay: 0.6s;
            }
            .guide-card.card-animation-5 .p-card-header {
                animation-delay: 0.7s;
            }

            @media (max-width: 1200px) {
                .guides-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }

            @media (max-width: 768px) {
                .guides-grid {
                    grid-template-columns: 1fr;
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

                .guides-grid {
                    grid-template-columns: 1fr;
                    padding: 20px 10px;
                }

                .guide-card {
                    width: 280px;
                    height: 400px;
                }

                .guide-card .p-card-header {
                    font-size: 1.3rem;
                    padding: 16px;
                }

                .resource-author {
                    font-size: 0.9rem;
                }

                .resource-description {
                    font-size: 0.95rem;
                }

                .learn-more-btn {
                    padding: 10px 20px;
                    font-size: 0.9rem;
                }
            }
        `,
    ],
})
export class ResourcesComponent implements AfterViewInit {
    @ViewChild('resourcesSection') resourcesSection!: ElementRef;

    resources: Resource[] = [
        {
            title: 'The Lean Startup',
            author: 'Eric Ries',
            description:
                'Une méthodologie pour créer des startups avec une itération rapide.',
            image: 'https://m.media-amazon.com/images/I/81-QB7nDh4L._SL1500_.jpg',
            link: 'https://theleanstartup.com/',
        },
        {
            title: 'Build',
            author: 'Tony Fadell',
            description:
                'Leçons sur la conception de produits, la création d’équipes et l’innovation.',
            image: '/assets/black.jpg',
            link: 'https://www.harpercollins.com/products/build-tony-fadell',
        },
        {
            title: 'Dare to Lead',
            author: 'Brené Brown',
            description:
                'Stratégies de leadership pour entrepreneurs avec courage et empathie.',
            image: '/assets/dare.jpg',
            link: 'https://brenebrown.com/book/dare-to-lead/',
        },
        {
            title: 'Virtual Freedom',
            author: 'Chris Ducker',
            description:
                'Guide pour tirer parti des équipes virtuelles pour la croissance des entreprises.',
            image: '/assets/virtual.jpg',
            link: 'https://www.chrisducker.com/books/virtual-freedom/',
        },
        {
            title: 'Build the Damn Thing',
            author: 'Kathryn Finney',
            description:
                'Un guide pour les entrepreneurs diversifiés pour réussir en affaires.',
            image: '/assets/builddam.jpg',
            link: 'https://www.penguinrandomhouse.com/books/670293/build-the-damn-thing-by-kathryn-finney/',
        },
        {
            title: 'Burn Rate',
            author: 'Andy Dunn',
            description:
                'Un mémoire sur la création de Bonobos et la gestion de la santé mentale.',
            image: '/assets/burn.jpg',
            link: 'https://www.penguinrandomhouse.com/books/678040/burn-rate-by-andy-dunn/',
        },
        {
            title: 'Competing in the Age of AI',
            author: 'Marco Iansiti & Karim R. Lakhani',
            description:
                'Stratégies pour utiliser l’IA pour développer et innover dans les entreprises.',
            image: '/assets/competing.jpg',
            link: 'https://www.harvardbusiness.org/publication/competing-in-the-age-of-ai-strategy-and-leadership-when-algorithms-and-networks-run-the-world/',
        },
        {
            title: 'That Will Never Work',
            author: 'Marc Randolph',
            description:
                'L’histoire de l’ascension de Netflix et des leçons pour les entrepreneurs.',
            image: '/assets/that.jpg',
            link: 'https://www.hachettebookgroup.com/titles/marc-randolph/that-will-never-work/9780316530200/',
        },
        {
            title: 'Why Didn’t Anybody Tell Me This Sh*t Before?',
            author: 'Marcella Allison & Laura Gale',
            description:
                'Sagesse des femmes à succès pour naviguer dans les affaires.',
            image: '/assets/why.jpg',
            link: 'https://www.whythisbook.com/',
        },
    ];

    constructor(private router: Router) {}

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
            { threshold: 0.1, rootMargin: '50px' },
        );

        if (this.resourcesSection?.nativeElement) {
            observer.observe(this.resourcesSection.nativeElement);
        }
    }

    onStartNow() {
        this.router.navigate(['/signup']).catch((err) => {
            console.error('Navigation error to /signup:', err);
        });
    }

    navigateToResource(link: string) {
        window.open(link, '_blank');
    }
}
