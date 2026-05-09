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
              <p class="page-subtitle">Gérez les documents reçus et déposés pour vos entrepreneurs</p>
          </div>
          <div class="header-actions">
              <button class="add-event-btn" (click)="openDepotModal()" style="background: #ea5073; color: white; padding: 10px 24px; border-radius: 12px; font-weight: 500; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(234, 80, 115, 0.3);">
                  <i class="pi pi-cloud-upload" style="margin-right: 8px;"></i> Déposer un livrable
              </button>
          </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container premium-card mb-6">
          <div class="tab-item" [class.active]="activeTab === 'received'" (click)="setTab('received')">
              <i class="pi pi-download"></i>
              <span>Livrables Reçus</span>
              <span class="count-badge" *ngIf="receivedLivrables.length > 0">{{ receivedLivrables.length }}</span>
          </div>
          <div class="tab-item" [class.active]="activeTab === 'sent'" (click)="setTab('sent')">
              <i class="pi pi-upload"></i>
              <span>Livrables Déposés</span>
              <span class="count-badge" *ngIf="sentLivrables.length > 0">{{ sentLivrables.length }}</span>
          </div>
      </div>

      <!-- Advanced Filters -->
      <div class="filters-container premium-card mb-8">
          <div class="filter-row">
              <div class="filter-item">
                  <label>Entrepreneur</label>
                  <select class="filter-select" [(ngModel)]="selectedEntrepreneurId" (change)="filterLivrables()">
                      <option [value]="null">Tous les entrepreneurs</option>
                      <option *ngFor="let e of entrepreneurs" [value]="e.id">{{ e.firstName }} {{ e.lastName }}</option>
                  </select>
              </div>
              <div class="filter-item">
                  <label>Programme</label>
                  <select class="filter-select" [(ngModel)]="selectedProgrammeId" (change)="filterLivrables()">
                      <option [value]="null">Tous les programmes</option>
                      <option *ngFor="let p of programmes" [value]="p.id">{{ p.nom }}</option>
                  </select>
              </div>
              <div class="filter-item">
                  <label>Thématique</label>
                  <select class="filter-select" [(ngModel)]="selectedThematique" (change)="filterLivrables()">
                      <option [value]="null">Toutes les thématiques</option>
                      <option *ngFor="let t of thematiques" [value]="t">{{ t }}</option>
                  </select>
              </div>
              <div class="filter-item search-filter">
                  <label>Recherche</label>
                  <div class="search-input-wrap">
                      <i class="pi pi-search"></i>
                      <input type="text" placeholder="Titre, tâche..." [(ngModel)]="searchTerm" (ngModelChange)="filterLivrables()" />
                  </div>
              </div>
          </div>
      </div>

      <!-- Livrables Table/List -->
      <div class="livrables-list-wrap" *ngIf="filteredLivrables.length > 0">
          <div class="livrable-item premium-card" *ngFor="let liv of filteredLivrables">
              <div class="livrable-main">
                  <div class="livrable-info-grid">
                      <div class="info-cell entrepreneur">
                          <span class="cell-label">Entrepreneur</span>
                          <div class="user-info">
                              <div class="user-avatar">{{ (liv.entrepreneurName || 'E')[0] }}</div>
                              <span class="user-name">{{ liv.entrepreneurName }}</span>
                          </div>
                      </div>
                      
                      <div class="info-cell details">
                          <span class="cell-label">Contexte</span>
                          <div class="context-info">
                              <span class="programme-badge" *ngIf="liv.programmeName">
                                  <i class="pi pi-bookmark"></i> {{ liv.programmeName }}
                              </span>
                              <span class="thematique-badge" *ngIf="liv.thematiqueName">
                                  <i class="pi pi-tag"></i> {{ liv.thematiqueName }}
                              </span>
                              <span class="session-badge" *ngIf="liv.sessionName">
                                  <i class="pi pi-calendar"></i> {{ liv.sessionName }}
                              </span>
                          </div>
                      </div>

                      <div class="info-cell task">
                          <span class="cell-label">Tâche associée</span>
                          <div class="task-info">
                              <span class="task-name">{{ liv.tacheName || 'Sans tâche' }}</span>
                              <span class="task-date" *ngIf="liv.tacheDate">
                                  <i class="pi pi-clock"></i> Échéance : {{ liv.tacheDate | date:'d MMM yyyy' }}
                              </span>
                          </div>
                      </div>

                      <div class="info-cell document">
                          <span class="cell-label">Document</span>
                          <div class="doc-link-wrap">
                              <i class="pi" [class]="getFileIconConfig(liv.fichierUrl).icon" [style.color]="getFileIconConfig(liv.fichierUrl).color"></i>
                              <span class="doc-title">{{ liv.titre }}</span>
                          </div>
                      </div>

                      <div class="info-cell status">
                          <span class="cell-label">Statut</span>
                          <div class="status-badge" [class]="liv.statut.toLowerCase()">
                              {{ getStatusLabel(liv.statut) }}
                          </div>
                      </div>
                  </div>

                  <div class="livrable-actions">
                      <button class="action-btn download" (click)="download(liv)" title="Télécharger">
                          <i class="pi pi-download"></i>
                          <span>Consulter</span>
                      </button>
                      
                      <div class="validation-actions" *ngIf="activeTab === 'received' && (liv.statut === 'SUBMITTED' || liv.statut === 'PENDING_REVIEW')">
                          <button class="action-btn validate" (click)="updateLivrableStatus(liv, 'ACCEPTED')" title="Valider">
                              <i class="pi pi-check"></i>
                          </button>
                          <button class="action-btn reject" (click)="updateLivrableStatus(liv, 'REJECTED')" title="Rejeter">
                              <i class="pi pi-times"></i>
                          </button>
                      </div>
                      
                      <button class="action-btn delete" *ngIf="activeTab === 'sent'" (click)="deleteLivrable(liv.id)" title="Supprimer">
                          <i class="pi pi-trash"></i>
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <!-- Empty State -->
      <div class="premium-empty-state" *ngIf="filteredLivrables.length === 0">
          <div class="empty-illustration">
              <i class="pi pi-folder-open"></i>
          </div>
          <h2>Aucun livrable {{ activeTab === 'received' ? 'reçu' : 'déposé' }}</h2>
          <p>{{ activeTab === 'received' ? 'Les documents soumis par vos entrepreneurs apparaîtront ici.' : 'Vous n’avez pas encore déposé de documents pour vos entrepreneurs.' }}</p>
      </div>

      <div *ngIf="loading && !showDepotModal" class="global-loader-wrap">
          <div class="premium-spinner"></div>
      </div>

      <!-- Depôt Modal -->
      <div *ngIf="showDepotModal" class="modal-overlay" (click)="showDepotModal = false">
          <div class="modal-box" (click)="$event.stopPropagation()">
              <div class="modal-header">
                  <div class="modal-header-info">
                      <h2 class="modal-name">Déposer un livrable</h2>
                      <p class="modal-subtitle">Envoyez un document à vos entrepreneurs</p>
                  </div>
                  <button class="modal-close" (click)="showDepotModal = false"><i class="pi pi-times"></i></button>
              </div>

              <div class="modal-body scrollable-body">
                  <div class="form-group" style="margin-bottom: 16px;">
                      <label class="form-label">Titre du document *</label>
                      <input type="text" class="search-input-alt" [(ngModel)]="newLivrable.titre" placeholder="Ex: Plan d'action stratégique" />
                  </div>

                  <div class="form-group" style="margin-bottom: 16px;">
                      <label class="form-label">Programme associé</label>
                      <select class="search-input-alt" [(ngModel)]="newLivrable.programmeId">
                          <option [ngValue]="null">Sélectionner un programme...</option>
                          <option *ngFor="let p of programmes" [value]="p.id">{{p.nom}}</option>
                      </select>
                  </div>

                  <div class="form-group" style="margin-bottom: 16px;">
                      <label class="form-label">Document à transmettre *</label>
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

                  <div class="form-group">
                      <label class="form-label">Destinataires (Entrepreneurs) *</label>
                      <div class="premium-dest-selector">
                          <div class="search-inner">
                              <i class="pi pi-search"></i>
                              <input type="text" placeholder="Rechercher par nom..." [(ngModel)]="entrepreneurSearch" />
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
                          </div>
                      </div>
                  </div>
              </div>

              <div class="modal-footer">
                  <button class="btn-close-modal" (click)="showDepotModal = false" style="margin-right: 12px;">Annuler</button>
                  <button class="btn-detail" (click)="deposerLivrable()" [disabled]="loading || !selectedFile || !newLivrable.titre" style="background: #ea5073; color: white;">
                      <i class="pi" [class.pi-check]="!loading" [class.pi-spin]="loading" [class.pi-spinner]="loading" style="margin-right: 6px;"></i>
                      {{ loading ? 'Dépôt en cours...' : 'Confirmer le dépôt' }}
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
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .header-actions { display: flex; align-items: center; gap: 1rem; }
    .filters-container { padding: 1.5rem; background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,.04); border: 1px solid #f1f5f9; }
    .filter-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
    .filter-item { display: flex; flex-direction: column; gap: 0.5rem; }
    .filter-item label { font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .filter-select { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem; font-size: 0.95rem; color: #1e293b; outline: none; transition: all 0.2s; }
    .filter-select:focus { border-color: #0f172a; background: white; }
    
    .search-input-wrap { position: relative; }
    .search-input-wrap i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .search-input-wrap input { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem 1rem 0.75rem 2.5rem; font-size: 0.95rem; color: #1e293b; outline: none; }

    .livrables-list-wrap { display: flex; flex-direction: column; gap: 1rem; }
    .livrable-item { padding: 1.5rem; border-radius: 24px; border: 1px solid #f1f5f9; transition: all 0.3s; }
    .livrable-item:hover { transform: translateX(5px); border-color: #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,.05); }

    .livrable-main { display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-wrap: wrap; }
    .livrable-info-grid { display: grid; grid-template-columns: 1.5fr 2fr 2fr 2fr 1fr; gap: 1.5rem; flex: 1; align-items: start; }
    
    .info-cell { display: flex; flex-direction: column; gap: 0.75rem; }
    .cell-label { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .user-info { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar { width: 36px; height: 36px; background: #0f172a; color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; }
    .user-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }

    .context-info { display: flex; flex-direction: column; gap: 0.4rem; }
    .programme-badge, .thematique-badge, .session-badge { font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.75rem; border-radius: 99px; }
    .programme-badge { background: #eff6ff; color: #3b82f6; }
    .thematique-badge { background: #f0fdf4; color: #10b981; }
    .session-badge { background: #faf5ff; color: #a855f7; }

    .task-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .task-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
    .task-date { font-size: 0.8rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem; }

    .doc-link-wrap { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
    .doc-link-wrap i { font-size: 1.25rem; }
    .doc-title { font-weight: 600; color: #1e293b; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }

    .status-badge { padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 800; text-align: center; }
    .status-badge.submitted, .status-badge.pending_review { background: #fef3c7; color: #d97706; }
    .status-badge.accepted, .status-badge.valide { background: #dcfce7; color: #15803d; }
    .status-badge.rejected, .status-badge.rejete { background: #fee2e2; color: #b91c1c; }

    .livrable-actions { display: flex; flex-direction: column; gap: 0.5rem; }
    .action-btn { border: none; padding: 0.6rem 1rem; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; font-size: 0.85rem; }
    .action-btn.download { background: #f1f5f9; color: #1e293b; }
    .action-btn.download:hover { background: #e2e8f0; }
    
    .validation-actions { display: flex; gap: 0.5rem; }
    .action-btn.validate { background: #dcfce7; color: #15803d; flex: 1; }
    .action-btn.validate:hover { background: #bbf7d0; }
    .action-btn.reject { background: #fee2e2; color: #b91c1c; flex: 1; }
    .action-btn.reject:hover { background: #fecaca; }

    .premium-empty-state { background: white; border-radius: 32px; padding: 5rem 2rem; text-align: center; border: 2px dashed #e2e8f0; max-width: 600px; margin: 3rem auto; }
    .empty-illustration { width: 80px; height: 80px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .empty-illustration i { font-size: 2.5rem; color: #cbd5e1; }
    .premium-empty-state h2 { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin: 0 0 0.5rem; }
    .premium-empty-state p { color: #64748b; font-size: 1rem; }

    .global-loader-wrap { display: flex; justify-content: center; align-items: center; padding: 5rem; }
    .premium-spinner { width: 48px; height: 48px; border: 5px solid #f1f5f9; border-top-color: #1e293b; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .tabs-container { display: flex; gap: 2rem; padding: 0.5rem 1.5rem; background: white; border-radius: 20px; border-bottom: 2px solid #f1f5f9; }
    .tab-item { padding: 1rem 0.5rem; display: flex; align-items: center; gap: 0.75rem; color: #64748b; font-weight: 700; cursor: pointer; position: relative; transition: all 0.2s; }
    .tab-item i { font-size: 1.1rem; }
    .tab-item:hover { color: #0f172a; }
    .tab-item.active { color: #ff3d91; }
    .tab-item.active::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 3px; background: #ff3d91; border-radius: 3px 3px 0 0; }
    .count-badge { background: #f1f5f9; color: #64748b; font-size: 0.75rem; padding: 0.1rem 0.5rem; border-radius: 99px; }
    .tab-item.active .count-badge { background: #fff1f2; color: #ff3d91; }
    
    .action-btn.delete { background: #fef2f2; color: #ef4444; }
    .action-btn.delete:hover { background: #fee2e2; }
    .mr-4 { margin-right: 1rem; }
    .premium-btn-rose {
      background: #ff3d91; color: white; border: none; padding: 0.75rem 1.5rem;
      border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 0.75rem;
      cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(255, 61, 145, 0.2);
    }
    .premium-btn-rose:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(255, 61, 145, 0.3); background: #e63582; }
    .premium-btn-secondary {
      background: white; color: #1e293b; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem;
      border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 0.75rem;
      cursor: pointer; transition: all 0.3s;
    }
    .premium-btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-1px); }

    /* Modal Styles from Seance Exceptionnelle */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
    .modal-box { background: white; border-radius: 24px; width: 100%; max-width: 600px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.15); animation: modalSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    @keyframes modalSlide { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-header { padding: 24px; border-bottom: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center; }
    .modal-header-info { flex: 1; }
    .modal-name { font-size: 20px; font-weight: 800; color: #1E293B; margin: 0 0 8px; }
    .modal-subtitle { font-size: 13px; color: #64748B; margin: 0; }
    .modal-close { background: #F8FAFC; border: none; width: 36px; height: 36px; border-radius: 12px; cursor: pointer; color: #64748B; transition: all .2s; }
    .modal-close:hover { background: #F1F5F9; color: #0f172a; }
    
    .modal-body { padding: 24px; overflow-y: auto; }
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
    .search-input-alt { width: 100%; padding: 10px 16px; border: 1px solid #E5E7EB; border-radius: 12px; font-size: 14px; outline: none; color: #333; background: #fff; box-sizing: border-box; transition: border-color .2s; }
    .search-input-alt:focus { border-color: #ea5073; }

    .premium-drop-zone { border: 2px dashed #E5E7EB; border-radius: 20px; padding: 2rem; text-align: center; background: #F9FAFB; cursor: pointer; transition: all 0.3s; }
    .premium-drop-zone:hover { border-color: #ea5073; background: #FFF5F8; }
    .upload-pulse { width: 56px; height: 56px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .upload-pulse i { font-size: 1.5rem; color: #ea5073; }
    .browse-link { color: #ea5073; font-weight: 700; text-decoration: underline; }
    .selected-file-preview { display: flex; align-items: center; gap: 1rem; text-align: left; background: white; padding: 0.75rem; border-radius: 14px; }
    .file-preview-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }

    .premium-dest-selector { border: 1px solid #E5E7EB; border-radius: 16px; overflow: hidden; }
    .search-inner { padding: 10px 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #E5E7EB; background: #fff; }
    .search-inner i { color: #94A3B8; }
    .search-inner input { border: none; outline: none; width: 100%; font-size: 13px; }
    .dest-list { max-height: 180px; overflow-y: auto; padding: 8px; background: #F9FAFB; }
    .dest-item-premium { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 10px; cursor: pointer; transition: all .2s; }
    .dest-item-premium:hover { background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .dest-item-premium.selected { background: #FFF5F8; }
    .dest-checkbox-premium { width: 20px; height: 20px; border: 2px solid #E2E8F0; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: white; transition: all .2s; }
    .dest-item-premium.selected .dest-checkbox-premium { background: #ea5073; border-color: #ea5073; }
    .dest-item-premium.selected .dest-checkbox-premium i { color: white; font-size: 10px; }
    .dest-info { display: flex; flex-direction: column; }
    .dest-name { font-weight: 700; font-size: 13px; color: #1A1A2E; }
    .dest-sub { font-size: 11px; color: #8A8A8A; }

    .modal-footer { padding: 20px 24px; border-top: 1px solid #F1F5F9; display: flex; justify-content: flex-end; }
    .btn-close-modal { padding: 10px 24px; border-radius: 12px; background: #F1F5F9; border: none; font-weight: 700; color: #475569; cursor: pointer; transition: all .2s; }
    .btn-close-modal:hover { background: #E2E8F0; }
    .btn-detail { padding: 10px 24px; border-radius: 12px; font-size: 13px; font-weight: 700; border: 1px solid #ea5073; cursor: pointer; transition: all .2s; }
    .btn-detail:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-detail:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .hidden { display: none; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
  `]

})
export class CoachLivrablesComponent implements OnInit {
  loading: boolean = false;
  searchTerm: string = '';
  showDepotModal: boolean = false;
  selectedFile: File | null = null;
  entrepreneurSearch: string = '';
  
  activeTab: 'received' | 'sent' = 'received';

  selectedEntrepreneurId: number | null = null;
  selectedProgrammeId: number | null = null;
  selectedThematique: string | null = null;

  coachId: number | null = null;

  newLivrable = { titre: '', programmeId: null as number | null };

  programmes: ProgrammeDTO[] = [];
  entrepreneurs: (UserDTO & { selected?: boolean })[] = [];
  thematiques: string[] = [];
  
  receivedLivrables: any[] = [];
  sentLivrables: any[] = [];
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
    if (!this.coachId) return;
    this.loading = true;
    
    // Fetch both Received and Sent
    const received$ = this.livrableService.getReceived(this.coachId);
    const sent$ = this.livrableService.getSent(this.coachId);

    // Using forkJoin or just separate calls. Let's do separate for simplicity in error handling
    received$.subscribe({
      next: (res: any[]) => {
        this.receivedLivrables = res;
        this.updateView();
        this.loading = false;
      },
      error: () => { this.receivedLivrables = []; this.loading = false; }
    });

    sent$.subscribe({
      next: (res: any[]) => {
        this.sentLivrables = res;
        this.updateView();
      },
      error: () => { this.sentLivrables = []; }
    });
  }

  setTab(tab: 'received' | 'sent') {
    this.activeTab = tab;
    this.updateView();
  }

  updateView() {
    this.extractFilterOptions();
    this.filterLivrables();
  }

  extractFilterOptions() {
    const currentList = this.activeTab === 'received' ? this.receivedLivrables : this.sentLivrables;
    const themes = new Set<string>();
    currentList.forEach(l => {
      if (l.thematiqueName) themes.add(l.thematiqueName);
    });
    this.thematiques = Array.from(themes);
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
    const currentList = this.activeTab === 'received' ? this.receivedLivrables : this.sentLivrables;
    let result = [...currentList];

    if (this.selectedEntrepreneurId) {
      result = result.filter(l => (l.entrepreneur?.id === Number(this.selectedEntrepreneurId)) || (l.entrepreneurId === Number(this.selectedEntrepreneurId)));
    }

    if (this.selectedProgrammeId) {
      result = result.filter(l => l.programme?.id === Number(this.selectedProgrammeId));
    }

    if (this.selectedThematique) {
      result = result.filter(l => l.thematiqueName === this.selectedThematique);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(l =>
        (l.titre || '').toLowerCase().includes(term) ||
        (l.tacheName || '').toLowerCase().includes(term) ||
        (l.entrepreneurName || '').toLowerCase().includes(term)
      );
    }

    this.filteredLivrables = result;
  }

  download(livrable: any) {
    if (livrable.fichierUrl) {
      const url = livrable.fichierUrl.startsWith('http') ? livrable.fichierUrl : environment.apiUrl.replace('/api', '') + livrable.fichierUrl;
      window.open(url, '_blank');
    }
  }

  getStatusLabel(statut: string) {
    const config: any = {
      SUBMITTED: 'Soumis',
      PENDING_REVIEW: 'À valider',
      ACCEPTED: 'Validé',
      REJECTED: 'Rejeté',
      VALIDE: 'Validé',
      REJETE: 'Rejeté'
    };
    return config[statut] || statut;
  }

  updateLivrableStatus(liv: any, newStatus: string) {
    this.loading = true;
    this.livrableService.updateStatus(liv.id, newStatus as any).subscribe({
      next: () => {
        liv.statut = newStatus;
        this.filterLivrables();
        this.loading = false;
      },
      error: () => this.loading = false
    });
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
      { titre: this.newLivrable.titre, type: 'Document' },
      this.coachId ?? undefined
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
