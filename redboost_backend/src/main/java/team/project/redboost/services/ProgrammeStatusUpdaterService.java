package team.project.redboost.services;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.Programme;
import team.project.redboost.entities.StatutProgramme;
import team.project.redboost.repositories.ProgrammeRepository;

import java.time.LocalDate;
import java.util.List;

@Service
public class ProgrammeStatusUpdaterService {

    private final ProgrammeRepository programmeRepository;

    public ProgrammeStatusUpdaterService(ProgrammeRepository programmeRepository) {
        this.programmeRepository = programmeRepository;
    }

    @Scheduled(cron = "0 0 0 * * ?") // Runs every day at midnight
    public void updateProgrammeStatus() {
        List<Programme> programmes = programmeRepository.findAll();
        LocalDate today = LocalDate.now();

        for (Programme programme : programmes) {
            if (programme.getStatut() != StatutProgramme.COMPLETE) {
                if (programme.getDateFin() != null && today.isAfter(programme.getDateFin())) {
                    programme.setStatut(StatutProgramme.EN_RETARD);
                } else if (programme.getDateDebut() != null && (today.isAfter(programme.getDateDebut()) || today.isEqual(programme.getDateDebut()))) {
                    programme.setStatut(StatutProgramme.EN_COURS);
                }
                programmeRepository.save(programme);
            }
        }
    }
}
