package team.project.redboost.services;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.Event;
import team.project.redboost.entities.ParticipationMode;

import java.io.IOException;
import java.time.ZoneId;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleCalendarService {

    @lombok.Data
    public static class GoogleEventResult {
        private String eventId;
        private String meetLink;
    }

    private final Calendar calendarService;
    private final Credential credential;
    
    @Value("${google.oauth.organizer-email}")
    private String organizerEmail;

    /**
     * Creates a Google Calendar event with automatic invites
     * This will send email invitations to all participants automatically
     */
    public com.google.api.services.calendar.model.Event createCalendarEvent(Event event) throws IOException {
        ensureValidCredential();
        
        // Build the Google Calendar event
        com.google.api.services.calendar.model.Event googleEvent = buildGoogleEvent(event);

        // Create the event - this automatically sends email invites!
        com.google.api.services.calendar.model.Event createdEvent = calendarService.events()
                .insert("primary", googleEvent)
                .setConferenceDataVersion(1) // Enable Google Meet
                .setSendUpdates("all") // 🔥 THIS SENDS EMAIL INVITES AUTOMATICALLY
                .execute();

        log.info("✅ Calendar event created: {}", createdEvent.getId());
        log.info("📧 Email invites sent automatically to {} participants", event.getParticipantEmails().size());
        
        if (createdEvent.getConferenceData() != null) {
            String meetLink = extractMeetLink(createdEvent);
            if (meetLink != null) {
                log.info("🎥 Google Meet link: {}", meetLink);
            }
        }

        return createdEvent;
    }

    /**
     * Creates a simple Google Meet event without linking an Event entity directly
     */
    public GoogleEventResult createMeetEvent(String title, LocalDateTime start, LocalDateTime end, String coachEmail, String entrepreneurEmail) throws IOException {
        ensureValidCredential();

        com.google.api.services.calendar.model.Event googleEvent = new com.google.api.services.calendar.model.Event()
                .setSummary("[RedBoost] " + title)
                .setDescription(
                    "Session de coaching RedBoost\n" +
                    "════════════════════\n" +
                    "Session : " + title + "\n" +
                    "Coach    : " + coachEmail + "\n" +
                    "Début    : " + start.toLocalDate() + " à " + start.toLocalTime() + "\n" +
                    "Fin      : " + end.toLocalTime() + "\n\n" +
                    " Accédez à votre espace RedBoost : https://redboost.tn\n" +
                    "\nCe lien Google Meet vous sera envoyé automatiquement dans cette invitation."
                );

        EventDateTime startEvent = new EventDateTime()
                .setDateTime(new DateTime(java.util.Date.from(start.atZone(ZoneId.of("Africa/Tunis")).toInstant())))
                .setTimeZone("Africa/Tunis");

        EventDateTime endEvent = new EventDateTime()
                .setDateTime(new DateTime(java.util.Date.from(end.atZone(ZoneId.of("Africa/Tunis")).toInstant())))
                .setTimeZone("Africa/Tunis");

        googleEvent.setStart(startEvent);
        googleEvent.setEnd(endEvent);

        googleEvent.setAttendees(Arrays.asList(
                new EventAttendee().setEmail(coachEmail),
                new EventAttendee().setEmail(entrepreneurEmail)
        ));

        ConferenceData conferenceData = new ConferenceData()
                .setCreateRequest(new CreateConferenceRequest()
                        .setRequestId("session-" + System.currentTimeMillis() + "-" + title.hashCode())
                        .setConferenceSolutionKey(new ConferenceSolutionKey().setType("hangoutsMeet")));
        
        googleEvent.setConferenceData(conferenceData);

        com.google.api.services.calendar.model.Event createdEvent = calendarService.events()
                .insert("primary", googleEvent)
                .setConferenceDataVersion(1)
                .setSendUpdates("all")
                .execute();

        GoogleEventResult result = new GoogleEventResult();
        result.setEventId(createdEvent.getId());
        result.setMeetLink(extractMeetLink(createdEvent));

        return result;
    }

    /**
     * Updates an existing calendar event
     */
    public com.google.api.services.calendar.model.Event updateCalendarEvent(
            String eventId, Event event) throws IOException {
        ensureValidCredential();
        
        com.google.api.services.calendar.model.Event googleEvent = 
                calendarService.events().get("primary", eventId).execute();

        googleEvent.setSummary(event.getTitle())
                .setDescription(buildEventDescription(event))
                .setLocation(event.getLocation());

        List<EventAttendee> attendees = event.getParticipantEmails().stream()
                .map(email -> new EventAttendee().setEmail(email))
                .collect(Collectors.toList());
        googleEvent.setAttendees(attendees);

        // Update time
        EventDateTime start = new EventDateTime()
                .setDateTime(new DateTime(
                        java.util.Date.from(event.getStartDateTime()
                                .atZone(ZoneId.of("Africa/Tunis")).toInstant())))
                .setTimeZone("Africa/Tunis");
        
        EventDateTime end = new EventDateTime()
                .setDateTime(new DateTime(
                        java.util.Date.from(event.getEndDateTime()
                                .atZone(ZoneId.of("Africa/Tunis")).toInstant())))
                .setTimeZone("Africa/Tunis");

        googleEvent.setStart(start);
        googleEvent.setEnd(end);

        return calendarService.events()
                .update("primary", eventId, googleEvent)
                .setSendUpdates("all") // Sends update notifications
                .execute();
    }

    /**
     * Adds conference data (Google Meet) to an existing event
     */
    public com.google.api.services.calendar.model.Event addConferenceToEvent(String eventId, Event event) throws IOException {
        ensureValidCredential();

        com.google.api.services.calendar.model.Event googleEvent = 
                calendarService.events().get("primary", eventId).execute();

        ConferenceData conferenceData = new ConferenceData()
                .setCreateRequest(new CreateConferenceRequest()
                        .setRequestId(generateRequestId(event))
                        .setConferenceSolutionKey(new ConferenceSolutionKey()
                                .setType("hangoutsMeet")));
        
        googleEvent.setConferenceData(conferenceData);

        return calendarService.events()
                .patch("primary", eventId, googleEvent)
                .setConferenceDataVersion(1)
                .setSendUpdates("all")
                .execute();
    }

    /**
     * Removes conference data (Google Meet) from an existing event
     */
    public com.google.api.services.calendar.model.Event removeConferenceFromEvent(String eventId) throws IOException {
        ensureValidCredential();

        com.google.api.services.calendar.model.Event googleEvent = 
                calendarService.events().get("primary", eventId).execute();

        // Set conference data to null to remove it
        googleEvent.setConferenceData(null);

        return calendarService.events()
                .patch("primary", eventId, googleEvent)
                .setConferenceDataVersion(1) // Still needed to update conference data
                .setSendUpdates("all")
                .execute();
    }

    /**
     * Cancels a calendar event
     */
    public void cancelCalendarEvent(String eventId) throws IOException {
        ensureValidCredential();

        calendarService.events()
                .delete("primary", eventId)
                .setSendUpdates("all") // Sends cancellation emails
                .execute();

        log.info("❌ Calendar event cancelled: {}", eventId);
    }

    private com.google.api.services.calendar.model.Event buildGoogleEvent(Event event) {
        com.google.api.services.calendar.model.Event googleEvent = 
                new com.google.api.services.calendar.model.Event()
                .setSummary(event.getTitle())
                .setDescription(buildEventDescription(event))
                .setLocation(event.getLocation());

        // Set start and end time
        EventDateTime start = new EventDateTime()
                .setDateTime(new DateTime(
                        java.util.Date.from(event.getStartDateTime()
                                .atZone(ZoneId.of("Africa/Tunis")).toInstant())))
                .setTimeZone("Africa/Tunis");
        
        EventDateTime end = new EventDateTime()
                .setDateTime(new DateTime(
                        java.util.Date.from(event.getEndDateTime()
                                .atZone(ZoneId.of("Africa/Tunis")).toInstant())))
                .setTimeZone("Africa/Tunis");

        googleEvent.setStart(start);
        googleEvent.setEnd(end);

        // Add attendees
        List<EventAttendee> attendees = event.getParticipantEmails().stream()
                .map(email -> new EventAttendee().setEmail(email))
                .collect(Collectors.toList());
        googleEvent.setAttendees(attendees);

        // Set organizer
        googleEvent.setOrganizer(
                new com.google.api.services.calendar.model.Event.Organizer()
                        .setEmail(organizerEmail));

        // Add Google Meet for virtual/hybrid events
        if (event.getMode() == ParticipationMode.VIRTUEL || 
            event.getMode() == ParticipationMode.HYBRID) {
            
            ConferenceData conferenceData = new ConferenceData()
                    .setCreateRequest(new CreateConferenceRequest()
                            .setRequestId(generateRequestId(event))
                            .setConferenceSolutionKey(new ConferenceSolutionKey()
                                    .setType("hangoutsMeet")));
            
            googleEvent.setConferenceData(conferenceData);
        }

        // Set event color based on type
        googleEvent.setColorId(getColorIdForEventType(String.valueOf(event.getType())));

        // Add reminders
        com.google.api.services.calendar.model.Event.Reminders reminders = 
                new com.google.api.services.calendar.model.Event.Reminders()
                .setUseDefault(false)
                .setOverrides(Arrays.asList(
                        new EventReminder().setMethod("email").setMinutes(24 * 60),
                        new EventReminder().setMethod("popup").setMinutes(60)
                ));
        googleEvent.setReminders(reminders);

        return googleEvent;
    }

    private String buildEventDescription(Event event) {
        StringBuilder desc = new StringBuilder();
        desc.append(event.getDescription() != null ? event.getDescription() : "");
        desc.append("\n\n");
        desc.append("━━━━━━━━━━━━━━━━━━━━\n");
        desc.append("📋 Détails de l'événement\n");
        desc.append("━━━━━━━━━━━━━━━━━━━━\n\n");
        desc.append("Type: ").append(event.getType()).append("\n");
        desc.append("Mode: ").append(getModeLabel(event.getMode())).append("\n");
        desc.append("Programme: ").append(event.getProgram()).append("\n");
        
        if (event.getMode() != ParticipationMode.VIRTUEL) {
            desc.append("Lieu: ").append(event.getLocation()).append("\n");
        }
        
        return desc.toString();
    }

    private String getModeLabel(ParticipationMode mode) {
        switch (mode) {
            case EN_PERSONNE: return "En personne 🧑";
            case VIRTUEL: return "Virtuel 📹";
            case HYBRID: return "Hybride 👥";
            default: return mode.name();
        }
    }

    public String extractMeetLink(com.google.api.services.calendar.model.Event googleEvent) {
        if (googleEvent.getConferenceData() != null && 
            googleEvent.getConferenceData().getEntryPoints() != null) {
            
            return googleEvent.getConferenceData().getEntryPoints().stream()
                    .filter(ep -> "video".equals(ep.getEntryPointType()))
                    .map(EntryPoint::getUri)
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

    private String generateRequestId(Event event) {
        return "event-" + System.currentTimeMillis() + "-" + event.getTitle().hashCode();
    }

    private String getColorIdForEventType(String type) {
        switch (type) {
            case "PITCH_DECK": return "11"; // Red
            case "NETWORKING": return "9"; // Blue
            case "FORMATION": return "4"; // Pink
            case "ATELIER": return "8"; // Gray
            case "CELEBRATION": return "5"; // Yellow
            case "PRESENTATION": return "6"; // Orange
            default: return "1"; // Lavender
        }
    }

    /**
     * Reuse the same credential refresh logic from EmailService
     */
    private void ensureValidCredential() throws IOException {
        synchronized (credential) {
            if (credential.getExpiresInSeconds() == null || credential.getExpiresInSeconds() <= 60) {
                log.info("Access token nearing expiry, refreshing proactively.");
                if (!credential.refreshToken()) {
                    log.error("Failed to refresh token.");
                    throw new IOException("Unable to refresh token.");
                }
                log.info("Token refreshed successfully.");
            }
        }
    }
}