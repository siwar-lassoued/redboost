package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.TacheKpiHistory;
import java.util.List;

public interface TacheKpiHistoryRepository extends JpaRepository<TacheKpiHistory, Long> {
    List<TacheKpiHistory> findByTacheKpiIdOrderByChangedAtDesc(Long tacheKpiId);
}