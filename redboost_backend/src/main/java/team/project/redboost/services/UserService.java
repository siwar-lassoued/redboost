package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User addUser(Map<String, String> registrationRequest) {
        String email = registrationRequest.get("email");
        String firstName = registrationRequest.get("firstName");
        String lastName = registrationRequest.get("lastName");
        String phoneNumber = registrationRequest.get("phoneNumber");
        String roleStr = registrationRequest.get("role");

        // Validate required fields
        if (email == null || firstName == null || lastName == null || phoneNumber == null || roleStr == null) {
            throw new IllegalArgumentException("All fields are required!");
        }

        // Validate email format
        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Invalid email format!");
        }

        // Check if user already exists
        if (userRepository.findByEmail(email) != null) {
            throw new IllegalArgumentException("User already exists!");
        }

        // Validate role
        Role role;
        try {
            role = Role.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role!");
        }

        // Create user with all fields
        User user = new User();
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhoneNumber(phoneNumber);
        user.setRole(role);
        user.setActive(false);
        user.setConfirm_code(null);

        // Set optional common fields
        if (registrationRequest.containsKey("dateNaissance")) {
            user.setDateNaissance(LocalDate.parse(registrationRequest.get("dateNaissance")));
        }
        if (registrationRequest.containsKey("secteur")) {
            user.setSecteur(registrationRequest.get("secteur"));
        }
        if (registrationRequest.containsKey("region")) {
            user.setRegion(registrationRequest.get("region"));
        }
        if (registrationRequest.containsKey("entreprise")) {
            user.setEntreprise(registrationRequest.get("entreprise"));
        }

        // Set role-specific fields based on role
        if (role == Role.COACH) {
            user.setSkills(registrationRequest.get("skills"));
            user.setExpertise(registrationRequest.get("expertise"));
            user.setFormationAcademNom(registrationRequest.get("formationAcademNom"));
            user.setFormationAcademDate(registrationRequest.get("formationAcademDate"));
            user.setFormationAcademRealisations(registrationRequest.get("formationAcademRealisations"));
            user.setNbEntreCoaches(registrationRequest.get("nbEntreCoaches") != null ?
                    Integer.parseInt(registrationRequest.get("nbEntreCoaches")) : null);
            user.setCompetencesProNom(registrationRequest.get("competencesProNom"));
            user.setCompetencesProDate(registrationRequest.get("competencesProDate"));
            user.setCompetencesProCertificat(registrationRequest.get("competencesProCertificat"));
            user.setSuccesClient(registrationRequest.get("succesClient"));
            user.setEngagementCommunautaire(registrationRequest.get("engagementCommunautaire"));
            user.setSessionEssai(registrationRequest.get("sessionEssai") != null ?
                    Boolean.parseBoolean(registrationRequest.get("sessionEssai")) : null);
            user.setYearsOfExperience(registrationRequest.get("yearsOfExperience") != null ?
                    Integer.parseInt(registrationRequest.get("yearsOfExperience")) : null);
        } else if (role == Role.ENTREPRENEUR) {
            user.setStartupName(registrationRequest.get("startupName"));
            user.setIndustry(registrationRequest.get("industry"));
            user.setFormaAcademNom(registrationRequest.get("formaAcademNom"));
            user.setFormaAcademDate(registrationRequest.get("formaAcademDate"));
            user.setFormaAcademRealisations(registrationRequest.get("formaAcademRealisations"));
            user.setApprentInformelNom(registrationRequest.get("apprentInformelNom"));
            user.setApprentInformelDate(registrationRequest.get("apprentInformelDate"));
            user.setApprentInformelCertificat(registrationRequest.get("apprentInformelCertificat"));
            user.setObstaclePrincipal(registrationRequest.get("obstaclePrincipal"));
        }

        return userRepository.save(user);
    }

    public User addUser(User user) {
        // Validate required fields
        if (user.getEmail() == null || user.getFirstName() == null ||
                user.getLastName() == null || user.getPhoneNumber() == null ||
                user.getRole() == null) {
            throw new IllegalArgumentException("All fields are required!");
        }

        // Validate email format
        if (!user.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Invalid email format!");
        }

        // Check if user already exists
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new IllegalArgumentException("User already exists!");
        }

        // Set default values if necessary
        if (user.getConfirm_code() == null && user.isActive()) {
            user.setConfirm_code(null);
        }

        // Hash password if provided (for non-Firebase users)
        if (user.getPassword() != null && !user.getPassword().equals("unknown")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        return userRepository.save(user);
    }

    public void updateUserProfile(String email, Map<String, Object> updateRequest) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Role role = user.getRole();

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
        if (updateRequest.containsKey("dateNaissance")) {
            user.setDateNaissance(LocalDate.parse((String) updateRequest.get("dateNaissance")));
        }
        if (updateRequest.containsKey("secteur")) {
            String secteur = (String) updateRequest.get("secteur");
            user.setSecteur(secteur != null && !secteur.isEmpty() ? secteur : null);
        }
        if (updateRequest.containsKey("region")) {
            String region = (String) updateRequest.get("region");
            user.setRegion(region != null && !region.isEmpty() ? region : null);
        }
        if (updateRequest.containsKey("entreprise")) {
            String entreprise = (String) updateRequest.get("entreprise");
            user.setEntreprise(entreprise != null && !entreprise.isEmpty() ? entreprise : null);
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

        // Role-specific updates
        if (role == Role.COACH) {
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
        } else if (role == Role.ENTREPRENEUR) {
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
        }

        userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
    }

    public User findByProviderId(String providerId) {
        return userRepository.findByProviderId(providerId);
    }

    public User updateUser(User user) {
        return userRepository.save(user);
    }

    public String generatePasswordResetToken(User user) {
        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(24));
        userRepository.save(user);
        return token;
    }

    public class InvalidTokenException extends RuntimeException {
        public InvalidTokenException(String message) {
            super(message);
        }
    }

    public User findByResetToken(String token) throws InvalidTokenException {
        Optional<User> userOptional = userRepository.findByResetToken(token);

        if (userOptional.isEmpty()) {
            throw new InvalidTokenException("Invalid reset token");
        }

        User user = userOptional.get();
        if (user.getResetTokenExpiry() == null ||
                user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Reset token has expired");
        }

        return user;
    }

    public void updatePassword(User user, String newPassword) {
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    public void updateProfilePicture(String email, String imageUrl) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        user.setProfilePictureUrl(imageUrl);
        userRepository.save(user);
    }

    public List<User> getAllCoaches() {
        return userRepository.findByRole(Role.COACH);
    }

    public List<User> getUsersByRoles(List<Role> roles) {
        return userRepository.findByRoleIn(roles);
    }

    public long getEntrepreneursCount() {
        return userRepository.countByRole(Role.ENTREPRENEUR);
    }

    public long getCoachesCount() {
        return userRepository.countByRole(Role.COACH);
    }
}