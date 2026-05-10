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

    @Column(name = "fichier_retour_url")
    private String fichierRetourUrl;

    @Column(name = "file_retour_size")
    private String fileRetourSize;

    @Enumerated(EnumType.STRING)
    private Statut statut = Statut.TRAVAIL_DEMANDE;

    @Column(name = "date_soumission")
    private LocalDateTime dateSoumission;

    private LocalDateTime deadline;

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
    private String commentaire; // Correspond au commentaireDemande

    @Column(name = "commentaire_revision", columnDefinition = "TEXT")
    private String commentaireRevision;

    @Column(name = "commentaire_acceptation", columnDefinition = "TEXT")
    private String commentaireAcceptation;

    @Column(name = "coach_comment", columnDefinition = "TEXT")
    private String coachComment; // Ancien champ conservé par sécurité

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @Column(name = "file_size")
    private String fileSize;

    @Column(name = "coach_name")
    private String coachName;

    @Column(name = "coach_email")
    private String coachEmail;

    @Column(name = "programme_name")
    private String programmeName;
    @Column(name = "thematique_name")
    private String thematiqueName;
    @Column(name = "session_name")
    private String sessionName;
    @Transient
    private String tacheName;
    @Transient
    private java.time.LocalDate tacheDate;
    @Transient
    private String entrepreneurName;

    @PrePersist
    protected void onCreate() {
        dateSoumission = LocalDateTime.now();
    }

    public enum Statut {
        TRAVAIL_DEMANDE, SOUMIS, SUBMITTED, EN_REVISION, REVISION, RESOUMIS, ACCEPTE, REJETE
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
    public String getFichierRetourUrl() { return fichierRetourUrl; }
    public void setFichierRetourUrl(String fichierRetourUrl) { this.fichierRetourUrl = fichierRetourUrl; }
    public String getFileRetourSize() { return fileRetourSize; }
    public void setFileRetourSize(String fileRetourSize) { this.fileRetourSize = fileRetourSize; }
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
    public String getCommentaireRevision() { return commentaireRevision; }
    public void setCommentaireRevision(String commentaireRevision) { this.commentaireRevision = commentaireRevision; }
    public String getCommentaireAcceptation() { return commentaireAcceptation; }
    public void setCommentaireAcceptation(String commentaireAcceptation) { this.commentaireAcceptation = commentaireAcceptation; }
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

    public LocalDateTime getDeadline() { return deadline; }
    public void setDeadline(LocalDateTime deadline) { this.deadline = deadline; }

    public String getProgrammeName() { return programmeName; }
    public void setProgrammeName(String programmeName) { this.programmeName = programmeName; }
    public String getThematiqueName() { return thematiqueName; }
    public void setThematiqueName(String thematiqueName) { this.thematiqueName = thematiqueName; }
    public String getSessionName() { return sessionName; }
    public void setSessionName(String sessionName) { this.sessionName = sessionName; }
    public String getTacheName() { return tacheName; }
    public void setTacheName(String tacheName) { this.tacheName = tacheName; }
    public java.time.LocalDate getTacheDate() { return tacheDate; }
    public void setTacheDate(java.time.LocalDate tacheDate) { this.tacheDate = tacheDate; }
    public String getEntrepreneurName() { return entrepreneurName; }
    public void setEntrepreneurName(String entrepreneurName) { this.entrepreneurName = entrepreneurName; }
}
