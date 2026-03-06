package team.project.redboost.services;
import com.lowagie.text.*;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.awt.Color;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;
import com.lowagie.text.Element;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import lombok.RequiredArgsConstructor;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.dto.*;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;

import java.awt.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class RapportService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private final RapportRepository rapportRepository;
    private final ProgrammeRepository programmeRepository;
    private final ObjectifGlobalRepository objectifGlobalRepository;
    private final ObjectifSpecifiqueRepository objectifSpecifiqueRepository;
    private final ResultatRepository resultatRepository;
    private final ResultatTransversalRepository resultatTransversalRepository;
    private final BackofficeKpiRepository backofficeKpiRepository;
    private final ProgrammeKpiRepository programmeKpiRepository;
    private final GoogleDriveService googleDriveService;
    private final ActiviteKpiHistoryRepository activiteKpiHistoryRepository;

    public RapportDTO createRapport(RapportDTO rapportDTO) {
        Programme programme = programmeRepository.findById(rapportDTO.getProgrammeId())
                .orElseThrow(() -> new RuntimeException("Programme not found"));

        if (rapportRepository.existsByProgrammeId(rapportDTO.getProgrammeId())) {
            throw new RuntimeException("Rapport already exists for this programme");
        }

        Rapport rapport = Rapport.builder()
                .programme(programme)
                .objectifsProgramme(rapportDTO.getObjectifsProgramme())
                .resultatsCles(rapportDTO.getResultatsCles())
                .impactGlobal(rapportDTO.getImpactGlobal())
                .conclusionRecommandations(rapportDTO.getConclusionRecommandations())
                .build();

        Rapport savedRapport = rapportRepository.save(rapport);
        return convertToDTO(savedRapport);
    }

    public RapportDTO getRapportById(Long id) {
        Rapport rapport = rapportRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Rapport not found"));
        return convertToDTO(rapport);
    }

    public RapportDTO getRapportByProgrammeId(Long programmeId) {
        Rapport rapport = rapportRepository.findByProgrammeId(programmeId)
                .orElseThrow(() -> new RuntimeException("Rapport not found for this programme"));
        return convertToDTO(rapport);
    }

    public RapportDTO updateRapport(Long id, RapportDTO rapportDTO) {
        Rapport rapport = rapportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rapport not found"));

        rapport.setObjectifsProgramme(rapportDTO.getObjectifsProgramme());
        rapport.setResultatsCles(rapportDTO.getResultatsCles());
        rapport.setImpactGlobal(rapportDTO.getImpactGlobal());
        rapport.setConclusionRecommandations(rapportDTO.getConclusionRecommandations());

        Rapport updatedRapport = rapportRepository.save(rapport);
        return convertToDTO(updatedRapport);
    }

    public void deleteRapport(Long id) {
        rapportRepository.deleteById(id);
    }

    // ObjectifGlobal operations
    public ObjectifGlobalDTO addObjectifGlobal(Long rapportId, ObjectifGlobalDTO dto) {
        Rapport rapport = rapportRepository.findById(rapportId)
                .orElseThrow(() -> new RuntimeException("Rapport not found"));

        ObjectifGlobal objectifGlobal = ObjectifGlobal.builder()
                .rapport(rapport)
                .nom(dto.getNom())
                .description(dto.getDescription())
                .build();

        ObjectifGlobal saved = objectifGlobalRepository.save(objectifGlobal);
        return convertObjectifGlobalToDTO(saved);
    }

    public ObjectifGlobalDTO updateObjectifGlobal(Long id, ObjectifGlobalDTO dto) {
        ObjectifGlobal objectifGlobal = objectifGlobalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ObjectifGlobal not found"));

        objectifGlobal.setNom(dto.getNom());
        objectifGlobal.setDescription(dto.getDescription());

        ObjectifGlobal updated = objectifGlobalRepository.save(objectifGlobal);
        return convertObjectifGlobalToDTO(updated);
    }

    public void deleteObjectifGlobal(Long id) {
        objectifGlobalRepository.deleteById(id);
    }

    // ObjectifSpecifique operations
    public ObjectifSpecifiqueDTO addObjectifSpecifique(Long objectifGlobalId, ObjectifSpecifiqueDTO dto) {
        ObjectifGlobal objectifGlobal = objectifGlobalRepository.findById(objectifGlobalId)
                .orElseThrow(() -> new RuntimeException("ObjectifGlobal not found"));

        ObjectifSpecifique objectifSpecifique = ObjectifSpecifique.builder()
                .objectifGlobal(objectifGlobal)
                .nom(dto.getNom())
                .description(dto.getDescription())
                .build();

        // Add KPIs if provided
        if (dto.getKpiIds() != null && !dto.getKpiIds().isEmpty()) {
            List<BackofficeKpi> kpis = backofficeKpiRepository.findAllById(dto.getKpiIds());
            objectifSpecifique.setKpis(kpis);
        }

        ObjectifSpecifique saved = objectifSpecifiqueRepository.save(objectifSpecifique);
        return convertObjectifSpecifiqueToDTO(saved);
    }

    public ObjectifSpecifiqueDTO updateObjectifSpecifique(Long id, ObjectifSpecifiqueDTO dto) {
        ObjectifSpecifique objectifSpecifique = objectifSpecifiqueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ObjectifSpecifique not found"));

        objectifSpecifique.setNom(dto.getNom());
        objectifSpecifique.setDescription(dto.getDescription());

        // Update KPIs
        if (dto.getKpiIds() != null) {
            List<BackofficeKpi> kpis = backofficeKpiRepository.findAllById(dto.getKpiIds());
            objectifSpecifique.setKpis(kpis);
        }

        ObjectifSpecifique updated = objectifSpecifiqueRepository.save(objectifSpecifique);
        return convertObjectifSpecifiqueToDTO(updated);
    }

    public void deleteObjectifSpecifique(Long id) {
        objectifSpecifiqueRepository.deleteById(id);
    }

    // Resultat operations
    public ResultatDTO addResultat(Long objectifSpecifiqueId, ResultatDTO dto) {
        ObjectifSpecifique objectifSpecifique = objectifSpecifiqueRepository.findById(objectifSpecifiqueId)
                .orElseThrow(() -> new RuntimeException("ObjectifSpecifique not found"));

        Resultat resultat = Resultat.builder()
                .objectifSpecifique(objectifSpecifique)
                .nom(dto.getNom())
                .description(dto.getDescription())
                .build();

        // Add KPIs if provided
        if (dto.getKpiIds() != null && !dto.getKpiIds().isEmpty()) {
            List<BackofficeKpi> kpis = backofficeKpiRepository.findAllById(dto.getKpiIds());
            resultat.setKpis(kpis);
        }

        Resultat saved = resultatRepository.save(resultat);
        return convertResultatToDTO(saved);
    }

    public ResultatDTO updateResultat(Long id, ResultatDTO dto) {
        Resultat resultat = resultatRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resultat not found"));

        resultat.setNom(dto.getNom());
        resultat.setDescription(dto.getDescription());

        // Update KPIs
        if (dto.getKpiIds() != null) {
            List<BackofficeKpi> kpis = backofficeKpiRepository.findAllById(dto.getKpiIds());
            resultat.setKpis(kpis);
        }

        Resultat updated = resultatRepository.save(resultat);
        return convertResultatToDTO(updated);
    }

    public void deleteResultat(Long id) {
        resultatRepository.deleteById(id);
    }

    // ResultatTransversal operations
    public ResultatTransversalDTO addResultatTransversal(Long objectifSpecifiqueId, ResultatTransversalDTO dto) {
        ObjectifSpecifique objectifSpecifique = objectifSpecifiqueRepository.findById(objectifSpecifiqueId)
                .orElseThrow(() -> new RuntimeException("ObjectifSpecifique not found"));

        ResultatTransversal resultat = ResultatTransversal.builder()
                .objectifSpecifique(objectifSpecifique)
                .nom(dto.getNom())
                .description(dto.getDescription())
                .build();

        // Add KPIs if provided
        if (dto.getKpiIds() != null && !dto.getKpiIds().isEmpty()) {
            List<BackofficeKpi> kpis = backofficeKpiRepository.findAllById(dto.getKpiIds());
            resultat.setKpis(kpis);
        }

        ResultatTransversal saved = resultatTransversalRepository.save(resultat);
        return convertResultatTransversalToDTO(saved);
    }

    public ResultatTransversalDTO updateResultatTransversal(Long id, ResultatTransversalDTO dto) {
        ResultatTransversal resultat = resultatTransversalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ResultatTransversal not found"));

        resultat.setNom(dto.getNom());
        resultat.setDescription(dto.getDescription());

        // Update KPIs
        if (dto.getKpiIds() != null) {
            List<BackofficeKpi> kpis = backofficeKpiRepository.findAllById(dto.getKpiIds());
            resultat.setKpis(kpis);
        }

        ResultatTransversal updated = resultatTransversalRepository.save(resultat);
        return convertResultatTransversalToDTO(updated);
    }

    public void deleteResultatTransversal(Long id) {
        resultatTransversalRepository.deleteById(id);
    }

    // Conversion methods
    private RapportDTO convertToDTO(Rapport rapport) {
        return RapportDTO.builder()
                .id(rapport.getId())
                .programmeId(rapport.getProgramme().getId())
                .programmeName(rapport.getProgramme().getNom())
                .objectifsProgramme(rapport.getObjectifsProgramme())
                .resultatsCles(rapport.getResultatsCles())
                .impactGlobal(rapport.getImpactGlobal())
                .objectifsGlobaux(rapport.getObjectifsGlobaux().stream()
                        .map(this::convertObjectifGlobalToDTO)
                        .collect(Collectors.toList()))
                .sprintIds(rapport.getSprintsMethodologie().stream()
                        .map(Sprint::getId)
                        .collect(Collectors.toList()))
                .conclusionRecommandations(rapport.getConclusionRecommandations())
                .dateCreation(rapport.getDateCreation())
                .dateModification(rapport.getDateModification())
                .build();
    }

    private ObjectifGlobalDTO convertObjectifGlobalToDTO(ObjectifGlobal og) {
        return ObjectifGlobalDTO.builder()
                .id(og.getId())
                .rapportId(og.getRapport().getId())
                .nom(og.getNom())
                .description(og.getDescription())
                .objectifsSpecifiques(og.getObjectifsSpecifiques().stream()
                        .map(this::convertObjectifSpecifiqueToDTO)
                        .collect(Collectors.toList()))
                .build();
    }

    private ObjectifSpecifiqueDTO convertObjectifSpecifiqueToDTO(ObjectifSpecifique os) {
        return ObjectifSpecifiqueDTO.builder()
                .id(os.getId())
                .objectifGlobalId(os.getObjectifGlobal().getId())
                .nom(os.getNom())
                .description(os.getDescription())
                .resultats(os.getResultats().stream()
                        .map(this::convertResultatToDTO)
                        .collect(Collectors.toList()))
                .resultatsTransversaux(os.getResultatsTransversaux().stream()
                        .map(this::convertResultatTransversalToDTO)
                        .collect(Collectors.toList()))
                .kpiIds(os.getKpis().stream()
                        .map(BackofficeKpi::getId)
                        .collect(Collectors.toList()))
                .build();
    }

    private ResultatDTO convertResultatToDTO(Resultat resultat) {
        return ResultatDTO.builder()
                .id(resultat.getId())
                .objectifSpecifiqueId(resultat.getObjectifSpecifique().getId())
                .nom(resultat.getNom())
                .description(resultat.getDescription())
                .kpiIds(resultat.getKpis().stream()
                        .map(BackofficeKpi::getId)
                        .collect(Collectors.toList()))
                .build();
    }

    private ResultatTransversalDTO convertResultatTransversalToDTO(ResultatTransversal resultat) {
        return ResultatTransversalDTO.builder()
                .id(resultat.getId())
                .objectifSpecifiqueId(resultat.getObjectifSpecifique().getId())
                .nom(resultat.getNom())
                .description(resultat.getDescription())
                .kpiIds(resultat.getKpis().stream()
                        .map(BackofficeKpi::getId)
                        .collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public RapportDTO saveRapportComplete(RapportDTO rapportDTO) {
        Programme programme = programmeRepository.findById(rapportDTO.getProgrammeId())
                .orElseThrow(() -> new RuntimeException("Programme not found"));

        Rapport rapport;
        boolean isUpdate = false;

        // Check if rapport exists
        if (rapportDTO.getId() != null) {
            rapport = rapportRepository.findById(rapportDTO.getId())
                    .orElseThrow(() -> new RuntimeException("Rapport not found"));
            isUpdate = true;
        } else {
            // Check if rapport exists for this programme
            Optional<Rapport> existingRapport = rapportRepository.findByProgrammeId(rapportDTO.getProgrammeId());
            if (existingRapport.isPresent()) {
                rapport = existingRapport.get();
                isUpdate = true;
            } else {
                rapport = new Rapport();
                rapport.setProgramme(programme);
            }
        }

        // Update basic fields
        rapport.setObjectifsProgramme(rapportDTO.getObjectifsProgramme());
        rapport.setResultatsCles(rapportDTO.getResultatsCles());
        rapport.setImpactGlobal(rapportDTO.getImpactGlobal());
        rapport.setConclusionRecommandations(rapportDTO.getConclusionRecommandations());

        // Handle sprints
        if (rapportDTO.getSprintIds() != null) {
            List<Sprint> sprints = rapportDTO.getSprintIds().stream()
                    .map(id -> {
                        Sprint sprint = new Sprint();
                        sprint.setId(id);
                        return sprint;
                    })
                    .collect(Collectors.toList());
            rapport.setSprintsMethodologie(sprints);
        }

        // Handle ObjectifsGlobaux with smart update (merge logic)
        if (rapportDTO.getObjectifsGlobaux() != null) {
            List<ObjectifGlobalDTO> incomingDTOs = rapportDTO.getObjectifsGlobaux();
            List<ObjectifGlobal> existingGlobals = rapport.getObjectifsGlobaux();

            // 1. Identify IDs to keep
            List<Long> incomingIds = incomingDTOs.stream()
                    .map(ObjectifGlobalDTO::getId)
                    .filter(id -> id != null)
                    .collect(Collectors.toList());

            // 2. Remove items not in incoming list (orphans)
            existingGlobals.removeIf(og -> og.getId() != null && !incomingIds.contains(og.getId()));

            // 3. Update existing or Add new
            for (ObjectifGlobalDTO ogDTO : incomingDTOs) {
                ObjectifGlobal og;
                if (ogDTO.getId() != null) {
                    // Update existing
                    og = existingGlobals.stream()
                            .filter(item -> item.getId().equals(ogDTO.getId()))
                            .findFirst()
                            .orElseGet(() -> {
                                // Should not happen if logic is correct, but safe fallback
                                ObjectifGlobal newOg = new ObjectifGlobal();
                                newOg.setRapport(rapport);
                                existingGlobals.add(newOg);
                                return newOg;
                            });
                } else {
                    // Create new
                    og = new ObjectifGlobal();
                    og.setRapport(rapport);
                    existingGlobals.add(og);
                }

                og.setNom(ogDTO.getNom());
                og.setDescription(ogDTO.getDescription());

                // --- Handle ObjectifsSpecifiques (Nested Level 1) ---
                if (ogDTO.getObjectifsSpecifiques() != null) {
                    List<ObjectifSpecifiqueDTO> incomingSpecDTOs = ogDTO.getObjectifsSpecifiques();
                    List<ObjectifSpecifique> existingSpecs = og.getObjectifsSpecifiques();

                    List<Long> incomingSpecIds = incomingSpecDTOs.stream()
                            .map(ObjectifSpecifiqueDTO::getId)
                            .filter(id -> id != null)
                            .collect(Collectors.toList());

                    existingSpecs.removeIf(os -> os.getId() != null && !incomingSpecIds.contains(os.getId()));

                    for (ObjectifSpecifiqueDTO osDTO : incomingSpecDTOs) {
                        ObjectifSpecifique os;
                        if (osDTO.getId() != null) {
                            os = existingSpecs.stream()
                                    .filter(item -> item.getId().equals(osDTO.getId()))
                                    .findFirst()
                                    .orElseGet(() -> {
                                        ObjectifSpecifique newOs = new ObjectifSpecifique();
                                        newOs.setObjectifGlobal(og);
                                        existingSpecs.add(newOs);
                                        return newOs;
                                    });
                        } else {
                            os = new ObjectifSpecifique();
                            os.setObjectifGlobal(og);
                            existingSpecs.add(os);
                        }

                        os.setNom(osDTO.getNom());
                        os.setDescription(osDTO.getDescription());

                        if (osDTO.getKpiIds() != null) {
                            List<BackofficeKpi> kpis = backofficeKpiRepository.findAllById(osDTO.getKpiIds());
                            os.setKpis(kpis);
                        }

                        // --- Handle Resultats (Nested Level 2) ---
                        if (osDTO.getResultats() != null) {
                            List<ResultatDTO> incomingResDTOs = osDTO.getResultats();
                            List<Resultat> existingResults = os.getResultats();

                            List<Long> incomingResIds = incomingResDTOs.stream()
                                    .map(ResultatDTO::getId)
                                    .filter(id -> id != null)
                                    .collect(Collectors.toList());

                            existingResults.removeIf(r -> r.getId() != null && !incomingResIds.contains(r.getId()));

                            for (ResultatDTO rDTO : incomingResDTOs) {
                                Resultat res;
                                if (rDTO.getId() != null) {
                                    res = existingResults.stream()
                                            .filter(item -> item.getId().equals(rDTO.getId()))
                                            .findFirst()
                                            .orElseGet(() -> {
                                                Resultat newRes = new Resultat();
                                                newRes.setObjectifSpecifique(os);
                                                existingResults.add(newRes);
                                                return newRes;
                                            });
                                } else {
                                    res = new Resultat();
                                    res.setObjectifSpecifique(os);
                                    existingResults.add(res);
                                }

                                res.setNom(rDTO.getNom());
                                res.setDescription(rDTO.getDescription());

                                if (rDTO.getKpiIds() != null) {
                                    List<BackofficeKpi> kpis = backofficeKpiRepository.findAllById(rDTO.getKpiIds());
                                    res.setKpis(kpis);
                                 }
                            }
                        } else {
                            os.getResultats().clear();
                        }

                        // --- Handle Resultats Transversaux (Nested Level 2) ---
                        if (osDTO.getResultatsTransversaux() != null) {
                            List<ResultatTransversalDTO> incomingTransDTOs = osDTO.getResultatsTransversaux();
                            List<ResultatTransversal> existingTrans = os.getResultatsTransversaux();

                            List<Long> incomingTransIds = incomingTransDTOs.stream()
                                    .map(ResultatTransversalDTO::getId)
                                    .filter(id -> id != null)
                                    .collect(Collectors.toList());

                            existingTrans.removeIf(r -> r.getId() != null && !incomingTransIds.contains(r.getId()));

                            for (ResultatTransversalDTO rtDTO : incomingTransDTOs) {
                                ResultatTransversal res;
                                if (rtDTO.getId() != null) {
                                    res = existingTrans.stream()
                                            .filter(item -> item.getId().equals(rtDTO.getId()))
                                            .findFirst()
                                            .orElseGet(() -> {
                                                ResultatTransversal newRes = new ResultatTransversal();
                                                newRes.setObjectifSpecifique(os);
                                                existingTrans.add(newRes);
                                                return newRes;
                                            });
                                } else {
                                    res = new ResultatTransversal();
                                    res.setObjectifSpecifique(os);
                                    existingTrans.add(res);
                                }

                                res.setNom(rtDTO.getNom());
                                res.setDescription(rtDTO.getDescription());

                                if (rtDTO.getKpiIds() != null) {
                                    List<BackofficeKpi> kpis = backofficeKpiRepository.findAllById(rtDTO.getKpiIds());
                                    res.setKpis(kpis);
                                }
                            }
                        } else {
                            os.getResultatsTransversaux().clear();
                        }
                    }
                } else {
                    og.getObjectifsSpecifiques().clear();
                }
            }
        } else {
            // If null, clear all
            rapport.getObjectifsGlobaux().clear();
        }

        Rapport savedRapport = rapportRepository.save(rapport);
        return convertToDTO(savedRapport);
    }

    public List<KpiLightDTO> getKpisForProgramme(Long programmeId) {
        // Get all KPIs - you might want to filter by programme if applicable
        List<BackofficeKpi> kpis = backofficeKpiRepository.findAll();

        return kpis.stream()
                .map(kpi -> KpiLightDTO.builder()
                        .id(kpi.getId())
                        .nom(kpi.getNom())
                        .description(kpi.getDescription())
                        .unite(kpi.getUniteMesure())
                        .valeurActuelle(0.0) // You might want to get this from somewhere
                        .build())
                .collect(Collectors.toList());
    }

    private Double parseDoubleOrNull(String value) {
        try {
            return value != null ? Double.parseDouble(value) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }



//    public byte[] generateRapportPdf(Long rapportId, LocalDate startDate, LocalDate endDate) {
//        // 1. Fetch Data
//        Rapport rapport = rapportRepository.findById(rapportId)
//                .orElseThrow(() -> new RuntimeException("Rapport not found"));
//        Programme programme = rapport.getProgramme();
//
//        // Fetch KPIs specific to this programme
//        List<ProgrammeKpi> programmeKpis = programmeKpiRepository.findByProgrammeId(programme.getId());
//
//        // 2. Create Document
//        ByteArrayOutputStream out = new ByteArrayOutputStream();
//        Document document = new Document(PageSize.A4, 36, 36, 50, 50);
//
//        try {
//            PdfWriter.getInstance(document, out);
//            document.open();
//
//            // --- ADD LOGO TO TOP RIGHT ---
//            String logoUrl = programme.getLogoUrl();
//            System.out.println("DEBUG: Logo URL from Programme: " + logoUrl);
//            System.out.println("DEBUG: Configured Upload Dir: " + uploadDir);
//
//            if (logoUrl != null && !logoUrl.isEmpty()) {
//                try {
//                    // Extract filename from the URL (e.g., "/uploads/logo-123.png" -> "logo-123.png")
//                    String filename = logoUrl.substring(logoUrl.lastIndexOf("/") + 1);
//                    Path imagePath = Paths.get(uploadDir, filename);
//
//                    System.out.println("DEBUG: Full Image Path: " + imagePath.toAbsolutePath().toString());
//
//                    if (Files.exists(imagePath)) {
//                        System.out.println("DEBUG: Image file found!");
//                        Image logo = Image.getInstance(imagePath.toAbsolutePath().toString());
//
//                        // Scale image to fit (e.g., 50 pixels height)
//                        float desiredHeight = 50f;
//                        float scaler = desiredHeight / logo.getHeight();
//                        logo.scalePercent(scaler * 100);
//
//                        // Position top right of the page, with a small margin from the page edge
//                        float pageEdgeMargin = 20f;
//                        float x = document.getPageSize().getWidth() - logo.getScaledWidth() - pageEdgeMargin;
//                        float y = document.getPageSize().getHeight() - logo.getScaledHeight() - pageEdgeMargin;
//                        logo.setAbsolutePosition(x, y);
//
//                        document.add(logo);
//                        System.out.println("DEBUG: Logo added to PDF.");
//                    } else {
//                        System.err.println("ERROR: Logo file NOT FOUND at: " + imagePath.toAbsolutePath().toString());
//                    }
//
//                } catch (Exception e) {
//                    System.err.println("ERROR: Exception adding logo: " + e.getMessage());
//                    e.printStackTrace();
//                }
//            } else {
//                System.out.println("DEBUG: No logo URL in programme.");
//            }
//
//            // --- COLORS ---
//            Color primaryColor = new Color(36, 92, 103); // #245C67
//            Color accentColor = new Color(228, 77, 98); // #E44D62
//            Color lightGray = new Color(245, 245, 245);
//            Color mediumGray = new Color(120, 120, 120);
//
//            // --- FONTS ---
//            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, primaryColor);
//            Font h1Font = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, primaryColor);
//            Font h2Font = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, accentColor);
//            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
//            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
//            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, mediumGray);
//
//            // --- HEADER / TITLE ---
//            String titleText = (startDate != null && endDate != null) ? "RAPPORT PÉRIODIQUE DE PROGRAMME" : "RAPPORT NARRATIF DE PROGRAMME";
//            Paragraph title = new Paragraph(titleText, titleFont);
//            title.setAlignment(Element.ALIGN_CENTER);
//            title.setSpacingAfter(5);
//            document.add(title);
//
//            String subtitleText = (startDate != null && endDate != null)
//                ? "Période du " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " au " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
//                : "Généré par RedBoost Platform";
//            Paragraph subtitle = new Paragraph(subtitleText, subtitleFont);
//            subtitle.setAlignment(Element.ALIGN_CENTER);
//            subtitle.setSpacingAfter(30);
//            document.add(subtitle);
//
//            // --- 1. FICHE D'IDENTITÉ ---
//            Paragraph section1 = new Paragraph("1. FICHE D'IDENTITÉ DU PROGRAMME", h1Font);
//            section1.setSpacingBefore(10);
//            section1.setSpacingAfter(15);
//            document.add(section1);
//
//            PdfPTable infoTable = new PdfPTable(2);
//            infoTable.setWidthPercentage(100);
//            infoTable.setWidths(new float[]{3, 7});
//
//            addTableRow(infoTable, "Nom du Projet", programme.getNom(), boldFont, normalFont);
//            addTableRow(infoTable, "Type", programme.getTypeProgramme(), boldFont, normalFont);
//            addTableRow(infoTable, "Période", programme.getDateDebut() + " au " + programme.getDateFin(), boldFont, normalFont);
//            addTableRow(infoTable, "Statut", programme.getStatut().toString(), boldFont, normalFont);
//            addTableRow(infoTable, "Bénéficiaires", String.valueOf(programme.getNombreBeneficiaires()), boldFont, normalFont);
//
//            String secteursList = programme.getSecteurs().stream()
//                    .map(Secteur::getNom)
//                    .collect(Collectors.joining(", "));
//            addTableRow(infoTable, "Secteurs", secteursList, boldFont, normalFont);
//
//            document.add(infoTable);
//            document.add(Chunk.NEWLINE);
//
//            // --- 2. SYNTHÈSE STRATÉGIQUE ---
//            Paragraph section2 = new Paragraph("2. Résumé Exécutif", h1Font);
//            section2.setSpacingBefore(20);
//            section2.setSpacingAfter(15);
//            document.add(section2);
//
//            document.add(new Paragraph("Objectifs du Programme", h2Font));
//            Paragraph objPara = new Paragraph(rapport.getObjectifsProgramme() != null ? rapport.getObjectifsProgramme() : "N/A", normalFont);
//            objPara.setSpacingAfter(10);
//            document.add(objPara);
//
//            document.add(new Paragraph("Résultats Clés", h2Font));
//            Paragraph resPara = new Paragraph(rapport.getResultatsCles() != null ? rapport.getResultatsCles() : "N/A", normalFont);
//            resPara.setSpacingAfter(10);
//            document.add(resPara);
//
//            document.add(new Paragraph("Impact Global", h2Font));
//            Paragraph impPara = new Paragraph(rapport.getImpactGlobal() != null ? rapport.getImpactGlobal() : "N/A", normalFont);
//            impPara.setSpacingAfter(10);
//            document.add(impPara);
//
//            // --- 3. CADRE LOGIQUE (Objectifs & Résultats) ---
//            Paragraph section3 = new Paragraph("3. Contexte et Objectifs", h1Font);
//            section3.setSpacingBefore(20);
//            section3.setSpacingAfter(15);
//            document.add(section3);
//
//            for (ObjectifGlobal og : rapport.getObjectifsGlobaux()) {
//                Paragraph ogTitle = new Paragraph("Objectif Global : " + og.getNom(), h2Font);
//                ogTitle.setSpacingBefore(10);
//                document.add(ogTitle);
//
//                Paragraph ogDesc = new Paragraph(og.getDescription(), normalFont);
//                ogDesc.setSpacingAfter(8);
//                document.add(ogDesc);
//
//                com.lowagie.text.List specList = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED);
//                specList.setListSymbol("\u2022");
//
//                for (ObjectifSpecifique os : og.getObjectifsSpecifiques()) {
//                    specList.add(new ListItem("Objectif Spécifique : " + os.getNom(), boldFont));
//
//                    for (Resultat res : os.getResultats()) {
//                        specList.add(new ListItem("    Résultat : " + res.getNom(), normalFont));
//                    }
//                    for (ResultatTransversal resTrans : os.getResultatsTransversaux()) {
//                        specList.add(new ListItem("    Résultat Transversal : " + resTrans.getNom(), normalFont));
//                    }
//                }
//                document.add(specList);
//            }
//            document.add(Chunk.NEWLINE);
//
//            // --- 4. ACTIVITÉS ET SPRINTS ---
//            Paragraph section4 = new Paragraph("4. Méthodologie et Résultats", h1Font);
//            section4.setSpacingBefore(20);
//            section4.setSpacingAfter(15);
//            document.add(section4);
//
//            List<Sprint> sprintsToReport;
//            if (startDate != null && endDate != null) {
//                sprintsToReport = programme.getSprints().stream()
//                    .filter(s -> {
//                        LocalDate sStart = s.getDateDebut();
//                        LocalDate sEnd = s.getDateLimite();
//                        if (sStart == null || sEnd == null) return false;
//                        return !sStart.isAfter(endDate) && !sEnd.isBefore(startDate);
//                    })
//                    .collect(Collectors.toList());
//                if (sprintsToReport.isEmpty()) {
//                    document.add(new Paragraph("Aucun sprint trouvé dans cette période.", normalFont));
//                }
//            } else {
//                sprintsToReport = programme.getSprints();
//            }
//
//            for (Sprint sprint : sprintsToReport) {
//                PdfPTable sprintTable = new PdfPTable(1);
//                sprintTable.setWidthPercentage(100);
//                sprintTable.setSpacingBefore(10);
//
//                PdfPCell headerCell = new PdfPCell(new Phrase("Sprint: " + sprint.getNom() , h2Font));
//                headerCell.setBackgroundColor(lightGray);
//                headerCell.setPadding(8);
//                headerCell.setBorder(Rectangle.NO_BORDER);
//                sprintTable.addCell(headerCell);
//
//                PdfPCell contentCell = new PdfPCell();
//                contentCell.setPadding(8);
//                contentCell.setBorder(Rectangle.NO_BORDER);
//                contentCell.addElement(new Paragraph("Description: " + sprint.getDescription(), normalFont));
//
//                List<Activite> activites = sprint.getActivites();
//                if (startDate != null && endDate != null && activites != null) {
//                    activites = activites.stream()
//                        .filter(a -> {
//                            LocalDate aStart = a.getDateDebut();
//                            LocalDate aEnd = a.getDateLimite();
//                            if (aStart == null || aEnd == null) return false;
//                            return !aStart.isAfter(endDate) && !aEnd.isBefore(startDate);
//                        })
//                        .collect(Collectors.toList());
//                }
//
//                if (activites != null && !activites.isEmpty()) {
//                    contentCell.addElement(new Paragraph("\nActivités Réalisées :", boldFont));
//                    for (Activite act : activites) {
//                        contentCell.addElement(new Paragraph("- " + act.getNom() , normalFont));
//                        contentCell.addElement(new Paragraph("  Objectif: " + (act.getObjectif() != null ? act.getObjectif() : "-"), FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9)));
//                        contentCell.addElement(new Paragraph("  Type: " + (act.getType() != null ? act.getType() : "-"), FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9)));
//
//                        // Activite KPIs
//                        if (act.getKpis() != null && !act.getKpis().isEmpty()) {
//                            Paragraph kpiTitle = new Paragraph("  Indicateurs de l'activité:", boldFont);
//                            kpiTitle.setIndentationLeft(10);
//                            contentCell.addElement(kpiTitle);
//
//                            com.lowagie.text.List kpiList = new com.lowagie.text.List(false, 10);
//                            kpiList.setListSymbol("  - ");
//                            kpiList.setIndentationLeft(20);
//                            for (ActiviteKpi kpi : act.getKpis()) {
//                                if (kpi.getKpi() != null) {
//                                    kpiList.add(new ListItem(kpi.getKpi().getNom() + ": " + (kpi.getValeurActuelle() != null ? kpi.getValeurActuelle() : "N/A"), normalFont));
//                                }
//                            }
//                            contentCell.addElement(kpiList);
//                        }
//
//                        // Taches
//                        if (act.getTaches() != null && !act.getTaches().isEmpty()) {
//                            Paragraph tacheTitle = new Paragraph("  Tâches:", boldFont);
//                            tacheTitle.setIndentationLeft(10);
//                            contentCell.addElement(tacheTitle);
//
//                            com.lowagie.text.List tacheList = new com.lowagie.text.List(false, 10);
//                            tacheList.setListSymbol("  • ");
//                            tacheList.setIndentationLeft(20);
//                            for (Tache tache : act.getTaches()) {
//                                tacheList.add(new ListItem(tache.getTitre(), normalFont));
//
//                                // Tache KPIs
//                                if (tache.getTachesKpis() != null && !tache.getTachesKpis().isEmpty()) {
//                                    com.lowagie.text.List tacheKpiList = new com.lowagie.text.List(false, 20);
//                                    tacheKpiList.setListSymbol("    - ");
//                                    tacheKpiList.setIndentationLeft(30);
//                                    for (TacheKpi tacheKpi : tache.getTachesKpis()) {
//                                        if (tacheKpi.getKpi() != null) {
//                                            tacheKpiList.add(new ListItem(tacheKpi.getKpi().getNom() + ": " + (tacheKpi.getValeurActuelle() != null ? tacheKpi.getValeurActuelle() : "N/A"), normalFont));
//                                        }
//                                    }
//                                    tacheList.add(tacheKpiList);
//                                }
//                            }
//                            contentCell.addElement(tacheList);
//                        }
//                        contentCell.addElement(Chunk.NEWLINE);
//                    }
//                } else {
//                    contentCell.addElement(new Paragraph("Aucune activité enregistrée" + ((startDate != null) ? " dans cette période." : "."), normalFont));
//                }
//
//                sprintTable.addCell(contentCell);
//                document.add(sprintTable);
//            }
//            document.add(Chunk.NEWLINE);
//
//            // --- 5. CONCLUSION ---
//            Paragraph section5 = new Paragraph("5. CONCLUSION & RECOMMANDATIONS", h1Font);
//            section5.setSpacingBefore(20);
//            section5.setSpacingAfter(15);
//            document.add(section5);
//
//            document.add(new Paragraph(rapport.getConclusionRecommandations() != null ? rapport.getConclusionRecommandations() : "Aucune conclusion enregistrée.", normalFont));
//
//            // Footer / Timestamp
//            document.add(Chunk.NEWLINE);
//            document.add(Chunk.NEWLINE);
//            Paragraph footer = new Paragraph("Rapport généré le " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY));
//            footer.setAlignment(Element.ALIGN_RIGHT);
//            document.add(footer);
//
//            document.close();
//        } catch (DocumentException e) {
//            throw new RuntimeException("Erreur lors de la génération du PDF", e);
//        }
//
//        return out.toByteArray();
//    }

    public byte[] generateRapportExpertiseFrancePdf(Long rapportId, LocalDate startDate, LocalDate endDate) {
        // 1. Fetch Data
        Rapport rapport = rapportRepository.findById(rapportId)
                .orElseThrow(() -> new RuntimeException("Rapport not found"));
        Programme programme = rapport.getProgramme();

        // 2. Create Document
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 45, 45, 55, 55);

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new EFHeaderFooterEvent(programme.getNom(), startDate, endDate));
            document.open();

            // ── Design System ─────────────────────────────────────────────────
            Color EF_NAVY       = new Color(0,   49,  137); // #003189
            Color EF_BLUE       = new Color(0,   85,  164); // #0055A4
            Color EF_BLUE_LIGHT = new Color(220, 230, 245);
            Color EF_GOLD       = new Color(200, 168,  75); // #C8A84B
            Color EF_BG         = new Color(244, 246, 250);
            Color EF_BORDER     = new Color(200, 210, 230);
            Color EF_ROW_ALT    = new Color(248, 250, 253);
            Color EF_MUTED      = new Color(100, 115, 140);
            Color EF_DARK       = new Color(20,  30,  50);

            Font titleFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD,    20, EF_NAVY);
            Font h1Font       = FontFactory.getFont(FontFactory.HELVETICA_BOLD,    13, Color.WHITE);
            Font h1BadgeFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD,    11, Color.WHITE);
            Font h2Font       = FontFactory.getFont(FontFactory.HELVETICA_BOLD,    10, EF_BLUE);
            Font normalFont   = FontFactory.getFont(FontFactory.HELVETICA,         10, EF_DARK);
            Font boldFont     = FontFactory.getFont(FontFactory.HELVETICA_BOLD,    10, EF_DARK);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA,         10, EF_MUTED);
            Font italicFont   = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE,  9, EF_MUTED);
            Font smallBold    = FontFactory.getFont(FontFactory.HELVETICA_BOLD,     8, Color.WHITE);
            Font smallNormal  = FontFactory.getFont(FontFactory.HELVETICA,          8, EF_DARK);

            PdfContentByte cb = writer.getDirectContent();
            float pageW = document.getPageSize().getWidth();
            float pageH = document.getPageSize().getHeight();

            // ── DUAL STRIPE (navy + gold) drawn on canvas ──────────────────
            cb.setColorFill(EF_NAVY);
            cb.rectangle(0, pageH - 8, pageW * 0.6f, 8);
            cb.fill();
            cb.setColorFill(EF_GOLD);
            cb.rectangle(pageW * 0.6f, pageH - 8, pageW * 0.4f, 8);
            cb.fill();

            // ── EXPERTISE FRANCE badge (top-left) ──────────────────────────
            try {
                Path efLogoPath = Paths.get(uploadDir, "expertise-france.png");
                if (Files.exists(efLogoPath)) {
                    Image efLogo = Image.getInstance(efLogoPath.toAbsolutePath().toString());
                    float desiredHeight = 42f;
                    float scaler = desiredHeight / efLogo.getHeight();
                    efLogo.scalePercent(scaler * 100);
                    float x = 45f;
                    float y = pageH - 74f;
                    efLogo.setAbsolutePosition(x, y);
                    cb.addImage(efLogo);
                } else {
                    BaseFont bfBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, false);
                    float bx = 45f, by = pageH - 74f, bw = 130f, bh = 42f;
                    cb.setColorFill(EF_NAVY);
                    cb.rectangle(bx, by, bw, bh);
                    cb.fill();
                    cb.setColorFill(EF_GOLD);
                    cb.rectangle(bx, by, 4, bh);
                    cb.fill();
                    cb.beginText();
                    cb.setFontAndSize(bfBold, 9);
                    cb.setColorFill(Color.WHITE);
                    cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "EXPERTISE", bx + 12, by + bh - 16, 0);
                    cb.endText();
                    cb.beginText();
                    cb.setFontAndSize(bfBold, 9);
                    cb.setColorFill(EF_GOLD);
                    cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "FRANCE", bx + 12, by + 9, 0);
                    cb.endText();
                }
            } catch (Exception ignored) {}

            // ── PROGRAMME LOGO (top-right) ─────────────────────────────────
            String logoUrl = programme.getLogoUrl();
            if (logoUrl != null && !logoUrl.isEmpty()) {
                try {
                    String filename = logoUrl.substring(logoUrl.lastIndexOf("/") + 1);
                    Path imagePath = Paths.get(uploadDir, filename);
                    if (Files.exists(imagePath)) {
                        Image logo = Image.getInstance(imagePath.toAbsolutePath().toString());
                        float desiredHeight = 44f;
                        float scaler = desiredHeight / logo.getHeight();
                        logo.scalePercent(scaler * 100);
                        float x = pageW - logo.getScaledWidth() - 45f;
                        float y = pageH - logo.getScaledHeight() - 22f;
                        logo.setAbsolutePosition(x, y);
                        cb.addImage(logo);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            // ── Separator line under logos ──────────────────────────────────
            cb.setColorFill(EF_BORDER);
            cb.rectangle(45, pageH - 88, pageW - 90, 1f);
            cb.fill();

            // ── Push document flow below the canvas-drawn header area ──────
            Paragraph headerGap = new Paragraph(" ");
            headerGap.setSpacingAfter(50); // doc top margin=55 → 55+50=105pt clears badges
            document.add(headerGap);

            // ── TITLE ──────────────────────────────────────────────────────
            Paragraph title = new Paragraph("RAPPORT EXPERTISE FRANCE", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(5);
            document.add(title);

            String subtitleText = (startDate != null && endDate != null)
                    ? "Période du " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    + " au " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    : "Généré par RedBoost Platform";
            Paragraph subtitle = new Paragraph(subtitleText, subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(6);
            document.add(subtitle);

            // Gold + navy double rule under title
            PdfPTable titleRule = new PdfPTable(new float[]{1, 8});
            titleRule.setWidthPercentage(100);
            titleRule.setSpacingAfter(22);
            PdfPCell goldBar = new PdfPCell(); goldBar.setFixedHeight(3f);
            goldBar.setBackgroundColor(EF_GOLD); goldBar.setBorder(Rectangle.NO_BORDER);
            titleRule.addCell(goldBar);
            PdfPCell navyBar = new PdfPCell(); navyBar.setFixedHeight(3f);
            navyBar.setBackgroundColor(EF_NAVY); navyBar.setBorder(Rectangle.NO_BORDER);
            titleRule.addCell(navyBar);
            document.add(titleRule);

            // ══════════════════════════════════════════════════════════════
            // I. INFORMATIONS GÉNÉRALES DU PROGRAMME
            // ══════════════════════════════════════════════════════════════
            addEFSectionHeader(document, "I", "Informations Générales du Programme",
                    EF_NAVY, EF_GOLD, h1Font, h1BadgeFont);

            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setWidths(new float[]{3, 7});
            infoTable.setSpacingAfter(10);

            String secteursList = programme.getSecteurs().stream()
                    .map(Secteur::getNom).collect(Collectors.joining(", "));

            String[][] infoRows = {
                    {"Nom du Projet",  programme.getNom()},
                    {"Type",           programme.getTypeProgramme()},
                    {"Période",        programme.getDateDebut() + " au " + programme.getDateFin()},
                    {"Statut",         programme.getStatut().toString()},
                    {"Bénéficiaires",  String.valueOf(programme.getNombreBeneficiaires())},
                    {"Secteurs",       secteursList}
            };
            for (int i = 0; i < infoRows.length; i++) {
                addEFTableRow(infoTable, infoRows[i][0], infoRows[i][1],
                        boldFont, normalFont, i % 2 == 1, EF_BLUE_LIGHT, EF_BORDER, EF_NAVY, EF_ROW_ALT);
            }
            // Wrap in outer border
            PdfPTable infoWrapper = new PdfPTable(1);
            infoWrapper.setWidthPercentage(100);
            infoWrapper.setSpacingAfter(14);
            PdfPCell iw = new PdfPCell(); iw.addElement(infoTable);
            iw.setBorderColor(EF_BORDER); iw.setBorderWidth(1); iw.setPadding(0);
            infoWrapper.addCell(iw);
            document.add(infoWrapper);

            // ══════════════════════════════════════════════════════════════
            // II. RÉSUMÉ EXÉCUTIF
            // ══════════════════════════════════════════════════════════════
            addEFSectionHeader(document, "II", "Résumé Exécutif",
                    EF_NAVY, EF_GOLD, h1Font, h1BadgeFont);

            addEFSubSection(document, "Objectifs du Programme",
                    rapport.getObjectifsProgramme(), h2Font, normalFont, EF_GOLD);

            addEFSubSection(document, "Résultats Clés",
                    rapport.getResultatsCles(), h2Font, normalFont, EF_GOLD);

            addEFSubSection(document, "Impact Global",
                    rapport.getImpactGlobal(), h2Font, normalFont, EF_GOLD);

            // ══════════════════════════════════════════════════════════════
            // III. RÉSULTATS ET ACTIVITÉS
            // ══════════════════════════════════════════════════════════════
            addEFSectionHeader(document, "III", "Résultats et Activités",
                    EF_NAVY, EF_GOLD, h1Font, h1BadgeFont);

            // ── A. Résultats ──────────────────────────────────────────────
            addEFSubSectionLetter(document, "A. Résultats", h2Font, EF_GOLD);

            for (ObjectifGlobal og : rapport.getObjectifsGlobaux()) {
                for (ObjectifSpecifique os : og.getObjectifsSpecifiques()) {

                    // 1. Résultats principaux
                    if (os.getResultats() != null && !os.getResultats().isEmpty()) {

                        // OS header bar
                        PdfPTable osTable = new PdfPTable(1);
                        osTable.setWidthPercentage(100);
                        osTable.setSpacingBefore(8);
                        osTable.setSpacingAfter(4);
                        PdfPCell osCell = new PdfPCell(new Phrase(
                                "Résultats Principaux — Objectif Spécifique : " + os.getNom(), boldFont));
                        osCell.setBackgroundColor(EF_BLUE_LIGHT);
                        osCell.setPadding(8); osCell.setPaddingLeft(12);
                        osCell.setBorderColor(EF_BLUE);
                        osCell.setBorderWidthLeft(4); osCell.setBorderWidthTop(0);
                        osCell.setBorderWidthRight(1); osCell.setBorderWidthBottom(1);
                        osTable.addCell(osCell);
                        document.add(osTable);

                        for (Resultat res : os.getResultats()) {
                            Paragraph rp = new Paragraph("  •  " + res.getNom(), normalFont);
                            rp.setIndentationLeft(12);
                            rp.setSpacingBefore(3);
                            document.add(rp);

                            if (res.getKpis() != null && !res.getKpis().isEmpty()) {
                                for (BackofficeKpi kpi : res.getKpis()) {
                                    Paragraph kp = new Paragraph(
                                            "      ◦  KPI : " + kpi.getNom()
                                                    + "  (" + kpi.getUniteMesure() + ")",
                                            italicFont);
                                    kp.setIndentationLeft(24);
                                    document.add(kp);
                                }
                            }
                        }
                        document.add(efSpacer(6));
                    }

                    // 2. Résultats transversaux
                    if (os.getResultatsTransversaux() != null && !os.getResultatsTransversaux().isEmpty()) {

                        PdfPTable rtTable = new PdfPTable(1);
                        rtTable.setWidthPercentage(100);
                        rtTable.setSpacingBefore(8);
                        rtTable.setSpacingAfter(4);
                        PdfPCell rtCell = new PdfPCell(new Phrase("Résultats Transversaux", boldFont));
                        rtCell.setBackgroundColor(EF_BG);
                        rtCell.setPadding(8); rtCell.setPaddingLeft(12);
                        rtCell.setBorderColor(EF_GOLD);
                        rtCell.setBorderWidthLeft(4); rtCell.setBorderWidthTop(0);
                        rtCell.setBorderWidthRight(1); rtCell.setBorderWidthBottom(1);
                        rtTable.addCell(rtCell);
                        document.add(rtTable);

                        for (ResultatTransversal rt : os.getResultatsTransversaux()) {
                            Paragraph rtp = new Paragraph("  •  " + rt.getNom(), normalFont);
                            rtp.setIndentationLeft(12);
                            rtp.setSpacingBefore(3);
                            document.add(rtp);

                            if (rt.getKpis() != null && !rt.getKpis().isEmpty()) {
                                for (BackofficeKpi kpi : rt.getKpis()) {
                                    Paragraph kp = new Paragraph(
                                            "      ◦  KPI : " + kpi.getNom()
                                                    + "  (" + kpi.getUniteMesure() + ")",
                                            italicFont);
                                    kp.setIndentationLeft(24);
                                    document.add(kp);
                                }
                            }
                        }
                        document.add(efSpacer(6));
                    }
                }
            }

            // ── B. Activités ──────────────────────────────────────────────
            addEFSubSectionLetter(document, "B. Activités", h2Font, EF_GOLD);

            for (Sprint sprint : programme.getSprints()) {
                List<Activite> activites = sprint.getActivites();

                // Filter by date if range provided (same logic as original)
                if (startDate != null && endDate != null && activites != null) {
                    activites = activites.stream()
                            .filter(a -> {
                                LocalDate aStart = a.getDateDebut();
                                LocalDate aEnd   = a.getDateLimite();
                                if (aStart == null || aEnd == null) return false;
                                return !aStart.isAfter(endDate) && !aEnd.isBefore(startDate);
                            })
                            .collect(Collectors.toList());
                }

                if (activites != null) {
                    for (Activite act : activites) {

                        // Activity card
                        PdfPTable actTable = new PdfPTable(1);
                        actTable.setWidthPercentage(100);
                        actTable.setSpacingBefore(10);

                        // Card header row (activity name)
                        PdfPCell headerCell = new PdfPCell(
                                new Phrase("Activité : " + act.getNom(), smallBold));
                        headerCell.setBackgroundColor(EF_NAVY);
                        headerCell.setPadding(8); headerCell.setPaddingLeft(12);
                        headerCell.setBorder(Rectangle.NO_BORDER);
                        actTable.addCell(headerCell);

                        // Gold accent line under header
                        PdfPCell accentLine = new PdfPCell();
                        accentLine.setFixedHeight(2f);
                        accentLine.setBackgroundColor(EF_GOLD);
                        accentLine.setBorder(Rectangle.NO_BORDER);
                        actTable.addCell(accentLine);

                        // Card content cell
                        PdfPCell contentCell = new PdfPCell();
                        contentCell.setPadding(10);
                        contentCell.setBorderColor(EF_BORDER);
                        contentCell.setBorderWidthTop(0);
                        contentCell.setBorderWidthLeft(1);
                        contentCell.setBorderWidthRight(1);
                        contentCell.setBorderWidthBottom(1);
                        contentCell.setBorderColorLeft(EF_GOLD); // gold left accent

                        // Description
                        contentCell.addElement(new Paragraph(
                                "Description : " + (act.getDescription() != null
                                        ? act.getDescription() : "N/A"), normalFont));

                        // Objectif rattaché
                        Paragraph objLine = new Paragraph(
                                "Objectif/Résultat rattaché : " + (act.getObjectif() != null
                                        ? act.getObjectif() : "N/A"), italicFont);
                        objLine.setSpacingAfter(6);
                        contentCell.addElement(objLine);

                        // KPIs and history
                        if (act.getKpis() != null && !act.getKpis().isEmpty()) {
                            Paragraph kpiTitle = new Paragraph(
                                    "Indicateurs (KPIs) et Évolution :", boldFont);
                            kpiTitle.setSpacingBefore(4);
                            kpiTitle.setSpacingAfter(4);
                            contentCell.addElement(kpiTitle);

                            for (ActiviteKpi ak : act.getKpis()) {
                                if (ak.getKpi() == null) continue;

                                Paragraph kpiLabel = new Paragraph(
                                        "  •  " + ak.getKpi().getNom()
                                                + "  —  Actuel : " + (ak.getValeurActuelle() != null
                                                ? ak.getValeurActuelle() : "N/A"),
                                        normalFont);
                                kpiLabel.setSpacingBefore(4);
                                contentCell.addElement(kpiLabel);

                                List<ActiviteKpiHistory> history =
                                        activiteKpiHistoryRepository
                                                .findByActiviteKpiIdOrderByChangedAtAsc(ak.getId());

                                if (history != null && !history.isEmpty()) {
                                    PdfPTable histTable = new PdfPTable(new float[]{4, 6});
                                    histTable.setWidthPercentage(90);
                                    histTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
                                    histTable.setSpacingBefore(4);
                                    histTable.setSpacingAfter(6);

                                    // History table header
                                    for (String hdr : new String[]{"Date", "Valeur"}) {
                                        PdfPCell hc = new PdfPCell(new Phrase(hdr,
                                                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE)));
                                        hc.setBackgroundColor(EF_NAVY);
                                        hc.setPadding(5);
                                        hc.setBorder(Rectangle.NO_BORDER);
                                        histTable.addCell(hc);
                                    }

                                    // History rows
                                    int ri = 0;
                                    for (ActiviteKpiHistory hEntry : history) {
                                        boolean alt = (ri++ % 2 == 1);
                                        Color rowBg = alt ? EF_ROW_ALT : Color.WHITE;

                                        PdfPCell dc = new PdfPCell(new Phrase(
                                                hEntry.getChangedAt().format(
                                                        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                                                FontFactory.getFont(FontFactory.HELVETICA, 8, EF_DARK)));
                                        dc.setBackgroundColor(rowBg); dc.setPadding(5);
                                        dc.setBorderColor(EF_BORDER);
                                        dc.setBorderWidthBottom(1); dc.setBorderWidthTop(0);
                                        dc.setBorderWidthLeft(0);   dc.setBorderWidthRight(0);
                                        histTable.addCell(dc);

                                        PdfPCell vc = new PdfPCell(new Phrase(
                                                hEntry.getValeurActuelle(),
                                                FontFactory.getFont(FontFactory.HELVETICA, 8, EF_DARK)));
                                        vc.setBackgroundColor(rowBg); vc.setPadding(5);
                                        vc.setBorderColor(EF_BORDER);
                                        vc.setBorderWidthBottom(1); vc.setBorderWidthTop(0);
                                        vc.setBorderWidthLeft(1);   vc.setBorderWidthRight(0);
                                        histTable.addCell(vc);
                                    }
                                    contentCell.addElement(histTable);
                                } else {
                                    contentCell.addElement(new Paragraph(
                                            "    (Pas d'historique disponible)",
                                            FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, EF_MUTED)));
                                }
                            }
                        } else {
                            contentCell.addElement(new Paragraph(
                                    "Aucun KPI associé.",
                                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, EF_MUTED)));
                        }

                        actTable.addCell(contentCell);
                        document.add(actTable);
                    }
                }
            }

            document.add(efSpacer(10));

            // ══════════════════════════════════════════════════════════════
            // IV. CONCLUSION ET RECOMMANDATIONS
            // ══════════════════════════════════════════════════════════════
            addEFSectionHeader(document, "IV", "Conclusion et Recommandations",
                    EF_NAVY, EF_GOLD, h1Font, h1BadgeFont);

            // Conclusion in a gold-left-bordered box
            PdfPTable concBox = new PdfPTable(1);
            concBox.setWidthPercentage(100);
            concBox.setSpacingAfter(16);
            PdfPCell concCell = new PdfPCell(new Phrase(
                    rapport.getConclusionRecommandations() != null
                            ? rapport.getConclusionRecommandations()
                            : "Aucune conclusion enregistrée.",
                    normalFont));
            concCell.setBackgroundColor(EF_BG);
            concCell.setPadding(12); concCell.setPaddingLeft(16);
            concCell.setBorderColor(EF_BORDER);
            concCell.setBorderWidthLeft(4); concCell.setBorderWidthTop(1);
            concCell.setBorderWidthRight(1); concCell.setBorderWidthBottom(1);
            concCell.setBorderColorLeft(EF_GOLD);
            concCell.setLeading(0, 1.6f);
            concBox.addCell(concCell);
            document.add(concBox);

            // ── Timestamp footer ──────────────────────────────────────────
            document.add(efSpacer(10));
            Paragraph footer = new Paragraph(
                    "Rapport généré le " + java.time.LocalDateTime.now()
                            .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                            + "  —  RedBoost Platform",
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, EF_MUTED));
            footer.setAlignment(Element.ALIGN_RIGHT);
            document.add(footer);

            document.close();

        } catch (DocumentException e) {
            throw new RuntimeException("Erreur lors de la génération du PDF Expertise France", e);
        }

        return out.toByteArray();
    }


// ─── EF Section Header helper ─────────────────────────────────────────────────

    private void addEFSectionHeader(Document doc, String number, String title,
                                    Color navyColor, Color goldColor,
                                    Font titleFont, Font badgeFont)
            throws DocumentException {
        PdfPTable table = new PdfPTable(new float[]{1f, 11f});
        table.setWidthPercentage(100);
        table.setSpacingBefore(16);
        table.setSpacingAfter(10);

        PdfPCell numCell = new PdfPCell(new Phrase(number, badgeFont));
        numCell.setBackgroundColor(goldColor);
        numCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        numCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        numCell.setPadding(8);
        numCell.setBorder(Rectangle.NO_BORDER);
        table.addCell(numCell);

        PdfPCell titleCell = new PdfPCell(new Phrase(title, titleFont));
        titleCell.setBackgroundColor(navyColor);
        titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        titleCell.setPaddingLeft(14);
        titleCell.setPaddingTop(8);
        titleCell.setPaddingBottom(8);
        titleCell.setBorder(Rectangle.NO_BORDER);
        table.addCell(titleCell);

        doc.add(table);
    }


// ─── EF Sub-section label + gold underline + body ─────────────────────────────

    private void addEFSubSection(Document doc, String heading, String body,
                                 Font headingFont, Font bodyFont, Color goldColor)
            throws DocumentException {
        Paragraph h = new Paragraph(heading, headingFont);
        h.setSpacingBefore(10);
        h.setSpacingAfter(3);
        doc.add(h);

        PdfPTable ul = new PdfPTable(1);
        ul.setWidthPercentage(100);
        ul.setSpacingAfter(5);
        PdfPCell lc = new PdfPCell();
        lc.setFixedHeight(2f);
        lc.setBackgroundColor(goldColor);
        lc.setBorder(Rectangle.NO_BORDER);
        ul.addCell(lc);
        doc.add(ul);

        Paragraph p = new Paragraph(body != null && !body.isBlank() ? body : "N/A", bodyFont);
        p.setLeading(15);
        p.setSpacingAfter(8);
        doc.add(p);
    }


// ─── EF Letter sub-header (A. / B.) ───────────────────────────────────────────

    private void addEFSubSectionLetter(Document doc, String label,
                                       Font font, Color goldColor)
            throws DocumentException {
        Paragraph p = new Paragraph(label, font);
        p.setSpacingBefore(12);
        p.setSpacingAfter(3);
        doc.add(p);

        PdfPTable ul = new PdfPTable(1);
        ul.setWidthPercentage(100);
        ul.setSpacingAfter(8);
        PdfPCell lc = new PdfPCell();
        lc.setFixedHeight(2f);
        lc.setBackgroundColor(goldColor);
        lc.setBorder(Rectangle.NO_BORDER);
        ul.addCell(lc);
        doc.add(ul);
    }


// ─── EF Table row (alternating) ───────────────────────────────────────────────

    private void addEFTableRow(PdfPTable table, String label, String value,
                               Font labelFont, Font valueFont, boolean alt,
                               Color labelBg, Color borderColor,
                               Color navyColor, Color rowAlt) {
        PdfPCell lc = new PdfPCell(new Phrase(label, labelFont));
        lc.setBackgroundColor(alt ? new Color(210, 222, 240) : labelBg);
        lc.setPadding(8); lc.setPaddingLeft(12);
        lc.setBorderColor(borderColor);
        lc.setBorderWidthBottom(1); lc.setBorderWidthTop(0);
        lc.setBorderWidthLeft(0);   lc.setBorderWidthRight(0);
        table.addCell(lc);

        PdfPCell vc = new PdfPCell(new Phrase(value != null ? value : "-", valueFont));
        vc.setBackgroundColor(alt ? rowAlt : Color.WHITE);
        vc.setPadding(8); vc.setPaddingLeft(12);
        vc.setBorderColor(borderColor);
        vc.setBorderWidthBottom(1); vc.setBorderWidthTop(0);
        vc.setBorderWidthLeft(1);   vc.setBorderWidthRight(0);
        table.addCell(vc);
    }


// ─── Spacer ───────────────────────────────────────────────────────────────────

    private Paragraph efSpacer(float height) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(height);
        return p;
    }


// ─── EF Page Header/Footer Event ─────────────────────────────────────────────

    static class EFHeaderFooterEvent extends PdfPageEventHelper {

        private final String    programmeName;
        private final LocalDate startDate;
        private final LocalDate endDate;
        private PdfTemplate     totalPagesTemplate;
        private final BaseFont  bf;
        private final BaseFont  bfBold;

        private static final Color EF_NAVY   = new Color(0,   49, 137);
        private static final Color EF_GOLD   = new Color(200, 168, 75);
        private static final Color EF_BORDER = new Color(200, 210, 230);
        private static final Color EF_MUTED  = new Color(100, 115, 140);

        EFHeaderFooterEvent(String programmeName, LocalDate startDate, LocalDate endDate) {
            this.programmeName = programmeName;
            this.startDate     = startDate;
            this.endDate       = endDate;
            try {
                this.bf     = BaseFont.createFont(BaseFont.HELVETICA,      BaseFont.CP1252, false);
                this.bfBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, false);
            } catch (Exception e) {
                throw new RuntimeException("EF font error", e);
            }
        }

        @Override
        public void onOpenDocument(PdfWriter writer, Document document) {
            totalPagesTemplate = writer.getDirectContent().createTemplate(30, 12);
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            if (writer.getPageNumber() == 1) return;

            PdfContentByte cb = writer.getDirectContent();
            float w = document.getPageSize().getWidth();
            float h = document.getPageSize().getHeight();

            try {
                // Dual stripe on each page
                cb.setColorFill(EF_NAVY);
                cb.rectangle(0, h - 8, w * 0.6f, 8);
                cb.fill();
                cb.setColorFill(EF_GOLD);
                cb.rectangle(w * 0.6f, h - 8, w * 0.4f, 8);
                cb.fill();

                // Header rule
                cb.setColorFill(EF_NAVY);
                cb.rectangle(45, h - 36, w - 90, 1.5f);
                cb.fill();

                // EF stub
                cb.setColorFill(EF_NAVY);
                cb.rectangle(45, h - 34, 44, 13);
                cb.fill();
                cb.beginText();
                cb.setFontAndSize(bfBold, 5.5f);
                cb.setColorFill(Color.WHITE);
                cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "EXPERTISE FRANCE", 47, h - 26, 0);
                cb.endText();

                // Programme name
                cb.beginText();
                cb.setFontAndSize(bf, 7.5f);
                cb.setColorFill(EF_MUTED);
                cb.showTextAligned(PdfContentByte.ALIGN_LEFT, programmeName, 96, h - 28, 0);
                cb.endText();

                // Period
                String period = (startDate != null && endDate != null)
                        ? startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        + " – " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        : "Rapport Expertise France";
                cb.beginText();
                cb.setFontAndSize(bf, 7.5f);
                cb.setColorFill(EF_MUTED);
                cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, period, w - 45, h - 28, 0);
                cb.endText();

                // Footer — gold + border split rule
                cb.setColorFill(EF_GOLD);
                cb.rectangle(45, 38, 44, 1f);
                cb.fill();
                cb.setColorFill(EF_BORDER);
                cb.rectangle(92, 38, w - 137, 1f);
                cb.fill();

                cb.beginText();
                cb.setFontAndSize(bf, 7.5f);
                cb.setColorFill(EF_MUTED);
                cb.showTextAligned(PdfContentByte.ALIGN_LEFT,
                        "Expertise France  |  RedBoost Platform  |  Confidentiel", 45, 26, 0);
                cb.endText();

                cb.beginText();
                cb.setFontAndSize(bf, 7.5f);
                cb.setColorFill(EF_NAVY);
                cb.showTextAligned(PdfContentByte.ALIGN_RIGHT,
                        "Page " + writer.getPageNumber() + "  /  ", w - 45 - 12, 26, 0);
                cb.endText();

                Image tpi = Image.getInstance(totalPagesTemplate);
                tpi.setAbsolutePosition(w - 45 - 10, 23);
                cb.addImage(tpi);

            } catch (Exception e) {
                System.err.println("EF footer error: " + e.getMessage());
            }
        }

        @Override
        public void onCloseDocument(PdfWriter writer, Document document) {
            try {
                totalPagesTemplate.beginText();
                totalPagesTemplate.setFontAndSize(bf, 7.5f);
                totalPagesTemplate.setColorFill(EF_NAVY);
                totalPagesTemplate.showText(String.valueOf(writer.getPageNumber() - 1));
                totalPagesTemplate.endText();
            } catch (Exception e) {
                System.err.println("EF total pages error: " + e.getMessage());
            }
        }
    }
    // --- Helper Methods for PDF Generation ---

    private void addTableRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cellLabel = new PdfPCell(new Phrase(label, labelFont));
        cellLabel.setBackgroundColor(new Color(245, 245, 245));
        cellLabel.setPadding(8);
        cellLabel.setBorder(Rectangle.NO_BORDER);
        table.addCell(cellLabel);

        PdfPCell cellValue = new PdfPCell(new Phrase(value != null ? value : "-", valueFont));
        cellValue.setPadding(8);
        cellValue.setBorder(Rectangle.NO_BORDER);
        table.addCell(cellValue);
    }

    private void addKpiHeader(PdfPTable table, String title, Font font, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(title, font));
        cell.setBackgroundColor(bgColor);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(8);
        cell.setBorder(Rectangle.NO_BORDER);
        table.addCell(cell);
    }

    private void addKpiCell(PdfPTable table, String text, Font font, boolean highlight) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        if (highlight) {
            cell.setBackgroundColor(new Color(230, 255, 230));
        }
        cell.setPadding(6);
        cell.setBorder(Rectangle.NO_BORDER);
        table.addCell(cell);
    }


    public GoogleDriveService.DriveUploadResult generateAndUploadRapportDocx(Long rapportId, LocalDate startDate, LocalDate endDate, String templateType) {
        // 1. Fetch Data
        Rapport rapport = rapportRepository.findById(rapportId)
                .orElseThrow(() -> new RuntimeException("Rapport not found"));
        Programme programme = rapport.getProgramme();

        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            String titleText;
            if ("EXPERTISE_FRANCE".equalsIgnoreCase(templateType)) {
                generateExpertiseFranceDocxContent(document, rapport, programme, startDate, endDate);
                titleText = "Rapport_Expertise_France_";
            } else {
                generateStandardDocxContent(document, rapport, programme, startDate, endDate);
                titleText = "Rapport_";
            }

            // Write to byte array
            document.write(out);
            byte[] docxBytes = out.toByteArray();

            // 3. Upload to Google Drive
            String periodSuffix = (startDate != null && endDate != null) ? "_Periodique" : "";
            String fileName = titleText + programme.getNom().replaceAll("\\s+", "_") + periodSuffix + ".docx";
            return googleDriveService.uploadDocxAndGetShareableLink(docxBytes, fileName);

        } catch (IOException e) {
            throw new RuntimeException("Error generating Word document", e);
        }
    }

    private void generateStandardDocxContent(XWPFDocument document, Rapport rapport, Programme programme, LocalDate startDate, LocalDate endDate) {
        // Title
        XWPFParagraph title = document.createParagraph();
        title.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun titleRun = title.createRun();
        titleRun.setText((startDate != null && endDate != null) ? "RAPPORT PÉRIODIQUE DE PROGRAMME" : "RAPPORT NARRATIF DE PROGRAMME");
        titleRun.setBold(true);
        titleRun.setFontSize(20);
        titleRun.setColor("245C67"); // Primary Color

        // Subtitle
        XWPFParagraph subtitle = document.createParagraph();
        subtitle.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun subtitleRun = subtitle.createRun();
        String subText = (startDate != null && endDate != null) 
                ? "Période du " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " au " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "Généré par RedBoost Platform";
        subtitleRun.setText(subText);
        subtitleRun.setFontSize(10);
        subtitleRun.setColor("787878"); // Medium Gray
        subtitleRun.addBreak();

        // --- 1. FICHE D'IDENTITÉ ---
        createSectionTitle(document, "1. FICHE D'IDENTITÉ DU PROGRAMME");

        XWPFTable infoTable = document.createTable();
        infoTable.setWidth("100%");
        addTableRow(infoTable, "Nom du Projet", programme.getNom());
        addTableRow(infoTable, "Type", programme.getTypeProgramme());
        addTableRow(infoTable, "Période", programme.getDateDebut() + " au " + programme.getDateFin());
        addTableRow(infoTable, "Statut", programme.getStatut().toString());
        addTableRow(infoTable, "Bénéficiaires", String.valueOf(programme.getNombreBeneficiaires()));
        String secteursList = programme.getSecteurs().stream()
                .map(Secteur::getNom)
                .collect(Collectors.joining(", "));
        addTableRow(infoTable, "Secteurs", secteursList);

        // --- 2. SYNTHÈSE STRATÉGIQUE ---
        createSectionTitle(document, "2. Résumé Exécutif");

        createSubTitle(document, "Objectifs du Programme");
        createParagraph(document, rapport.getObjectifsProgramme());

        createSubTitle(document, "Résultats Clés");
        createParagraph(document, rapport.getResultatsCles());

        createSubTitle(document, "Impact Global");
        createParagraph(document, rapport.getImpactGlobal());

        // --- 3. CADRE LOGIQUE ---
        createSectionTitle(document, "3. Contexte et Objectifs");

        for (ObjectifGlobal og : rapport.getObjectifsGlobaux()) {
            createSubTitle(document, "Objectif Global : " + og.getNom());
            createParagraph(document, og.getDescription());

            for (ObjectifSpecifique os : og.getObjectifsSpecifiques()) {
                XWPFParagraph p = document.createParagraph();
                XWPFRun r = p.createRun();
                r.setText("• Objectif Spécifique : " + os.getNom());
                r.setBold(true);

                for (Resultat res : os.getResultats()) {
                    XWPFParagraph p2 = document.createParagraph();
                    p2.setIndentationLeft(720); // Indent
                    XWPFRun r2 = p2.createRun();
                    r2.setText("- Résultat : " + res.getNom());
                }
            }
        }

        // --- 4. ACTIVITÉS ET SPRINTS ---
        createSectionTitle(document, "4. Méthodologie et Résultats");

        List<Sprint> sprintsToReport = programme.getSprints();
        if (startDate != null && endDate != null) {
             sprintsToReport = sprintsToReport.stream()
                    .filter(s -> {
                        LocalDate sStart = s.getDateDebut();
                        LocalDate sEnd = s.getDateLimite();
                        if (sStart == null || sEnd == null) return false;
                        return !sStart.isAfter(endDate) && !sEnd.isBefore(startDate);
                    })
                    .collect(Collectors.toList());
             if (sprintsToReport.isEmpty()) {
                 createParagraph(document, "Aucun sprint trouvé dans cette période.");
             }
        }

        for (Sprint sprint : sprintsToReport) {
            // Sprint Header (Table with gray background)
            XWPFTable sprintTable = document.createTable();
            sprintTable.setWidth("100%");
            XWPFTableRow header = sprintTable.getRow(0);
            header.getCell(0).setText("Sprint: " + sprint.getNom());
            header.getCell(0).setColor("F5F5F5"); // Light Gray
            
            XWPFTableRow contentRow = sprintTable.createRow();
            XWPFTableCell contentCell = contentRow.getCell(0);
            
            // Description
            XWPFParagraph descP = contentCell.addParagraph();
            descP.createRun().setText("Description: " + sprint.getDescription());

            // Activities
            List<Activite> activites = sprint.getActivites();
            if (startDate != null && endDate != null && activites != null) {
                activites = activites.stream()
                        .filter(a -> {
                            LocalDate aStart = a.getDateDebut();
                            LocalDate aEnd = a.getDateLimite();
                            if (aStart == null || aEnd == null) return false;
                            return !aStart.isAfter(endDate) && !aEnd.isBefore(startDate);
                        })
                        .collect(Collectors.toList());
            }

            if (activites != null && !activites.isEmpty()) {
                XWPFParagraph actHeaderP = contentCell.addParagraph();
                actHeaderP.setSpacingBefore(100);
                XWPFRun actHeaderR = actHeaderP.createRun();
                actHeaderR.setText("Activités Réalisées :");
                actHeaderR.setBold(true);

                for (Activite act : activites) {
                    XWPFParagraph actP = contentCell.addParagraph();
                    XWPFRun actR = actP.createRun();
                    actR.setText("- " + act.getNom());
                    
                    XWPFParagraph actDetailsP = contentCell.addParagraph();
                    actDetailsP.setIndentationLeft(360);
                    XWPFRun actDetailsR = actDetailsP.createRun();
                    actDetailsR.setText("Objectif: " + (act.getObjectif() != null ? act.getObjectif() : "-"));
                    actDetailsR.addBreak();
                    actDetailsR.setText("Type: " + (act.getType() != null ? act.getType() : "-"));

                    // Activity KPIs
                    if (act.getKpis() != null && !act.getKpis().isEmpty()) {
                        XWPFParagraph kpiHeaderP = contentCell.addParagraph();
                        kpiHeaderP.setIndentationLeft(360);
                        XWPFRun kpiHeaderR = kpiHeaderP.createRun();
                        kpiHeaderR.setText("Indicateurs de l'activité:");
                        kpiHeaderR.setBold(true);

                        for (ActiviteKpi kpi : act.getKpis()) {
                            if (kpi.getKpi() != null) {
                                XWPFParagraph kpiP = contentCell.addParagraph();
                                kpiP.setIndentationLeft(720);
                                kpiP.createRun().setText("- " + kpi.getKpi().getNom() + ": " + (kpi.getValeurActuelle() != null ? kpi.getValeurActuelle() : "N/A"));
                            }
                        }
                    }

                    // Tasks
                    if (act.getTaches() != null && !act.getTaches().isEmpty()) {
                        XWPFParagraph tacheHeaderP = contentCell.addParagraph();
                        tacheHeaderP.setIndentationLeft(360);
                        XWPFRun tacheHeaderR = tacheHeaderP.createRun();
                        tacheHeaderR.setText("Tâches:");
                        tacheHeaderR.setBold(true);

                        for (Tache tache : act.getTaches()) {
                            XWPFParagraph tacheP = contentCell.addParagraph();
                            tacheP.setIndentationLeft(720);
                            tacheP.createRun().setText("• " + tache.getTitre());

                            // Task KPIs
                            if (tache.getTachesKpis() != null && !tache.getTachesKpis().isEmpty()) {
                                for (TacheKpi tk : tache.getTachesKpis()) {
                                    if (tk.getKpi() != null) {
                                        XWPFParagraph tkP = contentCell.addParagraph();
                                        tkP.setIndentationLeft(1080);
                                        tkP.createRun().setText("- " + tk.getKpi().getNom() + ": " + (tk.getValeurActuelle() != null ? tk.getValeurActuelle() : "N/A"));
                                    }
                                }
                            }
                        }
                    }
                    
                    contentCell.addParagraph(); // Spacer
                }
            } else {
                XWPFParagraph noActP = contentCell.addParagraph();
                noActP.createRun().setText("Aucune activité enregistrée" + ((startDate != null) ? " dans cette période." : "."));
            }
            
            document.createParagraph(); // Spacer between sprints
        }

        // 5. CONCLUSION (was 6)
        createSectionTitle(document, "5. CONCLUSION & RECOMMANDATIONS");
        createParagraph(document, rapport.getConclusionRecommandations());
    }

    private void generateExpertiseFranceDocxContent(XWPFDocument document, Rapport rapport, Programme programme, LocalDate startDate, LocalDate endDate) {
        // Title
        XWPFParagraph title = document.createParagraph();
        title.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun titleRun = title.createRun();
        titleRun.setText("RAPPORT EXPERTISE FRANCE");
        titleRun.setBold(true);
        titleRun.setFontSize(20);
        titleRun.setColor("245C67");

        // Subtitle
        XWPFParagraph subtitle = document.createParagraph();
        subtitle.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun subtitleRun = subtitle.createRun();
        String subText = (startDate != null && endDate != null) 
                ? "Période du " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " au " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "Généré par RedBoost Platform";
        subtitleRun.setText(subText);
        subtitleRun.setFontSize(10);
        subtitleRun.setColor("787878");
        subtitleRun.addBreak();

        // I. Informations Générales
        createSectionTitle(document, "I. Informations Générales du Programme");
        XWPFTable infoTable = document.createTable();
        infoTable.setWidth("100%");
        addTableRow(infoTable, "Nom du Projet", programme.getNom());
        addTableRow(infoTable, "Type", programme.getTypeProgramme());
        addTableRow(infoTable, "Période", programme.getDateDebut() + " au " + programme.getDateFin());
        addTableRow(infoTable, "Statut", programme.getStatut().toString());
        addTableRow(infoTable, "Bénéficiaires", String.valueOf(programme.getNombreBeneficiaires()));
        String secteursList = programme.getSecteurs().stream()
                .map(Secteur::getNom)
                .collect(Collectors.joining(", "));
        addTableRow(infoTable, "Secteurs", secteursList);

        // II. Résumé Exécutif
        createSectionTitle(document, "II. Résumé Exécutif");
        createSubTitle(document, "Objectifs du Programme");
        createParagraph(document, rapport.getObjectifsProgramme());
        createSubTitle(document, "Résultats Clés");
        createParagraph(document, rapport.getResultatsCles());
        createSubTitle(document, "Impact Global");
        createParagraph(document, rapport.getImpactGlobal());

        // III. Résultats et Activités
        createSectionTitle(document, "III. Résultats et Activités");
        
        // A. Résultats
        createSubTitle(document, "A. Résultats");
        for (ObjectifGlobal og : rapport.getObjectifsGlobaux()) {
            for (ObjectifSpecifique os : og.getObjectifsSpecifiques()) {
                if (os.getResultats() != null && !os.getResultats().isEmpty()) {
                    XWPFParagraph p = document.createParagraph();
                    XWPFRun r = p.createRun();
                    r.setText("Résultats Principaux (Objectif Spécifique: " + os.getNom() + ")");
                    r.setBold(true);
                    
                    for (Resultat res : os.getResultats()) {
                        XWPFParagraph resP = document.createParagraph();
                        resP.setIndentationLeft(360);
                        XWPFRun resR = resP.createRun();
                        resR.setText("- " + res.getNom());
                        
                        if (res.getKpis() != null) {
                            for (BackofficeKpi kpi : res.getKpis()) {
                                XWPFParagraph kpiP = document.createParagraph();
                                kpiP.setIndentationLeft(720);
                                XWPFRun kpiR = kpiP.createRun();
                                kpiR.setText("• KPI: " + kpi.getNom() + " (" + kpi.getUniteMesure() + ")");
                            }
                        }
                    }
                }
                // Transversaux... similar logic
                 if (os.getResultatsTransversaux() != null && !os.getResultatsTransversaux().isEmpty()) {
                    XWPFParagraph p = document.createParagraph();
                    XWPFRun r = p.createRun();
                    r.setText("Résultats Transversaux");
                    r.setBold(true);
                    
                    for (ResultatTransversal rt : os.getResultatsTransversaux()) {
                        XWPFParagraph resP = document.createParagraph();
                        resP.setIndentationLeft(360);
                        XWPFRun resR = resP.createRun();
                        resR.setText("- " + rt.getNom());
                        
                        if (rt.getKpis() != null) {
                            for (BackofficeKpi kpi : rt.getKpis()) {
                                XWPFParagraph kpiP = document.createParagraph();
                                kpiP.setIndentationLeft(720);
                                XWPFRun kpiR = kpiP.createRun();
                                kpiR.setText("• KPI: " + kpi.getNom() + " (" + kpi.getUniteMesure() + ")");
                            }
                        }
                    }
                }
            }
        }

        // B. Activités
        createSubTitle(document, "B. Activités");
        for (Sprint sprint : programme.getSprints()) {
             List<Activite> activites = sprint.getActivites();
             if (startDate != null && endDate != null && activites != null) {
                activites = activites.stream()
                        .filter(a -> {
                            LocalDate aStart = a.getDateDebut();
                            LocalDate aEnd = a.getDateLimite();
                            if (aStart == null || aEnd == null) return false;
                            return !aStart.isAfter(endDate) && !aEnd.isBefore(startDate);
                        })
                        .collect(Collectors.toList());
            }
            
            if (activites != null) {
                for (Activite act : activites) {
                    // Table for Activity
                    XWPFTable actTable = document.createTable();
                    actTable.setWidth("100%");
                    XWPFTableRow header = actTable.getRow(0);
                    header.getCell(0).setText("Activité: " + act.getNom());
                    header.getCell(0).setColor("F5F5F5"); // Light Gray bg
                    
                    XWPFTableRow contentRow = actTable.createRow();
                    XWPFParagraph p = contentRow.getCell(0).addParagraph();
                    XWPFRun r = p.createRun();
                    r.setText("Description: " + (act.getDescription() != null ? act.getDescription() : "N/A"));
                    r.addBreak();
                    r.setText("Objectif/Résultat rattaché: " + (act.getObjectif() != null ? act.getObjectif() : "N/A"));
                    
                    if (act.getKpis() != null && !act.getKpis().isEmpty()) {
                        r.addBreak();
                        r.addBreak();
                        XWPFRun kpiTitle = p.createRun();
                        kpiTitle.setText("Indicateurs (KPIs) et Évolution:");
                        kpiTitle.setBold(true);
                        
                        for (ActiviteKpi ak : act.getKpis()) {
                            if (ak.getKpi() != null) {
                                p.createRun().addBreak();
                                p.createRun().setText("- " + ak.getKpi().getNom() + " (Actuel: " + (ak.getValeurActuelle() != null ? ak.getValeurActuelle() : "N/A") + ")");
                                
                                // History
                                List<ActiviteKpiHistory> history = activiteKpiHistoryRepository.findByActiviteKpiIdOrderByChangedAtAsc(ak.getId());
                                if (history != null && !history.isEmpty()) {
                                    // Nested table for history? Or just text. Text is safer in POI inside a cell paragraph.
                                    // Actually we can add a table inside the cell but it's complex. Let's use text lines.
                                    for (ActiviteKpiHistory h : history) {
                                        p.createRun().addBreak();
                                        p.createRun().setText("    " + h.getChangedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ": " + h.getValeurActuelle());
                                    }
                                }
                            }
                        }
                    }
                    
                    document.createParagraph(); // Spacer
                }
            }
        }

        // IV. Conclusion
        createSectionTitle(document, "IV. Conclusion et Recommandations");
        createParagraph(document, rapport.getConclusionRecommandations());
    }

    // --- Helper Methods for Word Generation ---

    private void createSectionTitle(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingBefore(400);
        p.setSpacingAfter(200);
        XWPFRun r = p.createRun();
        r.setText(text);
        r.setBold(true);
        r.setFontSize(14);
        r.setColor("245C67");
    }

    private void createSubTitle(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingBefore(200);
        XWPFRun r = p.createRun();
        r.setText(text);
        r.setBold(true);
        r.setFontSize(11);
        r.setColor("E44D62");
    }

    private void createParagraph(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        XWPFRun r = p.createRun();
        r.setText(text != null ? text : "N/A");
    }

    private void addTableRow(XWPFTable table, String label, String value) {
        XWPFTableRow row;
        // Check if the table has only one row and it's empty (default state)
        if (table.getNumberOfRows() == 1 && table.getRow(0).getTableCells().size() == 1 && table.getRow(0).getCell(0).getText().isEmpty()) {
            row = table.getRow(0);
        } else {
            row = table.createRow();
        }
        
        // Ensure the row has at least 2 cells
        if (row.getTableCells().size() < 2) {
            // If it has 1 cell (default), add another one
            if (row.getTableCells().size() == 1) {
                row.addNewTableCell();
            } else {
                // Should not happen for a new row, but for safety
                while (row.getTableCells().size() < 2) {
                    row.addNewTableCell();
                }
            }
        }
        
        row.getCell(0).setText(label);
        row.getCell(1).setText(value != null ? value : "-");
    }


    /// ///////

    private static final Color PRIMARY       = new Color(36, 92, 103);   // #245C67 – dark teal
    private static final Color ACCENT        = new Color(228, 77, 98);   // #E44D62 – rose
    private static final Color PRIMARY_LIGHT = new Color(220, 237, 239); // pale teal
    private static final Color SECTION_BG    = new Color(245, 248, 249); // near-white teal tint
    private static final Color ROW_ALT       = new Color(250, 250, 250); // alternating row
    private static final Color BORDER_COLOR  = new Color(210, 220, 222); // subtle border
    private static final Color DARK_TEXT     = new Color(30, 40, 42);
    private static final Color MUTED         = new Color(120, 130, 132);
    private static final Color WHITE         = Color.WHITE;

    // Fonts
    private static Font font(String base, int size, int style, Color color) {
        return FontFactory.getFont(base, size, style, color);
    }
    private static final Font F_COVER_TITLE  = font(FontFactory.HELVETICA_BOLD,    26, Font.BOLD,   WHITE);
    private static final Font F_COVER_SUB    = font(FontFactory.HELVETICA,         12, Font.NORMAL, PRIMARY_LIGHT);
    private static final Font F_SECTION_HEAD = font(FontFactory.HELVETICA_BOLD,    13, Font.BOLD,   WHITE);
    private static final Font F_SUBSECTION   = font(FontFactory.HELVETICA_BOLD,    11, Font.BOLD,   PRIMARY);
    private static final Font F_LABEL        = font(FontFactory.HELVETICA_BOLD,    10, Font.BOLD,   DARK_TEXT);
    private static final Font F_NORMAL       = font(FontFactory.HELVETICA,         10, Font.NORMAL, DARK_TEXT);
    private static final Font F_ITALIC       = font(FontFactory.HELVETICA_OBLIQUE,  9, Font.ITALIC, MUTED);
    private static final Font F_FOOTER       = font(FontFactory.HELVETICA_OBLIQUE,  8, Font.ITALIC, MUTED);
    private static final Font F_BADGE        = font(FontFactory.HELVETICA_BOLD,     9, Font.BOLD,   WHITE);

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ─── Main Entry Point ─────────────────────────────────────────────────────

    public byte[] generateRapportPdf(Long rapportId, LocalDate startDate, LocalDate endDate) {
        Rapport rapport = rapportRepository.findById(rapportId)
                .orElseThrow(() -> new RuntimeException("Rapport not found"));
        Programme programme = rapport.getProgramme();
        List<ProgrammeKpi> programmeKpis = programmeKpiRepository.findByProgrammeId(programme.getId());

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 45, 45, 55, 55);

        try {
            PdfWriter writer = PdfWriter.getInstance(doc, out);
            writer.setPageEvent(new HeaderFooterEvent(programme.getNom(), startDate, endDate));

            doc.open();

            // ── COVER PAGE ─────────────────────────────────────────────────
            addCoverPage(doc, writer, programme, startDate, endDate);
            doc.newPage();

            // ── SECTION 1 – Programme Identity ─────────────────────────────
//            addSectionHeader(doc, "1", "FICHE D'IDENTITÉ DU PROGRAMME");
//            addIdentityTable(doc, programme);
//            doc.add(spacer(16));

            // ── SECTION 2 – Executive Summary ──────────────────────────────
            addSectionHeader(doc, "2", "RÉSUMÉ EXÉCUTIF");
            addSubSection(doc, "Objectifs du Programme", rapport.getObjectifsProgramme());
            addSubSection(doc, "Résultats Clés",         rapport.getResultatsCles());
            addSubSection(doc, "Impact Global",          rapport.getImpactGlobal());
            doc.add(spacer(16));

            // ── SECTION 3 – Contexte & Objectifs ───────────────────────────
            addSectionHeader(doc, "3", "CONTEXTE ET OBJECTIFS");
            for (ObjectifGlobal og : rapport.getObjectifsGlobaux()) {
                addObjectifBlock(doc, og);
            }
            doc.add(spacer(16));

            // ── SECTION 4 – Activités & Sprints ────────────────────────────
            addSectionHeader(doc, "4", "MÉTHODOLOGIE ET RÉSULTATS");
            List<Sprint> sprints = filterSprints(programme, startDate, endDate);
            if (sprints.isEmpty()) {
                doc.add(italic("Aucun sprint trouvé dans cette période."));
            } else {
                for (Sprint sprint : sprints) {
                    addSprintBlock(doc, sprint, startDate, endDate);
                }
            }
            doc.add(spacer(16));

            // ── SECTION 5 – Conclusion ──────────────────────────────────────
            addSectionHeader(doc, "5", "CONCLUSION & RECOMMANDATIONS");
            String conclusion = rapport.getConclusionRecommandations();
            doc.add(paragraph(conclusion != null ? conclusion : "Aucune conclusion enregistrée.", F_NORMAL));

            doc.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }

        return out.toByteArray();
    }

    // ─── Cover Page ───────────────────────────────────────────────────────────

    private void addCoverPage(Document doc, PdfWriter writer, Programme programme,
                              LocalDate startDate, LocalDate endDate) throws DocumentException {

        PdfContentByte cb = writer.getDirectContent();
        float w = doc.getPageSize().getWidth();
        float h = doc.getPageSize().getHeight();

        // ── Logo: absolute position top-right (doesn't affect doc flow) ────
        addLogoToPage(cb, programme, doc, false);

        // ── Small top spacer to clear logo area ────────────────────────────
        doc.add(spacer(10));

        // ── Accent rule ────────────────────────────────────────────────────
        PdfPTable rule = new PdfPTable(1);
        rule.setWidthPercentage(100);
        rule.setSpacingAfter(16);
        PdfPCell ruleLine = new PdfPCell();
        ruleLine.setFixedHeight(3f);
        ruleLine.setBackgroundColor(ACCENT);
        ruleLine.setBorder(Rectangle.NO_BORDER);
        rule.addCell(ruleLine);
        doc.add(rule);

        // ── Eyebrow label ──────────────────────────────────────────────────
        Font eyebrowFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Font.NORMAL, MUTED);
        Paragraph eyebrow = new Paragraph("REDBOOST PLATFORM  ·  RAPPORT OFFICIEL", eyebrowFont);
        eyebrow.setSpacingAfter(6);
        doc.add(eyebrow);

        // ── Report type (main title) ────────────────────────────────────────
        String reportType = (startDate != null && endDate != null)
                ? "RAPPORT PÉRIODIQUE DE PROGRAMME"
                : "RAPPORT NARRATIF DE PROGRAMME";

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Font.BOLD, PRIMARY);
        Paragraph title = new Paragraph(reportType, titleFont);
        title.setSpacingAfter(8);
        doc.add(title);

        // ── Programme name ──────────────────────────────────────────────────
        Font progFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Font.BOLD, ACCENT);
        Paragraph progName = new Paragraph(programme.getNom(), progFont);
        progName.setSpacingAfter(24);
        doc.add(progName);

        // ── Section 1 header + identity table (same page, natural flow) ─────
        addSectionHeader(doc, "1", "FICHE D'IDENTITÉ DU PROGRAMME");
        addIdentityTable(doc, programme);

        // ── Generation timestamp ────────────────────────────────────────────
        Paragraph footer = new Paragraph(
                "Généré le " + java.time.LocalDateTime.now()
                        .format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")), F_FOOTER);
        footer.setAlignment(Element.ALIGN_RIGHT);
        footer.setSpacingBefore(20);
        doc.add(footer);
    }
    // ─── Section Header ───────────────────────────────────────────────────────

    private void addSectionHeader(Document doc, String number, String title) throws DocumentException {
        PdfPTable table = new PdfPTable(new float[]{1, 11});
        table.setWidthPercentage(100);
        table.setSpacingBefore(14);
        table.setSpacingAfter(12);

        PdfPCell badge = new PdfPCell(new Phrase(number, F_BADGE));
        badge.setBackgroundColor(ACCENT);
        badge.setHorizontalAlignment(Element.ALIGN_CENTER);
        badge.setVerticalAlignment(Element.ALIGN_MIDDLE);
        badge.setPadding(8);
        badge.setBorder(Rectangle.NO_BORDER);
        table.addCell(badge);

        PdfPCell titleCell = new PdfPCell(new Phrase(title, F_SECTION_HEAD));
        titleCell.setBackgroundColor(PRIMARY);
        titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        titleCell.setPaddingLeft(14);
        titleCell.setPaddingTop(8);
        titleCell.setPaddingBottom(8);
        titleCell.setBorder(Rectangle.NO_BORDER);
        table.addCell(titleCell);

        doc.add(table);
    }

    // ─── Identity Table ───────────────────────────────────────────────────────

    private void addIdentityTable(Document doc, Programme programme) throws DocumentException {
        PdfPTable table = new PdfPTable(new float[]{3, 7});
        table.setWidthPercentage(100);

        String secteurs = programme.getSecteurs().stream()
                .map(Secteur::getNom).collect(Collectors.joining(", "));

        String[][] rows = {
                {"Nom du Projet",  programme.getNom()},
                {"Type",           programme.getTypeProgramme()},
                {"Période",        programme.getDateDebut() + " → " + programme.getDateFin()},
                {"Statut",         programme.getStatut().toString()},
                {"Bénéficiaires",  String.valueOf(programme.getNombreBeneficiaires())},
                {"Secteurs",       secteurs}
        };

        for (int i = 0; i < rows.length; i++) {
            addStyledRow(table, rows[i][0], rows[i][1], i % 2 == 1);
        }

        doc.add(borderedContainer(table));
    }

    private void addStyledRow(PdfPTable table, String label, String value, boolean alt) {
        PdfPCell cellLabel = new PdfPCell(new Phrase(label, F_LABEL));
        cellLabel.setBackgroundColor(alt ? new Color(236, 243, 244) : PRIMARY_LIGHT);
        cellLabel.setPadding(9);
        cellLabel.setPaddingLeft(12);
        cellLabel.setBorderColor(BORDER_COLOR);
        cellLabel.setBorderWidthBottom(1);
        cellLabel.setBorderWidthTop(0);
        cellLabel.setBorderWidthLeft(0);
        cellLabel.setBorderWidthRight(0);
        table.addCell(cellLabel);

        PdfPCell cellVal = new PdfPCell(new Phrase(value != null ? value : "–", F_NORMAL));
        cellVal.setBackgroundColor(alt ? ROW_ALT : WHITE);
        cellVal.setPadding(9);
        cellVal.setPaddingLeft(12);
        cellVal.setBorderColor(BORDER_COLOR);
        cellVal.setBorderWidthBottom(1);
        cellVal.setBorderWidthTop(0);
        cellVal.setBorderWidthLeft(1);
        cellVal.setBorderWidthRight(0);
        table.addCell(cellVal);
    }

    // ─── Sub-section ──────────────────────────────────────────────────────────

    private void addSubSection(Document doc, String heading, String body) throws DocumentException {
        Paragraph h = new Paragraph(heading, F_SUBSECTION);
        h.setSpacingBefore(10);
        h.setSpacingAfter(4);
        doc.add(h);

        // Thin accent underline
        PdfPTable underline = new PdfPTable(1);
        underline.setWidthPercentage(100);
        underline.setSpacingAfter(6);
        PdfPCell line = new PdfPCell();
        line.setFixedHeight(2);
        line.setBackgroundColor(ACCENT);
        line.setBorder(Rectangle.NO_BORDER);
        underline.addCell(line);
        doc.add(underline);

        Paragraph p = new Paragraph(
                body != null && !body.isBlank() ? body : "Non renseigné.", F_NORMAL);
        p.setLeading(15);
        p.setSpacingAfter(8);
        doc.add(p);
    }

    // ─── Objectif Block ───────────────────────────────────────────────────────

    private void addObjectifBlock(Document doc, ObjectifGlobal og) throws DocumentException {
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100);
        headerTable.setSpacingBefore(10);

        PdfPCell hc = new PdfPCell(new Phrase("Objectif Global : " + og.getNom(), F_SUBSECTION));
        hc.setBackgroundColor(SECTION_BG);
        hc.setPadding(10);
        hc.setPaddingLeft(14);
        hc.setBorderColor(PRIMARY);
        hc.setBorderWidthLeft(4);
        hc.setBorderWidthTop(1);
        hc.setBorderWidthRight(1);
        hc.setBorderWidthBottom(1);
        headerTable.addCell(hc);
        doc.add(headerTable);

        if (og.getDescription() != null && !og.getDescription().isBlank()) {
            Paragraph desc = new Paragraph(og.getDescription(), F_NORMAL);
            desc.setIndentationLeft(14);
            desc.setSpacingBefore(4);
            desc.setSpacingAfter(8);
            doc.add(desc);
        }

        for (ObjectifSpecifique os : og.getObjectifsSpecifiques()) {
            Paragraph osTitle = new Paragraph("  ▸  Objectif Spécifique : " + os.getNom(), F_LABEL);
            osTitle.setIndentationLeft(14);
            osTitle.setSpacingBefore(6);
            doc.add(osTitle);

            for (Resultat res : os.getResultats()) {
                doc.add(indentedBullet("Résultat : " + res.getNom(), 28, "•", F_NORMAL));
            }
            for (ResultatTransversal rt : os.getResultatsTransversaux()) {
                doc.add(indentedBullet("Résultat Transversal : " + rt.getNom(), 28, "◦", F_ITALIC));
            }
        }
    }

    // ─── Sprint Block ─────────────────────────────────────────────────────────

    private void addSprintBlock(Document doc, Sprint sprint,
                                LocalDate startDate, LocalDate endDate) throws DocumentException {
        PdfPTable titleBar = new PdfPTable(1);
        titleBar.setWidthPercentage(100);
        titleBar.setSpacingBefore(14);

        PdfPCell tc = new PdfPCell(
                new Phrase("  SPRINT  :  " + sprint.getNom().toUpperCase(), F_SUBSECTION));
        tc.setBackgroundColor(PRIMARY_LIGHT);
        tc.setPadding(10);
        tc.setBorderColor(PRIMARY);
        tc.setBorderWidthLeft(5);
        tc.setBorderWidthTop(0);
        tc.setBorderWidthRight(0);
        tc.setBorderWidthBottom(0);
        titleBar.addCell(tc);
        doc.add(titleBar);

        if (sprint.getDescription() != null && !sprint.getDescription().isBlank()) {
            Paragraph desc = new Paragraph(sprint.getDescription(), F_NORMAL);
            desc.setIndentationLeft(14);
            desc.setSpacingBefore(6);
            desc.setSpacingAfter(8);
            doc.add(desc);
        }

        List<Activite> activites = filterActivites(sprint, startDate, endDate);

        if (activites == null || activites.isEmpty()) {
            doc.add(italic("  Aucune activité enregistrée"
                    + (startDate != null ? " dans cette période." : ".")));
            return;
        }

        Paragraph actLabel = new Paragraph("Activités Réalisées", F_LABEL);
        actLabel.setSpacingBefore(8);
        actLabel.setSpacingAfter(6);
        actLabel.setIndentationLeft(14);
        doc.add(actLabel);

        for (Activite act : activites) {
            addActiviteRow(doc, act);
        }
    }

    private void addActiviteRow(Document doc, Activite act) throws DocumentException {
        PdfPTable actTable = new PdfPTable(1);
        actTable.setWidthPercentage(96);
        actTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
        actTable.setSpacingBefore(6);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(WHITE);
        cell.setPadding(10);
        cell.setBorderColor(BORDER_COLOR);
        cell.setBorderWidth(1);

        Paragraph name = new Paragraph("▸  " + act.getNom(), F_LABEL);
        name.setSpacingAfter(4);
        cell.addElement(name);

        if (act.getObjectif() != null || act.getType() != null) {
            String metaText =
                    (act.getObjectif() != null ? "Objectif : " + act.getObjectif() : "") +
                            (act.getObjectif() != null && act.getType() != null ? "   |   " : "") +
                            (act.getType() != null ? "Type : " + act.getType() : "");
            Paragraph meta = new Paragraph(metaText, F_ITALIC);
            meta.setSpacingAfter(6);
            cell.addElement(meta);
        }

        // KPIs mini-table
        if (act.getKpis() != null && !act.getKpis().isEmpty()) {
            cell.addElement(new Paragraph("Indicateurs :", F_LABEL));
            PdfPTable kpiTable = new PdfPTable(new float[]{5, 3});
            kpiTable.setWidthPercentage(100);
            kpiTable.setSpacingBefore(4);
            kpiTable.setSpacingAfter(6);
            addKpiTableHeader(kpiTable, "Indicateur", "Valeur");
            int i = 0;
            for (ActiviteKpi kpi : act.getKpis()) {
                if (kpi.getKpi() == null) continue;
                addKpiTableRow(kpiTable, kpi.getKpi().getNom(),
                        kpi.getValeurActuelle() != null ? kpi.getValeurActuelle().toString() : "N/A",
                        i++ % 2 == 1);
            }
            cell.addElement(kpiTable);
        }

        // Tâches mini-table
        if (act.getTaches() != null && !act.getTaches().isEmpty()) {
            cell.addElement(new Paragraph("Tâches :", F_LABEL));
            PdfPTable tacheTable = new PdfPTable(new float[]{6, 2});
            tacheTable.setWidthPercentage(100);
            tacheTable.setSpacingBefore(4);
            addKpiTableHeader(tacheTable, "Tâche", "KPIs");
            int i = 0;
            for (Tache tache : act.getTaches()) {
                String kpiSummary = (tache.getTachesKpis() != null && !tache.getTachesKpis().isEmpty())
                        ? tache.getTachesKpis().stream()
                        .filter(tk -> tk.getKpi() != null)
                        .map(tk -> tk.getKpi().getNom() + ": " +
                                (tk.getValeurActuelle() != null ? tk.getValeurActuelle() : "N/A"))
                        .collect(Collectors.joining(", "))
                        : "–";
                addKpiTableRow(tacheTable, tache.getTitre(), kpiSummary, i++ % 2 == 1);
            }
            cell.addElement(tacheTable);
        }

        actTable.addCell(cell);
        doc.add(actTable);
    }

    // ─── KPI Table Helpers ────────────────────────────────────────────────────

    private void addKpiTableHeader(PdfPTable table, String col1, String col2) {
        for (String h : new String[]{col1, col2}) {
            PdfPCell c = new PdfPCell(new Phrase(h, F_BADGE));
            c.setBackgroundColor(PRIMARY);
            c.setPadding(6);
            c.setBorder(Rectangle.NO_BORDER);
            table.addCell(c);
        }
    }

    private void addKpiTableRow(PdfPTable table, String col1, String col2, boolean alt) {
        Color bg = alt ? ROW_ALT : WHITE;
        for (String val : new String[]{col1, col2}) {
            PdfPCell c = new PdfPCell(new Phrase(val, F_NORMAL));
            c.setBackgroundColor(bg);
            c.setPadding(6);
            c.setBorderColor(BORDER_COLOR);
            c.setBorderWidthBottom(1);
            c.setBorderWidthTop(0);
            c.setBorderWidthLeft(0);
            c.setBorderWidthRight(0);
            table.addCell(c);
        }
    }

    // ─── Logo Helper ──────────────────────────────────────────────────────────

    private void addLogoToPage(PdfContentByte cb, Programme programme,
                               Document doc, boolean onBanner) {
        String logoUrl = programme.getLogoUrl();
        if (logoUrl == null || logoUrl.isEmpty()) return;
        try {
            String filename = logoUrl.substring(logoUrl.lastIndexOf("/") + 1);
            Path path = Paths.get(uploadDir, filename);
            if (!Files.exists(path)) return;

            Image logo = Image.getInstance(path.toAbsolutePath().toString());
            float logoH = 44f;
            logo.scalePercent((logoH / logo.getHeight()) * 100);

            float margin = 36f;
            float x = doc.getPageSize().getWidth()  - logo.getScaledWidth()  - margin;
            float y = doc.getPageSize().getHeight() - logo.getScaledHeight() - (onBanner ? 28f : margin);
            logo.setAbsolutePosition(x, y);
            cb.addImage(logo);
        } catch (Exception e) {
            System.err.println("Logo error: " + e.getMessage());
        }
    }

    // ─── Page Header / Footer ─────────────────────────────────────────────────

    static class HeaderFooterEvent extends PdfPageEventHelper {

        private final String    programmeName;
        private final LocalDate startDate;
        private final LocalDate endDate;
        private PdfTemplate totalPagesTemplate;

        // ── FIX: cache BaseFonts here so IOException is handled in constructor ──
        private final BaseFont bf;
        private final BaseFont bfBold;

        HeaderFooterEvent(String programmeName, LocalDate startDate, LocalDate endDate) {
            this.programmeName = programmeName;
            this.startDate     = startDate;
            this.endDate       = endDate;
            try {
                this.bf     = BaseFont.createFont(BaseFont.HELVETICA,      BaseFont.CP1252, false);
                this.bfBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, false);
            } catch (Exception e) {
                throw new RuntimeException("Impossible de charger les polices d'en-tête/pied", e);
            }
        }

        @Override
        public void onOpenDocument(PdfWriter writer, Document document) {
            totalPagesTemplate = writer.getDirectContent().createTemplate(30, 12);
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            // Skip cover page
            if (writer.getPageNumber() == 1) return;

            PdfContentByte cb = writer.getDirectContent();
            float w = document.getPageSize().getWidth();
            float h = document.getPageSize().getHeight();

            try {
                // ── Header rule ──
                cb.setColorFill(PRIMARY);
                cb.rectangle(45, h - 36, w - 90, 1.5f);
                cb.fill();

                cb.beginText();
                cb.setFontAndSize(bf, 8);
                cb.setColorFill(MUTED);
                cb.showTextAligned(PdfContentByte.ALIGN_LEFT, programmeName, 45, h - 28, 0);
                cb.endText();

                String period = (startDate != null && endDate != null)
                        ? startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        + " – " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        : "Rapport Narratif";

                cb.beginText();
                cb.setFontAndSize(bf, 8);
                cb.setColorFill(MUTED);
                cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, period, w - 45, h - 28, 0);
                cb.endText();

                // ── Footer rule ──
                cb.setColorFill(BORDER_COLOR);
                cb.rectangle(45, 38, w - 90, 1f);
                cb.fill();

                cb.beginText();
                cb.setFontAndSize(bf, 8);
                cb.setColorFill(MUTED);
                cb.showTextAligned(PdfContentByte.ALIGN_LEFT,
                        "RedBoost Platform  |  Confidentiel", 45, 26, 0);
                cb.endText();

                // Page X / (total placeholder)
                cb.beginText();
                cb.setFontAndSize(bf, 8);
                cb.setColorFill(PRIMARY);
                cb.showTextAligned(PdfContentByte.ALIGN_RIGHT,
                        "Page " + writer.getPageNumber() + "  /  ", w - 45 - 12, 26, 0);
                cb.endText();

                Image totalPagesImage = Image.getInstance(totalPagesTemplate);
                totalPagesImage.setAbsolutePosition(w - 45 - 10, 23);
                cb.addImage(totalPagesImage);

            } catch (Exception e) {
                System.err.println("Footer error: " + e.getMessage());
            }
        }

        @Override
        public void onCloseDocument(PdfWriter writer, Document document) {
            try {
                totalPagesTemplate.beginText();
                totalPagesTemplate.setFontAndSize(bf, 8);
                totalPagesTemplate.setColorFill(PRIMARY);
                totalPagesTemplate.showText(String.valueOf(writer.getPageNumber() - 1));
                totalPagesTemplate.endText();
            } catch (Exception e) {
                System.err.println("Total pages error: " + e.getMessage());
            }
        }
    }

    // ─── Utility Helpers ──────────────────────────────────────────────────────

    private List<Sprint> filterSprints(Programme programme, LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) return programme.getSprints();
        return programme.getSprints().stream()
                .filter(s -> s.getDateDebut() != null && s.getDateLimite() != null
                        && !s.getDateDebut().isAfter(endDate)
                        && !s.getDateLimite().isBefore(startDate))
                .collect(Collectors.toList());
    }

    private List<Activite> filterActivites(Sprint sprint, LocalDate startDate, LocalDate endDate) {
        List<Activite> acts = sprint.getActivites();
        if (acts == null || startDate == null) return acts;
        return acts.stream()
                .filter(a -> a.getDateDebut() != null && a.getDateLimite() != null
                        && !a.getDateDebut().isAfter(endDate)
                        && !a.getDateLimite().isBefore(startDate))
                .collect(Collectors.toList());
    }

    /** Wraps an inner table with a full outer border */
    private PdfPTable borderedContainer(PdfPTable inner) throws DocumentException {
        PdfPTable wrapper = new PdfPTable(1);
        wrapper.setWidthPercentage(100);
        PdfPCell wc = new PdfPCell();
        wc.addElement(inner);
        wc.setBorderColor(BORDER_COLOR);
        wc.setBorderWidth(1);
        wc.setPadding(0);
        wrapper.addCell(wc);
        return wrapper;
    }

    private Paragraph paragraph(String text, Font font) {
        Paragraph p = new Paragraph(text != null ? text : "–", font);
        p.setLeading(15);
        p.setSpacingAfter(8);
        return p;
    }

    private Paragraph italic(String text) {
        Paragraph p = new Paragraph(text, F_ITALIC);
        p.setSpacingBefore(4);
        p.setSpacingAfter(4);
        return p;
    }

    private Paragraph indentedBullet(String text, float indent, String symbol, Font font) {
        Paragraph p = new Paragraph(symbol + "  " + text, font);
        p.setIndentationLeft(indent);
        p.setSpacingBefore(2);
        return p;
    }

    // ── FIX: replaced Spacer (missing import) with Paragraph ──
    private Paragraph spacer(float height) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(height);
        return p;
    }



}