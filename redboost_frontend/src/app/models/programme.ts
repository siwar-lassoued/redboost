// src/app/models/programme.ts

export interface Programme {
    id?: number;
    nom: string;
    annee: number;
    typeProgramme: string;
    nombreBeneficiaires?: number;
    dateDebut: string;
    dateFin: string;
    responsableId?: number;
    statut: 'NON_DEMARREE' | 'EN_COURS' | 'EN_RETARD' | 'COMPLETE';
    secteurs?: Secteur[];
    description?: string;
    couleurTheme: string;
    logoUrl?: string;
    sprints?: Sprint[];
}

export interface Secteur {
    id?: number;
    nom: string;
}

// ==================== DOCUMENT INTERFACE ====================
export interface DocumentDTO {
    id: number;
    nom: string;
    cheminFichier: string;
    typeFichier: string;
    tailleFichier: number;
    dateUpload: string;
    uploadedById?: number;
    uploadedByName?: string;
}

// ==================== KPI INTERFACES ====================
export interface KpiWithCategory {
    id: number;
    nom: string;
    description?: string;
    uniteMesure: string;
    objectif?: string;
    type?: string;
    categoryId?: number;
    categoryNom: string;
    categoryCouleur?: string;
}

// ==================== SPRINT ====================
export interface Sprint {
    id?: number;
    nom: string;
    description?: string;
    dateDebut: string;
    dateLimite: string;
    status: 'NON_DEMARREE' | 'EN_COURS' | 'BLOQUE' | 'EN_RETARD' | 'TERMINEE';
    programmeId?: number;
    activites?: Activite[];
    documents?: DocumentDTO[];
}

// ==================== ACTIVITÉ ====================
export interface Activite {
    id?: number;
    nom: string;
    description?: string;
    objectif?: string; // NEW
    methodologie?: string; // NEW
    resultatAttendu?: string; // NEW
    type:string;
    dateDebut: string;
    dateLimite: string;
    status: 'NON_DEMARREE' | 'EN_COURS' | 'BLOQUE' | 'EN_RETARD' | 'TERMINEE';
    responsableId?: number;
    sprintId?: number;
    taches?: Tache[];
    kpis?: KpiWithCategory[];
    documents?: DocumentDTO[];
}

// ==================== TÂCHE ====================
export interface Tache {
    id?: number;
    titre: string;
    description?: string;
    responsableId?: number;
    priorite: 'Haute' | 'Moyenne' | 'Basse';
    dateDebut?: string;
    dateLimite?: string;
    difficulte: string;
    status: 'NON_DEMARREE' | 'EN_COURS' | 'BLOQUE' | 'EN_RETARD' | 'TERMINEE';
    activiteId?: number;
    kpis?: KpiWithCategory[];
    documents?: DocumentDTO[]; // NEW: Added documents support
}

// Types utilitaires
export type PrioriteTache = 'Haute' | 'Moyenne' | 'Basse';
export type StatusTache =
    | 'NON_DEMARREE'
    | 'EN_COURS'
    | 'BLOQUE'
    | 'EN_RETARD'
    | 'TERMINEE';
