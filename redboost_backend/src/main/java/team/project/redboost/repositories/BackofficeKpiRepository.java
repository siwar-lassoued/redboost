package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.BackofficeKpi;

import java.util.List;

public interface BackofficeKpiRepository extends JpaRepository<BackofficeKpi, Long> {
    List<BackofficeKpi> findByCategoryId(Long categoryId);
    List<BackofficeKpi> findByType(String type);
    List<BackofficeKpi> findByTypeIn(List<String> types);
}