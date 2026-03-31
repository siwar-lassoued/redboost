import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CandidatureService } from '../services/candidature.service';
import { Candidature, CandidatureStatus } from '../models/candidature.model';
import { CandidatureLog } from '../services/candidature.service';
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
  filterType    = signal('all');

  allCandidatures = signal<Candidature[]>([]);
  selected        = signal<Candidature|null>(null);
  showRejectModal = signal(false);
  motifRejet      = '';

  orderedSteps: CandidatureStatus[] = ['EN_ATTENTE', 'EN_COURS_EVALUATION', 'PRE_SELECTIONNE', 'ACCEPTE'];

  modalTab = signal<'detail' | 'historique'>('detail');
  historiqueLogs = signal<CandidatureLog[]>([]);

  // Email & User Generation Process Modal
  showProcessModal = signal(false);
  processAction = signal<'ACCEPTE' | 'REJETE'>('ACCEPTE');
  processEmailContent = signal('');
  processSubject = signal('');
  createAccount = signal(true);
  processLoading = signal(false);

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
      if (this.filterType() !== 'all') {
          const profile = this.getDeductedProfile(c);
          if (this.filterType() === 'coaches' && profile !== 'coaches') return false;
          if (this.filterType() === 'entrepreneurs' && profile !== 'entrepreneurs') return false;
      }
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

  openDetail(c: Candidature): void {
    this.selected.set(c);
    this.modalTab.set('detail');
  }

  loadHistorique(): void {
    const id = this.selected()?.id;
    if (!id) return;
    this.svc.getHistorique(id).subscribe({
      next: (logs) => this.historiqueLogs.set(logs),
      error: () => this.historiqueLogs.set([])
    });
  }

  getAnswerIcon(type: string): string {
    switch (type) {
      case 'text-court': return 'file-text';
      case 'text-long':  return 'file-text';
      case 'qcm':        return 'check-circle';
      case 'qcu':        return 'check-circle';
      case 'upload':     return 'download';
      default:           return 'clipboard-list';
    }
  }

  isObject(val: any): boolean { return typeof val === 'object' && val !== null && !Array.isArray(val); }
  isArray(val: any): boolean { return Array.isArray(val); }
  asFile(val: any): { name: string; size: string } { return val as { name: string; size: string }; }
  asArray(val: any): string[] { return val as string[]; }
  getNote(): string | null { return (this.selected() as any)?.noteInterne || null; }
  getMotif(): string | null { return (this.selected() as any)?.motifRejet || null; }
  
  getLogColor(statut: string): { bg: string; color: string } {
    const cfg = (STATUS_CONFIG.candidature as any)[statut];
    return cfg || { bg: '#F3F4F6', color: '#6B7280' };
  }

  openProcessModal(action: 'ACCEPTE' | 'REJETE'): void {
    this.processAction.set(action);
    const c = this.selected();
    const name = c?.nom || 'Candidat';
    const program = c?.programme || 'notre programme';

    if (action === 'ACCEPTE') {
        this.processSubject.set('Félicitations ! Votre candidature est acceptée');
        this.processEmailContent.set(`Bonjour ${name},\n\nNous avons le plaisir de vous informer que votre candidature au programme ${program} a été acceptée avec succès !\n\nL'équipe Redboost.`);
        this.createAccount.set(true);
    } else {
        this.processSubject.set('Mise à jour concernant votre candidature');
        this.processEmailContent.set(`Bonjour ${name},\n\nNous vous remercions pour l'intérêt que vous avez porté au programme ${program}. Malheureusement, suite à une sélection très compétitive, nous ne pouvons retenir votre candidature pour cette édition.\n\nNous vous souhaitons une très bonne continuation dans vos projets.\n\nL'équipe Redboost.`);
        this.createAccount.set(false);
    }
    this.showProcessModal.set(true);
  }

  closeProcessModal(): void {
    this.showProcessModal.set(false);
  }

  confirmProcessStatus(): void {
    const s = this.selected();
    if (!s) return;
    this.processLoading.set(true);
    this.svc.processStatus(s.id, this.processAction(), this.processEmailContent(), this.processSubject(), this.createAccount()).subscribe({
        next: () => {
            this.processLoading.set(false);
            this.showProcessModal.set(false);
            this.selected.set(null);
            this.loadCandidatures();
        },
        error: (err) => {
            this.processLoading.set(false);
            console.error('Process error:', err);
            alert('Erreur: ' + (err.error?.message || err.message));
        }
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

  getDeductedProfile(c: Candidature): 'coaches' | 'entrepreneurs' | 'spontanees' {
    if (c.type === 'coaches') return 'coaches';
    if (c.type === 'entrepreneurs') return 'entrepreneurs';
    
    const profileAnswer = c.formAnswers?.find((a: any) =>
      a.question && a.question.toLowerCase().includes('coach') && a.question.toLowerCase().includes('entrepreneur')
    );
    if (profileAnswer) {
        let val = profileAnswer.answer;
        if (Array.isArray(val)) val = val[0];
        if (typeof val === 'string') {
           if (val.toLowerCase().includes('coach')) return 'coaches';
           if (val.toLowerCase().includes('entrepreneur')) return 'entrepreneurs';
        }
    }
    return c.type as any || 'spontanees';
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