package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.CoachDisponibilite;
import team.project.redboost.entities.CoachDisponibilite.JourSemaine;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CoachDisponibiliteRepository extends JpaRepository<CoachDisponibilite, Long> {

    List<CoachDisponibilite> findByCoachIdAndActifTrue(Long coachId);

    List<CoachDisponibilite> findByCoachId(Long coachId);

    List<CoachDisponibilite> findByCoachIdAndJourAndActifTrue(Long coachId, JourSemaine jour);

    List<CoachDisponibilite> findByCoachIdAndDateSpecifiqueAndActifTrue(Long coachId, LocalDate dateSpecifique);

    void deleteByCoachId(Long coachId);
}