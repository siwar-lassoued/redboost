// add_event_dialog.component.ts
import { ProgrammeService } from '../../../programmes/programme.service';
import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from "@angular/material/radio";
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventService, CreateEventRequest, EventResponse } from '../../event.service';
import { TypeFormationService, TypeFormation } from '../../type-formation.service';

@Component({
  selector: 'app-add-event-dialog',
  templateUrl: './add_event_dialog.html',
  styleUrls: ['./add_event_dialog.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatSnackBarModule
  ],
})
export class AddEventDialogComponent implements OnInit {
  eventForm: FormGroup;
  isLoading = false;
  isEditMode = false;
  eventId?: number;
  
  // Dynamic event types from database
  eventTypes: TypeFormation[] = [];
  showCustomTypeInput = false;

  programs: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddEventDialogComponent>,
    private eventService: EventService,
    private typeFormationService: TypeFormationService,
    private snackBar: MatSnackBar,
    private programmeService: ProgrammeService,
    @Inject(MAT_DIALOG_DATA) public data: { event?: EventResponse }
  ) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      type: ['', Validators.required],
      customType: [''],
      location: [''],
      mode: ['EN_PERSONNE', Validators.required],
      program: ['RedStart'],
      description: [''],
      participants: this.fb.array([this.fb.control('', [Validators.email])])
    });

    // Check if we're in edit mode
    if (data?.event) {
      this.isEditMode = true;
      this.eventId = data.event.id;
    }

    // Add location validator based on mode
    this.eventForm.get('mode')?.valueChanges.subscribe(mode => {
      const locationControl = this.eventForm.get('location');
      if (mode === 'EN_PERSONNE' || mode === 'HYBRID') {
        locationControl?.setValidators([Validators.required]);
      } else {
        locationControl?.clearValidators();
        locationControl?.setValue('En ligne');
      }
      locationControl?.updateValueAndValidity();
    });

    // Watch for "Autre" selection
    this.eventForm.get('type')?.valueChanges.subscribe(value => {
      this.showCustomTypeInput = value === 'AUTRE';
      const customTypeControl = this.eventForm.get('customType');
      
      if (this.showCustomTypeInput) {
        customTypeControl?.setValidators([Validators.required]);
      } else {
        customTypeControl?.clearValidators();
        customTypeControl?.setValue('');
      }
      customTypeControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.loadPrograms();
    this.loadEventTypes();
    
    if (this.isEditMode && this.data.event) {
      this.populateFormWithEvent(this.data.event);
    } else {
      // Add one participant field by default for new events
      this.addParticipant();
    }
  }

  loadPrograms(): void {
    this.programmeService.getAllProgrammesBasic().subscribe(programmes => {
      this.programs = programmes.map(p => p.nom);
    });
  }

  loadEventTypes(): void {
    this.typeFormationService.getAllTypes().subscribe({
      next: (types) => {
        this.eventTypes = types;
        console.log('Event types loaded:', types);
      },
      error: (error) => {
        console.error('Error loading event types:', error);
        this.snackBar.open('Erreur lors du chargement des types d\'événements', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  populateFormWithEvent(event: EventResponse): void {
    // Parse dates
    const startDate = new Date(event.startDateTime);
    const endDate = new Date(event.endDateTime);
    
    // Extract time in HH:mm format
    const startTime = this.formatTimeForInput(startDate);
    const endTime = this.formatTimeForInput(endDate);
    
    // Map backend mode to form value
    const mode = this.mapBackendModeToForm(event.mode);
    
    // Populate form
    this.eventForm.patchValue({
      title: event.title,
      date: startDate,
      startTime: startTime,
      endTime: endTime,
      type: event.type,
      location: event.location,
      mode: mode,
      program: event.program,
      description: event.description
    });
    
    // Populate participants
    event.participantEmails.forEach(email => {
      this.participants.push(this.fb.control(email, [Validators.email]));
    });
  }

  formatTimeForInput(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  mapBackendModeToForm(backendMode: string): string {
    switch (backendMode) {
      case 'EN_PERSONNE': return 'EN_PERSONNE';
      case 'VIRTUEL': return 'VIRTUEL';
      case 'HYBRID': return 'HYBRID';
      default: return 'EN_PERSONNE';
    }
  }

  get participants(): FormArray {
    return this.eventForm.get('participants') as FormArray;
  }

  addParticipant(): void {
    const lastParticipant = this.participants.at(this.participants.length - 1);
    if (!lastParticipant || lastParticipant.value.trim() !== '') {
      if (this.participants.length < 50) {
        this.participants.push(this.fb.control('', [Validators.email]));
      }
    }
  }

  removeParticipant(index: number): void {
    this.participants.removeAt(index);
  }

  onCancel(): void {
    if (!this.isLoading) {
      this.dialogRef.close();
    }
  }

  onSubmit(): void {
    if (this.eventForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      const formValue = this.eventForm.value;
      
      // Handle custom type creation
      if (formValue.type === 'AUTRE' && formValue.customType) {
        this.createCustomTypeAndEvent(formValue);
      } else {
        this.createOrUpdateEvent(formValue);
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.eventForm.controls).forEach(key => {
        this.eventForm.get(key)?.markAsTouched();
      });
      
      this.participants.controls.forEach(control => {
        control.markAsTouched();
      });

      this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private createCustomTypeAndEvent(formValue: any): void {
    // First, create the new type
    this.typeFormationService.createType({ name: formValue.customType }).subscribe({
      next: (newType) => {
        console.log('New type created:', newType);
        
        // Update the eventTypes list
        this.eventTypes.push(newType);
        
        // Update form value to use the new type name
        formValue.type = newType.name;
        
        // Now create the event
        this.createOrUpdateEvent(formValue);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error creating custom type:', error);
        
        let errorMessage = 'Erreur lors de la création du type personnalisé.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private createOrUpdateEvent(formValue: any): void {
    // Parse date and times
    const eventDate = new Date(formValue.date);
    const startDateTime = this.parseDateTime(eventDate, formValue.startTime);
    const endDateTime = this.parseDateTime(eventDate, formValue.endTime);

    // Filter out empty participant emails
    const participantEmails = formValue.participants.filter((email: string) => email && email.trim() !== '');

    // Build request matching backend DTO
    const request: CreateEventRequest = {
      title: formValue.title,
      description: formValue.description || '',
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      type: formValue.type, // Use the type name (either selected or newly created)
      mode: formValue.mode,
      location: formValue.location || 'À définir',
      program: formValue.program,
      participantEmails: participantEmails
    };

    // Call appropriate API based on mode
    const apiCall = this.isEditMode && this.eventId
      ? this.eventService.updateEvent(this.eventId, request)
      : this.eventService.createEvent(request);

    apiCall.subscribe({
      next: (response) => {
        this.isLoading = false;
        
        // Show success message
        let message = this.isEditMode 
          ? '✅ Événement mis à jour avec succès! 📧 Notifications envoyées.'
          : '✅ Événement créé avec succès! 📧 Invitations envoyées.';
        
        if (response.meetLink) {
          message = this.isEditMode
            ? `✅ Événement mis à jour! 🎥 Lien Meet: ${response.meetLink}`
            : `✅ Événement créé! 🎥 Lien Meet: ${response.meetLink}`;
        }
        
        this.snackBar.open(message, 'Fermer', {
          duration: 6000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        // Close dialog and return the event
        this.dialogRef.close(response);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error saving event:', error);
        
        let errorMessage = this.isEditMode
          ? 'Erreur lors de la mise à jour de l\'événement.'
          : 'Erreur lors de la création de l\'événement.';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private parseDateTime(date: Date, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime.toISOString();
  }

  getModeDescription(): string {
    const mode = this.eventForm.get('mode')?.value;
    switch (mode) {
      case 'EN_PERSONNE':
        return '🧑 Les participants assisteront en personne au lieu indiqué.';
      case 'VIRTUEL':
        return '📹 Un lien Google Meet sera automatiquement créé et envoyé aux participants.';
      case 'HYBRID':
        return '👥 Les participants peuvent choisir d\'assister en personne ou via Google Meet.';
      default:
        return '';
    }
  }

  validateTimeRange(): boolean {
    const startTime = this.eventForm.get('startTime')?.value;
    const endTime = this.eventForm.get('endTime')?.value;
    
    if (startTime && endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      return endMinutes > startMinutes;
    }
    
    return true;
  }

  // Getter for dialog title
  get dialogTitle(): string {
    return this.isEditMode ? 'Modifier l\'événement' : 'Nouvel événement';
  }

  get dialogSubtitle(): string {
    return this.isEditMode 
      ? 'Modifiez les informations de l\'événement.'
      : 'Remplissez les informations pour créer un nouvel événement.';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Mettre à jour' : 'Créer l\'événement';
  }

  get loadingText(): string {
    return this.isEditMode ? 'Mise à jour...' : 'Création...';
  }
}