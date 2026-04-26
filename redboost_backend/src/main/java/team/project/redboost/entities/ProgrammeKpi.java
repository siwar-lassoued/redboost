package team.project.redboost.entities;// src/main/java/team/project/redboost/entities/ProgrammeKpi.java

import jakarta.persistence.*;
import lombok.*;
import team.project.redboost.entities.BackofficeKpi;
import team.project.redboost.entities.Programme;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "programme_kpis",
        uniqueConstraints = @UniqueConstraint(columnNames = {"programme_id", "kpi_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProgrammeKpi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // ← ID simple, auto-incrémenté

    @Column(name = "programme_id", nullable = false)
    private Long programmeId;

    @Column(name = "kpi_id", nullable = false)
    private Long kpiId;

    private String valeurPrecedente;
    private String valeurActuelle;
    private String valeurCible;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programme_id", insertable = false, updatable = false)
    private Programme programme;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kpi_id", insertable = false, updatable = false)
    private BackofficeKpi kpi;

    @OneToMany(mappedBy = "programmeKpi", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProgrammeKpiValeur> valeurs = new ArrayList<>();


    // In ProgrammeKpi class, add:
    @OneToMany(mappedBy = "programmeKpi", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProgrammeKpiHistory> history = new ArrayList<>();

    // Helper method to get typesuivi from the associated BackofficeKpi
    public String getTypesuivi() {
        return kpi != null ? kpi.getTypesuivi() : null;
    }


}