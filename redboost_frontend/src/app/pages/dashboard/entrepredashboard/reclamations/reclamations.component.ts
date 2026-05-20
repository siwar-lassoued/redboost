import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntrepreneurService, ReclamationDTO, EntrepreneurCoachDTO } from '../services/entrepreneur.service';
import { AuthService } from '../../../frontoffice/service/auth.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../../environment';

@Component({
  selector: 'app-entrepre-reclamations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reclamations-page">
      <div style="max-width: 1100px; margin: 0 auto;">

        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1>Réclamations Administratives</h1>
            <p class="subtitle">Signalez un incident ou un comportement anormal concernant un coach.</p>
          </div>
          <div class="counter-badge">
            <div class="counter-icon"><i class="pi pi-shield"></i></div>
            <div>
              <div class="counter-label">Total envoyés</div>
              <div class="counter-value">{{ reclamations.length }}</div>
            </div>
          </div>
        </div>

        <!-- Main Grid -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 28px;">

          <!-- Left: Form -->
          <div class="premium-card" style="padding: 32px;">
            <h3 class="card-title"><i class="pi pi-plus-circle"></i> Nouvelle réclamation</h3>

            <div class="space-y-5">
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Coach concerné *</label>
                  <select [(ngModel)]="newReclamation.coachId" class="premium-input">
                    <option [value]="0">Choisir un coach...</option>
                    <option *ngFor="let c of coaches" [value]="c.id">{{c.firstName}} {{c.lastName}} ({{c.thematiqueName}})</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Type de réclamation *</label>
                  <select [(ngModel)]="newReclamation.typeReclamation" class="premium-input">
                    <option value="COMPORTEMENT">Problème de comportement</option>
                    <option value="RETARD">Absences / Retards répétés</option>
                    <option value="AUTRE">Autre motif</option>
                  </select>
                </div>
              </div>

              <div class="grid-3">
                <div class="form-group">
                  <label class="form-label">Programme</label>
                  <select [(ngModel)]="newReclamation.programmeName" class="premium-input">
                    <option value="">Non spécifié</option>
                    <option *ngFor="let p of programmes" [value]="p.nom">{{p.nom}}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Thématique</label>
                  <select [(ngModel)]="newReclamation.thematiqueName" class="premium-input">
                    <option value="">Non spécifié</option>
                    <option *ngFor="let t of thematiques" [value]="t.nom">{{t.nom}}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Session visée</label>
                  <select [(ngModel)]="newReclamation.sessionDetails" class="premium-input">
                    <option value="">Non spécifié</option>
                    <option *ngFor="let s of sessions" [value]="s.titre + ' (' + s.dateSession + ')'">{{s.titre}} - {{s.dateSession}}</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Sujet / Titre *</label>
                <input type="text" [(ngModel)]="newReclamation.sujet" placeholder="Ex: Absence non justifiée session du 10/05" class="premium-input">
              </div>

              <div class="form-group">
                <label class="form-label">Description détaillée *</label>
                <textarea [(ngModel)]="newReclamation.description" rows="5" class="premium-input" placeholder="Décrivez les faits de manière précise et objective..."></textarea>
              </div>

              <!-- File Upload -->
              <div class="form-group">
                <label class="form-label">Pièce jointe (Optionnel)</label>
                <div class="upload-zone" [class.has-file]="selectedFile" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
                  <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)" accept=".pdf,.png,.jpg,.jpeg,.docx">

                  <div *ngIf="!selectedFile" style="display:flex; flex-direction:column; align-items:center; padding: 16px 0;">
                    <div style="width:48px;height:48px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
                      <i class="pi pi-cloud-upload" style="color:#95a5a6;font-size:20px;"></i>
                    </div>
                    <p style="font-size:13px;font-weight:600;color:#2c3e50;">Cliquez pour ajouter un fichier justificatif</p>
                    <p style="font-size:11px;color:#95a5a6;margin-top:4px;">PDF, Images ou Word (Max 5MB)</p>
                  </div>

                  <div *ngIf="selectedFile" style="display:flex;align-items:center;justify-content:space-between;background:white;padding:12px;border-radius:10px;border:1px solid rgba(236,64,122,0.2);">
                    <div style="display:flex;align-items:center;gap:12px;">
                      <div style="width:40px;height:40px;border-radius:10px;background:#fce4ec;display:flex;align-items:center;justify-content:center;color:#ec407a;">
                        <i class="pi pi-file" style="font-size:18px;"></i>
                      </div>
                      <div>
                        <div style="font-size:13px;font-weight:700;color:#2c3e50;">{{ selectedFile.name }}</div>
                        <div style="font-size:11px;color:#95a5a6;">{{ formatFileSize(selectedFile.size) }}</div>
                      </div>
                    </div>
                    <button (click)="$event.stopPropagation(); selectedFile = null" style="background:none;border:none;color:#95a5a6;cursor:pointer;font-size:16px;">
                      <i class="pi pi-times"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Submit -->
              <div style="padding-top: 8px;">
                <button class="btn-submit" (click)="submit()" [disabled]="loading">
                  <i class="pi" [class.pi-send]="!loading" [class.pi-spin]="loading" [class.pi-spinner]="loading"></i>
                  <span *ngIf="!loading">Envoyer à l&apos;administration</span><span *ngIf="loading">Envoi en cours...</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Right: History -->
          <div>
            <h3 class="panel-title"><i class="pi pi-history"></i> Derniers envois</h3>

            <div style="display:flex;flex-direction:column;gap:12px;max-height:800px;overflow-y:auto;padding-right:4px;" class="custom-scrollbar">

              <div *ngFor="let r of reclamations" class="rec-card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                  <span class="badge"
                    [class.badge-pending]="r.statut==='EN_ATTENTE'"
                    [class.badge-done]="r.statut==='TRAITEE'"
                    [class.badge-rejected]="r.statut==='REJETEE'"
                    [class.badge-cancelled]="r.statut==='ANNULEE'">
                    {{ r.statut?.replace('_', ' ') }}
                  </span>
                  <span style="font-size:10px;font-weight:700;color:#95a5a6;">{{ r.dateReclamation | date:'dd MMM yyyy' }}</span>
                </div>

                <h4 style="font-size:14px;font-weight:800;color:#2c3e50;margin:0 0 4px;">{{ r.sujet }}</h4>
                <div style="font-size:11px;font-weight:700;color:#ec407a;margin-bottom:10px;display:flex;align-items:center;gap:4px;">
                  <i class="pi pi-user" style="font-size:10px;"></i> Coach concerné
                </div>

                <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">
                  <span *ngIf="r.programmeName" style="padding:2px 8px;background:#f8f9fa;color:#7f8c8d;border-radius:6px;font-size:9px;font-weight:700;border:1px solid #e8ecf0;">{{r.programmeName}}</span>
                  <span *ngIf="r.thematiqueName" style="padding:2px 8px;background:#e3f2fd;color:#1565c0;border-radius:6px;font-size:9px;font-weight:700;border:1px solid #bbdefb;">{{r.thematiqueName}}</span>
                </div>

                <p style="font-size:11px;color:#7f8c8d;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.6;border-left:2px solid #e8ecf0;padding-left:10px;margin:0 0 12px;font-style:italic;">
                  &ldquo;{{ r.description }}&rdquo;
                </p>

                <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f8f9fa;padding-top:10px;">
                  <div style="display:flex;gap:8px;">
                    <div style="width:24px;height:24px;border-radius:6px;background:#f8f9fa;display:flex;align-items:center;justify-content:center;color:#95a5a6;" title="Type: {{r.typeReclamation}}">
                      <i class="pi pi-tag" style="font-size:10px;"></i>
                    </div>
                    <div *ngIf="r.pieceJointeUrl" (click)="downloadAttachment(r.pieceJointeUrl)"
                      style="width:24px;height:24px;border-radius:6px;background:#fce4ec;display:flex;align-items:center;justify-content:center;color:#ec407a;cursor:pointer;transition:all 0.2s;"
                      title="Télécharger la pièce jointe">
                      <i class="pi pi-paperclip" style="font-size:10px;"></i>
                    </div>
                  </div>
                  <button style="font-size:10px;font-weight:700;color:#95a5a6;background:none;border:none;cursor:pointer;">Voir détails</button>
                </div>
              </div>

              <div *ngIf="reclamations.length === 0"
                style="background:white;border-radius:16px;padding:40px;border:2px dashed #e8ecf0;display:flex;flex-direction:column;align-items:center;text-align:center;">
                <div style="width:56px;height:56px;background:#f8f9fa;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
                  <i class="pi pi-inbox" style="font-size:24px;color:#e8ecf0;"></i>
                </div>
                <p style="font-size:13px;font-weight:700;color:#95a5a6;">Aucune réclamation envoyée</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', sans-serif; }
    .reclamations-page { background: #F8F9FA; min-height: 100vh; padding: 32px 16px; }

    /* Header */
    h1 { font-size: 28px; font-weight: 900; color: #2c3e50; letter-spacing: -0.5px; margin: 0; }
    .subtitle { color: #7f8c8d; font-size: 14px; margin-top: 4px; }

    /* Counter Badge */
    .counter-badge { background: white; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f0f0f0; padding: 12px 20px; display: flex; align-items: center; gap: 12px; }
    .counter-icon { width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, #ec407a 0%, #d81b60 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; }
    .counter-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; color: #95a5a6; }
    .counter-value { font-size: 22px; font-weight: 900; color: #2c3e50; line-height: 1; }

    /* Cards */
    .premium-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.04); }
    .card-title { font-size: 17px; font-weight: 800; color: #2c3e50; margin: 0 0 24px; display: flex; align-items: center; gap: 10px; padding-bottom: 16px; border-bottom: 2px solid #f8f9fa; }
    .card-title i { color: #ec407a; }

    /* Form Elements */
    .form-group { display: flex; flex-direction: column; }
    .form-label { display: block; font-size: 11px; font-weight: 800; color: #95a5a6; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.8px; }
    .premium-input {
      width: 100%; background: #f8f9fa; border: 2px solid #f0f0f0;
      border-radius: 12px; padding: 12px 16px; font-size: 14px;
      color: #2c3e50; font-weight: 500; transition: all 0.2s; outline: none;
      box-sizing: border-box; font-family: 'Inter', sans-serif;
    }
    .premium-input:focus { border-color: #ec407a; background: white; box-shadow: 0 0 0 4px rgba(236,64,122,0.08); }
    .premium-input::placeholder { color: #b0bec5; font-weight: 400; }
    select.premium-input { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ec407a' stroke-width='3'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }

    /* Upload Zone */
    .upload-zone { border: 2px dashed #e8ecf0; border-radius: 14px; background: #f8f9fa; transition: all 0.25s; cursor: pointer; padding: 16px; }
    .upload-zone:hover, .upload-zone:focus-within { border-color: #ec407a; background: #fce4ec; }
    .upload-zone.has-file { border-style: solid; border-color: #ec407a; background: white; }

    /* Submit Button */
    .btn-submit { 
      width: 100%; padding: 15px; border-radius: 14px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #ec407a 0%, #d81b60 100%);
      color: white; font-size: 15px; font-weight: 800; font-family: 'Inter', sans-serif;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      box-shadow: 0 4px 16px rgba(236,64,122,0.35); transition: all 0.25s;
      letter-spacing: 0.3px;
    }
    .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(236,64,122,0.40); }
    .btn-submit:active:not(:disabled) { transform: translateY(0); }
    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

    /* History Panel */
    .panel-title { font-size: 16px; font-weight: 800; color: #2c3e50; margin: 0 0 20px; display: flex; align-items: center; gap: 10px; }
    .panel-title i { color: #95a5a6; }

    /* Reclamation Cards */
    .rec-card { background: white; border-radius: 16px; padding: 18px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); border: 1px solid #f0f0f0; transition: all 0.2s; }
    .rec-card:hover { border-color: rgba(236,64,122,0.25); box-shadow: 0 4px 16px rgba(236,64,122,0.08); transform: translateY(-1px); }

    /* Status badges */
    .badge { padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-pending { background: #fffbeb; color: #d97706; }
    .badge-done { background: #ecfdf5; color: #059669; }
    .badge-rejected { background: #fef2f2; color: #dc2626; }
    .badge-cancelled { background: #f8fafc; color: #64748b; }

    /* Scroll */
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e8ecf0; border-radius: 10px; }
    .hidden { display: none; }

    /* Grid & spacing utils */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    .space-y-5 > * + * { margin-top: 20px; }
    @media (max-width: 768px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }
  `]
})
export class EntrepreneurReclamationsComponent implements OnInit {
  entrepreneurId!: number;
  coaches: EntrepreneurCoachDTO[] = [];
  reclamations: any[] = [];
  programmes: any[] = [];
  thematiques: any[] = [];
  sessions: any[] = [];
  loading = false;
  selectedFile: File | null = null;
  
  newReclamation: any = {
    coachId: 0,
    entrepreneurId: 0,
    sujet: '',
    typeReclamation: 'COMPORTEMENT',
    description: '',
    programmeName: '',
    thematiqueName: '',
    sessionDetails: ''
  };

  constructor(
      private entrepreneurService: EntrepreneurService, 
      private authService: AuthService, 
      private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const rawId = this.authService.getUserId();
    this.entrepreneurId = typeof rawId === 'string' ? parseInt(rawId, 10) : (rawId ?? 0);
    if (this.entrepreneurId) {
      this.newReclamation.entrepreneurId = this.entrepreneurId;
      this.loadCoaches();
      this.loadReclamations();
      this.loadContexts();
    }
  }

  loadContexts() {
    this.entrepreneurService.getProgrammes(this.entrepreneurId).subscribe(p => this.programmes = p);
    this.entrepreneurService.getThematiques(this.entrepreneurId).subscribe(t => this.thematiques = t);
    this.entrepreneurService.getSessions(this.entrepreneurId).subscribe(s => this.sessions = s);
  }

  loadCoaches() {
      this.entrepreneurService.getCoaches(this.entrepreneurId).subscribe({
          next: (data) => this.coaches = data
      });
  }

  loadReclamations() {
      this.entrepreneurService.getReclamations(this.entrepreneurId).subscribe({
          next: (data) => this.reclamations = data.sort((a,b) => 
            new Date(b.dateReclamation!).getTime() - new Date(a.dateReclamation!).getTime())
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('Fichier trop volumineux (Max 5MB)');
        return;
      }
      this.selectedFile = file;
    }
  }

  onDragOver(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: any) {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  downloadAttachment(url: string) {
    const fullUrl = url.startsWith('http') ? url : environment.apiUrl.replace('/api', '') + url;
    window.open(fullUrl, '_blank');
  }

  submit() {
      if (this.newReclamation.coachId === 0 || !this.newReclamation.sujet || !this.newReclamation.description) {
          this.toastr.warning('Veuillez remplir tous les champs obligatoires');
          return;
      }
      
      this.loading = true;
      this.entrepreneurService.addReclamation(this.entrepreneurId, this.newReclamation.coachId, this.newReclamation, this.selectedFile || undefined).subscribe({
          next: (data) => {
              this.toastr.success('Réclamation envoyée à l\'administration.');
              this.reclamations.unshift(data);
              this.resetForm();
              this.loading = false;
          },
          error: () => {
            this.toastr.error('Erreur lors de l\'envoi');
            this.loading = false;
          }
      });
  }

  resetForm() {
    this.newReclamation = {
      entrepreneurId: this.entrepreneurId,
      coachId: 0,
      sujet: '',
      typeReclamation: 'COMPORTEMENT',
      description: '',
      programmeName: '',
      thematiqueName: '',
      sessionDetails: ''
    };
    this.selectedFile = null;
  }
}
