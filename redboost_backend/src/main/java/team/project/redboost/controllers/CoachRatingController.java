package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.CoachRating;
import team.project.redboost.entities.User;
import team.project.redboost.entities.Session;
import team.project.redboost.repositories.UserRepository;
import team.project.redboost.repositories.SessionRepository;
import team.project.redboost.services.CoachRatingService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coach-ratings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CoachRatingController {

    private final CoachRatingService coachRatingService;
    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final team.project.redboost.repositories.ProgrammeRepository programmeRepository;
    private final team.project.redboost.repositories.CoachRatingRepository coachRatingRepository;

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @GetMapping
    public ResponseEntity<List<CoachRating>> getAllRatings() {
        return ResponseEntity.ok(coachRatingService.getAllRatings());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<CoachRating> getRatingById(@PathVariable Long id) {
        CoachRating rating = coachRatingService.getRatingById(id);
        return rating != null ? ResponseEntity.ok(rating) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> createRating(@RequestBody Map<String, Object> payload) {
        try {
            CoachRating rating = new CoachRating();

            Object coachIdObj = payload.get("coachId");
            Object entrepreneurIdObj = payload.get("entrepreneurId");

            if (coachIdObj == null || entrepreneurIdObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "coachId and entrepreneurId are required"));
            }

            Long coachId = ((Number) coachIdObj).longValue();
            Long entrepreneurId = ((Number) entrepreneurIdObj).longValue();

            User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new IllegalArgumentException("Coach not found: " + coachId));
            User entrepreneur = userRepository.findById(entrepreneurId)
                .orElseThrow(() -> new IllegalArgumentException("Entrepreneur not found: " + entrepreneurId));

            rating.setCoach(coach);
            rating.setEntrepreneur(entrepreneur);

            if (payload.get("sessionId") != null) {
                String sessionId = payload.get("sessionId").toString();
                
                // Check if already rated to avoid 500 error from unique constraint
                if (coachRatingRepository.existsByEntrepreneurIdAndSessionId(entrepreneurId, sessionId)) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Vous avez déjà évalué cette séance."));
                }
                
                sessionRepository.findById(sessionId).ifPresent(rating::setSession);
            }

            if (payload.get("programmeId") != null) {
                Long progId = ((Number) payload.get("programmeId")).longValue();
                programmeRepository.findById(progId).ifPresent(rating::setProgramme);
            }

            if (payload.get("globalRating") != null)
                rating.setGlobalRating(((Number) payload.get("globalRating")).doubleValue());
            if (payload.get("communication") != null)
                rating.setCommunication(((Number) payload.get("communication")).doubleValue());
            if (payload.get("expertise") != null)
                rating.setExpertise(((Number) payload.get("expertise")).doubleValue());
            if (payload.get("availability") != null)
                rating.setAvailability(((Number) payload.get("availability")).doubleValue());
            if (payload.get("commentaire") != null)
                rating.setCommentaire(payload.get("commentaire").toString());

            return ResponseEntity.ok(coachRatingService.createRating(rating));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<CoachRating> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        CoachRating.RatingStatut status = CoachRating.RatingStatut.valueOf(payload.get("status"));
        CoachRating updated = coachRatingService.updateRatingStatus(id, status);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRating(@PathVariable Long id) {
        coachRatingService.deleteRating(id);
        return ResponseEntity.noContent().build();
    }
}
