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
public class EntrepreneurKpiDTO {
    private Long kpiId;
    private String nom;
    private String uniteMesure;
    private String objectif;
    private String currentValue;
    private String typesaisie;
    String valeurPrecedente;
    String valeurActuelle;
    String valeurCible;
    private List<KpiValueHistoryDTO> history;
}
