package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_reporting")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AiReporting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programme_id", nullable = false)
    @JsonIgnoreProperties({"sprints", "secteurs"})
    private Programme programme;

    @Enumerated(EnumType.STRING)
    @Column(name = "period_type", nullable = false)
    private PeriodType periodType;

    @Column(name = "period_label", nullable = false)
    private String periodLabel;

    @Column(name = "date_debut")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateFin;

    @Column(name = "date_generation", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateGeneration;

    @Column(name = "total_sessions")
    private Integer totalSessions;

    @Column(name = "sessions_completed")
    private Integer sessionsCompleted;

    @Column(name = "total_taches")
    private Integer totalTaches;

    @Column(name = "taches_completed")
    private Integer tachesCompleted;

    @Column(name = "total_livrables")
    private Integer totalLivrables;

    @Column(name = "livrables_approved")
    private Integer livrablesApproved;

    @Column(name = "average_rating")
    private Double averageRating;

    @Column(name = "generated_by")
    private String generatedBy;

    // --- AI Outputs ---

    @Column(name = "resume_executif", columnDefinition = "TEXT")
    private String resumeExecutif;

    @Column(name = "kpis_json", columnDefinition = "TEXT")
    private String kpisJson;

    @Column(name = "alertes_json", columnDefinition = "TEXT")
    private String alertesJson;

    @Column(name = "recommandations_json", columnDefinition = "TEXT")
    private String recommandationsJson;

    @Column(name = "analyse_livrables", columnDefinition = "TEXT")
    private String analyseLivrables;

    @Column(name = "tendances", columnDefinition = "TEXT")
    private String tendances;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (dateGeneration == null) {
            dateGeneration = LocalDate.now();
        }
    }

    public enum PeriodType {
        LIBRE, HEBDO, MOIS, SPRINT, CUSTOM
    }
}
