// src/main/java/team/project/redboost/entities/Activite.java
package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "activites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Activite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    // NEW FIELDS
    @Column(name = "objectif", columnDefinition = "TEXT")
    private String objectif;

    @Column(name = "methodologie", columnDefinition = "TEXT")
    private String methodologie;

    @Column(name = "resultat_attendu", columnDefinition = "TEXT")
    private String resultatAttendu;

    @Column(name = "type")
    private String type;

    @Column(name = "date_debut")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateDebut;

    @Column(name = "date_limite")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateLimite;

    @Column(name = "date_fin_reel")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateFinReel;

    @Column(name = "responsable_id")
    private Long responsableId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusActivite status = StatusActivite.NON_DEMARREE;

    public enum StatusActivite {
        NON_DEMARREE, EN_COURS, EN_RETARD, TERMINEE
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id")
    @JsonIgnoreProperties({"activites", "programme", "hibernateLazyInitializer", "handler"})
    private Sprint sprint;

    @OneToMany(mappedBy = "activite", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"activite", "sprint", "hibernateLazyInitializer", "handler"})
    private List<Tache> taches = new ArrayList<>();

    @OneToMany(mappedBy = "activite", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<ActiviteKpi> kpis = new ArrayList<>();

    @OneToMany(mappedBy = "activite", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"activite", "hibernateLazyInitializer", "handler"})
    private List<ActiviteDocument> documents = new ArrayList<>();
}