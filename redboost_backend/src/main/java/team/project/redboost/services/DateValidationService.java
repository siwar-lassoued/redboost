// src/main/java/team/project/redboost/services/DateValidationService.java

package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import team.project.redboost.config.ValidationException;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DateValidationService {

    private final ProgrammeRepository programmeRepository;
    private final SprintRepository sprintRepository;
    private final ActiviteRepository activiteRepository;

    /** Validate Sprint dates against Programme dates */
    public void validateSprintDates(Long programmeId, LocalDate sprintDebut, LocalDate sprintFin) {
        Programme programme = programmeRepository.findById(programmeId)
                .orElseThrow(() -> new ValidationException("Programme non trouvé"));

        if (programme.getDateDebut() == null || programme.getDateFin() == null) {
            throw new ValidationException("Le programme doit avoir des dates de début et de fin définies");
        }

        if (sprintDebut == null || sprintFin == null) {
            throw new ValidationException("Le sprint doit avoir des dates de début et de fin");
        }

        if (sprintDebut.isBefore(programme.getDateDebut())) {
            throw new ValidationException(
                    String.format("La date de début du sprint (%s) doit être après ou égale à la date de début du programme (%s)",
                            sprintDebut, programme.getDateDebut()));
        }

        if (sprintFin.isAfter(programme.getDateFin())) {
            throw new ValidationException(
                    String.format("La date de fin du sprint (%s) doit être avant ou égale à la date de fin du programme (%s)",
                            sprintFin, programme.getDateFin()));
        }

        if (!sprintDebut.isBefore(sprintFin)) {
            throw new ValidationException("La date de début du sprint doit être avant la date de fin");
        }
    }

    /** Validate Activite dates against Sprint dates */
    public void validateActiviteDates(Long sprintId, LocalDate activiteDebut, LocalDate activiteFin) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ValidationException("Sprint non trouvé"));

        if (sprint.getDateDebut() == null || sprint.getDateLimite() == null) {
            throw new ValidationException("Le sprint doit avoir des dates de début et de fin définies");
        }

        if (activiteDebut == null || activiteFin == null) {
            throw new ValidationException("L'activité doit avoir des dates de début et de fin");
        }

        if (activiteDebut.isBefore(sprint.getDateDebut())) {
            throw new ValidationException(
                    String.format("La date de début de l'activité (%s) doit être après ou égale à la date de début du sprint (%s)",
                            activiteDebut, sprint.getDateDebut()));
        }

        if (activiteFin.isAfter(sprint.getDateLimite())) {
            throw new ValidationException(
                    String.format("La date de fin de l'activité (%s) doit être avant ou égale à la date de fin du sprint (%s)",
                            activiteFin, sprint.getDateLimite()));
        }

        if (!activiteDebut.isBefore(activiteFin)) {
            throw new ValidationException("La date de début de l'activité doit être avant la date de fin");
        }
    }

    /** Validate Tache dates against Activite dates */
    public void validateTacheDates(Long activiteId, LocalDate tacheDebut, LocalDate tacheFin) {
        Activite activite = activiteRepository.findById(activiteId)
                .orElseThrow(() -> new ValidationException("Activité non trouvée"));

        if (activite.getDateDebut() == null || activite.getDateLimite() == null) {
            throw new ValidationException("L'activité doit avoir des dates de début et de fin définies");
        }

        if (tacheDebut == null || tacheFin == null) {
            throw new ValidationException("La tâche doit avoir des dates de début et de fin");
        }

        if (tacheDebut.isAfter(tacheFin)) {
            throw new ValidationException("La date de début de la tâche doit être avant ou égale à la date de fin");
        }
    }

    /** Validate Programme dates consistency when updating */
    public void validateProgrammeDatesForUpdate(Long programmeId, LocalDate newDateDebut, LocalDate newDateFin) {
        if (newDateDebut == null || newDateFin == null) {
            throw new ValidationException("Le programme doit avoir des dates de début et de fin");
        }

        if (!newDateDebut.isBefore(newDateFin)) {
            throw new ValidationException("La date de début du programme doit être avant la date de fin");
        }

        Programme programme = programmeRepository.findById(programmeId)
                .orElseThrow(() -> new ValidationException("Programme non trouvé"));

        for (Sprint sprint : programme.getSprints()) {
            if (sprint.getDateDebut() != null && sprint.getDateDebut().isBefore(newDateDebut)) {
                throw new ValidationException(
                        String.format("Impossible de modifier les dates : le sprint '%s' commence le %s, avant la nouvelle date de début du programme",
                                sprint.getNom(), sprint.getDateDebut()));
            }
            if (sprint.getDateLimite() != null && sprint.getDateLimite().isAfter(newDateFin)) {
                throw new ValidationException(
                        String.format("Impossible de modifier les dates : le sprint '%s' se termine le %s, après la nouvelle date de fin du programme",
                                sprint.getNom(), sprint.getDateLimite()));
            }
        }
    }

    /** Validate Sprint dates consistency when updating */
    public void validateSprintDatesForUpdate(Long sprintId, LocalDate newDateDebut, LocalDate newDateFin) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ValidationException("Sprint non trouvé"));

        // First validate against programme
        validateSprintDates(sprint.getProgramme().getId(), newDateDebut, newDateFin);

        // Then check child activities
        for (Activite activite : sprint.getActivites()) {
            if (activite.getDateDebut() != null && activite.getDateDebut().isBefore(newDateDebut)) {
                throw new ValidationException(
                        String.format("Impossible de modifier les dates : l'activité '%s' commence le %s, avant la nouvelle date de début du sprint",
                                activite.getNom(), activite.getDateDebut()));
            }
            if (activite.getDateLimite() != null && activite.getDateLimite().isAfter(newDateFin)) {
                throw new ValidationException(
                        String.format("Impossible de modifier les dates : l'activité '%s' se termine le %s, après la nouvelle date de fin du sprint",
                                activite.getNom(), activite.getDateLimite()));
            }
        }
    }

    /** Validate Activite dates consistency when updating */
    public void validateActiviteDatesForUpdate(Long activiteId, LocalDate newDateDebut, LocalDate newDateFin) {
        Activite activite = activiteRepository.findById(activiteId)
                .orElseThrow(() -> new ValidationException("Activité non trouvée"));

        // First validate against sprint
        validateActiviteDates(activite.getSprint().getId(), newDateDebut, newDateFin);

        // Then check child tasks
//        for (Tache tache : activite.getTaches()) {
//            if (tache.getDateDebut() != null && tache.getDateDebut().isBefore(newDateDebut)) {
//                throw new ValidationException(
//                        String.format("Impossible de modifier les dates : la tâche '%s' commence le %s, avant la nouvelle date de début de l'activité",
//                                tache.getTitre(), tache.getDateDebut()));
//            }
//            if (tache.getDateLimite() != null && tache.getDateLimite().isAfter(newDateFin)) {
//                throw new ValidationException(
//                        String.format("Impossible de modifier les dates : la tâche '%s' se termine le %s, après la nouvelle date de fin de l'activité",
//                                tache.getTitre(), tache.getDateLimite()));
//            }
//        }
    }
}