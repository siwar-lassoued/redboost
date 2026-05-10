package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "reclamation")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Reclamation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    private User coach;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepreneur_id", nullable = false)
    private User entrepreneur;

    @Column(nullable = false)
    private String sujet;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "type_reclamation")
    private TypeReclamation typeReclamation = TypeReclamation.AUTRE;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    public enum TypeReclamation {
        COMPORTEMENT, RETARD, AUTRE
    }
    
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutReclamation statut = StatutReclamation.EN_ATTENTE;

    @Column(name = "date_reclamation")
    private LocalDateTime dateReclamation;

    @Column(name = "piece_jointe_url")
    private String pieceJointeUrl;

    @PrePersist
    protected void onCreate() {
        dateReclamation = LocalDateTime.now();
        if (statut == null) statut = StatutReclamation.EN_ATTENTE;
    }
    
    public enum StatutReclamation {
        EN_ATTENTE, TRAITEE, REJETEE, ANNULEE
    }
}
