package team.project.redboost.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class ImproveResponse {
    @JsonProperty("original_text")
    private String originalText;

    @JsonProperty("improved_text")
    private String improvedText;

    private List<String> feedback;
    private int score;

    // Getters and setters
    public String getOriginalText() {
        return originalText;
    }

    public void setOriginalText(String originalText) {
        this.originalText = originalText;
    }

    public String getImprovedText() {
        return improvedText;
    }

    public void setImprovedText(String improvedText) {
        this.improvedText = improvedText;
    }

    public List<String> getFeedback() {
        return feedback;
    }

    public void setFeedback(List<String> feedback) {
        this.feedback = feedback;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }
}
