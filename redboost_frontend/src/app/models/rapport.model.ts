export interface Resultat {
    id?: number;
    nom: string;
    description: string;
    kpiIds: number[];
    kpis?: KpiLightDTO[];
}

export interface SpecificObjective {
    id?: number;
    nom: string;
    description: string;
    kpiIds: number[];
    kpis?: KpiLightDTO[];
    resultats: Resultat[];
}

export interface GlobalObjective {
    id?: number;
    nom: string;
    description: string;
    objectifsSpecifiques: SpecificObjective[];
    resultatsTransversaux?: Resultat[];   // ✅ moved here from SpecificObjective

}

export interface KpiLightDTO {
    id: number;
    nom: string;
    description: string;
    uniteMesure: string;
    valeurCible?: number;
    valeurActuelle?: number;
    valeur?: number;
}

export interface Recommendation {
    id: string;
    content: string;
}

export interface DocumentConsolide {
    sprint: string;
    activity: string | null;
    task: string;
    documentName: string;
    author: string;
    date: string;
    fileType: string;
    cheminFichier: string;
    documentId: number;
    niveau: string;
}

export interface RapportDTO {
    id?: number;
    programmeId: number;
    programmeName?: string;
    objectifsProgramme: string;
    resultatsCles: string;
    impactGlobal: string;
    objectifsGlobaux: GlobalObjective[];
    sprintIds: number[];
    conclusionRecommandations: string;
    dateCreation?: string;
    dateModification?: string;
    creePar?: string;
    modifiePar?: string;
}

export interface SprintDetail {
    id: number;
    nom: string;
    description: string;
    dateDebut: string;
    dateFin: string;
    activites?: ActivityDetail[];
    nombreActivites?: number;
}

export interface ActivityDetail {
    id: number;
    nom: string;
    description: string;
    methodologie?: string;
    objectif?: string;
    resultatAttendu?: string;
    status: string;
    taches?: TaskDetail[];
    kpis?: KpiLightDTO[];
}

export interface TaskDetail {
    id: number;
    titre: string;
    description: string;
    status: string;
    dateLimite: string;
}