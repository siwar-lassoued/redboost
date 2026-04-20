import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachService, ProgrammeDTO, UserDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-coach-livrables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="livrables-page">
      <div class="page-header">
          <div>
              <h1>Livrables</h1>
              <p>Gérez les livrables déposés aux entrepreneurs</p>
          </div>
          <button class="btn-primary shadow-glow" (click)="openDepotModal()">
              <i class="pi pi-plus"></i> Déposer un livrable
          </button>
      </div>

      <!-- Search -->
      <div class="search-bar mb-6">
          <i class="pi pi-search"></i>
          <input type="text" placeholder="Rechercher par programme, tâche, entrepreneur..." [(ngModel)]="searchTerm" (ngModelChange)="filterLivrables()" />
      </div>

      <!-- Table -->
      <div class="table-card">
          <table class="livrables-table">
              <thead>
                  <tr>
                      <th>ENTREPRENEUR</th>
                      <th>PROGRAMME</th>
                      <th>TÂCHE ASSOCIÉE</th>
                      <th>DOCUMENT</th>
                      <th>DATE DE DÉPÔT</th>
                      <th>ACTIONS</th>
                  </tr>
              </thead>
              <tbody>
                  <tr *ngFor="let livrable of filteredLivrables">
                      <td class="font-semibold text-gray-800">{{livrable.entrepreneur}}</td>
                      <td>{{livrable.programme}}</td>
                      <td>{{livrable.tache}}</td>
                      <td>
                          <div class="doc-cell">
                              <i class="pi pi-file" [style.color]="getFileIconColor(livrable.fileName)"></i>
                              <div>
                                  <div class="doc-name">{{livrable.fileName}}</div>
                                  <div class="doc-size">{{livrable.fileSize}}</div>
                              </div>
                          </div>
                      </td>
                      <td>{{livrable.dateDepot}}</td>
                      <td>
                          <button class="download-link"><i class="pi pi-download"></i> Télécharger</button>
                      </td>
                  </tr>
                  <tr *ngIf="filteredLivrables.length === 0">
                      <td colspan="6" class="text-center text-gray-400 py-8">Aucun livrable trouvé.</td>
                  </tr>
              </tbody>
          </table>
      </div>

      <!-- Déposer un livrable Modal -->
      <div *ngIf="showDepotModal" class="modal-backdrop" (click)="showDepotModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                  <div>
                      <h2>📄 Déposer un livrable</h2>
                      <p class="text-sm text-gray-500 mt-1">Soumettez un livrable pour un ou plusieurs entrepreneurs</p>
                  </div>
                  <button class="close-btn" (click)="showDepotModal = false"><i class="pi pi-times"></i></button>
              </div>
              <div class="modal-body">
                  <div class="form-group mb-4">
                      <label>Titre du livrable *</label>
                      <input type="text" class="premium-input" [(ngModel)]="newLivrable.titre" placeholder="Ex: Pitch Deck finalisé" />
                  </div>
                  <div class="form-group mb-4">
                      <label>Nom du programme *</label>
                      <select class="premium-input" [(ngModel)]="newLivrable.programme">
                          <option value="">Sélectionner un programme...</option>
                          <option *ngFor="let p of programmes" [value]="p.nom">{{p.nom}}</option>
                      </select>
                  </div>
                  <div class="form-group mb-4">
                      <label>Upload du document *</label>
                      <div class="upload-zone" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
                          <div class="upload-content">
                              <div class="upload-icon"><i class="pi pi-cloud-upload"></i></div>
                              <p class="upload-text">Cliquez pour télécharger un fichier</p>
                              <p class="upload-hint">PDF, DOCX, ZIP • Max 10 MB</p>
                              <button class="browse-btn" type="button">Parcourir</button>
                          </div>
                          <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)" accept=".pdf,.docx,.xlsx,.pptx,.zip" />
                      </div>
                      <div *ngIf="selectedFile" class="selected-file">
                          <i class="pi pi-file"></i>
                          <span>{{selectedFile.name}} ({{formatFileSize(selectedFile.size)}})</span>
                          <button class="remove-file" (click)="selectedFile = null"><i class="pi pi-times"></i></button>
                      </div>
                  </div>
                  <div class="form-group mb-4">
                      <label>Choisir un ou plusieurs entrepreneurs *</label>
                      <div class="entrepreneur-selector">
                          <div class="search-inside">
                              <i class="pi pi-search"></i>
                              <input type="text" placeholder="Rechercher un entrepreneur..." [(ngModel)]="entrepreneurSearch" />
                          </div>
                          <div class="entrepreneur-list">
                              <label *ngFor="let e of getFilteredEntrepreneurs()" class="entrepreneur-option">
                                  <input type="checkbox" [(ngModel)]="e.selected" />
                                  <div>
                                      <div class="ent-name">{{e.firstName}} {{e.lastName}}</div>
                                      <div class="ent-sub">{{e.entreprise || 'N/A'}} • {{e.secteur || 'N/A'}}</div>
                                  </div>
                              </label>
                              <div *ngIf="getFilteredEntrepreneurs().length === 0" class="text-sm text-gray-400 p-3">Aucun entrepreneur trouvé.</div>
                          </div>
                      </div>
                  </div>
                  <div class="modal-actions">
                      <button class="btn-outline" (click)="showDepotModal = false">Annuler</button>
                      <button class="btn-primary" (click)="deposerLivrable()">Déposer le livrable</button>
                  </div>
              </div>
          </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-overlay">
          <div class="spinner"></div>
      </div>
    </div>
  `,
  styles: [`
    .livrables-page { padding: 2rem; background: #f8f9fa; min-height: calc(100vh - 70px); font-family: var(--font-family); margin-top: -1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 2.2rem; font-weight: 700; color: #2D3748; margin: 0; }
    .page-header p { color: #718096; font-size: 1rem; margin-top: 0.3rem; }
    .search-bar { position: relative; }
    .search-bar input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.8rem; border-radius: 12px; border: 1px solid #E2E8F0; background: white; font-family: inherit; font-size: 0.95rem; outline: none; }
    .search-bar input:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); }
    .search-bar i { position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); color: #A0AEC0; }
    .table-card { background: white; border-radius: 1rem; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #EDF2F7; }
    .livrables-table { width: 100%; border-collapse: collapse; }
    .livrables-table th { text-align: left; padding: 1rem 1.5rem; font-size: 0.7rem; font-weight: 700; color: #A0AEC0; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #EDF2F7; background: #FAFBFC; }
    .livrables-table td { padding: 1.2rem 1.5rem; font-size: 0.9rem; color: #4A5568; border-bottom: 1px solid #EDF2F7; vertical-align: middle; }
    .livrables-table tr:last-child td { border-bottom: none; }
    .livrables-table tr:hover td { background: #FAFBFC; }
    .doc-cell { display: flex; align-items: center; gap: 0.6rem; }
    .doc-name { font-weight: 600; color: #2D3748; font-size: 0.85rem; }
    .doc-size { font-size: 0.75rem; color: #A0AEC0; }
    .download-link { background: none; border: none; color: #FF4D85; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; }
    .download-link:hover { text-decoration: underline; }
    .btn-primary { background: var(--gradient-pink); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: transform 0.2s; }
    .btn-primary:hover { transform: translateY(-2px); }
    .shadow-glow { box-shadow: 0 4px 15px rgba(233,30,99,0.4); }
    .btn-outline { background: white; border: 1px solid #E2E8F0; color: #4A5568; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; overflow-y: auto; }
    .modal-content { background: white; border-radius: 1.5rem; width: 100%; max-width: 650px; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.1); animation: slide-up 0.3s ease-out; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .modal-header h2 { font-size: 1.3rem; font-weight: 700; color: #2D3748; margin: 0; }
    .close-btn { background: none; border: none; font-size: 1.2rem; color: #A0AEC0; cursor: pointer; }
    .form-group label { display: block; font-size: 0.9rem; font-weight: 600; color: #4A5568; margin-bottom: 0.5rem; }
    .premium-input { width: 100%; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid #E2E8F0; background: #F8FAFC; font-family: inherit; font-size: 0.95rem; color: #2D3748; outline: none; }
    .premium-input:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); background: white; }
    .upload-zone { border: 2px dashed #E2E8F0; border-radius: 1rem; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.2s; background: #FAFBFC; }
    .upload-zone:hover { border-color: #FF4D85; background: #FFF5F7; }
    .upload-icon { width: 50px; height: 50px; border-radius: 50%; background: #FFF5F7; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.8rem; }
    .upload-icon i { font-size: 1.3rem; color: #FF4D85; }
    .upload-text { font-weight: 600; color: #4A5568; margin: 0; }
    .upload-hint { font-size: 0.8rem; color: #A0AEC0; margin: 0.3rem 0 1rem; }
    .browse-btn { background: white; border: 1px solid #FF4D85; color: #FF4D85; padding: 0.4rem 1.2rem; border-radius: 20px; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
    .selected-file { display: flex; align-items: center; gap: 0.5rem; padding: 0.8rem 1rem; margin-top: 0.8rem; background: #F0FFF4; border: 1px solid #C6F6D5; border-radius: 10px; font-size: 0.85rem; color: #276749; }
    .remove-file { background: none; border: none; color: #A0AEC0; cursor: pointer; margin-left: auto; }
    .entrepreneur-selector { border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; }
    .search-inside { position: relative; border-bottom: 1px solid #EDF2F7; }
    .search-inside input { width: 100%; padding: 0.7rem 1rem 0.7rem 2.5rem; border: none; background: #FAFBFC; font-family: inherit; font-size: 0.9rem; outline: none; }
    .search-inside i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #A0AEC0; }
    .entrepreneur-list { max-height: 180px; overflow-y: auto; padding: 0.5rem; }
    .entrepreneur-option { display: flex; align-items: center; gap: 0.8rem; padding: 0.6rem 0.8rem; cursor: pointer; border-radius: 8px; }
    .entrepreneur-option:hover { background: #F7FAFC; }
    .entrepreneur-option input[type="checkbox"] { width: 16px; height: 16px; accent-color: #FF4D85; }
    .ent-name { font-weight: 600; color: #2D3748; font-size: 0.9rem; }
    .ent-sub { color: #A0AEC0; font-size: 0.75rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
    .hidden { display: none; }
    .loading-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.7); z-index: 999; display: flex; align-items: center; justify-content: center; }
    .spinner { width: 40px; height: 40px; border: 4px solid #EDF2F7; border-top-color: #FF4D85; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class CoachLivrablesComponent implements OnInit {
  loading: boolean = false;
  searchTerm: string = '';
  showDepotModal: boolean = false;
  selectedFile: File | null = null;
  entrepreneurSearch: string = '';

  newLivrable = { titre: '', programme: '' };

  programmes: ProgrammeDTO[] = [];
  entrepreneurs: (UserDTO & { selected?: boolean })[] = [];
  livrables: any[] = [];
  filteredLivrables: any[] = [];

  constructor(
    private coachService: CoachService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadProgrammes();
    this.loadEntrepreneurs();
  }

  loadProgrammes() {
    this.coachService.getProgrammes().subscribe({
      next: (data) => this.programmes = data,
      error: () => {}
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
    this.newLivrable = { titre: '', programme: '' };
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
      l.entrepreneur.toLowerCase().includes(term) ||
      l.programme.toLowerCase().includes(term) ||
      l.tache.toLowerCase().includes(term) ||
      l.fileName.toLowerCase().includes(term)
    );
  }

  getFileIconColor(fileName: string): string {
    if (fileName.endsWith('.pdf')) return '#E53E3E';
    if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) return '#ED8936';
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return '#38A169';
    return '#4A5568';
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
    if (!this.newLivrable.titre || !this.newLivrable.programme || !this.selectedFile || selectedEnts.length === 0) {
      return;
    }

    // Add to local list for each selected entrepreneur
    for (const ent of selectedEnts) {
      this.livrables.push({
        entrepreneur: `${ent.firstName} ${ent.lastName}`,
        programme: this.newLivrable.programme,
        tache: this.newLivrable.titre,
        fileName: this.selectedFile!.name,
        fileSize: this.formatFileSize(this.selectedFile!.size),
        dateDepot: new Date().toLocaleDateString('fr-FR')
      });
    }

    this.filteredLivrables = [...this.livrables];
    this.showDepotModal = false;
    this.newLivrable = { titre: '', programme: '' };
    this.selectedFile = null;
    this.entrepreneurs.forEach(e => e.selected = false);
  }
}
