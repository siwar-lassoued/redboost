export type RatingStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export interface CoachRating {
    id: string;
    coachId: string;
    coachName: string;
    coachAvatar: string;
    entrepreneurId?: string;
    entrepreneurName: string;
    entrepreneurAvatar: string;
    program: string;
    globalRating: number;
    communication: number;
    expertise: number;
    availability: number;
    comment?: string;
    commentaire?: string;
    sessionId?: string;
    submittedAt: string;
    status: RatingStatus;
    anonymous: boolean;
    duration: string;
}

export interface CoachStats {
    id: string;
    name: string;
    email: string;
    avatar: string;
    count: number;
    avg: number;
    avgComm: number;
    avgExp: number;
    avgDispo: number;
    programs: string[];
}
