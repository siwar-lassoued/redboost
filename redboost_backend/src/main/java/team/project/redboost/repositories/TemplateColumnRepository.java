// TemplateColumnRepository.java
package team.project.redboost.repositories;

import team.project.redboost.entities.TemplateColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TemplateColumnRepository extends JpaRepository<TemplateColumn, Long> {
    List<TemplateColumn> findByTemplateIdOrderByDisplayOrder(Long templateId);
    boolean existsByTemplateIdAndColumnName(Long templateId, String columnName);
}