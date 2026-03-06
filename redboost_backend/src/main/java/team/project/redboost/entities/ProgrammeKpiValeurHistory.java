// src/main/java/team/project/redboost/entities/ProgrammeKpiValeurHistory.java
package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "programme_kpi_entrepreneur_valeurs_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgrammeKpiValeurHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ FIXED: Changed from plain Long to ManyToOne relationship
    // This ensures proper cascade deletion
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programme_kpi_valeur_id", nullable = false)
    @JsonBackReference
    private ProgrammeKpiValeur programmeKpiValeur;

    // For progression type
    private String valeurPrecedente;
    private String valeurActuelle;
    private String valeurCible;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt = LocalDateTime.now();

    // Optional: Track who made the change
    @Column(name = "changed_by")
    private Long changedBy; // User ID
}