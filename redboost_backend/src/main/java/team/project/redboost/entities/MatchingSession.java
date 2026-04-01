package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "matching_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MatchingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "programme_id", nullable = false)
    private Long programmeId;

    @Column(name = "thematique_id")
    private Long thematiqueId;

    @Builder.Default
    @Column(name = "date_matching")
    private LocalDateTime dateMatching = LocalDateTime.now();

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutSession statut = StatutSession.EN_ATTENTE;

    @Column(name = "date_validation")
    private LocalDateTime dateValidation;

    @Column(name = "valide_par_id")
    private Long valideParId;

    @Builder.Default
    @Column(name = "nb_matchings")
    private int nbMatchings = 0;

    @Column(name = "alertes_json", columnDefinition = "TEXT")
    private String alertesJson;

    @OneToMany(mappedBy = "matchingSession", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    private List<Matching> matchings = new ArrayList<>();

    public enum StatutSession {
        EN_ATTENTE, VALIDE, ARCHIVE
    }
}
