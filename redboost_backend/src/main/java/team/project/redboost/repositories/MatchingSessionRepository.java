package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.MatchingSession;
import java.util.List;

public interface MatchingSessionRepository extends JpaRepository<MatchingSession, Long> {

    List<MatchingSession> findByProgrammeId(Long programmeId);

    List<MatchingSession> findByProgrammeIdAndStatut(Long programmeId, MatchingSession.StatutSession statut);
}
