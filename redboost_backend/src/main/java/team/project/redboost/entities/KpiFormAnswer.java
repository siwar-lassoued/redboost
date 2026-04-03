package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "kpi_form_answers")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class KpiFormAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "response_id", nullable = false)
    @JsonBackReference("response-answers")
    private KpiFormResponse response;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "question_text")
    private String questionText;

    @Column(name = "answer_value", columnDefinition = "TEXT")
    private String answerValue;

    /** Denormalized KPI ID for fast processing */
    @Column(name = "kpi_id")
    private Long kpiId;

    // Constructors
    public KpiFormAnswer() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public KpiFormResponse getResponse() { return response; }
    public void setResponse(KpiFormResponse response) { this.response = response; }

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getAnswerValue() { return answerValue; }
    public void setAnswerValue(String answerValue) { this.answerValue = answerValue; }

    public Long getKpiId() { return kpiId; }
    public void setKpiId(Long kpiId) { this.kpiId = kpiId; }
}
