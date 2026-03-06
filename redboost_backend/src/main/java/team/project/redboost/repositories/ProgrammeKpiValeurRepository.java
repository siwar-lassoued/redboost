package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.ProgrammeKpiValeur;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProgrammeKpiValeurRepository extends JpaRepository<ProgrammeKpiValeur, Long> {
    List<ProgrammeKpiValeur> findByProgrammeKpiId(Long programmeKpiId);
    Optional<ProgrammeKpiValeur> findByProgrammeKpiIdAndUserId(Long programmeKpiId, Long userId);
    void deleteByUserId(Long userId);
}