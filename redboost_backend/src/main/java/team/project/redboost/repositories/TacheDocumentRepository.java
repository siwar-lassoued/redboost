// src/main/java/team/project/redboost/repositories/TacheDocumentRepository.java
package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.TacheDocument;

import java.util.List;

@Repository
public interface TacheDocumentRepository extends JpaRepository<TacheDocument, Long> {
    List<TacheDocument> findByTacheId(Long tacheId);
}