package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.KpiForm;

import java.util.List;

@Repository
public interface KpiFormRepository extends JpaRepository<KpiForm, Long> {
    List<KpiForm> findByProgrammeId(Long programmeId);
}
