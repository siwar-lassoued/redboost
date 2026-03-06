// event_calendar.component.ts
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddEventDialogComponent } from '../dialogs/add_event_dialog/add_event_dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventService, EventResponse } from '../event.service';
import { TypeFormationService, TypeFormation } from '../type-formation.service';
import { MatTooltip } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';

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
    MatTooltip,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
})
export class CalendarComponent implements OnInit {
  currentMonth: Date = new Date();
  calendarDays: any[] = [];
  weekDays = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
  
  events: CalendarEvent[] = [];
  isLoading = false;
  totalEventsCount = 0;
  
  // Selected date and its events
  selectedDate: Date | null = null;
  selectedDateEvents: CalendarEvent[] = [];

  // Dynamic event types from database with assigned colors
  eventTypes: EventTypeWithColor[] = [];
  
  // Predefined colors for automatic assignment
  private colorPalette = [
    '#EF4444', // Red
    '#3B82A6', // Blue
    '#7C3339', // Burgundy
    '#475569', // Slate
    '#A855F7', // Purple
    '#F97316', // Orange
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F43F5E', // Rose
  ];

  // Icon mapping for event types
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
    'réunion': 'group',
    'meeting': 'group',
  };

  constructor(
    private dialog: MatDialog,
    private eventService: EventService,
    private typeFormationService: TypeFormationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadEventTypesAndEvents();
  }

  loadEventTypesAndEvents(): void {
    this.isLoading = true;
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth() + 1;

    // Load both event types and events in parallel
    forkJoin({
      types: this.typeFormationService.getAllTypes(),
      events: this.eventService.getEventsByMonth(year, month)
    }).subscribe({
      next: (response) => {
        // Map types from database to event types with colors
        this.eventTypes = this.mapTypesToEventTypes(response.types);
        
        // Map events
        this.events = this.mapResponseToCalendarEvents(response.events);
        this.totalEventsCount = this.events.length;
        this.generateCalendar();
        this.isLoading = false;
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

  mapTypesToEventTypes(types: TypeFormation[]): EventTypeWithColor[] {
    return types.map((type, index) => ({
      name: type.name,
      color: this.colorPalette[index % this.colorPalette.length],
      icon: this.getIconForType(type.name)
    }));
  }

  getIconForType(typeName: string): string {
    const lowerName = typeName.toLowerCase();
    
    // Check for exact or partial matches in icon mapping
    for (const [key, icon] of Object.entries(this.iconMapping)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    
    // Default icon
    return 'event';
  }

  loadEvents(): void {
    this.isLoading = true;
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth() + 1;

    this.eventService.getEventsByMonth(year, month).subscribe({
      next: (response) => {
        this.events = this.mapResponseToCalendarEvents(response);
        this.totalEventsCount = this.events.length;
        this.generateCalendar();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.snackBar.open('Erreur lors du chargement des événements', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
        this.generateCalendar();
      }
    });
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
    
    while (this.calendarDays.length < 35) {
      const dayEvents = this.events.filter(event => 
        event.date.getDate() === currentDate.getDate() &&
        event.date.getMonth() === currentDate.getMonth() &&
        event.date.getFullYear() === currentDate.getFullYear()
      );
      
      this.calendarDays.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
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
      this.selectedDate = day.date;
      this.selectedDateEvents = day.events;
    }
  }

  getSelectedDateFormatted(): string {
    if (!this.selectedDate) return '';
    return this.selectedDate.toLocaleDateString('fr-FR', { 
      day: 'numeric',
      month: 'long'
    });
  }

  getEventTypeIcon(typeName: string): string {
    const eventType = this.eventTypes.find(t => t.name === typeName);
    return eventType ? eventType.icon : 'event';
  }

  getModeIcon(mode: string): string {
    switch (mode) {
      case 'en-personne': return 'group';
      case 'virtuel': return 'videocam';
      case 'hybrid': return 'people_outline';
      default: return 'event';
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
          
          this.snackBar.open('✅ Événement mis à jour avec succès!', 'Fermer', {
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
    
    // Parse start time
    const [startHour, startMin] = startTime.split(':').map(Number);
    startDate.setHours(startHour, startMin, 0, 0);
    
    // Parse end time
    const [endHour, endMin] = endTime.split(':').map(Number);
    endDate.setHours(endHour, endMin, 0, 0);
    
    // Map mode back to backend mode
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
      data: {} // Empty data for create mode
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Reload both types and events in case a new type was created
        this.loadEventTypesAndEvents();
        
        let message = '✅ Événement créé avec succès! Les invitations ont été envoyées.';
        if (result.meetLink) {
          message += ` 🎥 Lien Meet disponible.`;
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
    return eventType ? eventType.color : '#6B7280';
  }

  getUpcomingEventsCount(): number {
    const now = new Date();
    return this.events.filter(event => event.date >= now).length;
  }



// Helper method to check if a date is today
isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

// Helper method to check if a date is selected
isSelectedDate(date: Date): boolean {
  if (!this.selectedDate) return false;
  return date.getDate() === this.selectedDate.getDate() &&
    date.getMonth() === this.selectedDate.getMonth() &&
    date.getFullYear() === this.selectedDate.getFullYear();
}

// Get gradient for event type
getEventGradient(typeName: string): string {
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
  };

  const lowerType = typeName.toLowerCase();
  for (const [key, gradient] of Object.entries(gradients)) {
    if (lowerType.includes(key)) {
      return gradient;
    }
  }

  // Default gradient based on color from eventTypes
  const eventType = this.eventTypes.find(t => t.name === typeName);
  if (eventType) {
    return `linear-gradient(135deg, ${eventType.color} 0%, ${this.darkenColor(eventType.color, 20)} 100%)`;
  }

  return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
}

// Helper to darken a color
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

// Get upcoming events (sorted)
getUpcomingEvents(): CalendarEvent[] {
  const now = new Date();
  return this.events
    .filter(event => event.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);
}

// Format event date for display
formatEventDate(date: Date): string {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

// Select event date (from sidebar)
selectEventDate(date: Date): void {
  this.selectedDate = date;
  this.selectedDateEvents = this.events.filter(event => 
    event.date.getDate() === date.getDate() &&
    event.date.getMonth() === date.getMonth() &&
    event.date.getFullYear() === date.getFullYear()
  );
}

// Delete event with confirmation
deleteEvent(event: CalendarEvent): void {
  if (confirm(`Êtes-vous sûr de vouloir supprimer "${event.title}" ?`)) {
    this.eventService.cancelEvent(parseInt(event.id)).subscribe({
      next: () => {
        this.snackBar.open('✅ Événement supprimé avec succès!', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        // Remove the event from selectedDateEvents immediately
        if (this.selectedDate) {
          this.selectedDateEvents = this.selectedDateEvents.filter(e => e.id !== event.id);
        }
        
        // Then reload all events
        this.loadEvents();
      },
      error: (error) => {
        console.error('Error deleting event:', error);
        this.snackBar.open('❌ Erreur lors de la suppression', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
}