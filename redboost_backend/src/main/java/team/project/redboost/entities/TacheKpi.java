// src/main/java/team/project/redboost/entities/TacheKpi.java
package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
    @JoinColumn(name = "tache_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({"tachesKpis", "documents", "activite", "hibernateLazyInitializer", "handler"})
    private Tache tache;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kpi_id", insertable = false, updatable = false)
    private BackofficeKpi kpi;
}