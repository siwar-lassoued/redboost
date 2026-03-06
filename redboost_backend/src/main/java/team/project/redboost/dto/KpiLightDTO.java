package team.project.redboost.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KpiLightDTO {
    private Long id;
    private String nom;
    private String description;
    private String unite;
    private Double valeurCible;
    private Double valeurActuelle;
}