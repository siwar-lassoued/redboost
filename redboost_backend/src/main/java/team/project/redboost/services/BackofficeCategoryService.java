package team.project.redboost.services;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.dto.BackofficeCategoryRequest;
import team.project.redboost.dto.BackofficeCategoryResponse;
import team.project.redboost.dto.BackofficeKpiRequest;
import team.project.redboost.dto.BackofficeKpiResponse;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;

import java.util.List;

@Service
@Transactional
public class BackofficeCategoryService {

    @Autowired private BackofficeCategoryRepository categoryRepo;
    @Autowired private BackofficeKpiRepository kpiRepo;
    @Autowired private ProgrammeKpiRepository programmeKpiRepository;
    @Autowired private ActiviteKpiRepository activiteKpiRepository;
    @Autowired private TacheKpiRepository tacheKpiRepository;
    @Autowired private ObjectifSpecifiqueRepository objectifSpecifiqueRepository;
    @Autowired private ResultatRepository resultatRepository;
    @Autowired private ResultatTransversalRepository resultatTransversalRepository;
    @Autowired private ProgrammeRepository programmeRepo;

    public List<BackofficeCategoryResponse> getAll() {
        return categoryRepo.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public BackofficeCategoryResponse getById(Long id) {
        return categoryRepo.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Catégorie backoffice introuvable"));
    }

    public BackofficeCategoryResponse create(BackofficeCategoryRequest req) {
        BackofficeCategory cat = new BackofficeCategory();
        cat.setNom(req.nom());
        cat.setDescription(req.description());
        cat.setCouleur(req.couleur());
        return toResponse(categoryRepo.save(cat));
    }

    public BackofficeCategoryResponse update(Long id, BackofficeCategoryRequest req) {
        BackofficeCategory cat = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));

        cat.setNom(req.nom());
        cat.setDescription(req.description());
        cat.setCouleur(req.couleur());

        return toResponse(categoryRepo.save(cat));
    }

    public void delete(Long id) {
        BackofficeCategory category = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));

        // Delete all KPIs in this category
        for (BackofficeKpi kpi : category.getKpis()) {
            deleteKpiReferences(kpi);
        }
        
        categoryRepo.delete(category); // This will cascade delete KPIs because of CascadeType.ALL
    }

    // === KPI Management ===
    // BackofficeCategoryService.java → addKpi()
    public BackofficeKpiResponse addKpi(Long categoryId, BackofficeKpiRequest req) {
        BackofficeCategory cat = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));

        BackofficeKpi kpi = new BackofficeKpi();
        kpi.setNom(req.nom());
        kpi.setDescription(req.description());
        kpi.setUniteMesure(req.uniteMesure());
        kpi.setType(req.type());
        kpi.setTypesuivi(req.typesuivi());
        kpi.setTypedesaisie(req.typedesaisie());

        cat.addKpi(kpi);
        kpi = kpiRepo.save(kpi);

        syncGlobalKpi(kpi);

        return new BackofficeKpiResponse(
                kpi.getId(),
                kpi.getNom(),
                kpi.getDescription(),
                kpi.getUniteMesure(),

                kpi.getType(),
                kpi.getTypesuivi(),
                kpi.getTypedesaisie()
        );
    }

    // updateKpi()
    public BackofficeKpiResponse updateKpi(Long kpiId, BackofficeKpiRequest req) {
        BackofficeKpi kpi = kpiRepo.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI introuvable"));

        kpi.setNom(req.nom());
        kpi.setDescription(req.description());
        kpi.setUniteMesure(req.uniteMesure());
        kpi.setType(req.type());
        kpi.setTypesuivi(req.typesuivi());
        kpi.setTypedesaisie(req.typedesaisie());

        kpi = kpiRepo.save(kpi);

        syncGlobalKpi(kpi);

        return new BackofficeKpiResponse(
                kpi.getId(),
                kpi.getNom(),
                kpi.getDescription(),
                kpi.getUniteMesure(),
                kpi.getType(),
                kpi.getTypesuivi(),
                kpi.getTypedesaisie()
        );
    }

    private void syncGlobalKpi(BackofficeKpi kpi) {
        if ("GLOBAL".equalsIgnoreCase(kpi.getType())) {
            List<Programme> allProgrammes = programmeRepo.findAll();
            for (Programme p : allProgrammes) {
                if (programmeKpiRepository.findByProgrammeIdAndKpiId(p.getId(), kpi.getId()).isEmpty()) {
                    ProgrammeKpi pk = new ProgrammeKpi();
                    pk.setProgrammeId(p.getId());
                    pk.setKpiId(kpi.getId());
                    programmeKpiRepository.save(pk);
                }
            }
        }
    }

    public void deleteKpi(Long kpiId) {
        BackofficeKpi kpi = kpiRepo.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI introuvable"));
        
        deleteKpiReferences(kpi);

        BackofficeCategory cat = kpi.getCategory();
        if (cat != null) cat.removeKpi(kpi);
        kpiRepo.delete(kpi);
    }

    private void deleteKpiReferences(BackofficeKpi kpi) {
        Long kpiId = kpi.getId();

        // 1. Delete from ProgrammeKpi
        programmeKpiRepository.deleteByKpiId(kpiId);

        // 2. Delete from ActiviteKpi
        activiteKpiRepository.deleteByKpiId(kpiId);

        // 3. Delete from TacheKpi
        tacheKpiRepository.deleteByKpiId(kpiId);

        // 4. Remove from ObjectifSpecifique (ManyToMany)
        List<ObjectifSpecifique> objectifs = objectifSpecifiqueRepository.findAll();
        for (ObjectifSpecifique obj : objectifs) {
            if (obj.getKpis().remove(kpi)) {
                objectifSpecifiqueRepository.save(obj);
            }
        }

        // 5. Remove from Resultat (ManyToMany)
        List<Resultat> resultats = resultatRepository.findAll();
        for (Resultat res : resultats) {
            if (res.getKpis().remove(kpi)) {
                resultatRepository.save(res);
            }
        }

        // 6. Remove from ResultatTransversal (ManyToMany)
        List<ResultatTransversal> resultatsTransversaux = resultatTransversalRepository.findAll();
        for (ResultatTransversal res : resultatsTransversaux) {
            if (res.getKpis().remove(kpi)) {
                resultatTransversalRepository.save(res);
            }
        }
    }

    private BackofficeCategoryResponse toResponse(BackofficeCategory cat) {
        var kpiList = cat.getKpis().stream()
                .map(k -> new BackofficeKpiResponse(
                        k.getId(),
                        k.getNom(),
                        k.getDescription(),
                        k.getUniteMesure(),
                        k.getType(),
                        k.getTypesuivi(),
                        k.getTypedesaisie()
                ))
                .toList();

        return new BackofficeCategoryResponse(
                cat.getId(), cat.getNom(), cat.getDescription(), cat.getCouleur(), kpiList
        );
    }


// BackofficeCategoryService.java

    public BackofficeKpiResponse getKpiById(Long kpiId) {
        BackofficeKpi kpi = kpiRepo.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI introuvable avec l'ID : " + kpiId));

        return new BackofficeKpiResponse(
                kpi.getId(),
                kpi.getNom(),
                kpi.getDescription(),
                kpi.getUniteMesure(),
                kpi.getType(),
                kpi.getTypesuivi(),
                kpi.getTypedesaisie()
        );
    }

}