package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.SessionCoach;

import java.util.List;

@Repository
public interface SessionCoachRepository extends JpaRepository<SessionCoach, Long> {
    List<SessionCoach> findByDisponibiliteId(Long disponibiliteId);
    List<SessionCoach> findByDisponibiliteCoachId(Long coachId);
}
