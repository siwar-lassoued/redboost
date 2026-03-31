import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CandidatureService, CandidatureLog } from '../services/candidature.service';
import { Candidature, CandidatureStatus, FormAnswer, CANDIDATURE_STATUTS } from '../models/candidature.model';
import { RouterModule } from '@angular/router';
import { AdminFormLauncherComponent } from './components/admin-form-launcher.component';
import { STATUS_CONFIG } from '../constants/colors.constants';
import { SelectionRoundService } from '../services/selection-round.service';

type TabType = 'coaches' | 'entrepreneurs' | 'spontanees';

@Component({
  selector: 'app-admin-candidatures',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule, AdminFormLauncherComponent],
  templateUrl: './admin_candidature.html',
  styleUrls: ['./admin_candidature.scss'],
})
export class AdminCandidaturesComponent implements OnInit {
  private svc = inject(CandidatureService);
  private roundSvc = inject(SelectionRoundService);

  activeTab = signal<TabType>('coaches');
  searchQuery = '';
  statusFilter = 'ALL';
  filterProgram = 'all';
  profileFilter = 'all';
  modalTab = signal<'detail' | 'historique'>('detail');

  tabs = [
    { id: 'coaches' as TabType, label: 'Coaches' },
    { id: 'entrepreneurs' as TabType, label: 'Entrepreneurs' },
    { id: 'spontanees' as TabType, label: 'Spontanées' }
  ];

  candidatures = signal<Candidature[]>([]);
  allCandidatures = signal<Candidature[]>([]);
  selected = signal<Candidature | null>(null);
  showDetail = signal(false);
  showFormLauncher = signal(false);
  formLauncherStartStep = signal<'choice' | 'templates'>('choice');
  statuts = CANDIDATURE_STATUTS;
  programmes = signal<string[]>([]);
  historiqueLogs = signal<CandidatureLog[]>([]);

  coachCount = signal(0);
  entCount = signal(0);
  spontCount = signal(0);

  // Email & User Generation Process Modal
  showProcessModal = signal(false);
  processAction = signal<'ACCEPTE' | 'REJETE'>('ACCEPTE');
  processEmailContent = signal('');
  processSubject = signal('');
  createAccount = signal(true);
  processLoading = signal(false);

  acceptingIds = new Set<string>();

  ngOnInit(): void {
    this.loadAll();
  }

  private readonly ACTIVE_STATUSES = ['EN_ATTENTE', 'EN_COURS_EVALUATION', 'PRE_SELECTIONNE'];

  loadAll(): void {
    this.svc.getStatistics().subscribe(stats => {
      this.coachCount.set(stats['coaches'] || 0);
      this.entCount.set(stats['entrepreneurs'] || 0);
      this.spontCount.set(stats['spontanees'] || 0);
    });
    this.load();
  }

  load(): void {
    this.svc.getAll({
      type: this.activeTab(),
      limit: 100,
      search: this.searchQuery || undefined,
      statut: this.statusFilter === 'ALL' ? undefined : this.statusFilter as CandidatureStatus
    }).subscribe(r => {
      let data = r.data || [];
      if (this.filterProgram !== 'all') {
        data = data.filter(c => c.programme === this.filterProgram);
      }
      if (this.statusFilter !== 'HISTORIQUE') {
        data = data.filter(c => this.ACTIVE_STATUSES.includes(c.statut));
      }
      // Profile filter for Spontanées tab
      if (this.activeTab() === 'spontanees' && this.profileFilter !== 'all') {
        data = data.filter(c => {
          const profile = this.getDeductedProfile(c);
          if (this.profileFilter === 'Coach') return profile === 'coaches';
          if (this.profileFilter === 'Entrepreneur') return profile === 'entrepreneurs';
          return true;
        });
      }
      this.candidatures.set(data);
      const progs = [...new Set((r.data || []).map(c => c.programme).filter(Boolean))] as string[];
      this.programmes.set(progs);
    });
  }

  onTabChange(tabId: TabType): void {
    this.activeTab.set(tabId);
    this.searchQuery = '';
    this.statusFilter = 'ALL';
    this.filterProgram = 'all';
    this.profileFilter = 'all';
    this.load();
  }

  openFormLauncher(step: 'choice' | 'templates'): void {
    this.formLauncherStartStep.set(step);
    this.showFormLauncher.set(true);
  }

  onViewDetail(c: Candidature): void {
    this.selected.set(c);
    this.modalTab.set('detail');
    this.showDetail.set(true);
  }

  advanceRound(): void {
    if (this.filterProgram === 'all') return;
    if (confirm('Êtes-vous sûr de vouloir clôturer le round actuel pour le programme sélectionné ?')) {
      this.roundSvc.advanceRound(this.filterProgram).subscribe({
        next: () => { alert('Le round a été clôturé avec succès.'); this.loadAll(); },
        error: (err: any) => { console.error(err); alert('Erreur lors de la clôture du round.'); }
      });
    }
  }

  onChangeStatut(newStatut: CandidatureStatus): void {
    const id = this.selected()?.id;
    if (!id) return;
    this.svc.updateStatut(id, { statut: newStatut }).subscribe({
      next: () => { this.showDetail.set(false); this.loadAll(); },
      error: (err) => { console.error('Status update failed:', err); alert('Erreur: ' + (err.error?.message || err.message || 'Transition non autorisée')); }
    });
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
    const id = this.selected()?.id;
    if (!id) return;
    this.processLoading.set(true);
    this.svc.processStatus(id, this.processAction(), this.processEmailContent(), this.processSubject(), this.createAccount()).subscribe({
        next: () => {
            this.processLoading.set(false);
            this.showProcessModal.set(false);
            this.showDetail.set(false);
            this.loadAll();
            // Optional: you can add a toast notification here
        },
        error: (err) => {
            this.processLoading.set(false);
            console.error('Process error:', err);
            alert('Erreur: ' + (err.error?.message || err.message));
        }
    });
  }

  onCleanupAnonymous(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement toutes les candidatures anonymes (sans nom ou sans email) ?')) {
      this.svc.cleanupAnonymous().subscribe({
        next: (res) => {
          alert(res.message || 'Nettoyage terminé avec succès');
          this.loadAll();
        },
        error: (err) => {
          console.error('Cleanup failed:', err);
          alert('Erreur: ' + (err.error?.message || err.message || 'Échec du nettoyage'));
        }
      });
    }
  }

  migrateLegacy(): void {
    if (confirm('Voulez-vous migrer tous les anciens statuts (REFUSE, REVISION...) vers les nouveaux statuts standardisés ?')) {
      this.svc.migrateLegacy().subscribe({
        next: (res) => {
          alert(res.message || 'Migration des statuts terminée avec succès');
          this.loadAll();
        },
        error: (err) => {
          console.error('Migration failed:', err);
          alert('Erreur lors de la migration des statuts');
        }
      });
    }
  }

  loadHistorique(): void {
    const id = this.selected()?.id;
    if (!id) return;
    this.svc.getHistorique(id).subscribe({
      next: (logs) => this.historiqueLogs.set(logs),
      error: () => this.historiqueLogs.set([])
    });
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

  isCoach(c: Candidature): boolean { return this.getDeductedProfile(c) === 'coaches'; }
  getInitials(c: Candidature): string { if (!c?.nom) return '??'; return c.nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(); }

  getAnswerIcon(type: string): string {
    switch (type) { case 'text-court': case 'text-long': return 'file-text'; case 'qcm': case 'qcu': return 'circle-check'; case 'upload': return 'download'; default: return 'clipboard-list'; }
  }

  getStatusCfg(c: Candidature): { bg: string; color: string; label: string } {
    return (STATUS_CONFIG.candidature as any)[c.statut] || { bg: '#F3F4F6', color: '#6B7280', label: c.statut || 'Inconnu' };
  }

  getStatusIcon(c: Candidature): string {
    switch (c.statut) { 
      case 'EN_ATTENTE': return 'clock'; 
      case 'EN_COURS_EVALUATION': return 'eye'; 
      case 'PRE_SELECTIONNE': return 'star'; 
      case 'ACCEPTE': return 'circle-check'; 
      case 'REJETE': return 'circle-x'; 
      default: return 'clock'; 
    }
  }

  getLogColor(statut: string): { bg: string; color: string } {
    const cfg = (STATUS_CONFIG.candidature as any)[statut];
    return cfg || { bg: '#F3F4F6', color: '#6B7280' };
  }

  isObject(val: any): boolean { return typeof val === 'object' && val !== null && !Array.isArray(val); }
  isArray(val: any): boolean { return Array.isArray(val); }
  asFile(val: any): { name: string; size: string } { return val as { name: string; size: string }; }
  asArray(val: any): string[] { return val as string[]; }
  getNote(): string | null { return (this.selected() as any)?.noteInterne || null; }
  getMotif(): string | null { return (this.selected() as any)?.motifRejet || null; }
}