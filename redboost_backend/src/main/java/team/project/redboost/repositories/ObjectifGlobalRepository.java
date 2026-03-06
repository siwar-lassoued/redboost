package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.ObjectifGlobal;

import java.util.List;

@Repository
public interface ObjectifGlobalRepository extends JpaRepository<ObjectifGlobal, Long> {
    List<ObjectifGlobal> findByRapportId(Long rapportId);
}