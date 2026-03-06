// src/app/models/backoffice.models.ts

export interface BackofficeCategory {
    id: number;
    nom: string;
    description: string | null;
    couleur: string | null;
    kpis: BackofficeKpi[];
}

export interface BackofficeKpi {
    id: number;
    nom: string;
    description: string | null;
    uniteMesure: string;
    typesuivi: 'ENTREPRENEUR' | 'OPERATIONNEL';
    type: 'GLOBAL' | 'OPTIONNEL' | null;
    typedesaisie?: 'progression' | 'normal' | null;  // ← NEW
    category?: BackofficeCategory;
}

export interface BackofficeCategoryRequest {
    nom: string;
    description: string | null;
    couleur: string | null;
}

export interface BackofficeKpiRequest {
    nom: string;
    description: string | null;
    uniteMesure: string;
    type: 'GLOBAL' | 'OPTIONNEL'; // ← obligatoire à l'envoi
    typesuivi: 'ENTREPRENEUR' | 'OPERATIONNEL'; // ← Add this
    typedesaisie?: 'progression' | 'normal';  // ← NEW (optional for now, can make required later)
}
