package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.AiReporting;


import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AiReportingRepository extends JpaRepository<AiReporting, Long> {
    
    List<AiReporting> findByProgrammeIdOrderByDateGenerationDesc(Long programmeId);
    
    Optional<AiReporting> findByProgrammeIdAndDateDebutAndDateFin(Long programmeId, LocalDate dateDebut, LocalDate dateFin);
}
