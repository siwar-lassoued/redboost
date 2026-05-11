// src/main/java/team/project/redboost/repositories/TacheRepository.java
package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.Tache;
import java.time.LocalDate;
import java.util.List;

public interface TacheRepository extends JpaRepository<Tache, Long> {
    List<Tache> findByActiviteId(Long activiteId);
    List<Tache> findByResponsableId(Long responsableId);
    List<Tache> findByStatusAndDateDebutLessThanEqual(Tache.StatusTache status, LocalDate date);
    long countByStatus(Tache.StatusTache status);
}