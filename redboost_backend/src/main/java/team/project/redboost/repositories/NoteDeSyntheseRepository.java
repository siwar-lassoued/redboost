package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.NoteDeSynthese;
import java.util.Optional;
import java.util.List;

@Repository
public interface NoteDeSyntheseRepository extends JpaRepository<NoteDeSynthese, Long> {
    Optional<NoteDeSynthese> findByRendezVousId(Long rendezVousId);
    List<NoteDeSynthese> findByEntrepreneurId(Long entrepreneurId);
}
