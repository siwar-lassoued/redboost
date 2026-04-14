package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.SessionCoach;
import jakarta.persistence.LockModeType;

import java.util.List;

@Repository
public interface SessionCoachRepository extends JpaRepository<SessionCoach, Long> {
    List<SessionCoach> findByDisponibiliteId(Long disponibiliteId);
    List<SessionCoach> findByDisponibiliteCoachId(Long coachId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SessionCoach s WHERE s.id = :id")
    java.util.Optional<SessionCoach> findByIdWithLock(@Param("id") Long id);
}
