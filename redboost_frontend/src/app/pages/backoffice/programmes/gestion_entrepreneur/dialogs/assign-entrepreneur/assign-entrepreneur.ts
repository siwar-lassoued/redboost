// dialogs/assign-entrepreneur.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Programme, EntrepreneurDetail, ProgrammeDetail } from '../../../../../../models/entrepreneur.models';

@Component({
    selector: 'app-assign-entrepreneur-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './assign-entrepreneur.html'
})
export class AssignEntrepreneurModalComponent implements OnInit, OnChanges {
    @Input() programmes: Programme[] = [];
    @Input() entrepreneursDetails: EntrepreneurDetail[] = [];
    @Input() showAssignModal = false;
    @Input() preSelectedEntrepreneurIds: number[] = [];

    @Output() onClose = new EventEmitter<void>();
    /** Now emits programmeIds (array) instead of a single programmeId */
    @Output() onAssignEntrepreneurs = new EventEmitter<{ programmeIds: number[]; entrepreneurIds: number[] }>();

    selectedProgrammeIds: number[] = [];
    selectedEntrepreneurIds: number[] = [];
    isAssigning = false;

    ngOnInit() {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes['showAssignModal']?.currentValue === true ||
            changes['preSelectedEntrepreneurIds']) {
            if (this.preSelectedEntrepreneurIds?.length > 0) {
                const existing = new Set(this.selectedEntrepreneurIds);
                this.preSelectedEntrepreneurIds.forEach(id => existing.add(id));
                this.selectedEntrepreneurIds = Array.from(existing);
            }
        }
        if (changes['showAssignModal']?.currentValue === false) {
            this.selectedProgrammeIds = [];
            this.selectedEntrepreneurIds = [];
            this.isAssigning = false;
        }
    }

    // ─── Programme selection ──────────────────────────────────────────────────

    isProgrammeSelected(programmeId: number): boolean {
        return this.selectedProgrammeIds.includes(programmeId);
    }

    toggleProgrammeSelection(programmeId: number) {
        const index = this.selectedProgrammeIds.indexOf(programmeId);
        if (index === -1) {
            this.selectedProgrammeIds.push(programmeId);
        } else {
            this.selectedProgrammeIds.splice(index, 1);
        }
        // Re-filter entrepreneur selection after programme change
        this.selectedEntrepreneurIds = this.selectedEntrepreneurIds.filter(
            id => !this.isEntrepreneurAlreadyAssignedToAll(id)
        );
    }

    get isAllProgrammesSelected(): boolean {
        return this.programmes.length > 0 &&
            this.programmes.every(p => this.isProgrammeSelected(p.id));
    }

    get isPartialProgrammesSelected(): boolean {
        return !this.isAllProgrammesSelected &&
            this.programmes.some(p => this.isProgrammeSelected(p.id));
    }

    toggleSelectAllProgrammes() {
        if (this.isAllProgrammesSelected) {
            this.selectedProgrammeIds = [];
        } else {
            this.selectedProgrammeIds = this.programmes.map(p => p.id);
        }
        this.selectedEntrepreneurIds = this.selectedEntrepreneurIds.filter(
            id => !this.isEntrepreneurAlreadyAssignedToAll(id)
        );
    }

    // ─── Entrepreneur selection ───────────────────────────────────────────────

    /**
     * An entrepreneur is "already assigned to all" only when they are already
     * in EVERY currently selected programme. If no programmes are selected yet,
     * no one is considered already assigned.
     */
    isEntrepreneurAlreadyAssignedToAll(entrepreneurId: number): boolean {
        if (this.selectedProgrammeIds.length === 0) return false;
        const entrepreneur = this.entrepreneursDetails.find(e => e.id === entrepreneurId);
        if (!entrepreneur?.programs) return false;
        const userProgramIds = new Set(entrepreneur.programs.map((p: ProgrammeDetail) => p.id));
        return this.selectedProgrammeIds.every(pid => userProgramIds.has(pid));
    }

    /**
     * Shows which programmes this entrepreneur is already in, among the selected ones.
     */
    getAlreadyAssignedProgramNames(entrepreneurId: number): string[] {
        if (this.selectedProgrammeIds.length === 0) return [];
        const entrepreneur = this.entrepreneursDetails.find(e => e.id === entrepreneurId);
        if (!entrepreneur?.programs) return [];
        const userProgramIds = new Set(entrepreneur.programs.map((p: ProgrammeDetail) => p.id));
        return this.programmes
            .filter(p => this.selectedProgrammeIds.includes(p.id) && userProgramIds.has(p.id))
            .map(p => p.name);
    }

    get assignableEntrepreneurs(): EntrepreneurDetail[] {
        return this.entrepreneursDetails.filter(e => !this.isEntrepreneurAlreadyAssignedToAll(e.id));
    }

    get isAllEntrepreneursSelected(): boolean {
        const assignable = this.assignableEntrepreneurs;
        return assignable.length > 0 && assignable.every(e => this.isEntrepreneurSelected(e.id));
    }

    get isPartialEntrepreneursSelected(): boolean {
        return !this.isAllEntrepreneursSelected &&
            this.assignableEntrepreneurs.some(e => this.isEntrepreneurSelected(e.id));
    }

    toggleEntrepreneurSelection(entrepreneurId: number) {
        if (this.isEntrepreneurAlreadyAssignedToAll(entrepreneurId)) return;
        const index = this.selectedEntrepreneurIds.indexOf(entrepreneurId);
        if (index === -1) {
            this.selectedEntrepreneurIds.push(entrepreneurId);
        } else {
            this.selectedEntrepreneurIds.splice(index, 1);
        }
    }

    isEntrepreneurSelected(entrepreneurId: number): boolean {
        return this.selectedEntrepreneurIds.includes(entrepreneurId);
    }

    toggleSelectAllEntrepreneurs() {
        if (this.isAllEntrepreneursSelected) {
            const assignableIds = new Set(this.assignableEntrepreneurs.map(e => e.id));
            this.selectedEntrepreneurIds = this.selectedEntrepreneurIds.filter(id => !assignableIds.has(id));
        } else {
            const existing = new Set(this.selectedEntrepreneurIds);
            this.assignableEntrepreneurs.forEach(e => existing.add(e.id));
            this.selectedEntrepreneurIds = Array.from(existing);
        }
    }

    getValidSelections(): number[] {
        return this.selectedEntrepreneurIds.filter(id => !this.isEntrepreneurAlreadyAssignedToAll(id));
    }

    canAssign(): boolean {
        return !this.isAssigning &&
            this.selectedProgrammeIds.length > 0 &&
            this.getValidSelections().length > 0;
    }

    assignEntrepreneurs() {
        const validSelections = this.getValidSelections();
        if (this.selectedProgrammeIds.length === 0 || validSelections.length === 0) {
            alert('Veuillez sélectionner au moins un programme et un entrepreneur');
            return;
        }
        this.isAssigning = true;
        this.onAssignEntrepreneurs.emit({
            programmeIds: this.selectedProgrammeIds,
            entrepreneurIds: validSelections
        });
    }

    closeAssignModal() {
        this.onClose.emit();
    }

    getInitials(firstName: string, lastName: string): string {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    }
}