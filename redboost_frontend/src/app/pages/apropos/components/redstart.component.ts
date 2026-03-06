import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';
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
    selector: 'redstart-component',
    standalone: true,
    imports: [CommonModule, ButtonModule, RippleModule],
    template: `
        <section class="redstart-section" #redstartSection>
            <div class="redstart-content">
                <div
                    class="section-image"
                    [@imageAnimation]="isVisible ? 'visible' : 'hidden'"
                ></div>
                <div class="section-text">
                    <h2
                        class="section-title"
                        [@textAnimation]="isVisible ? 'visible' : 'hidden'"
                    >
                        RedStart Tunisie : Créateur des Aventures
                    </h2>
                    <p
                        class="section-description"
                        [@textAnimation]="isVisible ? 'visible' : 'hidden'"
                    >
                        RedStart Tunisie est le partenaire stratégique des PME
                        innovantes et des startups au sein de l'écosystème
                        entrepreneurial en Tunisie. En tant qu'accélérateur et
                        incubateur, nous nous engageons à aider les
                        entrepreneurs à atteindre leurs objectifs et à assurer
                        le développement durable de leurs entreprises.
                    </p>
                    <p
                        class="section-description"
                        [@textAnimation]="isVisible ? 'visible' : 'hidden'"
                    >
                        Grâce à un partenariat précieux avec l'incubateur
                        français RedStart, nous offrons un réseau solide
                        d'experts, de mentors et d'investisseurs nationaux et
                        internationaux. Chaque entrepreneur soutenu par RedStart
                        Tunisie bénéficie d'un programme sur mesure conçu pour
                        maximiser l'impact et stimuler la croissance.
                    </p>
                    <button
                        pButton
                        pRipple
                        label="En savoir plus"
                        class="cta-button"
                        [@buttonHoverAnimation]="buttonHoverState"
                        (mouseenter)="onButtonMouseEnter()"
                        (mouseleave)="onButtonMouseLeave()"
                        routerLink="/contactlanding"
                    ></button>
                </div>
            </div>
        </section>
    `,
    animations: [
        trigger('textAnimation', [
            state(
                'hidden',
                style({ opacity: 0, transform: 'translateY(20px)' }),
            ),
            state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('hidden => visible', [
                animate(
                    '0.8s ease-out',
                    keyframes([
                        style({
                            opacity: 0,
                            transform: 'translateY(20px)',
                            offset: 0,
                        }),
                        style({
                            opacity: 0.7,
                            transform: 'translateY(5px)',
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
        trigger('imageAnimation', [
            state('hidden', style({ opacity: 0, transform: 'scale(0.95)' })),
            state('visible', style({ opacity: 1, transform: 'scale(1)' })),
            transition('hidden => visible', [animate('0.8s ease-out')]),
        ]),
        trigger('buttonHoverAnimation', [
            state(
                'inactive',
                style({
                    transform: 'translateY(0)',
                    boxShadow: '0 10px 20px rgba(0, 77, 77, 0.15)',
                    background: 'linear-gradient(to right, #C8223A, #034A55)',
                }),
            ),
            state(
                'active',
                style({
                    transform: 'translateY(-2px)',
                    boxShadow: '0 15px 25px rgba(0, 77, 77, 0.2)',
                    background: 'linear-gradient(to right, #034A55, #C8223A)',
                }),
            ),
            transition('inactive => active', animate('0.3s ease-out')),
            transition('active => inactive', animate('0.3s ease-in')),
        ]),
    ],
    styles: [
        `
            .redstart-section {
                padding: 4rem 2rem;
                background: #ffffff;
                position: relative;
                overflow: hidden;
            }

            .redstart-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                flex-direction: row;
                gap: 2rem;
                align-items: center;
            }

            .section-image {
                flex: 1;
                height: 400px;
                background-image: url('/assets/images/hero-background.jpeg');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                border-radius: 12px;
            }

            .section-text {
                flex: 1;
                text-align: left;
            }

            .section-title {
                font-size: clamp(1.8rem, 3vw, 2.5rem);
                color: #034a55;
                font-weight: 700;
                margin-bottom: 1.5rem;
            }

            .section-description {
                font-size: 1.1rem;
                color: #555;
                line-height: 1.6;
                margin-bottom: 1.5rem;
                max-width: 600px;
            }

            .cta-button {
                padding: 1rem 2rem;
                background: linear-gradient(to right, #c8223a, #034a55);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
            }

            @media (max-width: 992px) {
                .redstart-content {
                    flex-direction: column;
                    text-align: center;
                    gap: 1.5rem;
                }

                .section-text {
                    text-align: center;
                    order: 2;
                }

                .section-image {
                    height: 300px;
                    width: 100%;
                    order: 1;
                }

                .section-description {
                    margin-left: auto;
                    margin-right: auto;
                }
            }

            @media (max-width: 768px) {
                .redstart-section {
                    padding: 3rem 1.5rem;
                }

                .section-title {
                    font-size: clamp(1.5rem, 3vw, 2rem);
                }

                .section-description {
                    font-size: 1rem;
                }

                .cta-button {
                    padding: 0.8rem 1.5rem;
                    font-size: 1rem;
                }
            }

            @media (max-width: 480px) {
                .redstart-section {
                    padding: 2rem 1rem;
                }

                .section-title {
                    font-size: clamp(1.3rem, 2.5vw, 1.8rem);
                }

                .section-image {
                    height: 250px;
                }
            }
        `,
    ],
})
export class RedstartComponent {
    @ViewChild('redstartSection', { static: true })
    redstartSection!: ElementRef;
    isVisible: boolean = false;
    buttonHoverState: string = 'inactive';

    @HostListener('window:scroll', [])
    onScroll(): void {
        const rect = this.redstartSection.nativeElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        this.isVisible = rect.top <= windowHeight * 0.8 && rect.bottom >= 0;
    }

    ngOnInit() {
        this.onScroll();
    }

    onButtonMouseEnter() {
        this.buttonHoverState = 'active';
    }

    onButtonMouseLeave() {
        this.buttonHoverState = 'inactive';
    }
}
