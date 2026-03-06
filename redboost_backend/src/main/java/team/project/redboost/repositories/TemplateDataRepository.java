// TemplateDataRepository.java
package team.project.redboost.repositories;

import team.project.redboost.entities.TemplateData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TemplateDataRepository extends JpaRepository<TemplateData, Long> {
    
    @Query("SELECT DISTINCT td.rowId FROM TemplateData td WHERE td.templateId = :templateId")
    List<String> findDistinctRowIdsByTemplateId(Long templateId);
    
    List<TemplateData> findByTemplateIdAndRowId(Long templateId, String rowId);
    
    List<TemplateData> findByTemplateId(Long templateId);
    
    void deleteByTemplateIdAndRowId(Long templateId, String rowId);
    
    @Query("SELECT td FROM TemplateData td WHERE td.columnId = :columnId AND td.value = :value")
    List<TemplateData> findByColumnIdAndValue(Long columnId, String value);
}