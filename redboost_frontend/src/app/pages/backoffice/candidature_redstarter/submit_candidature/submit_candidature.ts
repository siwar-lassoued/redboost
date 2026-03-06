import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
    FormArray,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    CandidatureService,
    CandidatureRedstarter,
} from '../candidature.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-submit-candidature',
    templateUrl: './submit_candidature.html',
    styleUrls: ['./submit_candidature.scss'],
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class SubmitCandidatureComponent implements OnInit {
    currentStep = 1;
    totalSteps = 5;
    candidatureForm: FormGroup;
    uploadedFiles: File[] = [];
    submitting = false;

    constructor(
        private fb: FormBuilder,
        private candidatureService: CandidatureService,
        private router: Router,
    ) {
        this.candidatureForm = this.createForm();
    }

    ngOnInit(): void {
        // Initialize form
    }

    createForm(): FormGroup {
        return this.fb.group({
            // Step 1: Personal Information
            nomPrenom: ['', Validators.required],
            genre: ['', Validators.required],
            age: ['', [Validators.required, Validators.min(18)]],
            numeroTelephone: [
                '',
                [Validators.required, Validators.pattern(/^[+]?[0-9]{8,15}$/)],
            ],
            email: ['', [Validators.required, Validators.email]],
            roleEntreprise: ['', Validators.required],

            // Step 2: Company Information
            nomEntreprise: ['', Validators.required],
            entrepriseEst: ['', Validators.required],
            dateCreation: [''],
            regionBasee: ['', Validators.required],
            breveDescription: [
                '',
                [Validators.required, Validators.maxLength(150)],
            ],
            lienReseauxSociaux: [''],
            labelStartupAct: [null, Validators.required],
            dateObtentionLabel: [''],

            // Step 3: Startup Details
            phaseMaturite: ['', Validators.required],
            marchePersonnasCibles: ['', Validators.required],
            composanteInnovation: [
                '',
                [Validators.required, Validators.maxLength(250)],
            ],
            impactEnvironnemental: ['', Validators.required],
            impactSocial: ['', Validators.required],
            viabiliteCommerciale: ['', Validators.required],
            valeurAjoutee: ['', [Validators.required, Validators.min(0)]],

            // Step 4: Team Information
            nombreCoFondateurs: ['', [Validators.required, Validators.min(0)]],
            impliquesGestion: [null, Validators.required],
            nombreImpliquesGestion: [''],
            experienceEquipeFondatrice: ['', Validators.required],
            nombreEmploisCrees: ['', [Validators.required, Validators.min(0)]],

            // Step 5: Support Needs
            besoinsAccompagnement: this.fb.array([], Validators.required),
            beneficieAccompagnement: [null, Validators.required],
            detailsAccompagnement: [''],
            besoinsFormation: this.fb.array([]),
        });
    }

    get besoinsAccompagnement(): FormArray {
        return this.candidatureForm.get('besoinsAccompagnement') as FormArray;
    }

    get besoinsFormation(): FormArray {
        return this.candidatureForm.get('besoinsFormation') as FormArray;
    }

    onBesoinsAccompagnementChange(besoin: string, event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;
        if (isChecked) {
            this.besoinsAccompagnement.push(this.fb.control(besoin));
        } else {
            const index = this.besoinsAccompagnement.controls.findIndex(
                (x) => x.value === besoin,
            );
            if (index !== -1) {
                this.besoinsAccompagnement.removeAt(index);
            }
        }
    }

    onBesoinsFormationChange(formation: string, event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;
        if (isChecked) {
            this.besoinsFormation.push(this.fb.control(formation));
        } else {
            const index = this.besoinsFormation.controls.findIndex(
                (x) => x.value === formation,
            );
            if (index !== -1) {
                this.besoinsFormation.removeAt(index);
            }
        }
    }

    onFilesSelected(event: any) {
        const files = event.target.files;
        if (files && files.length > 0) {
            const remainingSlots = 8 - this.uploadedFiles.length;
            const filesToAdd = Math.min(files.length, remainingSlots);

            for (let i = 0; i < filesToAdd; i++) {
                this.uploadedFiles.push(files[i]);
            }

            if (files.length > remainingSlots) {
                alert(
                    `Vous ne pouvez télécharger que ${remainingSlots} fichier(s) supplémentaire(s). Maximum 8 fichiers.`,
                );
            }
        }
        // Reset input
        event.target.value = '';
    }

    removeFile(index: number) {
        this.uploadedFiles.splice(index, 1);
    }

    nextStep() {
        // Validate current step before moving forward
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                window.scrollTo(0, 0);
            }
        } else {
            alert(
                'Veuillez remplir tous les champs obligatoires avant de continuer.',
            );
            this.markCurrentStepAsTouched();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            window.scrollTo(0, 0);
        }
    }

    validateCurrentStep(): boolean {
        const step1Fields = [
            'nomPrenom',
            'genre',
            'age',
            'numeroTelephone',
            'email',
            'roleEntreprise',
        ];
        const step2Fields = [
            'nomEntreprise',
            'entrepriseEst',
            'regionBasee',
            'breveDescription',
            'labelStartupAct',
        ];
        const step3Fields = [
            'phaseMaturite',
            'marchePersonnasCibles',
            'composanteInnovation',
            'impactEnvironnemental',
            'impactSocial',
            'viabiliteCommerciale',
            'valeurAjoutee',
        ];
        const step4Fields = [
            'nombreCoFondateurs',
            'impliquesGestion',
            'experienceEquipeFondatrice',
            'nombreEmploisCrees',
        ];
        const step5Fields = ['beneficieAccompagnement'];

        let fieldsToValidate: string[] = [];

        switch (this.currentStep) {
            case 1:
                fieldsToValidate = step1Fields;
                break;
            case 2:
                fieldsToValidate = step2Fields;
                break;
            case 3:
                fieldsToValidate = step3Fields;
                break;
            case 4:
                fieldsToValidate = step4Fields;
                break;
            case 5:
                fieldsToValidate = step5Fields;
                // Check besoinsAccompagnement array
                if (this.besoinsAccompagnement.length === 0) {
                    return false;
                }
                break;
        }

        for (const field of fieldsToValidate) {
            const control = this.candidatureForm.get(field);
            if (control && control.invalid) {
                return false;
            }
        }

        return true;
    }

    markCurrentStepAsTouched() {
        const step1Fields = [
            'nomPrenom',
            'genre',
            'age',
            'numeroTelephone',
            'email',
            'roleEntreprise',
        ];
        const step2Fields = [
            'nomEntreprise',
            'entrepriseEst',
            'regionBasee',
            'breveDescription',
            'labelStartupAct',
        ];
        const step3Fields = [
            'phaseMaturite',
            'marchePersonnasCibles',
            'composanteInnovation',
            'impactEnvironnemental',
            'impactSocial',
            'viabiliteCommerciale',
            'valeurAjoutee',
        ];
        const step4Fields = [
            'nombreCoFondateurs',
            'impliquesGestion',
            'experienceEquipeFondatrice',
            'nombreEmploisCrees',
        ];
        const step5Fields = ['beneficieAccompagnement'];

        let fieldsToMark: string[] = [];

        switch (this.currentStep) {
            case 1:
                fieldsToMark = step1Fields;
                break;
            case 2:
                fieldsToMark = step2Fields;
                break;
            case 3:
                fieldsToMark = step3Fields;
                break;
            case 4:
                fieldsToMark = step4Fields;
                break;
            case 5:
                fieldsToMark = step5Fields;
                break;
        }

        fieldsToMark.forEach((field) => {
            const control = this.candidatureForm.get(field);
            control?.markAsTouched();
        });
    }

    submitCandidature() {
        if (
            this.candidatureForm.valid &&
            this.besoinsAccompagnement.length > 0
        ) {
            this.submitting = true;

            const formValue = this.candidatureForm.value;

            const candidature: CandidatureRedstarter = {
                nomPrenom: formValue.nomPrenom,
                genre: formValue.genre,
                age: formValue.age,
                numeroTelephone: formValue.numeroTelephone,
                email: formValue.email,
                roleEntreprise: formValue.roleEntreprise,
                nomEntreprise: formValue.nomEntreprise,
                entrepriseEst: formValue.entrepriseEst,
                dateCreation: formValue.dateCreation
                    ? new Date(formValue.dateCreation)
                    : undefined,
                regionBasee: formValue.regionBasee,
                breveDescription: formValue.breveDescription,
                lienReseauxSociaux: formValue.lienReseauxSociaux,
                labelStartupAct: formValue.labelStartupAct,
                dateObtentionLabel: formValue.dateObtentionLabel
                    ? new Date(formValue.dateObtentionLabel)
                    : undefined,
                phaseMaturite: formValue.phaseMaturite,
                marchePersonnasCibles: formValue.marchePersonnasCibles,
                composanteInnovation: formValue.composanteInnovation,
                impactEnvironnemental: formValue.impactEnvironnemental,
                impactSocial: formValue.impactSocial,
                viabiliteCommerciale: formValue.viabiliteCommerciale,
                valeurAjoutee: formValue.valeurAjoutee,
                nombreCoFondateurs: formValue.nombreCoFondateurs,
                impliquesGestion: formValue.impliquesGestion,
                nombreImpliquesGestion: formValue.nombreImpliquesGestion,
                experienceEquipeFondatrice:
                    formValue.experienceEquipeFondatrice,
                nombreEmploisCrees: formValue.nombreEmploisCrees,
                besoinsAccompagnement: this.besoinsAccompagnement.value,
                beneficieAccompagnement: formValue.beneficieAccompagnement,
                detailsAccompagnement: formValue.detailsAccompagnement,
                besoinsFormation: this.besoinsFormation.value,
            };

            this.candidatureService
                .submitCandidature(candidature, this.uploadedFiles)
                .subscribe({
                    next: (response) => {
                        console.log(
                            'Candidature submitted successfully',
                            response,
                        );
                        alert(
                            '✅ Votre candidature a été soumise avec succès! Nous vous contacterons bientôt.',
                        );

                        // Reset form
                        this.candidatureForm.reset();
                        this.uploadedFiles = [];
                        this.besoinsAccompagnement.clear();
                        this.besoinsFormation.clear();
                        this.currentStep = 1;
                        this.submitting = false;

                        // Optionally navigate to another page
                        // this.router.navigate(['/confirmation']);
                    },
                    error: (error) => {
                        console.error('Error submitting candidature', error);
                        alert(
                            '❌ Erreur lors de la soumission de la candidature. Veuillez vérifier vos informations et réessayer.',
                        );
                        this.submitting = false;
                    },
                });
        } else {
            alert('Veuillez remplir tous les champs obligatoires');
            this.markFormGroupTouched(this.candidatureForm);

            // Scroll to first error
            const firstInvalidControl = document.querySelector(
                '.form-control.error',
            );
            if (firstInvalidControl) {
                firstInvalidControl.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        }
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach((key) => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.candidatureForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }
}
