import { FormTemplate } from '../models/candidature.model';

export const MOCK_TEMPLATES: FormTemplate[] = [
    {
        id: 1,
        title: 'Appel à candidatures - Boost Tech 2024',
        description: 'Programme d\'accélération pour startups FinTech et Tech innovantes',
        profileType: 'entrepreneur',
        sectors: ['FinTech', 'Tech'],
        program: 'Boost Tech 2024',
        questions: [
            { id: 1, text: 'Décrivez votre startup et sa mission principale', type: 'text-long', required: true },
            { id: 2, text: 'Quel problème cherchez-vous à résoudre ?', type: 'text-long', required: true },
            { id: 3, text: 'Quelle est votre principale source de revenus ?', type: 'qcu', options: ['Abonnements', 'Vente unique', 'Publicité', 'Commissions'], required: true },
            { id: 4, text: 'Avez-vous déjà levé des fonds ?', type: 'qcu', options: ['Oui', 'Non', 'En cours'], required: true },
            { id: 5, text: 'Joindre votre pitch deck', type: 'upload', required: true }
        ],
        createdAt: '2025-02-15'
    },
    {
        id: 2,
        title: 'Recrutement Coaches - Santé et Medtech',
        description: 'Recherche de mentors expérimentés dans le secteur santé',
        profileType: 'coach',
        sectors: ['Santé', 'Medtech'],
        program: 'HealthBoost 2024',
        questions: [
            { id: 1, text: 'Présentez votre parcours professionnel', type: 'text-long', required: true },
            { id: 2, text: 'Quelles sont vos expertises clés ?', type: 'qcm', options: ['Réglementation santé', 'Levée de fonds', 'Stratégie Go-to-market', 'R&D', 'Propriété intellectuelle'], required: true },
            { id: 3, text: 'Combien de startups avez-vous accompagnées ?', type: 'text-court', required: true },
            { id: 4, text: 'Joindre votre CV', type: 'upload', required: true }
        ],
        createdAt: '2025-02-10'
    },
    {
        id: 3,
        title: 'AgroStart S2 - Entrepreneurs AgriTech',
        description: 'Programme d\'accompagnement pour innovations agricoles',
        profileType: 'entrepreneur',
        sectors: ['AgriTech', 'Agriculture'],
        program: 'AgroStart S2',
        questions: [
            { id: 1, text: 'Nom de votre projet ou startup', type: 'text-court', required: true },
            { id: 2, text: 'Décrivez votre solution innovante pour l\'agriculture', type: 'text-long', required: true },
            { id: 3, text: 'À quel stade êtes-vous ?', type: 'qcu', options: ['Idée', 'Prototype', 'MVP', 'Commercialisation'], required: true },
            { id: 4, text: 'Quels sont vos besoins principaux ?', type: 'qcm', options: ['Financement', 'Expertise technique', 'Accès au marché', 'Partenariats', 'Mentorat'], required: true },
            { id: 5, text: 'Joindre votre business plan', type: 'upload', required: true }
        ],
        createdAt: '2025-02-05'
    },
    {
        id: 4,
        title: 'Coaches Innovation - Tous secteurs',
        description: 'Appel à coaches pour accompagnement multi-sectoriel',
        profileType: 'coach',
        sectors: ['Tech', 'Finance', 'E-commerce', 'EdTech'],
        program: 'Innovation Lab',
        questions: [
            { id: 1, text: 'Quelle est votre spécialisation principale ?', type: 'text-court', required: true },
            { id: 2, text: 'Décrivez une success story d\'accompagnement', type: 'text-long', required: true },
            { id: 3, text: 'Disponibilité hebdomadaire pour le coaching', type: 'qcu', options: ['2-5 heures', '5-10 heures', '10-15 heures', '15+ heures'], required: true },
            { id: 4, text: 'Certifications ou formations pertinentes', type: 'text-long', required: false }
        ],
        createdAt: '2025-01-28'
    }
];
