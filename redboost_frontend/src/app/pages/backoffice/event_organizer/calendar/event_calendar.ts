import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddEventDialogComponent } from '../dialogs/add_event_dialog/add_event_dialog';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { EventService, EventResponse } from '../event.service';
import { TypeFormationService, TypeFormation } from '../type-formation.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, of } from 'rxjs';
import { catchError, filter, take } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { MatchingService } from '../../../../core/services/matching.service';
import { CoachService } from '../../../dashboard/coachDashboard/services/coach.service';
import { SessionService } from '../../../../core/services/session.service';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: string;
  location: string;
  mode: 'en-personne' | 'virtuel' | 'hybrid';
  program: string;
  description: string;
  participants: string[];
  meetLink?: string;
  googleEventId?: string;   // Google Calendar event ID for deep-link
  isDisabled?: boolean;
  couleur?: string;
  isExceptionnelle?: boolean;
}

interface EventTypeWithColor {
  name: string;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-calendar',
  templateUrl: './event_calendar.html',
  styleUrls: ['./event_calendar.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FormsModule
  ],
})
export class CalendarComponent implements OnInit {
  currentMonth: Date = new Date();
  calendarDays: any[] = [];
  weekDays = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
  
  events: CalendarEvent[] = [];
  isLoading = false;
  totalEventsCount = 0;
  isEntrepreneur = false;
  isCoach = false;
  matchedCoaches: any[] = [];
  coachGroupsMap: { [coachId: string]: any[] } = {};
  thematiquesList: any[] = [];
  
  // Entrepreneur Slot Statistics
  availableSlotsCount = 0;
  totalSlotsCount = 0;
  reservedSlotsCount = 0;
  
  // Selected slot for reservation
  selectedSlot: any | null = null;
  selectedCoachForBooking: any | null = null;
  selectedGroupTitle: string = '';
  bookingNotes: string = '';
  isBooking: boolean = false;
  
  // Selected date and its event
  selectedDate: Date | null = null;
  selectedDateEvents: CalendarEvent[] = [];

  eventTypes: EventTypeWithColor[] = [];
  private colorPalette = [
    '#3B82A6', // Blue
    '#FF4D85', // Pink
    '#10B981', // Green
    '#8B5CF6', // Violet
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#14B8A6', // Teal
    '#F43F5E', // Rose
    '#7C3339', // Burgundy
    '#475569', // Slate
    '#A855F7', // Purple
    '#F97316', // Orange
  ];

  private thematicColors: { [name: string]: string } = {};

  // ... (rest of colors)
  private iconMapping: { [key: string]: string } = {
    'pitch deck': 'campaign',
    'pitch': 'campaign',
    'networking': 'groups',
    'formation': 'school',
    'atelier': 'construction',
    'célébration': 'celebration',
    'celebration': 'celebration',
    'présentation': 'present_to_all',
    'presentation': 'present_to_all',
    'coaching': 'person',
    'workshop': 'handyman',
    'séminaire': 'school',
    'seminar': 'school',
    'meeting': 'group',
    'créneau disponible': 'event_available',
    'créneau': 'event_available',
    'coaching (confirmé)': 'groups',
    'dispo': 'event_available',
  };

  constructor(
    private dialog: MatDialog,
    private eventService: EventService,
    private typeFormationService: TypeFormationService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private matchingService: MatchingService,
    private coachService: CoachService,
    private sessionService: SessionService,
    private cdr: ChangeDetectorRef
  ) {
    registerLocaleData(localeFr);
  }

  ngOnInit(): void {
    // Wait for the authenticated user before loading — currentUser$.value is often null on first render
    this.authService.currentUser$.pipe(
      filter(u => !!u),
      take(1)
    ).subscribe(() => {
      this.loadEventTypesAndEvents();
    });

    // Fallback: if already null after 500ms (not logged in), still render the calendar skeleton
    setTimeout(() => {
      if (!this.authService.currentUser$.value) {
        this.isLoading = false;
        this.generateCalendar();
        this.cdr.detectChanges();
      }
    }, 500);
  }

  loadEventTypesAndEvents(): void {
    this.isLoading = true;
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth() + 1;
    const currentUser = this.authService.currentUser$.value;
    console.log('Calendar loading for role:', currentUser?.role, 'User ID:', currentUser?.id);
    
    const dataSources: any = {
      types: this.typeFormationService.getAllTypes().pipe(catchError(() => of([]))),
      events: this.eventService.getEventsByMonth(year, month).pipe(catchError(() => of([])))
    };

    if (currentUser && (String(currentUser.role) === 'ENTREPRENEUR' || String(currentUser.role) === 'ROLE_ENTREPRENEUR')) {
      console.log('Detected ENTREPRENEUR role');
      this.isEntrepreneur = true;
      this.isCoach = false;
      const userIdStr = String(currentUser.id);
      dataSources.bookedSessions = this.sessionService.getByEntrepreneur(userIdStr).pipe(catchError((err) => { console.error('Error bookedSessions:', err); return of([]); }));
      dataSources.coaches = this.matchingService.getEntrepreneurCoaches(userIdStr).pipe(catchError((err) => { console.error('Error coaches:', err); return of([]); }));
      dataSources.myCalendar = this.sessionService.getMyCalendar(userIdStr, 'ENTREPRENEUR').pipe(catchError((err) => { console.error('Error myCalendar:', err); return of([]); }));
    } else if (currentUser && (String(currentUser.role) === 'COACH' || String(currentUser.role) === 'ROLE_COACH')) {
      console.log('Detected COACH role');
      this.isCoach = true;
      this.isEntrepreneur = false;
      const userIdStr = String(currentUser.id);
      dataSources.myCalendar = this.sessionService.getMyCalendar(userIdStr, 'COACH').pipe(catchError((err) => { console.error('Error myCalendar:', err); return of([]); }));
    } else if (currentUser && (String(currentUser.role) === 'SUPERADMIN' || String(currentUser.role) === 'ADMIN')) {
      console.log('Detected SUPERADMIN/ADMIN role');
      this.isCoach = false;
      this.isEntrepreneur = false;
      dataSources.bookedSessions = this.sessionService.getAll().pipe(catchError((err) => { console.error('Error allSessions:', err); return of([]); }));
    }

    forkJoin(dataSources).subscribe({
      next: (response: any) => {
        console.log('Main data sources loaded:', Object.keys(response));
        this.eventTypes = this.mapTypesToEventTypes(response.types);
        let allCalendarEvents = this.mapResponseToCalendarEvents(response.events);
        
        if (response.bookedSessions) {
          const bookedMapped = this.mapBookedSessionsToCalendarEvents(response.bookedSessions);
          allCalendarEvents = [...allCalendarEvents, ...bookedMapped];
        }

        // Load coach's own sessions from the unified my-calendar endpoint
        if (response.myCalendar && response.myCalendar.length > 0) {
          const myCalMapped = this.mapMyCalendarEventsToCalendarEvents(response.myCalendar);
          // Avoid duplicates with already mapped booked sessions
          const existingIds = new Set(allCalendarEvents.map(e => e.id));
          const deduplicated = myCalMapped.filter(e => !existingIds.has(e.id));
          allCalendarEvents = [...allCalendarEvents, ...deduplicated];
        }

        if (response.coaches && response.coaches.length > 0) {
          this.matchedCoaches = response.coaches;
          const entrepreneurId = Number(currentUser?.id);
          
          const slotRequests = response.coaches.map((c: any) => 
            this.coachService.getAvailableSessionsForEntrepreneur(Number(c.id), entrepreneurId, c.thematiqueId ? Number(c.thematiqueId) : undefined).pipe(catchError(() => of([])))
          );

          const groupRequests = response.coaches.map((c: any) => 
            this.coachService.getAvailableSessionsGrouped(Number(c.id), entrepreneurId, c.thematiqueId ? Number(c.thematiqueId) : undefined).pipe(catchError(() => of([])))
          );
          
          forkJoin([...slotRequests, ...groupRequests]).subscribe((allData: any[]) => {
            const numCoaches = response.coaches.length;
            const slotsArray = allData.slice(0, numCoaches);
            const groupsArray = allData.slice(numCoaches);

            const globalThematiques: any[] = [];

            response.coaches.forEach((c: any, index: number) => {
              const groups: any[] = groupsArray[index] || [];
              this.coachGroupsMap[c.id] = groups;
              
              groups.forEach(g => {
                const themName = g.slots[0]?.thematiqueNom || 'Thématique Générale';
                
                // Find or create thematique in global list
                let thematiqueObj = globalThematiques.find(t => t.name === themName);
                if (!thematiqueObj) {
                  thematiqueObj = { name: themName, coaches: [] };
                  globalThematiques.push(thematiqueObj);
                }
                
                // Find or create coach inside this thematique
                let coachObj = thematiqueObj.coaches.find((coachEntry: any) => coachEntry.coach.id === c.id);
                if (!coachObj) {
                  coachObj = { coach: c, sessionGroups: [] };
                  thematiqueObj.coaches.push(coachObj);
                }
                
                // Add the session group to this coach
                coachObj.sessionGroups.push(g);
              });
            });
            this.thematiquesList = globalThematiques;

            // Instead of separate slotRequests, we use slots from the groups to ensure consistency
            const allSlotsFromGroups = groupsArray.flat().map(g => g.slots).flat();
            
            // Calculate slot statistics
            this.totalSlotsCount = allSlotsFromGroups.length;
            this.reservedSlotsCount = response.bookedSessions ? response.bookedSessions.length : 0;
            this.availableSlotsCount = allSlotsFromGroups.filter(s => !s.isBooked && !s.isGroupReservedByMe).length;

            const slotsMapped = this.mapAvailableSlotsToCalendarEvents(allSlotsFromGroups);
            
            this.events = [...allCalendarEvents, ...slotsMapped];
            this.totalEventsCount = this.events.length;
            this.generateCalendar();
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        } else {
          this.events = allCalendarEvents;
          this.totalEventsCount = this.events.length;
          this.generateCalendar();
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.snackBar.open('Erreur lors du chargement des données', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
        this.generateCalendar();
      }
    });
  }


  getAvailableCount(slots: any[]): number {
    return slots.filter(s => !s.isBooked).length;
  }

  getBookedCount(slots: any[]): number {
    return slots.filter(s => s.isBooked).length;
  }

  /** Groups slots by date string for display (Coach → Thématique → Session → Date) */
  groupSlotsByDate(slots: any[]): { dateLabel: string; dateKey: string; slots: any[] }[] {
    const map = new Map<string, any[]>();
    for (const slot of slots) {
      const key = slot.dateSession || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, daySlots]) => ({
        dateKey: key,
        dateLabel: key ? new Date(key).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Date inconnue',
        slots: daySlots
      }));
  }

  getCoachColor(coachId: string): string {
    const index = this.matchedCoaches.findIndex(c => c.id === coachId);
    return this.colorPalette[index % this.colorPalette.length];
  }

  selectSlot(slot: any, groupTitle: string, coach: any): void {
    this.selectedSlot = slot;
    this.selectedGroupTitle = groupTitle;
    this.selectedCoachForBooking = coach;
    this.bookingNotes = '';
  }

  confirmBooking(): void {
    const currentUser = this.authService.currentUser$.value;
    if (!this.selectedSlot || !currentUser) return;

    this.isBooking = true;
    this.coachService.bookSession(Number(this.selectedSlot.id), Number(currentUser.id), this.bookingNotes).subscribe({
      next: (res: any) => {
        this.isBooking = false;
        const meetLink = res?.meetLink;
        if (meetLink) {
          this.snackBar.open(
            ' Session réservée ! Lien Meet disponible dans votre espace.',
            'Ouvrir Meet',
            { duration: 8000, panelClass: ['success-snackbar'] }
          ).onAction().subscribe(() => window.open(meetLink, '_blank'));
        } else {
          this.snackBar.open(' Session réservée avec succès !', 'Fermer', {
            duration: 5000, panelClass: ['success-snackbar']
          });
        }
        this.selectedSlot = null;
        this.loadEventTypesAndEvents(); // Refresh calendar
      },
      error: (err) => {
        this.isBooking = false;
        console.error('ERREUR BACKEND DÉTAILLÉE:', err);
        const msg = err.error?.error || err.error?.message || err.message || 'Erreur lors de la réservation';
        
        // Affiche l'erreur exacte dans une alerte pour être sûr de la voir !
        alert("ERREUR DU SERVEUR : " + msg);
        
        this.snackBar.open(msg, 'Fermer', { duration: 5000 });
      }
    });
  }

  mapBookedSessionsToCalendarEvents(sessions: any[]): CalendarEvent[] {
    return sessions.map(s => ({
      id: 'booked-' + s.id,
      title: 'Coaching : ' + (s.titre || ''),
      date: new Date(s.date),
      time: new Date(s.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type: 'Coaching (Confirmé)',
      location: s.meetLink ? 'En ligne' : 'À définir',
      mode: (s.meetLink ? 'virtuel' : 'en-personne') as 'en-personne' | 'virtuel' | 'hybrid',
      program: '',
      description: s.description || '',
      participants: [],
      meetLink: s.meetLink,
      googleEventId: s.googleEventId,
      isDisabled: true,
      isExceptionnelle: s.isExceptionnelle
    }));
  }

  /** Map MyCalendarEvent[] (from /api/sessions/my-calendar) to CalendarEvent[] */
  mapMyCalendarEventsToCalendarEvents(items: any[]): CalendarEvent[] {
    return items.map(s => {
      const dateObj = s.dateTime ? new Date(s.dateTime) : new Date();
      const endObj  = s.endDateTime ? new Date(s.endDateTime) : null;
      const startTime = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const endTime   = endObj   ? endObj.toLocaleTimeString('fr-FR',   { hour: '2-digit', minute: '2-digit' }) : '';
      return {
        id: s.id,
        title: s.title || 'Session',
        date: dateObj,
        time: endTime ? `${startTime} - ${endTime}` : startTime,
        type: s.statut === 'DISPONIBLE' ? 'creneau' : 'Coaching (Confirmé)',
        location: s.isOnline ? 'En ligne' : 'À définir',
        mode: (s.isOnline ? 'virtuel' : 'en-personne') as 'en-personne' | 'virtuel' | 'hybrid',
        program: '',
        description: s.description || '',
        participants: [],
        meetLink: s.meetLink,
        googleEventId: s.googleEventId,
        isDisabled: s.type === 'SESSION_SLOT'
      };
    });
  }

  mapAvailableSlotsToCalendarEvents(slots: any[]): CalendarEvent[] {
    return slots.map(s => {
      // Create date with time to avoid timezone shifts to previous day
      const dateStr = s.dateSession.includes('T') ? s.dateSession : `${s.dateSession}T${s.heureDebut || '00:00:00'}`;
      const themName = s.thematiqueNom || 'Thématique Générale';
      
      return {
        id: 'slot-' + s.id,
        title: (s.titre || 'Créneau'),
        date: new Date(dateStr),
        time: s.heureDebut.substring(0, 5) + ' - ' + s.heureFin.substring(0, 5),
        type: 'creneau', 
        location: s.typeSession === 'EN_LIGNE' ? 'En ligne' : (s.adresse || 'En personne'),
        mode: s.typeSession === 'EN_LIGNE' ? 'virtuel' : 'en-personne',
        program: themName, // Use program field for thematique name in slots
        description: 'Réservez via le panneau de droite',
        participants: [],
        isDisabled: s.isBooked || s.isGroupReservedByMe || false,
        couleur: s.couleur,
        isExceptionnelle: s.isExceptionnelle
      };
    });
  }

  formatSlotDay(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).getDate().toString();
  }

  formatSlotMonth(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
  }

  formatSlotTime(timeStr: string | undefined): string {
    if (!timeStr) return '';
    return timeStr.substring(0, 5).replace(':', 'h');
  }

  mapTypesToEventTypes(types: TypeFormation[]): EventTypeWithColor[] {
    return types.map((type, index) => ({
      name: type.name,
      color: this.colorPalette[index % this.colorPalette.length],
      icon: this.getIconForType(type.name)
    }));
  }

  getIconForType(typeName: string): string {
    const lowerName = typeName.toLowerCase();
    
    for (const [key, icon] of Object.entries(this.iconMapping)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    
    return 'event';
  }

  loadEvents(): void {
    this.loadEventTypesAndEvents();
  }

  mapResponseToCalendarEvents(responses: EventResponse[]): CalendarEvent[] {
    return responses.map(event => ({
      id: event.id.toString(),
      title: event.title,
      date: new Date(event.startDateTime),
      time: this.formatTime(event.startDateTime, event.endDateTime),
      type: event.type, // Use the type name directly from backend
      location: event.location,
      mode: this.mapMode(event.mode),
      program: event.program,
      description: event.description,
      participants: event.participantEmails,
      meetLink: event.meetLink
    }));
  }

  formatTime(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startTime = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const endTime = endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${startTime} - ${endTime}`;
  }

  mapMode(backendMode: string): 'en-personne' | 'virtuel' | 'hybrid' {
    switch (backendMode) {
      case 'EN_PERSONNE': return 'en-personne';
      case 'VIRTUEL': return 'virtuel';
      case 'HYBRID': return 'hybrid';
      default: return 'en-personne';
    }
  }

  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.calendarDays = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 full weeks) to handle all month lengths
    while (this.calendarDays.length < 42) {
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      const currentDay = currentDate.getDate();

      const currentDayStr = new Date(currentYear, currentMonth, currentDay).toDateString();

      const dayEvents = this.events.filter(event => {
        return event.date.toDateString() === currentDayStr;
      });
      
      this.calendarDays.push({
        date: new Date(currentDate),
        day: currentDay,
        isCurrentMonth: currentDate.getMonth() === month,
        events: dayEvents
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  previousMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    );
    this.selectedDate = null;
    this.selectedDateEvents = [];
    this.loadEvents();
  }

  nextMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    );
    this.selectedDate = null;
    this.selectedDateEvents = [];
    this.loadEvents();
  }

  getMonthYear(): string {
    return this.currentMonth.toLocaleDateString('fr-FR', { 
      month: 'long', 
      year: 'numeric' 
    });
  }

  onDayClick(day: any): void {
    if (day.events.length > 0) {
      if (this.selectedDate && this.selectedDate.getTime() === day.date.getTime()) {
        this.clearSelection();
      } else {
        this.selectedDate = day.date;
        this.selectedDateEvents = day.events;
      }
    }
  }

  clearSelection(): void {
    this.selectedDate = null;
    this.selectedDateEvents = [];
  }

  getSelectedDateFormatted(): string {
    if (!this.selectedDate) return '';
    return this.selectedDate.toLocaleDateString('fr-FR', { 
      day: 'numeric',
      month: 'long'
    });
  }

  getEventTypeIconPrime(typeName: string): string {
    const icon = this.getIconForType(typeName);
    const materialToPrime: { [key: string]: string } = {
      'campaign': 'pi-megaphone',
      'groups': 'pi-users',
      'school': 'pi-book',
      'construction': 'pi-cog',
      'celebration': 'pi-gift',
      'present_to_all': 'pi-desktop',
      'person': 'pi-user',
      'handyman': 'pi-wrench',
      'group': 'pi-users',
      'event_available': 'pi-calendar-check',
      'event': 'pi-calendar'
    };
    return materialToPrime[icon] || 'pi-calendar';
  }

  getModeIconPrime(mode: string): string {
    switch (mode) {
      case 'en-personne': return 'pi-map-marker';
      case 'virtuel': return 'pi-video';
      case 'hybrid': return 'pi-briefcase';
      default: return 'pi-calendar';
    }
  }
openEditEventDialog(event: CalendarEvent): void {
  const dialogRef = this.dialog.open(AddEventDialogComponent, {
    width: '800px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    panelClass: 'custom-dialog-container',
    disableClose: false,
    autoFocus: true,
    data: { 
      event: this.mapCalendarEventToResponse(event) 
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.isLoading = true;
      const year = this.currentMonth.getFullYear();
      const month = this.currentMonth.getMonth() + 1;

      forkJoin({
        types: this.typeFormationService.getAllTypes(),
        events: this.eventService.getEventsByMonth(year, month)
      }).subscribe({
        next: (response) => {
          this.eventTypes = this.mapTypesToEventTypes(response.types);
          this.events = this.mapResponseToCalendarEvents(response.events);
          this.totalEventsCount = this.events.length;
          this.generateCalendar();
          
          // Update selected date events if a date is selected
          if (this.selectedDate) {
            this.selectedDateEvents = this.events.filter(e => 
              e.date.getDate() === this.selectedDate!.getDate() &&
              e.date.getMonth() === this.selectedDate!.getMonth() &&
              e.date.getFullYear() === this.selectedDate!.getFullYear()
            );
          }
          
          this.isLoading = false;
          
          this.snackBar.open(' Événement mis à jour avec succès!', 'Fermer', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.isLoading = false;
        }
      });
    }
  });
}

  mapCalendarEventToResponse(event: CalendarEvent): EventResponse {
    const [startTime, endTime] = event.time.split(' - ');
    const startDate = new Date(event.date);
    const endDate = new Date(event.date);
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    startDate.setHours(startHour, startMin, 0, 0);
    
    const [endHour, endMin] = endTime.split(':').map(Number);
    endDate.setHours(endHour, endMin, 0, 0);
    
    const backendMode = event.mode === 'en-personne' ? 'EN_PERSONNE' : 
                        event.mode === 'virtuel' ? 'VIRTUEL' : 'HYBRID';
    
    return {
      id: parseInt(event.id),
      title: event.title,
      description: event.description,
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      type: event.type, // Use type name directly
      mode: backendMode,
      location: event.location,
      meetLink: event.meetLink,
      program: event.program,
      participantEmails: event.participants,
      googleCalendarEventId: '',
      status: 'SCHEDULED',
      createdAt: new Date().toISOString()
    };
  }

  openAddEventDialog(): void {
    const dialogRef = this.dialog.open(AddEventDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      disableClose: false,
      autoFocus: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEventTypesAndEvents();
        
        let message = ' Événement créé avec succès! Les invitations ont été envoyées.';
        if (result.meetLink) {
          message += `  Lien Meet disponible.`;
        }
        
        this.snackBar.open(message, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  getEventTypeColor(typeName: string): string {
    const eventType = this.eventTypes.find(t => t.name === typeName);
    if (eventType) return eventType.color;
    
    // Generate a consistent color from palette based on string hash
    let hash = 0;
    for (let i = 0; i < typeName.length; i++) {
      hash = typeName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % this.colorPalette.length;
    return this.colorPalette[colorIndex];
  }

  getUpcomingEventsCount(): number {
    const now = new Date();
    return this.events.filter(event => event.date >= now).length;
  }




isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}


isSelectedDate(date: Date): boolean {
  if (!this.selectedDate) return false;
  return date.getDate() === this.selectedDate.getDate() &&
    date.getMonth() === this.selectedDate.getMonth() &&
    date.getFullYear() === this.selectedDate.getFullYear();
}


  getEventGradient(event: CalendarEvent): string {
    const typeName = event.type;
    const themName = event.program || '';

    if (event.couleur) {
      return `linear-gradient(135deg, ${event.couleur} 0%, ${this.darkenColor(event.couleur, 20)} 100%)`;
    }

    // If it's a thematic session (creneau or coaching), use thematic color
    if (themName && (typeName.toLowerCase().includes('creneau') || typeName.toLowerCase().includes('coaching'))) {
      const color = this.getThematicColor(themName);
      return `linear-gradient(135deg, ${color} 0%, ${this.darkenColor(color, 20)} 100%)`;
    }

    const gradients: { [key: string]: string } = {
      'pitch deck': 'linear-gradient(135deg, #ea5073 0%, #d4476a 100%)',
      'pitch': 'linear-gradient(135deg, #ea5073 0%, #d4476a 100%)',
      'networking': 'linear-gradient(135deg, #2a7b8c 0%, #1a6778 100%)',
      'formation': 'linear-gradient(135deg, #6d3345 0%, #5a2a3a 100%)',
      'atelier': 'linear-gradient(135deg, #2a5f6f 0%, #1a4f5f 100%)',
      'célébration': 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      'celebration': 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      'présentation': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      'presentation': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      'workshop': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    };

    const lowerType = typeName.toLowerCase();
    for (const [key, gradient] of Object.entries(gradients)) {
      if (lowerType.includes(key)) {
        return gradient;
      }
    }

    const eventType = this.eventTypes.find(t => t.name === typeName);
    if (eventType) {
      return `linear-gradient(135deg, ${eventType.color} 0%, ${this.darkenColor(eventType.color, 20)} 100%)`;
    }

    return 'linear-gradient(135deg, #FF4D85 0%, #FF4D85 100%)';
  }

  getThematicColor(themName: string): string {
    if (this.thematicColors[themName]) return this.thematicColors[themName];

    // Generate a consistent color based on thematic name
    let hash = 0;
    for (let i = 0; i < themName.length; i++) {
      hash = themName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % this.colorPalette.length;
    const color = this.colorPalette[colorIndex];
    this.thematicColors[themName] = color;
    return color;
  }


private darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}


getUpcomingEvents(): CalendarEvent[] {
  const now = new Date();
  let upcoming = this.events.filter(event => event.date >= now);
  
  if (this.isEntrepreneur) {
    upcoming = upcoming.filter(event => event.id.startsWith('booked-'));
  }

  return upcoming
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);
}


formatEventDate(date: Date): string {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}


selectEventDate(date: Date): void {
  this.selectedDate = date;
  this.selectedDateEvents = this.events.filter(event => 
    event.date.getDate() === date.getDate() &&
    event.date.getMonth() === date.getMonth() &&
    event.date.getFullYear() === date.getFullYear()
  );
}


deleteEvent(event: CalendarEvent): void {
  if (confirm(`Êtes-vous sûr de vouloir supprimer "${event.title}" ?`)) {
    this.eventService.cancelEvent(parseInt(event.id)).subscribe({
      next: () => {
        this.snackBar.open(' Événement supprimé avec succès!', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
    
        if (this.selectedDate) {
          this.selectedDateEvents = this.selectedDateEvents.filter(e => e.id !== event.id);
        }
        
        this.loadEvents();
      },
      error: (error) => {
        console.error('Error deleting event:', error);
        this.snackBar.open(' Erreur lors de la suppression', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}

  
  openGoogleCalendar(event: CalendarEvent): void {
    let url: string;
    if (event.googleEventId) {
      // Direct deep-link to the event in Google Calendar
      url = `https://calendar.google.com/calendar/r/eventedit/${event.googleEventId}`;
    } else {
      // Fallback: pre-fill a new Google Calendar event with event details
      const start = event.date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const endDate = new Date(event.date);
      endDate.setHours(endDate.getHours() + 1);
      const end = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const title = encodeURIComponent(`[RedBoost] ${event.title}`);
      const details = encodeURIComponent(event.description || 'Session RedBoost');
      const location = encodeURIComponent(event.meetLink || event.location || '');
      url = `https://calendar.google.com/calendar/r/eventedit?text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    }
    window.open(url, '_blank');
  }


  openMeetLink(event: CalendarEvent): void {
    if (event.meetLink) {
      window.open(event.meetLink, '_blank');
    }
  }
}