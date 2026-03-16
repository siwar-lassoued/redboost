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
        resultatsTransversaux: [],   // ✅ added
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

    // ── Global-level Résultats Transversaux ────────────────────────────────────

addResultatTransversal(globalIndex: number): void {
    const globalObj = this.localObjectives[globalIndex];
    if (!globalObj.resultatsTransversaux) {
        globalObj.resultatsTransversaux = [];
    }
    globalObj.resultatsTransversaux.push({
        nom: '',
        description: '',
        kpiIds: [],
        kpis: [],
    });
    this.emitChanges();
}

removeResultatTransversal(globalIndex: number, resultatIndex: number): void {
    this.localObjectives[globalIndex].resultatsTransversaux?.splice(resultatIndex, 1);
    this.emitChanges();
}

// KPI helpers — dedicated to global-level résultats transversaux
// Key format: "g{globalIndex}-rt{resultatIndex}"
private getGlobalRtKey(globalIndex: number, rti: number): string {
    return `g${globalIndex}-rt${rti}`;
}

toggleGlobalRtKpiSelection(globalIndex: number, rti: number): void {
    const key = this.getGlobalRtKey(globalIndex, rti);
    this.kpiSelectionOpen[key] = !this.kpiSelectionOpen[key];
    if (this.kpiSelectionOpen[key]) this.kpiSearchText = '';
}

isGlobalRtKpiSelectionOpen(globalIndex: number, rti: number): boolean {
    return this.kpiSelectionOpen[this.getGlobalRtKey(globalIndex, rti)] || false;
}

closeGlobalRtKpiSelection(globalIndex: number, rti: number): void {
    this.kpiSelectionOpen[this.getGlobalRtKey(globalIndex, rti)] = false;
    this.kpiSearchText = '';
}

isGlobalRtKpiSelected(globalIndex: number, kpiId: number, rti: number): boolean {
    const resultat = this.localObjectives[globalIndex].resultatsTransversaux?.[rti];
    return resultat?.kpiIds?.includes(kpiId) || false;
}

toggleGlobalRtKpi(globalIndex: number, kpiId: number, rti: number): void {
    const resultat = this.localObjectives[globalIndex].resultatsTransversaux?.[rti];
    if (!resultat) return;

    const idx = resultat.kpiIds.indexOf(kpiId);
    if (idx > -1) {
        resultat.kpiIds.splice(idx, 1);
    } else {
        resultat.kpiIds.push(kpiId);
    }
    this.updateSelectedKpisDisplay(resultat);
    this.emitChanges();
}

    // KPI Management
    getKpiSelectionKey(
    globalIndex: number,
    specificIndex: number,
    type: 'direct' | 'resultat' = 'direct',
    resultatIndex?: number
): string {
    if (type === 'resultat' && resultatIndex !== undefined) {
        return `${globalIndex}-${specificIndex}-r${resultatIndex}`;
    }
    return `${globalIndex}-${specificIndex}`;
}

    toggleKpiSelection(
        globalIndex: number,
        specificIndex: number,
        type: 'direct' | 'resultat' = 'direct',
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
        type: 'direct' | 'resultat' = 'direct',
        resultatIndex?: number
    ): boolean {
        const key = this.getKpiSelectionKey(globalIndex, specificIndex, type, resultatIndex);
        return this.kpiSelectionOpen[key] || false;
    }

 isKpiSelected(
    globalIndex: number,
    specificIndex: number,
    kpiId: number,
    type: 'direct' | 'resultat' = 'direct',
    resultatIndex?: number
): boolean {
    const specificObj = this.localObjectives[globalIndex].objectifsSpecifiques[specificIndex];

    if (type === 'resultat' && resultatIndex !== undefined) {
        return specificObj.resultats[resultatIndex].kpiIds?.includes(kpiId) || false;
    }
    return specificObj.kpiIds?.includes(kpiId) || false;
}


toggleKpiForObjective(
    globalIndex: number,
    specificIndex: number,
    kpiId: number,
    type: 'direct' | 'resultat' = 'direct',
    resultatIndex?: number
): void {
    const specificObj = this.localObjectives[globalIndex].objectifsSpecifiques[specificIndex];

    if (type === 'resultat' && resultatIndex !== undefined) {
        const resultat = specificObj.resultats[resultatIndex];
        if (!resultat.kpiIds) resultat.kpiIds = [];
        const index = resultat.kpiIds.indexOf(kpiId);
        if (index > -1) { resultat.kpiIds.splice(index, 1); }
        else             { resultat.kpiIds.push(kpiId); }
        this.updateSelectedKpisDisplay(resultat);
    } else {
        if (!specificObj.kpiIds) specificObj.kpiIds = [];
        const index = specificObj.kpiIds.indexOf(kpiId);
        if (index > -1) { specificObj.kpiIds.splice(index, 1); }
        else             { specificObj.kpiIds.push(kpiId); }
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
        type: 'direct' | 'resultat' = 'direct',
        resultatIndex?: number
    ): void {
        const key = this.getKpiSelectionKey(globalIndex, specificIndex, type, resultatIndex);
        this.kpiSelectionOpen[key] = false;
        this.kpiSearchText = '';
    }
}