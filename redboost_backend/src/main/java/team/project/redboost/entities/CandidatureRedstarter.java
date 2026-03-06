package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "candidature_redstarter")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidatureRedstarter {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Step 1: Personal Information
    @Column(nullable = false)
    private String nomPrenom;
    
    @Column(nullable = false)
    private String genre;
    
    @Column(nullable = false)
    private Integer age;
    
    @Column(nullable = false)
    private String numeroTelephone;
    
    @Column(nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String roleEntreprise;
    
    // Step 2: Company Information
    @Column(nullable = false)
    private String nomEntreprise;
    
    @Column(nullable = false)
    private String entrepriseEst;
    
    private LocalDate dateCreation;
    
    @Column(nullable = false)
    private String regionBasee;
    
    @Column(length = 150, nullable = false)
    private String breveDescription;
    
    private String lienReseauxSociaux;
    
    @Column(nullable = false)
    private Boolean labelStartupAct;
    
    private LocalDate dateObtentionLabel;
    
    // Step 3: Startup Details
    @Column(nullable = false)
    private String phaseMaturite;
    
    @Column(nullable = false)
    private String marchePersonnasCibles;
    
    @Column(length = 250, nullable = false)
    private String composanteInnovation;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String impactEnvironnemental;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String impactSocial;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String viabiliteCommerciale;
    
    @Column(nullable = false)
    private String valeurAjoutee;
    
    @ElementCollection
    @CollectionTable(name = "candidature_documents", joinColumns = @JoinColumn(name = "candidature_id"))
    @Column(name = "document_path")
    private List<String> documents = new ArrayList<>();
    
    // Step 4: Team Information
    @Column(nullable = false)
    private Integer nombreCoFondateurs;
    
    @Column(nullable = false)
    private Boolean impliquesGestion;
    
    private Integer nombreImpliquesGestion;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String experienceEquipeFondatrice;
    
    @Column(nullable = false)
    private Integer nombreEmploisCrees;
    
    // Step 5: Support Needs
    @ElementCollection
    @CollectionTable(name = "candidature_besoins_accompagnement", joinColumns = @JoinColumn(name = "candidature_id"))
    @Column(name = "besoin")
    private List<String> besoinsAccompagnement = new ArrayList<>();
    
    @Column(nullable = false)
    private Boolean beneficieAccompagnement;
    
    private String detailsAccompagnement;
    
    @ElementCollection
    @CollectionTable(name = "candidature_besoins_formation", joinColumns = @JoinColumn(name = "candidature_id"))
    @Column(name = "formation")
    private List<String> besoinsFormation = new ArrayList<>();
    
    // Metadata
    @Column(nullable = false)
    private LocalDateTime dateCreationCandidature;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private StatutCandidature statut = StatutCandidature.EN_ATTENTE;
    
    private String commentairesAdmin;
    
    @PrePersist
    protected void onCreate() {
        dateCreationCandidature = LocalDateTime.now();
    }
    
    public enum StatutCandidature {
        EN_ATTENTE,
        EN_COURS_EVALUATION,
        ACCEPTE,
        REFUSE
    }
}