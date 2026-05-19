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
import team.project.redboost.entities.ThematiqueCoaching;
import team.project.redboost.repositories.ThematiqueRepository;
import team.project.redboost.services.ReportPdfService;

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
    private final ThematiqueRepository thematiqueRepository;
    private final ReportPdfService pdfService;

    @GetMapping("/all")
    public ResponseEntity<List<RapportMissionCoach>> getAll() {
        return ResponseEntity.ok(repository.findAllByOrderByDateCreationDesc());
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<org.springframework.core.io.Resource> getPdf(@PathVariable Long id) {
        try {
            RapportMissionCoach rapport = repository.findById(id).orElseThrow();
            if (rapport.getPdfPath() == null || rapport.getPdfPath().isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            java.nio.file.Path filePath = java.nio.file.Paths.get(rapport.getPdfPath());
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"Rapport_Mission_" + id + ".pdf\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/coach/{coachId}/programme/{programmeId}")
    public ResponseEntity<List<RapportMissionCoach>> getHistory(
            @PathVariable Long coachId, 
            @PathVariable Long programmeId) {
        return ResponseEntity.ok(repository.findByCoachIdAndProgrammeIdOrderByDateCreationDesc(coachId, programmeId));
    }
    
    @GetMapping("/coach/{coachId}/thematique/{thematiqueId}")
    public ResponseEntity<List<RapportMissionCoach>> getHistoryByThematique(
            @PathVariable Long coachId, 
            @PathVariable Long thematiqueId) {
        return ResponseEntity.ok(repository.findByCoachIdAndThematiqueIdOrderByDateCreationDesc(coachId, thematiqueId));
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
        
        if (payload.containsKey("thematiqueId") && payload.get("thematiqueId") != null) {
            Optional<ThematiqueCoaching> thematique = thematiqueRepository.findById(Long.valueOf(payload.get("thematiqueId").toString()));
            thematique.ifPresent(rapport::setThematique);
        }

        if (payload.containsKey("attachedSessionIds") && payload.get("attachedSessionIds") != null) {
            rapport.setAttachedSessionIds((String) payload.get("attachedSessionIds"));
        }
        
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

        RapportMissionCoach saved = repository.save(rapport);

        // Generate and save PDF automatically
        try {
            String path = pdfService.generateAndSaveMissionReport(saved);
            saved.setPdfPath(path);
            repository.save(saved);
        } catch (Exception e) {
            System.err.println("Failed to generate PDF for mission: " + e.getMessage());
        }

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
