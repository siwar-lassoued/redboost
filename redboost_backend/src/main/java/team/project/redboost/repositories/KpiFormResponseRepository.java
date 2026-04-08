package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.KpiFormResponse;

import java.util.List;

@Repository
public interface KpiFormResponseRepository extends JpaRepository<KpiFormResponse, Long> {
    List<KpiFormResponse> findByFormId(Long formId);
    List<KpiFormResponse> findByEntrepreneurId(Long entrepreneurId);
}
