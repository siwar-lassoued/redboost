package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.RapportMissionCoach;

import java.util.List;

@Repository
public interface RapportMissionCoachRepository extends JpaRepository<RapportMissionCoach, Long> {
    List<RapportMissionCoach> findByCoachIdAndProgrammeIdOrderByDateCreationDesc(Long coachId, Long programmeId);
    List<RapportMissionCoach> findByCoachIdAndThematiqueIdOrderByDateCreationDesc(Long coachId, Long thematiqueId);
    List<RapportMissionCoach> findByProgrammeIdOrderByDateCreationDesc(Long programmeId);
    List<RapportMissionCoach> findAllByOrderByDateCreationDesc();
}
