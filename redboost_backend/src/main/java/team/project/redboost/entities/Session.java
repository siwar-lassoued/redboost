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
    private Statut statut = Statut.PLANIFIEE;

    @Column(name = "google_event_id")
    private String googleEventId;

    @Column(name = "meet_link")
    private String meetLink;

    @Column(name = "notes_coach", columnDefinition = "TEXT")
    private String notesCoach;

    @Column(name = "disponibilite_id")
    private String disponibiliteId;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "booking_statut")
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

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum Statut {
        PLANIFIEE, CONFIRMEE, EN_COURS, TERMINEE, TERMINE, ANNULEE, DEMANDEE, PLANIFIE
    }

    public enum BookingStatut {
        EN_ATTENTE, CONFIRME, ANNULE, TERMINE
    }
}
