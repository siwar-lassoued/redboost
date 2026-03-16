package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "objectifs_specifiques")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ObjectifSpecifique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "objectif_global_id", nullable = false)
    @JsonIgnoreProperties({"objectifsSpecifiques", "rapport"})
    private ObjectifGlobal objectifGlobal;

    @Column(nullable = false)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "objectifSpecifique", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Resultat> resultats = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "objectif_specifique_kpi",
            joinColumns = @JoinColumn(name = "objectif_specifique_id"),
            inverseJoinColumns = @JoinColumn(name = "kpi_id")
    )
    @Builder.Default
    private List<BackofficeKpi> kpis = new ArrayList<>();
}
