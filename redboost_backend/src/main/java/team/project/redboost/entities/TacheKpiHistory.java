package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tache_kpi_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TacheKpiHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tache_kpi_id", nullable = false)
    private Long tacheKpiId;

    private String valeurPrecedente;
    private String valeurActuelle;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt = LocalDateTime.now();

    @Column(name = "changed_by")
    private Long changedBy;
}