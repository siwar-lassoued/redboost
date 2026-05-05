package team.project.redboost.services;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.Session;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.SessionRepository;
import team.project.redboost.repositories.UserRepository;
import team.project.redboost.repositories.CoachRatingRepository;
import team.project.redboost.repositories.SessionCoachRepository;
import team.project.redboost.entities.SessionCoach;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final CoachRatingRepository coachRatingRepository;
    private final GoogleCalendarService googleCalendarService;
    private final SessionCoachRepository sessionCoachRepository;

    // ── Inner DTO returned by my-calendar endpoint ──────────────────────────
    @Data
    public static class MyCalendarEvent {
        private String id;
        private String title;
        private String description;
        private String dateTime;          // ISO-8601 e.g. "2025-06-10T14:00:00"
        private String endDateTime;
        private String type;              // SESSION | SESSION_SLOT | SEANCE
        private String statut;            // PLANIFIE | CONFIRME | TERMINE | ANNULE
        private String meetLink;
        private String googleEventId;
        private String coachName;
        private String entrepreneurName;
        private boolean isOnline;
    }

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

    public List<MyCalendarEvent> getMyCalendarSessions(Long userId, String role) {
        List<MyCalendarEvent> events = new ArrayList<>();

        if ("COACH".equalsIgnoreCase(role)) {
            // Booked sessions where this user is the coach
            List<Session> sessions = sessionRepository.findByCoachId(userId);
            for (Session s : sessions) {
                if (s.getStatut() == Session.Statut.ANNULE) continue;
                events.add(mapSessionToCalendarEvent(s, "SESSION"));
            }
            // Also include coach's available slots (SessionCoach)
            List<SessionCoach> slots = sessionCoachRepository.findByDisponibiliteCoachId(userId);
            for (SessionCoach slot : slots) {
                MyCalendarEvent ev = new MyCalendarEvent();
                ev.setId("slot-" + slot.getId());
                ev.setTitle(slot.getTitre() != null ? slot.getTitre() : "Créneau disponible");
                ev.setDescription("Créneau de disponibilité");
                LocalDateTime start = slot.getDateSession().atTime(slot.getHeureDebut());
                LocalDateTime end   = slot.getDateSession().atTime(slot.getHeureFin());
                ev.setDateTime(start.toString());
                ev.setEndDateTime(end.toString());
                ev.setType("SESSION_SLOT");
                ev.setStatut("DISPONIBLE");
                ev.setOnline(slot.getTypeSession() == SessionCoach.TypeSession.EN_LIGNE);
                events.add(ev);
            }
        } else {
            // Entrepreneur: sessions booked by them
            List<Session> sessions = sessionRepository.findByEntrepreneurId(userId);
            for (Session s : sessions) {
                if (s.getStatut() == Session.Statut.ANNULE) continue;
                events.add(mapSessionToCalendarEvent(s, "SESSION"));
            }
        }

        // Sort chronologically
        events.sort((a, b) -> {
            if (a.getDateTime() == null) return 1;
            if (b.getDateTime() == null) return -1;
            return a.getDateTime().compareTo(b.getDateTime());
        });
        return events;
    }

    private MyCalendarEvent mapSessionToCalendarEvent(Session s, String type) {
        MyCalendarEvent ev = new MyCalendarEvent();
        ev.setId(s.getId());
        ev.setTitle(s.getTitre());
        ev.setDescription(s.getDescription());
        ev.setDateTime(s.getDate() != null ? s.getDate().toString() : null);
        int dur = s.getDureeMinutes() != null ? s.getDureeMinutes() : 60;
        ev.setEndDateTime(s.getDate() != null ? s.getDate().plusMinutes(dur).toString() : null);
        ev.setType(type);
        ev.setStatut(s.getStatut() != null ? s.getStatut().name() : "PLANIFIE");
        ev.setMeetLink(s.getMeetLink());
        ev.setGoogleEventId(s.getGoogleEventId());
        ev.setOnline(s.getTypeSession() == Session.TypeSession.EN_LIGNE);
        if (s.getCoach() != null) {
            ev.setCoachName(s.getCoach().getFirstName() + " " + s.getCoach().getLastName());
        }
        if (s.getEntrepreneur() != null) {
            ev.setEntrepreneurName(s.getEntrepreneur().getFirstName() + " " + s.getEntrepreneur().getLastName());
        }
        return ev;
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
