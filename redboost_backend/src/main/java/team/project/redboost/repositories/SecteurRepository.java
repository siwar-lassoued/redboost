// src/main/java/team/project/redboost/repositories/SecteurRepository.java
package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.Secteur;
import java.util.Optional;

public interface SecteurRepository extends JpaRepository<Secteur, Long> {
    Optional<Secteur> findByNomIgnoreCase(String nom);
    boolean existsByNomIgnoreCase(String nom);
}