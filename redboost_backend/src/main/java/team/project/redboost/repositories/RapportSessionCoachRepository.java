package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.RapportSessionCoach;

import java.util.List;

@Repository
public interface RapportSessionCoachRepository extends JpaRepository<RapportSessionCoach, Long> {
    List<RapportSessionCoach> findByCoachIdOrderByDateCreationDesc(Long coachId);
    List<RapportSessionCoach> findByEntrepreneurIdOrderByDateCreationDesc(Long entrepreneurId);
    List<RapportSessionCoach> findByCoachIdAndThematiqueIdOrderByDateCreationDesc(Long coachId, Long thematiqueId);
}
