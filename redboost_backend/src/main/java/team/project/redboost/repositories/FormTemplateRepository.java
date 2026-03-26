package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.FormTemplateEntity;

import java.util.List;

@Repository
public interface FormTemplateRepository extends JpaRepository<FormTemplateEntity, Long> {
    List<FormTemplateEntity> findAllByOrderByCreatedAtDesc();
}
