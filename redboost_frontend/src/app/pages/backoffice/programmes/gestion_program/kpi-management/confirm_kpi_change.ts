import { Component, Inject } from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-confirm-kpi-change-dialog',
    standalone: true,
    imports: [MatButtonModule, MatDialogModule],
    template: `
        <h2 mat-dialog-title>Confirmation requise</h2>
        <mat-dialog-content class="py-4">
            <p>
                Êtes-vous sûr de vouloir modifier la
                <strong>{{ data.field }}</strong> du KPI
                <strong>{{ data.kpiName }}</strong> ?
            </p>
            <p class="text-sm text-slate-600 mt-3">
                Ancienne valeur: <strong>{{ data.oldValue ?? '—' }}</strong
                ><br />
                Nouvelle valeur: <strong>{{ data.newValue ?? '—' }}</strong>
            </p>
            <p class="text-sm text-orange-700 mt-4">
                ⚠️ Cette modification peut affecter les calculs de progression
                et les rapports historiques.
            </p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()">Annuler</button>
            <button mat-raised-button color="warn" (click)="onConfirm()">
                Oui, modifier
            </button>
        </mat-dialog-actions>
    `,
    styles: [
        `
            mat-dialog-content {
                line-height: 1.6;
            }
        `,
    ],
})
export class ConfirmKpiChangeDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmKpiChangeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }
}
