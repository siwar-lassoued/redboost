package team.project.redboost.repositories;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.CandidatureRedstarter;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CandidatureRedstarterRepository extends JpaRepository<CandidatureRedstarter, Long> {
    
    // Find by status
    Page<CandidatureRedstarter> findByStatut(CandidatureRedstarter.StatutCandidature statut, Pageable pageable);
    
    // Find by email
    List<CandidatureRedstarter> findByEmail(String email);
    
    // Find by region
    Page<CandidatureRedstarter> findByRegionBasee(String region, Pageable pageable);
    
    // Find by date range
    @Query("SELECT c FROM CandidatureRedstarter c WHERE c.dateCreationCandidature BETWEEN :startDate AND :endDate")
    Page<CandidatureRedstarter> findByDateRange(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate, 
        Pageable pageable
    );
    
    // Count by status
    long countByStatut(CandidatureRedstarter.StatutCandidature statut);
    
    // Search by company name
    @Query("SELECT c FROM CandidatureRedstarter c WHERE LOWER(c.nomEntreprise) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<CandidatureRedstarter> searchByNomEntreprise(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    // Find recent candidatures
    Page<CandidatureRedstarter> findAllByOrderByDateCreationCandidatureDesc(Pageable pageable);
}