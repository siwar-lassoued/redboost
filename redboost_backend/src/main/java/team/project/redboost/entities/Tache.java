// src/main/java/team/project/redboost/entities/Tache.java
package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "taches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Tache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "responsable_id")
    private Long responsableId;

    private String priorite; // Haute, Moyenne, Basse

    @Column(name = "date_debut")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateDebut;

    @Column(name = "date_limite")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateLimite;

    @Column(name = "date_fin_reel")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateFinReel;

    @Column(columnDefinition = "TEXT")
    private String difficulte;

    @Enumerated(EnumType.STRING)
    private StatusTache status = StatusTache.NON_DEMARREE;

    // Relation bidirectionnelle avec Activité
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activite_id", nullable = false)
    @JsonIgnoreProperties({"taches", "sprint", "kpis", "hibernateLazyInitializer", "handler"})
    private Activite activite;

    // Add to existing Tache.java
    @OneToMany(mappedBy = "tache", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("tache")
    private List<TacheDocument> documents = new ArrayList<>();

    // Alias for entrepreneurId requested in specification
    public Long getEntrepreneurId() {
        return this.responsableId;
    }

    public void setEntrepreneurId(Long entrepreneurId) {
        this.responsableId = entrepreneurId;
    }

    public enum StatusTache {
        NON_DEMARREE,
        EN_COURS,
        BLOQUE,
        EN_RETARD,
        TERMINEE
    }


    @OneToMany(mappedBy = "tacheId", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<TacheKpi> tachesKpis = new ArrayList<>();
}