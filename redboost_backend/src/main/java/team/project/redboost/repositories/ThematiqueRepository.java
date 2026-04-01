package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import team.project.redboost.entities.ThematiqueCoaching;
import java.util.List;

public interface ThematiqueRepository extends JpaRepository<ThematiqueCoaching, Long> {

    List<ThematiqueCoaching> findByProgrammeId(Long programmeId);

    List<ThematiqueCoaching> findByProgrammeIdAndStatut(Long programmeId, ThematiqueCoaching.StatutThematique statut);
}
