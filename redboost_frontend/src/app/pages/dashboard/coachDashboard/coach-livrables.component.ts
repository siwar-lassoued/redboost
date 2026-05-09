import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachService, ProgrammeDTO, UserDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { LivrableService } from '../../../core/services/livrable.service';
import { environment } from '../../../../environment';


@Component({
  selector: 'app-coach-livrables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="livrables-page">
      <div class="page-header">
          <div class="header-content">
              <h1 class="page-title">Mes Livrables</h1>
              <p class="page-subtitle">Gérez et transmettez vos documents d'accompagnement</p>
          </div>
          <button class="premium-btn-primary" (click)="openDepotModal()">
              <i class="pi pi-cloud-upload"></i>
              <span>Nouveau dépôt</span>
          </button>
      </div>

      <!-- Filters & Stats -->
      <div class="top-row mb-8">
          <div class="search-box premium-card">
              <i class="pi pi-search"></i>
              <input type="text" placeholder="Rechercher un document, un programme ou un entrepreneur..." 
                     [(ngModel)]="searchTerm" (ngModelChange)="filterLivrables()" />
          </div>
          
          <div class="stats-pills">
             <div class="stat-pill">
                <span class="stat-count">{{ livrables.length }}</span>
                <span class="stat-label">Total déposés</span>
             </div>
          </div>
      </div>

      <!-- Grid -->
      <div class="livrables-grid" *ngIf="filteredLivrables.length > 0">
          <div class="premium-doc-card" *ngFor="let liv of filteredLivrables">
              <div class="card-glass-header" [style.background]="getStatusConfig(liv.statut).bg + '80'">
                  <div class="status-chip" [style.color]="getStatusConfig(liv.statut).color" [style.background]="getStatusConfig(liv.statut).bg">
                      <div class="status-dot" [style.background]="getStatusConfig(liv.statut).color"></div>
                      <span>{{ getStatusConfig(liv.statut).label }}</span>
                  </div>
                  <span class="date-tag">{{ liv.dateSoumission | date:'d MMM yyyy' }}</span>
              </div>

              <div class="card-main">
                  <div class="file-icon-wrap" [style.background]="getFileIconConfig(liv.fichierUrl).bg">
                      <i class="pi" [class]="getFileIconConfig(liv.fichierUrl).icon" [style.color]="getFileIconConfig(liv.fichierUrl).color"></i>
                  </div>

                  <div class="doc-info">
                      <h3 class="doc-title">{{ liv.titre }}</h3>
                      <p class="doc-programme" *ngIf="liv.programme?.nom">
                        <i class="pi pi-bookmark-fill"></i>
                        {{ liv.programme?.nom }}
                      </p>
                  </div>

                  <div class="entrepreneur-tag">
                      <div class="ent-avatar">{{ (liv.entrepreneur?.firstName || 'E')[0] }}</div>
                      <div class="ent-details">
                          <span class="ent-name">{{ liv.entrepreneur?.firstName }} {{ liv.entrepreneur?.lastName }}</span>
                          <span class="ent-sub">{{ liv.fileSize || 'Taille inconnue' }}</span>
                      </div>
                  </div>
              </div>

              <div class="card-footer-actions">
                  <button class="btn-download-glass" (click)="download(liv)">
                      <i class="pi pi-download"></i>
                      <span>Télécharger</span>
                  </button>
                  <button class="btn-delete-glass" (click)="deleteLivrable(liv.id)" *ngIf="!liv.isSystem">
                      <i class="pi pi-trash"></i>
                  </button>
              </div>
          </div>
      </div>

      <!-- Empty State -->
      <div class="premium-empty-state" *ngIf="filteredLivrables.length === 0">
          <div class="empty-illustration">
              <i class="pi pi-folder-open"></i>
          </div>
          <h2>Aucun livrable déposé</h2>
          <p>Commencez par déposer un document pour vos entrepreneurs.</p>
          <button class="premium-btn-secondary mt-6" (click)="openDepotModal()">
            <i class="pi pi-plus"></i> Déposer maintenant
          </button>
      </div>

      <!-- Depôt Modal -->
      <div *ngIf="showDepotModal" class="modal-overlay" (click)="showDepotModal = false">
          <div class="modal-box premium-card-elevated" (click)="$event.stopPropagation()">
              <div class="modal-header">
                  <div class="header-icon-wrap">
                      <i class="pi pi-file-edit"></i>
                  </div>
                  <div class="header-text">
                      <h2>Déposer un livrable</h2>
                      <p>Envoyez un document à un ou plusieurs entrepreneurs</p>
                  </div>
                  <button class="btn-close-circle" (click)="showDepotModal = false"><i class="pi pi-times"></i></button>
              </div>

              <div class="modal-body scrollable-body">
                  <div class="form-grid">
                    <div class="form-section">
                        <label class="premium-label">Titre du document</label>
                        <div class="input-wrapper">
                          <i class="pi pi-pencil"></i>
                          <input type="text" class="premium-input" [(ngModel)]="newLivrable.titre" placeholder="Ex: Plan d'action stratégique" />
                        </div>
                    </div>

                    <div class="form-section">
                        <label class="premium-label">Programme associé</label>
                        <div class="input-wrapper">
                          <i class="pi pi-bookmark"></i>
                          <select class="premium-input" [(ngModel)]="newLivrable.programmeId">
                              <option [value]="null">Sélectionner un programme...</option>
                              <option *ngFor="let p of programmes" [value]="p.id">{{p.nom}}</option>
                          </select>
                        </div>
                    </div>
                  </div>

                  <div class="form-section mt-4">
                      <label class="premium-label">Document à transmettre</label>
                      <div class="premium-drop-zone" [class.has-file]="selectedFile" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
                          <div class="drop-content" *ngIf="!selectedFile">
                              <div class="upload-pulse">
                                <i class="pi pi-cloud-upload"></i>
                              </div>
                              <p>Glissez-déposez ou <span class="browse-link">parcourez vos fichiers</span></p>
                              <span class="drop-hint">PDF, DOCX, XLSX (Max 10MB)</span>
                          </div>
                          <div class="selected-file-preview" *ngIf="selectedFile">
                              <div class="file-preview-icon" [style.background]="getFileIconConfig(selectedFile.name).bg">
                                <i class="pi" [class]="getFileIconConfig(selectedFile.name).icon" [style.color]="getFileIconConfig(selectedFile.name).color"></i>
                              </div>
                              <div class="file-details">
                                  <span class="f-name">{{ selectedFile.name }}</span>
                                  <span class="f-size">{{ formatFileSize(selectedFile.size) }}</span>
                              </div>
                              <button class="btn-remove-file" (click)="$event.stopPropagation(); selectedFile = null"><i class="pi pi-times"></i></button>
                          </div>
                          <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)" accept=".pdf,.docx,.xlsx,.pptx,.zip" />
                      </div>
                  </div>

                  <div class="form-section mt-6">
                      <label class="premium-label">Destinataires (Entrepreneurs)</label>
                      <div class="premium-dest-selector">
                          <div class="search-inner">
                              <i class="pi pi-search"></i>
                              <input type="text" placeholder="Rechercher par nom ou entreprise..." [(ngModel)]="entrepreneurSearch" />
                          </div>
                          <div class="dest-list">
                              <div *ngFor="let e of getFilteredEntrepreneurs()" 
                                   class="dest-item-premium" 
                                   [class.selected]="e.selected" 
                                   (click)="e.selected = !e.selected">
                                  <div class="dest-checkbox-premium">
                                      <i class="pi pi-check" *ngIf="e.selected"></i>
                                  </div>
                                  <div class="dest-info">
                                      <span class="dest-name">{{e.firstName}} {{e.lastName}}</span>
                                      <span class="dest-sub">{{e.entreprise || 'Entrepreneur'}}</span>
                                  </div>
                              </div>
                              <div *ngIf="getFilteredEntrepreneurs().length === 0" class="empty-list-msg">
                                <i class="pi pi-info-circle"></i> Aucun entrepreneur trouvé.
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              <div class="modal-footer">
                  <button class="btn-cancel-premium" (click)="showDepotModal = false">Annuler</button>
                  <button class="btn-submit-premium" (click)="deposerLivrable()" [disabled]="loading || !selectedFile || !newLivrable.titre">
                      <i class="pi pi-spin pi-spinner" *ngIf="loading"></i>
                      <i class="pi pi-check-circle" *ngIf="!loading"></i>
                      <span>{{ loading ? 'Envoi en cours...' : 'Confirmer le dépôt' }}</span>
                  </button>
              </div>
          </div>
      </div>

      <div *ngIf="loading && !showDepotModal" class="global-loader-wrap">
          <div class="premium-spinner"></div>
      </div>
    </div>
  `,
  styles: [`
    .livrables-page {
      padding: 2.5rem;
      background: #f8fafc;
      min-height: calc(100vh - 80px);
      font-family: 'Inter', sans-serif;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
    }

    .page-title {
      font-size: 2.8rem;
      font-weight: 800;
      background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
      letter-spacing: -1.5px;
    }

    .page-subtitle {
      color: #64748b;
      font-size: 1.15rem;
      margin-top: 0.5rem;
    }

    .premium-btn-primary {
      background: #0f172a;
      color: white;
      border: none;
      padding: 1rem 1.75rem;
      border-radius: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2);
    }

    .premium-btn-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.3);
      background: #1e293b;
    }

    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .search-box {
      flex: 1;
      position: relative;
      background: white;
      border-radius: 18px;
      border: 1px solid #f1f5f9;
      padding: 0.25rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .search-box i {
      position: absolute;
      left: 1.5rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 1.1rem;
    }

    .search-box input {
      width: 100%;
      border: none;
      padding: 1rem 1rem 1rem 3.5rem;
      background: transparent;
      font-size: 1rem;
      color: #1e293b;
      outline: none;
    }

    .stat-pill {
      background: white;
      padding: 0.75rem 1.5rem;
      border-radius: 99px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      border: 1px solid #f1f5f9;
    }

    .stat-count {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      padding: 0.35rem 0.85rem;
      border-radius: 99px;
      font-size: 0.95rem;
    }

    /* Grid */
    .livrables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 2rem;
    }

    .premium-doc-card {
      background: white;
      border-radius: 28px;
      overflow: hidden;
      border: 1px solid #f1f5f9;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
    }

    .premium-doc-card:hover {
      transform: translateY(-10px) scale(1.02);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
      border-color: #e2e8f0;
    }

    .card-glass-header {
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      backdrop-filter: blur(10px);
    }

    .status-chip {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.5rem 1.1rem;
      border-radius: 99px;
      font-size: 0.8rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.75px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .date-tag {
      font-size: 0.9rem;
      font-weight: 600;
      color: #64748b;
    }

    .card-main {
      padding: 2rem;
      flex: 1;
    }

    .file-icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .file-icon-wrap i {
      font-size: 2rem;
    }

    .doc-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }

    .doc-programme {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      color: #64748b;
      margin-top: 0.5rem;
      font-weight: 500;
    }

    .entrepreneur-tag {
      margin-top: 2rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 18px;
      display: flex;
      align-items: center;
      gap: 1rem;
      border: 1px solid #f1f5f9;
    }

    .ent-avatar {
      width: 40px;
      height: 40px;
      background: #0f172a;
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .ent-name {
      display: block;
      font-weight: 700;
      color: #1e293b;
      font-size: 0.95rem;
    }

    .ent-sub {
      display: block;
      font-size: 0.8rem;
      color: #94a3b8;
      margin-top: 0.1rem;
    }

    .card-footer-actions {
      padding: 1.25rem 2rem 2rem;
      display: flex;
      gap: 1rem;
    }

    .btn-download-glass {
      flex: 1;
      background: #f1f5f9;
      color: #0f172a;
      border: none;
      padding: 0.85rem;
      border-radius: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-download-glass:hover {
      background: #e2e8f0;
      transform: translateY(-2px);
    }

    .btn-delete-glass {
      width: 48px;
      height: 48px;
      background: #fff1f2;
      color: #e11d48;
      border: none;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-delete-glass:hover {
      background: #ffe4e6;
      color: #be123c;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .modal-box {
      background: white;
      border-radius: 32px;
      width: 100%;
      max-width: 700px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: modalSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes modalSlide {
      from { transform: translateY(40px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      padding: 2rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .header-icon-wrap {
      width: 56px;
      height: 56px;
      background: #f1f5f9;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon-wrap i {
      font-size: 1.5rem;
      color: #0f172a;
    }

    .header-text h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
    }

    .header-text p {
      margin: 0.25rem 0 0;
      color: #64748b;
      font-size: 0.95rem;
    }

    .btn-close-circle {
      margin-left: auto;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: #f8fafc;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-close-circle:hover {
      background: #f1f5f9;
      color: #64748b;
    }

    .modal-body {
      padding: 2rem;
      overflow-y: auto;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .premium-label {
      display: block;
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.75rem;
    }

    .input-wrapper {
      position: relative;
    }

    .input-wrapper i {
      position: absolute;
      left: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }

    .premium-input {
      width: 100%;
      padding: 0.85rem 1rem 0.85rem 3rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      font-size: 0.95rem;
      color: #0f172a;
      outline: none;
      transition: all 0.2s;
    }

    .premium-input:focus {
      border-color: #0f172a;
      background: white;
      box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.05);
    }

    .premium-drop-zone {
      border: 2px dashed #e2e8f0;
      border-radius: 20px;
      padding: 2.5rem;
      text-align: center;
      background: #f8fafc;
      cursor: pointer;
      transition: all 0.3s;
    }

    .premium-drop-zone:hover {
      border-color: #0f172a;
      background: #f1f5f9;
    }

    .upload-pulse {
      width: 64px;
      height: 64px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    }

    .upload-pulse i {
      font-size: 1.75rem;
      color: #0f172a;
    }

    .browse-link {
      color: #0f172a;
      font-weight: 700;
      text-decoration: underline;
    }

    .drop-hint {
      display: block;
      font-size: 0.8rem;
      color: #94a3b8;
      margin-top: 0.5rem;
    }

    .selected-file-preview {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      text-align: left;
      background: white;
      padding: 1rem;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .file-preview-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .file-details .f-name {
      display: block;
      font-weight: 700;
      color: #0f172a;
      font-size: 0.95rem;
    }

    .file-details .f-size {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .btn-remove-file {
      margin-left: auto;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
    }

    .premium-dest-selector {
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      overflow: hidden;
      background: #f8fafc;
    }

    .search-inner {
      padding: 0.75rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
      background: white;
    }

    .search-inner input {
      border: none;
      background: transparent;
      width: 100%;
      outline: none;
      font-size: 0.9rem;
    }

    .dest-list {
      max-height: 200px;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .dest-item-premium {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1rem;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .dest-item-premium:hover {
      background: white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .dest-checkbox-premium {
      width: 22px;
      height: 22px;
      border: 2px solid #e2e8f0;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      background: white;
    }

    .dest-item-premium.selected .dest-checkbox-premium {
      background: #0f172a;
      border-color: #0f172a;
    }

    .dest-item-premium.selected .dest-checkbox-premium i {
      color: white;
      font-size: 0.8rem;
    }

    .modal-footer {
      padding: 2rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .btn-cancel-premium {
      padding: 0.85rem 1.5rem;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      background: white;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
    }

    .btn-submit-premium {
      padding: 0.85rem 2rem;
      border-radius: 14px;
      background: #0f172a;
      color: white;
      border: none;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-submit-premium:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .premium-empty-state {
      background: white;
      border-radius: 32px;
      padding: 6rem 2rem;
      text-align: center;
      border: 1px dashed #e2e8f0;
    }

    .empty-illustration {
      width: 120px;
      height: 120px;
      background: #f8fafc;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 2rem;
    }

    .empty-illustration i {
      font-size: 3.5rem;
      color: #cbd5e1;
    }

    .premium-spinner {
      width: 56px;
      height: 56px;
      border: 6px solid #f1f5f9;
      border-top-color: #0f172a;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    .hidden { display: none; }
  `]

})
export class CoachLivrablesComponent implements OnInit {
  loading: boolean = false;
  searchTerm: string = '';
  showDepotModal: boolean = false;
  selectedFile: File | null = null;
  entrepreneurSearch: string = '';
  coachId: number | null = null;

  newLivrable = { titre: '', programmeId: null as number | null };

  programmes: ProgrammeDTO[] = [];
  entrepreneurs: (UserDTO & { selected?: boolean })[] = [];
  livrables: any[] = [];
  filteredLivrables: any[] = [];

  constructor(
    private coachService: CoachService,
    private authService: AuthService,
    private livrableService: LivrableService
  ) {}

  ngOnInit(): void {
    const rawCoachId = this.authService.getUserId();
    this.coachId = typeof rawCoachId === 'string' ? parseInt(rawCoachId, 10) : rawCoachId;
    if (!this.coachId) {
      return;
    }

    this.loadProgrammes(this.coachId);
    this.loadEntrepreneurs();
    this.loadLivrables();
  }

  loadLivrables() {
    this.loading = true;
    this.livrableService.getAll({ coachId: this.coachId?.toString() }).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : (res as any).data || [];
        this.livrables = data;
        this.filteredLivrables = [...this.livrables];
        this.loading = false;
      },
      error: () => {
        this.livrables = [];
        this.filteredLivrables = [];
        this.loading = false;
      }
    });
  }

  loadProgrammes(coachId: number) {
    this.coachService.getCoachProgrammes(coachId).subscribe({
      next: (data) => this.programmes = data,
      error: () => { this.programmes = []; }
    });
  }


  loadEntrepreneurs() {
    const rawCoachId = this.authService.getUserId();
    const coachId = typeof rawCoachId === 'string' ? parseInt(rawCoachId, 10) : (rawCoachId ?? 0);
    if (!coachId) return;

    this.coachService.getCoachEntrepreneurs(coachId).subscribe({
      next: (data) => this.entrepreneurs = data.map((e: any) => ({ ...e, selected: false })),
      error: () => {}

    });
  }

  openDepotModal() {
    this.newLivrable = { titre: '', programmeId: null };
    this.selectedFile = null;
    this.entrepreneurSearch = '';
    this.entrepreneurs.forEach(e => e.selected = false);
    this.showDepotModal = true;
  }

  filterLivrables() {
    if (!this.searchTerm.trim()) {
      this.filteredLivrables = [...this.livrables];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredLivrables = this.livrables.filter(l =>
      (l.entrepreneur?.firstName + ' ' + l.entrepreneur?.lastName).toLowerCase().includes(term) ||
      (l.programme?.nom || '').toLowerCase().includes(term) ||
      (l.titre || '').toLowerCase().includes(term)
    );
  }

  download(livrable: any) {
    if (livrable.fichierUrl) {
      const url = livrable.fichierUrl.startsWith('http') ? livrable.fichierUrl : environment.apiUrl.replace('/api', '') + livrable.fichierUrl;
      window.open(url, '_blank');
    }
  }

  getStatusConfig(statut: string) {
    const config: any = {
      SUBMITTED: { label: 'Déposé', color: '#3b82f6', bg: '#eff6ff' },
      VALIDE: { label: 'Validé', color: '#10b981', bg: '#f0fdf4' },
      REJETE: { label: 'Rejeté', color: '#ef4444', bg: '#fef2f2' }
    };
    return config[statut] || { label: statut, color: '#64748b', bg: '#f8fafc' };
  }

  getFileIconConfig(url: string) {
    const ext = (url || '').split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { icon: 'pi-file-pdf', color: '#ef4444', bg: '#fef2f2' };
    if (['doc', 'docx'].includes(ext!)) return { icon: 'pi-file-word', color: '#3b82f6', bg: '#eff6ff' };
    if (['xls', 'xlsx'].includes(ext!)) return { icon: 'pi-file-excel', color: '#10b981', bg: '#f0fdf4' };
    return { icon: 'pi-file', color: '#94a3b8', bg: '#f8fafc' };
  }

  deleteLivrable(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce livrable ?')) {
      this.livrableService.delete(id).subscribe(() => {
        this.loadLivrables();
      });
    }
  }

  getFilteredEntrepreneurs() {
    if (!this.entrepreneurSearch.trim()) return this.entrepreneurs;
    const term = this.entrepreneurSearch.toLowerCase();
    return this.entrepreneurs.filter(e =>
      (`${e.firstName} ${e.lastName}`).toLowerCase().includes(term) ||
      (e.entreprise || '').toLowerCase().includes(term)
    );
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  onDragOver(event: DragEvent) { event.preventDefault(); event.stopPropagation(); }
  onDrop(event: DragEvent) {
    event.preventDefault(); event.stopPropagation();
    if (event.dataTransfer?.files.length) this.selectedFile = event.dataTransfer.files[0];
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  deposerLivrable() {
    const selectedEnts = this.entrepreneurs.filter(e => e.selected);
    if (!this.newLivrable.titre || !this.selectedFile || selectedEnts.length === 0) {
      return;
    }
    this.loading = true;

    const entrepreneurIds = selectedEnts.map(e => e.id.toString());
    this.livrableService.upload(
      this.newLivrable.programmeId?.toString() || '', 
      entrepreneurIds, 
      this.selectedFile, 
      { titre: this.newLivrable.titre, type: 'Document' }
    ).subscribe({
      next: () => {
        this.loadLivrables();
        this.showDepotModal = false;
        this.newLivrable = { titre: '', programmeId: null };
        this.selectedFile = null;
        this.entrepreneurs.forEach(e => e.selected = false);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        console.error("Failed to upload livrable");
      }
    });
  }
}
