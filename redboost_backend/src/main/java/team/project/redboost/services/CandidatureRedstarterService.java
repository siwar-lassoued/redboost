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
import team.project.redboost.repositories.ProgrammeRepository;
import team.project.redboost.entities.Programme;

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
import team.project.redboost.repositories.FormTemplateRepository;
import team.project.redboost.repositories.UserRepository;

@Service
@Slf4j
public class CandidatureRedstarterService {
    
    private final CandidatureRedstarterRepository candidatureRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final CandidatureLogRepository logRepository;
    private final FormTemplateRepository formTemplateRepository;
    private final EmailService emailService;
    private final ProgrammeRepository programmeRepository;
    private static final com.fasterxml.jackson.databind.ObjectMapper MAPPER = new com.fasterxml.jackson.databind.ObjectMapper();

    private final Path candidatureUploadPath;

    public CandidatureRedstarterService(
            CandidatureRedstarterRepository candidatureRepository,
            NotificationService notificationService,
            UserRepository userRepository,
            UserService userService,
            CandidatureLogRepository logRepository,
            FormTemplateRepository formTemplateRepository,
            EmailService emailService,
            ProgrammeRepository programmeRepository,
            @org.springframework.beans.factory.annotation.Value("${file.upload-dir:uploads}") String uploadDir) {
        this.candidatureRepository = candidatureRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.userService = userService;
        this.logRepository = logRepository;
        this.formTemplateRepository = formTemplateRepository;
        this.emailService = emailService;
        this.programmeRepository = programmeRepository;
        this.candidatureUploadPath = Paths.get(uploadDir, "candidatures").toAbsolutePath().normalize();
        log.info("Candidature upload path resolved to: {}", this.candidatureUploadPath);
    }

    private Map<String, Object> getDynamicAnswersMap(CandidatureRedstarter candidature) {
        if (candidature.getDynamicAnswers() == null || candidature.getDynamicAnswers().isEmpty()) return null;
        try {
            Map<String, Object> rootMap = MAPPER.readValue(candidature.getDynamicAnswers(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
            // Check for nested "answers" key or return direct map
            if (rootMap.containsKey("answers") && rootMap.get("answers") instanceof Map) {
                return (Map<String, Object>) rootMap.get("answers");
            }
            return rootMap;
        } catch (Exception e) {
            log.warn("Failed to parse dynamicAnswers JSON for ID {}: {}", candidature.getId(), e.getMessage());
            return null;
        }
    }

    // ── Transition rules (matching pfe-project) ──────────────────────
    private static final Map<StatutCandidature, Set<StatutCandidature>> ALLOWED_TRANSITIONS = Map.of(
        StatutCandidature.EN_ATTENTE,          Set.of(StatutCandidature.EN_ATTENTE, StatutCandidature.EN_COURS_EVALUATION, StatutCandidature.PRE_SELECTIONNE, StatutCandidature.ACCEPTE, StatutCandidature.REJETE),
        StatutCandidature.EN_COURS_EVALUATION, Set.of(StatutCandidature.EN_COURS_EVALUATION, StatutCandidature.PRE_SELECTIONNE, StatutCandidature.ACCEPTE, StatutCandidature.REJETE),
        StatutCandidature.PRE_SELECTIONNE,      Set.of(StatutCandidature.PRE_SELECTIONNE, StatutCandidature.EN_COURS_EVALUATION, StatutCandidature.ACCEPTE, StatutCandidature.REJETE),
        StatutCandidature.ACCEPTE,             Set.of(StatutCandidature.ACCEPTE, StatutCandidature.EN_COURS_EVALUATION, StatutCandidature.PRE_SELECTIONNE, StatutCandidature.REJETE),
        StatutCandidature.REJETE,              Set.of(StatutCandidature.REJETE, StatutCandidature.EN_COURS_EVALUATION, StatutCandidature.PRE_SELECTIONNE, StatutCandidature.ACCEPTE)
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
        
        // Notify admins - Disabled as requested
        /*
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
        */
        
        return savedCandidature;
    }
    
    @Transactional(readOnly = true)
    public Page<team.project.redboost.dto.CandidatureRedstarterResponseDTO> getAllCandidatures(Pageable pageable, String type) {
        log.info("Fetching candidatures with pagination, type: {}", type);
        
        Page<CandidatureRedstarter> entities;
        if (type != null && !type.isEmpty()) {
            if (type.equalsIgnoreCase("spontanees")) {
                entities = candidatureRepository.findSpontanees(pageable);
            } else {
                String profileType = type;
                if (type.equalsIgnoreCase("coaches")) profileType = "COACH";
                else if (type.equalsIgnoreCase("entrepreneurs")) profileType = "ENTREPRENEUR";
                
                entities = candidatureRepository.findByProfileType(profileType, pageable);
            }
        } else {
            entities = candidatureRepository.findAll(pageable);
        }
        
        return entities.map(this::mapToResponseDto);
    }
    
    @Transactional(readOnly = true)
    public Page<team.project.redboost.dto.CandidatureRedstarterResponseDTO> getCandidaturesByStatut(CandidatureRedstarter.StatutCandidature statut, Pageable pageable) {
        log.info("Fetching candidatures with status: {}", statut);
        return candidatureRepository.findByStatut(statut, pageable).map(this::mapToResponseDto);
    }
    
    @Transactional(readOnly = true)
    public team.project.redboost.dto.CandidatureRedstarterResponseDTO getCandidatureById(Long id) {
        log.info("Fetching candidature with ID: {}", id);
        CandidatureRedstarter candidature = candidatureRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Candidature not found with ID: " + id));
        return mapToResponseDto(candidature);
    }
    
    @Transactional
    public team.project.redboost.dto.CandidatureRedstarterResponseDTO updateStatut(Long id, StatutCandidature newStatut, String commentaires) {
        log.info("Updating status of candidature ID: {} to {}", id, newStatut);
        
        CandidatureRedstarter candidature = candidatureRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Candidature not found with ID: " + id));
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
            case EN_COURS_EVALUATION: action = "En cours d'évaluation"; break;
            case PRE_SELECTIONNE:      action = "Présélectionné"; break;
            case ACCEPTE:             action = "Candidature acceptée"; break;
            case REJETE:              action = "Candidature rejetée"; break;
            default:                  action = "Changement de statut"; break;
        }
        logAction(id, action, oldStatut.name(), newStatut.name(),
                null, "Admin", commentaires);
                
        return mapToResponseDto(updated);
    }
    
    @Transactional
    public team.project.redboost.dto.CandidatureRedstarterResponseDTO processStatutWithEmail(Long id, StatutCandidature newStatut, String emailContent, String subject, Boolean createAccount) throws Exception {
        log.info("Processing status with email for candidature ID: {}", id);
        
        CandidatureRedstarter candidature = candidatureRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Candidature not found with ID: " + id));
        StatutCandidature oldStatut = candidature.getStatut();

        // Validate transition
        Set<StatutCandidature> allowed = ALLOWED_TRANSITIONS.getOrDefault(oldStatut, Set.of());
        if (!allowed.contains(newStatut)) {
            throw new RuntimeException("Transition non autorisée : " + oldStatut + " → " + newStatut);
        }

        candidature.setStatut(newStatut);
        CandidatureRedstarter updated = candidatureRepository.save(candidature);

        // Auto Create Account
        if (Boolean.TRUE.equals(createAccount) && newStatut == StatutCandidature.ACCEPTE) {
            Map<String, Object> answers = getDynamicAnswersMap(candidature);
            String emailToUse = candidature.getEmail();
            
            // Try to pull email from dynamicAnswers if missing or placeholder
            if (emailToUse == null || emailToUse.trim().isEmpty() || emailToUse.contains("non-specifie")) {
                if (answers != null) {
                    for (Map.Entry<String, Object> entry : answers.entrySet()) {
                        if (entry.getKey().equalsIgnoreCase("Email")) {
                            emailToUse = entry.getValue().toString();
                            break;
                        }
                    }
                }
            }

            if (emailToUse != null) {
                log.info("Tentative de création de compte pour: {}", emailToUse);
                if (userRepository.findByEmail(emailToUse) == null) {
                    log.info("Email {} n'existe pas encore. Création en cours...", emailToUse);
                    User user = new User();
                    user.setEmail(emailToUse);
                    
                    String nomPrenom = candidature.getNomPrenom();
                    String phone = candidature.getNumeroTelephone();
                    if ("00000000".equals(phone)) phone = null;
                    String startup = candidature.getNomEntreprise();
                    if ("Non spécifié".equals(startup)) startup = null;
                    
                    String bio = candidature.getBreveDescription();
                    if ("Non spécifié".equals(bio)) bio = null;
                    
                    String region = candidature.getRegionBasee();
                    if ("Non spécifié".equals(region)) region = null;
                    
                    String linkedin = candidature.getLienReseauxSociaux();
                    
                    String secteur = candidature.getMarchePersonnasCibles();
                    if ("Non spécifié".equals(secteur)) secteur = null;
                    
                    String skills = "";
                    String expertise = "";
                    
                    Role[] roleRef = new Role[]{Role.ENTREPRENEUR};
                    
                    if (answers != null) {
                        for (Map.Entry<String, Object> entry : answers.entrySet()) {
                            String key = entry.getKey().trim();
                            Object valObj = entry.getValue();
                            String val = valObj != null ? valObj.toString().trim() : "";
                            if (val.isEmpty()) continue;
                            
                            String lowKey = key.toLowerCase();

                            // Exact Matches from Form Templates
                            if (key.equalsIgnoreCase("Nom et Prénom")) {
                                nomPrenom = val;
                            } else if (key.equalsIgnoreCase("Email")) {
                                emailToUse = val;
                            } else if (key.equalsIgnoreCase("Numéro de téléphone") || key.equalsIgnoreCase("Téléphone") || lowKey.equals("phone")) {
                                phone = val;
                            } else if (key.equalsIgnoreCase("Nom de la startup (si applicable)") || lowKey.contains("startup") || key.equalsIgnoreCase("Nom de l'entreprise")) {
                                startup = val;
                            } else if (key.equalsIgnoreCase("Êtes-vous un Coach ou un Entrepreneur ?")) {
                                if (val.toLowerCase().contains("coach")) roleRef[0] = Role.COACH;
                                else if (val.toLowerCase().contains("entrepreneur")) roleRef[0] = Role.ENTREPRENEUR;
                            }
                            
                            // Fuzzy matches for other profile fields
                            if ((bio == null || bio.isEmpty()) && (lowKey.contains("bio") || lowKey.contains("description"))) bio = val;
                            if ((region == null || region.isEmpty()) && (lowKey.contains("région") || lowKey.contains("ville") || lowKey.contains("region"))) region = val;
                            if ((linkedin == null || linkedin.isEmpty()) && (lowKey.contains("linkedin") || lowKey.contains("réseau"))) linkedin = val;
                            if ((secteur == null || secteur.isEmpty()) && (lowKey.contains("secteur") || lowKey.contains("industry") || lowKey.contains("domaine"))) secteur = val;
                            
                            // For coaches
                            if (skills.isEmpty() && (lowKey.contains("compétence") || lowKey.contains("skill"))) skills = val;
                            if (expertise.isEmpty() && (lowKey.contains("expertise") || lowKey.contains("domaine d'intervention"))) expertise = val;
                        }
                    }
                    
                    // Name splitting logic
                    String firstName = null;
                    String lastName = null;

                    if (nomPrenom != null && !nomPrenom.trim().isEmpty()) {
                        String[] parts = nomPrenom.trim().split("\\s+", 2);
                        if (parts.length > 1) {
                            firstName = parts[0];
                            lastName = parts[1];
                        } else {
                            firstName = parts[0];
                            lastName = (startup != null && startup.length() >= 2) ? startup : "Redstarter";
                        }
                    }

                    // Final Fallbacks to avoid validation errors
                    if (firstName == null || firstName.trim().isEmpty()) firstName = "Candidat";
                    if (lastName == null || lastName.trim().isEmpty()) {
                        lastName = (startup != null && startup.length() >= 2) ? startup : "Utilisateur";
                    }

                    // Enforce @Size(min=2)
                    user.setFirstName(firstName.length() < 2 ? firstName + "_" : firstName);
                    user.setLastName(lastName.length() < 2 ? lastName + "_" : lastName);
                    
                    user.setPhoneNumber(phone != null && !phone.trim().isEmpty() && !phone.equals("00000000") ? phone : candidature.getNumeroTelephone());
                    if (user.getPhoneNumber() == null || user.getPhoneNumber().isEmpty()) user.setPhoneNumber("00000000");
                    
                    user.setBio(bio != null ? bio : candidature.getBreveDescription());
                    user.setRegion(region != null ? region : candidature.getRegionBasee());
                    user.setLinkedinUrl(linkedin != null ? linkedin : candidature.getLienReseauxSociaux());
                    user.setSecteur(secteur != null ? secteur : candidature.getMarchePersonnasCibles());
                    user.setActive(true);
                    user.setEntreprise(startup != null ? startup : candidature.getNomEntreprise());
                    user.setStartupName(startup != null ? startup : candidature.getNomEntreprise());
                    
                    // Determine Role and Programme
                    Programme[] progRef = new Programme[]{null};

                    if (candidature.getFormTemplateId() != null) {
                        formTemplateRepository.findById(candidature.getFormTemplateId()).ifPresent(t -> {
                            if ("coach".equalsIgnoreCase(t.getProfileType()) || "coaches".equalsIgnoreCase(t.getProfileType())) {
                                roleRef[0] = Role.COACH;
                            }
                            if (t.getProgram() != null && !t.getProgram().trim().isEmpty()) {
                                String progVal = t.getProgram().trim();
                                
                                // Essaie de trouver par Nom
                                Programme matchedProg = programmeRepository.findAll().stream()
                                    .filter(p -> p.getNom() != null && p.getNom().trim().equalsIgnoreCase(progVal))
                                    .findFirst()
                                    .orElse(null);
                                    
                                // Si introuvable, essaie de parser la chaîne comme un ID
                                if (matchedProg == null) {
                                    try {
                                        Long progId = Long.parseLong(progVal);
                                        matchedProg = programmeRepository.findById(progId).orElse(null);
                                    } catch(NumberFormatException e) {
                                        // Ignore, ce n'est pas un ID valide
                                    }
                                }
                                
                                if (matchedProg != null) {
                                    progRef[0] = matchedProg;
                                    log.info("Programme trouvé et associé: {} (ID: {}) pour candidature {}", matchedProg.getNom(), matchedProg.getId(), candidature.getId());
                                } else {
                                    log.warn("Impossible d'associer le programme. Valeur du template: '{}' pour candidature {}. Aucun programme correspondant trouvé par nom ou ID.", progVal, candidature.getId());
                                }
                            }
                        });
                    } else if ("coach".equalsIgnoreCase(candidature.getRoleEntreprise()) || "coaches".equalsIgnoreCase(candidature.getRoleEntreprise())) {
                        roleRef[0] = Role.COACH;
                    }
                    
                    // Fallback scan on dynamicAnswers (equivalent to frontend logic)
                    if (roleRef[0] == Role.ENTREPRENEUR && answers != null) {
                        for (Map.Entry<String, Object> entry : answers.entrySet()) {
                            String val = entry.getValue() != null ? entry.getValue().toString().toLowerCase() : "";
                            if (val.contains("coach")) {
                                roleRef[0] = Role.COACH;
                                break;
                            } else if (val.contains("entrepreneur")) {
                                roleRef[0] = Role.ENTREPRENEUR;
                                break;
                            }
                        }
                    }
                    
                    log.info("Rôle déterminé pour {}: {}", emailToUse, roleRef[0]);
                    user.setRole(roleRef[0]);
                    
                    if (roleRef[0] == Role.ENTREPRENEUR) {
                        String finalStartup = (startup != null && !startup.isEmpty()) ? startup : candidature.getNomEntreprise();
                        if (finalStartup == null || finalStartup.trim().isEmpty() || "Non spécifié".equals(finalStartup)) finalStartup = "Startup";
                        user.setStartupName(finalStartup);
                        user.setEntreprise(finalStartup);
                    } else {
                        String finalExp = (expertise != null && !expertise.isEmpty()) ? expertise : (startup != null ? startup : candidature.getNomEntreprise());
                        if (finalExp == null || finalExp.trim().isEmpty() || "Non spécifié".equals(finalExp)) finalExp = "Consultant / Coach";
                        user.setExpertise(finalExp);
                        user.setSkills(skills);
                        user.setYearsOfExperience(1);
                    }
                    
                    String tempPassword = UUID.randomUUID().toString().substring(0, 8);
                    user.setPassword(tempPassword);
                    
                    if (progRef[0] != null) {
                        Set<Programme> newPrograms = new HashSet<>();
                        newPrograms.add(progRef[0]);
                        user.setProgrammes(newPrograms);
                    }
                    
                    userService.addUser(user);
                    
                    if (!emailContent.contains(tempPassword)) {
                        emailContent += "\n\n=== Accès Plateforme ===\nEmail: " + user.getEmail() + "\nMot de passe temporaire: " + tempPassword + "\n\nMerci de le modifier lors de votre première connexion.";
                    }
                    log.info("Compte utilisateur créé avec succès pour {} avec rôle {}", emailToUse, roleRef[0]);
                } else {
                    log.info("Le compte {} existe déjà. Ignorer la création.", emailToUse);
                }
            }
        }
        
        // Send Email
        if (emailContent != null && !emailContent.isEmpty()) {
            String targetEmail = candidature.getEmail();
            if (targetEmail == null || targetEmail.isEmpty()) {
                Map<String, Object> answers = getDynamicAnswersMap(candidature);
                if (answers != null) {
                    for (Map.Entry<String, Object> entry : answers.entrySet()) {
                        if (entry.getKey().toLowerCase().contains("email")) {
                            targetEmail = entry.getValue().toString();
                            break;
                        }
                    }
                }
            }
            if (targetEmail != null) {
                try {
                    emailService.sendEmail(targetEmail, subject != null ? subject : "Mise à jour de votre candidature", emailContent);
                } catch (Exception e) {
                    log.error("Erreur lors de l'envoi de l'email à {}. Le compte a été créé/statut mis à jour mais l'email n'a pas pu partir : {}", targetEmail, e.getMessage());
                }
            }
        }

        logAction(id, "Validation & Email", oldStatut.name(), newStatut.name(), null, "Admin", "Email envoyé");
        
        return mapToResponseDto(updated);
    }
    
    @Transactional(readOnly = true)
    public Page<team.project.redboost.dto.CandidatureRedstarterResponseDTO> searchCandidatures(String searchTerm, Pageable pageable) {
        log.info("Searching candidatures with term: {}", searchTerm);
        return candidatureRepository.searchByNomEntreprise(searchTerm, pageable).map(this::mapToResponseDto);
    }
    
    @Transactional(readOnly = true)
    public long countByStatut(CandidatureRedstarter.StatutCandidature statut) {
        if (statut == null) return candidatureRepository.count();
        
        long count = candidatureRepository.countByStatut(statut);
        
        // Aggregate legacy counts
        if (statut == CandidatureRedstarter.StatutCandidature.REJETE) {
            count += candidatureRepository.countByStatut(CandidatureRedstarter.StatutCandidature.REFUSE);
        } else if (statut == CandidatureRedstarter.StatutCandidature.EN_COURS_EVALUATION) {
            count += candidatureRepository.countByStatut(CandidatureRedstarter.StatutCandidature.EN_REVISION);
        } else if (statut == CandidatureRedstarter.StatutCandidature.PRE_SELECTIONNE) {
            count += candidatureRepository.countByStatut(CandidatureRedstarter.StatutCandidature.PRESELECTIONNE);
        }
        
        return count;
    }
    
    @Transactional(readOnly = true)
    public long countByType(String type) {
        if (type == null) return candidatureRepository.count();
        
        if (type.equalsIgnoreCase("spontanees")) {
            return candidatureRepository.countSpontanees();
        }
        
        String profileType = type;
        if (type.equalsIgnoreCase("coaches")) profileType = "COACH";
        else if (type.equalsIgnoreCase("entrepreneurs")) profileType = "ENTREPRENEUR";
        
        return candidatureRepository.countByProfileType(profileType);
    }
    
    @Transactional(readOnly = true)
    public long countSpontanees() {
        return candidatureRepository.countSpontanees();
    }
    
    @Transactional
    public void deleteCandidature(Long id) {
        log.info("Deleting candidature with ID: {}", id);
        CandidatureRedstarter candidature = candidatureRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Candidature not found with ID: " + id));
        
        // Delete associated documents
        if (candidature.getDocuments() != null) {
            candidature.getDocuments().forEach(this::deleteDocument);
        }
        
        List<CandidatureLog> logs = logRepository.findByCandidatureIdOrderByCreatedAtDesc(id);
        logRepository.deleteAll(logs);
        
        candidatureRepository.deleteById(id);
    }

    @Transactional
    public void migrateLegacyStatuses() {
        log.info("Starting migration of legacy candidature statuses");
        
        List<CandidatureRedstarter> all = candidatureRepository.findAll();
        int migratedCount = 0;
        
        for (CandidatureRedstarter c : all) {
            StatutCandidature current = c.getStatut();
            StatutCandidature target = null;
            
            if (current == StatutCandidature.REFUSE) target = StatutCandidature.REJETE;
            else if (current == StatutCandidature.EN_REVISION) target = StatutCandidature.EN_COURS_EVALUATION;
            else if (current == StatutCandidature.PRESELECTIONNE) target = StatutCandidature.PRE_SELECTIONNE;
            
            if (target != null) {
                log.info("Migrating candidature {} from {} to {}", c.getId(), current, target);
                c.setStatut(target);
                candidatureRepository.save(c);
                migratedCount++;
            }
        }
        
        log.info("Migration finished. Total migrated: {}", migratedCount);
    }

    @Transactional
    public void cleanupAnonymousCandidatures() {
        log.info("Cleaning up anonymous candidatures");
        candidatureRepository.deleteAnonymous();
    }
    
    public List<CandidatureLog> getHistorique(Long candidatureId) {
        return logRepository.findByCandidatureIdOrderByCreatedAtDesc(candidatureId);
    }
    
    private team.project.redboost.dto.CandidatureRedstarterResponseDTO mapToResponseDto(CandidatureRedstarter entity) {
        // Explicitly initialize lazy collections while in transaction
        if (entity.getDocuments() != null) entity.getDocuments().size();
        if (entity.getBesoinsAccompagnement() != null) entity.getBesoinsAccompagnement().size();
        if (entity.getBesoinsFormation() != null) entity.getBesoinsFormation().size();

        CandidatureRedstarter.StatutCandidature currentStatut = entity.getStatut();
        // Map legacy statuses to new ones for the UI
        if (currentStatut == CandidatureRedstarter.StatutCandidature.REFUSE) 
            currentStatut = CandidatureRedstarter.StatutCandidature.REJETE;
        else if (currentStatut == CandidatureRedstarter.StatutCandidature.EN_REVISION) 
            currentStatut = CandidatureRedstarter.StatutCandidature.EN_COURS_EVALUATION;
        else if (currentStatut == CandidatureRedstarter.StatutCandidature.PRESELECTIONNE) 
            currentStatut = CandidatureRedstarter.StatutCandidature.PRE_SELECTIONNE;
        
        team.project.redboost.dto.CandidatureRedstarterResponseDTO dto = team.project.redboost.dto.CandidatureRedstarterResponseDTO.builder()
            .id(entity.getId())
            .nomPrenom(entity.getNomPrenom())
            .genre(entity.getGenre())
            .age(entity.getAge())
            .numeroTelephone(entity.getNumeroTelephone())
            .email(entity.getEmail())
            .roleEntreprise(entity.getRoleEntreprise())
            .nomEntreprise(entity.getNomEntreprise())
            .entrepriseEst(entity.getEntrepriseEst())
            .dateCreation(entity.getDateCreation())
            .regionBasee(entity.getRegionBasee())
            .breveDescription(entity.getBreveDescription())
            .lienReseauxSociaux(entity.getLienReseauxSociaux())
            .labelStartupAct(entity.getLabelStartupAct())
            .dateObtentionLabel(entity.getDateObtentionLabel())
            .phaseMaturite(entity.getPhaseMaturite())
            .marchePersonnasCibles(entity.getMarchePersonnasCibles())
            .composanteInnovation(entity.getComposanteInnovation())
            .impactEnvironnemental(entity.getImpactEnvironnemental())
            .impactSocial(entity.getImpactSocial())
            .viabiliteCommerciale(entity.getViabiliteCommerciale())
            .valeurAjoutee(entity.getValeurAjoutee())
            .documents(new ArrayList<>(entity.getDocuments()))
            .nombreCoFondateurs(entity.getNombreCoFondateurs())
            .impliquesGestion(entity.getImpliquesGestion())
            .nombreImpliquesGestion(entity.getNombreImpliquesGestion())
            .experienceEquipeFondatrice(entity.getExperienceEquipeFondatrice())
            .nombreEmploisCrees(entity.getNombreEmploisCrees())
            .besoinsAccompagnement(new ArrayList<>(entity.getBesoinsAccompagnement()))
            .beneficieAccompagnement(entity.getBeneficieAccompagnement())
            .detailsAccompagnement(entity.getDetailsAccompagnement())
            .besoinsFormation(new ArrayList<>(entity.getBesoinsFormation()))
            .formTemplateId(entity.getFormTemplateId())
            .dynamicAnswers(entity.getDynamicAnswers())
            .dateCreationCandidature(entity.getDateCreationCandidature())
            .build();
            
        dto.setStatut(currentStatut != null ? currentStatut.name() : null);
        dto.setCommentairesAdmin(entity.getCommentairesAdmin());
        
        // Populate program and profile type information
        if (entity.getFormTemplateId() != null) {
            formTemplateRepository.findById(entity.getFormTemplateId()).ifPresent(t -> {
                dto.setProgramme(t.getProgram());
                dto.setProfileType(t.getProfileType());
            });
        } else {
            dto.setProgramme("Candidature Spontanée");
            dto.setProfileType("SPONTANEE");
        }
        
        return dto;
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
        
        if (!Files.exists(candidatureUploadPath)) {
            Files.createDirectories(candidatureUploadPath);
        }
        
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                String originalFilename = file.getOriginalFilename();
                String fileExtension = originalFilename != null ? 
                    originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
                String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
                Path filePath = candidatureUploadPath.resolve(uniqueFilename);
                
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                documentPaths.add(uniqueFilename);
                
                log.info("Document saved to: {}", filePath);
            }
        }
        
        return documentPaths;
    }
    
    private void deleteDocument(String filename) {
        try {
            Path filePath = candidatureUploadPath.resolve(filename);
            Files.deleteIfExists(filePath);
            log.info("Document deleted: {}", filename);
        } catch (IOException e) {
            log.error("Error deleting document: {}", filename, e);
        }
    }
}