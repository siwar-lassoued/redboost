package team.project.redboost.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiReportingService {

    private final AiReportingRepository aiReportingRepository;
    private final ProgrammeRepository programmeRepository;
    private final SprintRepository sprintRepository;
    private final ActiviteRepository activiteRepository;
    private final TacheRepository tacheRepository;
    private final MatchingSessionRepository matchingSessionRepository;
    private final TacheDocumentRepository tacheDocumentRepository;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${file.upload.tache-documents-dir:uploads/tache-documents}")
    private String tacheUploadDir;

    public List<AiReporting> getHistory(Long programmeId) {
        return aiReportingRepository.findByProgrammeIdOrderByDateGenerationDesc(programmeId);
    }

    public AiReporting generate(Long programmeId, LocalDate start, LocalDate end, String periodTypeStr) {
        Programme programme = programmeRepository.findById(programmeId)
                .orElseThrow(() -> new RuntimeException("Programme introuvable"));

        AiReporting.PeriodType periodType = AiReporting.PeriodType.valueOf(periodTypeStr.toUpperCase());

        // Fetch Data matching the period
        List<Sprint> sprints = sprintRepository.findByProgrammeId(programmeId);
        List<MatchingSession> sessions = matchingSessionRepository.findByProgrammeId(programmeId);

        // Filter sessions natively
        int totalSessions = 0;
        int sessionsCompleted = 0;
        for (MatchingSession ms : sessions) {
            LocalDate sessionDate = ms.getDateMatching().toLocalDate();
            if (!sessionDate.isBefore(start) && !sessionDate.isAfter(end)) {
                totalSessions++;
                if (ms.getStatut() == MatchingSession.StatutSession.VALIDE) {
                    sessionsCompleted++;
                }
            }
        }

        // Gather Activities and files for AI Context
        StringBuilder contextBuilder = new StringBuilder();
        contextBuilder.append("Activités et Livrables de la période:\n\n");

        int totalTaches = 0;
        int tachesCompleted = 0;
        int totalLivrables = 0;
        int livrablesApproved = 0;

        for (Sprint sprint : sprints) {
            // Only consider sprints intersecting with the period roughly, or we just load their tasks and check task dates
            List<Activite> activites = activiteRepository.findBySprintId(sprint.getId());
            for (Activite act : activites) {
                List<Tache> taches = tacheRepository.findByActiviteId(act.getId());
                for (Tache tache : taches) {
                    if (tache.getDateDebut() != null && !tache.getDateDebut().isAfter(end) && 
                       (tache.getDateLimite() == null || !tache.getDateLimite().isBefore(start))) {
                           
                        totalTaches++;
                        if (tache.getStatus() == Tache.StatusTache.TERMINEE) {
                            tachesCompleted++;
                        }

                        contextBuilder.append("Tâche: ").append(tache.getTitre()).append("\n")
                                .append("Description: ").append(tache.getDescription() != null ? tache.getDescription() : "").append("\n")
                                .append("Statut: ").append(tache.getStatus()).append("\n");

                        // Get Documents for this Tâche (Livrables)
                        List<TacheDocument> documents = tacheDocumentRepository.findByTacheId(tache.getId());
                        if (documents != null && !documents.isEmpty()) {
                            for (TacheDocument doc : documents) {
                                totalLivrables++;
                                // Suppose all submitted are approved for now since we lack review status on TacheDocument
                                livrablesApproved++; 
                                
                                contextBuilder.append("  Livrable (Document attaché): ").append(doc.getNom()).append("\n");
                                String extractedText = extractTextFromDocument(doc);
                                if (extractedText != null && !extractedText.isEmpty()) {
                                    contextBuilder.append("  [Contenu du livrable extrait] :\n  ")
                                                  .append(extractedText.replace("\n", "\n  "))
                                                  .append("\n  [Fin du contenu]\n");
                                }
                            }
                        }
                        contextBuilder.append("\n");
                    }
                }
            }
        }

        // Build Payload for Gemini
        String systemPrompt = "Tu es 'Redboost IA', un système expert d'analyse de données pour les programmes d'incubation.\n" +
                "Tu reçois les données brutes des activités, tâches et livrables (fichiers partagés entre coachs et entrepreneurs) pour une période donnée.\n" +
                "Ton rôle est d'analyser profondément ces données et de générer un rapport stratégique JSON.\n\n" +
                "Instructions:\n" +
                "- kpis_cles : Identifie 3 ou 4 points de succès majeurs ou faits marquants (ex: '3 livrables clés validés dont le Business Plan').\n" +
                "- alertes : Identifie les blocages, les entrepreneurs en retard ou l'absence de soumission de livrables.\n" +
                "- recommandations : Donne des recommandations actionnables pour l'équipe encadrante.\n" +
                "- analyse_livrables : Fais une synthèse de la qualité des documents soumis d'après leur contenu lu.\n" +
                "- resume_executif : Écris un paragraphe narratif résumant la santé globale du sprint/période.\n" +
                "RÈGLE ABSOLUE : Tu dois répondre EXCLUSIVEMENT avec un JSON valide. Zéro texte avant ou après.\n";

        String userPrompt = "Programme : " + programme.getNom() + "\n" +
                "Période: Du " + start + " au " + end + "\n" +
                "Métriques : Sessions (" + sessionsCompleted + "/" + totalSessions + "), Tâches (" + tachesCompleted + "/" + totalTaches + "), Livrables (" + totalLivrables + " soumis)\n\n" +
                contextBuilder.toString() + "\n\n" +
                "Génère la réponse selon ce format JSON (Assure-toi que les clés sont exactement celles-ci):\n" +
                "{\n" +
                "  \"resume_executif\": \"...\",\n" +
                "  \"analyse_livrables\": \"...\",\n" +
                "  \"tendances\": \"...\",\n" +
                "  \"kpis_cles\": [\"fait marquant 1\", \"fait marquant 2\"],\n" +
                "  \"alertes\": [\n" +
                "     { \"type\": \"RETARD\" ou \"WARNING\", \"message\": \"...\" }\n" +
                "  ],\n" +
                "  \"recommandations\": [\"reco 1\", \"reco 2\"]\n" +
                "}";

        Map<String, Object> geminiRequest = new LinkedHashMap<>();
        Map<String, Object> part = new LinkedHashMap<>();
        part.put("text", systemPrompt + "\n\n" + userPrompt);
        Map<String, Object> content = new LinkedHashMap<>();
        content.put("parts", List.of(part));
        geminiRequest.put("contents", List.of(content));

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=" + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(geminiRequest, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> firstCandidate = candidates.get(0);
                    Map<String, Object> cnt = (Map<String, Object>) firstCandidate.get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) cnt.get("parts");
                    String rawText = (String) parts.get(0).get("text");

                    // Nettoyage Markdown
                    rawText = rawText.replaceAll("```json\\s*", "");
                    rawText = rawText.replaceAll("```\\s*", "");
                    rawText = rawText.trim();
                    if (rawText.startsWith("`")) rawText = rawText.substring(1).trim();
                    if (rawText.endsWith("`")) rawText = rawText.substring(0, rawText.length() - 1).trim();

                    // Map response to entity
                    Map<String, Object> aiData = objectMapper.readValue(rawText, Map.class);

                    AiReporting aiReporting = AiReporting.builder()
                            .programme(programme)
                            .periodType(periodType)
                            .periodLabel("Du " + start + " au " + end)
                            .dateDebut(start)
                            .dateFin(end)
                            .dateGeneration(LocalDate.now())
                            .totalSessions(totalSessions)
                            .sessionsCompleted(sessionsCompleted)
                            .totalTaches(totalTaches)
                            .tachesCompleted(tachesCompleted)
                            .totalLivrables(totalLivrables)
                            .livrablesApproved(livrablesApproved)
                            .averageRating(0.0) // Mock rating
                            .generatedBy("IA RedBoost (Gemini 3 Flash Preview)")
                            .resumeExecutif((String) aiData.get("resume_executif"))
                            .analyseLivrables((String) aiData.get("analyse_livrables"))
                            .tendances((String) aiData.get("tendances"))
                            .kpisJson(objectMapper.writeValueAsString(aiData.get("kpis_cles")))
                            .alertesJson(objectMapper.writeValueAsString(aiData.get("alertes")))
                            .recommandationsJson(objectMapper.writeValueAsString(aiData.get("recommandations")))
                            .build();

                    return aiReportingRepository.save(aiReporting);
                }
            }
            throw new RuntimeException("Aucun contenu valide de l'IA");
        } catch (Exception e) {
            log.error("Failed to generate AI reporting", e);
            throw new RuntimeException("Erreur lors de la génération avec Gemini: " + e.getMessage());
        }
    }

    public void delete(Long id) {
        aiReportingRepository.deleteById(id);
    }

    private String extractTextFromDocument(TacheDocument document) {
        if (document.getCheminFichier() == null || !document.getCheminFichier().toLowerCase().endsWith(".pdf")) {
            return null; // Only extract text from PDFs for now
        }
        
        try {
            // cheminFichier is typically "/api/files/tache-documents/uuid.pdf" or something similar
            String filename = document.getCheminFichier().substring(document.getCheminFichier().lastIndexOf('/') + 1);
            Path filePath = Paths.get(tacheUploadDir, filename).toAbsolutePath().normalize();
            File file = filePath.toFile();
            
            if (!file.exists() || !file.isFile()) {
                log.warn("Livrable physique non trouvé pour extraire le texte : {}", filePath);
                return null; // File missing
            }

            try (PDDocument doc = PDDocument.load(file)) {
                PDFTextStripper stripper = new PDFTextStripper();
                String text = stripper.getText(doc);
                if (text != null && !text.trim().isEmpty()) {
                    text = text.trim();
                    // Limiter pour ne pas exploser les tokens LLM (~1500 chars max par fichier dans ce batch report)
                    if (text.length() > 2000) {
                        text = text.substring(0, 2000) + "\n...[Texte tronqué pour synthèse globale]";
                    }
                    return text;
                }
            }
        } catch(Exception e) {
            log.warn("Erreur lors de l'extraction PDF pour {}: {}", document.getCheminFichier(), e.getMessage());
        }
        return null;
    }
}
