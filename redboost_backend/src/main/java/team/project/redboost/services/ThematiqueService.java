package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.ThematiqueCoaching;
import team.project.redboost.repositories.ThematiqueRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ThematiqueService {

    private final ThematiqueRepository thematiqueRepo;

    @Transactional
    public ThematiqueCoaching create(ThematiqueCoaching thematique) {
        if (thematique.getDateDebut() != null && thematique.getDateFin() != null
                && thematique.getDateFin().isBefore(thematique.getDateDebut())) {
            throw new RuntimeException("La date de fin doit être après la date de début");
        }
        return thematiqueRepo.save(thematique);
    }

    public List<ThematiqueCoaching> getByProgramme(Long programmeId) {
        return thematiqueRepo.findByProgrammeId(programmeId);
    }

    public List<ThematiqueCoaching> getActiveByProgramme(Long programmeId) {
        return thematiqueRepo.findByProgrammeIdAndStatut(programmeId, ThematiqueCoaching.StatutThematique.ACTIVE);
    }

    @Transactional
    public ThematiqueCoaching update(Long id, ThematiqueCoaching updated) {
        ThematiqueCoaching existing = thematiqueRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Thématique introuvable"));
        existing.setNom(updated.getNom());
        existing.setDescription(updated.getDescription());
        existing.setDateDebut(updated.getDateDebut());
        existing.setDateFin(updated.getDateFin());
        if (updated.getStatut() != null) existing.setStatut(updated.getStatut());
        return thematiqueRepo.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        thematiqueRepo.deleteById(id);
    }

    /**
     * Auto-update status of expired thématiques
     */
    @Transactional
    public void updateExpiredStatuses() {
        List<ThematiqueCoaching> actives = thematiqueRepo.findByProgrammeIdAndStatut(null, ThematiqueCoaching.StatutThematique.ACTIVE);
        LocalDate today = LocalDate.now();
        for (ThematiqueCoaching t : actives) {
            if (t.getDateFin() != null && t.getDateFin().isBefore(today)) {
                t.setStatut(ThematiqueCoaching.StatutThematique.TERMINEE);
                thematiqueRepo.save(t);
            }
        }
    }
}
