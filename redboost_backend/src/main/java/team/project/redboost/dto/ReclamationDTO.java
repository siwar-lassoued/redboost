package team.project.redboost.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReclamationDTO {
    private Long id;
    private Long coachId;
    private Long entrepreneurId;
    private String entrepreneurName;
    private String sujet;
    private String typeReclamation;
    private String description;
    private String pieceJointeUrl;
    private String statut;
    private LocalDateTime dateReclamation;
    private String roleEmetteur;
    private String programmeName;
    private String thematiqueName;
    private String sessionDetails;
}
