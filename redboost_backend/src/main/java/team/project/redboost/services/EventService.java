package team.project.redboost.services;

import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.dto.CreateEventRequest;
import team.project.redboost.dto.EventResponse;
import team.project.redboost.entities.Event;
import team.project.redboost.entities.EventStatus;
import team.project.redboost.entities.ParticipationMode;
import team.project.redboost.entities.TypeFormation;
import team.project.redboost.repositories.EventRepository;
import team.project.redboost.repositories.TypeFormationRepository;


import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final GoogleCalendarService googleCalendarService;
    private final TypeFormationRepository typeFormationRepository;

    /**
     * Creates a new event with automatic calendar invites
     */
    @Transactional
    public EventResponse createEvent(CreateEventRequest request, String createdBy) {
        try {
            log.info("Creating event: {}", request.getTitle());
            
            // 1. Create and save the event entity
            Event event = buildEventFromRequest(request, createdBy);
            event = eventRepository.save(event);
            log.info("Event saved to database with ID: {}", event.getId());

            // 2. Create Google Calendar event (this sends email invites automatically)
            com.google.api.services.calendar.model.Event googleEvent = 
                    googleCalendarService.createCalendarEvent(event);

            // 3. Extract Google Meet link if virtual/hybrid
            if (event.getMode() == ParticipationMode.VIRTUEL || 
                event.getMode() == ParticipationMode.HYBRID) {
                String meetLink = extractMeetLink(googleEvent);
                event.setMeetLink(meetLink);
            }

            // 4. Save Google Calendar event ID and Meet link
            event.setGoogleCalendarEventId(googleEvent.getId());
            event = eventRepository.save(event);

            log.info("✅ Event created successfully: {} (ID: {})", event.getTitle(), event.getId());
            log.info("📧 Email invites automatically sent to {} participants", 
                    event.getParticipantEmails() != null ? event.getParticipantEmails().size() : 0);

            return mapToResponse(event);

        } catch (IOException e) {
            log.error("❌ Failed to create Google Calendar event", e);
            throw new RuntimeException("Failed to create calendar event: " + e.getMessage(), e);
        }
    }

    /**
     * Get all events
     */
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get events for a specific month
     */
    public List<EventResponse> getEventsByMonth(int year, int month) {
        LocalDateTime startOfMonth = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1).minusSeconds(1);
        
        return eventRepository.findByStartDateTimeBetween(startOfMonth, endOfMonth).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a single event by ID
     */
    public EventResponse getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
        return mapToResponse(event);
    }

    /**
     * Update an existing event
     */
    @Transactional
    public EventResponse updateEvent(Long id, CreateEventRequest request) {
        try {
            Event event = eventRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));

            // Update event fields
            event.setTitle(request.getTitle());
            event.setDescription(request.getDescription());
            event.setStartDateTime(request.getStartDateTime());
            event.setEndDateTime(request.getEndDateTime());

            // Handle TypeFormation
            TypeFormation typeFormation = typeFormationRepository.findByName(request.getType())
                    .orElseGet(() -> {
                        TypeFormation newType = new TypeFormation();
                        newType.setName(request.getType());
                        return typeFormationRepository.save(newType);
                    });
            event.setType(typeFormation);

            event.setMode(ParticipationMode.valueOf(request.getMode()));
            event.setLocation(request.getLocation());
            event.setProgram(request.getProgram());
            event.setParticipantEmails(request.getParticipantEmails() != null ? request.getParticipantEmails() : new ArrayList<>());

            // Update Google Calendar event (sends update notifications)
            if (event.getGoogleCalendarEventId() != null) {
                com.google.api.services.calendar.model.Event updatedGoogleEvent = 
                        googleCalendarService.updateCalendarEvent(event.getGoogleCalendarEventId(), event);

                // Check if mode changed to VIRTUEL/HYBRID and meet link is missing
                if ((event.getMode() == ParticipationMode.VIRTUEL || event.getMode() == ParticipationMode.HYBRID) &&
                    (event.getMeetLink() == null || event.getMeetLink().isEmpty())) {
                    
                    // Add conference data if missing
                    updatedGoogleEvent = googleCalendarService.addConferenceToEvent(event.getGoogleCalendarEventId(), event);
                    String meetLink = extractMeetLink(updatedGoogleEvent);
                    event.setMeetLink(meetLink);
                }
                // Check if mode changed to EN_PERSONNE and meet link exists
                else if (event.getMode() == ParticipationMode.EN_PERSONNE && 
                         event.getMeetLink() != null && !event.getMeetLink().isEmpty()) {
                    
                    // Remove conference data
                    googleCalendarService.removeConferenceFromEvent(event.getGoogleCalendarEventId());
                    event.setMeetLink(null);
                }
            }

            event = eventRepository.save(event);
            log.info("✅ Event updated: {}", event.getId());

            return mapToResponse(event);

        } catch (IOException e) {
            log.error("❌ Failed to update Google Calendar event", e);
            throw new RuntimeException("Failed to update calendar event: " + e.getMessage(), e);
        }
    }

    /**
     * Cancel an event
     */
    @Transactional
    public void cancelEvent(Long id) {
        try {
            Event event = eventRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));

            // Delete from Google Calendar (sends cancellation emails)
            if (event.getGoogleCalendarEventId() != null) {
                try {
                    googleCalendarService.cancelCalendarEvent(event.getGoogleCalendarEventId());
                } catch (GoogleJsonResponseException e) {
                    if (e.getStatusCode() == 410) {
                        log.warn("Google Calendar event already deleted: {}", event.getGoogleCalendarEventId());
                    } else {
                        throw e;
                    }
                }
            }

            // Delete from database
            eventRepository.delete(event);

            log.info("✅ Event deleted from database: {}", event.getId());
            log.info("📧 Cancellation emails sent to participants (if applicable)");

        } catch (IOException e) {
            log.error("❌ Failed to cancel Google Calendar event", e);
            throw new RuntimeException("Failed to cancel calendar event: " + e.getMessage(), e);
        }
    }

    /**
     * Get events for a specific participant
     */
    public List<EventResponse> getEventsByParticipant(String email) {
        return eventRepository.findByParticipantEmailsContaining(email).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Helper methods

    private Event buildEventFromRequest(CreateEventRequest request, String createdBy) {
        Event event = new Event();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setStartDateTime(request.getStartDateTime());
        event.setEndDateTime(request.getEndDateTime());
        
        // Handle TypeFormation
        TypeFormation typeFormation = typeFormationRepository.findByName(request.getType())
                .orElseGet(() -> {
                    TypeFormation newType = new TypeFormation();
                    newType.setName(request.getType());
                    return typeFormationRepository.save(newType);
                });
        event.setType(typeFormation);

        event.setMode(ParticipationMode.valueOf(request.getMode()));
        event.setLocation(request.getLocation());
        event.setProgram(request.getProgram());
        event.setParticipantEmails(request.getParticipantEmails() != null ? request.getParticipantEmails() : new ArrayList<>());
        event.setCreatedBy(createdBy);
        event.setStatus(EventStatus.SCHEDULED);
        return event;
    }

    private String extractMeetLink(com.google.api.services.calendar.model.Event googleEvent) {
        if (googleEvent.getConferenceData() != null && 
            googleEvent.getConferenceData().getEntryPoints() != null) {
            
            return googleEvent.getConferenceData().getEntryPoints().stream()
                    .filter(ep -> "video".equals(ep.getEntryPointType()))
                    .map(com.google.api.services.calendar.model.EntryPoint::getUri)
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

    private EventResponse mapToResponse(Event event) {
        EventResponse response = new EventResponse();
        response.setId(event.getId());
        response.setTitle(event.getTitle());
        response.setDescription(event.getDescription());
        response.setStartDateTime(event.getStartDateTime());
        response.setEndDateTime(event.getEndDateTime());
        response.setType(event.getType().getName()); // Get name from TypeFormation
        response.setMode(event.getMode().name());
        response.setLocation(event.getLocation());
        response.setMeetLink(event.getMeetLink());
        response.setProgram(event.getProgram());
        response.setParticipantEmails(event.getParticipantEmails());
        response.setGoogleCalendarEventId(event.getGoogleCalendarEventId());
        response.setStatus(event.getStatus().name());
        response.setCreatedAt(event.getCreatedAt());
        return response;
    }
}
