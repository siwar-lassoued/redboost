import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RapportDataService } from '../rapport-data.service';
import { DocumentConsolide } from '../../../../../../models/rapport.model';

@Component({
    selector: 'app-rapport-section5',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './section5.html',
    styleUrls: ['../rapport.component.scss'],
})
export class RapportSection5Component implements OnInit {
    @Input() programmeId?: number;
    @Input() selectedSprintIds: number[] = [];

    documents: DocumentConsolide[] = [];
    uniqueSprints: string[] = [];
    uniqueTasks: string[] = [];

    searchText: string = '';
    selectedSprint: string = 'Tous';
    selectedTask: string = 'Toutes';

    constructor(private rapportDataService: RapportDataService) {}

    ngOnInit(): void {
        // Subscribe to documents from service
        this.rapportDataService.documents$.subscribe(docs => {
            this.documents = docs;
            this.updateDynamicFilters();
        });
    }

    private updateDynamicFilters(): void {
        const sprints = new Set<string>();
        const tasks = new Set<string>();

        this.documents.forEach((doc) => {
            sprints.add(doc.sprint);
            tasks.add(doc.task);
        });

        this.uniqueSprints = Array.from(sprints).sort();
        this.uniqueTasks = Array.from(tasks).sort();
    }

    get filteredDocuments(): DocumentConsolide[] {
        return this.documents.filter((doc) => {
            const searchLower = this.searchText.toLowerCase();
            const matchesSearch =
                !this.searchText ||
                doc.documentName.toLowerCase().includes(searchLower) ||
                (doc.activity || '').toLowerCase().includes(searchLower) ||
                doc.task.toLowerCase().includes(searchLower) ||
                doc.author.toLowerCase().includes(searchLower);

            const matchesSprint =
                this.selectedSprint === 'Tous' ||
                doc.sprint === this.selectedSprint;
            const matchesTask =
                this.selectedTask === 'Toutes' ||
                doc.task === this.selectedTask;

            return matchesSearch && matchesSprint && matchesTask;
        });
    }

    downloadDocument(doc: DocumentConsolide): void {
        const downloadUrl = `http://localhost:8087${doc.cheminFichier}`;
        window.open(downloadUrl, '_blank');
    }

    getFileIcon(fileType: string): string {
        const icons: { [key: string]: string } = {
            pdf: '📄',
            xlsx: '📊',
            docx: '📝',
            image: '🖼️',
        };
        return icons[fileType] || '📎';
    }

    getSprintDocumentCount(sprintName: string): number {
        return this.documents.filter((d) => d.sprint === sprintName).length;
    }

    getTaskDocumentCount(taskName: string): number {
        return this.documents.filter((d) => d.task === taskName).length;
    }

    getSafeActivity(doc: DocumentConsolide): string {
        return doc.activity || '';
    }

    isActivityLevel(doc: DocumentConsolide): boolean {
        return doc.task === 'Au niveau activité';
    }
}