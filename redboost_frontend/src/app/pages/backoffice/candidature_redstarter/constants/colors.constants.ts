export const STATUS_CONFIG = {
    candidature: {
        EN_ATTENTE:          { bg: '#E5E7EB', color: '#374151', label: 'En attente' },
        EN_REVISION:         { bg: '#FEF3C7', color: '#D97706', label: 'En révision' },
        EN_COURS_EVALUATION: { bg: '#FEF3C7', color: '#D97706', label: 'En évaluation' },
        ENTRETIEN:           { bg: '#FFEDD5', color: '#EA580C', label: 'Entretien' },
        PRESELECTIONNE:      { bg: '#E0E7FF', color: '#4F46E5', label: 'Présélectionné' },
        ACCEPTE:             { bg: '#D1FAE5', color: '#059669', label: 'Accepté' },
        REFUSE:              { bg: '#FEE2E2', color: '#DC2626', label: 'Refusé' },
        REJETE:              { bg: '#FEE2E2', color: '#DC2626', label: 'Rejeté' },
    },
} as const;
