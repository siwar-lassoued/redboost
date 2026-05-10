package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "rapports_session_coach")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RapportSessionCoach {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    @JsonIgnoreProperties({"livrables", "notes"})
    private User coach;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepreneur_id")
    @JsonIgnoreProperties({"livrables", "notes"})
    private User entrepreneur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thematique_id")
    @JsonIgnoreProperties({"coach", "disponibilites", "matchings"})
    private ThematiqueCoaching thematique;

    // Informations générales
    @Column(name = "entreprise_nom")
    private String entrepriseNom;

    @Column(name = "secteur_activite")
    private String secteurActivite;

    private String gouvernorat;

    @Column(name = "beneficiaire_nom")
    private String beneficiaireNom;

    @Column(name = "coach_nom")
    private String coachNom;

    @Column(name = "type_session")
    private String typeSession;

    @Column(name = "numero_session")
    private String numeroSession;

    @Column(name = "date_session")
    private String dateSession;

    // Contenu de la session
    @Column(columnDefinition = "TEXT")
    private String objectifSession;

    @Column(columnDefinition = "TEXT")
    private String deroulement;

    @Column(columnDefinition = "TEXT")
    private String apprentissage;

    @Column(columnDefinition = "TEXT")
    private String avancementActions;

    @Column(columnDefinition = "TEXT")
    private String difficultes;

    @Column(columnDefinition = "TEXT")
    private String recommandations;

    @Column(columnDefinition = "TEXT")
    private String travailProchaineSession;

    @Column(columnDefinition = "TEXT")
    private String sessionNarrative;

    // Suivi des actions
    @Column(name = "suivi_actions_json", columnDefinition = "TEXT")
    private String suiviActionsJson;

    // Validation
    @Column(name = "validation_nom")
    private String validationNom;

    @Column(name = "validation_signature", columnDefinition = "TEXT")
    private String validationSignature;

    @Column(name = "validation_date")
    private String validationDate;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    @Column(name = "pdf_path")
    private String pdfPath;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }
}
