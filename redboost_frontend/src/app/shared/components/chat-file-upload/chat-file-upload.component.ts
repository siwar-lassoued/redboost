import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-chat-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Attach button -->
    <label class="attach-btn" title="Joindre un fichier">
      <i class="pi pi-paperclip"></i>
      <input type="file" hidden (change)="onFileSelected($event)" [accept]="acceptTypes">
    </label>

    <!-- Upload progress bar -->
    <div class="upload-progress" *ngIf="uploading">
      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="uploadProgress"></div>
      </div>
      <span class="progress-label">{{ uploadProgress }}%</span>
      <button class="cancel-btn" (click)="cancelUpload()">✕</button>
    </div>
  `,
  styleUrl: './chat-file-upload.component.scss'
})
export class ChatFileUploadComponent {

  @Input() senderId!: string;
  @Input() recipientId!: string;
  @Input() programmeId?: number;
  @Output() fileSent = new EventEmitter<any>();
  @Output() uploadError = new EventEmitter<string>();

  uploading = false;
  uploadProgress = 0;
  acceptTypes = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt';

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.uploadFile(input.files[0]);
    input.value = ''; // Reset input so same file can be selected again
  }

  private uploadFile(file: File): void {
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      this.uploadError.emit('Fichier trop volumineux (max 20 MB)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('senderId', this.senderId);
    formData.append('recipientId', this.recipientId);
    if (this.programmeId) {
      formData.append('programmeId', this.programmeId.toString());
    }

    this.uploading = true;
    this.uploadProgress = 0;

    this.http.post(
      `${environment.apiUrl}/messages/files/upload`,
      formData,
      { reportProgress: true, observe: 'events' }
    ).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.uploading = false;
          this.fileSent.emit(event.body);
        }
      },
      error: (err) => {
        this.uploading = false;
        this.uploadError.emit(err.error?.error || 'Échec de l\'envoi du fichier');
      }
    });
  }

  cancelUpload(): void {
    this.uploading = false;
    this.uploadProgress = 0;
  }
}
