package team.project.redboost.services;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.dto.CandidatureRedstarterDTO;
import team.project.redboost.entities.CandidatureRedstarter;
import team.project.redboost.entities.CandidatureRedstarter.StatutCandidature;
import team.project.redboost.repositories.CandidatureRedstarterRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;

import team.project.redboost.entities.CandidatureLog;
import team.project.redboost.entities.Role;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.CandidatureLogRepository;
import team.project.redboost.repositories.UserRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidatureRedstarterService {
    
    private final CandidatureRedstarterRepository candidatureRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final CandidatureLogRepository logRepository;
    private static final String UPLOAD_DIR = "uploads/candidatures/";

    // ── Transition rules (matching pfe-project) ──────────────────────
    private static final Map<StatutCandidature, Set<StatutCandidature>> ALLOWED_TRANSITIONS = Map.of(
        StatutCandidature.EN_ATTENTE,      Set.of(StatutCandidature.EN_REVISION, StatutCandidature.PRESELECTIONNE, StatutCandidature.ACCEPTE, StatutCandidature.REJETE),
        StatutCandidature.EN_REVISION,     Set.of(StatutCandidature.PRESELECTIONNE, StatutCandidature.ACCEPTE, StatutCandidature.REJETE),
        StatutCandidature.PRESELECTIONNE,  Set.of(StatutCandidature.ACCEPTE, StatutCandidature.REJETE),
        StatutCandidature.ACCEPTE,         Set.of(),
        StatutCandidature.REJETE,          Set.of(StatutCandidature.EN_REVISION)
    );
    
    @Transactional
    public CandidatureRedstarter submitCandidature(CandidatureRedstarterDTO dto) throws IOException {
        log.info("Submitting new candidature for: {}", dto.getNomEntreprise());
        
        CandidatureRedstarter candidature = mapDtoToEntity(dto);
        
        // Handle file uploads
        if (dto.getDocuments() != null && !dto.getDocuments().isEmpty()) {
            List<String> documentPaths = saveDocuments(dto.getDocuments());
            candidature.setDocuments(documentPaths);
        }
        
        candidature.setStatut(CandidatureRedstarter.StatutCandidature.EN_ATTENTE);
        candidature.setDateCreationCandidature(LocalDateTime.now());
        
        CandidatureRedstarter savedCandidature = candidatureRepository.save(candidature);
        log.info("Candidature saved with ID: {}", savedCandidature.getId());
        
        logAction(savedCandidature.getId(), "Candidature reçue", null, CandidatureRedstarter.StatutCandidature.EN_ATTENTE.name(),
                null, "Système", "Via formulaire en ligne");
        
        // Notify admins
        try {
            List<User> admins = userRepository.findByRoleIn(Arrays.asList(Role.ADMIN, Role.SUPERADMIN));
            String message = "Nouvelle candidature soumise par " + savedCandidature.getNomPrenom() + " (" + savedCandidature.getNomEntreprise() + ")";
            for (User admin : admins) {
                notificationService.createAndSendNotification(
                    admin.getId(),
                    message,
                    "NOUVELLE_CANDIDATURE",
                    savedCandidature.getId()
                );
            }
        } catch (Exception e) {
            log.error("Failed to send notifications for new candidature", e);
        }
        
        return savedCandidature;
    }
    
    @Transactional(readOnly = true)
    public Page<CandidatureRedstarter> getAllCandidatures(Pageable pageable) {
        log.info("Fetching all candidatures with pagination");
        return candidatureRepository.findAll(pageable);
    }
    
    @Transactional(readOnly = true)
    public Page<CandidatureRedstarter> getCandidaturesByStatut(CandidatureRedstarter.StatutCandidature statut, Pageable pageable) {
        log.info("Fetching candidatures with status: {}", statut);
        return candidatureRepository.findByStatut(statut, pageable);
    }
    
    @Transactional(readOnly = true)
    public CandidatureRedstarter getCandidatureById(Long id) {
        log.info("Fetching candidature with ID: {}", id);
        return candidatureRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Candidature not found with ID: " + id));
    }
    
    @Transactional
    public CandidatureRedstarter updateStatut(Long id, StatutCandidature newStatut, String commentaires) {
        log.info("Updating status of candidature ID: {} to {}", id, newStatut);
        
        CandidatureRedstarter candidature = getCandidatureById(id);
        StatutCandidature oldStatut = candidature.getStatut();

        // Validate transition
        Set<StatutCandidature> allowed = ALLOWED_TRANSITIONS.getOrDefault(oldStatut, Set.of());
        if (!allowed.contains(newStatut)) {
            throw new RuntimeException(
                "Transition non autorisée : " + oldStatut + " → " + newStatut +
                ". Transitions possibles : " + allowed);
        }

        candidature.setStatut(newStatut);
        
        if (commentaires != null && !commentaires.isEmpty()) {
            candidature.setCommentairesAdmin(commentaires);
        }
        
        CandidatureRedstarter updated = candidatureRepository.save(candidature);
        
        // Status-specific logging
        String action;
        switch (newStatut) {
            case EN_REVISION:     action = "Dossier ouvert en révision"; break;
            case PRESELECTIONNE:  action = "Présélectionné"; break;
            case ACCEPTE:         action = "Candidature acceptée"; break;
            case REJETE:          action = "Candidature rejetée"; break;
            default:              action = "Changement de statut"; break;
        }
        logAction(id, action, oldStatut.name(), newStatut.name(),
                null, "Admin", commentaires);
                
        return updated;
    }
    
    @Transactional(readOnly = true)
    public Page<CandidatureRedstarter> searchCandidatures(String searchTerm, Pageable pageable) {
        log.info("Searching candidatures with term: {}", searchTerm);
        return candidatureRepository.searchByNomEntreprise(searchTerm, pageable);
    }
    
    @Transactional(readOnly = true)
    public long countByStatut(CandidatureRedstarter.StatutCandidature statut) {
        return candidatureRepository.countByStatut(statut);
    }
    
    @Transactional
    public void deleteCandidature(Long id) {
        log.info("Deleting candidature with ID: {}", id);
        CandidatureRedstarter candidature = getCandidatureById(id);
        
        // Delete associated documents
        if (candidature.getDocuments() != null) {
            candidature.getDocuments().forEach(this::deleteDocument);
        }
        
        List<CandidatureLog> logs = logRepository.findByCandidatureIdOrderByCreatedAtDesc(id);
        logRepository.deleteAll(logs);
        
        candidatureRepository.deleteById(id);
    }
    
    public List<CandidatureLog> getHistorique(Long candidatureId) {
        return logRepository.findByCandidatureIdOrderByCreatedAtDesc(candidatureId);
    }
    
    private void logAction(Long candidatureId, String action, String statutAvant,
                           String statutApres, String faitPar, String faitParNom, String note) {
        CandidatureLog logEntry = CandidatureLog.builder()
                .candidatureId(candidatureId)
                .action(action)
                .statutAvant(statutAvant)
                .statutApres(statutApres)
                .faitPar(faitPar)
                .faitParNom(faitParNom != null ? faitParNom : "Admin")
                .note(note)
                .createdAt(LocalDateTime.now())
                .build();
        logRepository.save(logEntry);
    }
    
    private CandidatureRedstarter mapDtoToEntity(CandidatureRedstarterDTO dto) {
        CandidatureRedstarter candidature = new CandidatureRedstarter();
        
        // Step 1
        candidature.setNomPrenom(dto.getNomPrenom());
        candidature.setGenre(dto.getGenre());
        candidature.setAge(dto.getAge());
        candidature.setNumeroTelephone(dto.getNumeroTelephone());
        candidature.setEmail(dto.getEmail());
        candidature.setRoleEntreprise(dto.getRoleEntreprise());
        
        // Step 2
        candidature.setNomEntreprise(dto.getNomEntreprise());
        candidature.setEntrepriseEst(dto.getEntrepriseEst());
        candidature.setDateCreation(dto.getDateCreation());
        candidature.setRegionBasee(dto.getRegionBasee());
        candidature.setBreveDescription(dto.getBreveDescription());
        candidature.setLienReseauxSociaux(dto.getLienReseauxSociaux());
        candidature.setLabelStartupAct(dto.getLabelStartupAct());
        candidature.setDateObtentionLabel(dto.getDateObtentionLabel());
        
        // Step 3
        candidature.setPhaseMaturite(dto.getPhaseMaturite());
        candidature.setMarchePersonnasCibles(dto.getMarchePersonnasCibles());
        candidature.setComposanteInnovation(dto.getComposanteInnovation());
        candidature.setImpactEnvironnemental(dto.getImpactEnvironnemental());
        candidature.setImpactSocial(dto.getImpactSocial());
        candidature.setViabiliteCommerciale(dto.getViabiliteCommerciale());
        candidature.setValeurAjoutee(dto.getValeurAjoutee());
        
        // Step 4
        candidature.setNombreCoFondateurs(dto.getNombreCoFondateurs());
        candidature.setImpliquesGestion(dto.getImpliquesGestion());
        candidature.setNombreImpliquesGestion(dto.getNombreImpliquesGestion());
        candidature.setExperienceEquipeFondatrice(dto.getExperienceEquipeFondatrice());
        candidature.setNombreEmploisCrees(dto.getNombreEmploisCrees());
        
        // Step 5
        candidature.setBesoinsAccompagnement(dto.getBesoinsAccompagnement() != null ? dto.getBesoinsAccompagnement() : new ArrayList<>());
        candidature.setBeneficieAccompagnement(dto.getBeneficieAccompagnement());
        candidature.setDetailsAccompagnement(dto.getDetailsAccompagnement());
        candidature.setBesoinsFormation(dto.getBesoinsFormation() != null ? dto.getBesoinsFormation() : new ArrayList<>());
        
        // Dynamic Fields
        candidature.setFormTemplateId(dto.getFormTemplateId());
        candidature.setDynamicAnswers(dto.getDynamicAnswers());
        
        return candidature;
    }
    
    private List<String> saveDocuments(List<MultipartFile> files) throws IOException {
        List<String> documentPaths = new ArrayList<>();
        Path uploadPath = Paths.get(UPLOAD_DIR);
        
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                String originalFilename = file.getOriginalFilename();
                String fileExtension = originalFilename != null ? 
                    originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
                String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
                Path filePath = uploadPath.resolve(uniqueFilename);
                
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                documentPaths.add(uniqueFilename);
                
                log.info("Document saved: {}", uniqueFilename);
            }
        }
        
        return documentPaths;
    }
    
    private void deleteDocument(String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR, filename);
            Files.deleteIfExists(filePath);
            log.info("Document deleted: {}", filename);
        } catch (IOException e) {
            log.error("Error deleting document: {}", filename, e);
        }
    }
}