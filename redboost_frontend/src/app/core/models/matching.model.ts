import { User } from './user.model';

export interface MatchResult {
    entrepreneurId: string;
    entrepreneur?: User;
    coachId: string;
    coach?: User;
    score: number;
    justification: string;
    pointsForts: string[];
    pointsVigilance: string[];
    createdAt: Date;
}
