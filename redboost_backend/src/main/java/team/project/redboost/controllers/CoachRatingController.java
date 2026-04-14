package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.CoachRating;
import team.project.redboost.services.CoachRatingService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coach-ratings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CoachRatingController {

    private final CoachRatingService coachRatingService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<CoachRating>> getAllRatings() {
        return ResponseEntity.ok(coachRatingService.getAllRatings());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<CoachRating> getRatingById(@PathVariable Long id) {
        CoachRating rating = coachRatingService.getRatingById(id);
        return rating != null ? ResponseEntity.ok(rating) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<CoachRating> createRating(@RequestBody CoachRating rating) {
        return ResponseEntity.ok(coachRatingService.createRating(rating));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<CoachRating> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        CoachRating.RatingStatut status = CoachRating.RatingStatut.valueOf(payload.get("status"));
        CoachRating updated = coachRatingService.updateRatingStatus(id, status);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRating(@PathVariable Long id) {
        coachRatingService.deleteRating(id);
        return ResponseEntity.noContent().build();
    }
}
