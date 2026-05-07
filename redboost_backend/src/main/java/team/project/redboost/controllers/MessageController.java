package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.MessageDTO;
import team.project.redboost.services.MessageService;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @GetMapping("/history/{userId1}/{userId2}")
    public ResponseEntity<Map<String, Object>> getHistory(
            @PathVariable Long userId1,
            @PathVariable Long userId2) {
        Map<String, Object> res = new HashMap<>();
        res.put("data", messageService.getConversation(userId1, userId2));
        return ResponseEntity.ok(res);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> sendMessage(
            @RequestBody Map<String, Object> payload) {
        try {
            Object expediteurObj = payload.get("expediteurId");
            Object destinataireObj = payload.get("destinataireId");
            Object contenuObj = payload.get("contenu");

            // Validate required fields before hitting the database
            if (expediteurObj == null || String.valueOf(expediteurObj).isBlank()) {
                Map<String, Object> err = new HashMap<>();
                err.put("error", "expediteurId is required");
                return ResponseEntity.badRequest().body(err);
            }
            if (destinataireObj == null || String.valueOf(destinataireObj).isBlank()) {
                Map<String, Object> err = new HashMap<>();
                err.put("error", "destinataireId is required");
                return ResponseEntity.badRequest().body(err);
            }
            if (contenuObj == null || String.valueOf(contenuObj).isBlank()) {
                Map<String, Object> err = new HashMap<>();
                err.put("error", "contenu is required");
                return ResponseEntity.badRequest().body(err);
            }

            Long expediteurId = expediteurObj instanceof Number ? ((Number) expediteurObj).longValue() : Long.parseLong(String.valueOf(expediteurObj).trim());
            Long destinataireId = destinataireObj instanceof Number ? ((Number) destinataireObj).longValue() : Long.parseLong(String.valueOf(destinataireObj).trim());
            String contenu = String.valueOf(contenuObj);

            MessageDTO saved = messageService.save(expediteurId, destinataireId, contenu.trim());
            
            // Broadcast to recipient via WebSocket (principal name = userId string)
            messagingTemplate.convertAndSendToUser(
                    destinataireId.toString(),
                    "/queue/messages",
                    saved);
                    
            Map<String, Object> res = new HashMap<>();
            res.put("data", saved);
            return ResponseEntity.ok(res);
        } catch (NumberFormatException e) {
            log.warn("[MessageController] Invalid ID format: {}", e.getMessage());
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Invalid numeric ID: " + e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            log.error("[MessageController] Failed to save message — expediteurId={}, destinataireId={} | {}: {}",
                    payload.get("expediteurId"), payload.get("destinataireId"),
                    e.getClass().getSimpleName(), e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            err.put("type", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(err);
        }
    }

    @PutMapping("/read/{userId}/{otherUserId}")
    public ResponseEntity<Void> markRead(@PathVariable Long userId, @PathVariable Long otherUserId) {
        messageService.markRead(userId, otherUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<MessageDTO>> getConversations(@RequestParam Long userId) {
        return ResponseEntity.ok(messageService.getConversations(userId));
    }

    @GetMapping("/unread")
    public ResponseEntity<Map<String, Integer>> getUnreadCount(@RequestParam Long userId) {
        return ResponseEntity.ok(Map.of("count", messageService.getUnreadCount(userId)));
    }

    @GetMapping("/presence/{userId}")
    public ResponseEntity<Map<String, Boolean>> getPresence(@PathVariable Long userId) {
        return ResponseEntity.ok(Map.of("online", messageService.isUserOnline(userId)));
    }

    @PostMapping("/presence/online")
    public ResponseEntity<Void> setOnline(@RequestParam Long userId) {
        messageService.setUserOnline(userId);
        return ResponseEntity.ok().build();
    }
}
