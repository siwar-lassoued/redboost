import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
    selector: 'app-hero-widget',
    standalone: true,
    imports: [CommonModule],
    template: `
        <section class="hero-section">
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

            <!-- Content Container -->
            <div class="container">
                <h1 class="title">BOOST YOUR BUSINESS</h1>

                <p class="subtitle">
                    RedBoost est une plateforme qui aide les entrepreneurs à
                    croître plus rapidement en les connectant au bon soutien,
                    financement et opportunités.
                </p>

                <!-- Icons -->
                <div class="icon-row">
                    <div class="icon-circle" *ngFor="let icon of icons">
                        <img [src]="icon" alt="icône" />
                    </div>
                </div>

                <!-- Divider line -->
                <div class="divider-line"></div>

                <!-- CTA Buttons -->
                <div class="cta-buttons">
                    <button class="btn gradient">Réserver une démo</button>
                    <button class="btn gradient">
                        Créer votre espace de travail gratuit
                    </button>
                </div>

                <!-- Bottom info -->
                <p class="bottom-info">
                    Aucune carte de crédit requise | Essai gratuit illimité de
                    14 jours | 10 utilisateurs gratuits pour toujours
                </p>
            </div>
        </section>
    `,
    styles: [
        `
            .hero-section {
                position: relative;
                width: 100%;
                padding: 100px 20px;
                background: #fff;
                display: flex;
                justify-content: center;
                overflow: hidden;
            }

            .container {
                width: 100%;
                max-width: 1100px;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
                z-index: 2;
            }

            /* Title */
            .title {
                font-family: var(--font-family);
                font-size: 4.2rem;
                font-weight: 800;
                background: linear-gradient(90deg, #db1e37, #0a4955);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 24px;
            }

            .subtitle {
                font-size: 1.4rem;
                color: #555;
                max-width: 740px;
                margin-bottom: 70px;
                line-height: 1.7;
            }

            /* Icon Row */
            .icon-row {
                display: flex;
                gap: 30px;
                justify-content: center;
                margin-bottom: 40px;
                flex-wrap: wrap;
            }

            .icon-circle {
                width: 85px;
                height: 85px;
                background: radial-gradient(
                    circle at 30% 30%,
                    #db1e37,
                    #0a4955
                );
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
            }

            .icon-circle img {
                width: 40px;
                height: 40px;
                filter: brightness(0) invert(1);
            }

            /* Divider Line */
            .divider-line {
                width: 100%;
                max-width: 600px;
                height: 3px;
                background: linear-gradient(to right, #db1e37, #0a4955);
                margin-bottom: 45px;
            }

            /* CTA Buttons */
            .cta-buttons {
                display: flex;
                gap: 30px;
                flex-wrap: wrap;
                margin-bottom: 35px;
                justify-content: center;
            }

            .btn {
                padding: 18px 40px;
                font-size: 1.1rem;
                font-weight: 600;
                border-radius: 10px;
                border: none;
                color: #fff;
                font-family: var(--font-family);
                min-width: 250px;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .gradient {
                background: linear-gradient(to right, #db1e37, #0a4955);
            }

            .btn:hover {
                opacity: 0.92;
                transform: translateY(-2px);
                box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
            }

            .bottom-info {
                font-size: 1rem;
                color: #333;
                line-height: 1.5;
            }

            /* Decorative Background with Birds and Stars */
            .decorative-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
                background: #ffffff; /* Dark blue background to match the image */
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

            /* Responsive */
            @media (max-width: 768px) {
                .title {
                    font-size: 2.8rem;
                }

                .subtitle {
                    font-size: 1.1rem;
                    padding: 0 10px;
                }

                .icon-circle {
                    width: 70px;
                    height: 70px;
                }

                .icon-circle img {
                    width: 32px;
                    height: 32px;
                }

                .btn {
                    min-width: 100%;
                }

                .cta-buttons {
                    flex-direction: column;
                    gap: 15px;
                }

                .bird {
                    width: 70px;
                    height: 70px;
                }

                .star {
                    width: 8px;
                    height: 8px;
                }
            }
        `,
    ],
})
export class HeroWidget {
    icons = [
        'assets/icons/5.svg',
        'assets/icons/4.svg',
        'assets/icons/3.svg',
        'assets/icons/2.svg',
        'assets/icons/1.svg',
    ];
}
