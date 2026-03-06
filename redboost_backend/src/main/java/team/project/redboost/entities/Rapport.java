package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rapports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Rapport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programme_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"sprints", "secteurs"})
    private Programme programme;

    @Column(name = "objectifs_programme", columnDefinition = "TEXT")
    private String objectifsProgramme;

    @Column(name = "resultats_cles", columnDefinition = "TEXT")
    private String resultatsCles;

    @Column(name = "impact_global", columnDefinition = "TEXT")
    private String impactGlobal;

    @OneToMany(mappedBy = "rapport", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ObjectifGlobal> objectifsGlobaux = new ArrayList<>();

    // Sprints sélectionnés pour la méthodologie
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "rapport_sprint",
            joinColumns = @JoinColumn(name = "rapport_id"),
            inverseJoinColumns = @JoinColumn(name = "sprint_id")
    )
    @JsonIgnoreProperties({"programme", "activites", "taches"})
    @Builder.Default
    private List<Sprint> sprintsMethodologie = new ArrayList<>();

    @Column(name = "conclusion_recommandations", columnDefinition = "TEXT")
    private String conclusionRecommandations;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        dateModification = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }
}