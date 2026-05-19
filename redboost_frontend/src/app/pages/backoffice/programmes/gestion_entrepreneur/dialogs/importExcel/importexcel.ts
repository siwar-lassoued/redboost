import { environment } from '../../../../../../../environment';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-excel-import-modal',
  templateUrl: './importexcel.html',
  standalone: true,
  imports: [CommonModule],
  styles: [/* ... */]
})
export class ExcelImportModalComponent {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() importSuccess = new EventEmitter<any>();

  selectedFile: File | null = null;
  isDragOver = false;
  isImporting = false;
  importResult: any = null;
  isDownloadingTemplate = false;

  constructor(private http: HttpClient) {}

  close() {
    this.reset();
    this.isOpenChange.emit(false);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file && this.isValidExcelFile(file)) {
      this.selectedFile = file;
    } else {
      alert('Veuillez sélectionner un fichier Excel valide (.xlsx ou .xls)');
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (this.isValidExcelFile(file)) {
        this.selectedFile = file;
      } else {
        alert('Veuillez sélectionner un fichier Excel valide (.xlsx ou .xls)');
      }
    }
  }

  isValidExcelFile(file: File): boolean {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    return (
      validTypes.includes(file.type) ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    );
  }

  clearFile() {
    this.selectedFile = null;
    this.importResult = null;
  }

  async downloadTemplate() {
    this.isDownloadingTemplate = true;
    
    try {
      /* const token = localStorage.getItem('access_token'); // Adjust based on your auth implementation
      
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      }); */

      const response = await this.http
        .get(`${environment.apiUrl}/users/entrepreneurs/template`, {
/*           headers,
 */          responseType: 'blob',
          observe: 'response'
        })
        .toPromise();

      if (response && response.body) {
        // Create a blob URL and trigger download
        const blob = new Blob([response.body], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'entrepreneurs_import_template.xlsx';
        link.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      console.error('Error downloading template:', error);
      
      let errorMessage = 'Erreur lors du téléchargement du modèle';
      
      if (error.status === 401) {
        errorMessage = 'Non autorisé - veuillez vous reconnecter';
      } else if (error.status === 403) {
        errorMessage = 'Accès refusé - droits insuffisants';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur lors de la génération du modèle';
      }
      
      alert(errorMessage);
    } finally {
      this.isDownloadingTemplate = false;
    }
  }

  async importFile() {
    if (!this.selectedFile) return;

    this.isImporting = true;
    this.importResult = null;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    try {
      const response: any = await this.http
        .post(`${environment.apiUrl}/users/import-entrepreneurs`, formData, {
          observe: 'response'
        })
        .pipe(
          catchError((error) => {
            console.error('Import error:', error);
            
            let errorMessage = "Une erreur est survenue pendant l'importation";
            
            if (error.status === 0) {
              errorMessage = "Impossible de se connecter au serveur";
            } else if (error.status === 401) {
              errorMessage = "Non autorisé - veuillez vous reconnecter";
            } else if (error.status === 403) {
              errorMessage = "Accès refusé - droits insuffisants";
            } else if (error.status === 404) {
              errorMessage = "Endpoint non trouvé - vérifiez l'URL de l'API";
            } else if (error.status === 413) {
              errorMessage = "Fichier trop volumineux";
            } else if (error.status === 415) {
              errorMessage = "Type de fichier non supporté";
            } else if (error.status === 500) {
              errorMessage = "Erreur serveur interne";
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            }

            this.importResult = {
              successCount: 0,
              errors: [errorMessage]
            };

            return throwError(() => error);
          })
        )
        .toPromise();

      if (response && response.body) {
        this.importResult = response.body;
        
        if (this.importResult?.successCount > 0) {
          this.importSuccess.emit(this.importResult);
        }
      }
    } catch (error: any) {
      console.error('Caught error:', error);
    } finally {
      this.isImporting = false;
    }
  }

  resetAndRetry() {
    this.importResult = null;
    this.selectedFile = null;
  }

  reset() {
    this.selectedFile = null;
    this.importResult = null;
    this.isImporting = false;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}