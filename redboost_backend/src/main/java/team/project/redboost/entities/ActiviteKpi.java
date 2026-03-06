package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "activite_kpis", uniqueConstraints = @UniqueConstraint(columnNames = {"activite_id", "kpi_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ActiviteKpi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "activite_id", nullable = false)
    private Long activiteId;

    @Column(name = "kpi_id", nullable = false)
    private Long kpiId;

    private String valeurActuelle;
    private String valeurCible;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kpi_id", insertable = false, updatable = false)
    private BackofficeKpi kpi;

}