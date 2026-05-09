import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CoachService, CoachEntrepreneurDetailDTO } from './services/coach.service';
import { TacheService } from '../../../core/services/tache.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-coach-entrepreneur-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="ent-detail-premium">
      <!-- Top Bar / Breadcrumb -->
      <nav class="breadcrumb-premium">
        <a routerLink="/coach-entrepreneurs" class="back-btn">
          <i class="pi pi-arrow-left"></i>
          <span>Retour à mes entrepreneurs</span>
        </a>
      </nav>

      <div *ngIf="isLoading" class="loading-overlay">
        <div class="premium-spinner"></div>
        <p>Chargement du profil...</p>
      </div>

      <div *ngIf="!isLoading && entrepreneur" class="profile-container">
        <!-- Header Section -->
        <header class="profile-header">
          <div class="header-bg"></div>
          <div class="header-content">
            <div class="avatar-col">
              <div class="avatar-large" [style.background]="getAvatarGradient(entrepreneur)">
                {{ getInitials(entrepreneur) }}
                <div class="status-indicator-online"></div>
              </div>
            </div>
            <div class="info-col">
              <div class="name-row">
                <h1>{{ entrepreneur.firstName }} {{ entrepreneur.lastName }}</h1>
                <span class="category-badge">{{ entrepreneur.secteur || 'MVP' }}</span>
              </div>
              <p class="startup-name">
                <i class="pi pi-building"></i>
                {{ entrepreneur.entreprise || 'Startup en création' }}
              </p>
              <div class="contact-chips">
                <div class="chip">
                  <i class="pi pi-envelope"></i>
                  <span>{{ entrepreneur.email }}</span>
                </div>
                <div class="chip">
                  <i class="pi pi-phone"></i>
                  <span>{{ entrepreneur.phoneNumber || 'Non renseigné' }}</span>
                </div>
              </div>
            </div>
            <div class="actions-col">
              <button class="btn-primary-premium" (click)="openTaskModal()">
                <i class="pi pi-plus"></i>
                <span>Nouvelle Tâche</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Main Content Grid -->
        <div class="content-grid">
          <!-- Sidebar Info -->
          <aside class="info-sidebar">
            <div class="info-card-premium">
              <h3>À propos de la startup</h3>
              <p class="startup-desc">{{ entrepreneur.startupDescription || 'Aucune description fournie.' }}</p>
              
              <div class="progression-tracker">
                <div class="track-header">
                  <span>Progression globale</span>
                  <span class="pct">{{ entrepreneur.completionRate }}%</span>
                </div>
                <div class="p-bar-bg-lite">
                  <div class="p-bar-fill-premium" [style.width.%]="entrepreneur.completionRate"></div>
                </div>
              </div>

              <div class="meta-list">
                <div class="meta-item">
                  <span class="label">Date d'inscription</span>
                  <span class="val">12 Mai 2024</span>
                </div>
                <div class="meta-item">
                   <span class="label">Dernière activité</span>
                   <span class="val">Il y a 2h</span>
                </div>
              </div>
            </div>
          </aside>

          <!-- Main Tabs Area -->
          <main class="tabs-area">
            <div class="tabs-nav-premium">
              <button class="tab-btn" [class.active]="activeTab === 'taches'" (click)="activeTab = 'taches'">
                <i class="pi pi-list"></i>
                <span>Plan d'action</span>
              </button>
              <button class="tab-btn" [class.active]="activeTab === 'livrables'" (click)="activeTab = 'livrables'">
                <i class="pi pi-file-import"></i>
                <span>Livrables</span>
                <span class="count-pill" *ngIf="entrepreneur.livrables?.length">{{ entrepreneur.livrables.length }}</span>
              </button>
              <button class="tab-btn" [class.active]="activeTab === 'reporting'" (click)="activeTab = 'reporting'">
                <i class="pi pi-chart-bar"></i>
                <span>Reporting</span>
              </button>
            </div>

            <div class="tab-pane-premium">
              <!-- Tâches -->
              <div *ngIf="activeTab === 'taches'" class="animate-in">
                <div class="pane-header">
                  <h2>Objectifs et Tâches</h2>
                </div>
                
                <div class="tasks-list">
                  <div *ngIf="!entrepreneur.tasks?.length" class="empty-state-lite">
                     <i class="pi pi-info-circle"></i>
                     <p>Aucune tâche assignée pour le moment.</p>
                  </div>
                  
                  <div *ngFor="let task of entrepreneur.tasks" class="task-card-premium">
                    <div class="task-check" [class.done]="task.status === 'TERMINEE'">
                      <i class="pi pi-check" *ngIf="task.status === 'TERMINEE'"></i>
                    </div>
                    <div class="task-main">
                      <div class="task-top">
                        <h4>{{ task.titre }}</h4>
                        <span class="task-badge-lite" [class.done]="task.status === 'TERMINEE'">
                          {{ task.status === 'TERMINEE' ? 'Terminé' : 'En cours' }}
                        </span>
                      </div>
                      <p class="task-desc">{{ task.description }}</p>
                      
                      <!-- Docs section -->
                      <div class="task-docs-row" *ngIf="task.documents?.length">
                         <div *ngFor="let doc of task.documents" class="doc-mini-card">
                            <i class="pi pi-file-pdf"></i>
                            <span class="doc-name">{{ doc.nom }}</span>
                            <a [href]="doc.cheminFichier" target="_blank" class="doc-view-btn"><i class="pi pi-eye"></i></a>
                         </div>
                      </div>

                      <div class="task-footer">
                        <button class="btn-attach" (click)="triggerFileInput(task.id)">
                          <i class="pi pi-paperclip"></i>
                          <span>{{ uploadingTaskId === task.id ? 'Upload...' : 'Joindre un fichier' }}</span>
                        </button>
                        <input type="file" [id]="'file_' + task.id" class="hidden" (change)="onTaskFileSelected($event, task)" multiple />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Livrables -->
              <div *ngIf="activeTab === 'livrables'" class="animate-in">
                <div class="pane-header">
                  <h2>Livrables reçus</h2>
                </div>

                <div class="livrables-grid-detail">
                  <div *ngIf="!entrepreneur.livrables?.length" class="empty-state-lite">
                    <i class="pi pi-folder-open"></i>
                    <p>En attente de livrables de l'entrepreneur.</p>
                  </div>

                  <div *ngFor="let livrable of entrepreneur.livrables" class="doc-premium-card">
                    <div class="doc-card-header">
                      <div class="doc-icon-wrap" [class.pdf]="livrable.nom.endsWith('.pdf')">
                        <i class="pi pi-file"></i>
                      </div>
                      <div class="doc-meta-info">
                        <span class="doc-date">{{ livrable.dateUpload | date:'d MMM yyyy' }}</span>
                        <h4 class="doc-filename">{{ livrable.nom }}</h4>
                      </div>
                    </div>
                    <div class="doc-card-body">
                      <div class="task-ref">
                        <i class="pi pi-link"></i>
                        <span>{{ livrable.tacheTitre || 'Livrable libre' }}</span>
                      </div>
                      <div class="status-badge-row">
                         <span class="status-pill" [ngClass]="getStatusInfo(livrable.statut).class">
                            <i [class]="getStatusInfo(livrable.statut).icon"></i>
                            {{ getStatusInfo(livrable.statut).text }}
                         </span>
                      </div>
                    </div>
                    <div class="doc-card-actions">
                      <a [href]="livrable.url" target="_blank" class="btn-view-glass"><i class="pi pi-eye"></i></a>
                      <a [href]="livrable.url" download class="btn-download-glass"><i class="pi pi-download"></i></a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Reporting -->
              <div *ngIf="activeTab === 'reporting'" class="animate-in">
                <div class="pane-header">
                  <h2>Notes de suivi</h2>
                  <div class="actions">
                    <button class="btn-lite-primary" (click)="goToCreateReport(entrepreneur.id)">
                      <i class="pi pi-plus"></i> Ajouter une note
                    </button>
                    <button class="btn-lite-secondary" (click)="downloadConsolidatedReports(entrepreneur.id)" *ngIf="entrepreneur.notes?.length" [disabled]="isDownloadingPdf">
                       <i class="pi" [class.pi-spin]="isDownloadingPdf" [class.pi-spinner]="isDownloadingPdf" [class.pi-download]="!isDownloadingPdf"></i>
                       PDF Consolidé
                    </button>
                  </div>
                </div>

                <div class="reports-timeline">
                  <div *ngIf="!entrepreneur.notes?.length" class="empty-state-lite">
                     <p>Aucun rapport de session rédigé.</p>
                  </div>

                  <div *ngFor="let note of entrepreneur.notes" class="report-node">
                    <div class="node-marker"></div>
                    <div class="report-bubble">
                      <div class="bubble-header">
                        <span class="report-date">{{ note.date | date:'mediumDate' }}</span>
                      </div>
                      <div class="bubble-content">
                        <h5>Synthèse de la séance</h5>
                        <p>{{ note.synthese }}</p>
                        <div class="bubble-footer-info">
                           <strong>Appréciation :</strong> {{ note.appreciation }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <!-- Task Modal -->
      <div *ngIf="showTaskModal" class="modal-overlay-premium" (click)="showTaskModal = false">
        <div class="modal-box-premium" (click)="$event.stopPropagation()">
          <div class="modal-header-premium">
            <h2>Nouvelle Tâche 📝</h2>
            <button class="close-circle-btn" (click)="showTaskModal = false"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body-premium">
            <div class="form-field">
              <label>Titre de la tâche</label>
              <input type="text" [(ngModel)]="newTask.titre" placeholder="Ex: Étude de marché" class="premium-input-field" />
            </div>
            <div class="form-field">
              <label>Description</label>
              <textarea [(ngModel)]="newTask.description" rows="3" placeholder="Détails de la mission..." class="premium-input-field"></textarea>
            </div>
            <div class="form-row-premium">
              <div class="form-field">
                <label>Date de début</label>
                <input type="date" [(ngModel)]="newTask.dateDebut" class="premium-input-field" />
              </div>
              <div class="form-field">
                <label>Date limite</label>
                <input type="date" [(ngModel)]="newTask.dateLimite" class="premium-input-field" />
              </div>
            </div>
            <div class="form-field">
              <label>Pièce jointe</label>
              <div class="file-drop-lite" (click)="newTaskFileInput.click()">
                <i class="pi pi-cloud-upload"></i>
                <span>{{ newTaskFile ? newTaskFile.name : 'Cliquez pour ajouter un document' }}</span>
                <input type="file" #newTaskFileInput class="hidden" (change)="onNewTaskFileSelected($event)" />
              </div>
            </div>
          </div>
          <div class="modal-footer-premium">
            <button class="btn-cancel-lite" (click)="showTaskModal = false">Annuler</button>
            <button class="btn-submit-premium" (click)="submitNewTask()" [disabled]="isCreatingTask || !newTask.titre || !newTask.dateLimite">
              <i class="pi pi-spin pi-spinner" *ngIf="isCreatingTask"></i>
              <span>{{ isCreatingTask ? 'Création...' : 'Créer la tâche' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ent-detail-premium { padding: 2rem 4rem; background: #fcfdfe; min-height: 100vh; font-family: var(--font-family); }
    
    .breadcrumb-premium { margin-bottom: 2rem; }
    .back-btn { display: flex; align-items: center; gap: 0.75rem; color: #64748b; text-decoration: none; font-weight: 700; transition: color 0.2s; }
    .back-btn:hover { color: #0f172a; }

    .loading-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; color: #64748b; }
    .premium-spinner { width: 48px; height: 48px; border: 4px solid #f1f5f9; border-top-color: #0f172a; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem; }

    .profile-header { background: white; border-radius: 40px; overflow: hidden; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; margin-bottom: 3rem; }
    .header-bg { height: 120px; background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%); }
    .header-content { padding: 0 3rem 2.5rem; display: flex; align-items: flex-end; gap: 2.5rem; margin-top: -50px; }
    
    .avatar-large { width: 140px; height: 140px; border-radius: 45px; border: 6px solid white; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 800; color: white; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .status-indicator-online { width: 24px; height: 24px; background: #22c55e; border: 4px solid white; border-radius: 50%; position: absolute; bottom: 5px; right: 5px; }

    .info-col { flex: 1; padding-top: 55px; }
    .name-row { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 0.5rem; }
    .name-row h1 { font-size: 2.2rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -1px; }
    .category-badge { padding: 0.4rem 1rem; background: #eff6ff; color: #3b82f6; border-radius: 100px; font-weight: 800; font-size: 0.8rem; }
    .startup-name { font-size: 1.1rem; color: #64748b; font-weight: 600; margin: 0 0 1.25rem; display: flex; align-items: center; gap: 0.5rem; }
    
    .contact-chips { display: flex; gap: 1rem; }
    .chip { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 1rem; background: #f8fafc; border-radius: 100px; font-size: 0.9rem; color: #475569; font-weight: 600; border: 1px solid #f1f5f9; }

    .content-grid { display: grid; grid-template-columns: 340px 1fr; gap: 3rem; }
    
    .info-card-premium { background: white; border-radius: 32px; padding: 2.5rem; border: 1px solid #f1f5f9; position: sticky; top: 2rem; }
    .info-card-premium h3 { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 1rem; }
    .startup-desc { color: #64748b; font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem; }
    
    .progression-tracker { margin-bottom: 2.5rem; }
    .track-header { display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-weight: 800; font-size: 0.85rem; color: #0f172a; }
    .p-bar-bg-lite { height: 10px; background: #f1f5f9; border-radius: 10px; }
    .p-bar-fill-premium { height: 100%; background: linear-gradient(90deg, #FF4D85, #FF758C); border-radius: 100px; }

    .meta-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .meta-item .label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .meta-item .val { font-size: 0.95rem; font-weight: 700; color: #475569; }

    .tabs-nav-premium { display: flex; gap: 1rem; background: #f1f5f9; padding: 0.6rem; border-radius: 20px; margin-bottom: 2.5rem; }
    .tab-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.9rem; border-radius: 15px; border: none; background: transparent; cursor: pointer; color: #64748b; font-weight: 700; transition: all 0.2s; }
    .tab-btn.active { background: white; color: #0f172a; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    .count-pill { background: #FF4D85; color: white; font-size: 0.7rem; padding: 0.1rem 0.5rem; border-radius: 100px; }

    .animate-in { animation: slideIn 0.3s ease-out; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .pane-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .pane-header h2 { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 0; }
    
    .task-card-premium { background: white; border-radius: 24px; padding: 1.5rem; border: 1px solid #f1f5f9; display: flex; gap: 1.5rem; margin-bottom: 1.25rem; transition: all 0.2s; }
    .task-card-premium:hover { border-color: #cbd5e1; transform: translateX(5px); }
    
    .task-check { width: 28px; height: 28px; border-radius: 10px; border: 2px solid #e2e8f0; flex-shrink: 0; margin-top: 0.25rem; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .task-check.done { background: #22c55e; border-color: #22c55e; color: white; }
    
    .task-main { flex: 1; }
    .task-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
    .task-top h4 { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0; }
    .task-badge-lite { font-size: 0.7rem; font-weight: 800; padding: 0.25rem 0.75rem; border-radius: 100px; background: #f1f5f9; color: #64748b; }
    .task-badge-lite.done { background: #ecfdf5; color: #10b981; }
    .task-desc { color: #64748b; font-size: 0.95rem; margin-bottom: 1.25rem; }

    .task-docs-row { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem; }
    .doc-mini-card { display: flex; align-items: center; gap: 0.6rem; background: #f8fafc; padding: 0.5rem 0.75rem; border-radius: 12px; border: 1px solid #f1f5f9; }
    .doc-mini-card i { color: #ef4444; }
    .doc-name { font-size: 0.8rem; font-weight: 600; color: #475569; max-width: 150px; overflow: hidden; text-overflow: ellipsis; }
    .doc-view-btn { color: #64748b; cursor: pointer; }

    .btn-attach { background: transparent; border: 1px dashed #cbd5e1; padding: 0.5rem 1rem; border-radius: 12px; font-weight: 700; font-size: 0.85rem; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
    .btn-attach:hover { background: #f8fafc; color: #0f172a; border-color: #0f172a; }

    .livrables-grid-detail { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .doc-premium-card { background: white; border-radius: 24px; border: 1px solid #f1f5f9; padding: 1.5rem; }
    .doc-card-header { display: flex; gap: 1rem; margin-bottom: 1.25rem; }
    .doc-icon-wrap { width: 48px; height: 48px; border-radius: 14px; background: #f1f5f9; color: #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .doc-icon-wrap.pdf { background: #fff1f2; color: #f43f5e; }
    .doc-meta-info .doc-date { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .doc-filename { font-size: 0.95rem; font-weight: 800; color: #0f172a; margin: 0.2rem 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
    .task-ref { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #3b82f6; font-weight: 700; margin-bottom: 0.75rem; }
    
    .status-badge-row { margin-bottom: 1.5rem; }
    .status-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.75rem; border-radius: 100px; font-size: 0.75rem; font-weight: 800; }
    .status-accepted { background: #ecfdf5; color: #10b981; }
    .status-revision { background: #eff6ff; color: #3b82f6; }
    .status-rejected { background: #fff1f2; color: #f43f5e; }
    .status-pending { background: #fffbeb; color: #d97706; }

    .doc-card-actions { display: flex; gap: 0.75rem; }
    .btn-view-glass, .btn-download-glass { flex: 1; padding: 0.6rem; border-radius: 12px; background: #f8fafc; color: #475569; display: flex; align-items: center; justify-content: center; border: 1px solid #f1f5f9; transition: all 0.2s; }
    .btn-view-glass:hover { background: #0f172a; color: white; }

    .reports-timeline { position: relative; padding-left: 2rem; }
    .reports-timeline::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: #f1f5f9; }
    .report-node { position: relative; margin-bottom: 2.5rem; }
    .node-marker { position: absolute; left: -2.3rem; top: 1.5rem; width: 12px; height: 12px; border-radius: 50%; background: white; border: 3px solid #0f172a; }
    .report-bubble { background: white; border-radius: 24px; border: 1px solid #f1f5f9; padding: 1.5rem; }
    .report-date { font-size: 0.85rem; font-weight: 800; color: #94a3b8; }
    .bubble-content h5 { font-size: 1rem; font-weight: 800; color: #0f172a; margin: 1rem 0 0.5rem; }
    .bubble-content p { color: #475569; line-height: 1.6; margin-bottom: 1.25rem; }
    .bubble-footer-info { font-size: 0.85rem; color: #64748b; padding-top: 1rem; border-top: 1px dashed #e2e8f0; }

    .modal-overlay-premium { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-box-premium { background: white; border-radius: 32px; width: 100%; max-width: 550px; overflow: hidden; animation: zoomIn 0.2s ease-out; }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .modal-header-premium { padding: 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .modal-header-premium h2 { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0; }
    .close-circle-btn { width: 36px; height: 36px; border-radius: 50%; border: none; background: #f1f5f9; color: #64748b; cursor: pointer; }
    .modal-body-premium { padding: 2rem; }
    .form-field { margin-bottom: 1.5rem; }
    .form-field label { display: block; font-weight: 700; font-size: 0.9rem; color: #475569; margin-bottom: 0.6rem; }
    .premium-input-field { width: 100%; padding: 0.85rem 1.25rem; border-radius: 14px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.95rem; color: #0f172a; outline: none; }
    .premium-input-field:focus { border-color: #0f172a; background: white; }
    .form-row-premium { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .file-drop-lite { border: 2px dashed #e2e8f0; border-radius: 16px; padding: 1.5rem; text-align: center; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .file-drop-lite:hover { border-color: #0f172a; color: #0f172a; background: #f8fafc; }
    .modal-footer-premium { padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-cancel-lite { padding: 0.85rem 1.5rem; border-radius: 14px; border: 1px solid #e2e8f0; background: white; font-weight: 700; color: #64748b; cursor: pointer; }
    .btn-submit-premium { padding: 0.85rem 2rem; border-radius: 14px; background: #0f172a; color: white; border: none; font-weight: 700; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; }
    .btn-submit-premium:disabled { opacity: 0.5; }
    .hidden { display: none; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class CoachEntrepreneurDetailComponent implements OnInit {
  activeTab: string = 'taches';
  showTaskModal: boolean = false;
  entrepreneur: CoachEntrepreneurDetailDTO | null = null;
  isLoading: boolean = true;
  coachId: number | null = null;

  isUploading: boolean = false;
  uploadingTaskId: number | null = null;
  isDownloadingPdf: boolean = false;
  coachProfile: any = null;

  getAvatarGradient(ent: any): string {
    const colors = [
        ['#FF4D85', '#FF758C'],
        ['#7C3AED', '#A78BFA'],
        ['#2563EB', '#60A5FA'],
        ['#059669', '#34D399'],
        ['#D97706', '#FBBF24']
    ];
    const index = (ent.id || 0) % colors.length;
    return `linear-gradient(135deg, ${colors[index][0]} 0%, ${colors[index][1]} 100%)`;
  }

  getInitials(ent: any): string {
    if (!ent.firstName && !ent.lastName) return 'E';
    return ((ent.firstName?.[0] || '') + (ent.lastName?.[0] || '')).toUpperCase();
  }

  getStatusInfo(status: string) {
    switch (status) {
      case 'ACCEPTED':
      case 'VALIDE':
      case 'APPROVED':
      case 'APPROUVE':
        return { text: 'Accepté', class: 'status-accepted', icon: 'pi pi-check-circle' };
      case 'REVISION':
      case 'EN_REVISION':
        return { text: 'À réviser', class: 'status-revision', icon: 'pi pi-refresh' };
      case 'REJECTED':
      case 'REJETE':
        return { text: 'Rejeté', class: 'status-rejected', icon: 'pi pi-times-circle' };
      case 'PENDING':
      case 'PENDING_REVIEW':
      case 'SOUMIS':
      case 'SUBMITTED':
      default:
        return { text: 'En attente', class: 'status-pending', icon: 'pi pi-clock' };
    }
  }

  // ── Task creation ──────────────────────────────
  newTask: any = {
    titre: '',
    description: '',
    priorite: 'Moyenne',
    dateDebut: '',
    dateLimite: ''
  };
  newTaskFile: File | null = null;
  isCreatingTask: boolean = false;

  // ── Activités disponibles pour le sélecteur ───
  activites: any[] = [];
  isLoadingActivites: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private coachService: CoachService,
    private tacheService: TacheService,
    private authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  goToCreateReport(entrepreneurId: number): void {
    this.router.navigate(['/rapport-sessions'], {
      queryParams: { entrepreneurId, action: 'new' }
    });
  }

  ngOnInit(): void {
    const rawCoachId = this.authService.getUserId();
    this.coachId = typeof rawCoachId === 'string' ? parseInt(rawCoachId, 10) : rawCoachId;

    if (this.coachId) {
      this.coachService.getCoachProfile().subscribe({
        next: (profile) => { this.coachProfile = profile; this.cdr.detectChanges(); },
        error: (err) => console.error('Error loading coach profile:', err)
      });
    }

    this.route.params.subscribe(params => {
      const entrepreneurId = +params['id'];
      if (entrepreneurId && this.coachId) {
        this.loadEntrepreneurDetails(this.coachId, entrepreneurId);
      } else {
        this.isLoading = false;
        this.toastr.error('ID Entrepreneur ou Coach manquant', 'Erreur');
      }
    });
  }

  getCoachInitials(): string {
    if (!this.coachProfile) return '';
    return (this.coachProfile.firstName?.charAt(0) || '') + (this.coachProfile.lastName?.charAt(0) || '');
  }

  loadEntrepreneurDetails(coachId: number, entrepreneurId: number): void {
    this.isLoading = true;
    this.coachService.getEntrepreneurDetail(coachId, entrepreneurId).subscribe({
      next: (data) => {
        this.entrepreneur = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        // Charger les activités après avoir chargé l'entrepreneur
        this.loadActivitesForEntrepreneur(entrepreneurId);
      },
      error: (err) => {
        console.error('Error loading entrepreneur details:', err);
        this.isLoading = false;
        this.toastr.error('Erreur lors du chargement des détails', 'Erreur');
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Charge toutes les activités des sprints des programmes de l'entrepreneur
   * en appelant l'endpoint global des sprints détaillés.
   */
  loadActivitesForEntrepreneur(entrepreneurId: number): void {
    this.isLoadingActivites = true;
    const token = this.getAuthToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    // On récupère tous les sprints détaillés globaux et on filtre
    // par responsableId = entrepreneurId, ou on prend tous les sprints
    // de tous les programmes auxquels l'entrepreneur est associé.
    this.http.get<any[]>(
      `${environment.apiUrl}/backoffice/programmes/sprints-detail-global`,
      { headers }
    ).subscribe({
      next: (sprints) => {
        const allActivites: any[] = [];
        sprints.forEach(sprint => {
          if (sprint.activites && sprint.activites.length > 0) {
            sprint.activites.forEach((act: any) => {
              // Inclure toutes les activités, pas seulement celles de l'entrepreneur
              // Le coach peut assigner une tâche à n'importe quelle activité du programme
              allActivites.push({
                id: act.id,
                nom: act.nom,
                sprintNom: sprint.nom,
                programmeNom: sprint.programmeNom,
                programmeId: sprint.programmeId,
                sprintId: sprint.id
              });
            });
          }
        });
        this.activites = allActivites;
        this.isLoadingActivites = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement activités:', err);
        this.isLoadingActivites = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Ouvre le modal et réinitialise le formulaire */
  openTaskModal(): void {
    this.newTask = {
      titre: '',
      description: '',
      priorite: 'Moyenne',
      dateDebut: '',
      dateLimite: ''
    };
    this.newTaskFile = null;
    this.showTaskModal = true;
  }

  triggerFileInput(taskId: number): void {
    const el = document.getElementById('file_' + taskId) as HTMLInputElement;
    if (el) el.click();
  }

  onTaskFileSelected(event: any, task: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0 || !this.coachId) return;

    const filesArray = Array.from(files);
    this.uploadingTaskId = task.id;

    this.tacheService.uploadDocuments(task.id, filesArray, this.coachId).subscribe({
      next: (uploadedDocs) => {
        if (!task.documents) task.documents = [];
        task.documents.push(...uploadedDocs);
        this.uploadingTaskId = null;
        this.toastr.success('Documents chargés avec succès', 'Succès');
        this.cdr.detectChanges();
        event.target.value = '';
      },
      error: (err) => {
        console.error(err);
        this.uploadingTaskId = null;
        this.toastr.error('Erreur lors du chargement des documents', 'Erreur');
        this.cdr.detectChanges();
        event.target.value = '';
      }
    });
  }

  deleteTaskDocument(task: any, docId: number): void {
    if (!confirm('Supprimer ce document ?')) return;

    this.tacheService.deleteDocument(docId).subscribe({
      next: () => {
        task.documents = task.documents.filter((d: any) => d.id !== docId);
        this.toastr.success('Document supprimé', 'Succès');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Erreur lors de la suppression', 'Erreur');
      }
    });
  }

  onNewTaskFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      this.newTaskFile = files[0];
    } else {
      this.newTaskFile = null;
    }
  }

  submitNewTask(): void {
    if (!this.entrepreneur) return;
    
    if (!this.activites || this.activites.length === 0) {
      this.toastr.error("Aucune activité n'est disponible pour cet entrepreneur. Impossible de créer une tâche.", 'Erreur');
      return;
    }

    this.isCreatingTask = true;
    
    // Auto-select the first available activity to attach the task internally
    const activite = this.activites[0];

    if (!activite.programmeId) {
      this.toastr.error('Programme ID manquant pour l\'activité sélectionnée', 'Erreur');
      this.isCreatingTask = false;
      return;
    }

    const token = this.getAuthToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });

    const tachePayload = {
      titre: this.newTask.titre,
      description: this.newTask.description || '',
      responsableId: this.entrepreneur.id,
      priorite: this.newTask.priorite || 'Moyenne',
      dateDebut: this.newTask.dateDebut || null,
      dateLimite: this.newTask.dateLimite,
      difficulte: 'Moyenne',
      status: 'NON_DEMARREE'
    };

    // Le backend attend : { tache: {...}, kpiIds: [] }
    const body = { tache: tachePayload, kpiIds: [] };

    const url = `${environment.apiUrl}/backoffice/programmes/${activite.programmeId}/sprints/${activite.sprintId}/activities/${activite.id}/taches`;

    this.http.post<any>(url, body, { headers }).subscribe({
      next: (createdTask: any) => {
        if (this.newTaskFile) {
          const taskId = typeof createdTask.id === 'string' ? parseInt(createdTask.id, 10) : createdTask.id;
          this.tacheService.uploadDocuments(taskId, [this.newTaskFile], this.coachId || 0).subscribe({
            next: (docs) => {
              createdTask.documents = docs;
              this.finalizeTaskCreation(createdTask);
            },
            error: () => {
              this.toastr.warning("Tâche créée, mais la pièce jointe n'a pas pu être téléchargée.", 'Attention');
              this.finalizeTaskCreation(createdTask);
            }
          });
        } else {
          this.finalizeTaskCreation(createdTask);
        }
      },
      error: (err) => {
        console.error('Erreur création tâche:', err);
        const msg = err?.error?.message || 'Erreur lors de la création de la tâche';
        this.toastr.error(msg, 'Erreur');
        this.isCreatingTask = false;
        this.cdr.detectChanges();
      }
    });
  }

  finalizeTaskCreation(task: any): void {
    if (!this.entrepreneur!.tasks) this.entrepreneur!.tasks = [];
    this.entrepreneur!.tasks.unshift(task);
    this.toastr.success('Tâche créée avec succès', 'Succès');
    this.showTaskModal = false;
    this.isCreatingTask = false;
    this.newTask = { titre: '', description: '', priorite: 'Moyenne', dateDebut: '', dateLimite: '' };
    this.newTaskFile = null;
    this.cdr.detectChanges();
  }

  downloadConsolidatedReports(entrepreneurId: number): void {
    this.isDownloadingPdf = true;
    const token = this.getAuthToken();

    fetch(`${environment.apiUrl}/rapports/entrepreneur/${entrepreneurId}/consolidated`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rapport_Consolide_Entrepreneur_${entrepreneurId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        this.isDownloadingPdf = false;
        this.toastr.success('Le fichier a été téléchargé avec succès');
        this.cdr.detectChanges();
      })
      .catch(err => {
        console.error(err);
        this.isDownloadingPdf = false;
        this.toastr.error('Erreur lors du téléchargement du document consolidé');
        this.cdr.detectChanges();
      });
  }

  /** Récupère le token JWT depuis le localStorage ou sessionStorage */
  private getAuthToken(): string {
    return localStorage.getItem('accessToken')
      || sessionStorage.getItem('accessToken')
      || localStorage.getItem('token')
      || sessionStorage.getItem('token')
      || '';
  }
}