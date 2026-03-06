// src/main/java/team/project/redboost/entities/ProgrammeKpiHistory.java
package team.project.redboost.entities;

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

    private String valeurPrecedente;
    private String valeurActuelle;
    private String valeurCible;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt = LocalDateTime.now();

    // Optional: Track who made the change
    @Column(name = "changed_by")
    private Long changedBy; // User ID
}