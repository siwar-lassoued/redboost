import { environment } from '../../../../../environment';
import { Component, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { trigger, transition, style, animate } from '@angular/animations';
import { TopbarWidget } from './topbarwidget.component';
import { FooterWidget } from './footerwidget';
import { ScrollToTopComponent } from './ScrollToTopComponent';

@Component({
    selector: 'app-contact-landing',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        HttpClientModule,
        ButtonModule,
        RippleModule,
        TopbarWidget,
        FooterWidget,
        ScrollToTopComponent,
    ],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(30px)' }),
                animate(
                    '800ms ease-out',
                    style({ opacity: 1, transform: 'translateY(0)' }),
                ),
            ]),
        ]),
        trigger('cardFade', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(40px)' }),
                animate(
                    '900ms ease-out',
                    style({ opacity: 1, transform: 'translateY(0)' }),
                ),
            ]),
        ]),
    ],
    template: `
        <div class="min-h-screen flex flex-col relative">
            <!-- Topbar -->
            <topbar-widget
                class="sticky top-0 w-full bg-white shadow-md z-50"
            />

            <!-- Main Content -->
            <main class="flex-grow">
                <section class="hero-section">
                    <div class="decorative-bg">
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
                        <div class="gradient-overlay"></div>
                    </div>

                    <div class="container">
                        <div class="content-wrapper" [@cardFade]>
                            <div class="form-section">
                                <h2 class="section-title">
                                    Envoyer un Message
                                </h2>
                                <form
                                    (ngSubmit)="onSubmit()"
                                    class="contact-form"
                                >
                                    <div class="input-group">
                                        <input
                                            id="name"
                                            type="text"
                                            placeholder="Votre nom"
                                            [(ngModel)]="formData.name"
                                            name="name"
                                            required
                                            class="contact-input"
                                        />
                                    </div>
                                    <div class="input-group">
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="Votre email"
                                            [(ngModel)]="formData.email"
                                            name="email"
                                            required
                                            class="contact-input"
                                        />
                                    </div>
                                    <div class="input-group">
                                        <input
                                            id="subject"
                                            type="text"
                                            placeholder="Sujet"
                                            [(ngModel)]="formData.subject"
                                            name="subject"
                                            required
                                            class="contact-input"
                                        />
                                    </div>
                                    <div class="input-group">
                                        <textarea
                                            id="message"
                                            placeholder="Votre message"
                                            [(ngModel)]="formData.message"
                                            name="message"
                                            required
                                            class="contact-input"
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        [disabled]="
                                            isSubmitting ||
                                            !formData.name ||
                                            !formData.email ||
                                            !formData.subject ||
                                            !formData.message
                                        "
                                        class="submit-button"
                                        pRipple
                                    >
                                        Envoyer
                                    </button>
                                </form>
                            </div>
                            <div class="contact-info" [@fadeIn]>
                                <h2 class="section-title contact-info-title">
                                    Informations de Contact
                                </h2>
                                <div class="contact-card">
                                    <p>
                                        <strong>Adresse :</strong> 3 RUE EL
                                        KAWEKIBI 1002 TUNIS
                                    </p>
                                    <p>
                                        <strong>Téléphone :</strong>
                                        <a href="tel:00 216 71 793 125"
                                            >00 216 71 793 125</a
                                        >
                                    </p>
                                    <p>
                                        <strong>Email :</strong>
                                        <a href="mailto:bonjour&#64;redstart.tn"
                                            >hello&#64;redstart.tn</a
                                        >
                                    </p>
                                    <p>
                                        <strong>Site Web :</strong>
                                        <a
                                            href="https://redstart.tn"
                                            target="_blank"
                                            >redstart.tn</a
                                        >
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <!-- Footer -->
            <footer-widget class="mt-auto bg-teal-900 text-white py-4" />
            <app-scroll-to-top />
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
                --bg-light: #f5f7fa;
                --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
                --border-radius: 16px;
                --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: var(--font-family);
            }

            .min-h-screen {
                min-height: 100vh;
                background: var(--bg-light);
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

            .mt-auto {
                margin-top: auto;
            }

            .hero-section {
                position: relative;
                width: 100%;
                min-height: calc(100vh - 80px);
                padding: 80px 20px;
                background: var(--bg-light);
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
            }

            .decorative-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
                background: var(--bg-light);
            }

            .gradient-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    135deg,
                    rgba(10, 73, 85, 0.15),
                    rgba(219, 30, 55, 0.08)
                );
                z-index: 2;
            }

            .star {
                position: absolute;
                width: 14px;
                height: 14px;
                background: radial-gradient(
                    circle,
                    rgba(219, 30, 55, 0.95),
                    rgba(255, 255, 255, 0)
                );
                border-radius: 50%;
                animation: fallStar 4.5s linear infinite;
                will-change: transform, opacity;
            }

            @keyframes fallStar {
                0% {
                    transform: translateY(-120vh) translateX(-15px);
                    opacity: 1;
                }
                100% {
                    transform: translateY(120vh) translateX(25px);
                    opacity: 0;
                }
            }

            .container {
                display: flex;
                justify-content: center;
                max-width: 1200px;
                width: 100%;
                z-index: 3;
            }

            .content-wrapper {
                display: flex;
                gap: 2rem;
                width: 100%;
                max-width: 1100px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(12px);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-md);
                padding: 2.5rem;
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
                transition: var(--transition);
            }

            .content-wrapper:hover {
                transform: translateY(-6px);
                box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
            }

            .form-section,
            .contact-info {
                flex: 1;
                min-width: 0;
            }

            .section-title {
                font-family: var(--font-family);
                font-size: 2.5rem;
                font-weight: 700;
                color: var(--secondary-color);
                margin-bottom: 1.5rem;
                text-align: center;
                position: relative;
            }

            .section-title::after {
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

            .contact-info-title {
                color: white;
            }

            .contact-form {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .input-group {
                display: flex;
                flex-direction: column;
            }

            .contact-input {
                width: 100%;
                padding: 12px 16px;
                font-size: 1rem;
                font-family: var(--font-family);
                color: var(--text-color);
                background: #fafafa;
                border: 2px solid transparent;
                border-radius: 8px;
                background-image:
                    linear-gradient(#fafafa, #fafafa),
                    linear-gradient(
                        to right,
                        var(--gradient-start),
                        var(--gradient-end)
                    );
                background-origin: border-box;
                background-clip: padding-box, border-box;
                transition: var(--transition);
            }

            .contact-input:focus {
                outline: none;
                box-shadow: 0 0 8px rgba(200, 34, 58, 0.3);
            }

            .contact-input:invalid:focus {
                border-color: #ff4d4d;
            }

            .contact-input[type='text'],
            .contact-input[type='email'] {
                height: 48px;
            }

            .contact-input[type='textarea'],
            .contact-input[textarea] {
                height: 150px;
                resize: vertical;
            }

            .submit-button {
                align-self: center;
                background: linear-gradient(
                    135deg,
                    var(--gradient-start),
                    var(--gradient-end)
                );
                border: none;
                border-radius: 50px;
                padding: 0.75rem 2.5rem;
                font-family: 'Poppins', sans-serif;
                font-size: 1.2rem;
                font-weight: 600;
                color: #ffffff;
                transition: var(--transition);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                width: fit-content;
                margin-top: 1.5rem;
                cursor: pointer;
            }

            .submit-button:hover {
                transform: translateY(-4px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
                opacity: 0.95;
            }

            .submit-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .contact-info {
                padding: 1.5rem;
                background: rgba(10, 73, 85, 0.9);
                backdrop-filter: blur(10px);
                border-radius: var(--border-radius);
                color: white;
                position: relative;
                overflow: hidden;
                margin-top: 1rem;
            }

            .contact-info::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(
                    circle,
                    rgba(219, 30, 55, 0.2),
                    transparent 70%
                );
                animation: glow 12s infinite;
                z-index: 0;
            }

            .contact-info > * {
                position: relative;
                z-index: 1;
            }

            .contact-card {
                background: rgba(255, 255, 255, 0.15);
                padding: 1.75rem;
                border-radius: 12px;
                box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
                margin-top: 1rem;
            }

            .contact-card p {
                margin: 0.85rem 0;
                font-size: 1.1rem;
                line-height: 1.7;
                opacity: 0.95;
                transition: opacity 0.3s ease;
                color: white;
            }

            .contact-card p:hover {
                opacity: 1;
            }

            .contact-card a {
                color: #e0f7fa;
                text-decoration: none;
                transition: color 0.3s ease;
            }

            .contact-card a:hover {
                color: #ea7988;
            }

            @keyframes growUnderline {
                0% {
                    width: 0;
                }
                100% {
                    width: 80px;
                }
            }

            @keyframes glow {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }

            @media (max-width: 1024px) {
                .content-wrapper {
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .contact-info {
                    order: -1;
                    margin-bottom: 2rem;
                }
            }

            @media (max-width: 768px) {
                .hero-section {
                    padding: 40px 20px;
                }

                .content-wrapper {
                    padding: 1.5rem;
                }

                .section-title {
                    font-size: 2rem;
                }

                .contact-input {
                    font-size: 0.95rem;
                }

                .contact-input[type='text'],
                .contact-input[type='email'] {
                    height: 44px;
                }

                .contact-input[type='textarea'],
                .contact-input[textarea] {
                    height: 140px;
                }

                .submit-button {
                    font-size: 1rem;
                    padding: 0.6rem 2rem;
                }

                .contact-card p {
                    font-size: 1rem;
                }

                .star {
                    width: 10px;
                    height: 10px;
                }
            }

            @media (max-width: 480px) {
                .section-title {
                    font-size: 1.8rem;
                }

                .contact-input {
                    font-size: 0.9rem;
                }

                .submit-button {
                    padding: 0.5rem 1.5rem;
                }

                .contact-card p {
                    font-size: 0.9rem;
                }
            }
        `,
    ],
})
export class ContactLandingComponent implements DoCheck {
    formData = {
        name: '',
        email: '',
        subject: '',
        message: '',
    };

    formProgress = 0;
    isSubmitting = false;
    successMessage = '';
    errorMessage = '';

    constructor(
        private router: Router,
        private http: HttpClient,
    ) {}

    onSubmit() {
        this.isSubmitting = true;

        this.http
            .post(`${environment.apiUrl}/contact`, this.formData)
            .subscribe({
                next: (response: any) => {
                    this.formData = {
                        name: '',
                        email: '',
                        subject: '',
                        message: '',
                    };
                    this.formProgress = 0;
                    this.isSubmitting = false;
                },
                error: (error) => {
                    this.isSubmitting = false;
                },
            });
    }

    ngDoCheck() {
        this.formProgress = [
            this.formData.name,
            this.formData.email,
            this.formData.subject,
            this.formData.message,
        ].filter(Boolean).length;
    }
}
