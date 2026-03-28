export const STATUS_CONFIG = {
    candidature: {
        EN_ATTENTE:          { bg: '#E5E7EB', color: '#374151', label: 'En attente' },
        EN_COURS_EVALUATION: { bg: '#FEF3C7', color: '#D97706', label: 'En évaluation' },
        PRE_SELECTIONNE:      { bg: '#E0E7FF', color: '#4F46E5', label: 'Présélectionné' },
        ACCEPTE:             { bg: '#D1FAE5', color: '#059669', label: 'Accepté' },
        REJETE:              { bg: '#FEE2E2', color: '#DC2626', label: 'Rejeté' },
    },
} as const;
