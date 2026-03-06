package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.TypeFormation;

import java.util.Optional;

@Repository
public interface TypeFormationRepository extends JpaRepository<TypeFormation, Long> {

    /**
     * Find a type formation by its name
     */
    Optional<TypeFormation> findByName(String name);

    /**
     * Check if a type formation exists by name
     */
    boolean existsByName(String name);
}