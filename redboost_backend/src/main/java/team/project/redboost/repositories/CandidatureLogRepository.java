package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.CandidatureLog;

import java.util.List;

@Repository
public interface CandidatureLogRepository extends JpaRepository<CandidatureLog, Long> {
    List<CandidatureLog> findByCandidatureIdOrderByCreatedAtDesc(Long candidatureId);

    // Find all logs where any candidature passed through a given status
    List<CandidatureLog> findByStatutApresOrderByCreatedAtAsc(String statutApres);
}
