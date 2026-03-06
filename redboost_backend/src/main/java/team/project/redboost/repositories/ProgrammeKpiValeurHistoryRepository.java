// src/main/java/team/project/redboost/repositories/ProgrammeKpiValeurHistoryRepository.java
package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.ProgrammeKpiValeurHistory;

import java.util.List;

public interface ProgrammeKpiValeurHistoryRepository extends JpaRepository<ProgrammeKpiValeurHistory, Long> {
    List<ProgrammeKpiValeurHistory> findByProgrammeKpiValeurIdOrderByChangedAtDesc(Long programmeKpiValeurId);

}