package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.Resultat;

import java.util.List;

@Repository
public interface ResultatRepository extends JpaRepository<Resultat, Long> {
    List<Resultat> findByObjectifSpecifiqueId(Long objectifSpecifiqueId);
}