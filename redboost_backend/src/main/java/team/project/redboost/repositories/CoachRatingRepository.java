package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.CoachRating;
import java.util.Optional;

@Repository
public interface CoachRatingRepository extends JpaRepository<CoachRating, Long> {
    boolean existsByEntrepreneurIdAndSessionId(Long entrepreneurId, String sessionId);

    /** Moyenne globalRating du coach, utilisée dans la formule de charge */
    @Query("SELECT AVG(cr.globalRating) FROM CoachRating cr WHERE cr.coach.id = :coachId")
    Optional<Double> findAverageRatingByCoachId(@Param("coachId") Long coachId);
}
