package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.Rapport;

import java.util.Optional;

@Repository
public interface RapportRepository extends JpaRepository<Rapport, Long> {
    
    Optional<Rapport> findByProgrammeId(Long programmeId);
    
    boolean existsByProgrammeId(Long programmeId);
    
    @Query("SELECT r FROM Rapport r " +
           "LEFT JOIN FETCH r.objectifsGlobaux og " +
           "LEFT JOIN FETCH og.objectifsSpecifiques os " +
           "LEFT JOIN FETCH os.resultats " +
           "WHERE r.id = :id")
    Optional<Rapport> findByIdWithDetails(Long id);
}