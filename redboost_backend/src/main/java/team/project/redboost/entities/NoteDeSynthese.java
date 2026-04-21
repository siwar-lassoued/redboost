package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "note_de_synthese")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class NoteDeSynthese {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String synthese;

    @Column(columnDefinition = "TEXT")
    private String appreciation;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    @Column(columnDefinition = "TEXT")
    private String objectifSession;

    @Column(columnDefinition = "TEXT")
    private String resultats;

    @Column(columnDefinition = "TEXT")
    private String problematiques;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(columnDefinition = "TEXT")
    private String entreprise;

    @Column(columnDefinition = "TEXT")
    private String secteur;

    @Column(columnDefinition = "TEXT")
    private String gouvernorat;

    @Column(columnDefinition = "TEXT")
    private String nomBeneficiaire;

    @Column(columnDefinition = "TEXT")
    private String nomCoach;

    @Column(columnDefinition = "TEXT")
    private String typeSession;

    @Column(columnDefinition = "TEXT")
    private String numeroSession;

    @Column(columnDefinition = "TEXT")
    private String dateSession;

    @Column(columnDefinition = "TEXT")
    private String apprentissage;

    @Column(columnDefinition = "TEXT")
    private String avancementActions;

    @Column(columnDefinition = "TEXT")
    private String travailAPreparer;

    @Column(columnDefinition = "TEXT")
    private String actionsSuivi;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rendez_vous_id")
    private SessionCoach rendezVous;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepreneur_id")
    private User entrepreneur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id")
    private User coach;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }
}
