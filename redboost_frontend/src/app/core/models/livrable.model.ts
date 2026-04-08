import { User } from './user.model';

export type LivrableStatus = 'EN_ATTENTE' | 'SOUMIS' | 'VALIDE' | 'REJETE' | 'PENDING_REVIEW' | 'PENDING' | 'APPROVED' | 'ACCEPTED' | 'REVISION' | 'RESUBMITTED' | 'REJECTED' | 'SUBMITTED';

export interface Livrable {
    id: string;
    titre: string;
    type?: string;
    description?: string;
    fichierUrl?: string;
    statut: LivrableStatus;
    dateSoumission: string | Date;
    entrepreneurId: string;
    entrepreneurName?: string;
    entrepreneur?: User;
    programmeId: string;
    programmeName?: string;
    coachName?: string;
    coachEmail?: string;
    tacheId?: string;
    commentaire?: string;
    coachComment?: string;
    validatedAt?: string;
    fileSize?: string;
    fileName?: string;
    isNew?: boolean;
    status?: string;     // alias for template usage
    submittedAt?: string;
    createdAt?: Date;
}
