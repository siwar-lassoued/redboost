package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.Session;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, String> {
    List<Session> findByCoachId(Long coachId);
    List<Session> findByEntrepreneurId(Long entrepreneurId);
    List<Session> findByProgrammeId(Long programmeId);
    List<Session> findByDateBetween(LocalDateTime start, LocalDateTime end);
    List<Session> findByStatut(Session.Statut statut);
    List<Session> findByEntrepreneurIdAndCoachIdAndStatut(Long entrepreneurId, Long coachId, Session.Statut statut);
    long countByStatut(Session.Statut statut);
    long countByEntrepreneurId(Long entrepreneurId);
    long countByProgrammeIdAndDateBetween(Long programmeId, LocalDateTime start, LocalDateTime end);
    long countByProgrammeIdAndStatutAndDateBetween(Long programmeId, Session.Statut statut, LocalDateTime start, LocalDateTime end);
}
