// src/main/java/team/project/redboost/entities/ProgrammeKpiValeur.java
package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "programme_kpi_entrepreneur_valeurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgrammeKpiValeur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programme_kpi_id", nullable = false)
    private ProgrammeKpi programmeKpi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // For progression type
    private String valeurPrecedente;
    private String valeurActuelle;
    private String valeurCible;

    // ✅ FIXED: Changed from unidirectional to bidirectional relationship
    // This ensures history is properly deleted when parent is deleted
    @OneToMany(mappedBy = "programmeKpiValeur", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<ProgrammeKpiValeurHistory> history = new ArrayList<>();
}