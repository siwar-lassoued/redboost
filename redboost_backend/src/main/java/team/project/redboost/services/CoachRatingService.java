package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.CoachRating;
import team.project.redboost.repositories.CoachRatingRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CoachRatingService {

    private final CoachRatingRepository coachRatingRepository;

    public List<CoachRating> getAllRatings() {
        return coachRatingRepository.findAll();
    }

    public CoachRating getRatingById(Long id) {
        return coachRatingRepository.findById(id).orElse(null);
    }

    @Transactional
    public CoachRating createRating(CoachRating rating) {
        return coachRatingRepository.save(rating);
    }

    @Transactional
    public CoachRating updateRatingStatus(Long id, CoachRating.RatingStatut status) {
        CoachRating rating = getRatingById(id);
        if (rating != null) {
            rating.setStatut(status);
            return coachRatingRepository.save(rating);
        }
        return null;
    }

    @Transactional
    public void deleteRating(Long id) {
        coachRatingRepository.deleteById(id);
    }
}
