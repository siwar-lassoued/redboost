package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatusUpdateService {

    private final ActiviteRepository activiteRepository;
    private final TacheRepository tacheRepository;
    private final MatchingRepository matchingRepository;
    private final ThematiqueRepository thematiqueRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final CandidatureRedstarterRepository candidatureRepository;
    private final ProgrammeRepository programmeRepository;
    private final SessionRepository sessionRepository;
    private final EmailService emailService;

    @Scheduled(cron = "0 0 0 * * ?") // Run every day at midnight
    @Transactional
    public void updateStatusOfPendingItems() {
        LocalDate today = LocalDate.now();

        // Update Activities
        List<Activite> activitiesToUpdate = activiteRepository.findByStatusAndDateDebutLessThanEqual(Activite.StatusActivite.NON_DEMARREE, today);
        for (Activite activite : activitiesToUpdate) {
            activite.setStatus(Activite.StatusActivite.EN_COURS);
            activiteRepository.save(activite);
        }

        // Update Taches
        List<Tache> tachesToUpdate = tacheRepository.findByStatusAndDateDebutLessThanEqual(Tache.StatusTache.NON_DEMARREE, today);
        for (Tache tache : tachesToUpdate) {
            tache.setStatus(Tache.StatusTache.EN_COURS);
            tacheRepository.save(tache);
        }
    }

    // ─── Matching Closure: VALIDE → TERMINE when thematique expires ───

    @Scheduled(cron = "0 30 0 * * ?") // Run at 00:30 every day
    @Transactional
    public void closeExpiredMatchings() {
        List<Matching> activeMatchings = matchingRepository.findAllValide();
        LocalDate today = LocalDate.now();
        int closed = 0;

        for (Matching m : activeMatchings) {
            if (m.getThematiqueId() == null) continue;

            thematiqueRepository.findById(m.getThematiqueId()).ifPresent(thematique -> {
                if (thematique.getDateFin() != null && thematique.getDateFin().isBefore(today)) {
                    m.setStatut(Matching.StatutMatching.TERMINE);
                    m.setDateFinReelle(LocalDateTime.now());
                    matchingRepository.save(m);

                    // Notify both parties
                    notifyMatchingTermine(m);
                    log.info("Matching {} fermé : thématique {} expirée", m.getId(), thematique.getNom());
                }
            });
        }

        if (closed > 0) {
            log.info("Scheduler: {} matchings fermés (thématiques expirées)", closed);
        }
    }

    private void notifyMatchingTermine(Matching m) {
        try {
            User coach = userRepository.findById(m.getCoachId()).orElse(null);
            User entUser = userRepository.findById(m.getEntrepreneurId()).orElse(null);
            Long entrepreneurUserId = entUser != null ? entUser.getId() : null;
            String entrepreneurName = entUser != null ? (entUser.getFirstName() + " " + entUser.getLastName()) : "Entrepreneur";

            String programmeName = "";
            programmeRepository.findById(m.getProgrammeId()).ifPresent(p -> {});
            Programme prog = programmeRepository.findById(m.getProgrammeId()).orElse(null);
            if (prog != null) programmeName = prog.getNom();

            if (coach != null) {
                notificationService.createAndSendNotification(
                    coach.getId(),
                    "Votre accompagnement avec " + entrepreneurName + " est terminé — Programme " + programmeName,
                    "MATCHING_TERMINE",
                    m.getId()
                );
            }
            if (entrepreneurUserId != null) {
                String coachName = coach != null ? (coach.getFirstName() + " " + coach.getLastName()) : "Coach";
                notificationService.createAndSendNotification(
                    entrepreneurUserId,
                    "Votre accompagnement avec " + coachName + " est terminé — Programme " + programmeName,
                    "MATCHING_TERMINE",
                    m.getId()
                );
            }
        } catch (Exception e) {
            log.error("Erreur notification matching terminé {}: {}", m.getId(), e.getMessage());
        }
    }

    // ─── Session Reminders: 24h and 2h before ───

    @Scheduled(cron = "0 0 * * * ?") // Run every hour
    @Transactional
    public void sendSessionReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime in24h = now.plusHours(24);
        LocalDateTime in2h = now.plusHours(2);

        // Find sessions happening in the next 24-25h window (not yet reminded)
        List<Session> sessions24h = sessionRepository.findSessionsInTimeRange(
            now.plusHours(23), now.plusHours(25));
        for (Session s : sessions24h) {
            if (Boolean.TRUE.equals(s.getReminder24hSent())) continue;
            sendReminder(s, "dans 24 heures");
            s.setReminder24hSent(true);
            sessionRepository.save(s);
        }

        // Find sessions happening in the next 1-3h window (not yet reminded)
        List<Session> sessions2h = sessionRepository.findSessionsInTimeRange(
            now.plusHours(1), now.plusHours(3));
        for (Session s : sessions2h) {
            if (Boolean.TRUE.equals(s.getReminder2hSent())) continue;
            sendReminder(s, "dans 2 heures");
            s.setReminder2hSent(true);
            sessionRepository.save(s);
        }
    }

    private void sendReminder(Session session, String timing) {
        try {
            User coach = session.getCoach();
            User entrepreneur = session.getEntrepreneur();
            String title = session.getTitre();

            if (coach != null) {
                notificationService.createAndSendNotification(
                    coach.getId(),
                    "Rappel : séance \"" + title + "\" " + timing,
                    "SESSION_REMINDER",
                    null
                );
                try {
                    emailService.sendEmail(coach.getEmail(),
                        "Rappel séance de coaching",
                        "Bonjour " + coach.getFirstName() + ",\n\nVotre séance \"" + title + "\" commence " + timing + ".\n\nCordialement,\nRedBoost");
                } catch (Exception e) {
                    log.warn("Email reminder failed for coach {}: {}", coach.getId(), e.getMessage());
                }
            }

            if (entrepreneur != null) {
                notificationService.createAndSendNotification(
                    entrepreneur.getId(),
                    "Rappel : séance \"" + title + "\" " + timing,
                    "SESSION_REMINDER",
                    null
                );
                try {
                    emailService.sendEmail(entrepreneur.getEmail(),
                        "Rappel séance de coaching",
                        "Bonjour " + entrepreneur.getFirstName() + ",\n\nVotre séance \"" + title + "\" commence " + timing + ".\n\nCordialement,\nRedBoost");
                } catch (Exception e) {
                    log.warn("Email reminder failed for entrepreneur {}: {}", entrepreneur.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Session reminder error: {}", e.getMessage());
        }
    }
}

