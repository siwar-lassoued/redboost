package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.NoteDeSynthese;
import team.project.redboost.repositories.NoteDeSyntheseRepository;

import java.util.Optional;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NoteController {

    private final NoteDeSyntheseRepository noteRepository;

    @GetMapping("/getnote/{rendezVousId}")
    public ResponseEntity<NoteDeSynthese> getNoteByRendezVous(@PathVariable Long rendezVousId) {
        Optional<NoteDeSynthese> note = noteRepository.findByRendezVousId(rendezVousId);
        return note.map(ResponseEntity::ok)
                   .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<NoteDeSynthese> saveNote(@RequestBody NoteDeSynthese note) {
        return ResponseEntity.ok(noteRepository.save(note));
    }
}
