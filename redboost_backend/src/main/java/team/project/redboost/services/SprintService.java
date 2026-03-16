// src/main/java/team/project/redboost/services/SprintService.java
package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.dto.SprintDTO;
import team.project.redboost.entities.Programme;
import team.project.redboost.entities.Rapport;
import team.project.redboost.entities.Sprint;
import team.project.redboost.repositories.ProgrammeRepository;
import team.project.redboost.repositories.RapportRepository;
import team.project.redboost.repositories.SprintRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProgrammeRepository programmeRepository;
    private final RapportRepository rapportRepository;
    private final DateValidationService dateValidationService;

    public List<Sprint> getSprintsByProgrammeId(Long programmeId) {
        return sprintRepository.findByProgrammeIdOrderByOrderAsc(programmeId);
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
        
        // Assign default order if not present (append to end)
        if (sprint.getOrder() == null) {
            List<Sprint> existingSprints = sprintRepository.findByProgrammeIdOrderByOrderAsc(programmeId);
            sprint.setOrder(existingSprints.size());
        }

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
    @Transactional
    public void deleteSprint(Long sprintId) {
        // Find all rapports that reference this sprint
        List<Rapport> rapports = rapportRepository.findBySprintsMethodologie_Id(sprintId);

        // Remove the sprint from each rapport's list
        for (Rapport rapport : rapports) {
            rapport.getSprintsMethodologie().removeIf(s -> s.getId().equals(sprintId));
            rapportRepository.save(rapport);
        }

        // Now, delete the sprint
        sprintRepository.deleteById(sprintId);
    }

    public List<Sprint> getAllSprints() {
        return sprintRepository.findAll();
    }

    @Transactional
    public void reorderSprints(List<Long> sprintIds) {
        List<Sprint> sprints = sprintRepository.findAllById(sprintIds);

        Map<Long, Integer> orderMap = new HashMap<>();
        for (int i = 0; i < sprintIds.size(); i++) {
            orderMap.put(sprintIds.get(i), i);
        }

        sprints.forEach(s -> s.setOrder(orderMap.get(s.getId())));
        sprintRepository.saveAll(sprints); // single batch instead of N saves
    }
}