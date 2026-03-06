package team.project.redboost.dto;

import jakarta.validation.constraints.*;
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
    @NotBlank(message = "Le nom et prénom sont obligatoires")
    private String nomPrenom;
    
    @NotBlank(message = "Le genre est obligatoire")
    private String genre;
    
    @NotNull(message = "L'âge est obligatoire")
    @Min(value = 18, message = "L'âge minimum est 18 ans")
    private Integer age;
    
    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Pattern(regexp = "^[+]?[0-9]{8,15}$", message = "Format de téléphone invalide")
    private String numeroTelephone;
    
    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;
    
    @NotBlank(message = "Le rôle au sein de l'entreprise est obligatoire")
    private String roleEntreprise;
    
    // Step 2: Company Information
    @NotBlank(message = "Le nom de l'entreprise est obligatoire")
    private String nomEntreprise;
    
    @NotBlank(message = "Le statut de l'entreprise est obligatoire")
    private String entrepriseEst;
    
    private LocalDate dateCreation;
    
    @NotBlank(message = "La région est obligatoire")
    private String regionBasee;
    
    @NotBlank(message = "La description est obligatoire")
    @Size(max = 150, message = "La description ne peut pas dépasser 150 caractères")
    private String breveDescription;
    
    private String lienReseauxSociaux;
    
    @NotNull(message = "Veuillez indiquer si vous avez le label startupAct")
    private Boolean labelStartupAct;
    
    private LocalDate dateObtentionLabel;
    
    // Step 3: Startup Details
    @NotBlank(message = "La phase de maturité est obligatoire")
    private String phaseMaturite;
    
    @NotBlank(message = "Le marché et personas cibles sont obligatoires")
    private String marchePersonnasCibles;
    
    @NotBlank(message = "La composante innovation est obligatoire")
    @Size(max = 250, message = "La composante innovation ne peut pas dépasser 250 caractères")
    private String composanteInnovation;
    
    @NotBlank(message = "L'impact environnemental est obligatoire")
    private String impactEnvironnemental;
    
    @NotBlank(message = "L'impact social est obligatoire")
    private String impactSocial;
    
    @NotBlank(message = "La viabilité commerciale est obligatoire")
    private String viabiliteCommerciale;
    
    @NotNull(message = "La valeur ajoutée est obligatoire")
    private String valeurAjoutee;
    
    private List<MultipartFile> documents;
    
    // Step 4: Team Information
    @NotNull(message = "Le nombre de co-fondateurs est obligatoire")
    @Min(value = 0, message = "Le nombre de co-fondateurs ne peut pas être négatif")
    private Integer nombreCoFondateurs;
    
    @NotNull(message = "Veuillez indiquer si les co-fondateurs sont impliqués")
    private Boolean impliquesGestion;
    
    private Integer nombreImpliquesGestion;
    
    @NotBlank(message = "L'expérience de l'équipe fondatrice est obligatoire")
    private String experienceEquipeFondatrice;
    
    @NotNull(message = "Le nombre d'emplois créés est obligatoire")
    @Min(value = 0, message = "Le nombre d'emplois créés ne peut pas être négatif")
    private Integer nombreEmploisCrees;
    
    // Step 5: Support Needs
    @NotEmpty(message = "Veuillez sélectionner au moins un besoin d'accompagnement")
    private List<String> besoinsAccompagnement;
    
    @NotNull(message = "Veuillez indiquer si vous avez déjà bénéficié d'un accompagnement")
    private Boolean beneficieAccompagnement;
    
    private String detailsAccompagnement;
    
    private List<String> besoinsFormation;
}