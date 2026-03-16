// src/main/java/team/project/redboost/entities/Programme.java

package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "programmes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Programme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String nom;

    @Column(nullable = false)
    private Integer annee;

    @Column(name = "type_programme", nullable = false)
    private String typeProgramme;

    @Column(name = "nombre_beneficiaires")
    private Integer nombreBeneficiaires;

    @Column(name = "date_debut")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateFin;

    @Column(name = "responsable_id")
    private Long responsableId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutProgramme statut = StatutProgramme.NON_DEMARREE;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE}, fetch = FetchType.LAZY)
    @JoinTable(
            name = "programme_secteur",
            joinColumns = @JoinColumn(name = "programme_id"),
            inverseJoinColumns = @JoinColumn(name = "secteur_id")
    )
    @JsonIgnoreProperties("programmes")  // Prevents infinite loop
    @Builder.Default
    private Set<Secteur> secteurs = new HashSet<>();

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "couleur_theme")
    private String couleurTheme = "#ec4899";

    // Ajouter dans Programme.java (à la fin des attributs)
    // Programme.java
    @OneToMany(mappedBy = "programme", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("order ASC")
    @JsonIgnoreProperties({"programme", "sprints", "activites", "taches", "hibernateLazyInitializer", "handler"})
    private List<Sprint> sprints = new ArrayList<>();

}