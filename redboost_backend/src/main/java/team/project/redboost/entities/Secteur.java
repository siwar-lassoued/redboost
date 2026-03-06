// src/main/java/team/project/redboost/entities/Secteur.java

package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "secteurs", uniqueConstraints = @UniqueConstraint(columnNames = "nom"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Secteur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nom;

    private LocalDateTime createdAt = LocalDateTime.now();

    // THIS IS THE FIX: Use @JsonIgnore (simplest & most effective)
    @ManyToMany(mappedBy = "secteurs", fetch = FetchType.LAZY)
    @JsonIgnore  // ← THIS STOPS THE INFINITE LOOP COMPLETELY
    @Builder.Default
    private Set<Programme> programmes = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}