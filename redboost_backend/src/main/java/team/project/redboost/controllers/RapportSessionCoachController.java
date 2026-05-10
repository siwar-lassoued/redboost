package team.project.redboost.controllers;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.RapportSessionCoach;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.RapportSessionCoachRepository;
import team.project.redboost.repositories.UserRepository;
import team.project.redboost.entities.ThematiqueCoaching;
import team.project.redboost.repositories.ThematiqueRepository;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rapports-session-coach")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RapportSessionCoachController {

    private final RapportSessionCoachRepository repository;
    private final UserRepository userRepository;
    private final ThematiqueRepository thematiqueRepository;

    @GetMapping("/coach/{coachId}")
    public ResponseEntity<List<RapportSessionCoach>> getHistory(@PathVariable Long coachId) {
        return ResponseEntity.ok(repository.findByCoachIdOrderByDateCreationDesc(coachId));
    }

    @GetMapping("/coach/{coachId}/thematique/{thematiqueId}")
    public ResponseEntity<List<RapportSessionCoach>> getByThematique(
            @PathVariable Long coachId, 
            @PathVariable Long thematiqueId) {
        return ResponseEntity.ok(repository.findByCoachIdAndThematiqueIdOrderByDateCreationDesc(coachId, thematiqueId));
    }

    @GetMapping("/ids")
    public ResponseEntity<List<RapportSessionCoach>> getByIds(@RequestParam List<Long> ids) {
        return ResponseEntity.ok(repository.findAllById(ids));
    }

    @PostMapping
    public ResponseEntity<RapportSessionCoach> saveReport(@RequestBody Map<String, Object> payload) {
        Long coachId = Long.valueOf(payload.get("coachId").toString());
        Optional<User> coach = userRepository.findById(coachId);
        
        if (coach.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        User entrepreneur = null;
        if (payload.containsKey("entrepreneurId") && payload.get("entrepreneurId") != null) {
            entrepreneur = userRepository.findById(Long.valueOf(payload.get("entrepreneurId").toString())).orElse(null);
        }

        RapportSessionCoach rapport = new RapportSessionCoach();
        if (payload.containsKey("id") && payload.get("id") != null) {
            Optional<RapportSessionCoach> existing = repository.findById(Long.valueOf(payload.get("id").toString()));
            if (existing.isPresent()) {
                rapport = existing.get();
            }
        }

        rapport.setCoach(coach.get());
        rapport.setEntrepreneur(entrepreneur);
        
        if (payload.containsKey("thematiqueId") && payload.get("thematiqueId") != null) {
            Optional<ThematiqueCoaching> thematique = thematiqueRepository.findById(Long.valueOf(payload.get("thematiqueId").toString()));
            thematique.ifPresent(rapport::setThematique);
        }
        
        rapport.setEntrepriseNom((String) payload.get("entrepriseNom"));
        rapport.setSecteurActivite((String) payload.get("secteurActivite"));
        rapport.setGouvernorat((String) payload.get("gouvernorat"));
        rapport.setBeneficiaireNom((String) payload.get("beneficiaireNom"));
        rapport.setCoachNom((String) payload.get("coachNom"));
        rapport.setTypeSession((String) payload.get("typeSession"));
        rapport.setNumeroSession((String) payload.get("numeroSession"));
        rapport.setDateSession((String) payload.get("dateSession"));
        
        rapport.setObjectifSession((String) payload.get("objectifSession"));
        rapport.setDeroulement((String) payload.get("deroulement"));
        rapport.setApprentissage((String) payload.get("apprentissage"));
        rapport.setAvancementActions((String) payload.get("avancementActions"));
        rapport.setDifficultes((String) payload.get("difficultes"));
        rapport.setRecommandations((String) payload.get("recommandations"));
        rapport.setTravailProchaineSession((String) payload.get("travailProchaineSession"));
        rapport.setSessionNarrative((String) payload.get("sessionNarrative"));
        
        rapport.setSuiviActionsJson((String) payload.get("suiviActionsJson"));
        
        rapport.setValidationNom((String) payload.get("validationNom"));
        rapport.setValidationSignature((String) payload.get("validationSignature"));
        rapport.setValidationDate((String) payload.get("validationDate"));

        if(rapport.getDateCreation() == null) {
            rapport.setDateCreation(LocalDateTime.now());
        }

        return ResponseEntity.ok(repository.save(rapport));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/entrepreneur/{entrepreneurId}/coach/{coachId}/consolidated-pdf")
    public void generateConsolidatedPdf(
            @PathVariable Long entrepreneurId,
            @PathVariable Long coachId,
            HttpServletResponse response) throws Exception {

        List<RapportSessionCoach> rapports = repository.findAll().stream()
                .filter(r -> r.getEntrepreneur() != null && r.getEntrepreneur().getId().equals(entrepreneurId))
                .filter(r -> r.getCoach() != null && r.getCoach().getId().equals(coachId))
                .sorted((r1, r2) -> {
                    try {
                        int n1 = Integer.parseInt(r1.getNumeroSession());
                        int n2 = Integer.parseInt(r2.getNumeroSession());
                        return Integer.compare(n1, n2);
                    } catch (Exception e) {
                        return r1.getDateSession().compareTo(r2.getDateSession());
                    }
                })
                .collect(Collectors.toList());

        if (rapports.isEmpty()) {
            response.sendError(HttpStatus.NOT_FOUND.value(), "Aucun rapport trouvé pour cet entrepreneur.");
            return;
        }

        User entrepreneur = userRepository.findById(entrepreneurId).orElseThrow();
        User coach = userRepository.findById(coachId).orElseThrow();

        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);

        document.open();

        // Header
        Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Color.DARK_GRAY);
        Paragraph title = new Paragraph("Rapport de Coaching Consolidé", fontTitle);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        document.add(new Paragraph(" "));

        Font fontSubTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.GRAY);
        document.add(new Paragraph("Bénéficiaire : " + entrepreneur.getFirstName() + " " + entrepreneur.getLastName(), fontSubTitle));
        document.add(new Paragraph("Coach : " + coach.getFirstName() + " " + coach.getLastName(), fontSubTitle));
        document.add(new Paragraph("Date de génération : " + LocalDateTime.now().toString().substring(0, 10), fontSubTitle));

        document.add(new Paragraph(" "));
        document.add(new Paragraph("----------------------------------------------------------------------------------------------------------------------------------"));
        document.add(new Paragraph(" "));

        for (RapportSessionCoach r : rapports) {
            // New Page for each session if not first
            if (rapports.indexOf(r) > 0) {
                document.newPage();
            }

            Font fontSession = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(36, 92, 103));
            document.add(new Paragraph("Session n°" + r.getNumeroSession() + " - " + r.getDateSession(), fontSession));
            
            if (r.getThematique() != null) {
                document.add(new Paragraph("Thématique : " + r.getThematique().getNom(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            }

            document.add(new Paragraph(" "));

            addSection(document, "Objectif de la session", r.getObjectifSession());
            addSection(document, "Déroulement", r.getDeroulement());
            addSection(document, "Apprentissage / Capacités développées", r.getApprentissage());
            addSection(document, "Avancement des actions", r.getAvancementActions());
            addSection(document, "Difficultés rencontrées", r.getDifficultes());
            addSection(document, "Recommandations du coach", r.getRecommandations());
            addSection(document, "Travail à préparer", r.getTravailProchaineSession());
            addSection(document, "Appréciation globale", r.getSessionNarrative());

            document.add(new Paragraph(" "));
            
            // Signature info
            Font fontSign = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            document.add(new Paragraph("Validé par : " + r.getValidationNom() + " le " + r.getValidationDate(), fontSign));
            document.add(new Paragraph("Signature : " + r.getValidationSignature(), fontSign));
        }

        document.close();

        response.setContentType("application/pdf");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Rapport_Consolide_" + entrepreneur.getLastName() + ".pdf");
        response.getOutputStream().write(out.toByteArray());
    }

    private void addSection(Document document, String title, String content) throws Exception {
        if (content == null || content.isEmpty()) return;
        
        Font fontSecTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, new Color(36, 92, 103));
        Paragraph pTitle = new Paragraph(title, fontSecTitle);
        document.add(pTitle);

        Font fontContent = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
        Paragraph pContent = new Paragraph(content, fontContent);
        pContent.setSpacingAfter(10);
        document.add(pContent);
    }
}
