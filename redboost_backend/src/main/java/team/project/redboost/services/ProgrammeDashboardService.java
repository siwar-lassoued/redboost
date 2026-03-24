// src/main/java/team/project/redboost/services/ProgrammeDashboardService.java
package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import team.project.redboost.dto.dashboard.*;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgrammeDashboardService {

    private final ProgrammeRepository programmeRepository;
    private final SprintRepository sprintRepository;
    private final ActiviteRepository activiteRepository;
    private final TacheRepository tacheRepository;
    private final ProgrammeKpiRepository programmeKpiRepository;
    private final BackofficeKpiRepository backofficeKpiRepository;
    private final TacheKpiRepository tacheKpiRepository;
    private final ProgrammeKpiHistoryRepository programmeKpiHistoryRepository;

    /**
     * Réalisation des tâches par catégorie de KPI pour un programme
     */
    public TaskRealizationByCategoryDTO getTaskRealizationByCategory(Long programmeId) {
        // Validate programme exists
        programmeRepository.findById(programmeId)
                .orElseThrow(() -> new RuntimeException("Programme non trouvé"));

        // Get all sprints for this programme
        List<Sprint> sprints = sprintRepository.findByProgrammeId(programmeId);
        if (sprints.isEmpty()) {
            return TaskRealizationByCategoryDTO.builder()
                    .categories(new ArrayList<>())
                    .totalTasks(0)
                    .totalCompletedTasks(0)
                    .build();
        }

        // Get all tasks through sprints -> activities -> tasks
        List<Tache> allTaches = new ArrayList<>();
        for (Sprint sprint : sprints) {
            List<Activite> activites = activiteRepository.findBySprintId(sprint.getId());
            for (Activite activite : activites) {
                List<Tache> taches = tacheRepository.findByActiviteId(activite.getId());
                allTaches.addAll(taches);
            }
        }

        if (allTaches.isEmpty()) {
            return TaskRealizationByCategoryDTO.builder()
                    .categories(new ArrayList<>())
                    .totalTasks(0)
                    .totalCompletedTasks(0)
                    .build();
        }

        // Group tasks by KPI category
        Map<String, List<Tache>> tachesByCategory = new HashMap<>();
        int totalTasks = 0;
        int completedTasks = 0;

        for (Tache tache : allTaches) {
            totalTasks++;
            if (Tache.StatusTache.TERMINEE.equals(tache.getStatus())) {
                completedTasks++;
            }

            // Get KPIs associated with this task through TacheKpi
            List<TacheKpi> tacheKpis = tache.getTachesKpis();

            if (tacheKpis == null || tacheKpis.isEmpty()) {
                // Tasks without KPIs
                tachesByCategory.computeIfAbsent("Sans catégorie", k -> new ArrayList<>()).add(tache);
            } else {
                // Get actual BackofficeKpi objects
                Set<String> addedCategories = new HashSet<>();
                for (TacheKpi tacheKpi : tacheKpis) {
                    BackofficeKpi kpi = backofficeKpiRepository.findById(tacheKpi.getKpiId()).orElse(null);
                    if (kpi != null) {
                        String categoryName = kpi.getCategory() != null
                                ? kpi.getCategory().getNom()
                                : "Sans catégorie";

                        // Only add task once per category
                        if (!addedCategories.contains(categoryName)) {
                            tachesByCategory.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(tache);
                            addedCategories.add(categoryName);
                        }
                    }
                }
            }
        }

        // Calculate statistics per category
        List<CategoryTaskStats> categoryStats = new ArrayList<>();

        for (Map.Entry<String, List<Tache>> entry : tachesByCategory.entrySet()) {
            String categoryName = entry.getKey();
            List<Tache> taches = entry.getValue();

            long totalInCategory = taches.size();
            long completedInCategory = taches.stream()
                    .filter(t -> Tache.StatusTache.TERMINEE.equals(t.getStatus()))
                    .count();

            double completionRate = totalInCategory > 0
                    ? (completedInCategory * 100.0 / totalInCategory)
                    : 0.0;

            // Get category color
            String categoryColor = "#94a3b8"; // Default
            for (Tache t : taches) {
                for (TacheKpi tacheKpi : t.getTachesKpis()) {
                    BackofficeKpi kpi = backofficeKpiRepository.findById(tacheKpi.getKpiId()).orElse(null);
                    if (kpi != null && kpi.getCategory() != null
                            && categoryName.equals(kpi.getCategory().getNom())) {
                        categoryColor = kpi.getCategory().getCouleur();
                        break;
                    }
                }
                if (!categoryColor.equals("#94a3b8")) break;
            }

            categoryStats.add(CategoryTaskStats.builder()
                    .categoryName(categoryName)
                    .categoryColor(categoryColor)
                    .totalTasks((int) totalInCategory)
                    .completedTasks((int) completedInCategory)
                    .completionRate(Math.round(completionRate * 100) / 100.0)
                    .build());
        }

        // Sort by completion rate descending
        categoryStats.sort((a, b) -> Double.compare(b.getCompletionRate(), a.getCompletionRate()));

        return TaskRealizationByCategoryDTO.builder()
                .categories(categoryStats)
                .totalTasks(totalTasks)
                .totalCompletedTasks(completedTasks)
                .build();
    }

    /**
     * Performance des KPI Globaux d'un programme (Taux d'atteinte par indicateur)
     */
    public GlobalKpiPerformanceDTO getGlobalKpiPerformance(Long programmeId) {
        // Validate programme exists
        programmeRepository.findById(programmeId)
                .orElseThrow(() -> new RuntimeException("Programme non trouvé"));

        // Get all ProgrammeKpi for this programme
        List<ProgrammeKpi> programmeKpis = programmeKpiRepository.findByProgrammeId(programmeId);

        List<KpiPerformanceStats> kpiStats = new ArrayList<>();
        double totalAchievementRate = 0.0;
        int kpiWithTargetCount = 0;

        for (ProgrammeKpi pk : programmeKpis) {
            BackofficeKpi kpi = pk.getKpi();

            // Only process if it's a GLOBAL KPI
            if (kpi == null || !"GLOBAL".equals(kpi.getType())) {
                continue;
            }

            String kpiNom = kpi.getNom();
            String kpiUnite = kpi.getUniteMesure() != null ? kpi.getUniteMesure() : "";
            String categoryName = kpi.getCategory() != null ? kpi.getCategory().getNom() : "Général";
            String categoryColor = kpi.getCategory() != null ? kpi.getCategory().getCouleur() : "#94a3b8";

            String valeurPrecedente = pk.getValeurPrecedente();
            String valeurActuelle = pk.getValeurActuelle();
            String valeurCible = pk.getValeurCible();

            // Calculate achievement rate (objectif = 100%)
            Double achievementRate = calculateAchievementRate(
                    valeurPrecedente,
                    valeurActuelle,
                    valeurCible,
                    kpi
            );

            if (achievementRate != null) {
                totalAchievementRate += achievementRate;
                kpiWithTargetCount++;
            }

            kpiStats.add(KpiPerformanceStats.builder()
                    .kpiName(kpiNom)
                    .categoryName(categoryName)
                    .categoryColor(categoryColor)
                    .unit(kpiUnite)
                    .valeurPrecedente(valeurPrecedente)
                    .valeurActuelle(valeurActuelle)
                    .valeurCible(valeurCible)
                    .achievementRate(achievementRate)
                    .build());
        }

        // Calculate average achievement rate
        double averageAchievementRate = kpiWithTargetCount > 0
                ? Math.round((totalAchievementRate / kpiWithTargetCount) * 100) / 100.0
                : 0.0;

        // Sort by achievement rate descending (nulls last)
        kpiStats.sort((a, b) -> {
            if (a.getAchievementRate() == null) return 1;
            if (b.getAchievementRate() == null) return -1;
            return Double.compare(b.getAchievementRate(), a.getAchievementRate());
        });

        return GlobalKpiPerformanceDTO.builder()
                .kpis(kpiStats)
                .averageAchievementRate(averageAchievementRate)
                .build();
    }

    /**
     * Distribution KPI par catégorie pour un programme
     */
    public KpiDistributionByCategoryDTO getKpiDistributionByCategory(Long programmeId) {
        // Validate programme exists
        programmeRepository.findById(programmeId)
                .orElseThrow(() -> new RuntimeException("Programme non trouvé"));

        // Get all ProgrammeKpi for this programme
        List<ProgrammeKpi> programmeKpis = programmeKpiRepository.findByProgrammeId(programmeId);

        // Group by category
        Map<String, List<ProgrammeKpi>> kpisByCategory = new HashMap<>();

        for (ProgrammeKpi pk : programmeKpis) {
            BackofficeKpi kpi = pk.getKpi();
            if (kpi == null) continue;

            String categoryName = kpi.getCategory() != null
                    ? kpi.getCategory().getNom()
                    : "Sans catégorie";

            kpisByCategory.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(pk);
        }

        // Calculate distribution statistics
        List<CategoryDistributionStats> distributionStats = new ArrayList<>();
        int totalKpis = programmeKpis.size();

        for (Map.Entry<String, List<ProgrammeKpi>> entry : kpisByCategory.entrySet()) {
            String categoryName = entry.getKey();
            List<ProgrammeKpi> kpis = entry.getValue();

            int count = kpis.size();
            double percentage = totalKpis > 0
                    ? Math.round((count * 100.0 / totalKpis) * 100) / 100.0
                    : 0.0;

            // Count by type
            long globalCount = kpis.stream()
                    .filter(pk -> "GLOBAL".equals(pk.getKpi().getType()))
                    .count();
            long optionnelCount = kpis.stream()
                    .filter(pk -> "OPTIONNEL".equals(pk.getKpi().getType()))
                    .count();

            // Get category color
            String categoryColor = kpis.stream()
                    .map(pk -> pk.getKpi().getCategory())
                    .filter(Objects::nonNull)
                    .findFirst()
                    .map(BackofficeCategory::getCouleur)
                    .orElse("#94a3b8");

            distributionStats.add(CategoryDistributionStats.builder()
                    .categoryName(categoryName)
                    .categoryColor(categoryColor)
                    .count(count)
                    .percentage(percentage)
                    .globalKpiCount((int) globalCount)
                    .optionnelKpiCount((int) optionnelCount)
                    .build());
        }

        // Sort by count descending
        distributionStats.sort((a, b) -> Integer.compare(b.getCount(), a.getCount()));

        return KpiDistributionByCategoryDTO.builder()
                .categories(distributionStats)
                .totalKpis(totalKpis)
                .build();
    }

    /**
     * Evolution des KPI par catégorie pour un programme
     */
    public List<KpiEvolutionByCategoryDTO> getKpiEvolutionByCategory(Long programmeId) {
        // Validate programme exists
        programmeRepository.findById(programmeId)
                .orElseThrow(() -> new RuntimeException("Programme non trouvé"));

        // Get all ProgrammeKpi for this programme
        List<ProgrammeKpi> programmeKpis = programmeKpiRepository.findByProgrammeId(programmeId);

        // Group ProgrammeKpis by Category
        Map<String, List<ProgrammeKpi>> kpisByCategory = new HashMap<>();
        Map<String, String> categoryColors = new HashMap<>();

        for (ProgrammeKpi pk : programmeKpis) {
            BackofficeKpi kpi = pk.getKpi();
            if (kpi == null) continue;

            String categoryName = kpi.getCategory() != null ? kpi.getCategory().getNom() : "Sans catégorie";
            String categoryColor = kpi.getCategory() != null ? kpi.getCategory().getCouleur() : "#94a3b8";

            kpisByCategory.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(pk);
            categoryColors.putIfAbsent(categoryName, categoryColor);
        }

        List<KpiEvolutionByCategoryDTO> evolutionList = new ArrayList<>();

        for (Map.Entry<String, List<ProgrammeKpi>> entry : kpisByCategory.entrySet()) {
            String categoryName = entry.getKey();
            List<ProgrammeKpi> kpis = entry.getValue();
            String color = categoryColors.get(categoryName);

            // Fetch all history for all KPIs in this category
            List<ProgrammeKpiHistory> allHistory = new ArrayList<>();
            Map<Long, BackofficeKpi> kpiDefinitionMap = new HashMap<>();

            for (ProgrammeKpi pk : kpis) {
                kpiDefinitionMap.put(pk.getId(), pk.getKpi());
                allHistory.addAll(programmeKpiHistoryRepository.findByProgrammeKpiIdOrderByChangedAtDesc(pk.getId()));
            }

            // Skip if no history
            if (allHistory.isEmpty()) continue;

            // Sort history by date ASC to replay events
            allHistory.sort(Comparator.comparing(ProgrammeKpiHistory::getChangedAt));

            // Track state of each KPI
            Map<Long, String> kpiCurrentValues = new HashMap<>();
            Map<Long, String> kpiTargetValues = new HashMap<>();
            Map<Long, String> kpiPreviousValues = new HashMap<>();

            // Use TreeMap to store daily averages sorted by date
            Map<LocalDate, Double> dailyAverages = new TreeMap<>();

            // Group history by date (LocalDate)
            Map<LocalDate, List<ProgrammeKpiHistory>> historyByDate = allHistory.stream()
                    .collect(Collectors.groupingBy(
                            h -> h.getChangedAt().toLocalDate(),
                            TreeMap::new,
                            Collectors.toList()
                    ));

            // Iterate through dates chronologically
            for (Map.Entry<LocalDate, List<ProgrammeKpiHistory>> dateEntry : historyByDate.entrySet()) {
                LocalDate date = dateEntry.getKey();
                List<ProgrammeKpiHistory> dayEvents = dateEntry.getValue();

                // Apply updates for this day
                for (ProgrammeKpiHistory history : dayEvents) {
                    // Update current value if present
                    if (history.getValeurActuelle() != null) {
                        kpiCurrentValues.put(history.getProgrammeKpiId(), history.getValeurActuelle());
                    }

                    // Update target value if present
                    if (history.getValeurCible() != null) {
                        kpiTargetValues.put(history.getProgrammeKpiId(), history.getValeurCible());
                    }

                    // Update previous value if present
                    if (history.getValeurPrecedente() != null) {
                        kpiPreviousValues.put(history.getProgrammeKpiId(), history.getValeurPrecedente());
                    }
                }

                // Calculate the average for the category on this day based on current state of all KPIs
                double sum = 0.0;
                int count = 0;
                
                Set<Long> involvedKpis = new HashSet<>();
                involvedKpis.addAll(kpiCurrentValues.keySet());
                involvedKpis.addAll(kpiTargetValues.keySet());
                involvedKpis.addAll(kpiPreviousValues.keySet());

                for (Long kpiId : involvedKpis) {
                    String current = kpiCurrentValues.get(kpiId);
                    String target = kpiTargetValues.get(kpiId);
                    String previous = kpiPreviousValues.get(kpiId);
                    BackofficeKpi kpi = kpiDefinitionMap.get(kpiId);
                    
                    if (kpi != null && target != null) {
                        Double rate = calculateAchievementRate(previous, current, target, kpi);
                        if (rate != null) {
                            sum += rate;
                            count++;
                        }
                    }
                }

                if (count > 0) {
                    double average = sum / count;
                    dailyAverages.put(date, Math.round(average * 100) / 100.0);
                }
            }

            // Convert map to list of DataPoint
            List<KpiEvolutionByCategoryDTO.DataPoint> dataPoints = dailyAverages.entrySet().stream()
                    .map(e -> new KpiEvolutionByCategoryDTO.DataPoint(e.getKey(), e.getValue()))
                    .collect(Collectors.toList());

            evolutionList.add(new KpiEvolutionByCategoryDTO(categoryName, color, dataPoints));
        }

        return evolutionList;
    }

    /**
     * Helper method to calculate achievement rate
     * Returns null if calculation is not possible
     */
    private Double calculateAchievementRate(String valeurPrecedente, String valeurActuelle, String valeurCible, BackofficeKpi kpi) {
        try {
            // Determine type of calculation based on KPI properties
            boolean useProgression = false;
            if (kpi != null && "OPERATIONNEL".equals(kpi.getTypesuivi()) && "progression".equals(kpi.getTypedesaisie())) {
                useProgression = true;
            }

            if (useProgression) {
                // For progression, we use previous value against target
                if (valeurPrecedente == null || valeurPrecedente.trim().isEmpty() ||
                        valeurCible == null || valeurCible.trim().isEmpty()) {
                    return null;
                }

                double precedente = parseNumericValue(valeurPrecedente);
                double cible = parseNumericValue(valeurCible);

                if (cible == 0) {
                    return precedente >= cible ? 100.0 : 0.0;
                }

                double rate = (precedente / cible) * 100;
                return Math.round(rate * 100) / 100.0;
            } else {
                // Normal calculation using current value against target
                if (valeurActuelle == null || valeurActuelle.trim().isEmpty() ||
                        valeurCible == null || valeurCible.trim().isEmpty()) {
                    return null;
                }

                double actuelle = parseNumericValue(valeurActuelle);
                double cible = parseNumericValue(valeurCible);

                if (cible == 0) {
                    return actuelle >= cible ? 100.0 : 0.0;
                }

                double rate = (actuelle / cible) * 100;
                return Math.round(rate * 100) / 100.0;
            }

        } catch (NumberFormatException e) {
            // If values are not numeric, return null
            return null;
        }
    }

    /**
     * Parse a numeric value from string (handles spaces, commas, etc.)
     */
    private double parseNumericValue(String value) throws NumberFormatException {
        if (value == null || value.trim().isEmpty()) {
            throw new NumberFormatException("Empty value");
        }

        // Remove spaces and replace comma with dot
        String cleaned = value.trim().replace(" ", "").replace(",", ".");

        return Double.parseDouble(cleaned);
    }
}