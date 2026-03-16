package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.dto.*;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActiviteService {

    private final ActiviteRepository activiteRepository;
    private final TacheRepository tacheRepository;
    private final SprintRepository sprintRepository;
    private final BackofficeKpiRepository kpiRepository;
    private final ActiviteKpiRepository activiteKpiRepository;
    private final TacheKpiRepository tacheKpiRepository;
    private final DateValidationService dateValidationService;
    private final UserRepository userRepository;
    private final NotificationService notificationService; // Inject the new service
    private final ProgrammeKpiRepository programmeKpiRepository;
    private final ProgrammeKpiService programmeKpiService;
    private final ActiviteKpiHistoryRepository activiteKpiHistoryRepository;
    private final TacheKpiHistoryRepository tacheKpiHistoryRepository;

    // ==================== CRUD ACTIVITÉ & TÂCHE ====================
    public Activite createActivity(Long sprintId, Activite activite, List<Long> kpiIds) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint non trouvé"));

        // Validate activite dates against sprint dates
        dateValidationService.validateActiviteDates(
                sprintId,
                activite.getDateDebut(),
                activite.getDateLimite()
        );

        activite.setSprint(sprint);
        updateStatusBasedOnDate(activite);
        Activite saved = activiteRepository.save(activite);

        if (kpiIds != null && !kpiIds.isEmpty()) {
            attachKpisToActivite(saved.getId(), kpiIds);
        }

        // Send notification to the assigned responsible
        if (saved.getResponsableId() != null) {
            notificationService.createAndSendNotification(
                    saved.getResponsableId(),
                    "Vous avez été assigné à une nouvelle activité : " + saved.getNom(),
                    "ACTIVITY_ASSIGNMENT", // Type of notification
                    saved.getId() // ID of the activity
            );
        }

        // Check and update sprint status
        checkAndUpdateSprintStatus(sprint);

        return saved;
    }

    @Transactional
    public ActiviteDetailDTO updateActivity(Long activityId, Activite updated, List<Long> kpiIds) {
        Activite existing = activiteRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activité non trouvée"));

        // Validate updated dates
        dateValidationService.validateActiviteDatesForUpdate(
                activityId,
                updated.getDateDebut(),
                updated.getDateLimite()
        );

        Long oldResponsableId = existing.getResponsableId();
        Long newResponsableId = updated.getResponsableId();

        // Standard fields (Assuming these are always present/required in both modals)
        existing.setNom(updated.getNom());
        existing.setDescription(updated.getDescription());
        existing.setDateDebut(updated.getDateDebut());
        existing.setDateLimite(updated.getDateLimite());
        existing.setResponsableId(updated.getResponsableId());
        existing.setType(updated.getType()); // ✅ Type is required in both modals

        // 👇 SAFE UPDATE: Only update these if the frontend sent them 👇
        if (updated.getObjectif() != null) {
            existing.setObjectif(updated.getObjectif());
        }

        if (updated.getMethodologie() != null) {
            existing.setMethodologie(updated.getMethodologie());
        }

        if (updated.getResultatAttendu() != null) {
            existing.setResultatAttendu(updated.getResultatAttendu());
        }
        // 👆 END SAFE UPDATE 👆

        updateStatusBasedOnDate(existing);
        Activite saved = activiteRepository.save(existing);

        // Replace KPIs logic (remains the same)
        activiteKpiRepository.findByActiviteId(activityId)
                .forEach(activiteKpiRepository::delete);

        if (kpiIds != null && !kpiIds.isEmpty()) {
            attachKpisToActivite(saved.getId(), kpiIds);
        }

        // Send notification if responsible has changed or is newly assigned
        if (newResponsableId != null && !newResponsableId.equals(oldResponsableId)) {
            notificationService.createAndSendNotification(
                    newResponsableId,
                    "Vous avez été assigné à l'activité : " + saved.getNom(),
                    "ACTIVITY_ASSIGNMENT", // Type of notification
                    saved.getId() // ID of the activity
            );
        }

        return mapToActiviteDetailDTO(saved);
    }
    private void attachKpisToActivite(Long activiteId, List<Long> kpiIds) {
        for (Long kpiId : kpiIds) {
            BackofficeKpi kpi = kpiRepository.findById(kpiId)
                    .orElseThrow(() -> new RuntimeException("KPI non trouvé: " + kpiId));


            boolean exists = activiteKpiRepository.findByActiviteIdAndKpiId(activiteId, kpiId).isPresent();
            if (!exists) {
                ActiviteKpi ak = ActiviteKpi.builder()
                        .activiteId(activiteId)
                        .kpiId(kpiId)
                        .build();
                activiteKpiRepository.save(ak);
            }
        }
    }

    public void deleteActivity(Long activityId) {
        Activite activite = activiteRepository.findById(activityId).orElse(null);
        if (activite != null) {
            Long programmeId = (activite.getSprint() != null && activite.getSprint().getProgramme() != null)
                ? activite.getSprint().getProgramme().getId() : null;

            // For each KPI in the activity and its tasks, trigger an update with a negative delta
            if (programmeId != null) {
                // Handle ActiviteKpis
                activiteKpiRepository.findByActiviteId(activityId).forEach(ak -> {
                    double oldValue = parseDouble(ak.getValeurActuelle());
                    if (oldValue != 0) {
                        programmeKpiService.updateOperationalKpi(programmeId, ak.getKpiId(), -oldValue, activityId, null);
                    }
                });
                // Handle TacheKpis within the activity
                tacheRepository.findByActiviteId(activityId).forEach(tache -> {
                    tacheKpiRepository.findByTacheId(tache.getId()).forEach(tk -> {
                        double oldValue = parseDouble(tk.getValeurActuelle());
                        if (oldValue != 0) {
                            programmeKpiService.updateOperationalKpi(programmeId, tk.getKpiId(), -oldValue, null, tache.getId());
                        }
                    });
                });
            }

            Sprint sprint = activite.getSprint();
            activiteRepository.deleteById(activityId); // This will cascade delete Taches, TacheKpis, etc.
            
            if (sprint != null) {
                checkAndUpdateSprintStatus(sprint);
            }
        }
    }

    public Tache createTache(Long activiteId, Tache tache, List<Long> kpiIds) {
        Activite activite = activiteRepository.findById(activiteId)
                .orElseThrow(() -> new RuntimeException("Activité non trouvée"));

        // Validate tache dates against activite dates
        dateValidationService.validateTacheDates(
                activiteId,
                tache.getDateDebut(),
                tache.getDateLimite()
        );

        // Validate that all requested KPIs belong to the Activite
        if (kpiIds != null && !kpiIds.isEmpty()) {
            Set<Long> activiteKpiIds = activiteKpiRepository.findByActiviteId(activiteId).stream()
                    .map(ActiviteKpi::getKpiId)
                    .collect(Collectors.toSet());

            for (Long kpiId : kpiIds) {
                if (!activiteKpiIds.contains(kpiId)) {
                    BackofficeKpi kpi = kpiRepository.findById(kpiId)
                            .orElseThrow(() -> new RuntimeException("KPI non trouvé: " + kpiId));
                    throw new RuntimeException(
                            "Le KPI '" + kpi.getNom() + "' n'est pas assigné à l'activité parente. " +
                                    "Vous ne pouvez assigner que les KPIs déjà présents sur l'activité."
                    );
                }
            }
        }

        tache.setActivite(activite);
        updateStatusBasedOnDate(tache);
        Tache saved = tacheRepository.save(tache);

        if (kpiIds != null && !kpiIds.isEmpty()) {
            attachKpisToTache(saved.getId(), kpiIds);
        }

        // Send notification to the assigned responsible
        if (saved.getResponsableId() != null) {
            notificationService.createAndSendNotification(
                    saved.getResponsableId(),
                    "Vous avez été assigné à une nouvelle tâche : " + saved.getTitre(),
                    "TASK_ASSIGNMENT", // Type of notification
                    saved.getId() // ID of the task
            );
        }

        // Check and update activity status
        checkAndUpdateActiviteStatus(activite);

        return saved;
    }

    public Tache updateTache(Long tacheId, Tache updated, List<Long> kpiIds) {
        Tache existing = tacheRepository.findById(tacheId)
                .orElseThrow(() -> new RuntimeException("Tâche non trouvée"));

        Activite activite = existing.getActivite();

        // Validate tache dates against activite dates
        dateValidationService.validateTacheDates(
                activite.getId(),
                updated.getDateDebut(),
                updated.getDateLimite()
        );

        // Validate KPIs
        if (kpiIds != null && !kpiIds.isEmpty()) {
            Set<Long> activiteKpiIds = activiteKpiRepository.findByActiviteId(activite.getId()).stream()
                    .map(ActiviteKpi::getKpiId)
                    .collect(Collectors.toSet());

            for (Long kpiId : kpiIds) {
                if (!activiteKpiIds.contains(kpiId)) {
                    BackofficeKpi kpi = kpiRepository.findById(kpiId).orElse(null);
                    String nom = kpi != null ? kpi.getNom() : "ID=" + kpiId;
                    throw new RuntimeException(
                            "Impossible d'assigner le KPI '" + nom + "' : il n'est pas dans les KPIs de l'activité parente."
                    );
                }
            }
        }

        Long oldResponsableId = existing.getResponsableId();
        Long newResponsableId = updated.getResponsableId();
        Tache.StatusTache oldStatus = existing.getStatus();
        Tache.StatusTache newStatus = updated.getStatus();

        existing.setTitre(updated.getTitre());
        existing.setDescription(updated.getDescription());
        existing.setResponsableId(updated.getResponsableId());
        existing.setPriorite(updated.getPriorite());
        existing.setDateDebut(updated.getDateDebut());
        existing.setDateLimite(updated.getDateLimite());
        existing.setDifficulte(updated.getDifficulte());
        existing.setStatus(newStatus);

        updateStatusBasedOnDate(existing);
        Tache.StatusTache currentStatus = existing.getStatus();

        // Automatically set dateFinReel when status changes to TERMINEE
        if (currentStatus == Tache.StatusTache.TERMINEE && oldStatus != Tache.StatusTache.TERMINEE) {
            existing.setDateFinReel(LocalDate.now());
        } else if (currentStatus != Tache.StatusTache.TERMINEE && oldStatus == Tache.StatusTache.TERMINEE) {
            // Reset dateFinReel if task is reopened
            existing.setDateFinReel(null);
        }

        Tache saved = tacheRepository.save(existing);

        // Replace KPIs
        tacheKpiRepository.findByTacheId(tacheId).forEach(tacheKpiRepository::delete);
        if (kpiIds != null && !kpiIds.isEmpty()) {
            attachKpisToTache(saved.getId(), kpiIds);
        }

        // Send notification if responsible has changed or is newly assigned
        if (newResponsableId != null && !newResponsableId.equals(oldResponsableId)) {
            notificationService.createAndSendNotification(
                    newResponsableId,
                    "Vous avez été assigné à la tâche : " + saved.getTitre(),
                    "TASK_ASSIGNMENT", // Type of notification
                    saved.getId() // ID of the task
            );
        }

        // Check if all tasks in the activity are completed
        checkAndUpdateActiviteStatus(activite);

        return saved;
    }

    private void checkAndUpdateActiviteStatus(Activite activite) {
        List<Tache> taches = tacheRepository.findByActiviteId(activite.getId());
        boolean allCompleted = !taches.isEmpty() && taches.stream()
                .allMatch(t -> t.getStatus() == Tache.StatusTache.TERMINEE);

        boolean statusChanged = false;
        if (allCompleted && activite.getStatus() != Activite.StatusActivite.TERMINEE) {
            activite.setStatus(Activite.StatusActivite.TERMINEE);
            activite.setDateFinReel(LocalDate.now());
            activiteRepository.save(activite);
            statusChanged = true;
        } else if (!allCompleted && activite.getStatus() == Activite.StatusActivite.TERMINEE) {
            // If activity was completed but a task is reopened or added, revert status
            // Logic can be refined: e.g., revert to EN_COURS
            activite.setStatus(Activite.StatusActivite.EN_COURS);
            activite.setDateFinReel(null);
            activiteRepository.save(activite);
            statusChanged = true;
        }

        // If activity status changed, check sprint status
        if (statusChanged && activite.getSprint() != null) {
            checkAndUpdateSprintStatus(activite.getSprint());
        }
    }

    private void checkAndUpdateSprintStatus(Sprint sprint) {
        List<Activite> activites = activiteRepository.findBySprintId(sprint.getId());
        boolean allCompleted = !activites.isEmpty() && activites.stream()
                .allMatch(a -> a.getStatus() == Activite.StatusActivite.TERMINEE);

        if (allCompleted && sprint.getStatus() != Sprint.StatusSprint.TERMINEE) {
            sprint.setStatus(Sprint.StatusSprint.TERMINEE);
            sprint.setDateFinReel(LocalDate.now());
            sprintRepository.save(sprint);
        } else if (!allCompleted && sprint.getStatus() == Sprint.StatusSprint.TERMINEE) {
            // If sprint was completed but an activity is reopened or added, revert status
            sprint.setStatus(Sprint.StatusSprint.EN_COURS);
            sprint.setDateFinReel(null);
            sprintRepository.save(sprint);
        }
    }

    private void attachKpisToTache(Long tacheId, List<Long> kpiIds) {
        for (Long kpiId : kpiIds) {
            BackofficeKpi kpi = kpiRepository.findById(kpiId)
                    .orElseThrow(() -> new RuntimeException("KPI non trouvé: " + kpiId));

            TacheKpi tk = TacheKpi.builder()
                    .tacheId(tacheId)
                    .kpiId(kpiId)
                    .build();
            tacheKpiRepository.save(tk);
        }
    }

    public void deleteTache(Long tacheId) {
        Tache tache = tacheRepository.findById(tacheId).orElse(null);
        if (tache != null) {
            Long programmeId = (tache.getActivite() != null && tache.getActivite().getSprint() != null && tache.getActivite().getSprint().getProgramme() != null)
                ? tache.getActivite().getSprint().getProgramme().getId() : null;

            // For each KPI in the task, trigger an update with a negative delta
            if (programmeId != null) {
                tacheKpiRepository.findByTacheId(tacheId).forEach(tk -> {
                    double oldValue = parseDouble(tk.getValeurActuelle());
                    if (oldValue != 0) {
                        programmeKpiService.updateOperationalKpi(programmeId, tk.getKpiId(), -oldValue, null, tacheId);
                    }
                });
            }

            Activite activite = tache.getActivite();
            tacheRepository.deleteById(tacheId);
            
            if (activite != null) {
                checkAndUpdateActiviteStatus(activite);
            }
        }
    }

    public List<Tache> getTachesByActiviteId(Long activiteId) {
        return tacheRepository.findByActiviteId(activiteId);
    }

    // ==================== DETAILED SPRINTS (with calculations) ====================
    public List<SprintDetailDTO> getSprintsWithDetails(Long programmeId) {
        // Correctly use ordered list
        List<Sprint> sprints = sprintRepository.findByProgrammeIdOrderByOrderAsc(programmeId);
        return sprints.stream().map(this::mapToSprintDetailDTO).toList();
    }


    public List<SprintDetailDTO> getAllSprintsWithDetailsGlobal() {
        return sprintRepository.findAll().stream()
                .map(this::mapToSprintDetailDTO)
                .toList();
    }



    private SprintDetailDTO mapToSprintDetailDTO(Sprint sprint) {
        List<Activite> activites = sprint.getActivites();

        int retardSprint = calculerRetardJours(sprint.getDateLimite());
        int progressionSprint = calculerProgressionActivites(activites);

        String statusSprint = determinerStatus(sprint.getDateDebut(), sprint.getDateLimite(), progressionSprint, retardSprint);

        List<ActiviteDetailDTO> activiteDTOs = activites.stream()
                .map(this::mapToActiviteDetailDTO)
                .toList();

        List<DocumentDTO> documents = sprint.getDocuments().stream()
                .map(doc -> DocumentDTO.builder()
                        .id(doc.getId())
                        .nom(doc.getNom())
                        .cheminFichier(doc.getCheminFichier())
                        .typeFichier(doc.getTypeFichier())
                        .tailleFichier(doc.getTailleFichier())
                        .dateUpload(doc.getDateUpload())
                        .uploadedById(doc.getUploadedById())
                        .build())
                .toList();

        return SprintDetailDTO.builder()
                .id(sprint.getId())
                .nom(sprint.getNom())
                .description(sprint.getDescription())
                .dateDebut(sprint.getDateDebut())
                .dateFin(sprint.getDateLimite())
                .status(statusSprint)
                .retardJours(retardSprint)
                .progression(progressionSprint)
                .nombreActivites(activites.size())
                .programmeId(sprint.getProgramme().getId())
                .programmeNom(sprint.getProgramme().getNom())
                .activites(activiteDTOs)
                .documents(documents)
                .build();
    }

    private ActiviteDetailDTO mapToActiviteDetailDTO(Activite activite) {
        List<Tache> taches = activite.getTaches();
        int retard = calculerRetardJours(activite.getDateLimite());
        int progression = calculerProgression(taches);
        String status = determinerStatus(activite.getDateDebut(), activite.getDateLimite(), progression, retard);

        List<KpiWithCategoryDTO> kpis = getKpisWithCategoryForActivite(activite.getId());

        List<TacheDetailDTO> tacheDTOs = taches.stream()
                .map(this::mapToTacheDetailDTO)
                .toList();

        List<DocumentDTO> documents = activite.getDocuments().stream()
                .map(doc -> DocumentDTO.builder()
                        .id(doc.getId())
                        .nom(doc.getNom())
                        .cheminFichier(doc.getCheminFichier())
                        .typeFichier(doc.getTypeFichier())
                        .tailleFichier(doc.getTailleFichier())
                        .dateUpload(doc.getDateUpload())
                        .uploadedById(doc.getUploadedById())
                        .build())
                .toList();

        Sprint sprint = activite.getSprint();
        String sprintNom = sprint != null ? sprint.getNom() : "Sprint supprimé";
        Long sprintId = sprint != null ? sprint.getId() : null;
        String programmeNom = (sprint != null && sprint.getProgramme() != null)
                ? sprint.getProgramme().getNom()
                : "Programme supprimé";
        Long programmeId = (sprint != null && sprint.getProgramme() != null)
                ? sprint.getProgramme().getId()
                : null;

        return ActiviteDetailDTO.builder()
                .id(activite.getId())
                .nom(activite.getNom())
                .description(activite.getDescription())
                .objectif(activite.getObjectif())              // NEW
                .methodologie(activite.getMethodologie())      // NEW
                .resultatAttendu(activite.getResultatAttendu()) // NEW
                .type(activite.getType())                      // NEW
                .dateDebut(activite.getDateDebut())
                .dateFin(activite.getDateLimite())
                .responsableId(activite.getResponsableId())
                .status(status)
                .retardJours(retard)
                .progression(progression)
                .nombreTaches(taches.size())
                .kpis(kpis)
                .taches(tacheDTOs)
                .documents(documents)
                .sprintNom(sprintNom)
                .programmeNom(programmeNom)
                .sprintId(sprintId)
                .programmeId(programmeId)
                .build();
    }

    public List<KpiWithCategoryDTO> getKpisWithCategoryForTache(Long tacheId) {
        return tacheKpiRepository.findByTacheId(tacheId).stream()
                .map(tk -> {
                    BackofficeKpi kpi = kpiRepository.findById(tk.getKpiId()).orElse(null);
                    if (kpi == null) return null;
                    
                    KpiWithCategoryDTO dto = mapToKpiWithCategoryDTO(kpi);
                    dto.setValeur(tk.getValeurActuelle());
                    dto.setValeurCible(tk.getValeurCible());
                    return dto;
                })
                .filter(Objects::nonNull)
                .toList();
    }

    public TacheDetailDTO mapToTacheDetailDTO(Tache tache) {
        List<KpiWithCategoryDTO> kpis = getKpisWithCategoryForTache(tache.getId());

        List<DocumentDTO> documents = tache.getDocuments().stream()
                .map(doc -> DocumentDTO.builder()
                        .id(doc.getId())
                        .nom(doc.getNom())
                        .cheminFichier(doc.getCheminFichier())
                        .typeFichier(doc.getTypeFichier())
                        .tailleFichier(doc.getTailleFichier())
                        .dateUpload(doc.getDateUpload())
                        .uploadedById(doc.getUploadedById())
                        .build())
                .toList();

        Activite activite = tache.getActivite();
        String activiteNom = activite != null ? activite.getNom() : "Activité supprimée";
        Long activiteId = activite != null ? activite.getId() : null;

        Sprint sprint = activite != null ? activite.getSprint() : null;
        String sprintNom = sprint != null ? sprint.getNom() : "Sprint supprimé";
        Long sprintId = sprint != null ? sprint.getId() : null;

        String programmeNom = (sprint != null && sprint.getProgramme() != null)
                ? sprint.getProgramme().getNom()
                : "Programme supprimé";
        Long programmeId = (sprint != null && sprint.getProgramme() != null)
                ? sprint.getProgramme().getId()
                : null;

        return TacheDetailDTO.builder()
                .id(tache.getId())
                .titre(tache.getTitre())
                .description(tache.getDescription())
                .priorite(tache.getPriorite())
                .status(tache.getStatus().name())
                .responsableId(tache.getResponsableId())
                .dateDebut(tache.getDateDebut())
                .dateLimite(tache.getDateLimite())
                .difficulte(tache.getDifficulte())
                .kpis(kpis)
                .documents(documents)
                .activiteNom(activiteNom)
                .activiteId(activiteId)
                .sprintNom(sprintNom)
                .sprintId(sprintId)
                .programmeNom(programmeNom)
                .programmeId(programmeId)
                .build();
    }

    private int calculerRetardJours(LocalDate dateLimite) {
        if (dateLimite == null) return 0;
        LocalDate today = LocalDate.now();
        return dateLimite.isBefore(today) ? (int) ChronoUnit.DAYS.between(dateLimite, today) : 0;
    }

    private int calculerProgression(List<Tache> taches) {
        if (taches.isEmpty()) return 0;
        long terminees = taches.stream()
                .filter(t -> t.getStatus() == Tache.StatusTache.TERMINEE)
                .count();
        return (int) Math.round((terminees * 100.0) / taches.size());
    }

    private int calculerProgressionActivites(List<Activite> activites) {
        if (activites.isEmpty()) return 0;
        double totalProgression = activites.stream()
                .mapToInt(activite -> calculerProgression(activite.getTaches()))
                .average()
                .orElse(0.0);
        return (int) Math.round(totalProgression);
    }

    private String determinerStatus(LocalDate dateDebut, LocalDate dateFin, int progression, int retardJours) {
        LocalDate today = LocalDate.now();
        if (progression == 100) return "TERMINEE";
        if (dateFin != null && dateFin.isBefore(today) && progression < 100) return "EN_RETARD";
        if ((dateDebut != null && !dateDebut.isAfter(today)) || progression > 0) return "EN_COURS";
        return "NON_DEMARREE";
    }

    public List<BackofficeKpi> getKpisForActivite(Long activiteId) {
        return activiteKpiRepository.findByActiviteId(activiteId).stream()
                .map(ak -> kpiRepository.findById(ak.getKpiId()).orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }

    public List<BackofficeKpi> getKpisForTache(Long tacheId) {
        return tacheKpiRepository.findByTacheId(tacheId).stream()
                .map(tk -> kpiRepository.findById(tk.getKpiId()).orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }

    public List<KpiWithCategoryDTO> getKpisWithCategoryForActivite(Long activiteId) {
        Activite activite = activiteRepository.findById(activiteId).orElse(null);
        Long programmeId = null;
        if (activite != null && activite.getSprint() != null && activite.getSprint().getProgramme() != null) {
            programmeId = activite.getSprint().getProgramme().getId();
        }

        final Long finalProgrammeId = programmeId;

        return activiteKpiRepository.findByActiviteId(activiteId).stream()
                .map(ak -> {
                    BackofficeKpi kpi = kpiRepository.findById(ak.getKpiId()).orElse(null);
                    if (kpi == null) return null;
                    
                    KpiWithCategoryDTO dto = mapToKpiWithCategoryDTO(kpi, finalProgrammeId);
                    dto.setValeur(ak.getValeurActuelle());
                    dto.setValeurCible(ak.getValeurCible());
                    return dto;
                })
                .filter(Objects::nonNull)
                .toList();
    }

    private KpiWithCategoryDTO mapToKpiWithCategoryDTO(BackofficeKpi kpi) {
        return mapToKpiWithCategoryDTO(kpi, null);
    }

    private KpiWithCategoryDTO mapToKpiWithCategoryDTO(BackofficeKpi kpi, Long programmeId) {
        BackofficeCategory category = kpi.getCategory();
        String valeurActuelle = null;

        if (programmeId != null) {
            valeurActuelle = programmeKpiRepository.findByProgrammeIdAndKpiId(programmeId, kpi.getId())
                    .map(ProgrammeKpi::getValeurActuelle)
                    .orElse(null);
        }

        return KpiWithCategoryDTO.builder()
                .id(kpi.getId())
                .nom(kpi.getNom())
                .description(kpi.getDescription())
                .uniteMesure(kpi.getUniteMesure())
                .type(kpi.getType())
                .categoryId(category != null ? category.getId() : null)
                .categoryNom(category != null ? category.getNom() : "Sans catégorie")
                .categoryCouleur(category != null ? category.getCouleur() : "#94a3b8")
                .valeurActuelle(valeurActuelle)
                .build();
    }

    public List<ActiviteDetailDTO> getActivitesByResponsableId(Long responsableId) {
        List<Activite> activites = activiteRepository.findByResponsableId(responsableId);
        return activites.stream()
                .map(this::mapToActiviteDetailDTO)
                .toList();
    }

    public List<TacheDetailDTO> getTachesByResponsableId(Long responsableId) {
        List<Tache> taches = tacheRepository.findByResponsableId(responsableId);
        return taches.stream()
                .map(this::mapToTacheDetailDTO)
                .toList();
    }



    public Tache marquerCommeTerminee(Long tacheId) {
        Tache tache = tacheRepository.findById(tacheId)
                .orElseThrow(() -> new RuntimeException("Tâche non trouvée"));

        if (tache.getStatus() == Tache.StatusTache.TERMINEE) {
            throw new RuntimeException("La tâche est déjà terminée");
        }

        tache.setStatus(Tache.StatusTache.TERMINEE);
        tache.setDateFinReel(LocalDate.now()); // Set actual end date
        Tache saved = tacheRepository.save(tache);
        
        // Check if all tasks in the activity are completed
        checkAndUpdateActiviteStatus(tache.getActivite());
        
        return saved;
    }

    public Tache rouvrirTache(Long tacheId) {
        Tache tache = tacheRepository.findById(tacheId)
                .orElseThrow(() -> new RuntimeException("Tâche non trouvée"));

        if (tache.getStatus() != Tache.StatusTache.TERMINEE) {
            throw new RuntimeException("Seules les tâches terminées peuvent être rouvertes");
        }

        tache.setStatus(Tache.StatusTache.EN_COURS);
        tache.setDateFinReel(null); // Reset actual end date
        Tache saved = tacheRepository.save(tache);
        
        // Check if activity status needs to be reverted
        checkAndUpdateActiviteStatus(tache.getActivite());
        
        return saved;
    }
    public SprintDetailDTO getSprintFullDetail(Long sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint non trouvé"));

        return mapToSprintDetailDTO(sprint);
    }


    @Transactional
    public Activite patchActivityFields(Long activityId, Map<String, String> fields) {
        Activite activite = activiteRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activité non trouvée"));

        // Update only the fields that are provided
        if (fields.containsKey("methodologie")) {
            activite.setMethodologie(fields.get("methodologie"));
        }
        if (fields.containsKey("objectif")) {
            activite.setObjectif(fields.get("objectif"));
        }
        if (fields.containsKey("resultatAttendu")) {
            activite.setResultatAttendu(fields.get("resultatAttendu"));
        }
        if (fields.containsKey("type")) {
            activite.setType(fields.get("type"));
        }

        // No date validation needed for partial updates
        return activiteRepository.save(activite);
    }


    public List<Activite> getActivitesBySprintId(Long sprintId) {
        return activiteRepository.findBySprintId(sprintId);
    }

    public Map<String, Long> countActivitiesByTypeForProgramme(Long programmeId) {
        List<Object[]> results = activiteRepository.countActivitiesByTypeForProgramme(programmeId);
        Map<String, Long> counts = new HashMap<>();
        for (Object[] result : results) {
            String type = (String) result[0];
            Long count = (Long) result[1];
            counts.put(type != null ? type : "Non spécifié", count);
        }
        return counts;
    }

    public Map<String, Long> countActivitiesByTypeGlobal() {
        List<Object[]> results = activiteRepository.countActivitiesByTypeGlobal();
        Map<String, Long> counts = new HashMap<>();
        for (Object[] result : results) {
            String type = (String) result[0];
            Long count = (Long) result[1];
            counts.put(type != null ? type : "Non spécifié", count);
        }
        return counts;
    }
    
    // ==================== KPI VALUE UPDATES ====================

    public List<ActiviteKpiValuesDTO> getActivitiesKpiValuesForProgramme(Long programmeId) {
        List<Sprint> sprints = sprintRepository.findByProgrammeIdOrderByOrderAsc(programmeId);
        List<ActiviteKpiValuesDTO> result = new ArrayList<>();

        for (Sprint sprint : sprints) {
            for (Activite activite : sprint.getActivites()) {
                List<ActiviteKpi> activiteKpis = activiteKpiRepository.findByActiviteId(activite.getId());

                if (!activiteKpis.isEmpty()) {
                    List<ActiviteKpiValuesDTO.KpiValueDTO> kpiValues = activiteKpis.stream()
                            .map(ak -> {
                                BackofficeKpi kpi = kpiRepository.findById(ak.getKpiId()).orElse(null);
                                if (kpi == null) return null;

                                BackofficeCategory category = kpi.getCategory();

                                return ActiviteKpiValuesDTO.KpiValueDTO.builder()
                                        .kpiId(kpi.getId())
                                        .kpiNom(kpi.getNom())
                                        .kpiUnite(kpi.getUniteMesure())
                                        .categoryNom(category != null ? category.getNom() : "Sans catégorie")
                                        .categoryCouleur(category != null ? category.getCouleur() : "#94a3b8")
                                        .valeur(ak.getValeurActuelle())
                                        .valeurCible(ak.getValeurCible())
                                        .build();
                            })
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());

                    result.add(ActiviteKpiValuesDTO.builder()
                            .activiteId(activite.getId())
                            .activiteNom(activite.getNom())
                            .sprintNom(sprint.getNom())
                            .kpis(kpiValues)
                            .build());
                }
            }
        }

        return result;
    }

    public List<TacheKpiValuesDTO> getTachesKpiValuesForProgramme(Long programmeId) {
        List<Sprint> sprints = sprintRepository.findByProgrammeIdOrderByOrderAsc(programmeId);
        List<TacheKpiValuesDTO> result = new ArrayList<>();

        for (Sprint sprint : sprints) {
            for (Activite activite : sprint.getActivites()) {
                for (Tache tache : activite.getTaches()) {
                    List<TacheKpi> tacheKpis = tacheKpiRepository.findByTacheId(tache.getId());

                    if (!tacheKpis.isEmpty()) {
                        List<TacheKpiValuesDTO.KpiValueDTO> kpiValues = tacheKpis.stream()
                                .map(tk -> {
                                    BackofficeKpi kpi = kpiRepository.findById(tk.getKpiId()).orElse(null);
                                    if (kpi == null) return null;

                                    BackofficeCategory category = kpi.getCategory();

                                    return TacheKpiValuesDTO.KpiValueDTO.builder()
                                            .kpiId(kpi.getId())
                                            .kpiNom(kpi.getNom())
                                            .kpiUnite(kpi.getUniteMesure())
                                            .categoryNom(category != null ? category.getNom() : "Sans catégorie")
                                            .categoryCouleur(category != null ? category.getCouleur() : "#94a3b8")
                                            .valeur(tk.getValeurActuelle())
                                            .valeurCible(tk.getValeurCible())
                                            .build();
                                })
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList());

                        result.add(TacheKpiValuesDTO.builder()
                                .tacheId(tache.getId())
                                .tacheTitre(tache.getTitre())
                                .activiteNom(activite.getNom())
                                .sprintNom(sprint.getNom())
                                .kpis(kpiValues)
                                .build());
                    }
                }
            }
        }

        return result;
    }
    
    public void updateActiviteKpiValeur(Long activiteId, Long kpiId, String valeur) {
        ActiviteKpi ak = activiteKpiRepository.findByActiviteIdAndKpiId(activiteId, kpiId)
                .orElseThrow(() -> new RuntimeException("KPI non trouvé pour cette activité"));
        
        BackofficeKpi kpi = kpiRepository.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI non trouvé: " + kpiId));

        String oldValue = ak.getValeurActuelle();
        double delta;

        boolean isProgression = "progression".equalsIgnoreCase(kpi.getTypedesaisie());

        if (isProgression) {
            delta = parseDouble(valeur);
        } else {
            delta = parseDouble(valeur) - parseDouble(oldValue);
        }
        
        ak.setValeurActuelle(valeur);
        activiteKpiRepository.save(ak);
        
        ActiviteKpiHistory history = ActiviteKpiHistory.builder()
            .activiteKpiId(ak.getId())
            .valeurPrecedente(oldValue)
            .valeurActuelle(valeur)
            .changedAt(LocalDateTime.now())
            .build();
        activiteKpiHistoryRepository.save(history);
        
        if (delta != 0) {
            triggerProgrammeKpiUpdateFromActivite(activiteId, kpiId, delta);
        }
    }
    
    public void updateActiviteKpiValeurAndCible(Long activiteId, Long kpiId, String valeur, String valeurCible) {
        ActiviteKpi ak = activiteKpiRepository.findByActiviteIdAndKpiId(activiteId, kpiId)
                .orElseThrow(() -> new RuntimeException("KPI non trouvé pour cette activité"));
        
        BackofficeKpi kpi = kpiRepository.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI non trouvé: " + kpiId));

        String oldValue = ak.getValeurActuelle();
        double delta = 0.0;

        boolean isProgression = "progression".equalsIgnoreCase(kpi.getTypedesaisie());

        if (valeur != null) {
            if (isProgression) {
                delta = parseDouble(valeur);
            } else {
                delta = parseDouble(valeur) - parseDouble(oldValue);
            }
            ak.setValeurActuelle(valeur);
        }

        if (valeurCible != null) {
            ak.setValeurCible(valeurCible);
        }
        
        activiteKpiRepository.save(ak);
        
        if (valeur != null) {
            ActiviteKpiHistory history = ActiviteKpiHistory.builder()
                .activiteKpiId(ak.getId())
                .valeurPrecedente(oldValue)
                .valeurActuelle(valeur)
                .changedAt(LocalDateTime.now())
                .build();
            activiteKpiHistoryRepository.save(history);
        }
        
        if (delta != 0) {
            triggerProgrammeKpiUpdateFromActivite(activiteId, kpiId, delta);
        }
    }

    public void updateTacheKpiValeur(Long tacheId, Long kpiId, String valeur) {
        TacheKpi tk = tacheKpiRepository.findByTacheIdAndKpiId(tacheId, kpiId)
                .orElseThrow(() -> new RuntimeException("KPI non trouvé pour cette tâche"));
        
        BackofficeKpi kpi = kpiRepository.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI non trouvé: " + kpiId));

        String oldValue = tk.getValeurActuelle();
        double delta;

        boolean isProgression = "progression".equalsIgnoreCase(kpi.getTypedesaisie());

        if (isProgression) {
            delta = parseDouble(valeur);
        } else {
            delta = parseDouble(valeur) - parseDouble(oldValue);
        }
        
        tk.setValeurActuelle(valeur);
        tacheKpiRepository.save(tk);
        
        TacheKpiHistory history = TacheKpiHistory.builder()
            .tacheKpiId(tk.getId())
            .valeurPrecedente(oldValue)
            .valeurActuelle(valeur)
            .changedAt(LocalDateTime.now())
            .build();
        tacheKpiHistoryRepository.save(history);
        
        if (delta != 0) {
            triggerProgrammeKpiUpdateFromTache(tacheId, kpiId, delta);
        }
    }
    
    public void updateTacheKpiValeurAndCible(Long tacheId, Long kpiId, String valeur, String valeurCible) {
        TacheKpi tk = tacheKpiRepository.findByTacheIdAndKpiId(tacheId, kpiId)
                .orElseThrow(() -> new RuntimeException("KPI non trouvé pour cette tâche"));
        
        BackofficeKpi kpi = kpiRepository.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI non trouvé: " + kpiId));

        String oldValue = tk.getValeurActuelle();
        double delta = 0.0;

        boolean isProgression = "progression".equalsIgnoreCase(kpi.getTypedesaisie());

        if (valeur != null) {
            if (isProgression) {
                delta = parseDouble(valeur);
            } else {
                delta = parseDouble(valeur) - parseDouble(oldValue);
            }
            tk.setValeurActuelle(valeur);
        }

        if (valeurCible != null) {
            tk.setValeurCible(valeurCible);
        }
        
        tacheKpiRepository.save(tk);

        if (valeur != null) {
            TacheKpiHistory history = TacheKpiHistory.builder()
                .tacheKpiId(tk.getId())
                .valeurPrecedente(oldValue)
                .valeurActuelle(valeur)
                .changedAt(LocalDateTime.now())
                .build();
            tacheKpiHistoryRepository.save(history);
        }
        
        if (delta != 0) {
            triggerProgrammeKpiUpdateFromTache(tacheId, kpiId, delta);
        }
    }

    public void deleteActiviteKpiValeur(Long activiteId, Long kpiId) {
        ActiviteKpi ak = activiteKpiRepository.findByActiviteIdAndKpiId(activiteId, kpiId)
                .orElseThrow(() -> new RuntimeException("KPI non trouvé pour cette activité"));
        
        BackofficeKpi kpi = kpiRepository.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI non trouvé: " + kpiId));

        String oldValue = ak.getValeurActuelle();
        ak.setValeurActuelle(null);
        activiteKpiRepository.save(ak);
        
        ActiviteKpiHistory history = ActiviteKpiHistory.builder()
            .activiteKpiId(ak.getId())
            .valeurPrecedente(oldValue)
            .valeurActuelle(null)
            .changedAt(LocalDateTime.now())
            .build();
        activiteKpiHistoryRepository.save(history);
        
        double delta = 0.0 - parseDouble(oldValue);
        if (delta != 0) {
            triggerProgrammeKpiUpdateFromActivite(activiteId, kpiId, delta);
        }
    }

    public void deleteTacheKpiValeur(Long tacheId, Long kpiId) {
        TacheKpi tk = tacheKpiRepository.findByTacheIdAndKpiId(tacheId, kpiId)
                .orElseThrow(() -> new RuntimeException("KPI non trouvé pour cette tâche"));
        
        BackofficeKpi kpi = kpiRepository.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI non trouvé: " + kpiId));

        String oldValue = tk.getValeurActuelle();
        tk.setValeurActuelle(null);
        tacheKpiRepository.save(tk);
        
        TacheKpiHistory history = TacheKpiHistory.builder()
            .tacheKpiId(tk.getId())
            .valeurPrecedente(oldValue)
            .valeurActuelle(null)
            .changedAt(LocalDateTime.now())
            .build();
        tacheKpiHistoryRepository.save(history);
        
        double delta = 0.0 - parseDouble(oldValue);
        if (delta != 0) {
            triggerProgrammeKpiUpdateFromTache(tacheId, kpiId, delta);
        }
    }
    
    // ==================== STATISTICS ====================

    public Map<String, Double> getKpiStatisticsForSprint(Long sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint non trouvé"));
        
        List<Activite> activites = sprint.getActivites();
        Map<String, Double> kpiTotals = new HashMap<>();
        
        // Calculate totals from ActiviteKpis
        for (Activite activite : activites) {
            List<ActiviteKpi> activiteKpis = activiteKpiRepository.findByActiviteId(activite.getId());
            for (ActiviteKpi ak : activiteKpis) {
                if (ak.getValeurActuelle() != null) {
                    try {
                        double val = Double.parseDouble(ak.getValeurActuelle());
                        BackofficeKpi kpi = kpiRepository.findById(ak.getKpiId()).orElse(null);
                        if (kpi != null) {
                            kpiTotals.merge(kpi.getNom(), val, Double::sum);
                        }
                    } catch (NumberFormatException e) {
                        // Ignore non-numeric values
                    }
                }
            }
            
            // Calculate totals from TacheKpis
            for (Tache tache : activite.getTaches()) {
                List<TacheKpi> tacheKpis = tacheKpiRepository.findByTacheId(tache.getId());
                for (TacheKpi tk : tacheKpis) {
                    if (tk.getValeurActuelle() != null) {
                        try {
                            double val = Double.parseDouble(tk.getValeurActuelle());
                            BackofficeKpi kpi = kpiRepository.findById(tk.getKpiId()).orElse(null);
                            if (kpi != null) {
                                kpiTotals.merge(kpi.getNom(), val, Double::sum);
                            }
                        } catch (NumberFormatException e) {
                            // Ignore non-numeric values
                        }
                    }
                }
            }
        }
        
        return kpiTotals;
    }

    public List<SprintKpiStatisticsDTO> getKpiStatisticsForProgramme(Long programmeId) {
        List<Sprint> sprints = sprintRepository.findByProgrammeIdOrderByOrderAsc(programmeId);
        List<SprintKpiStatisticsDTO> result = new ArrayList<>();

        for (Sprint sprint : sprints) {
            Map<Long, SprintKpiStatisticsDTO.KpiStatisticDTO> kpiStatsMap = new HashMap<>();

            // Process Activite KPIs
            for (Activite activite : sprint.getActivites()) {
                List<ActiviteKpi> activiteKpis = activiteKpiRepository.findByActiviteId(activite.getId());
                for (ActiviteKpi ak : activiteKpis) {
                    if (ak.getValeurActuelle() != null) {
                        try {
                            double val = Double.parseDouble(ak.getValeurActuelle());
                            BackofficeKpi kpi = kpiRepository.findById(ak.getKpiId()).orElse(null);
                            if (kpi != null) {
                                kpiStatsMap.compute(kpi.getId(), (k, v) -> {
                                    if (v == null) {
                                        return SprintKpiStatisticsDTO.KpiStatisticDTO.builder()
                                                .kpiId(kpi.getId())
                                                .kpiNom(kpi.getNom())
                                                .uniteMesure(kpi.getUniteMesure())
                                                .totalValeur(val)
                                                .build();
                                    } else {
                                        v.setTotalValeur(v.getTotalValeur() + val);
                                        return v;
                                    }
                                });
                            }
                        } catch (NumberFormatException e) {
                            // Ignore non-numeric values
                        }
                    }
                }

                // Process Tache KPIs
                for (Tache tache : activite.getTaches()) {
                    List<TacheKpi> tacheKpis = tacheKpiRepository.findByTacheId(tache.getId());
                    for (TacheKpi tk : tacheKpis) {
                        if (tk.getValeurActuelle() != null) {
                            try {
                                double val = Double.parseDouble(tk.getValeurActuelle());
                                BackofficeKpi kpi = kpiRepository.findById(tk.getKpiId()).orElse(null);
                                if (kpi != null) {
                                    kpiStatsMap.compute(kpi.getId(), (k, v) -> {
                                        if (v == null) {
                                            return SprintKpiStatisticsDTO.KpiStatisticDTO.builder()
                                                    .kpiId(kpi.getId())
                                                    .kpiNom(kpi.getNom())
                                                    .uniteMesure(kpi.getUniteMesure())
                                                    .totalValeur(val)
                                                    .build();
                                        } else {
                                            v.setTotalValeur(v.getTotalValeur() + val);
                                            return v;
                                        }
                                    });
                                }
                            } catch (NumberFormatException e) {
                                // Ignore non-numeric values
                            }
                        }
                    }
                }
            }

            if (!kpiStatsMap.isEmpty()) {
                result.add(SprintKpiStatisticsDTO.builder()
                        .sprintId(sprint.getId())
                        .sprintNom(sprint.getNom())
                        .kpiStatistics(new ArrayList<>(kpiStatsMap.values()))
                        .build());
            }
        }

        return result;
    }

    public StatisticsDTO getStatistics(Long programmeId) {
        List<Sprint> sprints = sprintRepository.findByProgrammeIdOrderByOrderAsc(programmeId);
        return calculateStatistics(sprints);
    }

    public StatisticsDTO getGlobalStatistics() {
        List<Sprint> sprints = sprintRepository.findAll();
        return calculateStatistics(sprints);
    }

    private StatisticsDTO calculateStatistics(List<Sprint> sprints) {
        // 1. Deadline Compliance
        long sprintsOnTime = 0;
        long sprintsLate = 0;
        long activitesOnTime = 0;
        long activitesLate = 0;
        long tachesOnTime = 0;
        long tachesLate = 0;

        for (Sprint sprint : sprints) {
            if (sprint.getStatus() == Sprint.StatusSprint.TERMINEE) {
                if (sprint.getDateFinReel() != null && sprint.getDateLimite() != null) {
                    if (sprint.getDateFinReel().isAfter(sprint.getDateLimite())) {
                        sprintsLate++;
                    } else {
                        sprintsOnTime++;
                    }
                }
            }

            for (Activite activite : sprint.getActivites()) {
                if (activite.getStatus() == Activite.StatusActivite.TERMINEE) {
                    if (activite.getDateFinReel() != null && activite.getDateLimite() != null) {
                        if (activite.getDateFinReel().isAfter(activite.getDateLimite())) {
                            activitesLate++;
                        } else {
                            activitesOnTime++;
                        }
                    }
                }

                for (Tache tache : activite.getTaches()) {
                    if (tache.getStatus() == Tache.StatusTache.TERMINEE) {
                        if (tache.getDateFinReel() != null && tache.getDateLimite() != null) {
                            if (tache.getDateFinReel().isAfter(tache.getDateLimite())) {
                                tachesLate++;
                            } else {
                                tachesOnTime++;
                            }
                        }
                    }
                }
            }
        }

        // 2. KPI Completion Rate & 4. Objectifs Dépassés Rate
        double totalKpiCompletion = 0;
        int kpiCount = 0;
        int kpisExceedingTarget = 0;

        for (Sprint sprint : sprints) {
            for (Activite activite : sprint.getActivites()) {
                List<ActiviteKpi> activiteKpis = activiteKpiRepository.findByActiviteId(activite.getId());
                for (ActiviteKpi ak : activiteKpis) {
                    if (ak.getValeurActuelle() != null && ak.getValeurCible() != null) {
                        try {
                            double actual = Double.parseDouble(ak.getValeurActuelle());
                            double target = Double.parseDouble(ak.getValeurCible());
                            if (target != 0) {
                                totalKpiCompletion += (actual / target) * 100;
                                kpiCount++;
                                if (actual > target) {
                                    kpisExceedingTarget++;
                                }
                            }
                        } catch (NumberFormatException e) {
                            // Ignore
                        }
                    }
                }

                for (Tache tache : activite.getTaches()) {
                    List<TacheKpi> tacheKpis = tacheKpiRepository.findByTacheId(tache.getId());
                    for (TacheKpi tk : tacheKpis) {
                        if (tk.getValeurActuelle() != null && tk.getValeurCible() != null) {
                            try {
                                double actual = Double.parseDouble(tk.getValeurActuelle());
                                double target = Double.parseDouble(tk.getValeurCible());
                                if (target != 0) {
                                    totalKpiCompletion += (actual / target) * 100;
                                    kpiCount++;
                                    if (actual > target) {
                                        kpisExceedingTarget++;
                                    }
                                }
                            } catch (NumberFormatException e) {
                                // Ignore
                            }
                        }
                    }
                }
            }
        }

        double averageKpiCompletion = kpiCount > 0 ? totalKpiCompletion / kpiCount : 0;
        double objectifsDepassesRate = kpiCount > 0 ? ((double) kpisExceedingTarget / kpiCount) * 100 : 0;

        // 3. Respect des délais %
        long totalItems = (sprintsOnTime + sprintsLate) + (activitesOnTime + activitesLate) + (tachesOnTime + tachesLate);
        long totalOnTime = sprintsOnTime + activitesOnTime + tachesOnTime;
        double respectDelaisRate = totalItems > 0 ? ((double) totalOnTime / totalItems) * 100 : 0;

        return StatisticsDTO.builder()
                .deadlineCompliance(StatisticsDTO.DeadlineComplianceDTO.builder()
                        .sprints(Map.of("onTime", sprintsOnTime, "late", sprintsLate))
                        .activites(Map.of("onTime", activitesOnTime, "late", activitesLate))
                        .taches(Map.of("onTime", tachesOnTime, "late", tachesLate))
                        .build())
                .kpiCompletionRate(averageKpiCompletion)
                .respectDelaisRate(respectDelaisRate)
                .objectifsDepassesRate(objectifsDepassesRate)
                .build();
    }

    private void triggerProgrammeKpiUpdateFromActivite(Long activiteId, Long kpiId, double delta) {
        Activite activite = activiteRepository.findById(activiteId).orElse(null);
        if (activite != null && activite.getSprint() != null && activite.getSprint().getProgramme() != null) {
            Long programmeId = activite.getSprint().getProgramme().getId();
            programmeKpiService.updateOperationalKpi(programmeId, kpiId, delta, activiteId, null);
        }
    }

    private void triggerProgrammeKpiUpdateFromTache(Long tacheId, Long kpiId, double delta) {
        Tache tache = tacheRepository.findById(tacheId).orElse(null);
        if (tache != null && tache.getActivite() != null && tache.getActivite().getSprint() != null && tache.getActivite().getSprint().getProgramme() != null) {
            Long programmeId = tache.getActivite().getSprint().getProgramme().getId();
            programmeKpiService.updateOperationalKpi(programmeId, kpiId, delta, null, tacheId);
        }
    }

    private double parseDouble(String value) {
        if (value == null || value.trim().isEmpty()) {
            return 0.0;
        }
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private void updateStatusBasedOnDate(Activite activite) {
        if (activite.getDateDebut() != null) {
            LocalDate today = LocalDate.now();
            if (activite.getDateDebut().isAfter(today)) {
                activite.setStatus(Activite.StatusActivite.NON_DEMARREE);
            } else if (activite.getStatus() == Activite.StatusActivite.NON_DEMARREE) {
                activite.setStatus(Activite.StatusActivite.EN_COURS);
            }
        }
    }

    private void updateStatusBasedOnDate(Tache tache) {
        if (tache.getDateDebut() != null) {
            LocalDate today = LocalDate.now();
            if (tache.getDateDebut().isAfter(today)) {
                tache.setStatus(Tache.StatusTache.NON_DEMARREE);
            } else if (tache.getStatus() == Tache.StatusTache.NON_DEMARREE) {
                tache.setStatus(Tache.StatusTache.EN_COURS);
            }
        }
    }
}