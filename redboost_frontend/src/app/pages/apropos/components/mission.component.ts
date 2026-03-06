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
    selector: 'mission-component',
    standalone: true,
    imports: [CommonModule, ButtonModule, RippleModule],
    template: `
        <section class="mission-section" #missionSection>
            <div class="mission-content">
                <div class="section-text">
                    <span
                        class="section-badge"
                        [@textAnimation]="isVisible ? 'visible' : 'hidden'"
                        >Notre Mission</span
                    >
                    <h2
                        class="section-title"
                        [@textAnimation]="isVisible ? 'visible' : 'hidden'"
                    >
                        Faciliter la Croissance des Startups
                    </h2>
                    <div
                        class="mission-cards"
                        [@listAnimation]="isVisible ? 'visible' : 'hidden'"
                    >
                        @for (
                            item of missionItems;
                            track item.text;
                            let i = $index
                        ) {
                            <div
                                class="mission-card"
                                [style.transitionDelay]="i * 0.2 + 's'"
                            >
                                <i
                                    [class]="item.icon"
                                    class="text-primary card-icon"
                                ></i>
                                <p class="card-text">{{ item.text }}</p>
                            </div>
                        }
                    </div>
                    <button
                        pButton
                        pRipple
                        label="Découvrez RedBoost"
                        class="cta-button"
                        [@buttonHoverAnimation]="buttonHoverState"
                        (mouseenter)="onButtonMouseEnter()"
                        (mouseleave)="onButtonMouseLeave()"
                        routerLink="/landing"
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
        trigger('listAnimation', [
            state(
                'hidden',
                style({ opacity: 0, transform: 'translateY(20px)' }),
            ),
            state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('hidden => visible', [animate('0.6s ease-out')]),
        ]),
        trigger('buttonHoverAnimation', [
            state(
                'inactive',
                style({
                    transform: 'translateY(0)',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                    background: 'linear-gradient(to right, #DB1E37, #1a2e35)',
                }),
            ),
            state(
                'active',
                style({
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 15px rgba(0, 0, 0, 0.15)',
                    background: 'linear-gradient(to right, #1a2e35, #DB1E37)',
                }),
            ),
            transition('inactive => active', animate('0.3s ease-out')),
            transition('active => inactive', animate('0.3s ease-in')),
        ]),
    ],
    styles: [
        `
            .mission-section {
                padding: 4rem 1.5rem;
                background: #f0f4f8;
                position: relative;
                overflow: hidden;
            }

            .mission-content {
                max-width: 1280px;
                margin: 0 auto;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .section-text {
                text-align: center;
                width: 100%;
            }

            .section-badge {
                display: inline-block;
                padding: 0.5rem 1.5rem;
                background: rgba(219, 30, 55, 0.1);
                color: #db1e37;
                border-radius: 50px;
                font-size: 1rem;
                font-weight: 600;
                margin-bottom: 1rem;
            }

            .section-title {
                font-size: clamp(1.8rem, 3vw, 2.5rem);
                color: #1a2e35;
                font-weight: 700;
                margin-bottom: 2rem;
            }

            .mission-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1.5rem;
                padding: 0;
                margin-bottom: 2rem;
            }

            .mission-card {
                background: white;
                padding: 1.5rem;
                border-radius: 12px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                opacity: 0;
                transform: translateY(20px);
                animation: fadeInUp 0.6s ease-out forwards;
            }

            .card-icon {
                font-size: 2rem;
                margin-bottom: 1rem;
            }

            .card-text {
                font-size: 1.1rem;
                color: #4a5568;
                line-height: 1.6;
            }

            .cta-button {
                padding: 0.8rem 2rem;
                background: linear-gradient(to right, #db1e37, #1a2e35);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
            }

            @media (max-width: 768px) {
                .mission-section {
                    padding: 3rem 1rem;
                }

                .section-title {
                    font-size: clamp(1.5rem, 3vw, 2rem);
                }

                .card-text {
                    font-size: 1rem;
                }

                .cta-button {
                    padding: 0.7rem 1.8rem;
                    font-size: 0.95rem;
                }

                .section-badge {
                    font-size: 0.9rem;
                    padding: 0.4rem 1.2rem;
                }
            }

            @media (max-width: 480px) {
                .mission-section {
                    padding: 2rem 1rem;
                }

                .section-title {
                    font-size: clamp(1.3rem, 2.5vw, 1.8rem);
                }

                .mission-card {
                    padding: 1rem;
                }
            }

            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `,
    ],
})
export class MissionComponent {
    @ViewChild('missionSection', { static: true }) missionSection!: ElementRef;
    isVisible: boolean = false;
    buttonHoverState: string = 'inactive';
    missionItems = [
        {
            text: 'Faciliter l’accompagnement entrepreneurial en structurant le suivi des startups avec des outils dédiés à la gestion des tâches, des KPI et des rendez-vous.',
            icon: 'pi pi-briefcase',
        },
        {
            text: 'Créer un pont entre les acteurs de l’écosystème en améliorant la communication et la collaboration entre entrepreneurs, mentors et investisseurs.',
            icon: 'pi pi-users',
        },
        {
            text: 'Optimiser le parcours de croissance des startups en leur offrant un cadre digitalisé et performant pour structurer leur développement.',
            icon: 'pi pi-chart-line',
        },
    ];

    @HostListener('window:scroll', [])
    onScroll(): void {
        const rect = this.missionSection.nativeElement.getBoundingClientRect();
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
