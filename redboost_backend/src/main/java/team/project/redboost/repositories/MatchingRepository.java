package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import team.project.redboost.entities.Matching;
import java.util.List;

public interface MatchingRepository extends JpaRepository<Matching, Long> {

    List<Matching> findByMatchingSessionId(Long sessionId);

    List<Matching> findByCoachIdAndStatut(Long coachId, Matching.StatutMatching statut);

    List<Matching> findByEntrepreneurIdAndStatut(Long entrepreneurId, Matching.StatutMatching statut);

    @Query("""
      SELECT m FROM Matching m
      WHERE m.programmeId = :programmeId
        AND m.statut = 'VALIDE'
      """)
    List<Matching> findActiveByProgramme(@Param("programmeId") Long programmeId);

    @Query("""
      SELECT m FROM Matching m
      WHERE m.programmeId = :programmeId
        AND m.statut IN ('VALIDE', 'TERMINE', 'LIBERE')
      ORDER BY m.dateValidation DESC
      """)
    List<Matching> findHistoryByProgramme(@Param("programmeId") Long programmeId);

    @Query("""
      SELECT COUNT(m) > 0 FROM Matching m
      WHERE m.entrepreneurId = :entrepreneurId
        AND m.programmeId = :programmeId
        AND m.statut = 'VALIDE'
      """)
    boolean isEntrepreneurActivelyMatched(@Param("entrepreneurId") Long entrepreneurId,
                                          @Param("programmeId") Long programmeId);

    @Modifying
    @Query("UPDATE MatchingSession ms SET ms.statut = 'ARCHIVE' WHERE ms.programmeId = :programmeId AND ms.id <> :activeSessionId AND ms.statut = 'EN_ATTENTE'")
    void archiveOtherPendingSessions(@Param("programmeId") Long programmeId, @Param("activeSessionId") Long activeSessionId);

    /** Libère les propositions non sélectionnées (rangs 2 et 3) quand l'admin valide un rang */
    @Modifying
    @Query("UPDATE Matching m SET m.statut = 'LIBERE' WHERE m.entrepreneurId = :entId AND m.thematiqueId = :thematiqueId AND m.rankTop <> :validatedRank AND m.statut = 'PROPOSE'")
    void liberateNonSelectedRanks(@Param("entId") Long entId,
                                   @Param("thematiqueId") Long thematiqueId,
                                   @Param("validatedRank") Integer validatedRank);

    /** Vérifie si un entrepreneur a déjà un match VALIDE pour ce programme+thématique */
    boolean existsByEntrepreneurIdAndProgrammeIdAndThematiqueIdAndStatut(
            Long entrepreneurId, Long programmeId, Long thematiqueId, Matching.StatutMatching statut);

    @Query("""
      SELECT m FROM Matching m
      WHERE m.programmeId = :programmeId
        AND m.thematiqueId = :thematiqueId
        AND m.statut IN ('VALIDE', 'TERMINE', 'LIBERE', 'PROPOSE')
      ORDER BY m.dateValidation DESC
      """)
    List<Matching> findByProgrammeAndThematique(@Param("programmeId") Long programmeId,
                                                 @Param("thematiqueId") Long thematiqueId);

    /** Tous les matchings actifs (VALIDE) — utilisé par le scheduler de clôture */
    @Query("SELECT m FROM Matching m WHERE m.statut = 'VALIDE'")
    List<Matching> findAllValide();
}
