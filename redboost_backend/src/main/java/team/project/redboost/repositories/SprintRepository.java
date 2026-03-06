// src/main/java/team/project/redboost/repositories/SprintRepository.java
package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.Sprint;

import java.util.List;

public interface SprintRepository extends JpaRepository<Sprint, Long> {
    List<Sprint> findByProgrammeId(Long programmeId);
}