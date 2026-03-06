// src/app/backoffice/programmes/global-dashboard/dialogs/global-sprint-dialog.ts
import {
    Component,
    EventEmitter,
    Input,
    Output,
    OnChanges, // <--- 1. Import OnChanges
    SimpleChanges, // <--- 2. Import SimpleChanges
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Sprint, Programme } from '../../../../../../models/programme';

@Component({
    selector: 'app-global-sprint-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
    ],
    template: `
        <div *ngIf="show" class="modal-overlay" >
            <div class="modal-content" (click)="$event.stopPropagation()">
                <div class="modal-header">
                    <h2>
                        {{
                            sprint?.id ? 'Modifier le sprint' : 'Nouveau sprint'
                        }}
                    </h2>
                    <button class="close-btn" (click)="close.emit()">
                        <mat-icon>close</mat-icon>
                    </button>
                </div>

                <div class="modal-body">
                    <div *ngIf="!sprint?.id" class="form-group">
                        <label class="form-label required">Programme</label>
                        <select
                            [(ngModel)]="formData.programmeId"
                            class="form-input"
                            required
                        >
                            <option [value]="null">
                                Sélectionnez un programme
                            </option>
                            <option
                                *ngFor="let prog of programmes"
                                [value]="prog.id"
                            >
                                {{ prog.nom }}
                            </option>
                        </select>
                        <p class="help-text">
                            Sélectionnez le programme auquel ce sprint sera
                            rattaché
                        </p>
                    </div>

                    <div class="form-group">
                        <label class="form-label required">Nom du sprint</label>
                        <input
                            type="text"
                            [(ngModel)]="formData.nom"
                            class="form-input"
                            placeholder="Ex: Sprint Q1-2025"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea
                            [(ngModel)]="formData.description"
                            class="form-textarea"
                            rows="3"
                            placeholder="Description du sprint..."
                        ></textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label required"
                                >Date de début</label
                            >
                            <input
                                type="date"
                                [(ngModel)]="formData.dateDebut"
                                class="form-input"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label class="form-label required"
                                >Date limite</label
                            >
                            <input
                                type="date"
                                [(ngModel)]="formData.dateLimite"
                                class="form-input"
                                [min]="formData.dateDebut"
                                required
                            />
                        </div>
                    </div>

                    <div *ngIf="validationError()" class="error-message">
                        <mat-icon>error</mat-icon>
                        {{ validationError() }}
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-secondary" (click)="close.emit()">
                        Annuler
                    </button>
                    <button class="btn-primary" (click)="handleSave()">
                        {{ sprint?.id ? 'Modifier' : 'Créer' }}
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 1rem;
            }

            .modal-content {
                background: white;
                border-radius: 12px;
                width: 100%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid #e2e8f0;
            }

            .modal-header h2 {
                font-size: 1.25rem;
                font-weight: 600;
                color: #1e293b;
                margin: 0;
            }

            .close-btn {
                background: none;
                border: none;
                cursor: pointer;
                color: #64748b;
                padding: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                transition: all 0.2s;
            }

            .close-btn:hover {
                background: #f1f5f9;
                color: #334155;
            }

            .modal-body {
                padding: 1.5rem;
            }

            .form-group {
                margin-bottom: 1.25rem;
            }

            .form-label {
                display: block;
                font-size: 0.875rem;
                font-weight: 500;
                color: #475569;
                margin-bottom: 0.5rem;
            }

            .form-label.required::after {
                content: ' *';
                color: #ef4444;
            }

            .form-input,
            .form-textarea {
                width: 100%;
                padding: 0.625rem 0.875rem;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                font-size: 0.875rem;
                transition: all 0.2s;
            }

            .form-input:focus,
            .form-textarea:focus {
                outline: none;
                border-color: #e91e63;
                box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.1);
            }

            .form-textarea {
                resize: vertical;
                font-family: inherit;
            }

            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }

            .help-text {
                font-size: 0.75rem;
                color: #64748b;
                margin-top: 0.25rem;
            }

            .error-message {
                background: #fee2e2;
                border: 1px solid #fecaca;
                color: #991b1b;
                padding: 0.75rem;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
                margin-top: 1rem;
            }

            .error-message mat-icon {
                width: 20px;
                height: 20px;
                font-size: 20px;
            }

            .modal-footer {
                padding: 1rem 1.5rem;
                border-top: 1px solid #e2e8f0;
                display: flex;
                justify-content: flex-end;
                gap: 0.75rem;
            }

            .btn-secondary,
            .btn-primary {
                padding: 0.625rem 1.25rem;
                border-radius: 8px;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
            }

            .btn-secondary {
                background: #f1f5f9;
                color: #475569;
            }

            .btn-secondary:hover {
                background: #e2e8f0;
            }

            .btn-primary {
                background: #e91e63;
                color: white;
            }

            .btn-primary:hover {
                background: #c2185b;
            }
        `,
    ],
})
// 3. Implement OnChanges instead of OnInit
export class GlobalSprintModalComponent implements OnChanges {
    @Input() show = false;
    @Input() sprint: Partial<Sprint> | null = null;
    @Input() programmes: Programme[] = [];
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<{
        sprint: Partial<Sprint>;
        programmeId: number;
    }>();
@Input() error: string | null = null;
validationError = signal<string | null>(null);
    formData: any = {
        programmeId: null,
        nom: '',
        description: '',
        dateDebut: '',
        dateLimite: '',
    };

    // 4. Use ngOnChanges to react when 'show' becomes true or 'sprint' changes
    ngOnChanges(changes: SimpleChanges) {
        if (changes['show'] && this.show) {
            this.resetForm();
        }
        // Also update if sprint data changes while modal is open
        if (changes['sprint'] && this.show) {
            this.resetForm();
        }
        // 2. Watch for changes in the error input
        if (changes['error']) {
            this.validationError.set(this.error);
        }
    }

    resetForm() {
        this.validationError.set(null);
        if (this.sprint) {
            // Editing existing sprint
            this.formData = {
                programmeId: null, // Not needed for updates usually
                nom: this.sprint.nom || '',
                description: this.sprint.description || '',
                dateDebut: this.sprint.dateDebut || '',
                dateLimite:
                    this.sprint.dateLimite || (this.sprint as any).dateFin || '',
            };
        } else {
            // Creating new sprint
            this.formData = {
                programmeId: null,
                nom: '',
                description: '',
                dateDebut: '',
                dateLimite: '',
            };
        }
    }

    handleSave() {
        this.validationError.set(null);

        if (!this.formData.nom?.trim()) {
            this.validationError.set('Le nom est obligatoire');
            return;
        }

        // Only require programme selection for NEW sprints
        if (!this.sprint?.id && !this.formData.programmeId) {
            this.validationError.set('Veuillez sélectionner un programme');
            return;
        }

        if (!this.formData.dateDebut) {
            this.validationError.set('La date de début est obligatoire');
            return;
        }

        if (!this.formData.dateLimite) {
            this.validationError.set('La date limite est obligatoire');
            return;
        }

        if (this.formData.dateDebut > this.formData.dateLimite) {
            this.validationError.set(
                'La date de début doit être antérieure à la date limite',
            );
            return;
        }

        this.save.emit({
            sprint: {
                id: this.sprint?.id,
                nom: this.formData.nom,
                description: this.formData.description,
                dateDebut: this.formData.dateDebut,
                dateLimite: this.formData.dateLimite,
            },
            programmeId: this.formData.programmeId,
        });
    }
}