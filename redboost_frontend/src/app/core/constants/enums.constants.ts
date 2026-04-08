import { UserRole } from '../models/user.model';
import { ProgrammeStatus } from '../models/programme.model';
import { TacheStatus, TachePriority } from '../models/tache.model';
import { SessionType, SessionStatus } from '../models/session.model';
import { LivrableStatus } from '../models/livrable.model';
import { CandidatureStatus } from '../models/candidature.model';
import { EvenementType } from '../models/evenement.model';

export const USER_ROLES: UserRole[] = ['ADMIN', 'COACH', 'ENTREPRENEUR'];

export const PROGRAMME_STATUTS: ProgrammeStatus[] = [
    'ACTIVE', 'DRAFT', 'COMPLETED', 'SUSPENDED',
];

export const TACHE_STATUTS: TacheStatus[] = [
    'A_FAIRE', 'EN_COURS', 'TERMINEE', 'EN_RETARD',
];

export const TACHE_PRIORITES: TachePriority[] = [
    'BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE',
];

export const SESSION_TYPES: SessionType[] = [
    'INDIVIDUELLE', 'GROUPE', 'WORKSHOP',
];

export const SESSION_STATUTS: SessionStatus[] = [
    'PLANIFIEE', 'REALISEE', 'ANNULEE',
];

export const LIVRABLE_STATUTS: LivrableStatus[] = [
    'EN_ATTENTE', 'SOUMIS', 'VALIDE', 'REJETE',
];

export const CANDIDATURE_STATUTS: CandidatureStatus[] = [
    'EN_ATTENTE', 'EN_REVISION', 'ENTRETIEN', 'PRESELECTIONNE', 'ACCEPTE', 'REJETE',
];

export const EVENEMENT_TYPES: EvenementType[] = [
    'ATELIER', 'CELEBRATION', 'COACHING_INDIVIDUEL',
    'FORMATION', 'NETWORKING', 'PITCH_DECK', 'PRESENTATION',
];

export const PROGRAMME_TYPES: string[] = [
    'Bootcamp', 'Incubation', 'Accélération', 'Mentorat', 'Formation',
];

export const SECTEURS_ACTIVITE: string[] = [
    'Agriculture', 'Artisanat', 'Commerce', 'Digital', 'Education',
    'Energie', 'Finance', 'Industrie', 'Santé', 'Services', 'Tourisme', 'Transport',
];

export const YEARS: number[] = [2022, 2023, 2024, 2025, 2026, 2027];
