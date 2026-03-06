// dialogs/assign-entrepreneur.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Programme, EntrepreneurDetail, ProgrammeDetail } from '../../../../../../models/entrepreneur.models';

@Component({
    selector: 'app-assign-entrepreneur-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './assign-entrepreneur.html'
})
export class AssignEntrepreneurModalComponent implements OnInit {
    @Input() programmes: Programme[] = [];
    @Input() entrepreneursDetails: EntrepreneurDetail[] = [];
    @Input() showAssignModal = false;

    @Output() onClose = new EventEmitter<void>();
    @Output() onAssignEntrepreneurs = new EventEmitter<{ programmeId: number; entrepreneurIds: number[] }>();

    selectedProgrammeId: number | null = null;
    selectedEntrepreneurIds: number[] = [];
    isAssigning = false;

    ngOnInit() {}

    onProgrammeSelect() {
        this.selectedEntrepreneurIds = [];
    }

    toggleEntrepreneurSelection(entrepreneurId: number) {
        if (this.isEntrepreneurAlreadyAssigned(entrepreneurId)) return;
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

    isEntrepreneurAlreadyAssigned(entrepreneurId: number): boolean {
        if (!this.selectedProgrammeId) return false;
        const entrepreneur = this.entrepreneursDetails.find(e => e.id === entrepreneurId);
        if (!entrepreneur?.programs) return false;
        return entrepreneur.programs.some((p: ProgrammeDetail) => p.id === this.selectedProgrammeId);
    }

    // Returns only entrepreneurs that can still be assigned (not yet in the programme)
    get assignableEntrepreneurs(): EntrepreneurDetail[] {
        return this.entrepreneursDetails.filter(e => !this.isEntrepreneurAlreadyAssigned(e.id));
    }

    get isAllSelected(): boolean {
        const assignable = this.assignableEntrepreneurs;
        return assignable.length > 0 && assignable.every(e => this.isEntrepreneurSelected(e.id));
    }

    get isPartiallySelected(): boolean {
        return !this.isAllSelected && this.assignableEntrepreneurs.some(e => this.isEntrepreneurSelected(e.id));
    }

    toggleSelectAll() {
        if (this.isAllSelected) {
            // Deselect all assignable entrepreneurs
            const assignableIds = new Set(this.assignableEntrepreneurs.map(e => e.id));
            this.selectedEntrepreneurIds = this.selectedEntrepreneurIds.filter(id => !assignableIds.has(id));
        } else {
            // Select all assignable entrepreneurs (merge, avoid duplicates)
            const existing = new Set(this.selectedEntrepreneurIds);
            this.assignableEntrepreneurs.forEach(e => existing.add(e.id));
            this.selectedEntrepreneurIds = Array.from(existing);
        }
    }

    getValidSelections(): number[] {
        return this.selectedEntrepreneurIds.filter(id => !this.isEntrepreneurAlreadyAssigned(id));
    }

    canAssign(): boolean {
        return !this.isAssigning &&
            this.selectedProgrammeId !== null &&
            this.getValidSelections().length > 0;
    }

    assignEntrepreneurs() {
        const validSelections = this.getValidSelections();
        if (!this.selectedProgrammeId || validSelections.length === 0) {
            alert('Veuillez sélectionner un programme et au moins un entrepreneur non déjà assigné');
            return;
        }
        this.isAssigning = true;
        this.onAssignEntrepreneurs.emit({
            programmeId: this.selectedProgrammeId,
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