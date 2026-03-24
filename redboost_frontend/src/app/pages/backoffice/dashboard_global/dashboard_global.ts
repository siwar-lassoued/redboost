import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardGlobalDTO } from './dashboard_global.service';

interface IndicatorCategory {
  name: string;
  displayName: string;
  indicators: any[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard_global.html',
  styleUrls: ['./dashboard_global.scss']
})

export class DashboardGlobalComponent implements OnInit {

  // State for collapsible sections
  isGlobalIndicatorsOpen: boolean = false; 
  isPlatformMetricsOpen: boolean = false;
  isActivityTypesOpen: boolean = true;

  activityTypesCount: Record<string, number> = {};
  activityTypeCards: any[] = [];

  // Section 1: Global Indicators Data - Now categorized
  globalIndicatorCategories: IndicatorCategory[] = [];
// NEW — alongside globalIndicatorCategories
optionnelIndicatorCategories: IndicatorCategory[] = [];
isOptionnelIndicatorsOpen: boolean = false;
  // Section 2: Program Overview Data (Colorful Cards)
  programStats: any[] = [];
  smallStats: any[] = [];

  // Section 3: Platform Metrics Data
  platformMetrics: any[] = [];

  currentDate = this.getCurrentDate();
  
  loading = true;
  error: string | null = null;

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.getDashboardData().subscribe({
      next: (data: DashboardGlobalDTO) => {
        this.mapDashboardData(data);
        this.loadActivityTypesCount();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.error = 'Erreur lors du chargement des données du tableau de bord';
        this.loading = false;
        this.initializeEmptyData();
      }
    });
  }

  private loadActivityTypesCount(): void {
    this.dashboardService.getActivityTypesCount().subscribe({
      next: (counts: Record<string, number>) => {
        this.activityTypesCount = counts;
        this.mapActivityTypeCards();
      },
      error: (err) => {
        console.error('Error loading activity types count', err);
        this.activityTypesCount = {};
        this.mapActivityTypeCards();
      }
    });
  }

  private mapActivityTypeCards(): void {
    const typeConfig: Record<string, { title: string, icon: string, color: string }> = {
      'pitch_day': { title: 'Pitch Day', icon: 'fa-microphone-lines', color: '#d81b60' },
      'atelier': { title: 'Ateliers', icon: 'fa-chalkboard-teacher', color: '#26a69a' },
      'autre': { title: 'Autres', icon: 'fa-ellipsis', color: '#7b1fa2' },
    };

    this.activityTypeCards = Object.entries(this.activityTypesCount).map(([type, count]) => {
     const config = typeConfig[type] || {
  title: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
  icon: 'fa-ellipsis',   // ✅ no more ? icon
  color: '#607d8b'
};

      return {
        type,
        title: config.title,
        value: count,
        icon: config.icon,
        color: config.color
      };
    });

    this.activityTypeCards.sort((a, b) => b.value - a.value);
  }

  toggleActivityTypes(): void {
    this.isActivityTypesOpen = !this.isActivityTypesOpen;
  }

  mapDashboardData(data: DashboardGlobalDTO): void {
    // Map Program Stats to colorful cards
    this.programStats = [
      { 
        type: 'card',
        title: 'PROGRAMMES', 
        value: data.programStats.totalProgrammes.toString(), 
        subtitle: 'programmes actifs', 
        footerIcon: 'fa-circle', 
        footerText: 'Portfolio complet', 
        theme: 'pink',
        icon: 'fa-folder'
      },
      { 
        type: 'card',
        title: 'BÉNÉFICIAIRES', 
        value: data.programStats.totalBeneficiaires.toString(), 
        subtitle: 'femmes accompagnées', 
        footerIcon: 'fa-circle', 
        footerText: 'Impact social majeur', 
        theme: 'purple',
        icon: 'fa-user-group'
      },
      { 
        type: 'card',
        title: 'EN COURS', 
        value: data.programStats.programmesEnCours.toString(), 
        subtitle: 'en cours d\'exécution', 
        footerIcon: 'fa-circle', 
        footerText: this.calculatePercentage(data.programStats.programmesEnCours, data.programStats.totalProgrammes) + '% du portfolio', 
        theme: 'teal',
        icon: 'fa-play'
      },
      { 
        type: 'card',
        title: 'RETARDS', 
        value: data.programStats.programmesEnRetard.toString(), 
        subtitle: 'nécessitent attention', 
        footerIcon: 'fa-circle', 
        footerText: 'Action requise', 
        theme: 'orange',
        icon: 'fa-circle-exclamation'
      }
    ];

    // Map Global Indicators - Now with categories
    this.globalIndicatorCategories = this.mapGlobalIndicatorsByCategory(data.globalIndicators);
this.optionnelIndicatorCategories = this.mapGlobalIndicatorsByCategory(data.optionnelIndicators || {});

    // Map Small Stats
    this.smallStats = [
      { 
        icon: 'fa-calendar', 
        title: 'MOYENNE BÉNÉFICIAIRES', 
        value: data.smallStats.moyenneBeneficiaires.toString(), 
        theme: 'pink' 
      },
      { 
        icon: 'fa-file-lines', 
        title: 'TAUX DE COMPLÉTION', 
        value: data.smallStats.tauxCompletion + '%', 
        theme: 'teal' 
      },
      { 
        icon: 'fa-user', 
        title: 'PROGRAMMES PLANIFIÉS', 
        value: data.smallStats.programmesPlanifies.toString(), 
        theme: 'purple' 
      }
    ];

    // Map Platform Metrics
    const metrics = data.platformMetrics;
    
    this.platformMetrics = [
      { 
        title: 'TOTAL UTILISATEURS', 
        value: metrics.totalUtilisateurs.toString(), 
        increment: this.calculateIncrement(metrics.utilisateursActifs, metrics.totalUtilisateurs), 
        objectiveLabel: 'Objectif mensuel', 
        percentage: this.calculatePercentage(metrics.utilisateursActifs, metrics.totalUtilisateurs), 
        color: '#e91e63', 
        icon: 'fa-users',
        stats: { 
          left: `${metrics.utilisateursActifs} actifs`, 
          right: `${metrics.utilisateursInactifs} inactifs`, 
          leftColor: '#00c853', 
          rightColor: '#9e9e9e' 
        }
      },
      { 
        title: 'TOTAL LIVRABLES', 
        value: metrics.totalLivrables.toString(), 
        increment: '+' + this.calculateDifference(metrics.livrablesValides, metrics.livrablesEnCours), 
        objectiveLabel: 'Objectif annuel', 
        percentage: metrics.totalLivrables > 0 ? Math.round((metrics.livrablesValides / metrics.totalLivrables) * 100) : 0, 
        color: '#00838f', 
        icon: 'fa-clipboard-check',
        stats: { 
          left: `${metrics.livrablesValides} validés`, 
          right: `${metrics.livrablesEnCours} en cours`, 
          leftColor: '#00c853', 
          rightColor: '#ffb300' 
        }
      },
      { 
        title: 'TOTAL COACHS', 
        value: metrics.totalCoachs.toString(), 
        increment: '+' + (metrics.totalCoachs - metrics.coachsCertifies), 
        objectiveLabel: 'Objectif annuel', 
        percentage: this.calculatePercentage(metrics.coachsCertifies, metrics.totalCoachs), 
        color: '#880e4f', 
        icon: 'fa-user-check',
        stats: { 
          left: `${metrics.coachsCertifies} certifiés`, 
          right: `${metrics.coachsStagiaires} stagiaires`, 
          leftColor: '#00c853', 
          rightColor: '#1e88e5' 
        }
      },
      { 
        title: 'CANDIDATURES COACH', 
        value: metrics.candidaturesCoach.toString(), 
        increment: null, 
        objectiveLabel: 'En attente de validation', 
        percentage: 30, 
        color: '#0097a7', 
        icon: 'fa-user',
        isPending: true,
        stats: { 
          left: `${metrics.candidaturesSemaine} cette semaine`, 
          right: `${metrics.candidaturesRevision} en révision`, 
          leftColor: '#ff6f00', 
          rightColor: '#ab47bc' 
        }
      }
    ];
  }

  private mapGlobalIndicatorsByCategory(categorizedIndicators: Record<string, any[]>): IndicatorCategory[] {
    const categoryDisplayNames: Record<string, string> = {
      'impact social': 'Impact Social',
      'finance': 'Finance',
      'formation': 'Formation',
      'emploi': 'Emploi'
      // Add more as needed
    };

    return Object.entries(categorizedIndicators).map(([categoryKey, indicators]) => ({
      name: categoryKey,
      displayName: categoryDisplayNames[categoryKey] || this.capitalizeCategory(categoryKey),
      indicators: indicators.map(indicator => ({
        title: indicator.title,
        value: indicator.value,
        trend: indicator.trend,
        period: indicator.period,
        icon: indicator.icon,
        color: indicator.color,
        bg: indicator.bg,
        info: indicator.info  // ← ADD THIS

      }))
    }));
  }

  private capitalizeCategory(category: string): string {
    return category.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  initializeEmptyData(): void {
    this.programStats = [
      { type: 'card', title: 'PROGRAMMES', value: '0', subtitle: 'programmes actifs', footerIcon: 'fa-circle', footerText: 'Aucune donnée', theme: 'pink', icon: 'fa-folder' },
      { type: 'card', title: 'BÉNÉFICIAIRES', value: '0', subtitle: 'femmes accompagnées', footerIcon: 'fa-circle', footerText: 'Aucune donnée', theme: 'purple', icon: 'fa-user-group' },
      { type: 'card', title: 'EN COURS', value: '0', subtitle: 'en cours d\'exécution', footerIcon: 'fa-circle', footerText: '0% du portfolio', theme: 'teal', icon: 'fa-play' },
      { type: 'card', title: 'RETARDS', value: '0', subtitle: 'nécessitent attention', footerIcon: 'fa-circle', footerText: 'Aucun retard', theme: 'orange', icon: 'fa-circle-exclamation' }
    ];
    this.globalIndicatorCategories = [];
    this.smallStats = [];
    this.platformMetrics = [];
    this.optionnelIndicatorCategories = [];

  }

  toggleOptionnelIndicators(): void {
  this.isOptionnelIndicatorsOpen = !this.isOptionnelIndicatorsOpen;
}

  calculatePercentage(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }

  calculateIncrement(current: number, total: number): string {
    const diff = total - current;
    return diff > 0 ? `+${diff}` : `${diff}`;
  }

  calculateDifference(val1: number, val2: number): string {
    const diff = Math.abs(val1 - val2);
    return diff.toString();
  }

  getCurrentDate(): string {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const now = new Date();
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  }

  toggleGlobalIndicators(): void {
    this.isGlobalIndicatorsOpen = !this.isGlobalIndicatorsOpen;
  }

  togglePlatformMetrics(): void {
    this.isPlatformMetricsOpen = !this.isPlatformMetricsOpen;
  }


  getActivityPercentage(value: number): number {
  const total = this.activityTypeCards.reduce((sum, c) => sum + c.value, 0);
  return total > 0 ? Math.round((value / total) * 100) : 0;
}
}