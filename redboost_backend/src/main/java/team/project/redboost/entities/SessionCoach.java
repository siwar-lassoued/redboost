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
@Table(name = "session_coach")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SessionCoach {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disponibilite_id", nullable = false)
    private Disponibilite disponibilite;

    @Column(nullable = false)
    private String titre;

    @Column(name = "date_session", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateSession;

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

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum TypeSession {
        EN_LIGNE, PRESENTIEL
    }
}
