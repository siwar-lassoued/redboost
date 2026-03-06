// src/app/pages/backoffice/programmes/Gestion_sprint/dialogs/activity-document-upload-dialog.component.ts

import { Component, EventEmitter, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-activity-document-upload-dialog',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule],
    template: `
        <div *ngIf="show()" class="modal-overlay" (click)="onClose()">
            <div class="modal-box" (click)="$event.stopPropagation()">
                <!-- Header -->
                <div class="modal-header">
                    <h2 class="modal-title">
                        Ajouter des documents à l'activité
                    </h2>
                    <p class="text-sm text-slate-500 mt-1">
                        Formats acceptés : PDF, Word, Excel, Images (JPEG, PNG,
                        GIF)<br />
                        Taille maximale : 10 MB par fichier
                    </p>
                </div>

                <!-- Body -->
                <div class="modal-body">
                    <!-- Drop Zone -->
                    <div
                        class="upload-drop-zone"
                        [class.drag-over]="isDragging()"
                        (dragover)="onDragOver($event)"
                        (dragleave)="onDragLeave($event)"
                        (drop)="onDrop($event)"
                        (click)="fileInput.click()"
                    >
                        <mat-icon class="upload-icon">cloud_upload</mat-icon>
                        <p class="upload-text">
                            Glissez-déposez vos fichiers ici
                        </p>
                        <p class="upload-subtext">ou</p>
                        <button type="button" class="browse-btn">
                            Parcourir les fichiers
                        </button>

                        <input
                            #fileInput
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                            (change)="onFileSelect($event)"
                            style="display: none;"
                        />
                    </div>

                    <!-- Selected Files List -->
                    <div
                        *ngIf="selectedFiles().length > 0"
                        class="selected-files-list"
                    >
                        <div class="files-header">
                            <span class="font-semibold text-sm text-slate-700">
                                {{ selectedFiles().length }} fichier(s)
                                sélectionné(s)
                            </span>
                            <button
                                type="button"
                                class="text-xs text-red-600 hover:text-red-700"
                                (click)="clearFiles()"
                            >
                                Tout supprimer
                            </button>
                        </div>

                        <div
                            *ngFor="let file of selectedFiles(); let i = index"
                            class="file-item"
                        >
                            <div class="file-info">
                                <mat-icon class="file-icon">{{
                                    getFileIcon(file.type)
                                }}</mat-icon>
                                <div class="file-details">
                                    <span class="file-name">{{
                                        file.name
                                    }}</span>
                                    <span class="file-size">{{
                                        formatFileSize(file.size)
                                    }}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                class="remove-file-btn"
                                (click)="removeFile(i)"
                            >
                                <mat-icon class="text-base">close</mat-icon>
                            </button>
                        </div>
                    </div>

                    <!-- Upload Error -->
                    <div *ngIf="uploadError()" class="error-message">
                        <mat-icon class="text-red-600">error</mat-icon>
                        <span>{{ uploadError() }}</span>
                    </div>
                </div>

                <!-- Footer -->
                <div class="modal-footer">
                    <button
                        type="button"
                        class="btn-cancel"
                        (click)="onClose()"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        class="btn-submit activity"
                        [disabled]="selectedFiles().length === 0 || uploading()"
                        (click)="onUpload()"
                    >
                        <mat-icon
                            *ngIf="uploading()"
                            class="animate-spin text-base mr-2"
                            >refresh</mat-icon
                        >
                        {{ uploading() ? 'Upload en cours...' : 'Télécharger' }}
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .modal-overlay {
                @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4;
            }

            .modal-box {
                @apply bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-xl animate-[fadeIn_0.2s_ease-out];
            }

            .modal-header {
                @apply p-6 pb-4 border-b border-slate-100;
            }

            .modal-title {
                @apply text-xl font-bold text-slate-900;
            }

            .modal-body {
                @apply p-6 max-h-[60vh] overflow-y-auto;
            }

            .modal-footer {
                @apply p-6 pt-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3;
            }

            .upload-drop-zone {
                @apply border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer transition-all;
                @apply hover:border-[#0F766E] hover:bg-teal-50/30;
            }

            .upload-drop-zone.drag-over {
                @apply border-[#0F766E] bg-teal-50/50;
            }

            .upload-icon {
                @apply text-6xl text-slate-400 mb-4;
                width: 64px !important;
                height: 64px !important;
                font-size: 64px !important;
            }

            .upload-text {
                @apply text-lg font-medium text-slate-700 mb-1;
            }

            .upload-subtext {
                @apply text-sm text-slate-500 mb-3;
            }

            .browse-btn {
                @apply px-4 py-2 bg-[#0F766E] text-white rounded-md font-medium hover:bg-[#0D5B54] transition-colors;
            }

            .selected-files-list {
                @apply mt-4 space-y-2;
            }

            .files-header {
                @apply flex justify-between items-center mb-2 pb-2 border-b border-slate-200;
            }

            .file-item {
                @apply flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200;
            }

            .file-info {
                @apply flex items-center gap-3 flex-1 min-w-0;
            }

            .file-icon {
                @apply text-slate-500 flex-shrink-0;
            }

            .file-details {
                @apply flex flex-col min-w-0;
            }

            .file-name {
                @apply text-sm font-medium text-slate-900 truncate;
            }

            .file-size {
                @apply text-xs text-slate-500;
            }

            .remove-file-btn {
                @apply w-6 h-6 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors flex-shrink-0;
            }

            .error-message {
                @apply mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700;
            }

            .btn-cancel {
                @apply px-4 py-2 bg-white border border-slate-200 rounded-md text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors;
            }

            .btn-submit {
                @apply px-4 py-2 rounded-md font-medium text-sm shadow-sm text-white transition-all active:translate-y-[1px] flex items-center;

                &.activity {
                    @apply bg-[#0F766E] hover:bg-[#0D5B54] border-b-2 border-[#0A443F] active:border-b-0;
                }

                &:disabled {
                    @apply opacity-50 cursor-not-allowed;
                }
            }

            .animate-spin {
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                from {
                    transform: rotate(0deg);
                }
                to {
                    transform: rotate(360deg);
                }
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `,
    ],
})
export class ActivityDocumentUploadDialogComponent {
    // Inputs
    show = input.required<boolean>();

    // Outputs
    close = output<void>();
    upload = output<File[]>();

    selectedFiles = signal<File[]>([]);
    isDragging = signal(false);
    uploading = signal(false);
    uploadError = signal<string | null>(null);

    onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.addFiles(Array.from(input.files));
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(true);
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(false);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(false);

        if (event.dataTransfer?.files) {
            this.addFiles(Array.from(event.dataTransfer.files));
        }
    }

    addFiles(files: File[]) {
        this.uploadError.set(null);

        // Validate files
        const validFiles = files.filter((file) => {
            const maxSize = 10 * 1024 * 1024; // 10 MB
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'image/jpeg',
                'image/png',
                'image/gif',
            ];

            if (file.size > maxSize) {
                this.uploadError.set(
                    `${file.name} est trop volumineux (max 10 MB)`,
                );
                return false;
            }

            if (!allowedTypes.includes(file.type)) {
                this.uploadError.set(
                    `${file.name} : type de fichier non autorisé`,
                );
                return false;
            }

            return true;
        });

        this.selectedFiles.update((existing) => [...existing, ...validFiles]);
    }

    removeFile(index: number) {
        this.selectedFiles.update((files) =>
            files.filter((_, i) => i !== index),
        );
    }

    clearFiles() {
        this.selectedFiles.set([]);
        this.uploadError.set(null);
    }

    onUpload() {
        if (this.selectedFiles().length > 0) {
            this.uploading.set(true);
            this.upload.emit(this.selectedFiles());
        }
    }

    onClose() {
        this.clearFiles();
        this.uploading.set(false);
        this.uploadError.set(null);
        this.close.emit();
    }

    getFileIcon(type: string): string {
        if (type.includes('pdf')) return 'picture_as_pdf';
        if (type.includes('word')) return 'description';
        if (type.includes('excel') || type.includes('spreadsheet'))
            return 'table_chart';
        if (type.includes('image')) return 'image';
        return 'insert_drive_file';
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
        );
    }
}
