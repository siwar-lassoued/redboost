import { environment } from '../../../../../environment';
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TopbarWidget } from './topbarwidget.component';
import { FooterWidget } from './footerwidget';
import { ScrollToTopComponent } from './ScrollToTopComponent';

@Component({
    selector: 'app-market-landing',
    standalone: true,
    imports: [CommonModule, TopbarWidget, FooterWidget, ScrollToTopComponent],
    template: `
        <div class="min-h-screen flex flex-col relative">
            <div class="decorative-bg">
                <div
                    class="star"
                    style="top: 10%; left: 5%; animation-duration: 5s; animation-delay: 0s;"
                ></div>
                <div
                    class="star"
                    style="top: 20%; right: 10%; animation-duration: 4s; animation-delay: 2s;"
                ></div>
                <div
                    class="star"
                    style="top: 50%; left: 15%; animation-duration: 6s; animation-delay: 1s;"
                ></div>
                <div
                    class="star"
                    style="bottom: 15%; right: 20%; animation-duration: 5s; animation-delay: 3s;"
                ></div>
                <div
                    class="star"
                    style="bottom: 5%; left: 25%; animation-duration: 4s; animation-delay: 4s;"
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
            <topbar-widget
                class="sticky top-0 w-full bg-white shadow-md z-10"
            />

            <main class="flex-grow">
                <section
                    #marketSection
                    id="marketlanding"
                    class="px-4 md:px-6 lg:px-8 xl:px-4"
                >
                    <div class="header-section">
                        <div class="header-content">
                            <h1 class="main-title">
                                Explorez Nos Projets Innovants
                            </h1>
                            <h2 class="creative-title">
                                Des solutions pour demain
                            </h2>
                            <p class="subtitle">
                                Découvrez une gamme de projets ouverts à tous,
                                conçus pour inspirer et transformer.
                            </p>
                        </div>
                    </div>

                    <div
                        class="filter-controls"
                        *ngIf="displayedProjects.length !== projects.length"
                    >
                        <button
                            class="reset-filter-btn"
                            (click)="resetFilters()"
                        >
                            Reset Filters
                        </button>
                    </div>

                    <div
                        class="projects-grid"
                        [ngClass]="{ updating: isFiltering }"
                    >
                        <div
                            *ngFor="
                                let project of displayedProjects;
                                let i = index
                            "
                            class="project-card"
                            [ngClass]="'card-animation-' + i"
                            (click)="navigateToProject(project.websiteUrl)"
                            role="button"
                            [attr.aria-label]="
                                'View details for ' +
                                project.name +
                                ', status: ' +
                                project.status
                            "
                            tabindex="0"
                            (keydown)="
                                onCardKeydown($event, project.websiteUrl)
                            "
                        >
                            <div class="card-overlay"></div>
                            <div class="card-content-wrapper">
                                <div class="card-image-container">
                                    <img
                                        [src]="project.logoUrl"
                                        [alt]="project.name + ' logo'"
                                        (error)="handleImageError($event)"
                                        class="project-image"
                                        loading="lazy"
                                        sizes="(max-width: 768px) 100vw, 360px"
                                    />
                                    <span
                                        class="status-badge"
                                        [ngClass]="
                                            getStatusClass(project.status)
                                        "
                                        >{{ project.status }}</span
                                    >
                                </div>
                                <h3 class="project-title">
                                    {{ project.name }}
                                </h3>
                                <p class="project-description">
                                    {{ project.description }}
                                </p>
                                <div class="project-details">
                                    <div class="detail-item">
                                        <i class="pi pi-briefcase"></i>
                                        <span class="detail-label"
                                            >Secteur:</span
                                        >
                                        <span
                                            class="clickable-tag"
                                            (click)="
                                                filterBySector(project.sector)
                                            "
                                            >{{ project.sector }}</span
                                        >
                                    </div>
                                    <div class="detail-item">
                                        <i class="pi pi-tag"></i>
                                        <span class="detail-label">Type:</span>
                                        <span
                                            class="clickable-tag"
                                            (click)="filterByType(project.type)"
                                            >{{ project.type }}</span
                                        >
                                    </div>
                                    <div class="detail-item">
                                        <i class="pi pi-calendar"></i>
                                        <span class="detail-label">Date:</span>
                                        {{
                                            project.creationDate
                                                | date: 'shortDate'
                                        }}
                                    </div>
                                    <div class="detail-item">
                                        <i class="pi pi-star"></i>
                                        <span class="score">{{
                                            project.globalScore
                                        }}</span>
                                    </div>
                                </div>
                                <div class="card-footer">
                                    <div
                                        class="progress-bar"
                                        [attr.title]="
                                            getProgressTooltip(project.status)
                                        "
                                    >
                                        <div
                                            class="progress-fill"
                                            [ngClass]="
                                                getProgressClass(project.status)
                                            "
                                            [style.width]="
                                                getProgressWidth(project.status)
                                            "
                                        ></div>
                                    </div>
                                    <button
                                        class="favorite-btn"
                                        [ngClass]="{
                                            favorited: isFavorited(project),
                                        }"
                                        (click)="
                                            toggleFavorite(project);
                                            $event.stopPropagation()
                                        "
                                        [attr.aria-label]="
                                            isFavorited(project)
                                                ? 'Remove from favorites'
                                                : 'Add to favorites'
                                        "
                                    >
                                        <i class="pi pi-heart"></i>
                                    </button>
                                    <button
                                        class="learn-more-btn"
                                        (click)="
                                            navigateToProject(
                                                project.websiteUrl
                                            )
                                        "
                                    >
                                        En savoir plus
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        *ngIf="displayedProjects.length === 0 && !loading"
                        class="no-results"
                    >
                        <i class="pi pi-search text-4xl text-primary mb-4"></i>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">
                            Aucun projet trouvé
                        </h3>
                        <p class="text-gray-600">
                            Vérifiez votre connexion ou réessayez plus tard
                        </p>
                    </div>

                    <div *ngIf="loading" class="loading-indicator">
                        <i
                            class="pi pi-spin pi-spinner text-xl text-primary"
                        ></i>
                        <span class="text-gray-600"
                            >Chargement des projets...</span
                        >
                    </div>
                </section>
            </main>

            <footer-widget class="mt-auto bg-teal-900 text-white py-4 z-10" />
            <app-scroll-to-top class="z-10" />
        </div>
    `,
    styles: [
        `
            :host {
                --primary-color: #db1e37;
                --secondary-color: #1a3c34;
                --gradient-start: #db1e37;
                --gradient-end: #0a4955;
                --card-bg: #ffffff;
                --border-color: #e2e8f0;
            }

            .min-h-screen {
                min-height: 100vh;
                background: #ffffff;
                position: relative;
                overflow: visible;
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

            .z-10 {
                z-index: 10;
            }

            .shadow-md {
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .mt-8 {
                margin-top: 2rem;
            }

            .mt-auto {
                margin-top: auto;
            }

            .decorative-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
                background: transparent;
            }

            .star {
                position: absolute;
                width: 10px;
                height: 10px;
                background: radial-gradient(
                    circle,
                    rgba(219, 30, 55, 0.7),
                    rgba(255, 255, 255, 0)
                );
                border-radius: 50%;
                animation: fallStar 5s linear infinite;
                will-change: transform, opacity;
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
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .back-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
                opacity: 0.95;
            }

            .header-section {
                margin-bottom: 60px;
                padding: 40px 0;
                text-align: center;
                position: relative;
                z-index: 2;
            }

            .header-background {
                position: relative;
                min-height: 400px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border-radius: 20px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }

            .header-content {
                position: relative;
                color: #1a3c34;
                padding: 0;
                z-index: 2;
            }

            .main-title {
                font-family: 'Poppins', sans-serif;
                font-size: 4.5rem;
                font-weight: 800;
                margin: 0;
                line-height: 1.2;
                background: linear-gradient(
                    90deg,
                    var(--gradient-start),
                    var(--gradient-end)
                );
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: fadeInUp 0.8s ease-out;
                text-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            }

            .creative-title {
                font-family: 'Poppins', sans-serif;
                font-size: 2.5rem;
                font-weight: 600;
                color: var(--gradient-end);
                margin: 20px 0;
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
                position: relative;
                animation: fadeInUp 0.9s ease-out 0.2s;
                text-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            }

            .creative-title::after {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                width: 120px;
                height: 4px;
                background: linear-gradient(
                    to right,
                    var(--gradient-start),
                    var(--gradient-end)
                );
                border-radius: 2px;
                animation: growUnderline 1s ease-out 0.4s forwards;
            }

            .subtitle {
                font-family: 'Inter', sans-serif;
                font-size: 1.6rem;
                font-weight: 400;
                margin: 24px auto 0;
                max-width: 800px;
                line-height: 1.8;
                color: #444;
                animation: fadeInUp 0.9s ease-out 0.4s;
            }

            .filter-controls {
                text-align: center;
                margin-bottom: 20px;
            }

            .reset-filter-btn {
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
                transition: all 0.3s ease;
            }

            .reset-filter-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .projects-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 16px;
                padding: 0 12px;
                justify-items: center;
                margin-bottom: 60px;
                z-index: 2;
            }

            .projects-grid.updating {
                opacity: 0.7;
            }

            .project-card {
                background: var(--card-bg);
                border-radius: 16px;
                overflow: hidden;
                width: 100%;
                max-width: 360px;
                box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
                border: 2px solid var(--border-color);
                transition: all 0.4s ease;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                position: relative;
            }

            .project-card:hover {
                transform: translateY(-6px) scale(1.02);
                box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
                border: 2px solid transparent;
                background-image:
                    linear-gradient(var(--card-bg), var(--card-bg)),
                    linear-gradient(
                        to right,
                        var(--gradient-start),
                        var(--gradient-end)
                    );
                background-origin: border-box;
                background-clip: padding-box, border-box;
            }

            .project-card:focus {
                outline: 3px solid var(--primary-color);
                outline-offset: 2px;
                box-shadow: 0 0 0 4px rgba(219, 30, 55, 0.3);
            }

            .project-card.card-animation-0 {
                animation: cardFadeIn 0.8s ease-out 0.2s forwards;
            }
            .project-card.card-animation-1 {
                animation: cardFadeIn 0.8s ease-out 0.3s forwards;
            }
            .project-card.card-animation-2 {
                animation: cardFadeIn 0.8s ease-out 0.4s forwards;
            }
            .project-card.card-animation-3 {
                animation: cardFadeIn 0.8s ease-out 0.5s forwards;
            }
            .project-card.card-animation-4 {
                animation: cardFadeIn 0.8s ease-out 0.6s forwards;
            }
            .project-card.card-animation-5 {
                animation: cardFadeIn 0.8s ease-out 0.7s forwards;
            }
            .project-card.card-animation-6 {
                animation: cardFadeIn 0.8s ease-out 0.8s forwards;
            }
            .project-card.card-animation-7 {
                animation: cardFadeIn 0.8s ease-out 0.9s forwards;
            }
            .project-card.card-animation-8 {
                animation: cardFadeIn 0.8s ease-out 1s forwards;
            }
            .project-card.card-animation-9 {
                animation: cardFadeIn 0.8s ease-out 1.1s forwards;
            }
            .project-card.card-animation-10 {
                animation: cardFadeIn 0.8s ease-out 1.2s forwards;
            }
            .project-card.card-animation-11 {
                animation: cardFadeIn 0.8s ease-out 1.3s forwards;
            }

            .card-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    135deg,
                    rgba(219, 30, 55, 0.1),
                    rgba(10, 73, 85, 0.1)
                );
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 1;
            }

            .project-card:hover .card-overlay {
                opacity: 1;
            }

            .card-content-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px;
                text-align: center;
                flex-grow: 1;
                position: relative;
                z-index: 2;
            }

            .card-image-container {
                position: relative;
                width: 100%;
                margin-bottom: 16px;
            }

            .project-image {
                width: 100%;
                height: 180px;
                object-fit: cover;
                border-radius: 12px;
                transition:
                    transform 0.3s ease,
                    opacity 0.3s ease;
                background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
            }

            .project-card:hover .project-image {
                transform: scale(1.05);
                opacity: 0.95;
            }

            .status-badge {
                position: absolute;
                top: 8px;
                right: 8px;
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 0.85rem;
                font-weight: 600;
                font-family: 'Inter', sans-serif;
                z-index: 3;
            }

            .status-badge.active {
                background: #d4edda;
                color: #155724;
            }

            .status-badge.completed {
                background: #d1ecf1;
                color: #0c5460;
            }

            .status-badge.pending {
                background: #fff3cd;
                color: #856404;
            }

            .project-title {
                font-family: 'Poppins', sans-serif;
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--secondary-color);
                margin-bottom: 8px;
                line-height: 1.3;
            }

            .project-description {
                font-family: 'Inter', sans-serif;
                font-size: 1rem;
                color: #444;
                margin-bottom: 16px;
                line-height: 1.6;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .project-details {
                width: 100%;
                margin-bottom: 16px;
                font-size: 0.9rem;
                color: #444;
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 8px;
            }

            .detail-item {
                display: flex;
                align-items: center;
                gap: 4px;
                background: #f8f9fa;
                padding: 4px 8px;
                border-radius: 12px;
                margin-bottom: 8px;
            }

            .detail-item i {
                color: var(--primary-color);
                font-size: 1rem;
            }

            .detail-label {
                font-weight: 600;
                color: var(--secondary-color);
            }

            .clickable-tag {
                cursor: pointer;
                color: var(--primary-color);
                font-weight: 500;
                transition: color 0.3s ease;
            }

            .clickable-tag:hover {
                color: var(--secondary-color);
                text-decoration: underline;
            }

            .score {
                padding: 4px 8px;
                border-radius: 12px;
                background: linear-gradient(
                    to right,
                    var(--gradient-start),
                    var(--gradient-end)
                );
                color: #ffffff;
                font-size: 0.85rem;
                font-weight: 600;
                font-family: 'Inter', sans-serif;
            }

            .card-footer {
                width: 100%;
                margin-top: auto;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .progress-bar {
                width: 100%;
                height: 6px;
                background: var(--border-color);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 12px;
            }

            .progress-fill {
                height: 100%;
                transition: width 0.3s ease;
            }

            .progress-fill.active {
                background: linear-gradient(to right, #28a745, #20c997);
            }

            .progress-fill.completed {
                background: linear-gradient(to right, #17a2b8, #0a6b7d);
            }

            .progress-fill.pending {
                background: linear-gradient(to right, #ffc107, #e0a800);
            }

            .favorite-btn {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 1.2rem;
                color: #ccc;
                transition: color 0.3s ease;
                margin-bottom: 10px;
            }

            .favorite-btn.favorited {
                color: var(--primary-color);
            }

            .favorite-btn:hover {
                color: var(--secondary-color);
            }

            .learn-more-btn {
                padding: 10px 24px;
                font-size: 0.9rem;
                font-family: 'Poppins', sans-serif;
                font-weight: 600;
                border-radius: 30px;
                color: #ffffff;
                background: linear-gradient(
                    to right,
                    var(--gradient-start),
                    var(--gradient-end)
                );
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .learn-more-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                opacity: 0.92;
            }

            .no-results {
                padding: 40px 0;
                animation: fadeInUp 0.6s ease-out;
                text-align: center;
                font-family: 'Inter', sans-serif;
            }

            .no-results i {
                color: var(--primary-color);
            }

            .no-results h3 {
                font-family: 'Poppins', sans-serif;
                font-weight: 700;
            }

            .loading-indicator {
                padding: 40px 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                animation: fadeInUp 0.6s ease-out;
                font-family: 'Inter', sans-serif;
            }

            .loading-indicator i {
                color: var(--primary-color);
            }

            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                border: 0;
            }

            @keyframes fallStar {
                0% {
                    transform: translateY(-100vh) translateX(0);
                    opacity: 0.7;
                }
                100% {
                    transform: translateY(100vh) translateX(20px);
                    opacity: 0;
                }
            }

            @keyframes fadeInUp {
                0% {
                    opacity: 0;
                    transform: translateY(25px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes growUnderline {
                0% {
                    width: 0;
                }
                100% {
                    width: 120px;
                }
            }

            @keyframes cardFadeIn {
                0% {
                    opacity: 0;
                    transform: scale(0.95);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            @media (max-width: 1024px) {
                .projects-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }

            @media (max-width: 768px) {
                .header-section {
                    padding: 24px 0;
                }

                .header-background {
                    min-height: 320px;
                }

                .header-content {
                    padding: 0;
                }

                .main-title {
                    font-size: 3.2rem;
                }

                .creative-title {
                    font-size: 1.9rem;
                    max-width: 400px;
                }

                .subtitle {
                    font-size: 1.3rem;
                    max-width: 500px;
                }

                .projects-grid {
                    grid-template-columns: 1fr;
                }

                .project-card {
                    max-width: 100%;
                }

                .project-image {
                    height: 160px;
                }

                .star {
                    width: 8px;
                    height: 8px;
                }
            }

            @media (max-width: 480px) {
                .main-title {
                    font-size: 2.4rem;
                }

                .creative-title {
                    font-size: 1.5rem;
                }

                .subtitle {
                    font-size: 1.1rem;
                }

                .project-title {
                    font-size: 1.3rem;
                }

                .project-description {
                    font-size: 0.9rem;
                }

                .detail-item {
                    font-size: 0.85rem;
                }
            }
        `,
    ],
})
export class MarketLandingComponent implements AfterViewInit {
    @ViewChild('marketSection', { static: true }) marketSection!: ElementRef;

    projects: any[] = [];
    displayedProjects: any[] = [];
    loading: boolean = false;
    isFiltering: boolean = false;
    favoritedProjects: Set<string> = new Set();

    constructor(
        private http: HttpClient,
        private router: Router,
    ) {
        this.loadFavorites();
        this.fetchProjects();
    }

    ngAfterViewInit() {
        if (!this.marketSection?.nativeElement) {
            console.warn('Market section element not found');
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const contents =
                            entry.target.querySelectorAll('.section-content');
                        contents.forEach((content) =>
                            content.classList.add('visible'),
                        );
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 },
        );

        observer.observe(this.marketSection.nativeElement);
    }

    fetchProjects() {
        this.loading = true;
        const apiUrl = `${environment.apiUrl}/projets/GetAllPublic`;

        this.http.get<any[]>(apiUrl).subscribe({
            next: (response) => {
                this.projects = response.map((project) => ({
                    ...project,
                    logoUrl: this.processLogoUrl(project.logoUrl),
                    creationDate: project.creationDate
                        ? new Date(project.creationDate)
                        : null,
                }));
                this.displayedProjects = [...this.projects];
                this.loading = false;
            },
            error: (error) => {
                console.error('Failed to fetch projects:', error);
                this.loading = false;
                this.displayedProjects = [];
            },
        });
    }

    private processLogoUrl(logoUrl: string | undefined): string {
        if (!logoUrl) return '/assets/images/default-project.png';
        if (logoUrl.startsWith('http') || logoUrl.startsWith('https')) {
            return logoUrl;
        }
        return `https://redboost.tn/${logoUrl.replace(/^\/+/, '')}`;
    }

    handleImageError(event: Event) {
        const target = event.target as HTMLImageElement;
        target.src = '/assets/images/default-project.png';
    }

    navigateToProject(url: string | undefined) {
        if (url) {
            window.open(url, '_blank');
        }
    }

    getStatusClass(status: string): string {
        switch (status.toLowerCase()) {
            case 'active':
                return 'active';
            case 'completed':
                return 'completed';
            case 'pending':
                return 'pending';
            default:
                return '';
        }
    }

    getProgressWidth(status: string): string {
        switch (status.toLowerCase()) {
            case 'active':
                return '50%';
            case 'completed':
                return '100%';
            case 'pending':
                return '25%';
            default:
                return '0%';
        }
    }

    getProgressClass(status: string): string {
        return status.toLowerCase();
    }

    getProgressTooltip(status: string): string {
        switch (status.toLowerCase()) {
            case 'active':
                return 'Project is actively in progress';
            case 'completed':
                return 'Project is fully completed';
            case 'pending':
                return 'Project is awaiting approval';
            default:
                return 'Project status';
        }
    }

    filterBySector(sector: string) {
        this.isFiltering = true;
        this.displayedProjects = this.projects.filter(
            (project) => project.sector === sector,
        );
        setTimeout(() => (this.isFiltering = false), 300);
    }

    filterByType(type: string) {
        this.isFiltering = true;
        this.displayedProjects = this.projects.filter(
            (project) => project.type === type,
        );
        setTimeout(() => (this.isFiltering = false), 300);
    }

    resetFilters() {
        this.isFiltering = true;
        this.displayedProjects = [...this.projects];
        setTimeout(() => (this.isFiltering = false), 300);
    }

    loadFavorites() {
        const saved = localStorage.getItem('favoritedProjects');
        if (saved) {
            this.favoritedProjects = new Set(JSON.parse(saved));
        }
    }

    toggleFavorite(project: any) {
        if (this.isFavorited(project)) {
            this.favoritedProjects.delete(project.id);
        } else {
            this.favoritedProjects.add(project.id);
        }
        localStorage.setItem(
            'favoritedProjects',
            JSON.stringify([...this.favoritedProjects]),
        );
    }

    isFavorited(project: any): boolean {
        return this.favoritedProjects.has(project.id);
    }

    onCardKeydown(event: KeyboardEvent, url: string | undefined) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.navigateToProject(url);
        }
    }

    goBackToLanding() {
        this.router.navigate(['/landing']);
    }
}
