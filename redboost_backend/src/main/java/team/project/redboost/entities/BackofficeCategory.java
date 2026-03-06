package team.project.redboost.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "backoffice_categories")
public class BackofficeCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    @Column(columnDefinition = "TEXT")
    private String nom;


    @Column(columnDefinition = "TEXT")
    private String description;

    @Size(max = 7)
    private String couleur; // ex: #3B82F6

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<BackofficeKpi> kpis = new ArrayList<>();

    // Constructors
    public BackofficeCategory() {}

    public BackofficeCategory(String nom, String description, String couleur) {
        this.nom = nom;
        this.description = description;
        this.couleur = couleur;
    }

    // Helper methods
    public void addKpi(BackofficeKpi kpi) {
        kpis.add(kpi);
        kpi.setCategory(this);
    }

    public void removeKpi(BackofficeKpi kpi) {
        kpis.remove(kpi);
        kpi.setCategory(null);
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }


    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCouleur() { return couleur; }
    public void setCouleur(String couleur) { this.couleur = couleur; }

    public List<BackofficeKpi> getKpis() { return kpis; }
    public void setKpis(List<BackofficeKpi> kpis) { this.kpis = kpis; }
}