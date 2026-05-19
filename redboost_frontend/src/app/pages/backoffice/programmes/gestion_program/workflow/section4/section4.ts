import { environment } from '../../../../../../../environment';
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RapportDataService } from '../rapport-data.service';
import { Recommendation } from '../../../../../../models/rapport.model';

// ─── Compare API types ──────────────────────────────────────────────────────

export interface CompareComparison {
    aspect: string;
    recent: string;
    reference: string;
    verdict: string;
}

export interface CompareResponse {
    strengths: string[];
    weaknesses: string[];
    comparisons: CompareComparison[];
    recommendations: string[];
    custom_feedback: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

@Component({
    selector: 'app-rapport-section4',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './section4.html',
    styleUrls: ['../rapport.component.scss'],
})
export class RapportSection4Component implements OnInit, OnChanges {
    @Input() recommendations: Recommendation[] = [];
    @Input() conclusionText: string = '';
    @Input() rapportId?: number;
    @Input() programmeName?: string;
    @Input() programObjectives: string = '';
    @Input() globalImpact: string = '';

    @Output() dataChange = new EventEmitter<{
        recommendations: Recommendation[];
        conclusionText: string;
    }>();

    localRecommendations: Recommendation[] = [];
    localConclusionText: string = '';

    // Unified Export Dialog
    showExportDialog: boolean = false;
    exportMode: 'narrative' | 'periodic' = 'narrative';
    periodicStartDate: string = '';
    periodicEndDate: string = '';
    selectedTemplate: 'standard' | 'expertise' = 'standard';
    selectedFileType: 'pdf' | 'docx' = 'pdf';   // ← NEW

    // Google Drive Share Dialog
    showDriveShareDialog: boolean = false;
    driveShareLink: string = '';
    driveFileId: string = '';
    driveDownloadLink: string = '';
    linkCopied: boolean = false;

    isLoading: boolean = false;
    errorMessage: string = '';

    // ─── Compare Dialog state ───────────────────────────────────────────────
    showCompareDialog: boolean = false;
    recentProgramFile: File | null = null;
    referenceProgramFiles: File[] = [];

    isComparing: boolean = false;
    compareError: string = '';
    compareResult: CompareResponse | null = null;
    showCompareResult: boolean = false;
    activeResultTab: 'strengths' | 'weaknesses' | 'comparisons' | 'recommendations' | 'feedback' = 'strengths';

    private isInitialized = false;
    private readonly aiApiUrl = `${environment.apiUrl}/ai`;

    constructor(
        private rapportDataService: RapportDataService,
        private http: HttpClient
    ) {}

  ngOnInit(): void {
    this.localRecommendations = (this.recommendations?.length > 0)
        ? [{ ...this.recommendations[0] }]
        : [{ id: '1', content: '' }];
    this.localConclusionText = this.conclusionText || '';
    this.isInitialized = true;
}

    ngOnChanges(changes: SimpleChanges): void {
      if (changes['recommendations']) {
      this.localRecommendations = (this.recommendations?.length > 0)
        ? [{ ...this.recommendations[0] }]
        : [{ id: '1', content: '' }];
}
    }

    emitChanges(): void {
        this.dataChange.emit({
            recommendations: this.localRecommendations,
            conclusionText: this.localConclusionText
        });
    }

    // ─── Recommendations ────────────────────────────────────────────────────


    onRecommendationChange(): void {
        this.emitChanges();
    }

    // ─── Export Dialog ──────────────────────────────────────────────────────

    exportToPdf(): void {
        if (!this.rapportId) { alert("Veuillez d'abord enregistrer le rapport"); return; }
        this.exportMode = 'narrative';
        this.periodicStartDate = '';
        this.periodicEndDate = '';
        this.selectedTemplate = 'standard';
        this.selectedFileType = 'pdf';             // ← reset to default
        this.showExportDialog = true;
    }

    openPeriodicReportDialog(): void {
        if (!this.rapportId) { alert("Veuillez d'abord enregistrer le rapport"); return; }
        this.exportMode = 'periodic';
        this.periodicStartDate = '';
        this.periodicEndDate = '';
        this.selectedTemplate = 'standard';
        this.selectedFileType = 'pdf';             // ← reset to default
        this.showExportDialog = true;
    }

    closeExportDialog(): void {
        this.showExportDialog = false;
        this.periodicStartDate = '';
        this.periodicEndDate = '';
        this.errorMessage = '';
    }

    closePeriodicReportDialog(): void { this.closeExportDialog(); }

    selectTemplate(template: 'standard' | 'expertise'): void {
        this.selectedTemplate = template;
    }

    selectFileType(fileType: 'pdf' | 'docx'): void {   // ← NEW
        this.selectedFileType = fileType;
    }

    generateReport(): void {
        if (!this.rapportId) { alert("Veuillez d'abord enregistrer le rapport"); return; }
        if (this.exportMode === 'periodic') {
            if (!this.periodicStartDate || !this.periodicEndDate) { alert('Veuillez sélectionner les dates de début et de fin'); return; }
            if (new Date(this.periodicStartDate) > new Date(this.periodicEndDate)) { alert('La date de début doit être antérieure à la date de fin'); return; }
        }
        this.isLoading = true;
        this.errorMessage = '';

        const startDate = this.exportMode === 'periodic' ? this.periodicStartDate : undefined;
        const endDate   = this.exportMode === 'periodic' ? this.periodicEndDate   : undefined;

        // ─── Route to the correct endpoint based on template + file type ───
        let request$;
        let filenamePrefix: string;

        if (this.selectedFileType === 'docx') {
            if (this.selectedTemplate === 'expertise') {
                request$ = this.rapportDataService.exportExpertiseFranceDocx(this.rapportId, startDate, endDate);
                filenamePrefix = startDate ? 'Rapport_Expertise_France_Periodique_' : 'Rapport_Expertise_France_';
            } else {
                request$ = this.rapportDataService.exportToDocx(this.rapportId, startDate, endDate);
                filenamePrefix = startDate ? 'Rapport_Periodique_' : 'Rapport_Narratif_';
            }
        } else {
            if (this.selectedTemplate === 'expertise') {
                request$ = this.rapportDataService.exportExpertiseFrancePdf(this.rapportId, startDate, endDate);
                filenamePrefix = startDate ? 'Rapport_Expertise_France_Periodique_' : 'Rapport_Expertise_France_';
            } else {
                request$ = this.rapportDataService.exportToPdf(this.rapportId, startDate, endDate);
                filenamePrefix = startDate ? 'Rapport_Periodique_' : 'Rapport_Narratif_';
            }
        }

        const extension = this.selectedFileType === 'docx' ? '.docx' : '.pdf';

        request$.subscribe({
            next: (blob) => {
                const filename = `${filenamePrefix}${this.rapportId}${extension}`;
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => window.URL.revokeObjectURL(url), 100);
                this.isLoading = false;
                this.closeExportDialog();
                // Only trigger Drive share for PDF exports
                if (this.selectedFileType === 'pdf') {
                    this.generateDriveShareLink();
                }
            },
            error: (error) => {
                console.error('Error generating report:', error);
                this.errorMessage = 'Erreur lors de la génération du rapport';
                alert(this.errorMessage);
                this.isLoading = false;
            },
        });
    }

    generatePeriodicReport(): void { this.generateReport(); }

    // ─── Google Drive ────────────────────────────────────────────────────────

    private generateDriveShareLink(): void {
        if (!this.rapportId) return;
        const startDate = this.exportMode === 'periodic' ? this.periodicStartDate : undefined;
        const endDate   = this.exportMode === 'periodic' ? this.periodicEndDate   : undefined;

        this.rapportDataService.shareToDrive(this.rapportId, startDate, endDate, this.selectedTemplate).subscribe({
            next: (result) => {
                this.driveShareLink    = result.viewLink;
                this.driveFileId       = result.fileId;
                this.driveDownloadLink = result.downloadLink;
                this.linkCopied        = false;
                this.showDriveShareDialog = true;
                this.isLoading = false;
            },
            error: (error) => { console.error('Error generating Drive share link:', error); this.isLoading = false; },
        });
    }

    copyDriveLink(): void {
        if (!this.driveShareLink) return;
        navigator.clipboard.writeText(this.driveShareLink).then(
            () => { this.linkCopied = true; setTimeout(() => this.linkCopied = false, 2000); },
            () => this.fallbackCopyLink()
        );
    }

    private fallbackCopyLink(): void {
        const textArea = document.createElement('textarea');
        textArea.value = this.driveShareLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try { document.execCommand('copy'); this.linkCopied = true; setTimeout(() => this.linkCopied = false, 2000); }
        catch (err) { console.error('Fallback copy failed:', err); }
        document.body.removeChild(textArea);
    }

    closeDriveShareDialog(): void {
        this.showDriveShareDialog = false;
        this.driveShareLink = '';
        this.driveFileId = '';
        this.driveDownloadLink = '';
        this.linkCopied = false;
    }

    openDriveLink(): void {
        if (this.driveShareLink) window.open(this.driveShareLink, '_blank');
    }

    // ─── Compare Dialog ──────────────────────────────────────────────────────

    openCompareDialog(): void {
        this.showCompareDialog = true;
        this.recentProgramFile = null;
        this.referenceProgramFiles = [];

        this.compareResult = null;
        this.showCompareResult = false;
    }

    closeCompareDialog(): void {
        this.showCompareDialog = false;
        this.compareError = '';
        this.isComparing = false;
    }

    onRecentFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.recentProgramFile = input.files[0];
        }
    }

    onReferenceFilesChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.referenceProgramFiles = Array.from(input.files);
        }
    }

    removeRecentFile(): void {
        this.recentProgramFile = null;
    }

    removeReferenceFile(index: number): void {
        this.referenceProgramFiles.splice(index, 1);
    }

    get canCompare(): boolean {
        return !!this.recentProgramFile && this.referenceProgramFiles.length > 0 && !this.isComparing;
    }

    submitCompare(): void {
        if (!this.canCompare) return;

        this.isComparing = true;
        this.compareError = '';

        const formData = new FormData();
        formData.append('recent_program', this.recentProgramFile!);
        this.referenceProgramFiles.forEach(f => formData.append('reference_programs', f));
        formData.append('model', 'mistral');

        this.http.post<CompareResponse>(`${this.aiApiUrl}/compare`, formData).subscribe({
            next: (result) => {
                this.compareResult = result;
                this.showCompareResult = true;
                this.activeResultTab = 'strengths';
                this.isComparing = false;
            },
            error: (err) => {
                console.error('Compare error:', err);
                this.compareError = 'Une erreur est survenue lors de la comparaison. Veuillez réessayer.';
                this.isComparing = false;
            }
        });
    }

    setActiveResultTab(tab: typeof this.activeResultTab): void {
        this.activeResultTab = tab;
    }

    getVerdictClass(verdict: string): string {
        const v = verdict.toLowerCase();
        if (v.includes('plus fort') || v.includes('meilleur') || v.includes('supérieur')) return 'verdict-positive';
        if (v.includes('plus faible') || v.includes('inférieur') || v.includes('moins')) return 'verdict-negative';
        return 'verdict-neutral';
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    // ─── Misc ────────────────────────────────────────────────────────────────

    lockWorkflow(): void { alert('Verrouillage du workflow à venir!'); }

    finishReport(): void { this.emitChanges(); }
}