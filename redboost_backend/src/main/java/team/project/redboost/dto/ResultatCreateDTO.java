package team.project.redboost.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultatCreateDTO {
    
    private Long id;  // Null for new, populated for updates
    
    @NotBlank(message = "Le nom du résultat est requis")
    private String nom;
    
    private String description;
    
    private Integer ordre;
    
    /**
     * List of KPI IDs to attach to this resultat
     */
    @Builder.Default
    private List<Long> kpiIds = new ArrayList<>();
}