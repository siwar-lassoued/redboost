// src/main/java/team/project/redboost/dto/programmeKpi/ProgrammeKpiResponse.java
package team.project.redboost.dto;

import java.util.List;
import java.util.Map;

public record ProgrammeKpiResponse(
    Long id,
    Long programmeId,
    String programmeNom,
    Long kpiId,
    String kpitype,
    String kpiNom,
    String kpiUnite,
    String valeurPrecedente,
    String valeurActuelle,
    String valeurCible,
    String typesuivi,
    String typedesaisie,
    List<Map<String, Object>> entrepreneurValues
) {}