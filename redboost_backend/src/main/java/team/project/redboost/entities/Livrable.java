package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "livrables")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Livrable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    private String type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "fichier_url")
    private String fichierUrl;

    @Column(name = "cloudinary_public_id")
    private String cloudinaryPublicId;

    @Enumerated(EnumType.STRING)
    private Statut statut = Statut.SUBMITTED;

    @Column(name = "date_soumission")
    private LocalDateTime dateSoumission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepreneur_id", nullable = false)
    private User entrepreneur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programme_id")
    private Programme programme;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tache_id")
    private Tache tache;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Column(name = "coach_comment", columnDefinition = "TEXT")
    private String coachComment;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @Column(name = "file_size")
    private String fileSize;

    @Column(name = "coach_name")
    private String coachName;

    @Column(name = "coach_email")
    private String coachEmail;

    @PrePersist
    protected void onCreate() {
        dateSoumission = LocalDateTime.now();
    }

    public enum Statut {
        SUBMITTED, PENDING, PENDING_REVIEW, ACCEPTED, REVISION, RESUBMITTED, APPROVED, REJECTED, EN_ATTENTE, SOUMIS, VALIDE, REJETE, APPROUVE, EN_REVISION
    }

    public Livrable() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getFichierUrl() { return fichierUrl; }
    public void setFichierUrl(String fichierUrl) { this.fichierUrl = fichierUrl; }
    public String getCloudinaryPublicId() { return cloudinaryPublicId; }
    public void setCloudinaryPublicId(String cloudinaryPublicId) { this.cloudinaryPublicId = cloudinaryPublicId; }
    public Statut getStatut() { return statut; }
    public void setStatut(Statut statut) { this.statut = statut; }
    public LocalDateTime getDateSoumission() { return dateSoumission; }
    public void setDateSoumission(LocalDateTime dateSoumission) { this.dateSoumission = dateSoumission; }
    public User getEntrepreneur() { return entrepreneur; }
    public void setEntrepreneur(User entrepreneur) { this.entrepreneur = entrepreneur; }
    public Programme getProgramme() { return programme; }
    public void setProgramme(Programme programme) { this.programme = programme; }
    public Tache getTache() { return tache; }
    public void setTache(Tache tache) { this.tache = tache; }
    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }
    public String getCoachComment() { return coachComment; }
    public void setCoachComment(String coachComment) { this.coachComment = coachComment; }
    public LocalDateTime getValidatedAt() { return validatedAt; }
    public void setValidatedAt(LocalDateTime validatedAt) { this.validatedAt = validatedAt; }
    public String getFileSize() { return fileSize; }
    public void setFileSize(String fileSize) { this.fileSize = fileSize; }
    public String getCoachName() { return coachName; }
    public void setCoachName(String coachName) { this.coachName = coachName; }
    public String getCoachEmail() { return coachEmail; }
    public void setCoachEmail(String coachEmail) { this.coachEmail = coachEmail; }
}
