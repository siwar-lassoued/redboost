// filepath: src/app/core/models/admin-planning.model.ts

/**
 * Model pour la vue globale du planning administrateur
 */

export interface SessionDetail {
  id: string;
  titre: string;
  date: Date;
  dureeMinutes: number;
  statut: 'PLANIFIEE' | 'CONFIRMEE' | 'REALISEE' | 'ANNULEE';
  meetLink?: string;
  coachId: string;
  coachName: string;
  entrepreneurId: string;
  entrepreneurName: string;
  programmeId?: string;
  programmeName?: string;
  description?: string;
  isExceptionnelle?: boolean;
  notes?: string;
  createdAt: Date;
}

export interface CoachPlanningItem {
  id: string;
  coachId: string;
  coachName: string;
  avatar?: string;
  email?: string;
  specialty?: string;
  sessions: SessionDetail[];
  totalSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  expanded?: boolean;
}

export interface EntrepreneurPlanningItem {
  id: string;
  entrepreneurId: string;
  entrepreneurName: string;
  avatar?: string;
  email?: string;
  programme?: string;
  coachId: string;
  coachName: string;
  sessions: SessionDetail[];
  totalSessions: number;
  upcomingSessions: number;
  expanded?: boolean;
}

export interface TodoItem {
  id: string;
  titre: string;
  description?: string;
  status: 'NON_DEMARREE' | 'EN_COURS' | 'BLOQUE' | 'EN_RETARD' | 'TERMINEE';
  priorite: 'BASSE' | 'MOYENNE' | 'HAUTE';
  dateDebut: Date;
  dateLimite: Date;
  dateFinReel?: Date;
  entrepreneurId: string;
  entrepreneurName: string;
  coachId: string;
  coachName: string;
  programmeId: string;
  programmeName: string;
  documents: DocumentItem[];
  difficulte?: string;
}

export interface LivrableItem {
  id: string;
  nom: string;
  type: string;
  dateUpload: Date;
  url: string;
  entrepreneurId: string;
  entrepreneurName: string;
  coachId: string;
  coachName: string;
  tacheId: string;
  tacheTitre: string;
  programmeId: string;
  programmeName: string;
  fileSize?: number;
  description?: string;
}

export interface DocumentItem {
  id: string;
  nom: string;
  type: string;
  url: string;
  dateAjout: Date;
  tacheId: string;
}

export interface AdminPlanningOverview {
  totalCoaches: number;
  totalEntrepreneurs: number;
  totalSessions: number;
  sessionsThisWeek: number;
  pendingTodos: number;
  pendingLivrables: number;
}

export interface SessionStats {
  total: number;
  confirmees: number;
  realisees: number;
  annulees: number;
}

export interface TodoStats {
  total: number;
  enCours: number;
  bloquees: number;
  enRetard: number;
  terminees: number;
}
