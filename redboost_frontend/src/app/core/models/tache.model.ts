import { User } from './user.model';

export type TacheStatus = 'A_FAIRE' | 'EN_COURS' | 'TERMINEE' | 'EN_RETARD' | 'EN_ATTENTE_VALIDATION';
export type TachePriority = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';

export interface Tache {
    id: string;
    titre: string;
    title: string;       // alias used by components
    description?: string;
    statut: TacheStatus;
    priorite: TachePriority;
    dateEcheance: Date;
    deadline: string;     // formatted date string
    programmeId: string;
    assigneA?: string;
    assigneUser?: User;
    etape?: number;
    risk: string;          // HAUTE, MOYENNE, BASSE, CRITIQUE
    sprint: string;        // e.g. "Sprint 3"
    completionProb: number; // 0-100
    createdAt: Date;
    updatedAt: Date;
}
