package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "matchings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Matching {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matching_session_id")
    @JsonIgnore
    private MatchingSession matchingSession;

    @Column(name = "coach_id", nullable = false)
    private Long coachId;

    @Column(name = "entrepreneur_id", nullable = false)
    private Long entrepreneurId;

    @Column(name = "programme_id", nullable = false)
    private Long programmeId;

    @Column(name = "thematique_id")
    private Long thematiqueId;

    @Column(name = "score_ia")
    private Double scoreIa;

    @Column(name = "scores_detail", columnDefinition = "TEXT")
    private String scoresDetail;

    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification;

    @Column(name = "points_forts", columnDefinition = "TEXT")
    private String pointsForts;

    @Column(name = "points_attention", columnDefinition = "TEXT")
    private String pointsAttention;

    @Column(name = "recommandation_session_1", columnDefinition = "TEXT")
    private String recommandationSession1;

    /** Rang dans le TOP 3 proposé pour cet entrepreneur (1=recommandé, 2, 3) */
    @Column(name = "rank_top")
    private Integer rankTop;

    /** Bloc JSON decision_support généré par l'IA pour aider l'admin */
    @Column(name = "decision_support", columnDefinition = "TEXT")
    private String decisionSupport;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutMatching statut = StatutMatching.PROPOSE;

    @Column(name = "date_validation")
    private LocalDateTime dateValidation;

    @Column(name = "date_fin_prevue")
    private LocalDateTime dateFinPrevue;

    @Column(name = "date_fin_reelle")
    private LocalDateTime dateFinReelle;

    public enum StatutMatching {
        PROPOSE, VALIDE, TERMINE, LIBERE
    }
}
