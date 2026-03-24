// dashboard-program.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
    ProgrammeDashboardService,
    TaskRealizationByCategoryDTO,
    GlobalKpiPerformanceDTO,
    KpiDistributionByCategoryDTO,
    KpiEvolutionByCategoryDTO,
    CategoryTaskStats,
    ActivityTypeCounts,
    SprintKpiStatistics,
} from './dashboardservice';

interface DonutSegment {
    color: string;
    dashArray: string;
    dashOffset: number;
}

interface ChartPoint {
    x: number;
    y: number;
}

@Component({
    selector: 'app-dashboard-program',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard-program.html',
    styleUrls: ['./dashboard-program.scss'],
})
export class DashboardProgramComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    // Component state
    programmeId!: number;
    loading = true;
    error: string | null = null;
    currentDate = new Date();

    // Dashboard data
    taskRealization: TaskRealizationByCategoryDTO | null = null;
    globalKpiPerformance: GlobalKpiPerformanceDTO | null = null;
    kpiDistribution: KpiDistributionByCategoryDTO | null = null;
    kpiEvolution: KpiEvolutionByCategoryDTO[] = [];
    activityTypeCounts: ActivityTypeCounts | null = null;
    sprintKpiStatistics: SprintKpiStatistics[] = []; // NEW

    // UI state
    expandedSections: { [key: string]: boolean } = {
        evolution: false,
        realisation: false,
        performance: false,
        distribution: false,
        sprintKpi: false, // NEW - default open
        activityTypes: true, // NEW - default open
    };
    
    tooltipData: {
        date: string;
        values: { name: string; value: number; color: string }[];
    } | null = null;
    tooltipPosition: { x: number; y: number } = { x: 0, y: 0 };
    hoveredDateIndex: number | null = null;
    
    // Chart dimensions
    readonly chartWidth = 700;
    readonly chartHeight = 300;
    readonly chartPadding = { top: 30, right: 50, bottom: 50, left: 60 };

    constructor(
        private route: ActivatedRoute,
        private dashboardService: ProgrammeDashboardService,
    ) {}

    ngOnInit(): void {
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
            this.programmeId = +params['id'];
            if (this.programmeId) {
                this.loadDashboardData();
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadDashboardData(): void {
        this.loading = true;
        this.error = null;

        this.dashboardService
            .getDashboardData(this.programmeId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.taskRealization = data.taskRealization;
                    this.globalKpiPerformance = data.globalKpiPerformance;
                    this.kpiDistribution = data.kpiDistribution;
                    this.kpiEvolution = data.kpiEvolution;
                    this.activityTypeCounts = data.activityTypeCounts;
                    this.sprintKpiStatistics = data.sprintKpiStatistics; // NEW
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Error loading dashboard data:', err);
                    this.error =
                        'Impossible de charger les données du tableau de bord. Veuillez réessayer.';
                    this.loading = false;
                },
            });
    }

    toggleSection(section: string): void {
        this.expandedSections[section] = !this.expandedSections[section];
    }

    getOverallCompletionRate(): number {
        if (!this.taskRealization || this.taskRealization.totalTasks === 0) {
            return 0;
        }
        return Math.round(
            (this.taskRealization.totalCompletedTasks /
                this.taskRealization.totalTasks) *
                100,
        );
    }

    getMaxTasks(): number {
        if (
            !this.taskRealization ||
            this.taskRealization.categories.length === 0
        ) {
            return 100;
        }
        const maxTasks = Math.max(
            ...this.taskRealization.categories.map((cat) => cat.totalTasks),
        );
        return Math.ceil(maxTasks / 5) * 5;
    }

    getBarHeight(taskCount: number): number {
        const maxHeight = 260;
        const maxTasks = this.getMaxTasks();
        return (taskCount / maxTasks) * maxHeight;
    }

    truncateLabel(label: string, maxLength: number = 12): string {
        if (label.length <= maxLength) {
            return label;
        }
        return label.substring(0, maxLength - 3) + '...';
    }

    getTopCategories(): CategoryTaskStats[] {
        if (!this.taskRealization) {
            return [];
        }
        return this.taskRealization.categories
            .slice()
            .sort((a, b) => b.totalTasks - a.totalTasks)
            .slice(0, 4);
    }

    getDonutSegments(): DonutSegment[] {
        if (!this.kpiDistribution || this.kpiDistribution.totalKpis === 0) {
            return [];
        }

        const circumference = 2 * Math.PI * 60;
        let cumulativeOffset = 0;
        const segments: DonutSegment[] = [];

        this.kpiDistribution.categories.forEach((category) => {
            const percentage = category.count / this.kpiDistribution!.totalKpis;
            const dashLength = circumference * percentage;

            segments.push({
                color: category.categoryColor,
                dashArray: `${dashLength} ${circumference - dashLength}`,
                dashOffset: -cumulativeOffset,
            });

            cumulativeOffset += dashLength;
        });

        return segments;
    }

    hasEvolutionData(): boolean {
        return (
            this.kpiEvolution.length > 0 &&
            this.kpiEvolution.some((cat) => cat.dataPoints.length > 0)
        );
    }

    getCategoriesWithData(): KpiEvolutionByCategoryDTO[] {
        return this.kpiEvolution.filter((cat) => cat.dataPoints.length > 0);
    }

    getEvolutionYAxisLabels(): number[] {
        return [100, 75, 50, 25, 0];
    }

    getEvolutionXAxisLabels(): string[] {
        if (!this.hasEvolutionData()) {
            return ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
        }

        const allDates = new Set<string>();
        this.kpiEvolution.forEach((cat) => {
            cat.dataPoints.forEach((point) => allDates.add(point.date));
        });

        const sortedDates = Array.from(allDates).sort();

        return sortedDates.map((dateStr) => {
            const date = new Date(dateStr);
            const months = [
                'Jan',
                'Fév',
                'Mar',
                'Avr',
                'Mai',
                'Juin',
                'Juil',
                'Août',
                'Sep',
                'Oct',
                'Nov',
                'Déc',
            ];
            return months[date.getMonth()];
        });
    }

    getEvolutionChartPoints(category: KpiEvolutionByCategoryDTO): ChartPoint[] {
        if (category.dataPoints.length === 0) {
            return [];
        }

        const allDates = this.getAllEvolutionDates();
        const plotWidth =
            this.chartWidth - this.chartPadding.left - this.chartPadding.right;
        const plotHeight =
            this.chartHeight - this.chartPadding.top - this.chartPadding.bottom;

        return category.dataPoints.map((point) => {
            const dateIndex = allDates.indexOf(point.date);
            const xPosition =
                this.chartPadding.left +
                (dateIndex / Math.max(allDates.length - 1, 1)) * plotWidth;

            const cappedRate = Math.min(point.achievementRate, 250);
            const yPosition =
                this.chartPadding.top +
                plotHeight -
                (cappedRate / 100) * plotHeight;

            return { x: xPosition, y: yPosition };
        });
    }

    getEvolutionPolylinePoints(category: KpiEvolutionByCategoryDTO): string {
        const points = this.getEvolutionChartPoints(category);
        return points.map((p) => `${p.x},${p.y}`).join(' ');
    }

    getEvolutionAreaPoints(category: KpiEvolutionByCategoryDTO): string {
        const points = this.getEvolutionChartPoints(category);
        if (points.length === 0) return '';

        const plotHeight = this.chartHeight - this.chartPadding.bottom;
        const firstX = points[0].x;
        const lastX = points[points.length - 1].x;

        const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
        return `${firstX},${plotHeight} ${linePoints} ${lastX},${plotHeight}`;
    }

    private getAllEvolutionDates(): string[] {
        const allDates = new Set<string>();
        this.kpiEvolution.forEach((cat) => {
            cat.dataPoints.forEach((point) => allDates.add(point.date));
        });
        return Array.from(allDates).sort();
    }

    getXAxisPosition(index: number, total: number): number {
        const plotWidth =
            this.chartWidth - this.chartPadding.left - this.chartPadding.right;
        return (
            this.chartPadding.left +
            (index / Math.max(total - 1, 1)) * plotWidth
        );
    }

    getTooltipData(
        dateIndex: number,
    ): {
        date: string;
        values: { name: string; value: number; color: string }[];
    } | null {
        const allDates = this.getAllEvolutionDates();
        if (dateIndex >= allDates.length) return null;

        const date = allDates[dateIndex];
        const formattedDate = this.getEvolutionXAxisLabels()[dateIndex];

        const values = this.getCategoriesWithData()
            .map((cat) => {
                const point = cat.dataPoints.find((p) => p.date === date);
                if (point) {
                    return {
                        name: cat.categoryName,
                        value: point.achievementRate,
                        color: cat.categoryColor,
                    };
                }
                return null;
            })
            .filter(
                (
                    item,
                ): item is { name: string; value: number; color: string } =>
                    item !== null,
            );

        if (values.length === 0) return null;

        return { date: formattedDate, values };
    }

    onHoverDate(index: number, event: MouseEvent) {
        const data = this.getTooltipData(index);
        if (!data) return;

        this.hoveredDateIndex = index;
        this.tooltipData = data;
        this.tooltipPosition = { x: event.clientX, y: event.clientY };
    }

    onLeaveChart() {
        this.tooltipData = null;
        this.hoveredDateIndex = null;
    }

    getActivityTypeKeys(): string[] {
        return this.activityTypeCounts ? Object.keys(this.activityTypeCounts) : [];
    }

    // NEW: Format number with thousand separators
    formatNumber(num: number): string {
        return num.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    }

    // NEW: Get gradient color for sprint (cycling through gradients)
    getSprintGradient(index: number): string {
        const gradients = [
            'linear-gradient(135deg, #2979ff 0%, #448aff 100%)', // blue
            'linear-gradient(135deg, #00838f 0%, #0097a7 100%)', // teal
            'linear-gradient(135deg, #d81b60 0%, #e91e63 100%)', // pink
            'linear-gradient(135deg, #6a1b4d 0%, #880e4f 100%)', // burgundy
            'linear-gradient(135deg, #7c4dff 0%, #9c27b0 100%)', // purple
            'linear-gradient(135deg, #ff6f00 0%, #ff9800 100%)', // orange
        ];
        return gradients[index % gradients.length];
    }

    // NEW: Get total KPI count across all sprints
    getTotalKpiCount(): number {
        if (!this.sprintKpiStatistics) return 0;
        return this.sprintKpiStatistics.reduce(
            (total, sprint) => total + sprint.kpiStatistics.length,
            0
        );
    }

    // NEW: Calculate KPI bar width relative to max value in sprint
    getKpiBarWidth(kpi: any, sprint: SprintKpiStatistics): number {
        const maxValue = Math.max(
            ...sprint.kpiStatistics.map(k => k.totalValeur),
            1
        );
        return Math.min((kpi.totalValeur / maxValue) * 100, 100);
    }

    // NEW: Get total activities count across all types
    getTotalActivitiesCount(): number {
        if (!this.activityTypeCounts) return 0;
        return Object.values(this.activityTypeCounts).reduce(
            (total, count) => total + count,
            0
        );
    }

    // NEW: Get gradient for activity cards
    getActivityGradient(index: number): string {
        const gradients = [
            'linear-gradient(135deg, #7c4dff 0%, #9c27b0 100%)', // purple
            'linear-gradient(135deg, #00838f 0%, #0097a7 100%)', // teal
            'linear-gradient(135deg, #ff6f00 0%, #ff9800 100%)', // orange
            'linear-gradient(135deg, #d81b60 0%, #e91e63 100%)', // pink
            'linear-gradient(135deg, #2979ff 0%, #448aff 100%)', // blue
            'linear-gradient(135deg, #6a1b4d 0%, #880e4f 100%)', // burgundy
        ];
        return gradients[index % gradients.length];
    }

    // NEW: Calculate activity bar width relative to max count
    getActivityBarWidth(key: string): number {
        if (!this.activityTypeCounts) return 0;
        const maxCount = Math.max(
            ...Object.values(this.activityTypeCounts),
            1
        );
        return Math.min((this.activityTypeCounts[key] / maxCount) * 100, 100);
    }




    // Add these two methods to DashboardProgramComponent

getBarChartWidth(): number {
    if (!this.taskRealization) return 400;
    const count = this.taskRealization.categories.length;
    // Minimum width of 300, each category needs ~150px, cap at reasonable max
    return Math.max(count * 150 + 100, 300);
}

getBarChartMaxWidth(): string {
    if (!this.taskRealization) return '400px';
    const count = this.taskRealization.categories.length;
    if (count <= 2) return `${count * 200}px`;
    return '100%';
}
}