// @ts-nocheck
import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../frontoffice/service/auth.service';
import { jwtDecode } from 'jwt-decode';
import { WebSocketService } from '../../frontoffice/service/WebSocketService';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { environment } from '../../../../environment';
import { ImageService } from '../../frontoffice/image.service';
import { SafeUrl } from '@angular/platform-browser';
import { CalendarComponent } from '../../backoffice/event_organizer/calendar/event_calendar';
import { Router } from '@angular/router';
import { KpiFormService, KpiFormResponse } from '../../backoffice/kpi_forms/kpi-form.service';

interface Project {
    id: number;
    name: string;
    sector: string;
    progress: number;
    score: number;
    logoUrl: string;
    status: string;
}

interface Activity {
    time: string;
    text: string;
}

interface RendezVous {
    id?: number;
    title: string;
    date: string;
    heure: string;
    status: string;
    color?: string;
    project?: { id: number; name: string };
    guests?: { email: string; profilePictureUrl: string }[];
    meetingLink?: string;
    description?: string;
}

interface DashboardStats {
    nbPhases: number;
    nbTasks: number;
    nbRendezVous: number;
}

@Component({
    selector: 'app-entrepreneur-dashboard',
    standalone: true,
    imports: [CommonModule, NgChartsModule, CalendarComponent],
    template: `
        <div class="entrepreneur-dashboard">
            <!-- Header -->
            <div class="ent-page-header">
                <div>
                    <h1 class="ent-page-title">Tableau de bord</h1>
                    <p class="ent-page-subtitle">Bienvenue, <span class="ent-name-accent">Entrepreneur</span></p>
                </div>
            </div>

            <!-- Calendrier de coaching (même style que le coach) -->
            <div class="ent-calendar-section">
                <app-calendar></app-calendar>
            </div>
            <!-- Rendez-vous Modal -->
            <div
                *ngIf="selectedRendezVous"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
                (click)="closeRendezVousCard()"
            >
                <div
                    class="rendez-vous-card max-w-md w-full mx-4 p-6"
                    (click)="$event.stopPropagation()"
                >
                    <div class="flex justify-between items-center mb-5">
                        <h3 class="text-2xl font-bold text-[#0A4955]">
                            {{ selectedRendezVous.title }}
                        </h3>
                        <button
                            class="close-btn"
                            (click)="closeRendezVousCard()"
                        >
                            <svg
                                class="w-7 h-7 text-[#E44D62] hover:text-[#DB1E37]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                    <div class="rdv-details space-y-4">
                        <p>
                            <strong class="text-[#245C67] font-semibold"
                                >Date :</strong
                            >
                            {{ selectedRendezVous.date }} à
                            {{ selectedRendezVous.heure }}
                        </p>
                        <p>
                            <strong class="text-[#245C67] font-semibold"
                                >Projet :</strong
                            >
                            {{ selectedRendezVous.project?.name || 'N/A' }}
                        </p>
                        <p>
                            <strong class="text-[#245C67] font-semibold"
                                >Invités :</strong
                            >
                        </p>
                        <div
                            *ngIf="
                                selectedRendezVous.guests &&
                                    selectedRendezVous.guests.length > 0;
                                else noGuests
                            "
                            class="flex flex-col gap-3"
                        >
                            <div
                                *ngFor="let guest of selectedRendezVous.guests"
                                class="flex items-center gap-3"
                            >
                                <img
                                    [src]="
                                        guestAvatarUrls[guest.email] ||
                                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADPSURBVHhe7dEBDQAgAMAw3/yvOQ9NswkJoQMIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAkAACAABIAACQAAIAAEgAASAABAAAgAAQAAIAAEgAASAABAAAgAAQAALWot3pD5K6gAAAABJRU5ErkJggg=='
                                    "
                                    alt="Photo de profil"
                                    class="w-8 h-8 rounded-full object-cover border border-[#EA7988]"
                                />
                                <span class="text-[#568086]">{{
                                    guest.email
                                }}</span>
                            </div>
                        </div>
                        <ng-template #noGuests>
                            <p class="text-[#568086]">Aucun invité</p>
                        </ng-template>
                        <p>
                            <strong class="text-[#245C67] font-semibold"
                                >Lien de réunion :</strong
                            >
                            <a
                                *ngIf="selectedRendezVous.meetingLink"
                                [href]="selectedRendezVous.meetingLink"
                                target="_blank"
                                class="text-[#0A4955] hover:text-[#E44D62] transition-colors"
                            >
                                {{ selectedRendezVous.meetingLink }}
                            </a>
                            <span
                                *ngIf="!selectedRendezVous.meetingLink"
                                class="text-[#568086]"
                                >Aucun lien disponible</span
                            >
                        </p>
                        <p>
                            <strong class="text-[#245C67] font-semibold"
                                >Description :</strong
                            >
                            {{
                                selectedRendezVous.description ||
                                    'Aucune description'
                            }}
                        </p>
                    </div>
                </div>
            </div>
            <!-- Stats Cards -->
            <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10 px-6"
            >
                <div
                    class="glass-card flex items-center gap-6 px-6 py-5 group hover:shadow-2xl transition"
                >
                    <div
                        class="icon-bubble flex items-center justify-center bg-[#D9534F]/10 group-hover:bg-[#D9534F]/20"
                    >
                        <svg
                            class="w-9 h-9 text-[#D9534F]"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
                            />
                        </svg>
                    </div>
                    <div class="flex flex-col justify-center">
                        <span class="stat-value leading-tight">{{
                            stats.nbPhases
                        }}</span>
                        <span class="stat-label mt-1">Phases</span>
                    </div>
                </div>
                <div
                    class="glass-card flex items-center gap-6 px-6 py-5 group hover:shadow-2xl transition"
                >
                    <div
                        class="icon-bubble flex items-center justify-center bg-[#1E5A4F]/10 group-hover:bg-[#1E5A4F]/20"
                    >
                        <svg
                            class="w-9 h-9 text-[#1E5A4F]"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M10 4H2v16h20V6H12l-2-2zm0 2l2 2h8v12H4V6h6z"
                            />
                        </svg>
                    </div>
                    <div class="flex flex-col justify-center">
                        <span class="stat-value leading-tight">{{
                            stats.nbTasks
                        }}</span>
                        <span class="stat-label mt-1">Tâches</span>
                    </div>
                </div>
                <div
                    class="glass-card flex items-center gap-6 px-6 py-5 group hover:shadow-2xl transition"
                >
                    <div
                        class="icon-bubble flex items-center justify-center bg-[#28A745]/10 group-hover:bg-[#28A745]/20"
                    >
                        <svg
                            class="w-9 h-9 text-[#28A745]"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M15 18.5c-2.76 0-5-2.24-5-5h8c.55 0 1-.45 1-1s-.45-1-1-1h-8c0-2.76 2.24-5 5-5 .55 0 1-.45 1-1s-.45-1-1-1c-3.87 0-7 3.13-7 7s3.13 7 7 7c.55 0 1-.45 1-1s-.45-1-1-1z"
                            />
                        </svg>
                    </div>
                    <div class="flex flex-col justify-center">
                        <span class="stat-value leading-tight">{{
                            stats.nbRendezVous
                        }}</span>
                        <span class="stat-label mt-1"
                            >Rendez-vous Acceptés</span
                        >
                    </div>
                </div>
            </div>
            <!-- Projets récents -->
            <div class="glass-card section">
                <div class="section-title">Mes Projets</div>
                <div *ngFor="let project of projects" class="project-item">
                    <img
                        [src]="
                            projectLogoUrls[project.id] ||
                            'assets/images/default-logo.png'
                        "
                        [alt]="project.name"
                        class="avatar"
                    />
                    <div class="project-info">
                        <div class="project-name">{{ project.name }}</div>
                        <div class="project-details">
                            Secteur: {{ project.sector }} | Statut:
                            {{ project.status }} | Score: {{ project.score }} |
                            Progrès: {{ project.progress }}%
                        </div>
                    </div>
                    <a class="project-link">Voir</a>
                </div>
            </div>
            <!-- Activité récente -->
            <div class="glass-card section">
                <div class="section-title">Activité récente</div>
                <ng-container
                    *ngIf="activities && activities.length > 0; else noActivity"
                >
                    <ul class="activity-list">
                        <li *ngFor="let a of activities">
                            <span class="activity-dot"></span>
                            <span>{{ a.time }} - {{ a.text }}</span>
                        </li>
                    </ul>
                </ng-container>
                <ng-template #noActivity>
                    <ul class="activity-list">
                        <li>
                            <span class="activity-dot"></span>
                            <span
                                >10:00 - Aucune tâche à faire pour le
                                moment</span
                            >
                        </li>
                    </ul>
                </ng-template>
            </div>
            <!-- Charts -->
            <div class="charts-row">
                <div class="chart-card">
                    <div class="chart-title">Évolution des investissements</div>
                    <canvas
                        baseChart
                        [data]="barChartData"
                        [options]="barChartOptions"
                        [type]="barChartType"
                        [legend]="true"
                        height="260"
                    >
                    </canvas>
                </div>
                <div class="chart-card">
                    <div class="chart-title">Répartition des projets</div>
                    <canvas
                        baseChart
                        [data]="pieChartData"
                        [type]="pieChartType"
                        [options]="pieChartOptions"
                        [legend]="true"
                        height="260"
                    >
                    </canvas>
                </div>
            </div>
            </div>

            <!-- URGENT KPI FORMS POPUP -->
            <div *ngIf="showFormsPopup && pendingForms.length > 0"
                 style="position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);">
              <div style="background: white; border-radius: 24px; width: 100%; max-width: 560px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.2); border-top: 5px solid #1E5A4F;">
                <div style="padding: 24px 28px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F3F4F6;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; background: #ECFDF5; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                      <i class="pi pi-file-edit" style="color: #1E5A4F; font-size: 18px;"></i>
                    </div>
                    <div>
                      <h2 style="font-size: 18px; font-weight: 800; color: #1A1A2E; margin: 0;">Formulaires KPI à remplir</h2>
                      <p style="font-size: 12px; color: #6B7280; margin: 2px 0 0 0;">{{ pendingForms.length }} formulaire(s) en attente de votre réponse</p>
                    </div>
                  </div>
                  <button (click)="dismissPopup()" style="width: 32px; height: 32px; border-radius: 10px; border: none; background: #F3F4F6; cursor: pointer; color: #6B7280; display: flex; align-items: center; justify-content: center;">
                    <i class="pi pi-times"></i>
                  </button>
                </div>
                <div style="padding: 20px 28px; max-height: 300px; overflow-y: auto;">
                  <div *ngFor="let f of pendingForms" style="border: 1px solid #A7F3D0; border-radius: 16px; padding: 16px; margin-bottom: 12px; background: #F0FDF4;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                      <span style="width: 8px; height: 8px; background: #059669; border-radius: 50%; flex-shrink: 0;"></span>
                      <span style="font-size: 14px; font-weight: 700; color: #1A1A2E;">{{ f.formTitle }}</span>
                    </div>
                    <p style="font-size: 12px; color: #6B7280; margin: 0 0 0 16px;">Statut : <strong style="color: #059669;">En attente</strong></p>
                  </div>
                </div>
                <div style="padding: 16px 28px 24px; display: flex; gap: 12px; justify-content: flex-end; border-top: 1px solid #F3F4F6;">
                  <button (click)="dismissPopup()" style="padding: 10px 20px; border-radius: 12px; border: none; background: #F3F4F6; color: #6B7280; font-weight: 600; font-size: 14px; cursor: pointer;">Plus tard</button>
                  <button (click)="goToForms()" style="padding: 10px 24px; border-radius: 12px; border: none; background: #1E5A4F; color: white; font-weight: 700; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(30,90,79,0.3); display: flex; align-items: center; gap: 8px;">
                    <i class="pi pi-file-edit"></i> Remplir maintenant
                  </button>
                </div>
              </div>
            </div>
        </div>
    `,

    styles: [
        `
            .entrepreneur-dashboard {
                background: #f8fafc;
                min-height: 100vh;
                padding: 0;
                font-family: 'Inter', 'Poppins', Arial, sans-serif;
            }
            .ent-page-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 2rem 2.5rem 1rem;
            }
            .ent-page-title {
                font-size: 2rem;
                font-weight: 800;
                color: #0f172a;
                margin: 0;
                letter-spacing: -0.5px;
            }
            .ent-page-subtitle {
                color: #64748b;
                font-size: 1rem;
                margin-top: 0.25rem;
                margin-bottom: 0;
            }
            .ent-name-accent {
                font-weight: 700;
                color: #FF4D85;
            }
            .ent-calendar-section {
                padding: 0;
            }

            .glass-card {
                background: rgba(255, 255, 255, 0.8);
                border-radius: 1.5rem;
                box-shadow: 0 8px 32px rgba(44, 62, 80, 0.1);
                backdrop-filter: blur(8px);
                transition:
                    box-shadow 0.2s,
                    transform 0.2s;
                padding: 18px;
            }
            .glass-card:hover {
                box-shadow: 0 16px 40px rgba(44, 62, 80, 0.18);
                transform: translateY(-2px) scale(1.02);
            }
            .icon-bubble {
                width: 3.5rem;
                height: 3.5rem;
                border-radius: 9999px;
                box-shadow: 0 2px 8px rgba(44, 62, 80, 0.08);
                transition: background 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .stat-value {
                font-size: 2.3rem;
                font-weight: 800;
                color: #0a4955;
                letter-spacing: -1px;
                line-height: 1.1;
            }
            .stat-label {
                color: #6b7280;
                font-size: 1rem;
                font-weight: 500;
                letter-spacing: 0.02em;
                margin-top: 0.1em;
            }
            .section {
                margin-bottom: 24px;
                padding: 18px;
            }
            .section-title {
                font-weight: 600;
                font-size: 1.1rem;
                color: #2d3a4a;
                margin-bottom: 12px;
            }
            .activity-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .activity-dot {
                display: inline-block;
                width: 10px;
                height: 10px;
                background: #245c67;
                border-radius: 50%;
                margin-right: 8px;
                animation: pop-in 0.7s;
            }
            .charts-row {
                display: flex;
                gap: 24px;
                margin-bottom: 32px;
                flex-wrap: wrap;
                justify-content: center;
            }
            .chart-card {
                flex: 1 1 400px;
                max-width: 600px;
                background: rgba(255, 255, 255, 0.7);
                border-radius: 18px;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.18);
                backdrop-filter: blur(8px);
                padding: 24px;
                margin-bottom: 12px;
                transition:
                    transform 0.2s,
                    box-shadow 0.2s;
                animation: slide-up 0.7s;
            }
            .chart-title {
                font-weight: 600;
                font-size: 1.1rem;
                color: #2d3a4a;
                margin-bottom: 12px;
            }
            .calendar-btn {
                display: flex;
                align-items: center;
                background: #0a4955;
                color: #fff;
                font-weight: 600;
                border: none;
                border-radius: 0.75rem;
                padding: 0.6rem 1.2rem;
                font-size: 1rem;
                box-shadow: 0 2px 8px rgba(44, 62, 80, 0.08);
                cursor: pointer;
                transition:
                    background 0.18s,
                    box-shadow 0.18s;
            }
            .calendar-btn:hover {
                background: #e44d62;
                color: #fff;
            }
            .calendar-container {
                background: #fff;
                border-radius: 1.25rem;
                box-shadow: 0 4px 18px 0 rgba(31, 38, 135, 0.1);
                padding: 0;
                margin-bottom: 2rem;
                animation: fade-in 0.5s;
            }
            .modern-calendar .fc {
                background: #fff;
                border-radius: 1.5rem;
                box-shadow: 0 8px 32px rgba(44, 62, 80, 0.1);
                padding: 1.5rem;
                font-family: 'Poppins', Arial, sans-serif;
                width: 100%;
                height: 550px;
            }
            .modern-calendar .fc-toolbar-title {
                color: #0a4955;
                font-size: 1.5rem;
                font-weight: 700;
            }
            .modern-calendar .fc-button {
                background: #0a4955;
                color: #fff;
                border-radius: 0.5rem;
                border: none;
                font-weight: 600;
                transition: background 0.18s;
            }
            .modern-calendar .fc-button:hover,
            .modern-calendar .fc-button:focus {
                background: #e44d62;
                color: #fff;
            }
            .modern-calendar .fc-daygrid-day-number {
                color: #0a4955;
                font-weight: 600;
            }
            .modern-calendar .fc-event {
                border-radius: 0.5rem;
                font-size: 0.95rem;
                font-weight: 500;
                padding: 2px 6px;
                border: none;
                background-color: #e44d62;
                color: #fff;
            }
            .project-item {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                transition: background 0.2s;
            }
            .project-item:hover {
                background: rgba(10, 73, 85, 0.07);
            }
            .avatar {
                border-radius: 50%;
                width: 40px;
                height: 40px;
                margin-right: 12px;
                box-shadow: 0 2px 8px rgba(44, 62, 80, 0.1);
                transition: transform 0.2s;
            }
            .project-item:hover .avatar {
                transform: scale(1.08);
            }
            .project-info {
                flex-grow: 1;
            }
            .project-name {
                font-weight: bold;
                color: #0a4955;
            }
            .project-details {
                font-size: 0.95em;
                color: #555;
            }
            .project-link {
                color: #0a4955;
                text-decoration: underline;
                margin-left: 12px;
                transition: color 0.2s;
            }
            .project-link:hover {
                color: #e44d62;
            }
            .rendez-vous-card {
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(10, 73, 85, 0.2);
                border-top: 4px solid #db1e37;
                animation: slide-up 0.4s ease-out;
                max-width: 500px;
                width: 100%;
                padding: 1.5rem;
                position: relative;
                overflow: hidden;

                &:before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(90deg, #db1e37, #ea7988);
                }

                .close-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0.5rem;
                    transition: transform 0.3s ease;

                    &:hover {
                        transform: scale(1.1);
                    }
                }

                .rdv-details {
                    font-size: 0.95rem;
                    color: #245c67;
                    line-height: 1.6;

                    p {
                        margin-bottom: 1rem;
                    }

                    strong {
                        color: #0a4955;
                        font-weight: 600;
                    }

                    a {
                        color: #0a4955;
                        text-decoration: underline;
                        transition: color 0.3s ease;

                        &:hover {
                            color: #e44d62;
                        }
                    }

                    .flex.items-center {
                        padding: 0.5rem;
                        border-radius: 8px;
                        transition: background 0.3s ease;

                        &:hover {
                            background: rgba(234, 121, 136, 0.1);
                        }
                    }
                }
            }
            .animate-fade-in {
                animation: fadeIn 0.3s ease-out;
            }
            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
            @keyframes fade-in {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
            @keyframes slide-up {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            @keyframes pop-in {
                from {
                    opacity: 0;
                    transform: scale(0.7);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            @media (max-width: 640px) {
                .rendez-vous-card {
                    max-width: 90%;
                    padding: 1.2rem;

                    h3 {
                        font-size: 1.5rem;
                    }

                    .rdv-details {
                        font-size: 0.9rem;

                        p {
                            margin-bottom: 0.8rem;
                        }

                        .flex.items-center {
                            padding: 0.4rem;
                        }

                        img {
                            width: 1.75rem;
                            height: 1.75rem;
                        }
                    }

                    .close-btn svg {
                        width: 1.5rem;
                        height: 1.5rem;
                    }
                }
            }
            @media (max-width: 480px) {
                .rendez-vous-card {
                    padding: 1rem;

                    h3 {
                        font-size: 1.3rem;
                    }

                    .rdv-details {
                        font-size: 0.85rem;

                        p {
                            margin-bottom: 0.6rem;
                        }

                        .flex.items-center {
                            padding: 0.3rem;
                        }

                        img {
                            width: 1.5rem;
                            height: 1.5rem;
                        }
                    }
                }
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntrepreneurDashboardComponent implements OnInit, OnDestroy {
    stats: DashboardStats = { nbPhases: 0, nbTasks: 0, nbRendezVous: 0 };
    activities: Activity[] = [];
    acceptedRendezVous: RendezVous[] = [];
    projects: Project[] = [];
    entrepreneurId: number | null = null;
    projectIds: number[] = [];
    selectedRendezVous: RendezVous | null = null;
    projectLogoUrls: { [key: string]: SafeUrl } = {};
    guestAvatarUrls: { [key: string]: SafeUrl } = {};
    private webSocketSubscription: Subscription | null = null;
    pendingForms: KpiFormResponse[] = [];
    showFormsPopup = false;

    public barChartData: ChartData<'bar'> = {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
        datasets: [
            {
                data: [5000, 7500, 3000, 6000, 4000, 8000],
                label: 'Investissements',
                backgroundColor: '#1E5A4F',
            },
        ],
    };
    public barChartOptions: ChartOptions = {
        responsive: true,
        scales: { y: { beginAtZero: true } },
    };
    public barChartType: ChartType = 'bar';

    public pieChartData: ChartData<'pie'> = {
        labels: ['Tech', 'Agri', 'Commerce', 'Santé', 'Éducation'],
        datasets: [
            {
                data: [40, 25, 15, 10, 10],
                backgroundColor: [
                    '#1E5A4F',
                    '#D9534F',
                    '#28A745',
                    '#FFC107',
                    '#6C757D',
                ],
            },
        ],
    };
    public pieChartType: ChartType = 'pie';
    public pieChartOptions: ChartOptions = {
        responsive: true,
        plugins: { legend: { position: 'top' } },
    };

    calendarOptions: any = {
        plugins: [dayGridPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: '',
        },
        locale: frLocale,
        height: 550,
        events: [],
        eventClick: this.handleEventClick.bind(this),
    };

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private webSocketService: WebSocketService,
        private toastr: ToastrService,
        public cdr: ChangeDetectorRef,
        private imageService: ImageService,
        private router: Router,
        private kpiFormService: KpiFormService,
    ) {}

    ngOnInit() {
        const rawEntrepreneurId = this.authService.getUserId();
        this.entrepreneurId =
            typeof rawEntrepreneurId === 'string'
                ? parseInt(rawEntrepreneurId, 10)
                : rawEntrepreneurId;

        if (this.entrepreneurId !== null) {
            this.loadPendingForms();
            // Fetch projects
            this.http
                .get<
                    Project[]
                >(`${environment.apiUrl}/entrepreneur-dashboard/projects?entrepreneurId=${this.entrepreneurId}`)
                .subscribe({
                    next: (data) => {
                        this.projects = data;
                        this.projectIds = data.map((project) => project.id);

                        // Pre-fetch project logo URLs
                        this.projects.forEach((project) => {
                            this.imageService
                                .sanitizedImageUrl(project.logoUrl)
                                .subscribe((safeUrl) => {
                                    this.projectLogoUrls[project.id] = safeUrl;
                                    this.cdr.detectChanges();
                                });
                        });

                        // Initialize WebSocket
                        this.webSocketService.initialize(this.projectIds, null);
                        this.webSocketSubscription =
                            this.webSocketService.rendezVousUpdates$
                                .pipe(debounceTime(500))
                                .subscribe((update) => {
                                    if (update) {
                                        this.handleRendezVousUpdate(update);
                                    }
                                });

                        // Update pie chart
                        const sectorCounts: { [key: string]: number } = {};
                        this.projects.forEach((project) => {
                            sectorCounts[project.sector] =
                                (sectorCounts[project.sector] || 0) + 1;
                        });
                        this.pieChartData = {
                            labels: Object.keys(sectorCounts),
                            datasets: [
                                {
                                    data: Object.values(sectorCounts),
                                    backgroundColor: [
                                        '#1E5A4F',
                                        '#D9534F',
                                        '#28A745',
                                        '#FFC107',
                                        '#6C757D',
                                    ],
                                },
                            ],
                        };
                        this.cdr.detectChanges();
                    },
                    error: (err) => {
                        console.error(
                            'Erreur lors de la récupération des projets:',
                            err,
                        );
                        this.toastr.error(
                            'Erreur lors de la récupération des projets',
                            'Erreur',
                        );
                    },
                });

            // Fetch dashboard stats
            this.http
                .get<DashboardStats>(
                    `${environment.apiUrl}/entrepreneur-dashboard/stats?entrepreneurId=${this.entrepreneurId}`,
                )
                .subscribe({
                    next: (data) => {
                        this.stats = data;
                        this.cdr.detectChanges();
                    },
                    error: (err) => {
                        console.error(
                            'Erreur lors de la récupération des statistiques:',
                            err,
                        );
                        this.toastr.error(
                            'Erreur lors de la récupération des statistiques',
                            'Erreur',
                        );
                    },
                });

            // Load initial rendez-vous
            this.loadAcceptedRendezVous();

            // Fetch activities
            this.http
                .get<
                    Activity[]
                >(`${environment.apiUrl}/entrepreneur-dashboard/tasks/to-do?entrepreneurId=${this.entrepreneurId}`)
                .subscribe({
                    next: (data) => {
                        this.activities = data;
                        this.cdr.detectChanges();
                    },
                    error: (err) => {
                        console.error(
                            'Erreur lors de la récupération des tâches à faire:',
                            err,
                        );
                        this.toastr.error(
                            'Erreur lors de la récupération des tâches',
                            'Erreur',
                        );
                    },
                });
        } else {
            console.error(
                'Entrepreneur ID non trouvé. Veuillez vous connecter.',
            );
            this.toastr.error('Utilisateur non authentifié', 'Erreur');
        }
    }

    ngAfterViewInit(): void {
        if (this.calendarComponent) {
            this.calendarApi = this.calendarComponent.getApi();
            this.updateCalendarEvents();
        }
    }

    loadPendingForms(): void {
        if (!this.entrepreneurId) return;
        this.kpiFormService.getPendingFormsForEntrepreneur(this.entrepreneurId).subscribe({
            next: (forms) => {
                this.pendingForms = (forms || []).filter(f => f.status === 'PENDING');
                if (this.pendingForms.length > 0) {
                    this.showFormsPopup = true;
                    this.cdr.detectChanges();
                }
            },
            error: () => { /* silent fail */ }
        });
    }

    dismissPopup(): void {
        this.showFormsPopup = false;
        this.cdr.detectChanges();
    }

    goToForms(): void {
        this.showFormsPopup = false;
        this.router.navigate(['/entrepreneur-kpi-forms']);
    }

    private loadAcceptedRendezVous(): void {
        this.http
            .get<
                RendezVous[]
            >(`${environment.apiUrl}/rendezvous/entrepreneur/${this.entrepreneurId}`)
            .subscribe({
                next: (data) => {
                    this.acceptedRendezVous = data
                        .filter((rdv) => rdv.status === 'SCHEDULED')
                        .map((rdv) => ({
                            ...rdv,
                            color: '#E44D62',
                            project: rdv.project
                                ? { id: rdv.project.id, name: rdv.project.name }
                                : undefined,
                        }));
                    this.stats.nbRendezVous = this.acceptedRendezVous.length;

                    // Pre-fetch guest avatar URLs
                    this.acceptedRendezVous.forEach((rdv) => {
                        if (rdv.guests) {
                            rdv.guests.forEach((guest) => {
                                if (!this.guestAvatarUrls[guest.email]) {
                                    this.imageService
                                        .sanitizedAvatarUrl(
                                            guest.profilePictureUrl,
                                        )
                                        .subscribe((safeUrl) => {
                                            this.guestAvatarUrls[guest.email] =
                                                safeUrl;
                                            this.cdr.detectChanges();
                                        });
                                }
                            });
                        }
                    });

                    this.updateCalendarEvents();
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error(
                        'Erreur lors de la récupération des rendez-vous:',
                        err,
                    );
                    this.toastr.error(
                        'Erreur lors de la récupération des rendez-vous',
                        'Erreur',
                    );
                },
            });
    }

    private handleRendezVousUpdate(update: any): void {
        console.log('Received WebSocket update:', update);
        if (
            !update ||
            !update.rendezVous ||
            !this.projectIds.includes(update.rendezVous.project?.id)
        ) {
            return;
        }

        const updatedRdv = {
            id: update.rendezVous.id,
            title: update.rendezVous.title,
            date: update.rendezVous.date,
            heure: update.rendezVous.heure,
            status: update.rendezVous.status,
            color: '#E44D62',
            project: update.rendezVous.project
                ? {
                      id: update.rendezVous.project.id,
                      name: update.rendezVous.project.name,
                  }
                : undefined,
            guests: update.rendezVous.guests,
            meetingLink: update.rendezVous.meetingLink,
            description: update.rendezVous.description,
        };

        let needsUpdate = false;
        if (
            update.action === 'create' &&
            update.rendezVous.status === 'SCHEDULED'
        ) {
            this.acceptedRendezVous.push(updatedRdv);
            this.stats.nbRendezVous++;
            this.toastr.info(
                'Nouveau rendez-vous ajouté au calendrier',
                'Mise à jour',
            );
            needsUpdate = true;
        } else if (update.action === 'update') {
            const index = this.acceptedRendezVous.findIndex(
                (rdv) => rdv.id === update.rendezVous.id,
            );
            if (update.rendezVous.status === 'SCHEDULED') {
                if (index !== -1) {
                    this.acceptedRendezVous[index] = updatedRdv;
                    this.toastr.info('Rendez-vous mis à jour', 'Mise à jour');
                } else {
                    this.acceptedRendezVous.push(updatedRdv);
                    this.stats.nbRendezVous++;
                    this.toastr.info(
                        'Nouveau rendez-vous ajouté au calendrier',
                        'Mise à jour',
                    );
                }
                needsUpdate = true;
            } else if (index !== -1) {
                this.acceptedRendezVous.splice(index, 1);
                this.stats.nbRendezVous = Math.max(
                    0,
                    this.stats.nbRendezVous - 1,
                );
                this.toastr.info(
                    'Rendez-vous retiré du calendrier',
                    'Mise à jour',
                );
                needsUpdate = true;
            }
        } else if (update.action === 'delete' && update.id) {
            const index = this.acceptedRendezVous.findIndex(
                (rdv) => rdv.id === update.id,
            );
            if (index !== -1) {
                this.acceptedRendezVous.splice(index, 1);
                this.stats.nbRendezVous = Math.max(
                    0,
                    this.stats.nbRendezVous - 1,
                );
                this.toastr.info('Rendez-vous supprimé', 'Mise à jour');
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            this.updateCalendarEvents();
            if (updatedRdv.guests) {
                updatedRdv.guests.forEach(
                    (guest: {
                        email: string | number;
                        profilePictureUrl: string | null | undefined;
                    }) => {
                        if (!this.guestAvatarUrls[guest.email]) {
                            this.imageService
                                .sanitizedAvatarUrl(guest.profilePictureUrl)
                                .subscribe((safeUrl) => {
                                    this.guestAvatarUrls[guest.email] = safeUrl;
                                    this.cdr.detectChanges();
                                });
                        }
                    },
                );
            }
            this.cdr.detectChanges();
        }
    }

    private updateCalendarEvents(): void {
        const newEvents = this.acceptedRendezVous.map((rdv) => ({
            id: rdv.id?.toString(),
            title: rdv.title || 'Rendez-vous',
            start: `${rdv.date}T${rdv.heure || '00:00'}`,
            backgroundColor: rdv.color || '#E44D62',
            borderColor: rdv.color || '#E44D62',
        }));

        if (
            JSON.stringify(newEvents) !==
            JSON.stringify(this.calendarOptions.events)
        ) {
            this.calendarOptions = {
                ...this.calendarOptions,
                events: newEvents,
            };
            if (this.calendarApi) {
                this.calendarApi.removeAllEvents();
                this.calendarApi.addEventSource(this.calendarOptions.events);
                this.calendarApi.render();
            }
        }
    }

    handleEventClick(info: any): void {
        const rdvId = parseInt(info.event.id, 10);
        this.http
            .get<RendezVous>(`${environment.apiUrl}/rendezvous/${rdvId}`)
            .subscribe({
                next: (rdv) => {
                    this.selectedRendezVous = {
                        ...rdv,
                        color: '#E44D62',
                        project: rdv.project
                            ? { id: rdv.project.id, name: rdv.project.name }
                            : undefined,
                    };
                    if (rdv.guests) {
                        rdv.guests.forEach((guest) => {
                            if (!this.guestAvatarUrls[guest.email]) {
                                this.imageService
                                    .sanitizedAvatarUrl(guest.profilePictureUrl)
                                    .subscribe((safeUrl) => {
                                        this.guestAvatarUrls[guest.email] =
                                            safeUrl;
                                        this.cdr.detectChanges();
                                    });
                            }
                        });
                    }
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error(
                        'Erreur lors de la récupération des détails du rendez-vous:',
                        err,
                    );
                    this.toastr.error(
                        'Erreur lors de la récupération des détails du rendez-vous',
                        'Erreur',
                    );
                },
            });
    }

    closeRendezVousCard(): void {
        this.selectedRendezVous = null;
        this.cdr.detectChanges();
    }

    ngOnDestroy(): void {
        if (this.webSocketSubscription) {
            this.webSocketSubscription.unsubscribe();
            this.webSocketSubscription = null;
        }
        if (this.webSocketService) {
            this.webSocketService.ngOnDestroy();
        }
        this.imageService.clearCache();
    }
}
