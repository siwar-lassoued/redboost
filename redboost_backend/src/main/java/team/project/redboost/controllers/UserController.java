package team.project.redboost.controllers;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.ProgrammeKpiValeurRepository;
import team.project.redboost.repositories.ProgrammeRepository;
import team.project.redboost.repositories.UserRepository;
import team.project.redboost.services.*;

import org.apache.poi.ss.usermodel.*;
 import org.apache.poi.xssf.usermodel.XSSFWorkbook;
 import java.io.ByteArrayOutputStream;
import org.springframework.http.ContentDisposition;
 import org.springframework.http.HttpHeaders;
 import org.springframework.http.MediaType;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private LocalFileStorageService localFileStorageService;

    @Autowired
    private ProgrammeKpiValeurRepository programmeKpiValeurRepository ;

    @Autowired
    private team.project.redboost.repositories.MatchingRepository matchingRepository;

    @Autowired
    private ExcelImportService excelImportService;

    @PatchMapping("/updateprofile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateUserProfile(
            @RequestBody Map<String, Object> updateRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            userService.updateUserProfile(userDetails.getUsername(), updateRequest);
            return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
        } catch (RuntimeException e) {
            e.printStackTrace(); // or use a logger
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", String.valueOf(e.getMessage()), "errorCode", "USER001"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to update profile", "error", e.getMessage()));
        }

    }



    @GetMapping("/profile")
    public ResponseEntity<?> getLoggedInUserProfile(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "message", "User not found!",
                        "errorCode", "USER001"
                ));
            }

            Map<String, Object> response = buildUserResponse(user);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to fetch user profile",
                    "error", e.getMessage()
            ));
        }
    }


    @PostMapping("/adduser")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<?> addUser(@RequestBody Map<String, String> registrationRequest) {
        try {
            User user = userService.addUser(registrationRequest);
            String email = registrationRequest.get("email");
            String firstName = registrationRequest.get("firstName");
            String lastName = registrationRequest.get("lastName");
            String roleStr = registrationRequest.get("role");
            Role role = Role.valueOf(roleStr);

            if (role != Role.ENTREPRENEUR && role != Role.COACH) {
                // Generate password reset token
                String resetToken = userService.generatePasswordResetToken(user);

                // Send email with password creation link
                String passwordCreationLink = "https://redboost.tn/reset-password?token=" + resetToken;
                String subject = "Welcome to Redboost! Set Your Password";
                String body = String.format(
                        "Hello %s %s,\n\n" +
                                "Welcome to Redboost! You have been added to our platform as a %s.\n\n" +
                                "Please set your password by clicking the link below:\n" +
                                "%s\n\n" +
                                "This link will expire in 24 hours. If you have any questions, feel free to reach out.\n\n" +
                                "Thank you for joining us!\n\n" +
                                "Best regards,\n" +
                                "The Redboost Team",
                        firstName, lastName, role, passwordCreationLink
                );

                emailService.sendEmail(email, subject, body);

                return ResponseEntity.ok(Map.of(
                        "message", "User added successfully! A password creation email has been sent."
                ));
            }

            return ResponseEntity.ok(Map.of(
                    "message", "User added successfully!"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage(),
                    "errorCode", e.getMessage().contains("email") ? "AUTH012" :
                            e.getMessage().contains("exists") ? "AUTH011" :
                                    e.getMessage().contains("role") ? "AUTH014" : "AUTH010"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to add user",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers(@RequestParam(required = false) String role) {
        List<User> users;
        if (role != null && !role.isEmpty()) {
            try {
                Role roleEnum = Role.valueOf(role.toUpperCase());
                users = userRepository.findByRole(roleEnum);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
            }
        } else {
            users = userRepository.findAll();
        }
        return ResponseEntity.ok(users);
    }

    @GetMapping("/all")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PatchMapping("/update/{id}")
    public ResponseEntity<?> updateUserById(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updateRequest) {
        try {
            for (int attempt = 0; attempt < 3; attempt++) {
                try {
                    User user = userService.findById(id);
                    String userEmail = user.getEmail();

                    // Update common fields
                    if (updateRequest.containsKey("firstName")) {
                        user.setFirstName((String) updateRequest.get("firstName"));
                    }
                    if (updateRequest.containsKey("lastName")) {
                        user.setLastName((String) updateRequest.get("lastName"));
                    }
                    if (updateRequest.containsKey("phoneNumber")) {
                        user.setPhoneNumber((String) updateRequest.get("phoneNumber"));
                    }
                    if (updateRequest.containsKey("facebook")) {
                        String facebook = (String) updateRequest.get("facebook");
                        user.setFacebookUrl(facebook != null && !facebook.isEmpty() ? facebook : null);
                    }
                    if (updateRequest.containsKey("instagram")) {
                        String instagram = (String) updateRequest.get("instagram");
                        user.setInstagramUrl(instagram != null && !instagram.isEmpty() ? instagram : null);
                    }
                    if (updateRequest.containsKey("linkedin")) {
                        String linkedin = (String) updateRequest.get("linkedin");
                        user.setLinkedinUrl(linkedin != null && !linkedin.isEmpty() ? linkedin : null);
                    }
                    if (updateRequest.containsKey("bio")) {
                        String bio = (String) updateRequest.get("bio");
                        user.setBio(bio != null && !bio.isEmpty() ? bio : null);
                    }
                    if (updateRequest.containsKey("email")) {
                        String newEmail = (String) updateRequest.get("email");
                        if (!newEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body(Map.of("message", "Invalid email format", "errorCode", "AUTH012"));
                        }
                        User existingUser = userService.findByEmail(newEmail);
                        if (existingUser != null && !existingUser.getId().equals(user.getId())) {
                            return ResponseEntity.status(HttpStatus.CONFLICT)
                                    .body(Map.of("message", "Email already in use", "errorCode", "AUTH011"));
                        }
                        user.setEmail(newEmail);
                        userEmail = newEmail;
                    }

                    // Update role if provided
                    if (updateRequest.containsKey("role")) {
                        String roleString = (String) updateRequest.get("role");
                        try {
                            Role newRole = Role.valueOf(roleString.toUpperCase());
                            user.setRole(newRole);
                        } catch (IllegalArgumentException e) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body(Map.of("message", "Invalid role value: " + roleString, "errorCode", "ROLE001"));
                        }
                    }

                    // Update role-specific fields based on current role
                    Role currentRole = user.getRole();

                    if (currentRole == Role.COACH) {
                        if (updateRequest.containsKey("yearsOfExperience")) {
                            user.setYearsOfExperience((Integer) updateRequest.get("yearsOfExperience"));
                        }
                        if (updateRequest.containsKey("skills")) {
                            String skills = (String) updateRequest.get("skills");
                            user.setSkills(skills != null && !skills.isEmpty() ? skills : null);
                        }
                        if (updateRequest.containsKey("expertise")) {
                            String expertise = (String) updateRequest.get("expertise");
                            user.setExpertise(expertise != null && !expertise.isEmpty() ? expertise : null);
                        }
                        if (updateRequest.containsKey("formationAcademNom")) {
                            String formationAcademNom = (String) updateRequest.get("formationAcademNom");
                            user.setFormationAcademNom(formationAcademNom != null && !formationAcademNom.isEmpty() ? formationAcademNom : null);
                        }
                        if (updateRequest.containsKey("formationAcademDate")) {
                            String formationAcademDate = (String) updateRequest.get("formationAcademDate");
                            user.setFormationAcademDate(formationAcademDate != null && !formationAcademDate.isEmpty() ? formationAcademDate : null);
                        }
                        if (updateRequest.containsKey("formationAcademRealisations")) {
                            String formationAcademRealisations = (String) updateRequest.get("formationAcademRealisations");
                            user.setFormationAcademRealisations(formationAcademRealisations != null && !formationAcademRealisations.isEmpty() ? formationAcademRealisations : null);
                        }
                        if (updateRequest.containsKey("nbEntreCoaches")) {
                            user.setNbEntreCoaches((Integer) updateRequest.get("nbEntreCoaches"));
                        }
                        if (updateRequest.containsKey("competencesProNom")) {
                            String competencesProNom = (String) updateRequest.get("competencesProNom");
                            user.setCompetencesProNom(competencesProNom != null && !competencesProNom.isEmpty() ? competencesProNom : null);
                        }
                        if (updateRequest.containsKey("competencesProDate")) {
                            String competencesProDate = (String) updateRequest.get("competencesProDate");
                            user.setCompetencesProDate(competencesProDate != null && !competencesProDate.isEmpty() ? competencesProDate : null);
                        }
                        if (updateRequest.containsKey("competencesProCertificat")) {
                            String competencesProCertificat = (String) updateRequest.get("competencesProCertificat");
                            user.setCompetencesProCertificat(competencesProCertificat != null && !competencesProCertificat.isEmpty() ? competencesProCertificat : null);
                        }
                        if (updateRequest.containsKey("succesClient")) {
                            String succesClient = (String) updateRequest.get("succesClient");
                            user.setSuccesClient(succesClient != null && !succesClient.isEmpty() ? succesClient : null);
                        }
                        if (updateRequest.containsKey("engagementCommunautaire")) {
                            String engagementCommunautaire = (String) updateRequest.get("engagementCommunautaire");
                            user.setEngagementCommunautaire(engagementCommunautaire != null && !engagementCommunautaire.isEmpty() ? engagementCommunautaire : null);
                        }
                        if (updateRequest.containsKey("sessionEssai")) {
                            user.setSessionEssai((Boolean) updateRequest.get("sessionEssai"));
                        }
                    } else if (currentRole == Role.ENTREPRENEUR) {
                        if (updateRequest.containsKey("startupName")) {
                            user.setStartupName((String) updateRequest.get("startupName"));
                        }
                        if (updateRequest.containsKey("industry")) {
                            user.setIndustry((String) updateRequest.get("industry"));
                        }
                        if (updateRequest.containsKey("formaAcademNom")) {
                            String formaAcademNom = (String) updateRequest.get("formaAcademNom");
                            user.setFormaAcademNom(formaAcademNom != null && !formaAcademNom.isEmpty() ? formaAcademNom : null);
                        }
                        if (updateRequest.containsKey("formaAcademDate")) {
                            String formaAcademDate = (String) updateRequest.get("formaAcademDate");
                            user.setFormaAcademDate(formaAcademDate != null && !formaAcademDate.isEmpty() ? formaAcademDate : null);
                        }
                        if (updateRequest.containsKey("formaAcademRealisations")) {
                            String formaAcademRealisations = (String) updateRequest.get("formaAcademRealisations");
                            user.setFormaAcademRealisations(formaAcademRealisations != null && !formaAcademRealisations.isEmpty() ? formaAcademRealisations : null);
                        }
                        if (updateRequest.containsKey("apprentInformelNom")) {
                            String apprentInformelNom = (String) updateRequest.get("apprentInformelNom");
                            user.setApprentInformelNom(apprentInformelNom != null && !apprentInformelNom.isEmpty() ? apprentInformelNom : null);
                        }
                        if (updateRequest.containsKey("apprentInformelDate")) {
                            String apprentInformelDate = (String) updateRequest.get("apprentInformelDate");
                            user.setApprentInformelDate(apprentInformelDate != null && !apprentInformelDate.isEmpty() ? apprentInformelDate : null);
                        }
                        if (updateRequest.containsKey("apprentInformelCertificat")) {
                            String apprentInformelCertificat = (String) updateRequest.get("apprentInformelCertificat");
                            user.setApprentInformelCertificat(apprentInformelCertificat != null && !apprentInformelCertificat.isEmpty() ? apprentInformelCertificat : null);
                        }
                        if (updateRequest.containsKey("obstaclePrincipal")) {
                            String obstaclePrincipal = (String) updateRequest.get("obstaclePrincipal");
                            user.setObstaclePrincipal(obstaclePrincipal != null && !obstaclePrincipal.isEmpty() ? obstaclePrincipal : null);
                        }
                        if (updateRequest.containsKey("descriptionProjet")) {
                            String descriptionProjet = (String) updateRequest.get("descriptionProjet");
                            user.setDescriptionProjet(descriptionProjet != null && !descriptionProjet.isEmpty() ? descriptionProjet : null);
                        }
                        if (updateRequest.containsKey("stadeProjet")) {
                            String stadeProjet = (String) updateRequest.get("stadeProjet");
                            user.setStadeProjet(stadeProjet != null && !stadeProjet.isEmpty() ? stadeProjet : null);
                        }
                        if (updateRequest.containsKey("besoinsCoaching")) {
                            String besoinsCoaching = (String) updateRequest.get("besoinsCoaching");
                            user.setBesoinsCoaching(besoinsCoaching != null && !besoinsCoaching.isEmpty() ? besoinsCoaching : null);
                        }
                        // Add these fields for ENTREPRENEUR update
                        if (updateRequest.containsKey("entreprise")) {
                            user.setEntreprise((String) updateRequest.get("entreprise"));
                        }
                        if (updateRequest.containsKey("secteur")) {
                            user.setSecteur((String) updateRequest.get("secteur"));
                        }
                        if (updateRequest.containsKey("region")) {
                            user.setRegion((String) updateRequest.get("region"));
                        }
                    }

                    userService.updateUser(user);

                    String subject = "Votre profil a été modifié - Redboost";
                    String body = String.format(
                            "Bonjour %s %s,\n\n" +
                                    "Votre profil sur Redboost a été modifié par un administrateur.\n\n" +
                                    "Détails mis à jour :\n" +
                                    "- Prénom : %s\n" +
                                    "- Nom : %s\n" +
                                    "- Email : %s\n" +
                                    "- Numéro de téléphone : %s\n" +
                                    "- Rôle : %s\n\n" +
                                    "Si vous n'avez pas demandé cette modification, veuillez contacter notre support immédiatement.\n\n" +
                                    "Cordialement,\n" +
                                    "L'équipe Redboost",
                            user.getFirstName(), user.getLastName(),
                            user.getFirstName(), user.getLastName(),
                            user.getEmail(), user.getPhoneNumber(), user.getRole()
                    );

                    emailService.sendEmail(userEmail, subject, body);

                    return ResponseEntity.ok(Map.of("message", "User updated successfully, notification email sent."));
                } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
                    if (attempt == 2) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(Map.of("message", "The user was modified by another transaction. Please try again.", "errorCode", "CONFLICT001"));
                    }
                    try {
                        Thread.sleep(100);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "The user was modified by another transaction. Please try again.", "errorCode", "CONFLICT001"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to update user", "error", e.getMessage()));
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String email = userDetails.getUsername();

            // Use local file storage
            LocalFileStorageService.FileUploadResult uploadResult = localFileStorageService.uploadFileWithMimeType(file);
            String fileName = uploadResult.getFileName();

            // Construct the URL that will be accessible via the resource handler
            String imageUrl = "/uploads/" + fileName;

            userService.updateProfilePicture(email, imageUrl);
            return ResponseEntity.ok(Map.of("message", "Profile picture updated successfully", "imageUrl", imageUrl));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to upload image", "error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        // First, delete all related ProgrammeKpiValeur records
        programmeKpiValeurRepository.deleteByUserId(id);

        // Then delete the user
        userRepository.deleteById(id);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/ByRoles")
    public ResponseEntity<List<User>> getFilteredUsers() {
        List<Role> roles = Arrays.asList(Role.ADMIN, Role.SUPERADMIN, Role.EMPLOYEE);
        List<User> users = userService.getUsersByRoles(roles);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/role-specific")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getUsersByRoles() {
        try {
            List<Role> targetRoles = Arrays.asList(Role.ENTREPRENEUR, Role.COACH, Role.INVESTOR);
            List<User> users = userRepository.findByRoleIn(targetRoles);
            if (users.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "message", "No users found with roles ENTREPRENEUR, COACH, or INVESTOR"
                ));
            }

            List<Map<String, Object>> response = users.stream()
                    .map(this::buildUserResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to fetch users",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/entrepreneurs")
    public ResponseEntity<List<User>> getAllEntrepreneurs() {
        List<User> entrepreneurs = userRepository.findByRole(Role.ENTREPRENEUR);
        return ResponseEntity.ok(entrepreneurs);
    }
    @GetMapping("/admins")
    public ResponseEntity<List<User>> getAllAdmins() {
        List<User> admins = userRepository.findByRoleIn(Arrays.asList(Role.ADMIN, Role.SUPERADMIN));
        return ResponseEntity.ok(admins);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            User user = userService.findById(id);
            Map<String, Object> response = buildUserResponse(user);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "message", e.getMessage(),
                    "errorCode", "USER002"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to fetch user",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/entrepreneurs/count")
    public ResponseEntity<Map<String, Long>> getEntrepreneursCount() {
        long count = userService.getEntrepreneursCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/coaches/count")
    public ResponseEntity<Map<String, Long>> getCoachesCount() {
        long count = userService.getCoachesCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    // Helper method to build user response with ALL entity fields
    private Map<String, Object> buildUserResponse(User user) {
        Map<String, Object> response = new HashMap<>();

        // Basic fields
        response.put("id", user.getId());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("email", user.getEmail());
        response.put("phoneNumber", user.getPhoneNumber());
        response.put("role", user.getRole());
        response.put("isActive", user.isActive());

        // Profile and social fields
        response.put("profilePictureUrl", user.getProfilePictureUrl());
        response.put("profile_pictureurl", user.getProfilePictureUrl()); // Keep both for compatibility
        response.put("bio", user.getBio());
        response.put("facebookUrl", user.getFacebookUrl());
        response.put("instagramUrl", user.getInstagramUrl());
        response.put("linkedinUrl", user.getLinkedinUrl());

        // Common fields for all users (NEW - These were missing)
        response.put("dateNaissance", user.getDateNaissance());
        response.put("secteur", user.getSecteur());
        response.put("region", user.getRegion());
        response.put("entreprise", user.getEntreprise());

        // Coach-specific fields
        if (user.getRole() == Role.COACH) {
            response.put("yearsOfExperience", user.getYearsOfExperience());
            response.put("skills", user.getSkills());
            response.put("expertise", user.getExpertise());
            response.put("formationAcademNom", user.getFormationAcademNom());
            response.put("formationAcademDate", user.getFormationAcademDate());
            response.put("formationAcademRealisations", user.getFormationAcademRealisations());
            response.put("nbEntreCoaches", user.getNbEntreCoaches());
            response.put("competencesProNom", user.getCompetencesProNom());
            response.put("competencesProDate", user.getCompetencesProDate());
            response.put("competencesProCertificat", user.getCompetencesProCertificat());
            response.put("succesClient", user.getSuccesClient());
            response.put("engagementCommunautaire", user.getEngagementCommunautaire());
            response.put("sessionEssai", user.getSessionEssai());
        }
        // Entrepreneur-specific fields
        else if (user.getRole() == Role.ENTREPRENEUR) {
            response.put("startupName", user.getStartupName());
            response.put("industry", user.getIndustry());
            response.put("formaAcademNom", user.getFormaAcademNom());
            response.put("formaAcademDate", user.getFormaAcademDate());
            response.put("formaAcademRealisations", user.getFormaAcademRealisations());
            response.put("apprentInformelNom", user.getApprentInformelNom());
            response.put("apprentInformelDate", user.getApprentInformelDate());
            response.put("apprentInformelCertificat", user.getApprentInformelCertificat());
            response.put("obstaclePrincipal", user.getObstaclePrincipal());
            response.put("descriptionProjet", user.getDescriptionProjet());
            response.put("stadeProjet", user.getStadeProjet());
            response.put("besoinsCoaching", user.getBesoinsCoaching());
        }

        return response;
    }

    @Autowired
    private ProgrammeRepository programmeRepository; // You'll need to create this if it doesn't exist

    @PostMapping("/addentrepreneur")
    public ResponseEntity<?> addEntrepreneur(@RequestBody Map<String, Object> registrationRequest) {
        try {
            // Extract basic user data
            Map<String, String> userData = new HashMap<>();
            userData.put("email", (String) registrationRequest.get("email"));
            userData.put("firstName", (String) registrationRequest.get("firstName"));
            userData.put("lastName", (String) registrationRequest.get("lastName"));
            userData.put("phoneNumber", (String) registrationRequest.get("phoneNumber"));
            userData.put("role", "ENTREPRENEUR");

            // Add optional fields
            if (registrationRequest.containsKey("entreprise")) {
                userData.put("entreprise", (String) registrationRequest.get("entreprise"));
            }
            if (registrationRequest.containsKey("secteur")) {
                userData.put("secteur", (String) registrationRequest.get("secteur"));
            }
            if (registrationRequest.containsKey("region")) {
                userData.put("region", (String) registrationRequest.get("region"));
            }

            // Create the user
            User user = userService.addUser(userData);

            // Handle programme associations
            if (registrationRequest.containsKey("programmes")) {
                @SuppressWarnings("unchecked")
                List<Integer> programmeIds = (List<Integer>) registrationRequest.get("programmes");

                if (programmeIds != null && !programmeIds.isEmpty()) {
                    Set<Programme> programmes = new HashSet<>();
                    for (Integer progId : programmeIds) {
                        Programme programme = programmeRepository.findById(progId.longValue())
                                .orElse(null);
                        if (programme != null) {
                            programmes.add(programme);
                        }
                    }
                    user.setProgrammes(programmes);
                    userService.updateUser(user);
                }
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Entrepreneur added successfully!",
                    "userId", user.getId()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage(),
                    "errorCode", e.getMessage().contains("email") ? "AUTH012" :
                            e.getMessage().contains("exists") ? "AUTH011" :
                                    e.getMessage().contains("role") ? "AUTH014" : "AUTH010"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to add entrepreneur",
                    "error", e.getMessage()
            ));
        }
    }

    @PatchMapping("/updateentrepreneur/{id}")
    public ResponseEntity<?> updateEntrepreneur(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updateRequest) {
        try {
            User user = userService.findById(id);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
            }

            // Ensure we are updating an entrepreneur
            if (user.getRole() != Role.ENTREPRENEUR) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "User is not an entrepreneur"));
            }

            // Update basic fields
            if (updateRequest.containsKey("firstName")) {
                user.setFirstName((String) updateRequest.get("firstName"));
            }
            if (updateRequest.containsKey("lastName")) {
                user.setLastName((String) updateRequest.get("lastName"));
            }
            if (updateRequest.containsKey("email")) {
                String newEmail = (String) updateRequest.get("email");
                if (!newEmail.equals(user.getEmail())) {
                    // Check if email is already taken by another user
                    User existingUser = userService.findByEmail(newEmail);
                    if (existingUser != null && !existingUser.getId().equals(user.getId())) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Email already in use"));
                    }
                    user.setEmail(newEmail);
                }
            }
            if (updateRequest.containsKey("phoneNumber")) {
                user.setPhoneNumber((String) updateRequest.get("phoneNumber"));
            }

            // Update entrepreneur specific fields
            if (updateRequest.containsKey("entreprise")) {
                user.setEntreprise((String) updateRequest.get("entreprise"));
            }
            if (updateRequest.containsKey("secteur")) {
                user.setSecteur((String) updateRequest.get("secteur"));
            }
            if (updateRequest.containsKey("region")) {
                user.setRegion((String) updateRequest.get("region"));
            }
            if (updateRequest.containsKey("descriptionProjet")) {
                user.setDescriptionProjet((String) updateRequest.get("descriptionProjet"));
            }
            if (updateRequest.containsKey("stadeProjet")) {
                user.setStadeProjet((String) updateRequest.get("stadeProjet"));
            }
            if (updateRequest.containsKey("besoinsCoaching")) {
                user.setBesoinsCoaching((String) updateRequest.get("besoinsCoaching"));
            }

            // Handle programme associations
            if (updateRequest.containsKey("programmes")) {
                @SuppressWarnings("unchecked")
                List<Integer> programmeIds = (List<Integer>) updateRequest.get("programmes");

                if (programmeIds != null) {
                    Set<Programme> programmes = new HashSet<>();
                    for (Integer progId : programmeIds) {
                        Programme programme = programmeRepository.findById(progId.longValue())
                                .orElse(null);
                        if (programme != null) {
                            programmes.add(programme);
                        }
                    }
                    user.setProgrammes(programmes);
                }
            }

            userService.updateUser(user);

            return ResponseEntity.ok(Map.of(
                    "message", "Entrepreneur updated successfully",
                    "userId", user.getId()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to update entrepreneur",
                    "error", e.getMessage()
            ));
        }
    }




    @PostMapping("/import-entrepreneurs")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<?> importEntrepreneurs(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "successCount", 0,
                        "errors", List.of("Please upload a valid Excel file")
                ));
            }

            // Validate file type
            String filename = file.getOriginalFilename();
            if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
                return ResponseEntity.badRequest().body(Map.of(
                        "successCount", 0,
                        "errors", List.of("Invalid file format. Please upload an Excel file (.xlsx or .xls)")
                ));
            }

            Map<String, Object> result = excelImportService.importEntrepreneurs(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace(); // Log the full stack trace
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "successCount", 0,
                    "errors", List.of("Failed to import entrepreneurs: " + e.getMessage())
            ));
        }
    }



    // Add this method to your UserController.java

    @GetMapping("/entrepreneurs/template")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<byte[]> downloadEntrepreneursTemplate() {
        try {
            // Create a new workbook
            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Entrepreneurs");

            // Create header row with styling
            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Define headers
            String[] headers = {"Nom", "Prenom", "Email", "Telephone", "Entreprise", "Secteur", "Region"};

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                // Auto-size columns
                sheet.setColumnWidth(i, 4000);
            }

            // Add a sample row with example data
            Row sampleRow = sheet.createRow(1);
            String[] sampleData = {
                    "Doe",
                    "John",
                    "john.doe@example.com",
                    "21612345678",
                    "Tech Startup Inc",
                    "Technology",
                    "Tunis"
            };

            CellStyle sampleStyle = workbook.createCellStyle();
            Font sampleFont = workbook.createFont();
            sampleFont.setItalic(true);
            sampleFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            sampleStyle.setFont(sampleFont);

            for (int i = 0; i < sampleData.length; i++) {
                Cell cell = sampleRow.createCell(i);
                cell.setCellValue(sampleData[i]);
                cell.setCellStyle(sampleStyle);
            }

            // Write workbook to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            workbook.close();

            byte[] bytes = outputStream.toByteArray();

            // Set headers for file download
            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            httpHeaders.setContentDisposition(ContentDisposition.builder("attachment")
                    .filename("entrepreneurs_import_template.xlsx")
                    .build());
            httpHeaders.setContentLength(bytes.length);

            return new ResponseEntity<>(bytes, httpHeaders, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/entrepreneurs/{entrepreneurId}/coaches")
    public ResponseEntity<List<Map<String, Object>>> getCoachesForEntrepreneur(@PathVariable Long entrepreneurId) {
        List<team.project.redboost.entities.Matching> matchings = matchingRepository.findByEntrepreneurIdAndStatut(
                entrepreneurId, team.project.redboost.entities.Matching.StatutMatching.VALIDE);
        
        List<Map<String, Object>> coaches = matchings.stream()
                .map(m -> userService.findById(m.getCoachId()))
                .filter(coach -> coach != null)
                .map(this::buildUserResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(coaches);
    }

    @GetMapping("/coach/{coachId}/entrepreneurs")
    public ResponseEntity<List<Map<String, Object>>> getEntrepreneursForCoach(@PathVariable Long coachId) {
        List<team.project.redboost.entities.Matching> matchings = matchingRepository.findByCoachIdAndStatut(
                coachId, team.project.redboost.entities.Matching.StatutMatching.VALIDE);

        List<Map<String, Object>> response = matchings.stream()
                .map(m -> userService.findById(m.getEntrepreneurId()))
                .filter(entrepreneur -> entrepreneur != null)
                .map(this::buildUserResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}