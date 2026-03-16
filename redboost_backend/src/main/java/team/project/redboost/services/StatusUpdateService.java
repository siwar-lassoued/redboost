package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.Activite;
import team.project.redboost.entities.Tache;
import team.project.redboost.repositories.ActiviteRepository;
import team.project.redboost.repositories.TacheRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatusUpdateService {

    private final ActiviteRepository activiteRepository;
    private final TacheRepository tacheRepository;

    @Scheduled(cron = "0 0 0 * * ?") // Run every day at midnight
    @Transactional
    public void updateStatusOfPendingItems() {
        LocalDate today = LocalDate.now();

        // Update Activities
        List<Activite> activitiesToUpdate = activiteRepository.findByStatusAndDateDebutLessThanEqual(Activite.StatusActivite.NON_DEMARREE, today);
        for (Activite activite : activitiesToUpdate) {
            activite.setStatus(Activite.StatusActivite.EN_COURS);
            activiteRepository.save(activite);
        }

        // Update Taches
        List<Tache> tachesToUpdate = tacheRepository.findByStatusAndDateDebutLessThanEqual(Tache.StatusTache.NON_DEMARREE, today);
        for (Tache tache : tachesToUpdate) {
            tache.setStatus(Tache.StatusTache.EN_COURS);
            tacheRepository.save(tache);
        }
    }
}
