// models/entrepreneur.models.ts

export interface Programme {
    id: number;
    name: string;
    checked?: boolean;
}

export interface Entrepreneur {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    entreprise?: string;
    secteur?: string;
    region?: string;
    role: string;
    programmes?: number[];
}

export interface KpiHistory {
    valeurActuelle: string | null;
    valeurPrecedente: string | null;
    valeurCible: string | null;
    changedAt: string;
}

export interface KpiDetail {
    kpiId: number;
    nom: string;
    uniteMesure: string;
    objectif: string | null;        // legacy field (may be null)
    currentValue: string | null;    // legacy field (may be null)
    typesaisie: 'normal' | 'progression';
    valeurPrecedente: string | null;
    valeurActuelle: string | null;
    valeurCible: string | null;
    history: KpiHistory[];
    showHistory?: boolean;
}

export interface ProgrammeDetail {
    id: number;
    nom: string;
    description: string;
    kpis: KpiDetail[];
    expanded?: boolean;
}

export interface EntrepreneurDetail {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    entreprise: string | null;
    secteur: string | null;
    region: string;
    programs: ProgrammeDetail[];
    expanded?: boolean;
}

export interface KpiItem {
    id: number;
    nom: string;
    description: string;
    uniteMesure: string;
    typesuivi?: string;
}

export interface CategoryResponse {
    id: number;
    name: string;
    description: string;
    kpis: KpiItem[];
}