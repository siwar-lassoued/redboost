package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.config.ValidationException;
import team.project.redboost.entities.Tache;
import team.project.redboost.entities.Activite;
import team.project.redboost.entities.Sprint;
import team.project.redboost.repositories.TacheRepository;
import team.project.redboost.repositories.ActiviteRepository;
import team.project.redboost.repositories.SprintRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TacheService {

    private final TacheRepository tacheRepository;
    private final ActiviteRepository activiteRepository;
    private final SprintRepository sprintRepository;
    public List<Tache> getAll() {
        return tacheRepository.findAll();
    }

    public Tache getById(Long id) {
        return tacheRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tache not found with id: " + id));
    }

    /**
     * Get all taches belonging to a programme (via Sprint -> Activite -> Tache chain).
     */
    public List<Tache> getByProgramme(Long programmeId) {
        List<Sprint> sprints = sprintRepository.findByProgrammeId(programmeId);
        List<Long> sprintIds = sprints.stream().map(Sprint::getId).collect(Collectors.toList());

        return sprintIds.stream()
                .flatMap(sprintId -> activiteRepository.findBySprintId(sprintId).stream())
                .flatMap(activite -> tacheRepository.findByActiviteId(activite.getId()).stream())
                .collect(Collectors.toList());
    }

    /**
     * Get taches assigned to a specific user (assignee / responsable).
     */
    public List<Tache> getByAssignee(Long assigneeId) {
        return tacheRepository.findByResponsableId(assigneeId);
    }

    /**
     * Get taches for a coach — delegates to getByAssignee since
     * a coach is essentially a responsable on a tache.
     */
    public List<Tache> getByCoach(Long coachId) {
        return tacheRepository.findByResponsableId(coachId);
    }

    public Tache create(Tache tache) {
        if (tache.getTitre() == null || tache.getTitre().trim().isEmpty()) {
            throw new ValidationException("Le titre de la tâche est obligatoire.");
        }
        if (tache.getResponsableId() == null) {
            throw new ValidationException("L'entrepreneur assigné est obligatoire.");
        }
        if (tache.getDateLimite() == null) {
            throw new ValidationException("La date limite est obligatoire.");
        }

        tache.setTitre(tache.getTitre().trim());

        if (tache.getDescription() != null) {
            String description = tache.getDescription().trim();
            tache.setDescription(description.isEmpty() ? null : description);
        }
        if (tache.getDateDebut() == null) {
            tache.setDateDebut(LocalDate.now());
        }
        if (tache.getPriorite() == null || tache.getPriorite().trim().isEmpty()) {
            tache.setPriorite("MOYENNE");
        }
        if (tache.getStatus() == null) {
            tache.setStatus(Tache.StatusTache.NON_DEMARREE);
        }

        return tacheRepository.save(tache);
    }

    public Tache update(Long id, Tache updated) {
        Tache existing = getById(id);
        existing.setTitre(updated.getTitre());
        existing.setDescription(updated.getDescription());
        existing.setResponsableId(updated.getResponsableId());
        existing.setPriorite(updated.getPriorite());
        existing.setDateDebut(updated.getDateDebut());
        existing.setDateLimite(updated.getDateLimite());
        existing.setDateFinReel(updated.getDateFinReel());
        existing.setDifficulte(updated.getDifficulte());
        existing.setStatus(updated.getStatus());
        if (updated.getActivite() != null) {
            existing.setActivite(updated.getActivite());
        }
        return tacheRepository.save(existing);
    }

    public void delete(Long id) {
        tacheRepository.deleteById(id);
    }
}
