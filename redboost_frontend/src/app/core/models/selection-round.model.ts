export interface Programme {
    id: string;
    nom: string;
    description?: string;
}

export interface SelectionRound {
    id: string;
    programme: Programme;
    roundNumber: number;
    mutable: boolean; // isMutable maps to mutable in standard jackson serialization
    createdAt: string;
}

export interface SelectionRoundCandidature {
    id: string;
    selectionRound: SelectionRound;
    candidature: any; // Using any or Candidature import to avoid circular dependency
    statutSnapshot: string;
    note: string;
    updatedAt: string;
}
