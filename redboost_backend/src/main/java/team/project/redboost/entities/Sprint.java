// src/main/java/team/project/redboost/entities/Sprint.java
package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sprints")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Sprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusSprint status = StatusSprint.NON_DEMARREE;

    public enum StatusSprint {
        NON_DEMARREE, EN_COURS, EN_RETARD, TERMINEE
    }

    @Column(name = "date_debut")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateDebut;

    @Column(name = "date_limite")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateLimite;

    @Column(name = "date_fin_reel")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateFinReel;

    @Column(name = "sprint_order")
    private Integer order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programme_id")
    @JsonIgnoreProperties({"sprints", "hibernateLazyInitializer", "handler"})
    private Programme programme;

    @OneToMany(mappedBy = "sprint", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"sprint", "programme", "activites", "taches", "hibernateLazyInitializer", "handler"})
    private List<Activite> activites = new ArrayList<>();

    // NEW: Document relationship
    @OneToMany(mappedBy = "sprint", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"sprint", "hibernateLazyInitializer", "handler"})
    private List<SprintDocument> documents = new ArrayList<>();
}