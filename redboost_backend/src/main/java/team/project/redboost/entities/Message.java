package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediteur_id", nullable = false)
    private User expediteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinataire_id", nullable = false)
    private User destinataire;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 10)
    private MessageType type = MessageType.TEXT;

    @Builder.Default
    private boolean lu = false;

    // ── File metadata ───────────────────────────────────────────────
    @Column(name = "fichier_url", length = 500)
    private String fichierUrl;

    @Column(name = "fichier_nom", length = 255)
    private String fichierNom;

    @Column(name = "fichier_type", length = 100)
    private String fichierType;

    @Column(name = "fichier_taille")
    private Long fichierTaille;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }

    public enum MessageType {
        TEXT, FILE, CALL
    }
}
