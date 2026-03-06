// src/main/java/team/project/redboost/entities/ActiviteDocument.java
package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "activite_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ActiviteDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom; // Original filename

    @Column(nullable = false)
    private String cheminFichier; // URL path to access file

    @Column(nullable = false)
    private String typeFichier; // MIME type (application/pdf, image/jpeg, etc.)

    @Column(nullable = false)
    private Long tailleFichier; // Size in bytes

    @Column(name = "date_upload", nullable = false)
    private LocalDateTime dateUpload;

    @Column(name = "uploaded_by_id")
    private Long uploadedById; // User who uploaded

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activite_id", nullable = false)
    @JsonIgnoreProperties({"documents", "taches", "sprint", "hibernateLazyInitializer", "handler"})
    private Activite activite;

    @PrePersist
    protected void onCreate() {
        dateUpload = LocalDateTime.now();
    }
}