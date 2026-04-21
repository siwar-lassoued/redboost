package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.ThematiqueCoaching;
import team.project.redboost.repositories.ThematiqueRepository;
import team.project.redboost.repositories.DisponibiliteRepository;
import team.project.redboost.repositories.SessionCoachRepository;
import team.project.redboost.repositories.NoteDeSyntheseRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import team.project.redboost.entities.Matching;
import team.project.redboost.repositories.MatchingRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class ThematiqueService {

    private final ThematiqueRepository thematiqueRepo;
    private final MatchingRepository matchingRepository;
    private final DisponibiliteRepository disponibiliteRepository;
    private final SessionCoachRepository sessionCoachRepository;
    private final NoteDeSyntheseRepository noteDeSyntheseRepository;

    @Transactional
    public ThematiqueCoaching create(ThematiqueCoaching thematique) {
        if (thematique.getDateDebut() != null && thematique.getDateFin() != null
                && thematique.getDateFin().isBefore(thematique.getDateDebut())) {
            throw new RuntimeException("La date de fin doit être après la date de début");
        }
        return thematiqueRepo.save(thematique);
    }

    public List<ThematiqueCoaching> getAll() {
        return thematiqueRepo.findAll();
    }

    public List<ThematiqueCoaching> getByProgramme(Long programmeId) {
        return thematiqueRepo.findByProgrammeId(programmeId);
    }

    public List<ThematiqueCoaching> getAll() {
        return thematiqueRepo.findAll();
    }

    public List<ThematiqueCoaching> getActiveByProgramme(Long programmeId) {
        return thematiqueRepo.findByProgrammeIdAndStatut(programmeId, ThematiqueCoaching.StatutThematique.ACTIVE);
    }

    public ThematiqueCoaching getById(Long id) {
        return thematiqueRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Thématique introuvable"));
    }

    public List<ThematiqueCoaching> getThematiquesForCoach(Long coachId) {
        List<Matching> matchings = matchingRepository.findByCoachIdAndStatut(coachId, Matching.StatutMatching.VALIDE);
        Set<Long> thematiqueIds = matchings.stream()
                .map(Matching::getThematiqueId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        return thematiqueRepo.findAllById(thematiqueIds);
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
        // 1. Nullify thematiqueId references in Matching rows (column is nullable, no FK constraint)
        matchingRepository.nullifyThematiqueId(id);

        // 2. Find all Disponibilites linked to this thematique
        List<team.project.redboost.entities.Disponibilite> dispos = disponibiliteRepository.findByThematiqueId(id);
        if (!dispos.isEmpty()) {
            List<Long> dispoIds = dispos.stream()
                    .map(team.project.redboost.entities.Disponibilite::getId)
                    .collect(Collectors.toList());

            // 2a. Find all SessionCoach rows that belong to these disponibilites
            List<Long> sessionIds = dispoIds.stream()
                    .flatMap(dId -> sessionCoachRepository.findByDisponibiliteId(dId).stream())
                    .map(s -> s.getId())
                    .collect(Collectors.toList());

            // 2b. Delete NoteDeSynthese rows that reference those sessions
            if (!sessionIds.isEmpty()) {
                noteDeSyntheseRepository.deleteByRendezVousIdIn(sessionIds);
                // Delete the SessionCoach rows
                sessionCoachRepository.deleteAllById(sessionIds);
            }

            // 2c. Delete the Disponibilite rows
            disponibiliteRepository.deleteAll(dispos);
        }

        // 3. Finally delete the thematique itself
        thematiqueRepo.deleteById(id);
        log.info("Thématique {} supprimée (avec {} disponibilité(s) nettoyée(s))", id, dispos.size());
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
