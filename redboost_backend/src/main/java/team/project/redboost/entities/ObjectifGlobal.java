package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "objectifs_globaux")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ObjectifGlobal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rapport_id", nullable = false)
    @JsonIgnoreProperties({"objectifsGlobaux", "sprintsMethodologie"})
    private Rapport rapport;

    @Column(nullable = false)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "objectifGlobal", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ObjectifSpecifique> objectifsSpecifiques = new ArrayList<>();

    @OneToMany(mappedBy = "objectifGlobal", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ResultatTransversal> resultatsTransversaux = new ArrayList<>();
}
