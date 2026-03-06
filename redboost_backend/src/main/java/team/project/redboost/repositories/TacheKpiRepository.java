package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.TacheKpi;

import java.util.List;
import java.util.Optional;

// TacheKpiRepository.java
public interface TacheKpiRepository extends JpaRepository<TacheKpi, Long> {
    List<TacheKpi> findByTacheId(Long tacheId);
    Optional<TacheKpi> findByTacheIdAndKpiId(Long tacheId, Long kpiId);
    List<TacheKpi> findByKpiId(Long kpiId);
    void deleteByKpiId(Long kpiId);

}