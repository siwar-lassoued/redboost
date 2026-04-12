package team.project.redboost.repositories;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.CandidatureRedstarter;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CandidatureRedstarterRepository extends JpaRepository<CandidatureRedstarter, Long> {
    
    Page<CandidatureRedstarter> findAll(Pageable pageable);

    // Find by status
    Page<CandidatureRedstarter> findByStatut(CandidatureRedstarter.StatutCandidature statut, Pageable pageable);
    
    // Find by type (via FormTemplate profile_type)
    @Query("SELECT c FROM CandidatureRedstarter c " +
           "WHERE c.formTemplateId IN (SELECT t.id FROM FormTemplateEntity t WHERE UPPER(t.profileType) = UPPER(:type))")
    Page<CandidatureRedstarter> findByProfileType(@Param("type") String type, Pageable pageable);

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
    
    // Count by profile type (via FormTemplate profile_type)
    @Query("SELECT COUNT(c) FROM CandidatureRedstarter c " +
           "WHERE c.formTemplateId IN (SELECT t.id FROM FormTemplateEntity t WHERE UPPER(t.profileType) = UPPER(:type))")
    long countByProfileType(@Param("type") String type);
    
    // Count spontaneous (template id is null or template is SPONTANEE)
    @Query("SELECT COUNT(c) FROM CandidatureRedstarter c WHERE c.formTemplateId IS NULL OR c.formTemplateId IN (SELECT t.id FROM FormTemplateEntity t WHERE UPPER(t.profileType) = 'SPONTANEE')")
    long countSpontanees();

    @Transactional
    @Modifying
    @Query("DELETE FROM CandidatureRedstarter c WHERE c.nomPrenom IS NULL OR c.nomPrenom = '' OR c.email IS NULL OR c.email = ''")
    void deleteAnonymous();

    @Query("SELECT c FROM CandidatureRedstarter c WHERE c.formTemplateId IS NULL OR c.formTemplateId IN (SELECT t.id FROM FormTemplateEntity t WHERE UPPER(t.profileType) = 'SPONTANEE')")
    Page<CandidatureRedstarter> findSpontanees(Pageable pageable);

    @Query("SELECT c FROM CandidatureRedstarter c WHERE c.statut = :statut AND (c.formTemplateId IS NULL OR c.formTemplateId IN (SELECT t.id FROM FormTemplateEntity t WHERE UPPER(t.profileType) = 'SPONTANEE'))")
    List<CandidatureRedstarter> findSpontaneesByStatut(@Param("statut") CandidatureRedstarter.StatutCandidature statut);

    @Query("SELECT c FROM CandidatureRedstarter c WHERE c.formTemplateId IS NOT NULL AND c.statut = :statut")
    List<CandidatureRedstarter> findByFormTemplateIdNotNullAndStatut(@Param("statut") CandidatureRedstarter.StatutCandidature statut);

    @Query("SELECT c FROM CandidatureRedstarter c WHERE c.statut = :statut")
    List<CandidatureRedstarter> findAllByStatut(@Param("statut") CandidatureRedstarter.StatutCandidature statut);

    @Query("SELECT c FROM CandidatureRedstarter c WHERE c.statut = :statut AND (LOWER(c.roleEntreprise) LIKE '%coach%' OR c.formTemplateId IN (SELECT t.id FROM FormTemplateEntity t WHERE LOWER(t.profileType) LIKE '%coach%'))")
    List<CandidatureRedstarter> findAcceptedCoaches(@Param("statut") CandidatureRedstarter.StatutCandidature statut);
}