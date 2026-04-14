package team.project.redboost.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "coach_ratings",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_coach_rating_session_entrepreneur",
                columnNames = {"entrepreneur_id", "session_id"}))
public class CoachRating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    private User coach;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepreneur_id", nullable = false)
    private User entrepreneur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programme_id")
    private Programme programme;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private Session session;

    @Column(name = "global_rating", nullable = false)
    private double globalRating;

    private double communication;
    private double expertise;
    private double availability;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Enumerated(EnumType.STRING)
    private RatingStatut statut;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.statut == null) this.statut = RatingStatut.NON_LU;
    }

    public enum RatingStatut {
        LU, NON_LU, ARCHIVE
    }

    public CoachRating() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getCoach() { return coach; }
    public void setCoach(User coach) { this.coach = coach; }
    public User getEntrepreneur() { return entrepreneur; }
    public void setEntrepreneur(User entrepreneur) { this.entrepreneur = entrepreneur; }
    public Programme getProgramme() { return programme; }
    public void setProgramme(Programme programme) { this.programme = programme; }
    public Session getSession() { return session; }
    public void setSession(Session session) { this.session = session; }
    public double getGlobalRating() { return globalRating; }
    public void setGlobalRating(double globalRating) { this.globalRating = globalRating; }
    public double getCommunication() { return communication; }
    public void setCommunication(double communication) { this.communication = communication; }
    public double getExpertise() { return expertise; }
    public void setExpertise(double expertise) { this.expertise = expertise; }
    public double getAvailability() { return availability; }
    public void setAvailability(double availability) { this.availability = availability; }
    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }
    public RatingStatut getStatut() { return statut; }
    public void setStatut(RatingStatut statut) { this.statut = statut; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
