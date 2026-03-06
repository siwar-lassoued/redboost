import {
    Component,
    AfterViewInit,
    ElementRef,
    ViewChild,
    ViewChildren,
    QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import {
    trigger,
    state,
    style,
    transition,
    animate,
    keyframes,
} from '@angular/animations';

@Component({
    selector: 'app-marketing-landing-cards',
    standalone: true,
    imports: [CommonModule, ButtonModule, RippleModule],
    template: `
        <section
            #marketSection
            id="marketinglandingcards"
            class="py-20 md:py-28 px-6"
        >
            <div class="max-w-7xl mx-auto">
                <!-- Header Section -->
                <div class="text-center mb-20 section-content">
                    <span class="section-subtitle">Nos Forfaits</span>
                    <!-- Title with gradient styling -->
                    <div class="title-container">
                        <h2 class="section-title">
                            Choisissez Votre
                            <span class="gradient-text">Plan</span>
                        </h2>
                        <div class="title-underline"></div>
                    </div>
                    <p
                        class="text-lg text-gray-600 max-w-3xl mx-auto mt-4 leading-relaxed"
                    >
                        Trouvez le plan idéal pour vos besoins. Profitez d'une
                        période d'essai gratuite de 14 jours avec chaque
                        forfait.
                    </p>
                </div>

                <!-- Plans Grid -->
                <div class="services-grid section-content">
                    <div
                        *ngFor="let plan of plans; let i = index"
                        class="service-card-wrapper"
                        [ngClass]="{ 'highlighted-wrapper': plan.highlighted }"
                    >
                        <div
                            class="service-card"
                            #planCard
                            [@cardAnimation]="cardStates[i] || 'hidden'"
                            [@hoverAnimation]="hoverStates[i] || 'default'"
                            (mouseenter)="onMouseEnter(i)"
                            (mouseleave)="onMouseLeave(i)"
                        >
                            <!-- Highlighted Badge -->
                            <div
                                *ngIf="plan.highlighted"
                                class="highlight-badge"
                            >
                                Recommandé
                            </div>

                            <div class="card-content">
                                <!-- Plan Icon -->
                                <div class="plan-icon">
                                    <ng-container [ngSwitch]="plan.title">
                                        <i
                                            *ngSwitchCase="'De base'"
                                            class="pi pi-bolt"
                                        ></i>
                                        <i
                                            *ngSwitchCase="'Professionnel'"
                                            class="pi pi-shield"
                                        ></i>
                                        <i
                                            *ngSwitchCase="'Entreprise'"
                                            class="pi pi-users"
                                        ></i>
                                    </ng-container>
                                </div>

                                <!-- Plan Details -->
                                <h3 class="plan-title">{{ plan.title }}</h3>
                                <p class="plan-description">
                                    {{ plan.description }}
                                </p>

                                <!-- Pricing -->
                                <div class="pricing">
                                    <div class="price">{{ plan.price }}</div>
                                    <div
                                        *ngIf="plan.price !== 'Personnalisé'"
                                        class="price-description"
                                    >
                                        par utilisateur / mois
                                    </div>
                                </div>

                                <!-- CTA Button -->
                                <div class="button-container">
                                    <button
                                        class="cta-button"
                                        [class.enterprise-button]="
                                            plan.title === 'Entreprise'
                                        "
                                    >
                                        {{ plan.ctaText }}
                                    </button>
                                </div>
                            </div>

                            <!-- Features -->
                            <div class="features-section">
                                <p class="features-title">
                                    FONCTIONNALITÉS INCLUSES :
                                </p>
                                <ul class="features-list">
                                    <li
                                        *ngFor="
                                            let feature of visibleFeatures(
                                                plan.features
                                            );
                                            let j = index
                                        "
                                        class="feature-item"
                                    >
                                        <div class="feature-check">
                                            <i class="pi pi-check"></i>
                                        </div>
                                        <span class="feature-text">{{
                                            feature
                                        }}</span>
                                    </li>
                                    <ng-container
                                        *ngIf="
                                            plan.features.length > 5 &&
                                            !expandedStates[i]
                                        "
                                    >
                                        <button
                                            class="see-more-btn"
                                            (click)="toggleFeatures(i)"
                                        >
                                            Voir plus
                                        </button>
                                    </ng-container>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `,
    styles: [
        `
            :host {
                display: block;
                font-family: 'Inter', 'Poppins', sans-serif;
            }

            section {
                background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                padding: 100px 0;
            }

            .pi {
                display: inline-block;
                vertical-align: middle;
            }

            .section-content {
                opacity: 0;
                transform: translateY(30px);
                transition:
                    opacity 0.8s ease-out,
                    transform 0.8s ease-out;
            }

            .section-content.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .section-subtitle {
                display: inline-block;
                padding: 0.5rem 1.5rem;
                background: linear-gradient(
                    90deg,
                    rgba(219, 30, 55, 0.1) 0%,
                    rgba(10, 73, 85, 0.1) 100%
                );
                color: #0a4955;
                border-radius: 20px;
                font-size: 1rem;
                font-weight: 500;
                margin-bottom: 1.5rem;
                letter-spacing: 0.5px;
            }

            .title-container {
                margin-bottom: 1.5rem;
            }

            .section-title {
                font-size: clamp(2.5rem, 5vw, 3.5rem);
                color: #0a4955;
                margin-bottom: 1rem;
                font-weight: 800;
                line-height: 1.2;
                letter-spacing: -0.02em;
            }

            .gradient-text {
                background: linear-gradient(90deg, #db1e37 0%, #0a4955 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .title-underline {
                width: 80px;
                height: 4px;
                background: linear-gradient(to right, #db1e37, #0a4955);
                border-radius: 2px;
                margin: 1.5rem auto 0;
            }

            .services-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 30px;
                align-items: stretch; /* Ensure all cards stretch to the same height */
                margin-bottom: 60px;
            }

            .service-card-wrapper {
                position: relative;
                border-radius: 20px;
                background: linear-gradient(135deg, #db1e37 0%, #0a4955 100%);
                padding: 2px;
            }

            .highlighted-wrapper {
                padding: 3px;
            }

            .service-card {
                background: white;
                border-radius: 18px;
                text-align: center;
                transition: all 0.4s ease;
                position: relative;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                height: 100%; /* Ensure full height of the grid cell */
                box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
            }

            .highlighted-card {
                transform: scale(1.05);
                z-index: 10;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            }

            .highlight-badge {
                position: absolute;
                top: 20px;
                right: 20px;
                background: linear-gradient(to right, #db1e37, #0a4955);
                color: white;
                font-size: 0.75rem;
                font-weight: 600;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                z-index: 5;
                box-shadow: 0 4px 10px rgba(219, 30, 55, 0.3);
            }

            .card-content {
                padding: 2.5rem 2rem 2rem;
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .plan-icon {
                margin-bottom: 1.5rem;
            }

            .plan-icon i {
                font-size: 2.5rem;
                color: #0a4955;
            }

            .plan-title {
                font-size: 1.5rem;
                color: #0a4955;
                margin-bottom: 1rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .plan-description {
                font-size: 1rem;
                color: #666;
                line-height: 1.6;
                margin-bottom: 1.5rem;
                flex: 1;
            }

            .pricing {
                margin-bottom: 2rem;
            }

            .price {
                font-size: 2.5rem;
                font-weight: 800;
                color: #0a4955;
                margin-bottom: 0.5rem;
            }

            .price-description {
                font-size: 0.9rem;
                color: #666;
            }

            .button-container {
                margin-top: auto;
            }

            .cta-button {
                width: 100%;
                height: 48px;
                font-size: 16px;
                font-weight: 600;
                border-radius: 12px;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                background: linear-gradient(to right, #db1e37, #0a4955);
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            }

            .cta-button:hover {
                background: linear-gradient(to left, #db1e37, #0a4955);
                transform: translateY(-2px);
                box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
            }

            .enterprise-button {
                background: linear-gradient(to right, #0a4957, #004d4d);
            }

            .enterprise-button:hover {
                background: linear-gradient(to left, #0a4957, #004d4d);
            }

            .features-section {
                border-top: 1px solid #f0f0f0;
                padding: 2rem;
                background: #fafafa;
                border-bottom-left-radius: 18px;
                border-bottom-right-radius: 18px;
            }

            .features-title {
                font-weight: 600;
                font-size: 0.9rem;
                color: #0a4955;
                margin-bottom: 1.5rem;
                text-align: center;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                position: relative;
                padding-bottom: 0.75rem;
            }

            .features-title::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 40px;
                height: 2px;
                background: linear-gradient(to right, #db1e37, #0a4955);
                border-radius: 1px;
            }

            .features-list {
                list-style: none;
                padding: 0;
                margin: 0;
                max-height: 200px; /* Limit height for overflow handling */
                overflow: hidden;
            }

            .feature-item {
                display: flex;
                align-items: center;
                margin-bottom: 1rem;
                padding: 0.5rem 0;
            }

            .feature-check {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: linear-gradient(
                    135deg,
                    rgba(219, 30, 55, 0.1) 0%,
                    rgba(10, 73, 85, 0.1) 100%
                );
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 0.75rem;
                flex-shrink: 0;
            }

            .feature-check i {
                color: #0a4955;
                font-size: 0.8rem;
                font-weight: bold;
            }

            .feature-text {
                font-size: 0.9rem;
                color: #666;
                line-height: 1.4;
                text-align: left;
            }

            .see-more-btn {
                display: block;
                width: 100%;
                padding: 0.5rem 1rem;
                font-size: 0.9rem;
                font-weight: 500;
                color: #0a4955;
                background: none;
                border: none;
                cursor: pointer;
                text-align: center;
                margin-top: 0.5rem;
                text-decoration: underline;
            }

            .see-more-btn:hover {
                color: #db1e37;
            }

            @media (max-width: 1200px) {
                .services-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 25px;
                }

                .highlighted-wrapper {
                    order: -1;
                }
            }

            @media (max-width: 768px) {
                section {
                    padding: 80px 0;
                }

                .services-grid {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }

                .card-content {
                    padding: 2rem 1.5rem 1.5rem;
                }

                .features-section {
                    padding: 1.5rem;
                }

                .plan-title {
                    font-size: 1.3rem;
                }

                .plan-description {
                    font-size: 0.95rem;
                }

                .price {
                    font-size: 2rem;
                }
            }

            @media (max-width: 480px) {
                .service-card-wrapper {
                    border-radius: 16px;
                }

                .service-card {
                    border-radius: 14px;
                }

                .card-content {
                    padding: 1.5rem 1rem 1rem;
                }

                .features-section {
                    padding: 1rem;
                    border-bottom-left-radius: 14px;
                    border-bottom-right-radius: 14px;
                }

                .plan-title {
                    font-size: 1.2rem;
                }

                .plan-description {
                    font-size: 0.9rem;
                }

                .price {
                    font-size: 1.75rem;
                }

                .feature-item {
                    margin-bottom: 0.75rem;
                }

                .feature-text {
                    font-size: 0.85rem;
                }
            }
        `,
    ],
    animations: [
        trigger('cardAnimation', [
            state(
                'hidden',
                style({ opacity: 0, transform: 'translateY(30px)' }),
            ),
            state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('hidden => visible', [
                animate(
                    '0.6s ease-out',
                    keyframes([
                        style({
                            opacity: 0,
                            transform: 'translateY(30px)',
                            offset: 0,
                        }),
                        style({
                            opacity: 0.7,
                            transform: 'translateY(10px)',
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
        trigger('hoverAnimation', [
            state('default', style({ transform: 'scale(1)' })),
            state('hovered', style({ transform: 'scale(1.03)' })),
            transition('default => hovered', animate('0.3s ease-in')),
            transition('hovered => default', animate('0.3s ease-out')),
        ]),
    ],
})
export class MarketingLandingCardsComponent implements AfterViewInit {
    @ViewChild('marketSection') marketSection!: ElementRef;
    @ViewChildren('planCard') planCards!: QueryList<ElementRef>;

    plans = [
        {
            title: 'De base',
            price: '$29',
            description:
                'Fonctionnalités essentielles pour les petites équipes et les startups',
            features: [
                "Jusqu'à 5 membres d'équipe",
                'Analytique de base',
                '1 Go de stockage',
                'Support par e-mail',
                'Accès API',
            ],
            ctaText: "S'inscrire",
            highlighted: false,
        },
        {
            title: 'Professionnel',
            price: '$79',
            description:
                'Tout ce dont vous avez besoin pour les entreprises en croissance',
            features: [
                "Jusqu'à 20 membres d'équipe",
                'Analytique avancée',
                '10 Go de stockage',
                'Support prioritaire',
                'Accès API',
                'Authentification unique (SSO)',
                'Intégrations personnalisées',
            ],
            ctaText: "S'inscrire",
            highlighted: true,
        },
        {
            title: 'Entreprise',
            price: 'Personnalisé',
            description:
                'Fonctionnalités avancées pour les grandes organisations',
            features: [
                "Membres d'équipe illimités",
                'Analytique pour entreprise',
                'Stockage illimité',
                'Support dédié 24/7',
                'Accès API avancé',
                'SAML & SSO',
                'Gestionnaire de compte dédié',
            ],
            ctaText: 'Contacter les ventes',
            highlighted: false,
        },
    ];

    cardStates: string[] = [];
    hoverStates: string[] = [];
    expandedStates: boolean[] = [];

    ngAfterViewInit() {
        this.cardStates = this.plans.map(() => 'hidden');
        this.hoverStates = this.plans.map(() => 'default');
        this.expandedStates = this.plans.map(() => false);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const contents =
                            entry.target.querySelectorAll('.section-content');
                        contents.forEach((content) =>
                            content.classList.add('visible'),
                        );
                        this.cardStates = this.plans.map(() => 'visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 },
        );

        if (this.marketSection?.nativeElement) {
            observer.observe(this.marketSection.nativeElement);
        }
    }

    onMouseEnter(index: number): void {
        this.hoverStates[index] = 'hovered';
    }

    onMouseLeave(index: number): void {
        this.hoverStates[index] = 'default';
    }

    visibleFeatures(features: string[]): string[] {
        return this.expandedStates[
            this.plans.indexOf(
                this.plans.find((p) => p.features === features)!,
            ) || 0
        ]
            ? features
            : features.slice(0, 5);
    }

    toggleFeatures(index: number): void {
        this.expandedStates[index] = !this.expandedStates[index];
    }
}
