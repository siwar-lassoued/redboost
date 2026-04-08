package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "kpi_form_questions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class KpiFormQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id", nullable = false)
    @JsonBackReference("form-questions")
    private KpiForm form;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type = QuestionType.TEXT;

    /** JSON array of options for SELECT/MULTI_SELECT questions */
    @Column(columnDefinition = "TEXT")
    private String options;

    @Column(name = "is_required")
    private boolean required = false;

    /** Link to a BackofficeKpi - when answered, auto-updates this KPI */
    @Column(name = "kpi_id")
    private Long kpiId;

    /** Denormalized KPI name for display */
    @Column(name = "kpi_name")
    private String kpiName;

    @Column(name = "order_index")
    private int orderIndex = 0;

    public enum QuestionType {
        TEXT, NUMBER, SELECT, MULTI_SELECT, FILE, TEXTAREA
    }

    // Constructors
    public KpiFormQuestion() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public KpiForm getForm() { return form; }
    public void setForm(KpiForm form) { this.form = form; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public QuestionType getType() { return type; }
    public void setType(QuestionType type) { this.type = type; }

    public String getOptions() { return options; }
    public void setOptions(String options) { this.options = options; }

    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }

    public Long getKpiId() { return kpiId; }
    public void setKpiId(Long kpiId) { this.kpiId = kpiId; }

    public String getKpiName() { return kpiName; }
    public void setKpiName(String kpiName) { this.kpiName = kpiName; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
}
