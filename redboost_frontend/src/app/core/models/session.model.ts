import { User } from './user.model';

export type SessionType = 'INDIVIDUELLE' | 'GROUPE' | 'WORKSHOP';
export type SessionStatus = 'PLANIFIEE' | 'REALISEE' | 'ANNULEE';

export interface Session {
    id: string;
    titre: string;
    type: SessionType;
    statut: SessionStatus;
    date: Date;
    duree: number;
    lieu?: string;
    lienVisio?: string;
    programmeId: string;
    coachId: string;
    coach?: User;
    participants?: User[];
    notes?: string;
    createdAt?: Date;
    disponibiliteId?: string;
    thematiqueName?: string;
    isExceptionnelle?: boolean;
    programme?: { id: number; nom: string };
}
