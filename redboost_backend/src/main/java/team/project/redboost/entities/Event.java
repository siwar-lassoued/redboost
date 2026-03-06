package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "events")
@Data
public class Event {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime startDateTime;

    @Column(nullable = true)
    private LocalDateTime endDateTime;

    @ManyToOne
    @JoinColumn(name = "type_formation_id", nullable = false)
    private TypeFormation type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipationMode mode;

    private String location;

    private String meetLink;

    private String googleCalendarEventId;

    private String program;

    @ElementCollection
    @CollectionTable(name = "event_participants", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "participant_email")
    private List<String> participantEmails;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private String createdBy;

    @Enumerated(EnumType.STRING)
    private EventStatus status;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = EventStatus.SCHEDULED;
        }
    }
}