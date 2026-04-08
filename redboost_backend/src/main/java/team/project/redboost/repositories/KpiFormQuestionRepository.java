package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.KpiFormQuestion;

@Repository
public interface KpiFormQuestionRepository extends JpaRepository<KpiFormQuestion, Long> {
}
