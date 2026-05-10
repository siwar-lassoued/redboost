package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "kpi_forms")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class KpiForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "programme_id")
    private Long programmeId;

    @Column(name = "thematique_id")
    private Long thematiqueId;

    @Column(name = "coach_id")
    private Long coachId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KpiFormStatus status = KpiFormStatus.DRAFT;

    @Column
    private LocalDate deadline;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "form", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference("form-questions")
    private List<KpiFormQuestion> questions = new ArrayList<>();

    @OneToMany(mappedBy = "form", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference("form-responses")
    private List<KpiFormResponse> responses = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "form_type")
    private FormType formType = FormType.KPI;

    public enum FormType {
        KPI, EVALUATION
    }

    public enum KpiFormStatus {
        DRAFT, SENT, CLOSED
    }

    // Constructors
    public KpiForm() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getProgrammeId() { return programmeId; }
    public void setProgrammeId(Long programmeId) { this.programmeId = programmeId; }

    public Long getThematiqueId() { return thematiqueId; }
    public void setThematiqueId(Long thematiqueId) { this.thematiqueId = thematiqueId; }

    public Long getCoachId() { return coachId; }
    public void setCoachId(Long coachId) { this.coachId = coachId; }

    public KpiFormStatus getStatus() { return status; }
    public void setStatus(KpiFormStatus status) { this.status = status; }

    public FormType getFormType() { return formType; }
    public void setFormType(FormType formType) { this.formType = formType; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<KpiFormQuestion> getQuestions() { return questions; }
    public void setQuestions(List<KpiFormQuestion> questions) { this.questions = questions; }

    public List<KpiFormResponse> getResponses() { return responses; }
    public void setResponses(List<KpiFormResponse> responses) { this.responses = responses; }
}
