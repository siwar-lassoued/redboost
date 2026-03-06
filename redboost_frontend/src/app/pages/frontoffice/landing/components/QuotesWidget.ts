import {
    Component,
    OnInit,
    OnDestroy,
    AfterViewInit,
    ViewChild,
    ElementRef,
    ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import VanillaTilt from 'vanilla-tilt';

@Component({
    selector: 'quotes-widget',
    standalone: true,
    imports: [CommonModule],
    template: `
        <section #quotesSection class="quotes-section">
            <!-- Decorative Background with Birds and Stars -->
            <div class="decorative-bg">
                <div
                    class="star"
                    style="top: 10%; left: 5%; animation-duration: 12s; animation-delay: 0s;"
                ></div>
                <div
                    class="star"
                    style="top: 20%; right: 10%; animation-duration: 14s; animation-delay: 2s;"
                ></div>
                <div
                    class="star"
                    style="top: 50%; left: 15%; animation-duration: 13s; animation-delay: 1s;"
                ></div>
                <div
                    class="star"
                    style="bottom: 15%; right: 20%; animation-duration: 15s; animation-delay: 3s;"
                ></div>
                <div
                    class="star"
                    style="bottom: 5%; left: 25%; animation-duration: 11s; animation-delay: 4s;"
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

            <div class="quotes-container">
                <div class="quotes-header text-center mb-12">
                    <span class="section-subtitle">Esprit Entrepreneurial</span>
                    <h2 class="section-title">Citations Inspirantes</h2>
                    <p class="section-description">
                        Des mots de sagesse pour alimenter votre parcours
                        entrepreneurial
                    </p>
                </div>

                <div class="quote-carousel">
                    <div
                        class="quote-item"
                        [@fadeAnimation]="currentQuoteIndex"
                        data-tilt
                        data-tilt-max="10"
                        data-tilt-speed="400"
                        data-tilt-glare
                    >
                        <blockquote class="quote-text">
                            "{{ quotes[currentQuoteIndex].text }}"
                        </blockquote>
                        <cite class="quote-author"
                            >- {{ quotes[currentQuoteIndex].author }}</cite
                        >
                    </div>
                </div>
            </div>
        </section>
    `,
    animations: [
        trigger('fadeAnimation', [
            transition('* => *', [
                style({ opacity: 0 }),
                animate('0.5s ease-in-out', style({ opacity: 1 })),
            ]),
        ]),
    ],
    styles: [
        `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

            .quotes-section {
                padding: 120px 0;
                background: rgba(
                    209,
                    213,
                    219,
                    0.5
                ); /* Light grey with medium opacity */
                position: relative;
                overflow: hidden;
                font-family: 'Poppins', sans-serif;
                z-index: 1; /* Ensure content is above decorative background */
            }

            .quotes-container {
                max-width: 1200px;
                width: 90%;
                margin: 0 auto;
                position: relative;
                z-index: 2; /* Ensure container is above decorative background */
            }

            .quotes-header {
                text-align: center;
                margin-bottom: 60px;
            }

            .section-subtitle {
                display: inline-block;
                padding: 0.5rem 1.5rem;
                background: rgba(219, 30, 55, 0.1);
                color: #0a4955; /* Updated to the specified blue */
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

            .quote-carousel {
                max-width: 800px;
                margin: 0 auto;
                text-align: center;
            }

            .quote-item {
                padding: 2rem;
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
                border: 2px solid rgba(219, 30, 55, 0.1);
                transition: all 0.3s ease;
            }

            .quote-text {
                font-size: 1.5rem;
                color: #0a4955; /* Updated to the specified blue */
                margin-bottom: 1rem;
                font-style: italic;
                font-weight: 500;
                line-height: 1.6;
            }

            .quote-author {
                font-size: 1.1rem;
                color: #666;
                font-weight: 600;
            }

            /* Decorative Background with Birds and Stars */
            .decorative-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 0; /* Behind all other content */
                background: transparent; /* Transparent to let quotes-section background show through */
            }

            .bird {
                position: absolute;
                width: 100px;
                height: 100px;
                opacity: 0.5;
                animation:
                    floatBird 12s ease-in-out infinite,
                    fadeOut 6s ease-in-out infinite;
                will-change: transform, opacity;
            }

            .star {
                position: absolute;
                width: 10px;
                height: 10px;
                background: radial-gradient(
                    circle,
                    rgba(219, 30, 55, 0.8),
                    rgba(255, 255, 255, 0)
                );
                border-radius: 50%;
                animation: fallStar 5s linear infinite;
                will-change: transform, opacity;
            }

            @keyframes floatBird {
                0%,
                100% {
                    transform: translate(0, 0) rotate(0deg);
                }
                25% {
                    transform: translate(15px, -20px) rotate(5deg);
                }
                50% {
                    transform: translate(-10px, -30px) rotate(0deg);
                }
                75% {
                    transform: translate(10px, -15px) rotate(-5deg);
                }
            }

            @keyframes fadeOut {
                0% {
                    opacity: 0.5;
                }
                100% {
                    opacity: 0;
                }
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

            @media (max-width: 768px) {
                .quotes-section {
                    padding: 80px 0;
                }

                .quote-text {
                    font-size: 1.3rem;
                }

                .quote-author {
                    font-size: 1rem;
                }

                .bird {
                    width: 80px;
                    height: 80px;
                }

                .star {
                    width: 8px;
                    height: 8px;
                }
            }

            @media (max-width: 640px) {
                .bird {
                    width: 60px;
                    height: 60px;
                }

                .star {
                    width: 6px;
                    height: 6px;
                }
            }
        `,
    ],
})
export class QuotesWidget implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('quotesSection') quotesSection!: ElementRef;

    quotes = [
        {
            text: "Le meilleur moyen de prévoir l'avenir est de le créer.",
            author: 'Peter Drucker',
        },
        {
            text: "Les gagnants n'abandonnent jamais et ceux qui abandonnent ne gagnent jamais.",
            author: 'Vince Lombardi',
        },
        {
            text: "J'ai dû créer ma propre vie et mes propres opportunités ! Mais j'ai réussi ! Ne restez pas assis à attendre que les opportunités viennent. Levez-vous et créez-les !",
            author: 'Madam C.J. Walker',
        },
        {
            text: "Le secret pour avancer, c'est de commencer.",
            author: 'Mark Twain',
        },
        {
            text: "Il y a toujours quelqu'un qui a plus de difficultés que vous, et qui déplace des montagnes. Alors, comment oserais-je échouer ?",
            author: 'Entrepreneur Anonyme',
        },
        {
            text: "Je suis convaincu que la moitié de ce qui sépare les entrepreneurs réussis des autres, c'est une pure persévérance.",
            author: 'Steve Jobs',
        },
        {
            text: 'Se réunir est un début ; rester ensemble est un progrès ; travailler ensemble est une réussite.',
            author: 'Henry Ford',
        },
        {
            text: "Les grands fondateurs agissent vite, prennent des décisions et n'attendent pas la permission.",
            author: 'Sam Altman',
        },
    ];

    currentQuoteIndex: number = 0;
    private intervalId: any;

    constructor(private cdRef: ChangeDetectorRef) {}

    ngOnInit() {
        this.startQuoteRotation();
    }

    ngAfterViewInit() {
        // Initialize VanillaTilt for 3D tilt effect on quote item
        if (this.quotesSection?.nativeElement) {
            VanillaTilt.init(
                this.quotesSection.nativeElement.querySelectorAll(
                    '[data-tilt]',
                ),
                {
                    max: 10,
                    speed: 400,
                    glare: true,
                    'max-glare': 0.3,
                },
            );
        }
    }

    ngOnDestroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    startQuoteRotation() {
        this.intervalId = setInterval(() => {
            this.currentQuoteIndex =
                (this.currentQuoteIndex + 1) % this.quotes.length;
        }, 5000); // Change quote every 5 seconds
    }
}
