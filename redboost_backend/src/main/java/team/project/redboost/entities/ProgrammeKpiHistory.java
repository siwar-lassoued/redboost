// src/main/java/team/project/redboost/entities/ProgrammeKpiHistory.java
package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "programme_kpi_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgrammeKpiHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "programme_kpi_id", nullable = false)
    private Long programmeKpiId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programme_kpi_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({"history", "valeurs", "programme", "kpi", "hibernateLazyInitializer", "handler"})
    private ProgrammeKpi programmeKpi;

    private String valeurPrecedente;
    private String valeurActuelle;
    private String valeurCible;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt = LocalDateTime.now();

    // Optional: Track who made the change
    @Column(name = "changed_by")
    private Long changedBy; // User ID

    // New fields to track source of update
    @Column(name = "tache_id")
    private Long tacheId;

    @Column(name = "activite_id")
    private Long activiteId;
}