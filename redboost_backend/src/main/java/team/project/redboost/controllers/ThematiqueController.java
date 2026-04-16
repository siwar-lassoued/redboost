package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.ThematiqueCoaching;
import team.project.redboost.services.ThematiqueService;

import java.util.List;

@RestController
@RequestMapping("/api/thematiques")
@RequiredArgsConstructor
public class ThematiqueController {

    private final ThematiqueService thematiqueService;

    @PostMapping
    public ResponseEntity<ThematiqueCoaching> create(@RequestBody ThematiqueCoaching thematique) {
        return ResponseEntity.status(201).body(thematiqueService.create(thematique));
    }

    @GetMapping("/programme/{programmeId}")
    public ResponseEntity<List<ThematiqueCoaching>> getByProgramme(@PathVariable Long programmeId) {
        return ResponseEntity.ok(thematiqueService.getByProgramme(programmeId));
    }

    @GetMapping("/programme/{programmeId}/active")
    public ResponseEntity<List<ThematiqueCoaching>> getActiveByProgramme(@PathVariable Long programmeId) {
        return ResponseEntity.ok(thematiqueService.getActiveByProgramme(programmeId));
    }

    @GetMapping("/coach/{coachId}")
    public ResponseEntity<List<ThematiqueCoaching>> getThematiquesForCoach(@PathVariable Long coachId) {
        return ResponseEntity.ok(thematiqueService.getThematiquesForCoach(coachId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ThematiqueCoaching> update(@PathVariable Long id, @RequestBody ThematiqueCoaching thematique) {
        return ResponseEntity.ok(thematiqueService.update(id, thematique));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        thematiqueService.delete(id);
        return ResponseEntity.ok().build();
    }
}
