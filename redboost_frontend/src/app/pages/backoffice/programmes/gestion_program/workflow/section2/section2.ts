import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RapportDataService } from '../rapport-data.service';
import { GlobalObjective, SpecificObjective, Resultat, KpiLightDTO } from '../../../../../../models/rapport.model';

@Component({
    selector: 'app-rapport-section2',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './section2.html',
    styleUrls: ['../rapport.component.scss'],
})
export class RapportSection2Component implements OnInit, OnChanges {
    @Input() globalObjectives: GlobalObjective[] = [];
    @Input() programmeId?: number;
    
    @Output() objectivesChange = new EventEmitter<GlobalObjective[]>();

    localObjectives: GlobalObjective[] = [];
    availableKpis: KpiLightDTO[] = [];
    kpiSelectionOpen: { [key: string]: boolean } = {};
    kpiSearchText: string = '';
    
    // Flag to prevent re-initialization on every change
    private isInitialized = false;

    constructor(private rapportDataService: RapportDataService) {}

    ngOnInit(): void {
        // Only initialize once on component creation
        if (this.globalObjectives && this.globalObjectives.length > 0) {
            this.localObjectives = JSON.parse(JSON.stringify(this.globalObjectives));
            this.isInitialized = true;
        } else {
            // Initialize with empty array if no objectives provided
            this.localObjectives = [];
            this.isInitialized = true;
        }
        
        // Subscribe to KPIs from the service
        this.rapportDataService.kpis$.subscribe(kpis => {
            this.availableKpis = kpis;
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Only update localObjectives if:
        // 1. Component is not yet initialized (first load)
        // 2. The change is from an external source (not from our own emitChanges)
        if (changes['globalObjectives'] && !this.isInitialized) {
            if (this.globalObjectives && this.globalObjectives.length > 0) {
                this.localObjectives = JSON.parse(JSON.stringify(this.globalObjectives));
                this.isInitialized = true;
            }
        }
    }

    emitChanges(): void {
        // Emit changes without triggering re-initialization
        this.objectivesChange.emit(this.localObjectives);
    }

    // Global Objectives
    addGlobalObjective(): void {
        this.localObjectives.push({
            nom: '',
            description: '',
            objectifsSpecifiques: [],
        });
        this.emitChanges();
    }

    removeGlobalObjective(index: number): void {
        this.localObjectives.splice(index, 1);
        this.emitChanges();
    }

    // Specific Objectives
    addSpecificObjective(globalIndex: number): void {
        const globalObj = this.localObjectives[globalIndex];
        if (!globalObj.objectifsSpecifiques) {
            globalObj.objectifsSpecifiques = [];
        }
        globalObj.objectifsSpecifiques.push({
            nom: '',
            description: '',
            kpiIds: [],
            kpis: [],
            resultats: [],
            resultatsTransversaux: [],
        });
        this.emitChanges();
    }

    removeSpecificObjective(globalIndex: number, specificIndex: number): void {
        this.localObjectives[globalIndex].objectifsSpecifiques.splice(specificIndex, 1);
        this.emitChanges();
    }

    // Resultats
    addResultat(globalIndex: number, specificIndex: number): void {
        const specificObj = this.localObjectives[globalIndex].objectifsSpecifiques[specificIndex];
        if (!specificObj.resultats) {
            specificObj.resultats = [];
        }
        specificObj.resultats.push({
            nom: '',
            description: '',
            kpiIds: [],
            kpis: [],
        });
        this.emitChanges();
    }

    removeResultat(globalIndex: number, specificIndex: number, resultatIndex: number): void {
        this.localObjectives[globalIndex].objectifsSpecifiques[specificIndex].resultats.splice(resultatIndex, 1);
        this.emitChanges();
    }

    addResultatTransversal(globalIndex: number, specificIndex: number): void {
        const specificObj = this.localObjectives[globalIndex].objectifsSpecifiques[specificIndex];
        if (!specificObj.resultatsTransversaux) {
            specificObj.resultatsTransversaux = [];
        }
        specificObj.resultatsTransversaux.push({
            nom: '',
            description: '',
            kpiIds: [],
            kpis: [],
        });
        this.emitChanges();
    }

    removeResultatTransversal(globalIndex: number, specificIndex: number, resultatIndex: number): void {
        this.localObjectives[globalIndex].objectifsSpecifiques[specificIndex].resultatsTransversaux.splice(resultatIndex, 1);
        this.emitChanges();
    }

    // KPI Management
    getKpiSelectionKey(
        globalIndex: number,
        specificIndex: number,
        type: 'direct' | 'resultat' | 'resultat-transversal' = 'direct',
        resultatIndex?: number
    ): string {
        if (type === 'resultat' && resultatIndex !== undefined) {
            return `${globalIndex}-${specificIndex}-r${resultatIndex}`;
        }
        if (type === 'resultat-transversal' && resultatIndex !== undefined) {
            return `${globalIndex}-${specificIndex}-rt${resultatIndex}`;
        }
        return `${globalIndex}-${specificIndex}`;
    }

    toggleKpiSelection(
        globalIndex: number,
        specificIndex: number,
        type: 'direct' | 'resultat' | 'resultat-transversal' = 'direct',
        resultatIndex?: number
    ): void {
        const key = this.getKpiSelectionKey(globalIndex, specificIndex, type, resultatIndex);
        this.kpiSelectionOpen[key] = !this.kpiSelectionOpen[key];
        if (this.kpiSelectionOpen[key]) {
            this.kpiSearchText = '';
        }
    }

    isKpiSelectionOpen(
        globalIndex: number,
        specificIndex: number,
        type: 'direct' | 'resultat' | 'resultat-transversal' = 'direct',
        resultatIndex?: number
    ): boolean {
        const key = this.getKpiSelectionKey(globalIndex, specificIndex, type, resultatIndex);
        return this.kpiSelectionOpen[key] || false;
    }

    isKpiSelected(
        globalIndex: number,
        specificIndex: number,
        kpiId: number,
        type: 'direct' | 'resultat' | 'resultat-transversal' = 'direct',
        resultatIndex?: number
    ): boolean {
        const specificObj = this.localObjectives[globalIndex].objectifsSpecifiques[specificIndex];

        if (type === 'resultat' && resultatIndex !== undefined) {
            const resultat = specificObj.resultats[resultatIndex];
            return resultat.kpiIds?.includes(kpiId) || false;
        } else if (type === 'resultat-transversal' && resultatIndex !== undefined) {
            const resultat = specificObj.resultatsTransversaux[resultatIndex];
            return resultat.kpiIds?.includes(kpiId) || false;
        } else {
            return specificObj.kpiIds?.includes(kpiId) || false;
        }
    }

    toggleKpiForObjective(
        globalIndex: number,
        specificIndex: number,
        kpiId: number,
        type: 'direct' | 'resultat' | 'resultat-transversal' = 'direct',
        resultatIndex?: number
    ): void {
        const specificObj = this.localObjectives[globalIndex].objectifsSpecifiques[specificIndex];

        if (type === 'resultat' && resultatIndex !== undefined) {
            const resultat = specificObj.resultats[resultatIndex];
            if (!resultat.kpiIds) resultat.kpiIds = [];
            
            const index = resultat.kpiIds.indexOf(kpiId);
            if (index > -1) {
                resultat.kpiIds.splice(index, 1);
            } else {
                resultat.kpiIds.push(kpiId);
            }
            this.updateSelectedKpisDisplay(resultat);
        } else if (type === 'resultat-transversal' && resultatIndex !== undefined) {
            const resultat = specificObj.resultatsTransversaux[resultatIndex];
            if (!resultat.kpiIds) resultat.kpiIds = [];
            
            const index = resultat.kpiIds.indexOf(kpiId);
            if (index > -1) {
                resultat.kpiIds.splice(index, 1);
            } else {
                resultat.kpiIds.push(kpiId);
            }
            this.updateSelectedKpisDisplay(resultat);
        } else {
            if (!specificObj.kpiIds) specificObj.kpiIds = [];
            
            const index = specificObj.kpiIds.indexOf(kpiId);
            if (index > -1) {
                specificObj.kpiIds.splice(index, 1);
            } else {
                specificObj.kpiIds.push(kpiId);
            }
            this.updateSelectedKpisDisplay(specificObj);
        }

        this.emitChanges();
    }

    private updateSelectedKpisDisplay(target: SpecificObjective | Resultat): void {
        if (!target.kpiIds || target.kpiIds.length === 0) {
            target.kpis = [];
            return;
        }
        target.kpis = this.availableKpis.filter(kpi => target.kpiIds!.includes(kpi.id));
    }

    getFilteredKpis(): KpiLightDTO[] {
        if (!this.kpiSearchText) {
            return this.availableKpis;
        }

        const searchLower = this.kpiSearchText.toLowerCase();
        return this.availableKpis.filter(
            kpi =>
                kpi.nom.toLowerCase().includes(searchLower) ||
                kpi.description?.toLowerCase().includes(searchLower) ||
                kpi.uniteMesure?.toLowerCase().includes(searchLower)
        );
    }

    closeKpiSelection(
        globalIndex: number,
        specificIndex: number,
        type: 'direct' | 'resultat' | 'resultat-transversal' = 'direct',
        resultatIndex?: number
    ): void {
        const key = this.getKpiSelectionKey(globalIndex, specificIndex, type, resultatIndex);
        this.kpiSelectionOpen[key] = false;
        this.kpiSearchText = '';
    }
}