package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "resultats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Resultat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "objectif_specifique_id", nullable = false)
    @JsonIgnoreProperties({"resultats", "kpis", "objectifGlobal"})
    private ObjectifSpecifique objectifSpecifique;

    @Column(nullable = false)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;


    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "resultat_kpi",
            joinColumns = @JoinColumn(name = "resultat_id"),
            inverseJoinColumns = @JoinColumn(name = "kpi_id")
    )
    @Builder.Default
    private List<BackofficeKpi> kpis = new ArrayList<>();
}