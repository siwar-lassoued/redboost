import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachService, DisponibiliteDTO, SessionCoachDTO, ThematiqueCoachingDTO, CoachCalendarEventDTO, ProgrammeDTO } from './services/coach.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { firstValueFrom } from 'rxjs';
interface DateSlotGroup {
  date: string;
  slots: { start: string; end: string }[];
}

interface SessionView {
  session?: SessionCoachDTO;
  isEditing: boolean;
  isNew: boolean;
  editStart: string;
  editEnd: string;
}

interface SessionFormGroup {
  titre: string;
  typeSession: string;
  dateSlotGroups: DateSlotGroup[];
}

interface DateGroupView {
  date: string;
  disponibiliteId: number;
  sessions: SessionView[];
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
                          <div *ngFor="let ev of getEventsForDay(cell.fullDate)" class="event-chip" [class.booked]="ev.isBooked" [style.background]="ev.color">
                              <i *ngIf="ev.isBooked" class="pi pi-check-circle" style="font-size: 8px; margin-right: 2px;"></i>
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
                          <div class="event-thematique" *ngIf="event.thematiqueNom" [style.color]="event.color || '#FF4D85'" style="font-size: 11px; font-weight: 600; margin-top: 2px;">
                            <i class="pi pi-tag" style="font-size: 10px; margin-right: 4px;"></i>
                            {{event.thematiqueNom}}
                          </div>
                          <div class="event-datetime">
                              <i class="pi pi-calendar"></i>
                              <span>{{ event.dateFormatted }} • 
                                <span *ngIf="event.startTime && event.endTime">{{ event.startTime }}-{{ event.endTime }}</span>
                                <span *ngIf="!event.startTime || !event.endTime">{{ event.time }}</span>
                              </span>
                          </div>
                      </div>
                  </div>
                  <div *ngIf="upcomingEvents.length === 0" class="text-sm text-gray-400 italic">Aucun événement à venir.</div>
              </div>

              <!-- Disponibilités actives -->
              <div class="sidebar-section">
                  <h3>Disponibilités actives <span class="count-badge">{{filteredDisponibilites.length}}</span></h3>
                  <div *ngFor="let dispo of filteredDisponibilites" class="dispo-item" [style.border-left]="'4px solid ' + (dispo.couleur || '#FF4D85')">
                      <div class="dispo-info">
                          <strong>{{dispo.thematiqueNom || 'Thématique'}}</strong>
                          <span>Du {{dispo.dateDebut | date:'dd/MM/yyyy'}} au {{dispo.dateFin | date:'dd/MM/yyyy'}}</span>
                      </div>
                      <div class="dispo-actions">
                        <button (click)="openEditDispoModal(dispo)" class="btn-icon-edit"><i class="pi pi-pencil"></i></button>
                        <button (click)="deleteDispo(dispo.id!)" class="btn-icon-danger"><i class="pi pi-trash"></i></button>
                      </div>
                  </div>
                  <div *ngIf="filteredDisponibilites.length === 0" class="text-sm text-gray-400 italic">Aucune disponibilité.</div>
              </div>
          </div>
      </div>

      <!-- Modal Ajouter une disponibilité -->
      <div *ngIf="showDispoModal" class="modal-backdrop" (click)="showDispoModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                  <div>
                      <h2>Ajouter une disponibilité</h2>
                      <p class="text-sm text-gray-500 mt-1">Définissez une session et ses créneaux</p>
                  </div>
                  <button class="close-btn" (click)="showDispoModal = false"><i class="pi pi-times"></i></button>
              </div>
              <div class="modal-body">
                <!-- STEP 1: Thématique -->
                <div class="form-group">
                    <label>Étape 1 — Thématique <span style="color:#E53E3E">*</span></label>
                    <select class="premium-input" [(ngModel)]="selectedThematiqueId" (ngModelChange)="onThematiqueSelected()">
                         <option [ngValue]="null">Sélectionner une thématique...</option>
                        <option *ngFor="let t of thematiques" [ngValue]="t.id">
                          {{t.nom}} ({{t.dateDebut | date:'shortDate'}} - {{t.dateFin | date:'shortDate'}})
                        </option>
                    </select>
                </div>

                <!-- STEP 1B: Nom du programme (linked to thematique) -->
                <div class="form-group" *ngIf="selectedThematiqueId && selectedProgrammeObj">
                    <label>Nom du programme</label>
                    <div class="premium-input" style="background: #EDF2F7; color: #4A5568; cursor: not-allowed; border-color: #E2E8F0;">
                      {{ selectedProgrammeObj.nom }}
                    </div>
                </div>

                <!-- STEP 1C: Couleur de la thématique -->
                <div class="form-group" *ngIf="selectedThematiqueId">
                    <label>Couleur de la thématique (Calendrier) <span style="color:#E53E3E">*</span></label>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="color" [(ngModel)]="selectedThematiqueColor" style="height: 42px; width: 60px; border-radius: 8px; border: 1px solid #E2E8F0; cursor: pointer; padding: 2px;">
                        <span class="text-sm text-gray-500">Cette couleur sera utilisée pour afficher toutes les sessions de cette thématique dans le calendrier.</span>
                    </div>
                </div>

                <div *ngIf="selectedThematiqueObj" class="thematique-dates-banner">
                    <i class="pi pi-info-circle"></i>
                    <span>Disponibilités du <strong>{{ selectedThematiqueObj.dateDebut | date:'dd/MM/yyyy' }}</strong> au <strong>{{ selectedThematiqueObj.dateFin | date:'dd/MM/yyyy' }}</strong></span>
                </div>
                  <!-- STEP 2: Sessions List -->
                <div *ngIf="selectedThematiqueId" class="sessions-batch-container">
                  <div class="batch-instruction">
                    <i class="pi pi-info-circle"></i>
                    <span>Définissez vos sessions pour cette thématique. Chaque session peut avoir plusieurs dates et créneaux.</span>
                  </div>

                  <div *ngFor="let sForm of sessionForms; let si = index" class="session-form-card" [class.first-card]="si === 0">
                    <div class="s-form-header">
                      <div class="s-form-title-row">
                        <span class="s-form-badge">Session #{{ si + 1 }}</span>
                        <button *ngIf="sessionForms.length > 1" class="btn-remove-session" (click)="removeSessionForm(si)" title="Supprimer cette session">
                          <i class="pi pi-trash"></i>
                        </button>
                      </div>
                      <div class="form-group mb-0">
                        <label class="premium-label">Titre de la session *</label>
                        <input type="text" class="premium-input title-input" [(ngModel)]="sForm.titre" 
                          placeholder="Ex: Workshop #1, Session Stratégie...">
                      </div>
                    </div>

                    <div class="s-form-body">
                      <!-- Dates & Slots for this session -->
                      <div class="form-group">
                        <label class="premium-label">Dates & Créneaux horaires *</label>
                        <div class="dsg-container">
                          <div *ngFor="let group of sForm.dateSlotGroups; let gi = index" class="date-slot-group">
                            <div class="dsg-header">
                              <div class="dsg-date-row">
                                <i class="pi pi-calendar-plus text-sky-500"></i>
                                <input type="date" class="premium-input dsg-date-input" [(ngModel)]="group.date"
                                  [min]="getMinDate(selectedThematiqueObj?.dateDebut)" [max]="selectedThematiqueObj?.dateFin">
                                <button *ngIf="sForm.dateSlotGroups.length > 1" class="btn-remove-inline" (click)="removeDateGroupFromForm(si, gi)">
                                  <i class="pi pi-times"></i>
                                </button>
                              </div>
                            </div>
                            <div class="dsg-slots">
                              <div *ngFor="let slot of group.slots; let sli = index" class="slot-row">
                                <div class="slot-inputs">
                                  <div class="time-input-group">
                                    <span class="time-label">De</span>
                                    <input type="time" class="premium-input" [(ngModel)]="slot.start">
                                  </div>
                                  <div class="time-input-group">
                                    <span class="time-label">À</span>
                                    <input type="time" class="premium-input" [(ngModel)]="slot.end">
                                  </div>
                                </div>
                                <button *ngIf="group.slots.length > 1" class="btn-remove-slot-minimal" (click)="removeSlotFromFormGroup(si, gi, sli)">
                                  <i class="pi pi-minus-circle"></i>
                                </button>
                              </div>
                              <button class="btn-add-slot-minimal" (click)="addSlotToFormGroup(si, gi)">
                                <i class="pi pi-plus"></i> Ajouter un autre créneau à cette date
                              </button>
                            </div>
                          </div>
                        </div>
                        <button class="btn-add-date-minimal" (click)="addDateGroupToForm(si)">
                          <i class="pi pi-calendar-plus"></i> Ajouter une autre date pour cette session
                        </button>
                      </div>

                      <div class="form-group mb-0">
                        <label class="premium-label">Lieu / Mode *</label>
                        <div class="type-session-selector-premium">
                          <button class="type-btn-premium" [class.active]="sForm.typeSession === 'EN_LIGNE'" (click)="sForm.typeSession = 'EN_LIGNE'">
                            <i class="pi pi-video"></i>
                            <span>Visioconférence</span>
                          </button>
                          <button class="type-btn-premium" [class.active]="sForm.typeSession === 'PRESENTIEL'" (click)="sForm.typeSession = 'PRESENTIEL'">
                            <i class="pi pi-building"></i>
                            <span>En présentiel</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="batch-actions-footer">
                    <button class="btn-add-session-major" (click)="addSessionForm()">
                      <i class="pi pi-plus-circle"></i> Ajouter une autre session (nouveau titre)
                    </button>
                  </div>
                </div>

                <div *ngIf="dispoValidationError" class="error-banner">
                    <i class="pi pi-exclamation-triangle"></i> {{ dispoValidationError }}
                </div>
              </div>
              <div class="modal-actions">
                    <button class="btn-outline" (click)="showDispoModal = false">Annuler</button>
                    <button class="btn-primary"
                      [disabled]="!selectedThematiqueId || !selectedProgrammeId || isSessionFormsEmpty()"
                      (click)="addDisponibilite()">Ajouter les disponibilités</button>
              </div>
          </div>
      </div>
      <!-- Modal Modifier une disponibilité -->
      <div *ngIf="showEditDispoModal" class="modal-backdrop" (click)="showEditDispoModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                  <div>
                      <h2>Modifier une disponibilité</h2>
                      <p class="text-sm text-gray-500 mt-1">Sélectionnez une thématique, puis une date ou un créneau à modifier.</p>
                  </div>
                  <button class="close-btn" (click)="showEditDispoModal = false"><i class="pi pi-times"></i></button>
              </div>
              <div class="modal-body">
                  <div class="form-group">
                      <label>Thématique *</label>
                      <select class="premium-input" [(ngModel)]="selectedEditThematiqueId" (ngModelChange)="onEditThematiqueSelected($event)">
                        <option [ngValue]="null">Sélectionner une thématique...</option>
                        <option *ngFor="let t of thematiques" [ngValue]="t.id">
                          {{t.nom}} ({{t.dateDebut | date:'shortDate'}} - {{t.dateFin | date:'shortDate'}})
                        </option>
                      </select>
                  </div>

                  <div *ngIf="selectedEditThematiqueObj" class="thematique-dates-banner">
                    <i class="pi pi-info-circle"></i>
                    <span>Thématique sélectionnée : <strong>{{ selectedEditThematiqueObj.nom }}</strong> ({{ selectedEditThematiqueObj.dateDebut | date:'dd/MM/yyyy' }} → {{ selectedEditThematiqueObj.dateFin | date:'dd/MM/yyyy' }})</span>
                  </div>

                  <div *ngIf="selectedEditThematiqueId && groupedEditDatesView.length === 0 && !loading && dispoIdsForActiveTheme.length === 0" class="error-banner">
                    <i class="pi pi-info-circle"></i> Aucune disponibilité trouvée pour cette thématique.
                  </div>

                  <div class="form-group" *ngIf="selectedEditThematiqueId && groupedEditDatesView.length === 0 && !loading && dispoIdsForActiveTheme.length > 0">
                    <div class="error-banner" style="margin-bottom: 1rem; background: #EBF8FF; border-color: #BEE3F8; color: #2B6CB0;">
                      <i class="pi pi-info-circle"></i> La thématique possède une disponibilité, mais aucun créneau.
                    </div>
                    <button class="btn-outline" style="width:100%" (click)="addEmptyDateGroupForTheme()">
                      <i class="pi pi-calendar-plus"></i> Ajouter une première date
                    </button>
                  </div>

                  <div class="form-group" *ngIf="groupedEditDatesView.length > 0">
                    <label>Disponibilités & Créneaux</label>
                    <div *ngFor="let group of groupedEditDatesView; let gi = index" class="date-slot-group edit-date-group">
                      <div class="dsg-header">
                        <div class="dsg-date-row">
                          <span *ngIf="group.date !== ''" class="dsg-badge"> {{ group.date | date:'dd/MM/yyyy' }}</span>
                          <input *ngIf="group.date === ''" type="date" class="premium-input dsg-date-input" style="padding: 4px;font-size: 0.9rem;" [(ngModel)]="group.date" [min]="getMinDate(selectedEditThematiqueObj?.dateDebut)" [max]="selectedEditThematiqueObj?.dateFin || ''">
                        </div>
                      </div>
                      <div class="dsg-slots">
                        <div *ngFor="let sv of group.sessions; let si = index" class="slot-card edit-slot-card" [class.editing]="sv.isEditing">
                          
                          <!-- VIEW MODE -->
                          <div *ngIf="!sv.isEditing" class="slot-read-only">
                            <div class="slot-time">
                              <i class="pi pi-clock"></i>
                              <span>{{ sv.session?.heureDebut }} à {{ sv.session?.heureFin }}</span>
                            </div>
                            <div class="slot-actions">
                              <button class="btn-icon-edit" title="Modifier" (click)="startEditSession(sv)"><i class="pi pi-pencil"></i></button>
                              <button class="btn-icon-danger" title="Supprimer" (click)="deleteSession(sv, group, si)"><i class="pi pi-trash"></i></button>
                            </div>
                          </div>
                          
                          <!-- EDIT MODE -->
                          <div *ngIf="sv.isEditing" class="slot-edit-mode">
                            <div class="slot-grid" style="margin-bottom: 0.5rem;">
                              <div>
                                <label class="slot-label">Début</label>
                                <input type="time" class="premium-input" [(ngModel)]="sv.editStart">
                              </div>
                              <div>
                                <label class="slot-label">Fin</label>
                                <input type="time" class="premium-input" [(ngModel)]="sv.editEnd">
                              </div>
                            </div>
                            <div class="edit-actions">
                              <button class="btn-outline-sm" (click)="cancelEditSession(group, sv, si)">Annuler</button>
                              <button *ngIf="!sv.isNew" class="btn-primary-sm" (click)="saveSessionEdit(sv, group)">Enregistrer</button>
                              <button *ngIf="sv.isNew" class="btn-primary-sm" (click)="saveNewSession(sv, group)">Créer</button>
                            </div>
                          </div>
                          
                        </div>
                        <button class="btn-inline-slot mt-1" (click)="addNewSessionToDate(group)">
                          <i class="pi pi-plus"></i> Ajouter un créneau à cette date
                        </button>
                      </div>
                    </div>
                    <button class="btn-outline mt-3" style="width: 100%" (click)="addEmptyDateGroupForTheme()">
                      <i class="pi pi-calendar-plus"></i> Ajouter une autre date
                    </button>
                  </div>

                  <div *ngIf="editValidationError" class="error-banner">
                    <i class="pi pi-exclamation-triangle"></i> {{ editValidationError }}
                  </div>
              </div>
              <div class="modal-actions">
                  <button class="btn-outline" (click)="showEditDispoModal = false">Fermer</button>
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
    .event-chip { font-size: 0.65rem; color: white; padding: 2px 6px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; display: flex; align-items: center; border: 1px solid transparent; }
    .event-chip.booked { box-shadow: inset 0 0 0 100px rgba(0,0,0,0.15); border-color: rgba(0,0,0,0.2); font-weight: 700; }
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
    .dispo-item { display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; border-radius: 10px; background: #F8FAFC; border: 1px solid #E2E8F0; margin-bottom: 0.5rem; border-left: 4px solid transparent; transition: all 0.2s; }
    .dispo-actions { display: flex; gap: 0.4rem; }
    .btn-icon-edit { background: #EBF8FF; color: #3182CE; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .btn-icon-edit:hover { background: #BEE3F8; }
    .dispo-info { display: flex; flex-direction: column; }
    .dispo-info strong { color: #2D3748; font-size: 0.9rem; }
    .dispo-info span { color: #718096; font-size: 0.8rem; margin-top: 0.1rem; }
    .btn-icon-danger { background: #FFF5F5; color: #E53E3E; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .btn-icon-danger:hover { background: #FED7D7; }
    .btn-primary { background: linear-gradient(135deg, #FF4D85); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: transform 0.2s; }
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

    /* Edit Modal Dynamic List Styles */
    .edit-date-group { margin-bottom: 16px; border: 1px solid #edf2f7; background: #fafbfc; border-radius: 12px; }
    .edit-slot-card { display: flex; flex-direction: column; padding: 12px 16px; transition: all 0.2s; border: none; border-bottom: 1px solid #edf2f7; border-radius: 0; margin-bottom: 0; background: transparent; }
    .edit-slot-card:last-child { border-bottom: none; }
    .edit-slot-card.editing { background: #FFF5F7; border-radius: 8px; margin: 4px; border: 1px solid #FFD0DE; }
    
    .slot-read-only { display: flex; justify-content: space-between; align-items: center; }
    .slot-time { font-weight: 600; color: #2D3748; display: flex; align-items: center; gap: 8px; font-size: 0.95rem; }
    .slot-time i { color: #A0AEC0; }
    .slot-actions { display: flex; gap: 8px; }
    
    .edit-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .btn-outline-sm { background: white; border: 1px solid #E2E8F0; color: #4A5568; padding: 6px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background .2s; }
    .btn-outline-sm:hover { background: #F7FAFC; }
    .btn-primary-sm { background: var(--gradient-pink); color: white; border: none; padding: 6px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: transform .2s; }
    .btn-primary-sm:hover { transform: translateY(-1px); }

    .session-form-card { background: white; border: 1px solid #E2E8F0; border-radius: 20px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
    .s-form-header { background: #F8FAFC; padding: 16px; border-bottom: 1px solid #E2E8F0; }
    .s-form-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .s-form-badge { background: #3B82A6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .btn-remove-session { background: #FFF5F5; color: #E53E3E; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .s-form-body { padding: 16px; }
    .btn-add-session-major { width: 100%; padding: 12px; border: 2px dashed #3B82A6; background: #F0F9FF; color: #3B82A6; border-radius: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
    .btn-add-session-major:hover { background: #E0F2FE; transform: scale(1.01); }
    .batch-instruction { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 12px; margin-bottom: 20px; font-size: 13px; color: #0369A1; }
    .batch-instruction i { font-size: 16px; }
    .premium-label { font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: block; }
    .title-input { font-size: 1.1rem; font-weight: 700; color: #1e293b; border-width: 2px; }
    .title-input:focus { border-color: #3B82A6; }
    .dsg-container { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
    .dsg-date-row i { font-size: 18px; }
    .dsg-date-input { border-radius: 12px; font-weight: 600; }
    .slot-row { display: flex; align-items: center; gap: 12px; background: white; padding: 8px 12px; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 6px; }
    .slot-inputs { display: flex; gap: 16px; flex: 1; }
    .time-input-group { display: flex; align-items: center; gap: 8px; flex: 1; }
    .time-label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
    .btn-remove-slot-minimal { background: transparent; color: #cbd5e1; border: none; font-size: 18px; cursor: pointer; transition: color 0.2s; }
    .btn-remove-slot-minimal:hover { color: #ef4444; }
    .btn-add-slot-minimal { background: transparent; border: 1px dashed #e2e8f0; color: #94a3b8; width: 100%; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-add-slot-minimal:hover { border-color: #3B82A6; color: #3B82A6; background: #F0F9FF; }
    .btn-add-date-minimal { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; width: 100%; padding: 10px; border-radius: 12px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
    .btn-add-date-minimal:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .type-session-selector-premium { display: flex; gap: 12px; }
    .type-btn-premium { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px; border-radius: 16px; border: 2px solid #f1f5f9; background: #f8fafc; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .type-btn-premium i { font-size: 20px; }
    .type-btn-premium span { font-size: 12px; font-weight: 700; }
    .type-btn-premium.active { border-color: #3B82A6; background: #F0F9FF; color: #3B82A6; box-shadow: 0 4px 12px rgba(59,130,166,0.1); }
    .batch-actions-footer { padding-top: 10px; border-top: 1px solid #f1f5f9; }
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
  
  // Programme selection
  selectedProgrammeId: number | null = null;
  programmesForSelectedThematique: ProgrammeDTO[] = [];
  
  // Multiple Session Forms for "Add" modal
  sessionForms: SessionFormGroup[] = [];
  
  dispoValidationError: string | null = null;
  editValidationError: string | null = null;
  selectedThematiqueColor: string = '#FF4D85';
// ===== EDIT DISPONIBILITE =====
selectedEditThematiqueId: number | null = null;
groupedEditDatesView: DateGroupView[] = [];
dispoIdsForActiveTheme: number[] = [];
  selectedFilterThematiqueId: number | null = null;
  activeFilterThematique: ThematiqueCoachingDTO | null = null;

  disponibilites: DisponibiliteDTO[] = [];
  sessions: SessionCoachDTO[] = [];
  thematiques: ThematiqueCoachingDTO[] = [];
  programmes: ProgrammeDTO[] = [];
  calendarEvents: any[] = [];
  upcomingEvents: any[] = [];

  get filteredDisponibilites(): DisponibiliteDTO[] {
    if (!this.activeFilterThematique) return this.disponibilites;
    return this.disponibilites.filter(d => d.thematiqueId === this.activeFilterThematique!.id);
  }

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

     // Load programmes from both endpoints to avoid missing entries.
    this.coachService.getProgrammes().subscribe({
      next: (allProgrammes) => {
        this.coachService.getCoachProgrammes(this.coachId).subscribe({
          next: (coachProgrammes) => {
            const merged = [...(allProgrammes || []), ...(coachProgrammes || [])];
            this.programmes = merged.filter((p, i, arr) => !!p?.id && i === arr.findIndex(x => x.id === p.id));
            if (this.selectedThematiqueObj) {
              this.loadProgrammesForThematique(this.selectedThematiqueObj.programmeId);
            }
          },
          error: () => {
            this.programmes = allProgrammes || [];
            if (this.selectedThematiqueObj) {
              this.loadProgrammesForThematique(this.selectedThematiqueObj.programmeId);
            }
          }
        });
      },
      error: () => {
        this.coachService.getCoachProgrammes(this.coachId).subscribe({
          next: (coachProgrammes) => {
            this.programmes = coachProgrammes || [];
            if (this.selectedThematiqueObj) {
              this.loadProgrammesForThematique(this.selectedThematiqueObj.programmeId);
            }
          },
          error: () => { this.programmes = []; }
        });
      }
    });
   
  }

  openDispoModal(): void {
    this.showDispoModal = true;
    this.sessionForms = [];
    this.addSessionForm(); // Start with one empty session form
  }
  openEditDispoModal(dispo?: DisponibiliteDTO): void {
    this.showEditDispoModal = true;
    this.editValidationError = null;
    this.groupedEditDatesView = [];
    if (dispo?.thematiqueId) {
      this.selectedEditThematiqueId = dispo.thematiqueId;
      this.onEditThematiqueSelected(dispo.thematiqueId);
      return;
    }
    if (this.thematiques.length > 0) {
      this.selectedEditThematiqueId = this.thematiques[0].id || null;
      if (this.selectedEditThematiqueId) {
        this.onEditThematiqueSelected(this.selectedEditThematiqueId);
      }
    }
  }

  get selectedEditThematiqueObj(): ThematiqueCoachingDTO | null {
    if (!this.selectedEditThematiqueId) return null;
    return this.thematiques.find(t => t.id === this.selectedEditThematiqueId) || null;
  }

  onEditThematiqueSelected(thematiqueId: number | null): void {
    this.groupedEditDatesView = [];
    this.dispoIdsForActiveTheme = [];
    this.editValidationError = null;
    if (!thematiqueId) return;

    this.loading = true;
    this.dispoIdsForActiveTheme = this.disponibilites
      .filter(d => d.thematiqueId === thematiqueId && !!d.id)
      .map(d => d.id!);
      
    if (this.dispoIdsForActiveTheme.length === 0) {
      this.loading = false;
      return;
    }

    Promise.all(this.dispoIdsForActiveTheme.map((dispoId: number) => firstValueFrom(this.coachService.getSessionsByDisponibilite(dispoId))))
      .then((sessionsByDispo: SessionCoachDTO[][]) => {
        const mergedSessions = sessionsByDispo.flat();
        
        const groupedMap = new Map<string, SessionCoachDTO[]>();
        mergedSessions.forEach(s => {
          if (!groupedMap.has(s.dateSession)) {
            groupedMap.set(s.dateSession, []);
          }
          groupedMap.get(s.dateSession)!.push(s);
        });

        const dates = Array.from(groupedMap.keys()).sort();
        this.groupedEditDatesView = dates.map(date => {
          const sessions = groupedMap.get(date)!;
          sessions.sort((a,b) => a.heureDebut.localeCompare(b.heureDebut));
          
          return {
            date,
            disponibiliteId: sessions[0].disponibiliteId,
            sessions: sessions.map(s => ({
              session: s,
              isEditing: false,
              isNew: false,
              editStart: s.heureDebut.slice(0,5),
              editEnd: s.heureFin.slice(0,5)
            }))
          };
        });
        this.loading = false;
      })
      .catch(() => {
        this.editValidationError = 'Impossible de charger les créneaux de la thématique sélectionnée.';
        this.groupedEditDatesView = [];
        this.loading = false;
      });
  }

  startEditSession(sv: SessionView) {
    sv.isEditing = true;
    if (sv.session) {
      sv.editStart = sv.session.heureDebut.slice(0,5);
      sv.editEnd = sv.session.heureFin.slice(0,5);
    }
  }

  cancelEditSession(group: DateGroupView, sv: SessionView, idx: number) {
    if (sv.isNew) {
      group.sessions.splice(idx, 1);
    } else {
      sv.isEditing = false;
      sv.editStart = sv.session!.heureDebut.slice(0,5);
      sv.editEnd = sv.session!.heureFin.slice(0,5);
      this.editValidationError = null;
    }
  }


  private normalizeCalendarDate(value: string): string {
    if (!value) return '';
    if (value.includes('T')) return value.split('T')[0];
    return value.length >= 10 ? value.slice(0, 10) : value;
  }
  private mapCalendarEvents(events: CoachCalendarEventDTO[]): any[] {
    return events.map((ev) => ({
      id: ev.id,
      type: ev.type,
      title: ev.title,
      date: this.normalizeCalendarDate(ev.date),
      time: (ev.startTime || '').slice(0, 5),
      startTime: ev.startTime ? ev.startTime.slice(0, 5) : '',
      endTime: ev.endTime ? ev.endTime.slice(0, 5) : '',
      color: ev.color || '#4299E1',
      isBooked: !!ev.booked,
      thematiqueNom: ev.thematiqueNom,
      programmeNom: ev.programmeNom
    }));
  }

  buildUpcomingEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.upcomingEvents = this.calendarEvents
      .filter(e => new Date(e.date) >= today && (!this.activeFilterThematique || e.thematiqueNom === this.activeFilterThematique.nom))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
      .map(e => ({
        title: e.title,
        date: new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
        time: e.time || '—',
        startTime: e.startTime || '',
        endTime: e.endTime || '',
        dateFormatted: new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        thematiqueNom: e.thematiqueNom || ''
      }));
  }

  addDisponibilite() {
    if (!this.selectedThematiqueId || this.isSessionFormsEmpty()) return;
    
    const thematique = this.thematiques.find(t => t.id === this.selectedThematiqueId);
    if (thematique) {
      const thStart = new Date(thematique.dateDebut);
      const thEnd = new Date(thematique.dateFin);
      for (const sForm of this.sessionForms) {
        for (const group of sForm.dateSlotGroups) {
          if (group.date) {
            const d = new Date(group.date);
            if (d < thStart || d > thEnd) {
              this.dispoValidationError = `La date ${d.toLocaleDateString('fr-FR')} (Session: ${sForm.titre}) est en dehors de la thématique.`;
              return;
            }
          }
        }
      }
    }
    
    this.dispoValidationError = null;
    this.loading = true;

    this.coachService.addDisponibilite(this.coachId, this.selectedThematiqueId!, this.selectedThematiqueColor).subscribe({
      next: (dispoCreated) => {
        if (dispoCreated && dispoCreated.id) {
          const sessionPromises: Promise<any>[] = [];

          for (const sForm of this.sessionForms) {
            if (!sForm.titre.trim()) continue;
            
            // Generate unique group ID for this session's batch of slots
            const sessionGroupId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);

            for (const group of sForm.dateSlotGroups) {
              if (!group.date) continue;
              for (const slot of group.slots) {
                if (slot.start && slot.end) {
                  const sStart = slot.start.length === 5 ? `${slot.start}:00` : slot.start;
                  const sEnd = slot.end.length === 5 ? `${slot.end}:00` : slot.end;

                  const sessionPayload: SessionCoachDTO = {
                    disponibiliteId: dispoCreated.id,
                    titre: sForm.titre.trim(),
                    dateSession: group.date,
                    heureDebut: sStart,
                    heureFin: sEnd,
                    typeSession: sForm.typeSession,
                    sessionGroupId
                  };
                  sessionPromises.push(firstValueFrom(this.coachService.addSession(dispoCreated.id, sessionPayload)));
                }
              }
            }
          }

          const finish = () => {
            this.disponibilites.push(dispoCreated);
            this.resetModalForm();
            this.loadData();
            this.loading = false;
          };
          
          if (sessionPromises.length > 0) {
            Promise.all(sessionPromises).then(finish).catch(finish);
          } else {
            finish();
          }
        }
      },
      error: () => { this.loading = false; }
    });
  }

  isSessionFormsEmpty(): boolean {
    return this.sessionForms.length === 0 || !this.sessionForms.some(s => s.titre.trim());
  }

  addSessionForm(): void {
    this.sessionForms.push({
      titre: '',
      typeSession: 'EN_LIGNE',
      dateSlotGroups: [{ date: '', slots: [{ start: '', end: '' }] }]
    });
  }

  removeSessionForm(idx: number): void {
    this.sessionForms.splice(idx, 1);
  }

  addDateGroupToForm(sIdx: number): void {
    this.sessionForms[sIdx].dateSlotGroups.push({ date: '', slots: [{ start: '', end: '' }] });
  }

  removeDateGroupFromForm(sIdx: number, gIdx: number): void {
    this.sessionForms[sIdx].dateSlotGroups.splice(gIdx, 1);
  }

  addSlotToFormGroup(sIdx: number, gIdx: number): void {
    this.sessionForms[sIdx].dateSlotGroups[gIdx].slots.push({ start: '', end: '' });
  }

  removeSlotFromFormGroup(sIdx: number, gIdx: number, sliIdx: number): void {
    this.sessionForms[sIdx].dateSlotGroups[gIdx].slots.splice(sliIdx, 1);
  }



  saveSessionEdit(sv: SessionView, group: DateGroupView) {
    if (!sv.editStart || !sv.editEnd) {
      this.editValidationError = 'Les heures sont obligatoires.';
      return;
    }
    if (sv.editStart >= sv.editEnd) {
      this.editValidationError = 'L\'heure de début doit être avant la fin.';
      return;
    }
    this.editValidationError = null;
    
    const startObj = sv.editStart.length === 5 ? `${sv.editStart}:00` : sv.editStart;
    const endObj = sv.editEnd.length === 5 ? `${sv.editEnd}:00` : sv.editEnd;
    
    const updateData = { ...sv.session!, heureDebut: startObj, heureFin: endObj };
    
    this.loading = true;
    this.coachService.updateSession(updateData.id!, updateData).subscribe({
      next: (res) => {
        sv.session = res;
        sv.isEditing = false;
        this.loading = false;
        this.loadData();
      },
      error: () => {
        this.editValidationError = 'Échec de la mise à jour du créneau.';
        this.loading = false;
      }
    });
  }

  deleteSession(sv: SessionView, group: DateGroupView, idx: number) {
    if (confirm('Voulez-vous vraiment supprimer ce créneau ?')) {
      this.loading = true;
      this.coachService.deleteSession(sv.session!.id!).subscribe({
        next: () => {
          group.sessions.splice(idx, 1);
          if (group.sessions.length === 0) {
            this.groupedEditDatesView = this.groupedEditDatesView.filter(g => g !== group);
          }
          this.loading = false;
          this.loadData();
        },
        error: () => {
          this.editValidationError = 'Échec de la suppression du créneau.';
          this.loading = false;
        }
      });
    }
  }

  addNewSessionToDate(group: DateGroupView) {
    this.editValidationError = null;
    group.sessions.push({
      isEditing: true,
      isNew: true,
      editStart: '',
      editEnd: ''
    });
  }

  addEmptyDateGroupForTheme() {
    if (this.dispoIdsForActiveTheme.length === 0) return;
    this.editValidationError = null;
    this.groupedEditDatesView.push({
      date: '',
      disponibiliteId: this.dispoIdsForActiveTheme[0],
      sessions: [{
        isEditing: true,
        isNew: true,
        editStart: '',
        editEnd: ''
      }]
    });
  }

  saveNewSession(sv: SessionView, group: DateGroupView) {
    if (!group.date) {
      this.editValidationError = 'Veuillez définir une date.';
      return;
    }
    if (!sv.editStart || !sv.editEnd) {
      this.editValidationError = 'Les heures sont obligatoires.';
      return;
    }
    if (sv.editStart >= sv.editEnd) {
      this.editValidationError = 'L\'heure de début doit être avant la fin.';
      return;
    }
    this.editValidationError = null;
    
    const startObj = sv.editStart.length === 5 ? `${sv.editStart}:00` : sv.editStart;
    const endObj = sv.editEnd.length === 5 ? `${sv.editEnd}:00` : sv.editEnd;

    const newSession: SessionCoachDTO = {
      disponibiliteId: group.disponibiliteId,
      titre: 'Session',
      dateSession: group.date,
      heureDebut: startObj,
      heureFin: endObj,
      typeSession: 'EN_LIGNE'
    };

    this.loading = true;
    this.coachService.addSession(group.disponibiliteId, newSession).subscribe({
      next: (res) => {
        sv.session = res;
        sv.isNew = false;
        sv.isEditing = false;
        this.loading = false;
        this.loadData();
      },
      error: () => {
        this.editValidationError = 'Échec de la création du créneau.';
        this.loading = false;
      }
    });
  }



  get selectedThematiqueObj(): ThematiqueCoachingDTO | null {
    if (!this.selectedThematiqueId) return null;
    return this.thematiques.find(t => t.id === this.selectedThematiqueId) || null;
  }

  get selectedProgrammeObj(): ProgrammeDTO | null {
    if (!this.selectedProgrammeId) return null;
    return this.programmesForSelectedThematique.find(p => p.id === this.selectedProgrammeId) || null;
  }

  onThematiqueSelected(): void {
  this.dispoValidationError = null;
  this.selectedProgrammeId = null;
  const th = this.selectedThematiqueObj;
  if (!th) return;

  if (this.programmes.length === 0) {
    // Recharger si pas encore disponible
    this.coachService.getProgrammes().subscribe({
      next: (data) => {
        this.programmes = data || [];
        this.loadProgrammesForThematique(th.programmeId);
      }
    });
  } else {
    this.loadProgrammesForThematique(th.programmeId);
  }
  
  this.sessionForms = [];
  this.addSessionForm();
}

  loadProgrammesForThematique(programmeId: number): void {
  // Afficher TOUS les programmes disponibles
  this.programmesForSelectedThematique = this.programmes;
  
  // Pré-sélectionner le programme lié à la thématique s'il existe
  const linked = this.programmes.find(p => p.id === programmeId);
  this.selectedProgrammeId = linked ? linked.id : (this.programmes[0]?.id ?? null);
}



  private resetModalForm() {
    this.selectedThematiqueId = null;
    this.selectedProgrammeId = null;
    this.programmesForSelectedThematique = [];
    this.sessionForms = [];
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
    this.buildUpcomingEvents();
  }

  /** Returns true if date is outside the selected thematique's range */
  isOutOfRange(dateStr: string): boolean {
    if (!this.activeFilterThematique) return false;
    const d = new Date(dateStr);
    const start = new Date(this.activeFilterThematique.dateDebut);
    const end = new Date(this.activeFilterThematique.dateFin);
    return d < start || d > end;
  }

  getMinDate(dateDebut: string | undefined | null): string {
    if (!dateDebut) return '';
    const themeStart = new Date(dateDebut);
    const today = new Date();
    today.setHours(0,0,0,0);
    const minDate = themeStart > today ? themeStart : today;
    return this.formatDate(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  }

  formatDate(year: number, month: number, day: number): string { return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
  getEventsForDay(dateStr: string): any[] { 
    return this.calendarEvents.filter(e => e.date === dateStr && (!this.activeFilterThematique || e.thematiqueNom === this.activeFilterThematique.nom)); 
  }
}
