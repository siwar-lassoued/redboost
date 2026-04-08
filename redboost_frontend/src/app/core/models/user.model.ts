export type UserRole = 'ADMIN' | 'COACH' | 'ENTREPRENEUR';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface User {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    avatar?: string;
    telephone?: string;
    photoUrl?: string;

    // Rich info
    startup?: string;
    startupName?: string;
    coachName?: string;
    sector?: string;
    secteur?: string;
    specialite?: string;
    expertise?: string[];
    entrepreneursCount?: number;
    calendlyUrl?: string;
    fcmToken?: string;
    actif?: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export interface AuthUser extends User {
    token: string;
    refreshToken: string;
}
