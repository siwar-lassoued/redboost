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
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.dto.*;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;
import org.apache.poi.xwpf.usermodel.BreakType;

import java.awt.*;
import java.math.BigInteger;
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


    public byte[] generateRapportDocx(Long rapportId, LocalDate startDate, LocalDate endDate) {
        Rapport rapport = rapportRepository.findById(rapportId)
                .orElseThrow(() -> new RuntimeException("Rapport not found"));
        Programme programme = rapport.getProgramme();

        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            generateStandardDocxContent(document, rapport, programme, startDate, endDate);

            document.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating Word document", e);
        }
    }

    public byte[] generateRapportExpertiseFranceDocx(Long rapportId, LocalDate startDate, LocalDate endDate) {
        Rapport rapport = rapportRepository.findById(rapportId)
                .orElseThrow(() -> new RuntimeException("Rapport not found"));
        Programme programme = rapport.getProgramme();

        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            generateExpertiseFranceDocxContent(document, rapport, programme, startDate, endDate);

            document.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating Word document", e);
        }
    }

    public GoogleDriveService.DriveUploadResult generateAndUploadRapportDocx(Long rapportId, LocalDate startDate, LocalDate endDate, String templateType) {
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

            document.write(out);
            byte[] docxBytes = out.toByteArray();

            String periodSuffix = (startDate != null && endDate != null) ? "_Periodique" : "";
            String fileName = titleText + programme.getNom().replaceAll("\\s+", "_") + periodSuffix + ".docx";
            return googleDriveService.uploadDocxAndGetShareableLink(docxBytes, fileName);

        } catch (IOException e) {
            throw new RuntimeException("Error generating Word document", e);
        }
    }

//    private void generateStandardDocxContent(XWPFDocument document, Rapport rapport, Programme programme, LocalDate startDate, LocalDate endDate) {
//        // Title
//        XWPFParagraph title = document.createParagraph();
//        title.setAlignment(ParagraphAlignment.CENTER);
//        XWPFRun titleRun = title.createRun();
//        titleRun.setText((startDate != null && endDate != null) ? "RAPPORT PÉRIODIQUE DE PROGRAMME" : "RAPPORT NARRATIF DE PROGRAMME");
//        titleRun.setBold(true);
//        titleRun.setFontSize(20);
//        titleRun.setColor("245C67"); // PRIMARY
//
//        // Subtitle
//        XWPFParagraph subtitle = document.createParagraph();
//        subtitle.setAlignment(ParagraphAlignment.CENTER);
//        XWPFRun subtitleRun = subtitle.createRun();
//        String subText = (startDate != null && endDate != null)
//                ? "Période du " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " au " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
//                : "Généré par RedBoost Platform";
//        subtitleRun.setText(subText);
//        subtitleRun.setFontSize(10);
//        subtitleRun.setColor("787878");
//        subtitleRun.addBreak();
//
//        // 1. FICHE D'IDENTITÉ
//        createSectionTitle(document, "1. FICHE D'IDENTITÉ DU PROGRAMME", "245C67");
//
//        XWPFTable infoTable = document.createTable();
//        infoTable.setWidth("100%");
//        if (infoTable.getNumberOfRows() > 0) infoTable.removeRow(0);
//
//        String secteursList = programme.getSecteurs().stream()
//                .map(Secteur::getNom)
//                .collect(Collectors.joining(", "));
//
//        addStyledTableRow(infoTable, "Nom du Projet", programme.getNom(), false, "DCE9EF", "FFFFFF");
//        addStyledTableRow(infoTable, "Type", programme.getTypeProgramme(), true, "DCE9EF", "FAFAFA");
//        addStyledTableRow(infoTable, "Période", programme.getDateDebut() + " au " + programme.getDateFin(), false, "DCE9EF", "FFFFFF");
//        addStyledTableRow(infoTable, "Statut", programme.getStatut().toString(), true, "DCE9EF", "FAFAFA");
//        addStyledTableRow(infoTable, "Bénéficiaires", String.valueOf(programme.getNombreBeneficiaires()), false, "DCE9EF", "FFFFFF");
//        addStyledTableRow(infoTable, "Secteurs", secteursList, true, "DCE9EF", "FAFAFA");
//
//        document.createParagraph(); // Spacer
//
//        // 2. RÉSUMÉ EXÉCUTIF
//        createSectionTitle(document, "2. RÉSUMÉ EXÉCUTIF", "245C67");
//        createSubTitle(document, "Objectifs du Programme", "245C67");
//        createParagraph(document, rapport.getObjectifsProgramme());
//
//        createSubTitle(document, "Résultats Clés", "245C67");
//        createParagraph(document, rapport.getResultatsCles());
//
//        createSubTitle(document, "Impact Global", "245C67");
//        createParagraph(document, rapport.getImpactGlobal());
//
//        // 3. CONTEXTE ET OBJECTIFS
//        createSectionTitle(document, "3. CONTEXTE ET OBJECTIFS", "245C67");
//
//        for (ObjectifGlobal og : rapport.getObjectifsGlobaux()) {
//            XWPFParagraph ogP = document.createParagraph();
//            setParagraphLeftBorder(ogP, "245C67", STBorder.SINGLE, "12");
//            XWPFRun ogR = ogP.createRun();
//            ogR.setText("Objectif Global : " + og.getNom());
//            ogR.setBold(true);
//            ogR.setColor("245C67");
//            ogR.setFontSize(12);
//
//            if (og.getDescription() != null) {
//                XWPFParagraph descP = document.createParagraph();
//                descP.setIndentationLeft(360);
//                descP.createRun().setText(og.getDescription());
//            }
//
//            for (ObjectifSpecifique os : og.getObjectifsSpecifiques()) {
//                XWPFParagraph osP = document.createParagraph();
//                osP.setIndentationLeft(360);
//                osP.setSpacingBefore(100);
//                XWPFRun osR = osP.createRun();
//                osR.setText("▸ Objectif Spécifique : " + os.getNom());
//                osR.setBold(true);
//
//                for (Resultat res : os.getResultats()) {
//                    XWPFParagraph resP = document.createParagraph();
//                    resP.setIndentationLeft(720);
//                    resP.createRun().setText("• Résultat : " + res.getNom());
//                }
//                for (ResultatTransversal rt : os.getResultatsTransversaux()) {
//                    XWPFParagraph rtP = document.createParagraph();
//                    rtP.setIndentationLeft(720);
//                    XWPFRun rtR = rtP.createRun();
//                    rtR.setText("◦ Résultat Transversal : " + rt.getNom());
//                    rtR.setItalic(true);
//                }
//            }
//            document.createParagraph();
//        }
//
//        // 4. MÉTHODOLOGIE ET RÉSULTATS
//        createSectionTitle(document, "4. MÉTHODOLOGIE ET RÉSULTATS", "245C67");
//
//        List<Sprint> sprints = filterSprints(programme, startDate, endDate);
//        if (sprints.isEmpty()) {
//            createParagraph(document, "Aucun sprint trouvé dans cette période.");
//        } else {
//            for (Sprint sprint : sprints) {
//                XWPFParagraph sprintP = document.createParagraph();
//                setParagraphLeftBorder(sprintP, "245C67", STBorder.SINGLE, "12");
//                setParagraphShading(sprintP, "DCE9EF");
//                XWPFRun sprintR = sprintP.createRun();
//                sprintR.setText("  SPRINT : " + sprint.getNom().toUpperCase());
//                sprintR.setBold(true);
//                sprintR.setColor("245C67");
//
//                if (sprint.getDescription() != null) {
//                    XWPFParagraph descP = document.createParagraph();
//                    descP.setIndentationLeft(360);
//                    descP.createRun().setText(sprint.getDescription());
//                }
//
//                List<Activite> activites = filterActivites(sprint, startDate, endDate);
//                if (activites == null || activites.isEmpty()) {
//                    XWPFParagraph noActP = document.createParagraph();
//                    noActP.setIndentationLeft(360);
//                    noActP.createRun().setText("Aucune activité enregistrée.");
//                } else {
//                    XWPFParagraph actHeader = document.createParagraph();
//                    actHeader.setIndentationLeft(360);
//                    actHeader.setSpacingBefore(100);
//                    XWPFRun actHeaderR = actHeader.createRun();
//                    actHeaderR.setText("Activités Réalisées");
//                    actHeaderR.setBold(true);
//
//                    for (Activite act : activites) {
//                        XWPFTable actTable = document.createTable();
//                        actTable.setWidth("95%");
//                        actTable.setTableAlignment(TableRowAlign.RIGHT);
//                        if (actTable.getNumberOfRows() > 0) actTable.removeRow(0);
//
//                        XWPFTableRow row = actTable.createRow();
//                        XWPFTableCell cell = row.getCell(0);
//                        if (cell == null) cell = row.createCell();
//
//                        XWPFParagraph nameP = cell.addParagraph();
//                        nameP.createRun().setText("▸ " + act.getNom());
//
//                        if (act.getObjectif() != null || act.getType() != null) {
//                            XWPFParagraph metaP = cell.addParagraph();
//                            XWPFRun metaR = metaP.createRun();
//                            String metaText = (act.getObjectif() != null ? "Objectif : " + act.getObjectif() : "") +
//                                    (act.getObjectif() != null && act.getType() != null ? "   |   " : "") +
//                                    (act.getType() != null ? "Type : " + act.getType() : "");
//                            metaR.setText(metaText);
//                            metaR.setItalic(true);
//                            metaR.setFontSize(9);
//                        }
//
//                        if (act.getKpis() != null && !act.getKpis().isEmpty()) {
//                            XWPFParagraph kpiHeader = cell.addParagraph();
//                            kpiHeader.createRun().setText("Indicateurs :");
//
//                            for (ActiviteKpi kpi : act.getKpis()) {
//                                if (kpi.getKpi() != null) {
//                                    XWPFParagraph kpiP = cell.addParagraph();
//                                    kpiP.setIndentationLeft(360);
//                                    kpiP.createRun().setText("- " + kpi.getKpi().getNom() + ": " + (kpi.getValeurActuelle() != null ? kpi.getValeurActuelle() : "N/A"));
//                                }
//                            }
//                        }
//
//                        document.createParagraph();
//                    }
//                }
//            }
//        }
//
//        // 5. CONCLUSION
//        createSectionTitle(document, "5. CONCLUSION & RECOMMANDATIONS", "245C67");
//        createParagraph(document, rapport.getConclusionRecommandations());
//    }

//    private void generateExpertiseFranceDocxContent(XWPFDocument document, Rapport rapport, Programme programme, LocalDate startDate, LocalDate endDate) {
//        // Title
//        XWPFParagraph title = document.createParagraph();
//        title.setAlignment(ParagraphAlignment.CENTER);
//        XWPFRun titleRun = title.createRun();
//        titleRun.setText("RAPPORT EXPERTISE FRANCE");
//        titleRun.setBold(true);
//        titleRun.setFontSize(20);
//        titleRun.setColor("003189"); // EF_NAVY
//
//        // Subtitle
//        XWPFParagraph subtitle = document.createParagraph();
//        subtitle.setAlignment(ParagraphAlignment.CENTER);
//        XWPFRun subtitleRun = subtitle.createRun();
//        String subText = (startDate != null && endDate != null)
//                ? "Période du " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " au " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
//                : "Généré par RedBoost Platform";
//        subtitleRun.setText(subText);
//        subtitleRun.setFontSize(10);
//        subtitleRun.setColor("64738C"); // EF_MUTED
//        subtitleRun.addBreak();
//
//        // I. INFORMATIONS GÉNÉRALES
//        createSectionTitle(document, "I. Informations Générales du Programme", "003189");
//
//        XWPFTable infoTable = document.createTable();
//        infoTable.setWidth("100%");
//        if (infoTable.getNumberOfRows() > 0) infoTable.removeRow(0);
//
//        String secteursList = programme.getSecteurs().stream()
//                .map(Secteur::getNom)
//                .collect(Collectors.joining(", "));
//
//        addStyledTableRow(infoTable, "Nom du Projet", programme.getNom(), false, "DCE6F5", "FFFFFF");
//        addStyledTableRow(infoTable, "Type", programme.getTypeProgramme(), true, "DCE6F5", "F8FAFD");
//        addStyledTableRow(infoTable, "Période", programme.getDateDebut() + " au " + programme.getDateFin(), false, "DCE6F5", "FFFFFF");
//        addStyledTableRow(infoTable, "Statut", programme.getStatut().toString(), true, "DCE6F5", "F8FAFD");
//        addStyledTableRow(infoTable, "Bénéficiaires", String.valueOf(programme.getNombreBeneficiaires()), false, "DCE6F5", "FFFFFF");
//        addStyledTableRow(infoTable, "Secteurs", secteursList, true, "DCE6F5", "F8FAFD");
//
//        document.createParagraph();
//
//        // II. RÉSUMÉ EXÉCUTIF
//        createSectionTitle(document, "II. Résumé Exécutif", "003189");
//        createSubTitle(document, "Objectifs du Programme", "0055A4");
//        createParagraph(document, rapport.getObjectifsProgramme());
//
//        createSubTitle(document, "Résultats Clés", "0055A4");
//        createParagraph(document, rapport.getResultatsCles());
//
//        createSubTitle(document, "Impact Global", "0055A4");
//        createParagraph(document, rapport.getImpactGlobal());
//
//        // III. RÉSULTATS ET ACTIVITÉS
//        createSectionTitle(document, "III. Résultats et Activités", "003189");
//
//        // A. Résultats
//        createSubTitle(document, "A. Résultats", "C8A84B"); // Gold
//
//        for (ObjectifGlobal og : rapport.getObjectifsGlobaux()) {
//            for (ObjectifSpecifique os : og.getObjectifsSpecifiques()) {
//                if ((os.getResultats() != null && !os.getResultats().isEmpty()) || (os.getResultatsTransversaux() != null && !os.getResultatsTransversaux().isEmpty())) {
//
//                    XWPFParagraph osP = document.createParagraph();
//                    setParagraphLeftBorder(osP, "0055A4", STBorder.SINGLE, "12");
//                    setParagraphShading(osP, "DCE6F5");
//                    XWPFRun osR = osP.createRun();
//                    osR.setText("Résultats Principaux — Objectif Spécifique : " + os.getNom());
//                    osR.setBold(true);
//
//                    if (os.getResultats() != null) {
//                        for (Resultat res : os.getResultats()) {
//                            XWPFParagraph resP = document.createParagraph();
//                            resP.setIndentationLeft(360);
//                            resP.createRun().setText("• " + res.getNom());
//
//                            if (res.getKpis() != null) {
//                                for (BackofficeKpi kpi : res.getKpis()) {
//                                    XWPFParagraph kpiP = document.createParagraph();
//                                    kpiP.setIndentationLeft(720);
//                                    XWPFRun kpiR = kpiP.createRun();
//                                    kpiR.setText("◦ KPI : " + kpi.getNom() + " (" + kpi.getUniteMesure() + ")");
//                                    kpiR.setItalic(true);
//                                }
//                            }
//                        }
//                    }
//
//                    if (os.getResultatsTransversaux() != null && !os.getResultatsTransversaux().isEmpty()) {
//                        XWPFParagraph rtHeader = document.createParagraph();
//                        rtHeader.setSpacingBefore(100);
//                        setParagraphLeftBorder(rtHeader, "C8A84B", STBorder.SINGLE, "12");
//                        setParagraphShading(rtHeader, "F4F6FA");
//                        XWPFRun rtR = rtHeader.createRun();
//                        rtR.setText("Résultats Transversaux");
//                        rtR.setBold(true);
//
//                        for (ResultatTransversal rt : os.getResultatsTransversaux()) {
//                            XWPFParagraph rtP = document.createParagraph();
//                            rtP.setIndentationLeft(360);
//                            rtP.createRun().setText("• " + rt.getNom());
//
//                            if (rt.getKpis() != null) {
//                                for (BackofficeKpi kpi : rt.getKpis()) {
//                                    XWPFParagraph kpiP = document.createParagraph();
//                                    kpiP.setIndentationLeft(720);
//                                    XWPFRun kpiR = kpiP.createRun();
//                                    kpiR.setText("◦ KPI : " + kpi.getNom() + " (" + kpi.getUniteMesure() + ")");
//                                    kpiR.setItalic(true);
//                                }
//                            }
//                        }
//                    }
//                    document.createParagraph();
//                }
//            }
//        }
//
//        // B. Activités
//        createSubTitle(document, "B. Activités", "C8A84B");
//
//        List<Sprint> sprints = filterSprints(programme, startDate, endDate);
//        if (sprints != null) {
//            for (Sprint sprint : sprints) {
//                List<Activite> activites = filterActivites(sprint, startDate, endDate);
//                if (activites != null) {
//                    for (Activite act : activites) {
//                        XWPFTable actTable = document.createTable();
//                        actTable.setWidth("100%");
//                        if (actTable.getNumberOfRows() > 0) actTable.removeRow(0);
//
//                        XWPFTableRow headerRow = actTable.createRow();
//                        XWPFTableCell headerCell = headerRow.getCell(0);
//                        if (headerCell == null) headerCell = headerRow.createCell();
//                        headerCell.getCTTc().addNewTcPr().addNewShd().setFill("003189");
//                        XWPFParagraph headerP = headerCell.addParagraph();
//                        XWPFRun headerR = headerP.createRun();
//                        headerR.setText("Activité : " + act.getNom());
//                        headerR.setColor("FFFFFF");
//                        headerR.setBold(true);
//
//                        XWPFTableRow contentRow = actTable.createRow();
//                        XWPFTableCell contentCell = contentRow.getCell(0);
//                        if (contentCell == null) contentCell = contentRow.createCell();
//
//                        contentCell.addParagraph().createRun().setText("Description : " + (act.getDescription() != null ? act.getDescription() : "N/A"));
//
//                        XWPFRun objR = contentCell.addParagraph().createRun();
//                        objR.setText("Objectif/Résultat rattaché : " + (act.getObjectif() != null ? act.getObjectif() : "N/A"));
//                        objR.setItalic(true);
//
//                        if (act.getKpis() != null && !act.getKpis().isEmpty()) {
//                            XWPFParagraph kpiHeader = contentCell.addParagraph();
//                            kpiHeader.setSpacingBefore(100);
//                            XWPFRun kpiR = kpiHeader.createRun();
//                            kpiR.setText("Indicateurs (KPIs) et Évolution :");
//                            kpiR.setBold(true);
//
//                            for (ActiviteKpi ak : act.getKpis()) {
//                                if (ak.getKpi() != null) {
//                                    XWPFParagraph kpiP = contentCell.addParagraph();
//                                    kpiP.setIndentationLeft(360);
//                                    kpiP.createRun().setText("• " + ak.getKpi().getNom() + " — Actuel : " + (ak.getValeurActuelle() != null ? ak.getValeurActuelle() : "N/A"));
//
//                                    List<ActiviteKpiHistory> history = activiteKpiHistoryRepository.findByActiviteKpiIdOrderByChangedAtAsc(ak.getId());
//                                    if (history != null && !history.isEmpty()) {
//                                        for (ActiviteKpiHistory h : history) {
//                                            XWPFParagraph histP = contentCell.addParagraph();
//                                            histP.setIndentationLeft(720);
//                                            XWPFRun histR = histP.createRun();
//                                            histR.setText(h.getChangedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ": " + h.getValeurActuelle());
//                                            histR.setFontSize(8);
//                                            histR.setColor("64738C");
//                                        }
//                                    }
//                                }
//                            }
//                        }
//                        document.createParagraph();
//                    }
//                }
//            }
//        }
//
//        // IV. CONCLUSION
//        createSectionTitle(document, "IV. Conclusion et Recommandations", "003189");
//        XWPFParagraph concP = document.createParagraph();
//        setParagraphLeftBorder(concP, "C8A84B", STBorder.SINGLE, "12");
//        setParagraphShading(concP, "F4F6FA");
//        XWPFRun concR = concP.createRun();
//        concR.setText(rapport.getConclusionRecommandations() != null ? rapport.getConclusionRecommandations() : "Aucune conclusion enregistrée.");
//    }

    // --- Helper Methods for Word Generation ---

    private void setParagraphLeftBorder(XWPFParagraph paragraph, String color, STBorder.Enum borderType, String size) {
        CTP ctp = paragraph.getCTP();
        CTPPr ppr = ctp.isSetPPr() ? ctp.getPPr() : ctp.addNewPPr();
        CTPBdr pBdr = ppr.isSetPBdr() ? ppr.getPBdr() : ppr.addNewPBdr();

        CTBorder leftBorder = pBdr.isSetLeft() ? pBdr.getLeft() : pBdr.addNewLeft();
        leftBorder.setVal(borderType);
        leftBorder.setSz(new BigInteger(size));
        leftBorder.setSpace(new BigInteger("4"));
        leftBorder.setColor(color);
    }

    private void setParagraphShading(XWPFParagraph paragraph, String fill) {
        CTP ctp = paragraph.getCTP();
        CTPPr ppr = ctp.isSetPPr() ? ctp.getPPr() : ctp.addNewPPr();
        CTShd shd = ppr.isSetShd() ? ppr.getShd() : ppr.addNewShd();
        shd.setVal(STShd.CLEAR);
        shd.setColor("auto");
        shd.setFill(fill);
    }

    private void createSectionTitle(XWPFDocument doc, String text, String color) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingBefore(400);
        p.setSpacingAfter(200);
        XWPFRun r = p.createRun();
        r.setText(text);
        r.setBold(true);
        r.setFontSize(14);
        r.setColor(color);
    }

    private void createSubTitle(XWPFDocument doc, String text, String color) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingBefore(200);
        XWPFRun r = p.createRun();
        r.setText(text);
        r.setBold(true);
        r.setFontSize(11);
        r.setColor(color);
    }

    private void createParagraph(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        XWPFRun r = p.createRun();
        r.setText(text != null ? text : "N/A");
    }

    private void addStyledTableRow(XWPFTable table, String label, String value, boolean alt, String labelBg, String valueBg) {
        XWPFTableRow row = table.createRow();
        
        XWPFTableCell labelCell = row.getCell(0);
        if(labelCell == null) labelCell = row.createCell();
        labelCell.setText(label);
        labelCell.getCTTc().addNewTcPr().addNewShd().setFill(alt ? "ECF3F4" : labelBg);

        XWPFTableCell valueCell = row.getCell(1);
        if(valueCell == null) valueCell = row.createCell();
        valueCell.setText(value != null ? value : "-");
        valueCell.getCTTc().addNewTcPr().addNewShd().setFill(alt ? valueBg : "FFFFFF");
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








    ////////////////////////////docx endpoints :



    // ════════════════════════════════════════════════════════════════════════════
//  DROP-IN REPLACEMENT FOR RapportService.java
//
//  Replace the following methods entirely:
//    • generateStandardDocxContent(...)
//    • generateExpertiseFranceDocxContent(...)
//
//  ADD all helper methods below your existing helpers (before the closing
//  brace of the class).
//
//  Make sure this import exists at the top of RapportService.java:
//    import org.apache.poi.xwpf.usermodel.BreakType;
// ════════════════════════════════════════════════════════════════════════════

    // =========================================================================
    // STANDARD TEMPLATE – mirrors generateRapportPdf() exactly
    // =========================================================================

    private void generateStandardDocxContent(XWPFDocument document, Rapport rapport,
                                             Programme programme,
                                             LocalDate startDate, LocalDate endDate) {
        // ── Palette (mirrors PDF statics) ─────────────────────────────────────
        final String C_PRIMARY       = "245C67";   // dark teal
        final String C_ACCENT        = "E44D62";   // rose
        final String C_PRIMARY_LIGHT = "DCE9EF";   // pale teal
        final String C_SECTION_BG    = "F5F8F9";   // near-white teal tint
        final String C_ROW_ALT       = "FAFAFA";   // alt row
        final String C_BORDER        = "D2DCDE";   // subtle border
        final String C_DARK          = "1E282A";   // dark text
        final String C_MUTED         = "787882";   // muted text
        final String C_ECF           = "ECF3F4";   // alt label bg
        final String C_WHITE         = "FFFFFF";

        // ── COVER PAGE ────────────────────────────────────────────────────────

        // Eyebrow
        XWPFParagraph eyebrow = document.createParagraph();
        eyebrow.setSpacingAfter(60);
        XWPFRun eyebrowR = eyebrow.createRun();
        eyebrowR.setText("REDBOOST PLATFORM  ·  RAPPORT OFFICIEL");
        eyebrowR.setFontSize(8);
        eyebrowR.setColor(C_MUTED);

        // Accent rule
        docxAddColoredRule(document, C_ACCENT, 45);

        // Report type
        String reportType = (startDate != null && endDate != null)
                ? "RAPPORT PÉRIODIQUE DE PROGRAMME"
                : "RAPPORT NARRATIF DE PROGRAMME";
        XWPFParagraph titleP = document.createParagraph();
        titleP.setSpacingBefore(160);
        titleP.setSpacingAfter(80);
        XWPFRun titleR = titleP.createRun();
        titleR.setText(reportType);
        titleR.setBold(true);
        titleR.setFontSize(22);
        titleR.setColor(C_PRIMARY);

        // Programme name
        XWPFParagraph progP = document.createParagraph();
        progP.setSpacingAfter(160);
        XWPFRun progR = progP.createRun();
        progR.setText(programme.getNom());
        progR.setBold(true);
        progR.setFontSize(14);
        progR.setColor(C_ACCENT);

        // Period subtitle
        String subText = (startDate != null && endDate != null)
                ? "Période du " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                + " au " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "Généré par RedBoost Platform";
        XWPFParagraph subP = document.createParagraph();
        subP.setSpacingAfter(120);
        XWPFRun subR = subP.createRun();
        subR.setText(subText);
        subR.setFontSize(10);
        subR.setColor(C_MUTED);

        // Timestamp
        XWPFParagraph tsP = document.createParagraph();
        tsP.setAlignment(ParagraphAlignment.RIGHT);
        tsP.setSpacingBefore(200);
        XWPFRun tsR = tsP.createRun();
        tsR.setText("Généré le " + java.time.LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")));
        tsR.setFontSize(8);
        tsR.setItalic(true);
        tsR.setColor(C_MUTED);

        // Page break (cover → content)

        // ── SECTION 1 – FICHE D'IDENTITÉ ─────────────────────────────────────
        stdAddSectionHeader(document, "1", "FICHE D'IDENTITÉ DU PROGRAMME",
                C_ACCENT, C_PRIMARY);

        String secteurs = programme.getSecteurs().stream()
                .map(Secteur::getNom).collect(Collectors.joining(", "));
        String[][] identityRows = {
                {"Nom du Projet",  programme.getNom()},
                {"Type",           programme.getTypeProgramme()},
                {"Période",        programme.getDateDebut() + " → " + programme.getDateFin()},
                {"Statut",         programme.getStatut().toString()},
                {"Bénéficiaires",  String.valueOf(programme.getNombreBeneficiaires())},
                {"Secteurs",       secteurs}
        };
        stdAddIdentityTable(document, identityRows,
                C_PRIMARY_LIGHT, C_ECF, C_ROW_ALT, C_BORDER, C_DARK);
        document.createParagraph().setSpacingAfter(120);

        // ── SECTION 2 – RÉSUMÉ EXÉCUTIF ───────────────────────────────────────
        stdAddSectionHeader(document, "2", "RÉSUMÉ EXÉCUTIF", C_ACCENT, C_PRIMARY);
        stdAddSubSection(document, "Objectifs du Programme",
                rapport.getObjectifsProgramme(), C_PRIMARY, C_ACCENT, C_DARK);
        stdAddSubSection(document, "Résultats Clés",
                rapport.getResultatsCles(), C_PRIMARY, C_ACCENT, C_DARK);
        stdAddSubSection(document, "Impact Global",
                rapport.getImpactGlobal(), C_PRIMARY, C_ACCENT, C_DARK);
        document.createParagraph().setSpacingAfter(120);

        // ── SECTION 3 – CONTEXTE ET OBJECTIFS ────────────────────────────────
        stdAddSectionHeader(document, "3", "CONTEXTE ET OBJECTIFS", C_ACCENT, C_PRIMARY);
        for (ObjectifGlobal og : rapport.getObjectifsGlobaux()) {
            stdAddObjectifBlock(document, og, C_PRIMARY, C_SECTION_BG, C_DARK, C_MUTED);
        }
        document.createParagraph().setSpacingAfter(120);

        // ── SECTION 4 – MÉTHODOLOGIE ET RÉSULTATS ────────────────────────────
        stdAddSectionHeader(document, "4", "MÉTHODOLOGIE ET RÉSULTATS",
                C_ACCENT, C_PRIMARY);
        List<Sprint> sprints = filterSprints(programme, startDate, endDate);
        if (sprints.isEmpty()) {
            XWPFParagraph noSP = document.createParagraph();
            XWPFRun noSR = noSP.createRun();
            noSR.setText("Aucun sprint trouvé dans cette période.");
            noSR.setItalic(true);
            noSR.setColor(C_MUTED);
        } else {
            for (Sprint sprint : sprints) {
                stdAddSprintBlock(document, sprint, startDate, endDate,
                        C_PRIMARY, C_PRIMARY_LIGHT, C_ACCENT, C_MUTED, C_BORDER, C_DARK, C_ROW_ALT);
            }
        }
        document.createParagraph().setSpacingAfter(120);

        // ── SECTION 5 – CONCLUSION ────────────────────────────────────────────
        stdAddSectionHeader(document, "5", "CONCLUSION & RECOMMANDATIONS",
                C_ACCENT, C_PRIMARY);

        // Conclusion in bordered box mirroring the PDF
        XWPFTable concBox = document.createTable(1, 1);
        docxRemoveTblBorders(concBox);
        docxSetTblOuterBorder(concBox, C_BORDER);
        concBox.setWidth("100%");
        XWPFTableCell concCell = concBox.getRow(0).getCell(0);
        docxSetCellBg(concCell, C_SECTION_BG);
        docxSetCellLeftBorder(concCell, C_PRIMARY, "18");
        XWPFParagraph concP = concCell.getParagraphs().get(0);
        concP.setSpacingBefore(120);
        concP.setSpacingAfter(120);
        concP.setIndentationLeft(200);
        XWPFRun concR = concP.createRun();
        concR.setText(rapport.getConclusionRecommandations() != null
                ? rapport.getConclusionRecommandations()
                : "Aucune conclusion enregistrée.");
        concR.setFontSize(10);
        concR.setColor(C_DARK);

        // Footer timestamp
        XWPFParagraph footP = document.createParagraph();
        footP.setAlignment(ParagraphAlignment.RIGHT);
        footP.setSpacingBefore(200);
        XWPFRun footR = footP.createRun();
        footR.setText("RedBoost Platform  |  Confidentiel  —  "
                + java.time.LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        footR.setFontSize(8);
        footR.setItalic(true);
        footR.setColor(C_MUTED);
    }

    // =========================================================================
    // EF TEMPLATE – mirrors generateRapportExpertiseFrancePdf() exactly
    // =========================================================================

    private void generateExpertiseFranceDocxContent(XWPFDocument document, Rapport rapport,
                                                    Programme programme,
                                                    LocalDate startDate, LocalDate endDate) {
        // ── Palette (mirrors PDF EF statics) ─────────────────────────────────
        final String EF_NAVY       = "003189";
        final String EF_BLUE       = "0055A4";
        final String EF_BLUE_LIGHT = "DCE6F5";
        final String EF_GOLD       = "C8A84B";
        final String EF_BG         = "F4F6FA";
        final String EF_BORDER     = "C8D2E6";
        final String EF_ROW_ALT    = "F8FAFD";
        final String EF_MUTED      = "64738C";
        final String EF_DARK       = "14203A";
        final String WHITE         = "FFFFFF";
        final String ALT_LABEL_BG  = "D2DEFA";

        // ── HEADER STRIPE (navy 60% + gold 40%) ───────────────────────────────
        XWPFTable stripeTable = document.createTable(1, 2);
        docxRemoveTblBorders(stripeTable);
        XWPFTableRow stripeRow = stripeTable.getRow(0);
        docxSetCellBg(stripeRow.getCell(0), EF_NAVY);
        docxSetCellWidth(stripeRow.getCell(0), 5616);          // ~60 %
        docxSetCellBg(stripeRow.getCell(1), EF_GOLD);
        docxSetCellWidth(stripeRow.getCell(1), 3744);          // ~40 %
        docxSetRowHeight(stripeRow, 50);
        stripeRow.getCell(0).getParagraphs().get(0).setSpacingBefore(0);
        stripeRow.getCell(1).getParagraphs().get(0).setSpacingBefore(0);

        // ── EXPERTISE FRANCE badge ─────────────────────────────────────────────
        XWPFTable efBadge = document.createTable(1, 1);
        docxRemoveTblBorders(efBadge);
        efBadge.setWidth("40%");
        XWPFTableCell efCell = efBadge.getRow(0).getCell(0);
        docxSetCellBg(efCell, EF_NAVY);
        docxSetCellLeftBorder(efCell, EF_GOLD, "18");
        XWPFParagraph efP = efCell.getParagraphs().get(0);
        efP.setSpacingBefore(100);
        efP.setSpacingAfter(100);
        efP.setIndentationLeft(160);
        XWPFRun efR1 = efP.createRun();
        efR1.setText("EXPERTISE ");
        efR1.setBold(true);
        efR1.setFontSize(10);
        efR1.setColor(WHITE);
        XWPFRun efR2 = efP.createRun();
        efR2.setText("FRANCE");
        efR2.setBold(true);
        efR2.setFontSize(10);
        efR2.setColor(EF_GOLD);

        // Separator rule under badge
        docxAddColoredRule(document, EF_BORDER, 20);

        // ── TITLE ──────────────────────────────────────────────────────────────
        XWPFParagraph titleP = document.createParagraph();
        titleP.setAlignment(ParagraphAlignment.CENTER);
        titleP.setSpacingBefore(140);
        titleP.setSpacingAfter(60);
        XWPFRun titleR = titleP.createRun();
        titleR.setText("RAPPORT EXPERTISE FRANCE");
        titleR.setBold(true);
        titleR.setFontSize(20);
        titleR.setColor(EF_NAVY);

        // Subtitle
        String subText = (startDate != null && endDate != null)
                ? "Période du " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                + " au " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "Généré par RedBoost Platform";
        XWPFParagraph subP = document.createParagraph();
        subP.setAlignment(ParagraphAlignment.CENTER);
        subP.setSpacingAfter(80);
        XWPFRun subR = subP.createRun();
        subR.setText(subText);
        subR.setFontSize(10);
        subR.setColor(EF_MUTED);

        // Gold + navy double rule under title
        XWPFTable doubleRule = document.createTable(1, 2);
        docxRemoveTblBorders(doubleRule);
        XWPFTableRow drRow = doubleRule.getRow(0);
        docxSetCellBg(drRow.getCell(0), EF_GOLD);
        docxSetCellWidth(drRow.getCell(0), 1170);  // ~1 part
        docxSetCellBg(drRow.getCell(1), EF_NAVY);
        docxSetCellWidth(drRow.getCell(1), 8190);  // ~8 parts
        docxSetRowHeight(drRow, 50);
        drRow.getCell(0).getParagraphs().get(0).setSpacingBefore(0);
        drRow.getCell(1).getParagraphs().get(0).setSpacingBefore(0);
        document.createParagraph().setSpacingAfter(140);

        // ── SECTION I – INFORMATIONS GÉNÉRALES ───────────────────────────────
        efAddSectionHeader(document, "I", "Informations Générales du Programme",
                EF_NAVY, EF_GOLD);

        String secteurs = programme.getSecteurs().stream()
                .map(Secteur::getNom).collect(Collectors.joining(", "));
        String[][] infoRows = {
                {"Nom du Projet",  programme.getNom()},
                {"Type",           programme.getTypeProgramme()},
                {"Période",        programme.getDateDebut() + " au " + programme.getDateFin()},
                {"Statut",         programme.getStatut().toString()},
                {"Bénéficiaires",  String.valueOf(programme.getNombreBeneficiaires())},
                {"Secteurs",       secteurs}
        };
        efAddInfoTable(document, infoRows, EF_BLUE_LIGHT, ALT_LABEL_BG,
                EF_ROW_ALT, EF_BORDER, EF_DARK);
        document.createParagraph().setSpacingAfter(120);

        // ── SECTION II – RÉSUMÉ EXÉCUTIF ─────────────────────────────────────
        efAddSectionHeader(document, "II", "Résumé Exécutif", EF_NAVY, EF_GOLD);
        efAddSubSection(document, "Objectifs du Programme",
                rapport.getObjectifsProgramme(), EF_BLUE, EF_GOLD, EF_DARK);
        efAddSubSection(document, "Résultats Clés",
                rapport.getResultatsCles(), EF_BLUE, EF_GOLD, EF_DARK);
        efAddSubSection(document, "Impact Global",
                rapport.getImpactGlobal(), EF_BLUE, EF_GOLD, EF_DARK);
        document.createParagraph().setSpacingAfter(120);

        // ── SECTION III – RÉSULTATS ET ACTIVITÉS ─────────────────────────────
        efAddSectionHeader(document, "III", "Résultats et Activités", EF_NAVY, EF_GOLD);

        // A. Résultats
        efAddSubSectionLetter(document, "A. Résultats", EF_BLUE, EF_GOLD);

        for (ObjectifGlobal og : rapport.getObjectifsGlobaux()) {
            for (ObjectifSpecifique os : og.getObjectifsSpecifiques()) {
                boolean hasResults     = os.getResultats() != null && !os.getResultats().isEmpty();
                boolean hasTransversal = os.getResultatsTransversaux() != null
                        && !os.getResultatsTransversaux().isEmpty();

                if (!hasResults && !hasTransversal) continue;

                // OS header bar (blue left border + light blue bg)
                XWPFParagraph osP = document.createParagraph();
                osP.setSpacingBefore(100);
                setParagraphLeftBorder(osP, EF_BLUE, STBorder.SINGLE, "18");
                setParagraphShading(osP, EF_BLUE_LIGHT);
                osP.setIndentationLeft(160);
                XWPFRun osR = osP.createRun();
                osR.setText("Résultats Principaux — Objectif Spécifique : " + os.getNom());
                osR.setBold(true);
                osR.setFontSize(10);
                osR.setColor(EF_NAVY);

                // Principal results
                if (hasResults) {
                    for (Resultat res : os.getResultats()) {
                        XWPFParagraph resP = document.createParagraph();
                        resP.setIndentationLeft(360);
                        resP.setSpacingBefore(40);
                        XWPFRun resR = resP.createRun();
                        resR.setText("  •  " + res.getNom());
                        resR.setFontSize(10);
                        resR.setColor(EF_DARK);

                        if (res.getKpis() != null) {
                            for (BackofficeKpi kpi : res.getKpis()) {
                                XWPFParagraph kpiP = document.createParagraph();
                                kpiP.setIndentationLeft(720);
                                XWPFRun kpiR = kpiP.createRun();
                                kpiR.setText("      ◦  KPI : " + kpi.getNom()
                                        + "  (" + kpi.getUniteMesure() + ")");
                                kpiR.setItalic(true);
                                kpiR.setFontSize(9);
                                kpiR.setColor(EF_MUTED);
                            }
                        }
                    }
                }

                // Transversal results (gold left border + EF_BG)
                if (hasTransversal) {
                    XWPFParagraph rtHeader = document.createParagraph();
                    rtHeader.setSpacingBefore(100);
                    setParagraphLeftBorder(rtHeader, EF_GOLD, STBorder.SINGLE, "18");
                    setParagraphShading(rtHeader, EF_BG);
                    rtHeader.setIndentationLeft(160);
                    XWPFRun rtHR = rtHeader.createRun();
                    rtHR.setText("Résultats Transversaux");
                    rtHR.setBold(true);
                    rtHR.setFontSize(10);
                    rtHR.setColor(EF_DARK);

                    for (ResultatTransversal rt : os.getResultatsTransversaux()) {
                        XWPFParagraph rtP = document.createParagraph();
                        rtP.setIndentationLeft(360);
                        rtP.setSpacingBefore(40);
                        XWPFRun rtR = rtP.createRun();
                        rtR.setText("  •  " + rt.getNom());
                        rtR.setFontSize(10);
                        rtR.setColor(EF_DARK);

                        if (rt.getKpis() != null) {
                            for (BackofficeKpi kpi : rt.getKpis()) {
                                XWPFParagraph kpiP = document.createParagraph();
                                kpiP.setIndentationLeft(720);
                                XWPFRun kpiR = kpiP.createRun();
                                kpiR.setText("      ◦  KPI : " + kpi.getNom()
                                        + "  (" + kpi.getUniteMesure() + ")");
                                kpiR.setItalic(true);
                                kpiR.setFontSize(9);
                                kpiR.setColor(EF_MUTED);
                            }
                        }
                    }
                }
                document.createParagraph().setSpacingAfter(60);
            }
        }

        // B. Activités
        efAddSubSectionLetter(document, "B. Activités", EF_BLUE, EF_GOLD);

        for (Sprint sprint : programme.getSprints()) {
            List<Activite> activites = filterActivites(sprint, startDate, endDate);
            if (activites != null) {
                for (Activite act : activites) {
                    efAddActivityCard(document, act,
                            EF_NAVY, EF_GOLD, EF_BORDER, EF_MUTED, EF_DARK, WHITE, EF_BG);
                }
            }
        }

        document.createParagraph().setSpacingAfter(120);

        // ── SECTION IV – CONCLUSION ET RECOMMANDATIONS ────────────────────────
        efAddSectionHeader(document, "IV", "Conclusion et Recommandations",
                EF_NAVY, EF_GOLD);

        // Conclusion box: gold left border + EF_BG
        XWPFTable concBox = document.createTable(1, 1);
        docxRemoveTblBorders(concBox);
        docxSetTblOuterBorder(concBox, EF_BORDER);
        concBox.setWidth("100%");
        XWPFTableCell concCell = concBox.getRow(0).getCell(0);
        docxSetCellBg(concCell, EF_BG);
        docxSetCellLeftBorder(concCell, EF_GOLD, "18");
        XWPFParagraph concP = concCell.getParagraphs().get(0);
        concP.setSpacingBefore(160);
        concP.setSpacingAfter(160);
        concP.setIndentationLeft(200);
        XWPFRun concR = concP.createRun();
        concR.setText(rapport.getConclusionRecommandations() != null
                ? rapport.getConclusionRecommandations()
                : "Aucune conclusion enregistrée.");
        concR.setFontSize(10);
        concR.setColor(EF_DARK);

        // Timestamp footer
        XWPFParagraph footP = document.createParagraph();
        footP.setAlignment(ParagraphAlignment.RIGHT);
        footP.setSpacingBefore(200);
        XWPFRun footR = footP.createRun();
        footR.setText("Rapport généré le "
                + java.time.LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                + "  —  RedBoost Platform");
        footR.setFontSize(8);
        footR.setItalic(true);
        footR.setColor(EF_MUTED);
    }

    // =========================================================================
    //  STANDARD TEMPLATE – private helpers
    // =========================================================================

    /** Colored horizontal rule (thin filled table row). */
    private void docxAddColoredRule(XWPFDocument doc, String hexColor, int heightTwips) {
        XWPFTable rule = doc.createTable(1, 1);
        docxRemoveTblBorders(rule);
        rule.setWidth("100%");
        XWPFTableCell cell = rule.getRow(0).getCell(0);
        docxSetCellBg(cell, hexColor);
        docxSetRowHeight(rule.getRow(0), heightTwips);
        XWPFParagraph p = cell.getParagraphs().get(0);
        p.setSpacingBefore(0);
        p.setSpacingAfter(0);
        doc.createParagraph().setSpacingAfter(40);
    }

    /** Section header: [badge cell][title cell] — mirrors PDF addSectionHeader(). */
    private void stdAddSectionHeader(XWPFDocument doc, String number, String title,
                                     String badgeColor, String headerColor) {
        XWPFTable t = doc.createTable(1, 2);
        docxRemoveTblBorders(t);
        t.setWidth("100%");

        // Badge
        XWPFTableCell badge = t.getRow(0).getCell(0);
        docxSetCellWidth(badge, 700);
        docxSetCellBg(badge, badgeColor);
        docxSetCellVAlign(badge, "center");
        XWPFParagraph bp = badge.getParagraphs().get(0);
        bp.setAlignment(ParagraphAlignment.CENTER);
        bp.setSpacingBefore(140);
        bp.setSpacingAfter(140);
        XWPFRun br = bp.createRun();
        br.setText(number);
        br.setBold(true);
        br.setFontSize(9);
        br.setColor("FFFFFF");

        // Title
        XWPFTableCell titleCell = t.getRow(0).getCell(1);
        docxSetCellBg(titleCell, headerColor);
        docxSetCellVAlign(titleCell, "center");
        XWPFParagraph tp = titleCell.getParagraphs().get(0);
        tp.setSpacingBefore(140);
        tp.setSpacingAfter(140);
        tp.setIndentationLeft(200);
        XWPFRun tr = tp.createRun();
        tr.setText(title);
        tr.setBold(true);
        tr.setFontSize(13);
        tr.setColor("FFFFFF");

        doc.createParagraph().setSpacingAfter(80);
    }

    /** Sub-section: bold heading + accent underline + body — mirrors addSubSection(). */
    private void stdAddSubSection(XWPFDocument doc, String heading, String body,
                                  String headingColor, String accentColor, String darkColor) {
        XWPFParagraph h = doc.createParagraph();
        h.setSpacingBefore(140);
        h.setSpacingAfter(40);
        XWPFRun hr = h.createRun();
        hr.setText(heading);
        hr.setBold(true);
        hr.setFontSize(11);
        hr.setColor(headingColor);

        // Thin accent underline
        docxAddColoredRule(doc, accentColor, 30);

        XWPFParagraph p = doc.createParagraph();
        p.setSpacingBefore(60);
        p.setSpacingAfter(100);
        XWPFRun r = p.createRun();
        r.setText(body != null && !body.isBlank() ? body : "Non renseigné.");
        r.setFontSize(10);
        r.setColor(darkColor);
    }

    /** Two-column identity table — mirrors addIdentityTable(). */
    private void stdAddIdentityTable(XWPFDocument doc, String[][] rows,
                                     String labelBg, String altLabelBg,
                                     String altValueBg, String borderColor, String darkColor) {
        XWPFTable t = doc.createTable(rows.length, 2);
        docxSetTblOuterBorder(t, borderColor);

        for (int i = 0; i < rows.length; i++) {
            boolean alt = (i % 2 == 1);
            XWPFTableRow row = t.getRow(i);

            XWPFTableCell lc = row.getCell(0);
            docxSetCellWidth(lc, 2800);
            docxSetCellBg(lc, alt ? altLabelBg : labelBg);
            docxSetCellBottomBorder(lc, borderColor);
            XWPFParagraph lp = lc.getParagraphs().get(0);
            lp.setSpacingBefore(120);
            lp.setSpacingAfter(120);
            lp.setIndentationLeft(160);
            XWPFRun lr = lp.createRun();
            lr.setText(rows[i][0]);
            lr.setBold(true);
            lr.setFontSize(10);
            lr.setColor(darkColor);

            XWPFTableCell vc = row.getCell(1);
            docxSetCellWidth(vc, 6560);
            docxSetCellBg(vc, alt ? altValueBg : "FFFFFF");
            docxSetCellBottomBorder(vc, borderColor);
            docxSetCellLeftBorder(vc, borderColor, "4");
            XWPFParagraph vp = vc.getParagraphs().get(0);
            vp.setSpacingBefore(120);
            vp.setSpacingAfter(120);
            vp.setIndentationLeft(160);
            XWPFRun vr = vp.createRun();
            vr.setText(rows[i][1] != null ? rows[i][1] : "–");
            vr.setFontSize(10);
            vr.setColor(darkColor);
        }
    }

    /** Objectif block: left-bordered header + nested specifiques — mirrors addObjectifBlock(). */
    private void stdAddObjectifBlock(XWPFDocument doc, ObjectifGlobal og,
                                     String primaryColor, String bgColor,
                                     String darkColor, String mutedColor) {
        XWPFParagraph ogP = doc.createParagraph();
        ogP.setSpacingBefore(140);
        ogP.setSpacingAfter(40);
        setParagraphLeftBorder(ogP, primaryColor, STBorder.SINGLE, "12");
        setParagraphShading(ogP, bgColor);
        ogP.setIndentationLeft(160);
        XWPFRun ogR = ogP.createRun();
        ogR.setText("Objectif Global : " + og.getNom());
        ogR.setBold(true);
        ogR.setFontSize(11);
        ogR.setColor(primaryColor);

        if (og.getDescription() != null && !og.getDescription().isBlank()) {
            XWPFParagraph descP = doc.createParagraph();
            descP.setIndentationLeft(360);
            descP.setSpacingBefore(60);
            descP.setSpacingAfter(60);
            XWPFRun descR = descP.createRun();
            descR.setText(og.getDescription());
            descR.setFontSize(10);
            descR.setColor(darkColor);
        }

        for (ObjectifSpecifique os : og.getObjectifsSpecifiques()) {
            XWPFParagraph osP = doc.createParagraph();
            osP.setIndentationLeft(360);
            osP.setSpacingBefore(80);
            XWPFRun osR = osP.createRun();
            osR.setText("  ▸  Objectif Spécifique : " + os.getNom());
            osR.setBold(true);
            osR.setFontSize(10);
            osR.setColor(darkColor);

            for (Resultat res : os.getResultats()) {
                XWPFParagraph resP = doc.createParagraph();
                resP.setIndentationLeft(720);
                resP.setSpacingBefore(40);
                XWPFRun resR = resP.createRun();
                resR.setText("•  Résultat : " + res.getNom());
                resR.setFontSize(10);
                resR.setColor(darkColor);
            }
            for (ResultatTransversal rt : os.getResultatsTransversaux()) {
                XWPFParagraph rtP = doc.createParagraph();
                rtP.setIndentationLeft(720);
                rtP.setSpacingBefore(40);
                XWPFRun rtR = rtP.createRun();
                rtR.setText("◦  Résultat Transversal : " + rt.getNom());
                rtR.setFontSize(9);
                rtR.setItalic(true);
                rtR.setColor(mutedColor);
            }
        }
        doc.createParagraph().setSpacingAfter(60);
    }

    /** Sprint block — mirrors addSprintBlock(). */
    private void stdAddSprintBlock(XWPFDocument doc, Sprint sprint,
                                   LocalDate startDate, LocalDate endDate,
                                   String primaryColor, String primaryLightColor,
                                   String accentColor, String mutedColor,
                                   String borderColor, String darkColor, String rowAltColor) {
        // Sprint header: left border + pale teal bg
        XWPFParagraph sprintP = doc.createParagraph();
        sprintP.setSpacingBefore(180);
        sprintP.setSpacingAfter(40);
        setParagraphLeftBorder(sprintP, primaryColor, STBorder.SINGLE, "18");
        setParagraphShading(sprintP, primaryLightColor);
        sprintP.setIndentationLeft(160);
        XWPFRun sprintR = sprintP.createRun();
        sprintR.setText("  SPRINT  :  " + sprint.getNom().toUpperCase());
        sprintR.setBold(true);
        sprintR.setFontSize(11);
        sprintR.setColor(primaryColor);

        if (sprint.getDescription() != null && !sprint.getDescription().isBlank()) {
            XWPFParagraph descP = doc.createParagraph();
            descP.setIndentationLeft(360);
            descP.setSpacingBefore(60);
            descP.setSpacingAfter(80);
            XWPFRun descR = descP.createRun();
            descR.setText(sprint.getDescription());
            descR.setFontSize(10);
            descR.setColor(darkColor);
        }

        List<Activite> activites = filterActivites(sprint, startDate, endDate);
        if (activites == null || activites.isEmpty()) {
            XWPFParagraph noP = doc.createParagraph();
            noP.setIndentationLeft(360);
            XWPFRun noR = noP.createRun();
            noR.setText("Aucune activité enregistrée"
                    + (startDate != null ? " dans cette période." : "."));
            noR.setItalic(true);
            noR.setColor(mutedColor);
            return;
        }

        XWPFParagraph actLabel = doc.createParagraph();
        actLabel.setIndentationLeft(360);
        actLabel.setSpacingBefore(100);
        actLabel.setSpacingAfter(60);
        XWPFRun actLR = actLabel.createRun();
        actLR.setText("Activités Réalisées");
        actLR.setBold(true);
        actLR.setFontSize(10);
        actLR.setColor(darkColor);

        for (Activite act : activites) {
            stdAddActivityCard(doc, act, borderColor, darkColor, mutedColor,
                    primaryColor, rowAltColor);
        }
    }

    /** Activity card: bordered box with KPIs/tasks — mirrors addActiviteRow(). */
    private void stdAddActivityCard(XWPFDocument doc, Activite act,
                                    String borderColor, String darkColor, String mutedColor,
                                    String primaryColor, String rowAltColor) {
        XWPFTable t = doc.createTable(1, 1);
        docxRemoveTblBorders(t);
        docxSetTblOuterBorder(t, borderColor);
        t.setWidth("96%");

        XWPFTableCell cell = t.getRow(0).getCell(0);

        // Activity name (first paragraph = existing default)
        XWPFParagraph nameP = cell.getParagraphs().get(0);
        nameP.setSpacingBefore(100);
        nameP.setSpacingAfter(40);
        nameP.setIndentationLeft(100);
        XWPFRun nameR = nameP.createRun();
        nameR.setText("▸  " + act.getNom());
        nameR.setBold(true);
        nameR.setFontSize(10);
        nameR.setColor(darkColor);

        // Meta: objectif | type
        if (act.getObjectif() != null || act.getType() != null) {
            String meta = (act.getObjectif() != null ? "Objectif : " + act.getObjectif() : "")
                    + (act.getObjectif() != null && act.getType() != null ? "   |   " : "")
                    + (act.getType() != null ? "Type : " + act.getType() : "");
            XWPFParagraph metaP = cell.addParagraph();
            metaP.setSpacingAfter(60);
            metaP.setIndentationLeft(100);
            XWPFRun metaR = metaP.createRun();
            metaR.setText(meta);
            metaR.setItalic(true);
            metaR.setFontSize(9);
            metaR.setColor(mutedColor);
        }

        // KPIs
        if (act.getKpis() != null && !act.getKpis().isEmpty()) {
            XWPFParagraph kpiLabel = cell.addParagraph();
            kpiLabel.setIndentationLeft(100);
            kpiLabel.setSpacingBefore(80);
            kpiLabel.setSpacingAfter(40);
            XWPFRun kpiLR = kpiLabel.createRun();
            kpiLR.setText("Indicateurs :");
            kpiLR.setBold(true);
            kpiLR.setFontSize(10);
            kpiLR.setColor(darkColor);

            for (ActiviteKpi kpi : act.getKpis()) {
                if (kpi.getKpi() == null) continue;
                XWPFParagraph kpiP = cell.addParagraph();
                kpiP.setIndentationLeft(260);
                kpiP.setSpacingBefore(40);
                XWPFRun kpiR = kpiP.createRun();
                kpiR.setText("–  " + kpi.getKpi().getNom() + " :  "
                        + (kpi.getValeurActuelle() != null ? kpi.getValeurActuelle() : "N/A"));
                kpiR.setFontSize(10);
                kpiR.setColor(darkColor);
            }
        }

        // Tasks
        if (act.getTaches() != null && !act.getTaches().isEmpty()) {
            XWPFParagraph tLabel = cell.addParagraph();
            tLabel.setIndentationLeft(100);
            tLabel.setSpacingBefore(80);
            tLabel.setSpacingAfter(40);
            XWPFRun tLR = tLabel.createRun();
            tLR.setText("Tâches :");
            tLR.setBold(true);
            tLR.setFontSize(10);
            tLR.setColor(darkColor);

            for (Tache tache : act.getTaches()) {
                XWPFParagraph tP = cell.addParagraph();
                tP.setIndentationLeft(260);
                tP.setSpacingBefore(40);
                String kpiSummary = (tache.getTachesKpis() != null && !tache.getTachesKpis().isEmpty())
                        ? tache.getTachesKpis().stream()
                        .filter(tk -> tk.getKpi() != null)
                        .map(tk -> tk.getKpi().getNom() + ": "
                                + (tk.getValeurActuelle() != null
                                ? tk.getValeurActuelle() : "N/A"))
                        .collect(Collectors.joining(", "))
                        : "–";
                XWPFRun tR = tP.createRun();
                tR.setText("–  " + tache.getTitre() + "  —  KPIs : " + kpiSummary);
                tR.setFontSize(10);
                tR.setColor(darkColor);
            }
        }

        // Bottom padding
        cell.addParagraph().setSpacingAfter(80);
        doc.createParagraph().setSpacingAfter(60);
    }

    // =========================================================================
    //  EXPERTISE FRANCE TEMPLATE – private helpers
    // =========================================================================

    /** EF section header: [gold badge][navy title] — mirrors addEFSectionHeader(). */
    private void efAddSectionHeader(XWPFDocument doc, String number, String title,
                                    String navyColor, String goldColor) {
        XWPFTable t = doc.createTable(1, 2);
        docxRemoveTblBorders(t);
        t.setWidth("100%");

        // Gold badge
        XWPFTableCell numCell = t.getRow(0).getCell(0);
        docxSetCellWidth(numCell, 700);
        docxSetCellBg(numCell, goldColor);
        docxSetCellVAlign(numCell, "center");
        XWPFParagraph np = numCell.getParagraphs().get(0);
        np.setAlignment(ParagraphAlignment.CENTER);
        np.setSpacingBefore(140);
        np.setSpacingAfter(140);
        XWPFRun nr = np.createRun();
        nr.setText(number);
        nr.setBold(true);
        nr.setFontSize(11);
        nr.setColor("FFFFFF");

        // Navy title
        XWPFTableCell titleCell = t.getRow(0).getCell(1);
        docxSetCellBg(titleCell, navyColor);
        docxSetCellVAlign(titleCell, "center");
        XWPFParagraph tp = titleCell.getParagraphs().get(0);
        tp.setSpacingBefore(140);
        tp.setSpacingAfter(140);
        tp.setIndentationLeft(200);
        XWPFRun tr = tp.createRun();
        tr.setText(title);
        tr.setBold(true);
        tr.setFontSize(13);
        tr.setColor("FFFFFF");

        doc.createParagraph().setSpacingAfter(80);
    }

    /** EF sub-section: heading + gold underline + body — mirrors addEFSubSection(). */
    private void efAddSubSection(XWPFDocument doc, String heading, String body,
                                 String headingColor, String goldColor, String darkColor) {
        XWPFParagraph h = doc.createParagraph();
        h.setSpacingBefore(140);
        h.setSpacingAfter(40);
        XWPFRun hr = h.createRun();
        hr.setText(heading);
        hr.setBold(true);
        hr.setFontSize(10);
        hr.setColor(headingColor);

        // Gold underline
        docxAddColoredRule(doc, goldColor, 30);

        XWPFParagraph p = doc.createParagraph();
        p.setSpacingBefore(60);
        p.setSpacingAfter(100);
        XWPFRun r = p.createRun();
        r.setText(body != null && !body.isBlank() ? body : "N/A");
        r.setFontSize(10);
        r.setColor(darkColor);
    }

    /** EF letter sub-section (A. / B.) — mirrors addEFSubSectionLetter(). */
    private void efAddSubSectionLetter(XWPFDocument doc, String label,
                                       String headingColor, String goldColor) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingBefore(160);
        p.setSpacingAfter(40);
        XWPFRun r = p.createRun();
        r.setText(label);
        r.setBold(true);
        r.setFontSize(10);
        r.setColor(headingColor);

        docxAddColoredRule(doc, goldColor, 30);
    }

    /** EF info table — mirrors addEFTableRow() loop in PDF. */
    private void efAddInfoTable(XWPFDocument doc, String[][] rows,
                                String labelBg, String altLabelBg,
                                String rowAltBg, String borderColor, String darkColor) {
        XWPFTable t = doc.createTable(rows.length, 2);
        docxSetTblOuterBorder(t, borderColor);

        for (int i = 0; i < rows.length; i++) {
            boolean alt = (i % 2 == 1);
            XWPFTableRow row = t.getRow(i);

            XWPFTableCell lc = row.getCell(0);
            docxSetCellWidth(lc, 2800);
            docxSetCellBg(lc, alt ? altLabelBg : labelBg);
            docxSetCellBottomBorder(lc, borderColor);
            XWPFParagraph lp = lc.getParagraphs().get(0);
            lp.setSpacingBefore(120);
            lp.setSpacingAfter(120);
            lp.setIndentationLeft(160);
            XWPFRun lr = lp.createRun();
            lr.setText(rows[i][0]);
            lr.setBold(true);
            lr.setFontSize(10);
            lr.setColor(darkColor);

            XWPFTableCell vc = row.getCell(1);
            docxSetCellWidth(vc, 6560);
            docxSetCellBg(vc, alt ? rowAltBg : "FFFFFF");
            docxSetCellBottomBorder(vc, borderColor);
            docxSetCellLeftBorder(vc, borderColor, "4");
            XWPFParagraph vp = vc.getParagraphs().get(0);
            vp.setSpacingBefore(120);
            vp.setSpacingAfter(120);
            vp.setIndentationLeft(160);
            XWPFRun vr = vp.createRun();
            vr.setText(rows[i][1] != null ? rows[i][1] : "–");
            vr.setFontSize(10);
            vr.setColor(darkColor);
        }
    }

    /**
     * EF activity card — mirrors the PDF activity card:
     *   Row 0 : navy header bar (activity name, white text)
     *   Row 1 : gold accent line (2 pt)
     *   Row 2 : content (description, objectif, KPIs + history)
     */
    private void efAddActivityCard(XWPFDocument doc, Activite act,
                                   String navyColor, String goldColor, String borderColor,
                                   String mutedColor, String darkColor, String whiteColor,
                                   String bgColor) {
        XWPFTable t = doc.createTable(3, 1);
        docxRemoveTblBorders(t);
        docxSetTblOuterBorder(t, borderColor);
        t.setWidth("100%");

        // ── Row 0: navy header ─────────────────────────────────────────────
        XWPFTableCell headerCell = t.getRow(0).getCell(0);
        docxSetCellBg(headerCell, navyColor);
        XWPFParagraph hp = headerCell.getParagraphs().get(0);
        hp.setSpacingBefore(100);
        hp.setSpacingAfter(100);
        hp.setIndentationLeft(160);
        XWPFRun hr = hp.createRun();
        hr.setText("Activité : " + act.getNom());
        hr.setBold(true);
        hr.setFontSize(9);
        hr.setColor(whiteColor);

        // ── Row 1: gold accent line ────────────────────────────────────────
        XWPFTableCell accentCell = t.getRow(1).getCell(0);
        docxSetCellBg(accentCell, goldColor);
        docxSetRowHeight(t.getRow(1), 30);
        XWPFParagraph ap = accentCell.getParagraphs().get(0);
        ap.setSpacingBefore(0);
        ap.setSpacingAfter(0);

        // ── Row 2: content ─────────────────────────────────────────────────
        XWPFTableCell content = t.getRow(2).getCell(0);
        docxSetCellBg(content, bgColor);
        docxSetCellLeftBorder(content, goldColor, "18");

        // Description
        XWPFParagraph descP = content.getParagraphs().get(0);
        descP.setSpacingBefore(100);
        descP.setIndentationLeft(100);
        XWPFRun descR = descP.createRun();
        descR.setText("Description : "
                + (act.getDescription() != null ? act.getDescription() : "N/A"));
        descR.setFontSize(10);
        descR.setColor(darkColor);

        // Objectif/Résultat rattaché
        XWPFParagraph objP = content.addParagraph();
        objP.setIndentationLeft(100);
        objP.setSpacingAfter(80);
        XWPFRun objR = objP.createRun();
        objR.setText("Objectif/Résultat rattaché : "
                + (act.getObjectif() != null ? act.getObjectif() : "N/A"));
        objR.setItalic(true);
        objR.setFontSize(9);
        objR.setColor(mutedColor);

        // KPIs + history
        if (act.getKpis() != null && !act.getKpis().isEmpty()) {
            XWPFParagraph kpiTitle = content.addParagraph();
            kpiTitle.setIndentationLeft(100);
            kpiTitle.setSpacingBefore(80);
            kpiTitle.setSpacingAfter(40);
            XWPFRun kpiTR = kpiTitle.createRun();
            kpiTR.setText("Indicateurs (KPIs) et Évolution :");
            kpiTR.setBold(true);
            kpiTR.setFontSize(10);
            kpiTR.setColor(darkColor);

            for (ActiviteKpi ak : act.getKpis()) {
                if (ak.getKpi() == null) continue;

                // KPI label + current value
                XWPFParagraph kpiP = content.addParagraph();
                kpiP.setIndentationLeft(260);
                kpiP.setSpacingBefore(60);
                XWPFRun kpiR = kpiP.createRun();
                kpiR.setText("  •  " + ak.getKpi().getNom() + "  —  Actuel : "
                        + (ak.getValeurActuelle() != null ? ak.getValeurActuelle() : "N/A"));
                kpiR.setFontSize(10);
                kpiR.setColor(darkColor);

                // History rows (date / value)
                List<ActiviteKpiHistory> history =
                        activiteKpiHistoryRepository
                                .findByActiviteKpiIdOrderByChangedAtAsc(ak.getId());
                if (history != null && !history.isEmpty()) {
                    // Mini history header
                    XWPFParagraph histHead = content.addParagraph();
                    histHead.setIndentationLeft(440);
                    histHead.setSpacingBefore(30);
                    XWPFRun hhR = histHead.createRun();
                    hhR.setText("Date                           Valeur");
                    hhR.setFontSize(8);
                    hhR.setBold(true);
                    hhR.setColor(navyColor);

                    for (ActiviteKpiHistory hEntry : history) {
                        XWPFParagraph histP = content.addParagraph();
                        histP.setIndentationLeft(440);
                        histP.setSpacingBefore(20);
                        XWPFRun histR = histP.createRun();
                        histR.setText(hEntry.getChangedAt()
                                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                                + "    " + hEntry.getValeurActuelle());
                        histR.setFontSize(8);
                        histR.setColor(mutedColor);
                    }
                } else {
                    XWPFParagraph noHistP = content.addParagraph();
                    noHistP.setIndentationLeft(440);
                    XWPFRun noHistR = noHistP.createRun();
                    noHistR.setText("(Pas d'historique disponible)");
                    noHistR.setItalic(true);
                    noHistR.setFontSize(9);
                    noHistR.setColor(mutedColor);
                }
            }
        } else {
            XWPFParagraph noKpiP = content.addParagraph();
            noKpiP.setIndentationLeft(100);
            XWPFRun noKpiR = noKpiP.createRun();
            noKpiR.setText("Aucun KPI associé.");
            noKpiR.setItalic(true);
            noKpiR.setFontSize(9);
            noKpiR.setColor(mutedColor);
        }

        content.addParagraph().setSpacingAfter(100);
        doc.createParagraph().setSpacingAfter(80);
    }

    // =========================================================================
    //  LOW-LEVEL POI HELPERS  (shared by both templates)
    // =========================================================================

    /** Strip all borders from a table (including inside lines). */
    private void docxRemoveTblBorders(XWPFTable table) {
        CTTblPr tblPr = table.getCTTbl().getTblPr() != null
                ? table.getCTTbl().getTblPr()
                : table.getCTTbl().addNewTblPr();
        CTTblBorders b = tblPr.isSetTblBorders()
                ? tblPr.getTblBorders()
                : tblPr.addNewTblBorders();
        CTBorder[] borders = {
                b.isSetTop()    ? b.getTop()     : b.addNewTop(),
                b.isSetBottom() ? b.getBottom()  : b.addNewBottom(),
                b.isSetLeft()   ? b.getLeft()    : b.addNewLeft(),
                b.isSetRight()  ? b.getRight()   : b.addNewRight(),
                b.isSetInsideH()? b.getInsideH() : b.addNewInsideH(),
                b.isSetInsideV()? b.getInsideV() : b.addNewInsideV()
        };
        for (CTBorder border : borders) border.setVal(STBorder.NIL);
    }

    /** Set a thin outer border on a table (no inner lines). */
    private void docxSetTblOuterBorder(XWPFTable table, String hexColor) {
        CTTblPr tblPr = table.getCTTbl().getTblPr() != null
                ? table.getCTTbl().getTblPr()
                : table.getCTTbl().addNewTblPr();
        CTTblBorders b = tblPr.isSetTblBorders()
                ? tblPr.getTblBorders()
                : tblPr.addNewTblBorders();
        for (CTBorder border : new CTBorder[]{
                b.isSetTop()    ? b.getTop()    : b.addNewTop(),
                b.isSetBottom() ? b.getBottom() : b.addNewBottom(),
                b.isSetLeft()   ? b.getLeft()   : b.addNewLeft(),
                b.isSetRight()  ? b.getRight()  : b.addNewRight()
        }) {
            border.setVal(STBorder.SINGLE);
            border.setSz(new BigInteger("4"));
            border.setColor(hexColor);
        }
        CTBorder ih = b.isSetInsideH() ? b.getInsideH() : b.addNewInsideH();
        ih.setVal(STBorder.NIL);
        CTBorder iv = b.isSetInsideV() ? b.getInsideV() : b.addNewInsideV();
        iv.setVal(STBorder.NIL);
    }

    /** Set cell background (fill). */
    private void docxSetCellBg(XWPFTableCell cell, String hexColor) {
        CTTcPr tcPr = cell.getCTTc().isSetTcPr()
                ? cell.getCTTc().getTcPr()
                : cell.getCTTc().addNewTcPr();
        CTShd shd = tcPr.isSetShd() ? tcPr.getShd() : tcPr.addNewShd();
        shd.setVal(STShd.CLEAR);
        shd.setColor("auto");
        shd.setFill(hexColor);
    }

    /** Set explicit cell width in twips (1/20 pt). */
    private void docxSetCellWidth(XWPFTableCell cell, int twips) {
        CTTcPr tcPr = cell.getCTTc().isSetTcPr()
                ? cell.getCTTc().getTcPr()
                : cell.getCTTc().addNewTcPr();
        CTTblWidth w = tcPr.isSetTcW() ? tcPr.getTcW() : tcPr.addNewTcW();
        w.setType(STTblWidth.DXA);
        w.setW(new BigInteger(String.valueOf(twips)));
    }

    /** Set exact row height in twips. */
    /** Set exact row height in twips. */
    private void docxSetRowHeight(XWPFTableRow row, int twips) {
        CTTrPr trPr = row.getCtRow().isSetTrPr()
                ? row.getCtRow().getTrPr()
                : row.getCtRow().addNewTrPr();
        // CTTrPr uses an array for trHeight; always add a fresh one
        CTHeight ht = trPr.sizeOfTrHeightArray() > 0
                ? trPr.getTrHeightArray(0)
                : trPr.addNewTrHeight();
        ht.setVal(new BigInteger(String.valueOf(twips)));
        ht.setHRule(STHeightRule.EXACT);
    }
    /** Set vertical alignment inside a cell ("center" or "top"). */
    private void docxSetCellVAlign(XWPFTableCell cell, String align) {
        CTTcPr tcPr = cell.getCTTc().isSetTcPr()
                ? cell.getCTTc().getTcPr()
                : cell.getCTTc().addNewTcPr();
        CTVerticalJc vJc = tcPr.isSetVAlign() ? tcPr.getVAlign() : tcPr.addNewVAlign();
        vJc.setVal("center".equalsIgnoreCase(align)
                ? STVerticalJc.CENTER : STVerticalJc.TOP);
    }

    /** Bottom border only on a cell (all other sides nil). */
    private void docxSetCellBottomBorder(XWPFTableCell cell, String hexColor) {
        CTTcPr tcPr = cell.getCTTc().isSetTcPr()
                ? cell.getCTTc().getTcPr()
                : cell.getCTTc().addNewTcPr();
        CTTcBorders b = tcPr.isSetTcBorders() ? tcPr.getTcBorders() : tcPr.addNewTcBorders();

        CTBorder bottom = b.isSetBottom() ? b.getBottom() : b.addNewBottom();
        bottom.setVal(STBorder.SINGLE);
        bottom.setSz(new BigInteger("4"));
        bottom.setColor(hexColor);

        for (CTBorder side : new CTBorder[]{
                b.isSetTop()   ? b.getTop()   : b.addNewTop(),
                b.isSetLeft()  ? b.getLeft()  : b.addNewLeft(),
                b.isSetRight() ? b.getRight() : b.addNewRight()
        }) side.setVal(STBorder.NIL);
    }

    /** Thick left border on a cell (accent) — all other sides nil. */
    private void docxSetCellLeftBorder(XWPFTableCell cell, String hexColor, String sizeTwip) {
        CTTcPr tcPr = cell.getCTTc().isSetTcPr()
                ? cell.getCTTc().getTcPr()
                : cell.getCTTc().addNewTcPr();
        CTTcBorders b = tcPr.isSetTcBorders() ? tcPr.getTcBorders() : tcPr.addNewTcBorders();

        CTBorder left = b.isSetLeft() ? b.getLeft() : b.addNewLeft();
        left.setVal(STBorder.SINGLE);
        left.setSz(new BigInteger(sizeTwip));
        left.setColor(hexColor);
    }

}