package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    private User coach;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepreneur_id", nullable = false)
    private User entrepreneur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programme_id")
    private Programme programme;

    @Column(nullable = false)
    private LocalDateTime date;

    @Builder.Default
    @Column(name = "duree_minutes")
    private Integer dureeMinutes = 60;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "statut", columnDefinition = "VARCHAR(50)")
    private Statut statut = Statut.PLANIFIE;

    @Column(name = "google_event_id")
    private String googleEventId;

    @Column(name = "google_meet_link")
    private String meetLink;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "type_session")
    private TypeSession typeSession = TypeSession.EN_LIGNE;

    @Column(name = "notes_coach", columnDefinition = "TEXT")
    private String notesCoach;

    @Column(name = "disponibilite_id")
    private String disponibiliteId;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "booking_statut", columnDefinition = "VARCHAR(50)")
    private BookingStatut bookingStatut = BookingStatut.CONFIRME;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booke_par_id")
    private User bookePar;

    @Column(name = "date_booking")
    private LocalDateTime dateBooking;

    @Column(name = "notes_entrepreneur", columnDefinition = "TEXT")
    private String notesEntrepreneur;

    @Column(name = "annulation_motif", columnDefinition = "TEXT")
    private String annulationMotif;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Builder.Default
    @Column(name = "reminder_24h_sent")
    private Boolean reminder24hSent = false;

    @Builder.Default
    @Column(name = "reminder_2h_sent")
    private Boolean reminder2hSent = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum Statut {
        PLANIFIE, CONFIRME, EN_COURS, TERMINE, ANNULE, DEMANDE
    }

    public enum BookingStatut {
        EN_ATTENTE, CONFIRME, ANNULE, TERMINE
    }

    public enum TypeSession {
        EN_LIGNE, PRESENTIEL
    }
}
