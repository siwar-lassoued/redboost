import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CandidatureService } from '../services/candidature.service';
import { Candidature, CandidatureStatus } from '../models/candidature.model';
import { STATUS_CONFIG } from '../constants/colors.constants';

@Component({
  selector: 'rb-admin-historique',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin_historique.html',
  styleUrls: ['./admin_historique.scss'],
})
export class AdminHistoriqueComponent implements OnInit {
  private svc = inject(CandidatureService);

  searchTerm    = signal('');
  filterStatus  = signal('all');

  allCandidatures = signal<Candidature[]>([]);
  selected        = signal<Candidature|null>(null);
  showRejectModal = signal(false);
  motifRejet      = '';

  orderedSteps: CandidatureStatus[] = ['EN_ATTENTE', 'EN_COURS_EVALUATION', 'PRE_SELECTIONNE', 'ACCEPTE'];

  // KPIs — updated via statistics
  kpiTotal       = signal(0);
  kpiEnAttente   = signal(0);
  kpiEnEvaluation = signal(0);
  kpiPreselected  = signal(0);
  kpiAccepted    = signal(0);
  kpiRejected    = signal(0);

  filtered = computed(() => {
    return this.allCandidatures().filter(c => {
      const q = this.searchTerm().toLowerCase();
      if (q && !c.nom.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      if (this.filterStatus() !== 'all' && c.statut !== this.filterStatus()) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.loadCandidatures();
  }

  loadCandidatures(): void {
    // 1. Get stats for KPIs
    this.svc.getStatistics().subscribe(stats => {
      this.kpiTotal.set(stats['total'] || 0);
      this.kpiEnAttente.set(stats['en_attente'] || 0);
      this.kpiEnEvaluation.set(stats['en_cours_evaluation'] || 0);
      this.kpiPreselected.set(stats['pre_selectionne'] || 0);
      this.kpiAccepted.set(stats['accepte'] || 0);
      this.kpiRejected.set(stats['rejete'] || 0);
    });

    // 2. Load list with a more reasonable size if possible, or keep 1000 but optimize backend
    this.svc.getAll({ limit: 200 }).subscribe({
      next: r => this.allCandidatures.set(r.data || []),
      error: () => this.allCandidatures.set([])
    });
  }

  getJourneySteps(c: Candidature): JourneyStep[] {
    const steps: JourneyStep[] = [
      { statut:'EN_ATTENTE', label:'Soumission', description:'Candidature reçue via le formulaire', reached:true, current:false, date:c.submittedAt, note:null },
      { statut:'EN_COURS_EVALUATION', label:'En évaluation', description:'Dossier examiné par l\'équipe', reached:false, current:false, date:null, note:null },
      { statut:'PRE_SELECTIONNE', label:'Pré-sélection', description:'Présélection pour le round suivant', reached:false, current:false, date:null, note:null },
    ];
    const idx = this.orderedSteps.indexOf(c.statut as CandidatureStatus);
    for (let i = 0; i < steps.length; i++) {
      const si = this.orderedSteps.indexOf(steps[i].statut as CandidatureStatus);
      steps[i].reached = c.statut === 'REJETE' ? i === 0 : (si <= idx);
      steps[i].current = steps[i].statut === c.statut;
    }
    if (c.statut === 'ACCEPTE') {
      steps.push({ statut:'ACCEPTE', label:'Acceptée ✅', description:'Candidature acceptée', reached:true, current:true, date:c.dateAcceptation, note:c.noteInterne ?? null });
    } else if (c.statut === 'REJETE') {
      steps.push({ statut:'REJETE', label:'Rejetée ❌', description:'Candidature non retenue', reached:true, current:true, date:null, note:c.motifRejet ?? null });
    }
    return steps;
  }

  getStatusCfg(s: string) {
    return (STATUS_CONFIG.candidature as any)?.[s] || { bg:'#F3F4F6', color:'#6B7280', label: s || 'Inconnu' };
  }

  isStepReached(c: Candidature, step: CandidatureStatus): boolean {
    if (c.statut === 'REJETE') return step === 'EN_ATTENTE';
    const ci = this.orderedSteps.indexOf(c.statut as CandidatureStatus);
    const si = this.orderedSteps.indexOf(step);
    return ci >= 0 && si <= ci;
  }

  getStepColor(step: string): string {
    const m: Record<string,string> = {
      EN_ATTENTE:'#9CA3AF', EN_COURS_EVALUATION:'#3AAFFF',
      PRE_SELECTIONNE:'#FF6F00', ACCEPTE:'#11998E', REJETE:'#C0392B'
    };
    return m[step] || '#9CA3AF';
  }

  formatDate(d: string|Date|undefined|null): string {
    if (!d) return '—';
    try { const dt = new Date(d); return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }); } catch { return String(d); }
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  openDetail(c: Candidature): void { this.selected.set(c); }

  onAccept(): void {
    const s = this.selected();
    if (!s) return;
    this.svc.accept(s.id).subscribe({
      next: () => { this.loadCandidatures(); this.selected.set(null); },
      error: (err) => alert('Erreur: ' + (err.error?.message || err.message || 'Echec'))
    });
  }

  onReject(): void {
    const s = this.selected();
    if (!s || !this.motifRejet.trim()) return;
    this.svc.reject(s.id, this.motifRejet.trim()).subscribe({
      next: () => { this.loadCandidatures(); this.selected.set(null); this.showRejectModal.set(false); this.motifRejet = ''; },
      error: (err) => alert('Erreur: ' + (err.error?.message || err.message || 'Echec'))
    });
  }

  onChangeStatut(newStatut: CandidatureStatus): void {
    const s = this.selected();
    if (!s) return;
    this.svc.updateStatut(s.id, { statut: newStatut }).subscribe({
      next: () => { this.loadCandidatures(); this.selected.set(null); },
      error: (err) => alert('Erreur: ' + (err.error?.message || err.message || 'Transition non autorisée'))
    });
  }

  exportExcel(): void {
    const rows = this.filtered();
    const csv = 'Nom,Email,Statut,Date\n' +
      rows.map(c => `"${c.nom}","${c.email}","${c.statut}","${c.submittedAt||''}"`).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'historique_candidatures.csv';
    a.click();
  }
}

interface JourneyStep {
  statut: string;
  label: string;
  description: string;
  reached: boolean;
  current: boolean;
  date: any;
  note: string | null;
}