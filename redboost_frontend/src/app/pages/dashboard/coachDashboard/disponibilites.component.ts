import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachService, DisponibiliteDTO, SessionCoachDTO, ThematiqueCoachingDTO, CoachCalendarEventDTO, ProgrammeDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';

interface DateSlotGroup {
  date: string;
  slots: { start: string; end: string }[];
}

@Component({
  selector: 'app-coach-disponibilites',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calendar-page">
      <!-- Page Header -->
      <div class="page-header">
          <div class="page-title-row">
              <div class="page-icon">📅</div>
              <div>
                  <h1>Calendrier & Disponibilités</h1>
                  <p>Gérez vos créneaux et sessions planifiées</p>
              </div>
          </div>
          <div class="header-actions">
              <span class="event-count-badge">● {{calendarEvents.length}} événements programmés</span>
              <button class="btn-primary shadow-glow" (click)="openDispoModal()">
                  <i class="pi pi-plus"></i> Ajouter disponibilité
              </button>
              <button class="btn-outline" [disabled]="disponibilites.length === 0" (click)="openEditDispoModal()">
                  <i class="pi pi-pencil"></i> Modifier disponibilité
              </button>
          </div>
      </div>

      <!-- Thématique Filter Banner -->
      <div class="thematique-filter" *ngIf="thematiques.length > 0">
        <div class="tf-label"><i class="pi pi-calendar-clock"></i> Afficher les disponibilités pour :</div>
        <div class="tf-options">
          <button class="tf-option" [class.active]="!selectedFilterThematiqueId" (click)="setFilterThematique(null)">
            Toutes les thématiques
          </button>
          <button *ngFor="let t of thematiques" class="tf-option" [class.active]="selectedFilterThematiqueId === t.id" (click)="setFilterThematique(t.id!)">
            {{ t.nom }}
            <span class="tf-dates">({{ t.dateDebut | date:'dd/MM' }} → {{ t.dateFin | date:'dd/MM' }})</span>
          </button>
        </div>
      </div>
      <div class="thematique-info-bar" *ngIf="activeFilterThematique">
        <i class="pi pi-info-circle"></i>
        <span>Disponibilités pour : <strong>{{ activeFilterThematique.nom }}</strong> &mdash;
          {{ activeFilterThematique.dateDebut | date:'dd MMMM yyyy' }} → {{ activeFilterThematique.dateFin | date:'dd MMMM yyyy' }}
        </span>
        <span class="tib-hint">Les dates en dehors de cette période sont grisées</span>
      </div>

      <!-- Main Content: Calendar + Sidebar -->
      <div class="main-layout">
          <!-- Calendar Grid -->
          <div class="calendar-card">
              <div class="month-header">
                  <h2>{{getMonthName()}} {{currentYear}}</h2>
                  <div class="month-nav">
                      <button class="nav-btn" (click)="prevMonth()"><i class="pi pi-chevron-left"></i></button>
                      <button class="nav-btn" (click)="nextMonth()"><i class="pi pi-chevron-right"></i></button>
                  </div>
              </div>
              <div class="day-headers">
                  <div class="day-header" *ngFor="let d of dayLabels">{{d}}</div>
              </div>
              <div class="calendar-grid">
                  <div *ngFor="let cell of calendarCells" class="calendar-cell"
                    [class.other-month]="!cell.currentMonth"
                    [class.today]="cell.isToday"
                    [class.out-of-range]="isOutOfRange(cell.fullDate)">
                      <div class="cell-day" [class.today-circle]="cell.isToday">{{cell.day}}</div>
                      <div class="cell-events">
                          <div *ngFor="let ev of getEventsForDay(cell.fullDate)" class="event-chip" [style.background]="ev.color">
                              {{ev.title | slice:0:12}}{{ev.title.length > 12 ? '...' : ''}}
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Right Sidebar -->
          <div class="sidebar">
              <div class="sidebar-section">
                  <h3>Événements à venir <span class="count-badge">{{upcomingEvents.length}}</span></h3>
                  <div *ngIf="upcomingEvents.length > 0" class="next-event-label">● Prochain événement</div>
                  <div *ngFor="let event of upcomingEvents; let i = index" class="event-card" [class.highlighted]="i === 0">
                      <div class="event-icon" [style.background]="'#FFF5F7'">
                          <i class="pi pi-calendar" style="color: #FF4D85"></i>
                      </div>
                      <div class="event-details">
                          <div class="event-name">{{event.title}}</div>
                          <div class="event-datetime"><i class="pi pi-calendar"></i> {{event.date}} • {{event.time}}</div>
                      </div>
                  </div>
                  <div *ngIf="upcomingEvents.length === 0" class="text-sm text-gray-400 italic">Aucun événement à venir.</div>
              </div>

              <!-- Disponibilités actives -->
              <div class="sidebar-section">
                  <h3>Disponibilités actives <span class="count-badge">{{disponibilites.length}}</span></h3>
                  <div *ngFor="let dispo of disponibilites" class="dispo-item">
                      <div class="dispo-info">
                          <strong>{{dispo.thematiqueNom || 'Thématique'}}</strong>
                          <span>Du {{dispo.dateDebut | date:'dd/MM/yyyy'}} au {{dispo.dateFin | date:'dd/MM/yyyy'}}</span>
                      </div>
                      <div class="dispo-actions">
                        <button (click)="openEditDispoModal(dispo)" class="btn-icon-edit"><i class="pi pi-pencil"></i></button>
                        <button (click)="deleteDispo(dispo.id!)" class="btn-icon-danger"><i class="pi pi-trash"></i></button>
                      </div>
                  </div>
                  <div *ngIf="disponibilites.length === 0" class="text-sm text-gray-400 italic">Aucune disponibilité.</div>
              </div>
          </div>
      </div>

      <!-- Modal Ajouter une disponibilité -->
      <div *ngIf="showDispoModal" class="modal-backdrop" (click)="showDispoModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                  <div>
                      <h2>Ajouter une disponibilité</h2>
                      <p class="text-sm text-gray-500 mt-1">Créez un nouveau créneau de disponibilité</p>
                  </div>
                  <button class="close-btn" (click)="showDispoModal = false"><i class="pi pi-times"></i></button>
              </div>
              <div class="modal-body">
                  <div class="form-group">
                      <label>Titre de la disponibilité *</label>
                      <input type="text" class="premium-input" [(ngModel)]="newDispoTitle" placeholder="Ex: Session individuelle Boost Tech">
                      <p *ngIf="defaultTitle" class="field-help" style="color:#059669;"><i class="pi pi-check-circle" style="margin-right:4px;"></i> Pré-rempli depuis le programme : <strong>{{ defaultTitle }}</strong></p>
                  </div>

                  <div class="form-group">
                      <label>Thématique *</label>
                      <select class="premium-input" [(ngModel)]="selectedThematiqueId" (ngModelChange)="onThematiqueSelected()">
                           <option [ngValue]="null">Sélectionner une thématique...</option>
                          <option *ngFor="let t of thematiques" [ngValue]="t.id">
                            {{t.nom}} ({{t.dateDebut | date:'shortDate'}} - {{t.dateFin | date:'shortDate'}})
                          </option>
                      </select>
                  </div>

                  <div *ngIf="selectedThematiqueObj" class="thematique-dates-banner">
                      <i class="pi pi-info-circle"></i>
                      <span>Disponibilités du <strong>{{ selectedThematiqueObj.dateDebut | date:'dd/MM/yyyy' }}</strong> au <strong>{{ selectedThematiqueObj.dateFin | date:'dd/MM/yyyy' }}</strong></span>
                  </div>
                  <div *ngIf="dispoValidationError" class="error-banner">
                      <i class="pi pi-exclamation-triangle"></i> {{ dispoValidationError }}
                  </div>

                  <!-- Dates avec leurs créneaux liés -->
                  <div class="form-group">
                    <label>Dates & Créneaux *</label>
                    <p class="field-help">Chaque date possède ses propres créneaux horaires</p>

                    <div *ngFor="let group of dateSlotGroups; let gi = index" class="date-slot-group">
                      <div class="dsg-header">
                        <div class="dsg-date-row">
                          <span class="dsg-badge">📅 Date {{ gi + 1 }}</span>
                          <input type="date" class="premium-input dsg-date-input" [(ngModel)]="group.date"
                            [min]="selectedThematiqueObj?.dateDebut" [max]="selectedThematiqueObj?.dateFin">
                          <button *ngIf="dateSlotGroups.length > 1" class="btn-remove-inline" (click)="removeDateGroup(gi)">
                            <i class="pi pi-times"></i>
                          </button>
                        </div>
                      </div>
                      <div class="dsg-slots">
                        <div *ngFor="let slot of group.slots; let si = index" class="slot-card">
                          <div class="slot-title">Créneau {{ si + 1 }}</div>
                          <div class="slot-grid">
                            <div>
                              <label class="slot-label">Heure de début</label>
                              <input type="time" class="premium-input" [(ngModel)]="slot.start">
                            </div>
                            <div>
                              <label class="slot-label">Heure de fin</label>
                              <input type="time" class="premium-input" [(ngModel)]="slot.end">
                            </div>
                          </div>
                          <button *ngIf="group.slots.length > 1" class="btn-remove-slot" (click)="removeSlotFromGroup(gi, si)">
                            <i class="pi pi-trash"></i> Supprimer ce créneau
                          </button>
                        </div>
                        <button class="btn-inline-slot" (click)="addSlotToGroup(gi)">
                          <i class="pi pi-plus"></i> Ajouter un créneau à cette date
                        </button>
                      </div>
                    </div>

                    <button class="btn-inline mt-2" (click)="addDateGroup()">
                      <i class="pi pi-plus"></i> Ajouter une autre date
                    </button>
                  </div>



                  <div class="form-group">
                    <label>Type de session *</label>
                    <div class="type-session-selector">
                      <button class="type-btn" [class.active]="newSessionType === 'EN_LIGNE'" (click)="newSessionType = 'EN_LIGNE'">
                        <i class="pi pi-video"></i> En ligne
                      </button>
                      <button class="type-btn" [class.active]="newSessionType === 'PRESENTIEL'" (click)="newSessionType = 'PRESENTIEL'">
                        <i class="pi pi-building"></i> Présentiel
                      </button>
                    </div>
                  </div>
              </div>
              <div class="modal-actions">  
                      <button class="btn-outline" (click)="showDispoModal = false">Annuler</button>
                      <button class="btn-primary" [disabled]="!selectedThematiqueId" (click)="addDisponibilite()">Ajouter la disponibilité</button>
                  
              </div>
          </div>
      </div>
      <!-- Modal Modifier une disponibilité -->
      <div *ngIf="showEditDispoModal" class="modal-backdrop" (click)="showEditDispoModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                  <div>
                      <h2>Modifier une disponibilité</h2>
                      <p class="text-sm text-gray-500 mt-1">Choisissez une disponibilité et associez-la à une autre thématique.</p>
                  </div>
                  <button class="close-btn" (click)="showEditDispoModal = false"><i class="pi pi-times"></i></button>
              </div>
              <div class="modal-body">
                  <div class="form-group">
                      <label>Disponibilité à modifier *</label>
                      <select class="premium-input" [(ngModel)]="selectedDispoToEditId" (ngModelChange)="onDispoToEditSelected()">
                        <option [ngValue]="null">Sélectionner une disponibilité...</option>
                        <option *ngFor="let dispo of disponibilites" [ngValue]="dispo.id">
                          {{dispo.thematiqueNom}} ({{dispo.dateDebut | date:'shortDate'}} - {{dispo.dateFin | date:'shortDate'}})
                        </option>
                      </select>
                  </div>

                  <div class="form-group">
                      <label>Nouvelle thématique *</label>
                      <select class="premium-input" [(ngModel)]="editThematiqueId">
                          <option [ngValue]="null">Sélectionner une nouvelle thématique...</option>
                          <option *ngFor="let t of thematiques" [ngValue]="t.id">
                              {{t.nom}} ({{t.dateDebut | date:'shortDate'}} - {{t.dateFin | date:'shortDate'}})
                          </option>
                      </select>
                  </div>

                  <div *ngIf="editValidationError" class="error-banner">
                    <i class="pi pi-exclamation-triangle"></i> {{ editValidationError }}
                  </div>
              </div>
              <div class="modal-actions">
                  <button class="btn-outline" (click)="showEditDispoModal = false">Annuler</button>
                  <button class="btn-primary" [disabled]="!selectedDispoToEditId || !editThematiqueId" (click)="updateDisponibilite()">Enregistrer</button>
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
    .calendar-page { padding: 2rem; background: #f8f9fa; min-height: calc(100vh - 70px); font-family: var(--font-family); margin-top: -1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-title-row { display: flex; align-items: center; gap: 1rem; }
    .page-icon { width: 50px; height: 50px; background: linear-gradient(135deg, #FFF5F7, #FFE0E8); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: #2D3748; margin: 0; }
    .page-header p { color: #718096; font-size: 1rem; margin-top: 0.2rem; }
    .header-actions { display: flex; align-items: center; gap: 1rem; }
    .event-count-badge { background: #FFF5F7; color: #FF4D85; border: 1px solid #FFD0DE; padding: 0.6rem 1.2rem; border-radius: 25px; font-weight: 600; font-size: 0.85rem; }
    .main-layout { display: flex; gap: 2rem; }
    .calendar-card { flex: 1; background: white; border-radius: 1.5rem; padding: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
    .sidebar { width: 340px; display: flex; flex-direction: column; gap: 1.5rem; }
    .month-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .month-header h2 { font-size: 1.4rem; font-weight: 700; color: #2D3748; margin: 0; text-transform: capitalize; }
    .month-nav { display: flex; gap: 0.5rem; }
    .nav-btn { width: 36px; height: 36px; border-radius: 50%; background: white; border: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #4A5568; transition: all 0.2s; }
    .nav-btn:hover { background: #F7FAFC; }
    .day-headers { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 0.5rem; }
    .day-header { text-align: center; font-size: 0.8rem; font-weight: 700; color: #A0AEC0; text-transform: uppercase; padding: 0.5rem; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); border-top: 1px solid #EDF2F7; border-left: 1px solid #EDF2F7; }
    .calendar-cell { min-height: 90px; border-right: 1px solid #EDF2F7; border-bottom: 1px solid #EDF2F7; padding: 0.4rem; }
    .calendar-cell.other-month { background: #FCFCFD; }
    .calendar-cell.other-month .cell-day { color: #CBD5E0; }
    .calendar-cell.today { background: rgba(66,153,225,0.04); }
    .cell-day { font-size: 0.85rem; font-weight: 500; color: #4A5568; padding: 0.2rem 0.4rem; }
    .today-circle { background: #4299E1; color: white !important; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .cell-events { display: flex; flex-direction: column; gap: 2px; margin-top: 2px; }
    .event-chip { font-size: 0.65rem; color: white; padding: 2px 6px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
    .sidebar-section { background: white; border-radius: 1.5rem; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
    .sidebar-section h3 { font-size: 1.1rem; font-weight: 700; color: #2D3748; margin: 0 0 1rem 0; }
    .count-badge { background: #2D3748; color: white; font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 50%; font-weight: 700; }
    .next-event-label { color: #FF4D85; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.8rem; }
    .event-card { display: flex; gap: 1rem; padding: 1rem; border-radius: 12px; margin-bottom: 0.8rem; border: 1px solid #EDF2F7; transition: all 0.2s; }
    .event-card.highlighted { background: #FFF5F7; border-color: #FFD0DE; }
    .event-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
    .event-details { flex: 1; }
    .event-name { font-weight: 700; color: #2D3748; font-size: 0.9rem; }
    .event-datetime { font-size: 0.8rem; color: #718096; margin-top: 0.2rem; display: flex; align-items: center; gap: 0.3rem; }
    .dispo-item { display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; border-radius: 10px; background: #F8FAFC; border: 1px solid #E2E8F0; margin-bottom: 0.5rem; }
    .dispo-actions { display: flex; gap: 0.4rem; }
    .btn-icon-edit { background: #EBF8FF; color: #3182CE; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .btn-icon-edit:hover { background: #BEE3F8; }
    .dispo-info { display: flex; flex-direction: column; }
    .dispo-info strong { color: #2D3748; font-size: 0.9rem; }
    .dispo-info span { color: #718096; font-size: 0.8rem; margin-top: 0.1rem; }
    .btn-icon-danger { background: #FFF5F5; color: #E53E3E; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .btn-icon-danger:hover { background: #FED7D7; }
    .btn-primary { background: var(--gradient-pink); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: transform 0.2s; }
    .btn-primary:hover { transform: translateY(-2px); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .shadow-glow { box-shadow: 0 4px 15px rgba(233,30,99,0.4); }
    .btn-outline { background: white; border: 1px solid #E2E8F0; color: #4A5568; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .modal-content { background: white; border-radius: 1.5rem; width: 100%; max-width: 680px; max-height: calc(100vh - 4rem); box-shadow: 0 20px 40px rgba(0,0,0,0.1); animation: slide-up 0.3s ease-out; overflow: hidden; display: flex; flex-direction: column; }
    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.4rem 1.6rem 1rem; border-bottom: 1px solid #EDF2F7; }
    .modal-header h2 { font-size: 1.3rem; font-weight: 700; color: #2D3748; margin: 0; }
    .modal-body { overflow-y: auto; padding: 1.4rem 1.6rem; display: flex; flex-direction: column; gap: 1rem; }
    .form-group label { display: block; font-size: 0.9rem; font-weight: 600; color: #4A5568; margin-bottom: 0.5rem; }
    .premium-input { width: 100%; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid #E2E8F0; background: #F8FAFC; font-family: inherit; font-size: 0.95rem; color: #2D3748; outline: none; box-sizing: border-box; }
    .premium-input:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem 1.6rem 1.2rem; border-top: 1px solid #EDF2F7; }
    .btn-inline { width: 100%; border: 1px solid #E2E8F0; background: white; color: #4A5568; border-radius: 16px; padding: 0.75rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .btn-inline:hover { background: #F8FAFC; }
    .hidden { display: none; }
    .btn-remove-inline { border: 1px solid #FECACA; background: #FFF1F2; color: #E11D48; border-radius: 10px; height: 42px; width: 42px; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .field-help { font-size: 0.85rem; color: #718096; margin: 0.45rem 0 0; }
    .slot-card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 0.85rem; margin-bottom: 0.6rem; }
    .slot-title { font-size: 0.85rem; font-weight: 700; color: #718096; margin-bottom: 0.5rem; }
    .slot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .slot-label { margin-bottom: 0.35rem !important; font-size: 0.85rem !important; }
    .btn-remove-slot { margin-top: 0.7rem; border: 1px solid #FECACA; background: #FFF1F2; color: #E11D48; border-radius: 10px; padding: 0.45rem 0.7rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
    .loading-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.7); z-index: 999; display: flex; align-items: center; justify-content: center; }
    .spinner { width: 40px; height: 40px; border: 4px solid #EDF2F7; border-top-color: #FF4D85; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .out-of-range { background: #F7F7F7 !important; opacity: 0.45; pointer-events: none; }
    .out-of-range .cell-day { color: #CBD5E0 !important; }

    /* Thematique filter bar */
    .thematique-filter { display: flex; align-items: center; gap: 16px; padding: 14px 20px; background: #fff; border-radius: 16px; margin-bottom: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); flex-wrap: wrap; }
    .tf-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #4A5568; white-space: nowrap; }
    .tf-options { display: flex; flex-wrap: wrap; gap: 8px; }
    .tf-option { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid #E2E8F0; background: #F8FAFC; color: #4A5568; cursor: pointer; transition: all .2s; }
    .tf-option.active { background: linear-gradient(135deg, #FF4D85, #C0392B); color: #fff; border-color: transparent; box-shadow: 0 2px 8px rgba(255,77,133,0.3); }
    .tf-option:hover:not(.active) { background: #EDF2F7; }
    .tf-dates { font-size: 10px; opacity: 0.8; margin-left: 4px; }

    .thematique-info-bar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #FFF5F7; border: 1px solid #FFD0DE; border-radius: 12px; margin-bottom: 12px; font-size: 13px; color: #C0392B; }
    .thematique-info-bar i { font-size: 16px; flex-shrink: 0; }
    .tib-hint { margin-left: auto; font-size: 11px; color: #A0AEC0; font-style: italic; }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .type-session-selector { display: flex; gap: 0.75rem; }
    .type-btn { flex: 1; padding: 0.8rem 1rem; border-radius: 12px; border: 2px solid #E2E8F0; background: white; font-family: inherit; font-size: 0.9rem; color: #4A5568; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 500; transition: all 0.2s ease; }
    .type-btn:hover { border-color: #FF4D85; color: #FF4D85; }
    .type-btn.active { background: linear-gradient(135deg, #FF4D85, #FF6B9E); color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(255,77,133,0.3); }
    .type-btn.active i { color: white; }

    .thematique-dates-banner { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #F0FFF4; border: 1px solid #C6F6D5; border-radius: 12px; font-size: 13px; color: #276749; margin-top: -0.5rem; }
    .thematique-dates-banner i { font-size: 16px; flex-shrink: 0; }
    .error-banner { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #FFF5F5; border: 1px solid #FED7D7; border-radius: 12px; font-size: 13px; color: #E53E3E; margin-top: -0.5rem; }
    .error-banner i { font-size: 16px; flex-shrink: 0; }

    /* Date-Slot Groups */
    .date-slot-group {
      background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 16px;
      margin-bottom: 12px; overflow: hidden; transition: border-color 0.2s;
    }
    .date-slot-group:hover { border-color: #FF4D85; }
    .dsg-header {
      background: linear-gradient(135deg, #FFF5F7, #FFFFFF);
      padding: 12px 16px; border-bottom: 1px solid #EDF2F7;
    }
    .dsg-date-row { display: flex; align-items: center; gap: 10px; }
    .dsg-badge {
      font-size: 12px; font-weight: 700; color: #ea5073; white-space: nowrap;
      background: rgba(234,80,115,0.1); padding: 4px 10px; border-radius: 8px;
    }
    .dsg-date-input { flex: 1; }
    .dsg-slots { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
    .btn-inline-slot {
      border: 1px dashed #D1D5DB; background: white; color: #718096;
      border-radius: 10px; padding: 8px 12px; font-size: 12px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: all .2s;
    }
    .btn-inline-slot:hover { border-color: #FF4D85; color: #FF4D85; background: #FFF5F7; }
  `]
})
export class DisponibilitesComponent implements OnInit {
  coachId!: number;
  loading: boolean = false;
  showDispoModal: boolean = false;
  showEditDispoModal: boolean = false;
  selectedThematiqueId: number | null = null;
  selectedDispoToEditId: number | null = null;
  editThematiqueId: number | null = null;
  newDispoTitle: string = '';
  defaultTitle: string = '';
  dateSlotGroups: DateSlotGroup[] = [{ date: '', slots: [{ start: '', end: '' }] }];
  sessionDuration: string = '1h';
  newSessionType: string = 'EN_LIGNE';
  dispoValidationError: string | null = null;
  editValidationError: string | null = null;

  selectedFilterThematiqueId: number | null = null;
  activeFilterThematique: ThematiqueCoachingDTO | null = null;

  disponibilites: DisponibiliteDTO[] = [];
  sessions: SessionCoachDTO[] = [];
  thematiques: ThematiqueCoachingDTO[] = [];
  programmes: ProgrammeDTO[] = [];
  calendarEvents: any[] = [];
  upcomingEvents: any[] = [];

  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  dayLabels: string[] = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
  calendarCells: any[] = [];

  private eventColors = ['#FF4D85', '#4299E1', '#48BB78', '#805AD5', '#ED8936', '#38B2AC', '#E53E3E'];

  constructor(
    private coachService: CoachService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const rawId = this.authService.getUserId();
    if (rawId) {
      this.coachId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;
      this.loadData();
    }
    this.buildCalendar();
  }

  loadData() {
    this.loading = true;
    this.coachService.getDisponibilites(this.coachId).subscribe({
      next: (data) => {
        this.disponibilites = data;
      },
      error: () => {}
    });

    this.coachService.getAllSessionsByCoach(this.coachId).subscribe({
      next: (data) => {
        this.sessions = data;
      },
      error: () => {}
    });

    this.coachService.getCalendarEvents(this.coachId).subscribe({
      next: (events) => {
        this.calendarEvents = this.mapCalendarEvents(events);
        this.buildUpcomingEvents();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this.coachService.getThematiquesAssignedToCoach(this.coachId).subscribe({
      next: (data) => this.thematiques = data,
      error: () => {}
    });

    // Load programmes for title pre-fill
    this.coachService.getCoachProgrammes(this.coachId).subscribe({
      next: (data) => this.programmes = data,
      error: () => {}
    });
  }

  openDispoModal(): void {
    this.showDispoModal = true;
    // Pre-fill title with first matched programme name
    if (this.programmes.length > 0) {
      this.defaultTitle = this.programmes[0].nom;
      this.newDispoTitle = this.programmes[0].nom;
    }
  }
  openEditDispoModal(dispo?: DisponibiliteDTO): void {
    this.showEditDispoModal = true;
    this.editValidationError = null;
    if (dispo?.id) {
      this.selectedDispoToEditId = dispo.id;
      this.editThematiqueId = dispo.thematiqueId;
      return;
    }
    if (this.disponibilites.length > 0) {
      this.selectedDispoToEditId = this.disponibilites[0].id || null;
      this.editThematiqueId = this.disponibilites[0].thematiqueId || null;
    }
  }

  onDispoToEditSelected(): void {
    const selected = this.disponibilites.find(d => d.id === this.selectedDispoToEditId);
    this.editThematiqueId = selected?.thematiqueId ?? null;
    this.editValidationError = null;
  }

  private normalizeCalendarDate(value: string): string {
    if (!value) return '';
    if (value.includes('T')) return value.split('T')[0];
    return value.length >= 10 ? value.slice(0, 10) : value;
  }
private mapCalendarEvents(events: CoachCalendarEventDTO[]): any[] {
    const colorByType: Record<string, string> = {
      DISPONIBILITE_COACH: '#FF4D85',
      SESSION_SLOT: '#4299E1',
      SESSION: '#38B2AC',
      SEANCE_EXCEPTIONNELLE: '#ED8936'
    };

    return events.map((ev) => ({
      id: ev.id,
      type: ev.type,
      title: ev.title,
      date: this.normalizeCalendarDate(ev.date),
      time: (ev.startTime || '').slice(0, 5),
      color: colorByType[ev.type] || '#805AD5'
    }));
  }

  buildUpcomingEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.upcomingEvents = this.calendarEvents
      .filter(e => new Date(e.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
      .map(e => ({
        title: e.title,
        date: new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
        time: e.time || '—'
      }));
  }

  addDisponibilite() {
    if (!this.selectedThematiqueId) return;
    // Validate dates against thematique range
    const thematique = this.thematiques.find(t => t.id === this.selectedThematiqueId);
    if (thematique) {
      const thStart = new Date(thematique.dateDebut);
      const thEnd = new Date(thematique.dateFin);
      for (const group of this.dateSlotGroups) {
        if (group.date) {
          const d = new Date(group.date);
          if (d < thStart || d > thEnd) {
            this.dispoValidationError = `La date ${d.toLocaleDateString('fr-FR')} est en dehors de la plage autorisée (${thStart.toLocaleDateString('fr-FR')} — ${thEnd.toLocaleDateString('fr-FR')}). Veuillez corriger.`;
            return;
          }
        }
      }
    }
    this.dispoValidationError = null;
    this.coachService.addDisponibilite(this.coachId, this.selectedThematiqueId).subscribe({
      next: (data) => {
        this.disponibilites.push(data);
        this.resetModalForm();
        this.loadData();
      },
      error: () => {}
    });
  }
  updateDisponibilite(): void {
    if (!this.selectedDispoToEditId || !this.editThematiqueId) return;
    const current = this.disponibilites.find(d => d.id === this.selectedDispoToEditId);
    if (current?.thematiqueId === this.editThematiqueId) {
      this.editValidationError = 'Veuillez choisir une thématique différente de la thématique actuelle.';
      return;
    }

    this.editValidationError = null;
    this.coachService.updateDisponibilite(this.selectedDispoToEditId, this.editThematiqueId).subscribe({
      next: () => {
        this.showEditDispoModal = false;
        this.loadData();
      },
      error: () => {
        this.editValidationError = 'La modification a échoué. Veuillez réessayer.';
      }
    });
  }

  get selectedThematiqueObj(): ThematiqueCoachingDTO | null {
    if (!this.selectedThematiqueId) return null;
    return this.thematiques.find(t => t.id === this.selectedThematiqueId) || null;
  }

  onThematiqueSelected(): void {
    this.dispoValidationError = null;
    const th = this.selectedThematiqueObj;
    if (th) {
      this.dateSlotGroups = [{ date: th.dateDebut, slots: [{ start: '', end: '' }] }];
      // Find programme name from thematique's programmeId and pre-fill the title
      const prog = this.programmes.find(p => p.id === th.programmeId);
      if (prog) {
        this.defaultTitle = prog.nom;
        this.newDispoTitle = prog.nom;
      }
    }
  }

  // Date-Slot Group Management
  addDateGroup(): void {
    const th = this.selectedThematiqueObj;
    this.dateSlotGroups.push({ date: th?.dateDebut || '', slots: [{ start: '', end: '' }] });
  }

  removeDateGroup(gi: number): void {
    if (this.dateSlotGroups.length <= 1) return;
    this.dateSlotGroups.splice(gi, 1);
  }

  addSlotToGroup(gi: number): void {
    this.dateSlotGroups[gi].slots.push({ start: '', end: '' });
  }

  removeSlotFromGroup(gi: number, si: number): void {
    if (this.dateSlotGroups[gi].slots.length <= 1) return;
    this.dateSlotGroups[gi].slots.splice(si, 1);
  }

  private resetModalForm() {
    this.selectedThematiqueId = null;
    this.newDispoTitle = '';
    this.defaultTitle = '';
    this.dateSlotGroups = [{ date: '', slots: [{ start: '', end: '' }] }];
    this.sessionDuration = '1h';
    this.newSessionType = 'EN_LIGNE';
    this.showDispoModal = false;
  }

  deleteDispo(id: number) {
    if (confirm('Supprimer cette disponibilité ?')) {
      this.coachService.deleteDisponibilite(id).subscribe({
        next: () => {
          this.disponibilites = this.disponibilites.filter(d => d.id !== id);
          this.loadData();
        }
      });
    }
  }

  // Calendar logic
  getMonthName(): string {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[this.currentMonth];
  }
  prevMonth() { if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; } else { this.currentMonth--; } this.buildCalendar(); }
  nextMonth() { if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; } else { this.currentMonth++; } this.buildCalendar(); }

  buildCalendar() {
    this.calendarCells = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const m = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
      const y = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
      this.calendarCells.push({ day, currentMonth: false, isToday: false, fullDate: this.formatDate(y, m, day) });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const cellDate = new Date(this.currentYear, this.currentMonth, d); cellDate.setHours(0, 0, 0, 0);
      this.calendarCells.push({ day: d, currentMonth: true, isToday: cellDate.getTime() === today.getTime(), fullDate: this.formatDate(this.currentYear, this.currentMonth, d) });
    }
    const remaining = 42 - this.calendarCells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
      const y = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
      this.calendarCells.push({ day: d, currentMonth: false, isToday: false, fullDate: this.formatDate(y, m, d) });
    }
  }
  setFilterThematique(id: number | null) {
    this.selectedFilterThematiqueId = id;
    this.activeFilterThematique = id ? (this.thematiques.find(t => t.id === id) || null) : null;
  }

  /** Returns true if date is outside the selected thematique's range */
  isOutOfRange(dateStr: string): boolean {
    if (!this.activeFilterThematique) return false;
    const d = new Date(dateStr);
    const start = new Date(this.activeFilterThematique.dateDebut);
    const end = new Date(this.activeFilterThematique.dateFin);
    return d < start || d > end;
  }

  formatDate(year: number, month: number, day: number): string { return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
  getEventsForDay(dateStr: string): any[] { return this.calendarEvents.filter(e => e.date === dateStr); }
}
