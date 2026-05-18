package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "kpi_form_responses")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class KpiFormResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id", nullable = false)
    @JsonBackReference("form-responses")
    private KpiForm form;

    @Column(name = "form_id", insertable = false, updatable = false)
    private Long formId;

    @Column(name = "form_title")
    private String formTitle;

    @Column(name = "entrepreneur_id")
    private Long entrepreneurId;

    @Column(name = "entrepreneur_name")
    private String entrepreneurName;

    @Column(name = "coach_id")
    private Long coachId;

    @Column(name = "coach_name")
    private String coachName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResponseStatus status = ResponseStatus.PENDING;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "response", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference("response-answers")
    private List<KpiFormAnswer> answers = new ArrayList<>();

    // Transient fields enriched at query time (not stored in DB)
    @Transient
    private String formType;

    @Transient
    private LocalDate deadline;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum ResponseStatus {
        PENDING, SUBMITTED, VALIDATED
    }

    // Constructors
    public KpiFormResponse() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public KpiForm getForm() { return form; }
    public void setForm(KpiForm form) { this.form = form; }

    public Long getFormId() { return formId; }

    public String getFormTitle() { return formTitle; }
    public void setFormTitle(String formTitle) { this.formTitle = formTitle; }

    public Long getEntrepreneurId() { return entrepreneurId; }
    public void setEntrepreneurId(Long entrepreneurId) { this.entrepreneurId = entrepreneurId; }

    public String getEntrepreneurName() { return entrepreneurName; }
    public void setEntrepreneurName(String entrepreneurName) { this.entrepreneurName = entrepreneurName; }

    public ResponseStatus getStatus() { return status; }
    public void setStatus(ResponseStatus status) { this.status = status; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getCoachId() { return coachId; }
    public void setCoachId(Long coachId) { this.coachId = coachId; }

    public String getCoachName() { return coachName; }
    public void setCoachName(String coachName) { this.coachName = coachName; }

    public List<KpiFormAnswer> getAnswers() { return answers; }
    public void setAnswers(List<KpiFormAnswer> answers) { this.answers = answers; }

    public String getFormType() { return formType; }
    public void setFormType(String formType) { this.formType = formType; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }
}
