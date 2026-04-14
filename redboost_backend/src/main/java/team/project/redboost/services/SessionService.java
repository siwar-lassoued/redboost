package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.Session;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.SessionRepository;
import team.project.redboost.repositories.UserRepository;
import team.project.redboost.repositories.CoachRatingRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final CoachRatingRepository coachRatingRepository;
    private final GoogleCalendarService googleCalendarService;

    public List<Session> getAll() {
        return sessionRepository.findAll();
    }

    public Session getById(String id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session introuvable: " + id));
    }

    public List<Session> getByCoach(Long coachId) {
        return sessionRepository.findByCoachId(coachId);
    }

    public List<Session> getByEntrepreneur(Long entrepreneurId) {
        return sessionRepository.findByEntrepreneurId(entrepreneurId);
    }

    public List<Session> getUpcoming() {
        return sessionRepository.findByDateBetween(
                LocalDateTime.now(),
                LocalDateTime.now().plusYears(1));
    }

    @Transactional
    public Session create(Session s) {
        User coach = userRepository.findById(s.getCoach().getId())
                .orElseThrow(() -> new RuntimeException("Coach introuvable"));
        User entrepreneur = userRepository.findById(s.getEntrepreneur().getId())
                .orElseThrow(() -> new RuntimeException("Entrepreneur introuvable"));

        s.setCoach(coach);
        s.setEntrepreneur(entrepreneur);

        // Generate Google Meet Link
        LocalDateTime start = s.getDate();
        LocalDateTime end = start.plusMinutes(s.getDureeMinutes() != null ? s.getDureeMinutes() : 60);

        try {
            GoogleCalendarService.GoogleEventResult googleEvent = googleCalendarService.createMeetEvent(
                    s.getTitre() != null ? s.getTitre() : "Session de Coaching RedBoost",
                    start,
                    end,
                    coach.getEmail(),
                    entrepreneur.getEmail());

            if (googleEvent != null) {
                s.setMeetLink(googleEvent.getMeetLink());
                s.setGoogleEventId(googleEvent.getEventId());
            }
        } catch (Exception e) {
            // Meet fails -> continue without meet link
        }

        return sessionRepository.save(s);
    }

    public Session update(String id, Session s) {
        Session existing = getById(id);
        if (s.getTitre() != null) existing.setTitre(s.getTitre());
        if (s.getDescription() != null) existing.setDescription(s.getDescription());
        if (s.getDate() != null) existing.setDate(s.getDate());
        if (s.getDureeMinutes() != null) existing.setDureeMinutes(s.getDureeMinutes());
        if (s.getStatut() != null) existing.setStatut(s.getStatut());
        if (s.getMeetLink() != null) existing.setMeetLink(s.getMeetLink());
        if (s.getNotesCoach() != null) existing.setNotesCoach(s.getNotesCoach());
        if (s.getAnnulationMotif() != null) existing.setAnnulationMotif(s.getAnnulationMotif());
        return sessionRepository.save(existing);
    }

    @Transactional
    public Session updateStatut(String id, Session.Statut statut, String motif) {
        Session s = getById(id);
        if (statut == Session.Statut.ANNULE) {
            if (motif == null || motif.trim().isEmpty()) {
                throw new IllegalArgumentException("Un motif est obligatoire pour annuler une session");
            }
            s.setAnnulationMotif(motif);
            // Cancel Google Calendar event if linked
            if (s.getGoogleEventId() != null) {
                try {
                    googleCalendarService.cancelCalendarEvent(s.getGoogleEventId());
                    log.info("Google Calendar event cancelled for session {}", id);
                } catch (Exception e) {
                    log.warn("Failed to cancel Google Calendar event for session {}: {}", id, e.getMessage());
                }
            }
        }
        s.setStatut(statut);
        return sessionRepository.save(s);
    }

    public void delete(String id) {
        sessionRepository.deleteById(id);
    }

    public boolean shouldPromptRating(Long entrepreneurId, String sessionId) {
        Session s = getById(sessionId);
        if (s.getStatut() != Session.Statut.TERMINE) return false;
        return !coachRatingRepository.existsByEntrepreneurIdAndSessionId(entrepreneurId, sessionId);
    }
}
