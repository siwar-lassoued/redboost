// src/main/java/team/project/redboost/repositories/ActiviteDocumentRepository.java
package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.ActiviteDocument;

import java.util.List;

@Repository
public interface ActiviteDocumentRepository extends JpaRepository<ActiviteDocument, Long> {
    List<ActiviteDocument> findByActiviteId(Long activiteId);
}