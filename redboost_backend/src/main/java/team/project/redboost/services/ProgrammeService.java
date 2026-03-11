// src/main/java/team/project/redboost/services/ProgrammeService.java
package team.project.redboost.services;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.dto.*;
import team.project.redboost.dto.dashboardglobal.*;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgrammeService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private final TacheRepository tacheRepository;
    private final ActiviteRepository activiteRepository;
    private final BackofficeKpiRepository kpiRepo;
    private final ProgrammeKpiRepository programmeKpiRepository;
    private final ProgrammeRepository programmeRepo;
    private final SecteurRepository secteurRepository;
    private final SprintRepository sprintRepository;
    private final DateValidationService dateValidationService;
    private final ActiviteService activiteService;
    private final ProgrammeKpiValeurRepository programmeKpiValeurRepository;
    private final UserRepository userRepository;
    private final RapportRepository rapportRepository;
    private final ProgrammeKpiHistoryRepository programmeKpiHistoryRepository;
    private final ProgrammeKpiValeurHistoryRepository programmeKpiValeurHistoryRepository;

    // ==================== CRUD BASIQUE ====================
    public List<Programme> findAll() {
        return programmeRepo.findAll();
    }

    public Programme findById(Long id) {
        return programmeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Programme non trouvé"));
    }

    @Transactional   // ← THIS IS THE MISSING PIECE
    public Programme create(Programme programme) {
        // Validate programme dates
        if (programme.getDateDebut() != null && programme.getDateFin() != null) {
            if (!programme.getDateDebut().isBefore(programme.getDateFin())) {
                throw new RuntimeException("La date de début du programme doit être avant la date de fin");
            }
        }

        programme.setSecteurs(resolveSecteurs(programme.getSecteurs()));

        Programme saved = programmeRepo.save(programme);  // ID is now guaranteed
        attachGlobalKpis(saved);                          // works perfectly

        return saved;
    }
    public Programme update(Long id, Programme updated) {
        Programme existing = findById(id);

        // Validate new dates if they're being changed
        if (updated.getDateDebut() != null && updated.getDateFin() != null) {
            dateValidationService.validateProgrammeDatesForUpdate(id, updated.getDateDebut(), updated.getDateFin());
        }

        existing.setNom(updated.getNom());
        existing.setAnnee(updated.getAnnee());
        existing.setTypeProgramme(updated.getTypeProgramme());
        existing.setNombreBeneficiaires(updated.getNombreBeneficiaires());
        existing.setDateDebut(updated.getDateDebut());
        existing.setDateFin(updated.getDateFin());
        existing.setResponsableId(updated.getResponsableId());
        existing.setStatut(updated.getStatut());
        existing.setDescription(updated.getDescription());
        existing.setCouleurTheme(updated.getCouleurTheme());
        existing.setLogoUrl(updated.getLogoUrl());

        // MAGIC: Resolve secteurs from names (even if frontend sends strings!)
        existing.setSecteurs(resolveSecteurs(updated.getSecteurs()));

        return programmeRepo.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Programme programme = findById(id);

        // 1. Remove associations with Users (Entrepreneurs)
        List<User> usersWithProgram = userRepository.findAll().stream()
                .filter(u -> u.getProgrammes().contains(programme))
                .collect(Collectors.toList());

        for (User user : usersWithProgram) {
            user.getProgrammes().remove(programme);
            userRepository.save(user);
        }

        // 2. Delete related ProgrammeKpi records
        // Note: ProgrammeKpiValeur and ProgrammeKpiHistory should be deleted via cascade if configured,
        // otherwise we need to delete them explicitly.
        // Based on entities, ProgrammeKpi has OneToMany with cascade ALL for valeurs and history.
        programmeKpiRepository.deleteByProgrammeId(id);

        // 3. Delete related Rapport
        Optional<Rapport> rapport = rapportRepository.findByProgrammeId(id);
        rapport.ifPresent(rapportRepository::delete);

        // 4. Delete related Sprints (and their Activites, Taches, Documents via cascade)
        // Programme entity has @OneToMany(mappedBy = "programme", cascade = CascadeType.ALL, orphanRemoval = true) for sprints
        // So deleting the programme should delete sprints.
        // However, sometimes explicit deletion is safer or required if relationships are bidirectional.
        // Given the entity definition:
        // @OneToMany(mappedBy = "programme", cascade = CascadeType.ALL, orphanRemoval = true)
        // private List<Sprint> sprints = new ArrayList<>();
        // The sprints should be deleted automatically when the programme is deleted.

        // 5. Delete the Programme itself
        programmeRepo.delete(programme);
    }

    private Set<Secteur> resolveSecteurs(Set<Secteur> incomingSecteurs) {
        if (incomingSecteurs == null || incomingSecteurs.isEmpty()) {
            return new HashSet<>();
        }

        Set<Secteur> resolved = new HashSet<>();

        for (Secteur s : incomingSecteurs) {
            if (s == null || s.getNom() == null || s.getNom().trim().isEmpty()) {
                continue;
            }

            String nomClean = s.getNom().trim();

            Secteur existing = secteurRepository
                    .findByNomIgnoreCase(nomClean)
                    .orElse(null);

            if (existing != null) {
                resolved.add(existing);
            } else {
                // Create new secteur
                Secteur newSecteur = Secteur.builder()
                        .nom(capitalizeFirst(nomClean))
                        .build();
                Secteur savedSecteur = secteurRepository.save(newSecteur);
                resolved.add(savedSecteur);
            }
        }
        return resolved;
    }

    // Optional: nice capitalization
    private String capitalizeFirst(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    // Inside attachGlobalKpis() – now checks kpi.getType() instead of category
    private void attachGlobalKpis(Programme programme) {
        List<BackofficeKpi> globalKpis = kpiRepo.findAll().stream()
                .filter(kpi -> "GLOBAL".equals(kpi.getType()))
                .toList();

        List<ProgrammeKpi> programmeKpis = globalKpis.stream()
                .map(kpi -> ProgrammeKpi.builder()
                        .programmeId(programme.getId())
                        .kpiId(kpi.getId())
                        // .typesuivi(kpi.getTypesuivi()) // Removed redundant field
                        .build())
                .toList();

        programmeKpiRepository.saveAll(programmeKpis);
    }

    // ==================== KPI MANAGEMENT ====================
    /**
     * Add a KPI to a program (works for both GLOBAL and OPTIONNEL KPIs)
     */
    @Transactional
    public void ajouterKpiOptionnel(Long programmeId, Long kpiId) {
        Programme programme = programmeRepo.findById(programmeId)
                .orElseThrow(() -> new IllegalArgumentException("Programme non trouvé"));

        BackofficeKpi kpi = kpiRepo.findById(kpiId)
                .orElseThrow(() -> new IllegalArgumentException("KPI non trouvé"));

        // Check if already attached using the join table
        Optional<ProgrammeKpi> existing = programmeKpiRepository
                .findByProgrammeIdAndKpiId(programmeId, kpiId);

        if (existing.isPresent()) {
            throw new IllegalArgumentException("Ce KPI est déjà attaché à ce programme");
        }

        // Create the link in ProgrammeKpi table
        ProgrammeKpi programmeKpi = ProgrammeKpi.builder()
                .programmeId(programmeId)
                .kpiId(kpiId)
                .build();

        programmeKpiRepository.save(programmeKpi);

        // Log for debugging
        System.out.println("✅ KPI " + kpi.getNom() + " (Type: " + kpi.getType() + ") attaché au programme " + programme.getNom());
    }

    /**
     * Remove a KPI from a program
     * Now allows removing GLOBAL KPIs if needed (with appropriate checks)
     */
    @Transactional
    public void retirerKpi(Long programmeId, Long kpiId) {
        Programme programme = programmeRepo.findById(programmeId)
                .orElseThrow(() -> new IllegalArgumentException("Programme non trouvé"));

        BackofficeKpi kpi = kpiRepo.findById(kpiId)
                .orElseThrow(() -> new IllegalArgumentException("KPI non trouvé"));

        // Check if KPI is attached
        Optional<ProgrammeKpi> programmeKpiOpt = programmeKpiRepository
                .findByProgrammeIdAndKpiId(programmeId, kpiId);

        if (programmeKpiOpt.isEmpty()) {
            throw new IllegalArgumentException("Ce KPI n'est pas attaché à ce programme");
        }

        ProgrammeKpi programmeKpi = programmeKpiOpt.get();

        // Check if there are any values (global or entrepreneur)
        boolean hasGlobalValues = programmeKpi.getValeurActuelle() != null ||
                programmeKpi.getValeurPrecedente() != null ||
                programmeKpi.getValeurCible() != null;

        boolean hasEntrepreneurValues = programmeKpi.getValeurs() != null &&
                !programmeKpi.getValeurs().isEmpty();

        if (hasGlobalValues || hasEntrepreneurValues) {
            throw new IllegalArgumentException(
                    "Impossible de retirer ce KPI car il contient des valeurs saisies. " +
                            "Veuillez supprimer les valeurs d'abord."
            );
        }

        // Remove the KPI link
        programmeKpiRepository.delete(programmeKpi);

        // Log for debugging
        System.out.println("✅ KPI " + kpi.getNom() + " (Type: " + kpi.getType() + ") retiré du programme " + programme.getNom());
    }



    public List<BackofficeKpi> getKpisDuProgramme(Long programmeId) {
        return programmeKpiRepository.findByProgrammeId(programmeId).stream()
                .map(pk -> kpiRepo.findById(pk.getKpiId()).orElse(null))
                .toList();
    }

    public ResponseEntity<?> getKpisWithStatus(Long id) {
        List<ProgrammeKpi> linked = programmeKpiRepository.findByProgrammeId(id);
        Set<Long> attachedKpiIds = linked.stream()
                .map(ProgrammeKpi::getKpiId)
                .collect(Collectors.toSet());

        List<BackofficeKpi> allKpis = kpiRepo.findAll();

        List<Map<String, Object>> result = allKpis.stream().map(kpi -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", kpi.getId());
            map.put("nom", kpi.getNom());
            map.put("uniteMesure", kpi.getUniteMesure());
            map.put("description", kpi.getDescription());
            map.put("typesuivi", kpi.getTypesuivi()); // Get directly from BackofficeKpi

            BackofficeCategory cat = kpi.getCategory();
            String kpiType = kpi.getType();

            map.put("category", cat != null ? Map.of(
                    "id", cat.getId(),
                    "nom", cat.getNom(),
                    "couleur", cat.getCouleur()
            ) : null);

            boolean isGlobal = "GLOBAL".equals(kpiType);
            map.put("isGlobal", isGlobal);
            map.put("isAttached", attachedKpiIds.contains(kpi.getId()));
            map.put("cannotRemove", isGlobal);

            // If attached, add values (including entrepreneur values if applicable)
            if (attachedKpiIds.contains(kpi.getId())) {
                ProgrammeKpi pk = linked.stream()
                        .filter(p -> p.getKpiId().equals(kpi.getId()))
                        .findFirst()
                        .orElse(null);
                if (pk != null) {
                    map.put("valeurPrecedente", pk.getValeurPrecedente());
                    map.put("valeurActuelle", pk.getValeurActuelle());
                    map.put("valeurCible", pk.getValeurCible());

                    // If typesuivi is Entrepreneur, fetch detailed values
                    if ("Entrepreneur".equalsIgnoreCase(kpi.getTypesuivi())) {
                        List<ProgrammeKpiValeur> valeurs = programmeKpiValeurRepository.findByProgrammeKpiId(pk.getId());
                        List<Map<String, Object>> entrepreneurValues = valeurs.stream().map(v -> {
                            Map<String, Object> vMap = new HashMap<>();
                            vMap.put("userId", v.getUser().getId());
                            vMap.put("userName", v.getUser().getFirstName() + " " + v.getUser().getLastName());
                            vMap.put("valeur", v.getValeurActuelle()); // Only one value
                            return vMap;
                        }).collect(Collectors.toList());
                        map.put("entrepreneurValues", entrepreneurValues);
                    }
                }
            }

            return map;
        }).toList();

        Map<String, List<Map<String, Object>>> grouped = result.stream()
                .collect(Collectors.groupingBy(m -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> catMap = (Map<String, Object>) m.get("category");
                    boolean isGlobal = (Boolean) m.get("isGlobal");

                    if (catMap == null) {
                        return "Sans catégorie (" + (isGlobal ? "GLOBAL" : "OPTIONNEL") + ")";
                    }

                    String catName = (String) catMap.get("nom");
                    String typeLabel = isGlobal ? "GLOBAL" : "OPTIONNEL";
                    return catName + " (" + typeLabel + ")";
                }));

        return ResponseEntity.ok(grouped);
    }

    // ==================== LOGO UPLOAD ====================
// ==================== LOGO UPLOAD (IMPROVED) ====================
    public String uploadLogo(Long programmeId, MultipartFile file) {
        Programme programme = findById(programmeId);

        // Add detailed logging
        System.out.println("=== LOGO UPLOAD DEBUG ===");
        System.out.println("Programme ID: " + programmeId);
        System.out.println("File name: " + file.getOriginalFilename());
        System.out.println("File size: " + file.getSize() + " bytes (" + (file.getSize() / 1024.0) + " KB)");
        System.out.println("Content type: " + file.getContentType());
        System.out.println("=======================");

        // Validate file is not empty
        if (file.isEmpty()) {
            throw new RuntimeException("Le fichier est vide");
        }

        // Validate file size (10MB = 10485760 bytes)
        long maxSize = 10485760; // 10MB
        if (file.getSize() > maxSize) {
            throw new RuntimeException(
                    String.format("Le fichier est trop volumineux (%.2f KB). Taille maximale: 10 MB",
                            file.getSize() / 1024.0)
            );
        }

        // Validate file type - be more permissive
        String contentType = file.getContentType();
        String fileName = file.getOriginalFilename();

        // Check both content type and file extension
        boolean isValidImage = false;
        if (contentType != null && contentType.startsWith("image/")) {
            isValidImage = true;
        } else if (fileName != null) {
            String lowerFileName = fileName.toLowerCase();
            if (lowerFileName.endsWith(".jpg") ||
                    lowerFileName.endsWith(".jpeg") ||
                    lowerFileName.endsWith(".png") ||
                    lowerFileName.endsWith(".gif") ||
                    lowerFileName.endsWith(".webp") ||
                    lowerFileName.endsWith(".svg")) {
                isValidImage = true;
                System.out.println("⚠️  Content-Type was '" + contentType + "' but accepting based on file extension");
            }
        }

        if (!isValidImage) {
            throw new RuntimeException(
                    "Le fichier doit être une image (PNG, JPG, GIF, WebP, SVG). Type reçu: " + contentType
            );
        }

        // Ensure upload directory exists
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            try {
                Files.createDirectories(uploadPath);
                System.out.println("✅ Upload directory created: " + uploadPath.toAbsolutePath());
            } catch (IOException e) {
                System.err.println("❌ Failed to create upload directory: " + e.getMessage());
                throw new RuntimeException("Impossible de créer le dossier d'upload: " + e.getMessage());
            }
        }

        // Delete old logo if exists
        if (programme.getLogoUrl() != null && !programme.getLogoUrl().isEmpty()) {
            System.out.println("🗑️  Deleting old logo: " + programme.getLogoUrl());
            deleteLogoFile(programme.getLogoUrl());
        }

        // Generate unique filename
        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        if (extension == null || extension.isEmpty()) {
            extension = "png"; // default extension
        }
        String filename = "logo-" + programmeId + "-" + System.currentTimeMillis() + "." + extension;
        Path filePath = uploadPath.resolve(filename);

        // Save file
        try {
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("✅ File saved successfully: " + filePath.toAbsolutePath());
            System.out.println("📁 File size on disk: " + Files.size(filePath) + " bytes");
        } catch (IOException e) {
            System.err.println("❌ Failed to save file: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Échec de l'upload du logo: " + e.getMessage());
        }

        // Update programme with new logo URL
        String logoUrl = "/uploads/" + filename;
        programme.setLogoUrl(logoUrl);
        programmeRepo.save(programme);

        System.out.println("✅ Logo URL saved to database: " + logoUrl);
        System.out.println("=== UPLOAD COMPLETE ===");

        return logoUrl;
    }

    public void deleteLogo(Long programmeId) {
        Programme p = findById(programmeId);
        if (p.getLogoUrl() != null) {
            deleteLogoFile(p.getLogoUrl());
            p.setLogoUrl(null);
            programmeRepo.save(p);
        }
    }

    private void deleteLogoFile(String logoUrl) {
        try {
            // Extract filename from URL
            String filename = logoUrl.substring(logoUrl.lastIndexOf("/") + 1);
            Path path = Paths.get(uploadDir, filename);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            System.err.println("Impossible de supprimer le fichier : " + logoUrl);
        }
    }

    @Transactional
    public RetardItemsDTO getItemsEnRetard() {
        LocalDate today = LocalDate.now();
        List<Object> items = new ArrayList<>();

        // 1. Get Sprints en retard
        List<SprintDetailDTO> allSprints = activiteService.getAllSprintsWithDetailsGlobal();

        List<SprintDetailDTO> lateSprints = allSprints.stream()
                .filter(s -> "EN_RETARD".equals(s.getStatus()))
                .collect(Collectors.toList());

        // 2. Get Activites en retard
        List<Activite> allActivites = activiteRepository.findAll();

        List<Map<String, Object>> lateActivites = allActivites.stream()
                .filter(a -> {
                    // Calculate progression
                    int progression = 0;
                    if (!a.getTaches().isEmpty()) {
                        long terminees = a.getTaches().stream()
                                .filter(t -> t.getStatus() == Tache.StatusTache.TERMINEE)
                                .count();
                        progression = (int) Math.round((terminees * 100.0) / a.getTaches().size());
                    }

                    // FIXED: Use isBefore OR equals to include today's deadline that passed
                    // Also check if dateLimite is not null first
                    boolean isLate = a.getDateLimite() != null
                            && !a.getDateLimite().isAfter(today)  // includes today and before
                            && progression < 100;

                    return isLate;
                })
                .map(a -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("type", "ACTIVITE");
                    map.put("id", a.getId());
                    map.put("nom", a.getNom());
                    map.put("dateLimite", a.getDateLimite());

                    // Calculate days late
                    long daysLate = ChronoUnit.DAYS.between(a.getDateLimite(), today);
                    map.put("daysLate", daysLate);

                    return map;
                })
                .collect(Collectors.toList());

        // 3. Get Taches en retard
        List<Tache> allTaches = tacheRepository.findAll();

        // For Tâches - Add "nom" field to match Sprint/Activité
        List<Map<String, Object>> lateTaches = allTaches.stream()
                .filter(t -> {
                    boolean isLate = t.getDateLimite() != null
                            && !t.getDateLimite().isAfter(today)
                            && t.getStatus() != Tache.StatusTache.TERMINEE;

                    return isLate;
                })
                .map(t -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("type", "TACHE");
                    map.put("id", t.getId());
                    map.put("titre", t.getTitre());
                    map.put("nom", t.getTitre());  // ✅ ADD THIS - makes it consistent!
                    map.put("dateLimite", t.getDateLimite());
                    map.put("status", t.getStatus().toString());

                    long daysLate = ChronoUnit.DAYS.between(t.getDateLimite(), today);
                    map.put("daysLate", daysLate);

                    return map;
                })
                .collect(Collectors.toList());


        // Convert SprintDetailDTO to Map for consistency
        List<Map<String, Object>> lateSprintsMap = lateSprints.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("type", "SPRINT");
            map.put("id", s.getId());
            map.put("nom", s.getNom());
            map.put("dateFin", s.getDateFin());

            // Calculate days late if dateFin exists
            if (s.getDateFin() != null) {
                long daysLate = ChronoUnit.DAYS.between(s.getDateFin(), today);
                map.put("daysLate", daysLate);
            }

            return map;
        }).collect(Collectors.toList());

        // Build result with max 3 items (1 of each type if possible)
        if (!lateSprintsMap.isEmpty()) items.add(lateSprintsMap.get(0));
        if (!lateActivites.isEmpty()) items.add(lateActivites.get(0));
        if (!lateTaches.isEmpty()) items.add(lateTaches.get(0));

        // Fill up to 3 items if we have less
        if (items.size() < 3) {
            for (int i = 1; i < lateSprintsMap.size() && items.size() < 3; i++) {
                items.add(lateSprintsMap.get(i));
            }
        }
        if (items.size() < 3) {
            for (int i = 1; i < lateActivites.size() && items.size() < 3; i++) {
                items.add(lateActivites.get(i));
            }
        }
        if (items.size() < 3) {
            for (int i = 1; i < lateTaches.size() && items.size() < 3; i++) {
                items.add(lateTaches.get(i));
            }
        }

        return new RetardItemsDTO(items);
    }

    @Transactional
    public List<EntrepreneurProgramDetailsDTO> getEntrepreneursWithProgramDetails() {
        // 1. Fetch all users with role ENTREPRENEUR
        List<User> entrepreneurs = userRepository.findByRole(Role.ENTREPRENEUR);

        return entrepreneurs.stream().map(user -> {
            // 2. For each user, fetch their programs
            List<ProgramWithKpisDTO> programDTOs = user.getProgrammes().stream().map(programme -> {

                // 3. For each program, fetch KPIs with typesuivi = "ENTREPRENEUR"
                List<ProgrammeKpi> programmeKpis = programmeKpiRepository.findByProgrammeId(programme.getId());

                List<EntrepreneurKpiDTO> kpiDTOs = programmeKpis.stream()
                        .map(pk -> {
                            BackofficeKpi bk = kpiRepo.findById(pk.getKpiId()).orElse(null);
                            if (bk == null || !"Entrepreneur".equalsIgnoreCase(bk.getTypesuivi())) {
                                return null; // Skip non-entrepreneur KPIs
                            }

                            // 4. Fetch the specific value record for this user and programme-kpi link
                            ProgrammeKpiValeur pkv = programmeKpiValeurRepository
                                    .findByProgrammeKpiIdAndUserId(pk.getId(), user.getId())
                                    .orElse(null);

                            List<KpiValueHistoryDTO> historyDTOs = new ArrayList<>();
                            String valeurPrecedente = null;
                            String valeurActuelle = null;
                            String valeurCible = null;

                            if (pkv != null) {
                                // 5. Fetch the entire history for this value record, sorted
                                List<ProgrammeKpiValeurHistory> fullHistory = programmeKpiValeurHistoryRepository
                                        .findByProgrammeKpiValeurIdOrderByChangedAtDesc(pkv.getId());

                                // 6. Set the current values from the latest history record
                                if (!fullHistory.isEmpty()) {
                                    ProgrammeKpiValeurHistory latest = fullHistory.get(0);
                                    valeurPrecedente = latest.getValeurPrecedente();
                                    valeurActuelle = latest.getValeurActuelle();
                                    valeurCible = latest.getValeurCible();
                                }

                                // 7. Populate history DTO based on typesaisie
                                String typeSaisie = bk.getTypedesaisie();
                                int limit = "progression".equalsIgnoreCase(typeSaisie) ? 3 : 2;

                                historyDTOs = fullHistory.stream()
                                        .limit(limit)
                                        .map(h -> {
                                            KpiValueHistoryDTO.KpiValueHistoryDTOBuilder builder = KpiValueHistoryDTO.builder()
                                                    .valeurActuelle(h.getValeurActuelle())
                                                    .valeurCible(h.getValeurCible())
                                                    .changedAt(h.getChangedAt());

                                            if ("progression".equalsIgnoreCase(typeSaisie)) {
                                                builder.valeurPrecedente(h.getValeurPrecedente());
                                            }

                                            return builder.build();
                                        })
                                        .collect(Collectors.toList());
                            }

                            return EntrepreneurKpiDTO.builder()
                                    .kpiId(bk.getId())
                                    .nom(bk.getNom())
                                    .uniteMesure(bk.getUniteMesure())
                                    .typesaisie(bk.getTypedesaisie()) // <--- Added this line
                                    .valeurPrecedente(valeurPrecedente)
                                    .valeurActuelle(valeurActuelle)
                                    .valeurCible(valeurCible)
                                    .history(historyDTOs)
                                    .build();
                        })
                        .filter(Objects::nonNull) // Remove nulls from skipped KPIs
                        .collect(Collectors.toList());

                return ProgramWithKpisDTO.builder()
                        .id(programme.getId())
                        .nom(programme.getNom())
                        .description(programme.getDescription())
                        .kpis(kpiDTOs)
                        .build();
            }).collect(Collectors.toList());

            return EntrepreneurProgramDetailsDTO.builder()
                    .id(user.getId())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .email(user.getEmail())
                    .phoneNumber(user.getPhoneNumber())
                    .entreprise(user.getEntreprise())
                    .secteur(user.getSecteur())
                    .region(user.getRegion())
                    .programs(programDTOs)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void assignEntrepreneursToProgram(List<Long> programmeIds, List<Long> entrepreneurIds) {
        List<Programme> programmes = programmeRepo.findAllById(programmeIds);
        List<User> entrepreneurs = userRepository.findAllById(entrepreneurIds);

        for (User entrepreneur : entrepreneurs) {
            if (entrepreneur.getRole() != Role.ENTREPRENEUR) {
                continue; // Skip if not an entrepreneur
            }

            // Add program to user's set of programs
            if (entrepreneur.getProgrammes() == null) {
                entrepreneur.setProgrammes(new HashSet<>());
            }
            entrepreneur.getProgrammes().addAll(programmes);

            userRepository.save(entrepreneur);
        }
    }






    // Add this method to ProgrammeService.java

    @Transactional()
    public DashboardGlobalDTO getDashboardData() {
        List<Programme> allProgrammes = programmeRepo.findAll();

        // ==================== PROGRAM STATS ====================
        int totalProgrammes = allProgrammes.size();
        int totalBeneficiaires = allProgrammes.stream()
                .mapToInt(p -> p.getNombreBeneficiaires() != null ? p.getNombreBeneficiaires() : 0)
                .sum();

        long programmesEnCours = allProgrammes.stream()
                .filter(p -> "EN_COURS".equals(p.getStatut().toString()))
                .count();

        long programmesEnRetard = allProgrammes.stream()
                .filter(p -> "EN_RETARD".equals(p.getStatut().toString()))
                .count();

        ProgramStatsDTO programStats = ProgramStatsDTO.builder()
                .totalProgrammes(totalProgrammes)
                .totalBeneficiaires(totalBeneficiaires)
                .programmesEnCours((int) programmesEnCours)
                .programmesEnRetard((int) programmesEnRetard)
                .build();

        // ==================== GLOBAL INDICATORS (KPIs) ====================
        List<GlobalIndicatorDTO> globalIndicators = new ArrayList<>();
        List<OptionnelIndicatorDTO> optionnelIndicators = new ArrayList<>();

        // Get all KPIs from all programs
        Map<Long, List<ProgrammeKpi>> kpisByBackofficeKpiId = new HashMap<>();

        for (Programme programme : allProgrammes) {
            List<ProgrammeKpi> programmeKpis = programmeKpiRepository.findByProgrammeId(programme.getId());
            for (ProgrammeKpi pk : programmeKpis) {
                kpisByBackofficeKpiId
                        .computeIfAbsent(pk.getKpiId(), k -> new ArrayList<>())
                        .add(pk);
            }
        }

        // Aggregate KPI data
        for (Map.Entry<Long, List<ProgrammeKpi>> entry : kpisByBackofficeKpiId.entrySet()) {
            BackofficeKpi kpi = kpiRepo.findById(entry.getKey()).orElse(null);
            if (kpi == null) {
                continue;
            }

            List<ProgrammeKpi> programmeKpis = entry.getValue();

            String aggregatedValue = calculateGlobalKpiValue(kpi, programmeKpis);
            String trend = calculateTrend(programmeKpis);

            // Determine category name
            String categoryName = "Sans catégorie";
            if (kpi.getCategory() != null && kpi.getCategory().getNom() != null) {
                categoryName = kpi.getCategory().getNom();
            }

            if ("GLOBAL".equals(kpi.getType())) {
                globalIndicators.add(GlobalIndicatorDTO.builder()
                        .title(kpi.getNom())
                        .value(aggregatedValue)
                        .trend(trend)
                        .period("ce trimestre")
                        .icon(getIconForKpi(kpi.getNom()))
                        .color(getColorForKpi(kpi))
                        .bg(getBgForKpi(kpi))
                        .category(categoryName) // Set category name
                        .build());
            } else if ("OPTIONNEL".equals(kpi.getType())) {
                optionnelIndicators.add(OptionnelIndicatorDTO.builder()
                        .title(kpi.getNom())
                        .value(aggregatedValue)
                        .trend(trend)
                        .period("ce trimestre")
                        .icon(getIconForKpi(kpi.getNom()))
                        .color(getColorForKpi(kpi))
                        .bg(getBgForKpi(kpi))
                        .category(categoryName) // Set category name
                        .build());
            }
        }

        // Group indicators by category
        Map<String, List<GlobalIndicatorDTO>> groupedGlobalIndicators = globalIndicators.stream()
                .collect(Collectors.groupingBy(GlobalIndicatorDTO::getCategory));

        Map<String, List<OptionnelIndicatorDTO>> groupedOptionnelIndicators = optionnelIndicators.stream()
                .collect(Collectors.groupingBy(OptionnelIndicatorDTO::getCategory));

        // ==================== PLATFORM METRICS ====================
        int totalUtilisateurs = (int) userRepository.count();
        // You'll need to define what "active" means - for example, logged in last 30 days
        int utilisateursActifs = totalUtilisateurs * 68 / 100; // Placeholder calculation
        int utilisateursInactifs = totalUtilisateurs - utilisateursActifs;

        // Livrables - you might need to add a Deliverable entity
        int totalLivrables = 0; // Implement based on your deliverable tracking
        int livrablesValides = 0;
        int livrablesEnCours = 0;

        // Coachs - assuming you have a Role.COACH
        long totalCoachs = userRepository.findByRole(Role.COACH).size();
        int coachsCertifies = (int) (totalCoachs * 88 / 100); // Placeholder
        int coachsStagiaires = (int) totalCoachs - coachsCertifies;

        int candidaturesCoach = 12; // Implement based on your application system
        int candidaturesSemaine = 7;
        int candidaturesRevision = 5;

        PlatformMetricsDTO platformMetrics = PlatformMetricsDTO.builder()
                .totalUtilisateurs(totalUtilisateurs)
                .utilisateursActifs(utilisateursActifs)
                .utilisateursInactifs(utilisateursInactifs)
                .totalLivrables(totalLivrables)
                .livrablesValides(livrablesValides)
                .livrablesEnCours(livrablesEnCours)
                .totalCoachs((int) totalCoachs)
                .coachsCertifies(coachsCertifies)
                .coachsStagiaires(coachsStagiaires)
                .candidaturesCoach(candidaturesCoach)
                .candidaturesSemaine(candidaturesSemaine)
                .candidaturesRevision(candidaturesRevision)
                .build();

        // ==================== SMALL STATS ====================
        int moyenneBeneficiaires = totalProgrammes > 0 ? totalBeneficiaires / totalProgrammes : 0;

        // Calculate KPI completion rate (tauxCompletion)
        double totalKpiProgression = 0.0;
        int kpiCountForProgression = 0;

        for (Map.Entry<Long, List<ProgrammeKpi>> entry : kpisByBackofficeKpiId.entrySet()) {
            BackofficeKpi kpi = kpiRepo.findById(entry.getKey()).orElse(null);
            if (kpi == null || !"GLOBAL".equals(kpi.getType())) {
                continue; // Only consider GLOBAL KPIs for this calculation
            }

            List<ProgrammeKpi> programmeKpisForThisBackofficeKpi = entry.getValue();

            // Get aggregated actual value for this BackofficeKpi
            double aggregatedActual = parseDoubleSafe(calculateGlobalKpiValue(kpi, programmeKpisForThisBackofficeKpi));

            // Get aggregated target value for this BackofficeKpi
            double aggregatedTarget = getAggregatedTargetValue(kpi, programmeKpisForThisBackofficeKpi);

            if (aggregatedTarget > 0) {
                totalKpiProgression += (aggregatedActual / aggregatedTarget) * 100;
                kpiCountForProgression++;
            }
        }

        int tauxCompletion = 0;
        if (kpiCountForProgression > 0) {
            tauxCompletion = (int) Math.round(totalKpiProgression / kpiCountForProgression);
        }

        long programmesPlanifies = allProgrammes.stream()
                .filter(p -> "NON_DEMARREE".equals(p.getStatut().toString()))
                .count();

        SmallStatsDTO smallStats = SmallStatsDTO.builder()
                .moyenneBeneficiaires(moyenneBeneficiaires)
                .tauxCompletion(tauxCompletion)
                .programmesPlanifies((int) programmesPlanifies)
                .build();

        return DashboardGlobalDTO.builder()
                .programStats(programStats)
                .globalIndicators(groupedGlobalIndicators) // Pass the grouped map
                .optionnelIndicators(groupedOptionnelIndicators)
                .platformMetrics(platformMetrics)
                .smallStats(smallStats)
                .build();
    }

    // Helper methods
    private String calculateAggregatedValue(BackofficeKpi kpi, List<ProgrammeKpi> programmeKpis) {
        String uniteMesure = kpi.getUniteMesure();

        // For percentage or rate KPIs, calculate average
        if (uniteMesure != null && (uniteMesure.contains("%") || uniteMesure.toLowerCase().contains("taux"))) {
            double sum = 0;
            int count = 0;
            for (ProgrammeKpi pk : programmeKpis) {
                if (pk.getValeurActuelle() != null) {
                    try {
                        String val = pk.getValeurActuelle().replaceAll("[^0-9.]", "");
                        sum += Double.parseDouble(val);
                        count++;
                    } catch (NumberFormatException e) {
                        // Skip invalid values
                    }
                }
            }
            double avg = count > 0 ? sum / count : 0;
            return String.format("%.1f%%", avg);
        }

        // For numeric KPIs (count, amount), sum them
        double total = 0;
        for (ProgrammeKpi pk : programmeKpis) {
            if (pk.getValeurActuelle() != null) {
                try {
                    String val = pk.getValeurActuelle().replaceAll("[^0-9.]", "");
                    total += Double.parseDouble(val);
                } catch (NumberFormatException e) {
                    // Skip invalid values
                }
            }
        }

        // Format based on size
        if (total >= 1000000) {
            return String.format("%.1fM %s", total / 1000000, uniteMesure != null ? uniteMesure : "");
        } else if (total >= 1000) {
            return String.format("%.1fK %s", total / 1000, uniteMesure != null ? uniteMesure : "");
        } else {
            return String.format("%.0f %s", total, uniteMesure != null ? uniteMesure : "");
        }
    }

    private String calculateGlobalKpiValue(BackofficeKpi kpi, List<ProgrammeKpi> programmeKpis) {
        double total = 0;
        String typeSuivi = kpi.getTypesuivi();

        if ("Entrepreneur".equalsIgnoreCase(typeSuivi)) {
            // ENTREPRENEUR type: sum the last valeurActuelle from the history of each entrepreneur value
            for (ProgrammeKpi pk : programmeKpis) {
                // Get all entrepreneur values for this programme-KPI link
                List<ProgrammeKpiValeur> valeurs = programmeKpiValeurRepository.findByProgrammeKpiId(pk.getId());

                for (ProgrammeKpiValeur pkv : valeurs) {
                    // Get the history for this specific entrepreneur value, ordered by most recent first
                    List<ProgrammeKpiValeurHistory> history = programmeKpiValeurHistoryRepository
                            .findByProgrammeKpiValeurIdOrderByChangedAtDesc(pkv.getId());

                    // If there is history, add the value from the most recent record
                    if (!history.isEmpty()) {
                        total += parseDoubleSafe(history.get(0).getValeurActuelle());
                    }
                }
            }
        } else {
            // OPERATIONNEL type (default): sum last valeurActuelle from programme_kpi_history
            for (ProgrammeKpi pk : programmeKpis) {
                // Get history for this programme-KPI link
                List<ProgrammeKpiHistory> history = programmeKpiHistoryRepository
                        .findByProgrammeKpiIdOrderByChangedAtDesc(pk.getId());

                // Sum last historical valeurActuelle entry
                if (!history.isEmpty()) {
                    total += parseDoubleSafe(history.get(0).getValeurActuelle());
                }
            }
        }

        return formatValue(total, kpi.getUniteMesure());
    }

    /**
     * Safely parse a string value to double, handling null and invalid formats
     */
    private double parseDoubleSafe(String value) {
        if (value == null || value.trim().isEmpty()) {
            return 0.0;
        }
        try {
            // Remove any non-numeric characters except decimal point
            String cleaned = value.replaceAll("[^0-9.-]", "");
            return Double.parseDouble(cleaned);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    /**
     * Format the total value with appropriate units and scaling
     */
    private String formatValue(double total, String uniteMesure) {
        if (total >= 1000000) {
            return String.format("%.1fM %s", total / 1000000, uniteMesure != null ? uniteMesure : "");
        } else if (total >= 1000) {
            return String.format("%.1fK %s", total / 1000, uniteMesure != null ? uniteMesure : "");
        } else {
            return String.format("%.0f %s", total, uniteMesure != null ? uniteMesure : "");
        }
    }

    private String calculateTrend(List<ProgrammeKpi> programmeKpis) {
        double totalChange = 0;
        int count = 0;

        for (ProgrammeKpi pk : programmeKpis) {
            if (pk.getValeurActuelle() != null && pk.getValeurPrecedente() != null) {
                try {
                    double current = Double.parseDouble(pk.getValeurActuelle().replaceAll("[^0-9.]", ""));
                    double previous = Double.parseDouble(pk.getValeurPrecedente().replaceAll("[^0-9.]", ""));
                    if (previous > 0) {
                        totalChange += ((current - previous) / previous) * 100;
                        count++;
                    }
                } catch (NumberFormatException e) {
                    // Skip invalid values
                }
            }
        }

        double avgChange = count > 0 ? totalChange / count : 0;
        return String.format("+%.0f%%", avgChange);
    }

    private String getIconForKpi(String kpiName) {
        String nameLower = kpiName.toLowerCase();
        if (nameLower.contains("programme")) return "fa-folder-open";
        if (nameLower.contains("femme") || nameLower.contains("bénéficiaire")) return "fa-user-group";
        if (nameLower.contains("entrepreneur")) return "fa-user";
        if (nameLower.contains("satisfaction")) return "fa-medal";
        if (nameLower.contains("formalisation")) return "fa-check-circle";
        if (nameLower.contains("ca") || nameLower.contains("chiffre")) return "fa-chart-line";
        if (nameLower.contains("emploi")) return "fa-users";
        if (nameLower.contains("participation")) return "fa-bullseye";
        return "fa-chart-simple";
    }

    private String getColorForKpi(BackofficeKpi kpi) {
        if (kpi.getCategory() != null && kpi.getCategory().getCouleur() != null) {
            return kpi.getCategory().getCouleur();
        }
        // Default colors rotation
        String[] colors = {"#e91e63", "#880e4f", "#00897b", "#43a047", "#00c853", "#ffb300", "#1e88e5", "#8e24aa"};
        return colors[(int) (kpi.getId() % colors.length)];
    }

    private String getBgForKpi(BackofficeKpi kpi) {
        String color = getColorForKpi(kpi);
        // Map color to lighter background
        Map<String, String> colorToBg = Map.of(
                "#e91e63", "#fce4ec",
                "#880e4f", "#f3e5f5",
                "#00897b", "#e0f2f1",
                "#43a047", "#e8f5e9",
                "#00c853", "#e8f5e9",
                "#ffb300", "#fff8e1",
                "#1e88e5", "#e3f2fd",
                "#8e24aa", "#f3e5f5"
        );
        return colorToBg.getOrDefault(color, "#f5f5f5");
    }

    private double getAggregatedTargetValue(BackofficeKpi kpi, List<ProgrammeKpi> programmeKpis) {
        double totalTarget = 0;
        for (ProgrammeKpi pk : programmeKpis) {
            if (pk.getValeurCible() != null) {
                totalTarget += parseDoubleSafe(pk.getValeurCible());
            }
        }
        return totalTarget;
    }
}
