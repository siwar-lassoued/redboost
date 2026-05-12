package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.SeanceExceptionnelle;

import java.util.List;

@Repository
public interface SeanceExceptionnelleRepository extends JpaRepository<SeanceExceptionnelle, Long> {
    List<SeanceExceptionnelle> findByCoachId(Long coachId);

    @Query("SELECT s FROM SeanceExceptionnelle s " +
           "LEFT JOIN FETCH s.coach " +
           "LEFT JOIN FETCH s.thematique " +
           "LEFT JOIN FETCH s.entrepreneur " +
           "WHERE s.entrepreneur.id = :entrepreneurId")
    List<SeanceExceptionnelle> findByEntrepreneurId(@Param("entrepreneurId") Long entrepreneurId);
}
