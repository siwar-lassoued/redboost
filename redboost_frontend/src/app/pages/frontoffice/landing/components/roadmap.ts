import {
    Component,
    OnInit,
    HostListener,
    ElementRef,
    ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { CardModule } from 'primeng/card';
import {
    trigger,
    transition,
    style,
    animate,
    state,
} from '@angular/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
    faRocket,
    faUsers,
    faNetworkWired,
} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'roadmap-widget',
    standalone: true,
    imports: [
        CommonModule,
        DividerModule,
        ButtonModule,
        RippleModule,
        CardModule,
        FontAwesomeModule,
    ],
    template: `
        <section class="milestone-section" #milestoneSection>
            <div class="milestone-container">
                <div
                    class="milestone-header text-center mb-60"
                    [@fadeIn]="headerState"
                >
                    <span class="section-subtitle">Parcours des étapes</span>
                    <h2 class="section-title">Étapes RedBoost</h2>
                    <p class="section-description">
                        Étapes clés pour construire une plateforme florissante
                        pour votre succès
                    </p>
                </div>

                <div class="milestone-list">
                    <div
                        *ngFor="let event of events; let i = index"
                        class="milestone-item"
                        [@fadeIn]="itemStates[i]"
                    >
                        <div class="milestone-dot {{ event.status }}"></div>
                        <div class="milestone-card">
                            <div class="milestone-icon">
                                <fa-icon
                                    [icon]="event.icon"
                                    size="2x"
                                    class="text-[#0A4955]"
                                ></fa-icon>
                            </div>
                            <div class="milestone-content">
                                <h3 class="milestone-title">
                                    {{ event.title }}
                                </h3>
                                <p class="milestone-date">{{ event.date }}</p>
                                <p class="milestone-description">
                                    {{ event.description }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    class="milestone-cta text-center mt-60"
                    [@fadeIn]="ctaState"
                >
                    <button class="learn-more-button">
                        En savoir plus sur notre vision
                        <span class="button-arrow">→</span>
                    </button>
                </div>
            </div>
        </section>
    `,
    animations: [
        trigger('fadeIn', [
            state(
                'hidden',
                style({ opacity: 0, transform: 'translateY(20px)' }),
            ),
            state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('hidden => visible', animate('0.6s ease-out')),
        ]),
    ],
    styles: [
        `
            .milestone-section {
                padding: 120px 0;
                background: #ffffff;
                position: relative;
                overflow: hidden;
                font-family: 'Poppins', sans-serif;
            }

            .milestone-container {
                max-width: 1200px;
                width: 90%;
                margin: 0 auto;
                position: relative;
            }

            .milestone-header {
                text-align: center;
                margin-bottom: 60px;
            }

            .section-subtitle {
                display: inline-block;
                padding: 0.5rem 1.5rem;
                background: rgba(219, 30, 55, 0.1);
                color: #0a4955; /* Updated to match the specified blue */
                border-radius: 30px;
                font-size: 1rem;
                font-weight: 500;
                margin-bottom: 1.5rem;
            }

            .section-title {
                font-size: clamp(2.5rem, 5vw, 3.5rem);
                color: #0a4955; /* Updated to the specified blue */
                margin-bottom: 1.5rem;
                font-weight: 800;
                line-height: 1.2;
                letter-spacing: -0.02em;
                white-space: nowrap; /* Ensures the title stays on one line */
            }

            .section-description {
                font-size: 1.1rem;
                color: #666;
                max-width: 600px;
                margin: 0 auto;
                line-height: 1.6;
            }

            .milestone-list {
                position: relative;
                padding-left: 20px;
            }

            .milestone-item {
                display: flex;
                align-items: flex-start;
                margin-bottom: 40px;
                position: relative;
            }

            .milestone-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-top: 8px;
                margin-right: 15px;
                flex-shrink: 0;
            }

            .milestone-dot.completed {
                background: #db1e37;
            }

            .milestone-dot.current {
                background: #db1e37;
                box-shadow: 0 0 0 4px rgba(219, 30, 55, 0.2);
            }

            .milestone-dot.upcoming {
                background: #0a4955; /* Updated to match the specified blue */
                border: 2px solid #e0e7ff;
            }

            .milestone-card {
                background: #ffffff;
                padding: 1.5rem;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                border: 2px solid rgba(219, 30, 55, 0.1);
                flex: 1;
                display: flex;
                align-items: center;
            }

            .milestone-icon {
                margin-right: 1.5rem;
                flex-shrink: 0;
            }

            .milestone-icon fa-icon {
                width: 32px;
                height: 32px;
            }

            .milestone-content {
                flex: 1;
            }

            .milestone-title {
                font-size: 1.5rem;
                color: #0a4955; /* Updated to match the specified blue */
                margin-bottom: 0.5rem;
                font-weight: 700;
            }

            .milestone-date {
                font-size: 0.9rem;
                color: #666;
                margin-bottom: 0.5rem;
            }

            .milestone-description {
                color: #666;
                line-height: 1.6;
                margin: 0;
            }

            .milestone-cta {
                text-align: center;
                margin-top: 60px;
            }

            .learn-more-button {
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
                box-shadow: 0 10px 20px rgba(219, 30, 55, 0.15);
            }

            .learn-more-button:hover {
                background: linear-gradient(to left, #db1e37, #0a4955);
                transform: translateY(-2px);
                box-shadow: 0 15px 25px rgba(10, 73, 85, 0.2);
            }

            .button-arrow {
                transition: transform 0.3s ease;
            }

            .learn-more-button:hover .button-arrow {
                transform: translateX(4px);
            }

            @media (max-width: 768px) {
                .milestone-section {
                    padding: 80px 0;
                }

                .milestone-list {
                    padding-left: 10px;
                }

                .milestone-item {
                    margin-bottom: 30px;
                }

                .milestone-card {
                    padding: 1rem;
                }

                .milestone-title {
                    font-size: 1.3rem;
                }
            }
        `,
    ],
})
export class RoadmapWidget implements OnInit {
    @ViewChild('milestoneSection', { static: true })
    milestoneSection!: ElementRef;

    headerState: string = 'hidden';
    ctaState: string = 'hidden';
    itemStates: string[] = [];

    events = [
        {
            status: 'completed',
            date: 'Lancement : Juillet 2024',
            icon: faRocket,
            phase: 'Phase 1',
            title: 'Lancement',
            description:
                'Lancement de la plateforme avec des fonctionnalités de base pour le matching et la communication',
        },
        {
            status: 'current',
            date: 'T4 2024',
            icon: faUsers,
            phase: 'Phase 2',
            title: 'Expansion',
            description:
                "Ouverture à un plus grand nombre d'entrepreneurs et de coachs, avec des outils de suivi avancés.",
        },
        {
            status: 'upcoming',
            date: 'T1 2025',
            icon: faNetworkWired,
            phase: 'Phase 3',
            title: 'Intégration',
            description:
                "Intégration avec d'autres systèmes et ajout de fonctionnalités de networking étendu.",
        },
    ];

    ngOnInit() {
        this.itemStates = this.events.map(() => 'hidden');
        this.checkVisibility();
    }

    @HostListener('window:scroll', [])
    onScroll(): void {
        this.checkVisibility();
    }

    private checkVisibility(): void {
        const rect =
            this.milestoneSection.nativeElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (rect.top <= windowHeight * 0.75 && rect.bottom >= 0) {
            this.headerState = 'visible';
            this.ctaState = 'visible';
            this.itemStates = this.events.map(() => 'visible');
        }
    }
}
