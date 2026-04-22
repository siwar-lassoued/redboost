package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.RapportSessionCoach;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.RapportSessionCoachRepository;
import team.project.redboost.repositories.UserRepository;

import team.project.redboost.entities.ThematiqueCoaching;
import team.project.redboost.repositories.ThematiqueRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/rapports-session-coach")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RapportSessionCoachController {

    private final RapportSessionCoachRepository repository;
    private final UserRepository userRepository;
    private final ThematiqueRepository thematiqueRepository;

    @GetMapping("/coach/{coachId}")
    public ResponseEntity<List<RapportSessionCoach>> getHistory(@PathVariable Long coachId) {
        return ResponseEntity.ok(repository.findByCoachIdOrderByDateCreationDesc(coachId));
    }

    @GetMapping("/coach/{coachId}/thematique/{thematiqueId}")
    public ResponseEntity<List<RapportSessionCoach>> getByThematique(
            @PathVariable Long coachId, 
            @PathVariable Long thematiqueId) {
        return ResponseEntity.ok(repository.findByCoachIdAndThematiqueIdOrderByDateCreationDesc(coachId, thematiqueId));
    }

    @GetMapping("/ids")
    public ResponseEntity<List<RapportSessionCoach>> getByIds(@RequestParam List<Long> ids) {
        return ResponseEntity.ok(repository.findAllById(ids));
    }

    @PostMapping
    public ResponseEntity<RapportSessionCoach> saveReport(@RequestBody Map<String, Object> payload) {
        Long coachId = Long.valueOf(payload.get("coachId").toString());
        Optional<User> coach = userRepository.findById(coachId);
        
        if (coach.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        User entrepreneur = null;
        if (payload.containsKey("entrepreneurId") && payload.get("entrepreneurId") != null) {
            entrepreneur = userRepository.findById(Long.valueOf(payload.get("entrepreneurId").toString())).orElse(null);
        }

        RapportSessionCoach rapport = new RapportSessionCoach();
        if (payload.containsKey("id") && payload.get("id") != null) {
            Optional<RapportSessionCoach> existing = repository.findById(Long.valueOf(payload.get("id").toString()));
            if (existing.isPresent()) {
                rapport = existing.get();
            }
        }

        rapport.setCoach(coach.get());
        rapport.setEntrepreneur(entrepreneur);
        
        if (payload.containsKey("thematiqueId") && payload.get("thematiqueId") != null) {
            Optional<ThematiqueCoaching> thematique = thematiqueRepository.findById(Long.valueOf(payload.get("thematiqueId").toString()));
            thematique.ifPresent(rapport::setThematique);
        }
        
        rapport.setEntrepriseNom((String) payload.get("entrepriseNom"));
        rapport.setSecteurActivite((String) payload.get("secteurActivite"));
        rapport.setGouvernorat((String) payload.get("gouvernorat"));
        rapport.setBeneficiaireNom((String) payload.get("beneficiaireNom"));
        rapport.setCoachNom((String) payload.get("coachNom"));
        rapport.setTypeSession((String) payload.get("typeSession"));
        rapport.setNumeroSession((String) payload.get("numeroSession"));
        rapport.setDateSession((String) payload.get("dateSession"));
        
        rapport.setObjectifSession((String) payload.get("objectifSession"));
        rapport.setDeroulement((String) payload.get("deroulement"));
        rapport.setApprentissage((String) payload.get("apprentissage"));
        rapport.setAvancementActions((String) payload.get("avancementActions"));
        rapport.setDifficultes((String) payload.get("difficultes"));
        rapport.setRecommandations((String) payload.get("recommandations"));
        rapport.setTravailProchaineSession((String) payload.get("travailProchaineSession"));
        rapport.setSessionNarrative((String) payload.get("sessionNarrative"));
        
        rapport.setSuiviActionsJson((String) payload.get("suiviActionsJson"));
        
        rapport.setValidationNom((String) payload.get("validationNom"));
        rapport.setValidationSignature((String) payload.get("validationSignature"));
        rapport.setValidationDate((String) payload.get("validationDate"));

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
