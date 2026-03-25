export const STATUS_CONFIG = {
    candidature: {
        EN_ATTENTE:     { bg: '#FFF3E0', color: '#FF6F00', label: 'En attente' },
        EN_REVISION:    { bg: '#E3F2FD', color: '#1565C0', label: 'En révision' },
        ENTRETIEN:      { bg: '#E8F6FF', color: '#3aafff', label: 'Entretien' },
        PRESELECTIONNE: { bg: '#F0EBFF', color: '#a17dfd', label: 'Présélectionné' },
        ACCEPTE:        { bg: '#D1FAE5', color: '#065F46', label: 'Accepté' },
        REJETE:         { bg: '#ffe0ef', color: '#C0392B', label: 'Rejeté' },
    },
} as const;
