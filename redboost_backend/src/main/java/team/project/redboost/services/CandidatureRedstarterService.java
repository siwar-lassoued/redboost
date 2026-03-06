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
import team.project.redboost.repositories.CandidatureRedstarterRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidatureRedstarterService {
    
    private final CandidatureRedstarterRepository candidatureRepository;
    private static final String UPLOAD_DIR = "uploads/candidatures/";
    
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
        
        return savedCandidature;
    }
    
    public Page<CandidatureRedstarter> getAllCandidatures(Pageable pageable) {
        log.info("Fetching all candidatures with pagination");
        return candidatureRepository.findAll(pageable);
    }
    
    public Page<CandidatureRedstarter> getCandidaturesByStatut(CandidatureRedstarter.StatutCandidature statut, Pageable pageable) {
        log.info("Fetching candidatures with status: {}", statut);
        return candidatureRepository.findByStatut(statut, pageable);
    }
    
    public CandidatureRedstarter getCandidatureById(Long id) {
        log.info("Fetching candidature with ID: {}", id);
        return candidatureRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Candidature not found with ID: " + id));
    }
    
    @Transactional
    public CandidatureRedstarter updateStatut(Long id, CandidatureRedstarter.StatutCandidature newStatut, String commentaires) {
        log.info("Updating status of candidature ID: {} to {}", id, newStatut);
        
        CandidatureRedstarter candidature = getCandidatureById(id);
        candidature.setStatut(newStatut);
        
        if (commentaires != null && !commentaires.isEmpty()) {
            candidature.setCommentairesAdmin(commentaires);
        }
        
        return candidatureRepository.save(candidature);
    }
    
    public Page<CandidatureRedstarter> searchCandidatures(String searchTerm, Pageable pageable) {
        log.info("Searching candidatures with term: {}", searchTerm);
        return candidatureRepository.searchByNomEntreprise(searchTerm, pageable);
    }
    
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
        
        candidatureRepository.deleteById(id);
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
        candidature.setBesoinsAccompagnement(dto.getBesoinsAccompagnement());
        candidature.setBeneficieAccompagnement(dto.getBeneficieAccompagnement());
        candidature.setDetailsAccompagnement(dto.getDetailsAccompagnement());
        candidature.setBesoinsFormation(dto.getBesoinsFormation() != null ? dto.getBesoinsFormation() : new ArrayList<>());
        
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