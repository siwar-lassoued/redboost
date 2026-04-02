// ai-reporting.model.ts

export type AiPeriodType = 'LIBRE' | 'HEBDO' | 'MOIS' | 'SPRINT' | 'CUSTOM';

export interface AlertInfo {
    type: string;
    message: string;
}

export interface AiReporting {
    id: number;
    programme: any; // Mapped dynamically
    periodType: AiPeriodType;
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
    
    // AI parsed Outputs
    resumeExecutif: string;
    kpisJson: string; // Serialized JSON string array
    alertesJson: string; // Serialized JSON string array
    recommandationsJson: string; // Serialized JSON string array
    analyseLivrables: string;
    tendances: string;
}

export interface GenerateReportRequest {
    programmeId: number;
    dateDebut: string;
    dateFin: string;
    periodType: AiPeriodType;
}
