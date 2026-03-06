package team.project.redboost.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class CompareResponse {
    private List<String> strengths;
    private List<String> weaknesses;
    private List<Comparison> comparisons;
    private List<String> recommendations;
    @JsonProperty("custom_feedback")
    private String customFeedback;

    // Getters and setters
    public List<String> getStrengths() {
        return strengths;
    }

    public void setStrengths(List<String> strengths) {
        this.strengths = strengths;
    }

    public List<String> getWeaknesses() {
        return weaknesses;
    }

    public void setWeaknesses(List<String> weaknesses) {
        this.weaknesses = weaknesses;
    }

    public List<Comparison> getComparisons() {
        return comparisons;
    }

    public void setComparisons(List<Comparison> comparisons) {
        this.comparisons = comparisons;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }

    public String getCustomFeedback() {
        return customFeedback;
    }

    public void setCustomFeedback(String customFeedback) {
        this.customFeedback = customFeedback;
    }

    public static class Comparison {
        private String aspect;
        private String recent;
        private String reference;
        private String verdict;

        // Getters and setters
        public String getAspect() {
            return aspect;
        }

        public void setAspect(String aspect) {
            this.aspect = aspect;
        }

        public String getRecent() {
            return recent;
        }

        public void setRecent(String recent) {
            this.recent = recent;
        }

        public String getReference() {
            return reference;
        }

        public void setReference(String reference) {
            this.reference = reference;
        }

        public String getVerdict() {
            return verdict;
        }

        public void setVerdict(String verdict) {
            this.verdict = verdict;
        }
    }
}
