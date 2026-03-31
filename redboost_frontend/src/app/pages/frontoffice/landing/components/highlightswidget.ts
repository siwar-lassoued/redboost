import {
    Component,
    AfterViewInit,
    ViewChild,
    ElementRef,
    ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import VanillaTilt from 'vanilla-tilt';

@Component({
    selector: 'highlights-widget',
    standalone: true,
    imports: [CommonModule],
    template: `
        <section
            #highlightSection
            class="highlights-section relative min-h-[80vh] overflow-hidden py-16"
        >
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

            <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex flex-col items-center text-center">
                    <!-- Title with Parallax Effect -->
                    <div
                        class="title-container mb-12"
                        data-tilt
                        data-tilt-max="10"
                        data-tilt-speed="400"
                        data-tilt-glare
                    >
                        <h1
                            class="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-[#0A4955] tracking-tight"
                        >
                            Une Plateforme
                            <span class="gradient-text">Tout-en-Un</span>
                        </h1>
                        <h2
                            class="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold text-[#0A4955] mt-2"
                        >
                            pour <span class="gradient-text">Votre Succès</span>
                        </h2>
                        <div
                            class="w-20 h-1 bg-gradient-to-r from-[#DB1E37] to-[#0A4955] rounded-full mt-6 mx-auto"
                        ></div>
                    </div>

                    <!-- Video Card with Interactive Hover -->
                    <div
                        #videoCard
                        class="video-card relative w-full max-w-4xl h-[300px] sm:h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500"
                        data-tilt
                        data-tilt-max="15"
                        data-tilt-speed="300"
                    >
                        <div
                            class="absolute inset-0 bg-cover bg-center"
                            style="background-image: url('https://img.youtube.com/vi/5mVeIbGoluU/maxresdefault.jpg');"
                        >
                            <div
                                class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity duration-300 hover:bg-opacity-20"
                            >
                                <button
                                    class="play-button group"
                                    (click)="playVideo()"
                                >
                                    <svg
                                        class="w-16 h-16 sm:w-20 sm:h-20 text-white group-hover:scale-110 transition-transform duration-300"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div *ngIf="isVideoPlaying" class="absolute inset-0">
                            <iframe
                                width="100%"
                                height="100%"
                                src="https://www.youtube.com/embed/5mVeIbGoluU?autoplay=1"
                                title="YouTube video player"
                                frameborder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `,
    styles: [
        `
            .highlights-section {
                position: relative;
                font-family: 'Inter', sans-serif;
                background: #ffffff;
                z-index: 1;
            }

            .gradient-text {
                background: linear-gradient(90deg, #db1e37 0%, #0a4955 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                display: inline-block;
                font-weight: 900;
            }

            .video-card {
                transition:
                    transform 0.5s ease,
                    box-shadow 0.5s ease;
                position: relative;
                cursor: pointer;
                z-index: 2;
            }

            .play-button {
                outline: none;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                padding: 1rem;
                transition: background 0.3s ease;
            }

            .play-button:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            /* Decorative Background with Stars */
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

            /* Slide Up Animation */
            .animate-slide-up {
                opacity: 0;
                transform: translateY(20px);
                animation: slideUp 0.8s ease-out forwards;
            }

            .animate-scale-in {
                opacity: 0;
                transform: scale(0);
                animation: scaleIn 0.8s ease-out forwards 0.4s;
            }

            @keyframes slideUp {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes scaleIn {
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            /* Responsive Design */
            @media (max-width: 1024px) {
                .title-container h1 {
                    font-size: 2.5rem;
                }
                .title-container h2 {
                    font-size: 2rem;
                }
                .star {
                    width: 8px;
                    height: 8px;
                }
            }

            @media (max-width: 640px) {
                .title-container h1 {
                    font-size: 1.8rem;
                }
                .title-container h2 {
                    font-size: 1.5rem;
                }
                .video-card {
                    height: 250px;
                }
                .star {
                    width: 6px;
                    height: 6px;
                }
            }
        `,
    ],
})
export class HighlightsWidget implements AfterViewInit {
    @ViewChild('highlightSection') highlightSection!: ElementRef;
    @ViewChild('videoCard') videoCard!: ElementRef;
    isVideoPlaying: boolean = false;

    constructor(private cdRef: ChangeDetectorRef) {}

    ngAfterViewInit() {
        // Initialize VanillaTilt for 3D tilt effect
        if (this.highlightSection?.nativeElement) {
            VanillaTilt.init(
                this.highlightSection.nativeElement.querySelectorAll(
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

        // Intersection Observer for animations
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-slide-up');
                        this.cdRef.detectChanges();
                    }
                });
            },
            { threshold: 0.3 },
        );

        if (this.highlightSection?.nativeElement) {
            observer.observe(this.highlightSection.nativeElement);
        }
    }

    playVideo() {
        this.isVideoPlaying = true;
        this.cdRef.detectChanges();
    }
}
