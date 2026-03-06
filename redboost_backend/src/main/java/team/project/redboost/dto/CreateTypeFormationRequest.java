package team.project.redboost.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateTypeFormationRequest {
    
    @NotBlank(message = "Le nom du type de formation est obligatoire")
    private String name;
}
