import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ChangeDetectorRef,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import frLocale from '@fullcalendar/core/locales/fr';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../frontoffice/service/auth.service';
import { WebSocketService } from '../../frontoffice/service/WebSocketService';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Calendar } from '@fullcalendar/core';
import { Router } from '@angular/router';
import { environment } from '../../../../environment';

interface Kpi {
    label: string;
    value: number | string;
    icon: string;
    color: string;
}

interface Startup {
    name: string;
    sector: string;
    progress: number;
    score: number;
}

interface Activity {
    time: string;
    text: string;
}

interface Project {
    id: number;
    name: string;
}

interface RendezVous {
    id?: number;
    title: string;
    date: string;
    heure: string;
    status: string;
    color?: string;
    project?: Project;
    guests?: { email: string; profilePictureUrl: string }[];
    meetingLink?: string;
    description?: string;
}

interface TaskToValidateDTO {
    taskId: number;
    title: string;
    status: string;
    phaseName: string;
    projetName: string;
}

interface DashboardStats {
    nbRendezVous: number;
    nbTaches: number;
    nbPhases: number;
    nbProjet: number;
    activity: Activity[];
}

interface NoteDeSynthese {
    id?: number;
    synthese: string;
    appreciation: string;
    recommendation: string;
    toDoText: string;
    tasks: { description: string; phaseId?: number }[];
}

@Component({
    selector: 'app-coach-dashboard',
    standalone: true,
    imports: [CommonModule, NgChartsModule, FullCalendarModule],
    template: `
        <div class="coach-dashboard">
            <!-- Header avec bouton calendrier -->
            <div class="flex items-center justify-between mb-10 px-6 pt-8">
                <div>
                    <h1
                        class="text-4xl font-extrabold text-[#0A4955] tracking-tight"
                    >
                        Tableau de bord du coach
                    </h1>
                    <p class="text-gray-500 mt-1">
                        Bienvenue,
                        <span class="font-semibold text-[#E44D62]">COACH</span>
                    </p>
                </div>
                <button
                    class="calendar-btn"
                    (click)="showCalendar = !showCalendar"
                    type="button"
                >
                    <svg
                        class="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                    >
                        <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            fill="#fff"
                            stroke="#0A4955"
                        />
                        <path d="M16 2v4M8 2v4M3 10h18" stroke="#0A4955" />
                    </svg>
                    Voir le calendrier
                </button>
            </div>
            <!-- Calendrier moderne -->
            <div *ngIf="showCalendar" class="calendar-container mb-8 px-6">
                <full-calendar
                    #calendar
                    [options]="calendarOptions"
                    class="modern-calendar"
                ></full-calendar>
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
                                        guest.profilePictureUrl ||
                                        'assets/avatars/user.jpg'
                                    "
                                    alt="Photo de profil"
                                    class="w-8 h-8 rounded-full object-cover border border-[#EA7988]"
                                    (error)="
                                        guest.profilePictureUrl =
                                            'assets/avatars/user.jpg'
                                    "
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
                        <button
                            class="bg-[#EA4D62] text-white px-4 py-2 rounded-md hover:bg-[#DB1E37] transition-colors mt-4"
                            (click)="goToNoteDeSynthese(selectedRendezVous.id)"
                        >
                            Note de Synthèse
                        </button>
                    </div>
                </div>
            </div>
            <!-- Stats Cards -->
            <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 px-6"
            >
                <div
                    class="glass-card flex items-center gap-6 px-6 py-5 group hover:shadow-2xl transition"
                >
                    <div
                        class="icon-bubble flex items-center justify-center bg-[#E44D62]/10 group-hover:bg-[#E44D62]/20"
                    >
                        <svg
                            class="w-9 h-9 text-[#E44D62]"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05C17.16 13.41 19 14.28 19 15.5V19h5v-2.5c0-2.33-4.67-3.5-7-3.5z"
                            />
                        </svg>
                    </div>
                    <div class="flex flex-col justify-center">
                        <span class="stat-value leading-tight">{{
                            stats.nbProjet
                        }}</span>
                        <span class="stat-label mt-1">Projets</span>
                    </div>
                </div>
                <div
                    class="glass-card flex items-center gap-6 px-6 py-5 group hover:shadow-2xl transition"
                >
                    <div
                        class="icon-bubble flex items-center justify-center bg-[#245C67]/10 group-hover:bg-[#245C67]/20"
                    >
                        <svg
                            class="w-9 h-9 text-[#245C67]"
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
                            stats.nbTaches
                        }}</span>
                        <span class="stat-label mt-1">Tâches</span>
                    </div>
                </div>
                <div
                    class="glass-card flex items-center gap-6 px-6 py-5 group hover:shadow-2xl transition"
                >
                    <div
                        class="icon-bubble flex items-center justify-center bg-[#EA7988]/10 group-hover:bg-[#EA7988]/20"
                    >
                        <svg
                            class="w-9 h-9 text-[#EA7988]"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
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
                        class="icon-bubble flex items-center justify-center bg-[#0A4955]/10 group-hover:bg-[#0A4955]/20"
                    >
                        <svg
                            class="w-9 h-9 text-[#0A4955]"
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
                        <span class="stat-label mt-1">Rendez-vous</span>
                    </div>
                </div>
            </div>
            <!-- Activité récente -->
            <div class="glass-card section">
                <div class="section-title">Activité récente</div>
                <ng-container
                    *ngIf="
                        stats.activity && stats.activity.length > 0;
                        else noActivity
                    "
                >
                    <ul class="activity-list">
                        <li *ngFor="let a of stats.activity">
                            <span class="activity-dot"></span>
                            <span>{{ a.time }} - {{ a.text }}</span>
                        </li>
                    </ul>
                </ng-container>
                <ng-template #noActivity>
                    <ul class="activity-list">
                        <li>
                            <span class="activity-dot"></span>
                            <span>10:00 - Exemple d'activité récente</span>
                        </li>
                    </ul>
                </ng-template>
            </div>
            <!-- Charts -->
            <div class="charts-row">
                <div class="chart-card">
                    <div class="chart-title">Évolution des suivis</div>
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
                    <div class="chart-title">Répartition des secteurs</div>
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
    `,
    styles: [
        `
            .coach-dashboard {
                background: linear-gradient(120deg, #f0f4ff 0%, #e0e7ff 100%);
                min-height: 100vh;
                padding: 32px 8px;
                font-family: 'Poppins', Arial, sans-serif;
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
                background: #245c67;
                box-shadow: 0 4px 12px rgba(44, 62, 80, 0.15);
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
            }
            .rendez-vous-card:before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 4px;
                background: linear-gradient(90deg, #db1e37, #ea7988);
            }
            .rendez-vous-card .close-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: 0.5rem;
                transition: transform 0.3s ease;
            }
            .rendez-vous-card .close-btn:hover {
                transform: scale(1.1);
            }
            .rendez-vous-card .rdv-details {
                font-size: 0.95rem;
                color: #245c67;
                line-height: 1.6;
            }
            .rendez-vous-card .rdv-details p {
                margin-bottom: 1rem;
            }
            .rendez-vous-card .rdv-details strong {
                color: #0a4955;
                font-weight: 600;
            }
            .rendez-vous-card .rdv-details a {
                color: #0a4955;
                text-decoration: underline;
                transition: color 0.3s ease;
            }
            .rendez-vous-card .rdv-details a:hover {
                color: #e44d62;
            }
            .rendez-vous-card .rdv-details .flex.items-center {
                padding: 0.5rem;
                border-radius: 8px;
                transition: background 0.3s ease;
            }
            .rendez-vous-card .rdv-details .flex.items-center:hover {
                background: rgba(234, 121, 136, 0.1);
            }
            /* Modal animation */
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
            .animate-slide-up {
                animation: slide-up 0.3s ease-out;
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
            @media (max-width: 640px) {
                .rendez-vous-card {
                    max-width: 90%;
                    padding: 1.2rem;
                }
                .rendez-vous-card h3 {
                    font-size: 1.5rem;
                }
                .rendez-vous-card .rdv-details {
                    font-size: 0.9rem;
                }
                .rendez-vous-card .rdv-details p {
                    margin-bottom: 0.8rem;
                }
                .rendez-vous-card .rdv-details .flex.items-center {
                    padding: 0.4rem;
                }
                .rendez-vous-card .rdv-details img {
                    width: 1.75rem;
                    height: 1.75rem;
                }
                .rendez-vous-card .close-btn svg {
                    width: 1.5rem;
                    height: 1.5rem;
                }
            }
            @media (max-width: 480px) {
                .rendez-vous-card {
                    padding: 1rem;
                }
                .rendez-vous-card h3 {
                    font-size: 1.3rem;
                }
                .rendez-vous-card .rdv-details {
                    font-size: 0.85rem;
                }
                .rendez-vous-card .rdv-details p {
                    margin-bottom: 0.6rem;
                }
                .rendez-vous-card .rdv-details .flex.items-center {
                    padding: 0.3rem;
                }
                .rendez-vous-card .rdv-details img {
                    width: 1.5rem;
                    height: 1.5rem;
                }
            }
        `,
    ],
})
export class CoachDashboardComponent implements OnInit, OnDestroy {
    stats: DashboardStats = {
        nbRendezVous: 0,
        nbTaches: 0,
        nbPhases: 0,
        nbProjet: 0,
        activity: [],
    };
    startups: Startup[] = [
        {
            name: 'GreenTech',
            sector: 'Environnement',
            progress: 80,
            score: 4.5,
        },
        {
            name: 'AgroBoost',
            sector: 'Agroalimentaire',
            progress: 65,
            score: 4.2,
        },
        { name: 'EduSmart', sector: 'Éducation', progress: 90, score: 4.8 },
        { name: 'HealthPlus', sector: 'Santé', progress: 70, score: 4.3 },
        { name: 'FinWise', sector: 'Finance', progress: 60, score: 4.1 },
    ];
    showCalendar = false;
    coachId: number | null = null;
    acceptedRendezVous: RendezVous[] = [];
    tasksToValidate: TaskToValidateDTO[] = [];
    selectedRendezVous: RendezVous | null = null;

    @ViewChild('calendar') calendarComponent: any;
    private calendarApi: Calendar | null = null;
    private webSocketSubscription: Subscription | null = null;

    public barChartData: ChartData<'bar'> = {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août'],
        datasets: [
            {
                data: [5, 7, 6, 8, 9, 10, 12, 14],
                label: 'Startups suivies',
                backgroundColor: '#245C67',
            },
        ],
    };
    public barChartOptions: ChartOptions = {
        responsive: true,
        scales: { y: { beginAtZero: true } },
    };
    public barChartType: ChartType = 'bar';

    public pieChartData: ChartData<'pie'> = {
        labels: [
            'Environnement',
            'Agroalimentaire',
            'Éducation',
            'Santé',
            'Finance',
        ],
        datasets: [
            {
                data: [2, 1, 2, 1, 2],
                backgroundColor: [
                    '#245C67',
                    '#E44D62',
                    '#FFBB28',
                    '#4DD0E1',
                    '#7E57C2',
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
        private cdr: ChangeDetectorRef,
        private router: Router,
    ) {}

    ngOnInit() {
        const rawCoachId = this.authService.getUserId();
        this.coachId =
            typeof rawCoachId === 'string'
                ? parseInt(rawCoachId, 10)
                : rawCoachId;

        if (this.coachId !== null) {
            this.webSocketService.initialize(null, this.coachId);
            this.webSocketSubscription =
                this.webSocketService.rendezVousUpdates$.subscribe((update) => {
                    if (update) {
                        this.handleRendezVousUpdate(update);
                    }
                });

            this.http
                .get<DashboardStats>(
                    `${environment.apiUrl}/coach-dashboard/stats?coachId=${this.coachId}`,
                )
                .subscribe({
                    next: (data) => {
                        this.stats = { ...this.stats, ...data };
                        this.cdr.detectChanges();
                    },
                    error: (err) => {
                        console.error('Error fetching stats:', err);
                        this.toastr.error(
                            'Erreur lors de la récupération des statistiques',
                            'Erreur',
                        );
                    },
                });

            this.loadAcceptedRendezVous();

            this.http
                .get<
                    TaskToValidateDTO[]
                >(`${environment.apiUrl}/coach-dashboard/tasks/to-validate?coachId=${this.coachId}`)
                .subscribe({
                    next: (data) => {
                        this.tasksToValidate = data;
                        this.stats.activity = this.tasksToValidate.map(
                            (task) => ({
                                time: new Date().toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }),
                                text: `Tâche à valider: ${task.title} (Projet: ${task.projetName}, Phase: ${task.phaseName})`,
                            }),
                        );
                        this.cdr.detectChanges();
                    },
                    error: (err) => {
                        console.error('Error fetching tasks to validate:', err);
                        this.toastr.error(
                            'Erreur lors de la récupération des tâches',
                            'Erreur',
                        );
                    },
                });
        } else {
            console.error(
                'Coach ID not found. Please ensure you are logged in.',
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

    private loadAcceptedRendezVous(): void {
        this.http
            .get<
                RendezVous[]
            >(`${environment.apiUrl}/rendezvous/accepted?coachId=${this.coachId}`)
            .subscribe({
                next: (data) => {
                    this.acceptedRendezVous = data.map((rdv) => ({
                        ...rdv,
                        color: '#4DD0E1',
                    }));
                    this.stats.nbRendezVous = this.acceptedRendezVous.length;
                    this.updateCalendarEvents();
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error fetching rendezvous:', err);
                    this.toastr.error(
                        'Erreur lors de la récupération des rendez-vous',
                        'Erreur',
                    );
                },
            });
    }

    private handleRendezVousUpdate(update: any): void {
        console.log('Handling rendez-vous update:', update);
        if (
            update.action === 'create' &&
            update.rendezVous &&
            update.rendezVous.status === 'SCHEDULED'
        ) {
            this.acceptedRendezVous.push({
                id: update.rendezVous.id,
                title: update.rendezVous.title,
                date: update.rendezVous.date,
                heure: update.rendezVous.heure,
                status: update.rendezVous.status,
                color: '#4DD0E1',
                project: update.rendezVous.project,
                guests: update.rendezVous.guests,
                meetingLink: update.rendezVous.meetingLink,
                description: update.rendezVous.description,
            });
            this.stats.nbRendezVous++;
            this.toastr.info(
                'Nouveau rendez-vous accepté ajouté',
                'Mise à jour',
            );
        } else if (update.action === 'update' && update.rendezVous) {
            const index = this.acceptedRendezVous.findIndex(
                (rdv) => rdv.id === update.rendezVous.id,
            );
            if (update.rendezVous.status === 'SCHEDULED') {
                const updatedRdv = {
                    id: update.rendezVous.id,
                    title: update.rendezVous.title,
                    date: update.rendezVous.date,
                    heure: update.rendezVous.heure,
                    status: update.rendezVous.status,
                    color: '#4DD0E1',
                    project: update.rendezVous.project,
                    guests: update.rendezVous.guests,
                    meetingLink: update.rendezVous.meetingLink,
                    description: update.rendezVous.description,
                };
                if (index !== -1) {
                    this.acceptedRendezVous[index] = updatedRdv;
                    this.toastr.info('Rendez-vous mis à jour', 'Mise à jour');
                } else {
                    this.acceptedRendezVous.push(updatedRdv);
                    this.stats.nbRendezVous++;
                    this.toastr.info(
                        'Nouveau rendez-vous accepté ajouté',
                        'Mise à jour',
                    );
                }
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
            }
        }
        this.updateCalendarEvents();
    }

    private updateCalendarEvents(): void {
        console.log('Updating calendar events:', this.acceptedRendezVous);
        this.calendarOptions = {
            ...this.calendarOptions,
            events: this.acceptedRendezVous.map((rdv) => ({
                id: rdv.id?.toString(),
                title: rdv.title || 'Rendez-vous',
                start: `${rdv.date}T${rdv.heure || '00:00'}`,
                backgroundColor: rdv.color || '#4DD0E1',
                borderColor: rdv.color || '#4DD0E1',
            })),
        };
        this.cdr.detectChanges();
        if (this.calendarApi) {
            console.log('Calendar API available, rendering events');
            this.calendarApi.render();
        } else {
            console.warn('Calendar API not available yet');
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
                        color: '#4DD0E1',
                    };
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error fetching rendez-vous details:', err);
                    this.toastr.error(
                        'Erreur lors de la récupération des détails du rendez-vous',
                        'Erreur',
                    );
                },
            });
    }

    goToNoteDeSynthese(rendezVousId: number | undefined): void {
        if (rendezVousId) {
            const user = this.authService.getCurrentUser;
            if (!user) {
                this.toastr.error('Utilisateur non authentifié', 'Erreur');
                return;
            }
            this.http
                .get<NoteDeSynthese>(
                    `${environment.apiUrl}/notes/getnote/${rendezVousId}`,
                )
                .subscribe({
                    next: (note) => {
                        this.router.navigate(
                            ['/note-de-synthese-create', rendezVousId],
                            { state: { note } },
                        );
                        this.closeRendezVousCard();
                    },
                    error: (err) => {
                        if (err.status === 404) {
                            this.router.navigate(
                                ['/note-de-synthese-create', rendezVousId],
                                { state: { note: null } },
                            );
                            this.closeRendezVousCard();
                        } else {
                            console.error(
                                'Error fetching note de synthèse:',
                                err,
                            );
                            this.toastr.error(
                                'Erreur lors de la récupération de la note de synthèse',
                                'Erreur',
                            );
                        }
                    },
                });
        } else {
            this.toastr.error('ID du rendez-vous non valide', 'Erreur');
        }
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
    }
}
