import { User } from './user.model';

export type ProgrammeStatus = 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'SUSPENDED';
export type ProgrammeTheme =
    'bordeaux-teal' | 'rouge-bordeaux' | 'teal' |
    'rouge-teal' | 'vert' | 'orange-rouge';

export interface Programme {
    id: string;
    nom: string;
    type: string;
    description?: string;
    dateDebut: Date;
    dateFin: Date;
    annee: number;
    statut: ProgrammeStatus;
    theme: ProgrammeTheme;
    logo?: string;
    responsable?: string;
    secteurs: string[];
    nbBeneficiaires: number;
    coaches: User[];
    entrepreneurs: User[];
    createdAt: Date;
    updatedAt: Date;
}
