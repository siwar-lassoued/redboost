package team.project.redboost.entities;// src/main/java/com/example/kpi/backoffice/entity/BackofficeKpi.java

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "backoffice_kpis")
public class BackofficeKpi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom du KPI est obligatoire")
    @Column(columnDefinition = "TEXT")
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description; // optionnel

    @NotBlank(message = "L'unité de mesure est obligatoire")
    private String uniteMesure; // TND, %, heures, kg...

    // "OPTIONNEL" ou "GLOBAL" → peut être null
    private String type;

    // "ENTREPRENEUR" ou "OPERATIONNEL"
    private String typesuivi;

    // "progression" ou "normal"
    @Column(name = "typedesaisie")
    private String typedesaisie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    @JsonBackReference
    private BackofficeCategory category;

    // Constructors
    public BackofficeKpi() {}

    // Getters & Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUniteMesure() { return uniteMesure; }
    public void setUniteMesure(String uniteMesure) { this.uniteMesure = uniteMesure; }


    public BackofficeCategory getCategory() { return category; }
    public void setCategory(BackofficeCategory category) { this.category = category; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTypesuivi() { return typesuivi; }
    public void setTypesuivi(String typesuivi) { this.typesuivi = typesuivi; }

    public String getTypedesaisie() { return typedesaisie; }
    public void setTypedesaisie(String typedesaisie) { this.typedesaisie = typedesaisie; }

}