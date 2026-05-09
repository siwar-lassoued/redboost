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
        <div class="coach-dashboard-premium">
            <!-- Header Section -->
            <div class="dash-header-lite">
                <div class="welcome-col">
                    <h1>Bonjour, {{ coachProfile?.firstName || 'Coach' }}</h1>
                    <p>Voici un résumé de votre activité de coaching</p>
                </div>
                <div class="sessions-pill-badge">
                    <span class="dot-blue"></span>
                    {{ stats.nbRendezVous || 0 }} sessions ce mois
                </div>
            </div>

            <!-- KPI Cards Grid -->
            <div class="kpi-grid-premium">
                <!-- Card 1: Entrepreneurs -->
                <div class="kpi-card pink-purple-grad">
                    <div class="deco-circle"></div>
                    <div class="kpi-icon-wrap">
                        <i class="pi pi-users"></i>
                    </div>
                    <p class="kpi-label">ENTREPRENEURS</p>
                    <p class="kpi-value">{{ stats.nbProjet || 0 }}</p>
                    <p class="kpi-sub">assignés</p>
                    <div class="kpi-footer">
                        <span class="footer-dot"></span>
                        Portfolio actif
                    </div>
                </div>

                <!-- Card 2: Sessions -->
                <div class="kpi-card purple-indigo-grad">
                    <div class="deco-circle"></div>
                    <div class="kpi-icon-wrap">
                        <i class="pi pi-calendar"></i>
                    </div>
                    <p class="kpi-label">SESSIONS</p>
                    <p class="kpi-value">{{ stats.nbRendezVous || 0 }}</p>
                    <p class="kpi-sub">ce mois-ci</p>
                    <div class="kpi-footer">
                        <span class="footer-dot"></span>
                        En cours
                    </div>
                </div>

                <!-- Card 3: Tasks -->
                <div class="kpi-card teal-blue-grad">
                    <div class="deco-circle"></div>
                    <div class="kpi-icon-wrap">
                        <i class="pi pi-check-square"></i>
                    </div>
                    <p class="kpi-label">TÂCHES</p>
                    <p class="kpi-value">{{ stats.nbTaches || 0 }}</p>
                    <p class="kpi-sub">en cours</p>
                    <div class="kpi-footer">
                        <span class="footer-dot"></span>
                        Suivi actif
                    </div>
                </div>

                <!-- Card 4: Completion -->
                <div class="kpi-card orange-red-grad">
                    <div class="deco-circle"></div>
                    <div class="kpi-icon-wrap">
                        <i class="pi pi-chart-line"></i>
                    </div>
                    <p class="kpi-label">COMPLÉTION</p>
                    <p class="kpi-value">{{ averageCompletionRate || 0 }}%</p>
                    <p class="kpi-sub">taux moyen</p>
                    <div class="kpi-footer">
                        <span class="footer-dot"></span>
                        Performance
                    </div>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="dash-main-grid">
                <!-- Left Column: Entrepreneurs List -->
                <div class="white-box-premium entrepreneurs-list-col">
                    <div class="box-header">
                        <h3>Mes Entrepreneurs</h3>
                        <button class="view-all-link" (click)="router.navigate(['/coach-entrepreneurs'])">
                            Voir tous <i class="pi pi-chevron-right"></i>
                        </button>
                    </div>
                    
                    <div class="ent-list-compact">
                        <div *ngFor="let ent of entrepreneurs.slice(0, 5)" class="ent-row-item" (click)="goToEntrepreneurDetail(ent.id)">
                            <div class="ent-avatar-mini" [style.background]="getAvatarGradient(ent)">
                                {{ getInitialsForEnt(ent) }}
                            </div>
                            <div class="ent-name-info">
                                <div class="name-row-top">
                                    <span class="name">{{ ent.firstName }} {{ ent.lastName }}</span>
                                    <span class="retard-badge-mini" *ngIf="(ent.delayedTasksCount || 0) > 0">
                                        {{ ent.delayedTasksCount }} en retard
                                    </span>
                                </div>
                                <p class="sub">{{ ent.entreprise }} · {{ ent.secteur }}</p>
                            </div>
                            <div class="ent-progress-mini">
                                <div class="mini-p-bar-bg">
                                    <div class="mini-p-bar-fill" [style.width.%]="ent.completionRate || 0"></div>
                                </div>
                                <span class="pct">{{ ent.completionRate || 0 }}%</span>
                            </div>
                            <i class="pi pi-chevron-right arrow-muted"></i>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Upcoming Sessions -->
                <div class="white-box-premium upcoming-sessions-col">
                    <div class="box-header">
                        <h3>Prochaines Sessions</h3>
                        <button class="view-all-link" (click)="router.navigate(['/mes-sessions'])">Voir tout</button>
                    </div>

                    <div class="sessions-timeline-compact">
                        <div *ngFor="let session of upcomingSessions.slice(0, 3); let i = index" class="timeline-item">
                            <div class="timeline-marker" [class.confirmed]="session.statut === 'CONFIRMED'">
                                <div class="marker-dot"></div>
                            </div>
                            <div class="session-mini-card">
                                <div class="session-status-badge" [class.confirmed]="session.statut === 'CONFIRMED'">
                                    {{ session.statut === 'CONFIRMED' ? 'Confirmé' : 'En attente' }}
                                </div>
                                <p class="ent-name-session">{{ session.entrepreneurName }}</p>
                                <div class="session-time-meta">
                                    <i class="pi pi-clock"></i>
                                    <span>{{ session.dateSession | date:'dd/MM/yyyy' }} à {{ session.heureDebut }}</span>
                                </div>
                                <a *ngIf="session.meetingLink" [href]="session.meetingLink" target="_blank" class="meet-link-mini">
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
    coachProfile: any = null;
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

    ngOnInit(): void {
        this.loadCoachProfile();
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


    loadCoachProfile(): void {
        this.coachService.getCoachProfile().subscribe({
            next: (profile) => {
                this.coachProfile = profile;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error loading coach profile:', err)
        });
    }

    getCoachInitials(): string {
        if (!this.coachProfile) return 'C';
        return (this.coachProfile.firstName?.charAt(0) || '') + (this.coachProfile.lastName?.charAt(0) || '');
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
