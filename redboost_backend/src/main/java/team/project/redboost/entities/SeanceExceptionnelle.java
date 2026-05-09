package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "seance_exceptionnelle")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SeanceExceptionnelle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thematique_id")
    private ThematiqueCoaching thematique;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    private User coach;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepreneur_id", nullable = false)
    private User entrepreneur;

    @Column(nullable = false)
    private String titre;

    @Column(name = "date_seance", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateSeance;

    @Column(name = "heure_debut", nullable = false)
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime heureDebut;

    @Column(name = "heure_fin", nullable = false)
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime heureFin;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "type_session")
    private TypeSession typeSession = TypeSession.EN_LIGNE;

    /** Adresse physique (obligatoire si typeSession == PRESENTIEL) */
    @Column(name = "adresse")
    private String adresse;

    public enum TypeSession {
        EN_LIGNE, PRESENTIEL
    }

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
