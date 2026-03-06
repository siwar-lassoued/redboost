// dialogs/add-entrepreneur.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Programme, Entrepreneur } from '../../../../../../models/entrepreneur.models';

@Component({
    selector: 'app-add-entrepreneur-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './add-entrepreneur.html'
})
export class AddEntrepreneurModalComponent implements OnInit {
    @Input() programmes: Programme[] = [];
    @Input() tunisiaRegions: string[] = [];
    @Input() showModal = false; // Add this property
    
    @Output() onClose = new EventEmitter<void>();
    @Output() onSubmitEntrepreneur = new EventEmitter<Entrepreneur>(); // Renamed to avoid conflict

    entrepreneur: Entrepreneur = {
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
        this.localProgrammes = this.programmes.map(p => ({ ...p, checked: false }));
    }

    ngOnChanges() {
        this.localProgrammes = this.programmes.map(p => ({ ...p, checked: false }));
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
        this.entrepreneur.programmes = selectedProgrammes;

        const entrepreneurData: Entrepreneur = {
            firstName: this.entrepreneur.firstName,
            lastName: this.entrepreneur.lastName,
            email: this.entrepreneur.email,
            phoneNumber: this.entrepreneur.phoneNumber,
            role: 'ENTREPRENEUR',
            programmes: this.entrepreneur.programmes
        };

        if (this.entrepreneur.entreprise) {
            entrepreneurData.entreprise = this.entrepreneur.entreprise;
        }
        if (this.entrepreneur.secteur) {
            entrepreneurData.secteur = this.entrepreneur.secteur;
        }
        if (this.entrepreneur.region) {
            entrepreneurData.region = this.entrepreneur.region;
        }

        this.onSubmitEntrepreneur.emit(entrepreneurData);
        this.isSubmitting = false;
    }

    closeModal() {
        this.onClose.emit();
    }
}