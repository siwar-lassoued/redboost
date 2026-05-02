with open('event_calendar.html', 'rb') as f:
    raw = f.read()

new_modal = b"""<!-- Booking Confirmation Modal -->
<div class="booking-overlay" *ngIf="selectedSlot" (click)="selectedSlot = null">
  <div class="booking-modal-card" (click)="$event.stopPropagation()">
    <div class="booking-modal-header">
      <div class="header-icon-wrap">
        <mat-icon>event_available</mat-icon>
      </div>
      <div class="header-text">
        <h3>Confirmer la r\xc3\xa9servation</h3>
        <p>{{ selectedGroupTitle }}<span *ngIf="selectedCoachForBooking"> \xe2\x80\x94 {{ selectedCoachForBooking.nom }}</span></p>
      </div>
      <button class="close-modal-btn" (click)="selectedSlot = null">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <div class="booking-modal-body">
      <div class="session-info-grid">
        <div class="info-chip">
          <div class="chip-icon date-icon">
            <mat-icon>calendar_today</mat-icon>
          </div>
          <div class="chip-content">
            <span class="chip-label">Date</span>
            <span class="chip-value">{{ selectedSlot.dateSession | date:'dd MMMM yyyy' }}</span>
          </div>
        </div>
        <div class="info-chip">
          <div class="chip-icon time-icon">
            <mat-icon>schedule</mat-icon>
          </div>
          <div class="chip-content">
            <span class="chip-label">Horaire</span>
            <span class="chip-value">{{ formatSlotTime(selectedSlot.heureDebut) }} \xe2\x86\x92 {{ formatSlotTime(selectedSlot.heureFin) }}</span>
          </div>
        </div>
        <div class="info-chip" *ngIf="selectedSlot.typeSession">
          <div class="chip-icon mode-icon">
            <mat-icon>{{ selectedSlot.typeSession === 'EN_LIGNE' ? 'videocam' : 'location_on' }}</mat-icon>
          </div>
          <div class="chip-content">
            <span class="chip-label">Mode</span>
            <span class="chip-value">{{ selectedSlot.typeSession === 'EN_LIGNE' ? 'En ligne' : 'Pr\xc3\xa9sentiel' }}</span>
          </div>
        </div>
      </div>
      <div class="notes-section">
        <label class="notes-label">
          <mat-icon>edit_note</mat-icon>
          Notes pour le coach <span class="optional-tag">optionnel</span>
        </label>
        <textarea
          class="notes-textarea"
          [(ngModel)]="bookingNotes"
          placeholder="Pr\xc3\xa9cisez vos besoins, objectifs ou questions pour cette session..."
          rows="3">
        </textarea>
      </div>
      <div class="booking-modal-actions">
        <button class="btn-cancel-modal" (click)="selectedSlot = null">
          <mat-icon>close</mat-icon>
          Annuler
        </button>
        <button class="btn-confirm-modal" (click)="confirmBooking()" [disabled]="isBooking">
          <span *ngIf="isBooking" class="loading-spinner"></span>
          <mat-icon *ngIf="!isBooking">check_circle</mat-icon>
          {{ isBooking ? 'R\xc3\xa9servation en cours...' : 'Confirmer la r\xc3\xa9servation' }}
        </button>
      </div>
    </div>
  </div>
</div>
"""

marker = b'<!-- Booking Confirmation Modal -->'
idx = raw.find(marker)
if idx >= 0:
    result = raw[:idx] + new_modal
    with open('event_calendar.html', 'wb') as f:
        f.write(result)
    print('SUCCESS: replaced from position', idx)
else:
    print('MARKER NOT FOUND')
