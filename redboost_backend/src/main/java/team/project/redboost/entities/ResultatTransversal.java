package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "resultats_transversaux")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ResultatTransversal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "objectif_global_id", nullable = false)
    @JsonIgnoreProperties({"objectifsSpecifiques", "rapport", "resultatsTransversaux"})
    private ObjectifGlobal objectifGlobal;

    @Column(nullable = false)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "resultat_transversal_kpi",
            joinColumns = @JoinColumn(name = "resultat_transversal_id"),
            inverseJoinColumns = @JoinColumn(name = "kpi_id")
    )
    @Builder.Default
    private List<BackofficeKpi> kpis = new ArrayList<>();
}
