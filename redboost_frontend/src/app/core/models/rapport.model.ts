export type PeriodType = 'libre' | 'hebdo' | 'mois' | 'sprint';

export interface RapportAlerte {
    type: string;
    message: string;
}

export interface Rapport {
    id: string;
    programme: any;
    periodType: PeriodType;
    periodLabel: string;
    dateDebut: string;
    dateFin: string;
    dateGeneration: string;
    totalSessions: number;
    sessionsCompleted: number;
    totalTaches: number;
    tachesCompleted: number;
    totalLivrables: number;
    livrablesApproved: number;
    averageRating: number;
    generatedBy: string;
    resumeExecutif: string;
    kpisJson: string; // JSON array of strings
    alertesJson: string; // JSON array of RapportAlerte
    recommandationsJson: string; // JSON array of strings
    analyseLivrables: string;
    tendances: string;

    // Legacy / Coaching Session fields (Restored for build)
    sessionNum?: number;
    date?: string;
    coachName?: string;
    rating?: number;
    summary?: string;
    tasks?: string[];
    generatedAt?: string; // Alias for dateGeneration used in older templates
}
