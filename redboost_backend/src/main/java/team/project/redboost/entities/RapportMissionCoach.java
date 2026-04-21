package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "rapports_mission_coach")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RapportMissionCoach {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programme_id", nullable = false)
    @JsonIgnoreProperties({"sprints", "secteurs", "candidatures"})
    private Programme programme;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    @JsonIgnoreProperties({"livrables", "notes"})
    private User coach;

    @Column(name = "period_type")
    private String periodType;

    @Column(name = "date_debut")
    private String dateDebut;

    @Column(name = "date_fin")
    private String dateFin;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    @Column(columnDefinition = "TEXT")
    private String presentationPhase;

    @Column(columnDefinition = "TEXT")
    private String deroulementAccompagnement;

    @Column(columnDefinition = "TEXT")
    private String resultatsObtenus;

    @Column(columnDefinition = "TEXT")
    private String suiviBeneficiaires;

    @Column(columnDefinition = "TEXT")
    private String planningSeances;

    @Column(columnDefinition = "TEXT")
    private String feedbackBeneficiaires;

    @Column(columnDefinition = "TEXT")
    private String analyseLecons;

    @Column(columnDefinition = "TEXT")
    private String recommandationsEtapes;

    @Column(columnDefinition = "TEXT")
    private String conclusion;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }
}
