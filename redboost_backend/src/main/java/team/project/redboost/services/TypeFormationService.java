package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.dto.CreateTypeFormationRequest;
import team.project.redboost.dto.TypeFormationResponse;
import team.project.redboost.entities.TypeFormation;
import team.project.redboost.repositories.TypeFormationRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TypeFormationService {

    private final TypeFormationRepository typeFormationRepository;

    /**
     * Get all type formations
     */
    public List<TypeFormationResponse> getAllTypes() {
        return typeFormationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific type formation by ID
     */
    public TypeFormationResponse getTypeById(Long id) {
        TypeFormation type = typeFormationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Type de formation not found with id: " + id));
        return mapToResponse(type);
    }

    /**
     * Create a new type formation
     */
    @Transactional
    public TypeFormationResponse createType(CreateTypeFormationRequest request) {
        // Check if type already exists
        if (typeFormationRepository.findByName(request.getName()).isPresent()) {
            throw new RuntimeException("Type de formation already exists with name: " + request.getName());
        }

        TypeFormation type = new TypeFormation();
        type.setName(request.getName());
        
        type = typeFormationRepository.save(type);
        log.info("✅ Type de formation created: {}", type.getName());
        
        return mapToResponse(type);
    }

    /**
     * Delete a type formation
     */
    @Transactional
    public void deleteType(Long id) {
        TypeFormation type = typeFormationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Type de formation not found with id: " + id));
        
        typeFormationRepository.delete(type);
        log.info("✅ Type de formation deleted: {}", type.getName());
    }

    private TypeFormationResponse mapToResponse(TypeFormation type) {
        TypeFormationResponse response = new TypeFormationResponse();
        response.setId(type.getId());
        response.setName(type.getName());
        return response;
    }
}