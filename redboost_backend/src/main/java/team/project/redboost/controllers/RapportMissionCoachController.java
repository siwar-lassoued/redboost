package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.RapportMissionCoach;
import team.project.redboost.entities.Programme;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.RapportMissionCoachRepository;
import team.project.redboost.repositories.ProgrammeRepository;
import team.project.redboost.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/rapports-mission-coach")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RapportMissionCoachController {

    private final RapportMissionCoachRepository repository;
    private final ProgrammeRepository programmeRepository;
    private final UserRepository userRepository;

    @GetMapping("/coach/{coachId}/programme/{programmeId}")
    public ResponseEntity<List<RapportMissionCoach>> getHistory(
            @PathVariable Long coachId, 
            @PathVariable Long programmeId) {
        return ResponseEntity.ok(repository.findByCoachIdAndProgrammeIdOrderByDateCreationDesc(coachId, programmeId));
    }

    @PostMapping
    public ResponseEntity<RapportMissionCoach> saveReport(@RequestBody Map<String, Object> payload) {
        Long coachId = Long.valueOf(payload.get("coachId").toString());
        Long programmeId = Long.valueOf(payload.get("programmeId").toString());
        
        Optional<User> coach = userRepository.findById(coachId);
        Optional<Programme> programme = programmeRepository.findById(programmeId);
        
        if (coach.isEmpty() || programme.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        RapportMissionCoach rapport = new RapportMissionCoach();
        if (payload.containsKey("id") && payload.get("id") != null) {
            Optional<RapportMissionCoach> existing = repository.findById(Long.valueOf(payload.get("id").toString()));
            if (existing.isPresent()) {
                rapport = existing.get();
            }
        }

        rapport.setCoach(coach.get());
        rapport.setProgramme(programme.get());
        
        rapport.setPeriodType((String) payload.get("periodType"));
        rapport.setDateDebut((String) payload.get("dateDebut"));
        rapport.setDateFin((String) payload.get("dateFin"));
        rapport.setIntroduction((String) payload.get("introduction"));
        rapport.setPresentationPhase((String) payload.get("presentationPhase"));
        rapport.setDeroulementAccompagnement((String) payload.get("deroulementAccompagnement"));
        rapport.setResultatsObtenus((String) payload.get("resultatsObtenus"));
        rapport.setSuiviBeneficiaires((String) payload.get("suiviBeneficiaires"));
        rapport.setPlanningSeances((String) payload.get("planningSeances"));
        rapport.setFeedbackBeneficiaires((String) payload.get("feedbackBeneficiaires"));
        rapport.setAnalyseLecons((String) payload.get("analyseLecons"));
        rapport.setRecommandationsEtapes((String) payload.get("recommandationsEtapes"));
        rapport.setConclusion((String) payload.get("conclusion"));

        if(rapport.getDateCreation() == null) {
            rapport.setDateCreation(LocalDateTime.now());
        }

        return ResponseEntity.ok(repository.save(rapport));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
