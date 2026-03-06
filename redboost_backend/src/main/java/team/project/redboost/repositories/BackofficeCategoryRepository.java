package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.BackofficeCategory;

public interface BackofficeCategoryRepository extends JpaRepository<BackofficeCategory, Long> {
}