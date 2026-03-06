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
public class ProgramWithKpisDTO {
    private Long id;
    private String nom;
    private String description;
    private List<EntrepreneurKpiDTO> kpis;
}
