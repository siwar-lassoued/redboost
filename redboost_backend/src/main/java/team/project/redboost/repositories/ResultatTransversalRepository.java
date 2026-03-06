package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.ResultatTransversal;

@Repository
public interface ResultatTransversalRepository extends JpaRepository<ResultatTransversal, Long> {
}