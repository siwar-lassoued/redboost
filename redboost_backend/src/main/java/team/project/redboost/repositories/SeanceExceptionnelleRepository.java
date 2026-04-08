package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.SeanceExceptionnelle;

import java.util.List;

@Repository
public interface SeanceExceptionnelleRepository extends JpaRepository<SeanceExceptionnelle, Long> {
    List<SeanceExceptionnelle> findByCoachId(Long coachId);
    List<SeanceExceptionnelle> findByEntrepreneurId(Long entrepreneurId);
}
