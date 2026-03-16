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
public class ProgrammeKpiHistoryResponse {
    private Long id;
    private Long programmeKpiId;
    private String valeurPrecedente;
    private String valeurActuelle;
    private String valeurCible;
    private LocalDateTime changedAt;
    private Long changedBy;
    private Long tacheId;
    private Long activiteId;
    private String activiteNom;
    private String tacheTitre;
}