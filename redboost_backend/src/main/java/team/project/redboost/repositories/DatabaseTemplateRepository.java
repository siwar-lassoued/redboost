// DatabaseTemplateRepository.java
package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.DatabaseTemplate;

import java.util.List;
import java.util.Optional;

@Repository
public interface DatabaseTemplateRepository extends JpaRepository<DatabaseTemplate, Long> {
    List<DatabaseTemplate> findByCreatedBy(Long userId);
    Optional<DatabaseTemplate> findByNameAndCreatedBy(String name, Long userId);
}