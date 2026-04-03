export const PROGRAMME_THEMES: Record<string, string> = {
    'bordeaux-teal': 'linear-gradient(135deg, #ff3d91 0%, #C0392B 100%)',
    'rouge-bordeaux': 'linear-gradient(135deg, #4a1030 0%, #2d1b3d 100%)',
    'teal': 'linear-gradient(135deg, #1A3A3A 0%, #2d6a7a 100%)',
    'rouge-teal': 'linear-gradient(135deg, #ff3d91 0%, #1A3A3A 100%)',
    'vert': 'linear-gradient(135deg, #065f46 0%, #3aafff 100%)',
    'orange-rouge': 'linear-gradient(135deg, #FF6F00 0%, #C0392B 100%)',
};

export const EVENEMENT_COLORS: Record<string, string> = {
    ATELIER: '#1A3A3A',
    CELEBRATION: '#a17dfd',
    COACHING_INDIVIDUEL: '#374151',
    FORMATION: '#1A3A3A',
    NETWORKING: '#3aafff',
    PITCH_DECK: '#ff3d91',
    PRESENTATION: '#FF6F00',
};

export const EVENEMENT_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
    ATELIER: { bg: '#e8f6ff', color: '#3aafff' },
    CELEBRATION: { bg: '#f0ebff', color: '#a17dfd' },
    COACHING_INDIVIDUEL: { bg: '#f0f2f5', color: '#374151' },
    FORMATION: { bg: 'rgba(26,58,58,0.08)', color: '#1A3A3A' },
    NETWORKING: { bg: '#e8f6ff', color: '#3aafff' },
    PITCH_DECK: { bg: '#fff0f5', color: '#ff3d91' },
    PRESENTATION: { bg: '#fff3e0', color: '#FF6F00' },
};

export const STATUS_CONFIG = {
    programme: {
        ACTIVE: { bg: '#1A3A3A', color: '#FFFFFF', label: 'En cours' },
        DRAFT: { bg: '#374151', color: '#FFFFFF', label: 'Planifié' },
        COMPLETED: { bg: '#065f46', color: '#FFFFFF', label: 'Terminé' },
        SUSPENDED: { bg: '#C0392B', color: '#FFFFFF', label: 'Suspendu' },
        // Fixed statuses
        PLANIFIE: { bg: '#374151', color: '#FFFFFF', label: 'Planifié' },
        EN_COURS: { bg: '#1A3A3A', color: '#FFFFFF', label: 'En cours' },
        TERMINE: { bg: '#065f46', color: '#FFFFFF', label: 'Terminé' },
        ANNULE: { bg: '#C0392B', color: '#FFFFFF', label: 'Annulé' },
    },
    candidature: {
        EN_ATTENTE:     { bg: '#FFF3E0', color: '#FF6F00', label: 'En attente' },
        EN_REVISION:    { bg: '#E3F2FD', color: '#1565C0', label: 'En révision' },
        ENTRETIEN:      { bg: '#E8F6FF', color: '#3aafff', label: 'Entretien' },
        PRESELECTIONNE: { bg: '#F0EBFF', color: '#a17dfd', label: 'Présélectionné' },
        ACCEPTE:        { bg: '#D1FAE5', color: '#065F46', label: 'Accepté' },
        REJETE:         { bg: '#ffe0ef', color: '#C0392B', label: 'Rejeté' },
    },
    tache: {
        A_FAIRE: { bg: 'var(--muted)', color: 'var(--foreground)', label: 'À faire' },
        EN_COURS: { bg: 'var(--rb-cyan-light)', color: 'var(--rb-cyan-dark)', label: 'En cours' },
        TERMINEE: { bg: 'var(--success-bg)', color: 'var(--success-text)', label: 'Terminée' },
        EN_RETARD: { bg: 'var(--destructive-bg)', color: 'var(--destructive)', label: 'En retard' },
    },
    livrable: {
        EN_ATTENTE: { bg: 'var(--rb-orange-light)', color: 'var(--rb-orange)', label: 'En attente' },
        SOUMIS: { bg: 'var(--rb-cyan-light)', color: 'var(--rb-cyan-dark)', label: 'Soumis' },
        VALIDE: { bg: 'var(--success-bg)', color: 'var(--success-text)', label: 'Validé' },
        REJETE: { bg: 'var(--destructive-bg)', color: 'var(--destructive)', label: 'Rejeté' },
    },
    user: {
        ACTIVE: { bg: 'var(--success-bg)', color: 'var(--success-text)', label: 'Actif' },
        PENDING: { bg: 'var(--rb-orange-light)', color: 'var(--rb-orange)', label: 'En attente' },
        SUSPENDED: { bg: 'var(--destructive-bg)', color: 'var(--destructive)', label: 'Suspendu' },
    },
    session: {
        PLANIFIEE: { bg: 'var(--rb-cyan-light)', color: 'var(--rb-cyan-dark)', label: 'Planifiée' },
        REALISEE: { bg: 'var(--success-bg)', color: 'var(--success-text)', label: 'Réalisée' },
        ANNULEE: { bg: 'var(--destructive-bg)', color: 'var(--destructive)', label: 'Annulée' },
    },
} as const;

export const STEP_COLORS: string[] = [
    '#8a8a8a', '#3aafff', '#a17dfd', '#FF6F00', '#065f46', '#C0392B',
];

export const PRIORITY_CONFIG = {
    BASSE: { bg: '#f0f2f5', color: '#374151', label: 'Basse' },
    MOYENNE: { bg: '#fff3e0', color: '#FF6F00', label: 'Moyenne' },
    HAUTE: { bg: '#fff0f5', color: '#ff3d91', label: 'Haute' },
    CRITIQUE: { bg: '#ffe0ef', color: '#C0392B', label: 'Critique' },
} as const;
