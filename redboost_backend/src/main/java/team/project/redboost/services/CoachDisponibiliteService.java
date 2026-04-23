package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.dto.CoachDisponibiliteDTO;
import team.project.redboost.entities.CoachDisponibilite;
import team.project.redboost.entities.User;
import team.project.redboost.entities.Role;
import team.project.redboost.repositories.CoachDisponibiliteRepository;
import team.project.redboost.repositories.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CoachDisponibiliteService {

    private final CoachDisponibiliteRepository disponibiliteRepository;
    private final UserRepository userRepository;

    public List<CoachDisponibiliteDTO> getDisponibilitesByCoach(Long coachId) {
        validateCoach(coachId);
        return disponibiliteRepository.findByCoachIdAndActifTrue(coachId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<CoachDisponibiliteDTO> getAllDisponibilitesByCoach(Long coachId) {
        validateCoach(coachId);
        return disponibiliteRepository.findByCoachId(coachId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CoachDisponibiliteDTO createDisponibilite(Long coachId, CoachDisponibiliteDTO dto) {
        validateCoach(coachId);
        validateHeures(dto);

        CoachDisponibilite dispo = CoachDisponibilite.builder()
                .coachId(coachId)
                .jour(dto.getJour())
                .heureDebut(dto.getHeureDebut())
                .heureFin(dto.getHeureFin())
                .type(dto.getType() != null ? dto.getType() : CoachDisponibilite.TypeDisponibilite.DISPONIBLE)
                .dateSpecifique(dto.getDateSpecifique())
                .recurrent(dto.getRecurrent() != null ? dto.getRecurrent() : true)
                .note(dto.getNote())
                .actif(true)
                .build();

        CoachDisponibilite saved = disponibiliteRepository.save(dispo);
        log.info("Disponibilité créée pour le coach {} : {} de {} à {}", coachId, dispo.getJour(), dispo.getHeureDebut(), dispo.getHeureFin());
        return toDTO(saved);
    }

    @Transactional
    public CoachDisponibiliteDTO updateDisponibilite(Long coachId, Long disponibiliteId, CoachDisponibiliteDTO dto) {
        CoachDisponibilite dispo = disponibiliteRepository.findById(disponibiliteId)
                .orElseThrow(() -> new RuntimeException("Disponibilité introuvable"));

        if (!dispo.getCoachId().equals(coachId)) {
            throw new RuntimeException("Cette disponibilité n'appartient pas à ce coach");
        }

        validateHeures(dto);

        dispo.setJour(dto.getJour());
        dispo.setHeureDebut(dto.getHeureDebut());
        dispo.setHeureFin(dto.getHeureFin());
        dispo.setType(dto.getType() != null ? dto.getType() : CoachDisponibilite.TypeDisponibilite.DISPONIBLE);
        dispo.setDateSpecifique(dto.getDateSpecifique());
        dispo.setRecurrent(dto.getRecurrent() != null ? dto.getRecurrent() : true);
        dispo.setNote(dto.getNote());
        if (dto.getActif() != null) dispo.setActif(dto.getActif());

        CoachDisponibilite saved = disponibiliteRepository.save(dispo);
        log.info("Disponibilité {} mise à jour pour le coach {}", disponibiliteId, coachId);
        return toDTO(saved);
    }

    @Transactional
    public void deleteDisponibilite(Long coachId, Long disponibiliteId) {
        CoachDisponibilite dispo = disponibiliteRepository.findById(disponibiliteId)
                .orElseThrow(() -> new RuntimeException("Disponibilité introuvable"));

        if (!dispo.getCoachId().equals(coachId)) {
            throw new RuntimeException("Cette disponibilité n'appartient pas à ce coach");
        }

        disponibiliteRepository.delete(dispo);
        log.info("Disponibilité {} supprimée pour le coach {}", disponibiliteId, coachId);
    }

    @Transactional
    public void toggleDisponibilite(Long coachId, Long disponibiliteId) {
        CoachDisponibilite dispo = disponibiliteRepository.findById(disponibiliteId)
                .orElseThrow(() -> new RuntimeException("Disponibilité introuvable"));

        if (!dispo.getCoachId().equals(coachId)) {
            throw new RuntimeException("Cette disponibilité n'appartient pas à ce coach");
        }

        dispo.setActif(!dispo.getActif());
        disponibiliteRepository.save(dispo);
    }

    @Transactional
    public List<CoachDisponibiliteDTO> saveAllDisponibilites(Long coachId, List<CoachDisponibiliteDTO> dtos) {
        validateCoach(coachId);
        // Delete existing and replace
        disponibiliteRepository.deleteByCoachId(coachId);

        List<CoachDisponibilite> entities = dtos.stream().map(dto -> {
            validateHeures(dto);
            return CoachDisponibilite.builder()
                    .coachId(coachId)
                    .jour(dto.getJour())
                    .heureDebut(dto.getHeureDebut())
                    .heureFin(dto.getHeureFin())
                    .type(dto.getType() != null ? dto.getType() : CoachDisponibilite.TypeDisponibilite.DISPONIBLE)
                    .dateSpecifique(dto.getDateSpecifique())
                    .recurrent(dto.getRecurrent() != null ? dto.getRecurrent() : true)
                    .note(dto.getNote())
                    .actif(true)
                    .build();
        }).collect(Collectors.toList());

        return disponibiliteRepository.saveAll(entities)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private void validateCoach(Long coachId) {
        User user = userRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        if (user.getRole() != Role.COACH) {
            throw new RuntimeException("Cet utilisateur n'est pas un coach");
        }
    }

    private void validateHeures(CoachDisponibiliteDTO dto) {
        if (dto.getHeureDebut() == null || dto.getHeureFin() == null) {
            throw new RuntimeException("Les heures de début et de fin sont obligatoires");
        }
        if (!dto.getHeureDebut().isBefore(dto.getHeureFin())) {
            throw new RuntimeException("L'heure de début doit être avant l'heure de fin");
        }
    }

    private CoachDisponibiliteDTO toDTO(CoachDisponibilite entity) {
        return CoachDisponibiliteDTO.builder()
                .id(entity.getId())
                .coachId(entity.getCoachId())
                .jour(entity.getJour())
                .heureDebut(entity.getHeureDebut())
                .heureFin(entity.getHeureFin())
                .type(entity.getType())
                .dateSpecifique(entity.getDateSpecifique())
                .recurrent(entity.getRecurrent())
                .note(entity.getNote())
                .actif(entity.getActif())
                .build();
    }
}