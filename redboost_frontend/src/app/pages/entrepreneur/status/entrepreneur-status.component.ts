import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
    selector: 'rb-entrepreneur-status',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    template: `
    <div class="p-6 bg-background min-h-screen">
      <div class="mb-8">
        <h1 class="text-3xl font-black text-foreground tracking-tight">Mon Statut</h1>
        <p class="text-muted-foreground mt-1">Vue d'ensemble de votre progression et score de santé</p>
      </div>

      <!-- Health Score -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="md:col-span-1 bg-card rounded-3xl p-8 shadow-xl border border-border text-center">
          <p class="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Score Global</p>
          <div class="relative w-32 h-32 mx-auto mb-4">
            <svg class="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="8" class="text-muted/30"/>
              <circle cx="60" cy="60" r="52" fill="none" [attr.stroke]="scoreColor()" stroke-width="8"
                [attr.stroke-dasharray]="326.7" [attr.stroke-dashoffset]="326.7 - (326.7 * healthScore() / 100)"
                stroke-linecap="round" class="transition-all duration-1000"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-4xl font-black" [style.color]="scoreColor()">{{ healthScore() }}</span>
            </div>
          </div>
          <p class="text-sm font-bold" [style.color]="scoreColor()">
            {{ healthScore() >= 75 ? 'Excellent' : healthScore() >= 50 ? 'Bon' : 'À améliorer' }}
          </p>
        </div>

        <div class="md:col-span-2 grid grid-cols-2 gap-4">
          @for (metric of metrics(); track metric.label) {
            <div class="rounded-2xl p-5 text-white relative overflow-hidden shadow-xl" [style.background]="metric.gradient">
              <div class="absolute -right-4 -top-4 rounded-full w-20 h-20 bg-white/10"></div>
              <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <i class="pi pi-{{metric.icon}} text-xl"></i>
              </div>
              <p class="text-[10px] font-bold tracking-widest opacity-80 uppercase mb-1">{{ metric.label }}</p>
              <h3 class="text-3xl font-black leading-none mb-1">{{ metric.value }}%</h3>
              <p class="text-xs opacity-70">{{ metric.sub }}</p>
            </div>
          }
        </div>
      </div>

      <!-- Breakdown -->
      <div class="bg-card rounded-3xl p-6 shadow-sm border border-border">
        <h2 class="text-lg font-black text-foreground mb-6 flex items-center gap-2">
          <i class="pi pi-chart-bar text-primary"></i>
          Détail par critère
        </h2>
        <div class="space-y-4">
          @for (metric of metrics(); track metric.label) {
            <div class="flex items-center gap-4">
              <span class="text-xs font-bold text-muted-foreground w-32">{{ metric.label }}</span>
              <div class="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700" [style.width.%]="metric.value" [style.background]="metric.gradient"></div>
              </div>
              <span class="text-sm font-black w-12 text-right" [style.color]="metric.value >= 75 ? '#22c55e' : metric.value >= 50 ? '#f97316' : '#ef4444'">{{ metric.value }}%</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
    styles: [`:host { display: block; }`]
})
export class EntrepreneurStatusComponent implements OnInit {
  private authSvc = inject(AuthService);
  private dashboardSvc = inject(DashboardService);

  healthScore = signal(0);
  metrics = signal<any[]>([]);

  scoreColor() {
    const v = this.healthScore();
    if (v >= 75) return '#22c55e';
    if (v >= 50) return '#f97316';
    return '#ef4444';
  }

  ngOnInit() {
    const user = this.authSvc.currentUser$.value;
    if (user) {
      this.dashboardSvc.getKpis('entrepreneur').subscribe((data: any) => {
        const taskPct = data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0;
        const livPct = data.totalLivrables > 0 ? Math.round((data.approvedLivrables / data.totalLivrables) * 100) : 0;
        const sessPct = data.totalSessions > 0 ? Math.round((data.completedSessions / data.totalSessions) * 100) : 0;

        this.metrics.set([
          { label: 'Tâches', value: taskPct, sub: `${data.completedTasks || 0} / ${data.totalTasks || 0}`, icon: 'list', gradient: 'linear-gradient(135deg,#a17dfd,#7B52D3)' },
          { label: 'Livrables', value: livPct, sub: `${data.approvedLivrables || 0} approuvés`, icon: 'file-check', gradient: 'linear-gradient(135deg,#22c55e,#16a34a)' },
          { label: 'Sessions', value: sessPct, sub: `${data.completedSessions || 0} terminées`, icon: 'video', gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
          { label: 'Participation', value: Math.min(100, taskPct + livPct + sessPct > 0 ? Math.round((taskPct + livPct + sessPct) / 3) : 0), sub: 'Engagement global', icon: 'chart-line', gradient: 'linear-gradient(135deg,#f97316,#ea580c)' },
        ]);

        this.healthScore.set(data.healthScore || Math.round((taskPct + livPct + sessPct) / 3));
      });
    }
  }
}
