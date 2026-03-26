import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CandidatureService } from '../services/candidature.service';
import { ProgrammeService } from '../services/programme.service';
import { SelectionRoundService } from '../services/selection-round.service';
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
  private svc      = inject(CandidatureService);
  private progSvc  = inject(ProgrammeService);
  private roundSvc = inject(SelectionRoundService);

  searchTerm    = signal('');
  filterProgram = signal('all');
  filterStatus  = signal('all');
  filterProfile = signal<'coaches'|'entrepreneurs'>('coaches');
  activeRound   = signal(0);

  allCandidatures = signal<Candidature[]>([]);
  programs        = signal<any[]>([]);
  roundNumbers    = signal<number[]>([1, 2, 3]);
  selected        = signal<Candidature|null>(null);
  showRejectModal = signal(false);
  motifRejet      = '';

  private readonly HISTORIQUE_STATUSES = ['PRESELECTIONNE','ACCEPTE','REJETE'];
  orderedSteps: CandidatureStatus[] = ['EN_ATTENTE','EN_REVISION','ENTRETIEN','PRESELECTIONNE','ACCEPTE'];

  allHistorique = computed(() =>
    this.allCandidatures().filter(c => this.HISTORIQUE_STATUSES.includes(c.statut))
  );

  kpiTotal       = computed(() => this.allHistorique().length);
  kpiAccepted    = computed(() => this.allHistorique().filter(c => c.statut==='ACCEPTE').length);
  kpiPreselected = computed(() => this.allHistorique().filter(c => c.statut==='PRESELECTIONNE').length);
  kpiRejected    = computed(() => this.allHistorique().filter(c => c.statut==='REJETE').length);

  filtered = computed(() => {
    return this.allHistorique().filter(c => {
      const q = this.searchTerm().toLowerCase();
      if (q && !c.nom.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      if (this.filterStatus()!=='all' && c.statut!==this.filterStatus()) return false;
      if (c.type!==this.filterProfile()) return false;
      if (this.filterProgram()!=='all' && c.programme!==this.filterProgram()) return false;
      if (this.activeRound() > 0) {
        const stepIdx = this.orderedSteps.indexOf(c.statut as CandidatureStatus);
        const candidateRound = c.statut === 'REJETE' ? 1 : (stepIdx >= 0 ? stepIdx + 1 : 1);
        if (candidateRound < this.activeRound()) return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.progSvc.getAll().subscribe((r: any) => this.programs.set(r.data || []));
    this.loadCandidatures();
    this.loadRounds();
  }

  loadCandidatures(): void {
    this.svc.getAll({}).subscribe(r => this.allCandidatures.set(r.data || []));
  }

  loadRounds(): void {
    const progs = this.programs();
    if (progs.length > 0) {
      this.roundSvc.getRoundsForProgramme(progs[0].id).subscribe({
        next: (rounds) => {
          if (rounds.length > 0) {
            const nums = [...new Set(rounds.map(r => r.roundNumber))].sort();
            this.roundNumbers.set(nums);
          }
        },
        error: () => {}
      });
    }
  }

  getJourneySteps(c: Candidature): JourneyStep[] {
    const steps: JourneyStep[] = [
      { statut:'EN_ATTENTE', label:'Soumission', description:'Candidature reçue via le formulaire', reached:true, current:false, date:c.submittedAt, note:null },
      { statut:'EN_REVISION', label:'En révision', description:'Dossier examiné par l\'équipe', reached:false, current:false, date:null, note:null },
      { statut:'ENTRETIEN', label:'Entretien', description:'Candidat convoqué pour entretien', reached:false, current:false, date:c.dateEntretien, note:c.compteRenduEntretien ?? null },
      { statut:'PRESELECTIONNE', label:'Pré-sélection', description:'Présélection pour le round suivant', reached:false, current:false, date:null, note:null },
    ];
    const idx = this.orderedSteps.indexOf(c.statut as CandidatureStatus);
    for (let i = 0; i < steps.length; i++) {
      const si = this.orderedSteps.indexOf(steps[i].statut as CandidatureStatus);
      steps[i].reached = c.statut === 'REJETE' ? i === 0 : (si <= idx);
      steps[i].current = steps[i].statut === c.statut;
    }
    if (c.statut === 'ACCEPTE') {
      steps.push({ statut:'ACCEPTE', label:'Acceptée ✅', description:'Compte utilisateur créé', reached:true, current:true, date:c.dateAcceptation, note:c.noteInterne ?? null });
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
      EN_ATTENTE:'#9CA3AF', EN_REVISION:'#3AAFFF', ENTRETIEN:'#A17DFD',
      PRESELECTIONNE:'#FF6F00', ACCEPTE:'#11998E', REJETE:'#C0392B'
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

  exportExcel(): void {
    const rows = this.filtered();
    const csv = 'Nom,Email,Profil,Programme,Statut,Date\n' +
      rows.map(c => `"${c.nom}","${c.email}","${c.type}","${c.programme||''}","${c.statut}","${c.submittedAt||''}"`).join('\n');
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