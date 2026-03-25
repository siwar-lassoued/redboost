import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { Router } from '@angular/router';
import { TopbarWidget } from './topbarwidget.component';
import { FooterWidget } from './footerwidget';
import { ScrollToTopComponent } from './ScrollToTopComponent';

@Component({
    selector: 'app-faq',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        RippleModule,
    ],
    template: `
        <div class="min-h-screen flex flex-col relative">
            <!-- Main Content -->
            <main class="flex-grow">
                <section class="faq-container">
                    <h2 class="faq-title">Questions Fréquentes</h2>
                    <p class="faq-subtitle">
                        Tout ce que vous devez savoir sur RedBoost
                    </p>
                    <div class="faq-list">
                        <div
                            *ngFor="let faq of faqs; let i = index"
                            class="faq-item"
                            #faqItem
                        >
                            <button
                                class="faq-question"
                                (click)="toggleFaq(i)"
                                [attr.aria-expanded]="faq.isOpen"
                                [attr.aria-controls]="'faq-answer-' + i"
                            >
                                <span class="question-text">{{
                                    faq.question
                                }}</span>
                                <span class="toggle-icon">{{
                                    faq.isOpen ? '−' : '+'
                                }}</span>
                            </button>
                            <div
                                *ngIf="faq.isOpen"
                                class="faq-answer"
                                id="faq-answer-{{ i }}"
                            >
                                {{ faq.answer }}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
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

            .faq-container {
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

            .faq-title {
                font-family: 'Poppins', sans-serif;
                font-size: 2.5rem;
                font-weight: 700;
                color: var(--secondary-color);
                text-align: center;
                margin-bottom: 1rem;
                position: relative;
            }

            .faq-title::after {
                content: '';
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
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

            .faq-subtitle {
                font-family: 'Inter', sans-serif;
                font-size: 1.125rem;
                color: #4b5563;
                text-align: center;
                margin-bottom: 3rem;
            }

            .faq-list {
                max-width: 800px;
                margin: 0 auto;
            }

            .faq-item {
                margin-bottom: 1rem;
                opacity: 0;
                transform: translateY(25px);
                transition:
                    opacity 0.8s ease-out,
                    transform 0.8s ease-out;
            }

            .faq-item.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .faq-question {
                width: 100%;
                text-align: left;
                padding: 1rem;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(12px);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-md);
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
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
                transition: var(--transition);
            }

            .faq-question:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            }

            .question-text {
                font-family: 'Poppins', sans-serif;
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--text-color);
            }

            .toggle-icon {
                font-size: 1.5rem;
                color: var(--secondary-color);
            }

            .faq-answer {
                margin-top: 0.5rem;
                padding: 1rem;
                background: rgba(255, 255, 255, 0.95);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-md);
                font-family: 'Inter', sans-serif;
                font-size: 1rem;
                color: #4b5563;
                line-height: 1.6;
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
                .faq-container {
                    padding: 20px 16px;
                }

                .faq-title {
                    font-size: 2rem;
                }

                .faq-subtitle {
                    font-size: 1rem;
                }

                .question-text {
                    font-size: 1rem;
                }

                .faq-answer {
                    font-size: 0.9rem;
                }
            }

            @media (max-width: 480px) {
                .faq-title {
                    font-size: 1.8rem;
                }

                .faq-subtitle {
                    font-size: 0.9rem;
                }

                .question-text {
                    font-size: 0.9rem;
                }

                .faq-answer {
                    font-size: 0.85rem;
                }

                .back-button {
                    font-size: 0.8rem;
                    padding: 6px 12px;
                }
            }
        `,
    ],
})
export class FaqComponent implements AfterViewInit {
    faqs = [
        {
            question: 'Qu’est-ce que RedBoost ?',
            answer: 'RedBoost est une plateforme dédiée à l’accompagnement des entrepreneurs. Nous vous connectons avec des coachs expérimentés, des investisseurs qualifiés et des opportunités de croissance pour transformer vos idées en projets concrets et durables.',
            isOpen: true,
        },
        {
            question: 'Comment puis-je m’inscrire sur RedBoost ?',
            answer: 'Cliquez sur le bouton "Démarrez maintenant" ou "Inscrivez-vous" sur notre page d’accueil, remplissez le formulaire avec vos informations, et commencez à explorer nos services immédiatement après la validation de votre compte.',
            isOpen: false,
        },
        {
            question: 'Quels types de coaching proposez-vous ?',
            answer: 'Nos programmes de coaching incluent l’idéation, la construction de projets, le leadership, la stratégie financière, et bien plus. Chaque programme est personnalisé selon vos besoins et objectifs.',
            isOpen: false,
        },
        {
            question: 'Comment trouver des investisseurs via RedBoost ?',
            answer: 'Après votre inscription, vous accédez à notre réseau d’investisseurs. Vous pouvez présenter votre projet, participer à des événements de mise en relation, et bénéficier de conseils pour optimiser votre pitch.',
            isOpen: false,
        },
        {
            question: 'Quels sont les coûts des services RedBoost ?',
            answer: 'RedBoost propose différents plans, incluant des options gratuites avec des quotas limités et des abonnements premium pour un accès illimité. Consultez notre page de tarification pour plus de détails.',
            isOpen: false,
        },
    ];

    @ViewChild('faqItem', { static: true }) faqItems!: ElementRef[];

    constructor(private router: Router) {}

    ngAfterViewInit() {
        const items = document.querySelectorAll('.faq-item');
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

        items.forEach((item) => {
            observer.observe(item);
        });
    }

    toggleFaq(index: number) {
        this.faqs[index].isOpen = !this.faqs[index].isOpen;
    }

    goBackToLanding() {
        this.router.navigate(['/landing']);
    }
}
