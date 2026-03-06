package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Random;
import java.util.Set;

@Data
@Entity
@Table(name = "user")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(min = 2, max = 100)
    private String firstName;

    @Size(min = 2, max = 100)
    private String lastName;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    private String profilePictureUrl;

    @Column(nullable = false)
    @Email
    private String email;

    private String password;

    private String phoneNumber;

    @Column(name = "secteur")
    private String secteur;

    @Column(name = "region")
    private String region;

    @Column(name = "entreprise")
    private String entreprise;

    @Column(name = "facebook_url")
    private String facebookUrl;

    @Column(name = "instagram_url")
    private String instagramUrl;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "bio", length = 500)
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    @ManyToMany
    @JoinTable(
            name = "user_programme",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "programme_id")
    )
    private Set<Programme> programmes;

    // Coach-specific fields
    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "skills", length = 1000)
    private String skills;

    @Column(name = "expertise", length = 1000)
    private String expertise;

    @Column(name = "formation_academ_nom")
    private String formationAcademNom;

    @Column(name = "formation_academ_date")
    private String formationAcademDate;

    @Column(name = "formation_academ_realisations", length = 1000)
    private String formationAcademRealisations;

    @Column(name = "nb_entre_coaches")
    private Integer nbEntreCoaches;

    @Column(name = "competences_pro_nom")
    private String competencesProNom;

    @Column(name = "competences_pro_date")
    private String competencesProDate;

    @Column(name = "competences_pro_certificat")
    private String competencesProCertificat;

    @Column(name = "succes_client", length = 1000)
    private String succesClient;

    @Column(name = "engagement_communautaire", length = 1000)
    private String engagementCommunautaire;

    @Column(name = "session_essai")
    private Boolean sessionEssai;

    // Entrepreneur-specific fields
    @Column(name = "startup_name")
    private String startupName;

    @Column(name = "industry")
    private String industry;

    @Column(name = "forma_academ_nom")
    private String formaAcademNom;

    @Column(name = "forma_academ_date")
    private String formaAcademDate;

    @Column(name = "forma_academ_realisations", length = 1000)
    private String formaAcademRealisations;

    @Column(name = "apprent_informel_nom")
    private String apprentInformelNom;

    @Column(name = "apprent_informel_date")
    private String apprentInformelDate;

    @Column(name = "apprent_informel_certificat")
    private String apprentInformelCertificat;

    @Column(name = "obstacle_principal", length = 1000)
    private String obstaclePrincipal;

    // Authentication fields
    private String refreshToken;

    @Transient
    private String confirm_password;

    private String confirm_code;

    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    private boolean isActive = false;

    private String provider;
    private String providerId;

    @PrePersist
    @PreUpdate
    private void prepare() {
        if (this.role == null) {
            this.role = Role.USER;
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(() -> "ROLE_" + role.name());
    }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean isActive) {
        this.isActive = isActive;
    }

    public String getConfirm_code() {
        return confirm_code;
    }

    public void setConfirm_code(String confirm_code) {
        this.confirm_code = confirm_code;
    }

    public String getConfirm_password() {
        return confirm_password;
    }

    public void setConfirm_password(String confirm_password) {
        this.confirm_password = confirm_password;
    }

    public String generateConfirmationCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }

    public String getLinkedin() {
        return linkedinUrl;
    }

    public void setLinkedin(String linkedin) {
        this.linkedinUrl = linkedin;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getResetToken() {
        return resetToken;
    }

    public void setResetToken(String resetToken) {
        this.resetToken = resetToken;
    }

    public LocalDateTime getResetTokenExpiry() {
        return resetTokenExpiry;
    }

    public void setResetTokenExpiry(LocalDateTime resetTokenExpiry) {
        this.resetTokenExpiry = resetTokenExpiry;
    }

    public Object getRoleName() {
        return role;
    }
}