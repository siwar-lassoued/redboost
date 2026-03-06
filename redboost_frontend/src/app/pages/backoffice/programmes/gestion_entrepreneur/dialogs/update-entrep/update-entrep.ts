import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Programme, Entrepreneur } from '../../../../../../models/entrepreneur.models';

@Component({
    selector: 'app-update-entrepreneur-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './update-entrp.html'
})
export class UpdateEntrepreneurModalComponent implements OnInit, OnChanges {
    @Input() programmes: Programme[] = [];
    @Input() tunisiaRegions: string[] = [];
    @Input() showModal = false;
    @Input() entrepreneurToEdit: any = null; // The entrepreneur data to edit
    
    @Output() onClose = new EventEmitter<void>();
    @Output() onUpdateEntrepreneur = new EventEmitter<any>();

    entrepreneur: any = {
        id: null,
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        entreprise: '',
        secteur: '',
        region: '',
        role: 'ENTREPRENEUR',
        programmes: []
    };

    localProgrammes: Programme[] = [];
    isSubmitting = false;

    ngOnInit() {
        this.initializeLocalProgrammes();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['entrepreneurToEdit'] && this.entrepreneurToEdit) {
            this.loadEntrepreneurData();
        }
        if (changes['programmes']) {
            this.initializeLocalProgrammes();
        }
    }

    initializeLocalProgrammes() {
        this.localProgrammes = this.programmes.map(p => ({ ...p, checked: false }));
        if (this.entrepreneurToEdit) {
            this.updateProgrammeChecks();
        }
    }

    loadEntrepreneurData() {
        if (!this.entrepreneurToEdit) return;

        this.entrepreneur = {
            id: this.entrepreneurToEdit.id,
            firstName: this.entrepreneurToEdit.firstName || '',
            lastName: this.entrepreneurToEdit.lastName || '',
            email: this.entrepreneurToEdit.email || '',
            phoneNumber: this.entrepreneurToEdit.phoneNumber || '',
            entreprise: this.entrepreneurToEdit.entreprise || '',
            secteur: this.entrepreneurToEdit.secteur || '',
            region: this.entrepreneurToEdit.region || '',
            role: 'ENTREPRENEUR',
            programmes: []
        };

        this.updateProgrammeChecks();
    }

    updateProgrammeChecks() {
        if (!this.entrepreneurToEdit || !this.entrepreneurToEdit.programs) return;

        // Get the programme IDs from the entrepreneur's programs
        const entrepreneurProgrammeIds = this.entrepreneurToEdit.programs.map((p: any) => p.id);

        // Update local programmes to check those that the entrepreneur has
        this.localProgrammes = this.programmes.map(p => ({
            ...p,
            checked: entrepreneurProgrammeIds.includes(p.id)
        }));
    }

    onProgrammeChange(programme: Programme) {
        const localProgramme = this.localProgrammes.find(p => p.id === programme.id);
        if (localProgramme) {
            localProgramme.checked = !localProgramme.checked;
        }
    }

    getSelectedProgrammes(): number[] {
        return this.localProgrammes.filter(p => p.checked).map(p => p.id);
    }

    onSubmit() {
        // Validation
        if (!this.entrepreneur.firstName || !this.entrepreneur.lastName || 
            !this.entrepreneur.email || !this.entrepreneur.phoneNumber) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const emailRegex = /^[A-Za-z0-9+_.-]+@(.+)$/;
        if (!emailRegex.test(this.entrepreneur.email)) {
            alert("Format d'email invalide");
            return;
        }

        const selectedProgrammes = this.getSelectedProgrammes();
        if (selectedProgrammes.length === 0) {
            alert('Veuillez sélectionner au moins un programme');
            return;
        }

        this.isSubmitting = true;

        const updatedData: any = {
            id: this.entrepreneur.id,
            firstName: this.entrepreneur.firstName,
            lastName: this.entrepreneur.lastName,
            email: this.entrepreneur.email,
            phoneNumber: this.entrepreneur.phoneNumber,
            role: 'ENTREPRENEUR',
            programmes: selectedProgrammes
        };

        if (this.entrepreneur.entreprise) {
            updatedData.entreprise = this.entrepreneur.entreprise;
        }
        if (this.entrepreneur.secteur) {
            updatedData.secteur = this.entrepreneur.secteur;
        }
        if (this.entrepreneur.region) {
            updatedData.region = this.entrepreneur.region;
        }

        this.onUpdateEntrepreneur.emit(updatedData);
        this.isSubmitting = false;
    }

    closeModal() {
        this.resetForm();
        this.onClose.emit();
    }

    resetForm() {
        this.entrepreneur = {
            id: null,
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            entreprise: '',
            secteur: '',
            region: '',
            role: 'ENTREPRENEUR',
            programmes: []
        };
        this.localProgrammes = this.programmes.map(p => ({ ...p, checked: false }));
    }
}