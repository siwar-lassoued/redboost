package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.CreateTypeFormationRequest;
import team.project.redboost.dto.TypeFormationResponse;
import team.project.redboost.services.TypeFormationService;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/type-formation")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TypeFormationController {

    private final TypeFormationService typeFormationService;

    /**
     * Get all type formations
     * GET /api/type-formation
     */
    @GetMapping
    public ResponseEntity<List<TypeFormationResponse>> getAllTypes() {
        List<TypeFormationResponse> types = typeFormationService.getAllTypes();
        return ResponseEntity.ok(types);
    }

    /**
     * Get a specific type formation
     * GET /api/type-formation/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<TypeFormationResponse> getTypeById(@PathVariable Long id) {
        TypeFormationResponse type = typeFormationService.getTypeById(id);
        return ResponseEntity.ok(type);
    }

    /**
     * Create a new type formation
     * POST /api/type-formation
     */
    @PostMapping
    public ResponseEntity<TypeFormationResponse> createType(
            @Valid @RequestBody CreateTypeFormationRequest request) {
        TypeFormationResponse response = typeFormationService.createType(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Delete a type formation
     * DELETE /api/type-formation/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteType(@PathVariable Long id) {
        typeFormationService.deleteType(id);
        return ResponseEntity.noContent().build();
    }
}