package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.Programme;

@Repository
public interface ProgrammeRepository extends JpaRepository<Programme, Long> {
}