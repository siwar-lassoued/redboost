import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RapportDataService } from '../rapport-data.service';
import { SprintDetail, ActivityDetail } from '../../../../../../models/rapport.model';
import { AiService,ImproveResponse } from '../../../ai.service';

@Component({
    selector: 'app-rapport-section3',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './section3.html',
    styleUrls: ['../rapport.component.scss'],
})
export class RapportSection3Component implements OnInit, OnChanges {
    @Input() selectedSprintIds: number[] = [];
    @Input() programmeId?: number;
    @Input() programmeName?: string;

    @Output() sprintIdsChange = new EventEmitter<number[]>();

    availableSprints: SprintDetail[] = [];
    selectedSprintsDetails: SprintDetail[] = [];
    expandedSprints: Set<number> = new Set();
    showSprintSelectionModal: boolean = false;

    // Editing states
    private editingFields: { [key: string]: boolean } = {};

    // AI state
    showAIModal: boolean = false;
    aiResponse: ImproveResponse | null = null;
    isAIProcessing: boolean = false;
    aiProcessingKey: string = '';   // tracks which button is spinning
    private pendingAIField: { activityId: number; sprintId: number; field: 'methodologie' | 'objectif' | 'resultatAttendu' } | null = null;

    constructor(
        private rapportDataService: RapportDataService,
        private aiService: AiService,
    ) {}

    ngOnInit(): void {
        this.rapportDataService.sprints$.subscribe(sprints => {
            this.availableSprints = sprints;
            this.updateSelectedSprintsDisplay();
        });

        if (this.selectedSprintIds.length > 0) {
            this.loadSprintDetails();
        }
    }

    ngOnChanges(): void {
        if (this.selectedSprintIds.length > 0) {
            this.loadSprintDetails();
        }
    }

    private loadSprintDetails(): void {
        this.rapportDataService.loadSprintDetails(this.selectedSprintIds).subscribe({
            next: (sprints) => { this.selectedSprintsDetails = sprints; },
            error: (err) => console.error('Error loading sprint details:', err)
        });
    }

    private updateSelectedSprintsDisplay(): void {
        if (this.selectedSprintIds.length > 0 && this.availableSprints.length > 0) {
            this.loadSprintDetails();
        }
    }

    // ── Sprint Management ──────────────────────────────────────────────────────

    addSprint(): void { this.showSprintSelectionModal = true; }
    closeSprintSelectionModal(): void { this.showSprintSelectionModal = false; }

    isSprintSelected(sprintId: number): boolean {
        return this.selectedSprintIds.includes(sprintId);
    }

    toggleSprintInSelection(sprintId: number): void {
        const index = this.selectedSprintIds.indexOf(sprintId);
        index > -1 ? this.selectedSprintIds.splice(index, 1) : this.selectedSprintIds.push(sprintId);
    }

    confirmSprintSelection(): void {
        this.sprintIdsChange.emit(this.selectedSprintIds);
        this.loadSprintDetails();
        this.closeSprintSelectionModal();
    }

    removeSprint(sprintId: number): void {
        const index = this.selectedSprintIds.indexOf(sprintId);
        if (index > -1) {
            this.selectedSprintIds.splice(index, 1);
            this.sprintIdsChange.emit(this.selectedSprintIds);
            this.loadSprintDetails();
        }
    }

    isSprintExpanded(sprintId: number): boolean { return this.expandedSprints.has(sprintId); }

    toggleSprintExpansion(sprintId: number): void {
        this.expandedSprints.has(sprintId)
            ? this.expandedSprints.delete(sprintId)
            : this.expandedSprints.add(sprintId);
    }

    // ── Editing helpers ────────────────────────────────────────────────────────

    private getEditKey(sprintId: number, activityId: number, field: string): string {
        return `${sprintId}-${activityId}-${field}`;
    }

    isMethodologyEditing(sprintId: number, activityId: number): boolean {
        return this.editingFields[this.getEditKey(sprintId, activityId, 'methodology')] || false;
    }
    toggleMethodologyEdit(sprintId: number, activityId: number): void {
        const key = this.getEditKey(sprintId, activityId, 'methodology');
        this.editingFields[key] = !this.editingFields[key];
    }
    saveMethodology(sprintId: number, activityId: number): void {
        this.editingFields[this.getEditKey(sprintId, activityId, 'methodology')] = false;
        this.saveActivityField(activityId, 'methodologie');
    }

    isObjectifEditing(sprintId: number, activityId: number): boolean {
        return this.editingFields[this.getEditKey(sprintId, activityId, 'objectif')] || false;
    }
    toggleObjectifEdit(sprintId: number, activityId: number): void {
        const key = this.getEditKey(sprintId, activityId, 'objectif');
        this.editingFields[key] = !this.editingFields[key];
    }
    saveObjectif(sprintId: number, activityId: number): void {
        this.editingFields[this.getEditKey(sprintId, activityId, 'objectif')] = false;
        this.saveActivityField(activityId, 'objectif');
    }

    isResultatEditing(sprintId: number, activityId: number): boolean {
        return this.editingFields[this.getEditKey(sprintId, activityId, 'resultat')] || false;
    }
    toggleResultatEdit(sprintId: number, activityId: number): void {
        const key = this.getEditKey(sprintId, activityId, 'resultat');
        this.editingFields[key] = !this.editingFields[key];
    }
    saveResultat(sprintId: number, activityId: number): void {
        this.editingFields[this.getEditKey(sprintId, activityId, 'resultat')] = false;
        this.saveActivityField(activityId, 'resultatAttendu');
    }

    private saveActivityField(activityId: number, field: string): void {
        const activity = this.getActivityById(activityId);
        if (!activity) return;
        this.rapportDataService.updateActivity(activityId, field, activity[field as keyof ActivityDetail]).subscribe({
            next: () => console.log(`${field} saved`),
            error: (err) => console.error(`Error saving ${field}:`, err)
        });
    }

    private getActivityById(activityId: number): ActivityDetail | undefined {
        for (const sprint of this.selectedSprintsDetails) {
            const a = sprint.activites?.find((a: any) => a.id === activityId);
            if (a) return a;
        }
        return undefined;
    }

    getActivityBySprint(sprintId: number, activityId: number): ActivityDetail | undefined {
        const sprint = this.selectedSprintsDetails.find(s => s.id === sprintId);
        return sprint?.activites?.find((a: any) => a.id === activityId);
    }

    // ── AI generation ──────────────────────────────────────────────────────────

    /** Returns a unique key for the button spinner */
    aiKey(sprintId: number, activityId: number, field: string): string {
        return `${sprintId}-${activityId}-${field}`;
    }

    isGenerating(sprintId: number, activityId: number, field: string): boolean {
        return this.isAIProcessing && this.aiProcessingKey === this.aiKey(sprintId, activityId, field);
    }

    generateWithAI(
        sprintId: number,
        activity: ActivityDetail,
        field: 'methodologie' | 'objectif' | 'resultatAttendu',
        type: string
    ): void {
        const currentText: string = (activity[field as keyof ActivityDetail] as string) || '';
        const key = this.aiKey(sprintId, activity.id, field);

        // Build a rich context even when the field is empty
        const context = [
            this.programmeName ? `Programme: ${this.programmeName}` : '',
            `Activité: ${activity.nom || ''}`,
            activity.description ? `Description: ${activity.description}` : '',
        ].filter(Boolean).join(' | ');

        // Use activity name + description as seed text when field is empty
        const textToSend = currentText.trim() || `${activity.nom || ''} - ${activity.description || ''}`.trim();

        if (!textToSend) {
            alert('Aucune information disponible pour générer du contenu. Veuillez d\'abord renseigner le nom ou la description de l\'activité.');
            return;
        }

        this.isAIProcessing = true;
        this.aiProcessingKey = key;
        this.pendingAIField = { activityId: activity.id, sprintId, field };

        this.aiService.improve({
            text: textToSend,
            type,
            context,
            model: 'gemini',
        }).subscribe({
            next: (response) => {
                this.aiResponse = response;
                this.showAIModal = true;
                this.isAIProcessing = false;
            },
            error: (err) => {
                console.error('AI error:', err);
                alert('Une erreur est survenue lors de la génération. Veuillez réessayer.');
                this.isAIProcessing = false;
                this.pendingAIField = null;
            },
        });
    }

    applyAIVersion(): void {
        if (!this.aiResponse || !this.pendingAIField) return;
        const { activityId, sprintId, field } = this.pendingAIField;
        const activity = this.getActivityById(activityId);
        if (activity) {
            (activity as any)[field] = this.aiResponse.improved_text;
            this.saveActivityField(activityId, field);
        }
        this.closeAIModal();
    }

    closeAIModal(): void {
        this.showAIModal = false;
        this.aiResponse = null;
        this.pendingAIField = null;
    }
}