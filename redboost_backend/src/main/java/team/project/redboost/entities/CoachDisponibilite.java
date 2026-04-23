package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "coach_disponibilites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CoachDisponibilite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "coach_id", nullable = false)
    private Long coachId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JourSemaine jour;

    @Column(name = "heure_debut", nullable = false)
    private LocalTime heureDebut;

    @Column(name = "heure_fin", nullable = false)
    private LocalTime heureFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TypeDisponibilite type = TypeDisponibilite.DISPONIBLE;

    @Column(name = "date_specifique")
    private LocalDate dateSpecifique; // null = récurrent chaque semaine, non-null = date précise

    @Column(nullable = false)
    @Builder.Default
    private Boolean recurrent = true;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "actif", nullable = false)
    @Builder.Default
    private Boolean actif = true;

    public enum JourSemaine {
        LUNDI, MARDI, MERCREDI, JEUDI, VENDREDI, SAMEDI, DIMANCHE
    }

    public enum TypeDisponibilite {
        DISPONIBLE, INDISPONIBLE, RESERVE
    }
}