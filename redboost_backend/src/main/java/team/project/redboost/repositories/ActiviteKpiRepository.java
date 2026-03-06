package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.ActiviteKpi;

import java.util.List;
import java.util.Optional;

// ActiviteKpiRepository.java
public interface ActiviteKpiRepository extends JpaRepository<ActiviteKpi, Long> {
    List<ActiviteKpi> findByActiviteId(Long activiteId);
    Optional<ActiviteKpi> findByActiviteIdAndKpiId(Long activiteId, Long kpiId);
    void deleteByActiviteIdAndKpiId(Long activiteId, Long kpiId);
    void deleteByKpiId(Long kpiId);
}