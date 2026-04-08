package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.KpiFormAnswer;

@Repository
public interface KpiFormAnswerRepository extends JpaRepository<KpiFormAnswer, Long> {
}
