export type CandidatureStatus =
    | 'EN_ATTENTE'
    | 'EN_COURS_EVALUATION'
    | 'PRE_SELECTIONNE'
    | 'ACCEPTE'
    | 'REJETE';

export interface CandidatureStep {
    id: string;
    statut: CandidatureStatus;
    date: string | Date;
    auteur: string;
    commentaire?: string;
    metadata?: {
        programmeAssignee?: string;
        lienEntretien?: string;
        motifRejet?: string;
        roundActuel?: string;
    };
}

export interface FormAnswer {
    questionId: number;
    question: string;
    type: 'text-court' | 'text-long' | 'qcm' | 'qcu' | 'upload';
    answer: string | string[] | { name: string; size: string };
}

export interface Candidature {
    id: string;
    type: 'coaches' | 'entrepreneurs' | 'spontanees';
    nom: string;
    email: string;
    phone: string;
    statut: CandidatureStatus;
    submittedAt: string | Date;
    programme: string | null;
    round: string | number;
    history: CandidatureStep[];
    documents: { name: string; size: string }[];
    formAnswers: FormAnswer[];
    noteInterne?: string | null;
    motifRejet?: string | null;
    dateEntretien?: string | null;
    compteRenduEntretien?: string | null;
    noteEntretien?: number | null;
    dateAcceptation?: string | null;
    cvUrl?: string | null;
    lettreUrl?: string | null;
}

export interface FormQuestion {
    id: number;
    text: string;
    type: 'text-court' | 'text-long' | 'qcm' | 'qcu' | 'upload';
    options?: string[];
    required?: boolean;
}

export interface FormTemplate {
    id: string | number;
    title: string;
    description: string;
    profileType: 'coach' | 'entrepreneur';
    sectors: string[];
    program: string;
    questions: FormQuestion[];
    createdAt: string;
}

export const CANDIDATURE_STATUTS: CandidatureStatus[] = [
    'EN_ATTENTE', 'EN_COURS_EVALUATION', 'PRE_SELECTIONNE', 'ACCEPTE', 'REJETE',
];
