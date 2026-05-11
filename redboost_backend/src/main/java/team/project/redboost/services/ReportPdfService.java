package team.project.redboost.services;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.RapportMissionCoach;
import team.project.redboost.entities.RapportSessionCoach;

import java.awt.*;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportPdfService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String generateAndSaveSessionReport(RapportSessionCoach r) {
        String fileName = "SessionReport_" + r.getId() + "_" + UUID.randomUUID().toString().substring(0, 8) + ".pdf";
        File dir = new File(uploadDir + "/reports/sessions");
        if (!dir.exists()) dir.mkdirs();

        File file = new File(dir, fileName);
        Document document = new Document(PageSize.A4);

        try (FileOutputStream fos = new FileOutputStream(file)) {
            PdfWriter.getInstance(document, fos);
            document.open();

            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new Color(36, 92, 103));
            Paragraph title = new Paragraph("Rapport de Session de Coaching", fontTitle);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            addInfoRow(document, "Bénéficiaire", r.getBeneficiaireNom());
            addInfoRow(document, "Entreprise", r.getEntrepriseNom());
            addInfoRow(document, "Coach", r.getCoachNom());
            addInfoRow(document, "Date Session", r.getDateSession());
            addInfoRow(document, "Numéro Session", r.getNumeroSession());
            if (r.getThematique() != null) {
                addInfoRow(document, "Thématique", r.getThematique().getNom());
            }
            document.add(new Paragraph(" "));
            document.add(new Paragraph("----------------------------------------------------------------------------------------------------------------------------------"));
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
            Font fontSign = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            document.add(new Paragraph("Validé par : " + r.getValidationNom() + " le " + r.getValidationDate(), fontSign));

            document.close();
            return file.getAbsolutePath();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public String generateAndSaveMissionReport(RapportMissionCoach r) {
        String fileName = "MissionReport_" + r.getId() + "_" + UUID.randomUUID().toString().substring(0, 8) + ".pdf";
        File dir = new File(uploadDir + "/reports/missions");
        if (!dir.exists()) dir.mkdirs();

        File file = new File(dir, fileName);
        Document document = new Document(PageSize.A4);

        try (FileOutputStream fos = new FileOutputStream(file)) {
            PdfWriter.getInstance(document, fos);
            document.open();

            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new Color(139, 92, 246));
            Paragraph title = new Paragraph("Rapport de Mission de Coaching", fontTitle);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            addInfoRow(document, "Programme", r.getProgramme() != null ? r.getProgramme().getNom() : "");
            if (r.getThematique() != null) {
                addInfoRow(document, "Thématique", r.getThematique().getNom());
            }
            addInfoRow(document, "Coach", r.getCoach() != null ? (r.getCoach().getFirstName() + " " + r.getCoach().getLastName()) : "");
            addInfoRow(document, "Période", "Du " + r.getDateDebut() + " au " + r.getDateFin());
            document.add(new Paragraph(" "));
            document.add(new Paragraph("----------------------------------------------------------------------------------------------------------------------------------"));
            document.add(new Paragraph(" "));

            addSection(document, "Introduction", r.getIntroduction());
            addSection(document, "Présentation de la Phase", r.getPresentationPhase());
            addSection(document, "Déroulement de l'Accompagnement", r.getDeroulementAccompagnement());
            addSection(document, "Résultats Obtenus", r.getResultatsObtenus());
            addSection(document, "Suivi des Bénéficiaires", r.getSuiviBeneficiaires());
            addSection(document, "Planning des Séances", r.getPlanningSeances());
            addSection(document, "Feedback des Bénéficiaires", r.getFeedbackBeneficiaires());
            addSection(document, "Analyse et Leçons", r.getAnalyseLecons());
            addSection(document, "Recommandations", r.getRecommandationsEtapes());
            addSection(document, "Conclusion", r.getConclusion());

            document.close();
            return file.getAbsolutePath();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private void addInfoRow(Document document, String label, String value) throws Exception {
        if (value == null) value = "";
        Font fontLabel = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Font fontValue = FontFactory.getFont(FontFactory.HELVETICA, 11);
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + " : ", fontLabel));
        p.add(new Chunk(value, fontValue));
        document.add(p);
    }

    private void addSection(Document document, String title, String content) throws Exception {
        if (content == null || content.isEmpty()) return;
        Font fontSecTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(36, 92, 103));
        document.add(new Paragraph(title, fontSecTitle));
        document.add(new Paragraph(content, FontFactory.getFont(FontFactory.HELVETICA, 11)));
        document.add(new Paragraph(" "));
    }
}
