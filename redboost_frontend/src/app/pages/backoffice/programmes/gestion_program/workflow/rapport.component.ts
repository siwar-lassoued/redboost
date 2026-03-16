import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RapportDataService } from './rapport-data.service';
import { RapportDTO, GlobalObjective, Recommendation } from '../../../../../models/rapport.model';
import { RapportSection1Component } from './section1/section1';
import { RapportSection2Component } from './section2/section2';
import { RapportSection3Component } from './section3/section3';
import { RapportSection4Component } from './section4/section4';
import { RapportSection5Component } from './section5/section5';

@Component({
    selector: 'app-rapport-redaction',
    standalone: true,
    imports: [
        CommonModule,
        RapportSection1Component,
        RapportSection2Component,
        RapportSection3Component,
        RapportSection4Component,
        RapportSection5Component
    ],
    templateUrl: './rapport.component.html',
    styleUrls: ['./rapport.component.scss'],
})
export class RapportRedactionComponent implements OnInit {
    @Input() programmeId?: number;

    // Navigation
    currentSection: number = 1;
    totalSections: number = 5;

    // State
    rapportId?: number;
    programmeName?: string;
    isEditMode: boolean = false;
    isLoading: boolean = false;
    errorMessage: string = '';

    // Section 1 Data
    programObjectives: string = '';
    keyResults: string = '';
    globalImpact: string = '';

    // Section 2 Data
    globalObjectives: GlobalObjective[] = [];

    // Section 3 Data
    selectedSprintIds: number[] = [];

    // Section 4 Data
    recommendations: Recommendation[] = [{ id: '1', content: '' }];
    conclusionText: string = '';

    constructor(
        private rapportDataService: RapportDataService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit(): void {
        if (this.programmeId) {
            this.initializeWithProgrammeId(this.programmeId);
            return;
        }

        this.route.params.subscribe((params) => {
            const programmeIdFromRoute = params['programmeId'];
            const rapportId = params['rapportId'];

            if (programmeIdFromRoute) {
                this.programmeId = +programmeIdFromRoute;
            }

            if (rapportId) {
                this.rapportId = +rapportId;
                this.isEditMode = true;
                this.loadRapport(this.rapportId);
            } else if (this.programmeId) {
                this.initializeWithProgrammeId(this.programmeId);
            }
        });
    }

    private initializeWithProgrammeId(programmeId: number): void {
        this.isLoading = true;
        
        // Load rapport
        this.rapportDataService.loadRapportByProgramme(programmeId).subscribe({
            next: (rapport) => {
                this.isEditMode = true;
                this.rapportId = rapport.id;
                this.populateForm(rapport);
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
            },
        });

        // Load supporting data
        this.rapportDataService.loadKpis(programmeId).subscribe();
        this.rapportDataService.loadSprints(programmeId).subscribe();
        this.rapportDataService.loadDocuments(programmeId).subscribe();
    }

    private loadRapport(id: number): void {
        this.isLoading = true;
        this.rapportDataService.loadRapport(id).subscribe({
            next: (rapport) => {
                this.populateForm(rapport);
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading rapport:', error);
                this.errorMessage = 'Erreur lors du chargement du rapport';
                this.isLoading = false;
            },
        });
    }

    private populateForm(rapport: RapportDTO): void {
        if (rapport.programmeId) {
            this.programmeId = rapport.programmeId;
            this.rapportDataService.loadKpis(rapport.programmeId).subscribe();
            this.rapportDataService.loadSprints(rapport.programmeId).subscribe();
            this.rapportDataService.loadDocuments(rapport.programmeId).subscribe();
        }
        
        this.programmeName = rapport.programmeName;
        this.programObjectives = rapport.objectifsProgramme || '';
        this.keyResults = rapport.resultatsCles || '';
        this.globalImpact = rapport.impactGlobal || '';
        this.globalObjectives = rapport.objectifsGlobaux || [];
        this.selectedSprintIds = rapport.sprintIds || [];
        this.conclusionText = rapport.conclusionRecommandations || '';

        if (rapport.conclusionRecommandations) {
            this.parseRecommendations(rapport.conclusionRecommandations);
        }
    }

    private parseRecommendations(text: string): void {
        const parts = text.split(/\d+\.\s+/).filter((p) => p.trim());
        if (parts.length > 0) {
            this.recommendations = parts.map((content, index) => ({
                id: (index + 1).toString(),
                content: content.trim(),
            }));
        }
    }

    private buildRecommendationsText(): string {
        return this.recommendations
            .map((rec, index) => `${index + 1}. ${rec.content}`)
            .join('\n\n');
    }

    saveRapport(): void {
        if (!this.programmeId) {
            this.errorMessage = 'Programme ID manquant';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const rapportData: RapportDTO = {
            programmeId: this.programmeId,
            objectifsProgramme: this.programObjectives,
            resultatsCles: this.keyResults,
            impactGlobal: this.globalImpact,
            objectifsGlobaux: this.cleanObjectivesForSave(this.globalObjectives),
            sprintIds: this.selectedSprintIds,
            conclusionRecommandations: this.buildRecommendationsText(),
        };

        this.rapportDataService.saveRapport(rapportData, this.rapportId).subscribe({
            next: (response) => {
                this.rapportId = response.id;
                this.isEditMode = true;
                this.populateForm(response);
                this.isLoading = false;
                alert('Rapport enregistré avec succès!');
            },
            error: (error) => {
                console.error('Error saving rapport:', error);
                this.errorMessage = error.error?.message || "Erreur lors de l'enregistrement du rapport";
                this.isLoading = false;
            },
        });
    }

 private cleanObjectivesForSave(objectives: GlobalObjective[]): GlobalObjective[] {
    return objectives.map((og) => {
        const globalObj: any = {
            nom: og.nom,
            description: og.description,
            // ✅ resultatsTransversaux now lives at global objective level
            resultatsTransversaux: (og.resultatsTransversaux || []).map((r) => ({
                ...(r.id && { id: r.id }),
                nom: r.nom,
                description: r.description,
                kpiIds: r.kpiIds || [],
            })),
            objectifsSpecifiques: og.objectifsSpecifiques.map((os) => {
                const specificObj: any = {
                    nom: os.nom,
                    description: os.description,
                    kpiIds: os.kpiIds || [],
                    resultats: (os.resultats || []).map((r) => ({
                        ...(r.id && { id: r.id }),
                        nom: r.nom,
                        description: r.description,
                        kpiIds: r.kpiIds || [],
                    })),
                    // ✅ resultatsTransversaux removed from specific objective
                };
                if (os.id) specificObj.id = os.id;
                return specificObj;
            }),
        };
        if (og.id) globalObj.id = og.id;
        return globalObj;
    });
}

    // Navigation methods
    get progress(): number {
        return (this.currentSection / this.totalSections) * 100;
    }

    get sectionLabel(): string {
        const labels = [
            'Résumé Exécutif',
            'Contexte & Objectifs',
            'Méthodologie et résultats',
            'Conclusion et Recommandations',
            'Documents & Justificatifs',
        ];
        return labels[this.currentSection - 1];
    }

    isSectionCompleted(section: number): boolean {
        return section < this.currentSection;
    }

    goToSection(section: number): void {
        if (section >= 1 && section <= this.totalSections) {
            this.currentSection = section;
        }
    }

    nextSection(): void {
        if (this.currentSection < this.totalSections) {
            this.currentSection++;
        }
    }

    previousSection(): void {
        if (this.currentSection > 1) {
            this.currentSection--;
        }
    }

    saveCurrentSection(): void {
        this.saveRapport();
    }

    // Event handlers from child components
    onSection1Change(data: { programObjectives: string; keyResults: string; globalImpact: string }): void {
        this.programObjectives = data.programObjectives;
        this.keyResults = data.keyResults;
        this.globalImpact = data.globalImpact;
    }

    onSection2Change(objectives: GlobalObjective[]): void {
        this.globalObjectives = objectives;
    }

    onSection3Change(sprintIds: number[]): void {
        this.selectedSprintIds = sprintIds;
    }

    onSection4Change(data: { recommendations: Recommendation[]; conclusionText: string }): void {
        this.recommendations = data.recommendations;
        this.conclusionText = data.conclusionText;
    }
}