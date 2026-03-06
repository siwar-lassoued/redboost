
package team.project.redboost.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.CreateEventRequest;
import team.project.redboost.dto.EventResponse;
import team.project.redboost.services.EventService;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EventController {

    private final EventService eventService;

    /**
     * Create a new event
     * POST /api/events
     */
    @PostMapping
    public ResponseEntity<EventResponse> createEvent(
            @Valid @RequestBody CreateEventRequest request,
            Authentication authentication) {
        
        String createdBy = authentication != null ? 
                authentication.getName() : "system";
        
        EventResponse response = eventService.createEvent(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all events
     * GET /api/events
     */
    @GetMapping
    public ResponseEntity<List<EventResponse>> getAllEvents() {
        List<EventResponse> events = eventService.getAllEvents();
        return ResponseEntity.ok(events);
    }

    /**
     * Get events by month
     * GET /api/events/month?year=2025&month=11
     */
    @GetMapping("/month")
    public ResponseEntity<List<EventResponse>> getEventsByMonth(
            @RequestParam int year,
            @RequestParam int month) {
        List<EventResponse> events = eventService.getEventsByMonth(year, month);
        return ResponseEntity.ok(events);
    }

    /**
     * Get a specific event
     * GET /api/events/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEvent(@PathVariable Long id) {
        EventResponse event = eventService.getEventById(id);
        return ResponseEntity.ok(event);
    }

    /**
     * Update an event
     * PUT /api/events/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody CreateEventRequest request) {
        
        EventResponse response = eventService.updateEvent(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Cancel an event
     * DELETE /api/events/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelEvent(@PathVariable Long id) {
        eventService.cancelEvent(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get events for a participant
     * GET /api/events/participant/{email}
     */
    @GetMapping("/participant/{email}")
    public ResponseEntity<List<EventResponse>> getEventsByParticipant(
            @PathVariable String email) {
        List<EventResponse> events = eventService.getEventsByParticipant(email);
        return ResponseEntity.ok(events);
    }
}