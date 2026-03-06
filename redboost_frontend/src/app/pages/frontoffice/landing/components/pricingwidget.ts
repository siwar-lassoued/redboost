import {
    Component,
    OnInit,
    ElementRef,
    ViewChild,
    HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
    faCode,
    faPalette,
    faMobileAlt,
    faRocket,
} from '@fortawesome/free-solid-svg-icons';
import {
    trigger,
    state,
    style,
    transition,
    animate,
    keyframes,
} from '@angular/animations';

@Component({
    selector: 'pricing-widget',
    standalone: true,
    imports: [CommonModule, ButtonModule, FontAwesomeModule],
    template: `
        <section class="services-section" #servicesSection id="servicesSection">
            <div class="services-container">
                <div class="services-header">
                    <span class="section-subtitle"
                        >Services que nous offrons</span
                    >
                    <!-- Title with gradient styling -->
                    <div class="title-container">
                        <h2 class="section-title">
                            Plus qu'une
                            <span class="gradient-text">plateforme</span>
                        </h2>
                        <div class="title-underline"></div>
                    </div>
                    <p class="section-description">
                        Des solutions complètes pour aider votre entreprise à
                        prospérer à l'ère numérique
                    </p>
                </div>

                <div class="services-grid">
                    <div
                        *ngFor="let service of services; let i = index"
                        class="service-card"
                        [@cardAnimation]="cardStates[i]"
                        [@hoverAnimation]="hoverStates[i]"
                        (mouseenter)="onMouseEnter(i)"
                        (mouseleave)="onMouseLeave(i)"
                    >
                        <div class="service-icon-wrapper">
                            <div class="service-icon">
                                <fa-icon
                                    [icon]="service.icon"
                                    size="2x"
                                ></fa-icon>
                            </div>
                        </div>
                        <h3 class="service-title">{{ service.title }}</h3>
                        <p class="service-description">
                            {{ service.description }}
                        </p>
                    </div>
                </div>

                <div class="button-container">
                    <button pButton class="discover-button">
                        Découvrez nos services
                        <span class="button-arrow">→</span>
                    </button>
                </div>
            </div>
        </section>
    `,
    styles: [
        `
            .services-section {
                position: relative;
                padding: 100px 0;
                background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                overflow: hidden;
            }

            .services-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
                position: relative;
                z-index: 1;
            }

            .services-header {
                text-align: center;
                margin-bottom: 70px;
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

            .section-description {
                font-size: 1.1rem;
                color: #666;
                max-width: 600px;
                margin: 0 auto;
                line-height: 1.6;
            }

            .services-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin-bottom: 60px;
            }

            .service-card {
                background: white;
                padding: 2rem 1.5rem;
                border-radius: 20px;
                text-align: center;
                transition: all 0.4s ease;
                min-height: 300px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                position: relative;
                overflow: hidden;
                border: 2px solid transparent;
                background-clip: padding-box;
                box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
            }

            .service-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: 20px;
                padding: 2px;
                background: linear-gradient(135deg, #db1e37 0%, #0a4955 100%);
                -webkit-mask:
                    linear-gradient(#fff 0 0) content-box,
                    linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                mask-composite: exclude;
                z-index: -1;
            }

            .service-icon-wrapper {
                margin-bottom: 1.5rem;
            }

            .service-icon {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(
                    135deg,
                    rgba(219, 30, 55, 0.1) 0%,
                    rgba(10, 73, 85, 0.1) 100%
                );
                color: #0a4955;
                position: relative;
                transition: all 0.3s ease;
            }

            .service-card:hover .service-icon {
                background: linear-gradient(135deg, #db1e37 0%, #0a4955 100%);
                color: white;
                transform: scale(1.1);
            }

            .service-title {
                font-size: 1.25rem;
                color: #0a4955;
                margin-bottom: 1rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .service-description {
                font-size: 0.95rem;
                color: #666;
                line-height: 1.6;
                font-weight: 400;
            }

            .button-container {
                display: flex;
                justify-content: center;
                margin-top: 20px;
            }

            .discover-button {
                padding: 1rem 2rem;
                background: linear-gradient(to right, #db1e37, #0a4955);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                box-shadow: 0 10px 20px rgba(10, 73, 85, 0.15);
                position: relative;
                overflow: hidden;
                z-index: 1;
            }

            .discover-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(to left, #db1e37, #0a4955);
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: -1;
            }

            .discover-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 15px 25px rgba(10, 73, 85, 0.2);
            }

            .discover-button:hover::before {
                opacity: 1;
            }

            .button-arrow {
                transition: transform 0.3s ease;
            }

            .discover-button:hover .button-arrow {
                transform: translateX(5px);
            }

            @media (max-width: 1200px) {
                .services-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 25px;
                }

                .service-card {
                    min-height: 280px;
                }
            }

            @media (max-width: 768px) {
                .services-section {
                    padding: 80px 0;
                }

                .services-grid {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }

                .service-card {
                    padding: 1.8rem 1.2rem;
                    min-height: 250px;
                }

                .service-icon {
                    width: 60px;
                    height: 60px;
                }

                .service-title {
                    font-size: 1.2rem;
                }

                .service-description {
                    font-size: 0.9rem;
                }
            }

            @media (max-width: 480px) {
                .service-card {
                    padding: 1.5rem 1rem;
                    min-height: 230px;
                    border-radius: 16px;
                }

                .service-card::before {
                    border-radius: 16px;
                }

                .service-icon {
                    width: 55px;
                    height: 55px;
                }

                .service-title {
                    font-size: 1.1rem;
                }

                .service-description {
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
export class PricingWidget implements OnInit {
    @ViewChild('servicesSection', { static: true })
    servicesSection!: ElementRef;

    faCode = faCode;
    faPalette = faPalette;
    faMobileAlt = faMobileAlt;
    faRocket = faRocket;

    services = [
        {
            icon: this.faCode,
            title: 'Services de développement Web',
            description:
                'Des sites Web personnalisés et évolutifs conçus pour évoluer avec vous',
        },
        {
            icon: this.faPalette,
            title: 'Solutions de communication et de conception',
            description: 'Un contenu attrayant qui amplifie votre marque',
        },
        {
            icon: this.faMobileAlt,
            title: "Développement d'applications mobiles",
            description: 'Applications mobiles natives et multiplateformes',
        },
        {
            icon: this.faRocket,
            title: 'Marketing Digital',
            description:
                'Solutions marketing stratégiques pour la croissance des entreprises',
        },
    ];

    cardStates: string[] = [];
    hoverStates: string[] = [];

    ngOnInit() {
        this.cardStates = this.services.map(() => 'hidden');
        this.hoverStates = this.services.map(() => 'default');
        this.checkVisibility();
    }

    @HostListener('window:scroll', [])
    onScroll(): void {
        this.checkVisibility();
    }

    private checkVisibility(): void {
        const rect = this.servicesSection.nativeElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (rect.top <= windowHeight * 0.25 && rect.bottom >= 0) {
            this.cardStates = this.services.map(() => 'visible');
        }
    }

    onMouseEnter(index: number): void {
        this.hoverStates[index] = 'hovered';
    }

    onMouseLeave(index: number): void {
        this.hoverStates[index] = 'default';
    }
}
