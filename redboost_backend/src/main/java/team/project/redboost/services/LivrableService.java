package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.Livrable;
import team.project.redboost.repositories.LivrableRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LivrableService {

    private final LivrableRepository livrableRepository;

    public List<Livrable> getAllLivrables() {
        return livrableRepository.findAll();
    }

    public List<Livrable> getLivrablesByCoachEmail(String email) {
        return livrableRepository.findByCoachEmail(email);
    }

    public Livrable getLivrableById(Long id) {
        return livrableRepository.findById(id).orElse(null);
    }

    @Transactional
    public Livrable createLivrable(Livrable livrable) {
        return livrableRepository.save(livrable);
    }

    @Transactional
    public Livrable updateStatus(Long id, Livrable.Statut statut, String coachComment) {
        Livrable livrable = getLivrableById(id);
        if (livrable != null) {
            livrable.setStatut(statut);
            if (coachComment != null) {
                livrable.setCoachComment(coachComment);
            }
            livrable.setValidatedAt(LocalDateTime.now());
            return livrableRepository.save(livrable);
        }
        return null;
    }

    @Transactional
    public void deleteLivrable(Long id) {
        livrableRepository.deleteById(id);
    }
}
