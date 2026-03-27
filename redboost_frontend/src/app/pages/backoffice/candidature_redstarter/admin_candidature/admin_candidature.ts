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
  statuts = CANDIDATURE_STATUTS;
  programmes = signal<string[]>([]);
  historiqueLogs = signal<CandidatureLog[]>([]);

  coachCount = signal(0);
  entCount = signal(0);
  spontCount = signal(0);

  acceptingIds = new Set<string>();

  ngOnInit(): void {
    this.loadAll();
  }

  private readonly ACTIVE_STATUSES = ['EN_ATTENTE', 'EN_REVISION'];

  loadAll(): void {
    this.svc.getAll({ type: 'coaches' }).subscribe(r => {
      this.coachCount.set((r.data || []).filter(c => this.ACTIVE_STATUSES.includes(c.statut)).length);
    });
    this.svc.getAll({ type: 'entrepreneurs' }).subscribe(r => {
      this.entCount.set((r.data || []).filter(c => this.ACTIVE_STATUSES.includes(c.statut)).length);
    });
    this.svc.getAll({ type: 'spontanees' }).subscribe(r => {
      this.spontCount.set((r.data || []).filter(c => this.ACTIVE_STATUSES.includes(c.statut)).length);
    });
    this.load();
  }

  load(): void {
    this.svc.getAll({
      type: this.activeTab(),
      search: this.searchQuery || undefined,
      statut: this.statusFilter === 'ALL' ? undefined : this.statusFilter as CandidatureStatus
    }).subscribe(r => {
      let data = r.data || [];
      if (this.filterProgram !== 'all') {
        data = data.filter(c => c.programme === this.filterProgram);
      }
      data = data.filter(c => this.ACTIVE_STATUSES.includes(c.statut));
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
    this.load();
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

  onAccept(id: string): void {
    if (this.acceptingIds.has(id)) return;
    this.acceptingIds.add(id);
    this.svc.accept(id).subscribe({
      next: () => { this.acceptingIds.delete(id); this.showDetail.set(false); this.loadAll(); },
      error: (err) => { this.acceptingIds.delete(id); console.error('Acceptation failed:', err); alert('Erreur: ' + (err.error?.message || err.message || 'Echec acceptation')); }
    });
  }

  loadHistorique(): void {
    const id = this.selected()?.id;
    if (!id) return;
    this.svc.getHistorique(id).subscribe({
      next: (logs) => this.historiqueLogs.set(logs),
      error: () => this.historiqueLogs.set([])
    });
  }

  isCoach(c: Candidature): boolean { return c.type === 'coaches'; }
  getInitials(c: Candidature): string { if (!c?.nom) return '??'; return c.nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(); }

  getAnswerIcon(type: string): string {
    switch (type) { case 'text-court': case 'text-long': return 'file-text'; case 'qcm': case 'qcu': return 'circle-check'; case 'upload': return 'download'; default: return 'clipboard-list'; }
  }

  getStatusCfg(c: Candidature): { bg: string; color: string; label: string } {
    return (STATUS_CONFIG.candidature as any)[c.statut] || { bg: '#F3F4F6', color: '#6B7280', label: c.statut || 'Inconnu' };
  }

  getStatusIcon(c: Candidature): string {
    switch (c.statut) { case 'EN_ATTENTE': return 'clock'; case 'EN_REVISION': return 'eye'; case 'PRESELECTIONNE': return 'star'; case 'ACCEPTE': return 'circle-check'; case 'REJETE': return 'circle-x'; default: return 'clock'; }
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