import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
    selector: 'app-entrepreneurial-faq',
    standalone: true,
    imports: [CommonModule, ButtonModule, RippleModule],
    template: `
        <section class="faq-container">
            <h2 class="faq-title">
                Questions Fréquentes sur l’Accompagnement Entrepreneurial
            </h2>
            <p class="faq-subtitle">
                Tout ce que vous devez savoir sur nos services pour
                entrepreneurs
            </p>
            <div class="faq-list">
                <div *ngFor="let faq of faqs; let i = index" class="faq-item">
                    <button
                        class="faq-question"
                        (click)="toggleFaq(i)"
                        [attr.aria-expanded]="faq.isOpen"
                        [attr.aria-controls]="'faq-answer-' + i"
                    >
                        <span class="question-text">{{ faq.question }}</span>
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

            .faq-container {
                margin: 0 auto;
                max-width: 1200px;
                padding: 40px 20px;
                font-family: 'Inter', sans-serif;
                position: relative;
                z-index: 10;
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
            }
        `,
    ],
})
export class EntrepreneurialFaqComponent implements AfterViewInit {
    faqs = [
        {
            question:
                'Comment votre programme d’accompagnement aide-t-il à l’idéation ?',
            answer: 'Chaque grande aventure commence par une idée. Avec notre programme d’accompagnement, nous vous aidons à transformer vos intuitions en projets concrets. Nos experts vous guident dans la clarification de votre vision, l’identification des opportunités et la définition d’objectifs réalistes et ambitieux.',
            isOpen: true,
        },
        {
            question:
                'Qu’implique la phase de construction dans votre accompagnement ?',
            answer: 'Une fois l’idée bien posée, place à l’action. Grâce à des sessions de coaching personnalisées et des formations adaptées, vous avancez étape par étape. Vous travaillez sur des tâches précises, développez vos compétences et structurez votre projet pour en assurer la solidité et la viabilité.',
            isOpen: false,
        },
        {
            question: 'Comment assurez-vous le succès durable de mon projet ?',
            answer: 'Le succès ne se mesure pas uniquement par la création d’un projet, mais par sa durabilité. Nous vous accompagnons jusqu’au bout pour franchir chaque palier et atteindre vos objectifs. Notre mission est de vous voir réussir et bâtir une entreprise qui grandit avec vous.',
            isOpen: false,
        },
        {
            question:
                'Comment vos programmes de coaching sont-ils structurés ?',
            answer: 'Nos programmes commencent par une évaluation de vos besoins et ambitions pour définir un plan clair. Vous êtes accompagné par des experts qui fournissent des conseils stratégiques et des outils pratiques. Au fil des sessions, vous développez vos compétences, surmontez vos blocages et voyez vos projets évoluer concrètement.',
            isOpen: false,
        },
        {
            question:
                'Comment puis-je accéder à des opportunités d’investissement ?',
            answer: 'Nous mettons à votre disposition un réseau d’investisseurs prêts à écouter vos projets. Vous découvrez les options de financement adaptées à vos besoins, et nous favorisons des partenariats stratégiques pour assurer une croissance durable avec le soutien de ressources et d’expertises.',
            isOpen: false,
        },
    ];

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
}
