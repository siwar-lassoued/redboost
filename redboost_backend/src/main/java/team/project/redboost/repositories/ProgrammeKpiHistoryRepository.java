// src/main/java/team/project/redboost/repositories/ProgrammeKpiHistoryRepository.java
package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.ProgrammeKpiHistory;

import java.util.List;

public interface ProgrammeKpiHistoryRepository extends JpaRepository<ProgrammeKpiHistory, Long> {
    List<ProgrammeKpiHistory> findByProgrammeKpiIdOrderByChangedAtDesc(Long programmeKpiId);
}