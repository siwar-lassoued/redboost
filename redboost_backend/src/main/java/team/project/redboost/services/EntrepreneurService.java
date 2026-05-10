package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.config.ValidationException;
import team.project.redboost.dto.EntrepreneurCoachDTO;
import team.project.redboost.dto.ReclamationDTO;
import team.project.redboost.entities.Matching;
import team.project.redboost.entities.Reclamation;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.MatchingRepository;
import team.project.redboost.repositories.ReclamationRepository;
import team.project.redboost.repositories.UserRepository;
import team.project.redboost.repositories.ThematiqueRepository;

import java.io.IOException;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class EntrepreneurService {

    private final MatchingRepository matchingRepository;
    private final ReclamationRepository reclamationRepository;
    private final UserRepository userRepository;
    private final LocalFileStorageService fileStorageService;
    private final ThematiqueRepository thematiqueRepository;

    public List<EntrepreneurCoachDTO> getMatchedCoaches(Long entrepreneurId) {
        return matchingRepository.findByEntrepreneurIdAndStatut(entrepreneurId, Matching.StatutMatching.VALIDE).stream()
                .map(m -> {
                    User coach = userRepository.findById(m.getCoachId()).orElse(null);
                    if (coach == null) return null;
                    
                    String thematiqueName = m.getThematiqueId() != null 
                        ? thematiqueRepository.findById(m.getThematiqueId())
                            .map(t -> t.getNom())
                            .orElse("Général")
                        : "Général";

                    return EntrepreneurCoachDTO.builder()
                            .id(coach.getId())
                            .firstName(coach.getFirstName())
                            .lastName(coach.getLastName())
                            .expertise(coach.getExpertise())
                            .thematiqueName(thematiqueName)
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public List<ReclamationDTO> getEntrepreneurReclamations(Long entrepreneurId) {
        return reclamationRepository.findByEntrepreneurId(entrepreneurId).stream()
                .filter(r -> r.getRoleEmetteur() == Reclamation.RoleEmetteur.ENTREPRENEUR)
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReclamationDTO addReclamation(Long entrepreneurId, Long coachId, ReclamationDTO dto, MultipartFile file) throws IOException {
        User entrepreneur = userRepository.findById(entrepreneurId)
                .orElseThrow(() -> new ValidationException("Entrepreneur non trouvé"));
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new ValidationException("Coach non trouvé"));

        String fileUrl = null;
        if (file != null && !file.isEmpty()) {
            String fileName = fileStorageService.uploadFile(file);
            fileUrl = "/uploads/" + fileName;
        }

        Reclamation rec = Reclamation.builder()
                .entrepreneur(entrepreneur)
                .coach(coach)
                .sujet(dto.getSujet())
                .typeReclamation(Reclamation.TypeReclamation.valueOf(dto.getTypeReclamation() != null ? dto.getTypeReclamation() : "AUTRE"))
                .description(dto.getDescription())
                .pieceJointeUrl(fileUrl != null ? fileUrl : dto.getPieceJointeUrl())
                .statut(Reclamation.StatutReclamation.EN_ATTENTE)
                .roleEmetteur(Reclamation.RoleEmetteur.ENTREPRENEUR)
                .build();

        Reclamation saved = reclamationRepository.save(rec);
        return mapToDTO(saved);
    }

    private ReclamationDTO mapToDTO(Reclamation r) {
        ReclamationDTO dto = new ReclamationDTO();
        dto.setId(r.getId());
        dto.setEntrepreneurId(r.getEntrepreneur().getId());
        dto.setEntrepreneurName(r.getEntrepreneur().getFirstName() + " " + r.getEntrepreneur().getLastName());
        dto.setCoachId(r.getCoach().getId());
        // For entrepreneur view, they might want to know WHICH coach it's about
        // I'll reuse the name field or add a coachName field to DTO if needed
        // For now, I'll use entrepreneurName as target name in the UI if needed
        dto.setSujet(r.getSujet());
        dto.setTypeReclamation(r.getTypeReclamation().name());
        dto.setDescription(r.getDescription());
        dto.setPieceJointeUrl(r.getPieceJointeUrl());
        dto.setStatut(r.getStatut().name());
        dto.setDateReclamation(r.getDateReclamation());
        dto.setRoleEmetteur(r.getRoleEmetteur() != null ? r.getRoleEmetteur().name() : "ENTREPRENEUR");
        return dto;
    }
}
