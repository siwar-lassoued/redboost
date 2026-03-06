package team.project.redboost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiValueHistoryDTO {
    private String valeurActuelle;
    private String valeurPrecedente;
    private String valeurCible;
    private LocalDateTime changedAt;
}
