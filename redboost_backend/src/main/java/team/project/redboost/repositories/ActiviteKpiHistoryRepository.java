package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.ActiviteKpiHistory;

import java.util.List;

@Repository
public interface ActiviteKpiHistoryRepository extends JpaRepository<ActiviteKpiHistory, Long> {
    List<ActiviteKpiHistory> findByActiviteKpiIdOrderByChangedAtAsc(Long activiteKpiId);
}