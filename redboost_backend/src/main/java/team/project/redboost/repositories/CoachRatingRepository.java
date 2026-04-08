package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.CoachRating;

@Repository
public interface CoachRatingRepository extends JpaRepository<CoachRating, Long> {
    boolean existsByEntrepreneurIdAndSessionId(Long entrepreneurId, String sessionId);
}
