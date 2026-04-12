package team.project.redboost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachEntrepreneurDetailDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String entreprise;
    private String secteur;
    private String profilePictureUrl;
    private String startupDescription;
    private int completionRate;
    private List<TacheDTO> tasks;
    private List<LivrableDTO> livrables;
    private List<NoteDeSyntheseDTO> notes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TacheDTO {
        private Long id;
        private String titre;
        private String description;
        private String status;
        private String dateLimite;
        private List<DocumentDTO> documents;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LivrableDTO {
        private Long id;
        private String nom;
        private String dateUpload;
        private String typeFichier;
        private Long tailleFichier;
        private String url;
        private String tacheTitre;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NoteDeSyntheseDTO {
        private Long id;
        private String date;
        private String synthese;
        private String appreciation;
    }
}
