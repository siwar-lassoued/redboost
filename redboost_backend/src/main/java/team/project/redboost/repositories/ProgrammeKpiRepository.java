package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import team.project.redboost.dto.ProgrammeKpiResponse;
import team.project.redboost.entities.ProgrammeKpi;

import java.util.List;
import java.util.Optional;

public interface ProgrammeKpiRepository extends JpaRepository<ProgrammeKpi, Long> {
    List<ProgrammeKpi> findByProgrammeId(Long programmeId);
    Optional<ProgrammeKpi> findByProgrammeIdAndKpiId(Long programmeId, Long kpiId);
    void deleteByProgrammeIdAndKpiId(Long programmeId, Long kpiId);
    void deleteByProgrammeId(Long programmeId);
    void deleteByKpiId(Long kpiId);
    List<ProgrammeKpi> findAllByProgrammeId(Long programmeId);

    @Query("""
        SELECT new team.project.redboost.dto.ProgrammeKpiResponse(
            pk.id,
            pk.programmeId,
            p.nom,
            pk.kpiId,
            k.type,
            k.nom,
            k.uniteMesure,
            pk.valeurPrecedente,
            pk.valeurActuelle,
            pk.valeurCible,
            k.typesuivi,
            k.typedesaisie,
            null
        )
        FROM ProgrammeKpi pk
        JOIN Programme p ON p.id = pk.programmeId
        JOIN BackofficeKpi k ON k.id = pk.kpiId
        WHERE pk.programmeId = :programmeId
        """)
    List<ProgrammeKpiResponse> findAllByProgrammeIdWithDetails(Long programmeId);

    // In ProgrammeKpiRepository
    @Query("SELECT pk FROM ProgrammeKpi pk " +
            "JOIN FETCH pk.kpi k " +
            "LEFT JOIN FETCH k.category " +
            "WHERE pk.programmeId = :programmeId")
    List<ProgrammeKpi> findByProgrammeIdWithKpi(@Param("programmeId") Long programmeId);
}
