// src/main/java/team/project/redboost/repositories/SprintDocumentRepository.java
package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.SprintDocument;

import java.util.List;

@Repository
public interface SprintDocumentRepository extends JpaRepository<SprintDocument, Long> {
    List<SprintDocument> findBySprintId(Long sprintId);
}