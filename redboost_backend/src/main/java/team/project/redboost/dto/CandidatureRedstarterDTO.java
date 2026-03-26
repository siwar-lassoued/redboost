package team.project.redboost.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidatureRedstarterDTO {
    
    // Step 1: Personal Information
    private String nomPrenom;
    private String genre;
    private Integer age;
    private String numeroTelephone;
    private String email;
    private String roleEntreprise;
    
    // Step 2: Company Information
    private String nomEntreprise;
    private String entrepriseEst;
    private LocalDate dateCreation;
    private String regionBasee;
    private String breveDescription;
    private String lienReseauxSociaux;
    private Boolean labelStartupAct;
    private LocalDate dateObtentionLabel;
    
    // Step 3: Startup Details
    private String phaseMaturite;
    private String marchePersonnasCibles;
    private String composanteInnovation;
    private String impactEnvironnemental;
    private String impactSocial;
    private String viabiliteCommerciale;
    private String valeurAjoutee;
    private List<MultipartFile> documents;
    
    // Step 4: Team Information
    private Integer nombreCoFondateurs;
    private Boolean impliquesGestion;
    private Integer nombreImpliquesGestion;
    private String experienceEquipeFondatrice;
    private Integer nombreEmploisCrees;
    
    // Step 5: Support Needs
    private List<String> besoinsAccompagnement;
    private Boolean beneficieAccompagnement;
    private String detailsAccompagnement;
    private List<String> besoinsFormation;

    // Dynamic Form Properties
    private Long formTemplateId;
    private String dynamicAnswers;
}