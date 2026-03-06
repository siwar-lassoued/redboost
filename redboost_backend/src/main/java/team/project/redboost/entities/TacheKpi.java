// src/main/java/team/project/redboost/entities/TacheKpi.java
package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tache_kpis", uniqueConstraints = @UniqueConstraint(columnNames = {"tache_id", "kpi_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TacheKpi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tache_id", nullable = false)
    private Long tacheId;

    @Column(name = "kpi_id", nullable = false)
    private Long kpiId;

    private String valeurActuelle;
    private String valeurCible;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kpi_id", insertable = false, updatable = false)
    private BackofficeKpi kpi;
}