// src/main/java/team/project/redboost/services/SprintService.java
package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import team.project.redboost.dto.SprintDTO;
import team.project.redboost.entities.Programme;
import team.project.redboost.entities.Sprint;
import team.project.redboost.repositories.ProgrammeRepository;
import team.project.redboost.repositories.SprintRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProgrammeRepository programmeRepository;
    private final DateValidationService dateValidationService;

    public List<Sprint> getSprintsByProgrammeId(Long programmeId) {
        return sprintRepository.findByProgrammeId(programmeId);
    }



    public Sprint createSprint(Long programmeId, Sprint sprint) {
        Programme programme = programmeRepository.findById(programmeId)
                .orElseThrow(() -> new RuntimeException("Programme non trouvé"));

        // Validate sprint dates against programme dates
        dateValidationService.validateSprintDates(
                programmeId,
                sprint.getDateDebut(),
                sprint.getDateLimite()
        );

        sprint.setProgramme(programme);
        return sprintRepository.save(sprint);
    }

    public SprintDTO updateSprint(Long sprintId, Sprint updated) {
        Sprint existing = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint non trouvé"));

        dateValidationService.validateSprintDatesForUpdate(
                sprintId,
                updated.getDateDebut(),
                updated.getDateLimite()
        );

        existing.setNom(updated.getNom());
        existing.setDescription(updated.getDescription());
        existing.setDateDebut(updated.getDateDebut());
        existing.setDateLimite(updated.getDateLimite());

        Sprint saved = sprintRepository.save(existing);

        // ✅ Return DTO instead of entity
        return SprintDTO.fromEntity(saved);
    }
    public void deleteSprint(Long sprintId) {
        sprintRepository.deleteById(sprintId);
    }

    public List<Sprint> getAllSprints() {
        return sprintRepository.findAll();
    }
}