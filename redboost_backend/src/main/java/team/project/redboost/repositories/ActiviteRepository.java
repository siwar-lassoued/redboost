// src/main/java/team/project/redboost/repositories/ActiviteRepository.java
package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import team.project.redboost.entities.Activite;

import java.util.List;

public interface ActiviteRepository extends JpaRepository<Activite, Long> {
    List<Activite> findBySprintId(Long sprintId);
    List<Activite> findByResponsableId(Long responsableId);

    @Query("SELECT a.type, COUNT(a) FROM Activite a JOIN a.sprint s WHERE s.programme.id = :programmeId GROUP BY a.type")
    List<Object[]> countActivitiesByTypeForProgramme(@Param("programmeId") Long programmeId);

    @Query("SELECT a.type, COUNT(a) FROM Activite a GROUP BY a.type")
    List<Object[]> countActivitiesByTypeGlobal();
}