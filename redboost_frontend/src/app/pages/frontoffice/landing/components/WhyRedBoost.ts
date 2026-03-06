import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import VanillaTilt from 'vanilla-tilt';

@Component({
    selector: 'app-why-redboost',
    standalone: true,
    imports: [CommonModule],
    template: `
        <section #whySection class="why-section">
            <!-- Decorative Background with Stars -->
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

            <div class="why-container">
                <div class="why-header text-center mb-12">
                    <span class="section-subtitle">Redboost</span>
                    <!-- Title with the exact gradient styling from your example -->
                    <div
                        class="title-container"
                        data-tilt
                        data-tilt-max="10"
                        data-tilt-speed="400"
                        data-tilt-glare
                    >
                        <h2 class="section-title">
                            Pourquoi
                            <span class="gradient-text">RedBoost</span> ?
                        </h2>
                        <div class="title-underline"></div>
                    </div>
                    <p class="section-description">
                        Découvrez pourquoi RedBoost est le choix idéal pour
                        votre parcours entrepreneurial
                    </p>
                </div>
                <div class="cards-wrapper">
                    <div
                        class="card"
                        data-tilt
                        data-tilt-max="10"
                        data-tilt-speed="400"
                        data-tilt-glare
                    >
                        <div class="card-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h3>Approuvé par les Experts</h3>
                        <p>
                            Validé par des coachs professionnels pour une
                            croissance fiable.
                        </p>
                    </div>
                    <div
                        class="card"
                        data-tilt
                        data-tilt-max="10"
                        data-tilt-speed="400"
                        data-tilt-glare
                    >
                        <div class="card-icon">
                            <i class="fas fa-network-wired"></i>
                        </div>
                        <h3>Connexion 100% Digitale</h3>
                        <p>
                            Reliez-vous à des coachs et entrepreneurs en toute
                            simplicité.
                        </p>
                    </div>
                    <div
                        class="card"
                        data-tilt
                        data-tilt-max="10"
                        data-tilt-speed="400"
                        data-tilt-glare
                    >
                        <div class="card-icon">
                            <i class="fas fa-comments"></i>
                        </div>
                        <h3>Coaching Instantané</h3>
                        <p>
                            Accédez à des sessions en temps réel adaptées à vos
                            besoins.
                        </p>
                    </div>
                    <div
                        class="card"
                        data-tilt
                        data-tilt-max="10"
                        data-tilt-speed="400"
                        data-tilt-glare
                    >
                        <div class="card-icon">
                            <i class="fas fa-user-shield"></i>
                        </div>
                        <h3>Support Personnalisé</h3>
                        <p>
                            Une équipe dédiée pour guider votre parcours
                            entrepreneurial.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    `,
    styles: [
        `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
            @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

            .why-section {
                padding: 120px 0;
                background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                position: relative;
                overflow: hidden;
                font-family: 'Poppins', sans-serif;
                z-index: 1;
            }

            .why-container {
                max-width: 1200px;
                width: 90%;
                margin: 0 auto;
                position: relative;
                z-index: 2;
            }

            .why-header {
                text-align: center;
                margin-bottom: 60px;
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
                border-radius: 30px;
                font-size: 1rem;
                font-weight: 500;
                margin-bottom: 1.5rem;
                letter-spacing: 0.5px;
            }

            .title-container {
                margin-bottom: 2rem;
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

            .cards-wrapper {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 30px;
                justify-content: center;
                align-items: stretch; /* Ensure all cards stretch to the same height */
                padding: 0 16px;
                max-width: 1200px;
                margin: 0 auto;
            }

            .card {
                background: #ffffff;
                border-radius: 20px;
                box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
                padding: 30px 25px;
                text-align: center;
                transition: all 0.4s ease;
                min-height: 280px;
                height: 100%; /* Ensure cards take full height of grid cell */
                display: flex;
                flex-direction: column;
                justify-content: space-between; /* Distribute content evenly */
                align-items: center;
                position: relative;
                overflow: hidden;
                border: 2px solid transparent;
                background-clip: padding-box;
                box-sizing: border-box; /* Include padding and borders in dimensions */
            }

            .card::before {
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

            .card:hover {
                transform: translateY(-8px);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            }

            .card-icon {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
                background: linear-gradient(
                    135deg,
                    rgba(219, 30, 55, 0.1) 0%,
                    rgba(10, 73, 85, 0.1) 100%
                );
                position: relative;
            }

            .card-icon::after {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: linear-gradient(135deg, #db1e37 0%, #0a4955 100%);
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: -1;
            }

            .card:hover .card-icon::after {
                opacity: 1;
            }

            .card i {
                font-size: 2rem;
                color: #0a4955;
                transition: all 0.3s ease;
            }

            .card:hover i {
                color: white;
                transform: scale(1.1);
            }

            .card h3 {
                font-size: 1.25rem;
                color: #0a4955;
                margin-bottom: 15px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .card p {
                font-size: 0.95rem;
                color: #666;
                line-height: 1.6;
                font-weight: 400;
                max-width: 90%;
            }

            .decorative-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 0;
                background: transparent;
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

            @media (max-width: 1200px) {
                .cards-wrapper {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 25px;
                }
            }

            @media (max-width: 768px) {
                .why-section {
                    padding: 80px 0;
                }

                .cards-wrapper {
                    grid-template-columns: 1fr;
                    gap: 20px;
                    max-width: 500px;
                }

                .card {
                    min-height: 240px;
                    padding: 25px 20px;
                }

                .card-icon {
                    width: 60px;
                    height: 60px;
                    margin-bottom: 15px;
                }

                .card i {
                    font-size: 1.75rem;
                }

                .card h3 {
                    font-size: 1.15rem;
                }

                .card p {
                    font-size: 0.9rem;
                }

                .star {
                    width: 8px;
                    height: 8px;
                }
            }

            @media (max-width: 480px) {
                .card {
                    min-height: 220px;
                    padding: 20px 15px;
                    border-radius: 16px;
                }

                .card::before {
                    border-radius: 16px;
                }

                .card-icon {
                    width: 55px;
                    height: 55px;
                    margin-bottom: 12px;
                }

                .card i {
                    font-size: 1.5rem;
                }

                .card h3 {
                    font-size: 1.1rem;
                    margin-bottom: 12px;
                }

                .card p {
                    font-size: 0.85rem;
                }

                .star {
                    width: 6px;
                    height: 6px;
                }
            }
        `,
    ],
})
export class WhyRedBoostComponent implements AfterViewInit {
    @ViewChild('whySection') whySection!: ElementRef;

    ngAfterViewInit() {
        if (this.whySection?.nativeElement) {
            VanillaTilt.init(
                this.whySection.nativeElement.querySelectorAll('[data-tilt]'),
                {
                    max: 10,
                    speed: 400,
                    glare: true,
                    'max-glare': 0.3,
                },
            );
        }
    }
}
