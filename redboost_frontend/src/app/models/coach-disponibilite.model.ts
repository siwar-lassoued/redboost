// coach-disponibilite.model.ts

export type JourSemaine = 'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI' | 'DIMANCHE';
export type TypeDisponibilite = 'DISPONIBLE' | 'INDISPONIBLE' | 'RESERVE';

export interface CoachDisponibilite {
  id?: number;
  coachId?: number;
  jour: JourSemaine;
  heureDebut: string; // format "HH:mm"
  heureFin: string;   // format "HH:mm"
  type: TypeDisponibilite;
  dateSpecifique?: string | null; // format "YYYY-MM-DD"
  recurrent: boolean;
  note?: string;
  actif?: boolean;
}

export const JOURS_SEMAINE: { value: JourSemaine; label: string; short: string }[] = [
  { value: 'LUNDI',     label: 'Lundi',     short: 'Lun' },
  { value: 'MARDI',     label: 'Mardi',     short: 'Mar' },
  { value: 'MERCREDI',  label: 'Mercredi',  short: 'Mer' },
  { value: 'JEUDI',     label: 'Jeudi',     short: 'Jeu' },
  { value: 'VENDREDI',  label: 'Vendredi',  short: 'Ven' },
  { value: 'SAMEDI',    label: 'Samedi',    short: 'Sam' },
  { value: 'DIMANCHE',  label: 'Dimanche',  short: 'Dim' },
];

export const TYPE_LABELS: Record<TypeDisponibilite, { label: string; color: string; bg: string }> = {
  DISPONIBLE:   { label: 'Disponible',    color: '#16a34a', bg: '#dcfce7' },
  INDISPONIBLE: { label: 'Indisponible',  color: '#dc2626', bg: '#fee2e2' },
  RESERVE:      { label: 'Réservé',       color: '#d97706', bg: '#fef3c7' },
};