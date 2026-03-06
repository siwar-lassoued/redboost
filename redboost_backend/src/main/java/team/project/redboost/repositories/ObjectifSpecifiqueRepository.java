package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.ObjectifSpecifique;

import java.util.List;

@Repository
public interface ObjectifSpecifiqueRepository extends JpaRepository<ObjectifSpecifique, Long> {
    List<ObjectifSpecifique> findByObjectifGlobalId(Long objectifGlobalId);
}