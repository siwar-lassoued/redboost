import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-career-cards',
    standalone: true,
    template: `
        <div class="career-container">
            <h2>Le bon choix pour chaque parcours</h2>
            <div class="cards-wrapper">
                <div class="card">
                    <div
                        class="icon"
                        [style.backgroundImage]="
                            'url(/assets/icons/entrepreneur.png)'
                        "
                    ></div>
                    <h3>Entrepreneurs</h3>
                    <p>
                        Soutien dédié et outils pour lancer et développer votre
                        startup avec succès.
                    </p>
                    <button class="continue-btn" (click)="navigateToSignin()">
                        En savoir plus
                    </button>
                </div>
                <div class="card">
                    <div
                        class="icon"
                        [style.backgroundImage]="
                            'url(/assets/icons/expert.png)'
                        "
                    ></div>
                    <h3>Experts</h3>
                    <p>
                        Plateforme pour partager votre expertise et guider les
                        entrepreneurs.
                    </p>
                    <button
                        class="continue-btn"
                        (click)="navigateToCoachRequest()"
                    >
                        En savoir plus
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .career-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 40px 20px;
                text-align: center;
                font-family: 'Arial', sans-serif;
                background-color: #f5f5f5;
                color: #333;
            }

            h2 {
                font-size: 2em;
                margin-bottom: 30px;
                color: #333;
            }

            .cards-wrapper {
                display: flex;
                justify-content: center;
                gap: 20px;
                flex-wrap: wrap;
            }

            .card {
                background: #ffffff;
                border-radius: 10px;
                padding: 20px;
                width: 300px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                transition: transform 0.2s ease;
            }

            .card:hover {
                transform: translateY(-5px);
            }

            .icon {
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                border-radius: 50%;
                overflow: hidden;
            }

            h3 {
                font-size: 1.5em;
                color: #333;
                margin-bottom: 10px;
            }

            p {
                font-size: 1em;
                color: #666;
                margin-bottom: 20px;
                line-height: 1.5;
            }

            .continue-btn {
                background-color: #f28c38;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 1em;
                transition: background-color 0.2s;
            }

            .continue-btn:hover {
                background-color: #e07b2c;
            }

            @media (max-width: 768px) {
                .card {
                    width: 100%;
                    margin-bottom: 20px;
                }

                .cards-wrapper {
                    flex-direction: column;
                    align-items: center;
                }
            }
        `,
    ],
})
export class CareerCardsComponent {
    constructor(private router: Router) {}

    navigateToSignin() {
        this.router.navigate(['/signin']);
    }

    navigateToCoachRequest() {
        this.router.navigate(['/coach-request']);
    }
}
