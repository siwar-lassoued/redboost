import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../frontoffice/service/auth.service';
import { environment } from '../../../../environment';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingInfo {
  sessionId: string;
  entrepreneurName: string;
  entrepreneurEmail: string;
  entrepreneurId: number;
  statut: string;
  meetLink: string | null;
  notesEntrepreneur: string | null;
}

interface SlotWithBookings {
  slotId: number;
  titre: string;
  dateSession: string;
  heureDebut: string;
  heureFin: string;
  typeSession: string;
  thematique: string | null;
  thematiqueId: number | null;
  bookings: BookingInfo[];
  isBooked: boolean;
}

interface ExceptionalSession {
  id: number;
  titre: string;
  dateSeance: string;
  heureDebut: string;
  heureFin: string;
  entrepreneurName: string;
  entrepreneurId: number | null;
  typeSession: string;
}

interface PlanningStats {
  totalSlots: number;
  bookedSlots: number;
  exceptionalCount: number;
  upcomingCount: number;
}

interface CoachPlanningDTO {
  slots: SlotWithBookings[];
  exceptional: ExceptionalSession[];
  stats: PlanningStats;
}

type ViewMode = 'week' | 'list';
type FilterTab = 'all' | 'upcoming' | 'booked' | 'free' | 'exceptional';

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-coach-planning',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="planning-shell">

      <!-- ── PAGE HEADER ──────────────────────────────────────── -->
      <header class="plan-header">
        <div class="plan-header-left">
          <div class="plan-icon">📅</div>
          <div>
            <h1 class="plan-title">Planning des séances</h1>
            <p class="plan-subtitle">Vue détaillée de l'organisation de vos sessions</p>
          </div>
        </div>

        <!-- Stat pills -->
        <div class="plan-pills" *ngIf="planning && !loading">
          <div class="pill pill-total">
            <span class="pill-val">{{ planning.stats.totalSlots }}</span>
            <span class="pill-lbl">créneaux</span>
          </div>
          <div class="pill pill-booked">
            <span class="pill-val">{{ planning.stats.bookedSlots }}</span>
            <span class="pill-lbl">réservés</span>
          </div>
          <div class="pill pill-free">
            <span class="pill-val">{{ planning.stats.totalSlots - planning.stats.bookedSlots }}</span>
            <span class="pill-lbl">libres</span>
          </div>
          <div class="pill pill-up">
            <span class="pill-val">{{ planning.stats.upcomingCount }}</span>
            <span class="pill-lbl">à venir</span>
          </div>
        </div>
      </header>

      <!-- ── SKELETON LOADER ──────────────────────────────────── -->
      <div *ngIf="loading" class="skeleton-area">
        <div *ngFor="let _ of [1,2,3]" class="skeleton-card">
          <div class="sk-line sk-w40"></div>
          <div class="sk-line sk-w70 sk-mt"></div>
          <div class="sk-line sk-w55 sk-mt"></div>
        </div>
      </div>

      <!-- ── ERROR ─────────────────────────────────────────────── -->
      <div *ngIf="error && !loading" class="err-box">
        <div class="err-icon">⚠️</div>
        <p>{{ error }}</p>
        <button (click)="loadPlanning()" class="btn-retry">Réessayer</button>
      </div>

      <!-- ── MAIN CONTENT ──────────────────────────────────────── -->
      <ng-container *ngIf="planning && !loading && !error">

        <!-- Toolbar: Filter + View toggle + Search + Thematique filter -->
        <div class="toolbar">
          <div class="tab-pills">
            <button
              *ngFor="let tab of filterTabs"
              class="tab-pill"
              [class.active]="activeFilter === tab.id"
              (click)="setFilter(tab.id)">
              {{ tab.label }}
              <span class="tab-count">{{ tab.count }}</span>
            </button>
          </div>

          <div class="toolbar-right">
            <!-- Thematique dropdown -->
            <select class="th-select" [(ngModel)]="selectedThematique">
              <option value="">Toutes les thématiques</option>
              <option *ngFor="let th of thematiques" [value]="th">{{ th }}</option>
            </select>

            <!-- View toggle -->
            <div class="view-toggle">
              <button
                class="vt-btn"
                [class.active]="viewMode === 'list'"
                (click)="viewMode = 'list'"
                title="Vue liste">
                ≡
              </button>
              <button
                class="vt-btn"
                [class.active]="viewMode === 'week'"
                (click)="viewMode = 'week'"
                title="Vue semaine">
                ⊞
              </button>
            </div>
          </div>
        </div>

        <!-- ── LIST VIEW ──────────────────────────────────────── -->
        <div *ngIf="viewMode === 'list'" class="list-view">

          <!-- Week groups -->
          <ng-container *ngFor="let group of groupedByWeek">
            <div class="week-label">{{ group.weekLabel }}</div>

            <div class="slot-list">
              <div
                *ngFor="let slot of group.slots"
                class="slot-card"
                [class.slot-booked]="slot.isBooked"
                [class.slot-past]="isPast(slot.dateSession)"
                (click)="openDetail(slot)">

                <!-- Left: date badge -->
                <div class="slot-date-badge" [class.badge-past]="isPast(slot.dateSession)" [class.badge-booked]="slot.isBooked">
                  <span class="date-day">{{ getDay(slot.dateSession) }}</span>
                  <span class="date-mon">{{ getMon(slot.dateSession) }}</span>
                </div>

                <!-- Middle: info -->
                <div class="slot-info">
                  <div class="slot-titre">{{ slot.titre }}</div>
                  <div class="slot-meta">
                    <span class="meta-chip chip-time">
                      🕐 {{ formatTime(slot.heureDebut) }} – {{ formatTime(slot.heureFin) }}
                    </span>
                    <span class="meta-chip chip-type"
                      [class.chip-online]="slot.typeSession === 'EN_LIGNE'"
                      [class.chip-pres]="slot.typeSession === 'PRESENTIEL'">
                      {{ slot.typeSession === 'EN_LIGNE' ? '💻 En ligne' : '🏢 Présentiel' }}
                    </span>
                    <span *ngIf="slot.thematique" class="meta-chip chip-th">
                      🏷 {{ slot.thematique }}
                    </span>
                  </div>

                  <!-- Bookings preview -->
                  <div *ngIf="slot.bookings.length > 0" class="bookings-preview">
                    <div *ngFor="let b of slot.bookings" class="booking-row">
                      <div class="b-avatar">{{ initials(b.entrepreneurName) }}</div>
                      <span class="b-name">{{ b.entrepreneurName }}</span>
                      <span class="b-status" [class]="'status-' + b.statut.toLowerCase()">
                        {{ statusLabel(b.statut) }}
                      </span>
                      <a *ngIf="b.meetLink" [href]="b.meetLink" target="_blank"
                         class="meet-btn" (click)="$event.stopPropagation()">
                        📹 Meet
                      </a>
                    </div>
                  </div>

                  <!-- Free slot -->
                  <div *ngIf="slot.bookings.length === 0 && !isPast(slot.dateSession)" class="free-badge">
                    ✨ Créneau libre
                  </div>
                </div>

                <!-- Right: status indicator -->
                <div class="slot-right">
                  <div class="occupancy-circle" [class.occ-full]="slot.isBooked" [class.occ-free]="!slot.isBooked">
                    <span>{{ slot.isBooked ? '✓' : '○' }}</span>
                  </div>
                  <span class="slot-chevron">›</span>
                </div>

              </div>
            </div>
          </ng-container>

          <!-- Exceptional sessions section -->
          <ng-container *ngIf="filteredExceptionals.length > 0">
            <div class="week-label exceptional-lbl">🎯 Séances exceptionnelles</div>
            <div class="slot-list">
              <div
                *ngFor="let exc of filteredExceptionals"
                class="slot-card slot-exceptional"
                [class.slot-past]="isPast(exc.dateSeance)">

                <div class="slot-date-badge badge-exceptional">
                  <span class="date-day">{{ getDay(exc.dateSeance) }}</span>
                  <span class="date-mon">{{ getMon(exc.dateSeance) }}</span>
                </div>

                <div class="slot-info">
                  <div class="slot-titre">{{ exc.titre }}</div>
                  <div class="slot-meta">
                    <span class="meta-chip chip-time">
                      🕐 {{ formatTime(exc.heureDebut) }} – {{ formatTime(exc.heureFin) }}
                    </span>
                    <span class="meta-chip chip-type"
                      [class.chip-online]="exc.typeSession === 'EN_LIGNE'"
                      [class.chip-pres]="exc.typeSession === 'PRESENTIEL'">
                      {{ exc.typeSession === 'EN_LIGNE' ? '💻 En ligne' : '🏢 Présentiel' }}
                    </span>
                  </div>
                  <div *ngIf="exc.entrepreneurName" class="bookings-preview">
                    <div class="booking-row">
                      <div class="b-avatar b-exc">{{ initials(exc.entrepreneurName) }}</div>
                      <span class="b-name">{{ exc.entrepreneurName }}</span>
                      <span class="b-status status-confirme">Exceptionnel</span>
                    </div>
                  </div>
                </div>

                <div class="slot-right">
                  <div class="occupancy-circle occ-exc">🎯</div>
                </div>
              </div>
            </div>
          </ng-container>

          <!-- Empty state -->
          <div *ngIf="groupedByWeek.length === 0 && filteredExceptionals.length === 0" class="empty-state">
            <div class="empty-icon">🗓️</div>
            <p class="empty-msg">Aucune session trouvée pour ce filtre.</p>
            <button (click)="setFilter('all')" class="btn-reset">Voir tout</button>
          </div>

        </div>

        <!-- ── WEEK GRID VIEW ──────────────────────────────────── -->
        <div *ngIf="viewMode === 'week'" class="week-view">
          <!-- Week navigation -->
          <div class="week-nav">
            <button class="wn-btn" (click)="prevWeek()">‹</button>
            <span class="wn-label">{{ weekRangeLabel }}</span>
            <button class="wn-btn" (click)="nextWeek()">›</button>
            <button class="wn-today" (click)="goToday()">Aujourd'hui</button>
          </div>

          <div class="grid-wrap">
            <!-- Day columns -->
            <div class="day-col" *ngFor="let day of currentWeekDays">
              <div class="day-col-header" [class.col-today]="isToday(day.date)">
                <span class="col-dayname">{{ day.dayName }}</span>
                <span class="col-daynum" [class.today-circle]="isToday(day.date)">{{ day.dayNum }}</span>
              </div>
              <div class="day-col-body">
                <div
                  *ngFor="let slot of getSlotsForDay(day.date)"
                  class="grid-event"
                  [class.ge-booked]="slot.isBooked"
                  [class.ge-free]="!slot.isBooked"
                  [class.ge-past]="isPast(slot.dateSession)"
                  (click)="openDetail(slot)">
                  <div class="ge-time">{{ formatTime(slot.heureDebut) }}</div>
                  <div class="ge-titre">{{ slot.titre }}</div>
                  <div *ngIf="slot.isBooked && slot.bookings.length > 0" class="ge-ent font-bold text-[#1A1A2E]">
                    {{ slot.bookings[0].entrepreneurName }}
                  </div>
                </div>
                <div
                  *ngFor="let exc of getExcForDay(day.date)"
                  class="grid-event ge-exceptional"
                  (click)="openExcDetail(exc)">
                  <div class="ge-time">{{ formatTime(exc.heureDebut) }}</div>
                  <div class="ge-titre">{{ exc.titre }}</div>
                  <div class="ge-ent">{{ exc.entrepreneurName }}</div>
                </div>
                <div *ngIf="getSlotsForDay(day.date).length === 0 && getExcForDay(day.date).length === 0" class="ge-empty">—</div>
              </div>
            </div>
          </div>
        </div>

      </ng-container>
    </div>

    <!-- ── DETAIL DRAWER ──────────────────────────────────────── -->
    <div *ngIf="detailSlot" class="drawer-backdrop" (click)="closeDetail()">
      <div class="drawer" (click)="$event.stopPropagation()">
        <button class="drawer-close" (click)="closeDetail()">✕</button>

        <div class="drawer-header">
          <div class="drawer-date">
            {{ formatFullDate(detailSlot.dateSession) }}
            · {{ formatTime(detailSlot.heureDebut) }} – {{ formatTime(detailSlot.heureFin) }}
          </div>
          <h2 class="drawer-titre">{{ detailSlot.titre }}</h2>
          <div class="drawer-tags">
            <span class="meta-chip chip-type"
              [class.chip-online]="detailSlot.typeSession === 'EN_LIGNE'"
              [class.chip-pres]="detailSlot.typeSession === 'PRESENTIEL'">
              {{ detailSlot.typeSession === 'EN_LIGNE' ? '💻 En ligne' : '🏢 Présentiel' }}
            </span>
            <span *ngIf="detailSlot.thematique" class="meta-chip chip-th">
              🏷 {{ detailSlot.thematique }}
            </span>
            <span class="meta-chip" [class.chip-booked]="detailSlot.isBooked" [class.chip-free]="!detailSlot.isBooked">
              {{ detailSlot.isBooked ? '✓ Réservé' : '○ Libre' }}
            </span>
          </div>
        </div>

        <div class="drawer-body">
          <div *ngIf="detailSlot.bookings.length === 0" class="drawer-empty">
            Aucun entrepreneur n'a réservé ce créneau.
          </div>

          <div *ngFor="let b of detailSlot.bookings" class="drawer-booking">
            <div class="db-top">
              <div class="db-avatar">{{ initials(b.entrepreneurName) }}</div>
              <div class="db-info">
                <div class="db-name">{{ b.entrepreneurName }}</div>
                <div class="db-email">{{ b.entrepreneurEmail }}</div>
              </div>
              <span class="b-status" [class]="'status-' + b.statut.toLowerCase()">
                {{ statusLabel(b.statut) }}
              </span>
            </div>

            <div *ngIf="b.notesEntrepreneur" class="db-notes">
              <span class="notes-lbl">📝 Notes :</span> {{ b.notesEntrepreneur }}
            </div>

            <div class="db-actions">
              <a *ngIf="b.meetLink" [href]="b.meetLink" target="_blank" class="btn-meet">
                📹 Rejoindre Meet
              </a>
              <a [routerLink]="['/coach-entrepreneurs', b.entrepreneurId]" class="btn-profil">
                👤 Voir profil
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Exceptional detail drawer -->
    <div *ngIf="detailExc" class="drawer-backdrop" (click)="closeDetail()">
      <div class="drawer" (click)="$event.stopPropagation()">
        <button class="drawer-close" (click)="closeDetail()">✕</button>
        <div class="drawer-header">
          <div class="drawer-date">{{ formatFullDate(detailExc.dateSeance) }}
            · {{ formatTime(detailExc.heureDebut) }} – {{ formatTime(detailExc.heureFin) }}</div>
          <h2 class="drawer-titre">{{ detailExc.titre }}</h2>
          <div class="drawer-tags">
            <span class="meta-chip chip-type chip-online">🎯 Séance exceptionnelle</span>
          </div>
        </div>
        <div class="drawer-body" *ngIf="detailExc.entrepreneurName">
          <div class="drawer-booking">
            <div class="db-top">
              <div class="db-avatar b-exc">{{ initials(detailExc.entrepreneurName) }}</div>
              <div class="db-info">
                <div class="db-name">{{ detailExc.entrepreneurName }}</div>
              </div>
            </div>
            <div class="db-actions" *ngIf="detailExc.entrepreneurId">
              <a [routerLink]="['/coach-entrepreneurs', detailExc.entrepreneurId]" class="btn-profil">
                👤 Voir profil
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Shell ─────────────────────────────────────────────────── */
    .planning-shell {
      padding: 2rem;
      background: #F0F4F8;
      min-height: 100vh;
      font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
      color: #1A202C;
    }

    /* ── Header ─────────────────────────────────────────────────── */
    .plan-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .plan-header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .plan-icon {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #FFF5F7, #FFD6E0);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.6rem;
    }
    .plan-title {
      font-size: 1.9rem; font-weight: 800; margin: 0; color: #1A202C;
    }
    .plan-subtitle { color: #718096; margin: 2px 0 0; font-size: 0.95rem; }

    /* Stat pills */
    .plan-pills { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .pill {
      display: flex; flex-direction: column; align-items: center;
      padding: 0.6rem 1.2rem; border-radius: 14px; min-width: 70px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .pill-val { font-size: 1.5rem; font-weight: 800; line-height: 1; }
    .pill-lbl { font-size: 0.7rem; font-weight: 600; opacity: 0.75; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
    .pill-total { background: #EBF4FF; color: #2B6CB0; }
    .pill-booked { background: #F0FFF4; color: #276749; }
    .pill-free { background: #FFFAF0; color: #975A16; }
    .pill-up { background: #FAF5FF; color: #6B46C1; }

    /* ── Skeleton ───────────────────────────────────────────────── */
    .skeleton-area { display: flex; flex-direction: column; gap: 1rem; }
    .skeleton-card {
      background: white; border-radius: 16px; padding: 1.5rem;
      animation: shimmer 1.4s infinite;
    }
    .sk-line { height: 14px; border-radius: 7px; background: #EDF2F7; }
    .sk-w40 { width: 40%; }
    .sk-w70 { width: 70%; }
    .sk-w55 { width: 55%; }
    .sk-mt { margin-top: 10px; }
    @keyframes shimmer {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* ── Error ──────────────────────────────────────────────────── */
    .err-box {
      text-align: center; padding: 3rem; background: white;
      border-radius: 16px; border: 1px dashed #FED7D7; color: #E53E3E;
    }
    .err-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .btn-retry, .btn-reset {
      margin-top: 1rem; padding: 0.6rem 1.5rem; border-radius: 10px;
      background: #FF4D85; color: white; border: none; cursor: pointer; font-weight: 600;
    }

    /* ── Toolbar ─────────────────────────────────────────────────── */
    .toolbar {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;
    }
    .tab-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .tab-pill {
      display: flex; align-items: center; gap: 0.4rem;
      padding: 0.5rem 1rem; border-radius: 20px; border: 1.5px solid #E2E8F0;
      background: white; font-size: 0.85rem; font-weight: 600; color: #4A5568;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .tab-pill.active { background: #1A202C; color: white; border-color: #1A202C; }
    .tab-pill:hover:not(.active) { border-color: #CBD5E0; }
    .tab-count {
      background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 10px;
      font-size: 0.7rem;
    }
    .tab-pill:not(.active) .tab-count { background: #EDF2F7; color: #718096; }
    .toolbar-right { display: flex; align-items: center; gap: 0.75rem; }
    .th-select {
      padding: 0.5rem 1rem; border-radius: 10px; border: 1.5px solid #E2E8F0;
      background: white; font-family: inherit; font-size: 0.85rem; color: #4A5568; outline: none;
    }
    .th-select:focus { border-color: #FF4D85; }
    .view-toggle { display: flex; background: #EDF2F7; border-radius: 10px; overflow: hidden; }
    .vt-btn {
      padding: 0.5rem 0.9rem; border: none; background: transparent; cursor: pointer;
      font-size: 1.1rem; color: #718096; transition: all 0.2s; font-family: inherit;
    }
    .vt-btn.active { background: white; color: #1A202C; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }

    /* ── List View ───────────────────────────────────────────────── */
    .week-label {
      font-size: 0.75rem; font-weight: 800; color: #718096; letter-spacing: 1.5px;
      text-transform: uppercase; padding: 1.5rem 0 0.75rem; border-top: 1px solid #E2E8F0;
      margin-top: 0.5rem;
    }
    .week-label:first-child { border-top: none; padding-top: 0; }
    .exceptional-lbl { color: #FF4D85; }

    .slot-list { display: flex; flex-direction: column; gap: 0.6rem; }

    .slot-card {
      display: flex; align-items: flex-start; gap: 1rem;
      background: white; border-radius: 16px; padding: 1.1rem 1.3rem;
      border: 1.5px solid #EDF2F7; cursor: pointer;
      transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
    .slot-card:hover { border-color: #CBD5E0; box-shadow: 0 6px 20px rgba(0,0,0,0.07); transform: translateY(-1px); }
    .slot-booked { border-left: 4px solid #48BB78; }
    .slot-exceptional { border-left: 4px solid #FF4D85; }
    .slot-past { opacity: 0.55; }

    /* Date badge */
    .slot-date-badge {
      min-width: 48px; border-radius: 12px; padding: 6px 0;
      display: flex; flex-direction: column; align-items: center;
      background: #F7FAFC; text-align: center; flex-shrink: 0;
    }
    .badge-past { background: #EDF2F7; }
    .badge-booked { background: #F0FFF4; }
    .badge-exceptional { background: #FFF5F7; }
    .date-day { font-size: 1.4rem; font-weight: 800; color: #2D3748; line-height: 1; }
    .date-mon { font-size: 0.65rem; font-weight: 700; color: #A0AEC0; text-transform: uppercase; letter-spacing: 1px; }

    /* Slot info */
    .slot-info { flex: 1; min-width: 0; }
    .slot-titre { font-size: 1rem; font-weight: 700; color: #2D3748; margin-bottom: 0.4rem; }
    .slot-meta { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem; }
    .meta-chip {
      font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 10px;
      background: #EDF2F7; color: #4A5568;
    }
    .chip-time { background: #EBF8FF; color: #2B6CB0; }
    .chip-online { background: #EBF8FF; color: #2B6CB0; }
    .chip-pres { background: #FEFCBF; color: #975A16; }
    .chip-th { background: #FAF5FF; color: #6B46C1; }
    .chip-booked { background: #F0FFF4; color: #276749; }
    .chip-free { background: #FFFAF0; color: #975A16; }

    /* Bookings preview */
    .bookings-preview { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.5rem; }
    .booking-row {
      display: flex; align-items: center; gap: 0.6rem;
      padding: 0.5rem 0.8rem; background: #FAFBFC; border-radius: 10px;
      border: 1px solid #EDF2F7; flex-wrap: wrap;
    }
    .b-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(135deg, #FF6B9E, #E83E8C);
      color: white; font-size: 0.6rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .b-exc { background: linear-gradient(135deg, #FF4D85, #C0392B); }
    .b-name { flex: 1; font-size: 0.85rem; font-weight: 600; color: #2D3748; }
    .b-status {
      font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 8px;
    }
    .status-confirme, .status-confirmed { background: #C6F6D5; color: #276749; }
    .status-demande, .status-pending { background: #FEFCBF; color: #975A16; }
    .status-annule, .status-cancelled { background: #FED7D7; color: #9B2C2C; }
    .meet-btn {
      font-size: 0.75rem; font-weight: 700; color: #3182CE; background: #EBF4FF;
      padding: 3px 10px; border-radius: 8px; text-decoration: none; white-space: nowrap;
    }
    .meet-btn:hover { background: #BEE3F8; }
    .free-badge {
      display: inline-block; font-size: 0.75rem; font-weight: 700; color: #975A16;
      background: #FFFAF0; padding: 3px 10px; border-radius: 8px; margin-top: 0.4rem;
    }

    /* Right occupancy */
    .slot-right { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; flex-shrink: 0; }
    .occupancy-circle {
      width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center;
      justify-content: center; font-size: 0.8rem; font-weight: 800;
    }
    .occ-full { background: #F0FFF4; color: #38A169; border: 2px solid #C6F6D5; }
    .occ-free { background: #FFFAF0; color: #ED8936; border: 2px solid #FEFCBF; }
    .occ-exc { background: #FFF5F7; border: 2px solid #FFD0DE; font-size: 0.9rem; }
    .slot-chevron { color: #CBD5E0; font-size: 1.4rem; font-weight: 300; }

    /* Empty state */
    .empty-state { text-align: center; padding: 4rem 2rem; }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-msg { color: #718096; font-size: 1rem; margin-bottom: 1rem; }

    /* ── Week Grid View ───────────────────────────────────────────── */
    .week-view { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .week-nav {
      display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem;
      border-bottom: 1px solid #EDF2F7;
    }
    .wn-btn {
      width: 34px; height: 34px; border-radius: 10px; border: 1.5px solid #E2E8F0;
      background: white; cursor: pointer; font-size: 1.2rem; color: #4A5568;
      display: flex; align-items: center; justify-content: center;
    }
    .wn-btn:hover { background: #F7FAFC; }
    .wn-label { flex: 1; font-weight: 700; color: #2D3748; font-size: 1rem; }
    .wn-today {
      padding: 0.4rem 1rem; border-radius: 8px; background: #1A202C; color: white;
      border: none; cursor: pointer; font-weight: 600; font-size: 0.85rem; font-family: inherit;
    }
    .grid-wrap { display: grid; grid-template-columns: repeat(7, 1fr); min-height: 400px; }
    .day-col { border-right: 1px solid #EDF2F7; }
    .day-col:last-child { border-right: none; }
    .day-col-header {
      padding: 0.8rem 0.5rem; text-align: center; border-bottom: 1px solid #EDF2F7;
      background: #FAFBFC;
    }
    .col-today { background: #FFF5F7; }
    .col-dayname { display: block; font-size: 0.65rem; font-weight: 700; color: #A0AEC0; text-transform: uppercase; letter-spacing: 1px; }
    .col-daynum {
      display: inline-flex; width: 28px; height: 28px; align-items: center; justify-content: center;
      font-size: 0.95rem; font-weight: 700; color: #2D3748; margin-top: 2px; border-radius: 50%;
    }
    .today-circle { background: #FF4D85; color: white; }
    .day-col-body { padding: 0.5rem; display: flex; flex-direction: column; gap: 0.4rem; }
    .grid-event {
      border-radius: 8px; padding: 0.4rem 0.6rem; cursor: pointer; transition: all 0.15s;
      font-size: 0.75rem;
    }
    .ge-booked { background: #F0FFF4; border-left: 3px solid #48BB78; }
    .ge-free { background: #EBF8FF; border-left: 3px solid #90CDF4; }
    .ge-exceptional { background: #FFF5F7; border-left: 3px solid #FF4D85; }
    .ge-past { opacity: 0.5; }
    .grid-event:hover { filter: brightness(0.95); }
    .ge-time { font-weight: 700; color: #4A5568; }
    .ge-titre { font-weight: 600; color: #2D3748; margin-top: 1px; }
    .ge-ent { color: #718096; font-size: 0.7rem; margin-top: 1px; }
    .ge-empty { color: #E2E8F0; text-align: center; padding: 0.5rem; font-size: 0.8rem; }

    /* ── Drawer ───────────────────────────────────────────────────── */
    .drawer-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(4px);
      z-index: 1000; display: flex; justify-content: flex-end;
    }
    .drawer {
      width: min(480px, 95vw); height: 100%; background: white;
      box-shadow: -10px 0 40px rgba(0,0,0,0.12); overflow-y: auto;
      animation: slideIn 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      display: flex; flex-direction: column; position: relative;
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .drawer-close {
      position: absolute; top: 1rem; right: 1rem; width: 32px; height: 32px; border-radius: 50%;
      background: #F7FAFC; border: none; cursor: pointer; color: #718096; font-size: 0.9rem;
      display: flex; align-items: center; justify-content: center;
    }
    .drawer-close:hover { background: #EDF2F7; color: #2D3748; }
    .drawer-header {
      padding: 2rem 1.5rem 1.5rem; border-bottom: 1px solid #EDF2F7;
      background: linear-gradient(to bottom, #FAFBFC, white);
    }
    .drawer-date { font-size: 0.8rem; font-weight: 700; color: #A0AEC0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.4rem; }
    .drawer-titre { font-size: 1.4rem; font-weight: 800; color: #1A202C; margin: 0 0 0.8rem; }
    .drawer-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .drawer-body { flex: 1; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .drawer-empty { text-align: center; color: #A0AEC0; padding: 2rem; font-size: 0.95rem; }
    .drawer-booking {
      background: #FAFBFC; border: 1px solid #EDF2F7; border-radius: 14px; padding: 1.2rem;
    }
    .db-top { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.8rem; }
    .db-avatar {
      width: 42px; height: 42px; border-radius: 50%;
      background: linear-gradient(135deg, #FF6B9E, #E83E8C);
      color: white; font-size: 0.75rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .db-info { flex: 1; }
    .db-name { font-weight: 700; color: #2D3748; }
    .db-email { font-size: 0.8rem; color: #718096; }
    .db-notes {
      font-size: 0.85rem; color: #4A5568; background: white; border-radius: 8px;
      padding: 0.6rem 0.8rem; border: 1px solid #EDF2F7; margin: 0.8rem 0;
    }
    .notes-lbl { font-weight: 700; }
    .db-actions { display: flex; gap: 0.6rem; margin-top: 0.6rem; }
    .btn-meet {
      flex: 1; text-align: center; text-decoration: none;
      padding: 0.6rem; border-radius: 10px; font-weight: 700; font-size: 0.85rem;
      background: linear-gradient(135deg, #4299E1, #2B6CB0); color: white;
    }
    .btn-profil {
      flex: 1; text-align: center; text-decoration: none;
      padding: 0.6rem; border-radius: 10px; font-weight: 700; font-size: 0.85rem;
      background: #EDF2F7; color: #2D3748;
    }
    .btn-meet:hover { filter: brightness(1.1); }
    .btn-profil:hover { background: #E2E8F0; }

    @media (max-width: 768px) {
      .planning-shell { padding: 1rem; }
      .plan-header { flex-direction: column; align-items: flex-start; }
      .grid-wrap { grid-template-columns: repeat(3, 1fr); }
      .plan-pills { gap: 0.4rem; }
    }
  `],
})
export class CoachPlanningComponent implements OnInit {
  planning: CoachPlanningDTO | null = null;
  loading = true;
  error: string | null = null;

  viewMode: ViewMode = 'list';
  activeFilter: FilterTab = 'all';
  selectedThematique = '';

  detailSlot: SlotWithBookings | null = null;
  detailExc: ExceptionalSession | null = null;

  // Week navigation
  currentWeekStart: Date = this.getMonday(new Date());

  private coachId: number | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const raw = this.authService.getUserId();
    this.coachId = typeof raw === 'string' ? parseInt(raw, 10) : raw;
    this.loadPlanning();
  }

  loadPlanning(): void {
    if (!this.coachId) { this.error = 'Utilisateur non authentifié.'; this.loading = false; return; }
    this.loading = true;
    this.error = null;
    this.http.get<CoachPlanningDTO>(`${environment.apiUrl}/coach/${this.coachId}/planning`).subscribe({
      next: (data) => {
        this.planning = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Impossible de charger le planning. ' + (err?.error?.message || '');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Filter tabs ──────────────────────────────────────────────────────────────

  get filterTabs() {
    if (!this.planning) return [];
    const s = this.planning.slots;
    const today = new Date().toISOString().split('T')[0];
    return [
      { id: 'all' as FilterTab, label: 'Tous', count: s.length + this.planning.exceptional.length },
      { id: 'upcoming' as FilterTab, label: 'À venir', count: s.filter(x => x.dateSession >= today).length },
      { id: 'booked' as FilterTab, label: 'Réservés', count: s.filter(x => x.isBooked).length },
      { id: 'free' as FilterTab, label: 'Libres', count: s.filter(x => !x.isBooked && x.dateSession >= today).length },
      { id: 'exceptional' as FilterTab, label: 'Exceptionnels', count: this.planning.exceptional.length },
    ];
  }

  setFilter(id: FilterTab): void { this.activeFilter = id; }

  // ── Filtered data ──────────────────────────────────────────────────────────

  get filteredSlots(): SlotWithBookings[] {
    if (!this.planning) return [];
    const today = new Date().toISOString().split('T')[0];
    let s = this.planning.slots;

    if (this.selectedThematique) {
      s = s.filter(x => x.thematique === this.selectedThematique);
    }

    let result = s;
    switch (this.activeFilter) {
      case 'upcoming': result = s.filter(x => x.dateSession >= today); break;
      case 'booked': result = s.filter(x => x.isBooked); break;
      case 'free': result = s.filter(x => !x.isBooked && x.dateSession >= today); break;
      case 'exceptional': result = []; break;
      default: result = s; break;
    }

    return result.sort((a, b) => {
      if (a.dateSession !== b.dateSession) return a.dateSession.localeCompare(b.dateSession);
      return (a.heureDebut || '').localeCompare(b.heureDebut || '');
    });
  }

  get filteredExceptionals(): ExceptionalSession[] {
    if (!this.planning) return [];
    if (this.activeFilter !== 'all' && this.activeFilter !== 'exceptional') return [];
    return [...this.planning.exceptional].sort((a, b) => {
      if (a.dateSeance !== b.dateSeance) return a.dateSeance.localeCompare(b.dateSeance);
      return (a.heureDebut || '').localeCompare(b.heureDebut || '');
    });
  }

  // ── Thematiques ──────────────────────────────────────────────────────────────

  get thematiques(): string[] {
    if (!this.planning) return [];
    return [...new Set(this.planning.slots.map(s => s.thematique).filter(Boolean) as string[])];
  }

  // ── Week grouping ─────────────────────────────────────────────────────────────

  get groupedByWeek(): { weekLabel: string; slots: SlotWithBookings[] }[] {
    const slots = this.filteredSlots;
    const groups: Map<string, SlotWithBookings[]> = new Map();

    slots.forEach(s => {
      const d = new Date(s.dateSession);
      const mon = this.getMonday(d);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      const label = `Semaine du ${this.fmt(mon)} au ${this.fmt(sun)}`;
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(s);
    });

    return Array.from(groups.entries()).map(([weekLabel, s]) => ({ weekLabel, slots: s }));
  }

  // ── Week grid ─────────────────────────────────────────────────────────────────

  get currentWeekDays(): { date: string; dayName: string; dayNum: string }[] {
    const days: { date: string; dayName: string; dayNum: string }[] = [];
    const names = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.currentWeekStart);
      d.setDate(d.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        dayName: names[d.getDay()],
        dayNum: String(d.getDate()).padStart(2, '0'),
      });
    }
    return days;
  }

  get weekRangeLabel(): string {
    const mon = this.currentWeekStart;
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return `${this.fmt(mon)} – ${this.fmt(sun)}`;
  }

  prevWeek(): void { const d = new Date(this.currentWeekStart); d.setDate(d.getDate() - 7); this.currentWeekStart = d; }
  nextWeek(): void { const d = new Date(this.currentWeekStart); d.setDate(d.getDate() + 7); this.currentWeekStart = d; }
  goToday(): void { this.currentWeekStart = this.getMonday(new Date()); }

  getSlotsForDay(dateStr: string): SlotWithBookings[] {
    return this.filteredSlots.filter(s => s.dateSession === dateStr);
  }

  getExcForDay(dateStr: string): ExceptionalSession[] {
    return this.filteredExceptionals.filter(s => s.dateSeance === dateStr);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  isPast(dateStr: string): boolean {
    return dateStr < new Date().toISOString().split('T')[0];
  }

  isToday(dateStr: string): boolean {
    return dateStr === new Date().toISOString().split('T')[0];
  }

  getDay(dateStr: string): string {
    return String(new Date(dateStr).getDate()).padStart(2, '0');
  }

  getMon(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short' });
  }

  formatTime(t: string | null): string {
    if (!t) return '';
    return String(t).slice(0, 5);
  }

  formatFullDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
  }

  statusLabel(statut: string): string {
    const map: Record<string, string> = {
      CONFIRME: 'Confirmé', CONFIRMED: 'Confirmé',
      DEMANDE: 'En attente', PENDING: 'En attente',
      ANNULE: 'Annulé', CANCELLED: 'Annulé',
    };
    return map[statut?.toUpperCase()] || statut;
  }

  openDetail(slot: SlotWithBookings): void { this.detailSlot = slot; this.detailExc = null; }
  openExcDetail(exc: ExceptionalSession): void { this.detailExc = exc; this.detailSlot = null; }
  closeDetail(): void { this.detailSlot = null; this.detailExc = null; }

  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private fmt(d: Date): string {
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
}