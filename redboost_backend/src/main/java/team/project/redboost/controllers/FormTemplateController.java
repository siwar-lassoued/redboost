package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.FormTemplateEntity;
import team.project.redboost.repositories.FormTemplateRepository;

import java.util.List;

@RestController
@RequestMapping("/api/form-templates")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FormTemplateController {

    private final FormTemplateRepository repository;

    @GetMapping
    public ResponseEntity<List<FormTemplateEntity>> getAll() {
        return ResponseEntity.ok(repository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FormTemplateEntity> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<FormTemplateEntity> create(@RequestBody FormTemplateEntity template) {
        FormTemplateEntity saved = repository.save(template);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FormTemplateEntity> update(@PathVariable Long id, @RequestBody FormTemplateEntity template) {
        return repository.findById(id).map(existing -> {
            existing.setTitle(template.getTitle());
            existing.setDescription(template.getDescription());
            existing.setProfileType(template.getProfileType());
            existing.setProgram(template.getProgram());
            existing.setSectors(template.getSectors());
            existing.setQuestionsJson(template.getQuestionsJson());
            existing.setDeadline(template.getDeadline());
            return ResponseEntity.ok(repository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
