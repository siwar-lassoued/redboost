// src/main/java/team/project/redboost/controllers/ProgrammeController.java

package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.dto.*;
import team.project.redboost.dto.dashboardglobal.DashboardGlobalDTO;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.BackofficeKpiRepository;
import team.project.redboost.repositories.SprintRepository;
import team.project.redboost.services.*;
import team.project.redboost.repositories.SecteurRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/backoffice/programmes")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ProgrammeController {

    private final ProgrammeService service;
    private final SecteurRepository secteurRepository;
    private final SprintService sprintService;
    private final ActiviteService activiteService;
    private final BackofficeKpiRepository kpiRepository;
    private final SprintRepository sprintRepository;

    @Autowired
    private SprintDocumentService sprintDocumentService;


    @Autowired
    private TacheDocumentService tacheDocumentService;


    @Autowired
    private ActiviteDocumentService activiteDocumentService;

    // ==================== PROGRAMME CRUD ====================
    @GetMapping
    public List<Programme> getAll() {
        return service.findAll();
    }
    // Add this method to ProgrammeController.java

    // Get all programmes (for sprint creation dropdown)
    @GetMapping("/all-programmes")
    public ResponseEntity<List<ProgrammeBasicDTO>> getAllProgrammesBasic() {
        List<Programme> programmes = service.findAll();
        List<ProgrammeBasicDTO> result = programmes.stream()
                .map(p -> new ProgrammeBasicDTO(
                        p.getId(),
                        p.getNom(),
                        p.getDateDebut(),
                        p.getDateFin()
                ))
                .toList();
        return ResponseEntity.ok(result);
    }

    // DTO for programme list
    public record ProgrammeBasicDTO(Long id, String nom, LocalDate dateDebut, LocalDate dateFin) {}

    @GetMapping("/{id}")
    public Programme getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Programme create(@RequestBody Programme programme) {
        return service.create(programme);
    }

    @PutMapping("/{id}")
    public Programme update(@PathVariable Long id, @RequestBody Programme programme) {
        return service.update(id, programme);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== KPI ====================
    @GetMapping("/{id}/kpis")
    public List<BackofficeKpi> getKpisDuProgramme(@PathVariable Long id) {
        return service.getKpisDuProgramme(id);
    }

    @PostMapping("/{programmeId}/kpis/{kpiId}")
    public ResponseEntity<Void> ajouterKpiOptionnel(@PathVariable Long programmeId, @PathVariable Long kpiId) {
        service.ajouterKpiOptionnel(programmeId, kpiId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{programmeId}/kpis/{kpiId}")
    public ResponseEntity<Void> retirerKpi(@PathVariable Long programmeId, @PathVariable Long kpiId) {
        service.retirerKpi(programmeId, kpiId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/kpis-detail")
    public ResponseEntity<?> getKpisWithStatus(@PathVariable Long id) {
        return service.getKpisWithStatus(id);
    }

    // Get all OPTIONNEL and global KPIs for a specific programme (from its attached KPIs)
    @GetMapping("/{programmeId}/kpis/optionnels")
    public ResponseEntity<List<KpiWithCategory>> getOptionnelKpisForProgramme(@PathVariable Long programmeId) {
        List<BackofficeKpi> programmeKpis = service.getKpisDuProgramme(programmeId);

        List<KpiWithCategory> result = programmeKpis.stream()
                .filter(kpi -> "OPTIONNEL".equalsIgnoreCase(kpi.getType()) || "GLOBAL".equalsIgnoreCase(kpi.getType()))
                .map(kpi -> new KpiWithCategory(
                        kpi.getId(),
                        kpi.getNom(),
                        kpi.getDescription(),
                        kpi.getUniteMesure(),
                        kpi.getCategory() != null ?
                                new CategoryInfo(kpi.getCategory().getNom(), kpi.getCategory().getCouleur()) :
                                new CategoryInfo("Général", "#94a3b8")
                )).toList();

        return ResponseEntity.ok(result);
    }

    record CategoryInfo(String nom, String couleur) {}
    record KpiWithCategory(Long id, String nom, String description, String uniteMesure, CategoryInfo category) {}

    // Get KPIs for a specific activity (for task modal)
    @GetMapping("/activities/{activityId}/kpis")
    public ResponseEntity<List<KpiWithCategoryDTO>> getKpisForActivity(@PathVariable Long activityId) {
        List<KpiWithCategoryDTO> kpis = activiteService.getKpisWithCategoryForActivite(activityId);
        return ResponseEntity.ok(kpis);
    }

    // ==================== LOGO ====================
    @PostMapping(value = "/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadLogo(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        String logoUrl = service.uploadLogo(id, file);
        return ResponseEntity.ok(Map.of("logoUrl", logoUrl));
    }

    @DeleteMapping("/{id}/logo")
    public ResponseEntity<Void> deleteLogo(@PathVariable Long id) {
        service.deleteLogo(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/secteurs")
    public List<Secteur> getAllSecteurs() {
        return secteurRepository.findAll().stream()
                .sorted(Comparator.comparing(Secteur::getNom))
                .toList();
    }

    // ==================== SPRINTS ====================
    @GetMapping("/{programmeId}/sprints")
    public ResponseEntity<List<SprintDetailDTO>> getSprints(@PathVariable Long programmeId) {
        List<Sprint> sprints = sprintService.getSprintsByProgrammeId(programmeId);

        // Convert to DTOs to avoid Hibernate proxy serialization issues
        List<SprintDetailDTO> sprintDTOs = sprints.stream()
                .map(sprint -> SprintDetailDTO.builder()
                        .id(sprint.getId())
                        .nom(sprint.getNom())
                        .description(sprint.getDescription())
                        .dateDebut(sprint.getDateDebut())
                        .dateFin(sprint.getDateLimite()) // or dateFin, based on your entity
                        .status(String.valueOf(sprint.getStatus()))
                        .programmeId(sprint.getProgramme().getId())
                        .programmeNom(sprint.getProgramme().getNom())
                        .nombreActivites(sprint.getActivites() != null ? sprint.getActivites().size() : 0)
                        .documents(List.of()) // Empty for simple list, populate if needed
                        .activites(List.of()) // Empty for simple list, populate if needed
                        .build())
                .toList();

        return ResponseEntity.ok(sprintDTOs);
    }

    @PostMapping("/{programmeId}/sprints")
    public Sprint createSprint(@PathVariable Long programmeId, @RequestBody Sprint sprint) {
        return sprintService.createSprint(programmeId, sprint);
    }

    @PutMapping("/sprints/{sprintId}")
    public SprintDTO updateSprint(@PathVariable Long sprintId, @RequestBody Sprint sprint) {
        return sprintService.updateSprint(sprintId, sprint);
    }

    @DeleteMapping("/sprints/{sprintId}")
    public ResponseEntity<Void> deleteSprint(@PathVariable Long sprintId) {
        sprintService.deleteSprint(sprintId);
        return ResponseEntity.noContent().build();
    }

    // ==================== ACTIVITÉS ====================
    @PostMapping("/{programmeId}/sprints/{sprintId}/activities")
    public ResponseEntity<Activite> createActivity(
            @PathVariable Long programmeId,
            @PathVariable Long sprintId,
            @RequestBody ActiviteCreateRequest request) {

        validateSprintBelongsToProgramme(programmeId, sprintId);

        Activite created = activiteService.createActivity(
                sprintId,
                request.activite(),
                request.kpiIds()
        );
        return ResponseEntity.ok(created);
    }

    @PutMapping("/activities/{activityId}")
    public ResponseEntity<ActiviteDetailDTO> updateActivity(
            @PathVariable Long activityId,
            @RequestBody ActiviteUpdateRequest request) {

        ActiviteDetailDTO updated = activiteService.updateActivity(
                activityId,
                request.activite(),
                request.kpiIds()
        );
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/activities/{activityId}")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long activityId) {
        activiteService.deleteActivity(activityId);
        return ResponseEntity.noContent().build();
    }

    // ==================== TÂCHES ====================
    // In your ActiviteController.java (or wherever this endpoint is)

    @PostMapping("/{programmeId}/sprints/{sprintId}/activities/{activiteId}/taches")
    public ResponseEntity<TacheDetailDTO> createTache(  // ✅ Changed return type to TacheDetailDTO
                                                        @PathVariable Long programmeId,
                                                        @PathVariable Long sprintId,
                                                        @PathVariable Long activiteId,
                                                        @RequestBody TacheCreateRequest request) {

        validateSprintBelongsToProgramme(programmeId, sprintId);

        Tache created = activiteService.createTache(
                activiteId,
                request.tache(),
                request.kpiIds()
        );

        // ✅ Convert to DTO before returning
        TacheDetailDTO dto = activiteService.mapToTacheDetailDTO(created);
        return ResponseEntity.ok(dto);
    }
    @PutMapping("/taches/{tacheId}")
    public ResponseEntity<TacheDetailDTO> updateTache(  // ✅ Changed return type to TacheDetailDTO
                                                        @PathVariable Long tacheId,
                                                        @RequestBody TacheUpdateRequest request) {

        Tache updated = activiteService.updateTache(
                tacheId,
                request.tache(),
                request.kpiIds()
        );

        // ✅ Convert to DTO before returning
        TacheDetailDTO dto = activiteService.mapToTacheDetailDTO(updated);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/taches/{tacheId}")
    public ResponseEntity<Void> deleteTache(@PathVariable Long tacheId) {
        activiteService.deleteTache(tacheId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/activities/{activiteId}/taches")
    public List<Tache> getTachesByActivite(@PathVariable Long activiteId) {
        return activiteService.getTachesByActiviteId(activiteId);
    }

    // ==================== DETAILED VIEW ====================
    @GetMapping("/{programmeId}/sprints-detail")
    public ResponseEntity<List<SprintDetailDTO>> getSprintsWithDetails(@PathVariable Long programmeId) {
        List<SprintDetailDTO> sprints = activiteService.getSprintsWithDetails(programmeId);
        return ResponseEntity.ok(sprints);
    }

    // ==================== HELPER ====================
    private void validateSprintBelongsToProgramme(Long programmeId, Long sprintId) {
        sprintService.getSprintsByProgrammeId(programmeId).stream()
                .filter(s -> s.getId().equals(sprintId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Sprint non trouvé ou n'appartient pas au programme"));
    }







    // Upload documents to sprint
    @PostMapping(value = "/sprints/{sprintId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<DocumentDTO>> uploadSprintDocuments(
            @PathVariable Long sprintId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "uploadedById", required = false) Long uploadedById) {

        List<DocumentDTO> documents = sprintDocumentService.uploadDocuments(sprintId, files, uploadedById);
        return ResponseEntity.ok(documents);
    }

    // Get all documents for a sprint
    @GetMapping("/sprints/{sprintId}/documents")
    public ResponseEntity<List<DocumentDTO>> getSprintDocuments(@PathVariable Long sprintId) {
        List<DocumentDTO> documents = sprintDocumentService.getDocumentsBySprint(sprintId);
        return ResponseEntity.ok(documents);
    }

    // Delete a document
    @DeleteMapping("/sprint-documents/{documentId}")
    public ResponseEntity<Void> deleteSprintDocument(@PathVariable Long documentId) {
        sprintDocumentService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }




    // Add these endpoints to ProgrammeController.java


    // Upload documents to activity
    @PostMapping(value = "/activities/{activityId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<DocumentDTO>> uploadActivityDocuments(
            @PathVariable Long activityId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "uploadedById", required = false) Long uploadedById) {

        List<DocumentDTO> documents = activiteDocumentService.uploadDocuments(activityId, files, uploadedById);
        return ResponseEntity.ok(documents);
    }

    // Get all documents for an activity
    @GetMapping("/activities/{activityId}/documents")
    public ResponseEntity<List<DocumentDTO>> getActivityDocuments(@PathVariable Long activityId) {
        List<DocumentDTO> documents = activiteDocumentService.getDocumentsByActivite(activityId);
        return ResponseEntity.ok(documents);
    }

    // Delete a document
    @DeleteMapping("/activity-documents/{documentId}")
    public ResponseEntity<Void> deleteActivityDocument(@PathVariable Long documentId) {
        activiteDocumentService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }



    // Upload documents to tache
    @PostMapping(value = "/taches/{tacheId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<DocumentDTO>> uploadTacheDocuments(
            @PathVariable Long tacheId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "uploadedById", required = false) Long uploadedById) {

        List<DocumentDTO> documents = tacheDocumentService.uploadDocuments(tacheId, files, uploadedById);
        return ResponseEntity.ok(documents);
    }

    // Get all documents for a tache
    @GetMapping("/taches/{tacheId}/documents")
    public ResponseEntity<List<DocumentDTO>> getTacheDocuments(@PathVariable Long tacheId) {
        List<DocumentDTO> documents = tacheDocumentService.getDocumentsByTache(tacheId);
        return ResponseEntity.ok(documents);
    }

    // Delete a tache document
    @DeleteMapping("/tache-documents/{documentId}")
    public ResponseEntity<Void> deleteTacheDocument(@PathVariable Long documentId) {
        tacheDocumentService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/user/{userId}/activites")
    public ResponseEntity<List<ActiviteDetailDTO>> getActivitesByUser(@PathVariable Long userId) {
        List<ActiviteDetailDTO> activites = activiteService.getActivitesByResponsableId(userId);
        return ResponseEntity.ok(activites);
    }

    // NEW: Get tasks for a user
    @GetMapping("/user/{userId}/taches")
    public ResponseEntity<List<TacheDetailDTO>> getTachesByUser(@PathVariable Long userId) {
        List<TacheDetailDTO> taches = activiteService.getTachesByResponsableId(userId);
        return ResponseEntity.ok(taches);
    }



    // Marquer une tâche comme TERMINEE
    @PatchMapping("/taches/{tacheId}/terminer")
    public ResponseEntity<TacheDetailDTO> marquerTerminee(@PathVariable Long tacheId) {
        Tache tache = activiteService.marquerCommeTerminee(tacheId);
        TacheDetailDTO dto = activiteService.mapToTacheDetailDTO(tache);
        return ResponseEntity.ok(dto);
    }

    // Rouvrir une tâche terminée (retour à EN_COURS)
    @PatchMapping("/taches/{tacheId}/rouvrir")
    public ResponseEntity<TacheDetailDTO> rouvrirTache(@PathVariable Long tacheId) {
        Tache tache = activiteService.rouvrirTache(tacheId);
        TacheDetailDTO dto = activiteService.mapToTacheDetailDTO(tache);
        return ResponseEntity.ok(dto);
    }



    // ==================== SPRINTS GLOBAL ====================
    @GetMapping("/sprints")
    public ResponseEntity<List<Sprint>> getAllSprints() {
        List<Sprint> sprints = sprintService.getAllSprints();
        return ResponseEntity.ok(sprints);
    }

    // NOUVEAU : Tous les sprints détaillés (global)
    @GetMapping("/sprints-detail-global")
    public ResponseEntity<List<SprintDetailDTO>> getAllSprintsWithDetails() {
        List<SprintDetailDTO> sprints = activiteService.getAllSprintsWithDetailsGlobal(); // tu vas créer cette méthode
        return ResponseEntity.ok(sprints);
    }

    // NOUVEL ENDPOINT : Créer une activité avec seulement le sprintId
    @PostMapping("/sprints/{sprintId}/activities")
    public ResponseEntity<Activite> createActivityBySprintId(
            @PathVariable Long sprintId,
            @RequestBody ActiviteCreateRequest request) {

        // On récupère le sprint pour avoir le programmeId (et valider qu'il existe)
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint non trouvé"));

        Long programmeId = sprint.getProgramme().getId();

        // On réutilise la logique existante (validation incluse)
        Activite created = activiteService.createActivity(
                sprintId,
                request.activite(),
                request.kpiIds()
        );

        return ResponseEntity.ok(created);
    }
// Add this to ProgrammeController.java

    @PatchMapping("/activities/{activityId}/fields")
    public ResponseEntity<Activite> patchActivityFields(
            @PathVariable Long activityId,
            @RequestBody Map<String, String> fields) {

        Activite updated = activiteService.patchActivityFields(activityId, fields);
        return ResponseEntity.ok(updated);
    }

    // Get detailed sprint with all nested information (for rapport)
    @GetMapping("/sprints/{sprintId}/full-detail")
    public ResponseEntity<SprintDetailDTO> getSprintFullDetail(@PathVariable Long sprintId) {
        SprintDetailDTO sprintDetail = activiteService.getSprintFullDetail(sprintId);
        return ResponseEntity.ok(sprintDetail);
    }




    // NOUVEL ENDPOINT : Tous les documents du programme (sprint + activité + tâche)
    @GetMapping("/{programmeId}/documents")
    public ResponseEntity<List<DocumentConsolideDTO>> getAllDocumentsByProgramme(@PathVariable Long programmeId) {
        List<DocumentConsolideDTO> documents = new ArrayList<>();

        // 1. Documents au niveau Sprint
        List<Sprint> sprints = sprintService.getSprintsByProgrammeId(programmeId);
        for (Sprint sprint : sprints) {
            List<DocumentDTO> sprintDocs = sprintDocumentService.getDocumentsBySprint(sprint.getId());
            for (DocumentDTO doc : sprintDocs) {
                documents.add(new DocumentConsolideDTO(
                        sprint.getNom(),
                        null, // pas d'activité
                        "Au niveau sprint", // ou "Document sprint"
                        doc.getNom(),
                        doc.getUploadedByName(),
                        doc.getDateUpload(),
                        doc.getTypeFichier(),
                        doc.getCheminFichier(),
                        doc.getId(),
                        "sprint"
                ));
            }

            // 2. Documents au niveau Activité et Tâche (via les activités du sprint)
            List<Activite> activites = activiteService.getActivitesBySprintId(sprint.getId());
            for (Activite activite : activites) {
                // Documents activité
                List<DocumentDTO> activiteDocs = activiteDocumentService.getDocumentsByActivite(activite.getId());
                for (DocumentDTO doc : activiteDocs) {
                    documents.add(new DocumentConsolideDTO(
                            sprint.getNom(),
                            activite.getNom(),
                            "Au niveau activité",
                            doc.getNom(),
                            doc.getUploadedByName(),
                            doc.getDateUpload(),
                            doc.getTypeFichier(),
                            doc.getCheminFichier(),
                            doc.getId(),
                            "activite"
                    ));
                }

                // Documents tâche
                List<Tache> taches = activiteService.getTachesByActiviteId(activite.getId());
                for (Tache tache : taches) {
                    List<DocumentDTO> tacheDocs = tacheDocumentService.getDocumentsByTache(tache.getId());
                    for (DocumentDTO doc : tacheDocs) {
                        documents.add(new DocumentConsolideDTO(
                                sprint.getNom(),
                                activite.getNom(),
                                tache.getTitre(),
                                doc.getNom(),
                                doc.getUploadedByName(),
                                doc.getDateUpload(),
                                doc.getTypeFichier(),
                                doc.getCheminFichier(),
                                doc.getId(),
                                "tache"
                        ));
                    }
                }
            }
        }

        // Trier par date décroissante
        documents.sort(Comparator.comparing(DocumentConsolideDTO::date).reversed());

        return ResponseEntity.ok(documents);
    }

    @GetMapping("/retard-items")
    public ResponseEntity<RetardItemsDTO> getRetardItems() {
        RetardItemsDTO retardItems = service.getItemsEnRetard();
        return ResponseEntity.ok(retardItems);
    }

    @GetMapping("/entrepreneurs-details")
    public ResponseEntity<List<EntrepreneurProgramDetailsDTO>> getEntrepreneursWithProgramDetails() {
        return ResponseEntity.ok(service.getEntrepreneursWithProgramDetails());
    }

    @PostMapping("/entrepreneurs")
    public ResponseEntity<Void> assignEntrepreneursToProgram(
            @RequestBody AssignEntrepreneursRequest request) {
        service.assignEntrepreneursToProgram(request.programmeIds(), request.entrepreneurIds());
        return ResponseEntity.ok().build();
    }
// Add this endpoint to ProgrammeController.java

    @GetMapping("/dashboard-global")
    public ResponseEntity<DashboardGlobalDTO> getDashboardGlobal() {
        DashboardGlobalDTO dashboard = service.getDashboardData();
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/{programmeId}/activities/count-by-type")
    public ResponseEntity<Map<String, Long>> countActivitiesByTypeForProgramme(@PathVariable Long programmeId) {
        Map<String, Long> counts = activiteService.countActivitiesByTypeForProgramme(programmeId);
        return ResponseEntity.ok(counts);
    }

    @GetMapping("/activities/count-by-type-global")
    public ResponseEntity<Map<String, Long>> countActivitiesByTypeGlobal() {
        Map<String, Long> counts = activiteService.countActivitiesByTypeGlobal();
        return ResponseEntity.ok(counts);
    }
    
    // ==================== KPI VALUES ====================


    // Add these endpoints to ProgrammeController.java

// ==================== ACTIVITY KPI VALUES ====================

    @GetMapping("/{programmeId}/activities-kpis")
    public ResponseEntity<List<ActiviteKpiValuesDTO>> getActivitiesKpiValues(@PathVariable Long programmeId) {
        List<ActiviteKpiValuesDTO> values = activiteService.getActivitiesKpiValuesForProgramme(programmeId);
        return ResponseEntity.ok(values);
    }

// ==================== TASK KPI VALUES ====================

    @GetMapping("/{programmeId}/taches-kpis")
    public ResponseEntity<List<TacheKpiValuesDTO>> getTachesKpiValues(@PathVariable Long programmeId) {
        List<TacheKpiValuesDTO> values = activiteService.getTachesKpiValuesForProgramme(programmeId);
        return ResponseEntity.ok(values);
    }
    @PutMapping("/activities/{activityId}/kpis/{kpiId}/valeur")
    public ResponseEntity<Void> updateActiviteKpiValeur(
            @PathVariable Long activityId,
            @PathVariable Long kpiId,
            @RequestBody Map<String, String> payload) {
        String valeur = payload.get("valeur");
        String valeurCible = payload.get("valeurCible");
        activiteService.updateActiviteKpiValeurAndCible(activityId, kpiId, valeur, valeurCible);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/taches/{tacheId}/kpis/{kpiId}/valeur")
    public ResponseEntity<Void> updateTacheKpiValeur(
            @PathVariable Long tacheId,
            @PathVariable Long kpiId,
            @RequestBody Map<String, String> payload) {
        String valeur = payload.get("valeur");
        String valeurCible = payload.get("valeurCible");
        activiteService.updateTacheKpiValeurAndCible(tacheId, kpiId, valeur, valeurCible);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/activities/{activityId}/kpis/{kpiId}/valeur")
    public ResponseEntity<Void> deleteActiviteKpiValeur(
            @PathVariable Long activityId,
            @PathVariable Long kpiId) {
        activiteService.deleteActiviteKpiValeur(activityId, kpiId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/taches/{tacheId}/kpis/{kpiId}/valeur")
    public ResponseEntity<Void> deleteTacheKpiValeur(
            @PathVariable Long tacheId,
            @PathVariable Long kpiId) {
        activiteService.deleteTacheKpiValeur(tacheId, kpiId);
        return ResponseEntity.noContent().build();
    }
    
    // ==================== STATISTICS ====================
    
    @GetMapping("/sprints/{sprintId}/kpi-statistics")
    public ResponseEntity<Map<String, Double>> getKpiStatisticsForSprint(@PathVariable Long sprintId) {
        Map<String, Double> stats = activiteService.getKpiStatisticsForSprint(sprintId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{programmeId}/kpi-statistics")
    public ResponseEntity<List<SprintKpiStatisticsDTO>> getKpiStatisticsForProgramme(@PathVariable Long programmeId) {
        List<SprintKpiStatisticsDTO> stats = activiteService.getKpiStatisticsForProgramme(programmeId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{programmeId}/statistics")
    public ResponseEntity<StatisticsDTO> getStatistics(@PathVariable Long programmeId) {
        StatisticsDTO stats = activiteService.getStatistics(programmeId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/statistics/global")
    public ResponseEntity<StatisticsDTO> getGlobalStatistics() {
        StatisticsDTO stats = activiteService.getGlobalStatistics();
        return ResponseEntity.ok(stats);
    }



    // ==================== REQUEST DTOs ====================
    public record ActiviteCreateRequest(Activite activite, List<Long> kpiIds) {}
    public record ActiviteUpdateRequest(Activite activite, List<Long> kpiIds) {}
    public record TacheCreateRequest(Tache tache, List<Long> kpiIds) {}
    public record TacheUpdateRequest(Tache tache, List<Long> kpiIds) {}
    public record AssignEntrepreneursRequest(List<Long> programmeIds, List<Long> entrepreneurIds) {}
}
