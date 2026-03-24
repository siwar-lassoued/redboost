package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.dto.ProgrammeKpiHistoryResponse;
import team.project.redboost.dto.ProgrammeKpiRequest;
import team.project.redboost.dto.ProgrammeKpiResponse;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgrammeKpiService {

    private final ProgrammeKpiRepository programmeKpiRepository;
    private final ProgrammeRepository programmeRepository;
    private final BackofficeKpiRepository backofficeKpiRepository;
    private final ProgrammeKpiValeurRepository programmeKpiValeurRepository;
    private final UserRepository userRepository;
    private final ProgrammeKpiHistoryRepository programmeKpiHistoryRepository;
    private final ProgrammeKpiValeurHistoryRepository programmeKpiValeurHistoryRepository;
    private final ActiviteKpiRepository activiteKpiRepository;
    private final TacheKpiRepository tacheKpiRepository;
    private final SprintRepository sprintRepository;
    private final ActiviteRepository activiteRepository;
    private final TacheRepository tacheRepository;

    @Transactional
    public ProgrammeKpiResponse saveOrUpdate(ProgrammeKpiRequest request) {
        programmeRepository.findById(request.programmeId())
                .orElseThrow(() -> new IllegalArgumentException("Programme non trouvé : " + request.programmeId()));

        BackofficeKpi kpi = backofficeKpiRepository.findById(request.kpiId())
                .orElseThrow(() -> new IllegalArgumentException("KPI non trouvé : " + request.kpiId()));

        ProgrammeKpi programmeKpi = programmeKpiRepository
                .findByProgrammeIdAndKpiId(request.programmeId(), request.kpiId())
                .orElseGet(ProgrammeKpi::new);

        boolean isNew = programmeKpi.getId() == null;

        if (isNew) {
            programmeKpi.setProgrammeId(request.programmeId());
            programmeKpi.setKpiId(request.kpiId());
        }

        boolean isProgression = "progression".equalsIgnoreCase(kpi.getTypedesaisie());
        boolean isEntrepreneur = "ENTREPRENEUR".equalsIgnoreCase(kpi.getTypesuivi());
        boolean isOperationnel = "OPERATIONNEL".equalsIgnoreCase(kpi.getTypesuivi());

        if (isProgression) {
            // Allow setting initial previous value if it's new OR if it hasn't been set yet (null or empty)
            if (isNew || programmeKpi.getValeurPrecedente() == null || programmeKpi.getValeurPrecedente().isEmpty()) {
                programmeKpi.setValeurPrecedente(request.valeurPrecedente());
            }
            programmeKpi.setValeurActuelle(request.valeurActuelle());
            programmeKpi.setValeurCible(request.valeurCible());
        } else if (isEntrepreneur) {
            // ✅ FIX: ENTREPRENEUR + normal type maintains all 3 values without merge logic
            programmeKpi.setValeurPrecedente(request.valeurPrecedente());
            programmeKpi.setValeurActuelle(request.valeurActuelle());
            programmeKpi.setValeurCible(request.valeurCible());
        } else {
            // OPERATIONNEL + normal and others
            if (isOperationnel && !isProgression) {
                // Force calculation from activities/tasks
                double total = calculateTotalForOperationalNormalKpi(request.programmeId(), request.kpiId());
                programmeKpi.setValeurActuelle(String.valueOf(total));
            } else {
                programmeKpi.setValeurActuelle(request.valeurActuelle());
            }
            programmeKpi.setValeurCible(request.valeurCible());
            programmeKpi.setValeurPrecedente(null);
        }

        ProgrammeKpi saved = programmeKpiRepository.save(programmeKpi);

        if (isProgression) {
            // Save history with the inputs (before merging)
            ProgrammeKpiHistory history = ProgrammeKpiHistory.builder()
                    .programmeKpiId(saved.getId())
                    .valeurPrecedente(saved.getValeurPrecedente())
                    .valeurActuelle(saved.getValeurActuelle())
                    .valeurCible(saved.getValeurCible())
                    .changedAt(LocalDateTime.now())
                    .build();
            programmeKpiHistoryRepository.save(history);

            // Now merge and nullify
            double init = parseDouble(saved.getValeurPrecedente());
            double curr = parseDouble(saved.getValeurActuelle());
            saved.setValeurPrecedente(String.valueOf(init + curr));
            saved.setValeurActuelle(null);
            saved = programmeKpiRepository.save(saved);
        } else if (isEntrepreneur) {
            // ✅ FIX: ENTREPRENEUR + normal - save history but NO merge logic
            ProgrammeKpiHistory history = ProgrammeKpiHistory.builder()
                    .programmeKpiId(saved.getId())
                    .valeurPrecedente(saved.getValeurPrecedente())
                    .valeurActuelle(saved.getValeurActuelle())
                    .valeurCible(saved.getValeurCible())
                    .changedAt(LocalDateTime.now())
                    .build();
            programmeKpiHistoryRepository.save(history);
            // No merge/nullify for ENTREPRENEUR + normal type
        } else {
            // ✅ FIX: Save history for EVERY change for OPERATIONNEL + normal/other types
            ProgrammeKpiHistory history = ProgrammeKpiHistory.builder()
                    .programmeKpiId(saved.getId())
                    .valeurPrecedente(saved.getValeurPrecedente())
                    .valeurActuelle(saved.getValeurActuelle())
                    .valeurCible(saved.getValeurCible())
                    .changedAt(LocalDateTime.now())
                    .build();
            programmeKpiHistoryRepository.save(history);
        }

        return mapToResponse(saved);
    }

    @Transactional
    public void updateEntrepreneurValue(Long programmeId, Long kpiId, Long userId, String valeurPrecedente, String valeurActuelle, String valeurCible) {
        ProgrammeKpi programmeKpi = programmeKpiRepository
                .findByProgrammeIdAndKpiId(programmeId, kpiId)
                .orElseThrow(() -> new IllegalArgumentException("Lien Programme-KPI non trouvé"));

        BackofficeKpi kpi = backofficeKpiRepository.findById(kpiId)
                .orElseThrow(() -> new IllegalArgumentException("KPI non trouvé"));

        if (!"ENTREPRENEUR".equalsIgnoreCase(kpi.getTypesuivi())) {
            throw new IllegalArgumentException("Ce KPI n'est pas de type Entrepreneur");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        ProgrammeKpiValeur pkv = programmeKpiValeurRepository
                .findByProgrammeKpiIdAndUserId(programmeKpi.getId(), userId)
                .orElse(new ProgrammeKpiValeur());

        boolean isNew = pkv.getId() == null;

        if (isNew) {
            pkv.setProgrammeKpi(programmeKpi);
            pkv.setUser(user);
        }

        boolean isProgression = "progression".equalsIgnoreCase(kpi.getTypedesaisie());

        if (isProgression) {
            // Allow setting initial previous value if it's new OR if it hasn't been set yet (null or empty)
            if (isNew || pkv.getValeurPrecedente() == null || pkv.getValeurPrecedente().isEmpty()) {
                pkv.setValeurPrecedente(valeurPrecedente);
            }
            pkv.setValeurActuelle(valeurActuelle);
            pkv.setValeurCible(valeurCible);
        } else {
            // ✅ FIX: ENTREPRENEUR + normal - entrepreneur values only have actuelle and cible (no precedente)
            pkv.setValeurActuelle(valeurActuelle);
            pkv.setValeurCible(valeurCible);
            pkv.setValeurPrecedente(null);
        }

        ProgrammeKpiValeur savedPkv = programmeKpiValeurRepository.save(pkv);

        if (isProgression) {
            // Save history with inputs
            ProgrammeKpiValeurHistory history = ProgrammeKpiValeurHistory.builder()
                    .programmeKpiValeur(savedPkv)
                    .valeurPrecedente(savedPkv.getValeurPrecedente())
                    .valeurActuelle(savedPkv.getValeurActuelle())
                    .valeurCible(savedPkv.getValeurCible())
                    .changedAt(LocalDateTime.now())
                    .build();
            programmeKpiValeurHistoryRepository.save(history);

            // Merge and Nullify
            double init = parseDouble(savedPkv.getValeurPrecedente());
            double curr = parseDouble(savedPkv.getValeurActuelle());
            savedPkv.setValeurPrecedente(String.valueOf(init + curr));
            savedPkv.setValeurActuelle(null);
            savedPkv = programmeKpiValeurRepository.save(savedPkv);
        } else {
            // ✅ FIX: Save history for EVERY change for normal type (no merge logic)
            ProgrammeKpiValeurHistory history = ProgrammeKpiValeurHistory.builder()
                    .programmeKpiValeur(savedPkv)
                    .valeurPrecedente(savedPkv.getValeurPrecedente())
                    .valeurActuelle(savedPkv.getValeurActuelle())
                    .valeurCible(savedPkv.getValeurCible())
                    .changedAt(LocalDateTime.now())
                    .build();
            programmeKpiValeurHistoryRepository.save(history);
        }
    }

    public List<ProgrammeKpiResponse> getKpisByProgramme(Long programmeId) {
        programmeRepository.findById(programmeId)
                .orElseThrow(() -> new IllegalArgumentException("Programme non trouvé"));

        List<ProgrammeKpi> kpis = programmeKpiRepository.findByProgrammeIdWithKpi(programmeId);
        return kpis.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ProgrammeKpiResponse mapToResponse(ProgrammeKpi pk) {
        BackofficeKpi kpi = pk.getKpi();
        String kpiNom = kpi != null ? kpi.getNom() : "Unknown";
        String kpiUnite = kpi != null ? kpi.getUniteMesure() : "";
        String kpiType = kpi != null ? kpi.getType() : "";
        String typesuivi = kpi != null ? kpi.getTypesuivi() : "";
        String typedesaisie = kpi != null ? kpi.getTypedesaisie() : "normal";

        List<Map<String, Object>> entrepreneurValues = null;
        if ("ENTREPRENEUR".equalsIgnoreCase(typesuivi)) {
            entrepreneurValues = pk.getValeurs().stream()
                    .map(v -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("userId", v.getUser().getId());
                        map.put("userName", v.getUser().getFirstName() + " " + v.getUser().getLastName());

                        if ("progression".equalsIgnoreCase(typedesaisie)) {
                            // Progression type: 3 values
                            map.put("valeurPrecedente", v.getValeurPrecedente());
                            map.put("valeurActuelle", v.getValeurActuelle());
                            map.put("valeurCible", v.getValeurCible());
                            map.put("valeur", v.getValeurActuelle());
                        } else {
                            // ✅ FIX: Normal type: return valeurActuelle as "valeur" for frontend compatibility
                            map.put("valeur", v.getValeurActuelle());
                            map.put("valeurCible", v.getValeurCible());
                        }

                        return map;
                    })
                    .collect(Collectors.toList());
        }

        return new ProgrammeKpiResponse(
                pk.getId(),
                pk.getProgrammeId(),
                "",
                pk.getKpiId(),
                kpiType,
                kpiNom,
                kpiUnite,
                pk.getValeurPrecedente(),
                pk.getValeurActuelle(),
                pk.getValeurCible(),
                typesuivi,
                typedesaisie,
                entrepreneurValues
        );
    }

    @Transactional
    public void deleteEntrepreneurValue(Long programmeId, Long kpiId, Long userId) {
        ProgrammeKpi programmeKpi = programmeKpiRepository
                .findByProgrammeIdAndKpiId(programmeId, kpiId)
                .orElseThrow(() -> new IllegalArgumentException("Lien Programme-KPI non trouvé"));

        ProgrammeKpiValeur pkv = programmeKpiValeurRepository
                .findByProgrammeKpiIdAndUserId(programmeKpi.getId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Valeur entrepreneur non trouvée"));

        programmeKpiValeurRepository.delete(pkv);
    }

    public List<ProgrammeKpiHistoryResponse> getKpiHistory(Long programmeId, Long kpiId) {
        ProgrammeKpi programmeKpi = programmeKpiRepository
                .findByProgrammeIdAndKpiId(programmeId, kpiId)
                .orElseThrow(() -> new IllegalArgumentException("Lien Programme-KPI non trouvé"));

        List<ProgrammeKpiHistory> historyList = programmeKpiHistoryRepository
                .findByProgrammeKpiIdOrderByChangedAtDesc(programmeKpi.getId());

        return historyList.stream().map(h -> {
            String activiteNom = null;
            if (h.getActiviteId() != null) {
                activiteNom = activiteRepository.findById(h.getActiviteId())
                        .map(Activite::getNom)
                        .orElse(null);
            }

            String tacheTitre = null;
            if (h.getTacheId() != null) {
                tacheTitre = tacheRepository.findById(h.getTacheId())
                        .map(Tache::getTitre)
                        .orElse(null);
            }

            return ProgrammeKpiHistoryResponse.builder()
                    .id(h.getId())
                    .programmeKpiId(h.getProgrammeKpiId())
                    .valeurPrecedente(h.getValeurPrecedente())
                    .valeurActuelle(h.getValeurActuelle())
                    .valeurCible(h.getValeurCible())
                    .changedAt(h.getChangedAt())
                    .changedBy(h.getChangedBy())
                    .tacheId(h.getTacheId())
                    .activiteId(h.getActiviteId())
                    .activiteNom(activiteNom)
                    .tacheTitre(tacheTitre)
                    .build();
        }).collect(Collectors.toList());
    }

    public List<ProgrammeKpiValeurHistory> getEntrepreneurValueHistory(Long programmeId, Long kpiId, Long userId) {
        ProgrammeKpi programmeKpi = programmeKpiRepository
                .findByProgrammeIdAndKpiId(programmeId, kpiId)
                .orElseThrow(() -> new IllegalArgumentException("Lien Programme-KPI non trouvé"));

        ProgrammeKpiValeur pkv = programmeKpiValeurRepository
                .findByProgrammeKpiIdAndUserId(programmeKpi.getId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Valeur entrepreneur non trouvée"));

        return programmeKpiValeurHistoryRepository
                .findByProgrammeKpiValeurIdOrderByChangedAtDesc(pkv.getId());
    }

    @Transactional
    public void updateOperationalKpi(Long programmeId, Long kpiId, double delta, Long activiteId, Long tacheId) {
        BackofficeKpi kpi = backofficeKpiRepository.findById(kpiId)
                .orElseThrow(() -> new IllegalArgumentException("KPI non trouvé"));

        // Only process OPERATIONNEL KPIs
        if (!"OPERATIONNEL".equalsIgnoreCase(kpi.getTypesuivi())) {
            return;
        }

        ProgrammeKpi programmeKpi = programmeKpiRepository
                .findByProgrammeIdAndKpiId(programmeId, kpiId)
                .orElseGet(() -> {
                     ProgrammeKpi newPk = ProgrammeKpi.builder()
                        .programmeId(programmeId)
                        .kpiId(kpiId)
                        .build();
                     return programmeKpiRepository.save(newPk);
                });

        boolean isProgression = "progression".equalsIgnoreCase(kpi.getTypedesaisie());

        if (isProgression) {
            String oldValeurPrecedente = programmeKpi.getValeurPrecedente();
            double currentValeurPrecedente = parseDouble(oldValeurPrecedente);
            double newValeurPrecedente = currentValeurPrecedente + delta;

            programmeKpi.setValeurPrecedente(String.valueOf(newValeurPrecedente));
            programmeKpi.setValeurActuelle(null); // As per progression logic
            programmeKpi = programmeKpiRepository.save(programmeKpi);

            ProgrammeKpiHistory history = ProgrammeKpiHistory.builder()
                    .programmeKpiId(programmeKpi.getId())
                    .valeurPrecedente(oldValeurPrecedente)
                    .valeurActuelle(String.valueOf(delta)) // The value that was added
                    .valeurCible(programmeKpi.getValeurCible())
                    .changedAt(LocalDateTime.now())
                    .tacheId(tacheId)
                    .activiteId(activiteId)
                    .build();
            programmeKpiHistoryRepository.save(history);

        } else {
            // For Normal type, we recalculate total from all activities/tasks to be safe/consistent
            double total = calculateTotalForOperationalNormalKpi(programmeId, kpiId);

            String oldValue = programmeKpi.getValeurActuelle();
            String newValue = String.valueOf(total);

            programmeKpi.setValeurActuelle(newValue);
            programmeKpi = programmeKpiRepository.save(programmeKpi);

            ProgrammeKpiHistory history = ProgrammeKpiHistory.builder()
                    .programmeKpiId(programmeKpi.getId())
                    .valeurPrecedente(oldValue)
                    .valeurActuelle(newValue)
                    .valeurCible(programmeKpi.getValeurCible())
                    .changedAt(LocalDateTime.now())
                    .tacheId(tacheId)
                    .activiteId(activiteId)
                    .build();
            programmeKpiHistoryRepository.save(history);
        }
    }

    private double calculateTotalForOperationalNormalKpi(Long programmeId, Long kpiId) {
        double total = 0.0;
        List<Sprint> sprints = sprintRepository.findByProgrammeId(programmeId);

        for (Sprint sprint : sprints) {
            for (Activite activite : sprint.getActivites()) {
                double activiteVal = activiteKpiRepository.findByActiviteIdAndKpiId(activite.getId(), kpiId)
                        .map(ak -> parseDouble(ak.getValeurActuelle()))
                        .orElse(0.0);
                total += activiteVal;

                for (Tache tache : activite.getTaches()) {
                    double tacheVal = tacheKpiRepository.findByTacheIdAndKpiId(tache.getId(), kpiId)
                            .map(tk -> parseDouble(tk.getValeurActuelle()))
                            .orElse(0.0);
                    total += tacheVal;
                }
            }
        }
        return total;
    }

    private double parseDouble(String value) {
        if (value == null || value.trim().isEmpty()) {
            return 0.0;
        }
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}
