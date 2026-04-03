package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.Tache;
import team.project.redboost.repositories.TacheRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TacheService {

    private final TacheRepository tacheRepository;

    public List<Tache> getAll() {
        return tacheRepository.findAll();
    }

    public Tache getById(Long id) {
        return tacheRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tâche introuvable : " + id));
    }

    public List<Tache> getByAssignee(Long assigneeId) {
        return tacheRepository.findByAssigneeId(assigneeId);
    }

    public List<Tache> getByCoach(Long coachId) {
        return tacheRepository.findAll().stream()
                .filter(t -> t.getProgramme() != null
                        && t.getProgramme().getCoach() != null
                        && coachId.equals(t.getProgramme().getCoach().getId()))
                .toList();
    }

    public List<Tache> getByProgramme(Long programmeId) {
        return tacheRepository.findByProgrammeId(programmeId);
    }

    public Tache create(Tache t) {
        return tacheRepository.save(t);
    }

    public Tache update(Long id, Tache t) {
        Tache existing = getById(id);
        if (t.getTitre() != null)
            existing.setTitre(t.getTitre());
        if (t.getDescription() != null)
            existing.setDescription(t.getDescription());
        if (t.getStatut() != null)
            existing.setStatut(t.getStatut());
        if (t.getPriorite() != null)
            existing.setPriorite(t.getPriorite());
        if (t.getEcheance() != null)
            existing.setEcheance(t.getEcheance());
        if (t.getAssignee() != null)
            existing.setAssignee(t.getAssignee());
        return tacheRepository.save(existing);
    }

    public void delete(Long id) {
        tacheRepository.deleteById(id);
    }
}
