import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-call-to-action',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="cta-container">
            <div class="cta-content">
                <h2>Rejoignez RedBoost Aujourd'hui !</h2>
                <p>
                    Découvrez une plateforme unique qui connecte entrepreneurs
                    et coachs pour un succès partagé. Inscrivez-vous ou devenez
                    coach dès maintenant.
                </p>
                <div class="cta-buttons">
                    <button
                        class="cta-btn primary"
                        (click)="navigateToSignin()"
                    >
                        S'inscrire
                    </button>
                    <button
                        class="cta-btn secondary"
                        (click)="navigateToCoach()"
                    >
                        Devenir Coach
                    </button>
                </div>
            </div>
            <div class="cta-images">
                <div class="image-box front">
                    <img src="assets/images/Growth.jpeg" alt="Growth" />
                </div>
                <div class="image-box back">
                    <img src="assets/images/Community.jpeg" alt="Community" />
                </div>
                <div class="image-box extra1">
                    <img src="assets/images/Success.jpeg" alt="Success" />
                </div>
                <div class="image-box extra2">
                    <img src="assets/images/Support.jpeg" alt="Support" />
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

            .cta-container {
                font-family: 'Poppins', sans-serif;
                background-color: #ffffff;
                padding: 60px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                max-width: 1200px;
                margin: 0 auto;
                position: relative;
                overflow: hidden;
            }

            .cta-content {
                flex: 1;
                padding-right: 40px;
                z-index: 2;
            }

            h2 {
                font-size: 2.5em;
                color: #0a4955;
                margin-bottom: 20px;
                font-weight: 600;
                white-space: nowrap;
            }

            p {
                font-size: 1.1em;
                color: #666;
                margin-bottom: 30px;
                line-height: 1.6;
                font-weight: 400;
                max-width: 500px;
            }

            .cta-buttons {
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
                justify-content: center;
            }

            .cta-btn {
                padding: 12px 25px;
                border: none;
                border-radius: 25px;
                font-size: 1em;
                font-weight: 500;
                cursor: pointer;
                transition:
                    transform 0.3s ease,
                    box-shadow 0.3s ease;
            }

            .cta-btn.primary {
                background: linear-gradient(135deg, #db1e37, #0a4955);
                color: #ffffff;
            }

            .cta-btn.secondary {
                background-color: #ffffff;
                color: #0a4955;
                border: 2px solid #0a4955;
            }

            .cta-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            }

            .cta-images {
                position: relative;
                flex: 1;
                min-width: 300px;
                height: 300px;
                perspective: 1000px;
            }

            .image-box {
                position: absolute;
                width: 200px;
                height: 200px;
                border: 4px solid transparent;
                border-image: linear-gradient(135deg, #db1e37, #0a4955) 1;
                border-radius: 10px;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                transition: transform 0.3s ease;
                overflow: hidden;
            }

            .image-box img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }

            .front {
                top: 20px;
                left: 150px;
                transform: rotate(-5deg) translateZ(20px);
                z-index: 4;
            }

            .back {
                top: 0;
                left: 200px;
                transform: rotate(5deg) translateZ(10px);
                z-index: 3;
            }

            .extra1 {
                top: 40px;
                left: 120px;
                transform: rotate(-10deg) translateZ(15px);
                z-index: 2;
            }

            .extra2 {
                top: 60px;
                left: 230px;
                transform: rotate(10deg) translateZ(5px);
                z-index: 1;
            }

            .cta-images:hover .front {
                transform: rotate(-5deg) translateZ(30px);
            }

            .cta-images:hover .back {
                transform: rotate(5deg) translateZ(20px);
            }

            .cta-images:hover .extra1 {
                transform: rotate(-10deg) translateZ(25px);
            }

            .cta-images:hover .extra2 {
                transform: rotate(10deg) translateZ(15px);
            }

            /* Large screens (above 1024px) */
            @media (max-width: 1024px) {
                .cta-container {
                    padding: 40px 15px;
                }

                .cta-content {
                    padding-right: 20px;
                }

                h2 {
                    font-size: 2em;
                    white-space: nowrap;
                }

                p {
                    font-size: 1em;
                    max-width: 400px;
                }

                .cta-images {
                    height: 250px;
                    min-width: 250px;
                }

                .image-box {
                    width: 160px;
                    height: 160px;
                }

                .front {
                    top: 15px;
                    left: 120px;
                }

                .back {
                    top: 0;
                    left: 160px;
                }

                .extra1 {
                    top: 30px;
                    left: 90px;
                }

                .extra2 {
                    top: 45px;
                    left: 180px;
                }
            }

            /* Tablet screens (between 768px and 1024px) */
            @media (max-width: 768px) {
                .cta-container {
                    flex-direction: column;
                    text-align: center;
                    padding: 30px 15px;
                }

                .cta-content {
                    padding-right: 0;
                    margin-bottom: 20px;
                }

                h2 {
                    font-size: 1.8em;
                    white-space: nowrap;
                }

                p {
                    font-size: 0.95em;
                    max-width: 100%;
                }

                .cta-buttons {
                    flex-direction: column;
                    gap: 10px;
                }

                .cta-btn {
                    width: 100%;
                    max-width: 200px;
                    padding: 10px 20px;
                }

                .cta-images {
                    height: auto;
                    min-width: 100%;
                    perspective: none;
                }

                .image-box {
                    position: static;
                    display: block;
                    margin: 10px auto;
                    transform: none;
                    width: 140px;
                    height: 140px;
                }

                .cta-images:hover .front,
                .cta-images:hover .back,
                .cta-images:hover .extra1,
                .cta-images:hover .extra2 {
                    transform: none;
                }
            }

            /* Mobile screens (below 480px) */
            @media (max-width: 480px) {
                .cta-container {
                    padding: 20px 10px;
                }

                h2 {
                    font-size: 1.5em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                p {
                    font-size: 0.9em;
                }

                .cta-btn {
                    font-size: 0.9em;
                    padding: 8px 15px;
                }

                .image-box {
                    width: 120px;
                    height: 120px;
                }
            }

            /* Extra small screens (below 360px) */
            @media (max-width: 360px) {
                h2 {
                    font-size: 1.2em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .cta-btn {
                    font-size: 0.85em;
                    padding: 8px 12px;
                }

                .image-box {
                    width: 100px;
                    height: 100px;
                }
            }
        `,
    ],
})
export class CallToActionComponent {
    constructor(private router: Router) {}

    navigateToSignin() {
        this.router.navigate(['/signin']);
    }

    navigateToCoach() {
        this.router.navigate(['/coach-request']);
    }
}
