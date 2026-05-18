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
import { KpiFormService, KpiFormResponse } from '../../backoffice/kpi_forms/kpi-form.service';

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
                <h1>Bonjour, Coach </h1>
                <p>Voici un résumé de votre activité de coaching</p>
                <div class="header-action">
                    <span class="session-badge">• {{ stats.nbRendezVous || 14 }} sessions ce mois</span>
                </div>
            </div>

            <!-- Gradient Cards Section -->
            <div class="stats-grid">
                <!-- Card 1: Entrepreneurs -->
                <div class="stat-card pink-gradient">
                    <div class="icon-wrapper">
                        <i class="pi pi-users"></i>
                    </div>
                    <div class="stat-content">
                        <h3>ENTREPRENEURS</h3>
                        <div class="stat-main">
                            <span class="value">{{ stats.nbProjet || 6 }}</span>
                            <span class="label">assignés</span>
                        </div>
                    </div>
                    <div class="card-footer">• Portfolio actif</div>
                </div>

                <!-- Card 2: Sessions -->
                <div class="stat-card purple-gradient">
                    <div class="icon-wrapper">
                        <i class="pi pi-calendar"></i>
                    </div>
                    <div class="stat-content">
                        <h3>SESSIONS</h3>
                        <div class="stat-main">
                            <span class="value">{{ stats.nbRendezVous || 14 }}</span>
                            <span class="label">ce mois-ci</span>
                        </div>
                    </div>
                    <div class="card-footer">• En cours</div>
                </div>

                <!-- Card 3: Tâches -->
                <div class="stat-card blue-gradient">
                    <div class="icon-wrapper">
                        <i class="pi pi-check-square"></i>
                    </div>
                    <div class="stat-content">
                        <h3>TÂCHES</h3>
                        <div class="stat-main">
                            <span class="value">{{ stats.nbTaches || 8 }}</span>
                            <span class="label">en cours</span>
                        </div>
                    </div>
                    <div class="card-footer">• Suivi actif</div>
                </div>

                <!-- Card 4: Complétion -->
                <div class="stat-card orange-gradient">
                    <div class="icon-wrapper">
                        <i class="pi pi-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <h3>COMPLÉTION</h3>
                        <div class="stat-main">
                            <span class="value">{{ averageCompletionRate || 0 }}%</span>
                            <span class="label">taux moyen</span>
                        </div>
                    </div>
                    <div class="card-footer">• Performance</div>
                </div>
            </div>

            <!-- Main Content Area: Lists -->
            <div class="content-grid">
                
                <!-- Mes Entrepreneurs List -->
                <div class=" entrepreneurs-section">
                    <div class="section-header">
                        <h2>Mes Entrepreneurs</h2>
                        <a href="javascript:void(0)" class="voir-tous" (click)="router.navigate(['/coach-entrepreneurs'])">Voir tous ></a>
                    </div>
                    <div class="entrepreneurs-list">
                        <!-- Dynamic entrepreneurs loaded from backend -->
                        <div *ngIf="isLoadingEntrepreneurs" class="loading-indicator">
                            <p>Chargement des entrepreneurs...</p>
                        </div>
                        
                        <div *ngIf="!isLoadingEntrepreneurs && entrepreneurs.length === 0" class="empty-state">
                            <p>Aucun entrepreneur assigné pour le moment</p>
                        </div>

                        <div *ngFor="let entrepreneur of entrepreneurs" 
                             class="entrepreneur-item cursor-pointer" 
                             (click)="goToEntrepreneurDetail(entrepreneur.id)">
                            <div class="avatar pink-avatar">
                                {{ entrepreneur.firstName.charAt(0) }}{{ entrepreneur.lastName.charAt(0) }}
                            </div>
                            <div class="entrepreneur-info">
                                <h4 class="flex items-center gap-2">
                                    {{ entrepreneur.firstName }} {{ entrepreneur.lastName }}
                                    <span *ngIf="entrepreneur.delayedTasksCount && entrepreneur.delayedTasksCount > 0" 
                                          class="badge-retard">
                                        {{ entrepreneur.delayedTasksCount }} en retard
                                    </span>
                                </h4>
                                <span class="startup-desc">
                                    {{ entrepreneur.entreprise || 'N/A' }} • {{ entrepreneur.secteur || 'Non renseigné' }}
                                </span>
                            </div>
                            <div class="progress-col">
                                <span class="progress-txt">{{ entrepreneur.completionRate || 0 }}%</span>
                                <div class="progress-bar">
                                    <div class="progress-fill fill-pink" 
                                         [style.width]="(entrepreneur.completionRate || 0) + '%'"></div>
                                </div>
                            </div>
                            <i class="pi pi-angle-right"></i>
                        </div>
                    </div>
                </div>

                <!-- Prochaines Sessions Pane -->
                <div class="sessions-section">
                    <div class="section-header">
                        <h2>Prochaines Sessions</h2>
                        <a href="javascript:void(0)" class="voir-tous" (click)="router.navigate(['/mes-sessions'])">Voir tout</a>
                    </div>
                    <div class="sessions-list">
                        <!-- Dynamic sessions loaded from backend -->
                        <div *ngIf="isLoadingSessions" class="loading-indicator">
                            <p>Chargement des sessions...</p>
                        </div>
                        
                        <div *ngIf="!isLoadingSessions && upcomingSessions.length === 0" class="empty-state">
                            <p>Aucune session prévue pour le moment</p>
                        </div>

                        <div *ngFor="let session of upcomingSessions" class="session-card">
                            <div class="status-indicator">
                                <span class="dot" 
                                      [class.dot-green]="session.statut === 'CONFIRMED'" 
                                      [class.dot-orange]="session.statut === 'PENDING'"
                                      [class.dot-red]="session.statut === 'CANCELLED'"></span>
                            </div>
                            <div class="session-content">
                                <div class="badge" 
                                     [class.badge-green]="session.statut === 'CONFIRMED'"
                                     [class.badge-orange]="session.statut === 'PENDING'"
                                     [class.badge-red]="session.statut === 'CANCELLED'">
                                    {{ session.statut === 'CONFIRMED' ? 'Confirmé' : 
                                       session.statut === 'PENDING' ? 'En attente' : 'Annulé' }}
                                </div>
                                <h4>{{ session.entrepreneurName }}</h4>
                                <div class="session-meta">
                                    <i class="pi pi-clock"></i> 
                                    {{ session.dateSession }} à {{ session.heureDebut }}
                                </div>
                                <a *ngIf="session.meetingLink" [href]="session.meetingLink" 
                                   target="_blank" class="meet-link">
                                    <i class="pi pi-video"></i> Lien Meet
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        <!-- URGENT FORMS POPUP -->
        <div *ngIf="showFormsPopup && pendingForms.length > 0"
             style="position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);">
          <div style="background: white; border-radius: 24px; width: 100%; max-width: 560px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.2); border-top: 5px solid #ea5073;">
            <!-- Header -->
            <div style="padding: 24px 28px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F3F4F6;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; background: #FFF0F5; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <i class="pi pi-exclamation-triangle" style="color: #ea5073; font-size: 18px;"></i>
                </div>
                <div>
                  <h2 style="font-size: 18px; font-weight: 800; color: #1A1A2E; margin: 0;">Formulaires en attente</h2>
                  <p style="font-size: 12px; color: #6B7280; margin: 2px 0 0 0;">{{ pendingForms.length }} formulaire(s) nécessitent votre attention</p>
                </div>
              </div>
              <button (click)="dismissPopup()" style="width: 32px; height: 32px; border-radius: 10px; border: none; background: #F3F4F6; cursor: pointer; color: #6B7280; display: flex; align-items: center; justify-content: center;">
                <i class="pi pi-times"></i>
              </button>
            </div>
            <!-- Forms List -->
            <div style="padding: 20px 28px; max-height: 320px; overflow-y: auto;">
              <div *ngFor="let f of pendingForms" style="border: 1px solid #fad2e1; border-radius: 16px; padding: 16px; margin-bottom: 12px; background: #FFF9FB;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span style="width: 8px; height: 8px; background: #ea5073; border-radius: 50%; flex-shrink: 0; animation: pulse-dot 1.5s infinite;"></span>
                  <span style="font-size: 14px; font-weight: 700; color: #1A1A2E;">{{ f.formTitle }}</span>
                </div>
                <p style="font-size: 12px; color: #6B7280; margin: 0;">Statut : <strong style="color: #ea5073;">À remplir</strong></p>
              </div>
            </div>
            <!-- Footer -->
            <div style="padding: 16px 28px 24px; display: flex; gap: 12px; justify-content: flex-end; border-top: 1px solid #F3F4F6;">
              <button (click)="dismissPopup()" style="padding: 10px 20px; border-radius: 12px; border: none; background: #F3F4F6; color: #6B7280; font-weight: 600; font-size: 14px; cursor: pointer;">Plus tard</button>
              <button (click)="goToForms()" style="padding: 10px 24px; border-radius: 12px; border: none; background: #ea5073; color: white; font-weight: 700; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(234,80,115,0.3); display: flex; align-items: center; gap: 8px;">
                <i class="pi pi-file-edit"></i> Remplir maintenant
              </button>
            </div>
          </div>
        </div>
        </div>
    `,
    styles: [
        `
            .coach-dashboard {
                background: #f8f9fa;
                padding: 2rem;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #2D3748;
                margin-top: -1rem; /* Adjust padding added by layout */
            }

            /* Header */
            .dashboard-header {
                position: relative;
                margin-bottom: 2rem;
            }
            .dashboard-header h1 {
                font-size: 2.2rem;
                font-weight: 700;
                margin: 0;
                color: #2D3748;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .wave {
                display: inline-block;
                animation: wave-animation 2.5s infinite;
                transform-origin: 70% 70%;
            }
            @keyframes wave-animation {
                0% { transform: rotate( 0.0deg) }
                10% { transform: rotate(14.0deg) }  
                20% { transform: rotate(-8.0deg) }
                30% { transform: rotate(14.0deg) }
                40% { transform: rotate(-4.0deg) }
                50% { transform: rotate(10.0deg) }
                60% { transform: rotate( 0.0deg) }  
                100% { transform: rotate( 0.0deg) }
            }
            @keyframes pulse-dot {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.4; transform: scale(0.8); }
            }
            .dashboard-header p {
                color: #718096;
                font-size: 1.1rem;
                margin-top: 0.5rem;
            }
            .header-action {
                position: absolute;
                right: 0;
                top: 0;
            }
            .session-badge {
                background: linear-gradient(to right, #DC2626, #111827);
                color: white;
                padding: 0.6rem 1.2rem;
                border-radius: 20px;
                font-weight: 700;
                font-size: 0.95rem;
                box-shadow: 0 4px 10px rgba(220,38,38,0.2);
            }

            /* Stats Grid */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 1.5rem;
                margin-bottom: 2.5rem;
            }
            .stat-card {
                border-radius: 1.5rem;
                padding: 1.5rem;
                color: white;
                display: flex;
                flex-direction: column;
                position: relative;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0,0,0,0.08);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                min-height: 200px;
            }
            .stat-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 30px rgba(0,0,0,0.15);
            }
            /* Gradients matching the mockup */
            .pink-gradient { background: linear-gradient(135deg, #FF4D85 0%, #FF758C 100%); }
            .purple-gradient { background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); }
            .blue-gradient { background: linear-gradient(135deg, #2563EB 0%, #60A5FA 100%); }
            .orange-gradient { background: linear-gradient(135deg, #D97706 0%, #FBBF24 100%); }

            /* Add the inner subtle circle decoration */
            .stat-card::before {
                content: '';
                position: absolute;
                top: -20px;
                right: -20px;
                width: 150px;
                height: 150px;
                border-radius: 50%;
                background: rgba(255,255,255,0.1);
                pointer-events: none;
            }

            .icon-wrapper {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                background: rgba(255,255,255,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 1.5rem;
            }
            .icon-wrapper i {
                font-size: 1.2rem;
            }

            .stat-content h3 {
                font-size: 0.8rem;
                font-weight: 600;
                letter-spacing: 1px;
                margin: 0 0 0.5rem 0;
                opacity: 0.9;
                text-transform: uppercase;
            }
            .stat-main {
                display: flex;
                flex-direction: column;
                margin-bottom: 1.5rem;
            }
            .stat-main .value {
                font-size: 3.5rem;
                font-weight: 700;
                line-height: 1;
                margin-bottom: 0.2rem;
            }
            .stat-main .label {
                font-size: 1.1rem;
                font-weight: 500;
                opacity: 0.9;
            }
            .card-footer {
                margin-top: auto;
                font-size: 0.85rem;
                opacity: 0.8;
                font-weight: 500;
            }

            /* Content Grid */
            .content-grid {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 2rem;
            }

            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding: 0 0.5rem;
            }
            .section-header h2 {
                font-size: 1.3rem;
                font-weight: 700;
                color: #2D3748;
                margin: 0;
            }
            .voir-tous {
                color: var(--coach-primary);
                text-decoration: none;
                font-weight: 600;
                font-size: 0.9rem;
            }
            .voir-tous:hover {
                text-decoration: underline;
            }

            /* Entrepreneurs List */
            .entrepreneurs-section {
                background: white;
                border-radius: 1.5rem;
                padding: 1.5rem;
                box-shadow: 0 4px 15px rgba(0,0,0,0.03);
            }
            .entrepreneurs-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            .entrepreneur-item {
                display: flex;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid #edf2f7;
                transition: background 0.2s;
            }
            .entrepreneur-item:last-child {
                border-bottom: none;
            }
            .entrepreneur-item:hover {
                background: #f8f9fa;
                border-radius: 1rem;
            }
            .avatar {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 1.1rem;
                color: white;
                margin-right: 1rem;
            }
            .pink-avatar {
                background: linear-gradient(135deg, #DC2626, #111827);
            }
            .entrepreneur-info {
                flex: 1;
            }
            .entrepreneur-info h4 {
                margin: 0 0 0.3rem 0;
                font-size: 1.1rem;
                color: #2D3748;
                font-weight: 600;
            }
            .startup-desc {
                color: #718096;
                font-size: 0.9rem;
            }
            .badge-retard {
                background: linear-gradient(to right, #DC2626, #111827);
                color: white;
                font-size: 0.75rem;
                padding: 0.2rem 0.6rem;
                border-radius: 20px;
                font-weight: 600;
                border: none;
            }
            .progress-col {
                display: flex;
                align-items: center;
                gap: 1rem;
                min-width: 150px;
                margin-right: 1.5rem;
            }
            .progress-txt {
                font-weight: 600;
                color: #4A5568;
                min-width: 35px;
            }
            .progress-bar {
                flex: 1;
                height: 6px;
                background: #EDF2F7;
                border-radius: 3px;
                overflow: hidden;
            }
            .progress-fill {
                height: 100%;
                border-radius: 3px;
            }
            .fill-pink {
                background: linear-gradient(to right, #DC2626, #111827);
            }
            .entrepreneur-item > i {
                color: #A0AEC0;
                font-size: 1.2rem;
                cursor: pointer;
            }

            /* Sessions List */
            .sessions-section {
                background: white;
                border-radius: 1.5rem;
                padding: 1.5rem;
                box-shadow: 0 4px 15px rgba(0,0,0,0.03);
            }
            .sessions-list {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                position: relative;
            }
            /* Vertical timeline line */
            .sessions-list::before {
                content: '';
                position: absolute;
                left: 11px;
                top: 20px;
                bottom: 20px;
                width: 2px;
                background: #EDF2F7;
            }

            .session-card {
                display: flex;
                gap: 1.5rem;
                position: relative;
                z-index: 1;
            }
            .status-indicator {
                padding-top: 5px;
                background: white;
            }
            .dot {
                display: block;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 4px solid white;
                box-shadow: 0 0 0 1px #E2E8F0;
            }
            .dot-green { background: #48BB78; }
            .dot-orange { background: #ED8936; }
            .dot-red { background: #F56565; }

            .session-content {
                background: #F8FAFC;
                border: 1px solid #E2E8F0;
                border-radius: 1rem;
                padding: 1.2rem;
                flex: 1;
            }
            .badge {
                display: inline-block;
                padding: 0.3rem 0.8rem;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 600;
                margin-bottom: 0.8rem;
                background: linear-gradient(to right, #DC2626, #111827);
                color: white;
                border: none;
            }
            .badge-green { /* Keep gradient but maybe a green tint if needed, or just let it be default */ }
            .badge-orange { /* Keep gradient or let it be default */ }
            .badge-red { /* Keep gradient or let it be default */ }

            /* Loading and empty state styles */
            .loading-indicator {
                text-align: center;
                padding: 2rem;
                color: #718096;
                font-size: 0.95rem;
            }

            .empty-state {
                text-align: center;
                padding: 2rem;
                color: #A0AEC0;
                font-size: 0.95rem;
            }
            .session-content h4 {
                margin: 0 0 0.5rem 0;
                font-size: 1.1rem;
                color: #2D3748;
                font-weight: 600;
            }
            .session-meta {
                color: #718096;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.8rem;
            }
            .meet-link {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                color: #3182CE;
                font-size: 0.9rem;
                font-weight: 500;
                text-decoration: none;
            }
            .meet-link:hover {
                text-decoration: underline;
            }

            /* Responsive */
            @media (max-width: 1280px) {
                .stats-grid { grid-template-columns: repeat(2, 1fr); }
            }
            @media (max-width: 1024px) {
                .content-grid { grid-template-columns: 1fr; }
            }
            @media (max-width: 640px) {
                .stats-grid { grid-template-columns: 1fr; }
                .progress-col { display: none; }
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
    pendingForms: KpiFormResponse[] = [];
    showFormsPopup = false;
    
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
        private kpiFormService: KpiFormService,
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
            this.loadPendingForms();
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

    loadPendingForms(): void {
        if (!this.coachId) return;
        this.kpiFormService.getPendingFormsForCoach(this.coachId).subscribe({
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
    }

    goToForms(): void {
        this.showFormsPopup = false;
        this.router.navigate(['/coach-kpi-forms']);
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
