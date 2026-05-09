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
import { CoachService, CoachEntrepreneurDTO, UpcomingSessionDTO } from './services/coach.service';

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
            <!-- Header -->
            <div class="dashboard-header">
                <div class="header-main">
                    <h1>Bonjour, Coach <span class="wave">👋</span></h1>
                    <p>Voici un résumé de votre activité de coaching pour aujourd'hui ✨</p>
                </div>
                <div class="header-action">
                    <span class="session-badge">
                        <i class="pi pi-calendar-plus"></i>
                        {{ stats.nbRendezVous || 9 }} sessions ce mois
                    </span>
                </div>
            </div>

            <!-- Premium Stats Cards Section -->
            <div class="stats-grid">
                <!-- Card 1: Entrepreneurs -->
                <div class="stat-card premium-card-white">
                    <div class="card-inner">
                        <div class="icon-box blue-soft">
                            <i class="pi pi-users"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">ENTREPRENEURS</span>
                            <div class="stat-row">
                                <span class="stat-value">{{ stats.nbProjet || 5 }}</span>
                                <span class="stat-unit">assignés</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer-lite">
                         <span class="footer-dot blue"></span>
                         Portfolio actif 🚀
                    </div>
                </div>

                <!-- Card 2: Sessions -->
                <div class="stat-card premium-card-white">
                    <div class="card-inner">
                        <div class="icon-box purple-soft">
                            <i class="pi pi-calendar"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">SESSIONS</span>
                            <div class="stat-row">
                                <span class="stat-value">{{ stats.nbRendezVous || 9 }}</span>
                                <span class="stat-unit">ce mois-ci</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer-lite">
                        <span class="footer-dot purple"></span>
                        En cours 📅
                    </div>
                </div>

                <!-- Card 3: Tâches -->
                <div class="stat-card premium-card-white">
                    <div class="card-inner">
                        <div class="icon-box pink-soft">
                            <i class="pi pi-check-square"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">TÂCHES</span>
                            <div class="stat-row">
                                <span class="stat-value">{{ stats.nbTaches || 8 }}</span>
                                <span class="stat-unit">en cours</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer-lite">
                        <span class="footer-dot pink"></span>
                        Suivi actif ✅
                    </div>
                </div>

                <!-- Card 4: Complétion -->
                <div class="stat-card premium-card-white">
                    <div class="card-inner">
                        <div class="icon-box green-soft">
                            <i class="pi pi-chart-line"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">COMPLÉTION</span>
                            <div class="stat-row">
                                <span class="stat-value">{{ averageCompletionRate || 17 }}%</span>
                                <span class="stat-unit">taux moyen</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer-lite">
                        <span class="footer-dot green"></span>
                        Performance 📈
                    </div>
                </div>
            </div>

            <!-- Main Content Area: Side by Side -->
            <div class="main-content-layout">
                
                <!-- Left: Mes Entrepreneurs -->
                <div class="entrepreneurs-panel premium-card-flat">
                    <div class="panel-header">
                        <div class="header-left">
                             <h2>Mes Entrepreneurs 👥</h2>
                        </div>
                        <a href="javascript:void(0)" class="btn-link" (click)="router.navigate(['/coach-entrepreneurs'])">Voir tous ></a>
                    </div>
                    
                    <div class="panel-body">
                        <div *ngIf="isLoadingEntrepreneurs" class="loader-p">
                            <i class="pi pi-spin pi-spinner"></i>
                            <span>Chargement...</span>
                        </div>
                        
                        <div *ngIf="!isLoadingEntrepreneurs && entrepreneurs.length === 0" class="empty-p">
                             <div class="empty-icon">📂</div>
                             <p>Aucun entrepreneur assigné</p>
                        </div>

                        <div *ngFor="let ent of entrepreneurs" 
                             class="ent-row cursor-pointer" 
                             (click)="goToEntrepreneurDetail(ent.id)">
                            <div class="ent-avatar" [style.background]="getAvatarGradient(ent)">
                                {{ ent.firstName.charAt(0) }}{{ ent.lastName.charAt(0) }}
                            </div>
                            <div class="ent-main">
                                <div class="ent-top">
                                    <span class="ent-name">{{ ent.firstName }} {{ ent.lastName }}</span>
                                    <span *ngIf="(ent.delayedTasksCount || 0) > 0" class="retard-badge">
                                        {{ ent.delayedTasksCount }} en retard
                                    </span>
                                </div>
                                <span class="ent-sub">{{ ent.entreprise || 'Non spécifié' }} • {{ ent.secteur || 'Non renseigné' }}</span>
                            </div>
                            <div class="ent-progress">
                                <span class="pct">{{ ent.completionRate || 0 }}%</span>
                                <div class="p-bar">
                                    <div class="p-fill" [style.width]="(ent.completionRate || 0) + '%'"></div>
                                </div>
                            </div>
                            <i class="pi pi-chevron-right ent-arrow"></i>
                        </div>
                    </div>
                </div>

                <!-- Right: Prochaines Sessions -->
                <div class="sessions-panel premium-card-flat">
                    <div class="panel-header">
                        <div class="header-left">
                            <h2>Prochaines Sessions 🕒</h2>
                        </div>
                        <a href="javascript:void(0)" class="btn-link" (click)="router.navigate(['/mes-sessions'])">Voir tout</a>
                    </div>
                    
                    <div class="panel-body">
                        <div *ngIf="isLoadingSessions" class="loader-p">
                            <i class="pi pi-spin pi-spinner"></i>
                        </div>
                        
                        <div *ngIf="!isLoadingSessions && upcomingSessions.length === 0" class="empty-p">
                             <p>Rien de prévu ☕</p>
                        </div>

                        <div *ngFor="let session of upcomingSessions" class="session-item-premium">
                            <div class="time-marker">
                                <div class="marker-dot" [class.confirmed]="session.statut === 'CONFIRMED'"></div>
                            </div>
                            <div class="session-card-lite">
                                <div class="sc-top">
                                    <span class="sc-badge" [class.confirmed]="session.statut === 'CONFIRMED'">
                                        {{ session.statut === 'CONFIRMED' ? 'Confirmé' : 'En attente' }}
                                    </span>
                                </div>
                                <h4 class="sc-title">{{ session.entrepreneurName }}</h4>
                                <div class="sc-meta">
                                    <i class="pi pi-clock"></i>
                                    {{ session.dateSession }} à {{ session.heureDebut }}
                                </div>
                                <a *ngIf="session.meetingLink" [href]="session.meetingLink" target="_blank" class="sc-link">
                                    <i class="pi pi-video"></i> Lien Meet
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                --coach-primary: #FF4D85;
                --coach-bg: #F8FAFC;
                --text-dark: #0F172A;
                --text-muted: #64748B;
            }

            .coach-dashboard {
                background: var(--coach-bg);
                padding: 2.5rem;
                min-height: 100vh;
                animation: fadeIn 0.5s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Header */
            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 2.5rem;
            }

            .dashboard-header h1 {
                font-size: 2.5rem;
                font-weight: 800;
                color: var(--text-dark);
                margin: 0;
                letter-spacing: -1px;
            }

            .dashboard-header p {
                color: var(--text-muted);
                font-size: 1.1rem;
                margin: 0.5rem 0 0;
            }

            .session-badge {
                background: #1e293b;
                color: white;
                padding: 0.75rem 1.25rem;
                border-radius: 100px;
                font-weight: 700;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 0.6rem;
                box-shadow: 0 10px 20px rgba(15, 23, 42, 0.15);
            }

            /* Stats Grid */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 1.5rem;
                margin-bottom: 3rem;
            }

            .stat-card {
                background: white;
                border-radius: 24px;
                padding: 1.5rem;
                border: 1px solid rgba(226, 232, 240, 0.5);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }

            .stat-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
            }

            .card-inner {
                display: flex;
                align-items: flex-start;
                gap: 1.25rem;
                margin-bottom: 1.5rem;
            }

            .icon-box {
                width: 54px;
                height: 54px;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
            }

            .blue-soft { background: #eff6ff; color: #3b82f6; }
            .purple-soft { background: #f5f3ff; color: #8b5cf6; }
            .pink-soft { background: #fff1f2; color: #f43f5e; }
            .green-soft { background: #f0fdf4; color: #22c55e; }

            .stat-info {
                display: flex;
                flex-direction: column;
            }

            .stat-label {
                font-size: 0.75rem;
                font-weight: 700;
                color: var(--text-muted);
                letter-spacing: 0.1em;
                margin-bottom: 0.25rem;
            }

            .stat-row {
                display: flex;
                align-items: baseline;
                gap: 0.5rem;
            }

            .stat-value {
                font-size: 2.2rem;
                font-weight: 800;
                color: var(--text-dark);
                line-height: 1;
            }

            .stat-unit {
                font-size: 0.9rem;
                color: var(--text-muted);
                font-weight: 500;
            }

            .card-footer-lite {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.85rem;
                font-weight: 600;
                color: var(--text-muted);
                padding-top: 1rem;
                border-top: 1px solid #f1f5f9;
            }

            .footer-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
            }

            .footer-dot.blue { background: #3b82f6; }
            .footer-dot.purple { background: #8b5cf6; }
            .footer-dot.pink { background: #f43f5e; }
            .footer-dot.green { background: #22c55e; }

            /* Layout Panels */
            .main-content-layout {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 2rem;
            }

            .premium-card-flat {
                background: white;
                border-radius: 32px;
                padding: 2rem;
                border: 1px solid rgba(226, 232, 240, 0.8);
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }

            .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
            }

            .panel-header h2 {
                font-size: 1.5rem;
                font-weight: 800;
                color: var(--text-dark);
                margin: 0;
            }

            .btn-link {
                color: var(--coach-primary);
                text-decoration: none;
                font-weight: 700;
                font-size: 0.95rem;
                transition: opacity 0.2s;
            }

            .btn-link:hover { opacity: 0.7; }

            /* Entrepreneurs Panel */
            .ent-row {
                display: flex;
                align-items: center;
                padding: 1.25rem;
                border-radius: 20px;
                margin-bottom: 0.5rem;
                transition: all 0.2s;
            }

            .ent-row:hover {
                background: #f8fafc;
                transform: translateX(5px);
            }

            .ent-avatar {
                width: 56px;
                height: 56px;
                border-radius: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 800;
                font-size: 1.2rem;
                margin-right: 1.25rem;
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            }

            .ent-main { flex: 1; min-width: 0; }

            .ent-top {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 0.25rem;
            }

            .ent-name {
                font-weight: 700;
                font-size: 1.1rem;
                color: var(--text-dark);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .retard-badge {
                background: #fff1f2;
                color: #f43f5e;
                padding: 0.2rem 0.75rem;
                border-radius: 100px;
                font-size: 0.75rem;
                font-weight: 700;
                white-space: nowrap;
            }

            .ent-sub {
                display: block;
                color: var(--text-muted);
                font-size: 0.9rem;
            }

            .ent-progress {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 0.5rem;
                min-width: 120px;
                margin: 0 1.5rem;
            }

            .pct { font-weight: 800; color: var(--coach-primary); font-size: 0.95rem; }

            .p-bar {
                width: 100%;
                height: 8px;
                background: #f1f5f9;
                border-radius: 4px;
                overflow: hidden;
            }

            .p-fill {
                height: 100%;
                background: linear-gradient(90deg, #FF4D85, #FF758C);
                border-radius: 4px;
            }

            .ent-arrow { color: #cbd5e1; font-size: 1.1rem; }

            /* Sessions Panel */
            .session-item-premium {
                display: flex;
                gap: 1.5rem;
                margin-bottom: 1.5rem;
                position: relative;
            }

            .time-marker {
                position: relative;
                padding-top: 0.5rem;
            }

            .marker-dot {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #e2e8f0;
                border: 3px solid white;
                box-shadow: 0 0 0 1px #e2e8f0;
                z-index: 2;
                position: relative;
            }

            .marker-dot.confirmed { background: #22c55e; box-shadow: 0 0 0 1px #22c55e; }

            .session-card-lite {
                background: #f8fafc;
                border: 1px solid #f1f5f9;
                border-radius: 20px;
                padding: 1.25rem;
                flex: 1;
            }

            .sc-badge {
                padding: 0.3rem 0.8rem;
                border-radius: 100px;
                font-size: 0.7rem;
                font-weight: 800;
                text-transform: uppercase;
                background: #f1f5f9;
                color: #64748b;
            }

            .sc-badge.confirmed { background: #ecfdf5; color: #10b981; }

            .sc-title { margin: 1rem 0 0.5rem; font-size: 1.1rem; font-weight: 800; color: var(--text-dark); }

            .sc-meta { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.75rem; }

            .sc-link { display: inline-flex; align-items: center; gap: 0.5rem; color: #3b82f6; font-weight: 700; text-decoration: none; font-size: 0.9rem; }

            .sc-link:hover { text-decoration: underline; }

            /* Wave Animation */
            .wave {
                display: inline-block;
                animation: wave-animation 2.5s infinite;
                transform-origin: 70% 70%;
            }
            @keyframes wave-animation {
                0%, 100% { transform: rotate(0deg); }
                10% { transform: rotate(14deg); }
                20% { transform: rotate(-8deg); }
                30% { transform: rotate(14deg); }
                40% { transform: rotate(-4deg); }
                50% { transform: rotate(10deg); }
            }

            @media (max-width: 1024px) {
                .main-content-layout { grid-template-columns: 1fr; }
            }
        `
    ]
})
export class CoachDashboardComponent implements OnInit, OnDestroy {
    stats: DashboardStats = {
        nbRendezVous: 0,
        nbTaches: 0,
        nbPhases: 0,
        nbProjet: 0,
        activity: [],
    };
    
    // Dynamic data from backend
    entrepreneurs: CoachEntrepreneurDTO[] = [];
    upcomingSessions: UpcomingSessionDTO[] = [];
    isLoadingEntrepreneurs = false;
    isLoadingSessions = false;
    averageCompletionRate = 0;

    getAvatarGradient(ent: any): string {
        const colors = [
            ['#FF4D85', '#FF758C'],
            ['#7C3AED', '#A78BFA'],
            ['#2563EB', '#60A5FA'],
            ['#059669', '#34D399'],
            ['#D97706', '#FBBF24']
        ];
        const index = (ent.id || 0) % colors.length;
        return `linear-gradient(135deg, ${colors[index][0]} 0%, ${colors[index][1]} 100%)`;
    }
    
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
        public router: Router,
        private coachService: CoachService,
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
                this.webSocketService.rendezVousUpdates$.subscribe((update: any) => {
                    if (update) {
                        this.handleRendezVousUpdate(update);
                    }
                });

            // Use the unified coachService for dashboard stats
            this.coachService.getDashboardStats(this.coachId).subscribe({
                next: (data) => {
                    this.stats = { ...this.stats, ...data };
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error fetching stats:', err);
                }
            });

            // Remove old mockup endpoints that trigger 404s
            // this.loadAcceptedRendezVous();
            // this.loadTasksToValidate();

            // Load dynamic entrepreneurs and upcoming sessions from backend
            this.loadCoachEntrepreneurs();
            this.loadUpcomingSessions();
        } else {
            console.error(
                'Coach ID not found. Please ensure you are logged in.',
            );
            this.toastr.error('Utilisateur non authentifié', 'Erreur');
        }
    }

    /**
     * Navigate to the detailed view of an entrepreneur
     */
    goToEntrepreneurDetail(entrepreneurId: number): void {
        this.router.navigate(['/coach-entrepreneurs', entrepreneurId]);
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

    /**
     * Load the list of entrepreneurs assigned to the coach from the backend
     */
    private loadCoachEntrepreneurs(): void {
        if (this.coachId === null) return;
        
        this.isLoadingEntrepreneurs = true;
        this.coachService.getCoachEntrepreneurs(this.coachId).subscribe({
            next: (data) => {
                this.entrepreneurs = data;
                this.isLoadingEntrepreneurs = false;
                
                if (this.entrepreneurs.length > 0) {
                    const totalProgress = this.entrepreneurs.reduce((acc, current) => acc + (current.completionRate || 0), 0);
                    this.averageCompletionRate = Math.round(totalProgress / this.entrepreneurs.length);
                } else {
                    this.averageCompletionRate = 0;
                }
                
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading entrepreneurs:', err);
                this.isLoadingEntrepreneurs = false;
                this.toastr.error(
                    'Erreur lors du chargement des entrepreneurs',
                    'Erreur',
                );
                this.cdr.detectChanges();
            },
        });
    }

    /**
     * Load the list of upcoming sessions for the coach from the backend
     */
    private loadUpcomingSessions(): void {
        if (this.coachId === null) return;
        
        this.isLoadingSessions = true;
        this.coachService.getUpcomingSessions(this.coachId).subscribe({
            next: (data) => {
                this.upcomingSessions = data;
                this.isLoadingSessions = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading upcoming sessions:', err);
                this.isLoadingSessions = false;
                this.toastr.error(
                    'Erreur lors du chargement des sessions',
                    'Erreur',
                );
                this.cdr.detectChanges();
            },
        });
    }

    ngOnDestroy(): void {
        if (this.webSocketSubscription) {
            this.webSocketSubscription.unsubscribe();
            this.webSocketSubscription = null;
        }
    }
}
