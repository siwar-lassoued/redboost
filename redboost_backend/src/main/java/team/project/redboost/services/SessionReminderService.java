package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.Session;
import team.project.redboost.repositories.SessionRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Sends reminder emails + in-app notifications for upcoming sessions:
 *   - 24h reminder  → window [NOW+23h30, NOW+24h30] — uses reminder24hSent flag
 *   - 2h  reminder  → window [NOW+01h30, NOW+02h30] — uses reminder2hSent  flag
 *
 * Runs every hour so each window is hit exactly once per session.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SessionReminderService {

    private final SessionRepository   sessionRepository;
    private final NotificationService notificationService;
    private final EmailService         emailService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // ── Rappel 24h ──────────────────────────────────────────────────────────────
    @Scheduled(fixedDelay = 3_600_000, initialDelay = 60_000)
    @Transactional
    public void send24hReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<Session> sessions = sessionRepository.findSessionsInTimeRange(
                now.plusHours(23).plusMinutes(30),
                now.plusHours(24).plusMinutes(30));

        log.info("[Reminder-24h] {} session(s) in window", sessions.size());

        for (Session session : sessions) {
            if (Boolean.TRUE.equals(session.getReminder24hSent())) continue;
            sendReminderEmails(session, "demain");
            session.setReminder24hSent(true);
            sessionRepository.save(session);
        }
    }

    // ── Rappel 2h ───────────────────────────────────────────────────────────────
    @Scheduled(fixedDelay = 3_600_000, initialDelay = 120_000)
    @Transactional
    public void send2hReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<Session> sessions = sessionRepository.findSessionsInTimeRange(
                now.plusHours(1).plusMinutes(30),
                now.plusHours(2).plusMinutes(30));

        log.info("[Reminder-2h] {} session(s) in window", sessions.size());

        for (Session session : sessions) {
            if (Boolean.TRUE.equals(session.getReminder2hSent())) continue;
            sendReminderEmails(session, "dans 2h");
            session.setReminder2hSent(true);
            sessionRepository.save(session);
        }
    }

    // ── Méthode commune ─────────────────────────────────────────────────────────
    private void sendReminderEmails(Session session, String delaiLabel) {
        if (session.getCoach() == null || session.getEntrepreneur() == null) return;

        String title    = session.getTitre() != null ? session.getTitre() : "Coaching";
        String dateStr  = session.getDate().format(DATE_FMT);
        String timeStr  = session.getDate().format(TIME_FMT);
        String meetText = session.getMeetLink() != null
                ? "\n\n🔗 Lien Google Meet : " + session.getMeetLink()
                : "";
        String coachName = session.getCoach().getFirstName()       + " " + session.getCoach().getLastName();
        String entName   = session.getEntrepreneur().getFirstName() + " " + session.getEntrepreneur().getLastName();
        String emoji     = delaiLabel.contains("2h") ? "🔔" : "⏰";

        // Coach ─────────────────────────────────────────────────────────────────
        try {
            notificationService.createAndSendNotification(
                    session.getCoach().getId(),
                    emoji + " Rappel (" + delaiLabel + ") : session \"" + title + "\" avec " + entName + " à " + timeStr,
                    "SESSION_REMINDER", null);

            emailService.sendEmail(session.getCoach().getEmail(),
                    "[RedBoost] " + emoji + " Rappel – Session " + delaiLabel + " à " + timeStr,
                    "Bonjour " + session.getCoach().getFirstName() + ",\n\n" +
                    "Rappel : vous avez une session de coaching " + delaiLabel + ".\n\n" +
                    "📌 Session       : " + title + "\n" +
                    "👤 Entrepreneur  : " + entName + "\n" +
                    "📅 Date & heure  : " + dateStr + " à " + timeStr +
                    meetText +
                    "\n\nBonne session !\nCordialement,\nRedBoost");
        } catch (Exception e) {
            log.warn("[Reminder] Coach {}: {}", session.getCoach().getId(), e.getMessage());
        }

        // Entrepreneur ──────────────────────────────────────────────────────────
        try {
            notificationService.createAndSendNotification(
                    session.getEntrepreneur().getId(),
                    emoji + " Rappel (" + delaiLabel + ") : session \"" + title + "\" avec " + coachName + " à " + timeStr,
                    "SESSION_REMINDER", null);

            emailService.sendEmail(session.getEntrepreneur().getEmail(),
                    "[RedBoost] " + emoji + " Rappel – Session " + delaiLabel + " à " + timeStr,
                    "Bonjour " + session.getEntrepreneur().getFirstName() + ",\n\n" +
                    "Rappel : vous avez une session de coaching " + delaiLabel + ".\n\n" +
                    "📌 Session    : " + title + "\n" +
                    "🎓 Coach      : " + coachName + "\n" +
                    "📅 Date & heure : " + dateStr + " à " + timeStr +
                    meetText +
                    "\n\nBonne session !\nCordialement,\nRedBoost");
        } catch (Exception e) {
            log.warn("[Reminder] Entrepreneur {}: {}", session.getEntrepreneur().getId(), e.getMessage());
        }
    }
}
