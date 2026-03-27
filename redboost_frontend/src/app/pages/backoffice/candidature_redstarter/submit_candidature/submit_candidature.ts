import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import { CandidatureService, CandidatureRedstarter } from '../candidature.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormTemplateService, FormTemplateView } from '../services/form-template.service';

@Component({
    selector: 'app-submit-candidature',
    templateUrl: './submit_candidature.html',
    styleUrls: ['./submit_candidature.scss'],
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class SubmitCandidatureComponent implements OnInit {
    templateId: string | null = null;
    template: FormTemplateView | null = null;

    candidatureForm!: FormGroup;
    uploadedFiles: File[] = [];
    submitting = false;

    constructor(
        private fb: FormBuilder,
        private candidatureService: CandidatureService,
        private formTemplateService: FormTemplateService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.candidatureForm = this.fb.group({});
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            if (params['templateId']) {
                this.templateId = params['templateId'];
                this.loadTemplate(this.templateId!);
            } else {
                alert('Aucun modèle de formulaire sélectionné. Redirection...');
                this.router.navigate(['/']);
            }
        });
    }

    loadTemplate(id: string) {
        this.formTemplateService.getById(id).subscribe({
            next: (dto) => {
                this.template = FormTemplateService.toView(dto);
                this.buildDynamicForm();
            },
            error: (err) => {
                console.error('Error loading template', err);
                alert('Erreur lors du chargement du formulaire.');
                this.router.navigate(['/']);
            },
        });
    }

    buildDynamicForm() {
        if (!this.template) return;

        const groupControls: any = {};

        this.template.questions.forEach((q) => {
            if (q.type !== 'upload') {
                const validators = q.required ? [Validators.required] : [];
                groupControls[this.getQuestionKey(q.id)] = [q.type === 'qcm' ? [] : '', validators];
            } else if (q.required) {
                // To track if a file was uploaded for this question we wouldn't map file binary to the form input typically, but we should make sure the user inputs it. We will have a separate validation check.
            }
        });

        // Some templates might require email/name extraction for Redstarter backward compatibility,
        // but since it's dynamic, we'll store EVERYTHING in dynamicAnswers except maybe a placeholder.
        this.candidatureForm = this.fb.group(groupControls);
    }

    onCheckboxChange(questionId: number, option: string, event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;
        const formControl = this.candidatureForm.get(this.getQuestionKey(questionId));
        if (!formControl) return;

        let currentArray = formControl.value || [];
        if (!Array.isArray(currentArray)) currentArray = [];

        if (isChecked) {
            formControl.setValue([...currentArray, option]);
            formControl.markAsTouched();
        } else {
            formControl.setValue(currentArray.filter((x: string) => x !== option));
            formControl.markAsTouched();
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
        event.target.value = '';
    }

    removeFile(index: number) {
        this.uploadedFiles.splice(index, 1);
    }

    submitCandidature() {
        if (this.candidatureForm.valid) {
            this.submitting = true;

            const formValue = this.candidatureForm.value;
            const answersObj: any = {};

            // Map question labels to the answers for readability in Admin
            this.template?.questions.forEach((q) => {
                 if (q.type !== 'upload') {
                     answersObj[q.text] = formValue[this.getQuestionKey(q.id)];
                 } else {
                     answersObj[q.text] = 'Fichier(s) attaché(s)';
                 }
            });

            // Need to set at least one field because the API requires `nomPrenom` theoretically, but the backend model allows optional.
            // Let's guess the name and email from questions if defined, else fallback to placeholders.
            const emailKeys = Object.keys(answersObj).filter(k => k.toLowerCase().includes('email'));
            const nameKeys = Object.keys(answersObj).filter(k => k.toLowerCase().includes('nom') || k.toLowerCase().includes('prenom'));

            const derivedEmail = emailKeys.length ? answersObj[emailKeys[0]] : 'non-specifie@redboost.tn';
            const derivedName = nameKeys.length ? answersObj[nameKeys[0]] : 'Candidat Anonyme';

            const candidature: CandidatureRedstarter = {
                formTemplateId: Number(this.templateId!),
                dynamicAnswers: JSON.stringify(answersObj),
                nomPrenom: derivedName,
                email: derivedEmail,
            };

            this.candidatureService
                .submitCandidature(candidature, this.uploadedFiles)
                .subscribe({
                    next: (response) => {
                        alert(
                            '✅ Votre candidature a été soumise avec succès! Nous vous contacterons bientôt.',
                        );

                        this.candidatureForm.reset();
                        this.uploadedFiles = [];
                        this.submitting = false;
                        this.router.navigate(['/']);
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

            const firstInvalidControl = document.querySelector('.error');
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

    isFieldInvalid(questionId: number): boolean {
        const field = this.candidatureForm.get(this.getQuestionKey(questionId));
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    getQuestionKey(id: any): string {
        return 'question_' + String(id).replace(/\./g, '_');
    }
}

