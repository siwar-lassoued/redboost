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
import team.project.redboost.repositories.ProgrammeRepository;
import team.project.redboost.repositories.SessionRepository;
import team.project.redboost.repositories.SessionCoachRepository;
import team.project.redboost.dto.ProgrammeDTO;
import team.project.redboost.dto.SessionCoachDTO;
import team.project.redboost.entities.Programme;
import team.project.redboost.entities.ThematiqueCoaching;
import team.project.redboost.entities.SessionCoach;

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
    private final ProgrammeRepository programmeRepository;
    private final SessionCoachRepository sessionCoachRepository;
    private final SessionRepository sessionRepository;

    public List<EntrepreneurCoachDTO> getMatchedCoaches(Long entrepreneurId) {
        List<Matching.StatutMatching> activeStatuses = java.util.Arrays.asList(Matching.StatutMatching.PROPOSE, Matching.StatutMatching.VALIDE, Matching.StatutMatching.TERMINE);
        return matchingRepository.findByEntrepreneurIdAndStatutIn(entrepreneurId, activeStatuses).stream()
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
                .programmeName(dto.getProgrammeName())
                .thematiqueName(dto.getThematiqueName())
                .sessionDetails(dto.getSessionDetails())
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
        dto.setSujet(r.getSujet());
        dto.setTypeReclamation(r.getTypeReclamation().name());
        dto.setDescription(r.getDescription());
        dto.setPieceJointeUrl(r.getPieceJointeUrl());
        dto.setStatut(r.getStatut().name());
        dto.setDateReclamation(r.getDateReclamation());
        dto.setRoleEmetteur(r.getRoleEmetteur() != null ? r.getRoleEmetteur().name() : "ENTREPRENEUR");
        dto.setProgrammeName(r.getProgrammeName());
        dto.setThematiqueName(r.getThematiqueName());
        dto.setSessionDetails(r.getSessionDetails());
        return dto;
    }

    public List<ProgrammeDTO> getEntrepreneurProgrammes(Long entrepreneurId) {
        List<Matching.StatutMatching> activeStatuses = java.util.Arrays.asList(Matching.StatutMatching.PROPOSE, Matching.StatutMatching.VALIDE, Matching.StatutMatching.TERMINE);
        return matchingRepository.findByEntrepreneurIdAndStatutIn(entrepreneurId, activeStatuses).stream()
                .map(m -> {
                    return programmeRepository.findById(m.getProgrammeId()).map(p -> {
                        ProgrammeDTO d = new ProgrammeDTO();
                        d.setId(p.getId());
                        d.setNom(p.getNom());
                        return d;
                    }).orElse(null);
                })
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }

    public List<java.util.Map<String, Object>> getEntrepreneurThematiques(Long entrepreneurId) {
        List<Matching.StatutMatching> activeStatuses = java.util.Arrays.asList(Matching.StatutMatching.PROPOSE, Matching.StatutMatching.VALIDE, Matching.StatutMatching.TERMINE);
        return matchingRepository.findByEntrepreneurIdAndStatutIn(entrepreneurId, activeStatuses).stream()
                .filter(m -> m.getThematiqueId() != null)
                .map(m -> thematiqueRepository.findById(m.getThematiqueId()))
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .map(t -> {
                    java.util.Map<String, Object> d = new java.util.HashMap<>();
                    d.put("id", t.getId());
                    d.put("nom", t.getNom());
                    return d;
                })
                .distinct()
                .collect(Collectors.toList());
    }

    public List<SessionCoachDTO> getEntrepreneurSessions(Long entrepreneurId) {
        // Find booked sessions for this entrepreneur
        return sessionRepository.findByEntrepreneurId(entrepreneurId).stream()
                .map(s -> {
                    SessionCoachDTO d = new SessionCoachDTO();
                    d.setId(0L); // Placeholder since Session uses String ID
                    d.setTitre(s.getTitre());
                    d.setDateSession(s.getDate() != null ? s.getDate().toLocalDate() : null);
                    return d;
                }).collect(Collectors.toList());
    }
}
