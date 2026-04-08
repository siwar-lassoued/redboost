import { Programme } from './programme.model';
import { User } from './user.model';

export type EvenementType =
    'ATELIER' | 'CELEBRATION' | 'COACHING_INDIVIDUEL' |
    'FORMATION' | 'NETWORKING' | 'PITCH_DECK' |
    'PRESENTATION';

export interface Evenement {
    id: string;
    titre: string;
    type: EvenementType;
    date: Date;
    heure: string;
    duree?: number;
    lieu?: string;
    lienVisio?: string;
    programmeId: string;
    programme?: Programme;
    invites: User[];
    description?: string;
    createdAt: Date;
}
