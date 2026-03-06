// create-template-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormArray,
    Validators,
    ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TemplateService } from '../../template.service';
import {
    ColumnType,
    CreateTemplateRequest,
    TemplateResponse,
} from '../../../../../models/template.models';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-create-template-dialog',
    templateUrl: './create_template_dialog.html',
    styleUrls: ['./create_template_dialog.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule,
        DragDropModule,
    ],
})
export class CreateTemplateDialogComponent implements OnInit {
    templateForm: FormGroup;
    isEditMode: boolean = false;
    loading: boolean = false;
    originalTemplate?: TemplateResponse;

    columnTypes = [
        { value: ColumnType.TEXT, label: 'Texte' },
        { value: ColumnType.NUMBER, label: 'Nombre' },
        { value: ColumnType.DATE, label: 'Date' },
        { value: ColumnType.EMAIL, label: 'Email' },
        { value: ColumnType.PHONE, label: 'Téléphone' },
        { value: ColumnType.SELECT, label: 'Liste de choix' },
        { value: ColumnType.BOOLEAN, label: 'Oui/Non' },
    ];

    constructor(
        private fb: FormBuilder,
        private templateService: TemplateService,
        public dialogRef: MatDialogRef<CreateTemplateDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { template?: TemplateResponse },
    ) {
        this.templateForm = this.createForm();
    }

    ngOnInit(): void {
        if (this.data?.template) {
            this.isEditMode = true;
            this.originalTemplate = this.data.template;
            this.loadTemplateData(this.data.template);
        } else {
            // Add one empty column by default
            this.addColumn();
        }
    }

    createForm(): FormGroup {
        return this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(255)]],
            description: ['', Validators.maxLength(500)],
            type: ['', Validators.maxLength(100)],
            columns: this.fb.array([]),
        });
    }

    loadTemplateData(template: TemplateResponse): void {
        this.templateForm.patchValue({
            name: template.name,
            description: template.description,
            type: template.type,
        });

        // Clear existing columns
        this.columns.clear();

        // Add columns from template (sorted by displayOrder)
        if (template.columns && template.columns.length > 0) {
            const sortedColumns = [...template.columns].sort(
                (a, b) => a.displayOrder - b.displayOrder
            );
            sortedColumns.forEach((column) => {
                this.columns.push(this.createColumnGroup(column));
            });
        }
    }

    get columns(): FormArray {
        return this.templateForm.get('columns') as FormArray;
    }

    createColumnGroup(data?: any): FormGroup {
        return this.fb.group({
            id: [data?.id || null], // Include ID for existing columns
            columnName: [
                data?.columnName || '',
                [Validators.required, Validators.maxLength(255)],
            ],
            columnType: [
                data?.columnType || ColumnType.TEXT,
                Validators.required,
            ],
            isRequired: [data?.isRequired || false],
            isUnique: [data?.isUnique || false],
            displayOrder: [data?.displayOrder ?? this.columns.length],
            options: [data?.options || []],
        });
    }

    addColumn(): void {
        const newColumn = this.createColumnGroup();
        newColumn.patchValue({ displayOrder: this.columns.length });
        this.columns.push(newColumn);
    }

    removeColumn(index: number): void {
        if (this.columns.length > 0) {
            this.columns.removeAt(index);
            // Update display orders after removal
            this.updateDisplayOrders();
        }
    }

    /**
     * Handle column reordering via drag and drop
     */
    onDropColumn(event: CdkDragDrop<any>): void {
        if (event.previousIndex !== event.currentIndex) {
            // Get the current form array
            const items = this.columns.controls;
            
            // Reorder the array
            moveItemInArray(items, event.previousIndex, event.currentIndex);
            
            // Update display orders
            this.updateDisplayOrders();
        }
    }

    updateDisplayOrders(): void {
        this.columns.controls.forEach((control, index) => {
            control.patchValue({ displayOrder: index }, { emitEvent: false });
        });
    }

    getColumnTypeName(type: ColumnType): string {
        const found = this.columnTypes.find((ct) => ct.value === type);
        return found ? found.label : type;
    }

    onSubmit(): void {
        if (this.templateForm.invalid) {
            this.templateForm.markAllAsTouched();
            return;
        }

        // Update display orders before submitting
        this.updateDisplayOrders();

        this.loading = true;
        const formValue = this.templateForm.value;
        
        // Build the request with proper column structure
        const request: CreateTemplateRequest = {
            name: formValue.name,
            description: formValue.description,
            type: formValue.type,
            columns: formValue.columns.map((col: any, index: number) => ({
                ...(col.id && { id: col.id }), // Include ID only if it exists
                columnName: col.columnName,
                columnType: col.columnType,
                isRequired: col.isRequired || false,
                isUnique: col.isUnique || false,
                displayOrder: index,
                options: col.options || []
            }))
        };

        const operation = this.isEditMode
            ? this.templateService.updateTemplate(
                  this.originalTemplate!.id,
                  request,
              )
            : this.templateService.createTemplate(request);

        operation.subscribe({
            next: (response) => {
                this.loading = false;
                this.dialogRef.close(response);
            },
            error: (error) => {
                console.error('Error saving template:', error);
                this.loading = false;

                // Show detailed error message
                let errorMessage = 'Une erreur est survenue lors de la sauvegarde du template';
                
                if (error.error?.message) {
                    errorMessage = error.error.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                alert(errorMessage);
            },
        });
    }

    onCancel(): void {
        if (this.templateForm.dirty) {
            if (confirm('Voulez-vous vraiment annuler ? Les modifications seront perdues.')) {
                this.dialogRef.close();
            }
        } else {
            this.dialogRef.close();
        }
    }

    // Validation helpers
    isFieldInvalid(fieldName: string): boolean {
        const field = this.templateForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    isColumnFieldInvalid(index: number, fieldName: string): boolean {
        const field = this.columns.at(index).get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    getErrorMessage(fieldName: string): string {
        const field = this.templateForm.get(fieldName);
        if (field?.hasError('required')) {
            return 'Ce champ est obligatoire';
        }
        if (field?.hasError('maxlength')) {
            return 'Longueur maximale dépassée';
        }
        return '';
    }

    getColumnErrorMessage(index: number, fieldName: string): string {
        const field = this.columns.at(index).get(fieldName);
        if (field?.hasError('required')) {
            return 'Ce champ est obligatoire';
        }
        if (field?.hasError('maxlength')) {
            return 'Longueur maximale dépassée';
        }
        return '';
    }
}