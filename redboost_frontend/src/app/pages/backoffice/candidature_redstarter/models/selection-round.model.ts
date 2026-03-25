export interface SelectionRound {
    id: string;
    programme: { id: string; nom: string; description?: string };
    roundNumber: number;
    mutable: boolean;
    createdAt: string;
}

export interface SelectionRoundCandidature {
    id: string;
    selectionRound: SelectionRound;
    candidature: any;
    statutSnapshot: string;
    note: string;
    updatedAt: string;
}
